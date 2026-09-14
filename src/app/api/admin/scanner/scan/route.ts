import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { sessionId, couponCode } = await req.json();

    if (!sessionId || !couponCode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify session
    const scannerSession = await prisma.scannerSession.findUnique({
      where: { id: sessionId }
    });

    if (!scannerSession || scannerSession.status !== 'ACTIVE') {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
    }

    // Attempt redemption
    const coupon = await prisma.coupon.findUnique({
      where: { code: couponCode },
      include: { participant: true }
    });

    let scanResult = { success: false, message: "", participant: "", redeemedAt: "" };

    if (!coupon) {
      scanResult = { success: false, message: "Invalid coupon code", participant: "", redeemedAt: "" };
    } else if (coupon.status === 'REDEEMED') {
      scanResult = { 
        success: false, 
        message: "Coupon already redeemed", 
        participant: coupon.participant.name,
        redeemedAt: coupon.redeemedAt ? coupon.redeemedAt.toISOString() : ""
      };
    } else {
      // Valid! Redeem it.
      await prisma.coupon.update({
        where: { id: coupon.id },
        data: {
          status: 'REDEEMED',
          redeemedAt: new Date(),
          redeemedBy: scannerSession.adminId
        }
      });

      scanResult = {
        success: true,
        message: "Coupon successfully redeemed",
        participant: coupon.participant.name,
        redeemedAt: ""
      };

      // Trigger webhook to sheets
      const webhookUrl = process.env.GOOGLE_SCRIPT_WEB_URL;
      if (webhookUrl) {
        const postData = {
          action: "redeem",
          couponCode: coupon.code,
          name: coupon.participant.name,
          prn: coupon.participant.prn,
          redeemedBy: scannerSession.adminId,
          timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true }),
        };

        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postData),
        }).catch(err => console.error("Remote Scan Webhook Error:", err));
      }
    }

    // Save scan result to session
    await prisma.scannerSession.update({
      where: { id: sessionId },
      data: { lastScan: JSON.stringify(scanResult) }
    });

    return NextResponse.json(scanResult);

  } catch (error: any) {
    console.error("Remote Scan API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
