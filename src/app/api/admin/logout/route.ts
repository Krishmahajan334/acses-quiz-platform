import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL('/admin/login', request.url);
  const response = NextResponse.redirect(url);
  response.cookies.delete('admin_session_token');
  return response;
}
