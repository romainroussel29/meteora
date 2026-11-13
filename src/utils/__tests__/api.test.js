import { describe, it, expect, vi, afterEach } from 'vitest';
import { buildForecastUrl, searchCities, reverseGeocode } from '../api';

const mockFetch = (body, ok = true, status = 200) =>
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok, status, json: () => Promise.resolve(body) }));

afterEach(() => vi.unstubAllGlobals());

describe('buildForecastUrl', () => {
  it('contient les coordonnées et le fuseau auto', () => {
    const url = new URL(buildForecastUrl({ latitude: 48.85, longitude: 2.35 }));
    expect(url.searchParams.get('latitude')).toBe('48.85');
    expect(url.searchParams.get('longitude')).toBe('2.35');
    expect(url.searchParams.get('timezone')).toBe('auto');
    expect(url.searchParams.get('hourly')).toContain('wind_direction_10m');
  });
});

describe('searchCities', () => {
  it('renvoie les résultats', async () => {
    mockFetch({ results: [{ name: 'Brest' }] });
    expect(await searchCities('Brest')).toEqual([{ name: 'Brest' }]);
  });

  it('renvoie un tableau vide sans résultat', async () => {
    mockFetch({});
    expect(await searchCities('xyzxyz')).toEqual([]);
  });

  it('échoue sur une erreur HTTP', async () => {
    mockFetch({}, false, 500);
    await expect(searchCities('Brest')).rejects.toThrow('HTTP 500');
  });
});

describe('reverseGeocode', () => {
  it('construit "Ville, Pays"', async () => {
    mockFetch({ address: { city: 'Brest', country: 'France' } });
    expect(await reverseGeocode(48.39, -4.49)).toBe('Brest, France');
  });

  it('se rabat sur le village', async () => {
    mockFetch({ address: { village: 'Plouzané', country: 'France' } });
    expect(await reverseGeocode(48.38, -4.62)).toBe('Plouzané, France');
  });

  it("renvoie null si aucun nom n'est trouvé", async () => {
    mockFetch({ address: {} });
    expect(await reverseGeocode(0, 0)).toBeNull();
  });
});
