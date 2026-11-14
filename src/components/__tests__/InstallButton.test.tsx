// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InstallButton from '../InstallButton';

const setUserAgent = (ua: string) => vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(ua);

// Simule l'événement envoyé par Chrome quand l'app est installable
const fireInstallPrompt = (outcome: 'accepted' | 'dismissed' = 'accepted') => {
  const event = Object.assign(new Event('beforeinstallprompt'), {
    prompt: vi.fn().mockResolvedValue(undefined),
    userChoice: Promise.resolve({ outcome }),
  });
  act(() => {
    window.dispatchEvent(event);
  });
  return event;
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('<InstallButton />', () => {
  it('reste caché si le navigateur ne propose pas l’installation', () => {
    setUserAgent('Mozilla/5.0 (Windows NT 10.0; rv:140.0) Gecko/20100101 Firefox/140.0');
    const { container } = render(<InstallButton />);
    expect(container).toBeEmptyDOMElement();
  });

  it('ouvre la fenêtre d’installation du navigateur au clic', async () => {
    setUserAgent('Mozilla/5.0 (Linux; Android 14) Chrome/140.0');
    const user = userEvent.setup();
    render(<InstallButton />);
    const event = fireInstallPrompt();

    await user.click(screen.getByRole('button', { name: /installer l'app/i }));
    expect(event.prompt).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: /installer l'app/i })).not.toBeInTheDocument();
  });

  it('affiche la marche à suivre sur iPhone', async () => {
    setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Safari/604.1');
    const user = userEvent.setup();
    render(<InstallButton />);

    await user.click(screen.getByRole('button', { name: /installer l'app/i }));
    expect(screen.getByRole('dialog')).toHaveTextContent("Sur l'écran d'accueil");

    await user.click(screen.getByRole('button', { name: 'Fermer' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
