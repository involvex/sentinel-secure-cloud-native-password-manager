import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
}
export function QRScanner({ isOpen, onClose, onScan }: QRScannerProps) {
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = "sentinel-qr-reader";
  const stopScanner = useCallback(async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (e) {
        console.error("Failed to stop scanner", e);
      }
    }
    scannerRef.current = null;
    setIsCameraReady(false);
    setScanSuccess(false);
  }, []);
  useEffect(() => {
    if (isOpen && !scannerRef.current) {
      // Use setTimeout to ensure the element is rendered in the DOM before targeting by ID
      const timer = setTimeout(() => {
        const html5QrCode = new Html5Qrcode(containerId);
        scannerRef.current = html5QrCode;
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };
        html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            setScanSuccess(true);
            html5QrCode.pause();
            setTimeout(() => {
              onScan(decodedText);
              stopScanner();
            }, 800);
          },
          () => {
            // Failure ignored to reduce noise
          }
        ).then(() => setIsCameraReady(true))
         .catch((err) => {
           console.error("Camera start error:", err);
           toast.error("Could not access camera. Please check permissions.");
           onClose();
         });
      }, 100);
      return () => clearTimeout(timer);
    }
    return () => {
      void stopScanner();
    };
  }, [isOpen, onClose, onScan, stopScanner]);
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Scan 2FA QR Code
          </DialogTitle>
          <DialogDescription>
            Point your camera at the QR code provided by the service.
          </DialogDescription>
        </DialogHeader>
        <div className="relative aspect-square w-full bg-black rounded-xl overflow-hidden mt-4 border-2 border-border/50">
          <div id={containerId} className="w-full h-full" />
          {!isCameraReady && !scanSuccess && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
              <p className="text-xs font-medium text-muted-foreground">Initializing Camera...</p>
            </div>
          )}
          {isCameraReady && !scanSuccess && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 border-[40px] border-black/40" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] border-2 border-primary/50 rounded-lg shadow-[0_0_0_100vmax_rgba(0,0,0,0.3)]">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-primary" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-primary" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-primary" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-primary" />
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-primary/30 animate-pulse" />
              </div>
            </div>
          )}
          {scanSuccess && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-500/20 backdrop-blur-md z-20 animate-in fade-in zoom-in duration-300">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-2" />
              <p className="text-emerald-700 dark:text-emerald-400 font-bold">Successfully Scanned!</p>
            </div>
          )}
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Supports Google Authenticator, Authy, and standard TOTP formats.
          </p>
          <Button variant="outline" className="w-full" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}