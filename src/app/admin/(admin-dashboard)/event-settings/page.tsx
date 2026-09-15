import { prisma } from '@/lib/db';
import EventSettingsClient from './EventSettingsClient';

export const dynamic = 'force-dynamic';

export default async function EventSettingsPage() {
  const activeEvent = await prisma.quizEvent.findFirst({
    where: { status: 'ACTIVE' },
    include: { yearConfigs: true }
  });

  if (!activeEvent) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No active event found. Please create an event first.
      </div>
    );
  }

  // Get all active questions to build topic stats
  const questions = await prisma.question.findMany({
    where: { eventId: activeEvent.id, status: 'ACTIVE' },
    select: { topic: true, difficulty: true, targetYear: true }
  });
  
  type TopicStat = { Easy: number; Medium: number; Hard: number; Total: number; targetYears: Set<string> };
  const topicStatsMap = new Map<string, TopicStat>();
  
  for (const q of questions) {
    if (!q.topic) continue;
    if (!topicStatsMap.has(q.topic)) {
      topicStatsMap.set(q.topic, { Easy: 0, Medium: 0, Hard: 0, Total: 0, targetYears: new Set() });
    }
    
    const stats = topicStatsMap.get(q.topic)!;
    const diff = q.difficulty === 'Easy' || q.difficulty === 'Medium' || q.difficulty === 'Hard' 
      ? q.difficulty 
      : 'Medium';
      
    stats[diff]++;
    stats.Total++;
    stats.targetYears.add(q.targetYear || 'ALL');
  }

  const topicStats: Record<string, { Easy: number; Medium: number; Hard: number; Total: number; targetYears: string[] }> = {};
  for (const [topic, stat] of Array.from(topicStatsMap.entries())) {
    topicStats[topic] = {
      Easy: stat.Easy,
      Medium: stat.Medium,
      Hard: stat.Hard,
      Total: stat.Total,
      targetYears: Array.from(stat.targetYears)
    };
  }

  // Sort topics alphabetically
  const allTopics = Object.keys(topicStats).sort();

  return (
    <div>
      <div className="mb-8 border-b border-border pb-6">
        <h2 className="text-3xl font-bold text-foreground uppercase tracking-tight">Event Settings</h2>
        <p className="text-muted-foreground mt-1 text-sm uppercase tracking-widest">
          Configure difficulty distribution and topics per academic year
        </p>
      </div>

      <EventSettingsClient 
        activeEvent={activeEvent}
        allTopics={allTopics}
        topicStats={topicStats}
      />
    </div>
  );
}
