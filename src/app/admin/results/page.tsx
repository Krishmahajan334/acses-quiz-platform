import { prisma } from '@/lib/db';
import DeleteParticipantButton from '../components/DeleteParticipantButton';

export const dynamic = 'force-dynamic';

export default async function AdminResultsPage() {
  const attempts = await prisma.attempt.findMany({
    orderBy: { submittedAt: 'desc' },
    include: {
      participant: true,
      coupon: true,
    },
  });

  // Fetch all completed attempts to calculate historical attempt count and score arrays
  const allCompletedAttempts = await prisma.attempt.findMany({
    where: { status: 'COMPLETED' },
    select: { participantId: true, scorePercent: true, submittedAt: true },
    orderBy: { submittedAt: 'asc' } // chronological order for score array
  });

  const historyMap = new Map<string, { count: number; scores: string[] }>();
  allCompletedAttempts.forEach(a => {
    if (!historyMap.has(a.participantId)) {
      historyMap.set(a.participantId, { count: 0, scores: [] });
    }
    const h = historyMap.get(a.participantId)!;
    h.count++;
    h.scores.push(`${a.scorePercent !== null ? a.scorePercent.toFixed(0) : 0}%`);
  });

  // Filter attempts to only show the LATEST attempt for each participant
  // Since `attempts` is already ordered by `submittedAt: 'desc'`, we just take the first one we see per participant.
  const latestAttempts = attempts.filter((attempt, index, self) =>
    index === self.findIndex((a) => a.participantId === attempt.participantId)
  );

  return (
    <div>
      <h2 className="text-3xl font-bold text-foreground uppercase tracking-tight mb-8">Quiz Results & Coupons</h2>

      <div className="bg-secondary/40 shadow-lg border border-border rounded-xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-background/50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Name / PRN</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Email</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">History</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Score</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Coupon Code</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {latestAttempts.map((attempt) => {
                const history = historyMap.get(attempt.participantId) || { count: 0, scores: [] };
                return (
                <tr key={attempt.id} className="hover:bg-secondary/60 transition-colors">
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <div className="text-xs sm:text-sm font-bold text-foreground break-words">{attempt.participant.name}</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">PRN: {attempt.participant.prn || 'N/A'} ({attempt.participant.year})</div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-muted-foreground hidden sm:table-cell">
                    {attempt.participant.email}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden lg:table-cell">
                    {history.count > 0 ? (
                      <div className="flex flex-col">
                        <span className="text-xs text-foreground font-bold">{history.count} {history.count === 1 ? 'attempt' : 'attempts'}</span>
                        <span className="text-[10px] text-muted-foreground opacity-80 tracking-widest mt-0.5">[{history.scores.join(', ')}]</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-foreground font-black">
                    {attempt.scorePercent !== null ? `${attempt.scorePercent.toFixed(0)}%` : '-'}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-md \${
                      attempt.status === 'COMPLETED' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30'
                    }`}>
                      {attempt.status}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-mono font-bold text-foreground hidden md:table-cell">
                    {attempt.coupon?.code || <span className="text-muted-foreground font-normal">N/A</span>}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-[10px] sm:text-sm text-muted-foreground font-medium">
                    {attempt.submittedAt 
                      ? new Date(attempt.submittedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true }) 
                      : 'In Progress'}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-sm font-medium">
                    <DeleteParticipantButton participantId={attempt.participantId} name={attempt.participant.name} />
                  </td>
                </tr>
                );
              })}
              
              {attempts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm font-medium text-muted-foreground uppercase tracking-widest">
                    No quiz attempts found yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
