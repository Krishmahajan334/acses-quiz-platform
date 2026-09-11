import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const { eventId, text, difficulty, topic, imageUrl, durationSec, options } = data;

    if (!eventId || !text || !difficulty || !topic || !options || options.length !== 4) {
      return NextResponse.json({ error: "Missing required fields or invalid options count (must be 4)." }, { status: 400 });
    }

    const hasCorrectOption = options.some((opt: any) => opt.isCorrect === true);
    if (!hasCorrectOption) {
      return NextResponse.json({ error: "At least one option must be marked as correct." }, { status: 400 });
    }

    const question = await prisma.question.create({
      data: {
        eventId,
        text,
        difficulty,
        topic,
        imageUrl: imageUrl || null,
        durationSec: durationSec ? parseInt(durationSec, 10) : null,
        options: {
          create: options.map((opt: any) => ({
            text: opt.text,
            optionKey: opt.optionKey,
            isCorrect: opt.isCorrect,
          }))
        }
      },
      include: {
        options: true
      }
    });

    return NextResponse.json({ success: true, question });

  } catch (error) {
    console.error("Failed to create question:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
