import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const p = await params;
    const { id } = p;

    if (!id) {
      return NextResponse.json({ error: "Missing question ID" }, { status: 400 });
    }

    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        options: {
          orderBy: { optionKey: 'asc' }
        }
      }
    });

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    return NextResponse.json(question);
  } catch (error: any) {
    console.error("Get Question Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch question" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const p = await params;
    const { id } = p;
    const body = await request.json();

    const {
      eventId,
      text,
      imageUrl,
      durationSec,
      difficulty,
      topic,
      options
    } = body;

    if (!text || !eventId || !options || options.length !== 4) {
      return NextResponse.json({ error: "Missing required fields or invalid options count" }, { status: 400 });
    }

    // Validate that exactly one option is correct
    const correctCount = options.filter((o: any) => o.isCorrect).length;
    if (correctCount !== 1) {
      return NextResponse.json({ error: "Exactly one option must be marked as correct." }, { status: 400 });
    }

    const updatedQuestion = await prisma.$transaction(async (tx) => {
      const q = await tx.question.update({
        where: { id },
        data: {
          eventId,
          text,
          imageUrl: imageUrl || null,
          durationSec: durationSec ? parseInt(durationSec, 10) : null,
          difficulty,
          topic,
        }
      });

      // Update options individually to avoid FOREIGN KEY constraint failures
      for (const opt of options) {
        if (opt.id) {
          await tx.option.update({
            where: { id: opt.id },
            data: {
              text: opt.text,
              isCorrect: opt.isCorrect,
              optionKey: opt.optionKey
            }
          });
        }
      }

      return q;
    });

    return NextResponse.json({ success: true, question: updatedQuestion });
  } catch (error: any) {
    console.error("Update Question Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update question" }, { status: 500 });
  }
}
