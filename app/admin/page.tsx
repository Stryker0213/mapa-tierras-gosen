import { requireAdminUser } from '@/app/chatgpt-auth';
import AdminEditor from './admin-editor';
import './admin.css';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = await requireAdminUser();
  return <AdminEditor userEmail={user.email} />;
}
