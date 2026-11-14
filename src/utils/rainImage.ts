/**
 * Transforme la grille de pluie prévue (quelques dizaines de points) en image lisse :
 * interpolation bilinéaire entre les points, puis couleur continue façon radar.
 * Fonctions pures (aucun accès au DOM) : testables et réutilisables.
 */

type RGBA = [number, number, number, number];

// Paliers de couleur (mm/h) : bleu clair → bleu → jaune → orange → rouge
const STOPS: { mm: number; rgb: [number, number, number] }[] = [
  { mm: 0.1, rgb: [125, 211, 252] }, // faible
  { mm: 1, rgb: [14, 165, 233] }, // modérée
  { mm: 3, rgb: [250, 204, 21] }, // forte
  { mm: 7, rgb: [249, 115, 22] },
  { mm: 12, rgb: [220, 38, 38] }, // très forte
];

const MIN_MM = 0.05; // en dessous : transparent
const FULL_ALPHA_MM = 0.6; // au-dessus : opacité maximale
const MAX_ALPHA = 200; // sur 255 : la carte reste lisible sous la pluie

/** Couleur RGBA continue d'une intensité de pluie (mm/h) */
export function precipitationRGBA(mm: number): RGBA {
  if (!(mm >= MIN_MM)) return [0, 0, 0, 0];
  const alpha = Math.round(MAX_ALPHA * Math.min((mm - MIN_MM) / (FULL_ALPHA_MM - MIN_MM), 1));
  if (mm <= STOPS[0].mm) return [...STOPS[0].rgb, alpha];
  for (let i = 1; i < STOPS.length; i++) {
    const a = STOPS[i - 1];
    const b = STOPS[i];
    if (mm <= b.mm) {
      const t = (mm - a.mm) / (b.mm - a.mm);
      const mix = (k: number) => Math.round(a.rgb[k] + (b.rgb[k] - a.rgb[k]) * t);
      return [mix(0), mix(1), mix(2), alpha];
    }
  }
  return [...STOPS[STOPS.length - 1].rgb, alpha];
}

/**
 * Valeur interpolée (bilinéaire) dans une grille n × n stockée ligne par ligne,
 * ligne 0 = sud. x et y vont de 0 à n - 1 (y vers le nord).
 */
export function interpolateGrid(values: number[], n: number, x: number, y: number): number {
  const x0 = Math.min(Math.floor(x), n - 2);
  const y0 = Math.min(Math.floor(y), n - 2);
  const tx = x - x0;
  const ty = y - y0;
  const at = (col: number, row: number) => values[row * n + col] ?? 0;
  const south = at(x0, y0) * (1 - tx) + at(x0 + 1, y0) * tx;
  const north = at(x0, y0 + 1) * (1 - tx) + at(x0 + 1, y0 + 1) * tx;
  return south * (1 - ty) + north * ty;
}

/**
 * Pixels RGBA (prêts pour un canvas) d'une image `size × size` couvrant toute la grille.
 * Le haut de l'image correspond au nord. Les bords s'estompent pour éviter un cadre net.
 */
export function renderPrecipitationPixels(values: number[], n: number, size = 256): Uint8ClampedArray {
  const pixels = new Uint8ClampedArray(size * size * 4);
  const fade = 0.12; // 12 % de la largeur pour le fondu des bords
  for (let py = 0; py < size; py++) {
    const v = py / (size - 1); // 0 = haut (nord)
    for (let px = 0; px < size; px++) {
      const u = px / (size - 1);
      const mm = interpolateGrid(values, n, u * (n - 1), (1 - v) * (n - 1));
      const [r, g, b, a] = precipitationRGBA(mm);
      const edge = Math.min(u, 1 - u, v, 1 - v);
      const edgeFactor = Math.min(edge / fade, 1);
      const i = (py * size + px) * 4;
      pixels[i] = r;
      pixels[i + 1] = g;
      pixels[i + 2] = b;
      pixels[i + 3] = Math.round(a * edgeFactor);
    }
  }
  return pixels;
}
