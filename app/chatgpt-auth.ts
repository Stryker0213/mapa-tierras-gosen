import { env } from 'cloudflare:workers';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export type AdminUser = { userId: string; email: string; displayName: string };

export async function getAdminUser(): Promise<AdminUser | null> {
  const requestHeaders = await headers();
  const userId = requestHeaders.get('oai-authenticated-user-id');
  const email = requestHeaders.get('oai-authenticated-user-email')?.toLowerCase();
  if (!userId || !email) return null;

  const allowed = (env.ADMIN_EMAILS ?? '')
    .split(',')
    .map(value => value.trim().toLowerCase())
    .filter(Boolean);
  if (!allowed.includes(email)) return null;

  return { userId, email, displayName: email };
}

export async function requireAdminUser(): Promise<AdminUser> {
  const user = await getAdminUser();
  if (user) return user;
  const requestHeaders = await headers();
  if (!requestHeaders.get('oai-authenticated-user-id')) {
    redirect('/signin-with-chatgpt?return_to=%2Fadmin');
  }
  redirect('/sin-acceso');
}
