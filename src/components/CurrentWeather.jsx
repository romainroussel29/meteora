import { Droplets, Thermometer, Wind, Sunrise, Sunset, Star, CloudRain } from 'lucide-react';
import { getWeatherInfo } from '../utils/weatherIcons';
import { getCardinal, getWindInfo } from '../utils/wind';
import WindArrow from './WindArrow';

const COMPASS = [
  { label: 'N', className: 'top-0.5 left-1/2 -translate-x-1/2' },
  { label: 'E', className: 'right-1 top-1/2 -translate-y-1/2' },
  { label: 'S', className: 'bottom-0.5 left-1/2 -translate-x-1/2' },
  { label: 'O', className: 'left-1 top-1/2 -translate-y-1/2' },
];

// Petite tuile compacte : icône, valeur, libellé
function Stat({ icon, label, value }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl px-2 py-2.5 flex flex-col items-center text-center gap-1">
      {icon}
      <p className="text-sm md:text-base font-semibold leading-none">{value}</p>
      <p className="text-[10px] md:text-xs text-slate-400 leading-tight">{label}</p>
    </div>
  );
}

export default function CurrentWeather({ data, cityName, today, isFavorite, onToggleFavorite }) {
  const { label, icon } = getWeatherInfo(data.weather_code, 'w-14 h-14 md:w-20 md:h-20 shrink-0', data.is_day !== 0);
  const wind = getWindInfo(data.wind_speed_10m);
  const calm = data.wind_speed_10m < 2;

  const dateLabel = new Date(data.time).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-4 md:p-6 text-white grid gap-4 md:gap-6 md:grid-cols-2 md:items-center">
      {/* Bloc principal */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sky-300 text-[11px] md:text-xs uppercase tracking-widest">
              {dateLabel} · {data.time.slice(11, 16)}
            </p>
            <h2 className="text-2xl md:text-3xl font-bold truncate">{cityName}</h2>
          </div>
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-pressed={isFavorite}
            title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            className="p-1.5 -mr-1.5 rounded-full hover:bg-white/10 transition cursor-pointer"
          >
            <Star className={`w-5 h-5 md:w-6 md:h-6 ${isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
          </button>
        </div>

        <div className="flex items-center gap-3 md:gap-5">
          {icon}
          <span className="text-6xl md:text-7xl font-extrabold tracking-tight leading-none">
            {Math.round(data.temperature_2m)}°
          </span>
          <div className="ml-1 text-sm space-y-0.5 min-w-0">
            <p className="font-medium text-base md:text-lg leading-tight">{label}</p>
            <p className="text-slate-300">
              {Math.round(today.min)}° / {Math.round(today.max)}°
            </p>
            <p className="flex items-center gap-2 text-slate-300 text-xs">
              <span className="flex items-center gap-1">
                <Sunrise className="w-3.5 h-3.5 text-amber-300" /> {today.sunrise?.slice(11, 16)}
              </span>
              <span className="flex items-center gap-1">
                <Sunset className="w-3.5 h-3.5 text-orange-400" /> {today.sunset?.slice(11, 16)}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Détails */}
      <div className="space-y-2 md:space-y-3">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-4">
          <div className="relative w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-full border-2 border-white/15 bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center">
            {COMPASS.map((c) => (
              <span key={c.label} className={`absolute text-[9px] font-semibold text-slate-400 ${c.className}`}>
                {c.label}
              </span>
            ))}
            <WindArrow direction={data.wind_direction_10m} speed={data.wind_speed_10m} size={26} />
          </div>
          <div className="min-w-0">
            <p className="text-xl md:text-2xl font-bold leading-tight">
              {Math.round(data.wind_speed_10m)} <span className="text-sm font-medium text-slate-300">km/h</span>
              <span className={`ml-2 text-sm font-semibold ${wind.color}`}>{wind.label}</span>
            </p>
            <p className="text-xs md:text-sm text-slate-300">
              {calm ? 'Pas de vent' : `Vient du ${getCardinal(data.wind_direction_10m)} (${Math.round(data.wind_direction_10m)}°)`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 md:gap-3">
          <Stat
            icon={<Thermometer className="w-4 h-4 text-amber-300" />}
            label="Ressenti"
            value={`${Math.round(data.apparent_temperature)}°`}
          />
          <Stat
            icon={<Droplets className="w-4 h-4 text-sky-300" />}
            label="Humidité"
            value={`${data.relative_humidity_2m}%`}
          />
          <Stat
            icon={<CloudRain className="w-4 h-4 text-blue-400" />}
            label="Pluie"
            value={`${today.rain ?? 0}%`}
          />
          <Stat
            icon={<Wind className="w-4 h-4 text-emerald-300" />}
            label="Rafales km/h"
            value={Math.round(data.wind_gusts_10m)}
          />
        </div>
      </div>
    </section>
  );
}
