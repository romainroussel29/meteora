// Données d'une heure donnée (index dans les tableaux "hourly" de l'API)
const toEntry = (hourly, i) => ({
  time: hourly.time[i],
  temp: hourly.temperature_2m[i],
  code: hourly.weather_code[i],
  isDay: hourly.is_day?.[i] !== 0,
  rain: hourly.precipitation_probability?.[i] ?? 0,
  windSpeed: hourly.wind_speed_10m[i],
  windDir: hourly.wind_direction_10m[i],
});

/**
 * Extrait les prochaines heures à partir de l'heure courante de la ville.
 * Les heures de l'API sont dans le fuseau local de la ville : on compare "YYYY-MM-DDTHH".
 */
export function getUpcomingHours(hourly, currentTime, { hours = 24, step = 1 } = {}) {
  const found = hourly.time.findIndex((t) => t.slice(0, 13) === currentTime.slice(0, 13));
  const start = Math.max(found, 0);
  const result = [];
  for (let i = start; i < start + hours && i < hourly.time.length; i += step) {
    result.push(toEntry(hourly, i));
  }
  return result;
}

/**
 * Heures d'une journée ("YYYY-MM-DD") avec un pas donné : 0h, 2h, 4h… 22h par défaut.
 */
export function getDayHours(hourly, date, step = 2) {
  const result = [];
  hourly.time.forEach((t, i) => {
    if (t.startsWith(date) && Number(t.slice(11, 13)) % step === 0) result.push(toEntry(hourly, i));
  });
  return result;
}
