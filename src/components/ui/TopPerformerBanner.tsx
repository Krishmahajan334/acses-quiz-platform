'use client';

import { useState, useEffect } from 'react';
import { Crown, Clock } from "lucide-react";

export function TopPerformerBanner() {
  const [topPerformers, setTopPerformers] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/leaderboard?limit=3')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.leaderboard.length > 0) {
          setTopPerformers(data.leaderboard);
        }
      })
      .catch(console.error);
  }, []);

  if (topPerformers.length === 0) return null;

  return (
    <div className="w-full bg-primary/5 border-b border-primary/20 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in absolute top-[72px] md:top-[88px] left-0 z-40 shadow-sm overflow-hidden py-2">
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-flex;
          animation: marquee 20s linear infinite;
          white-space: nowrap;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
      
      {/* Marquee Container */}
      <div className="w-full overflow-hidden flex items-center">
        <div className="animate-marquee flex items-center gap-12 px-4">
          {[...topPerformers, ...topPerformers].map((p, index) => {
            const m = Math.floor(p.timeTakenSec / 60);
            const s = p.timeTakenSec % 60;
            const realIndex = index % topPerformers.length;
            return (
              <div key={index} className="flex items-center gap-2 text-xs sm:text-sm text-foreground font-medium uppercase tracking-wider shrink-0 pr-12">
                <Crown className={`w-4 h-4 ${realIndex === 0 ? 'text-yellow-500 fill-yellow-500/20' : realIndex === 1 ? 'text-gray-300 fill-gray-300/20' : 'text-amber-600 fill-amber-600/20'}`} />
                <span className="opacity-80">Rank #{realIndex + 1}:</span>
                <strong className="text-primary font-black">{p.name}</strong>
                <span className="text-muted-foreground mx-1">•</span>
                <span className={realIndex === 0 ? 'text-yellow-500 font-bold' : 'text-foreground font-bold'}>{p.score}%</span>
                <span className="text-muted-foreground mx-1 hidden sm:inline">•</span>
                <span className="items-center gap-1 opacity-80 font-mono hidden sm:flex"><Clock className="w-3 h-3" /> {m}m {s}s</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Motivational Subtext */}
      <div className="mt-1 text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-widest font-semibold opacity-80 text-center px-4">
        Take the challenge to claim your spot on the leaderboard!
      </div>
    </div>
  );
}
