import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import crypto from 'crypto';

function generateCouponCode() {
  const p1 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const p2 = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `ACSES-${p1}-${p2}`;
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const attemptId = cookieStore.get('quiz_attempt_id')?.value;

    if (!attemptId) {
      return NextResponse.json({ error: "No attempt session found." }, { status: 401 });
    }

    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        event: true,
        answers: true,
        coupon: true,
      }
    });

    if (!attempt) {
      return NextResponse.json({ error: "Invalid attempt." }, { status: 401 });
    }

    // Idempotency: If already completed, just return the result
    if (attempt.status === 'COMPLETED') {
      return NextResponse.json({
        success: true,
        scorePercent: attempt.scorePercent,
        passed: (attempt.scorePercent || 0) >= attempt.event.passPercent,
        couponCode: attempt.coupon?.code || null,
        message: "Attempt already finalized."
      });
    }

    // Proceed to finalize ACTIVE or EXPIRED attempt
    // Calculate total possible questions
    const totalQuestions = attempt.event.questionCount;
    
    // Count correct answers
    const correctCount = attempt.answers.filter(a => a.isCorrect).length;

    const scorePercent = (correctCount / totalQuestions) * 100;
    const passed = scorePercent >= attempt.event.passPercent;

    let couponCode: string | null = null;

    await prisma.$transaction(async (tx) => {
      // 1. Mark attempt as completed
      await tx.attempt.update({
        where: { id: attempt.id },
        data: {
          status: 'COMPLETED',
          scorePercent,
          submittedAt: new Date(),
        }
      });

      // 2. Generate coupon if eligible
      if (passed) {
        // Double check inside tx if coupon already created (for concurrent requests)
        const existingCoupon = await tx.coupon.findUnique({ where: { attemptId: attempt.id } });
        if (existingCoupon) {
          couponCode = existingCoupon.code;
        } else {
          let codeUnique = false;
          while (!codeUnique) {
            couponCode = generateCouponCode();
            const existing = await tx.coupon.findUnique({ where: { code: couponCode } });
            if (!existing) {
              codeUnique = true;
              await tx.coupon.create({
                data: {
                  code: couponCode,
                  attemptId: attempt.id,
                  participantId: attempt.participantId,
                  status: 'ISSUED'
                }
              });
            }
          }
        }
      }
    });

    // 3. (Async) Queue email & Google Sheets backup
    // We will do this via an outbox pattern in Phase 8-10, for now we just return.
    if (passed && couponCode) {
       await prisma.syncJob.create({
         data: {
           type: 'EMAIL_AND_SHEETS',
           payload: JSON.stringify({ attemptId: attempt.id, couponCode })
         }
       });
    } else {
       await prisma.syncJob.create({
         data: {
           type: 'SHEETS_ONLY',
           payload: JSON.stringify({ attemptId: attempt.id })
         }
       });
    }

    return NextResponse.json({
      success: true,
      scorePercent,
      passed,
      couponCode,
    });
  } catch (error: any) {
    console.error("Quiz Finish Error:", error);
    return NextResponse.json({ error: error.message || error.toString() || "Internal Server Error" }, { status: 500 });
  }
}
