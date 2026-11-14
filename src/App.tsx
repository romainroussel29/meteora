import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import SearchBar from './components/SearchBar';
import CurrentWeather from './components/CurrentWeather';
import HourlyForecast from './components/HourlyForecast';
import ForecastList from './components/ForecastList';
import FavoritesBar from './components/FavoritesBar';
import WeatherBackdrop from './components/WeatherBackdrop';
import PullToRefresh from './components/PullToRefresh';
import RadarPanel from './components/RadarPanel';
import InstallButton from './components/InstallButton';
import useWeather from './hooks/useWeather';
import useFavorites from './hooks/useFavorites';
import useOnlineStatus from './hooks/useOnlineStatus';
import useFavoritesWeather from './hooks/useFavoritesWeather';
import type { Location, Place, WeatherScene } from './types/weather';
import { getRainAlert } from './utils/rain';
import { searchCities } from './utils/api';
import { getCurrentLocation } from './utils/geolocation';
import { getBackground, getWeatherScene, isTwilight } from './utils/background';

// Aperçu des fonds animés : ajouter ?meteo=pluie (ou soleil, nuit, nuages, brouillard, orage, neige…) à l'URL
const PREVIEW_SCENES: Record<string, WeatherScene> = {
  soleil: 'clear-day', nuit: 'clear-night', eclaircies: 'partly-day', nuages: 'cloudy',
  brouillard: 'fog', bruine: 'drizzle', pluie: 'rain', orage: 'storm', neige: 'snow',
};
const previewScene: WeatherScene | undefined = PREVIEW_SCENES[new URLSearchParams(window.location.search).get('meteo') ?? ''];

const toLocation = (place: Place): Location => ({
  latitude: place.latitude,
  longitude: place.longitude,
  name: [place.name, place.country].filter(Boolean).join(', '),
});

export default function App() {
  const { data, location, setLocation, loading, refreshing, refresh, error: weatherError } = useWeather();
  const { favorites, isFavorite, toggleFavorite, removeFavorite } = useFavorites();
  const online = useOnlineStatus();
  const favoritesWeather = useFavoritesWeather(favorites, data?.updatedAt);
  const [error, setError] = useState('');
  const [locating, setLocating] = useState(false);
  const [radarOpen, setRadarOpen] = useState(false);

  const goTo = (loc: Location) => {
    setError('');
    setLocation(loc);
  };

  // Recherche via le bouton "Chercher" quand aucune suggestion n'est affichée
  const handleSearch = async (query: string): Promise<boolean> => {
    try {
      const [place] = await searchCities(query, { count: 1 });
      if (!place) {
        setError('Ville introuvable.');
        return false;
      }
      goTo(toLocation(place));
      return true;
    } catch {
      setError('Erreur lors de la recherche.');
      return false;
    }
  };

  // Bouton "Ma position" : la position n'est demandée que si l'utilisateur le souhaite
  // (aucune demande d'autorisation à l'ouverture de l'application)
  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }
    setLocating(true);
    getCurrentLocation()
      .then(goTo)
      .catch(() => setError('Accès à la position refusé.'))
      .finally(() => setLocating(false));
  };

  const weather = data?.weather;
  const busy = loading || locating;
  const shownError = error || weatherError;
  const isDay = weather?.current.is_day !== 0;
  const twilight = weather ? isTwilight(weather.current.time, weather.daily.sunrise[0], weather.daily.sunset[0]) : false;
  const background = getBackground(weather?.current.weather_code, isDay, twilight);
  const scene = previewScene ?? getWeatherScene(weather?.current.weather_code, isDay);

  return (
    <div className={`relative min-h-screen bg-gradient-to-br ${background} pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] md:py-6 px-3 md:px-8 transition-colors duration-700`}>
      <WeatherBackdrop scene={scene} night={!isDay && !twilight} />
      <PullToRefresh onRefresh={refresh} refreshing={refreshing} />
      <div className="relative max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-6 mb-4">
          <div className="text-center md:text-left">
            <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-wider">METEORA</h1>
            <p className="hidden md:block text-sky-300 text-xs">Tableau de bord météorologique</p>
            <div className="mt-1.5 empty:hidden">
              <InstallButton />
            </div>
          </div>
          <div className="w-full md:max-w-md">
            <SearchBar
              onSearch={handleSearch}
              onSelectSuggestion={(place: Place) => goTo(toLocation(place))}
              onGeolocate={handleGeolocate}
              loading={busy}
            />
          </div>
        </header>

        <FavoritesBar
          favorites={favorites}
          weatherByKey={favoritesWeather}
          current={location}
          onSelect={goTo}
          onRemove={removeFavorite}
        />

        {!online && (
          <div role="status" className="bg-amber-500/15 border border-amber-400/40 text-amber-100 px-3 py-2 rounded-2xl mb-4 text-center text-sm">
            Hors ligne · affichage des dernières données enregistrées
          </div>
        )}

        {shownError && online && (
          <div role="alert" className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-2xl mb-4 text-center text-sm">
            {shownError}
          </div>
        )}

        {!weather && busy && (
          <div className="animate-pulse space-y-4" aria-label="Chargement">
            <div className="h-60 bg-white/10 rounded-3xl"></div>
            <div className="h-72 bg-white/10 rounded-3xl"></div>
            <div className="h-56 bg-white/10 rounded-3xl"></div>
          </div>
        )}

        {weather && (
          <div className="flex justify-end -mt-2 mb-2">
            <button
              type="button"
              onClick={refresh}
              disabled={busy}
              title="Actualiser"
              className="flex items-center gap-1.5 text-[11px] md:text-xs text-slate-300 hover:text-white transition cursor-pointer disabled:cursor-default"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing
                ? 'Actualisation…'
                : `Actualisé à ${new Date(data.updatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
            </button>
          </div>
        )}

        {weather && (
          <main className={`space-y-4 transition-opacity ${busy ? 'opacity-60' : ''}`} aria-busy={busy}>
            <CurrentWeather
              data={weather.current}
              cityName={data.location.name}
              rainAlert={getRainAlert(weather.minutely_15, weather.current.time)}
              isFavorite={isFavorite(data.location)}
              onToggleFavorite={() => toggleFavorite(data.location)}
              radarOpen={radarOpen}
              onToggleRadar={() => setRadarOpen((o) => !o)}
              today={{
                min: weather.daily.temperature_2m_min[0],
                max: weather.daily.temperature_2m_max[0],
                rain: weather.daily.precipitation_probability_max[0],
                sunrise: weather.daily.sunrise[0],
                sunset: weather.daily.sunset[0],
              }}
            />
            {radarOpen && (
              <RadarPanel
                latitude={data.location.latitude}
                longitude={data.location.longitude}
                onClose={() => setRadarOpen(false)}
              />
            )}
            <HourlyForecast hourly={weather.hourly} currentTime={weather.current.time} />
            <ForecastList daily={weather.daily} hourly={weather.hourly} />
          </main>
        )}
      </div>
    </div>
  );
}
