import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { buildForecastUrl, searchCities, reverseGeocode, fetchCurrentForMany, fetchWeather, clearApiCaches } from '../api';

const mockFetch = (body: unknown, ok = true, status = 200) =>
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok, status, json: () => Promise.resolve(body) }));

beforeEach(() => clearApiCaches());
afterEach(() => vi.unstubAllGlobals());

describe('buildForecastUrl', () => {
  it('contient les coordonnées et le fuseau auto', () => {
    const url = new URL(buildForecastUrl({ latitude: 48.85, longitude: 2.35 }));
    expect(url.searchParams.get('latitude')).toBe('48.85');
    expect(url.searchParams.get('longitude')).toBe('2.35');
    expect(url.searchParams.get('timezone')).toBe('auto');
    expect(url.searchParams.get('hourly')).toContain('wind_direction_10m');
    expect(url.searchParams.get('minutely_15')).toBe('precipitation');
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

describe('fetchCurrentForMany', () => {
  const current = (t: number, code = 0, is_day = 1) => ({ current: { temperature_2m: t, weather_code: code, is_day } });

  it('envoie toutes les coordonnées en une seule requête', async () => {
    mockFetch([current(12), current(18, 3, 0)]);
    const result = await fetchCurrentForMany([
      { latitude: 48.39, longitude: -4.49 },
      { latitude: 43.3, longitude: 5.37 },
    ]);
    const url = new URL(vi.mocked(fetch).mock.calls[0][0] as string);
    expect(url.searchParams.get('latitude')).toBe('48.39,43.3');
    expect(url.searchParams.get('longitude')).toBe('-4.49,5.37');
    expect(result).toEqual([
      { temp: 12, code: 0, isDay: true },
      { temp: 18, code: 3, isDay: false },
    ]);
  });

  it('gère la réponse sous forme d’objet quand il y a un seul lieu', async () => {
    mockFetch(current(9));
    expect(await fetchCurrentForMany([{ latitude: 1, longitude: 2 }])).toEqual([{ temp: 9, code: 0, isDay: true }]);
  });

  it('ne fait aucune requête sans favori', async () => {
    mockFetch([]);
    expect(await fetchCurrentForMany([])).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('cache des appels API', () => {
  const MARSEILLE = { latitude: 43.2965, longitude: 5.3698, name: 'Marseille, France' };

  it('ne retélécharge pas les prévisions d’une ville déjà consultée', async () => {
    mockFetch({ timezone: 'Europe/Paris' });
    await fetchWeather(MARSEILLE);
    await fetchWeather(MARSEILLE);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('retélécharge quand l’actualisation est forcée', async () => {
    mockFetch({ timezone: 'Europe/Paris' });
    await fetchWeather(MARSEILLE);
    await fetchWeather(MARSEILLE, { force: true });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('partage le cache entre deux positions très proches (~100 m)', async () => {
    mockFetch({ timezone: 'Europe/Paris' });
    await fetchWeather(MARSEILLE);
    await fetchWeather({ ...MARSEILLE, latitude: 43.29652 });
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('réutilise les prévisions d’un lieu situé à moins de 5 km', async () => {
    mockFetch({ timezone: 'Europe/Paris' });
    await fetchWeather(MARSEILLE);
    // Notre-Dame-de-la-Garde : ~1,5 km du centre de Marseille
    await fetchWeather({ latitude: 43.284, longitude: 5.3713, name: 'Notre-Dame-de-la-Garde' });
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('fait un nouvel appel au-delà de 5 km', async () => {
    mockFetch({ timezone: 'Europe/Paris' });
    await fetchWeather(MARSEILLE);
    await fetchWeather({ latitude: 43.5297, longitude: 5.4474, name: 'Aix-en-Provence' }); // ~27 km
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('réutilise la météo d’un favori proche (< 5 km)', async () => {
    mockFetch({ current: { temperature_2m: 17, weather_code: 0, is_day: 1 } });
    await fetchCurrentForMany([{ latitude: 43.2965, longitude: 5.3698 }]);
    const [nearby] = await fetchCurrentForMany([{ latitude: 43.284, longitude: 5.3713 }]);
    expect(nearby.temp).toBe(17);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('mémorise les recherches de villes (sans tenir compte des majuscules)', async () => {
    mockFetch({ results: [{ name: 'Brest' }] });
    await searchCities('Brest');
    expect(await searchCities(' brest ')).toEqual([{ name: 'Brest' }]);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('ne redemande que les favoris absents du cache', async () => {
    const current = (t: number) => ({ current: { temperature_2m: t, weather_code: 0, is_day: 1 } });
    mockFetch(current(12));
    await fetchCurrentForMany([{ latitude: 48.39, longitude: -4.49 }]);

    mockFetch(current(20));
    const result = await fetchCurrentForMany([
      { latitude: 48.39, longitude: -4.49 },
      { latitude: 43.3, longitude: 5.37 },
    ]);
    const url = new URL(vi.mocked(fetch).mock.calls[0][0] as string);
    expect(url.searchParams.get('latitude')).toBe('43.3'); // seulement le nouveau favori
    expect(result.map((w) => w.temp)).toEqual([12, 20]);
  });

  it('mémorise le nom de ville d’une position', async () => {
    mockFetch({ address: { city: 'Marseille', country: 'France' } });
    await reverseGeocode(43.2965, 5.3698);
    expect(await reverseGeocode(43.2971, 5.3702)).toBe('Marseille, France');
    expect(fetch).toHaveBeenCalledOnce();
  });
});
