"use client";

import { Download, Printer } from "lucide-react";

interface ExportData {
  name: string;
  prn: string;
  email: string;
  mobile: string;
  score: string;
  status: string;
  couponCode: string;
  attemptCount: number;
  allScores: string;
  date: string;
}

export default function ExportButtons({ data }: { data: ExportData[] }) {
  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      "Name",
      "PRN",
      "Email",
      "Mobile",
      "Score",
      "Status",
      "Coupon Code",
      "Total Attempts",
      "All Scores",
      "Date",
    ];

    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        [
          `"${row.name}"`,
          `"${row.prn}"`,
          `"${row.email}"`,
          `"${row.mobile}"`,
          `"${row.score}"`,
          `"${row.status}"`,
          `"${row.couponCode}"`,
          row.attemptCount,
          `"${row.allScores}"`,
          `"${row.date}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "quiz_results.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handlePrint}
        className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-foreground px-3 py-2 rounded-md text-xs font-bold uppercase tracking-widest transition-colors border border-border"
      >
        <Printer className="w-4 h-4" /> Print
      </button>
      <button
        onClick={handleExportCSV}
        className="flex items-center gap-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 px-3 py-2 rounded-md text-xs font-bold uppercase tracking-widest transition-colors"
      >
        <Download className="w-4 h-4" /> Export CSV
      </button>
    </div>
  );
}
