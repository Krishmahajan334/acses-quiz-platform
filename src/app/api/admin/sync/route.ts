import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST() {
  try {
    const webhookUrl = process.env.GOOGLE_SCRIPT_WEB_URL;
    if (!webhookUrl) {
      return NextResponse.json({ error: "GOOGLE_SCRIPT_WEB_URL is not set in environment." }, { status: 500 });
    }

    // Get up to 50 pending sync jobs
    const jobs = await prisma.syncJob.findMany({
      where: { status: 'PENDING' },
      take: 50
    });

    if (jobs.length === 0) {
      return NextResponse.json({ message: "No pending sync jobs." });
    }

    let successCount = 0;
    let failCount = 0;

    for (const job of jobs) {
      try {
        const payload = JSON.parse(job.payload);
        const attemptId = payload.attemptId;

        // Fetch attempt data
        const attempt = await prisma.attempt.findUnique({
          where: { id: attemptId },
          include: { participant: true, coupon: true }
        });

        if (!attempt) {
          await prisma.syncJob.update({ where: { id: job.id }, data: { status: 'FAILED' } });
          failCount++;
          continue;
        }

        const postData = {
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
          // Success! Remove the job.
          await prisma.syncJob.delete({ where: { id: job.id } });
          successCount++;
        } else {
          // Keep it pending/failed
          await prisma.syncJob.update({ where: { id: job.id }, data: { status: 'FAILED' } });
          failCount++;
        }
      } catch (err) {
        console.error("Job processing error", err);
        await prisma.syncJob.update({ where: { id: job.id }, data: { status: 'FAILED' } });
        failCount++;
      }
    }

    return NextResponse.json({
      success: true,
      processed: jobs.length,
      successCount,
      failCount
    });
  } catch (error) {
    console.error("Sync Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
