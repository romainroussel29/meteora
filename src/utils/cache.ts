/**
 * Petit cache générique avec durée de validité (TTL), pour limiter les appels aux API.
 *
 * - Deux niveaux : mémoire (instantané) et, si `persist` est activé, localStorage
 *   (les données survivent à la fermeture de l'application).
 * - Requêtes dédoublonnées : si la même clé est demandée plusieurs fois en même temps,
 *   un seul appel réseau est effectué et son résultat est partagé.
 * - Taille limitée : au-delà de `maxEntries`, les entrées les plus anciennes sont supprimées.
 */

export interface CacheEntry<T> {
  value: T;
  /** Date du téléchargement (ms) : sert à afficher « Actualisé à… » */
  fetchedAt: number;
}

export interface CacheOptions {
  /** Nom unique, utilisé comme clé de stockage */
  name: string;
  /** Durée de validité en millisecondes */
  ttl: number;
  /** Conserver le cache dans le localStorage */
  persist?: boolean;
  /** Nombre maximum d'entrées conservées */
  maxEntries?: number;
  /** Horloge injectable (pour les tests) */
  now?: () => number;
}

const STORAGE_PREFIX = 'meteora:cache:';

export function createCache<T>({ name, ttl, persist = false, maxEntries = 50, now = Date.now }: CacheOptions) {
  const storageKey = STORAGE_PREFIX + name;
  const inFlight = new Map<string, Promise<CacheEntry<T>>>();
  const memory = new Map<string, CacheEntry<T>>(persist ? readStorage() : []);

  function readStorage(): [string, CacheEntry<T>][] {
    try {
      const raw = globalThis.localStorage?.getItem(storageKey);
      return raw ? (JSON.parse(raw) as [string, CacheEntry<T>][]) : [];
    } catch {
      return [];
    }
  }

  function writeStorage() {
    if (!persist) return;
    try {
      globalThis.localStorage?.setItem(storageKey, JSON.stringify([...memory]));
    } catch {
      // Stockage plein ou indisponible : le cache reste en mémoire, ce n'est pas bloquant
    }
  }

  const isFresh = (entry: CacheEntry<T>) => now() - entry.fetchedAt < ttl;

  /** Valeur en cache si elle est encore valide */
  function get(key: string): CacheEntry<T> | undefined {
    const entry = memory.get(key);
    return entry && isFresh(entry) ? entry : undefined;
  }

  function set(key: string, value: T, fetchedAt = now()): CacheEntry<T> {
    const entry = { value, fetchedAt };
    memory.delete(key); // réinsertion en fin de Map = entrée la plus récente
    memory.set(key, entry);
    // On supprime d'abord les entrées expirées, puis les plus anciennes si besoin
    for (const [k, e] of memory) if (!isFresh(e)) memory.delete(k);
    while (memory.size > maxEntries) memory.delete(memory.keys().next().value as string);
    writeStorage();
    return entry;
  }

  /**
   * Renvoie la valeur en cache, ou la télécharge avec `loader` puis la met en cache.
   * `force` ignore le cache (actualisation demandée par l'utilisateur).
   */
  function fetch(key: string, loader: () => Promise<T>, { force = false } = {}): Promise<CacheEntry<T>> {
    if (!force) {
      const cached = get(key);
      if (cached) return Promise.resolve(cached);
      const pending = inFlight.get(key);
      if (pending) return pending;
    }
    const request = loader()
      .then((value) => set(key, value))
      .finally(() => inFlight.delete(key));
    inFlight.set(key, request);
    return request;
  }

  /** Toutes les entrées encore valides (pour chercher, par exemple, un lieu proche) */
  function entries(): [string, CacheEntry<T>][] {
    return [...memory].filter(([, entry]) => isFresh(entry));
  }

  function clear() {
    memory.clear();
    inFlight.clear();
    try {
      globalThis.localStorage?.removeItem(storageKey);
    } catch {
      // ignoré
    }
  }

  return { get, set, fetch, entries, clear };
}

/**
 * Fait échouer une promesse partagée (cache) dès que le signal est annulé,
 * sans annuler la requête réseau elle-même, qui peut servir à d'autres appelants.
 */
export function withAbort<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(new DOMException('Requête annulée', 'AbortError'));
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(new DOMException('Requête annulée', 'AbortError'));
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort));
  });
}

/** Coordonnées arrondies (~100 m) : deux positions très proches partagent le même cache */
export const coordsKey = (latitude: number, longitude: number, digits = 3) =>
  `${latitude.toFixed(digits)},${longitude.toFixed(digits)}`;
