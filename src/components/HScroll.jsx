import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Conteneur à défilement horizontal sans barre visible :
 * - au doigt sur mobile (natif),
 * - à la souris sur ordinateur : glisser-déposer (clic maintenu) ou flèches ◀ ▶,
 * - un fondu sur les bords indique qu'il reste du contenu à voir.
 */
export default function HScroll({ children, label }) {
  const ref = useRef(null);
  const drag = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  const updateEdges = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdges({
      start: el.scrollLeft <= 1,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1,
    });
  }, []);

  // Recalcule quand la taille change (le ResizeObserver se déclenche aussi à l'initialisation)
  useEffect(() => {
    const observer = new ResizeObserver(updateEdges);
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [updateEdges]);

  const onPointerDown = (e) => {
    if (e.pointerType !== 'mouse') return; // au doigt, le défilement natif suffit
    drag.current = { x: e.clientX, left: ref.current.scrollLeft };
  };
  const onPointerMove = (e) => {
    if (!drag.current) return;
    ref.current.scrollLeft = drag.current.left - (e.clientX - drag.current.x);
  };
  const endDrag = () => {
    drag.current = null;
  };

  const scrollByPage = (direction) => {
    const el = ref.current;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  const fade = `linear-gradient(to right, ${edges.start ? 'black' : 'transparent'}, black 12%, black 88%, ${
    edges.end ? 'black' : 'transparent'
  })`;

  const arrowClass =
    'hidden md:flex absolute top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center rounded-full bg-slate-800/90 border border-white/20 text-white hover:bg-slate-700 cursor-pointer shadow-lg';

  return (
    <div className="relative">
      <div
        ref={ref}
        role="region"
        aria-label={label}
        tabIndex={0}
        onScroll={updateEdges}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        className="overflow-x-auto scrollbar-none overscroll-x-contain select-none md:cursor-grab md:active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-sky-400 rounded-xl"
        style={{ maskImage: fade, WebkitMaskImage: fade }}
      >
        {children}
      </div>

      {!edges.start && (
        <button type="button" onClick={() => scrollByPage(-1)} aria-label="Défiler vers la gauche" className={`${arrowClass} -left-3`}>
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}
      {!edges.end && (
        <button type="button" onClick={() => scrollByPage(1)} aria-label="Défiler vers la droite" className={`${arrowClass} -right-3`}>
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
