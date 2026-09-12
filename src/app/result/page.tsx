'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from "@/components/ui/Navbar";
import { PageBackground } from "@/components/ui/PageBackground";
import { ShieldCheck, AlertTriangle, Loader2, Trophy, Copy, CheckCircle2, ArrowRight } from "lucide-react";

interface ResultData {
  success: boolean;
  scorePercent: number;
  passed: boolean;
  couponCode: string | null;
  message?: string;
  disqualified?: boolean;
}

export default function ResultPage() {
  const [result, setResult] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const finishQuiz = async () => {
      try {
        const res = await fetch('/api/quiz/finish', {
          method: 'POST',
        });
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch results');
        }

        setResult(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    finishQuiz();
  }, []);

  const handleCopy = () => {
    if (result?.couponCode) {
      navigator.clipboard.writeText(result.couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <PageBackground />
        <div className="flex flex-col items-center animate-pulse">
          <ShieldCheck className="w-12 h-12 text-primary mb-6" />
          <div className="text-primary uppercase tracking-widest text-sm font-bold flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin" />
            Analyzing Performance...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <PageBackground />
        <div className="bg-secondary/50 border border-destructive/50 p-8 rounded-xl shadow-2xl max-w-md w-full text-center backdrop-blur-md">
          <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground uppercase tracking-widest mb-2">Error</h2>
          <p className="text-muted-foreground mb-8 text-sm">{error}</p>
          <Link href="/" className="inline-flex justify-center w-full py-4 px-6 rounded-md text-primary-foreground bg-primary hover:brightness-110 uppercase tracking-widest text-xs font-bold transition-all">
            Return to Terminal
          </Link>
        </div>
      </div>
    );
  }

  if (!result) return null;

  if (result.disqualified) {
    return (
      <>
        <Navbar />
        <PageBackground />
        <main className="relative min-h-screen pt-32 pb-16 px-6 flex flex-col items-center justify-center font-sans">
          <div className="w-full max-w-lg z-10 animate-fade-up">
            <div className="bg-destructive/10 border border-destructive p-8 sm:p-10 rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.3)] text-center relative overflow-hidden backdrop-blur-xl">
              <div className="mb-6 flex justify-center">
                <AlertTriangle className="w-24 h-24 text-destructive animate-pulse" />
              </div>
              <h2 className="text-4xl font-black text-destructive mb-4 tracking-tighter uppercase">
                DISQUALIFIED
              </h2>
              <p className="text-foreground/90 font-medium mb-8 text-lg">
                Your attempt was forcefully terminated due to repeated anti-cheat violations (tab switching, leaving fullscreen, or background apps). Your score is 0.
              </p>
              <Link href="/" className="w-full inline-flex justify-center items-center py-4 px-6 rounded-md text-sm font-bold text-destructive-foreground bg-destructive hover:brightness-110 transition-all uppercase tracking-widest">
                Return to Terminal
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <PageBackground />
      
      <main className="relative min-h-screen pt-32 pb-16 px-6 flex flex-col items-center justify-center font-sans">
        
        <div className="w-full max-w-lg z-10 animate-fade-up">
          
          <div className={`bg-secondary/40 backdrop-blur-md border p-8 sm:p-10 rounded-2xl shadow-2xl text-center relative overflow-hidden transition-all duration-500 \${result.passed ? 'border-primary/50' : 'border-border'}`}>
            
            {/* Subtle top glow based on result */}
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 blur-sm rounded-full \${result.passed ? 'bg-primary' : 'bg-muted-foreground'}`}></div>

            <div className="mb-6 flex justify-center">
              {result.passed ? (
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center border border-primary/30 shadow-[0_0_20px_rgba(34,197,94,0.15)]">
                  <Trophy className="w-10 h-10 text-primary" />
                </div>
              ) : (
                <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center border border-border">
                  <ShieldCheck className="w-10 h-10 text-muted-foreground" />
                </div>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-2 tracking-tight uppercase">
              {result.passed ? "Quiz Complete" : "Challenge Concluded"}
            </h2>
            <p className="text-muted-foreground font-medium mb-8">
              {result.passed ? "Excellent Performance. You have conquered the challenge." : "You did not meet the passing threshold. Keep learning."}
            </p>
            
            <div className="mb-8 p-6 bg-background rounded-xl border border-border shadow-inner">
              <p className="text-muted-foreground text-xs uppercase tracking-widest font-bold mb-2">Final Evaluation</p>
              <div className={`text-6xl sm:text-7xl font-black tracking-tighter \${result.passed ? 'text-primary' : 'text-foreground'}`}>
                {result.scorePercent.toFixed(0)}<span className="text-3xl text-muted-foreground opacity-60">%</span>
              </div>
            </div>

            {result.passed && result.couponCode && (
              <div className="bg-primary/5 border border-primary/30 rounded-xl p-6 mb-8 text-left relative overflow-hidden">
                <h3 className="text-primary font-bold text-sm uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Trophy className="w-4 h-4" /> Qualified Reward
                </h3>
                <p className="text-foreground/80 text-sm mb-4 leading-relaxed font-medium">
                  Congratulations on conquering the challenge! Present this secure cryptographic token at the ACSES desk to claim your <strong className="text-primary">exclusive discount for our upcoming technical event</strong>.
                  <br /><br />
                  Want even more benefits? <a href="https://forms.gle/Sa3mbHEV2eoGC6jt9" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">Become an official ACSES member today</a> to unlock additional perks, workshops, and exclusive community access!
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-background px-3 sm:px-4 py-3 rounded-lg border border-primary/20 font-mono text-xs sm:text-sm md:text-lg font-bold text-foreground tracking-widest shadow-inner select-all break-all">
                    {result.couponCode}
                  </div>
                  <button 
                    onClick={handleCopy}
                    className="bg-primary/20 hover:bg-primary/30 text-primary p-3 rounded-lg border border-primary/20 transition-colors flex-shrink-0"
                    title="Copy Coupon"
                  >
                    {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 mb-8 text-center">
              <p className="text-foreground/90 text-sm leading-relaxed">
                Want even more benefits? <a href="https://forms.gle/Sa3mbHEV2eoGC6jt9" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">Become an official ACSES member today</a> to unlock additional perks, workshops, and exclusive community access!
              </p>
            </div>

            <div className="space-y-4">
              <Link
                href="https://forms.gle/Sa3mbHEV2eoGC6jt9"
                target="_blank"
                className="w-full inline-flex justify-center items-center py-4 px-6 rounded-md text-sm font-bold text-primary-foreground bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 focus:outline-none transition-all uppercase tracking-widest"
              >
                Become an ACSES Member
              </Link>

              <Link
                href="/links-standalone.html"
                className="w-full inline-flex justify-center items-center py-4 px-6 rounded-md text-sm font-bold text-foreground bg-secondary hover:bg-secondary/80 focus:outline-none transition-all uppercase tracking-widest border border-white/5"
              >
                Access Important Links
              </Link>

              <Link
                href="/"
                className="w-full inline-flex justify-center items-center py-4 px-6 rounded-md text-sm font-bold text-primary-foreground bg-primary hover:brightness-110 focus:outline-none transition-all uppercase tracking-widest shadow-[0_0_15px_rgba(34,197,94,0.3)]"
              >
                Return to Terminal
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
