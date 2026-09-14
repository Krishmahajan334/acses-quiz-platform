import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { couponCode } = await req.json();

    if (!couponCode) {
      return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: couponCode },
      include: { participant: true }
    });

    if (!coupon) {
      return NextResponse.json({ error: "Invalid coupon code" }, { status: 404 });
    }

    if (coupon.status === 'REDEEMED') {
      return NextResponse.json({ 
        error: "Coupon already redeemed", 
        participant: coupon.participant.name,
        redeemedAt: coupon.redeemedAt
      }, { status: 400 });
    }

    // Mark as redeemed
    await prisma.coupon.update({
      where: { id: coupon.id },
      data: {
        status: 'REDEEMED',
        redeemedAt: new Date(),
        redeemedBy: session.username
      }
    });

    // Send redemption webhook to Google Sheets
    const webhookUrl = process.env.GOOGLE_SCRIPT_WEB_URL;
    if (webhookUrl) {
      const postData = {
        action: "redeem",
        couponCode: coupon.code,
        name: coupon.participant.name,
        prn: coupon.participant.prn,
        redeemedBy: session.username,
        timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true }),
      };

      // We don't wait for this to finish to avoid slowing down the scanner
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      }).catch(err => console.error("Redemption Webhook Error:", err));
    }

    return NextResponse.json({ 
      success: true, 
      message: "Coupon successfully redeemed",
      participant: coupon.participant.name
    });

  } catch (error: any) {
    console.error("Redeem API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to redeem coupon" }, { status: 500 });
  }
}
