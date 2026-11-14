export interface Coords {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Distance « à vol d'oiseau » entre deux points GPS, en kilomètres (formule de haversine) */
export function distanceKm(a: Coords, b: Coords): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/**
 * Parmi des éléments géolocalisés, renvoie le plus proche situé à moins de `radiusKm`,
 * ou undefined s'il n'y en a aucun.
 */
export function findNearest<T>(
  target: Coords,
  items: T[],
  coordsOf: (item: T) => Coords,
  radiusKm: number
): T | undefined {
  let best: T | undefined;
  let bestDistance = radiusKm;
  for (const item of items) {
    const d = distanceKm(target, coordsOf(item));
    if (d <= bestDistance) {
      best = item;
      bestDistance = d;
    }
  }
  return best;
}

/** Inverse de coordsKey : "43.297,5.370" → { latitude, longitude } */
export function parseCoordsKey(key: string): Coords {
  const [latitude, longitude] = key.split(',').map(Number);
  return { latitude, longitude };
}
