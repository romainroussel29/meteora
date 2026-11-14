import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Pane, useMap, useMapEvents } from 'react-leaflet';
import type { Map as LeafletMap } from 'leaflet';
import { LocateFixed, Minus, Pause, Play, Plus } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { createCache, withAbort } from '../utils/cache';

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

const isAbort = (err: unknown) => err instanceof DOMException && err.name === 'AbortError';

// Couleurs de la palette radar RainViewer utilisée (schéma 2)
const LEGEND = [
  { label: 'Faible', color: '#38bdf8' },
  { label: 'Modérée', color: '#1e40af' },
  { label: 'Forte', color: '#facc15' },
  { label: 'Très forte', color: '#dc2626' },
  { label: 'Extrême', color: '#e879f9' },
];

/** Niveaux de zoom proposés */
const ZOOM_PRESETS = [
  { label: 'Ville', zoom: 9 },
  { label: 'Région', zoom: 7 },
  { label: 'Pays', zoom: 5 },
] as const;
const DEFAULT_ZOOM = 7;
const MIN_ZOOM = 4;
const MAX_ZOOM = 10;

/**
 * Pilote la carte depuis l'extérieur (bouton « Recentrer » et niveaux de zoom),
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
 * Carte radar des précipitations observées sur les 2 dernières heures (RainViewer), animée.
 * Chargée à la demande (React.lazy) pour ne pas alourdir le démarrage de l'application.
 */
export default function RadarMap({ latitude, longitude }: RadarMapProps) {
  const [radar, setRadar] = useState<{ host: string; frames: RadarFrame[] } | null>(null);
  const [index, setIndex] = useState<number | null>(null); // null = image la plus récente
  const [playing, setPlaying] = useState(true);
  const [failed, setFailed] = useState(false);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [map, setMap] = useState<LeafletMap | null>(null);
  // Demande de déplacement de la carte (le token change à chaque clic)
  const [target, setTarget] = useState({ zoom: DEFAULT_ZOOM, token: 0 });
  const goTo = (z: number) => setTarget((t) => ({ zoom: z, token: t.token + 1 }));

  useEffect(() => {
    const controller = new AbortController();
    withAbort(loadRadar(), controller.signal)
      .then(({ value: data }) => setRadar({ host: data.host, frames: data.radar.past }))
      .catch((err: unknown) => {
        if (!isAbort(err)) setFailed(true);
      });
    return () => controller.abort();
  }, []);

  const frames = radar?.frames ?? [];
  const frameCount = frames.length;
  const lastIndex = Math.max(frameCount - 1, 0);
  const currentIndex = Math.min(index ?? lastIndex, lastIndex);
  const current: RadarFrame | undefined = frames[currentIndex];

  // Animation : les images radar défilent en boucle
  useEffect(() => {
    if (!playing || frameCount < 2) return;
    const id = setInterval(() => setIndex((i) => ((i ?? lastIndex) + 1) % frameCount), FRAME_MS);
    return () => clearInterval(id);
  }, [playing, frameCount, lastIndex]);

  if (failed) {
    return <p className="text-sm text-slate-300 py-6 text-center">Le radar est momentanément indisponible.</p>;
  }

  const badge = current ? (currentIndex === lastIndex ? 'Maintenant' : 'Observé') : null;

  return (
    <div className="space-y-2">
      {/* "isolate" : les calques Leaflet (z-index élevés) restent sous le reste de l'interface */}
      <div className="relative isolate h-72 md:h-96 rounded-2xl overflow-hidden border border-white/10">
        <MapContainer
          ref={setMap}
          center={[latitude, longitude]}
          zoom={DEFAULT_ZOOM}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          scrollWheelZoom={false}
          zoomControl={false}
          className="h-full w-full bg-slate-900"
        >
          <TileLayer
            url={ESRI_DARK}
            maxNativeZoom={16}
            attribution='Fond &copy; <a href="https://www.esri.com/">Esri</a>, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · Radar <a href="https://www.rainviewer.com/">RainViewer</a>'
          />

          {/* Toutes les images sont chargées d'avance ; seule l'image courante est visible (animation fluide) */}
          {radar?.frames.map((frame) => (
            <TileLayer
              key={frame.path}
              url={`${radar.host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`}
              opacity={current?.path === frame.path ? 0.75 : 0}
              maxNativeZoom={7}
              zIndex={10}
            />
          ))}

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

        {/* Recentrer + zoom */}
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
          {/* Zoom pas à pas : utile à la souris (sur mobile, on pince la carte) */}
          <div className="hidden md:flex rounded-full bg-slate-900/80 border border-white/20 shadow overflow-hidden">
            <button
              type="button"
              onClick={() => map?.zoomOut()}
              disabled={!map || zoom <= MIN_ZOOM}
              title="Dézoomer"
              aria-label="Dézoomer"
              className="w-8 h-8 flex items-center justify-center text-white hover:bg-slate-800 cursor-pointer disabled:opacity-40 disabled:cursor-default"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => map?.zoomIn()}
              disabled={!map || zoom >= MAX_ZOOM}
              title="Zoomer"
              aria-label="Zoomer"
              className="w-8 h-8 flex items-center justify-center text-white hover:bg-slate-800 cursor-pointer border-l border-white/20 disabled:opacity-40 disabled:cursor-default"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
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
          <span className="absolute top-2 right-2 z-[500] rounded-full px-2.5 py-1 text-xs font-semibold shadow bg-slate-900/80 text-white">
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
          max={lastIndex}
          value={currentIndex}
          onChange={(e) => {
            setPlaying(false);
            setIndex(Number(e.target.value));
          }}
          disabled={frameCount < 2}
          aria-label="Heure de l'image radar"
          aria-valuetext={current ? `${formatTime(current.time)}, ${badge}` : undefined}
          className="flex-1 accent-sky-400"
        />
        <span className="w-12 text-right tabular-nums text-slate-200">{current ? formatTime(current.time) : '--:--'}</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
        <span>Pluie observée sur les 2 dernières heures</span>
        <span className="flex flex-wrap items-center gap-2">
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
