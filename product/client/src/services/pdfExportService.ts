import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export interface PdfExportOptions {
  orientation?: 'portrait' | 'landscape';
  unit?: 'mm' | 'pt' | 'px';
  format?: string | [number, number];
  watermarkOpacity?: number; // 0.03 to 0.05 default
  watermarkLogoUrl?: string;
  enableWatermark?: boolean;
  scale?: number;
  margin?: number;
  headerTitle?: string;
  footerText?: string;
}

let cachedWatermarkBase64: string | null = null;

/**
 * Load and cache institution logo as Base64 image for fast jsPDF watermark rendering.
 */
export async function getWatermarkBase64(url = '/branding/al-ameen-logo.png'): Promise<string | null> {
  if (cachedWatermarkBase64) return cachedWatermarkBase64;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 400;
        canvas.height = img.naturalHeight || img.height || 400;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          cachedWatermarkBase64 = canvas.toDataURL('image/png');
          resolve(cachedWatermarkBase64);
        } else {
          resolve(null);
        }
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Draw institution watermark centered on a jsPDF page with strict background opacity.
 */
export function drawPdfWatermark(pdf: jsPDF, watermarkImgBase64: string, options?: { opacity?: number; orientation?: 'portrait' | 'landscape' }) {
  try {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const isLandscape = options?.orientation === 'landscape' || pageWidth > pageHeight;

    const watermarkWidth = pageWidth * (isLandscape ? 0.40 : 0.50);
    const watermarkHeight = watermarkWidth; // Square / proportional box
    const x = (pageWidth - watermarkWidth) / 2;
    const y = (pageHeight - watermarkHeight) / 2;

    const opacity = options?.opacity ?? 0.045;

    // Use GState if available in jsPDF to set alpha transparency
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
    console.error('[pdfExportService] Failed to draw watermark on PDF page:', err);
  }
}

/**
 * Export any HTML element into a multi-page PDF document with background institution watermark on every page.
 */
export async function exportElementToWatermarkedPdf(
  element: HTMLElement,
  filename: string,
  options: PdfExportOptions = {}
): Promise<jsPDF> {
  const orientation = options.orientation || 'portrait';
  const scale = options.scale || 2;
  const enableWatermark = options.enableWatermark !== false;
  const watermarkOpacity = options.watermarkOpacity ?? 0.04;
  const logoUrl = options.watermarkLogoUrl || '/branding/al-ameen-logo.png';

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
  const imgData = canvas.toDataURL('image/jpeg', 0.85);

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
      drawPdfWatermark(pdf, watermarkBase64, { opacity: watermarkOpacity, orientation });
    }

    // 2. Draw Content Image
    pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, imgHeightOnPdf, undefined, 'FAST');

    heightLeft -= pageHeight;
    position -= pageHeight;
    pageIndex++;
  }

  // Save the PDF file
  pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
  return pdf;
}

/**
 * Create a watermarked jsPDF document directly and apply watermark across all pages.
 */
export async function createWatermarkedJsPdf(options: PdfExportOptions = {}): Promise<{
  pdf: jsPDF;
  drawWatermark: () => void;
}> {
  const orientation = options.orientation || 'portrait';
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: options.format || 'a4',
  });

  const logoUrl = options.watermarkLogoUrl || '/branding/al-ameen-logo.png';
  const watermarkBase64 = await getWatermarkBase64(logoUrl);

  const drawWatermark = () => {
    if (watermarkBase64) {
      drawPdfWatermark(pdf, watermarkBase64, { opacity: options.watermarkOpacity ?? 0.045, orientation });
    }
  };

  // Draw initial page watermark
  drawWatermark();

  return { pdf, drawWatermark };
}
