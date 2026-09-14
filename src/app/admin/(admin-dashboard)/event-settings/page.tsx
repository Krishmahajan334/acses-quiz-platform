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

  // Get all unique topics in the question bank
  const topicsRaw = await prisma.question.findMany({
    where: { eventId: activeEvent.id },
    select: { topic: true },
    distinct: ['topic']
  });
  
  const allTopics = topicsRaw.map(t => t.topic).filter(Boolean).sort();

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
      />
    </div>
  );
}
