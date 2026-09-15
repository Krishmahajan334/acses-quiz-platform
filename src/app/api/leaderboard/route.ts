import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const revalidate = 15; // Cache the response for 15 seconds

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limitParam = url.searchParams.get('limit') || '20';
    const limit = limitParam === 'all' ? Infinity : parseInt(limitParam, 10);
    const yearParam = url.searchParams.get('year') || 'All';

    // Get the active event
    const activeEvent = await prisma.quizEvent.findFirst({
      where: { status: 'ACTIVE' }
    });

    if (!activeEvent) {
      return NextResponse.json({ success: true, leaderboard: [] });
    }

    const whereClause: any = {
      eventId: activeEvent.id,
      scorePercent: { not: null },
      submittedAt: { not: null }
    };

    // Filter by year if specified
    if (yearParam !== 'All') {
      whereClause.participant = {
        year: yearParam
      };
    }

    // Fetch attempts that have a scorePercent
    const attempts = await prisma.attempt.findMany({
      where: whereClause,
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
    const topN = limit === Infinity ? leaderboard : leaderboard.slice(0, limit);

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
