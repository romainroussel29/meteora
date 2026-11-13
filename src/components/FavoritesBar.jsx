import { Star, X } from 'lucide-react';
import { sameLocation } from '../hooks/useFavorites';

export default function FavoritesBar({ favorites, current, onSelect, onRemove }) {
  if (favorites.length === 0) return null;

  return (
    <nav aria-label="Villes favorites" className="flex flex-wrap items-center gap-2 mb-6">
      <Star className="w-4 h-4 text-amber-400 fill-amber-400" aria-hidden="true" />
      {favorites.map((fav) => {
        const active = sameLocation(fav, current);
        return (
          <span
            key={`${fav.latitude},${fav.longitude}`}
            className={`group flex items-center rounded-full border text-sm transition ${
              active ? 'bg-sky-500/30 border-sky-400/50 text-white' : 'bg-white/10 border-white/15 text-slate-200 hover:bg-white/20'
            }`}
          >
            <button type="button" onClick={() => onSelect(fav)} className="pl-3 pr-1 py-1 cursor-pointer">
              {fav.name.split(',')[0]}
            </button>
            <button
              type="button"
              onClick={() => onRemove(fav)}
              aria-label={`Retirer ${fav.name} des favoris`}
              className="pr-2 pl-1 py-1 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        );
      })}
    </nav>
  );
}
