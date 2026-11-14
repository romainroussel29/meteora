import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Droplets, X } from 'lucide-react';
import { getWeatherInfo } from '../utils/weatherIcons';
import { getDayHours } from '../utils/hourly';
import { getCardinal } from '../utils/wind';
import HScroll from './HScroll';
import WindArrow from './WindArrow';

// "T12:00" évite le décalage d'un jour lié au fuseau UTC
const toDate = (dateStr) => new Date(`${dateStr}T12:00`);
const formatDay = (dateStr) => toDate(dateStr).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
const formatLongDay = (dateStr) =>
  toDate(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

function HourSlot({ slot }) {
  const { icon, label } = getWeatherInfo(slot.code, 'w-7 h-7', slot.isDay);
  return (
    <div
      className="shrink-0 w-16 md:w-auto md:flex-1 md:min-w-[4.5rem] flex flex-col items-center gap-1.5 rounded-xl bg-white/5 py-2.5"
      title={label}
    >
      <span className="text-xs text-slate-300">{slot.time.slice(11, 13)}h</span>
      {icon}
      <span className="font-semibold">{Math.round(slot.temp)}°</span>
      <span className={`flex items-center gap-0.5 text-[10px] ${slot.rain > 0 ? 'text-sky-300' : 'text-transparent'}`}>
        <Droplets className="w-2.5 h-2.5" />{slot.rain}%
      </span>
      <span className="flex items-center gap-1 text-[11px] text-slate-300" title={`Vent du ${getCardinal(slot.windDir)}`}>
        <WindArrow direction={slot.windDir} speed={slot.windSpeed} size={12} />
        {Math.round(slot.windSpeed)}
      </span>
    </div>
  );
}

export default function ForecastList({ daily, hourly }) {
  const [selected, setSelected] = useState(null);
  const detailsRef = useRef(null);

  // À l'ouverture d'un jour, on fait défiler juste assez pour voir le détail
  // ("nearest" : la page ne bouge pas s'il est déjà visible, et la semaine reste à l'écran)
  useEffect(() => {
    if (!selected || !detailsRef.current) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    detailsRef.current.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
  }, [selected]);

  const weekMin = Math.min(...daily.temperature_2m_min);
  const weekMax = Math.max(...daily.temperature_2m_max);
  const range = weekMax - weekMin || 1;

  return (
    <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-4 md:p-6 text-white">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <h3 className="font-semibold">Prévisions sur 7 jours</h3>
        <p className="text-xs text-slate-400">Touchez un jour pour le détail toutes les 2 h</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-1.5 lg:gap-3">
        {daily.time.map((date, i) => {
          const { icon, label } = getWeatherInfo(daily.weather_code[i], 'w-7 h-7 lg:w-9 lg:h-9');
          const tMin = daily.temperature_2m_min[i];
          const tMax = daily.temperature_2m_max[i];
          const rain = daily.precipitation_probability_max?.[i] ?? 0;
          const isOpen = selected === date;

          return [
            <button
              key={date}
              type="button"
              title={label}
              onClick={() => setSelected(isOpen ? null : date)}
              aria-expanded={isOpen}
              aria-controls="day-details"
              className={`flex lg:flex-col items-center gap-3 rounded-xl lg:rounded-2xl px-3 py-2 lg:py-4 text-left transition cursor-pointer border ${
                isOpen
                  ? 'bg-sky-500/20 border-sky-400/50'
                  : `border-transparent hover:bg-white/10 ${i === 0 ? 'bg-white/10' : 'bg-white/5'}`
              }`}
            >
              <span className="capitalize w-20 lg:w-auto text-sm font-medium text-slate-200">
                {i === 0 ? "Aujourd'hui" : formatDay(date)}
              </span>
              {icon}
              <span className={`flex items-center gap-1 text-xs w-12 lg:w-auto ${rain > 0 ? 'text-sky-300' : 'text-transparent'}`}>
                <Droplets className="w-3 h-3" />{rain}%
              </span>

              <div className="flex items-center gap-2 flex-1 lg:w-full text-sm font-semibold">
                <span className="text-slate-400 w-8 text-right lg:text-left">{Math.round(tMin)}°</span>
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

              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>,

            // Le détail suit la carte dans le DOM (donc juste dessous sur mobile) ;
            // sur grand écran, "order-last" le place sous la rangée des 7 jours.
            isOpen && (
              <div
                key={`${date}-details`}
                id="day-details"
                ref={detailsRef}
                className="scroll-mb-6 col-span-full lg:order-last my-1 lg:mt-2 rounded-2xl bg-white/5 border border-white/10 p-3 md:p-5"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold capitalize">{formatLongDay(date)}</p>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    aria-label="Fermer le détail"
                    className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <HScroll label={`Prévisions toutes les 2 heures, ${formatLongDay(date)}`}>
                  <div className="flex w-max min-w-full gap-1.5 md:gap-2">
                    {getDayHours(hourly, date, 2).map((slot) => (
                      <HourSlot key={slot.time} slot={slot} />
                    ))}
                  </div>
                </HScroll>
                <p className="mt-2 text-[11px] text-slate-400">Vent en km/h · glissez pour voir toute la journée</p>
              </div>
            ),
          ];
        })}
      </div>
    </section>
  );
}
