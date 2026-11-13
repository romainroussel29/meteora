const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const REVERSE_GEOCODING_URL = 'https://nominatim.openstreetmap.org/reverse';

const CURRENT_VARS = [
  'temperature_2m', 'apparent_temperature', 'relative_humidity_2m', 'weather_code', 'is_day',
  'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m',
];
const HOURLY_VARS = [
  'temperature_2m', 'weather_code', 'is_day', 'precipitation_probability',
  'wind_speed_10m', 'wind_direction_10m',
];
const DAILY_VARS = [
  'weather_code', 'temperature_2m_max', 'temperature_2m_min', 'precipitation_probability_max',
  'sunrise', 'sunset',
];

// fetch() ne rejette pas sur une erreur HTTP (404, 500…) : on le vérifie nous-mêmes
async function fetchJson(url, signal) {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status} sur ${url}`);
  return res.json();
}

export function buildForecastUrl({ latitude, longitude }) {
  const params = new URLSearchParams({
    latitude,
    longitude,
    current: CURRENT_VARS.join(','),
    hourly: HOURLY_VARS.join(','),
    daily: DAILY_VARS.join(','),
    forecast_days: 7,
    timezone: 'auto',
  });
  return `${FORECAST_URL}?${params}`;
}

export function fetchWeather(location, signal) {
  return fetchJson(buildForecastUrl(location), signal);
}

export async function searchCities(query, { count = 5, signal } = {}) {
  const data = await fetchJson(
    `${GEOCODING_URL}?name=${encodeURIComponent(query)}&count=${count}&language=fr`,
    signal
  );
  return data.results ?? [];
}

export async function reverseGeocode(latitude, longitude) {
  const data = await fetchJson(
    `${REVERSE_GEOCODING_URL}?lat=${latitude}&lon=${longitude}&format=json&accept-language=fr&zoom=10`
  );
  const a = data.address ?? {};
  const city = a.city || a.town || a.village || a.municipality || data.name;
  return city ? [city, a.country].filter(Boolean).join(', ') : null;
}
