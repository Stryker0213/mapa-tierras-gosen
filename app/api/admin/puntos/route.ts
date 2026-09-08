import { getAdminUser } from '@/app/chatgpt-auth';
import { listPoints } from '@/lib/points';

export async function GET() {
  if (!await getAdminUser()) return Response.json({ error: 'No autorizado.' }, { status: 403 });
  return Response.json(await listPoints(true), { headers: { 'Cache-Control': 'no-store' } });
}
