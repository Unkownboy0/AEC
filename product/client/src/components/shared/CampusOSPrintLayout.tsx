import React from 'react';
import { Printer, Download, X, Building2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useInstitution } from '../../context/InstitutionContext';

export interface CampusOSPrintLayoutProps {
  title: string;
  subtitle?: string;
  departmentName?: string;
  academicYear?: string;
  documentRefNumber?: string;
  orientation?: 'portrait' | 'landscape';
  showWatermark?: boolean;
  watermarkOpacity?: number;
  watermarkLogoUrl?: string;
  onClose?: () => void;
  onDownloadPdf?: () => void;
  children: React.ReactNode;
}

export const CampusOSPrintLayout: React.FC<CampusOSPrintLayoutProps> = ({
  title,
  subtitle,
  departmentName,
  academicYear = '2026-2027',
  documentRefNumber,
  orientation = 'portrait',
  showWatermark = true,
  watermarkOpacity = 0.045,
  watermarkLogoUrl = '/branding/institution-logo.png',
  onClose,
  onDownloadPdf,
  children,
}) => {
  const institution = useInstitution();
  const branding = {
    collegeName: institution.collegeName,
    collegeAddress: institution.collegeAddress,
    collegePhone: institution.collegePhone,
    collegeWebsite: institution.collegeWebsite,
    logoUrl: institution.watermark.logoUrl || watermarkLogoUrl,
  };

  const handlePrint = () => {
    window.print();
  };

  const refCode = documentRefNumber || `DOC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  const currentDateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className={`campusos-print-container relative w-full bg-white text-slate-900 ${orientation === 'landscape' ? 'max-w-[1120px]' : 'max-w-[850px]'} mx-auto p-4 sm:p-8 shadow-md rounded-2xl border border-slate-200`}>
      {/* Top Action Toolbar (Hidden during Print) */}
      <div className="print:hidden flex items-center justify-between gap-3 pb-6 mb-6 border-b border-slate-200 bg-slate-50 -mx-4 -mt-4 sm:-mx-8 sm:-mt-8 p-4 sm:p-6 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-800">Official Document Print & Export</h3>
            <p className="text-xs text-slate-500">Includes institutional watermark and official verification seal</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onDownloadPdf && (
            <button
              onClick={onDownloadPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition"
            >
              <Download className="h-4 w-4" /> Download PDF
            </button>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition"
          >
            <Printer className="h-4 w-4" /> Print Document
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200 transition"
              title="Close Preview"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* ─── OFFICIAL PRINT WATERMARK LAYER ─────────────────────────────────── */}
      {showWatermark && (
        <div
          aria-hidden="true"
          className="print-watermark-overlay pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden select-none"
        >
          <img
            src={branding.logoUrl}
            alt=""
            draggable={false}
            className="h-auto object-contain transition-all"
            style={{
              width: orientation === 'landscape' ? '40%' : '52%',
              maxWidth: orientation === 'landscape' ? '450px' : '380px',
              opacity: watermarkOpacity,
              filter: 'grayscale(100%) contrast(110%)',
            }}
          />
        </div>
      )}

      {/* ─── DOCUMENT CONTENT (Z-INDEX 10 ABOVE WATERMARK) ─────────────────── */}
      <div className="relative z-10 space-y-6">
        {/* Institutional Header */}
        <header className="border-b-2 border-indigo-900 pb-4 text-center space-y-1">
          <div className="flex items-center justify-center gap-3">
            <img
              src={branding.logoUrl}
              alt="Institution Logo"
              className="h-14 w-14 object-contain"
            />
            <div className="text-left">
              <h1 className="text-xl font-black uppercase tracking-tight text-indigo-950">
                {branding.collegeName}
              </h1>
              <p className="text-[10px] text-slate-500 font-semibold">
                {branding.collegeAddress} | Tel: {branding.collegePhone}
              </p>
              <p className="text-[10px] text-slate-500 font-semibold">
                Accredited by NAAC | Approved by AICTE | Affiliated to Anna University
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-200 mt-2 text-xs font-bold text-slate-700">
            <span>{departmentName ? `Department of ${departmentName}` : 'Institutional Document'}</span>
            <span className="text-indigo-800 uppercase font-black">{title}</span>
            <span>AY: {academicYear}</span>
          </div>

          {subtitle && (
            <p className="text-xs text-slate-600 font-medium italic pt-1">{subtitle}</p>
          )}
        </header>

        {/* Main Document Body */}
        <main className="min-h-[400px]">
          {children}
        </main>

        {/* Official Institutional Footer */}
        <footer className="border-t border-slate-300 pt-4 mt-8 text-[10px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>CampusOS Verified Official Document</span>
            <span className="text-slate-400 font-normal">| Ref: {refCode}</span>
          </div>

          <div className="text-right">
            <span>Generated on: {currentDateStr} | Self-Service Portal</span>
          </div>
        </footer>
      </div>

      {/* Native Print Stylesheet */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .campusos-print-container {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
          }
          .print-watermark-overlay {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            opacity: 1 !important;
            z-index: -1 !important;
          }
          .print-watermark-overlay img {
            opacity: ${watermarkOpacity} !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CampusOSPrintLayout;
