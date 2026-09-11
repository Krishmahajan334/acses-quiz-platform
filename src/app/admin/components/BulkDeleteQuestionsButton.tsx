'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';

export default function BulkDeleteQuestionsButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDeleteAll = async () => {
    if (!confirm("Are you ABSOLUTELY sure you want to delete ALL questions? This action cannot be undone.")) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/questions/bulk', {
        method: 'DELETE',
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(data.message);
      router.refresh();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDeleteAll}
      disabled={loading}
      className="flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg text-sm font-semibold transition border border-red-200"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      Delete All
    </button>
  );
}
