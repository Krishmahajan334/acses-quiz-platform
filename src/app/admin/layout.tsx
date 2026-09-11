import Link from 'next/link';
import { ShieldCheck, LayoutDashboard, Database, Trophy, LogOut } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-secondary/30 border-r border-border flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-3 border-b border-border">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground tracking-tight uppercase">Admin</h1>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-all text-sm font-medium uppercase tracking-wide">
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          <Link href="/admin/questions" className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-all text-sm font-medium uppercase tracking-wide">
            <Database className="w-4 h-4" />
            Question Bank
          </Link>
          <Link href="/admin/results" className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-all text-sm font-medium uppercase tracking-wide">
            <Trophy className="w-4 h-4" />
            Results & Coupons
          </Link>
        </nav>
        <div className="p-6 border-t border-border">
          <Link href="/" className="flex items-center justify-center gap-2 w-full px-4 py-3 text-xs uppercase tracking-widest font-bold text-muted-foreground hover:text-foreground transition-all border border-border rounded-md hover:bg-secondary/50">
            <LogOut className="w-4 h-4" />
            Exit to Terminal
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Subtle grid background for admin */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        
        {/* Mobile Header */}
        <header className="bg-secondary/50 border-b border-border md:hidden p-4 flex justify-between items-center z-10 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold text-foreground uppercase tracking-widest">Admin</h1>
          </div>
          <Link href="/" className="text-xs uppercase tracking-widest font-bold text-primary">Exit</Link>
        </header>
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-8 z-10">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
