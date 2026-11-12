import { getWeatherInfo } from '../utils/weatherIcons';

export default function ForecastList({ daily }) {
  const formatDay = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-white">
      <h3 className="text-lg font-semibold mb-4">Prévisions sur 7 jours</h3>
      <div className="space-y-3">
        {daily.time.map((date, index) => {
          const { icon } = getWeatherInfo(daily.weather_code[index], "w-6 h-6");
          return (
            <div key={date} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
              <span className="capitalize w-24 text-slate-200 font-medium">
                {index === 0 ? "Aujourd'hui" : formatDay(date)}
              </span>
              <div className="flex justify-center">{icon}</div>
              <div className="flex gap-3 text-sm font-semibold">
                <span className="text-slate-400">{Math.round(daily.temperature_2m_min[index])}°</span>
                <span>{Math.round(daily.temperature_2m_max[index])}°</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}