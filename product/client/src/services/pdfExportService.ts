import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { BrandingService } from './brandingService';
import { WatermarkService, DocumentCategory } from './watermarkService';
import { saveBlobAndOpen } from '../platform/download';

export interface PdfExportOptions {
  orientation?: 'portrait' | 'landscape';
  unit?: 'mm' | 'pt' | 'px';
  format?: string | [number, number];
  watermarkOpacity?: number; // 0.024 to 0.05
  watermarkLogoUrl?: string;
  enableWatermark?: boolean;
  scale?: number;
  margin?: number;
  headerTitle?: string;
  footerText?: string;
  category?: DocumentCategory;
}

let cachedWatermarkBase64: string | null = null;
let lastCachedUrl: string | null = null;

/**
 * Load and cache official institution logo (IMAGE 2) as Base64 image for jsPDF watermark rendering.
 */
export async function getWatermarkBase64(url?: string): Promise<string | null> {
  const targetUrl = url || BrandingService.getOfficialLogo();

  if (cachedWatermarkBase64 && lastCachedUrl === targetUrl) {
    return cachedWatermarkBase64;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 500;
        canvas.height = img.naturalHeight || img.height || 500;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          cachedWatermarkBase64 = canvas.toDataURL('image/png');
          lastCachedUrl = targetUrl;
          resolve(cachedWatermarkBase64);
        } else {
          resolve(null);
        }
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => {
      // Fallback to official-logo or transparent fallback
      resolve(null);
    };
    img.src = targetUrl;
  });
}

/**
 * Draw institution watermark centered on a jsPDF page with strict background opacity.
 */
export function drawPdfWatermark(
  pdf: jsPDF,
  watermarkImgBase64: string,
  options?: { opacity?: number; orientation?: 'portrait' | 'landscape'; scale?: number }
) {
  try {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const isLandscape = options?.orientation === 'landscape' || pageWidth > pageHeight;

    const scaleFactor = options?.scale || (isLandscape ? 0.38 : 0.46);
    const watermarkWidth = pageWidth * scaleFactor;
    const watermarkHeight = watermarkWidth; // Proportional square aspect
    const x = (pageWidth - watermarkWidth) / 2;
    const y = (pageHeight - watermarkHeight) / 2;

    const opacity = options?.opacity ?? 0.04;

    const anyPdf = pdf as any;
    if (typeof anyPdf.saveGraphicsState === 'function' && typeof anyPdf.setGState === 'function') {
      anyPdf.saveGraphicsState();
      anyPdf.setGState(new anyPdf.GState({ opacity }));
      pdf.addImage(watermarkImgBase64, 'PNG', x, y, watermarkWidth, watermarkHeight, undefined, 'FAST');
      anyPdf.restoreGraphicsState();
    } else {
      pdf.addImage(watermarkImgBase64, 'PNG', x, y, watermarkWidth, watermarkHeight, undefined, 'FAST');
    }
  } catch (err) {
    console.error('[pdfExportService] Could not draw watermark on PDF page:', err);
  }
}

/**
 * Draw standard institution letterhead header at top of PDF page.
 */
export function drawInstitutionHeader(pdf: jsPDF, documentTitle?: string) {
  const branding = BrandingService.getBranding();
  const pageWidth = pdf.internal.pageSize.getWidth();

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.setTextColor(15, 23, 42); // slate-900
  pdf.text(branding.institutionName.toUpperCase(), pageWidth / 2, 14, { align: 'center' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139); // slate-500
  pdf.text(branding.affiliation, pageWidth / 2, 19, { align: 'center' });
  pdf.text(branding.address, pageWidth / 2, 23, { align: 'center' });

  // Divider line
  pdf.setDrawColor(203, 213, 225); // slate-300
  pdf.setLineWidth(0.3);
  pdf.line(14, 26, pageWidth - 14, 26);

  if (documentTitle) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(30, 41, 59);
    pdf.text(documentTitle.toUpperCase(), pageWidth / 2, 32, { align: 'center' });
  }
}

/**
 * Draw footer with date, verified emblem, and page numbers.
 */
export function drawInstitutionFooter(pdf: jsPDF, pageNumber: number, totalPages: number) {
  const branding = BrandingService.getBranding();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  pdf.setDrawColor(226, 232, 240); // slate-200
  pdf.setLineWidth(0.2);
  pdf.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(148, 163, 184); // slate-400

  const nowStr = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  pdf.text(`CampusOS Official Record • Generated: ${nowStr} • ${branding.shortName}`, 14, pageHeight - 7);
  pdf.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - 14, pageHeight - 7, { align: 'right' });
}

/**
 * Export any HTML element into a multi-page PDF document with background institution watermark (IMAGE 2) on every page.
 */
export async function exportElementToWatermarkedPdf(
  element: HTMLElement,
  filename: string,
  options: PdfExportOptions = {}
): Promise<jsPDF> {
  const orientation = options.orientation || 'portrait';
  const scale = options.scale || 2;
  const enableWatermark = options.enableWatermark !== false;
  const category = options.category || 'OFFICIAL_DOCUMENT';
  const policy = WatermarkService.getEffectiveWatermarkPolicy(category);
  const watermarkOpacity = options.watermarkOpacity ?? policy.opacity;
  const logoUrl = options.watermarkLogoUrl || policy.logoUrl;

  const watermarkBase64 = enableWatermark ? await getWatermarkBase64(logoUrl) : null;

  // Capture canvas using html2canvas
  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: options.format || 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const imgData = canvas.toDataURL('image/jpeg', 0.90);

  const imgHeightOnPdf = (canvasHeight * pageWidth) / canvasWidth;
  let heightLeft = imgHeightOnPdf;
  let position = 0;
  let pageIndex = 0;

  while (heightLeft > 0) {
    if (pageIndex > 0) {
      pdf.addPage(options.format || 'a4', orientation);
    }

    // 1. Draw Watermark on Page Background
    if (watermarkBase64) {
      drawPdfWatermark(pdf, watermarkBase64, {
        opacity: watermarkOpacity,
        orientation,
        scale: policy.scale,
      });
    }

    // 2. Draw Content Image
    pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, imgHeightOnPdf, undefined, 'FAST');

    heightLeft -= pageHeight;
    position -= pageHeight;
    pageIndex++;
  }

  // Save the PDF file across Web and Native Mobile
  const safeFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  const pdfBlob = pdf.output('blob');
  await saveBlobAndOpen(pdfBlob, safeFilename, 'application/pdf');
  return pdf;
}

/**
 * Create a watermarked jsPDF document directly with pre-rendered watermark.
 */
export async function createWatermarkedJsPdf(options: PdfExportOptions = {}): Promise<{
  pdf: jsPDF;
  drawWatermark: () => void;
  applyHeader: (title?: string) => void;
  applyFooter: (page: number, total: number) => void;
}> {
  const orientation = options.orientation || 'portrait';
  const category = options.category || 'OFFICIAL_DOCUMENT';
  const policy = WatermarkService.getEffectiveWatermarkPolicy(category);

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: options.format || 'a4',
  });

  const logoUrl = options.watermarkLogoUrl || policy.logoUrl;
  const watermarkBase64 = await getWatermarkBase64(logoUrl);

  const drawWatermark = () => {
    if (watermarkBase64 && policy.enabled) {
      drawPdfWatermark(pdf, watermarkBase64, {
        opacity: options.watermarkOpacity ?? policy.opacity,
        orientation,
        scale: policy.scale,
      });
    }
  };

  const applyHeader = (title?: string) => {
    drawInstitutionHeader(pdf, title || options.headerTitle);
  };

  const applyFooter = (page: number, total: number) => {
    drawInstitutionFooter(pdf, page, total);
  };

  // Draw initial page watermark
  drawWatermark();

  return { pdf, drawWatermark, applyHeader, applyFooter };
}
