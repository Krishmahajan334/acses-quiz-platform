import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export async function POST() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
