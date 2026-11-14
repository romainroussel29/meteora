import type { Minutely15Weather } from '../types/weather';

/** Au-delà de ce cumul sur un quart d'heure (mm), on considère qu'il pleut */
export const RAIN_THRESHOLD_MM = 0.1;

export type RainAlertKind = 'dry' | 'soon' | 'raining';

export interface RainAlert {
  kind: RainAlertKind;
  message: string;
}

// "2026-11-14T17:15" → "17h15"
const formatTime = (iso: string) => iso.slice(11, 16).replace(':', 'h');

const intensity = (mm: number) => {
  if (mm < 0.5) return 'faible';
  if (mm < 2) return 'modérée';
  return 'forte';
};

/**
 * Résume la pluie des 2 prochaines heures à partir des données au quart d'heure :
 * - "Pluie modérée prévue vers 17h15"
 * - "Pluie en cours, fin prévue vers 18h00"
 * - "Pas de pluie prévue dans les 2 prochaines heures"
 * Renvoie null si les données sont absentes.
 */
export function getRainAlert(
  minutely: Minutely15Weather | undefined,
  currentTime: string
): RainAlert | null {
  if (!minutely || minutely.time.length === 0) return null;

  // On ne garde que les quarts d'heure à partir de maintenant
  const now = currentTime.slice(0, 16);
  const slots = minutely.time
    .map((time, i) => ({ time, mm: minutely.precipitation[i] ?? 0 }))
    .filter((s) => s.time >= now);
  if (slots.length === 0) return null;

  const isWet = (mm: number) => mm >= RAIN_THRESHOLD_MM;

  if (isWet(slots[0].mm)) {
    const end = slots.find((s) => !isWet(s.mm));
    return {
      kind: 'raining',
      message: end
        ? `Pluie en cours, fin prévue vers ${formatTime(end.time)}`
        : 'Pluie en cours pour les 2 prochaines heures',
    };
  }

  const first = slots.find((s) => isWet(s.mm));
  if (!first) {
    return { kind: 'dry', message: 'Pas de pluie prévue dans les 2 prochaines heures' };
  }

  const peak = Math.max(...slots.map((s) => s.mm));
  return { kind: 'soon', message: `Pluie ${intensity(peak)} prévue vers ${formatTime(first.time)}` };
}
