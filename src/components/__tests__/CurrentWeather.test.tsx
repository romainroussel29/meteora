// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CurrentWeather from '../CurrentWeather';
import { makeForecast } from '../../test/forecast';
import { getRainAlert } from '../../utils/rain';

const forecast = makeForecast();
const today = { min: 5, max: 13, rain: 30, sunrise: '2026-11-14T07:57', sunset: '2026-11-14T17:11' };

const renderCard = (props: Partial<Parameters<typeof CurrentWeather>[0]> = {}) => {
  const onToggleFavorite = vi.fn();
  render(
    <CurrentWeather
      data={forecast.current}
      cityName="Brest, France"
      today={today}
      rainAlert={getRainAlert(forecast.minutely_15, forecast.current.time)}
      isFavorite={false}
      onToggleFavorite={onToggleFavorite}
      {...props}
    />
  );
  return { onToggleFavorite, user: userEvent.setup() };
};

describe('<CurrentWeather />', () => {
  it('affiche la ville, la température arrondie et le temps', () => {
    renderCard();
    expect(screen.getByRole('heading', { name: 'Brest, France' })).toBeInTheDocument();
    expect(screen.getByText('11°')).toBeInTheDocument();
    expect(screen.getByText('Partiellement nuageux')).toBeInTheDocument();
    expect(screen.getByText('07:57')).toBeInTheDocument();
  });

  it('décrit le vent (vitesse, force et direction)', () => {
    renderCard();
    expect(screen.getByText('Vent faible')).toBeInTheDocument(); // 18 km/h
    expect(screen.getByText('Vient du O (250°)')).toBeInTheDocument();
  });

  it('affiche l’alerte « pluie dans l’heure »', () => {
    renderCard();
    expect(screen.getByRole('status')).toHaveTextContent('Pluie modérée prévue vers 17h15');
  });

  it('n’affiche rien quand aucune pluie n’est prévue', () => {
    renderCard({ rainAlert: { kind: 'dry', message: 'Pas de pluie prévue dans les 2 prochaines heures' } });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByText(/Pas de pluie/)).not.toBeInTheDocument();
  });

  it('le bouton étoile ajoute ou retire des favoris', async () => {
    const { user, onToggleFavorite } = renderCard();
    const star = screen.getByRole('button', { name: 'Ajouter aux favoris' });
    expect(star).toHaveAttribute('aria-pressed', 'false');
    await user.click(star);
    expect(onToggleFavorite).toHaveBeenCalledOnce();
  });

  it('indique quand la ville est déjà en favori', () => {
    renderCard({ isFavorite: true });
    expect(screen.getByRole('button', { name: 'Retirer des favoris' })).toHaveAttribute('aria-pressed', 'true');
  });
});
