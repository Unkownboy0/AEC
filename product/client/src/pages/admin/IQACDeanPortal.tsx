import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Award, FileCheck, CheckSquare, Sparkles,
  Download, FileSpreadsheet, Activity, Building, AlertCircle
} from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import api from '../../lib/axios';

import { useAuth } from '../../context/AuthContext';

interface IQACDeanPortalProps {
  user?: any;
}

export const IQACDeanPortal: React.FC<IQACDeanPortalProps> = ({ user: propUser }) => {
  const { user: authUser } = useAuth();
  const user = propUser || authUser;
  const [activeTab, setActiveTab] = useState<'overview' | 'accreditation' | 'audits' | 'evidence'>('overview');
  const [accreditationScores, setAccreditationScores] = useState({
    naacCGPA: '3.62 / 4.0 (A++)',
    nbaAccreditedDepts: '5 out of 7',
    nirfRank: 'Top 75 Category',
    isoCompliance: '98.5%'
  });

  const [audits, setAudits] = useState([
    { id: '1', dept: 'Computer Science & Engg', type: 'Academic & Administrative Audit', date: '2026-07-15', status: 'COMPLETED', auditor: 'Dr. R. Sharma' },
    { id: '2', dept: 'Electronics & Comm', type: 'NAAC Criteria III Review', date: '2026-07-22', status: 'IN_PROGRESS', auditor: 'Prof. K. Venkatesh' },
    { id: '3', dept: 'Mechanical Engineering', type: 'NBA Outcome Analysis', date: '2026-08-05', status: 'SCHEDULED', auditor: 'Internal IQAC Team' },
  ]);

  const [evidenceFiles, setEvidenceFiles] = useState([
    { name: 'NAAC_Criterion_1_Curricular_Aspects.pdf', category: 'Criterion 1', uploadedBy: 'Academic Dean', date: '2026-07-10', status: 'VERIFIED' },
    { name: 'NBA_Tier_1_Self_Assessment_CSE.pdf', category: 'NBA SAR', uploadedBy: 'HOD CSE', date: '2026-07-18', status: 'VERIFIED' },
    { name: 'ISO_9001_Internal_Audit_Report.pdf', category: 'ISO Audit', uploadedBy: 'IQAC Cell', date: '2026-07-25', status: 'PENDING_REVIEW' },
  ]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="border bg-card p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-emerald-900/10 via-teal-900/5 to-background border-emerald-500/20">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-600" />
            <h1 className="text-xl font-black tracking-tight">IQAC Dean Quality Assurance Command Portal</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Internal Quality Assurance Cell · NAAC · NBA · NIRF · ISO Compliance Engine
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-muted rounded-xl border text-xs font-bold">
          {(['overview', 'accreditation', 'audits', 'evidence'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg capitalize transition-all ${
                activeTab === tab ? 'bg-background shadow text-emerald-600 font-black' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Overview KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border bg-card p-4 rounded-xl shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">NAAC Grade</span>
          <span className="text-xl font-black block text-emerald-600">{accreditationScores.naacCGPA}</span>
          <span className="text-[9px] text-muted-foreground">Cycle 3 Assessment Score</span>
        </div>
        <div className="border bg-card p-4 rounded-xl shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">NBA Tier 1 Accredited</span>
          <span className="text-xl font-black block text-indigo-600">{accreditationScores.nbaAccreditedDepts}</span>
          <span className="text-[9px] text-muted-foreground">Eligible Engineering Programs</span>
        </div>
        <div className="border bg-card p-4 rounded-xl shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">NIRF India Ranking</span>
          <span className="text-xl font-black block text-amber-600">{accreditationScores.nirfRank}</span>
          <span className="text-[9px] text-muted-foreground">Engineering Institutions Band</span>
        </div>
        <div className="border bg-card p-4 rounded-xl shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">ISO Compliance Index</span>
          <span className="text-xl font-black block text-teal-600">{accreditationScores.isoCompliance}</span>
          <span className="text-[9px] text-muted-foreground">Audit Compliance Verification</span>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs font-semibold">
          {/* Department Quality Audits Overview */}
          <div className="lg:col-span-2 border bg-card p-5 rounded-xl shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold uppercase border-b pb-2 flex justify-between items-center">
              <span>Department Quality Audit Register</span>
              <button onClick={() => toast.success('Generated IQAC Audit Dossier')} className="text-xs text-primary font-bold hover:underline">
                Export Audit Report
              </button>
            </h3>
            <div className="space-y-3">
              {audits.map(a => (
                <div key={a.id} className="p-3 border rounded-xl bg-background flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                  <div>
                    <h4 className="font-extrabold text-foreground">{a.dept}</h4>
                    <p className="text-[10px] text-muted-foreground">{a.type} · Auditor: {a.auditor}</p>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                    a.status === 'COMPLETED' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                    a.status === 'IN_PROGRESS' ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-muted text-muted-foreground'
                  }`}>
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Quality Recommendations */}
          <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold uppercase border-b pb-2 flex items-center gap-1.5 text-purple-700">
              <Sparkles className="h-4 w-4" /> IQAC AI Audit Insights
            </h3>
            <div className="space-y-3 text-[11px]">
              <div className="p-3 border border-purple-100 rounded-xl bg-purple-50/30 space-y-1">
                <p className="font-bold text-purple-900">Research Publication Index (Criterion 3)</p>
                <p className="text-muted-foreground">Scopus indexed publications in ECE department increased by 14%. Recommend updating NIRF submission evidence files.</p>
              </div>
              <div className="p-3 border border-indigo-100 rounded-xl bg-indigo-50/30 space-y-1">
                <p className="font-bold text-indigo-900">Outcome Based Education (OBE) Audit</p>
                <p className="text-muted-foreground">Course Outcome (CO) to Program Outcome (PO) mapping for CSE Semester 4 achieves 94% alignment.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'evidence' && (
        <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4 text-xs">
          <h3 className="text-sm font-extrabold uppercase border-b pb-2">Accreditation Evidence Repository</h3>
          <div className="space-y-2">
            {evidenceFiles.map((file, idx) => (
              <div key={idx} className="p-3 border rounded-xl bg-background flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileCheck className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="font-bold">{file.name}</p>
                    <p className="text-[10px] text-muted-foreground">Category: {file.category} · Uploaded by: {file.uploadedBy}</p>
                  </div>
                </div>
                <button onClick={() => toast.success(`Downloading ${file.name}`)} className="p-2 hover:bg-muted rounded-lg text-primary">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
