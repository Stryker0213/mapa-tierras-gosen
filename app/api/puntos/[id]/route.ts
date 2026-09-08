import { eq } from 'drizzle-orm';
import { getAdminUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import { points } from '@/db/schema';
import { isSeedPoint } from '@/lib/points';

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getAdminUser();
  if (!user) return Response.json({ error: 'No autorizado.' }, { status: 403 });
  const { id } = await context.params;

  if (isSeedPoint(id)) {
    const seed = (await import('@/data/puntos.json')).default.find(point => point.id === id);
    if (!seed) return Response.json({ error: 'Punto no encontrado.' }, { status: 404 });
    await getDb().insert(points).values({
      id: seed.id,
      name: seed.nombre,
      category: seed.categoria,
      x: seed.x,
      y: seed.y,
      description: seed.descripcion,
      images: JSON.stringify(seed.imagenes),
      airbnb: 'airbnb' in seed ? seed.airbnb : null,
      active: false,
      updatedAt: new Date().toISOString(),
      updatedBy: user.email,
    }).onConflictDoUpdate({ target: points.id, set: { active: false, updatedAt: new Date().toISOString(), updatedBy: user.email } });
  } else {
    await getDb().delete(points).where(eq(points.id, id));
  }
  return new Response(null, { status: 204 });
}
