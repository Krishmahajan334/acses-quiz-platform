import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { attemptIds } = await request.json();
    if (!attemptIds || !Array.isArray(attemptIds) || attemptIds.length === 0) {
      return NextResponse.json({ error: "Missing attemptIds array" }, { status: 400 });
    }

    const attempts = await prisma.attempt.findMany({
      where: { id: { in: attemptIds } },
      include: { participant: true, coupon: true }
    });

    if (attempts.length === 0) {
      return NextResponse.json({ error: "Attempts not found" }, { status: 404 });
    }

    const webhookUrl = process.env.GOOGLE_SCRIPT_WEB_URL;
    if (!webhookUrl) {
      return NextResponse.json({ error: "GOOGLE_SCRIPT_WEB_URL is not set" }, { status: 500 });
    }

    let successCount = 0;
    
    // Process them sequentially to avoid overwhelming the script endpoint
    for (const attempt of attempts) {
      const postData = {
        action: "resend_email",
        name: attempt.participant.name,
        prn: attempt.participant.prn,
        email: attempt.participant.email,
        mobile: attempt.participant.mobile,
        scorePercent: attempt.scorePercent || 0,
        status: attempt.status,
        couponCode: attempt.coupon?.code || null,
      };

      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });

      if (res.ok) {
        successCount++;
      }
    }

    if (successCount > 0) {
      return NextResponse.json({ success: true, message: `Emails sent successfully to ${successCount} participants` });
    } else {
      return NextResponse.json({ error: "Failed to communicate with Google Script for all attempts" }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Resend Email Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
