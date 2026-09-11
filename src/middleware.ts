import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect Admin Routes
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = request.cookies.get('admin_token')?.value;
    
    // In production, we'd verify a JWT. Since we're doing a simple MVP:
    // We just check if the cookie exists and matches the secret locally.
    const secret = process.env.ADMIN_AUTH_SECRET;
    
    if (!token || token !== secret) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Protect Admin API
  if (pathname.startsWith('/api/admin') && !pathname.startsWith('/api/admin/login')) {
    const token = request.cookies.get('admin_token')?.value;
    const secret = process.env.ADMIN_AUTH_SECRET;
    
    if (!token || token !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
