import { reverseGeocode } from './api';

const OPTIONS = {
  timeout: 10000,
  maximumAge: 10 * 60 * 1000, // réutilise une position de moins de 10 min : ouverture plus rapide
};

/**
 * Récupère la position de l'utilisateur et le nom de la ville correspondante.
 * Rejette si la géolocalisation est indisponible ou refusée.
 */
export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('unsupported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        // On essaie de retrouver le nom de la ville ; sinon on garde "Ma position"
        const name = await reverseGeocode(coords.latitude, coords.longitude).catch(() => null);
        resolve({ latitude: coords.latitude, longitude: coords.longitude, name: name ?? 'Ma position' });
      },
      reject,
      OPTIONS
    );
  });
}
