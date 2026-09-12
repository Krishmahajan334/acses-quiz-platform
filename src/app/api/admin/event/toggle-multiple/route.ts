import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST() {
  try {
    const activeEvent = await prisma.quizEvent.findFirst({
      where: { status: 'ACTIVE' }
    });

    if (!activeEvent) {
      return NextResponse.json({ error: "No active event found" }, { status: 404 });
    }

    const updated = await prisma.quizEvent.update({
      where: { id: activeEvent.id },
      data: { allowMultipleAttempts: !activeEvent.allowMultipleAttempts }
    });

    return NextResponse.json({ success: true, allowMultipleAttempts: updated.allowMultipleAttempts });
  } catch (error: any) {
    console.error("Error toggling multiple attempts:", error);
    return NextResponse.json({ error: error.message || "Failed to toggle setting" }, { status: 500 });
  }
}
