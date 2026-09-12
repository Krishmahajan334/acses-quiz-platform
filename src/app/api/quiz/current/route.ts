import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getActiveAttempt } from '@/lib/quiz';

export async function GET() {
  try {
    const attempt = await getActiveAttempt();
    if (!attempt) {
      return NextResponse.json({ error: "No active attempt found or attempt expired." }, { status: 401 });
    }

    // Find the current un-answered question
    const currentAttemptQuestion = await prisma.attemptQuestion.findFirst({
      where: { attemptId: attempt.id, answeredAt: null },
      orderBy: { position: 'asc' },
      include: {
        question: {
          include: {
            options: {
              select: { id: true, text: true } // DO NOT select isCorrect!
            }
          }
        }
      }
    });

    if (!currentAttemptQuestion) {
      // All questions answered
      return NextResponse.json({ completed: true });
    }

    // Shuffle options for security
    const shuffledOptions = currentAttemptQuestion.question.options.sort(() => 0.5 - Math.random());

    // Mark as served and calculate deadline if not already
    let qDeadlineAt = currentAttemptQuestion.deadlineAt;
    
    if (!currentAttemptQuestion.servedAt) {
      let qDurationSec = currentAttemptQuestion.question.durationSec || Math.floor(attempt.event.durationSec / attempt.event.questionCount);
      
      // NEW: Enforce maximum of 60 seconds per question
      qDurationSec = Math.min(qDurationSec, 60);
      
      qDeadlineAt = new Date(Date.now() + qDurationSec * 1000);
      
      // Ensure the question deadline does not exceed the overall attempt deadline
      if (qDeadlineAt > attempt.deadlineAt) {
        qDeadlineAt = attempt.deadlineAt;
      }

      await prisma.attemptQuestion.update({
        where: { id: currentAttemptQuestion.id },
        data: { 
          servedAt: new Date(),
          deadlineAt: qDeadlineAt
        }
      });
    }
    const totalQuestions = await prisma.attemptQuestion.count({
      where: { attemptId: attempt.id }
    });

    return NextResponse.json({
      questionId: currentAttemptQuestion.question.id,
      position: currentAttemptQuestion.position,
      totalQuestions: totalQuestions,
      text: currentAttemptQuestion.question.text,
      options: shuffledOptions,
      deadlineAt: qDeadlineAt,
    });
  } catch (error) {
    console.error("Quiz Current Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
