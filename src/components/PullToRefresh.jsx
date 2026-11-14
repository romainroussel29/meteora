import { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';

const THRESHOLD = 70; // distance (px) à atteindre pour déclencher l'actualisation
const MAX_PULL = 110;
const RESISTANCE = 0.5; // l'indicateur descend moins vite que le doigt, comme sur iOS

/**
 * "Tirer pour actualiser" : en haut de la page, glisser le doigt vers le bas
 * fait descendre une icône qui tourne ; au-delà du seuil, relâcher actualise.
 */
export default function PullToRefresh({ onRefresh, refreshing }) {
  const [pull, setPull] = useState(0);
  const gesture = useRef(null); // { x, y, locked }
  const pullRef = useRef(0);

  useEffect(() => {
    const setPullValue = (value) => {
      pullRef.current = value;
      setPull(value);
    };

    const onStart = (e) => {
      // Seulement si on est tout en haut de la page et sur un seul doigt
      gesture.current = window.scrollY <= 0 && e.touches.length === 1
        ? { x: e.touches[0].clientX, y: e.touches[0].clientY, locked: false }
        : null;
    };

    const onMove = (e) => {
      const g = gesture.current;
      if (!g) return;
      const dx = e.touches[0].clientX - g.x;
      const dy = e.touches[0].clientY - g.y;

      // On attend un vrai mouvement pour savoir s'il est vertical (sinon : défilement horizontal)
      if (!g.locked) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        if (Math.abs(dx) > Math.abs(dy) || dy < 0) {
          gesture.current = null;
          return;
        }
        g.locked = true;
      }

      if (dy <= 0) {
        setPullValue(0);
        return;
      }
      e.preventDefault(); // bloque le rebond natif pendant qu'on tire
      setPullValue(Math.min(dy * RESISTANCE, MAX_PULL));
    };

    const onEnd = () => {
      if (gesture.current && pullRef.current >= THRESHOLD) onRefresh();
      gesture.current = null;
      setPullValue(0);
    };

    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };
  }, [onRefresh]);

  const visible = pull > 0 || refreshing;
  const progress = Math.min(pull / THRESHOLD, 1);
  const offset = refreshing && pull === 0 ? 56 : pull;
  const ready = progress >= 1;

  return (
    <div
      aria-hidden={!visible}
      className="fixed left-1/2 z-50 pointer-events-none"
      style={{
        top: 'env(safe-area-inset-top)',
        transform: `translate(-50%, ${offset - 44}px)`,
        opacity: visible ? Math.max(progress, refreshing ? 1 : 0) : 0,
        transition: pull > 0 ? 'none' : 'transform 0.3s ease, opacity 0.3s ease',
      }}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg border backdrop-blur-md transition-colors ${
          ready || refreshing ? 'bg-sky-500 border-sky-300/60' : 'bg-slate-800/90 border-white/20'
        }`}
      >
        <RefreshCw
          className={`w-5 h-5 text-white ${refreshing ? 'animate-spin' : ''}`}
          style={refreshing ? undefined : { transform: `rotate(${progress * 270}deg)` }}
        />
      </div>
      <span className="sr-only" role="status">{refreshing ? 'Actualisation en cours' : ''}</span>
    </div>
  );
}
