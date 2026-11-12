import { Search, MapPin } from 'lucide-react';

export default function SearchBar({ city, setCity, onSearch, onGeolocate, loading }) {
  return (
    <form onSubmit={onSearch} className="flex gap-2 mb-6">
      <div className="relative flex-1">
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
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
  );
}