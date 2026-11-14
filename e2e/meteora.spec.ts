import { test, expect, type Page } from '@playwright/test';
import { makeForecast } from '../src/test/forecast';

const PLACES = [
  { id: 1, name: 'Brest', country: 'France', admin1: 'Bretagne', latitude: 48.39, longitude: -4.49 },
  { id: 2, name: 'Bressuire', country: 'France', admin1: 'Nouvelle-Aquitaine', latitude: 46.84, longitude: -0.49 },
];

/**
 * Simule toutes les API externes : les tests ne dépendent ni du réseau ni de la météo du jour.
 * Renvoie le nombre de requêtes de prévisions complètes reçues (pour tester l'actualisation).
 */
async function mockApis(page: Page) {
  const calls = { forecast: 0 };

  await page.route('https://api.open-meteo.com/v1/forecast**', (route) => {
    const url = new URL(route.request().url());
    // Grille de pluie prévue (carte radar, 4 h à venir) : un peu de pluie partout
    if (url.searchParams.get('hourly') === 'precipitation') {
      const count = url.searchParams.get('latitude')!.split(',').length;
      const now = Math.floor(Date.now() / 3_600_000) * 3600;
      const hourly = { time: [0, 1, 2, 3, 4].map((h) => now + h * 3600), precipitation: [0, 0.4, 1.5, 3, 0.2] };
      return route.fulfill({ json: Array(count).fill({ hourly }) });
    }
    if (url.searchParams.has('hourly')) {
      calls.forecast++;
      return route.fulfill({ json: makeForecast() });
    }
    // Météo des favoris (plusieurs coordonnées en une requête)
    const count = url.searchParams.get('latitude')!.split(',').length;
    const current = { current: { temperature_2m: 14.6, weather_code: 0, is_day: 1 } };
    return route.fulfill({ json: count === 1 ? current : Array(count).fill(current) });
  });

  await page.route('https://geocoding-api.open-meteo.com/**', (route) => route.fulfill({ json: { results: PLACES } }));

  // Radar et fonds de carte : réponses vides (on vérifie l'interface, pas les images)
  await page.route('https://api.rainviewer.com/**', (route) =>
    route.fulfill({ json: { host: 'https://tilecache.rainviewer.com', radar: { past: [{ time: 1794664200, path: '/v2/radar/test' }] } } })
  );
  await page.route(/(rainviewer\.com\/.*\.png|arcgisonline\.com\/)/, (route) => route.abort());

  return calls;
}

test.beforeEach(async ({ page }) => {
  await mockApis(page);
});

test('affiche la météo de la ville par défaut', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Marseille, France' })).toBeVisible();
  await expect(page.locator('main section').first()).toContainText('11°');
  await expect(page.getByText('Pluie modérée prévue vers 17h15')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Prochaines 24 heures' })).toBeVisible();
});

test('recherche une ville au clavier', async ({ page }) => {
  await page.goto('/');
  const search = page.getByRole('combobox', { name: 'Rechercher une ville' });
  await search.fill('Bre');
  await expect(page.getByRole('option')).toHaveCount(2);
  await search.press('ArrowDown');
  await search.press('Enter');
  await expect(page.getByRole('heading', { name: 'Brest, France' })).toBeVisible();
});

test('ouvre le détail d’un jour toutes les 2 heures', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /mardi 17 novembre/ }).click();
  const details = page.getByRole('region', { name: /Prévisions toutes les 2 heures, mardi 17 novembre/i });
  await expect(details).toBeVisible();
  await expect(details.getByText('22h')).toBeVisible();
});

test('mémorise les favoris et la dernière ville après rechargement', async ({ page }) => {
  await page.goto('/');
  const search = page.getByRole('combobox', { name: 'Rechercher une ville' });
  await search.fill('Bre');
  await page.getByRole('option').first().click();
  await expect(page.getByRole('heading', { name: 'Brest, France' })).toBeVisible();

  await page.getByRole('button', { name: 'Ajouter aux favoris' }).click();
  const favorites = page.getByRole('navigation', { name: 'Villes favorites' });
  await expect(favorites.getByRole('button', { name: /^Brest/ })).toContainText('15°');

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Brest, France' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retirer des favoris' })).toBeVisible();
  await expect(favorites.getByRole('button', { name: /^Brest/ })).toBeVisible();
});

test('le bouton « Actualisé à » recharge les prévisions', async ({ page }) => {
  const calls = await mockApis(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Marseille, France' })).toBeVisible();
  const before = calls.forecast;
  await page.getByRole('button', { name: /Actualisé à/ }).click();
  await expect.poll(() => calls.forecast).toBeGreaterThan(before);
});

test('ouvre la carte radar à la demande', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Radar' }).click();
  await expect(page.getByRole('region', { name: 'Radar des précipitations' })).toBeVisible();
  await expect(page.locator('.leaflet-container')).toBeVisible();
  const slider = page.getByRole('slider', { name: 'Heure affichée sur la carte' });
  await expect(slider).toBeVisible();
  // Frise : 1 image radar observée + 4 heures de prévision
  await expect(slider).toHaveAttribute('max', '4');
  await page.getByRole('button', { name: "Mettre l'animation en pause" }).click();
  await slider.fill('4');
  await expect(page.getByText('Prévision +4 h')).toBeVisible();

  // Choix du zoom et recentrage
  const zoom = page.getByRole('group', { name: 'Niveau de zoom' });
  await expect(zoom.getByRole('button', { name: 'Région' })).toHaveAttribute('aria-pressed', 'true');
  await zoom.getByRole('button', { name: 'Ville' }).click();
  await expect(zoom.getByRole('button', { name: 'Ville' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Recentrer sur ma ville' }).click();
  await expect(zoom.getByRole('button', { name: 'Ville' })).toHaveAttribute('aria-pressed', 'true');
});

test('aucun débordement horizontal de la page', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Marseille, France' })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
