"use client";

import { useState } from 'react';
import { Settings, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ToggleMultipleButton({ initialState }: { initialState: boolean }) {
  const [enabled, setEnabled] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    if (!confirm(`Are you sure you want to ${enabled ? 'DISABLE' : 'ENABLE'} multiple attempts globally?`)) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/admin/event/toggle-multiple', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setEnabled(data.allowMultipleAttempts);
        router.refresh();
      } else {
        alert("Failed to toggle: " + data.error);
      }
    } catch (e) {
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-widest rounded-md border transition-all ${
        enabled 
          ? 'bg-primary/20 text-primary border-primary/50 hover:bg-primary/30' 
          : 'bg-secondary text-muted-foreground border-border hover:bg-secondary/80 hover:text-foreground'
      }`}
    >
      {enabled ? <CheckCircle className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
      {loading ? 'Toggling...' : (enabled ? 'Multiple Attempts: ON' : 'Multiple Attempts: OFF')}
    </button>
  );
}
