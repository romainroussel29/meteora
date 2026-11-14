import { lazy, Suspense, useEffect, useRef } from 'react';
import { Radar, X } from 'lucide-react';

// Leaflet (~150 Ko) n'est téléchargé que si l'utilisateur ouvre le radar
const RadarMap = lazy(() => import('./RadarMap'));

interface RadarPanelProps {
  latitude: number;
  longitude: number;
  onClose: () => void;
}

/** Panneau radar, ouvert depuis le bouton « Radar » de la carte météo actuelle */
export default function RadarPanel({ latitude, longitude, onClose }: RadarPanelProps) {
  const ref = useRef<HTMLElement>(null);

  // À l'ouverture, on fait défiler juste assez pour voir la carte
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    ref.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
  }, []);

  return (
    <section
      ref={ref}
      id="radar-panel"
      aria-label="Radar des précipitations"
      className="scroll-mb-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-3 md:p-5 text-white"
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Radar className="w-4 h-4 text-sky-300" aria-hidden="true" />
          Radar des précipitations
          <span className="font-normal text-slate-300">· −2 h → +4 h</span>
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer le radar"
          className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <Suspense fallback={<div className="h-72 md:h-96 rounded-2xl bg-white/5 animate-pulse" />}>
        <RadarMap latitude={latitude} longitude={longitude} />
      </Suspense>
    </section>
  );
}
