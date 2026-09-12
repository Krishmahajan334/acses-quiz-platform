"use client";

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DeleteParticipantButton({ participantId, name }: { participantId: string, name: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`Are you absolutely sure you want to delete ${name} and all their attempts/coupons? This cannot be undone.`)) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/participant/${participantId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        router.refresh();
      } else {
        alert("Failed to delete: " + data.error);
      }
    } catch (e) {
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      title="Delete Participant"
      className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-md transition-colors"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
