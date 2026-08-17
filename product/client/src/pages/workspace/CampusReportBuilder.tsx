import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, BarChart3, PieChart, TrendingUp, Download, Share2,
  Plus, Trash2, RefreshCw, Loader2, CheckCircle2, AlertCircle,
  Building2, Database, FileText, Printer, Check, Eye
} from 'lucide-react';
import { workspaceApi, WorkspaceDocumentDetail, downloadBlob } from '../../services/workspace.api';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../components/ui/Toast';

// ─── Report Types ────────────────────────────────────────────────────────────

type SectionType = 'EXECUTIVE_SUMMARY' | 'METRICS_TABLE' | 'CHART' | 'FACULTY_ANALYSIS' | 'STUDENT_PERFORMANCE' | 'CUSTOM_TEXT';

interface ReportSection {
  id: string;
  type: SectionType;
  title: string;
  dataset?: string;
  content?: string;
  chartType?: 'bar' | 'line' | 'pie';
  columns?: string[];
  metrics?: Array<{ label: string; value: string | number; change?: string }>;
}

interface ReportMetadata {
  accreditationType?: 'NAAC' | 'NBA' | 'IQAC' | 'NIRF' | 'INTERNAL';
  academicYear?: string;
  semester?: string;
  departmentName?: string;
}

interface ReportContent {
  metadata: ReportMetadata;
  sections: ReportSection[];
}

// ─── Campus Report Builder Component ─────────────────────────────────────────

const CampusReportBuilder: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [doc, setDoc] = useState<WorkspaceDocumentDetail | null>(null);
  const [title, setTitle] = useState('');
  const [report, setReport] = useState<ReportContent>({
    metadata: { accreditationType: 'IQAC', academicYear: '2025-2026', semester: 'Odd' },
    sections: [
      {
        id: 'sec_1',
        type: 'EXECUTIVE_SUMMARY',
        title: '1. Executive Summary & Department Overview',
        content: 'This institutional performance report compiles student outcomes, faculty scholarly output, and accreditation metrics for the current evaluation cycle.',
      },
      {
        id: 'sec_2',
        type: 'METRICS_TABLE',
        title: '2. Key Performance Indicators (KPIs)',
        metrics: [
          { label: 'Overall Attendance Rate', value: '88.4%', change: '+2.1%' },
          { label: 'Average Pass Percentage', value: '91.2%', change: '+3.5%' },
          { label: 'Publications & Patents', value: '24', change: '+6' },
          { label: 'Placement Conversion', value: '84.6%', change: '+4.2%' },
        ],
      },
    ],
  });

  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasUnsaved = useRef(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await workspaceApi.getDocument(id);
        setDoc(data);
        setTitle(data.title);
        const parsed = typeof data.contentJson === 'string' ? JSON.parse(data.contentJson) : data.contentJson;
        if (parsed?.sections !== undefined) setReport(parsed);
        setSaveState('saved');
      } catch {
        toast.error('Failed to load report.');
        navigate('/workspace');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const scheduleAutosave = useCallback((newReport: ReportContent, newTitle: string) => {
    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    autosaveRef.current = setTimeout(async () => {
      if (!id) return;
      setSaveState('saving');
      try {
        await workspaceApi.updateDocument(id, { title: newTitle, contentJson: newReport });
        setSaveState('saved');
        hasUnsaved.current = false;
      } catch { setSaveState('error'); }
    }, 2000);
  }, [id]);

  const updateReport = (updater: (r: ReportContent) => ReportContent) => {
    setReport((prev) => {
      const next = updater(prev);
      hasUnsaved.current = true;
      setSaveState('unsaved');
      scheduleAutosave(next, title);
      return next;
    });
  };

  const addSection = (type: SectionType = 'CUSTOM_TEXT') => {
    const sec: ReportSection = {
      id: `sec_${Date.now()}`,
      type,
      title: 'New Section',
      content: type === 'CUSTOM_TEXT' ? 'Enter detailed analysis…' : undefined,
      metrics: type === 'METRICS_TABLE' ? [
        { label: 'Metric A', value: '100' },
        { label: 'Metric B', value: '85%' },
      ] : undefined,
    };
    updateReport((r) => ({ ...r, sections: [...r.sections, sec] }));
  };

  const deleteSection = (secId: string) => {
    updateReport((r) => ({ ...r, sections: r.sections.filter((s) => s.id !== secId) }));
  };

  const updateSection = (secId: string, updates: Partial<ReportSection>) => {
    updateReport((r) => ({
      ...r,
      sections: r.sections.map((s) => s.id === secId ? { ...s, ...updates } : s),
    }));
  };

  const handleExportPDF = async () => {
    if (!id) return;
    setExporting(true);
    try {
      await workspaceApi.updateDocument(id, { title, contentJson: report });
      const blob = await workspaceApi.exportDocument(id, 'pdf');
      downloadBlob(blob, `${title || 'report'}.pdf`);
      toast.success('Official Watermarked PDF exported.');
    } catch {
      toast.error('Failed to export PDF.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-50"><Loader2 size={32} className="animate-spin text-teal-600" /></div>;
  }

  const canEdit = doc?.permissions.canEdit ?? false;

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
      {/* ─── Top Bar ──────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 flex items-center justify-between px-6 py-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft size={16} className="text-gray-600" />
          </button>
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); hasUnsaved.current = true; setSaveState('unsaved'); scheduleAutosave(report, e.target.value); }}
              disabled={!canEdit}
              className="text-base font-bold text-gray-900 bg-transparent outline-none border-b border-transparent focus:border-teal-500 max-w-sm"
              placeholder="Institutional Report Title"
            />
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
              <span className="font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                {report.metadata.accreditationType || 'IQAC'} Standard
              </span>
              <span>•</span>
              <span>AY {report.metadata.academicYear} ({report.metadata.semester})</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-gray-500 mr-2">
            {saveState === 'saving' && <Loader2 size={12} className="animate-spin" />}
            {saveState === 'saved' && <CheckCircle2 size={12} className="text-green-500" />}
            {saveState === 'unsaved' && <AlertCircle size={12} className="text-amber-500" />}
          </div>

          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50"
          >
            {exporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            Export Official Watermarked PDF
          </button>
        </div>
      </div>

      {/* ─── Main Editor View ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Accreditation Header Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-teal-600" />
                <h2 className="text-sm font-bold text-gray-900">Accreditation & Compliance Context</h2>
              </div>
              <select
                value={report.metadata.accreditationType}
                onChange={(e) => updateReport((r) => ({ ...r, metadata: { ...r.metadata, accreditationType: e.target.value as any } }))}
                className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 rounded-lg px-2.5 py-1 outline-none"
              >
                <option value="NAAC">NAAC Self Study Report (SSR)</option>
                <option value="NBA">NBA Program Outcome Audit</option>
                <option value="IQAC">IQAC Internal Quality Review</option>
                <option value="NIRF">NIRF Institutional Ranking Metric</option>
                <option value="INTERNAL">Internal Board of Studies Review</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-gray-500 block mb-1">Academic Year</label>
                <input
                  type="text"
                  value={report.metadata.academicYear || ''}
                  onChange={(e) => updateReport((r) => ({ ...r, metadata: { ...r.metadata, academicYear: e.target.value } }))}
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 outline-none font-medium"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 block mb-1">Semester Cycle</label>
                <select
                  value={report.metadata.semester || 'Odd'}
                  onChange={(e) => updateReport((r) => ({ ...r, metadata: { ...r.metadata, semester: e.target.value } }))}
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 outline-none font-medium bg-white"
                >
                  <option value="Odd">Odd Semester</option>
                  <option value="Even">Even Semester</option>
                  <option value="Full Year">Full Academic Year</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 block mb-1">Department</label>
                <input
                  type="text"
                  value={report.metadata.departmentName || (typeof user?.department === 'string' ? user.department : (user?.department as any)?.name) || 'All Engineering Departments'}
                  onChange={(e) => updateReport((r) => ({ ...r, metadata: { ...r.metadata, departmentName: e.target.value } }))}
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 outline-none font-medium"
                />
              </div>
            </div>
          </div>

          {/* Dynamic Report Sections */}
          {report.sections.map((sec, index) => (
            <div key={sec.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4 hover:border-teal-300 transition-colors">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <input
                  type="text"
                  value={sec.title}
                  onChange={(e) => updateSection(sec.id, { title: e.target.value })}
                  className="text-sm font-bold text-gray-900 outline-none flex-1"
                />
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {sec.type.replace('_', ' ')}
                  </span>
                  <button onClick={() => deleteSection(sec.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Metrics Grid */}
              {sec.type === 'METRICS_TABLE' && sec.metrics && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {sec.metrics.map((m, mIdx) => (
                    <div key={mIdx} className="bg-teal-50/50 border border-teal-100 rounded-xl p-3.5 space-y-1">
                      <p className="text-[11px] font-semibold text-gray-600 truncate">{m.label}</p>
                      <p className="text-xl font-black text-teal-800">{m.value}</p>
                      {m.change && (
                        <p className="text-[10px] font-bold text-green-600 flex items-center gap-0.5">
                          <TrendingUp size={10} /> {m.change} vs prev cycle
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Text Area */}
              {(sec.type === 'EXECUTIVE_SUMMARY' || sec.type === 'CUSTOM_TEXT') && (
                <textarea
                  value={sec.content || ''}
                  onChange={(e) => updateSection(sec.id, { content: e.target.value })}
                  rows={4}
                  className="w-full text-xs text-gray-700 leading-relaxed outline-none border border-gray-200 rounded-xl p-3 bg-gray-50/50 resize-none focus:bg-white focus:border-teal-400"
                  placeholder="Enter content for this section…"
                />
              )}
            </div>
          ))}

          {/* Add Section */}
          {canEdit && (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-5 text-center space-y-3">
              <p className="text-xs font-semibold text-gray-500">Insert Report Section</p>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => addSection('CUSTOM_TEXT')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-xl transition-colors"
                >
                  <Plus size={12} /> Narrative Section
                </button>
                <button
                  onClick={() => addSection('METRICS_TABLE')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-xl transition-colors"
                >
                  <Plus size={12} /> KPI Metric Cards
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampusReportBuilder;
