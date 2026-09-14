import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();

    if (!session) {
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

    // Tell Google Sheets to clear data if webhook is configured
    const webhookUrl = process.env.GOOGLE_SCRIPT_WEB_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: "clear" }),
        });
      } catch (err) {
        console.error("Failed to tell Google Sheets to clear", err);
      }
    }

    return NextResponse.json({ success: true, message: "All test participants, attempts, and coupons were successfully deleted." });
  } catch (error) {
    console.error("Clear Data Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
