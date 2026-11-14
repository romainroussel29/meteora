// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBar from '../SearchBar';
import type { Place } from '../../types/weather';

const PLACES: Place[] = [
  { id: 1, name: 'Brest', country: 'France', admin1: 'Bretagne', latitude: 48.39, longitude: -4.49 },
  { id: 2, name: 'Brest', country: 'Biélorussie', latitude: 52.09, longitude: 23.69 },
  { id: 3, name: 'Bressuire', country: 'France', latitude: 46.84, longitude: -0.49 },
];

const searchCities = vi.fn();
vi.mock('../../utils/api', () => ({ searchCities: (...args: unknown[]) => searchCities(...args) }));

const setup = () => {
  const props = {
    onSearch: vi.fn().mockResolvedValue(true),
    onSelectSuggestion: vi.fn(),
    onGeolocate: vi.fn(),
    loading: false,
  };
  render(<SearchBar {...props} />);
  return { ...props, user: userEvent.setup(), input: screen.getByRole('combobox', { name: 'Rechercher une ville' }) };
};

describe('<SearchBar />', () => {
  beforeEach(() => {
    searchCities.mockReset();
    searchCities.mockResolvedValue(PLACES);
  });

  it('affiche les suggestions après la saisie (avec debounce)', async () => {
    const { user, input } = setup();
    await user.type(input, 'Bre');

    const options = await screen.findAllByRole('option');
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent('Brest, Bretagne');
    // Une seule requête malgré les 3 frappes, grâce au debounce
    expect(searchCities).toHaveBeenCalledTimes(1);
    expect(searchCities).toHaveBeenCalledWith('Bre', expect.anything());
  });

  it('ne cherche rien en dessous de 2 caractères', async () => {
    const { user, input } = setup();
    await user.type(input, 'B');
    await new Promise((r) => setTimeout(r, 400));
    expect(searchCities).not.toHaveBeenCalled();
  });

  it('se navigue au clavier : ↓ ↓ puis Entrée choisit la 2e ville', async () => {
    const { user, input, onSelectSuggestion } = setup();
    await user.type(input, 'Bre');
    await screen.findAllByRole('option');

    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(screen.getAllByRole('option')[1]).toHaveAttribute('aria-selected', 'true');
    expect(input).toHaveAttribute('aria-activedescendant', screen.getAllByRole('option')[1].id);

    await user.keyboard('{Enter}');
    expect(onSelectSuggestion).toHaveBeenCalledWith(PLACES[1]);
    expect(input).toHaveValue('');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('↑ depuis le début revient à la dernière suggestion', async () => {
    const { user, input } = setup();
    await user.type(input, 'Bre');
    await screen.findAllByRole('option');
    await user.keyboard('{ArrowUp}');
    expect(screen.getAllByRole('option')[2]).toHaveAttribute('aria-selected', 'true');
  });

  it('Échap ferme la liste', async () => {
    const { user, input } = setup();
    await user.type(input, 'Bre');
    await screen.findAllByRole('option');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('un clic sur une suggestion la sélectionne', async () => {
    const { user, input, onSelectSuggestion } = setup();
    await user.type(input, 'Bre');
    await user.click((await screen.findAllByRole('option'))[2]);
    expect(onSelectSuggestion).toHaveBeenCalledWith(PLACES[2]);
  });

  it('lance une recherche libre quand aucune suggestion n’est affichée', async () => {
    searchCities.mockResolvedValue([]);
    const { user, input, onSearch } = setup();
    await user.type(input, 'Xyzville{Enter}');
    expect(onSearch).toHaveBeenCalledWith('Xyzville');
  });

  it('le bouton de position appelle la géolocalisation', async () => {
    const { user, onGeolocate } = setup();
    await user.click(screen.getByRole('button', { name: 'Utiliser ma position' }));
    expect(onGeolocate).toHaveBeenCalledOnce();
  });
});
