import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { attemptId } = await request.json();
    if (!attemptId) {
      return NextResponse.json({ error: "Missing attemptId" }, { status: 400 });
    }

    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: { participant: true, coupon: true }
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    const webhookUrl = process.env.GOOGLE_SCRIPT_WEB_URL;
    if (!webhookUrl) {
      return NextResponse.json({ error: "GOOGLE_SCRIPT_WEB_URL is not set" }, { status: 500 });
    }

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
      return NextResponse.json({ success: true, message: "Email sent successfully" });
    } else {
      return NextResponse.json({ error: "Failed to communicate with Google Script" }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Resend Email Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
