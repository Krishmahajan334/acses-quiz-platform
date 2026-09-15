"use client";

import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";

const YEARS = [
  { id: "FY", label: "First Year (FY)" },
  { id: "SY", label: "Second Year (SY)" },
  { id: "TY", label: "Third Year (TY)" },
  { id: "Final Year", label: "Final Year" },
];

export default function SettingsClient() {
  const [prnRequiredYears, setPrnRequiredYears] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPrnRequiredYears(data.prnRequiredYears);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = (yearId: string) => {
    setPrnRequiredYears(prev => 
      prev.includes(yearId) 
        ? prev.filter(y => y !== yearId)
        : [...prev, yearId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prnRequiredYears })
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        alert("Settings saved successfully!");
      } else {
        alert(data.error || "Failed to save settings. Please try again.");
      }
    } catch (error: any) {
      console.error(error);
      alert(error.message || "An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-secondary/40 shadow-lg border border-border rounded-xl p-6 backdrop-blur-sm max-w-2xl">
      <h3 className="text-xl font-bold text-foreground mb-4">PRN Configuration</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Select which academic years should require a compulsory PRN during registration. Unchecked years will have PRN marked as optional.
      </p>

      <div className="space-y-4 mb-8">
        {YEARS.map(year => (
          <label key={year.id} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-border/50 hover:bg-secondary/60 transition-colors">
            <input
              type="checkbox"
              checked={prnRequiredYears.includes(year.id)}
              onChange={() => handleToggle(year.id)}
              className="w-5 h-5 rounded border-border text-primary focus:ring-primary bg-background"
            />
            <span className="font-medium text-foreground">{year.label}</span>
          </label>
        ))}
      </div>

      <div className="flex justify-end pt-4 border-t border-border">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-md font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
