"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Html5QrcodeScanner } from "html5-qrcode";
import { QrCode, CheckCircle2, AlertCircle, XCircle, Loader2 } from "lucide-react";

function RemoteScannerContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");

  const [scanResult, setScanResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(true);
  const isScanningRef = useRef(true);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const handleScan = async (code: string) => {
    if (!sessionId || !code || !isScanningRef.current) return;
    isScanningRef.current = false;
    setIsScanning(false);
    setScanResult(null); // Explicitly clear before new fetch

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
    if (!sessionId) return;
    
    scannerRef.current = new Html5QrcodeScanner(
      "remote-reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        videoConstraints: { facingMode: "environment" }
      },
      false
    );
    
    scannerRef.current.render((decodedText) => {
      handleScan(decodedText);
    }, () => {});

    // Hack to remove front cameras from the dropdown since they are useless here
    const filterCameras = setInterval(() => {
      const select = document.querySelector('#remote-reader select') as HTMLSelectElement;
      if (select) {
        Array.from(select.options).forEach(opt => {
          if (opt.text.toLowerCase().includes('front') || opt.text.toLowerCase().includes('user') || opt.text.toLowerCase().includes('facing')) {
            opt.style.display = 'none';
          }
        });
      }
    }, 500);

    return () => {
      clearInterval(filterCameras);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [sessionId]);

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
        <div className={`w-full max-w-md space-y-4 ${isScanning ? 'block' : 'hidden'}`}>
          <div id="remote-reader" className="w-full overflow-hidden rounded-xl border border-zinc-700 bg-zinc-800"></div>
          <p className="text-center text-zinc-400 text-sm">Point camera at coupon QR code</p>
        </div>

        {!isScanning && (
          <div className="w-full max-w-md p-6 bg-zinc-900 rounded-xl border border-zinc-800 flex flex-col items-center text-center space-y-6">
            {!scanResult ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
                <p className="text-zinc-400 font-medium">Verifying coupon...</p>
              </div>
            ) : (
              <>
                {scanResult.success ? (
                  <CheckCircle2 className="w-20 h-20 text-green-500" />
                ) : (
                  <AlertCircle className="w-20 h-20 text-red-500" />
                )}
                
                <div>
                  <h2 className={`text-2xl font-bold ${scanResult.success ? 'text-green-500' : 'text-red-500'}`}>
                    {scanResult.success ? "Success!" : "Failed"}
                  </h2>
                  <p className="text-zinc-300 mt-2 text-lg">{scanResult.message}</p>
                  {scanResult.participant && (
                    <p className="text-zinc-400 font-semibold mt-1">{scanResult.participant}</p>
                  )}
                </div>
              </>
            )}

            <button
              onClick={() => {
                setScanResult(null);
                isScanningRef.current = true;
                setIsScanning(true);
              }}
              disabled={!scanResult}
              className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-lg text-lg uppercase tracking-wide hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50"
            >
              Scan Next
            </button>
          </div>
        )}
      </main>

      <footer className="p-4 border-t border-zinc-800 flex flex-col items-center justify-center gap-2 mt-auto">
        <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px] text-zinc-500 text-center">
          <span className="font-semibold text-zinc-400">Designed & developed by Sorin Tech Lab</span>
          <span>a unit of</span>
          <Link 
            href="https://krishmahajan.dev" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-primary transition-colors group"
          >
            <span className="font-semibold underline decoration-transparent group-hover:decoration-primary underline-offset-2 transition-all">Krish Tech Labs</span>
            <Image 
              src="/watermark_logo_light.png" 
              alt="Krish Techlabs Logo" 
              width={16} 
              height={16} 
              className="object-contain opacity-70 group-hover:opacity-100 transition-opacity"
            />
          </Link>
        </div>
        <p className="text-[9px] text-zinc-600 text-center leading-tight">
          This platform is the property of Sorin Tech Lab.
        </p>
      </footer>
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
