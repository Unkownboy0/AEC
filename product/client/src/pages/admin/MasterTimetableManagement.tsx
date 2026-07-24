import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ShieldCheck, AlertCircle, CheckCircle2, Download, Upload, RefreshCw, Lock, Plus, Trash2, Eye, History, FileSpreadsheet, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';
import api from '../../lib/axios';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const PERIODS = [
  { num: 1, start: '08:30', end: '09:20' },
  { num: 2, start: '09:20', end: '10:10' },
  { num: 3, start: '10:30', end: '11:20' },
  { num: 4, start: '11:20', end: '12:10' },
  { num: 5, start: '01:10', end: '02:00' },
  { num: 6, start: '02:00', end: '02:50' },
];

export const MasterTimetableManagement: React.FC = () => {
  const { user } = useAuth();
  const isAuthorized = ['COE', 'Dean Academics', 'Super Admin', 'Controller of Examinations'].includes(user?.role || '');

  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [semester, setSemester] = useState('Semester VI');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [section, setSection] = useState('A');
  const [slots, setSlots] = useState<any[]>([
    { dayOfWeek: 'MONDAY', periodNumber: 1, startTime: '08:30', endTime: '09:20', subjectCode: 'CS6101', subjectName: 'Design and Analysis of Algorithms', facultyName: 'Dr. Ramesh Kumar', roomNo: 'LH-301', building: 'Newton Block', isLab: false },
    { dayOfWeek: 'MONDAY', periodNumber: 2, startTime: '09:20', endTime: '10:10', subjectCode: 'CS6102', subjectName: 'Database Management Systems', facultyName: 'Prof. Sangeetha S', roomNo: 'LH-301', building: 'Newton Block', isLab: false },
    { dayOfWeek: 'TUESDAY', periodNumber: 1, startTime: '08:30', endTime: '09:20', subjectCode: 'CS6103', subjectName: 'Operating Systems', facultyName: 'Dr. Amit Patel', roomNo: 'LH-301', building: 'Newton Block', isLab: false },
  ]);

  const [conflictResult, setConflictResult] = useState<any | null>(null);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [showLogsModal, setShowLogsModal] = useState(false);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const res = await api.get('/enterprise/master-timetable/audit-logs');
      if (res.data?.status === 'success') {
        setAuditLogs(res.data.data);
      }
    } catch {
      // Graceful fallback
    }
  };

  const runConflictDetection = async () => {
    try {
      setIsCheckingConflicts(true);
      const res = await api.post('/enterprise/master-timetable/conflict-check', { slots });
      if (res.data?.status === 'success') {
        setConflictResult(res.data.data);
        if (res.data.data.passed) {
          toast.success('12-Point Conflict Matrix Passed! Zero clashes detected.');
        } else {
          toast.error('Conflicts detected in timetable matrix!');
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Conflict check failed');
    } finally {
      setIsCheckingConflicts(false);
    }
  };

  const handlePublish = async () => {
    if (!conflictResult || !conflictResult.passed) {
      toast.error('You must run and pass the 12-point conflict check before publishing!');
      return;
    }

    try {
      setIsPublishing(true);
      const res = await api.post('/enterprise/master-timetable/publish', {
        academicYear,
        semester,
        departmentId: 'dept-cse',
        programId: 'prog-btech',
        section,
        slots,
        changeReason: 'Published by COE & Dean Academics Centralized Master Timetable Console',
      });

      if (res.data?.status === 'success') {
        toast.success(res.data.message);
        fetchAuditLogs();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to publish master timetable');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6 text-left pb-16 animate-in fade-in duration-200">
      
      {/* Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 bg-card border p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
              <Calendar className="h-6 w-6 text-indigo-600" /> Academic Master Timetable Management
            </h1>
            <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
              isAuthorized ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {isAuthorized ? 'COE & Dean Full Control' : 'Read-Only Access'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Centralized ERP Master Timetable Console. Single source of truth across Student, Faculty, HOD, and Principal portals.
          </p>
        </div>

        {isAuthorized && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLogsModal(true)}
              className="px-3.5 py-2 border rounded-xl text-xs font-extrabold hover:bg-muted flex items-center gap-1.5"
            >
              <History className="h-4 w-4 text-indigo-600" /> Audit Trail
            </button>
            <button
              onClick={runConflictDetection}
              disabled={isCheckingConflicts}
              className="px-4 py-2 bg-amber-500 text-white text-xs font-extrabold rounded-xl shadow hover:bg-amber-600 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <ShieldCheck className="h-4 w-4" /> {isCheckingConflicts ? 'Checking...' : 'Run Conflict Check'}
            </button>
            <button
              onClick={handlePublish}
              disabled={isPublishing || !conflictResult?.passed}
              className="px-4 py-2 bg-emerald-600 text-white text-xs font-extrabold rounded-xl shadow hover:bg-emerald-700 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="h-4 w-4" /> {isPublishing ? 'Publishing...' : 'Publish Master Timetable'}
            </button>
          </div>
        )}
      </div>

      {/* Conflict Status Bar */}
      {conflictResult && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-bold ${
          conflictResult.passed ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {conflictResult.passed ? <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" /> : <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />}
          <div>
            <p className="font-extrabold">{conflictResult.message}</p>
            {conflictResult.conflicts?.map((c: string, idx: number) => (
              <p key={idx} className="text-[10px] font-mono mt-0.5">• {c}</p>
            ))}
          </div>
        </div>
      )}

      {/* Master Form Configuration Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-semibold bg-card border p-5 rounded-2xl shadow-sm">
        <div>
          <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Academic Year</label>
          <input
            type="text"
            value={academicYear}
            disabled={!isAuthorized}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="w-full px-3 py-2 border rounded-xl bg-background outline-none font-bold"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Semester</label>
          <input
            type="text"
            value={semester}
            disabled={!isAuthorized}
            onChange={(e) => setSemester(e.target.value)}
            className="w-full px-3 py-2 border rounded-xl bg-background outline-none font-bold"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Department</label>
          <input
            type="text"
            value={department}
            disabled={!isAuthorized}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full px-3 py-2 border rounded-xl bg-background outline-none font-bold"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Section</label>
          <input
            type="text"
            value={section}
            disabled={!isAuthorized}
            onChange={(e) => setSection(e.target.value)}
            className="w-full px-3 py-2 border rounded-xl bg-background outline-none font-bold"
          />
        </div>
      </div>

      {/* Slot Matrix Table */}
      <div className="border bg-card rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/20 flex justify-between items-center text-xs font-extrabold">
          <span>Master Period Matrix Allocation ({slots.length} Assigned Slots)</span>
          <span className="text-[10px] text-slate-400">Single Source of Truth</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-semibold border-collapse">
            <thead>
              <tr className="border-b bg-muted/10 text-[9px] uppercase font-black text-slate-400 tracking-wider">
                <th className="p-3 text-left">Day</th>
                <th className="p-3 text-center">Period</th>
                <th className="p-3 text-left">Subject Code & Name</th>
                <th className="p-3 text-left">Faculty</th>
                <th className="p-3 text-left">Room / Building</th>
                <th className="p-3 text-center">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {slots.map((s, idx) => (
                <tr key={idx} className="hover:bg-muted/10 transition-colors">
                  <td className="p-3 font-bold text-slate-800 dark:text-white">{s.dayOfWeek}</td>
                  <td className="p-3 text-center font-mono font-bold text-indigo-600">P{s.periodNumber} ({s.startTime}-{s.endTime})</td>
                  <td className="p-3 font-extrabold text-slate-800 dark:text-white">{s.subjectCode}: {s.subjectName}</td>
                  <td className="p-3 font-medium text-slate-600">{s.facultyName}</td>
                  <td className="p-3 text-slate-500 font-medium">{s.roomNo} ({s.building})</td>
                  <td className="p-3 text-center">
                    <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded border ${
                      s.isLab ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    }`}>
                      {s.isLab ? 'LAB' : 'LECTURE'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Logs Modal */}
      {showLogsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border rounded-2xl p-6 max-w-xl w-full space-y-4 shadow-xl text-xs font-semibold">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-extrabold text-slate-800 dark:text-white">COE & Dean Audit Trail Log</h3>
              <button onClick={() => setShowLogsModal(false)} className="text-slate-400 hover:text-foreground">✕</button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3 border rounded-xl bg-muted/20 font-mono text-[10px] space-y-1">
                  <div className="flex justify-between text-indigo-600 font-bold">
                    <span>{log.action}</span>
                    <span>{new Date(log.createdAt).toLocaleString('en-IN')}</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">Performed by: {log.performedByRole}</p>
                  {log.reason && <p className="text-slate-400 italic">{log.reason}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterTimetableManagement;
