import { describe, it, expect } from 'vitest';
import { getWeatherInfo } from '../weatherIcons';

describe('getWeatherInfo', () => {
  it.each([
    [0, 'Ciel dégagé'],
    [2, 'Partiellement nuageux'],
    [3, 'Couvert'],
    [45, 'Brouillard'],
    [53, 'Bruine'],
    [63, 'Pluie'],
    [73, 'Neige'],
    [81, 'Averses'],
    [86, 'Averses de neige'],
    [95, 'Orage'],
  ])('code WMO %i → %s', (code, label) => {
    expect(getWeatherInfo(code).label).toBe(label);
  });

  it('renvoie un libellé par défaut pour un code inconnu', () => {
    expect(getWeatherInfo(49).label).toBe('Variable');
  });

  it('utilise une icône différente la nuit par ciel dégagé', () => {
    const day = getWeatherInfo(0, 'w-6', true).icon;
    const night = getWeatherInfo(0, 'w-6', false).icon;
    expect(day.type).not.toBe(night.type);
  });

  it("transmet la classe CSS à l'icône", () => {
    expect(getWeatherInfo(63, 'w-10 h-10').icon.props.className).toContain('w-10 h-10');
  });
});
