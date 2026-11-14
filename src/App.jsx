import { useEffect, useRef, useState } from 'react';
import SearchBar from './components/SearchBar';
import CurrentWeather from './components/CurrentWeather';
import HourlyForecast from './components/HourlyForecast';
import ForecastList from './components/ForecastList';
import FavoritesBar from './components/FavoritesBar';
import useWeather from './hooks/useWeather';
import useFavorites from './hooks/useFavorites';
import { searchCities } from './utils/api';
import { getCurrentLocation } from './utils/geolocation';
import { getBackground } from './utils/background';

const toLocation = (place) => ({
  latitude: place.latitude,
  longitude: place.longitude,
  name: [place.name, place.country].filter(Boolean).join(', '),
});

export default function App() {
  const { data, location, setLocation, loading, error: weatherError } = useWeather();
  const { favorites, isFavorite, toggleFavorite, removeFavorite } = useFavorites();
  const [error, setError] = useState('');
  const [locating, setLocating] = useState(false);

  const userChoseRef = useRef(false);

  const goTo = (loc) => {
    userChoseRef.current = true;
    setError('');
    setLocation(loc);
  };

  // Recherche via le bouton "Chercher" quand aucune suggestion n'est affichée
  const handleSearch = async (query) => {
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

  // À chaque ouverture : on tente de détecter la position, sans message d'erreur.
  // En cas de refus, on garde simplement la dernière ville consultée.
  useEffect(() => {
    let cancelled = false;
    getCurrentLocation()
      .then((loc) => {
        // Si l'utilisateur a déjà choisi une ville entre-temps, on ne l'écrase pas
        if (!cancelled && !userChoseRef.current) setLocation(loc);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [setLocation]);

  // Bouton "Ma position"
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
  const background = getBackground(weather?.current.weather_code, weather?.current.is_day !== 0);

  return (
    <div className={`min-h-screen bg-gradient-to-br ${background} py-4 md:py-6 px-3 md:px-8 transition-colors duration-700`}>
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-6 mb-4">
          <div className="text-center md:text-left">
            <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-wider">METEORA</h1>
            <p className="hidden md:block text-sky-300 text-xs">Tableau de bord météorologique</p>
          </div>
          <div className="w-full md:max-w-md">
            <SearchBar
              onSearch={handleSearch}
              onSelectSuggestion={(place) => goTo(toLocation(place))}
              onGeolocate={handleGeolocate}
              loading={busy}
            />
          </div>
        </header>

        <FavoritesBar
          favorites={favorites}
          current={location}
          onSelect={goTo}
          onRemove={removeFavorite}
        />

        {shownError && (
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
          <main className={`space-y-4 transition-opacity ${busy ? 'opacity-60' : ''}`} aria-busy={busy}>
            <CurrentWeather
              data={weather.current}
              cityName={data.location.name}
              isFavorite={isFavorite(data.location)}
              onToggleFavorite={() => toggleFavorite(data.location)}
              today={{
                min: weather.daily.temperature_2m_min[0],
                max: weather.daily.temperature_2m_max[0],
                rain: weather.daily.precipitation_probability_max[0],
                sunrise: weather.daily.sunrise[0],
                sunset: weather.daily.sunset[0],
              }}
            />
            <HourlyForecast hourly={weather.hourly} currentTime={weather.current.time} />
            <ForecastList daily={weather.daily} hourly={weather.hourly} />
          </main>
        )}
      </div>
    </div>
  );
}
