import type { ReactNode } from 'react';
import { Thermometer, Sunrise, Sunset, Star, CloudRain, Umbrella, Radar } from 'lucide-react';
import type { CurrentWeather as CurrentData } from '../types/weather';
import type { RainAlert } from '../utils/rain';
import { getWeatherInfo } from '../utils/weatherIcons';
import { getWindInfo, getWindOrigin } from '../utils/wind';
import WindArrow from './WindArrow';

const COMPASS = [
  { label: 'N', className: 'top-0.5 left-1/2 -translate-x-1/2' },
  { label: 'E', className: 'right-1 top-1/2 -translate-y-1/2' },
  { label: 'S', className: 'bottom-0.5 left-1/2 -translate-x-1/2' },
  { label: 'O', className: 'left-1 top-1/2 -translate-y-1/2' },
];

// Petite tuile compacte : icône, valeur, libellé
interface StatProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}

function Stat({ icon, label, value }: StatProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl px-2 py-2.5 flex flex-col items-center text-center gap-1">
      {icon}
      <p className="text-sm md:text-base font-semibold leading-none">{value}</p>
      <p className="text-[11px] md:text-xs text-slate-300 leading-tight">{label}</p>
    </div>
  );
}

export interface TodaySummary {
  min: number;
  max: number;
  rain?: number;
  sunrise?: string;
  sunset?: string;
}

interface CurrentWeatherProps {
  data: CurrentData;
  cityName: string;
  today: TodaySummary;
  rainAlert?: RainAlert | null;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  /** Bouton discret pour ouvrir / fermer la carte radar */
  radarOpen?: boolean;
  onToggleRadar?: () => void;
}

// Seules les alertes de pluie (à venir ou en cours) sont affichées : « pas de pluie » est masqué
const RAIN_ALERT_STYLES = {
  soon: 'bg-sky-400/15 border-sky-300/40 text-sky-100 text-sm',
  raining: 'bg-blue-500/20 border-blue-300/40 text-blue-50 text-sm',
} as const satisfies Record<Exclude<RainAlert['kind'], 'dry'>, string>;

export default function CurrentWeather({
  data, cityName, today, rainAlert, isFavorite, onToggleFavorite, radarOpen = false, onToggleRadar,
}: CurrentWeatherProps) {
  const { label, icon } = getWeatherInfo(data.weather_code, 'w-14 h-14 md:w-20 md:h-20 shrink-0', data.is_day !== 0);
  const wind = getWindInfo(data.wind_speed_10m);
  const calm = data.wind_speed_10m < 2;
  const alert = rainAlert && rainAlert.kind !== 'dry' ? { ...rainAlert, kind: rainAlert.kind } : null;

  const dateLabel = new Date(data.time).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-4 md:p-6 text-white grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-2 md:items-center">
      {/* Bloc principal */}
      <div className="space-y-3 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sky-300 text-[11px] md:text-xs uppercase tracking-wider md:tracking-widest truncate">
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

        {/* Pluie dans les 2 prochaines heures (données au quart d'heure) */}
        {(alert || onToggleRadar) && (
          <div className="flex items-stretch gap-2">
            {alert && (
              <p
                role="status"
                className={`flex-1 min-w-0 flex items-center gap-2 rounded-xl border px-3 py-2 ${RAIN_ALERT_STYLES[alert.kind]}`}
              >
                <Umbrella className="w-4 h-4 shrink-0" aria-hidden="true" />
                {alert.message}
              </p>
            )}
            {onToggleRadar && (
              <button
                type="button"
                onClick={onToggleRadar}
                aria-expanded={radarOpen}
                aria-controls="radar-panel"
                title={radarOpen ? 'Masquer le radar' : 'Voir le radar de pluie'}
                className={`shrink-0 flex items-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition cursor-pointer ${
                  radarOpen
                    ? 'bg-sky-500/25 border-sky-300/50 text-white'
                    : 'bg-white/5 border-white/15 text-slate-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Radar className="w-4 h-4" aria-hidden="true" />
                Radar
              </button>
            )}
          </div>
        )}
      </div>

      {/* Détails */}
      <div className="space-y-2 md:space-y-3 min-w-0">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-4">
          <div className="relative w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-full border-2 border-white/15 bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center">
            {COMPASS.map((c) => (
              <span key={c.label} className={`absolute text-[10px] font-semibold text-slate-300 ${c.className}`}>
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
              {calm ? 'Pas de vent' : `Vient ${getWindOrigin(data.wind_direction_10m)}`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 md:gap-3">
          <Stat
            icon={<Thermometer className="w-4 h-4 text-amber-300" />}
            label="Ressenti"
            value={`${Math.round(data.apparent_temperature)}°`}
          />
          <Stat
            icon={<CloudRain className="w-4 h-4 text-blue-400" />}
            label="Pluie"
            value={`${today.rain ?? 0}%`}
          />
        </div>
      </div>
    </section>
  );
}
