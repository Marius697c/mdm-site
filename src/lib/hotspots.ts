/**
 * Zones cliquables de la machine.
 * Unité de la scène 3D : 1 unité = 10 cm (machine : 10 × 4 × 6, soit 100 × 40 × 60 cm).
 * Axes : x = longueur, y = hauteur (0 = sol), z = largeur.
 * Si vous remplacez le modèle par /public/models/mdm.glb, ajustez `position`.
 * Les textes se trouvent dans `Machine.hotspots.<id>` (src/messages).
 */
export const HOTSPOTS = [
  { id: "screen", position: [-3, 4.95, 0.1] },
  { id: "spinchip", position: [0.2, 4.4, 0] },
  { id: "swab", position: [2, 4.4, 0] },
  { id: "solution", position: [3.8, 4.4, 0] },
] as const;

export type HotspotId = (typeof HOTSPOTS)[number]["id"];
