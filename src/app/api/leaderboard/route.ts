import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

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

    // Format and sort all attempts
    const formattedAttempts = attempts.map(attempt => {
      const timeTakenSec = Math.floor(
        (attempt.submittedAt!.getTime() - attempt.startedAt.getTime()) / 1000
      );

      return {
        id: attempt.id,
        participantId: attempt.participantId,
        name: attempt.participant.name,
        year: attempt.participant.year,
        score: attempt.scorePercent || 0,
        timeTakenSec
      };
    });

    // Group by participant and select the best attempt
    const bestAttemptsMap = new Map<string, typeof formattedAttempts[0]>();
    
    formattedAttempts.forEach(attempt => {
      const existing = bestAttemptsMap.get(attempt.participantId);
      if (!existing) {
        bestAttemptsMap.set(attempt.participantId, attempt);
      } else {
        // If current attempt has higher score, OR (same score AND lower time), it is better
        if (
          attempt.score > existing.score ||
          (attempt.score === existing.score && attempt.timeTakenSec < existing.timeTakenSec)
        ) {
          bestAttemptsMap.set(attempt.participantId, attempt);
        }
      }
    });

    const leaderboard = Array.from(bestAttemptsMap.values());

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
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30'
      }
    });

  } catch (error: any) {
    console.error('Leaderboard error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load leaderboard' },
      { status: 500 }
    );
  }
}
