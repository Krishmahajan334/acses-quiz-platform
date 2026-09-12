import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const attemptId = cookieStore.get('quiz_attempt_id')?.value;

    if (!attemptId) {
      return NextResponse.json({ error: "No attempt session found." }, { status: 401 });
    }

    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId }
    });

    if (!attempt) {
      return NextResponse.json({ error: "Invalid attempt." }, { status: 401 });
    }

    if (attempt.status === 'ACTIVE') {
      await prisma.attempt.update({
        where: { id: attemptId },
        data: {
          status: 'DISQUALIFIED',
          scorePercent: 0,
          submittedAt: new Date()
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Disqualify Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
