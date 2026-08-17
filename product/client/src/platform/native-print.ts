export class NativePrintService {
  /**
   * Invokes the native system print manager with high-fidelity formatting.
   */
  public static printCurrentView(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  /**
   * Creates a dedicated printable window with official styling and watermark.
   */
  public static printHtmlDocument(title: string, htmlContent: string, watermarkUrl?: string): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const watermarkStyle = watermarkUrl
      ? `
        body::before {
          content: "";
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background-image: url('${watermarkUrl}');
          background-repeat: no-repeat;
          background-position: center;
          background-size: 35%;
          opacity: 0.04;
          z-index: -1;
          pointer-events: none;
        }
      `
      : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              line-height: 1.5;
              margin: 0;
              padding: 0;
            }
            ${watermarkStyle}
            .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; }
            .header h1 { font-size: 20px; margin: 0; color: #1e293b; }
            .header p { font-size: 11px; margin: 4px 0 0 0; color: #64748b; }
            @media print {
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>CampusOS Official Document</h1>
            <p>Generated via CampusOS Institutional Platform • Verified</p>
          </div>
          <div class="content">${htmlContent}</div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }
}
