import { describe, it, expect } from 'vitest';
import { distanceKm, findNearest, parseCoordsKey } from '../geo';

const MARSEILLE = { latitude: 43.2965, longitude: 5.3698 };
const AIX = { latitude: 43.5297, longitude: 5.4474 };
const PARIS = { latitude: 48.8566, longitude: 2.3522 };

describe('distanceKm (vol d’oiseau)', () => {
  it('vaut 0 pour un même point', () => {
    expect(distanceKm(MARSEILLE, MARSEILLE)).toBe(0);
  });

  it('calcule des distances réalistes', () => {
    expect(distanceKm(MARSEILLE, AIX)).toBeCloseTo(26.6, 0);
    expect(distanceKm(MARSEILLE, PARIS)).toBeCloseTo(661, -1);
  });

  it('est symétrique', () => {
    expect(distanceKm(MARSEILLE, PARIS)).toBeCloseTo(distanceKm(PARIS, MARSEILLE), 6);
  });
});

describe('findNearest', () => {
  const places = [
    { name: 'Paris', ...PARIS },
    { name: 'Aix', ...AIX },
    { name: 'Vieux-Port', latitude: 43.2951, longitude: 5.3742 }, // ~400 m de Marseille
    { name: 'Allauch', latitude: 43.3363, longitude: 5.4823 }, // ~10 km
  ];

  it('renvoie le lieu le plus proche dans le rayon', () => {
    expect(findNearest(MARSEILLE, places, (p) => p, 5)?.name).toBe('Vieux-Port');
  });

  it('respecte le rayon demandé', () => {
    const withoutVieuxPort = places.filter((p) => p.name !== 'Vieux-Port');
    expect(findNearest(MARSEILLE, withoutVieuxPort, (p) => p, 5)).toBeUndefined();
    expect(findNearest(MARSEILLE, withoutVieuxPort, (p) => p, 15)?.name).toBe('Allauch');
  });

  it('ne trouve rien dans une liste vide', () => {
    expect(findNearest(MARSEILLE, [], (p: typeof MARSEILLE) => p, 100)).toBeUndefined();
  });
});

describe('parseCoordsKey', () => {
  it('relit une clé de cache', () => {
    expect(parseCoordsKey('43.297,5.370')).toEqual({ latitude: 43.297, longitude: 5.37 });
  });
});
