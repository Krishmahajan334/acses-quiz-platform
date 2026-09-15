import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const revalidate = 15; // Cache the response for 15 seconds

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);

    // Get the active event
    const activeEvent = await prisma.quizEvent.findFirst({
      where: { status: 'ACTIVE' }
    });

    if (!activeEvent) {
      return NextResponse.json({ success: true, leaderboard: [] });
    }

    // Fetch attempts that have a scorePercent
    const attempts = await prisma.attempt.findMany({
      where: {
        eventId: activeEvent.id,
        scorePercent: { not: null },
        submittedAt: { not: null }
      },
      include: {
        participant: {
          select: {
            name: true,
            year: true
          }
        }
      }
    });

    // Format and sort attempts
    const leaderboard = attempts.map(attempt => {
      const timeTakenSec = Math.floor(
        (attempt.submittedAt!.getTime() - attempt.startedAt.getTime()) / 1000
      );

      return {
        id: attempt.id,
        name: attempt.participant.name,
        year: attempt.participant.year,
        score: attempt.scorePercent || 0,
        timeTakenSec
      };
    });

    // Sort primarily by score (descending), then by time taken (ascending)
    leaderboard.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.timeTakenSec - b.timeTakenSec;
    });

    // Take top N
    const topN = leaderboard.slice(0, limit);

    return NextResponse.json({
      success: true,
      leaderboard: topN
    });

  } catch (error: any) {
    console.error('Leaderboard error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load leaderboard' },
      { status: 500 }
    );
  }
}
