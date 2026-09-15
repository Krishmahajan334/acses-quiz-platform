import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { ShieldCheck, LayoutDashboard, Database, Trophy, LogOut, Users, QrCode, Settings } from 'lucide-react';
import { getAdminSession, isSuperAdmin } from '@/lib/auth';

import { AdminFetchPatcher } from './components/AdminFetchPatcher';
import { VersionBadge } from './components/VersionBadge';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  
  if (!session) {
    redirect('/admin/login');
  }

  const isSuper = isSuperAdmin(session);

  return (
    <div className="min-h-screen bg-background flex font-sans">
      <AdminFetchPatcher />
      {/* Sidebar */}
      <div className="w-64 bg-secondary/30 border-r border-border flex-col hidden md:flex print:hidden">
        <div className="p-6 flex items-center gap-3 border-b border-border">
          <ShieldCheck className="w-6 h-6 text-primary shrink-0" />
          <h1 className="text-xl font-bold text-foreground tracking-tight uppercase shrink-0">Admin</h1>
          <VersionBadge 
            sha={process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA}
            message={process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_MESSAGE}
            author={process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_AUTHOR_LOGIN}
            branch={process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF}
          />
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-all text-sm font-medium uppercase tracking-wide">
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          <Link href="/admin/event-settings" className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-all text-sm font-medium uppercase tracking-wide">
            <ShieldCheck className="w-4 h-4" />
            Event Settings
          </Link>
          <Link href="/admin/settings" className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-all text-sm font-medium uppercase tracking-wide">
            <Settings className="w-4 h-4" />
            Registration Settings
          </Link>
          {isSuper && (
            <Link href="/admin/admins" className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-all text-sm font-medium uppercase tracking-wide">
              <Users className="w-4 h-4" />
              Manage Admins
            </Link>
          )}
          <Link href="/admin/questions" className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-all text-sm font-medium uppercase tracking-wide">
            <Database className="w-4 h-4" />
            Question Bank
          </Link>
          <Link href="/admin/results" className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-all text-sm font-medium uppercase tracking-wide">
            <Trophy className="w-4 h-4" />
            Results & Coupons
          </Link>
          <Link href="/admin/redeem" className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-all text-sm font-medium uppercase tracking-wide">
            <QrCode className="w-4 h-4" />
            Scanner (Redeem)
          </Link>
        </nav>
        <div className="p-6 border-t border-border flex flex-col gap-4">
          <a href="/api/admin/logout" className="flex items-center justify-center gap-2 w-full px-4 py-3 text-xs uppercase tracking-widest font-bold text-destructive hover:text-destructive transition-all border border-destructive/30 rounded-md hover:bg-destructive/10">
            <LogOut className="w-4 h-4" />
            Logout Admin
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative print:overflow-visible">
        {/* Subtle grid background for admin */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        
        {/* Mobile Header (Top) */}
        <header className="bg-secondary/50 border-b border-border md:hidden p-4 flex justify-between items-center z-10 backdrop-blur-md print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold text-foreground uppercase tracking-widest">Admin</h1>
          </div>
          <Link href="/" className="text-xs uppercase tracking-widest font-bold text-primary flex items-center gap-1">
            <LogOut className="w-3 h-3" />
            Exit
          </Link>
        </header>
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 z-10 pb-20 md:pb-8 print:overflow-visible print:h-auto">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border flex justify-around items-center p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] z-50 print:hidden">
          <Link href="/admin" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Dashboard</span>
          </Link>
          <Link href="/admin/questions" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
            <Database className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Questions</span>
          </Link>
          <Link href="/admin/results" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
            <Trophy className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Results</span>
          </Link>
          <Link href="/admin/redeem" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors hidden sm:flex">
            <QrCode className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Scanner</span>
          </Link>
          <Link href="/admin/settings" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
            <Settings className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Settings</span>
          </Link>
          {isSuper && (
            <Link href="/admin/admins" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
              <Users className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Admins</span>
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}
