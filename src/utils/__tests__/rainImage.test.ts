import { describe, it, expect } from 'vitest';
import { interpolateGrid, precipitationRGBA, renderPrecipitationPixels } from '../rainImage';

describe('precipitationRGBA', () => {
  it('est transparent sans pluie', () => {
    expect(precipitationRGBA(0)[3]).toBe(0);
    expect(precipitationRGBA(0.01)[3]).toBe(0);
  });

  it('devient opaque progressivement', () => {
    expect(precipitationRGBA(0.2)[3]).toBeGreaterThan(0);
    expect(precipitationRGBA(0.2)[3]).toBeLessThan(precipitationRGBA(1)[3]);
  });

  it('passe du bleu au rouge quand la pluie s’intensifie', () => {
    const [rLight, , bLight] = precipitationRGBA(0.5);
    const [rHeavy, , bHeavy] = precipitationRGBA(15);
    expect(bLight).toBeGreaterThan(rLight); // bleu
    expect(rHeavy).toBeGreaterThan(bHeavy); // rouge
  });
});

describe('interpolateGrid', () => {
  // Grille 2 × 2 : sud = [0, 2], nord = [4, 6]
  const grid = [0, 2, 4, 6];

  it('retrouve les valeurs exactes aux points de la grille', () => {
    expect(interpolateGrid(grid, 2, 0, 0)).toBe(0);
    expect(interpolateGrid(grid, 2, 1, 0)).toBe(2);
    expect(interpolateGrid(grid, 2, 0, 1)).toBe(4);
    expect(interpolateGrid(grid, 2, 1, 1)).toBe(6);
  });

  it('fait une moyenne lisse entre les points', () => {
    expect(interpolateGrid(grid, 2, 0.5, 0)).toBe(1);
    expect(interpolateGrid(grid, 2, 0.5, 0.5)).toBe(3);
  });
});

describe('renderPrecipitationPixels', () => {
  it('produit une image RGBA de la bonne taille', () => {
    expect(renderPrecipitationPixels(Array(9).fill(0), 3, 16)).toHaveLength(16 * 16 * 4);
  });

  it('colore le centre et estompe les bords', () => {
    const size = 33;
    const pixels = renderPrecipitationPixels(Array(9).fill(2), 3, size);
    const alphaAt = (x: number, y: number) => pixels[(y * size + x) * 4 + 3];
    expect(alphaAt(16, 16)).toBeGreaterThan(150); // centre : bien visible
    expect(alphaAt(0, 16)).toBe(0); // bord : totalement estompé
  });

  it('met le nord en haut de l’image', () => {
    // Pluie seulement sur la ligne nord (ligne 2)
    const size = 33;
    const pixels = renderPrecipitationPixels([0, 0, 0, 0, 0, 0, 3, 3, 3], 3, size);
    const alphaAt = (y: number) => pixels[(y * size + 16) * 4 + 3];
    expect(alphaAt(5)).toBeGreaterThan(alphaAt(28));
  });
});
