"use client";

import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { PageBackground } from "@/components/ui/PageBackground";
import { ArrowRight, Clock, Target, ListChecks, ShieldAlert, GraduationCap, RefreshCcw } from "lucide-react";

export default function RulesPage() {
  const rules = [
    {
      title: "Questions",
      icon: <ListChecks className="w-5 h-5 text-primary" />,
      description: "You will face a random selection of beginner and medium-level Computer Science questions. Topics include Programming, DSA, DBMS, OS, and Networking."
    },
    {
      title: "Duration",
      icon: <Clock className="w-5 h-5 text-primary" />,
      description: "Each question has a specific time limit. If you fail to answer within the time limit, the quiz will auto-submit or move on automatically. Watch the timer closely."
    },
    {
      title: "Scoring",
      icon: <Target className="w-5 h-5 text-primary" />,
      description: "There is no negative marking. Attempt all questions. You must score above the passing threshold to qualify for the final reward."
    },
    {
      title: "Attempts",
      icon: <RefreshCcw className="w-5 h-5 text-primary" />,
      description: "Only one active attempt is allowed per registered user. Closing the browser or refreshing the page may result in the quiz auto-submitting your current progress."
    },
    {
      title: "Eligibility",
      icon: <GraduationCap className="w-5 h-5 text-primary" />,
      description: "The quiz is open to all students. Providing accurate academic details is crucial for validating your attempt and claiming your reward."
    },
    {
      title: "Integrity",
      icon: <ShieldAlert className="w-5 h-5 text-primary" />,
      description: "Switching tabs, copying text, or using external tools is strictly monitored. Any detected anomaly will invalidate your attempt immediately."
    }
  ];

  return (
    <>
      <Navbar />
      <PageBackground />
      
      <main className="relative min-h-screen pt-32 pb-16 px-6 lg:px-16 flex flex-col items-center">
        
        <div className="w-full max-w-4xl animate-fade-up">
          <div className="mb-12 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-foreground leading-tight mb-4">
              Know the rules.<br />
              <span className="text-muted-foreground">Then play smart.</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mb-12">
              Read carefully before entering the challenge. 
              The system strictly enforces these parameters.
            </p>

            {/* Membership CTA Banner */}
            <a href="https://forms.gle/Sa3mbHEV2eoGC6jt9" target="_blank" className="block relative w-full rounded-2xl bg-gradient-to-r from-primary/20 via-primary/5 to-transparent border border-primary/30 p-6 md:p-8 hover:border-primary/60 transition-all group overflow-hidden cursor-pointer shadow-[0_0_30px_rgba(34,197,94,0.1)] hover:shadow-[0_0_40px_rgba(34,197,94,0.2)]">
              <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors"></div>
              <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-left">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-sm animate-pulse">Official</span>
                    <h3 className="text-xl md:text-2xl font-bold text-primary uppercase tracking-wide">Become an ACSES Member</h3>
                  </div>
                  <p className="text-sm md:text-base text-foreground/80 leading-relaxed font-medium">Join the elite community of CSE students. Unlock exclusive technical workshops, premium events, and VIP community access.</p>
                </div>
                <div className="shrink-0 bg-primary text-primary-foreground px-6 py-4 rounded-md font-bold text-sm uppercase tracking-widest hover:brightness-110 transition-all flex items-center shadow-[0_0_20px_rgba(34,197,94,0.4)] w-full md:w-auto justify-center">
                  Register Form
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {rules.map((rule, idx) => (
              <div 
                key={idx} 
                className="bg-secondary/30 border border-border rounded-xl p-6 hover:border-primary/30 transition-colors duration-300"
                style={{ animationDelay: `\${200 + (idx * 100)}ms` }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                    {rule.icon}
                  </div>
                  <h3 className="text-lg font-bold text-foreground uppercase tracking-wide">
                    {rule.title}
                  </h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {rule.description}
                </p>
              </div>
            ))}
          </div>

          <div className="flex justify-center md:justify-start">
            <Link
              href="/register"
              className="bg-primary text-primary-foreground px-8 py-4 text-sm font-bold rounded-sm hover:brightness-110 active:scale-[0.97] transition-all flex items-center justify-center uppercase tracking-widest w-full sm:w-auto shadow-[0_0_20px_rgba(34,197,94,0.2)]"
            >
              Acknowledge & Start
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>

      </main>
    </>
  );
}
