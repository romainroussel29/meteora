import { useSyncExternalStore } from 'react';

// Événement non standard (Chrome, Edge, Samsung Internet, Android) absent des types du DOM
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type InstallMode = 'prompt' | 'ios' | null;

const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

// iPadOS se présente comme un Mac : on le reconnaît à l'écran tactile
const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (/macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

// L'événement peut arriver avant le montage de React : on l'écoute dès le chargement du module
let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // on garde la main : la fenêtre s'ouvrira au clic sur notre bouton
    deferred = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    installed = true;
    notify();
  });
}

const subscribe = (callback: () => void) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};

const getMode = (): InstallMode => {
  if (installed || isStandalone()) return null;
  if (deferred) return 'prompt';
  if (isIOS()) return 'ios';
  return null; // navigateur sans installation possible (ex. Firefox sur ordinateur)
};

// Ouvre la fenêtre d'installation du navigateur ; true si l'utilisateur a accepté
async function install(): Promise<boolean> {
  if (!deferred) return false;
  const event = deferred;
  deferred = null; // l'événement ne peut servir qu'une fois
  await event.prompt();
  const { outcome } = await event.userChoice;
  notify();
  return outcome === 'accepted';
}

export default function useInstallPrompt() {
  const mode = useSyncExternalStore(subscribe, getMode, () => null);
  return { mode, install };
}
