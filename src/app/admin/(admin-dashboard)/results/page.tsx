import { prisma } from '@/lib/db';
import DeleteParticipantButton from '../components/DeleteParticipantButton';
import SyncDataButton from '../components/SyncDataButton';
import ClearDataButton from '../components/ClearDataButton';
import ExportButtons from '../components/ExportButtons';
import ResultsTableClient from '../components/ResultsTableClient';

export const dynamic = 'force-dynamic';

export default async function AdminResultsPage() {
  const attempts = await prisma.attempt.findMany({
    orderBy: { submittedAt: 'desc' },
    include: {
      participant: {
        include: { coupons: true }
      },
      coupon: true,
    },
  });

  // Fetch all completed attempts to calculate historical attempt count and score arrays
  const allCompletedAttempts = await prisma.attempt.findMany({
    where: { status: 'COMPLETED' },
    select: { participantId: true, scorePercent: true, submittedAt: true, targetYear: true, participant: { select: { year: true } } },
    orderBy: { submittedAt: 'asc' } // chronological order for score array
  });

  const historyMap = new Map<string, { count: number; scores: string[] }>();
  allCompletedAttempts.forEach(a => {
    if (!historyMap.has(a.participantId)) {
      historyMap.set(a.participantId, { count: 0, scores: [] });
    }
    const h = historyMap.get(a.participantId)!;
    h.count++;
    h.scores.push(`${a.targetYear || a.participant.year}: ${a.scorePercent !== null ? a.scorePercent.toFixed(0) : 0}%`);
  });

  // Filter attempts to only show the LATEST attempt for each participant
  // Since `attempts` is already ordered by `submittedAt: 'desc'`, we just take the first one we see per participant.
  const latestAttempts = attempts.filter((attempt, index, self) =>
    index === self.findIndex((a) => a.participantId === attempt.participantId)
  );

  const exportData = latestAttempts.map((attempt) => {
    const history = historyMap.get(attempt.participantId) || { count: 0, scores: [] };
    const coupon = attempt.coupon || attempt.participant?.coupons?.[0];
    return {
      name: attempt.participant.name,
      prn: attempt.participant.prn || "N/A",
      email: attempt.participant.email,
      mobile: attempt.participant.mobile || "N/A",
      score: attempt.scorePercent !== null ? `${attempt.scorePercent.toFixed(0)}%` : "0%",
      status: attempt.status,
      couponCode: coupon?.code || "N/A",
      couponStatus: coupon?.status || "N/A",
      attemptCount: history.count,
      allScores: `[${history.scores.join(", ")}]`,
      date: attempt.submittedAt ? attempt.submittedAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true }) : "N/A"
    };
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h2 className="text-3xl font-bold text-foreground uppercase tracking-tight">Quiz Results & Coupons</h2>
        <div className="flex flex-wrap gap-3 print:hidden">
          <ExportButtons data={exportData} />
          <SyncDataButton />
          <ClearDataButton />
        </div>
      </div>

      <ResultsTableClient latestAttempts={latestAttempts} historyMap={Object.fromEntries(historyMap)} />
    </div>
  );
}
