import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session');

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 });
    }

    const scannerSession = await prisma.scannerSession.findUnique({
      where: { id: sessionId },
    });

    if (!scannerSession || scannerSession.status !== 'ACTIVE') {
      return NextResponse.json({ error: "Invalid or closed session" }, { status: 404 });
    }

    // Return the last scan result, then optionally clear it so we don't show it again next poll
    const result = scannerSession.lastScan ? JSON.parse(scannerSession.lastScan) : null;

    if (result) {
      // Clear it so it's not repeatedly polled
      await prisma.scannerSession.update({
        where: { id: sessionId },
        data: { lastScan: null }
      });
    }

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error("Poll Scanner Session Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
