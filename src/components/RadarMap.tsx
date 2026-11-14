import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Pane, ImageOverlay, useMap, useMapEvents } from 'react-leaflet';
import type { LatLngBoundsExpression } from 'leaflet';
import { LocateFixed, Pause, Play } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { createCache, withAbort } from '../utils/cache';
import { fetchPrecipitationGrid, type PrecipitationGrid } from '../utils/api';
import { renderPrecipitationPixels } from '../utils/rainImage';

const RAINVIEWER_URL = 'https://api.rainviewer.com/public/weather-maps.json';
// Fond de carte sombre Esri (utilisable sans clé d'API, avec attribution)
const ESRI_DARK = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
const ESRI_LABELS = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}';
const FRAME_MS = 700;

interface RadarFrame {
  time: number; // timestamp Unix (secondes)
  path: string;
}

interface RainViewerResponse {
  host: string;
  radar: { past: RadarFrame[] };
}

// Liste des images radar : RainViewer en publie une nouvelle toutes les 10 min,
// on la garde 5 min en mémoire (rouvrir le radar ne refait pas d'appel)
const radarCache = createCache<RainViewerResponse>({ name: 'radar', ttl: 5 * 60 * 1000 });

const loadRadar = () =>
  radarCache.fetch('frames', async () => {
    const res = await fetch(RAINVIEWER_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<RainViewerResponse>;
  });

const formatTime = (unix: number) =>
  new Date(unix * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

/**
 * Images lissées de la pluie prévue (une par heure), à partir de la grille de points.
 * Calculées une seule fois par grille, pour une animation fluide.
 */
function buildForecastImages(grid: PrecipitationGrid): { urls: string[]; bounds: LatLngBoundsExpression } | null {
  const n = Math.round(Math.sqrt(grid.cells.length));
  const canvas = document.createElement('canvas');
  const size = 256;
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx || n < 2) return null;

  const urls = grid.times.map((_, hour) => {
    const values = grid.cells.map((c) => c.mm[hour] ?? 0);
    const image = ctx.createImageData(size, size);
    image.data.set(renderPrecipitationPixels(values, n, size));
    ctx.putImageData(image, 0, 0);
    return canvas.toDataURL('image/png');
  });

  // Les points sont rangés du sud-ouest au nord-est
  const sw = grid.cells[0];
  const ne = grid.cells[grid.cells.length - 1];
  return { urls, bounds: [[sw.latitude, sw.longitude], [ne.latitude, ne.longitude]] };
}

const isAbort = (err: unknown) => err instanceof DOMException && err.name === 'AbortError';

/** Une image de la frise : radar observé (passé) ou prévision du modèle (futur) */
type Frame =
  | { kind: 'observed'; time: number; path: string }
  | { kind: 'forecast'; time: number; hour: number };

const LEGEND = [
  { label: 'Faible', color: '#7dd3fc' },
  { label: 'Modérée', color: '#0ea5e9' },
  { label: 'Forte', color: '#facc15' },
  { label: 'Très forte', color: '#dc2626' },
];

/** Niveaux de zoom proposés */
const ZOOM_PRESETS = [
  { label: 'Ville', zoom: 9 },
  { label: 'Région', zoom: 7 },
  { label: 'Pays', zoom: 5 },
] as const;
const DEFAULT_ZOOM = 7;

/**
 * Pilote la carte depuis l'extérieur (boutons « Recentrer » et niveaux de zoom),
 * et remonte le zoom courant quand l'utilisateur zoome lui-même (pincement, double-clic).
 */
function MapController({
  latitude,
  longitude,
  target,
  onZoomChange,
}: {
  latitude: number;
  longitude: number;
  target: { zoom: number; token: number };
  onZoomChange: (zoom: number) => void;
}) {
  const map = useMap();
  useMapEvents({ zoomend: () => onZoomChange(map.getZoom()) });
  const isFirstRender = useRef(true);

  // Se déplace à chaque demande (bouton) ou changement de ville, mais pas au premier affichage
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) map.setView([latitude, longitude], target.zoom);
    else map.flyTo([latitude, longitude], target.zoom, { duration: 0.6 });
  }, [map, latitude, longitude, target]);

  return null;
}

interface RadarMapProps {
  latitude: number;
  longitude: number;
}

/**
 * Carte de la pluie : radar observé sur les 2 dernières heures (RainViewer),
 * puis prévision des 4 prochaines heures (modèle Open-Meteo sur une grille de points).
 * Chargée à la demande (React.lazy) pour ne pas alourdir le démarrage de l'application.
 */
export default function RadarMap({ latitude, longitude }: RadarMapProps) {
  const [radar, setRadar] = useState<{ host: string; frames: RadarFrame[] } | null>(null);
  const [grid, setGrid] = useState<PrecipitationGrid | null>(null);
  const [index, setIndex] = useState<number | null>(null); // null = « maintenant »
  const [playing, setPlaying] = useState(true);
  const [errors, setErrors] = useState({ radar: false, grid: false });
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  // Demande de déplacement de la carte (le token change à chaque clic)
  const [target, setTarget] = useState({ zoom: DEFAULT_ZOOM, token: 0 });
  const goTo = (z: number) => setTarget((t) => ({ zoom: z, token: t.token + 1 }));

  useEffect(() => {
    const controller = new AbortController();
    withAbort(loadRadar(), controller.signal)
      .then(({ value: data }) => setRadar({ host: data.host, frames: data.radar.past }))
      .catch((err: unknown) => {
        if (!isAbort(err)) setErrors((e) => ({ ...e, radar: true }));
      });
    fetchPrecipitationGrid({ latitude, longitude }, controller.signal)
      .then(setGrid)
      .catch((err: unknown) => {
        if (!isAbort(err)) setErrors((e) => ({ ...e, grid: true }));
      });
    return () => controller.abort();
  }, [latitude, longitude]);

  // Frise chronologique : radar observé (passé) puis prévision (futur)
  const frames: Frame[] = [
    ...(radar?.frames ?? []).map((f): Frame => ({ kind: 'observed', time: f.time, path: f.path })),
    ...(grid?.times ?? []).map((time, hour): Frame => ({ kind: 'forecast', time, hour })),
  ];
  const nowIndex = Math.max((radar?.frames.length ?? 0) - 1, 0);
  const currentIndex = Math.min(index ?? nowIndex, Math.max(frames.length - 1, 0));
  const current: Frame | undefined = frames[currentIndex];
  const frameCount = frames.length;

  // Animation : toute la frise défile en boucle
  useEffect(() => {
    if (!playing || frameCount < 2) return;
    const id = setInterval(() => setIndex((i) => ((i ?? nowIndex) + 1) % frameCount), FRAME_MS);
    return () => clearInterval(id);
  }, [playing, frameCount, nowIndex]);

  // Images de prévision (calculées une fois par grille)
  const forecastImages = useMemo(() => (grid ? buildForecastImages(grid) : null), [grid]);

  if (errors.radar && errors.grid) {
    return <p className="text-sm text-slate-300 py-6 text-center">Le radar est momentanément indisponible.</p>;
  }

  const forecastHour = current?.kind === 'forecast' ? current.hour : null;
  const badge = !current
    ? null
    : current.kind === 'forecast'
      ? `Prévision +${current.hour + 1} h`
      : currentIndex === nowIndex
        ? 'Maintenant'
        : 'Observé';

  return (
    <div className="space-y-2">
      {/* "isolate" : les calques Leaflet (z-index élevés) restent sous le reste de l'interface */}
      <div className="relative isolate h-72 md:h-96 rounded-2xl overflow-hidden border border-white/10">
        <MapContainer
          center={[latitude, longitude]}
          zoom={DEFAULT_ZOOM}
          minZoom={4}
          maxZoom={10}
          scrollWheelZoom={false}
          zoomControl={false}
          className="h-full w-full bg-slate-900"
        >
          <TileLayer
            url={ESRI_DARK}
            maxNativeZoom={16}
            attribution='Fond &copy; <a href="https://www.esri.com/">Esri</a>, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · Radar <a href="https://www.rainviewer.com/">RainViewer</a> · Prévision <a href="https://open-meteo.com/">Open-Meteo</a>'
          />

          {/* Radar observé : toutes les images sont chargées d'avance, seule la courante est visible */}
          {radar?.frames.map((frame) => (
            <TileLayer
              key={frame.path}
              url={`${radar.host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`}
              opacity={current?.kind === 'observed' && current.path === frame.path ? 0.75 : 0}
              maxNativeZoom={7}
              zIndex={10}
            />
          ))}

          {/* Prévision : dégradé calculé entre les points de la grille (interpolation) */}
          <Pane name="forecast" style={{ zIndex: 350 }}>
            {forecastImages && forecastHour !== null && (
              <ImageOverlay
                url={forecastImages.urls[forecastHour]}
                bounds={forecastImages.bounds}
                opacity={0.9}
                pane="forecast"
              />
            )}
          </Pane>

          {/* Noms des villes au-dessus de la pluie, pour se repérer */}
          <Pane name="labels" style={{ zIndex: 450, pointerEvents: 'none' }}>
            <TileLayer url={ESRI_LABELS} maxNativeZoom={16} pane="labels" />
          </Pane>
          <CircleMarker
            center={[latitude, longitude]}
            radius={7}
            pathOptions={{ color: '#fff', weight: 2, fillColor: '#0ea5e9', fillOpacity: 1 }}
          />
          <MapController latitude={latitude} longitude={longitude} target={target} onZoomChange={setZoom} />
        </MapContainer>

        {/* Recentrer + choix du zoom */}
        <div className="absolute top-2 left-2 z-[500] flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => goTo(zoom)}
            title="Recentrer sur ma ville"
            aria-label="Recentrer sur ma ville"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-900/80 border border-white/20 text-white hover:bg-slate-800 shadow cursor-pointer"
          >
            <LocateFixed className="w-4 h-4" />
          </button>
          <div role="group" aria-label="Niveau de zoom" className="flex rounded-full bg-slate-900/80 border border-white/20 p-0.5 shadow">
            {ZOOM_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => goTo(preset.zoom)}
                aria-pressed={zoom === preset.zoom}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                  zoom === preset.zoom ? 'bg-sky-600 text-white' : 'text-slate-200 hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {badge && (
          <span
            className={`absolute top-2 right-2 z-[500] rounded-full px-2.5 py-1 text-xs font-semibold shadow ${
              current?.kind === 'forecast' ? 'bg-amber-400 text-slate-900' : 'bg-slate-900/80 text-white'
            }`}
          >
            {badge}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 text-sm">
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          disabled={frameCount < 2}
          aria-label={playing ? "Mettre l'animation en pause" : "Lancer l'animation"}
          className="w-9 h-9 shrink-0 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 cursor-pointer disabled:opacity-50"
        >
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        <input
          type="range"
          min={0}
          max={Math.max(frameCount - 1, 0)}
          value={currentIndex}
          onChange={(e) => {
            setPlaying(false);
            setIndex(Number(e.target.value));
          }}
          disabled={frameCount < 2}
          aria-label="Heure affichée sur la carte"
          aria-valuetext={current ? `${formatTime(current.time)}, ${badge}` : undefined}
          className="flex-1 accent-sky-400"
        />
        <span className="w-12 text-right tabular-nums text-slate-200">{current ? formatTime(current.time) : '--:--'}</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
        <span>Radar observé (2 h) puis prévision (4 h)</span>
        <span className="flex items-center gap-2">
          {LEGEND.map((l) => (
            <span key={l.label} className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
              {l.label}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}
