import { describe, it, expect, vi, afterEach } from 'vitest';
import { getCurrentLocation } from '../geolocation';

const stubGeolocation = (impl) => vi.stubGlobal('navigator', { geolocation: { getCurrentPosition: impl } });
const stubFetch = (body) =>
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(body) }));

afterEach(() => vi.unstubAllGlobals());

describe('getCurrentLocation', () => {
  it('renvoie les coordonnées et le nom de la ville', async () => {
    stubGeolocation((success) => success({ coords: { latitude: 48.39, longitude: -4.49 } }));
    stubFetch({ address: { city: 'Brest', country: 'France' } });
    expect(await getCurrentLocation()).toEqual({ latitude: 48.39, longitude: -4.49, name: 'Brest, France' });
  });

  it('garde "Ma position" si le nom de la ville est introuvable', async () => {
    stubGeolocation((success) => success({ coords: { latitude: 1, longitude: 2 } }));
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('réseau')));
    expect((await getCurrentLocation()).name).toBe('Ma position');
  });

  it("échoue si l'utilisateur refuse", async () => {
    stubGeolocation((_, error) => error({ code: 1 }));
    await expect(getCurrentLocation()).rejects.toEqual({ code: 1 });
  });

  it('échoue si le navigateur ne gère pas la géolocalisation', async () => {
    vi.stubGlobal('navigator', {});
    await expect(getCurrentLocation()).rejects.toThrow('unsupported');
  });
});
