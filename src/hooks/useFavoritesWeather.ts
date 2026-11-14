import { useEffect, useState } from 'react';
import type { FavoriteWeather, Location } from '../types/weather';
import { fetchCurrentForMany } from '../utils/api';

export const favoriteKey = (loc: Pick<Location, 'latitude' | 'longitude'>) =>
  `${loc.latitude.toFixed(2)},${loc.longitude.toFixed(2)}`;

/**
 * Température et temps actuels de chaque favori, récupérés en une seule requête.
 * Rechargé quand la liste change ou quand `refreshToken` change (actualisation).
 * En cas d'erreur, les favoris s'affichent simplement sans température.
 */
export default function useFavoritesWeather(favorites: Location[], refreshToken?: number) {
  const [weatherByKey, setWeatherByKey] = useState<Record<string, FavoriteWeather>>({});

  // Clé stable : ne relance la requête que si les coordonnées changent réellement
  const coordsKey = favorites.map(favoriteKey).join('|');

  useEffect(() => {
    if (!coordsKey) return;
    const controller = new AbortController();
    const coords = coordsKey.split('|').map((k) => {
      const [latitude, longitude] = k.split(',').map(Number);
      return { latitude, longitude };
    });

    fetchCurrentForMany(coords, controller.signal)
      .then((list) => {
        const next: Record<string, FavoriteWeather> = {};
        list.forEach((w, i) => {
          next[favoriteKey(coords[i])] = w;
        });
        setWeatherByKey(next);
      })
      .catch(() => {
        // Silencieux : la température des favoris est un bonus
      });

    return () => controller.abort();
  }, [coordsKey, refreshToken]);

  return weatherByKey;
}
