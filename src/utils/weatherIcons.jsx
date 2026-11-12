import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog, CloudDrizzle } from 'lucide-react';

export const getWeatherInfo = (code, className = "w-8 h-8") => {
  if (code === 0) return { label: "Ciel dégagé", icon: <Sun className={`${className} text-amber-400`} /> };
  if (code >= 1 && code <= 3) return { label: "Partiellement nuageux", icon: <Cloud className={`${className} text-slate-400`} /> };
  if (code >= 45 && code <= 48) return { label: "Brouillard", icon: <CloudFog className={`${className} text-slate-400`} /> };
  if (code >= 51 && code <= 57) return { label: "Bruine", icon: <CloudDrizzle className={`${className} text-sky-400`} /> };
  if (code >= 61 && code <= 67) return { label: "Pluie", icon: <CloudRain className={`${className} text-blue-500`} /> };
  if (code >= 71 && code <= 77) return { label: "Neige", icon: <CloudSnow className={`${className} text-indigo-200`} /> };
  if (code >= 80 && code <= 82) return { label: "Averses", icon: <CloudRain className={`${className} text-blue-600`} /> };
  if (code >= 95) return { label: "Orage", icon: <CloudLightning className={`${className} text-purple-500`} /> };
  
  return { label: "Variable", icon: <Sun className={`${className} text-amber-400`} /> };
};