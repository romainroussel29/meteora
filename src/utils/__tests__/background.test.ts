import { describe, it, expect } from 'vitest';
import { getBackground, getWeatherScene, isTwilight } from '../background';

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

describe('isTwilight (aube et crépuscule)', () => {
  // New York, 14 novembre : lever 06:41, coucher 16:38
  const sunrise = '2026-11-14T06:41';
  const sunset = '2026-11-14T16:38';
  const at = (hhmm: string) => isTwilight(`2026-11-14T${hhmm}`, sunrise, sunset);

  it('16h45, juste après le coucher du soleil, est le crépuscule', () => {
    expect(at('16:45')).toBe(true);
  });

  it('le crépuscule dure 45 minutes', () => {
    expect(at('16:38')).toBe(true);
    expect(at('17:22')).toBe(true);
    expect(at('17:23')).toBe(false);
  });

  it("l'aube commence 45 minutes avant le lever", () => {
    expect(at('05:56')).toBe(true);
    expect(at('05:55')).toBe(false);
    expect(at('06:41')).toBe(false); // le soleil est levé : c'est le jour
  });

  it("n'est ni la journée ni la nuit noire", () => {
    expect(at('12:00')).toBe(false);
    expect(at('22:00')).toBe(false);
  });

  it('sans heures de lever / coucher, pas de crépuscule', () => {
    expect(isTwilight('2026-11-14T16:45')).toBe(false);
  });

  it('donne un fond de crépuscule plutôt que de nuit', () => {
    expect(getBackground(3, false, true)).toContain('rose-900');
    expect(getBackground(0, false, true)).toContain('orange-700');
    expect(getBackground(95, false, true)).toContain('purple-950'); // l'orage reste prioritaire
  });
});
