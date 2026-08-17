/**
 * CAMPUSOS WATERMARK SERVICE
 *
 * Central policy and rendering engine for embedding the official institution logo
 * (IMAGE 2) into background layouts, printable views, and downloadable files.
 */

import { BrandingService } from './brandingService';

export type DocumentCategory =
  | 'UI_BACKGROUND'
  | 'OFFICIAL_DOCUMENT'
  | 'A4_PDF'
  | 'PRINT'
  | 'CERTIFICATE'
  | 'RECEIPT'
  | 'TIMETABLE'
  | 'RESULT_SHEET'
  | 'OFFICE_SUITE'
  | 'REPORT';

export interface WatermarkPolicy {
  enabled: boolean;
  logoUrl: string;
  opacity: number;
  scale: number; // Ratio of page/container width (0.25 to 0.50)
  position: 'CENTER' | 'TILED' | 'DIAGONAL';
  isReceipt?: boolean;
}

export class WatermarkService {
  /**
   * Get official emblem logo path (IMAGE 2).
   */
  static getInstitutionLogo(): string {
    return BrandingService.getOfficialLogo();
  }

  /**
   * Resolve effective watermark policy for a given document category.
   */
  static getEffectiveWatermarkPolicy(category: DocumentCategory = 'OFFICIAL_DOCUMENT', isDarkMode = false): WatermarkPolicy {
    const branding = BrandingService.getBranding();
    const logoUrl = BrandingService.getWatermarkLogo();

    if (!branding.watermarkEnabled) {
      return {
        enabled: false,
        logoUrl,
        opacity: 0,
        scale: 0.4,
        position: 'CENTER',
      };
    }

    switch (category) {
      case 'RECEIPT':
        return {
          enabled: branding.receiptWatermarkEnabled,
          logoUrl,
          opacity: 0.024, // 2.4% - Ultra-subtle to keep numbers & currency clear
          scale: 0.35,
          position: 'CENTER',
          isReceipt: true,
        };

      case 'CERTIFICATE':
        return {
          enabled: branding.certificateWatermarkEnabled,
          logoUrl,
          opacity: 0.05, // 5% - Rich and formal emblem behind certificate text
          scale: 0.45,
          position: 'CENTER',
        };

      case 'TIMETABLE':
      case 'RESULT_SHEET':
        return {
          enabled: branding.downloadWatermarkEnabled,
          logoUrl,
          opacity: 0.03, // 3% - High cell and grade legibility
          scale: 0.40,
          position: 'CENTER',
        };

      case 'UI_BACKGROUND':
        return {
          enabled: branding.watermarkEnabled,
          logoUrl,
          opacity: isDarkMode ? branding.watermarkOpacityDark : branding.watermarkOpacityLight,
          scale: branding.watermarkScale,
          position: branding.watermarkPosition,
        };

      case 'PRINT':
        return {
          enabled: branding.printWatermarkEnabled,
          logoUrl,
          opacity: 0.04,
          scale: 0.42,
          position: 'CENTER',
        };

      case 'OFFICE_SUITE':
      case 'REPORT':
      case 'A4_PDF':
      case 'OFFICIAL_DOCUMENT':
      default:
        return {
          enabled: branding.downloadWatermarkEnabled,
          logoUrl,
          opacity: 0.038,
          scale: 0.42,
          position: 'CENTER',
        };
    }
  }

  /**
   * Determine whether a given route should suppress background watermark.
   */
  static shouldHideWatermarkOnRoute(pathname: string): boolean {
    const exemptRoutes = [
      '/login',
      '/forgot-password',
      '/reset-password',
      '/verify',
      '/public',
      '/scanner',
      '/camera',
      '/biometric',
    ];
    return exemptRoutes.some((route) => pathname.toLowerCase().startsWith(route));
  }

  /**
   * Create an HTML watermark layer for printable documents.
   */
  static createPrintWatermarkElement(category: DocumentCategory = 'PRINT'): HTMLElement {
    const policy = this.getEffectiveWatermarkPolicy(category);
    const container = document.createElement('div');
    container.className = 'print-watermark-overlay';
    container.setAttribute('aria-hidden', 'true');
    container.style.position = 'absolute';
    container.style.inset = '0';
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '0';
    container.style.opacity = policy.opacity.toString();

    const img = document.createElement('img');
    img.src = policy.logoUrl;
    img.alt = '';
    img.style.width = `${Math.round(policy.scale * 100)}%`;
    img.style.maxWidth = '520px';
    img.style.objectFit = 'contain';

    container.appendChild(img);
    return container;
  }
}
