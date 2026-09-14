import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { attemptId } = await req.json();

    if (!attemptId) {
      return NextResponse.json({ error: "Attempt ID is required" }, { status: 400 });
    }

    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: { participant: true, coupon: true },
    });

    if (!attempt || !attempt.participant || attempt.status !== 'COMPLETED') {
      return NextResponse.json({ error: "Invalid or incomplete attempt" }, { status: 400 });
    }

    const webhookUrl = process.env.GOOGLE_SCRIPT_WEB_URL;
    if (!webhookUrl) {
      return NextResponse.json({ error: "Webhook URL not configured" }, { status: 500 });
    }

    // Fetch all completed attempts for this participant to calculate history
    const allAttempts = await prisma.attempt.findMany({
      where: { participantId: attempt.participantId, status: 'COMPLETED' },
      select: { scorePercent: true, targetYear: true },
      orderBy: { submittedAt: 'asc' }
    });
    
    const attemptCount = allAttempts.length;
    const allScores = `[${allAttempts.map(a => `${a.targetYear || attempt.participant.year}: ${a.scorePercent !== null ? a.scorePercent.toFixed(0) : 0}%`).join(', ')}]`;

    // Attempt to find a coupon code (either from this attempt, or from a past one)
    let couponCode = attempt.coupon?.code || null;
    if (!couponCode) {
      const pastCoupon = await prisma.coupon.findFirst({
        where: { participantId: attempt.participantId }
      });
      if (pastCoupon) couponCode = pastCoupon.code;
    }

    const qrCodeUrl = couponCode ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${couponCode}` : null;

    const postData = {
      name: attempt.participant.name,
      prn: attempt.participant.prn,
      email: attempt.participant.email,
      mobile: attempt.participant.mobile,
      scorePercent: attempt.scorePercent,
      status: 'COMPLETED',
      couponCode,
      qrCodeUrl,
      attemptCount,
      allScores,
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true }),
    };

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData),
    });

    if (!res.ok) {
      throw new Error(`Google Apps Script returned ${res.status}`);
    }

    // Since it was successful, delete any pending SyncJobs for this attempt so admin doesn't have to do it
    await prisma.syncJob.deleteMany({
      where: {
        payload: {
          contains: attemptId
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Background Webhook Sync Error:", error);
    return NextResponse.json({ error: error.message || "Failed to sync" }, { status: 500 });
  }
}
