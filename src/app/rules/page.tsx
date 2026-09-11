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
            <p className="text-muted-foreground text-lg max-w-2xl">
              Read carefully before entering the challenge. 
              The system strictly enforces these parameters.
            </p>
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
