"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface HistoryRecord {
  id: string;
  filename: string;
  questionCount: number;
  createdAt: string;
}

export default function UploadHistoryList() {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [revertingId, setRevertingId] = useState<string | null>(null);
  const router = useRouter();

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/admin/upload-history");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error("Failed to fetch upload history", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleRevert = async (id: string, filename: string, count: number) => {
    if (!confirm(`Are you sure you want to revert the upload of "${filename}"?\n\nThis will permanently delete the ${count} questions added from this file.`)) {
      return;
    }

    setRevertingId(id);
    try {
      const res = await fetch(`/api/admin/upload-history/${id}`, {
        method: "DELETE"
      });

      const data = await res.json();
      if (res.ok) {
        alert("Upload reverted successfully.");
        // Re-fetch history and refresh the page to update total stats
        await fetchHistory();
        router.refresh();
      } else {
        alert("Failed to revert: " + data.error);
      }
    } catch (err: any) {
      alert("Error reverting upload: " + err.message);
    } finally {
      setRevertingId(null);
    }
  };

  if (loading) {
    return (
      <div className="mb-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Uploads</h2>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="mb-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Recent Uploads</h2>
        <p className="text-sm text-gray-500">You haven't uploaded any question bank files yet.</p>
        <p className="text-xs text-gray-400 mt-1">Upload a JSON file using the Bulk Upload button above to see your history here.</p>
      </div>
    );
  }

  return (
    <div className="mb-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 overflow-x-auto">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Uploads</h2>
      <table className="w-full text-left text-sm text-gray-600">
        <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
          <tr>
            <th className="px-4 py-3 rounded-tl-lg rounded-bl-lg">File Name</th>
            <th className="px-4 py-3">Questions Added</th>
            <th className="px-4 py-3">Upload Date</th>
            <th className="px-4 py-3 rounded-tr-lg rounded-br-lg text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {history.map((record) => (
            <tr key={record.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition">
              <td className="px-4 py-3 font-medium text-gray-900">{record.filename}</td>
              <td className="px-4 py-3">
                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                  +{record.questionCount}
                </span>
              </td>
              <td className="px-4 py-3">{new Date(record.createdAt).toLocaleString()}</td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => handleRevert(record.id, record.filename, record.questionCount)}
                  disabled={revertingId === record.id}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition shadow-sm ${
                    revertingId === record.id 
                      ? "bg-red-200 text-red-500 cursor-not-allowed" 
                      : "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200"
                  }`}
                >
                  {revertingId === record.id ? "Reverting..." : "Revert"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
