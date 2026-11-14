// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ForecastList from '../ForecastList';
import { makeForecast } from '../../test/forecast';

const renderList = () => {
  const { daily, hourly } = makeForecast();
  render(<ForecastList daily={daily} hourly={hourly} />);
  return userEvent.setup();
};

describe('<ForecastList />', () => {
  it('affiche les 7 jours, aujourd’hui en premier', () => {
    renderList();
    const days = screen.getAllByRole('button', { expanded: false });
    expect(days).toHaveLength(7);
    expect(days[0]).toHaveTextContent("Aujourd'hui");
    expect(days[0]).toHaveTextContent('5°');
    expect(days[0]).toHaveTextContent('13°');
  });

  it('un clic sur un jour ouvre le détail toutes les 2 heures', async () => {
    const user = renderList();
    await user.click(screen.getAllByRole('button', { expanded: false })[3]);

    const region = screen.getByRole('region', { name: /Prévisions toutes les 2 heures, mardi 17 novembre/i });
    const hours = within(region).getAllByText(/^\d{2}h$/);
    expect(hours.map((h) => h.textContent)).toEqual([
      '00h', '02h', '04h', '06h', '08h', '10h', '12h', '14h', '16h', '18h', '20h', '22h',
    ]);
    expect(screen.getAllByRole('button', { expanded: true })).toHaveLength(1);
  });

  it('un deuxième clic (ou la croix) referme le détail', async () => {
    const user = renderList();
    const day = screen.getAllByRole('button', { expanded: false })[2];

    await user.click(day);
    expect(screen.getByRole('region')).toBeInTheDocument();
    await user.click(day);
    expect(screen.queryByRole('region')).not.toBeInTheDocument();

    await user.click(day);
    await user.click(screen.getByRole('button', { name: 'Fermer le détail' }));
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('ouvrir un autre jour remplace le détail affiché', async () => {
    const user = renderList();
    const days = screen.getAllByRole('button', { expanded: false });
    await user.click(days[1]);
    await user.click(days[4]);
    expect(screen.getAllByRole('region')).toHaveLength(1);
    expect(screen.getByRole('region', { name: /mercredi 18 novembre/i })).toBeInTheDocument();
  });
});
