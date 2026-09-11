import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getActiveAttempt } from '@/lib/quiz';

export async function POST(request: Request) {
  try {
    const attempt = await getActiveAttempt();
    if (!attempt) {
      return NextResponse.json({ error: "No active attempt found or attempt expired." }, { status: 401 });
    }

    const { questionId, selectedOptionId } = await request.json();

    if (!questionId || !selectedOptionId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Verify question belongs to this attempt and is the current one
    const currentAttemptQuestion = await prisma.attemptQuestion.findFirst({
      where: { attemptId: attempt.id, answeredAt: null },
      orderBy: { position: 'asc' },
    });

    if (!currentAttemptQuestion) {
      return NextResponse.json({ error: "No pending questions" }, { status: 400 });
    }

    if (currentAttemptQuestion.questionId !== questionId) {
      return NextResponse.json({ error: "Invalid question ID. You must answer the current question." }, { status: 400 });
    }
    
    // Check if the deadline for this specific question has passed
    const now = new Date();
    // Allow a small 2 second grace period for network latency
    const isLate = currentAttemptQuestion.deadlineAt && (now.getTime() > currentAttemptQuestion.deadlineAt.getTime() + 2000);

    // 2. Verify the selected option belongs to the question and check if correct
    let isCorrect = false;
    let finalOptionId = selectedOptionId;
    
    if (finalOptionId && !isLate) {
      const option = await prisma.option.findFirst({
        where: { id: finalOptionId, questionId }
      });

      if (!option) {
        return NextResponse.json({ error: "Invalid option selected." }, { status: 400 });
      }
      isCorrect = option.isCorrect;
    } else {
      // If late, or no option selected, we force it to be incorrect
      finalOptionId = null;
      isCorrect = false;
    }

    // 3. Store the answer in a transaction
    await prisma.$transaction(async (tx) => {
      // Create the answer record if an option was selected (or late but submitted something)
      // Actually, if it's late, we can just record it as incorrect and null option
      if (finalOptionId) {
        await tx.answer.create({
          data: {
            attemptId: attempt.id,
            questionId,
            selectedOptionId: finalOptionId,
            isCorrect
          }
        });
      } else {
        // Record an empty incorrect answer
        await tx.answer.create({
          data: {
            attemptId: attempt.id,
            questionId,
            selectedOptionId: "",
            isCorrect: false
          }
        });
      }

      // Mark the AttemptQuestion as answered
      await tx.attemptQuestion.update({
        where: { id: currentAttemptQuestion.id },
        data: { answeredAt: new Date() }
      });
    });

    return NextResponse.json({ success: true, isLate });
  } catch (error) {
    console.error("Quiz Answer Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
