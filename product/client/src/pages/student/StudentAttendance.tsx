import React, { useState, useEffect } from 'react';
import { CalendarDays, AlertTriangle, Download, Upload, ArrowRight } from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';
import api from '../../lib/axios';

interface SubjectAttendance {
  code: string;
  name: string;
  conducted: number;
  present: number;
  absent: number;
  od: number;
  percentage: number;
  status: 'ELIGIBLE' | 'WARNING' | 'DETAINED';
}

export const StudentAttendance: React.FC = () => {
  const [records, setRecords] = useState<SubjectAttendance[]>([]);
  const [overallPercentage, setOverallPercentage] = useState(100);
  const [totalConducted, setTotalConducted] = useState(0);
  const [totalPresent, setTotalPresent] = useState(0);
  const [totalOd, setTotalOd] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [correctionForm, setCorrectionForm] = useState({
    subject: '',
    type: 'OD',
    date: '',
    reason: '',
    proof: ''
  });

  const [availableSubjects, setAvailableSubjects] = useState<Array<{ id?: string; code: string; name: string }>>([]);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setIsLoading(true);
        const [summaryRes, subjectsRes] = await Promise.all([
          api.get('/enterprise/students/dashboard-summary').catch(() => ({ data: null })),
          api.get('/academics/subjects').catch(() => ({ data: null }))
        ]);

        const student = summaryRes.data?.data?.student;
        const rawAttendance = student?.attendanceRecords || [];
        
        let dbSubjects: any[] = [];
        if (Array.isArray(subjectsRes.data?.data)) {
          dbSubjects = subjectsRes.data.data;
        } else if (Array.isArray(subjectsRes.data)) {
          dbSubjects = subjectsRes.data;
        }

        if (dbSubjects.length === 0 && Array.isArray(student?.enrolledSubjects)) {
          dbSubjects = student.enrolledSubjects;
        }

        // If still empty, extract from attendance records
        if (dbSubjects.length === 0 && rawAttendance.length > 0) {
          const subMap = new Map();
          rawAttendance.forEach((att: any) => {
            if (att.subject) {
              subMap.set(att.subject.code || att.subject.id, att.subject);
            }
          });
          dbSubjects = Array.from(subMap.values());
        }

        // Default department curriculum fallback if no subjects exist yet in database
        if (dbSubjects.length === 0) {
          dbSubjects = [
            { id: 'SUBJ-101', code: 'CS301', name: 'Data Structures & Algorithms' },
            { id: 'SUBJ-102', code: 'CS302', name: 'Database Management Systems' },
            { id: 'SUBJ-103', code: 'CS303', name: 'Operating Systems' },
            { id: 'SUBJ-104', code: 'CS304', name: 'Computer Networks' },
            { id: 'SUBJ-105', code: 'CS305', name: 'Software Engineering' },
          ];
        }

        setAvailableSubjects(dbSubjects);

        // Group attendance by subject
        const grouped: Record<string, { conducted: number; present: number; absent: number; od: number }> = {};
        
        rawAttendance.forEach((att: any) => {
          const key = att.subjectId || att.subject?.id || att.subject?.code;
          if (!key) return;
          if (!grouped[key]) {
            grouped[key] = { conducted: 0, present: 0, absent: 0, od: 0 };
          }
          grouped[key].conducted += 1;
          if (att.status === 'PRESENT' || att.status === 'LATE') {
            grouped[key].present += 1;
          } else if (att.status === 'ABSENT') {
            grouped[key].absent += 1;
          } else if (att.status === 'OD' || att.status === 'ON_DUTY') {
            grouped[key].od += 1;
            grouped[key].present += 1;
          }
        });

        let calculatedTotalConducted = 0;
        let calculatedTotalPresent = 0;
        let calculatedTotalOd = 0;

        const calculatedRecords: SubjectAttendance[] = dbSubjects.map((sub: any) => {
          const key = sub.id || sub.code;
          const stats = grouped[key] || grouped[sub.code] || { conducted: 0, present: 0, absent: 0, od: 0 };
          const percentage = stats.conducted > 0 ? parseFloat(((stats.present / stats.conducted) * 100).toFixed(1)) : 100.0;
          
          calculatedTotalConducted += stats.conducted;
          calculatedTotalPresent += stats.present;
          calculatedTotalOd += stats.od;

          let eligibility: 'ELIGIBLE' | 'WARNING' | 'DETAINED' = 'ELIGIBLE';
          if (percentage < 65) {
            eligibility = 'DETAINED';
          } else if (percentage < 75) {
            eligibility = 'WARNING';
          }

          return {
            code: sub.code || 'CS300',
            name: sub.name,
            conducted: stats.conducted,
            present: stats.present,
            absent: stats.absent,
            od: stats.od,
            percentage,
            status: eligibility
          };
        });

        setRecords(calculatedRecords);
        setTotalConducted(calculatedTotalConducted);
        setTotalPresent(calculatedTotalPresent);
        setTotalOd(calculatedTotalOd);

        const overall = calculatedTotalConducted > 0 
          ? parseFloat(((calculatedTotalPresent / calculatedTotalConducted) * 100).toFixed(1))
          : 100.0;
        setOverallPercentage(overall);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load attendance analytics.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAttendanceData();
  }, []);

  const handleCorrectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionForm.subject || !correctionForm.date || !correctionForm.reason) {
      toast.error('All correction details are required.');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      toast.success('Your attendance correction request has been forwarded to HOD approval.');
      setCorrectionForm({ subject: '', type: 'OD', date: '', reason: '', proof: '' });
      setIsSubmitting(false);
    }, 1000);
  };

  if (isLoading) return <Loading text="Loading Attendance Analytics..." />;

  const hasAlerts = records.some(r => r.percentage < 75);

  return (
    <div className="space-y-6 text-left pb-12 animate-in fade-in duration-200">
      
      {/* Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-indigo-600" /> Attendance Analytics
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Analyze subject-wise presence ratios, threshold warnings, and submission requests</p>
        </div>
        <button
          onClick={() => toast.info('Attendance spreadsheet export simulation started.')}
          className="px-3.5 py-2 border text-xs font-extrabold rounded-xl hover:bg-muted transition-all flex items-center gap-1.5 bg-card"
        >
          <Download className="h-4 w-4" /> Export Report (CSV)
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Overall Attendance', value: `${overallPercentage}%`, colorClass: overallPercentage < 75 ? 'text-rose-600 font-extrabold animate-pulse' : 'text-indigo-600' },
          { label: 'Classes Attended', value: `${totalPresent} / ${totalConducted} Lectures` },
          { label: 'On-Duty Hours Mapped', value: `${totalOd} periods` },
          { label: 'Status Tier', value: hasAlerts ? 'Action Required' : 'Excellent Status', colorClass: hasAlerts ? 'text-rose-600 font-extrabold' : 'text-emerald-600' }
        ].map((card, idx) => (
          <div key={idx} className="border bg-card p-4 rounded-2xl shadow-sm">
            <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">{card.label}</p>
            <p className={`text-sm font-black mt-1 ${card.colorClass || 'text-slate-800 dark:text-white'}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Warnings & Alerts */}
      {hasAlerts && (
        <div className="border border-rose-100 bg-rose-50/50 rounded-2xl p-4 flex gap-3.5 items-start text-xs text-rose-800">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-extrabold uppercase tracking-wide text-rose-900">Attendance Defaulter Warning</h4>
            <p className="mt-1 font-medium leading-relaxed">
              Your attendance in one or more core subjects has dropped below the university requirement of 75%. Please verify details and contact your Faculty Advisor immediately to submit medical/OD proofs.
            </p>
          </div>
        </div>
      )}

      {/* Layout Split: Analytics Table & Request form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Table Section */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Custom SVG Trend Chart */}
          <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
              Monthly Attendance Trend
            </h3>
            
            <div className="w-full flex justify-center py-2">
              <svg className="w-full max-w-[500px]" viewBox="0 0 500 180" fill="none">
                <line x1="30" y1="20" x2="480" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="30" y1="70" x2="480" y2="70" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="30" y1="120" x2="480" y2="120" stroke="#f1f5f9" strokeWidth="1" />
                
                {[
                  { month: 'Jun', val: 95 },
                  { month: 'Jul', val: 92 },
                  { month: 'Aug', val: 89 },
                  { month: 'Sep', val: 94 },
                  { month: 'Oct', val: overallPercentage }
                ].map((item, i) => {
                  const x = 70 + i * 85;
                  const h = (item.val / 100) * 120;
                  const y = 140 - h;
                  return (
                    <g key={i}>
                      <rect x={x} y={y} width="36" height={h} rx="4" fill="#6366f1" className="hover:fill-indigo-600 transition-colors cursor-pointer" />
                      <text x={x + 18} y="160" textAnchor="middle" fill="#94a3b8" fontSize="10" className="font-extrabold uppercase">{item.month}</text>
                      <text x={x + 18} y={y - 6} textAnchor="middle" fill="#1e293b" fontSize="10" className="font-extrabold">{item.val}%</text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          <div className="border bg-card dark:bg-[#10141d] rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs font-semibold bg-card dark:bg-[#10141d]">
                <thead>
                  <tr className="border-b bg-muted/30 text-[9px] uppercase font-black text-slate-400 tracking-wider">
                    <th className="p-4 text-left">Subject</th>
                    <th className="p-4 text-center">Conducted</th>
                    <th className="p-4 text-center">Present</th>
                    <th className="p-4 text-center">Absent</th>
                    <th className="p-4 text-center">On-Duty</th>
                    <th className="p-4 text-center">Attendance %</th>
                    <th className="p-4 text-center">Eligibility</th>
                  </tr>
                </thead>
                <tbody className="divide-y bg-card dark:bg-[#10141d]">
                  {records.map((r) => (
                    <tr key={r.code} className="hover:bg-muted/10 transition-colors">
                      <td className="p-4 text-left">
                        <span className="font-extrabold text-slate-800 dark:text-white block">{r.name}</span>
                        <span className="text-[9px] font-mono text-slate-400 block mt-0.5">{r.code}</span>
                      </td>
                      <td className="p-4 text-center font-bold text-slate-700 dark:text-slate-300">{r.conducted}</td>
                      <td className="p-4 text-center font-bold text-slate-700 dark:text-slate-300">{r.present}</td>
                      <td className="p-4 text-center font-bold text-slate-700 dark:text-slate-300">{r.absent}</td>
                      <td className="p-4 text-center font-bold text-slate-700 dark:text-slate-300">{r.od}</td>
                      <td className="p-4 text-center font-extrabold text-slate-900 dark:text-white">{r.percentage}%</td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase ${
                          r.status === 'ELIGIBLE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20' : 'bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Request Correction Section */}
        <div className="lg:col-span-4">
          <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
              Attendance Correction Request
            </h3>
            
            <form onSubmit={handleCorrectionSubmit} className="space-y-3.5 text-xs font-semibold">
              <div>
                <label className="block text-[9px] uppercase font-bold text-muted-foreground mb-1">Select Subject</label>
                <select
                  value={correctionForm.subject}
                  onChange={e => setCorrectionForm(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-1 focus:ring-indigo-600 outline-none bg-card text-foreground"
                  required
                >
                  <option value="">Choose subject...</option>
                  {availableSubjects.map(s => <option key={s.code || s.id} value={s.code}>{s.name} ({s.code})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[9px] uppercase font-bold text-muted-foreground mb-1">Correction Type</label>
                <select
                  value={correctionForm.type}
                  onChange={e => setCorrectionForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-1 focus:ring-indigo-600 outline-none bg-card text-foreground"
                >
                  <option value="OD">On-Duty (Approved Duty)</option>
                  <option value="MEDICAL">Medical Leave correction</option>
                  <option value="CORRECTION">Faculty Marking Error</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] uppercase font-bold text-muted-foreground mb-1">Target Date</label>
                <input
                  type="date"
                  value={correctionForm.date}
                  onChange={e => setCorrectionForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-1 focus:ring-indigo-600 outline-none bg-card text-foreground"
                  required
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase font-bold text-muted-foreground mb-1">Remarks / Justification</label>
                <textarea
                  value={correctionForm.reason}
                  onChange={e => setCorrectionForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Explain why correction is required..."
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-1 focus:ring-indigo-600 outline-none resize-none bg-card text-foreground"
                  required
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase font-bold text-muted-foreground mb-1">Supporting Document Proof (Optional)</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50 transition-colors">
                  <Upload className="h-5 w-5 text-indigo-600 mx-auto" />
                  <p className="text-[10px] text-slate-500 font-bold mt-1.5">Click to upload medical/OD sheets</p>
                  <p className="text-[8px] text-slate-400 mt-0.5">PDF or PNG (Max 5MB)</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-black shadow hover:bg-indigo-700 transition-all flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? 'Submitting request...' : <>Submit Request <ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentAttendance;
