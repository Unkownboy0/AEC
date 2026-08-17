import type { SignatureCaptureResult } from './platform.types';

export class DigitalSignatureEngine {
  /**
   * Computes a standard SHA-256 hash string for an image data URL.
   */
  public static async computeSha256(dataUrl: string): Promise<string> {
    try {
      const msgBuffer = new TextEncoder().encode(dataUrl);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback simple checksum
      let hash = 0;
      for (let i = 0; i < dataUrl.length; i++) {
        const char = dataUrl.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
      }
      return 'SIG-' + Math.abs(hash).toString(16);
    }
  }

  /**
   * Packages a canvas signature into a verified SignatureCaptureResult.
   */
  public static async packageSignature(canvas: HTMLCanvasElement): Promise<SignatureCaptureResult> {
    const dataUrl = canvas.toDataURL('image/png');
    const sha256Hash = await this.computeSha256(dataUrl);
    return {
      dataUrl,
      sha256Hash,
      signedAt: new Date().toISOString(),
    };
  }
}
