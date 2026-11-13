import { useState } from 'react';
import { loadJson, saveJson } from '../utils/storage';

const FAVORITES_KEY = 'meteora:favorites';
const MAX_FAVORITES = 8;

export const sameLocation = (a, b) =>
  Math.abs(a.latitude - b.latitude) < 0.01 && Math.abs(a.longitude - b.longitude) < 0.01;

export default function useFavorites() {
  const [favorites, setFavorites] = useState(() => loadJson(FAVORITES_KEY, []));

  const update = (next) => {
    setFavorites(next);
    saveJson(FAVORITES_KEY, next);
  };

  const isFavorite = (loc) => favorites.some((f) => sameLocation(f, loc));

  const toggleFavorite = (loc) => {
    if (isFavorite(loc)) {
      update(favorites.filter((f) => !sameLocation(f, loc)));
    } else {
      const { latitude, longitude, name } = loc;
      update([...favorites, { latitude, longitude, name }].slice(-MAX_FAVORITES));
    }
  };

  const removeFavorite = (loc) => update(favorites.filter((f) => !sameLocation(f, loc)));

  return { favorites, isFavorite, toggleFavorite, removeFavorite };
}
