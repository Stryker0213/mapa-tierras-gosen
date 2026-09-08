'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ImagePlus, LogOut, MapPin, Plus, Save, Search, Trash2 } from 'lucide-react';

type Point = { id: string; nombre: string; categoria: string; x: number; y: number; descripcion: string; imagenes: string[]; airbnb?: string; activo: boolean };
type LeafletMap = { remove(): void; on(event: string, callback: (event: { latlng: { lat: number; lng: number } }) => void): void; setView(coords: [number, number], zoom: number): void };
type Marker = { addTo(map: LeafletMap): Marker; on(event: string, callback: (event: { target: { getLatLng(): { lat: number; lng: number } } }) => void): Marker; setLatLng(coords: [number, number]): void };

const emptyPoint: Point = { id: '', nombre: '', categoria: 'experiencia', x: 640, y: 426, descripcion: '', imagenes: [], activo: true };
const categoryLabels: Record<string, string> = { alojamiento: 'Alojamiento', educativo: 'Educativo', mirador: 'Mirador', sendero: 'Sendero', experiencia: 'Experiencia' };

declare global { interface Window { L: { map(id: HTMLElement, options: object): LeafletMap; CRS: { Simple: object }; imageOverlay(url: string, bounds: number[][]): { addTo(map: LeafletMap): void }; marker(coords: [number, number], options: object): Marker } } }

function slugify(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function loadLeaflet(): Promise<void> {
  if (window.L) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(css);
    const script = document.createElement('script'); script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; script.onload = () => resolve(); script.onerror = () => reject(new Error('No se pudo cargar el mapa.')); document.head.appendChild(script);
  });
}

export default function AdminEditor({ userEmail }: { userEmail: string }) {
  const [points, setPoints] = useState<Point[]>([]);
  const [selected, setSelected] = useState<Point>(emptyPoint);
  const [originalId, setOriginalId] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('Cargando puntos…');
  const [busy, setBusy] = useState(false);
  const mapElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);

  async function refresh(selectId?: string) {
    const response = await fetch('/api/admin/puntos', { cache: 'no-store' });
    if (!response.ok) throw new Error('No fue posible cargar los puntos.');
    const data: Point[] = await response.json();
    setPoints(data);
    const next = data.find(point => point.id === selectId) ?? data[0] ?? emptyPoint;
    setSelected({ ...next, imagenes: [...next.imagenes] });
    setOriginalId(next.id);
    setStatus(`${data.length} puntos disponibles`);
  }

  useEffect(() => { refresh().catch(error => setStatus(error.message)); }, []);
  useEffect(() => {
    if (!mapElement.current || mapRef.current) return;
    let cancelled = false;
    loadLeaflet().then(() => {
      if (cancelled || !mapElement.current) return;
      const map = window.L.map(mapElement.current, { crs: window.L.CRS.Simple, minZoom: -1.6, maxZoom: 2 });
      window.L.imageOverlay('/images/mapa.jpg', [[0, 0], [853, 1280]]).addTo(map);
      map.setView([426, 640], -0.55);
      map.on('click', event => setSelected(current => ({ ...current, x: Math.round(event.latlng.lng), y: Math.round(event.latlng.lat) })));
      const marker = window.L.marker([426, 640], { draggable: true }).addTo(map);
      marker.on('dragend', event => { const location = event.target.getLatLng(); setSelected(current => ({ ...current, x: Math.round(location.lng), y: Math.round(location.lat) })); });
      mapRef.current = map; markerRef.current = marker;
    }).catch(error => setStatus(error.message));
    return () => { cancelled = true; mapRef.current?.remove(); mapRef.current = null; };
  }, []);
  useEffect(() => { markerRef.current?.setLatLng([selected.y, selected.x]); }, [selected.x, selected.y]);

  const filtered = useMemo(() => {
    const normalized = query.toLocaleLowerCase('es');
    return points.filter(point => `${point.nombre} ${point.categoria}`.toLocaleLowerCase('es').includes(normalized));
  }, [points, query]);

  function update<K extends keyof Point>(key: K, value: Point[K]) { setSelected(current => ({ ...current, [key]: value })); }
  function choose(point: Point) { setSelected({ ...point, imagenes: [...point.imagenes] }); setOriginalId(point.id); setStatus(`Editando ${point.nombre}`); mapRef.current?.setView([point.y, point.x], 0); }
  function createNew() { setSelected({ ...emptyPoint, imagenes: [] }); setOriginalId(''); setStatus('Nuevo punto'); }
  function move(dx: number, dy: number) { setSelected(current => ({ ...current, x: Math.max(0, Math.min(1280, current.x + dx)), y: Math.max(0, Math.min(853, current.y + dy)) })); }

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true); setStatus('Subiendo imágenes…');
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const form = new FormData(); form.append('imagen', file);
        const response = await fetch('/api/imagenes', { method: 'POST', body: form });
        const result = await response.json() as { error?: string; url?: string };
        if (!response.ok) throw new Error(result.error ?? 'No fue posible subir la imagen.');
        if (!result.url) throw new Error('El servidor no devolvió la imagen.');
        urls.push(result.url);
      }
      setSelected(current => ({ ...current, imagenes: [...current.imagenes, ...urls] }));
      setStatus(`${urls.length} imagen${urls.length === 1 ? '' : 'es'} agregada${urls.length === 1 ? '' : 's'}`);
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Error al subir.'); } finally { setBusy(false); }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setStatus('Guardando…');
    try {
      const point = { ...selected, id: selected.id || slugify(selected.nombre) };
      if (originalId && originalId !== point.id) throw new Error('El identificador no puede cambiar después de crear el punto.');
      const response = await fetch('/api/puntos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(point) });
      const result = await response.json() as { error?: string; id?: string };
      if (!response.ok) throw new Error(result.error ?? 'No fue posible guardar.');
      await refresh(result.id); setStatus('Cambios guardados');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'No fue posible guardar.'); } finally { setBusy(false); }
  }

  async function remove() {
    if (!selected.id || !confirm(`¿Eliminar “${selected.nombre}”? Dejará de aparecer en el mapa.`)) return;
    setBusy(true); setStatus('Eliminando…');
    try {
      const response = await fetch(`/api/puntos/${encodeURIComponent(selected.id)}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('No fue posible eliminar el punto.');
      await refresh(); setStatus('Punto eliminado');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'No fue posible eliminar.'); } finally { setBusy(false); }
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <a className="admin-brand" href="/"><img src="/assets/icons/icons8-hoja-48.png" alt="" /><span><small>Panel privado</small><strong>Tierras Gosén</strong></span></a>
        <div className="admin-account"><span>{userEmail}</span><a href="/signout-with-chatgpt?return_to=%2F"><LogOut size={17} /> Salir</a></div>
      </header>
      <aside className="point-browser">
        <div className="browser-heading"><div><p className="admin-eyebrow">Contenido del mapa</p><h1>Puntos de interés</h1></div><button type="button" className="icon-button primary" onClick={createNew} aria-label="Agregar punto"><Plus /></button></div>
        <label className="admin-search"><Search size={17} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar punto" /></label>
        <div className="point-list">{filtered.map(point => <button type="button" key={point.id} className={point.id === originalId ? 'point-row selected' : 'point-row'} onClick={() => choose(point)}><span className={`status-dot ${point.activo ? '' : 'inactive'}`} /><span><strong>{point.nombre}</strong><small>{categoryLabels[point.categoria]} · {point.x}, {point.y}</small></span></button>)}</div>
      </aside>
      <section className="editor-map" aria-label="Ubicación del punto"><div ref={mapElement} className="admin-map" /><div className="map-hint"><MapPin size={16} /> Haz clic en el mapa o arrastra el marcador</div></section>
      <section className="point-editor">
        <form onSubmit={save}>
          <div className="editor-title"><div><p className="admin-eyebrow">{originalId ? 'Editar punto' : 'Nuevo punto'}</p><h2>{selected.nombre || 'Sin nombre'}</h2></div><label className="active-control"><input type="checkbox" checked={selected.activo} onChange={event => update('activo', event.target.checked)} /><span>Visible</span></label></div>
          <label>Nombre<input required value={selected.nombre} onChange={event => { update('nombre', event.target.value); if (!originalId) update('id', slugify(event.target.value)); }} /></label>
          <div className="form-grid"><label>Identificador<input required disabled={Boolean(originalId)} value={selected.id} onChange={event => update('id', slugify(event.target.value))} /></label><label>Categoría<select value={selected.categoria} onChange={event => update('categoria', event.target.value)}>{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
          <label>Descripción<textarea required rows={3} value={selected.descripcion} onChange={event => update('descripcion', event.target.value)} /></label>
          <label>Enlace de reservación <small>(opcional)</small><input type="url" value={selected.airbnb ?? ''} onChange={event => update('airbnb', event.target.value)} placeholder="https://…" /></label>
          <fieldset className="coordinates"><legend>Ubicación exacta</legend><div className="form-grid"><label>X<input type="number" min="0" max="1280" value={selected.x} onChange={event => update('x', Number(event.target.value))} /></label><label>Y<input type="number" min="0" max="853" value={selected.y} onChange={event => update('y', Number(event.target.value))} /></label></div><div className="nudge-controls"><button type="button" onClick={() => move(-1, 0)} aria-label="Mover a la izquierda"><ArrowLeft /></button><button type="button" onClick={() => move(0, -1)} aria-label="Mover abajo"><ArrowDown /></button><button type="button" onClick={() => move(0, 1)} aria-label="Mover arriba"><ArrowUp /></button><button type="button" onClick={() => move(1, 0)} aria-label="Mover a la derecha"><ArrowRight /></button><button type="button" className="snap-button" onClick={() => setSelected(current => ({ ...current, x: Math.round(current.x / 5) * 5, y: Math.round(current.y / 5) * 5 }))}>Alinear a 5 px</button></div></fieldset>
          <fieldset className="images-field"><legend>Imágenes</legend><div className="image-grid">{selected.imagenes.map((url, index) => <figure key={`${url}-${index}`}><img src={url} alt="" /><button type="button" onClick={() => update('imagenes', selected.imagenes.filter((_, imageIndex) => imageIndex !== index))} aria-label="Quitar imagen">×</button></figure>)}<label className="upload-tile"><ImagePlus /><span>Agregar</span><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple onChange={event => upload(event.target.files)} /></label></div></fieldset>
          <p className="save-status" role="status">{status}</p>
          <div className="editor-actions"><button type="button" className="danger-button" onClick={remove} disabled={!selected.id || busy}><Trash2 size={18} /> Eliminar</button><button type="submit" className="save-button" disabled={busy}><Save size={18} /> Guardar cambios</button></div>
        </form>
      </section>
    </main>
  );
}
