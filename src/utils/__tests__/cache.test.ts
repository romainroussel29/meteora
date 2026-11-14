// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCache, withAbort, coordsKey } from '../cache';

let clock = 0;
const now = () => clock;
const MIN = 60 * 1000;

beforeEach(() => {
  clock = 1_000_000;
  localStorage.clear();
});

describe('createCache', () => {
  it('renvoie la valeur tant qu’elle est valide, puis l’oublie', () => {
    const cache = createCache<number>({ name: 't1', ttl: 10 * MIN, now });
    cache.set('a', 42);
    expect(cache.get('a')?.value).toBe(42);
    clock += 10 * MIN - 1;
    expect(cache.get('a')?.value).toBe(42);
    clock += 1;
    expect(cache.get('a')).toBeUndefined();
  });

  it('ne fait qu’un appel réseau tant que la donnée est en cache', async () => {
    const cache = createCache<string>({ name: 't2', ttl: 10 * MIN, now });
    const loader = vi.fn().mockResolvedValue('météo');
    await cache.fetch('marseille', loader);
    await cache.fetch('marseille', loader);
    expect(loader).toHaveBeenCalledOnce();
  });

  it('retélécharge une fois la durée de validité dépassée', async () => {
    const cache = createCache<string>({ name: 't3', ttl: 10 * MIN, now });
    const loader = vi.fn().mockResolvedValueOnce('ancien').mockResolvedValueOnce('nouveau');
    await cache.fetch('k', loader);
    clock += 11 * MIN;
    expect((await cache.fetch('k', loader)).value).toBe('nouveau');
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('dédoublonne les requêtes simultanées', async () => {
    const cache = createCache<string>({ name: 't4', ttl: 10 * MIN, now });
    const loader = vi.fn(() => new Promise<string>((r) => setTimeout(() => r('ok'), 10)));
    const [a, b, c] = await Promise.all([cache.fetch('k', loader), cache.fetch('k', loader), cache.fetch('k', loader)]);
    expect(loader).toHaveBeenCalledOnce();
    expect([a.value, b.value, c.value]).toEqual(['ok', 'ok', 'ok']);
  });

  it('« force » ignore le cache (actualisation manuelle)', async () => {
    const cache = createCache<number>({ name: 't5', ttl: 10 * MIN, now });
    const loader = vi.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2);
    await cache.fetch('k', loader);
    expect((await cache.fetch('k', loader, { force: true })).value).toBe(2);
  });

  it('conserve la date de téléchargement d’origine', async () => {
    const cache = createCache<number>({ name: 't6', ttl: 10 * MIN, now });
    await cache.fetch('k', async () => 1);
    const downloadedAt = clock;
    clock += 3 * MIN;
    expect((await cache.fetch('k', async () => 2)).fetchedAt).toBe(downloadedAt);
  });

  it('ne met pas en cache une erreur', async () => {
    const cache = createCache<number>({ name: 't7', ttl: 10 * MIN, now });
    await expect(cache.fetch('k', () => Promise.reject(new Error('réseau')))).rejects.toThrow('réseau');
    expect((await cache.fetch('k', async () => 5)).value).toBe(5);
  });

  it('persiste dans le localStorage et se recharge à l’ouverture', () => {
    const first = createCache<string>({ name: 'persist', ttl: 10 * MIN, persist: true, now });
    first.set('k', 'sauvegardé');
    const reopened = createCache<string>({ name: 'persist', ttl: 10 * MIN, persist: true, now });
    expect(reopened.get('k')?.value).toBe('sauvegardé');
  });

  it('limite le nombre d’entrées en supprimant les plus anciennes', () => {
    const cache = createCache<number>({ name: 't8', ttl: 10 * MIN, maxEntries: 2, now });
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')?.value).toBe(2);
    expect(cache.get('c')?.value).toBe(3);
  });

  it('clear() vide la mémoire et le stockage', () => {
    const cache = createCache<number>({ name: 't9', ttl: 10 * MIN, persist: true, now });
    cache.set('a', 1);
    cache.clear();
    expect(cache.get('a')).toBeUndefined();
    expect(localStorage.getItem('meteora:cache:t9')).toBeNull();
  });
});

describe('withAbort', () => {
  it('rejette dès que le signal est annulé', async () => {
    const controller = new AbortController();
    const pending = withAbort(new Promise(() => {}), controller.signal);
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('laisse passer le résultat sinon', async () => {
    expect(await withAbort(Promise.resolve(3), new AbortController().signal)).toBe(3);
  });
});

describe('coordsKey', () => {
  it('arrondit les coordonnées pour partager le cache entre positions voisines', () => {
    expect(coordsKey(43.29612, 5.36981)).toBe(coordsKey(43.29638, 5.36969));
    expect(coordsKey(43.2965, 5.3698, 2)).toBe('43.30,5.37');
  });
});
