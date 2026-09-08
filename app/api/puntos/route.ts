import { points } from '@/db/schema';
import { getDb } from '@/db';
import { getAdminUser } from '@/app/chatgpt-auth';
import { listPoints, validatePoint } from '@/lib/points';

export async function GET() {
  try {
    return Response.json(await listPoints(false), { headers: { 'Cache-Control': 'public, max-age=60' } });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'No fue posible cargar los puntos.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAdminUser();
  if (!user) return Response.json({ error: 'No autorizado.' }, { status: 403 });
  try {
    const point = validatePoint(await request.json());
    await getDb().insert(points).values({
      id: point.id,
      name: point.nombre,
      category: point.categoria,
      x: point.x,
      y: point.y,
      description: point.descripcion,
      images: JSON.stringify(point.imagenes),
      airbnb: point.airbnb ?? null,
      active: point.activo,
      updatedAt: new Date().toISOString(),
      updatedBy: user.email,
    }).onConflictDoUpdate({
      target: points.id,
      set: {
        name: point.nombre,
        category: point.categoria,
        x: point.x,
        y: point.y,
        description: point.descripcion,
        images: JSON.stringify(point.imagenes),
        airbnb: point.airbnb ?? null,
        active: point.activo,
        updatedAt: new Date().toISOString(),
        updatedBy: user.email,
      },
    });
    return Response.json(point);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'No fue posible guardar.' }, { status: 400 });
  }
}
