import { describe, it, expect } from 'vitest';
import { summarizePeriod, getHalfDays } from '../halfDays';
import { makeHourly } from './fixtures';

describe('summarizePeriod', () => {
  it('fait la moyenne des températures de la période', () => {
    // Heures 6 à 11 → températures 6..11 → moyenne 8,5
    expect(summarizePeriod(makeHourly(), '2026-11-13', 6, 12).temp).toBe(8.5);
  });

  it('ne mélange pas les jours', () => {
    // Le 14 à 6h correspond à l'index 30
    expect(summarizePeriod(makeHourly(), '2026-11-14', 6, 7).temp).toBe(30);
  });

  it('prend le risque de pluie maximal', () => {
    const hourly = makeHourly();
    hourly.precipitation_probability[9] = 80;
    expect(summarizePeriod(hourly, '2026-11-13', 6, 12).rain).toBe(80);
  });

  it("garde le vent de l'heure la plus venteuse", () => {
    const hourly = makeHourly();
    hourly.wind_speed_10m[8] = 50;
    hourly.wind_direction_10m[8] = 270;
    const { windSpeed, windDir } = summarizePeriod(hourly, '2026-11-13', 6, 12);
    expect(windSpeed).toBe(50);
    expect(windDir).toBe(270);
  });

  it('choisit le temps le plus fréquent', () => {
    const hourly = makeHourly();
    [6, 7, 8, 9].forEach((i) => (hourly.weather_code[i] = 63)); // 4 h de pluie sur 6
    expect(summarizePeriod(hourly, '2026-11-13', 6, 12).code).toBe(63);
  });

  it('départage une égalité par le temps le plus marqué', () => {
    const hourly = makeHourly();
    [6, 7, 8].forEach((i) => (hourly.weather_code[i] = 95)); // 3 h d'orage, 3 h de soleil
    expect(summarizePeriod(hourly, '2026-11-13', 6, 12).code).toBe(95);
  });

  it('renvoie null pour une date absente', () => {
    expect(summarizePeriod(makeHourly(), '2030-01-01', 6, 12)).toBeNull();
  });
});

describe('getHalfDays', () => {
  it('renvoie le matin puis l’après-midi', () => {
    const [morning, afternoon] = getHalfDays(makeHourly(), '2026-11-13');
    expect(morning.label).toBe('Matin');
    expect(afternoon.label).toBe('Après-midi');
    expect(afternoon.temp).toBe(14.5); // heures 12 à 17
  });
});
