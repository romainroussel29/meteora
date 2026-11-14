import { describe, it, expect } from 'vitest';
import { isStale, AUTO_REFRESH_MS } from '../../hooks/useWeather';

const HOUR = 60 * 60 * 1000;

describe('isStale (actualisation automatique)', () => {
  it("se déclenche au bout d'une heure", () => {
    expect(AUTO_REFRESH_MS).toBe(HOUR);
    expect(isStale(0, HOUR)).toBe(true);
    expect(isStale(0, 3 * HOUR)).toBe(true);
  });

  it("ne se déclenche pas avant une heure", () => {
    expect(isStale(0, HOUR - 1)).toBe(false);
    expect(isStale(1000, 1000)).toBe(false);
  });

  it("ne se déclenche pas tant qu'aucune donnée n'est chargée", () => {
    expect(isStale(undefined, 10 * HOUR)).toBe(false);
    expect(isStale(null, 10 * HOUR)).toBe(false);
  });

  it('accepte une durée personnalisée', () => {
    expect(isStale(0, 5000, 5000)).toBe(true);
    expect(isStale(0, 4999, 5000)).toBe(false);
  });
});
