import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signAdminToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 });
    }

    const secret = process.env.ADMIN_AUTH_SECRET;
    
    // Check initial fallback for SUPER_ADMIN
    if (username === 'superadmin' && password === secret) {
      const payload = {
        adminId: 'superadmin-fallback',
        role: 'SUPER_ADMIN',
        username: 'superadmin'
      };
      
      const token = await signAdminToken(payload);
      
      const cookieStore = await cookies();
      cookieStore.set('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      });
      
      return NextResponse.json({ success: true, role: 'SUPER_ADMIN' });
    }
    
    // Check database for admin
    const admin = await prisma.admin.findUnique({
      where: { username }
    });
    
    if (!admin) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    
    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Set secure cookie
    const payload = {
      adminId: admin.id,
      role: admin.role,
      username: admin.username
    };
    
    const token = await signAdminToken(payload);
    
    const cookieStore = await cookies();
    cookieStore.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
    
    return NextResponse.json({ success: true, role: admin.role });
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
