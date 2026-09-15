'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from "@/components/ui/Navbar";
import { PageBackground } from "@/components/ui/PageBackground";
import { AlertCircle, Loader2, Trophy, X } from "lucide-react";
import { Leaderboard } from "@/components/ui/Leaderboard";

export default function RegisterPage() {
  const router = useRouter();
  const [showMobileLeaderboard, setShowMobileLeaderboard] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    year: 'FY',
    prn: '',
    consent: false
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData({ ...formData, email: val });

    if (val.includes('@')) {
      const [prefix, domain] = val.split('@');
      const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'dkte.ac.in'];
      const filtered = domains.filter(d => d.startsWith(domain || ''));
      setEmailSuggestions(filtered.map(d => `${prefix}@${d}`));
    } else {
      setEmailSuggestions([]);
    }
  };

  const isPrnRequired = formData.year !== 'FY';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.issues) {
          setError(data.issues[0].message);
        } else {
          setError(data.error || 'Registration failed');
        }
        return;
      }

      router.push('/quiz');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "mt-1.5 block w-full bg-input/50 border border-border text-foreground rounded-lg py-3.5 px-4 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-sm placeholder:text-muted-foreground";
  const labelClass = "block text-sm font-semibold text-foreground/90 uppercase tracking-wider text-xs mb-1";

  return (
    <>
      <Navbar 
        hideStartButton={true}
        rightNode={
          <button
            onClick={() => setShowMobileLeaderboard(true)}
            className="lg:hidden bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.97] transition-all rounded-md uppercase text-[10px] sm:text-xs font-bold tracking-widest px-3 py-2 flex items-center gap-1.5"
          >
            <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Leaderboard</span>
          </button>
        }
      />
      <PageBackground />
      
      <main className="relative min-h-screen pt-32 pb-16 px-6 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 lg:gap-12">
        <div className="max-w-md w-full relative z-10 animate-fade-up">
          
          <div className="bg-secondary/40 backdrop-blur-md rounded-2xl border border-border p-8 sm:p-10 shadow-2xl relative overflow-hidden">
            {/* Subtle top glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-primary/40 blur-sm rounded-full"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-[2px] bg-primary rounded-full"></div>

            <div className="mb-8 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight uppercase">
                Register for the Quiz
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter your details to begin your ACSES technical challenge.
              </p>
            </div>
            
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive p-4 rounded-xl mb-6 text-sm flex items-start shadow-sm animate-fade-in">
                <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{error}</span>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="name" className={labelClass}>Full Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="Enter your full name"
                  className={inputClass}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="email" className={labelClass}>Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  list="email-suggestions"
                  placeholder="student@example.com"
                  className={inputClass}
                  value={formData.email}
                  onChange={handleEmailChange}
                  autoComplete="off"
                />
                <datalist id="email-suggestions">
                  {emailSuggestions.map((suggestion) => (
                    <option key={suggestion} value={suggestion} />
                  ))}
                </datalist>
              </div>

              <div>
                <label htmlFor="mobile" className={labelClass}>Mobile Number</label>
                <input
                  id="mobile"
                  name="mobile"
                  type="tel"
                  required
                  placeholder="10-digit mobile number"
                  className={inputClass}
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="year" className={labelClass}>Academic Year</label>
                <select
                  id="year"
                  name="year"
                  className={inputClass}
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                >
                  <option value="FY" className="bg-background text-foreground">First Year (FY)</option>
                  <option value="SY" className="bg-background text-foreground">Second Year (SY)</option>
                  <option value="TY" className="bg-background text-foreground">Third Year (TY)</option>
                  <option value="Final Year" className="bg-background text-foreground">Final Year</option>
                </select>
              </div>

              <div className="animate-fade-in">
                <label htmlFor="prn" className={labelClass}>
                  PRN {isPrnRequired && <span className="text-primary">*</span>}
                  {!isPrnRequired && <span className="text-muted-foreground font-normal ml-1 text-[10px] uppercase">(Optional)</span>}
                </label>
                <input
                  id="prn"
                  name="prn"
                  type="text"
                  required={isPrnRequired}
                  placeholder="e.g. 24UCS001"
                  className={inputClass}
                  value={formData.prn}
                  onChange={(e) => setFormData({ ...formData, prn: e.target.value.toUpperCase() })}
                />
              </div>

              <div className="flex items-start pt-2">
                <div className="flex items-center h-5">
                  <input
                    id="consent"
                    name="consent"
                    type="checkbox"
                    required
                    className="h-4 w-4 bg-input/50 border-border text-primary focus:ring-primary focus:ring-offset-background rounded cursor-pointer transition-colors"
                    checked={formData.consent}
                    onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="consent" className="font-semibold text-foreground/80 cursor-pointer">
                    I agree to the privacy policy
                  </label>
                  <p className="text-muted-foreground mt-0.5 text-xs">Your data will only be used for the event.</p>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl text-sm font-bold text-primary-foreground bg-primary hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase tracking-widest"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                      Processing...
                    </span>
                  ) : 'Continue to Quiz'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Desktop Leaderboard (Always visible on lg screens) */}
        <div className="hidden lg:block max-w-md w-full relative z-10 animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <div className="mb-4 text-left">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight uppercase">
              Top Performers
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Are you ready to beat their scores?
            </p>
          </div>
          <Leaderboard limit={10} />
        </div>

        {/* Mobile Leaderboard Modal */}
        {showMobileLeaderboard && (
          <div className="lg:hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="bg-secondary w-full max-w-md rounded-2xl border border-border shadow-2xl animate-fade-up relative flex flex-col max-h-[85vh]">
              <div className="flex justify-between items-center p-4 border-b border-border">
                <div>
                  <h2 className="text-lg font-bold text-foreground tracking-tight uppercase">Top Performers</h2>
                  <p className="text-xs text-muted-foreground">Are you ready to beat their scores?</p>
                </div>
                <button 
                  onClick={() => setShowMobileLeaderboard(false)}
                  className="p-2 rounded-full bg-background border border-border text-foreground hover:bg-secondary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto p-4 custom-scrollbar flex-1">
                <Leaderboard limit={10} />
              </div>
            </div>
          </div>
        )}

      </main>
    </>
  );
}
