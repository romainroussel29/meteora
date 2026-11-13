const CARDINALS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];

// Direction météo = d'où vient le vent (0° = vent du nord)
export const getCardinal = (deg) => CARDINALS[Math.round((((deg % 360) + 360) % 360) / 45) % 8];

// Échelle de Beaufort simplifiée (km/h)
export const getWindInfo = (speed) => {
  if (speed < 2) return { label: 'Calme', color: 'text-slate-400' };
  if (speed < 12) return { label: 'Brise légère', color: 'text-emerald-300' };
  if (speed < 29) return { label: 'Vent modéré', color: 'text-sky-300' };
  if (speed < 50) return { label: 'Vent fort', color: 'text-amber-300' };
  if (speed < 75) return { label: 'Coup de vent', color: 'text-orange-400' };
  return { label: 'Tempête', color: 'text-red-400' };
};
