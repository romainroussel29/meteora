import { useState, useEffect } from 'react';
import SearchBar from './components/SearchBar';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';

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
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 py-10 px-4">
      <div className="max-w-lg mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-white tracking-wider">METEORA</h1>
          <p className="text-sky-300 text-sm">Tableau de bord météorologique</p>
        </header>

        <SearchBar
          city={city}
          setCity={setCity}
          onSearch={handleSearch}
          onGeolocate={handleGeolocate}
          loading={loading}
        />

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-xl mb-6 text-center">
            {error}
          </div>
        )}

        {loading && !weather && (
          <div className="animate-pulse space-y-4">
            <div className="h-48 bg-white/10 rounded-2xl"></div>
            <div className="h-64 bg-white/10 rounded-2xl"></div>
          </div>
        )}

        {weather && (
          <>
            <CurrentWeather data={weather.current} cityName={locationName} />
            <ForecastList daily={weather.daily} />
          </>
        )}
      </div>
    </div>
  );
}