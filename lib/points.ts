import { desc } from 'drizzle-orm';
import seedPoints from '@/data/puntos.json';
import { getDb } from '@/db';
import { points } from '@/db/schema';

export const categories = ['alojamiento', 'educativo', 'mirador', 'sendero', 'experiencia'] as const;
export type Category = (typeof categories)[number];

export type PointRecord = {
  id: string;
  nombre: string;
  categoria: Category;
  x: number;
  y: number;
  descripcion: string;
  imagenes: string[];
  airbnb?: string;
  activo: boolean;
};

type DbPoint = typeof points.$inferSelect;

function fromDb(point: DbPoint): PointRecord {
  let images: string[] = [];
  try { images = JSON.parse(point.images); } catch { images = []; }
  return {
    id: point.id,
    nombre: point.name,
    categoria: point.category as Category,
    x: point.x,
    y: point.y,
    descripcion: point.description,
    imagenes: images,
    ...(point.airbnb ? { airbnb: point.airbnb } : {}),
    activo: point.active,
  };
}

export async function listPoints(includeInactive = false): Promise<PointRecord[]> {
  const overrides = await getDb().select().from(points).orderBy(desc(points.updatedAt));
  const merged = new Map<string, PointRecord>(
    (seedPoints as PointRecord[]).map(point => [point.id, point]),
  );
  overrides.forEach(point => merged.set(point.id, fromDb(point)));
  const values = Array.from(merged.values());
  return includeInactive ? values : values.filter(point => point.activo);
}

export function isSeedPoint(id: string): boolean {
  return (seedPoints as PointRecord[]).some(point => point.id === id);
}

export function validatePoint(input: unknown): PointRecord {
  if (!input || typeof input !== 'object') throw new Error('Los datos del punto no son válidos.');
  const value = input as Partial<PointRecord>;
  const id = String(value.id ?? '').trim().toLowerCase();
  const nombre = String(value.nombre ?? '').trim();
  const descripcion = String(value.descripcion ?? '').trim();
  const categoria = String(value.categoria ?? '') as Category;
  const x = Number(value.x);
  const y = Number(value.y);
  const imagenes = Array.isArray(value.imagenes) ? value.imagenes.map(String).filter(Boolean) : [];
  const airbnb = String(value.airbnb ?? '').trim();

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new Error('El identificador solo puede usar letras minúsculas, números y guiones.');
  if (!nombre || !descripcion) throw new Error('El nombre y la descripción son obligatorios.');
  if (!categories.includes(categoria)) throw new Error('La categoría no es válida.');
  if (!Number.isFinite(x) || x < 0 || x > 1280 || !Number.isFinite(y) || y < 0 || y > 853) throw new Error('La ubicación está fuera del mapa.');
  if (airbnb) {
    const url = new URL(airbnb);
    if (url.protocol !== 'https:') throw new Error('El enlace de reservación debe usar HTTPS.');
  }

  return { id, nombre, categoria, x: Math.round(x), y: Math.round(y), descripcion, imagenes, ...(airbnb ? { airbnb } : {}), activo: value.activo !== false };
}
