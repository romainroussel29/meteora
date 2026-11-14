import type { Forecast } from '../types/weather';

const pad = (n: number) => String(n).padStart(2, '0');
const DAYS = Array.from({ length: 7 }, (_, d) => `2026-11-${pad(14 + d)}`);

/**
 * Prévisions fictives mais réalistes (7 jours, 168 heures), pour les tests de composants
 * et les tests de bout en bout. Il est "2026-11-14T16:45" dans la ville.
 */
export function makeForecast(overrides: Partial<Forecast> = {}): Forecast {
  const hours = DAYS.flatMap((day) => Array.from({ length: 24 }, (_, h) => `${day}T${pad(h)}:00`));
  return {
    timezone: 'Europe/Paris',
    current: {
      time: '2026-11-14T16:45',
      temperature_2m: 11.4,
      apparent_temperature: 8.2,
      weather_code: 2,
      is_day: 1,
      wind_speed_10m: 18,
      wind_direction_10m: 250,
    },
    hourly: {
      time: hours,
      temperature_2m: hours.map((_, i) => 8 + 4 * Math.sin((i % 24) / 4)),
      weather_code: hours.map((_, i) => (i % 24 > 18 ? 61 : 2)),
      is_day: hours.map((_, i) => (i % 24 >= 8 && i % 24 < 17 ? 1 : 0)),
      precipitation_probability: hours.map((_, i) => (i % 24 > 18 ? 70 : 10)),
      wind_speed_10m: hours.map((_, i) => 10 + (i % 12)),
      wind_direction_10m: hours.map(() => 250),
    },
    daily: {
      time: DAYS,
      weather_code: [2, 61, 3, 0, 63, 2, 71],
      temperature_2m_max: [13, 12, 14, 16, 11, 10, 6],
      temperature_2m_min: [5, 7, 6, 8, 4, 2, -1],
      precipitation_probability_max: [30, 90, 20, 0, 85, 15, 60],
      sunrise: DAYS.map((d) => `${d}T07:57`),
      sunset: DAYS.map((d) => `${d}T17:11`),
    },
    minutely_15: {
      time: ['16:45', '17:00', '17:15', '17:30', '17:45', '18:00', '18:15', '18:30'].map((t) => `2026-11-14T${t}`),
      precipitation: [0, 0, 0.3, 0.6, 0.2, 0, 0, 0],
    },
    ...overrides,
  };
}
