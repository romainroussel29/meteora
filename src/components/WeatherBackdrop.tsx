// Pseudo-aléatoire déterministe : mêmes positions à chaque rendu (pas de "saut" visuel)
import type { CSSProperties } from 'react';
import type { WeatherScene } from '../types/weather';

const rand = (i: number, seed: number): number => {
  const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
};
const make = <T,>(count: number, fn: (i: number) => T): T[] => Array.from({ length: count }, (_, i) => fn(i));

// Particules calculées une seule fois au chargement du module
const STARS = make(40, (i) => ({
  left: `${rand(i, 1) * 100}%`,
  top: `${rand(i, 2) * 80}%`,
  size: 1 + rand(i, 3) * 1.5,
  duration: `${2 + rand(i, 4) * 4}s`,
  delay: `${-rand(i, 5) * 6}s`,
}));
const DROPS = make(36, (i) => ({
  left: `${rand(i, 6) * 105}%`,
  height: `${1.5 + rand(i, 7) * 1.5}rem`,
  duration: `${1.1 + rand(i, 8) * 0.7}s`,
  delay: `${-rand(i, 9) * 2}s`,
}));
const FLAKES = make(30, (i) => ({
  left: `${rand(i, 10) * 100}%`,
  size: 2 + rand(i, 11) * 2.5,
  opacity: 0.3 + rand(i, 12) * 0.4,
  duration: `${6 + rand(i, 13) * 6}s`,
  delay: `${-rand(i, 14) * 12}s`,
}));
const CLOUDS = make(5, (i) => ({
  top: `${rand(i, 15) * 50}%`,
  width: `${14 + rand(i, 16) * 10}rem`,
  height: `${4 + rand(i, 17) * 3}rem`,
  duration: `${70 + rand(i, 18) * 60}s`,
  delay: `${-rand(i, 19) * 130}s`,
}));

// Composition de chaque scène
interface SceneConfig {
  sun?: boolean;
  moon?: boolean;
  stars?: number;
  clouds?: number;
  cloudAlpha?: number;
  fog?: boolean;
  drops?: number;
  flakes?: number;
  lightning?: boolean;
}

const SCENES: Record<WeatherScene, SceneConfig> = {
  'clear-day': { sun: true },
  'partly-day': { sun: true, clouds: 2 },
  'clear-night': { moon: true, stars: 40 },
  'partly-night': { moon: true, stars: 25, clouds: 2 },
  cloudy: { clouds: 5, cloudAlpha: 0.08 },
  fog: { fog: true, clouds: 3 },
  drizzle: { clouds: 3, cloudAlpha: 0.06, drops: 12 },
  rain: { clouds: 4, cloudAlpha: 0.06, drops: 26 },
  storm: { clouds: 4, cloudAlpha: 0.05, drops: 36, lightning: true },
  snow: { clouds: 3, cloudAlpha: 0.08, flakes: 30 },
};

/**
 * Fond animé discret, limité à un bandeau en haut de la page, qui illustre la météo actuelle.
 * Purement décoratif : masqué aux lecteurs d'écran et sans interaction.
 */
export default function WeatherBackdrop({ scene, night = false }: { scene: WeatherScene | null; night?: boolean }) {
  const config = scene ? SCENES[scene] : null;
  if (!config) return null;

  return (
    <div aria-hidden="true" className={`wx-band pointer-events-none absolute inset-x-0 top-0 overflow-hidden ${night ? 'wx-night' : ''}`}>
      {config.sun && <div className="wx-sun" />}
      {config.moon && <div className="wx-moon" />}

      {STARS.slice(0, config.stars ?? 0).map((s, i) => (
        <span
          key={`star-${i}`}
          className="wx-star"
          style={{ left: s.left, top: s.top, width: s.size, height: s.size, animationDuration: s.duration, animationDelay: s.delay }}
        />
      ))}

      {CLOUDS.slice(0, config.clouds ?? 0).map((c, i) => (
        <span
          key={`cloud-${i}`}
          className="wx-cloud"
          style={{
            top: c.top,
            width: c.width,
            height: c.height,
            animationDuration: c.duration,
            animationDelay: c.delay,
            '--wx-cloud-alpha': config.cloudAlpha,
          } as CSSProperties}
        />
      ))}

      {config.fog && [20, 50, 75].map((top, i) => (
        <span key={`fog-${i}`} className="wx-fog" style={{ top: `${top}%`, animationDuration: `${25 + i * 10}s` }} />
      ))}

      {DROPS.slice(0, config.drops ?? 0).map((d, i) => (
        <span
          key={`drop-${i}`}
          className="wx-drop"
          style={{ left: d.left, height: d.height, animationDuration: d.duration, animationDelay: d.delay }}
        />
      ))}

      {FLAKES.slice(0, config.flakes ?? 0).map((f, i) => (
        <span
          key={`flake-${i}`}
          className="wx-flake"
          style={{
            left: f.left,
            width: f.size,
            height: f.size,
            opacity: f.opacity,
            animationDuration: f.duration,
            animationDelay: f.delay,
          }}
        />
      ))}

      {config.lightning && <div className="wx-lightning" />}
    </div>
  );
}
