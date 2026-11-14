// Dégradé de fond selon la météo et le moment de la journée.
// Les classes sont écrites en entier pour que Tailwind les détecte au build.
export const getBackground = (code, isDay = true) => {
  if (code == null) return 'from-slate-900 via-sky-950 to-slate-900';
  if (code >= 95) return 'from-slate-900 via-purple-950 to-slate-950';
  if (!isDay) return 'from-slate-950 via-indigo-950 to-slate-900';
  if (code === 0 || code === 1) return 'from-sky-600 via-sky-800 to-slate-900';
  if (code === 2 || code === 3) return 'from-slate-600 via-slate-800 to-slate-900';
  if (code >= 45 && code <= 48) return 'from-slate-500 via-slate-700 to-slate-800';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'from-slate-500 via-slate-700 to-slate-900';
  if (code >= 51 && code <= 82) return 'from-slate-700 via-blue-950 to-slate-900';
  return 'from-slate-900 via-sky-950 to-slate-900';
};

/**
 * Scène animée à afficher en fond selon le code météo WMO.
 * Renvoie null tant qu'aucune donnée n'est chargée.
 */
export const getWeatherScene = (code, isDay = true) => {
  if (code == null) return null;
  if (code >= 95) return 'storm';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code >= 51 && code <= 57) return 'drizzle';
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if (code >= 45 && code <= 48) return 'fog';
  if (code === 3) return 'cloudy';
  if (code === 1 || code === 2) return isDay ? 'partly-day' : 'partly-night';
  return isDay ? 'clear-day' : 'clear-night';
};
