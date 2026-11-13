// localStorage peut être indisponible (navigation privée, quota…) : on ne plante jamais
export function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Pas grave : la donnée ne sera simplement pas mémorisée
  }
}
