"use client";

import Link from 'next/link';
import { Navbar } from '@/components/ui/Navbar';
import { PageBackground } from '@/components/ui/PageBackground';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <>
      <Navbar />
      <PageBackground />
      
      <main className="relative min-h-screen flex flex-col justify-end pb-16 lg:pb-32 px-6 lg:px-16 overflow-hidden">
        
        {/* Technical Grid Background Fallback is provided by PageBackground */}

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl pt-32">
          
          <h1 className="text-[clamp(3rem,8vw,6rem)] font-bold leading-[1.05] tracking-[-0.05em] uppercase text-foreground mb-6 animate-fade-up">
            THINK. CODE.<br />
            <span className="text-primary">CONQUER.</span>
          </h1>

          <h2 className="text-[clamp(1.125rem,2.5vw,1.875rem)] font-light text-foreground/80 mb-4 max-w-2xl animate-fade-up animation-delay-200">
            Test your Computer Science knowledge with the ACSES Technical Quiz.
          </h2>

          <p className="text-[clamp(0.875rem,1.5vw,1.25rem)] font-light text-muted-foreground mb-10 max-w-xl animate-fade-up animation-delay-400">
            Challenge yourself with beginner and medium-level questions across programming, DSA, DBMS, operating systems, networking and more.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-fade-up animation-delay-550">
            <Link
              href="/register"
              className="bg-primary text-primary-foreground px-6 py-3 md:px-8 md:py-4 text-sm font-bold rounded-sm hover:brightness-110 active:scale-[0.97] transition-all flex items-center justify-center uppercase tracking-widest w-full sm:w-auto"
            >
              Start Quiz
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            
            <Link
              href="/rules"
              className="bg-white text-background px-6 py-3 md:px-8 md:py-4 text-sm font-bold rounded-sm hover:brightness-90 active:scale-[0.97] transition-all flex items-center justify-center uppercase tracking-widest w-full sm:w-auto"
            >
              View Rules
            </Link>
          </div>

          <div className="mt-16 animate-fade-up animation-delay-700">
            <p className="text-muted-foreground/60 text-xs font-light tracking-wide uppercase">
              ACSES • TECHNICAL QUIZ • CSE • CHALLENGE YOURSELF
            </p>
          </div>

        </div>
      </main>
    </>
  );
}
