import { redirect } from 'next/navigation';
import { getAdminSession, isSuperAdmin } from './auth';

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }
  return session;
}

export async function requireSuperAdmin() {
  const session = await getAdminSession();
  if (!session || !isSuperAdmin(session)) {
    redirect('/admin');
  }
  return session;
}
