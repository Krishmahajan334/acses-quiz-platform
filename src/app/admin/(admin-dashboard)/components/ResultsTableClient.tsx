"use client";

import { useState } from "react";
import DeleteParticipantButton from "./DeleteParticipantButton";
import { Loader2, Mail, CheckSquare, Square } from "lucide-react";

type AttemptRow = {
  id: string;
  participantId: string;
  scorePercent: number | null;
  status: string;
  submittedAt: Date | null;
  participant: {
    name: string;
    prn: string | null;
    email: string;
    year: string;
  };
  coupon?: {
    code: string;
    status: string;
  } | null;
};

type HistoryData = { count: number; scores: string[] };

interface Props {
  latestAttempts: AttemptRow[];
  historyMap: Record<string, HistoryData>;
}

export default function ResultsTableClient({ latestAttempts, historyMap }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const toggleAll = () => {
    if (selectedIds.size === latestAttempts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(latestAttempts.map(a => a.id)));
    }
  };

  const toggleOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleBulkResend = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Resend results email to ${selectedIds.size} participants?`)) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/admin/resend-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptIds: Array.from(selectedIds) })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Emails sent successfully!");
        setSelectedIds(new Set()); // clear selection on success
      } else {
        alert("Failed to send emails: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Request failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-secondary/40 shadow-lg border border-border rounded-xl overflow-hidden backdrop-blur-sm print:shadow-none print:border-none print:bg-transparent">
      {selectedIds.size > 0 && (
        <div className="bg-blue-50/50 border-b border-blue-100 px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-blue-800">
            {selectedIds.size} participant{selectedIds.size > 1 ? 's' : ''} selected
          </span>
          <button
            onClick={handleBulkResend}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            Resend Email{selectedIds.size > 1 ? 's' : ''}
          </button>
        </div>
      )}
      
      <div className="overflow-x-auto print:overflow-visible">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-background/50">
            <tr>
              <th scope="col" className="px-3 sm:px-4 py-4 text-left w-10">
                <button onClick={toggleAll} className="text-muted-foreground hover:text-foreground">
                  {selectedIds.size === latestAttempts.length && latestAttempts.length > 0 ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th scope="col" className="px-3 py-4 text-left text-[10px] sm:text-xs font-black text-muted-foreground uppercase tracking-widest w-12">#</th>
              <th scope="col" className="px-3 sm:px-6 py-4 text-left text-[10px] sm:text-xs font-black text-muted-foreground uppercase tracking-widest">Name / PRN</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Email</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">History</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Score</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Coupon Code</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</th>
              <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {latestAttempts.map((attempt, index) => {
              const history = historyMap[attempt.participantId] || { count: 0, scores: [] };
              const isSelected = selectedIds.has(attempt.id);
              return (
              <tr key={attempt.id} className={`hover:bg-secondary/20 transition-colors group ${isSelected ? 'bg-blue-50/30' : ''}`}>
                <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                  <button onClick={() => toggleOne(attempt.id)} className={`${isSelected ? 'text-blue-600' : 'text-muted-foreground hover:text-foreground'}`}>
                    {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  </button>
                </td>
                <td className="px-3 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-bold text-muted-foreground">
                  {index + 1}
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4">
                  <div className="text-xs sm:text-sm font-bold text-foreground break-words">{attempt.participant.name}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">PRN: {attempt.participant.prn || 'N/A'} ({attempt.participant.year})</div>
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-muted-foreground">
                  {attempt.participant.email}
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                  {history.count > 0 ? (
                    <div className="flex flex-col">
                      <span className="text-xs text-foreground font-bold">{history.count} {history.count === 1 ? 'attempt' : 'attempts'}</span>
                      <span className="text-[10px] text-muted-foreground opacity-80 tracking-widest mt-0.5">[{history.scores.join(', ')}]</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-foreground font-black">
                  {attempt.scorePercent !== null ? `${attempt.scorePercent.toFixed(0)}%` : '-'}
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 inline-flex text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-md ${
                    attempt.status === 'COMPLETED' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30'
                  }`}>
                    {attempt.status}
                  </span>
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                  {(() => {
                    const coupon = attempt.coupon;
                    if (!coupon) return <span className="text-muted-foreground text-sm font-normal">N/A</span>;
                    
                    const isRedeemed = coupon.status === 'REDEEMED';
                    return (
                      <div className="flex flex-col gap-1.5">
                        <span className="font-mono text-xs sm:text-sm font-bold text-foreground">{coupon.code}</span>
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm inline-flex w-max ${
                          isRedeemed 
                            ? 'bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30' 
                            : 'bg-secondary text-muted-foreground border border-border'
                        }`}>
                          {isRedeemed ? 'Redeemed' : 'Unused'}
                        </span>
                      </div>
                    );
                  })()}
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-[10px] sm:text-sm text-muted-foreground font-medium">
                  {attempt.submittedAt 
                    ? new Date(attempt.submittedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true }) 
                    : 'In Progress'}
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <DeleteParticipantButton participantId={attempt.participantId} name={attempt.participant.name} />
                  </div>
                </td>
              </tr>
              );
            })}
            
            {latestAttempts.length === 0 && (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center text-sm font-medium text-muted-foreground uppercase tracking-widest">
                  No quiz attempts found yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
