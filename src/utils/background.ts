import type { WeatherScene } from '../types/weather';

/** Durée de l'aube et du crépuscule autour du lever / coucher du soleil (minutes) */
export const TWILIGHT_MINUTES = 45;

// "2026-11-14T16:45" → minutes écoulées depuis minuit (heure locale de la ville)
const minutesOfDay = (iso: string) => Number(iso.slice(11, 13)) * 60 + Number(iso.slice(14, 16));

/**
 * true pendant l'aube (45 min avant le lever) ou le crépuscule (45 min après le coucher) :
 * il fait encore clair dehors alors que l'API indique déjà « nuit ».
 */
export function isTwilight(time: string, sunrise?: string, sunset?: string, minutes = TWILIGHT_MINUTES): boolean {
  if (!sunrise || !sunset) return false;
  const now = minutesOfDay(time);
  const rise = minutesOfDay(sunrise);
  const set = minutesOfDay(sunset);
  return (now >= rise - minutes && now < rise) || (now >= set && now < set + minutes);
}

// Dégradé de fond selon la météo et le moment de la journée.
// Les classes sont écrites en entier pour que Tailwind les détecte au build.
export const getBackground = (code: number | null | undefined, isDay = true, twilight = false): string => {
  if (code == null) return 'from-slate-900 via-sky-950 to-slate-900';
  if (code >= 95) return 'from-slate-900 via-purple-950 to-slate-950';
  // Aube / crépuscule : ciel encore clair, teintes de fin de journée
  if (twilight) {
    return code <= 1
      ? 'from-indigo-700 via-fuchsia-800 to-orange-700'
      : 'from-slate-600 via-indigo-900 to-rose-900';
  }
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
export const getWeatherScene = (code: number | null | undefined, isDay = true): WeatherScene | null => {
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
