import { deviceCapabilities } from './device-capabilities.manager';
import type { QrScanResult } from './platform.types';

export class QrScannerEngine {
  private static stream: MediaStream | null = null;

  /**
   * Starts a live video stream on a given HTMLVideoElement for QR scanning.
   */
  public static async startScanner(
    videoElement: HTMLVideoElement,
    onCodeDetected: (result: QrScanResult) => void,
    onError?: (error: string) => void
  ): Promise<() => void> {
    const permission = await deviceCapabilities.requestCameraPermission();
    if (permission !== 'GRANTED') {
      if (permission === 'DISABLED_BY_SUPER_ADMIN') {
        onError?.('QR Scanner is currently disabled by institutional policy.');
      } else if (permission === 'PERMANENTLY_DENIED') {
        deviceCapabilities.openAppSettingsGuide('QR Scanner', 'Camera');
        onError?.('Camera permission denied.');
      } else {
        onError?.('Camera permission was not granted.');
      }
      return () => {};
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      videoElement.srcObject = this.stream;
      await videoElement.play();

      let active = true;
      let scanInterval: any = null;

      // Check if native BarcodeDetector API is supported
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        scanInterval = setInterval(async () => {
          if (!active || videoElement.readyState < 2) return;
          try {
            const codes = await barcodeDetector.detect(videoElement);
            if (codes && codes.length > 0) {
              const rawValue = codes[0].rawValue || codes[0].displayValue;
              if (rawValue) {
                onCodeDetected({
                  token: rawValue,
                  format: codes[0].format || 'qr_code',
                  scannedAt: new Date().toISOString(),
                });
              }
            }
          } catch {
            // Scanner frame dropped, ignore
          }
        }, 250);
      }

      return () => {
        active = false;
        if (scanInterval) clearInterval(scanInterval);
        this.stopScanner();
      };
    } catch (err: any) {
      onError?.(err.message || 'Failed to start camera');
      return () => {};
    }
  }

  /**
   * Stops the active camera stream.
   */
  public static stopScanner(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }

  /**
   * Fallback: Decodes QR code from an uploaded image file (SAF / Photo Picker).
   */
  public static async scanImageFile(file: File): Promise<QrScanResult | null> {
    if ('BarcodeDetector' in window) {
      try {
        const bitmap = await createImageBitmap(file);
        const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        const codes = await barcodeDetector.detect(bitmap);
        if (codes && codes.length > 0) {
          return {
            token: codes[0].rawValue || codes[0].displayValue,
            format: 'qr_code',
            scannedAt: new Date().toISOString(),
          };
        }
      } catch {
        // Fallback or unsupported image format
      }
    }
    return null;
  }
}
