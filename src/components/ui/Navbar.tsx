import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function Navbar({ hideStartButton = false, rightNode }: { hideStartButton?: boolean, rightNode?: React.ReactNode }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4 md:px-6 lg:px-16 md:py-5 bg-background/50 backdrop-blur-md border-b border-white/5 flex items-center justify-between">
      <div className="flex items-center">
        <Link href="/" className="flex items-center">
          <img 
            src="/logo copy.png" 
            alt="ACSES Logo" 
            className="h-8 md:h-9 w-auto object-contain hover:opacity-80 transition-opacity"
          />
        </Link>
      </div>

      <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground uppercase tracking-widest font-medium">
        <Link href="/quiz" className="hover:text-foreground transition-colors">Quiz</Link>
        <Link href="/rules" className="hover:text-foreground transition-colors">Rules</Link>
        <Link href="https://acses-dkte.vercel.app/" target="_blank" className="hover:text-foreground transition-colors">About ACSES</Link>
      </nav>

      <div className="flex items-center gap-4">
        {!hideStartButton && (
          <>
            <Link 
              href="/register" 
              className="hidden md:inline-flex bg-nav-button text-foreground hover:bg-nav-button/80 active:scale-[0.97] transition-all rounded-lg uppercase text-xs tracking-widest px-6 py-3 border border-white/10"
            >
              Start Quiz
            </Link>
            {/* Mobile minimal CTA */}
            <Link 
              href="/register" 
              className="md:hidden bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.97] transition-all rounded-md uppercase text-xs font-bold tracking-widest px-4 py-2"
            >
              Start
            </Link>
          </>
        )}
        {rightNode}
      </div>
    </header>
  );
}
