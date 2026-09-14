import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { cookies } from 'next/headers';

const secret = new TextEncoder().encode(process.env.ADMIN_AUTH_SECRET);

export interface AdminJwtPayload extends JWTPayload {
  adminId: string;
  role: string;
  username: string;
}

export async function signAdminToken(payload: AdminJwtPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);
  return token;
}

export async function verifyAdminToken(token: string): Promise<AdminJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as AdminJwtPayload;
  } catch (error) {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminJwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;

  if (!token) {
    return null;
  }
  
  // Backwards compatibility check in case the old non-jwt token is still around
  if (token === process.env.ADMIN_AUTH_SECRET) {
    // If it's exactly the secret, this was the old implementation
    // Force a re-login by returning null
    return null;
  }

  return await verifyAdminToken(token);
}

export function isSuperAdmin(session: AdminJwtPayload | null): boolean {
  return session?.role === 'SUPER_ADMIN';
}
