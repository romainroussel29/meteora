import { describe, it, expect } from 'vitest';
import { getBackground } from '../background';

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
