import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/prisma';

export interface WatermarkOptions {
  opacity?: number;
  scale?: number; // ratio of page width, default 0.45 (45%)
  logoPath?: string;
  position?: 'CENTER' | 'TILED' | 'DIAGONAL';
  isReceipt?: boolean;
}

export class PdfWatermarkService {
  private static cachedLogoPath: string | null = null;

  /**
   * Resolve the physical path of the institutional logo with robust fallback candidates.
   */
  static getLogoPath(): string | null {
    if (this.cachedLogoPath && fs.existsSync(this.cachedLogoPath)) {
      return this.cachedLogoPath;
    }

    const candidates = [
      path.resolve(process.cwd(), 'assets/branding/institution-logo.png'),
      path.resolve(process.cwd(), '../client/public/branding/official-logo.png'),
      path.resolve(process.cwd(), 'public/branding/official-logo.png'),
      path.resolve(process.cwd(), '../client/public/branding/institution-logo.png'),
      path.resolve(process.cwd(), 'public/branding/institution-logo.png'),
      path.resolve(__dirname, '../../assets/branding/institution-logo.png'),
      path.resolve(__dirname, '../../../../client/public/branding/institution-logo.png'),
      path.resolve(__dirname, '../../../../client/public/branding/official-logo.png'),
      // Legacy path support — will be removed in a future cleanup
      path.resolve(process.cwd(), 'assets/branding/al-ameen-logo.png'),
      path.resolve(process.cwd(), '../client/public/branding/al-ameen-logo.png'),
      path.resolve(process.cwd(), 'assets/branding/vv.png'),
      path.resolve(process.cwd(), '../client/public/branding/vv.png'),
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        this.cachedLogoPath = candidate;
        return candidate;
      }
    }

    return null;
  }

  /**
   * Fetch active institutional watermark configuration from database or defaults.
   */
  static async getBrandingSettings(): Promise<{
    collegeName: string;
    watermarkEnabled: boolean;
    opacity: number;
    position: 'CENTER' | 'TILED' | 'DIAGONAL';
    logoUrl: string;
  }> {
    try {
      const settings = await prisma.systemSetting.findMany({
        where: {
          key: {
            in: [
              'COLLEGE_NAME',
              'WATERMARK_ENABLED',
              'WATERMARK_OPACITY',
              'WATERMARK_POSITION',
              'WATERMARK_LOGO_URL',
            ],
          },
        },
      });

      const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));

      return {
        collegeName: map['COLLEGE_NAME'] || 'CampusOS Institution',
        watermarkEnabled: map['WATERMARK_ENABLED'] !== 'false',
        opacity: (parseFloat(map['WATERMARK_OPACITY'] || '4') || 4) / 100,
        position: (map['WATERMARK_POSITION'] as any) || 'CENTER',
        logoUrl: map['WATERMARK_LOGO_URL'] || '/branding/institution-logo.png',
      };
    } catch {
      return {
        collegeName: 'CampusOS Institution',
        watermarkEnabled: true,
        opacity: 0.04,
        position: 'CENTER',
        logoUrl: '/branding/institution-logo.png',
      };
    }
  }

  /**
   * Draw the institution watermark on the current page of a PDFKit document.
   */
  static drawWatermarkOnCurrentPage(doc: PDFKit.PDFDocument, options?: WatermarkOptions) {
    const logoFile = options?.logoPath || this.getLogoPath();
    if (!logoFile || !fs.existsSync(logoFile)) {
      return;
    }

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const scale = options?.scale || (options?.isReceipt ? 0.38 : 0.48);
    const targetWidth = pageWidth * scale;
    const targetHeight = pageHeight * 0.48;
    
    // Receipt default: 0.028 (2.8%), normal document default: 0.042 (4.2%)
    const opacity = options?.opacity !== undefined 
      ? options.opacity 
      : (options?.isReceipt ? 0.028 : 0.042);

    doc.save();
    try {
      doc.opacity(opacity);
      
      const x = (pageWidth - targetWidth) / 2;
      const y = (pageHeight - targetHeight) / 2;

      doc.image(logoFile, x, y, {
        fit: [targetWidth, targetHeight],
        align: 'center',
        valign: 'center',
      });
    } catch (err) {
      console.error('[PdfWatermarkService] Could not embed watermark image:', err);
    } finally {
      doc.restore();
    }
  }

  /**
   * Attach watermark listener to PDFKit document so it automatically renders on initial page and all future pages.
   */
  static applyWatermark(doc: PDFKit.PDFDocument, options?: WatermarkOptions) {
    // 1. Draw on the current active page
    this.drawWatermarkOnCurrentPage(doc, options);

    // 2. Automatically listen to any newly added page
    doc.on('pageAdded', () => {
      this.drawWatermarkOnCurrentPage(doc, options);
    });
  }
}
