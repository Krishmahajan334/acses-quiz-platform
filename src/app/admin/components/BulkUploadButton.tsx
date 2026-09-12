"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function BulkUploadButton() {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      alert("Please upload a valid JSON file. You can download the template for reference.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setLoading(true);
    try {
      const text = await file.text();
      const payload = JSON.parse(text);

      if (!Array.isArray(payload)) {
        throw new Error("JSON file must contain an array of questions.");
      }

      const res = await fetch("/api/admin/questions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          questions: payload
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Questions successfully imported!");
        router.refresh();
      } else {
        alert("Error: " + data.error);
      }
    } catch (err: any) {
      alert("Failed to parse and upload: " + err.message);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-2">
      <a 
        href="/question-template.json" 
        download
        className="text-sm font-medium text-blue-600 hover:text-blue-800 transition mr-2"
      >
        Download JSON Template
      </a>
      <input 
        type="file" 
        accept=".json" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
      />
      <button 
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className={`px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm ${
          loading ? "bg-indigo-400 text-white cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 text-white"
        }`}
      >
        {loading ? "Uploading..." : "↑ Bulk Upload (.json)"}
      </button>
    </div>
  );
}
