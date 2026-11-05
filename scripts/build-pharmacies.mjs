#!/usr/bin/env node
// Construit public/pharmacies/ à partir du fichier officiel FINESS (data.gouv.fr) :
// toutes les pharmacies d'officine de France, avec adresse, téléphone fixe et coordonnées.
//
//   node scripts/build-pharmacies.mjs              # télécharge la dernière extraction
//   node scripts/build-pharmacies.mjs fichier.csv  # utilise un fichier local
//
// Sortie : une tuile JSON par carré de 0,5° (public/pharmacies/t/<lat>_<lon>.json),
// plus un index des communes pour la recherche par code postal ou ville.

import fs from "node:fs/promises";
import path from "node:path";
import proj4 from "proj4";

const DATASET_API = "https://www.data.gouv.fr/api/1/datasets/finess-extraction-du-fichier-des-etablissements/";
const OUT_DIR = path.join(process.cwd(), "public", "pharmacies");
export const CELL = 0.5; // taille des tuiles en degrés (à garder identique côté client)
const PHARMACY_CATEGORY = "620"; // « Pharmacie d'Officine »

const PROJ = {
  LAMBERT_93:
    "+proj=lcc +lat_0=46.5 +lon_0=3 +lat_1=49 +lat_2=44 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
};
// La colonne source ressemble à « 1,ATLASANTE,96,BAN,EPSG:2154 RGF93 / Lambert-93 (Métropole) ».
const UTM_BY_EPSG = { 5490: "20N", 32620: "20N", 4467: "21N", 32621: "21N", 2972: "22N", 32622: "22N", 2975: "40S", 32740: "40S", 4471: "38S", 32738: "38S" };
const utm = (zone) => `+proj=utm +zone=${parseInt(zone, 10)}${zone.endsWith("S") ? " +south" : ""} +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs`;
function projectionFor(source) {
  const epsg = Number(source.match(/EPSG:(\d+)/i)?.[1]);
  if (epsg === 2154 || /LAMBERT[-_ ]?93/i.test(source)) return PROJ.LAMBERT_93;
  if (epsg === 4326) return "WGS84";
  if (UTM_BY_EPSG[epsg]) return utm(UTM_BY_EPSG[epsg]);
  const m = source.match(/UTM[_ ]*(?:zone[_ ]*)?([NS]?)(\d{1,2})([NS]?)/i);
  if (m) return utm(`${m[2]}${(m[1] || m[3] || "N").toUpperCase()}`);
  return null;
}

const VOIE = {
  R: "rue", RUE: "rue", AV: "avenue", BD: "boulevard", PL: "place", RTE: "route", CHE: "chemin", CHEM: "chemin",
  ALL: "allée", IMP: "impasse", QUA: "quai", QU: "quai", CRS: "cours", PASS: "passage", SQ: "square", FG: "faubourg",
  RES: "résidence", LOT: "lotissement", CTRE: "centre", CCAL: "centre commercial", ESP: "esplanade", PRO: "promenade",
  PRV: "parvis", RPT: "rond-point", ZA: "ZA", ZAC: "ZAC", ZI: "ZI", HAM: "hameau", LD: "lieu-dit", VOIE: "voie",
  SEN: "sentier", GAL: "galerie", CHS: "chaussée", RLE: "ruelle", VLA: "villa", CC: "centre commercial", MAR: "marché", PRT: "port", PKG: "parking", DOM: "domaine", TRA: "traverse", MTE: "montée", CAR: "carrefour", GR: "grande rue", PTE: "porte", CITE: "cité",
};
const SMALL = new Set(["de", "du", "des", "la", "le", "les", "et", "en", "sur", "sous", "aux", "au", "à", "l", "d"]);
function titleCase(s) {
  return s
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w, i) =>
      w
        .split(/([-'’])/)
        .map((part, j) => {
          if (/^[-'’]$/.test(part) || !part) return part;
          if ((i > 0 || j > 0) && SMALL.has(part)) return part;
          return part[0].toUpperCase() + part.slice(1);
        })
        .join(""),
    )
    .join(" ");
}
// FINESS écrit « L EGLISE » : on remet l'apostrophe.
const elide = (s) => s.replace(/\b([LlDd]) (?=[AEIOUYHÉÈaeiouyhéè])/g, "$1'");
// Retire la forme juridique en tête du nom (« SELARL PHARMACIE… » → « Pharmacie… »).
const LEGAL = /^(SELARL|SELAS|SELASU|SELAFA|SELCA|SARL|EURL|SNC|SAS|SASU|SCP|SPFPL|SA)\b\.?\s+/i;
function cleanName(raw) {
  const name = elide(titleCase(raw.replace(LEGAL, "")));
  return name || "Pharmacie";
}

function formatPhone(raw) {
  const d = (raw || "").replace(/\D/g, "");
  if (d.length === 10) return d.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
  return d || "";
}

async function download() {
  const meta = await (await fetch(DATASET_API)).json();
  // Fichier « établissements géolocalisés » (etalab-cs1100507-stock-*.csv).
  const res = meta.resources
    .filter((r) => /cs1100507/i.test(r.url) && /\.csv$/i.test(r.url))
    .sort((a, b) => String(b.last_modified).localeCompare(String(a.last_modified)))[0];
  if (!res) throw new Error("Fichier FINESS géolocalisé introuvable sur data.gouv.fr");
  console.log("Téléchargement", res.url);
  return Buffer.from(await (await fetch(res.url)).arrayBuffer());
}

function decode(buf) {
  const utf8 = buf.toString("utf8");
  return utf8.includes("�") ? buf.toString("latin1") : utf8;
}

async function main() {
  const buf = process.argv[2] ? await fs.readFile(process.argv[2]) : await download();
  const lines = decode(buf).split(/\r?\n/);

  const etabs = new Map();
  const geo = new Map();
  for (const line of lines) {
    const f = line.split(";");
    if (f[0] === "structureet" && f[18] === PHARMACY_CATEGORY) {
      // « rue de la Roquette » : article en minuscule après le type de voie.
      const voie = titleCase(f[9] || "").replace(/^(De|Du|Des|La|Le|Les|D'|L')(?=[\s'A-ZÀ-Ý])/, (w) => w.toLowerCase());
      // numvoie + complément (B, T, Q), type de voie, libellé
      const num = [f[7], { B: "bis", T: "ter", Q: "quater" }[f[10]?.toUpperCase()] ?? (f[10] || "").toLowerCase()].filter(Boolean).join(" ");
      const street = elide([num, VOIE[f[8]?.toUpperCase()] ?? (f[8] || "").toLowerCase(), voie].filter(Boolean).join(" "));
      const extra = f[11] ? elide(titleCase(f[11])) : "";
      const acheminement = (f[15] || "").trim();
      const m = acheminement.match(/^(\d{5})\s+(.*)$/);
      etabs.set(f[1], {
        name: cleanName(f[4] || f[3] || ""),
        address: [street, extra].filter(Boolean).join(", "),
        cp: m ? m[1] : "",
        city: elide(titleCase(m ? m[2] : acheminement)).replace(/\s+Cedex.*$/i, ""),
        phone: formatPhone(f[16]),
      });
    } else if (f[0] === "geolocalisation") {
      geo.set(f[1], { x: Number(f[2]), y: Number(f[3]), source: f[4] || "" });
    }
  }
  console.log(`${etabs.size} pharmacies d'officine, ${geo.size} géolocalisations`);
  if (etabs.size < (process.argv[2] ? 1 : 15000)) {
    console.error("Trop peu de pharmacies : format inattendu. Exemple de ligne :", lines.find((l) => l.startsWith("structureet")));
    process.exit(1);
  }

  const tiles = new Map();
  const communes = new Map();
  let skipped = 0;
  const unknown = new Map();
  for (const [id, e] of etabs) {
    const g = geo.get(id);
    const proj = g && projectionFor(g.source);
    if (!g || !proj || !Number.isFinite(g.x) || !Number.isFinite(g.y)) {
      if (g && !proj) unknown.set(g.source, (unknown.get(g.source) ?? 0) + 1);
      skipped++;
      continue;
    }
    const [lon, lat] = proj4(proj, "WGS84", [g.x, g.y]);
    if (!(lat > -30 && lat < 60 && lon > -70 && lon < 60)) {
      skipped++;
      continue;
    }
    const la = Math.round(lat * 1e5) / 1e5;
    const lo = Math.round(lon * 1e5) / 1e5;
    const key = `${Math.floor(lat / CELL)}_${Math.floor(lon / CELL)}`;
    if (!tiles.has(key)) tiles.set(key, []);
    // Format compact : [nom, adresse, code postal, ville, téléphone, lat, lon]
    tiles.get(key).push([e.name, e.address, e.cp, e.city, e.phone, la, lo]);

    if (e.cp) {
      const ck = `${e.cp}|${e.city}`;
      const c = communes.get(ck) ?? { cp: e.cp, city: e.city, lat: 0, lon: 0, n: 0 };
      c.lat += lat;
      c.lon += lon;
      c.n++;
      communes.set(ck, c);
    }
  }
  console.log(`${skipped} sans coordonnées exploitables, ${tiles.size} tuiles`);
  if (unknown.size) console.log("Projections non reconnues :", Object.fromEntries(unknown));
  if (etabs.size - skipped < (process.argv[2] ? 1 : 15000)) {
    console.error("Trop peu de coordonnées converties. Exemples :", lines.filter((l) => l.startsWith("geolocalisation")).slice(0, 3));
    process.exit(1);
  }

  await fs.rm(OUT_DIR, { recursive: true, force: true });
  await fs.mkdir(path.join(OUT_DIR, "t"), { recursive: true });
  for (const [key, list] of tiles) {
    list.sort((a, b) => a[0].localeCompare(b[0], "fr"));
    await fs.writeFile(path.join(OUT_DIR, "t", `${key}.json`), JSON.stringify(list));
  }
  const index = [...communes.values()]
    .map((c) => [c.cp, c.city, Math.round((c.lat / c.n) * 1e4) / 1e4, Math.round((c.lon / c.n) * 1e4) / 1e4])
    .sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1], "fr"));
  await fs.writeFile(path.join(OUT_DIR, "communes.json"), JSON.stringify(index));
  await fs.writeFile(
    path.join(OUT_DIR, "meta.json"),
    JSON.stringify({ source: "FINESS (data.gouv.fr)", generatedAt: new Date().toISOString(), count: etabs.size - skipped, cell: CELL }),
  );
  console.log(`OK : ${etabs.size - skipped} pharmacies, ${index.length} communes → ${path.relative(process.cwd(), OUT_DIR)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
