import { NextResponse } from 'next/server';
import { registrationSchema } from '@/lib/validations';
import { prisma } from '@/lib/db';
import { getActiveEvent, generateAttempt } from '@/lib/quiz';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = registrationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", issues: result.error.issues }, { status: 400 });
    }

    const data = result.data;

    // Get Active Event
    const event = await getActiveEvent();
    if (!event) {
      return NextResponse.json({ error: "No active event found. Please try again later." }, { status: 400 });
    }

    // Upsert Participant
    const participant = await prisma.participant.upsert({
      where: { email: data.email },
      update: {
        name: data.name,
        mobile: data.mobile,
        year: data.year,
        prn: data.prn || null,
      },
      create: {
        name: data.name,
        email: data.email,
        mobile: data.mobile,
        year: data.year,
        prn: data.prn || null,
      }
    });

    try {
      await generateAttempt(participant.id, event.id, event.durationSec, event.questionCount);
    } catch (e: any) {
      return NextResponse.json({ error: e.message || "Failed to generate attempt" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Registration successful. Attempt started." });
  } catch (error) {
    console.error("Registration Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
