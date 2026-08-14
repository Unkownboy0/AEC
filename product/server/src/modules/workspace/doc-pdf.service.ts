import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';

type Block = { tag: string; text: string; bold?: boolean; src?: string; rows?: string[][] };

// Parses the sanitized doc HTML (our own allowlisted vocabulary — see
// html-sanitizer.ts) into flat render blocks. Inline formatting beyond
// "whole block is bold" is not preserved in the PDF render.
// ponytail: block-level bold only, no run-level rich text in PDF export — upgrade to a real HTML->PDF layout pass if per-word formatting fidelity is requested.
const parseBlocks = (html: string): Block[] => {
  const blocks: Block[] = [];
  const blockRe = /<(h[1-6]|p|div|li|blockquote|pre|hr|img|table)\b([^>]*)>([\s\S]*?)<\/\1>|<(hr|img)\b([^>]*)\/?>/gi;
  let match: RegExpExecArray | null;
  while ((match = blockRe.exec(html)) !== null) {
    const tag = (match[1] || match[4] || '').toLowerCase();
    const attrs = match[2] || match[5] || '';
    const inner = match[3] || '';
    if (tag === 'hr') { blocks.push({ tag: 'hr', text: '' }); continue; }
    if (tag === 'img') {
      const src = /src="([^"]*)"/i.exec(attrs)?.[1] ?? '';
      blocks.push({ tag: 'img', text: '', src });
      continue;
    }
    if (tag === 'table') {
      const rows: string[][] = [];
      const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
      let rowMatch: RegExpExecArray | null;
      while ((rowMatch = rowRe.exec(inner)) !== null) {
        const cells: string[] = [];
        const cellRe = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
        let cellMatch: RegExpExecArray | null;
        while ((cellMatch = cellRe.exec(rowMatch[1])) !== null) cells.push(stripTags(cellMatch[1]));
        rows.push(cells);
      }
      blocks.push({ tag: 'table', text: '', rows });
      continue;
    }
    const bold = /<(b|strong)>/i.test(inner) && !/[^<]/.test(inner.replace(/<\/?(b|strong)>/gi, '').replace(/<[^>]+>/g, ''));
    const text = stripTags(inner);
    if (text.trim() || tag.startsWith('h')) blocks.push({ tag, text, bold });
  }
  return blocks;
};

const stripTags = (html: string): string =>
  html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim();

const MARGINS: Record<string, number> = { normal: 72, narrow: 36 };

export const renderDocToPdf = async (fileId: string, options: { margin?: 'normal' | 'narrow'; watermark?: boolean; qr?: boolean } = {}): Promise<Buffer> => {
  const file = await prisma.workspaceFile.findUnique({ where: { id: fileId } });
  if (!file) throw new Error('Document not found');
  const settingsRows = await prisma.systemSetting.findMany({ where: { key: { in: ['COLLEGE_NAME', 'COLLEGE_LOGO_URL'] } } });
  const settings = Object.fromEntries(settingsRows.map((s) => [s.key, s.value]));

  const margin = MARGINS[options.margin ?? 'normal'] ?? MARGINS.normal;
  const doc = new PDFDocument({ size: 'A4', margin, bufferPages: true });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));

  if (settings.COLLEGE_NAME) {
    doc.fontSize(9).fillColor('#666666').text(settings.COLLEGE_NAME, margin, 24, { align: 'center' });
    doc.moveTo(margin, 44).lineTo(doc.page.width - margin, 44).strokeColor('#dddddd').stroke();
  }
  doc.fillColor('#111111').y = Math.max(doc.y, 60);

  for (const block of parseBlocks(file.content ?? '')) {
    switch (block.tag) {
      case 'h1': doc.fontSize(20).font('Helvetica-Bold').text(block.text, { paragraphGap: 8 }); break;
      case 'h2': doc.fontSize(16).font('Helvetica-Bold').text(block.text, { paragraphGap: 6 }); break;
      case 'h3': case 'h4': case 'h5': case 'h6': doc.fontSize(13).font('Helvetica-Bold').text(block.text, { paragraphGap: 6 }); break;
      case 'blockquote': doc.fontSize(11).font('Helvetica-Oblique').fillColor('#555555').text(block.text, { indent: 20, paragraphGap: 6 }).fillColor('#111111'); break;
      case 'pre': doc.fontSize(9).font('Courier').text(block.text, { paragraphGap: 6 }); break;
      case 'hr': doc.moveDown(0.3).moveTo(doc.x, doc.y).lineTo(doc.page.width - margin, doc.y).strokeColor('#cccccc').stroke().moveDown(0.5); break;
      case 'li': doc.fontSize(11).font(block.bold ? 'Helvetica-Bold' : 'Helvetica').text(`•  ${block.text}`, { indent: 12, paragraphGap: 2 }); break;
      case 'table':
        if (block.rows?.length) renderTable(doc, block.rows, margin);
        break;
      case 'img':
        break; // remote/user-hosted images are not embedded to avoid SSRF via arbitrary fetch during export
      default: doc.fontSize(11).font(block.bold ? 'Helvetica-Bold' : 'Helvetica').text(block.text || ' ', { paragraphGap: 4 });
    }
  }

  const range = doc.bufferedPageRange();
  const qrUrl = options.qr ? `${env.PUBLIC_APP_URL || ''}/workspace/docs/${fileId}` : null;
  const qrPng = qrUrl ? await QRCode.toBuffer(qrUrl, { width: 96, margin: 0 }) : null;
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(8).fillColor('#888888').text(`Page ${i + 1} of ${range.count}`, margin, doc.page.height - 30, { align: 'center', width: doc.page.width - margin * 2 });
    if (qrPng) doc.image(qrPng, doc.page.width - margin - 50, doc.page.height - margin - 50, { width: 50, height: 50 });
    if (options.watermark) {
      doc.save();
      doc.rotate(-45, { origin: [doc.page.width / 2, doc.page.height / 2] });
      doc.fontSize(60).fillColor('#f0f0f0').opacity(0.4).text('OFFICIAL', 0, doc.page.height / 2 - 30, { align: 'center', width: doc.page.width });
      doc.opacity(1).restore();
    }
  }

  doc.end();
  return done;
};

const renderTable = (doc: PDFKit.PDFDocument, rows: string[][], margin: number) => {
  const colCount = Math.max(...rows.map((r) => r.length));
  const width = (doc.page.width - margin * 2) / colCount;
  doc.moveDown(0.3);
  const startY = doc.y;
  let y = startY;
  for (const row of rows) {
    let x = doc.x;
    const rowHeight = 20;
    for (let c = 0; c < colCount; c++) {
      doc.rect(x, y, width, rowHeight).strokeColor('#cccccc').stroke();
      doc.fontSize(9).font('Helvetica').fillColor('#111111').text(row[c] ?? '', x + 4, y + 5, { width: width - 8, height: rowHeight - 6, ellipsis: true });
      x += width;
    }
    y += rowHeight;
  }
  doc.y = y + 8;
};
