// Pseudo-aléatoire déterministe : mêmes positions à chaque rendu (pas de "saut" visuel)
const rand = (i, seed) => {
  const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
};
const make = (count, fn) => Array.from({ length: count }, (_, i) => fn(i));

// Particules calculées une seule fois au chargement du module
const STARS = make(60, (i) => ({
  left: `${rand(i, 1) * 100}%`,
  top: `${rand(i, 2) * 70}%`,
  size: 1 + rand(i, 3) * 1.5,
  duration: `${2 + rand(i, 4) * 4}s`,
  delay: `${-rand(i, 5) * 6}s`,
}));
const DROPS = make(90, (i) => ({
  left: `${rand(i, 6) * 110}%`,
  height: `${8 + rand(i, 7) * 10}vh`,
  duration: `${0.6 + rand(i, 8) * 0.5}s`,
  delay: `${-rand(i, 9) * 2}s`,
}));
const FLAKES = make(55, (i) => ({
  left: `${rand(i, 10) * 100}%`,
  size: 2 + rand(i, 11) * 4,
  opacity: 0.4 + rand(i, 12) * 0.5,
  duration: `${8 + rand(i, 13) * 10}s`,
  delay: `${-rand(i, 14) * 18}s`,
}));
const CLOUDS = make(7, (i) => ({
  top: `${rand(i, 15) * 60}%`,
  width: `${30 + rand(i, 16) * 30}vmax`,
  height: `${10 + rand(i, 17) * 8}vmax`,
  duration: `${70 + rand(i, 18) * 60}s`,
  delay: `${-rand(i, 19) * 130}s`,
}));

// Composition de chaque scène
const SCENES = {
  'clear-day': { sun: true },
  'partly-day': { sun: true, clouds: 3 },
  'clear-night': { moon: true, stars: 60 },
  'partly-night': { moon: true, stars: 35, clouds: 3 },
  cloudy: { clouds: 7, cloudAlpha: 0.1 },
  fog: { fog: true, clouds: 4 },
  drizzle: { clouds: 5, cloudAlpha: 0.07, drops: 30 },
  rain: { clouds: 6, cloudAlpha: 0.07, drops: 75 },
  storm: { clouds: 6, cloudAlpha: 0.06, drops: 90, lightning: true },
  snow: { clouds: 5, cloudAlpha: 0.1, flakes: 55 },
};

/**
 * Fond animé (fixe, derrière le contenu) qui illustre la météo actuelle.
 * Purement décoratif : masqué aux lecteurs d'écran et sans interaction.
 */
export default function WeatherBackdrop({ scene }) {
  const config = SCENES[scene];
  if (!config) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
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
          }}
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
