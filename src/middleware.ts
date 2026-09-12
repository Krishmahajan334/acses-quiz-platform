import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Extremely lightweight LRU cache for Edge rate limiting
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

// Limit: 20 requests per 10 seconds per IP
const WINDOW_MS = 10 * 1000;
const MAX_REQUESTS = 20;

export function middleware(request: NextRequest) {
  // Only rate limit the /api/quiz endpoints
  if (!request.nextUrl.pathname.startsWith('/api/quiz/')) {
    return NextResponse.next();
  }

  // Get IP address (Vercel forwards it in the x-forwarded-for header)
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  // Clean up expired records occasionally to prevent memory leaks in Edge isolates
  if (Math.random() < 0.1) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.expiresAt < now) {
        rateLimitMap.delete(key);
      }
    }
  }

  if (!record || record.expiresAt < now) {
    // First request or window expired
    rateLimitMap.set(ip, { count: 1, expiresAt: now + WINDOW_MS });
    return NextResponse.next();
  }

  if (record.count >= MAX_REQUESTS) {
    // Rate limit exceeded
    return new NextResponse(
      JSON.stringify({ error: 'Too Many Requests. Please slow down.' }),
      { 
        status: 429, 
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // Increment request count
  record.count += 1;
  return NextResponse.next();
}

export const config = {
  matcher: '/api/quiz/:path*',
};
