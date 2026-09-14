import { prisma } from '@/lib/db';
import ClearDataButton from './components/ClearDataButton';
import SyncDataButton from './components/SyncDataButton';
import ToggleMultipleButton from './components/ToggleMultipleButton';
import { Users, LayoutList, CheckCircle, Ticket } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const totalParticipants = await prisma.participant.count();
  const totalAttempts = await prisma.attempt.count();
  const completedAttempts = await prisma.attempt.count({ where: { status: 'COMPLETED' } });
  const totalCoupons = await prisma.coupon.count();
  
  const activeEvent = await prisma.quizEvent.findFirst({ where: { status: 'ACTIVE' } });
  const allowMultipleAttempts = activeEvent?.allowMultipleAttempts || false;

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-border pb-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground uppercase tracking-tight">Dashboard Overview</h2>
          <p className="text-muted-foreground mt-1 text-sm uppercase tracking-widest">System Metrics & Controls</p>
        </div>
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          <ToggleMultipleButton initialState={allowMultipleAttempts} />
          <SyncDataButton />
          <ClearDataButton />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stat Card */}
        <div className="bg-secondary/40 rounded-xl shadow-lg border border-border p-6 hover:border-primary/50 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
          <div className="flex justify-between items-start mb-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Participants</p>
            <Users className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-4xl font-black text-foreground tracking-tighter">{totalParticipants}</h3>
        </div>

        <div className="bg-secondary/40 rounded-xl shadow-lg border border-border p-6 hover:border-primary/50 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
          <div className="flex justify-between items-start mb-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Attempts</p>
            <LayoutList className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-4xl font-black text-foreground tracking-tighter">{totalAttempts}</h3>
        </div>

        <div className="bg-secondary/40 rounded-xl shadow-lg border border-border p-6 hover:border-primary/50 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors"></div>
          <div className="flex justify-between items-start mb-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Completed</p>
            <CheckCircle className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-4xl font-black text-primary tracking-tighter">{completedAttempts}</h3>
        </div>

        <div className="bg-secondary/40 rounded-xl shadow-lg border border-border p-6 hover:border-primary/50 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors"></div>
          <div className="flex justify-between items-start mb-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Coupons</p>
            <Ticket className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-4xl font-black text-foreground tracking-tighter">{totalCoupons}</h3>
        </div>
      </div>

      <div className="mt-8 bg-secondary/40 rounded-xl shadow-lg border border-border p-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-1 bg-primary/20 blur-md rounded-full"></div>
        <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-4">System Status</h3>
        <div className="flex items-center gap-3 text-sm text-muted-foreground p-4 bg-background/50 rounded-lg border border-white/5">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          All systems nominal. Ready for real-time activity tracking.
        </div>
      </div>
    </div>
  );
}
