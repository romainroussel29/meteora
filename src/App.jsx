import React, { useState } from 'react';
import { Search, CloudSun, Wind, Droplets, AlertCircle } from 'lucide-react';

export default function App() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWeather = async (e) => {
    e.preventDefault();
    if (!city.trim()) return;

    setLoading(true);
    setError(null);
    setWeather(null);

    try {
      // 1. Trouver les coordonnées GPS de la ville grâce à l'API de géocodage
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=fr&format=json`);
      const geoData = await geoRes.json();

      if (!geoData.results || geoData.results.length === 0) {
        throw new Error("Ville introuvable. Vérifiez l'orthographe.");
      }

      const { latitude, longitude, name, country } = geoData.results[0];

      // 2. Récupérer la météo avec les coordonnées GPS
      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m`);
      const weatherData = await weatherRes.json();

      setWeather({
        name,
        country,
        temp: weatherData.current.temperature_2m,
        feelsLike: weatherData.current.apparent_temperature,
        humidity: weatherData.current.relative_humidity_2m,
        windSpeed: weatherData.current.wind_speed_10m,
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-900 flex flex-col items-center justify-center p-4 text-white font-sans">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-white/20">
        
        {/* Titre */}
        <h1 className="text-3xl font-extrabold text-center mb-6 tracking-wide">AeroCast</h1>

        {/* Formulaire de recherche */}
        <form onSubmit={fetchWeather} className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Entrez une ville (ex: Paris, Tokyo)..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="flex-1 px-4 py-3 rounded-2xl bg-white/20 placeholder-white/70 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white text-white shadow-inner"
          />
          <button
            type="submit"
            className="px-5 py-3 bg-white text-indigo-900 font-bold rounded-2xl hover:bg-opacity-90 transition shadow-lg flex items-center justify-center"
          >
            <Search size={22} />
          </button>
        </form>

        {/* États : Chargement, Erreur ou Résultats */}
        {loading && <p className="text-center text-white/80 animate-pulse py-6">Recherche en cours...</p>}

        {error && (
          <div className="flex items-center gap-2 bg-red-500/20 border border-red-400 text-red-200 p-4 rounded-2xl mb-4 text-sm">
            <AlertCircle size={20} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {weather && (
          <div className="text-center animate-fadeIn">
            <h2 className="text-2xl font-bold mb-1">{weather.name}, {weather.country}</h2>
            <div className="text-6xl font-black my-6 tracking-tighter">
              {weather.temp}°C
            </div>
            <p className="text-white/80 text-sm mb-6">
              Ressenti : <span className="font-semibold">{weather.feelsLike}°C</span>
            </p>

            {/* Grille des détails (Vent et Humidité) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 p-4 rounded-2xl border border-white/10 flex flex-col items-center">
                <Droplets size={24} className="mb-1 text-blue-300" />
                <span className="text-xs text-white/70">Humidité</span>
                <span className="text-lg font-bold">{weather.humidity}%</span>
              </div>
              <div className="bg-white/10 p-4 rounded-2xl border border-white/10 flex flex-col items-center">
                <Wind size={24} className="mb-1 text-blue-300" />
                <span className="text-xs text-white/70">Vent</span>
                <span className="text-lg font-bold">{weather.windSpeed} km/h</span>
              </div>
            </div>
          </div>
        )}

        {!weather && !loading && !error && (
          <div className="text-center py-8 text-white/60 text-sm">
            <CloudSun size={48} className="mx-auto mb-3 opacity-50" />
            <p>Tapez le nom d'une ville pour découvrir sa météo en direct.</p>
          </div>
        )}

      </div>
    </div>
  );
}