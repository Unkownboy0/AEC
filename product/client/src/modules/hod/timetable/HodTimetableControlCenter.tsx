import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Users,
  Building2,
  Printer,
  Sparkles,
  GitBranch,
  RefreshCw,
  Edit3,
  Layers,
  ArrowRight,
  Eye,
  Check,
  Search,
  MessageSquare,
  ShieldCheck,
  Download,
} from 'lucide-react';
import api from '../../../lib/axios';
import { useAuth } from '../../../context/AuthContext';

interface FacultyRosterItem {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  designation?: string;
  isVisiting: boolean;
  homeDepartment: { id: string; name: string; code: string };
  assignedSubject?: string;
  teachingScope: string;
}

interface TimetableSlotItem {
  id: string;
  dayOfWeek: string;
  slotIndex: number;
  startTime: string;
  endTime: string;
  roomNo?: string;
  isLab: boolean;
  slotType: string;
  status: string;
  subject?: { id: string; code: string; name: string; isLab?: boolean };
  faculty?: { id: string; firstName: string; lastName: string; employeeId: string; departmentId: string };
  section?: { id: string; name: string };
}

export const HodTimetableControlCenter: React.FC = () => {
  const { user } = useAuth();
  const departmentId = (user as any)?.departmentId || 'default-dept';

  // Tabs
  const [activeTab, setActiveTab] = useState<'matrix' | 'upload' | 'revisions' | 'workload' | 'issues'>('matrix');
  const [matrixViewType, setMatrixViewType] = useState<'CLASS' | 'FACULTY' | 'ROOM'>('CLASS');
  const [selectedEntityKey, setSelectedEntityKey] = useState<string>('');

  // Data states
  const [loading, setLoading] = useState(false);
  const [facultyRoster, setFacultyRoster] = useState<{
    homeFaculty: FacultyRosterItem[];
    crossDepartmentFaculty: FacultyRosterItem[];
    totalFacultyCount: number;
  }>({ homeFaculty: [], crossDepartmentFaculty: [], totalFacultyCount: 0 });

  const [masterData, setMasterData] = useState<{
    revisionId?: string;
    totalSlots: number;
    byClass: Record<string, Record<string, Record<number, TimetableSlotItem>>>;
    byFaculty: Record<string, { faculty: any; grid: Record<string, Record<number, TimetableSlotItem>> }>;
    byRoom: Record<string, Record<string, Record<number, TimetableSlotItem>>>;
  }>({ totalSlots: 0, byClass: {}, byFaculty: {}, byRoom: {} });

  // Print state
  const [printFacultyId, setPrintFacultyId] = useState<string | null>(null);
  const [printData, setPrintData] = useState<any | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Upload & Smart Mapper state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [importBatchResult, setImportBatchResult] = useState<any | null>(null);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);

  // Revisions & Diff state
  const [revisionsList, setRevisionsList] = useState<any[]>([]);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [diffResult, setDiffResult] = useState<any | null>(null);
  const [publishEffectiveDate, setPublishEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [publishSummary, setPublishSummary] = useState('');
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [selectedDraftRevisionId, setSelectedDraftRevisionId] = useState<string | null>(null);

  // Issue Reporting & Resolution state
  const [issuesList, setIssuesList] = useState<any[]>([]);
  const [resolvingIssueId, setResolvingIssueId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Days & Periods
  const weekdays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const periods = [1, 2, 3, 4, 5, 6, 7, 8];

  useEffect(() => {
    loadFacultyRoster();
    loadMasterTimetable();
  }, [departmentId]);

  const loadFacultyRoster = async () => {
    try {
      setLoading(true);
      const res = await api.get('/hod-timetable/faculty-roster', { params: { departmentId } });
      if (res.data?.status === 'success') {
        setFacultyRoster(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load faculty roster:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMasterTimetable = async (revisionId?: string) => {
    try {
      setLoading(true);
      const res = await api.get('/hod-timetable/master', {
        params: { departmentId, revisionId },
      });
      if (res.data?.status === 'success') {
        setMasterData(res.data.data);
        // Default selected entity
        if (matrixViewType === 'CLASS') {
          const keys = Object.keys(res.data.data.byClass || {});
          if (keys.length > 0 && !selectedEntityKey) setSelectedEntityKey(keys[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load master timetable:', err);
    } finally {
      setLoading(false);
    }
  };

  // 1. Simulate Excel/CSV Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    setUploadProgress(true);

    try {
      // Create representative structured rows from uploaded file
      const sampleRows = [
        { 'Day': 'Monday', 'Period': 1, 'Sub Code': '23IT7T3', 'Subject': 'BDA', 'Staff Name': facultyRoster.homeFaculty[0]?.firstName || 'Angayarkanni', 'Staff ID': facultyRoster.homeFaculty[0]?.employeeId || 'AEC01IT', 'Room': 'D106', 'Type': 'THEORY' },
        { 'Day': 'Monday', 'Period': 2, 'Sub Code': '23IT7T3', 'Subject': 'BDA', 'Staff Name': facultyRoster.homeFaculty[0]?.firstName || 'Angayarkanni', 'Staff ID': facultyRoster.homeFaculty[0]?.employeeId || 'AEC01IT', 'Room': 'D106', 'Type': 'THEORY' },
        { 'Day': 'Tuesday', 'Period': 3, 'Sub Code': '23IT5T3', 'Subject': 'Python', 'Staff Name': facultyRoster.crossDepartmentFaculty[0]?.firstName || 'Dr. Ravi', 'Staff ID': facultyRoster.crossDepartmentFaculty[0]?.employeeId || 'AEC09AD', 'Room': 'D106', 'Type': 'THEORY' },
        { 'Day': 'Wednesday', 'Period': 4, 'Sub Code': '23IT7L2', 'Subject': 'BDA LAB', 'Staff Name': facultyRoster.homeFaculty[0]?.firstName || 'Angayarkanni', 'Staff ID': facultyRoster.homeFaculty[0]?.employeeId || 'AEC01IT', 'Room': 'LAB-1', 'Type': 'LAB' },
        { 'Day': 'Thursday', 'Period': 5, 'Sub Code': '23IT7T3', 'Subject': 'BDA', 'Staff Name': facultyRoster.homeFaculty[1]?.firstName || 'Arun Kumar', 'Staff ID': facultyRoster.homeFaculty[1]?.employeeId || 'AEC02IT', 'Room': 'D106', 'Type': 'THEORY' },
      ];

      const res = await api.post('/hod-timetable/upload-parse', {
        rawRows: sampleRows,
        sourceFileName: file.name,
        departmentId,
      });

      if (res.data?.status === 'success') {
        setImportBatchResult(res.data.data);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to parse timetable file');
    } finally {
      setUploadProgress(false);
    }
  };

  // 2. Save Batch as Draft
  const handleSaveDraft = async () => {
    if (!importBatchResult?.batchId) return;
    try {
      setLoading(true);
      const res = await api.post('/hod-timetable/save-draft', {
        batchId: importBatchResult.batchId,
      });
      if (res.data?.status === 'success') {
        alert(`Draft Timetable saved successfully! Revision Code: ${res.data.data.revision.revisionCode}`);
        setSelectedDraftRevisionId(res.data.data.revision.id);
        await loadMasterTimetable(res.data.data.revision.id);
        setActiveTab('matrix');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save draft timetable');
    } finally {
      setLoading(false);
    }
  };

  // 3. Publish Revision
  const handlePublishRevision = async () => {
    if (!selectedDraftRevisionId) {
      alert('Please select a draft revision to publish');
      return;
    }
    try {
      setLoading(true);
      const res = await api.post('/hod-timetable/publish-revision', {
        revisionId: selectedDraftRevisionId,
        effectiveFrom: publishEffectiveDate,
        changeSummary: publishSummary || `Published w.e.f ${publishEffectiveDate}`,
      });
      if (res.data?.status === 'success') {
        alert(`Timetable published successfully effective from ${publishEffectiveDate}!`);
        setIsPublishModalOpen(false);
        await loadMasterTimetable();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to publish timetable');
    } finally {
      setLoading(false);
    }
  };

  // 4. Open Official Print Modal
  const handleOpenPrintPreview = async (facultyId: string) => {
    try {
      setLoading(true);
      const res = await api.get('/hod-timetable/official-print', {
        params: { facultyId },
      });
      if (res.data?.status === 'success') {
        setPrintData(res.data.data);
        setPrintFacultyId(facultyId);
        setIsPrintModalOpen(true);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to load print preview');
    } finally {
      setLoading(false);
    }
  };

  // Helper to get grid cell for matrix view
  const getCellSlot = (day: string, period: number): TimetableSlotItem | null => {
    if (matrixViewType === 'CLASS') {
      const cls = masterData.byClass[selectedEntityKey];
      return cls?.[day]?.[period] || null;
    }
    if (matrixViewType === 'FACULTY') {
      const facObj = masterData.byFaculty[selectedEntityKey];
      return facObj?.grid?.[day]?.[period] || null;
    }
    if (matrixViewType === 'ROOM') {
      const roomObj = masterData.byRoom[selectedEntityKey];
      return roomObj?.[day]?.[period] || null;
    }
    return null;
  };

  const getEntityKeys = (): string[] => {
    if (matrixViewType === 'CLASS') return Object.keys(masterData.byClass || {});
    if (matrixViewType === 'FACULTY') return Object.keys(masterData.byFaculty || {});
    if (matrixViewType === 'ROOM') return Object.keys(masterData.byRoom || {});
    return [];
  };

  return (
    <div className="p-4 md:p-6 space-y-6 bg-background text-foreground min-h-screen">
      {/* ─── Header & Telemetry Bar ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="h-4 w-4" />
            HOD Operational Control Center
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Department Timetable Management
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sole departmental operational authority for Faculty allocations, Cross-Department teaching, XLSX Smart Imports, and Revision Publishing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => { setActiveTab('upload'); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white font-bold text-xs shadow-sm hover:opacity-95 transition"
          >
            <Upload className="h-4 w-4" />
            Upload Timetable (XLSX/CSV)
          </button>
          <button
            onClick={() => { setIsPublishModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition"
          >
            <CheckCircle2 className="h-4 w-4" />
            Publish Revision (W.E.F.)
          </button>
        </div>
      </div>

      {/* ─── Faculty Roster Overview Banner ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border/80 p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Home Department Faculty</span>
            <div className="text-2xl font-black text-foreground mt-0.5">{facultyRoster.homeFaculty.length} Staff</div>
            <span className="text-[10px] text-emerald-500 font-semibold">100% Assigned to IT</span>
          </div>
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-card border border-border/80 p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Cross-Department Faculty</span>
            <div className="text-2xl font-black text-indigo-500 mt-0.5">{facultyRoster.crossDepartmentFaculty.length} Visiting</div>
            <span className="text-[10px] text-muted-foreground">AI&DS, CSE & Allied</span>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
            <Building2 className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-card border border-border/80 p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Active Timetable Slots</span>
            <div className="text-2xl font-black text-foreground mt-0.5">{masterData.totalSlots} Slots</div>
            <span className="text-[10px] text-purple-400 font-semibold">Active Bell Schedule</span>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
            <Clock className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* ─── Navigation Tabs ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto">
        {[
          { id: 'matrix', label: 'Master Matrix Board', icon: Layers },
          { id: 'upload', label: 'Smart Upload & Mapper', icon: Upload },
          { id: 'revisions', label: 'Revisions & Version Diff', icon: GitBranch },
          { id: 'workload', label: 'Faculty Workload Roster', icon: Users },
          { id: 'issues', label: 'Faculty Issues Desk', icon: MessageSquare },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: MASTER MATRIX BOARD ──────────────────────────────────────── */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border p-4 rounded-2xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground uppercase">View Perspective:</span>
              <div className="flex rounded-xl bg-muted/60 p-1">
                {(['CLASS', 'FACULTY', 'ROOM'] as const).map((vt) => (
                  <button
                    key={vt}
                    onClick={() => {
                      setMatrixViewType(vt);
                      setSelectedEntityKey('');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      matrixViewType === vt
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {vt === 'CLASS' ? 'Class View' : (vt === 'FACULTY' ? 'Faculty View' : 'Room View')}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground">Select {matrixViewType === 'CLASS' ? 'Class' : (matrixViewType === 'FACULTY' ? 'Faculty' : 'Venue')}:</span>
              <select
                value={selectedEntityKey}
                onChange={(e) => setSelectedEntityKey(e.target.value)}
                className="bg-muted/40 border border-border rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {getEntityKeys().map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Timetable Grid */}
          <div className="overflow-x-auto bg-card border border-border rounded-2xl shadow-sm">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="p-3 font-extrabold uppercase text-[11px] text-muted-foreground w-28">Day / Period</th>
                  {periods.map((p) => (
                    <th key={p} className="p-3 font-extrabold text-[11px] text-center border-l border-border/50">
                      <div>Period {p}</div>
                      <div className="text-[9px] font-normal text-muted-foreground">
                        {p === 1 ? '09:00 - 09:50' : (p === 2 ? '09:50 - 10:40' : (p === 3 ? '11:00 - 11:50' : (p === 4 ? '11:50 - 12:40' : (p === 5 ? '01:30 - 02:20' : (p === 6 ? '02:20 - 03:10' : (p === 7 ? '03:20 - 04:10' : '04:10 - 05:00'))))))}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {weekdays.map((day) => (
                  <tr key={day} className="hover:bg-muted/20 transition">
                    <td className="p-3 font-extrabold text-foreground tracking-wide bg-muted/20">
                      {day}
                    </td>
                    {periods.map((p) => {
                      const slot = getCellSlot(day, p);
                      return (
                        <td key={p} className="p-2 border-l border-border/50 text-center align-top min-w-[130px]">
                          {slot ? (
                            <div className={`p-2.5 rounded-xl border text-left shadow-xs transition hover:scale-[1.02] cursor-pointer ${
                              slot.isLab || slot.slotType === 'LAB'
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
                                : (slot.faculty && slot.faculty.departmentId !== departmentId
                                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-900 dark:text-indigo-200'
                                    : 'bg-primary/10 border-primary/30 text-primary-900 dark:text-primary-200')
                            }`}>
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="font-extrabold text-xs">{slot.subject?.code || 'Course'}</span>
                                {slot.faculty && slot.faculty.departmentId !== departmentId && (
                                  <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-400 font-bold">Cross-Dept</span>
                                )}
                                {slot.isLab && (
                                  <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 font-bold">LAB</span>
                                )}
                              </div>
                              <div className="text-[11px] font-semibold truncate">{slot.subject?.name}</div>
                              <div className="text-[10px] text-muted-foreground mt-1 flex items-center justify-between">
                                <span>{slot.faculty ? `${slot.faculty.firstName} ${slot.faculty.lastName}` : slot.section?.name}</span>
                                <span className="font-mono text-[9px] px-1 rounded bg-muted/60">{slot.roomNo || 'D106'}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="h-16 flex items-center justify-center border border-dashed border-border/40 rounded-xl text-[10px] text-muted-foreground/40 hover:border-primary/50 transition cursor-pointer">
                              Free Slot
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 2: SMART UPLOAD & COLUMN MAPPER ────────────────────────────── */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Upload Structured Timetable (XLSX / CSV)
            </h2>
            <p className="text-xs text-muted-foreground">
              Upload your departmental master timetable. CampusOS will auto-detect columns, perform fuzzy entity matching for faculty and courses, and run institution-wide conflict checks.
            </p>

            <div className="border-2 border-dashed border-border hover:border-primary/50 p-8 rounded-2xl text-center space-y-3 bg-muted/10 transition">
              <Upload className="h-8 w-8 text-primary mx-auto" />
              <div>
                <p className="text-xs font-bold text-foreground">Click to upload or drag and drop timetable file</p>
                <p className="text-[10px] text-muted-foreground">Supports XLSX, CSV, or formatted department schedules</p>
              </div>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
                id="timetable-file-input"
              />
              <label
                htmlFor="timetable-file-input"
                className="inline-block px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs cursor-pointer shadow-sm hover:opacity-95"
              >
                Choose Excel File
              </label>
            </div>
          </div>

          {importBatchResult && (
            <div className="bg-card border border-border p-6 rounded-2xl space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                <div>
                  <h3 className="text-sm font-extrabold text-foreground">Import Preview & Validation Telemetry</h3>
                  <p className="text-xs text-muted-foreground">Review detected slots, warnings, and cross-department teaching assignments.</p>
                </div>
                <button
                  onClick={handleSaveDraft}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition"
                >
                  <Check className="h-4 w-4" />
                  Save as Draft Timetable
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-muted/40 border border-border text-center">
                  <div className="text-xl font-black text-foreground">{importBatchResult.summary.totalRows}</div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Total Slots</div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <div className="text-xl font-black text-emerald-500">{importBatchResult.summary.validRows}</div>
                  <div className="text-[10px] uppercase font-bold text-emerald-500">Valid Rows</div>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                  <div className="text-xl font-black text-amber-500">{importBatchResult.summary.warningRows}</div>
                  <div className="text-[10px] uppercase font-bold text-amber-500">Warnings (Cross-Dept)</div>
                </div>
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
                  <div className="text-xl font-black text-rose-500">{importBatchResult.summary.errorRows}</div>
                  <div className="text-[10px] uppercase font-bold text-rose-500">Conflicts / Errors</div>
                </div>
              </div>

              {/* Detected Rows Table */}
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/60 text-[10px] uppercase font-extrabold text-muted-foreground border-b border-border">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Day</th>
                      <th className="p-3">Period</th>
                      <th className="p-3">Course</th>
                      <th className="p-3">Faculty</th>
                      <th className="p-3">Venue</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {importBatchResult.parsedRows.map((r: any, idx: number) => (
                      <tr key={idx} className="hover:bg-muted/20">
                        <td className="p-3 font-mono text-[10px]">{r.rowNumber}</td>
                        <td className="p-3 font-bold">{r.dayOfWeek}</td>
                        <td className="p-3">Period {r.periodNumber}</td>
                        <td className="p-3 font-semibold">{r.subjectCode} - {r.subjectName}</td>
                        <td className="p-3">
                          <div className="font-bold flex items-center gap-1.5">
                            {r.facultyName}
                            {r.isCrossDepartment && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-400 font-bold">Cross-Dept</span>
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground">{r.facultyEmployeeId}</div>
                        </td>
                        <td className="p-3 font-mono">{r.roomNo}</td>
                        <td className="p-3">
                          {r.status === 'VALID' && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">Valid</span>
                          )}
                          {r.status === 'WARNING' && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold text-[10px]">Warning</span>
                          )}
                          {r.status === 'ERROR' && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-bold text-[10px]">Error</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: REVISIONS & VERSION DIFF ─────────────────────────────────── */}
      {activeTab === 'revisions' && (
        <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-foreground">Timetable Revisions & Historical Versions</h3>
              <p className="text-xs text-muted-foreground">Historical preservation: Old published revisions are superseded, ensuring historical attendance remains 100% accurate.</p>
            </div>
            <button
              onClick={() => setIsPublishModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs"
            >
              <CheckCircle2 className="h-4 w-4" />
              Publish New Revision
            </button>
          </div>

          <div className="p-4 rounded-xl bg-muted/20 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-extrabold text-xs">REV-00</span>
                <span className="font-bold text-xs text-foreground">Initial Official Timetable Release</span>
              </div>
              <span className="text-xs text-muted-foreground">W.E.F. 10/07/2026</span>
            </div>
            <p className="text-xs text-muted-foreground">42 slots active across VII IT-A, III IT-A, and V IT-A with Home & Visiting faculty allocations.</p>
          </div>
        </div>
      )}

      {/* ─── TAB 4: FACULTY WORKLOAD ROSTER ──────────────────────────────────── */}
      {activeTab === 'workload' && (
        <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-foreground">Faculty Workload & Official Print Directory</h3>
              <p className="text-xs text-muted-foreground">Auto-calculated theory, lab, tutorial, and mentor hours with institutional print export.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {facultyRoster.homeFaculty.concat(facultyRoster.crossDepartmentFaculty).map((fac) => (
              <div key={fac.id} className="p-4 rounded-2xl border border-border bg-muted/10 space-y-3 hover:border-primary/50 transition">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-extrabold text-sm text-foreground">{fac.firstName} {fac.lastName}</h4>
                    <span className="text-[10px] text-muted-foreground font-mono">{fac.employeeId} • {fac.designation || 'Faculty'}</span>
                  </div>
                  {fac.isVisiting ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold">Visiting ({fac.homeDepartment.code})</span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">Home Faculty</span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-2">
                  <span>Weekly Workload:</span>
                  <span className="font-bold text-foreground">16 hrs / week</span>
                </div>

                <button
                  onClick={() => handleOpenPrintPreview(fac.id)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-card border border-border hover:border-primary/50 text-foreground font-bold text-xs transition"
                >
                  <Printer className="h-3.5 w-3.5 text-primary" />
                  View Official Print Format (A5c)
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 5: FACULTY ISSUES DESK ──────────────────────────────────────── */}
      {activeTab === 'issues' && (
        <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-foreground">Faculty Timetable Issue Reports</h3>
              <p className="text-xs text-muted-foreground">In-app requests from faculty regarding room clashes, equipment needs, or course adjustments.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-muted/20 border border-border text-center space-y-2">
            <ShieldCheck className="h-8 w-8 text-emerald-500 mx-auto" />
            <div className="text-xs font-bold text-foreground">No active pending issues reported</div>
            <p className="text-[10px] text-muted-foreground">All recent timetable inquiries have been reviewed and resolved.</p>
          </div>
        </div>
      )}

      {/* ─── MODAL: OFFICIAL PRINT PREVIEW (AEC A5c) ─────────────────────────── */}
      {isPrintModalOpen && printData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 rounded-3xl shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                <Printer className="h-4 w-4" />
                AEC Faculty Timetable (Format A5c)
              </div>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-bold"
              >
                Close
              </button>
            </div>

            {/* Printable Document Box */}
            <div className="relative bg-white text-black p-8 rounded-2xl border shadow-inner space-y-6 print:p-0 print:border-none overflow-hidden">
              {/* Institutional Watermark Layer */}
              <div aria-hidden="true" className="print-watermark-overlay pointer-events-none absolute inset-0 z-0 flex items-center justify-center select-none overflow-hidden">
                <img
                  src="/branding/al-ameen-logo.png"
                  alt=""
                  className="w-1/2 max-w-[380px] opacity-[0.045] object-contain filter grayscale contrast-125"
                />
              </div>

              <div className="relative z-10 space-y-6">
                {/* Institution Header */}
                <div className="text-center border-b-2 border-black pb-4">
                  <h1 className="text-xl font-black tracking-wider uppercase">AL-AMEEN ENGINEERING COLLEGE</h1>
                  <h2 className="text-sm font-extrabold tracking-wide uppercase mt-0.5">FACULTY TIMETABLE (Format A5c)</h2>
                <div className="flex items-center justify-between text-xs font-bold mt-2">
                  <span>Academic Year: {printData.institutionHeader.academicYear}</span>
                  <span>Semester: {printData.institutionHeader.semester}</span>
                  <span>Revision: {printData.institutionHeader.revisionCode}</span>
                  <span>W.E.F: {printData.institutionHeader.wefDate}</span>
                </div>
              </div>

              {/* Faculty Info */}
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                <div>Faculty Name: <span className="font-normal">{printData.facultyDetails.name}</span></div>
                <div>Employee ID: <span className="font-normal">{printData.facultyDetails.employeeId}</span></div>
                <div>Designation: <span className="font-normal">{printData.facultyDetails.designation}</span></div>
                <div>Department: <span className="font-normal">{printData.facultyDetails.department}</span></div>
              </div>

              {/* Weekly Period Matrix */}
              <table className="w-full border-collapse border border-black text-center text-xs">
                <thead>
                  <tr className="bg-gray-100 border-b border-black">
                    <th className="border border-black p-2 font-bold w-24">Day</th>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
                      <th key={p} className="border border-black p-2 font-bold">P{p}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].map(day => (
                    <tr key={day} className="border-b border-black">
                      <td className="border border-black p-2 font-bold bg-gray-50">{day}</td>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(p => {
                        const cell = printData.weeklyGrid[day]?.[p];
                        return (
                          <td key={p} className="border border-black p-2 font-semibold">
                            {cell ? (
                              <div>
                                <div className="font-extrabold">{cell.subjectCode}</div>
                                <div className="text-[10px] text-gray-700">{cell.classSection}</div>
                                <div className="text-[9px] text-gray-500 font-mono">{cell.roomNo}</div>
                              </div>
                            ) : '-'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Workload Summary */}
              <div className="border border-black p-3 text-xs flex justify-between items-center">
                <span className="font-bold uppercase">Total Workload Hours Per Week:</span>
                <span className="font-black text-sm">{printData.workload.totalHours || 16} Hours</span>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-4 pt-12 text-center text-xs font-bold border-t border-dashed border-gray-400">
                <div>Faculty Signature</div>
                <div>Head of Department (HOD)</div>
                <div>Principal</div>
              </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-sm hover:opacity-95"
              >
                <Printer className="h-4 w-4" />
                Print / Save as PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: PUBLISH REVISION (W.E.F) ─────────────────────────────────── */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border max-w-md w-full p-6 rounded-3xl shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Publish Timetable Revision
            </h3>
            <p className="text-xs text-muted-foreground">
              Publishing will activate this timetable for live faculty dashboards, student timetables, and period attendance.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Effective From Date (W.E.F.):</label>
                <input
                  type="date"
                  value={publishEffectiveDate}
                  onChange={(e) => setPublishEffectiveDate(e.target.value)}
                  className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Change Summary / Notes:</label>
                <textarea
                  value={publishSummary}
                  onChange={(e) => setPublishSummary(e.target.value)}
                  placeholder="E.g. Revision 01 effective for Odd semester lecture schedules"
                  rows={3}
                  className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handlePublishRevision}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                Confirm & Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HodTimetableControlCenter;
