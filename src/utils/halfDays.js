export const HALF_DAYS = [
  { key: 'morning', label: 'Matin', from: 6, to: 12 },
  { key: 'afternoon', label: 'Après-midi', from: 12, to: 18 },
];

// Code météo le plus fréquent sur la période ; en cas d'égalité, le plus "fort" (code WMO le plus élevé)
const dominantCode = (codes) => {
  const counts = new Map();
  codes.forEach((c) => counts.set(c, (counts.get(c) ?? 0) + 1));
  return [...counts].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
};

/**
 * Résume les heures d'une date ("YYYY-MM-DD") comprises entre from (inclus) et to (exclu).
 * Renvoie null si aucune heure ne correspond.
 */
export function summarizePeriod(hourly, date, from, to) {
  const indexes = [];
  hourly.time.forEach((t, i) => {
    const hour = Number(t.slice(11, 13));
    if (t.startsWith(date) && hour >= from && hour < to) indexes.push(i);
  });
  if (indexes.length === 0) return null;

  const pick = (arr) => indexes.map((i) => arr?.[i] ?? 0);
  const temps = pick(hourly.temperature_2m);
  const speeds = pick(hourly.wind_speed_10m);
  const windiest = indexes[speeds.indexOf(Math.max(...speeds))];

  return {
    temp: temps.reduce((sum, t) => sum + t, 0) / temps.length,
    code: dominantCode(pick(hourly.weather_code)),
    rain: Math.max(...pick(hourly.precipitation_probability)),
    windSpeed: hourly.wind_speed_10m[windiest],
    windDir: hourly.wind_direction_10m[windiest],
  };
}

export const getHalfDays = (hourly, date) =>
  HALF_DAYS.map((half) => ({ ...half, ...summarizePeriod(hourly, date, half.from, half.to) }));
