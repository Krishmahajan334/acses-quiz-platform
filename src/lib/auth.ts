import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { cookies } from 'next/headers';

function getSecret() {
  const secretStr = process.env.ADMIN_AUTH_SECRET || 'fallback-secret-do-not-use-in-prod';
  return new TextEncoder().encode(secretStr);
}

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
    .sign(getSecret());
  return token;
}

export async function verifyAdminToken(token: string): Promise<AdminJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as AdminJwtPayload;
  } catch (error) {
    console.error("JWT Verify Error:", error);
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
