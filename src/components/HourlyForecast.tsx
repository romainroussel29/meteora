import { useId, type CSSProperties } from 'react';
import type { HourlyWeather } from '../types/weather';
import { Thermometer, Droplet, Droplets, Wind } from 'lucide-react';
import { getWeatherInfo } from '../utils/weatherIcons';
import { getUpcomingHours } from '../utils/hourly';
import WindArrow from './WindArrow';

const HOURS = 24;

// Courbe lissée passant par chaque point (bézier aux milieux)
type Point = [number, number];

const smoothPath = (pts: Point[]): string =>
  pts.reduce((d, [x, y], i) => {
    if (i === 0) return `M ${x} ${y}`;
    const [px, py] = pts[i - 1];
    const cx = (px + x) / 2;
    return `${d} C ${cx} ${py}, ${cx} ${y}, ${x} ${y}`;
  }, '');

interface HourlyForecastProps {
  hourly: HourlyWeather;
  currentTime: string;
}

export default function HourlyForecast({ hourly, currentTime }: HourlyForecastProps) {
  const gradientId = useId();
  const hours = getUpcomingHours(hourly, currentTime, { hours: HOURS });

  const n = hours.length;
  const temps = hours.map((h) => h.temp);
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  // y en % de la zone du graphique : 35 % (plus chaud) → 85 % (plus froid)
  const yOf = (t: number) => 35 + (1 - (t - min) / (max - min || 1)) * 50;

  const points: Point[] = hours.map((h, i) => [i + 0.5, yOf(h.temp)]);
  const edged: Point[] = [[0, points[0][1]], ...points, [n, points[n - 1][1]]];
  const line = smoothPath(edged);
  const area = `${line} L ${n} 100 L 0 100 Z`;

  const cols = { gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` };

  return (
    <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-4 md:p-6 text-white">
      <div className="flex items-center justify-between gap-3 mb-2">
        <h3 className="font-semibold">Prochaines 24 heures</h3>
        <div className="hidden sm:flex gap-4 text-xs text-slate-300">
          <span className="flex items-center gap-1"><Thermometer className="w-3.5 h-3.5 text-amber-300" />Température</span>
          <span className="flex items-center gap-1"><Droplets className="w-3.5 h-3.5 text-sky-400" />Pluie</span>
          <span className="flex items-center gap-1"><Wind className="w-3.5 h-3.5 text-emerald-300" />Vent (km/h)</span>
        </div>
      </div>

      {/*
        Mobile / tablette : défilement horizontal au doigt, sans barre visible
        (chaque heure fait 3,25rem et un fondu à droite indique qu'il y a une suite).
        Grand écran : les 24 heures tiennent dans la largeur.
      */}
      <div className="-mx-4 md:mx-0 overflow-x-auto scrollbar-none overscroll-x-contain lg:overflow-visible [mask-image:linear-gradient(to_right,black_85%,transparent)] lg:[mask-image:none]">
        <div
          className="relative px-4 md:px-0 min-w-[calc(var(--cols)*3.25rem+2rem)] md:min-w-[calc(var(--cols)*3.25rem)] lg:min-w-0"
          style={{ '--cols': n } as CSSProperties}
        >
          <div className="relative">
            {/* Surlignage de l'heure actuelle */}
            <div
              className="absolute inset-y-0 left-0 rounded-2xl bg-white/10 pointer-events-none"
              style={{ width: `${100 / n}%` }}
            />

            {/* Heures + icônes */}
            <div className="relative grid text-center" style={cols}>
              {hours.map((h, i) => (
                <div key={h.time} className="flex flex-col items-center gap-1.5 pt-2">
                  <span className={`text-xs font-medium ${i === 0 ? 'text-white' : 'text-slate-300'}`}>
                    {i === 0 ? 'Maint.' : `${h.time.slice(11, 13)}h`}
                  </span>
                  {getWeatherInfo(h.code, 'w-6 h-6', h.isDay).icon}
                </div>
              ))}
            </div>

            {/* Courbe des températures */}
            <div className="relative h-24">
              <svg
                className="absolute inset-0 w-full h-full overflow-visible"
                viewBox={`0 0 ${n} 100`}
                preserveAspectRatio="none"
                aria-hidden="true"
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
                      className="absolute left-1/2 -translate-x-1/2 -translate-y-full -mt-1.5 text-sm font-semibold"
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
                <div key={h.time} className="flex flex-col items-center gap-1 pb-2">
                  {/* Gouttelette seulement s'il y a un risque de pluie : plus grande et plus marquée quand il augmente */}
                  <div className="h-8 w-full flex flex-col items-center justify-end gap-0.5">
                    {h.rain > 0 && (
                      <>
                        <span className="text-[11px] text-sky-300">{h.rain}%</span>
                        <Droplet
                          aria-hidden="true"
                          className="text-sky-300 fill-sky-400"
                          strokeWidth={1.5}
                          style={{
                            width: 9 + h.rain * 0.05,
                            height: 9 + h.rain * 0.05,
                            opacity: 0.45 + h.rain / 180,
                          }}
                        />
                      </>
                    )}
                  </div>
                  <div className="h-5 flex items-center justify-center">
                    <WindArrow direction={h.windDir} speed={h.windSpeed} size={14} />
                  </div>
                  <span className="text-[11px] text-slate-300">{Math.round(h.windSpeed)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
