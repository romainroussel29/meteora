import { useState } from 'react';
import { Download, Share, SquarePlus, X } from 'lucide-react';
import useInstallPrompt from '../hooks/useInstallPrompt';

// Bouton "Installer l'app" : fenêtre d'installation native, ou marche à suivre sur iPhone/iPad
export default function InstallButton() {
  const { mode, install } = useInstallPrompt();
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  if (!mode) return null;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => (mode === 'prompt' ? install() : setShowIOSHelp((o) => !o))}
        aria-expanded={mode === 'ios' ? showIOSHelp : undefined}
        className="flex items-center gap-1.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 px-3 py-1 text-xs font-medium text-white transition cursor-pointer"
      >
        <Download className="w-3.5 h-3.5" />
        Installer l'app
      </button>

      {mode === 'ios' && showIOSHelp && (
        <div
          role="dialog"
          aria-label="Installer Meteora"
          className="absolute z-50 left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 mt-2 w-64 rounded-2xl bg-slate-900/95 border border-white/15 p-4 text-left text-sm text-slate-100 shadow-xl"
        >
          <button
            type="button"
            onClick={() => setShowIOSHelp(false)}
            aria-label="Fermer"
            className="absolute top-2 right-2 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <p className="font-semibold mb-2">Installer sur iPhone / iPad</p>
          <ol className="space-y-2">
            <li className="flex items-start gap-2">
              <span>1.</span>
              <span>
                Touchez <Share className="inline w-4 h-4 -mt-0.5 text-sky-300" /> <strong>Partager</strong> dans la barre du navigateur
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span>2.</span>
              <span>
                Choisissez <SquarePlus className="inline w-4 h-4 -mt-0.5 text-sky-300" /> <strong>Sur l'écran d'accueil</strong>
              </span>
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}
