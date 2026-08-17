import React, { useState } from 'react';
import {
  ShieldCheck,
  FileText,
  Award,
  Receipt,
  Grid,
  Sun,
  Moon,
  Smartphone,
  Eye,
  Sliders,
  Sparkles,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { BrandingService } from '../../services/brandingService';
import { useInstitution } from '../../context/InstitutionContext';
import { toast } from '../../components/ui/Toast';

export const BrandingWatermarkControlCenter: React.FC = () => {
  const institution = useInstitution();
  const [activePreview, setActivePreview] = useState<'ui' | 'a4' | 'certificate' | 'receipt' | 'timetable'>('ui');
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light');
  const [opacity, setOpacity] = useState<number>(4);
  const [scale, setScale] = useState<number>(42);
  const [watermarkEnabled, setWatermarkEnabled] = useState<boolean>(true);
  const [applyPdf, setApplyPdf] = useState<boolean>(true);
  const [applyPrint, setApplyPrint] = useState<boolean>(true);
  const [applyCertificates, setApplyCertificates] = useState<boolean>(true);
  const [applyReceipts, setApplyReceipts] = useState<boolean>(true);

  const officialLogo = BrandingService.getOfficialLogo();
  const appIcon = BrandingService.getAppIcon();

  const handleSavePolicy = () => {
    toast.success('Branding & Watermark Policy updated successfully.');
  };

  return (
    <div className="space-y-6">
      {/* ─── 1. Asset Separation Matrix ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* IMAGE 1 Card */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
                <Smartphone size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">IMAGE 1: Android App Icon</h3>
                <p className="text-xs text-muted-foreground">Android Launcher, Splash & Play Store Identity</p>
              </div>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300">
              App Only
            </span>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-violet-200 dark:border-violet-800 shadow-md flex-shrink-0 bg-white">
              <img
                src={appIcon}
                alt="CampusOS Android App Icon"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-xs space-y-1 text-muted-foreground">
              <div className="flex items-center gap-1.5 text-foreground font-medium">
                <CheckCircle2 size={13} className="text-emerald-500" />
                Adaptive mipmap-mdpi to xxxhdpi generated
              </div>
              <div className="flex items-center gap-1.5 text-foreground font-medium">
                <CheckCircle2 size={13} className="text-emerald-500" />
                512x512 Play Store asset ready
              </div>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                * Strictly excluded from document watermarks and official prints.
              </p>
            </div>
          </div>
        </div>

        {/* IMAGE 2 Card */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">IMAGE 2: Official Institution Logo</h3>
                <p className="text-xs text-muted-foreground">Official Watermark, Documents, PDF & Print</p>
              </div>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
              Official Watermark
            </span>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-border flex-shrink-0 bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-1.5 shadow-sm">
              <img
                src={officialLogo}
                alt="Official Institution Emblem"
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="text-xs space-y-1 text-muted-foreground">
              <div className="flex items-center gap-1.5 text-foreground font-medium">
                <CheckCircle2 size={13} className="text-emerald-500" />
                Active background watermark across CampusOS
              </div>
              <div className="flex items-center gap-1.5 text-foreground font-medium">
                <CheckCircle2 size={13} className="text-emerald-500" />
                Embedded in Docs, Sheets, PDFs, and Print
              </div>
              <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                Al-Ameen Engineering College Crest with Motto Banner
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. Live Interactive Watermark Preview & Controls ────────────────── */}
      <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <Eye className="h-4 w-4" /> Live Document & UI Preview
            </div>
            <h2 className="text-lg font-bold text-foreground mt-0.5">
              Multi-Format Watermark Fidelity Console
            </h2>
            <p className="text-xs text-muted-foreground">
              Verify how the official emblem renders across diverse document types and lighting themes.
            </p>
          </div>

          {/* Format Tabs */}
          <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border self-start sm:self-auto overflow-x-auto max-w-full">
            <button
              onClick={() => setActivePreview('ui')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activePreview === 'ui'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles size={13} /> UI Background
            </button>
            <button
              onClick={() => setActivePreview('a4')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activePreview === 'a4'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText size={13} /> A4 Document
            </button>
            <button
              onClick={() => setActivePreview('certificate')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activePreview === 'certificate'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Award size={13} /> Certificate
            </button>
            <button
              onClick={() => setActivePreview('receipt')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activePreview === 'receipt'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Receipt size={13} /> Fee Receipt
            </button>
            <button
              onClick={() => setActivePreview('timetable')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activePreview === 'timetable'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Grid size={13} /> Timetable / Grade
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Controls Column */}
          <div className="lg:col-span-4 p-6 border-b lg:border-b-0 lg:border-r border-border space-y-5 bg-muted/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Sliders size={14} /> Watermark Calibration
              </span>
              <button
                onClick={() => setPreviewTheme(previewTheme === 'light' ? 'dark' : 'light')}
                className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors flex items-center gap-1.5 text-xs font-medium"
              >
                {previewTheme === 'light' ? <Sun size={13} className="text-amber-500" /> : <Moon size={13} className="text-indigo-400" />}
                {previewTheme === 'light' ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>

            {/* Opacity Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Watermark Opacity</span>
                <span className="font-bold text-foreground">{opacity}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>1% (Ultra Subtle)</span>
                <span>4% (Standard)</span>
                <span>10% (Strong)</span>
              </div>
            </div>

            {/* Scale Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Watermark Scale</span>
                <span className="font-bold text-foreground">{scale}% of page</span>
              </div>
              <input
                type="range"
                min="25"
                max="65"
                step="1"
                value={scale}
                onChange={(e) => setScale(parseInt(e.target.value, 10))}
                className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
              />
            </div>

            {/* Feature Policies */}
            <div className="space-y-3 pt-2 border-t border-border">
              <span className="text-xs font-semibold text-foreground">Enforcement Rules</span>
              
              <label className="flex items-center justify-between text-xs cursor-pointer">
                <span className="text-foreground">Global Watermark Enabled</span>
                <input
                  type="checkbox"
                  checked={watermarkEnabled}
                  onChange={(e) => setWatermarkEnabled(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer">
                <span className="text-foreground">Official PDF Downloads</span>
                <input
                  type="checkbox"
                  checked={applyPdf}
                  onChange={(e) => setApplyPdf(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer">
                <span className="text-foreground">Print Output (@media print)</span>
                <input
                  type="checkbox"
                  checked={applyPrint}
                  onChange={(e) => setApplyPrint(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer">
                <span className="text-foreground">Certificates & Bonafides</span>
                <input
                  type="checkbox"
                  checked={applyCertificates}
                  onChange={(e) => setApplyCertificates(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer">
                <span className="text-foreground">Fee Receipts (Ultra-light 2.4%)</span>
                <input
                  type="checkbox"
                  checked={applyReceipts}
                  onChange={(e) => setApplyReceipts(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                />
              </label>
            </div>

            <button
              onClick={handleSavePolicy}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all shadow-xs"
            >
              Apply Governance Settings
            </button>
          </div>

          {/* Canvas Preview Area */}
          <div className="lg:col-span-8 p-6 flex items-center justify-center bg-slate-100 dark:bg-slate-950/60 min-h-[440px]">
            {/* UI Background Preview */}
            {activePreview === 'ui' && (
              <div
                className={`relative w-full max-w-lg rounded-2xl border border-border p-6 overflow-hidden shadow-lg transition-all ${
                  previewTheme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'
                }`}
              >
                {/* Embedded Watermark Layer */}
                {watermarkEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                    <img
                      src={officialLogo}
                      alt=""
                      style={{
                        width: `${scale}%`,
                        opacity: previewTheme === 'dark' ? (opacity * 0.65) / 100 : opacity / 100,
                        filter: previewTheme === 'dark' ? 'brightness(0) invert(1)' : 'grayscale(100%)',
                      }}
                      className="object-contain transition-all duration-200"
                    />
                  </div>
                )}

                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <div>
                      <h4 className="text-sm font-bold">{institution.institutionName}</h4>
                      <p className="text-[11px] text-muted-foreground">Student Portal • Dashboard</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Active Session
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border/70 p-3 bg-card/80 backdrop-blur-xs space-y-1">
                      <span className="text-[10px] text-muted-foreground font-medium">Overall Attendance</span>
                      <p className="text-base font-extrabold text-foreground">89.4%</p>
                    </div>
                    <div className="rounded-xl border border-border/70 p-3 bg-card/80 backdrop-blur-xs space-y-1">
                      <span className="text-[10px] text-muted-foreground font-medium">Current CGPA</span>
                      <p className="text-base font-extrabold text-foreground">8.72</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/70 p-3 bg-card/80 backdrop-blur-xs space-y-1.5">
                    <span className="text-xs font-semibold text-foreground">Next Scheduled Session</span>
                    <p className="text-xs text-muted-foreground">IT302 • Database Engineering • Lab 4 (10:15 AM)</p>
                  </div>
                </div>
              </div>
            )}

            {/* A4 Document Preview */}
            {activePreview === 'a4' && (
              <div className="relative w-full max-w-md aspect-[1/1.414] bg-white text-slate-900 rounded-lg border border-slate-300 shadow-xl p-6 overflow-hidden flex flex-col justify-between text-xs">
                {/* Background Watermark */}
                {watermarkEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                    <img
                      src={officialLogo}
                      alt=""
                      style={{
                        width: `${scale}%`,
                        opacity: opacity / 100,
                        filter: 'grayscale(100%)',
                      }}
                      className="object-contain"
                    />
                  </div>
                )}

                {/* Letterhead Header */}
                <div className="relative z-10 text-center border-b border-slate-300 pb-3 space-y-0.5">
                  <h3 className="font-extrabold text-xs tracking-wide uppercase text-slate-900">
                    {institution.institutionName}
                  </h3>
                  <p className="text-[9px] text-slate-500">Autonomous • Affiliated to Anna University, Chennai</p>
                  <p className="text-[9px] text-slate-500 font-serif italic">“Allah Enhances Efficiency”</p>
                </div>

                {/* Body Content */}
                <div className="relative z-10 space-y-3 py-4 flex-1">
                  <div className="text-center font-bold text-xs uppercase tracking-wider text-slate-800 underline">
                    Official Student Leave / OD Clearance
                  </div>
                  <div className="text-[10px] space-y-1.5 text-slate-700 leading-relaxed">
                    <p><strong>Applicant:</strong> Suresh Kumar S (730422104052)</p>
                    <p><strong>Department:</strong> Department of Information Technology</p>
                    <p><strong>Purpose:</strong> National Level Hackathon Presentation at IIT Madras</p>
                    <p><strong>Duration:</strong> 18-Aug-2026 to 20-Aug-2026 (3 Days)</p>
                    <p><strong>Approval Status:</strong> Verified & Recommended by Class Adviser & HOD.</p>
                  </div>
                </div>

                {/* Signatures & Footer */}
                <div className="relative z-10 pt-4 border-t border-slate-200 flex justify-between items-end text-[9px] text-slate-600">
                  <div className="text-center">
                    <div className="w-16 border-b border-slate-400 mb-1"></div>
                    <span>Class Adviser</span>
                  </div>
                  <div className="text-center">
                    <div className="w-16 border-b border-slate-400 mb-1"></div>
                    <span>Head of Department</span>
                  </div>
                  <div className="text-center">
                    <div className="w-16 border-b border-slate-400 mb-1"></div>
                    <span>Principal</span>
                  </div>
                </div>
              </div>
            )}

            {/* Certificate Preview */}
            {activePreview === 'certificate' && (
              <div className="relative w-full max-w-md aspect-[1.414/1] bg-amber-50/40 text-slate-900 rounded-lg border-4 border-amber-600/60 shadow-xl p-5 overflow-hidden flex flex-col justify-between text-xs">
                {/* Background Watermark */}
                {watermarkEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                    <img
                      src={officialLogo}
                      alt=""
                      style={{
                        width: '45%',
                        opacity: 0.05,
                        filter: 'grayscale(100%)',
                      }}
                      className="object-contain"
                    />
                  </div>
                )}

                <div className="relative z-10 text-center space-y-1 border-b border-amber-300 pb-2">
                  <h3 className="font-extrabold text-[11px] uppercase tracking-wider text-amber-950">
                    {institution.institutionName}
                  </h3>
                  <p className="text-[8px] uppercase tracking-widest text-amber-800 font-bold">
                    Bonafide & Conduct Certificate
                  </p>
                </div>

                <div className="relative z-10 text-center px-4 py-2 text-[9.5px] leading-relaxed text-slate-800">
                  This is to certify that <strong>Suresh Kumar S</strong> is a bonafide student of this institution pursuing <strong>B.Tech Information Technology</strong> during the academic year 2026–2027. His conduct and character during this period have been found to be Exemplary.
                </div>

                <div className="relative z-10 flex justify-between items-end text-[8.5px] text-slate-600 px-2">
                  <span>Issue Date: 17-Aug-2026</span>
                  <span className="font-bold text-slate-800">Principal Signature & Seal</span>
                </div>
              </div>
            )}

            {/* Receipt Preview */}
            {activePreview === 'receipt' && (
              <div className="relative w-full max-w-md aspect-[1/1.2] bg-white text-slate-900 rounded-lg border border-slate-300 shadow-xl p-5 overflow-hidden flex flex-col justify-between text-xs">
                {watermarkEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                    <img
                      src={officialLogo}
                      alt=""
                      style={{
                        width: '38%',
                        opacity: 0.024,
                        filter: 'grayscale(100%)',
                      }}
                      className="object-contain"
                    />
                  </div>
                )}

                <div className="relative z-10 text-center border-b border-slate-300 pb-2">
                  <h3 className="font-bold text-xs uppercase">{institution.institutionName}</h3>
                  <p className="text-[9px] text-slate-500">Official Fee Receipt • #REC-2026-0891</p>
                </div>

                <div className="relative z-10 space-y-2 text-[10px] py-3">
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-500">Tuition & Development Fee</span>
                    <span className="font-bold text-slate-900">₹ 45,000.00</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-500">Laboratory & Computer Centre</span>
                    <span className="font-bold text-slate-900">₹ 12,500.00</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-500">Autonomous Examination Fee</span>
                    <span className="font-bold text-slate-900">₹ 3,200.00</span>
                  </div>
                  <div className="flex justify-between pt-1 font-extrabold text-xs text-slate-900">
                    <span>Total Paid</span>
                    <span className="text-emerald-700">₹ 60,700.00</span>
                  </div>
                </div>

                <div className="relative z-10 text-center text-[8.5px] text-slate-400 pt-2 border-t border-slate-200">
                  Digitally signed and generated by CampusOS Finance Engine
                </div>
              </div>
            )}

            {/* Timetable Preview */}
            {activePreview === 'timetable' && (
              <div className="relative w-full max-w-md bg-white text-slate-900 rounded-lg border border-slate-300 shadow-xl p-4 overflow-hidden flex flex-col justify-between text-xs">
                {watermarkEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                    <img
                      src={officialLogo}
                      alt=""
                      style={{
                        width: '40%',
                        opacity: 0.03,
                        filter: 'grayscale(100%)',
                      }}
                      className="object-contain"
                    />
                  </div>
                )}

                <div className="relative z-10 text-center border-b border-slate-200 pb-2 mb-3">
                  <h3 className="font-bold text-xs uppercase">{institution.institutionName}</h3>
                  <p className="text-[9px] text-slate-500">Department of IT • Semester V Master Timetable</p>
                </div>

                <div className="relative z-10 grid grid-cols-4 gap-1.5 text-[9px] text-center font-medium">
                  <div className="p-1.5 bg-slate-100 rounded font-bold">Mon</div>
                  <div className="p-1.5 bg-slate-50 rounded">IT301 (DBMS)</div>
                  <div className="p-1.5 bg-slate-50 rounded">CS304 (OS)</div>
                  <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded font-bold">Lab 3</div>

                  <div className="p-1.5 bg-slate-100 rounded font-bold">Tue</div>
                  <div className="p-1.5 bg-slate-50 rounded">MA301 (P&S)</div>
                  <div className="p-1.5 bg-slate-50 rounded">IT302 (Web)</div>
                  <div className="p-1.5 bg-slate-50 rounded">Library</div>

                  <div className="p-1.5 bg-slate-100 rounded font-bold">Wed</div>
                  <div className="p-1.5 bg-slate-50 rounded">CS304 (OS)</div>
                  <div className="p-1.5 bg-slate-50 rounded">IT301 (DBMS)</div>
                  <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded font-bold">Project</div>
                </div>

                <div className="relative z-10 text-right text-[8.5px] text-slate-400 pt-3">
                  Autonomous Curriculum 2026
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
