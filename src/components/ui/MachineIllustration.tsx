/**
 * Illustration vectorielle détaillée de la machine (proportions 100 × 60 × 40 cm),
 * en projection dimétrique, avec un repère numéroté par compartiment.
 * Coordonnées en cm : x = longueur (0 → 100), z = profondeur (0 = arrière, 60 = façade), y = hauteur.
 */

export type MachineZoneLabel = { title: string; tech: string; future?: boolean };

const OX = 200;
const OY = 178;
const A = 3.4; // x → écran (droite)
const C = 0.9; // x → écran (bas)
const B = 2.0; // z → écran (gauche)
const D = 1.15; // z → écran (bas)
const E = 3.2; // y → écran (haut)

type Pt = [number, number];
const P = (x: number, y: number, z: number): Pt => [OX + x * A - z * B, OY + x * C + z * D - y * E];
const pts = (list: Pt[]) => list.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(" ");

/** Rectangle horizontal (plan y constant). */
const flat = (x0: number, x1: number, z0: number, z1: number, y: number) =>
  pts([P(x0, y, z0), P(x1, y, z0), P(x1, y, z1), P(x0, y, z1)]);
/** Rectangle vertical sur la façade (z constant). */
const front = (x0: number, x1: number, y0: number, y1: number, z = 60) =>
  pts([P(x0, y0, z), P(x1, y0, z), P(x1, y1, z), P(x0, y1, z)]);
/** Rectangle vertical sur le côté droit (x constant). */
const side = (z0: number, z1: number, y0: number, y1: number, x = 100) =>
  pts([P(x, y0, z0), P(x, y0, z1), P(x, y1, z1), P(x, y1, z0)]);
/** Cercle horizontal (plan y constant). */
const disc = (cx: number, cz: number, r: number, y: number, from = 0, to = Math.PI * 2, n = 48) =>
  pts(Array.from({ length: n + 1 }, (_, i) => {
    const a = from + ((to - from) * i) / n;
    return P(cx + Math.cos(a) * r, y, cz + Math.sin(a) * r);
  }));

/** Tube vertical (écouvillon ou flacon) vu en projection. */
function Tube({ x, z, h, body, cap, w = 7 }: { x: number; z: number; h: number; body: string; cap: string; w?: number }) {
  const [x0, y0] = P(x, 40, z);
  const [, y1] = P(x, 40 + h, z);
  return (
    <g>
      <line x1={x0} y1={y0} x2={x0} y2={y1 + 4} stroke={body} strokeWidth={w} strokeLinecap="round" />
      <line x1={x0} y1={y1 + 3} x2={x0} y2={y1} stroke={cap} strokeWidth={w + 1.5} strokeLinecap="round" />
    </g>
  );
}

function Badge({ at, n }: { at: Pt; n: number }) {
  return (
    <g>
      <circle cx={at[0]} cy={at[1]} r="13" fill="#3fd0e6" opacity="0.25" />
      <circle cx={at[0]} cy={at[1]} r="9.5" fill="#050f26" stroke="#3fd0e6" strokeWidth="2" />
      <text x={at[0]} y={at[1] + 4} textAnchor="middle" fontSize="11" fontWeight="800" fill="#7be4f2" fontFamily="sans-serif">
        {n}
      </text>
    </g>
  );
}

export function MachineIllustration({ alt, zones }: { alt: string; zones?: MachineZoneLabel[] }) {
  // Écran incliné : bord bas en z = 30, bord haut recule en z = 10 et monte à y = 58.
  const screenBL = P(5, 41, 30);
  const screenBR = P(36, 41, 30);
  const screenTR = P(36, 58, 10);
  const screenTL = P(5, 58, 10);
  const lerp = (p: Pt, q: Pt, t: number): Pt => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  /** Point de la dalle de l'écran, u ∈ [0,1] gauche → droite, v ∈ [0,1] bas → haut. */
  const S = (u: number, v: number) => lerp(lerp(screenBL, screenBR, u), lerp(screenTL, screenTR, u), v);
  const quad = (u0: number, u1: number, v0: number, v1: number) => pts([S(u0, v0), S(u1, v0), S(u1, v1), S(u0, v1)]);

  const vials = ["#3fd0e6", "#7be4f2", "#f2b84b", "#e2435b"];
  const badges: Pt[] = [S(0.5, 1.12), P(50, 46, 30), P(70.5, 52, 47), P(70.5, 46, 14), P(91, 52, 6)];

  return (
    <figure className="w-full">
      <svg viewBox="40 0 560 400" role="img" aria-label={alt} className="h-auto w-full">
        <defs>
          <linearGradient id="mdm-top" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f4f8ff" />
            <stop offset="1" stopColor="#c4d5ef" />
          </linearGradient>
          <linearGradient id="mdm-cap-front" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#dfe8f6" />
            <stop offset="1" stopColor="#a9bfe2" />
          </linearGradient>
          <linearGradient id="mdm-front" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2a5090" />
            <stop offset="1" stopColor="#0c2149" />
          </linearGradient>
          <linearGradient id="mdm-side" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1c3d78" />
            <stop offset="1" stopColor="#050f26" />
          </linearGradient>
          <linearGradient id="mdm-screen" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#0b3a73" />
            <stop offset="1" stopColor="#081a3b" />
          </linearGradient>
          <radialGradient id="mdm-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#3fd0e6" stopOpacity="0.5" />
            <stop offset="1" stopColor="#3fd0e6" stopOpacity="0" />
          </radialGradient>
          <filter id="mdm-blur" x="-20%" y="-200%" width="140%" height="500%">
            <feGaussianBlur stdDeviation="2.5" />
          </filter>
        </defs>

        {/* halo au sol */}
        <ellipse cx="320" cy="335" rx="250" ry="34" fill="url(#mdm-glow)" />

        {/* pieds et socle */}
        {[[6, 54], [94, 54], [94, 6]].map(([x, z]) => {
          const [fx, fy] = P(x, 0, z);
          return <rect key={`${x}-${z}`} x={fx - 9} y={fy - 4} width="18" height="7" rx="3" fill="#050f26" />;
        })}
        <polygon points={front(2, 98, 0, 4, 58)} fill="#050f26" />
        <polygon points={side(2, 58, 0, 4, 98)} fill="#030a1a" />

        {/* corps */}
        <polygon points={front(0, 100, 3, 35)} fill="url(#mdm-front)" />
        <polygon points={side(0, 60, 3, 35)} fill="url(#mdm-side)" />

        {/* jonction lumineuse */}
        <polyline points={pts([P(0, 35, 60), P(100, 35, 60), P(100, 35, 0)])} fill="none" stroke="#3fd0e6" strokeWidth="5" filter="url(#mdm-blur)" opacity="0.8" />
        <polyline points={pts([P(0, 35, 60), P(100, 35, 60), P(100, 35, 0)])} fill="none" stroke="#7be4f2" strokeWidth="1.6" />

        {/* capot nacré */}
        <polygon points={front(0, 100, 35, 40)} fill="url(#mdm-cap-front)" />
        <polygon points={side(0, 60, 35, 40)} fill="#8aa6d4" />
        <polygon points={flat(0, 100, 0, 60, 40)} fill="url(#mdm-top)" />
        <polyline points={pts([P(0, 40, 60), P(100, 40, 60), P(100, 40, 0)])} fill="none" stroke="#ffffff" strokeWidth="1.2" opacity="0.8" />

        {/* façade : tiroir, poignée, trappe, bandeau d'état, LED */}
        <polygon points={front(5, 58, 8, 24)} fill="#1c3d78" stroke="#4a73b3" strokeWidth="0.8" />
        <polygon points={front(20, 43, 19.5, 21)} fill="#b3c8ea" />
        <polygon points={front(63, 95, 8, 24)} fill="#1c3d78" stroke="#4a73b3" strokeWidth="0.8" />
        <polygon points={front(5, 58, 29, 30)} fill="#3fd0e6" />
        <polygon points={front(68, 92, 27, 32)} fill="#050f26" />
        {[72, 79, 86].map((x, i) => {
          const [lx, ly] = P(x, 29.5, 60);
          return <circle key={x} cx={lx} cy={ly} r="2.4" fill={i === 2 ? "#f2b84b" : "#3fd0e6"} />;
        })}
        <text
          transform={`matrix(${A} ${C} 0 ${E} ${P(6, 25.5, 60).join(" ")})`}
          fontSize="4.2"
          fontWeight="800"
          letterSpacing="1.2"
          fill="#d9e4f5"
          fontFamily="sans-serif"
        >
          MDM
        </text>

        {/* grilles d'aération côté droit */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <polygon key={i} points={side(12, 48, 12 + i * 3.4, 13.4 + i * 3.4)} fill="#050f26" opacity="0.85" />
        ))}

        {/* 1. écran tactile */}
        <polygon points={pts([P(10, 40, 30), P(31, 40, 30), P(31, 41, 12), P(10, 41, 12)])} fill="#081a3b" />
        <polygon points={pts([screenBL, screenBR, screenTR, screenTL])} fill="#050f26" stroke="#2a5090" strokeWidth="1" />
        <polygon points={quad(0.04, 0.96, 0.06, 0.94)} fill="url(#mdm-screen)" />
        <polygon points={quad(0.04, 0.96, 0.8, 0.94)} fill="#14b8d4" opacity="0.9" />
        <polygon points={quad(0.1, 0.36, 0.2, 0.68)} fill="none" stroke="#3fd0e6" strokeWidth="3" opacity="0.9" />
        {[0.62, 0.5, 0.38, 0.26].map((v, i) => (
          <polygon key={v} points={quad(0.44, i % 2 ? 0.78 : 0.9, v, v + 0.06)} fill={i === 0 ? "#7be4f2" : "#4a73b3"} />
        ))}
        <polygon points={quad(0.62, 0.9, 0.1, 0.18)} fill="#3fd0e6" />

        {/* 2. test sanguin : bac + cartouche circulaire */}
        <polygon points={flat(40, 60, 20, 40, 40)} fill="#9fb3d1" />
        <polygon points={flat(41.5, 58.5, 21.5, 38.5, 40)} fill="#050f26" />
        <polygon points={disc(50, 30, 7.5, 40.3)} fill="#c4d5ef" stroke="#9fb3d1" strokeWidth="1" />
        <polygon points={disc(50, 30, 6.4, 40.6)} fill="#e8f6ff" opacity="0.85" />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          const [cx, cy] = P(50 + Math.cos(a) * 4.5, 40.7, 30 + Math.sin(a) * 4.5);
          return <ellipse key={i} cx={cx} cy={cy} rx="2.6" ry="1.6" fill={i % 2 ? "#e2435b" : "#14b8d4"} />;
        })}
        <polygon points={disc(50, 30, 1.2, 40.8)} fill="#122e5f" />
        <polygon points={flat(44, 56, 39.2, 39.8, 40.2)} fill="#3fd0e6" />

        {/* 3. tests nasaux : portoir d'écouvillons */}
        <polygon points={flat(63, 78, 36, 54, 40)} fill="#9fb3d1" />
        <polygon points={flat(64.2, 76.8, 37.2, 52.8, 40)} fill="#050f26" />
        {[40.5, 46, 51].flatMap((z) =>
          [66.5, 70.5, 74.5].map((x) => <Tube key={`${x}-${z}`} x={x} z={z} h={6} body="#eef3fb" cap="#14b8d4" />),
        )}

        {/* 4. tests salivaires : trappe (extension future) */}
        <polygon points={flat(63, 78, 6, 24, 40)} fill="#9fb3d1" />
        <polygon points={flat(64.2, 76.8, 7.2, 22.8, 40)} fill="#d9e4f5" stroke="#f2b84b" strokeWidth="1.2" strokeDasharray="4 3" />
        <polygon points={disc(70.5, 15, 3.6, 40.4)} fill="#9fb3d1" />
        <polygon points={disc(70.5, 15, 2.2, 40.6)} fill="#081a3b" />

        {/* 5. solutions de détection bactérienne : flacons */}
        <polygon points={flat(83, 97, 4, 56, 40)} fill="#9fb3d1" />
        <polygon points={flat(84.2, 95.8, 5.2, 54.8, 40)} fill="#050f26" />
        {[10, 22, 34, 46].flatMap((z, j) =>
          [87, 93].map((x) => (
            <g key={`${x}-${z}`}>
              <polygon points={disc(x, z, 2.6, 40.2)} fill="#3fd0e6" opacity="0.35" />
              <Tube x={x} z={z} h={7} body={vials[j]} cap="#122e5f" w={8} />
            </g>
          )),
        )}

        {zones && badges.map((at, i) => <Badge key={i} at={at} n={i + 1} />)}
      </svg>

      {zones && (
        <figcaption>
          <ol className="mt-4 grid gap-2 sm:grid-cols-2">
            {zones.map((z, i) => (
              <li key={z.title} className="flex items-start gap-3 rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-cyan-400 bg-navy-950 text-xs font-extrabold text-cyan-300">
                  {i + 1}
                </span>
                <span className="text-sm leading-snug">
                  <span className="block font-semibold text-white">{z.title}</span>
                  <span className={z.future ? "text-amber-300" : "text-cyan-300"}>{z.tech}</span>
                </span>
              </li>
            ))}
          </ol>
        </figcaption>
      )}
    </figure>
  );
}
