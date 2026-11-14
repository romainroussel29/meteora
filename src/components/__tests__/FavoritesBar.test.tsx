// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FavoritesBar from '../FavoritesBar';
import { favoriteKey } from '../../hooks/useFavoritesWeather';
import type { Location } from '../../types/weather';

const BREST: Location = { latitude: 48.39, longitude: -4.49, name: 'Brest, France' };
const LYON: Location = { latitude: 45.76, longitude: 4.84, name: 'Lyon, France' };

const renderBar = (favorites: Location[] = [BREST, LYON]) => {
  const props = { onSelect: vi.fn(), onRemove: vi.fn() };
  render(
    <FavoritesBar
      favorites={favorites}
      current={BREST}
      weatherByKey={{ [favoriteKey(LYON)]: { temp: 14.6, code: 0, isDay: true } }}
      {...props}
    />
  );
  return { ...props, user: userEvent.setup() };
};

describe('<FavoritesBar />', () => {
  it('ne s’affiche pas sans favori', () => {
    const { container } = render(
      <FavoritesBar favorites={[]} current={BREST} onSelect={vi.fn()} onRemove={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('affiche chaque ville et sa température quand elle est connue', () => {
    renderBar();
    expect(screen.getByRole('button', { name: /^Brest/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Lyon/ })).toHaveTextContent('15°');
  });

  it('signale la ville actuellement affichée', () => {
    renderBar();
    expect(screen.getByRole('button', { name: /^Brest/ })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: /^Lyon/ })).not.toHaveAttribute('aria-current');
  });

  it('un clic sur une ville l’affiche, la croix la retire', async () => {
    const { user, onSelect, onRemove } = renderBar();
    await user.click(screen.getByRole('button', { name: /^Lyon/ }));
    expect(onSelect).toHaveBeenCalledWith(LYON);
    await user.click(screen.getByRole('button', { name: 'Retirer Lyon, France des favoris' }));
    expect(onRemove).toHaveBeenCalledWith(LYON);
  });
});
