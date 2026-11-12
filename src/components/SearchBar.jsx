import { useState, useEffect, useRef } from 'react';
import { Search, MapPin } from 'lucide-react';

export default function SearchBar({ city, setCity, onSearch, onSelectSuggestion, onGeolocate, loading }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  // Fermer le menu si on clique en dehors de la barre de recherche
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Recherche de suggestions avec un délai (Debounce de 300ms)
  useEffect(() => {
    if (city.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=5&language=fr`
        );
        const data = await res.json();
        if (data.results) {
          setSuggestions(data.results);
          setShowDropdown(true);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error("Erreur autocomplétion :", err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [city]);

  const handleSelect = (item) => {
    setShowDropdown(false);
    setSuggestions([]);
    onSelectSuggestion(item);
  };

  return (
    <div ref={wrapperRef} className="relative mb-6">
      <form onSubmit={(e) => { setShowDropdown(false); onSearch(e); }} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            placeholder="Rechercher une ville (ex: Marseille, Tokyo...)"
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
          <Search className="w-5 h-5 text-slate-300 absolute left-3 top-3.5" />
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
          className="p-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl transition disabled:opacity-50 cursor-pointer"
        >
          <MapPin className="w-5 h-5" />
        </button>
      </form>

      {/* Liste déroulante des suggestions */}
      {showDropdown && suggestions.length > 0 && (
        <ul className="absolute z-20 w-full mt-2 bg-slate-800/95 backdrop-blur-md border border-white/20 rounded-xl shadow-xl overflow-hidden">
          {suggestions.map((item) => (
            <li
              key={item.id}
              onClick={() => handleSelect(item)}
              className="px-4 py-3 hover:bg-sky-500/20 text-white cursor-pointer border-b border-white/10 last:border-0 flex justify-between items-center transition"
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