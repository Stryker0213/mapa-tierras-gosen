import { env } from 'cloudflare:workers';
import { getAdminUser } from '@/app/chatgpt-auth';

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

export async function POST(request: Request) {
  if (!await getAdminUser()) return Response.json({ error: 'No autorizado.' }, { status: 403 });
  const form = await request.formData();
  const file = form.get('imagen');
  if (!(file instanceof File)) return Response.json({ error: 'Selecciona una imagen.' }, { status: 400 });
  if (!allowedTypes.has(file.type)) return Response.json({ error: 'Usa JPG, PNG, WebP o AVIF.' }, { status: 400 });
  if (file.size > 8 * 1024 * 1024) return Response.json({ error: 'La imagen no puede superar 8 MB.' }, { status: 400 });

  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const key = `puntos/${crypto.randomUUID()}.${extension}`;
  await env.FILES.put(key, file.stream(), { httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000, immutable' } });
  return Response.json({ url: `/api/imagenes/${key}` });
}
