import { describe, it, expect } from 'vitest';
import { getRainAlert } from '../rain';

// 8 quarts d'heure à partir de 16h45
const TIMES = ['16:45', '17:00', '17:15', '17:30', '17:45', '18:00', '18:15', '18:30'].map(
  (t) => `2026-11-14T${t}`
);
const minutely = (precipitation: number[]) => ({ time: TIMES, precipitation });

describe('getRainAlert (pluie dans les 2 prochaines heures)', () => {
  it("annonce l'absence de pluie", () => {
    expect(getRainAlert(minutely([0, 0, 0, 0, 0, 0, 0, 0]), '2026-11-14T16:45')).toEqual({
      kind: 'dry',
      message: 'Pas de pluie prévue dans les 2 prochaines heures',
    });
  });

  it("annonce l'heure de début de la pluie", () => {
    const alert = getRainAlert(minutely([0, 0, 0.3, 0.4, 0, 0, 0, 0]), '2026-11-14T16:45');
    expect(alert).toEqual({ kind: 'soon', message: 'Pluie faible prévue vers 17h15' });
  });

  it("qualifie l'intensité selon le pic de pluie", () => {
    expect(getRainAlert(minutely([0, 0.2, 1.2, 0, 0, 0, 0, 0]), '2026-11-14T16:45')?.message).toBe(
      'Pluie modérée prévue vers 17h00'
    );
    expect(getRainAlert(minutely([0, 0, 0, 3, 0, 0, 0, 0]), '2026-11-14T16:45')?.message).toBe(
      'Pluie forte prévue vers 17h30'
    );
  });

  it("annonce la fin d'une pluie en cours", () => {
    expect(getRainAlert(minutely([0.5, 0.4, 0.2, 0, 0, 0, 0, 0]), '2026-11-14T16:45')).toEqual({
      kind: 'raining',
      message: 'Pluie en cours, fin prévue vers 17h30',
    });
  });

  it('gère une pluie qui dure toute la période', () => {
    expect(getRainAlert(minutely([1, 1, 1, 1, 1, 1, 1, 1]), '2026-11-14T16:45')?.message).toBe(
      'Pluie en cours pour les 2 prochaines heures'
    );
  });

  it('ignore les quarts d’heure déjà passés', () => {
    // Il a plu à 16h45, mais il est 17h00 : plus de pluie ensuite
    expect(getRainAlert(minutely([2, 0, 0, 0, 0, 0, 0, 0]), '2026-11-14T17:00')?.kind).toBe('dry');
  });

  it('ignore les traces de pluie sous le seuil (0,1 mm)', () => {
    expect(getRainAlert(minutely([0.05, 0.05, 0, 0, 0, 0, 0, 0]), '2026-11-14T16:45')?.kind).toBe('dry');
  });

  it('renvoie null sans données', () => {
    expect(getRainAlert(undefined, '2026-11-14T16:45')).toBeNull();
    expect(getRainAlert({ time: [], precipitation: [] }, '2026-11-14T16:45')).toBeNull();
  });
});

