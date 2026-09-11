import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;

    if (!token || token !== process.env.ADMIN_AUTH_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const questions = await request.json();

    if (!Array.isArray(questions)) {
      return NextResponse.json({ error: "Payload must be an array of questions" }, { status: 400 });
    }

    // Get the active event to link questions to
    const activeEvent = await prisma.quizEvent.findFirst({
      where: { status: 'ACTIVE' }
    });

    if (!activeEvent) {
      return NextResponse.json({ error: "No active event found. Please create an active event first." }, { status: 400 });
    }

    let addedCount = 0;

    // Use a transaction to safely insert all questions and options
    await prisma.$transaction(async (tx) => {
      for (const q of questions) {
        if (!q.text || !q.topic || !q.difficulty || !Array.isArray(q.options) || q.options.length === 0) {
          throw new Error("Invalid question format detected. Ensure text, topic, difficulty, and options exist.");
        }

        const newQuestion = await tx.question.create({
          data: {
            eventId: activeEvent.id,
            text: q.text,
            topic: q.topic,
            difficulty: q.difficulty,
            targetYear: q.targetYear || "ALL",
            durationSec: q.durationSec ? parseInt(q.durationSec) : null,
            imageUrl: q.imageUrl || null,
          }
        });

        const optionsData = q.options.map((opt: any, index: number) => ({
          questionId: newQuestion.id,
          text: opt.text,
          optionKey: String.fromCharCode(65 + index), // A, B, C, D
          isCorrect: Boolean(opt.isCorrect)
        }));

        await tx.option.createMany({
          data: optionsData
        });
        
        addedCount++;
      }
    });

    return NextResponse.json({ success: true, message: `Successfully imported ${addedCount} questions.` });
  } catch (error: any) {
    console.error("Bulk Upload Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;

    if (!token || token !== process.env.ADMIN_AUTH_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // We must delete child records FIRST in SQLite/Prisma without cascade deletes
    // 1. Delete answers (references Options and AttemptQuestions)
    await prisma.answer.deleteMany({});
    
    // 2. Delete attempt questions (references Questions)
    await prisma.attemptQuestion.deleteMany({});

    // 3. Delete options (references Questions)
    await prisma.option.deleteMany({});

    // 4. Finally, delete the questions
    const result = await prisma.question.deleteMany({});

    return NextResponse.json({ success: true, message: `Successfully deleted ${result.count} questions.` });
  } catch (error: any) {
    console.error("Bulk Delete Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
