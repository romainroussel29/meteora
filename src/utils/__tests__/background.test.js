import { describe, it, expect } from 'vitest';
import { getBackground, getWeatherScene } from '../background';

describe('getBackground', () => {
  it('utilise un fond par défaut sans données', () => {
    expect(getBackground(undefined)).toContain('from-slate-900');
  });

  it('est ensoleillé par ciel dégagé de jour', () => {
    expect(getBackground(0, true)).toContain('from-sky-600');
  });

  it('passe en mode nuit quand il fait nuit', () => {
    expect(getBackground(0, false)).toContain('indigo-950');
    expect(getBackground(63, false)).toContain('indigo-950');
  });

  it("garde l'ambiance orageuse même la nuit", () => {
    expect(getBackground(95, false)).toContain('purple-950');
  });

  it('distingue pluie et neige', () => {
    expect(getBackground(63, true)).toContain('blue-950');
    expect(getBackground(73, true)).not.toContain('blue-950');
  });
});

describe('getWeatherScene', () => {
  it('ne renvoie rien sans données', () => {
    expect(getWeatherScene(undefined)).toBeNull();
  });

  it.each([
    [0, true, 'clear-day'],
    [0, false, 'clear-night'],
    [2, true, 'partly-day'],
    [1, false, 'partly-night'],
    [3, true, 'cloudy'],
    [45, true, 'fog'],
    [53, true, 'drizzle'],
    [63, true, 'rain'],
    [81, false, 'rain'],
    [75, true, 'snow'],
    [86, true, 'snow'],
    [95, false, 'storm'],
  ])('code %i (jour : %s) → %s', (code, isDay, scene) => {
    expect(getWeatherScene(code, isDay)).toBe(scene);
  });
});
