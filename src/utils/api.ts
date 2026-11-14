import type { FavoriteWeather, Forecast, Location, Place } from '../types/weather';
import { createCache, coordsKey, withAbort, type CacheEntry } from './cache';
import { findNearest, parseCoordsKey, type Coords } from './geo';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const REVERSE_GEOCODING_URL = 'https://nominatim.openstreetmap.org/reverse';

const CURRENT_VARS = [
  'temperature_2m', 'apparent_temperature', 'weather_code', 'is_day',
  'wind_speed_10m', 'wind_direction_10m',
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
async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status} sur ${url}`);
  return res.json() as Promise<T>;
}

export function buildForecastUrl({ latitude, longitude }: Pick<Location, 'latitude' | 'longitude'>): string {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: CURRENT_VARS.join(','),
    hourly: HOURLY_VARS.join(','),
    daily: DAILY_VARS.join(','),
    // Précipitations par quart d'heure sur les 2 prochaines heures ("pluie dans l'heure")
    minutely_15: 'precipitation',
    forecast_minutely_15: '8',
    forecast_days: '7',
    timezone: 'auto',
  });
  return `${FORECAST_URL}?${params}`;
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

// Durées de validité : assez longues pour éviter les appels inutiles,
// assez courtes pour que les données restent à jour
const forecastCache = createCache<Forecast>({ name: 'forecast', ttl: 10 * MINUTE, persist: true, maxEntries: 10 });
const favoritesCache = createCache<FavoriteWeather>({ name: 'favorites', ttl: 10 * MINUTE, persist: true, maxEntries: 20 });
const searchCache = createCache<Place[]>({ name: 'search', ttl: 24 * HOUR, persist: true, maxEntries: 50 });
const reverseCache = createCache<string | null>({ name: 'reverse', ttl: 7 * 24 * HOUR, persist: true, maxEntries: 20 });

/**
 * Rayon (à vol d'oiseau) dans lequel on réutilise les données d'un lieu déjà chargé :
 * à moins de 5 km, la météo est quasiment identique (les modèles travaillent sur des
 * mailles de plusieurs km). Pour le nom de la ville, on reste plus précis (2 km).
 */
export const NEARBY_FORECAST_KM = 5;
export const NEARBY_PLACE_NAME_KM = 2;

/** Entrée valide d'un cache "par coordonnées" la plus proche du point demandé */
function findNearbyEntry<T>(cache: ReturnType<typeof createCache<T>>, target: Coords, radiusKm: number) {
  const nearest = findNearest(target, cache.entries(), ([key]) => parseCoordsKey(key), radiusKm);
  return nearest?.[1];
}

/** Vide tous les caches d'API (utile pour les tests) */
export function clearApiCaches() {
  [forecastCache, favoritesCache, searchCache, reverseCache].forEach((c) => c.clear());
  gridCache.clear();
}

interface FetchOptions {
  signal?: AbortSignal;
  /** Ignorer le cache (actualisation demandée par l'utilisateur) */
  force?: boolean;
}

/**
 * Prévisions complètes d'un lieu. Renvoie aussi la date de téléchargement
 * (`fetchedAt`), qui peut être ancienne si la réponse vient du cache.
 */
export function fetchWeather(location: Location, { signal, force }: FetchOptions = {}): Promise<CacheEntry<Forecast>> {
  // Un lieu déjà chargé à moins de 5 km fait l'affaire : aucun appel réseau
  if (!force) {
    const nearby = findNearbyEntry(forecastCache, location, NEARBY_FORECAST_KM);
    if (nearby) return withAbort(Promise.resolve(nearby), signal);
  }
  const request = forecastCache.fetch(
    coordsKey(location.latitude, location.longitude),
    () => fetchJson<Forecast>(buildForecastUrl(location)),
    { force }
  );
  return withAbort(request, signal);
}

interface CurrentOnly {
  current: { temperature_2m: number; weather_code: number; is_day: number };
}

/**
 * Météo actuelle de plusieurs lieux. Seuls les lieux absents du cache sont demandés,
 * et en une seule requête (Open-Meteo accepte des listes de coordonnées).
 * Utilisé pour afficher la température des favoris.
 */
export async function fetchCurrentForMany(
  locations: Pick<Location, 'latitude' | 'longitude'>[],
  signal?: AbortSignal
): Promise<FavoriteWeather[]> {
  const keys = locations.map((l) => coordsKey(l.latitude, l.longitude));
  const results = new Map<string, FavoriteWeather>();
  keys.forEach((k, i) => {
    const cached = favoritesCache.get(k) ?? findNearbyEntry(favoritesCache, locations[i], NEARBY_FORECAST_KM);
    if (cached) results.set(k, cached.value);
  });

  const missing = locations.filter((_, i) => !results.has(keys[i]));
  if (missing.length > 0) {
    const params = new URLSearchParams({
      latitude: missing.map((l) => l.latitude).join(','),
      longitude: missing.map((l) => l.longitude).join(','),
      current: 'temperature_2m,weather_code,is_day',
      timezone: 'auto',
    });
    const data = await fetchJson<CurrentOnly | CurrentOnly[]>(`${FORECAST_URL}?${params}`, signal);
    // Un seul lieu → un objet ; plusieurs lieux → un tableau
    const list = Array.isArray(data) ? data : [data];
    list.forEach(({ current }, i) => {
      const key = coordsKey(missing[i].latitude, missing[i].longitude);
      const weather = { temp: current.temperature_2m, code: current.weather_code, isDay: current.is_day !== 0 };
      favoritesCache.set(key, weather);
      results.set(key, weather);
    });
  }

  return keys.map((k) => results.get(k)!);
}

export function searchCities(
  query: string,
  { count = 5, signal }: { count?: number; signal?: AbortSignal } = {}
): Promise<Place[]> {
  const q = query.trim();
  const request = searchCache.fetch(`${q.toLowerCase()}|${count}`, async () => {
    const data = await fetchJson<{ results?: Place[] }>(
      `${GEOCODING_URL}?name=${encodeURIComponent(q)}&count=${count}&language=fr`
    );
    return data.results ?? [];
  });
  return withAbort(request.then((entry) => entry.value), signal);
}

interface NominatimResponse {
  name?: string;
  address?: Partial<Record<'city' | 'town' | 'village' | 'municipality' | 'country', string>>;
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
  // Position déjà nommée à moins de 2 km : on réutilise le nom sans appel réseau
  const nearby = findNearbyEntry(reverseCache, { latitude, longitude }, NEARBY_PLACE_NAME_KM);
  if (nearby) return nearby.value;

  const entry = await reverseCache.fetch(coordsKey(latitude, longitude, 2), async () => {
    const data = await fetchJson<NominatimResponse>(
      `${REVERSE_GEOCODING_URL}?lat=${latitude}&lon=${longitude}&format=json&accept-language=fr&zoom=10`
    );
    const a = data.address ?? {};
    const city = a.city || a.town || a.village || a.municipality || data.name;
    return city ? [city, a.country].filter(Boolean).join(', ') : null;
  });
  return entry.value;
}

// ─────────────── Prévision de pluie sur une grille (carte « 4 h à venir ») ───────────────

export interface PrecipitationGrid {
  /** Heures de prévision (timestamps Unix en secondes, UTC), dans le futur */
  times: number[];
  /** Taille d'une maille, en degrés */
  stepLat: number;
  stepLon: number;
  /** Pluie prévue (mm/h) pour chaque point et chaque heure de `times` */
  cells: { latitude: number; longitude: number; mm: number[] }[];
}

export const GRID_SIZE = 9; // 9 × 9 = 81 points
export const GRID_STEP_DEG = 0.4; // ~45 km entre deux points
export const FORECAST_HOURS = 4;

/** Points d'une grille carrée centrée sur un lieu (espacement en longitude corrigé de la latitude) */
export function buildGrid(center: Coords, size = GRID_SIZE, stepLat = GRID_STEP_DEG) {
  const stepLon = stepLat / Math.cos((center.latitude * Math.PI) / 180);
  const half = (size - 1) / 2;
  const points: Coords[] = [];
  for (let row = -half; row <= half; row++) {
    for (let col = -half; col <= half; col++) {
      points.push({
        latitude: +(center.latitude + row * stepLat).toFixed(3),
        longitude: +(center.longitude + col * stepLon).toFixed(3),
      });
    }
  }
  return { points, stepLat, stepLon };
}

const gridCache = createCache<PrecipitationGrid>({ name: 'precip-grid', ttl: 15 * MINUTE, maxEntries: 5 });

interface HourlyPrecipitation {
  hourly: { time: number[]; precipitation: number[] };
}

/**
 * Pluie prévue pour les 4 prochaines heures sur une grille autour d'un lieu,
 * en une seule requête Open-Meteo (mise en cache 15 min, partagée dans un rayon de 20 km).
 */
export function fetchPrecipitationGrid(center: Coords, signal?: AbortSignal): Promise<PrecipitationGrid> {
  const nearby = findNearbyEntry(gridCache, center, 20);
  if (nearby) return withAbort(Promise.resolve(nearby.value), signal);

  const request = gridCache.fetch(coordsKey(center.latitude, center.longitude, 2), async () => {
    const { points, stepLat, stepLon } = buildGrid(center);
    const params = new URLSearchParams({
      latitude: points.map((p) => p.latitude).join(','),
      longitude: points.map((p) => p.longitude).join(','),
      hourly: 'precipitation',
      forecast_hours: String(FORECAST_HOURS + 1),
      timeformat: 'unixtime',
      timezone: 'GMT',
    });
    const data = await fetchJson<HourlyPrecipitation | HourlyPrecipitation[]>(`${FORECAST_URL}?${params}`);
    const list = Array.isArray(data) ? data : [data];

    // On ne garde que les heures à venir (l'heure en cours est déjà couverte par le radar)
    const nowSec = Date.now() / 1000;
    const keep = list[0].hourly.time
      .map((t, i) => ({ t, i }))
      .filter(({ t }) => t > nowSec)
      .slice(0, FORECAST_HOURS);

    return {
      times: keep.map(({ t }) => t),
      stepLat,
      stepLon,
      cells: points.map((p, n) => ({ ...p, mm: keep.map(({ i }) => list[n]?.hourly.precipitation[i] ?? 0) })),
    };
  });
  return withAbort(request.then((entry) => entry.value), signal);
}
