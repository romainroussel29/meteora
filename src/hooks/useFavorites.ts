import { useState } from 'react';
import type { Location } from '../types/weather';
import { loadJson, saveJson } from '../utils/storage';

const FAVORITES_KEY = 'meteora:favorites';
const MAX_FAVORITES = 8;

type Coords = Pick<Location, 'latitude' | 'longitude'>;

export const sameLocation = (a: Coords, b: Coords): boolean =>
  Math.abs(a.latitude - b.latitude) < 0.01 && Math.abs(a.longitude - b.longitude) < 0.01;

export default function useFavorites() {
  const [favorites, setFavorites] = useState<Location[]>(() => loadJson<Location[]>(FAVORITES_KEY, []));

  const update = (next: Location[]) => {
    setFavorites(next);
    saveJson(FAVORITES_KEY, next);
  };

  const isFavorite = (loc: Coords) => favorites.some((f) => sameLocation(f, loc));

  const toggleFavorite = (loc: Location) => {
    if (isFavorite(loc)) {
      update(favorites.filter((f) => !sameLocation(f, loc)));
    } else {
      const { latitude, longitude, name } = loc;
      update([...favorites, { latitude, longitude, name }].slice(-MAX_FAVORITES));
    }
  };

  const removeFavorite = (loc: Coords) => update(favorites.filter((f) => !sameLocation(f, loc)));

  return { favorites, isFavorite, toggleFavorite, removeFavorite };
}
