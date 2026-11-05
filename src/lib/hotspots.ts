/**
 * Zones cliquables de la machine (une par compartiment).
 * Unité de la scène 3D : 1 unité = 10 cm (machine : 10 × 4 × 6, soit 100 × 40 × 60 cm).
 * Axes : x = longueur, y = hauteur (0 = sol), z = largeur (+z = façade).
 * Si vous remplacez le modèle par /public/models/mdm.glb, ajustez `position`.
 * Les textes (titre, technologie, fiche) se trouvent dans `Machine.hotspots.<id>` (src/messages).
 */
export const HOTSPOTS = [
  { id: "screen", position: [-3.1, 5.1, -0.2] },
  { id: "spinchip", position: [-0.2, 4.55, 0] },
  { id: "nasal", position: [1.85, 4.75, 1.15] },
  { id: "saliva", position: [1.85, 4.45, -1.3] },
  { id: "solution", position: [3.85, 4.75, 0] },
] as const;

export type HotspotId = (typeof HOTSPOTS)[number]["id"];
