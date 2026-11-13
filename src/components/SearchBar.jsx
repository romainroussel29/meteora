import { useState, useEffect, useRef, useId } from 'react';
import { Search, MapPin } from 'lucide-react';
import { searchCities } from '../utils/api';

const MIN_CHARS = 2;
const DEBOUNCE_MS = 300;

export default function SearchBar({ onSearch, onSelectSuggestion, onGeolocate, loading }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const listId = useId();

  const canSuggest = query.trim().length >= MIN_CHARS;
  const showDropdown = open && canSuggest && suggestions.length > 0;

  // Fermer le menu si on clique en dehors de la barre de recherche
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Suggestions avec debounce : on attend 300 ms après la dernière frappe,
  // et on annule la requête précédente si l'utilisateur continue d'écrire.
  useEffect(() => {
    if (query.trim().length < MIN_CHARS) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const results = await searchCities(query.trim(), { signal: controller.signal });
        setSuggestions(results);
        setActiveIndex(-1);
      } catch (err) {
        if (err.name !== 'AbortError') console.error('Erreur autocomplétion :', err);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const reset = () => {
    setQuery('');
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleSelect = (item) => {
    reset();
    onSelectSuggestion(item);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    // Si des suggestions sont affichées, on prend la première plutôt que de refaire une requête
    if (showDropdown) {
      handleSelect(suggestions[Math.max(activeIndex, 0)]);
      return;
    }
    setOpen(false);
    if (await onSearch(query.trim())) reset();
  };

  // Navigation clavier : ↑ ↓ pour parcourir, Entrée pour choisir, Échap pour fermer
  const handleKeyDown = (e) => {
    if (!showDropdown) {
      if (e.key === 'ArrowDown' && suggestions.length > 0) setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <form onSubmit={handleSubmit} className="flex gap-2" role="search">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher une ville (ex: Marseille, Tokyo...)"
            aria-label="Rechercher une ville"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showDropdown}
            aria-controls={listId}
            aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
            autoComplete="off"
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
          <Search className="w-5 h-5 text-slate-300 absolute left-3 top-3.5" aria-hidden="true" />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-5 py-3 bg-sky-500 hover:bg-sky-400 text-white font-medium rounded-xl transition disabled:opacity-50 cursor-pointer"
        >
          Chercher
        </button>

        <button
          type="button"
          onClick={onGeolocate}
          disabled={loading}
          title="Utiliser ma position"
          aria-label="Utiliser ma position"
          className="p-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl transition disabled:opacity-50 cursor-pointer"
        >
          <MapPin className="w-5 h-5" />
        </button>
      </form>

      {/* Liste déroulante des suggestions */}
      {showDropdown && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 w-full mt-2 bg-slate-800/95 backdrop-blur-md border border-white/20 rounded-xl shadow-xl overflow-hidden"
        >
          {suggestions.map((item, i) => (
            <li
              key={item.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={(e) => e.preventDefault()} // garde le focus dans le champ
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`px-4 py-3 text-white cursor-pointer border-b border-white/10 last:border-0 flex justify-between items-center transition ${i === activeIndex ? 'bg-sky-500/25' : ''}`}
            >
              <div>
                <span className="font-semibold">{item.name}</span>
                {item.admin1 && <span className="text-slate-400 text-sm">, {item.admin1}</span>}
              </div>
              <span className="text-xs font-medium bg-white/10 px-2 py-1 rounded text-sky-300">
                {item.country}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
