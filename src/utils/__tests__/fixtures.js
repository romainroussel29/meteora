// 48 heures fictives à partir du 13/11 à 00h.
// Température = numéro de l'heure (0, 1, 2…) pour faciliter les vérifications.
export const makeHourly = () => {
  const time = Array.from({ length: 48 }, (_, i) => {
    const day = 13 + Math.floor(i / 24);
    return `2026-11-${day}T${String(i % 24).padStart(2, '0')}:00`;
  });
  const range = time.map((_, i) => i);
  return {
    time,
    temperature_2m: range,
    weather_code: range.map(() => 0),
    is_day: range.map((i) => (i % 24 >= 8 && i % 24 < 18 ? 1 : 0)),
    precipitation_probability: range.map(() => 10),
    wind_speed_10m: range,
    wind_direction_10m: range.map(() => 90),
  };
};
