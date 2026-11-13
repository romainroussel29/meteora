import { useId } from 'react';
import { Thermometer, Droplets, Wind } from 'lucide-react';
import { getWeatherInfo } from '../utils/weatherIcons';
import { getUpcomingHours } from '../utils/hourly';
import useHourStep from '../hooks/useHourStep';
import WindArrow from './WindArrow';

const HOURS = 24;

// Courbe lissée passant par chaque point (bézier aux milieux)
const smoothPath = (pts) =>
  pts.reduce((d, [x, y], i) => {
    if (i === 0) return `M ${x} ${y}`;
    const [px, py] = pts[i - 1];
    const cx = (px + x) / 2;
    return `${d} C ${cx} ${py}, ${cx} ${y}, ${x} ${y}`;
  }, '');

export default function HourlyForecast({ hourly, currentTime }) {
  const gradientId = useId();
  const step = useHourStep();

  const hours = getUpcomingHours(hourly, currentTime, { hours: HOURS, step });

  const n = hours.length;
  const temps = hours.map((h) => h.temp);
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  // y en % de la zone du graphique : 30 % (plus chaud) → 85 % (plus froid)
  const yOf = (t) => 30 + (1 - (t - min) / (max - min || 1)) * 55;

  const points = hours.map((h, i) => [i + 0.5, yOf(h.temp)]);
  const edged = [[0, points[0][1]], ...points, [n, points[n - 1][1]]];
  const line = smoothPath(edged);
  const area = `${line} L ${n} 100 L 0 100 Z`;

  const cols = { gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` };

  return (
    <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 md:p-8 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h3 className="text-lg font-semibold">Prochaines 24 heures</h3>
        <div className="flex gap-4 text-xs text-slate-300">
          <span className="flex items-center gap-1"><Thermometer className="w-3.5 h-3.5 text-amber-300" />Température</span>
          <span className="flex items-center gap-1"><Droplets className="w-3.5 h-3.5 text-sky-400" />Pluie</span>
          <span className="flex items-center gap-1"><Wind className="w-3.5 h-3.5 text-emerald-300" />Vent (km/h)</span>
        </div>
      </div>

      <div className="relative">
        {/* Surlignage de l'heure actuelle */}
        <div
          className="absolute inset-y-0 left-0 rounded-2xl bg-white/10 pointer-events-none"
          style={{ width: `${100 / n}%` }}
        />

        {/* Heures + icônes */}
        <div className="relative grid text-center" style={cols}>
          {hours.map((h, i) => (
            <div key={h.time} className="flex flex-col items-center gap-2 pt-3">
              <span className={`text-xs font-medium ${i === 0 ? 'text-white' : 'text-slate-300'}`}>
                {i === 0 ? 'Maint.' : `${h.time.slice(11, 13)}h`}
              </span>
              {getWeatherInfo(h.code, 'w-6 h-6', h.isDay).icon}
            </div>
          ))}
        </div>

        {/* Courbe des températures */}
        <div className="relative h-32">
          <svg
            className="absolute inset-0 w-full h-full overflow-visible"
            viewBox={`0 0 ${n} 100`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={area} fill={`url(#${gradientId})`} />
            <path
              d={line}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2.5"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <div className="absolute inset-0 grid" style={cols}>
            {hours.map((h) => (
              <div key={h.time} className="relative">
                <span
                  className="absolute left-1/2 -translate-x-1/2 -translate-y-full -mt-2 text-sm font-semibold"
                  style={{ top: `${yOf(h.temp)}%` }}
                >
                  {Math.round(h.temp)}°
                </span>
                <span
                  className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-300 ring-2 ring-slate-900"
                  style={{ top: `${yOf(h.temp)}%` }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Pluie + vent */}
        <div className="relative grid text-center" style={cols}>
          {hours.map((h) => (
            <div key={h.time} className="flex flex-col items-center gap-2 pb-3">
              <div className="h-10 w-full flex flex-col items-center justify-end gap-1">
                <span className={`text-[10px] ${h.rain > 0 ? 'text-sky-300' : 'text-transparent'}`}>
                  {h.rain}%
                </span>
                <div
                  className="w-1.5 rounded-full bg-sky-400/80"
                  style={{ height: `${Math.max(h.rain * 0.2, 2)}px`, opacity: h.rain > 0 ? 1 : 0.2 }}
                />
              </div>
              <div className="h-6 flex items-center justify-center">
                <WindArrow direction={h.windDir} speed={h.windSpeed} size={16} />
              </div>
              <span className="text-[11px] text-slate-300">{Math.round(h.windSpeed)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
