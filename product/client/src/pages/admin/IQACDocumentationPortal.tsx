import React, { useState } from 'react';
import {
  FileCheck, Upload, QrCode, AlertTriangle, Archive,
  History, Download, Search, Sparkles, CheckCircle2, Shield
} from 'lucide-react';
import { toast } from '../../components/ui/Toast';

interface IQACDocumentationPortalProps {
  user: any;
}

export const IQACDocumentationPortal: React.FC<IQACDocumentationPortalProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'evidence' | 'uploads' | 'expiry' | 'qr'>('evidence');
  const [search, setSearch] = useState('');

  const [evidenceFiles, setEvidenceFiles] = useState([
    { id: 'DOC-101', name: 'NAAC_Criterion_1_Curricular_Aspects_v2.pdf', category: 'NAAC Criterion 1', dept: 'Science & Humanities', version: 'v2.1', date: '2026-07-20', status: 'VERIFIED', qrCode: 'QR-NAAC-101' },
    { id: 'DOC-102', name: 'NBA_SAR_CSE_Tier1_SelfAssessment.pdf', category: 'NBA SAR', dept: 'Computer Science Engineering', version: 'v1.0', date: '2026-07-22', status: 'VERIFIED', qrCode: 'QR-NBA-102' },
    { id: 'DOC-103', name: 'ISO_9001_Quality_Manual_2026.pdf', category: 'ISO Audit', dept: 'IQAC Cell', version: 'v3.0', date: '2026-07-25', status: 'PENDING_VERIFICATION', qrCode: 'QR-ISO-103' },
  ]);

  const [expiringDocs, setExpiringDocs] = useState([
    { name: 'Fire_Safety_Compliance_Certificate.pdf', category: 'Safety & Campus Audit', expiryDate: '2026-08-15', daysLeft: 18, status: 'RENEWAL_REQUIRED' },
    { name: 'AICTE_Extension_of_Approval_2025_26.pdf', category: 'Regulatory Compliance', expiryDate: '2026-08-30', daysLeft: 33, status: 'UPCOMING_EXPIRY' },
  ]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="border bg-card p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-purple-900/10 via-indigo-900/5 to-background border-purple-500/20">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck className="h-6 w-6 text-purple-600" />
            <h1 className="text-xl font-black tracking-tight">IQAC Documentation & Evidence Portal</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Evidence Repository · Document Version Control · Expiry Alerts · QR Verification Engine
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-muted rounded-xl border text-xs font-bold">
          {(['evidence', 'uploads', 'expiry', 'qr'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg capitalize transition-all ${
                activeTab === tab ? 'bg-background shadow text-purple-600 font-black' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border bg-card p-4 rounded-xl shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Evidence Repository</span>
          <span className="text-xl font-black block text-purple-600">1,240 Files</span>
          <span className="text-[9px] text-muted-foreground">NAAC / NBA / NIRF Dossiers</span>
        </div>
        <div className="border bg-card p-4 rounded-xl shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Pending Verification</span>
          <span className="text-xl font-black block text-amber-600">8 Files</span>
          <span className="text-[9px] text-muted-foreground">Awaiting Review</span>
        </div>
        <div className="border bg-card p-4 rounded-xl shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Expiring Documents</span>
          <span className="text-xl font-black block text-rose-600">2 Compliance Files</span>
          <span className="text-[9px] text-muted-foreground">Next 30 Days Expiry</span>
        </div>
        <div className="border bg-card p-4 rounded-xl shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">QR Verification</span>
          <span className="text-xl font-black block text-emerald-600">100% Secured</span>
          <span className="text-[9px] text-muted-foreground">Cryptographic Verification</span>
        </div>
      </div>

      {/* Main Tab Views */}
      {activeTab === 'evidence' && (
        <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4 text-xs font-semibold">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b pb-3">
            <h3 className="text-sm font-extrabold uppercase">Evidence & Accreditation Documents</h3>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search evidence files..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full h-8 border rounded-lg pl-8 pr-3 text-xs bg-background"
                />
              </div>
              <button onClick={() => toast.success('Upload Modal Triggered')} className="h-8 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0">
                <Upload className="h-3.5 w-3.5" /> Upload File
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {evidenceFiles.filter(f => f.name.toLowerCase().includes(search.toLowerCase())).map(f => (
              <div key={f.id} className="p-3.5 border rounded-xl bg-background flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-50 text-purple-600 border border-purple-100">
                    <FileCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-foreground text-xs">{f.name}</h4>
                      <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-mono font-bold">{f.version}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Category: {f.category} · Department: {f.dept} · Uploaded: {f.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => toast.success(`Generated QR Code: ${f.qrCode}`)} className="p-1.5 border hover:bg-muted rounded-lg text-purple-600 font-bold text-[10px] flex items-center gap-1">
                    <QrCode className="h-3.5 w-3.5" /> QR Verify
                  </button>
                  <button onClick={() => toast.success(`Downloading ${f.name}`)} className="p-1.5 border hover:bg-muted rounded-lg text-primary font-bold">
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'expiry' && (
        <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4 text-xs font-semibold">
          <h3 className="text-sm font-extrabold uppercase border-b pb-2 flex items-center gap-2 text-rose-600">
            <AlertTriangle className="h-4 w-4" /> Document Expiry & Renewal Alerts
          </h3>
          <div className="space-y-3">
            {expiringDocs.map((doc, idx) => (
              <div key={idx} className="p-3.5 border border-rose-200 rounded-xl bg-rose-50/20 flex justify-between items-center">
                <div>
                  <h4 className="font-extrabold text-foreground text-xs">{doc.name}</h4>
                  <p className="text-[10px] text-muted-foreground">Category: {doc.category} · Expiry Date: {doc.expiryDate}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded">
                    {doc.daysLeft} days left
                  </span>
                  <button onClick={() => toast.success('Upload Renewal Triggered')} className="px-3 py-1.5 bg-rose-600 text-white rounded-lg font-bold text-[10px]">
                    Upload Renewal
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
