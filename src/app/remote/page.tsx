"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Html5QrcodeScanner } from "html5-qrcode";
import { QrCode, CheckCircle2, AlertCircle, XCircle } from "lucide-react";

function RemoteScannerContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");

  const [scanResult, setScanResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(true);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const handleScan = async (code: string) => {
    if (!sessionId || !code) return;
    setIsScanning(false);

    try {
      const res = await fetch("/api/admin/scanner/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, couponCode: code }),
      });
      const data = await res.json();
      setScanResult(data);
    } catch (e) {
      setScanResult({ success: false, message: "Network error" });
    }
  };

  useEffect(() => {
    if (isScanning && sessionId) {
      setScanResult(null);
      scannerRef.current = new Html5QrcodeScanner(
        "remote-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      
      scannerRef.current.render((decodedText) => {
        handleScan(decodedText);
      }, () => {});
    } else {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [isScanning, sessionId]);

  if (!sessionId) {
    return (
      <div className="flex h-screen items-center justify-center p-4 bg-background">
        <div className="text-center space-y-4">
          <XCircle className="w-16 h-16 text-destructive mx-auto" />
          <h2 className="text-2xl font-bold">Invalid Session</h2>
          <p className="text-muted-foreground">No session ID provided. Please scan the QR code from the laptop screen.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <header className="p-4 bg-zinc-900 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2">
          <QrCode className="text-primary w-5 h-5" />
          <h1 className="font-bold tracking-widest uppercase">Remote Scanner</h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        {isScanning ? (
          <div className="w-full max-w-md space-y-4">
            <div id="remote-reader" className="w-full overflow-hidden rounded-xl border border-zinc-700 bg-zinc-800"></div>
            <p className="text-center text-zinc-400 text-sm">Point camera at coupon QR code</p>
          </div>
        ) : (
          <div className="w-full max-w-md p-6 bg-zinc-900 rounded-xl border border-zinc-800 flex flex-col items-center text-center space-y-6">
            {scanResult?.success ? (
              <CheckCircle2 className="w-20 h-20 text-green-500" />
            ) : (
              <AlertCircle className="w-20 h-20 text-red-500" />
            )}
            
            <div>
              <h2 className={`text-2xl font-bold ${scanResult?.success ? 'text-green-500' : 'text-red-500'}`}>
                {scanResult?.success ? "Success!" : "Failed"}
              </h2>
              <p className="text-zinc-300 mt-2 text-lg">{scanResult?.message}</p>
              {scanResult?.participant && (
                <p className="text-zinc-400 font-semibold mt-1">{scanResult.participant}</p>
              )}
            </div>

            <button
              onClick={() => setIsScanning(true)}
              className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-lg text-lg uppercase tracking-wide hover:bg-primary/90 active:scale-95 transition-all"
            >
              Scan Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function RemoteScannerPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-black flex items-center justify-center text-white">Loading...</div>}>
      <RemoteScannerContent />
    </Suspense>
  );
}
