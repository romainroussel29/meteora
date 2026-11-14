import { Star, X } from 'lucide-react';
import type { FavoriteWeather, Location } from '../types/weather';
import { sameLocation } from '../hooks/useFavorites';
import { favoriteKey } from '../hooks/useFavoritesWeather';
import { getWeatherInfo } from '../utils/weatherIcons';

interface FavoritesBarProps {
  favorites: Location[];
  current: Location;
  weatherByKey?: Record<string, FavoriteWeather>;
  onSelect: (loc: Location) => void;
  onRemove: (loc: Location) => void;
}

export default function FavoritesBar({ favorites, current, weatherByKey = {}, onSelect, onRemove }: FavoritesBarProps) {
  if (favorites.length === 0) return null;

  return (
    <nav aria-label="Villes favorites" className="flex items-center gap-2 mb-4 -mx-3 px-3 md:mx-0 md:px-0 overflow-x-auto scrollbar-none md:flex-wrap">
      <Star className="w-4 h-4 shrink-0 text-amber-400 fill-amber-400" aria-hidden="true" />
      {favorites.map((fav) => {
        const active = sameLocation(fav, current);
        const weather = weatherByKey[favoriteKey(fav)];
        const city = fav.name.split(',')[0];
        return (
          <span
            key={`${fav.latitude},${fav.longitude}`}
            className={`shrink-0 flex items-center rounded-full border text-sm transition ${
              active ? 'bg-sky-500/30 border-sky-400/50 text-white' : 'bg-white/10 border-white/15 text-slate-100 hover:bg-white/20'
            }`}
          >
            <button
              type="button"
              onClick={() => onSelect(fav)}
              aria-current={active ? 'true' : undefined}
              className="flex items-center gap-1.5 pl-3 pr-1 py-1 cursor-pointer"
            >
              {city}
              {weather && (
                <span className="flex items-center gap-1 font-semibold">
                  {getWeatherInfo(weather.code, 'w-4 h-4', weather.isDay).icon}
                  {Math.round(weather.temp)}°
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => onRemove(fav)}
              aria-label={`Retirer ${fav.name} des favoris`}
              className="pr-2 pl-1 py-1 text-slate-300 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        );
      })}
    </nav>
  );
}
