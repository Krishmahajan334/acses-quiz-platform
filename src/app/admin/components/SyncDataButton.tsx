"use client";

import { useState } from "react";
import { RefreshCcw } from "lucide-react";

export default function SyncDataButton() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/sync", {
        method: "POST",
      });
      const data = await res.json();
      
      if (!res.ok) {
        setResult(`Error: ${data.error || 'Sync failed'}`);
      } else if (data.processed === undefined || data.message) {
        setResult(data.message || "No pending sync jobs.");
      } else {
        setResult(`Success: ${data.successCount} synced, ${data.failCount} failed.`);
      }
    } catch (err) {
      setResult("Network error triggering sync.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleSync}
        disabled={syncing}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RefreshCcw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
        {syncing ? "Syncing to Sheets..." : "Sync to Google Sheets"}
      </button>
      {result && <span className="text-xs text-muted-foreground">{result}</span>}
    </div>
  );
}
