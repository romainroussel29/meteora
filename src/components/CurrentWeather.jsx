import { Wind, Droplets } from 'lucide-react';
import { getWeatherInfo } from '../utils/weatherIcons';

export default function CurrentWeather({ data, cityName }) {
  const { label, icon } = getWeatherInfo(data.weather_code, "w-16 h-16");

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-6 text-white">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">{cityName}</h2>
          <p className="text-slate-300 mt-1">{label}</p>
        </div>
        {icon}
      </div>

      <div className="my-6">
        <span className="text-6xl font-extrabold tracking-tight">
          {Math.round(data.temperature_2m)}°C
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <Wind className="w-5 h-5 text-sky-300" />
          <div>
            <p className="text-xs text-slate-300">Vent</p>
            <p className="font-semibold">{data.wind_speed_10m} km/h</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Droplets className="w-5 h-5 text-sky-300" />
          <div>
            <p className="text-xs text-slate-300">Humidité</p>
            <p className="font-semibold">{data.relative_humidity_2m}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}