import { Droplets, Thermometer, Wind, Sunrise, Sunset, Star } from 'lucide-react';
import { getWeatherInfo } from '../utils/weatherIcons';
import { getCardinal, getWindInfo } from '../utils/wind';
import WindArrow from './WindArrow';

const COMPASS = [
  { label: 'N', className: 'top-1 left-1/2 -translate-x-1/2' },
  { label: 'E', className: 'right-1.5 top-1/2 -translate-y-1/2' },
  { label: 'S', className: 'bottom-1 left-1/2 -translate-x-1/2' },
  { label: 'O', className: 'left-1.5 top-1/2 -translate-y-1/2' },
];

function Tile({ icon, label, value }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
      {icon}
      <div className="min-w-0">
        <p className="text-xs text-slate-300">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
      </div>
    </div>
  );
}

export default function CurrentWeather({ data, cityName, today, isFavorite, onToggleFavorite }) {
  const { label, icon } = getWeatherInfo(data.weather_code, 'w-24 h-24 md:w-28 md:h-28', data.is_day !== 0);
  const wind = getWindInfo(data.wind_speed_10m);
  const calm = data.wind_speed_10m < 2;

  const dateLabel = new Date(data.time).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 md:p-8 text-white grid gap-8 md:grid-cols-2">
      {/* Bloc principal */}
      <div className="flex flex-col justify-between gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sky-300 text-sm uppercase tracking-widest">
              {dateLabel} · {data.time.slice(11, 16)}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mt-1">{cityName}</h2>
          </div>
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-pressed={isFavorite}
            title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            className="p-2 rounded-full hover:bg-white/10 transition cursor-pointer"
          >
            <Star className={`w-6 h-6 ${isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
          </button>
        </div>

        <div className="flex items-center gap-6">
          {icon}
          <span className="text-7xl md:text-8xl font-extrabold tracking-tight">
            {Math.round(data.temperature_2m)}°
          </span>
        </div>

        <div>
          <p className="text-xl font-medium">{label}</p>
          <p className="text-slate-300 text-sm mt-1">
            Min {Math.round(today.min)}° · Max {Math.round(today.max)}°
          </p>
          <div className="flex gap-5 mt-3 text-sm text-slate-300">
            <span className="flex items-center gap-1.5">
              <Sunrise className="w-4 h-4 text-amber-300" /> {today.sunrise?.slice(11, 16)}
            </span>
            <span className="flex items-center gap-1.5">
              <Sunset className="w-4 h-4 text-orange-400" /> {today.sunset?.slice(11, 16)}
            </span>
          </div>
        </div>
      </div>

      {/* Détails */}
      <div className="grid grid-cols-2 gap-3 content-center">
        <div className="col-span-2 bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-5">
          <div className="relative w-24 h-24 shrink-0 rounded-full border-2 border-white/15 bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center">
            {COMPASS.map((c) => (
              <span key={c.label} className={`absolute text-[10px] font-semibold text-slate-400 ${c.className}`}>
                {c.label}
              </span>
            ))}
            <WindArrow direction={data.wind_direction_10m} speed={data.wind_speed_10m} size={36} />
          </div>
          <div>
            <p className="text-xs text-slate-300">Vent</p>
            <p className="text-2xl font-bold">
              {Math.round(data.wind_speed_10m)} <span className="text-base font-medium text-slate-300">km/h</span>
            </p>
            <p className={`font-semibold ${wind.color}`}>{wind.label}</p>
            <p className="text-sm text-slate-300">
              {calm ? 'Pas de vent' : `Vient du ${getCardinal(data.wind_direction_10m)} (${Math.round(data.wind_direction_10m)}°)`}
            </p>
          </div>
        </div>

        <Tile
          icon={<Wind className="w-6 h-6 text-emerald-300" />}
          label="Rafales"
          value={`${Math.round(data.wind_gusts_10m)} km/h`}
        />
        <Tile
          icon={<Thermometer className="w-6 h-6 text-amber-300" />}
          label="Ressenti"
          value={`${Math.round(data.apparent_temperature)}°`}
        />
        <Tile
          icon={<Droplets className="w-6 h-6 text-sky-300" />}
          label="Humidité"
          value={`${data.relative_humidity_2m}%`}
        />
        <Tile
          icon={<Droplets className="w-6 h-6 text-blue-400" />}
          label="Pluie (aujourd'hui)"
          value={`${today.rain ?? 0}%`}
        />
      </div>
    </section>
  );
}
