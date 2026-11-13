import { useSyncExternalStore } from 'react';

// Pas d'affichage des heures selon la largeur d'écran :
// 1 h sur grand écran, 2 h sur tablette, 3 h sur mobile → toujours 24 h sans défilement.
const QUERIES = ['(min-width: 1024px)', '(min-width: 640px)'];

const subscribe = (callback) => {
  const mqs = QUERIES.map((q) => window.matchMedia(q));
  mqs.forEach((mq) => mq.addEventListener('change', callback));
  return () => mqs.forEach((mq) => mq.removeEventListener('change', callback));
};

const getStep = () => {
  if (window.matchMedia(QUERIES[0]).matches) return 1;
  if (window.matchMedia(QUERIES[1]).matches) return 2;
  return 3;
};

export default function useHourStep() {
  return useSyncExternalStore(subscribe, getStep, () => 1);
}
