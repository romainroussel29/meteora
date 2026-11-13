import { describe, it, expect } from 'vitest';
import { getUpcomingHours } from '../hourly';
import { makeHourly } from './fixtures';

describe('getUpcomingHours', () => {
  it("commence à l'heure courante (minutes ignorées)", () => {
    const hours = getUpcomingHours(makeHourly(), '2026-11-13T14:45');
    expect(hours[0].time).toBe('2026-11-13T14:00');
    expect(hours).toHaveLength(24);
  });

  it('respecte le pas demandé', () => {
    const hours = getUpcomingHours(makeHourly(), '2026-11-13T14:00', { step: 3 });
    expect(hours.map((h) => h.time.slice(11, 13))).toEqual(['14', '17', '20', '23', '02', '05', '08', '11']);
  });

  it('ne dépasse pas la fin des données', () => {
    expect(getUpcomingHours(makeHourly(), '2026-11-14T20:00')).toHaveLength(4);
  });

  it("repart du début si l'heure courante est introuvable", () => {
    const hours = getUpcomingHours(makeHourly(), '2030-01-01T00:00', { hours: 2 });
    expect(hours[0].time).toBe('2026-11-13T00:00');
  });

  it('indique le jour et la nuit', () => {
    const [night, , day] = getUpcomingHours(makeHourly(), '2026-11-13T06:00', { hours: 3 });
    expect(night.isDay).toBe(false);
    expect(day.isDay).toBe(true);
  });
});
