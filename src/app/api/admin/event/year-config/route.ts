import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId, configs } = await request.json();

    if (!eventId || !configs || !Array.isArray(configs)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // Using transaction to save all configs reliably
    await prisma.$transaction(async (tx) => {
      for (const conf of configs) {
        await tx.eventYearConfig.upsert({
          where: { eventId_year: { eventId, year: conf.year } },
          update: {
            easyCount: conf.easyCount,
            mediumCount: conf.mediumCount,
            hardCount: conf.hardCount,
            excludedTopics: conf.excludedTopics
          },
          create: {
            eventId,
            year: conf.year,
            easyCount: conf.easyCount,
            mediumCount: conf.mediumCount,
            hardCount: conf.hardCount,
            excludedTopics: conf.excludedTopics
          }
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error saving year config:", error);
    return NextResponse.json({ error: error.message || "Failed to save settings" }, { status: 500 });
  }
}
