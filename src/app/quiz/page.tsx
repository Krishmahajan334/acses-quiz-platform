'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageBackground } from "@/components/ui/PageBackground";
import { Loader2, AlertTriangle, ShieldCheck, EyeOff } from "lucide-react";

interface Option {
  id: string;
  text: string;
}

interface QuestionData {
  questionId: string;
  position: number;
  totalQuestions: number;
  text: string;
  options: Option[];
  imageUrl?: string | null;
  deadlineAt: string;
  completed?: boolean;
}

export default function QuizPage() {
  const router = useRouter();
  const [questionData, setQuestionData] = useState<QuestionData | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [cheatWarning, setCheatWarning] = useState(false);

  const fetchCurrentQuestion = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/quiz/current');
      
      if (res.status === 401) {
        router.push('/result');
        return;
      }
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);

      if (data.completed) {
        router.push('/result');
        return;
      }

      setQuestionData(data);
      setSelectedOption(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch question');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentQuestion();

    // Anti-Cheat: Prevent context menu, copy, paste, and track tab switching
    const preventDefault = (e: Event) => e.preventDefault();
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setCheatWarning(true);
      }
    };

    document.addEventListener('contextmenu', preventDefault);
    document.addEventListener('copy', preventDefault);
    document.addEventListener('paste', preventDefault);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('copy', preventDefault);
      document.removeEventListener('paste', preventDefault);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!questionData?.deadlineAt) return;
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const deadline = new Date(questionData.deadlineAt).getTime();
      const diff = deadline - now;

      if (diff <= 0) {
        clearInterval(interval);
        setTimeLeft('00:00');
        submitAnswer(selectedOption);
        return;
      }

      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      
      if (diff < 60000) {
        setIsUrgent(true);
      } else {
        setIsUrgent(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [questionData?.deadlineAt, router]);

  async function submitAnswer(optionIdToSubmit: string | null = null) {
    if (!questionData) return;
    
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/quiz/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: questionData.questionId,
          selectedOptionId: optionIdToSubmit
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit answer');
      }

      await fetchCurrentQuestion();
    } catch (err: any) {
      setError(err.message || 'Error submitting answer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedOption) return;
    await submitAnswer(selectedOption);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans select-none flex flex-col">
        <PageBackground />
        
        {/* Skeleton Top Navbar */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/5">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 animate-pulse">
              <div className="w-6 h-6 bg-secondary rounded-full"></div>
              <div className="w-16 h-4 bg-secondary rounded hidden sm:block"></div>
            </div>
            <div className="flex items-center gap-3 animate-pulse">
              <div className="w-12 h-4 bg-secondary rounded"></div>
              <div className="w-8 h-4 bg-secondary rounded"></div>
            </div>
          </div>
          <div className="h-[2px] w-full bg-secondary relative overflow-hidden"></div>
        </div>

        {/* Skeleton Main Content */}
        <div className="flex-1 max-w-4xl w-full mx-auto px-6 pt-32 pb-24 flex flex-col relative z-10">
          <div className="flex justify-end mb-8 animate-pulse">
            <div className="w-24 h-10 bg-secondary rounded-md"></div>
          </div>

          <div className="flex-1 flex flex-col space-y-6 animate-pulse">
            <div className="w-full h-8 bg-secondary rounded-md"></div>
            <div className="w-3/4 h-8 bg-secondary rounded-md mb-8"></div>

            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-full h-20 bg-secondary/50 rounded-xl border border-border"></div>
              ))}
            </div>
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
          <h3 className="text-xl font-bold text-foreground uppercase tracking-widest mb-2">Connection Error</h3>
          <p className="text-muted-foreground mb-8 text-sm">{error}</p>
          <button onClick={fetchCurrentQuestion} className="w-full bg-primary text-primary-foreground uppercase tracking-widest text-xs font-bold py-4 rounded-md hover:brightness-110 transition-all">
            Re-Establish Connection
          </button>
        </div>
      </div>
    );
  }

  if (!questionData) return null;

  const progressPercent = ((questionData.position - 1) / questionData.totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans select-none flex flex-col">
      <PageBackground />
      
      {/* Cheat Warning Overlay */}
      {cheatWarning && (
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <EyeOff className="w-24 h-24 text-destructive mb-6 animate-pulse" />
          <h2 className="text-3xl font-black uppercase tracking-tighter text-destructive mb-4">Focus Lost</h2>
          <p className="text-muted-foreground text-lg max-w-md mb-8">
            Tab switching or leaving the quiz window is strictly prohibited. Your actions are being monitored by the system.
          </p>
          <button 
            onClick={() => setCheatWarning(false)}
            className="bg-destructive text-destructive-foreground px-8 py-4 rounded-md font-bold uppercase tracking-widest hover:brightness-110 transition-all border border-transparent shadow-[0_0_20px_rgba(220,38,38,0.4)]"
          >
            I Understand. Return to Quiz.
          </button>
        </div>
      )}

      {/* Top Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <span className="font-semibold tracking-tight uppercase hidden sm:block">ACSES</span>
          </div>
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-3">
            <span className="hidden sm:inline-block">Question</span>
            <span className="text-foreground text-sm">{String(questionData.position).padStart(2, '0')}</span> 
            <span className="opacity-50">/</span> 
            <span className="text-foreground text-sm">{String(questionData.totalQuestions).padStart(2, '0')}</span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="h-[2px] w-full bg-secondary relative overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-primary shadow-[0_0_10px_rgba(34,197,94,0.8)] transition-all duration-500 ease-out" 
            style={{ width: `\${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-6 pt-32 pb-24 flex flex-col relative z-10 animate-fade-up">
        
        {/* Timer */}
        <div className="flex justify-end mb-8">
          <div className={`font-mono text-2xl font-bold tracking-wider px-6 py-2 rounded-md border flex items-center gap-3 shadow-lg transition-colors duration-300 \${isUrgent ? 'bg-destructive/10 text-destructive border-destructive/50 animate-pulse' : 'bg-secondary/50 text-foreground border-white/10'}`}>
            <div className={`w-2 h-2 rounded-full \${isUrgent ? 'bg-destructive' : 'bg-primary animate-pulse'}`}></div>
            {timeLeft}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-medium text-foreground mb-12 leading-[1.3] tracking-tight">
            {questionData.text}
          </h2>

          {questionData.imageUrl && (
            <div className="mb-12">
              <img 
                src={questionData.imageUrl} 
                alt="Question visual" 
                className="max-w-full max-h-80 rounded-lg border border-border object-contain bg-black/50 p-2"
              />
            </div>
          )}

          <div className="space-y-4">
            {questionData.options.map(option => (
              <label 
                key={option.id} 
                onClick={() => setSelectedOption(option.id)}
                className={`block relative p-5 sm:p-6 rounded-xl cursor-pointer transition-all duration-200 border group ${
                  selectedOption === option.id 
                    ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(34,197,94,0.15)]' 
                    : 'border-border bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50'
                }`}
              >
                <div className="flex items-center gap-5">
                  <div className={`flex items-center justify-center w-6 h-6 rounded-sm border transition-colors ${selectedOption === option.id ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/50 group-hover:border-primary/50'}`}>
                    {selectedOption === option.id && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-lg sm:text-xl font-medium ${selectedOption === option.id ? 'text-primary' : 'text-foreground/90'}`}>
                    {option.text}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-12 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedOption}
            className="w-full sm:w-auto flex justify-center py-5 px-12 border border-transparent rounded-md text-sm font-bold text-primary-foreground bg-primary hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase tracking-widest"
          >
            {submitting ? (
              <span className="flex items-center">
                <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                Processing...
              </span>
            ) : (questionData.position === questionData.totalQuestions ? 'Submit Quiz' : 'Next Question')}
          </button>
        </div>
        
      </div>
    </div>
  );
}
