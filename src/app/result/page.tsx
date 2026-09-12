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
  reviewData?: {
    questionText: string;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }[];
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
      
      <main className="relative min-h-screen pt-20 pb-8 px-4 sm:px-6 flex flex-col items-center justify-center font-sans">
        
        <div className="w-full max-w-lg z-10 animate-fade-up">
          
          <div className={`bg-secondary/40 backdrop-blur-md border p-6 sm:p-8 rounded-2xl shadow-2xl text-center relative overflow-hidden transition-all duration-500 \${result.passed ? 'border-primary/50' : 'border-border'}`}>
            
            {/* Subtle top glow based on result */}
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 blur-sm rounded-full \${result.passed ? 'bg-primary' : 'bg-muted-foreground'}`}></div>

            <div className="mb-3 flex justify-center">
              {result.passed ? (
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary/10 rounded-full flex items-center justify-center border border-primary/30 shadow-[0_0_20px_rgba(34,197,94,0.15)]">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
              ) : (
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-secondary rounded-full flex items-center justify-center border border-border">
                  <ShieldCheck className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground mb-1 tracking-tight uppercase">
              {result.passed ? "Quiz Complete" : "Challenge Concluded"}
            </h2>
            <p className="text-muted-foreground text-sm font-medium mb-4">
              {result.passed ? "Excellent Performance. You have conquered the challenge." : "You did not meet the passing threshold. Keep learning."}
            </p>
            
            <div className="mb-4 p-4 sm:p-6 bg-background rounded-xl border border-border shadow-inner">
              <p className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-widest font-bold mb-1">Final Evaluation</p>
              <div className={`text-5xl sm:text-6xl font-black tracking-tighter \${result.passed ? 'text-primary' : 'text-foreground'}`}>
                {result.scorePercent.toFixed(0)}<span className="text-2xl sm:text-3xl text-muted-foreground opacity-60">%</span>
              </div>
            </div>

            {/* Answer Review Accordion */}
            {result.reviewData && result.reviewData.length > 0 && (
              <details className="group border border-border rounded-xl bg-background/50 mb-5 overflow-hidden transition-all text-left">
                <summary className="p-4 cursor-pointer font-bold text-sm uppercase tracking-widest text-foreground flex justify-between items-center bg-secondary/30 group-open:bg-secondary/50 transition-colors select-none">
                  Review Your Answers & Check Correct Options
                  <span className="text-primary transform group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="p-4 max-h-[500px] overflow-y-auto space-y-4 border-t border-border">
                  {result.reviewData.map((item, index) => (
                    <div key={index} className="p-3 rounded-lg bg-secondary/20 border border-white/5 text-sm">
                      <p className="font-medium text-foreground mb-3">{index + 1}. {item.questionText}</p>
                      
                      <div className="flex flex-col gap-2">
                        {item.isCorrect ? (
                          <div className="flex items-start gap-2 bg-primary/10 border border-primary/20 p-2 rounded">
                            <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                            <div className="text-primary font-medium">
                              <span className="text-primary/70 text-xs uppercase mr-2 tracking-wider">You answered:</span>
                              {item.selectedAnswer}
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 p-2 rounded">
                              <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                              <div className="text-destructive font-medium">
                                <span className="text-destructive/70 text-xs uppercase mr-2 tracking-wider">You answered:</span>
                                {item.selectedAnswer}
                              </div>
                            </div>
                            <div className="flex items-start gap-2 bg-primary/10 border border-primary/20 p-2 rounded">
                              <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                              <div className="text-primary font-medium">
                                <span className="text-primary/70 text-xs uppercase mr-2 tracking-wider">Correct answer:</span>
                                {item.correctAnswer}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}

            {result.passed && result.couponCode && (
              <div className="bg-primary/5 border border-primary/30 rounded-xl p-4 sm:p-5 mb-5 text-left relative overflow-hidden">
                <h3 className="text-primary font-bold text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Trophy className="w-3 h-3" /> Qualified Reward
                </h3>
                <p className="text-foreground/80 text-xs sm:text-sm mb-3 leading-relaxed font-medium">
                  Congratulations on conquering the challenge! Present this secure cryptographic token at the ACSES desk to claim your <strong className="text-primary">exclusive discount for our upcoming technical event</strong>.
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-background px-3 py-2 sm:px-4 sm:py-3 rounded-lg border border-primary/20 font-mono text-xs sm:text-sm md:text-base font-bold text-foreground tracking-widest shadow-inner select-all break-all">
                    {result.couponCode}
                  </div>
                  <button 
                    onClick={handleCopy}
                    className="bg-primary/20 hover:bg-primary/30 text-primary p-2 sm:p-3 rounded-lg border border-primary/20 transition-colors flex-shrink-0"
                    title="Copy Coupon"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Copy className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Massive Membership CTA */}
            <a 
              href="https://forms.gle/Sa3mbHEV2eoGC6jt9" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block relative w-full rounded-2xl bg-gradient-to-br from-primary/30 via-primary/10 to-background border-2 border-primary/50 p-5 sm:p-6 mb-5 hover:border-primary transition-all group overflow-hidden cursor-pointer shadow-[0_0_40px_rgba(34,197,94,0.15)] hover:shadow-[0_0_60px_rgba(34,197,94,0.25)] hover:-translate-y-1"
            >
              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none"></div>
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-500"></div>
              
              <div className="relative flex flex-col items-center text-center">
                <div className="mb-3 relative">
                  <div className="absolute inset-0 bg-primary rounded-full blur-xl opacity-50 group-hover:opacity-70 animate-pulse transition-opacity"></div>
                  <div className="w-12 h-12 bg-primary/20 rounded-full border border-primary/50 flex items-center justify-center relative z-10">
                    <ShieldCheck className="w-6 h-6 text-primary" />
                  </div>
                </div>
                
                <h3 className="text-xl sm:text-2xl font-black text-foreground uppercase tracking-tighter mb-1">
                  Join the <span className="text-primary">Elite 1%</span>
                </h3>
                <p className="text-primary font-bold uppercase tracking-widest text-[10px] sm:text-xs mb-3">
                  Become an Official ACSES Member
                </p>
                <p className="text-foreground/80 text-xs mb-5 leading-relaxed max-w-sm mx-auto hidden sm:block">
                  Unlock exclusive technical workshops, premium events, and VIP access to the best computer science community on campus.
                </p>
                
                <div className="bg-primary text-primary-foreground w-full py-3 rounded-md font-black uppercase tracking-widest text-xs group-hover:brightness-110 shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all flex items-center justify-center">
                  Register Now
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </a>

            <div className="space-y-3">
              <Link
                href="/links-standalone.html"
                className="w-full inline-flex justify-center items-center py-3 px-4 rounded-md text-xs sm:text-sm font-bold text-foreground bg-secondary hover:bg-secondary/80 focus:outline-none transition-all uppercase tracking-widest border border-white/5"
              >
                Access Important Links
              </Link>

              <Link
                href="/"
                className="w-full inline-flex justify-center items-center py-3 px-4 rounded-md text-xs sm:text-sm font-bold text-primary-foreground bg-primary/20 text-primary hover:bg-primary/30 focus:outline-none transition-all uppercase tracking-widest"
              >
                Return to Terminal
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
