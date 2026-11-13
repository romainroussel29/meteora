import { Sun, Moon, Cloud, CloudSun, CloudMoon, CloudRain, CloudSnow, CloudLightning, CloudFog, CloudDrizzle } from 'lucide-react';

export const getWeatherInfo = (code, className = "w-8 h-8", isDay = true) => {
  if (code === 0) return isDay
    ? { label: "Ciel dégagé", icon: <Sun className={`${className} text-amber-400`} /> }
    : { label: "Ciel dégagé", icon: <Moon className={`${className} text-indigo-200`} /> };
  if (code >= 1 && code <= 2) return isDay
    ? { label: "Partiellement nuageux", icon: <CloudSun className={`${className} text-amber-200`} /> }
    : { label: "Partiellement nuageux", icon: <CloudMoon className={`${className} text-indigo-200`} /> };
  if (code === 3) return { label: "Couvert", icon: <Cloud className={`${className} text-slate-300`} /> };
  if (code >= 45 && code <= 48) return { label: "Brouillard", icon: <CloudFog className={`${className} text-slate-400`} /> };
  if (code >= 51 && code <= 57) return { label: "Bruine", icon: <CloudDrizzle className={`${className} text-sky-400`} /> };
  if (code >= 61 && code <= 67) return { label: "Pluie", icon: <CloudRain className={`${className} text-blue-400`} /> };
  if (code >= 71 && code <= 77) return { label: "Neige", icon: <CloudSnow className={`${className} text-indigo-200`} /> };
  if (code >= 80 && code <= 82) return { label: "Averses", icon: <CloudRain className={`${className} text-blue-500`} /> };
  if (code >= 85 && code <= 86) return { label: "Averses de neige", icon: <CloudSnow className={`${className} text-indigo-200`} /> };
  if (code >= 95) return { label: "Orage", icon: <CloudLightning className={`${className} text-purple-400`} /> };

  return { label: "Variable", icon: <CloudSun className={`${className} text-amber-200`} /> };
};
