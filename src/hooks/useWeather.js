import { useEffect, useState } from 'react';
import { fetchWeather } from '../utils/api';
import { loadJson, saveJson } from '../utils/storage';

const DEFAULT_LOCATION = { latitude: 48.8566, longitude: 2.3522, name: 'Paris, France' };
const LOCATION_KEY = 'meteora:lastLocation';

const keyOf = (loc) => `${loc.latitude},${loc.longitude}`;

/**
 * Gère la ville affichée et le chargement des données météo.
 * - La dernière ville consultée est mémorisée dans le localStorage.
 * - Chaque nouvelle requête annule la précédente (AbortController) : si l'utilisateur
 *   enchaîne deux recherches, une réponse lente ne peut pas écraser la plus récente.
 */
export default function useWeather() {
  const [location, setLocation] = useState(() => loadJson(LOCATION_KEY, DEFAULT_LOCATION));
  const [data, setData] = useState(null); // { weather, location }
  const [result, setResult] = useState({ key: null, error: '' });

  const key = keyOf(location);
  // Chargement = la dernière requête terminée ne correspond pas encore à la demande actuelle
  const loading = result.key !== key;

  useEffect(() => {
    const controller = new AbortController();

    fetchWeather(location, controller.signal)
      .then((weather) => {
        setData({ weather, location });
        setResult({ key: keyOf(location), error: '' });
        saveJson(LOCATION_KEY, location);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        console.error(err);
        setResult({ key: keyOf(location), error: 'Impossible de récupérer les données météo.' });
      });

    return () => controller.abort();
  }, [location]);

  return { data, location, setLocation, loading, error: result.error };
}
