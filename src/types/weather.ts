// Types des données manipulées par l'application (réponses Open-Meteo, lieux, favoris…)

/** Un lieu affiché : coordonnées + nom lisible ("Brest, France") */
export interface Location {
  latitude: number;
  longitude: number;
  name: string;
}

/** Résultat de recherche de ville (API de géocodage Open-Meteo) */
export interface Place {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}

export interface CurrentWeather {
  time: string;
  temperature_2m: number;
  apparent_temperature: number;
  weather_code: number;
  is_day: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
}

export interface HourlyWeather {
  time: string[];
  temperature_2m: number[];
  weather_code: number[];
  is_day?: number[];
  precipitation_probability?: number[];
  wind_speed_10m: number[];
  wind_direction_10m: number[];
}

export interface DailyWeather {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_probability_max: number[];
  sunrise: string[];
  sunset: string[];
}

/** Précipitations par quart d'heure (mm) pour la "pluie dans l'heure" */
export interface Minutely15Weather {
  time: string[];
  precipitation: number[];
}

export interface Forecast {
  timezone: string;
  current: CurrentWeather;
  hourly: HourlyWeather;
  daily: DailyWeather;
  minutely_15?: Minutely15Weather;
}

/** Une heure de prévision, prête à afficher */
export interface HourEntry {
  time: string;
  temp: number;
  code: number;
  isDay: boolean;
  rain: number;
  windSpeed: number;
  windDir: number;
}

/** Résumé météo d'un favori (température + icône) */
export interface FavoriteWeather {
  temp: number;
  code: number;
  isDay: boolean;
}

/** Scènes du fond animé */
export type WeatherScene =
  | 'clear-day'
  | 'clear-night'
  | 'partly-day'
  | 'partly-night'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'storm'
  | 'snow';
