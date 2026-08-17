import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, Upload, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { QrScannerEngine } from '../../platform/qr-scanner';
import { HapticsService } from '../../platform/haptics';
import type { QrScanResult } from '../../platform/platform.types';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: QrScanResult) => void;
  title?: string;
  subtitle?: string;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'Scan QR Code',
  subtitle = 'Align QR code within the viewfinder frame to verify or mark attendance.',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      QrScannerEngine.stopScanner();
      return;
    }

    setErrorMessage(null);
    setIsProcessing(false);
    let cleanupFn: (() => void) | null = null;

    const init = async () => {
      if (videoRef.current) {
        cleanupFn = await QrScannerEngine.startScanner(
          videoRef.current,
          (result) => {
            HapticsService.notification('success');
            setIsProcessing(true);
            onScan(result);
            onClose();
          },
          (err) => {
            setErrorMessage(err);
          }
        );
      }
    };

    const timer = setTimeout(init, 150);

    return () => {
      clearTimeout(timer);
      cleanupFn?.();
      QrScannerEngine.stopScanner();
    };
  }, [isOpen, onScan, onClose]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    const res = await QrScannerEngine.scanImageFile(file);
    if (res) {
      HapticsService.notification('success');
      onScan(res);
      onClose();
    } else {
      HapticsService.notification('warning');
      setErrorMessage('No valid QR code could be detected from the uploaded image.');
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    HapticsService.notification('success');
    onScan({
      token: manualToken.trim(),
      format: 'manual_entry',
      scannedAt: new Date().toISOString(),
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 p-6 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4">
          <div>
            <h3 className="text-lg font-black text-white">{title}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-800 p-2 text-slate-400 transition hover:bg-slate-700 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Viewfinder Box */}
        <div className="relative my-4 flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-indigo-500/50 bg-black">
          <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />

          {/* Scanner Overlay Sightlines */}
          <div className="pointer-events-none absolute inset-8 rounded-2xl border-2 border-indigo-400">
            <div className="absolute -top-1 -left-1 h-4 w-4 border-t-4 border-l-4 border-indigo-400" />
            <div className="absolute -top-1 -right-1 h-4 w-4 border-t-4 border-r-4 border-indigo-400" />
            <div className="absolute -bottom-1 -left-1 h-4 w-4 border-b-4 border-l-4 border-indigo-400" />
            <div className="absolute -bottom-1 -right-1 h-4 w-4 border-b-4 border-r-4 border-indigo-400" />
          </div>

          {isProcessing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm">
              <CheckCircle2 className="h-10 w-10 text-emerald-400 animate-pulse" />
              <span className="mt-2 text-xs font-bold text-white">QR Code Verified</span>
            </div>
          )}
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-500/10 p-3 text-xs text-rose-400 border border-rose-500/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="space-y-3">
          <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 py-2.5 text-xs font-bold text-slate-200 transition hover:bg-slate-700">
            <Upload className="h-4 w-4 text-indigo-400" />
            <span>Upload QR Image / Photo</span>
            <input type="file" accept="image/*" className="sr-only" onChange={handleFileUpload} />
          </label>

          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Or enter QR token manually (e.g. ATT-9821)"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!manualToken.trim()}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-500 disabled:opacity-40"
            >
              Verify
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
