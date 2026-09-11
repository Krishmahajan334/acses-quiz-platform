import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;

    if (!token || token !== process.env.ADMIN_AUTH_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Since SQLite requires careful cascading deletes, we delete in correct order (child to parent)
    await prisma.$transaction([
      prisma.coupon.deleteMany({}),
      prisma.answer.deleteMany({}),
      prisma.attemptQuestion.deleteMany({}),
      prisma.attempt.deleteMany({}),
      prisma.participant.deleteMany({}),
    ]);

    return NextResponse.json({ success: true, message: "All test participants, attempts, and coupons were successfully deleted." });
  } catch (error) {
    console.error("Clear Data Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
