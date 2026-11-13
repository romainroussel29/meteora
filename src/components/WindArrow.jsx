import { ArrowUp } from 'lucide-react';
import { getCardinal, getWindInfo } from '../utils/wind';

// La flèche pointe dans le sens où souffle le vent (direction d'origine + 180°).
// Sa taille et sa couleur augmentent avec la vitesse.
export default function WindArrow({ direction, speed, size = 24 }) {
  const { color } = getWindInfo(speed);
  const scale = Math.min(1 + speed / 60, 1.6);

  return (
    <ArrowUp
      className={`${color} transition-transform duration-500`}
      style={{
        width: size,
        height: size,
        transform: `rotate(${direction + 180}deg) scale(${scale})`,
      }}
      strokeWidth={2.5}
      aria-label={`Vent de ${getCardinal(direction)}, ${Math.round(speed)} km/h`}
    />
  );
}
