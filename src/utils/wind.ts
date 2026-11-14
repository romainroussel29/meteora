const CARDINALS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'] as const;

export type Cardinal = (typeof CARDINALS)[number];

export interface WindInfo {
  label: string;
  color: string;
}

// Direction météo = d'où vient le vent (0° = vent du nord)
export const getCardinal = (deg: number): Cardinal =>
  CARDINALS[Math.round((((deg % 360) + 360) % 360) / 45) % 8];

// Échelle de Beaufort regroupée (km/h) :
// 0 calme · 1-3 vent faible · 4-5 modéré · 6-7 fort · 8-9 coup de vent · 10+ tempête
export const getWindInfo = (speed: number): WindInfo => {
  if (speed < 2) return { label: 'Calme', color: 'text-slate-300' };
  if (speed < 20) return { label: 'Vent faible', color: 'text-emerald-300' };
  if (speed < 39) return { label: 'Vent modéré', color: 'text-sky-300' };
  if (speed < 62) return { label: 'Vent fort', color: 'text-amber-300' };
  if (speed < 89) return { label: 'Coup de vent', color: 'text-orange-400' };
  return { label: 'Tempête', color: 'text-red-400' };
};
