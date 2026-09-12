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
        answers: {
          include: {
            option: true
          }
        },
        questions: {
          include: {
            question: {
              include: {
                options: true
              }
            }
          }
        },
        coupon: true,
        participant: true,
      }
    });

    if (!attempt) {
      return NextResponse.json({ error: "Invalid attempt." }, { status: 401 });
    }

    // Securely construct the review data from the fetched attempt
    const reviewData = attempt.questions.map(q => {
      const questionText = q.question.text;
      const answer = attempt.answers.find(a => a.questionId === q.questionId);
      const selectedAnswer = answer?.option?.text || "Unanswered";
      const correctOption = q.question.options.find(o => o.isCorrect);
      const correctAnswer = correctOption?.text || "Unknown";
      const isCorrect = answer?.isCorrect || false;

      return {
        questionText,
        selectedAnswer,
        correctAnswer,
        isCorrect
      };
    });

    // Idempotency: If already completed or disqualified, return the result
    if (attempt.status === 'COMPLETED' || attempt.status === 'DISQUALIFIED') {
      return NextResponse.json({
        success: true,
        disqualified: attempt.status === 'DISQUALIFIED',
        scorePercent: attempt.scorePercent,
        passed: (attempt.scorePercent || 0) >= attempt.event.passPercent,
        couponCode: attempt.coupon?.code || null,
        reviewData,
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
        const existingCouponForThisAttempt = await tx.coupon.findUnique({ where: { attemptId: attempt.id } });
        if (existingCouponForThisAttempt) {
          couponCode = existingCouponForThisAttempt.code;
        } else {
          // Check if this participant ALREADY has a coupon from a previous attempt
          const pastCoupon = await tx.coupon.findFirst({
            where: { participantId: attempt.participantId }
          });

          if (pastCoupon) {
            // Give them the same code they already earned!
            couponCode = pastCoupon.code;
          } else {
            // They don't have a coupon yet, generate a new one
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
      }
    });

    // 3. Try to auto-sync to Google Sheets immediately
    let autoSyncSuccess = false;
    try {
      const webhookUrl = process.env.GOOGLE_SCRIPT_WEB_URL;
      if (webhookUrl) {
        // Fetch all completed attempts for this participant to calculate history
        const allAttempts = await prisma.attempt.findMany({
          where: { participantId: attempt.participantId, status: 'COMPLETED' },
          select: { scorePercent: true },
          orderBy: { submittedAt: 'asc' }
        });
        
        const attemptCount = allAttempts.length;
        const allScores = `[${allAttempts.map(a => `${a.scorePercent !== null ? a.scorePercent.toFixed(0) : 0}%`).join(', ')}]`;

        const postData = {
          name: attempt.participant.name,
          prn: attempt.participant.prn,
          email: attempt.participant.email,
          mobile: attempt.participant.mobile,
          scorePercent,
          status: 'COMPLETED',
          couponCode,
          attemptCount,
          allScores,
          timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true }),
        };
        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postData),
        });
        if (res.ok) {
          autoSyncSuccess = true;
        }
      }
    } catch (e) {
      console.error("Auto-sync to sheets failed", e);
    }

    // 4. Fallback to SyncJob if auto-sync failed (can be triggered manually in admin)
    if (!autoSyncSuccess) {
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
    }

    return NextResponse.json({
      success: true,
      scorePercent,
      passed,
      couponCode,
      reviewData,
    });
  } catch (error: any) {
    console.error("Quiz Finish Error:", error);
    return NextResponse.json({ error: error.message || error.toString() || "Internal Server Error" }, { status: 500 });
  }
}
