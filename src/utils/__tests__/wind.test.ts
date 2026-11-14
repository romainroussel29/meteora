import { describe, it, expect } from 'vitest';
import { getCardinal, getWindInfo } from '../wind';

describe('getCardinal', () => {
  it('convertit les angles principaux en points cardinaux', () => {
    expect(getCardinal(0)).toBe('N');
    expect(getCardinal(90)).toBe('E');
    expect(getCardinal(180)).toBe('S');
    expect(getCardinal(270)).toBe('O');
  });

  it('arrondit au point cardinal le plus proche', () => {
    expect(getCardinal(40)).toBe('NE');
    expect(getCardinal(350)).toBe('N');
    expect(getCardinal(200)).toBe('S');
    expect(getCardinal(310)).toBe('NO');
  });

  it('gère les angles hors de 0-360', () => {
    expect(getCardinal(360)).toBe('N');
    expect(getCardinal(450)).toBe('E');
    expect(getCardinal(-90)).toBe('O');
  });
});

describe('getWindInfo', () => {
  it.each([
    [0, 'Calme'],
    [5, 'Vent faible'],
    [16, 'Vent faible'],
    [25, 'Vent modéré'],
    [45, 'Vent fort'],
    [70, 'Coup de vent'],
    [100, 'Tempête'],
  ])('%i km/h → %s', (speed, label) => {
    expect(getWindInfo(speed).label).toBe(label);
  });

  it('respecte les seuils exacts', () => {
    expect(getWindInfo(1.9).label).toBe('Calme');
    expect(getWindInfo(2).label).toBe('Vent faible');
    expect(getWindInfo(19.9).label).toBe('Vent faible');
    expect(getWindInfo(20).label).toBe('Vent modéré');
    expect(getWindInfo(39).label).toBe('Vent fort');
    expect(getWindInfo(62).label).toBe('Coup de vent');
    expect(getWindInfo(89).label).toBe('Tempête');
  });
});
