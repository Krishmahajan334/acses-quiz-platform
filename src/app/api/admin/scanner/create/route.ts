import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession, verifyAdminToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const session = await getAdminSession();
    if (!session) {
      const cookieStore = await cookies();
      const token = cookieStore.get('admin_token')?.value;
      const secret = process.env.ADMIN_AUTH_SECRET;
      
      let verifyErr = "N/A";
      if (token) {
        try {
          await verifyAdminToken(token);
        } catch (e: any) {
          verifyErr = e.message;
        }
      }

      return NextResponse.json({ 
        error: `Unauthorized (Token exists: ${!!token}, Secret length: ${secret ? secret.length : 0}, Verify error: ${verifyErr})` 
      }, { status: 401 });
    }

    const scannerSession = await prisma.scannerSession.create({
      data: {
        adminId: session.username,
      }
    });

    return NextResponse.json({ sessionId: scannerSession.id });
  } catch (error: any) {
    console.error("Create Scanner Session Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
