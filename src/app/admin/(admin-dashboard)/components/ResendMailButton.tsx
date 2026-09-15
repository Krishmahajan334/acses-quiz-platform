"use client";

import { useState } from "react";
import { Mail, Loader2 } from "lucide-react";

export default function ResendMailButton({ attemptId }: { attemptId: string }) {
  const [loading, setLoading] = useState(false);

  const handleResend = async () => {
    if (!window.confirm("Resend the result email to this participant?")) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/admin/resend-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Email sent successfully!");
      } else {
        alert("Failed to send email: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Request failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleResend}
      disabled={loading}
      className={`p-2 rounded-md transition-colors border \${
        loading 
          ? "bg-secondary text-muted-foreground border-transparent cursor-not-allowed" 
          : "bg-white text-blue-600 border-blue-200 hover:bg-blue-50 shadow-sm"
      }`}
      title="Resend Email"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
    </button>
  );
}
