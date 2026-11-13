import { useState, useEffect } from 'react';
import SearchBar from './components/SearchBar';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import HourlyForecast from './components/HourlyForecast';

export default function App() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [locationName, setLocationName] = useState('Paris');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchWeatherByCoords = async (lat, lon, name) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,is_day,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,weather_code,is_day,precipitation_probability,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant&forecast_days=7&timezone=auto`
      );
      const data = await res.json();
      setWeather(data);
      if (name) setLocationName(name);
    } catch {
      setError("Impossible de récupérer les données météo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherByCoords(48.8566, 2.3522, 'Paris');
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!city.trim()) return;
    setLoading(true);
    setError('');

    try {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=fr`
      );
      const geoData = await geoRes.json();

      if (!geoData.results || geoData.results.length === 0) {
        setError("Ville introuvable.");
        setLoading(false);
        return;
      }

      const { latitude, longitude, name, country } = geoData.results[0];
      await fetchWeatherByCoords(latitude, longitude, `${name}, ${country}`);
      setCity('');
    } catch {
      setError("Erreur lors de la recherche.");
      setLoading(false);
    }
  };
const handleSelectSuggestion = async (item) => {
    const displayName = `${item.name}, ${item.country}`;
    setCity('');
    await fetchWeatherByCoords(item.latitude, item.longitude, displayName);
  };
  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude, "Ma position");
      },
      () => {
        setError("Accès à la position refusé.");
        setLoading(false);
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 py-8 md:py-12 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-extrabold text-white tracking-wider">METEORA</h1>
            <p className="text-sky-300 text-sm">Tableau de bord météorologique</p>
          </div>
          <div className="w-full md:max-w-md">
            <SearchBar
              city={city}
              setCity={setCity}
              onSearch={handleSearch}
              onSelectSuggestion={handleSelectSuggestion}
              onGeolocate={handleGeolocate}
              loading={loading}
            />
          </div>
        </header>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-2xl mb-6 text-center">
            {error}
          </div>
        )}

        {loading && !weather && (
          <div className="animate-pulse space-y-6">
            <div className="h-72 bg-white/10 rounded-3xl"></div>
            <div className="h-80 bg-white/10 rounded-3xl"></div>
            <div className="h-56 bg-white/10 rounded-3xl"></div>
          </div>
        )}

        {weather && (
          <div className={`space-y-6 transition-opacity ${loading ? 'opacity-60' : ''}`}>
            <CurrentWeather
              data={weather.current}
              cityName={locationName}
              today={{
                min: weather.daily.temperature_2m_min[0],
                max: weather.daily.temperature_2m_max[0],
                rain: weather.daily.precipitation_probability_max[0],
              }}
            />
            <HourlyForecast hourly={weather.hourly} currentTime={weather.current.time} />
            <ForecastList daily={weather.daily} />
          </div>
        )}
      </div>
    </div>
  );
}