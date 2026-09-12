"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";

export default function ClearDataButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClear = async () => {
    if (!window.confirm("WARNING: This will permanently delete ALL participants, attempts, and coupons. Are you absolutely sure you want to reset the database?")) {
      return;
    }

    if (!window.confirm("FINAL WARNING: This action cannot be undone.")) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/clear-test-users", {
        method: "POST",
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Data cleared successfully!");
        router.refresh(); 
      } else {
        alert("Error: " + data.error);
      }
    } catch (err: any) {
      alert("Request failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClear}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-xs uppercase tracking-widest font-bold transition-all shadow-sm border \${
        loading ? "bg-red-500/20 border-red-500/30 text-red-500 cursor-not-allowed" : "bg-red-600 text-white border-transparent hover:bg-red-700 shadow-[0_0_15px_rgba(220,38,38,0.5)]"
      } print:hidden`}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Clearing Data...
        </>
      ) : (
        <>
          <AlertTriangle className="w-4 h-4" />
          Clear Test Data
        </>
      )}
    </button>
  );
}
