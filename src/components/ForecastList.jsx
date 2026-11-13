import { Droplets } from 'lucide-react';
import { getWeatherInfo } from '../utils/weatherIcons';
import WindArrow from './WindArrow';

// "T12:00" évite le décalage d'un jour lié au fuseau UTC
const formatDay = (dateStr) =>
  new Date(`${dateStr}T12:00`).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });

export default function ForecastList({ daily }) {
  const weekMin = Math.min(...daily.temperature_2m_min);
  const weekMax = Math.max(...daily.temperature_2m_max);
  const range = weekMax - weekMin || 1;

  return (
    <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 md:p-8 text-white">
      <h3 className="text-lg font-semibold mb-6">Prévisions sur 7 jours</h3>
      <div className="grid grid-cols-1 md:grid-cols-7 gap-2 md:gap-3">
        {daily.time.map((date, i) => {
          const { icon, label } = getWeatherInfo(daily.weather_code[i], 'w-8 h-8 md:w-10 md:h-10');
          const tMin = daily.temperature_2m_min[i];
          const tMax = daily.temperature_2m_max[i];
          const rain = daily.precipitation_probability_max?.[i] ?? 0;
          return (
            <div
              key={date}
              title={label}
              className={`flex md:flex-col items-center gap-3 md:gap-3 rounded-2xl px-4 py-3 md:py-5 transition hover:bg-white/10 ${i === 0 ? 'bg-white/10' : 'bg-white/5'}`}
            >
              <span className="capitalize w-20 md:w-auto text-sm font-medium text-slate-200">
                {i === 0 ? "Aujourd'hui" : formatDay(date)}
              </span>
              {icon}
              <span className={`flex items-center gap-1 text-xs w-12 md:w-auto ${rain > 0 ? 'text-sky-300' : 'text-transparent'}`}>
                <Droplets className="w-3 h-3" />{rain}%
              </span>

              <div className="flex items-center gap-2 flex-1 md:w-full text-sm font-semibold">
                <span className="text-slate-400 w-8 text-right md:text-left">{Math.round(tMin)}°</span>
                <div className="relative flex-1 h-1.5 rounded-full bg-white/10">
                  <div
                    className="absolute inset-y-0 rounded-full bg-gradient-to-r from-sky-400 to-amber-400"
                    style={{
                      left: `${((tMin - weekMin) / range) * 100}%`,
                      right: `${((weekMax - tMax) / range) * 100}%`,
                    }}
                  />
                </div>
                <span className="w-8 text-right">{Math.round(tMax)}°</span>
              </div>

              <span className="flex items-center gap-1.5 text-xs text-slate-300">
                <WindArrow
                  direction={daily.wind_direction_10m_dominant[i]}
                  speed={daily.wind_speed_10m_max[i]}
                  size={14}
                />
                {Math.round(daily.wind_speed_10m_max[i])} km/h
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
