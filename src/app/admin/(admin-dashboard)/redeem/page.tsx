"use client";

import { useState, useEffect, useRef } from "react";
import { QrCode, Camera, Keyboard, AlertCircle, CheckCircle2, UserCircle2, Smartphone } from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { QRCodeSVG } from 'qrcode.react';

type ScanResult = {
  success: boolean;
  message: string;
  participant?: string;
  redeemedAt?: string;
};

export default function RedeemPage() {
  const [manualCode, setManualCode] = useState("");
  const [scanMode, setScanMode] = useState<"text" | "webcam" | "remote">("text");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pairingUrl, setPairingUrl] = useState<string>("");

  const handleRedeem = async (code: string) => {
    if (!code) return;
    setLoading(true);
    setScanResult(null);

    try {
      const res = await fetch("/api/admin/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponCode: code }),
      });

      const data = await res.json();

      if (res.ok) {
        setScanResult({
          success: true,
          message: data.message,
          participant: data.participant,
        });
        setManualCode(""); // clear on success
      } else {
        setScanResult({
          success: false,
          message: data.error,
          participant: data.participant,
          redeemedAt: data.redeemedAt,
        });
      }
    } catch (error: any) {
      setScanResult({ success: false, message: "Network error occurred." });
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleRedeem(manualCode.trim());
  };

  // Handle local webcam scanner
  useEffect(() => {
    if (scanMode === "webcam") {
      scannerRef.current = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );
      
      scannerRef.current.render((decodedText) => {
        setScanMode("text"); // switch back to prevent duplicate scans
        handleRedeem(decodedText);
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
  }, [scanMode]);

  // Handle Remote Pairing
  useEffect(() => {
    if (scanMode === "remote") {
      const createSession = async () => {
        try {
          const res = await fetch("/api/admin/scanner/create", { method: "POST" });
          const data = await res.json();
          if (data.sessionId) {
            setSessionId(data.sessionId);
            setPairingUrl(`${window.location.origin}/remote?session=${data.sessionId}`);
          } else {
            console.error("Session creation error:", data.error);
            setPairingUrl(`error: ${data.error || 'Failed to create session'}`);
          }
        } catch (e: any) {
          console.error("Failed to create session", e);
          setPairingUrl(`error: Network error`);
        }
      };
      createSession();
    } else {
      setSessionId(null);
      setPairingUrl("");
    }
  }, [scanMode]);

  // Polling for remote scans
  useEffect(() => {
    if (scanMode === "remote" && sessionId) {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/admin/scanner/poll?session=${sessionId}`);
          const data = await res.json();
          if (data.result) {
            setScanResult(data.result);
          }
        } catch (e) {
          console.error("Poll error", e);
        }
      }, 2000); // poll every 2 seconds
      
      return () => clearInterval(interval);
    }
  }, [scanMode, sessionId]);

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h2 className="text-3xl font-bold tracking-tight mb-2">Redeem Coupon</h2>
        <p className="text-muted-foreground">
          Scan a QR code or manually enter a coupon code to mark it as redeemed.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6 bg-card border border-border p-6 rounded-xl shadow-sm">
          <div className="flex gap-2 mb-4 text-xs font-semibold">
            <button
              onClick={() => setScanMode("text")}
              className={`flex-1 py-2 px-2 rounded-md flex items-center justify-center gap-2 transition-colors ${scanMode === 'text' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}
            >
              <Keyboard className="w-4 h-4" /> Text / USB
            </button>
            <button
              onClick={() => setScanMode("webcam")}
              className={`flex-1 py-2 px-2 rounded-md flex items-center justify-center gap-2 transition-colors ${scanMode === 'webcam' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}
            >
              <Camera className="w-4 h-4" /> Webcam
            </button>
            <button
              onClick={() => setScanMode("remote")}
              className={`flex-1 py-2 px-2 rounded-md flex items-center justify-center gap-2 transition-colors ${scanMode === 'remote' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}
            >
              <Smartphone className="w-4 h-4" /> Pair Phone
            </button>
          </div>

          {scanMode === "text" && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Coupon Code</label>
                <input
                  autoFocus
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="e.g., ACSES-A1B2-C3D4"
                  className="w-full px-4 py-3 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono text-lg"
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Ready for USB/Bluetooth barcode scanners. Just scan and it will auto-submit.
                </p>
              </div>
              <button
                type="submit"
                disabled={loading || !manualCode.trim()}
                className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Redeem"}
              </button>
            </form>
          )}

          {scanMode === "webcam" && (
            <div className="space-y-4">
              <div id="reader" className="w-full overflow-hidden rounded-md border border-border"></div>
              <p className="text-xs text-center text-muted-foreground">
                Point your camera at the QR code to scan.
              </p>
            </div>
          )}

          {scanMode === "remote" && (
            <div className="space-y-6 flex flex-col items-center justify-center p-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-border inline-block">
                {pairingUrl ? (
                  pairingUrl.startsWith("error:") ? (
                    <div className="w-[200px] h-[200px] flex items-center justify-center text-red-500 font-medium text-center p-4">
                      {pairingUrl.replace("error: ", "")}
                    </div>
                  ) : (
                    <QRCodeSVG value={pairingUrl} size={200} />
                  )
                ) : (
                  <div className="w-[200px] h-[200px] flex items-center justify-center text-muted-foreground">Generating...</div>
                )}
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-foreground">Scan to Pair Phone</h3>
                <p className="text-sm text-muted-foreground">
                  Open your phone's camera and scan this code to turn your phone into a remote scanner.
                  Scans will instantly appear here!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Result Section */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold border-b border-border pb-2">Scan Result</h3>
          
          {scanResult ? (
            <div className={`p-6 rounded-xl border ${scanResult.success ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'} flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 duration-300`}>
              {scanResult.success ? (
                <CheckCircle2 className="w-16 h-16 text-green-500" />
              ) : (
                <AlertCircle className="w-16 h-16 text-red-500" />
              )}
              
              <div>
                <h4 className={`text-xl font-bold ${scanResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {scanResult.success ? "Success!" : "Failed"}
                </h4>
                <p className="text-foreground font-medium mt-1">{scanResult.message}</p>
              </div>

              {scanResult.participant && (
                <div className="flex items-center gap-2 bg-background/50 px-4 py-2 rounded-full border border-border/50 text-sm mt-4">
                  <UserCircle2 className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold">{scanResult.participant}</span>
                </div>
              )}
              
              {scanResult.redeemedAt && (
                <p className="text-xs text-muted-foreground">
                  Already Redeemed on: {new Date(scanResult.redeemedAt).toLocaleString()}
                </p>
              )}
            </div>
          ) : (
            <div className="h-full min-h-[250px] border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-muted-foreground space-y-4 p-6 text-center">
              <QrCode className="w-12 h-12 opacity-20" />
              <p>Waiting for scan...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
