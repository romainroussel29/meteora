import { useCallback, useEffect, useRef, useState } from 'react';
import type { Forecast, Location } from '../types/weather';
import { fetchWeather } from '../utils/api';
import { loadJson, saveJson } from '../utils/storage';

// Ville affichée à la première ouverture (ensuite, c'est la dernière ville consultée)
export const DEFAULT_LOCATION: Location = { latitude: 43.2965, longitude: 5.3698, name: 'Marseille, France' };
const LOCATION_KEY = 'meteora:lastLocation';

// Les données sont actualisées automatiquement quand elles ont plus d'une heure
export const AUTO_REFRESH_MS = 60 * 60 * 1000;
const CHECK_INTERVAL_MS = 60 * 1000;

const keyOf = (loc: Location, version: number) => `${loc.latitude},${loc.longitude}#${version}`;

/** true si les données ont été chargées il y a plus de maxAge millisecondes */
export const isStale = (
  updatedAt: number | null | undefined,
  now = Date.now(),
  maxAge = AUTO_REFRESH_MS
): boolean => updatedAt != null && now - updatedAt >= maxAge;

export interface WeatherData {
  weather: Forecast;
  location: Location;
  updatedAt: number;
}

/**
 * Gère la ville affichée et le chargement des données météo.
 * - La dernière ville consultée est mémorisée dans le localStorage.
 * - Chaque nouvelle requête annule la précédente (AbortController) : si l'utilisateur
 *   enchaîne deux recherches, une réponse lente ne peut pas écraser la plus récente.
 * - refresh() recharge la ville actuelle ; c'est fait automatiquement toutes les heures,
 *   et au retour sur l'application si les données sont trop anciennes.
 */
export default function useWeather() {
  const [location, setLocation] = useState<Location>(() => loadJson(LOCATION_KEY, DEFAULT_LOCATION));
  const [version, setVersion] = useState(0); // incrémenté à chaque actualisation
  const forceNext = useRef(false); // la prochaine requête doit-elle ignorer le cache ?
  const [data, setData] = useState<WeatherData | null>(null);
  const [result, setResult] = useState<{ key: string | null; error: string }>({ key: null, error: '' });

  const key = keyOf(location, version);
  // Chargement = la dernière requête terminée ne correspond pas encore à la demande actuelle
  const loading = result.key !== key;

  useEffect(() => {
    const controller = new AbortController();
    const requestKey = keyOf(location, version);
    const force = forceNext.current;
    forceNext.current = false;

    // Changer de ville utilise le cache (10 min) ; une actualisation le contourne
    fetchWeather(location, { signal: controller.signal, force })
      .then(({ value: weather, fetchedAt }) => {
        setData({ weather, location, updatedAt: fetchedAt });
        setResult({ key: requestKey, error: '' });
        saveJson(LOCATION_KEY, location);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.error(err);
        setResult({ key: requestKey, error: 'Impossible de récupérer les données météo.' });
      });

    return () => controller.abort();
  }, [location, version]);

  const refresh = useCallback(() => {
    forceNext.current = true;
    setVersion((v) => v + 1);
  }, []);

  // Actualisation automatique : vérification chaque minute, et au retour sur l'application
  // (sur iPhone, les minuteurs sont suspendus quand l'app est en arrière-plan)
  const updatedAt = data?.updatedAt;
  useEffect(() => {
    const check = () => {
      if (document.visibilityState === 'visible' && navigator.onLine && isStale(updatedAt)) refresh();
    };
    const id = setInterval(check, CHECK_INTERVAL_MS);
    document.addEventListener('visibilitychange', check);
    window.addEventListener('online', check);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('online', check);
    };
  }, [updatedAt, refresh]);

  return {
    data,
    location,
    setLocation,
    loading,
    refreshing: loading && data != null,
    refresh,
    error: result.error,
  };
}
