'use client';

import { useState, useEffect } from 'react';
import { Trophy, Clock, Medal, Loader2, AlertCircle } from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  name: string;
  year: string;
  score: number;
  timeTakenSec: number;
}

export function Leaderboard({ limit = 20, refreshInterval = 30000 }: { limit?: number, refreshInterval?: number }) {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`/api/leaderboard?limit=${limit}`);
      const json = await res.json();
      if (json.success) {
        setData(json.leaderboard);
        setError(null);
      } else {
        setError(json.error || 'Failed to load leaderboard');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, refreshInterval);
    return () => clearInterval(interval);
  }, [limit, refreshInterval]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return <Medal className="w-5 h-5 text-yellow-500 fill-yellow-500/20" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400 fill-gray-400/20" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-600 fill-amber-600/20" />;
    return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{index + 1}</span>;
  };

  if (loading && data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-secondary/30 rounded-2xl border border-border">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest">Loading Standings...</p>
      </div>
    );
  }

  if (error && data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-destructive/10 rounded-2xl border border-destructive/30">
        <AlertCircle className="w-8 h-8 text-destructive mb-4" />
        <p className="text-destructive font-medium text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-secondary/40 backdrop-blur-md rounded-2xl border border-border overflow-hidden shadow-2xl">
      <div className="p-5 border-b border-border bg-secondary/50 flex items-center justify-between">
        <h3 className="text-lg font-black text-foreground uppercase tracking-tight flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" /> Live Leaderboard
        </h3>
        <div className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
          LIVE
        </div>
      </div>
      
      {data.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground text-sm">
          No entries yet. Be the first to conquer the challenge!
        </div>
      ) : (
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-muted-foreground uppercase tracking-widest bg-secondary/30">
              <tr>
                <th className="px-4 py-3 font-bold w-16 text-center">Rank</th>
                <th className="px-4 py-3 font-bold">Participant</th>
                <th className="px-4 py-3 font-bold text-right">Score</th>
                <th className="px-4 py-3 font-bold text-right rounded-tr-xl">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((entry, index) => (
                <tr 
                  key={entry.id} 
                  className={`transition-colors hover:bg-secondary/30 ${index < 3 ? 'bg-secondary/10' : ''}`}
                >
                  <td className="px-4 py-3 flex justify-center items-center h-full">
                    {getRankBadge(index)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-foreground">
                      {entry.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                      {entry.year}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-black ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-amber-500' : 'text-primary'}`}>
                      {entry.score.toFixed(0)}<span className="text-xs opacity-60">%</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-mono font-medium text-muted-foreground bg-background px-2 py-1 rounded border border-border">
                      <Clock className="w-3 h-3" />
                      {formatTime(entry.timeTakenSec)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
