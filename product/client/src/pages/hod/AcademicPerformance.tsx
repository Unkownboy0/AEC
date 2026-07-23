import React, { useState, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Award, Users, BookOpen, BarChart2,
  Search, Download, ChevronDown, Activity, Target, Star
} from 'lucide-react';

// ─── Dummy Data ────────────────────────────────────────────────────────────────
const SEMESTER_DATA = [
  { sem: 'Semester 1', pass: 95, fail: 5,  total: 120, avg_cgpa: 8.2 },
  { sem: 'Semester 2', pass: 91, fail: 9,  total: 118, avg_cgpa: 7.9 },
  { sem: 'Semester 3', pass: 89, fail: 11, total: 116, avg_cgpa: 7.7 },
  { sem: 'Semester 4', pass: 93, fail: 7,  total: 114, avg_cgpa: 8.0 },
  { sem: 'Semester 5', pass: 90, fail: 10, total: 110, avg_cgpa: 7.8 },
  { sem: 'Semester 6', pass: 88, fail: 12, total: 108, avg_cgpa: 7.6 },
];

const TOP_STUDENTS = [
  { rank: 1,  name: 'Arun Kumar',     regNo: '717821CS001', cgpa: 9.4, sem: 'Semester 6', section: 'A', backlogs: 0 },
  { rank: 2,  name: 'Priya S',        regNo: '717821CS015', cgpa: 9.2, sem: 'Semester 6', section: 'A', backlogs: 0 },
  { rank: 3,  name: 'Vignesh R',      regNo: '717821CS022', cgpa: 9.1, sem: 'Semester 6', section: 'B', backlogs: 0 },
  { rank: 4,  name: 'Harini M',       regNo: '717821CS034', cgpa: 9.0, sem: 'Semester 6', section: 'A', backlogs: 0 },
  { rank: 5,  name: 'Karthikeyan P',  regNo: '717821CS041', cgpa: 8.9, sem: 'Semester 6', section: 'B', backlogs: 0 },
  { rank: 6,  name: 'Divya L',        regNo: '717821CS053', cgpa: 8.8, sem: 'Semester 5', section: 'A', backlogs: 0 },
  { rank: 7,  name: 'Surya T',        regNo: '717821CS067', cgpa: 8.7, sem: 'Semester 5', section: 'B', backlogs: 0 },
  { rank: 8,  name: 'Meenakshi A',    regNo: '717821CS078', cgpa: 8.6, sem: 'Semester 4', section: 'A', backlogs: 0 },
];

const SUBJECT_PERFORMANCE = [
  { code: 'CS302', subject: 'DBMS',                   pass: 95, internal: 88, university: 91, attempts: 112 },
  { code: 'CS305', subject: 'Web Technologies',       pass: 97, internal: 91, university: 93, attempts: 108 },
  { code: 'CS303', subject: 'Operating Systems',      pass: 92, internal: 85, university: 88, attempts: 116 },
  { code: 'CS304', subject: 'Computer Networks',      pass: 90, internal: 83, university: 86, attempts: 114 },
  { code: 'CS301', subject: 'Data Structures',        pass: 88, internal: 82, university: 85, attempts: 120 },
  { code: 'CS306', subject: 'Software Engineering',   pass: 93, internal: 87, university: 90, attempts: 110 },
  { code: 'CS307', subject: 'Artificial Intelligence',pass: 85, internal: 80, university: 82, attempts: 108 },
  { code: 'CS308', subject: 'Cloud Computing',        pass: 91, internal: 86, university: 89, attempts: 106 },
];

const CGPA_BANDS = [
  { label: '9.0 – 10.0',  count: 22,  color: 'bg-emerald-500',  bg: 'bg-emerald-50',  text: 'text-emerald-700',  border: 'border-emerald-200', grade: 'Distinction' },
  { label: '8.0 – 8.9',   count: 48,  color: 'bg-sky-500',      bg: 'bg-sky-50',      text: 'text-sky-700',      border: 'border-sky-200',     grade: 'First Class' },
  { label: '6.5 – 7.9',   count: 61,  color: 'bg-amber-500',    bg: 'bg-amber-50',    text: 'text-amber-700',    border: 'border-amber-200',   grade: 'Second Class' },
  { label: 'Below 6.5',   count: 14,  color: 'bg-rose-500',     bg: 'bg-rose-50',     text: 'text-rose-700',     border: 'border-rose-200',    grade: 'Pass Class' },
];

const ARREAR_DATA = [
  { sem: 'Semester 3', students: 18, subjects: 24 },
  { sem: 'Semester 4', students: 12, subjects: 16 },
  { sem: 'Semester 5', students: 20, subjects: 27 },
  { sem: 'Semester 6', students: 15, subjects: 19 },
];

const MONTHLY_TREND = [
  { month: 'Jan', internal: 82, university: 78 },
  { month: 'Feb', internal: 84, university: 80 },
  { month: 'Mar', internal: 87, university: 83 },
  { month: 'Apr', internal: 85, university: 82 },
  { month: 'May', internal: 89, university: 85 },
  { month: 'Jun', internal: 88, university: 84 },
];

const totalStudents  = 145;
const overallPass    = 92.4;
const avgCGPA        = 7.9;
const totalBacklogs  = 86;

// ─── Bar chart (pure CSS) ──────────────────────────────────────────────────────
interface BarProps { value: number; label: string; color: string; max?: number }
const Bar: React.FC<BarProps> = ({ value, label, color, max = 100 }) => (
  <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
    <div className="w-full flex flex-col-reverse items-center" style={{ height: 80 }}>
      <div
        className={`w-full ${color} rounded-t-sm transition-all duration-700`}
        style={{ height: `${(value / max) * 80}px` }}
      />
    </div>
    <span className="text-[9px] font-black text-foreground">{value}%</span>
    <span className="text-[8px] font-semibold text-muted-foreground text-center leading-tight">{label}</span>
  </div>
);

// ─── Mini Donut (SVG) ─────────────────────────────────────────────────────────
const Donut: React.FC<{ pct: number; color: string; size?: number }> = ({ pct, color, size = 56 }) => {
  const r  = 22;
  const c  = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  return (
    <svg width={size} height={size} viewBox="0 0 56 56">
      <circle cx="28" cy="28" r={r} fill="none" stroke="currentColor" strokeWidth="5" className="text-muted/40" />
      <circle
        cx="28" cy="28" r={r} fill="none"
        stroke={color} strokeWidth="5"
        strokeDasharray={`${dash} ${c}`}
        strokeLinecap="round"
        transform="rotate(-90 28 28)"
      />
      <text x="28" y="32" textAnchor="middle" fontSize="10" fontWeight="800" fill="currentColor" className="text-foreground">
        {pct}%
      </text>
    </svg>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
export const AcademicPerformance: React.FC = () => {
  const [subjectSearch, setSubjectSearch] = useState('');
  const [topStudentSearch, setTopStudentSearch] = useState('');

  const filteredSubjects = useMemo(() =>
    SUBJECT_PERFORMANCE.filter(s =>
      !subjectSearch ||
      s.subject.toLowerCase().includes(subjectSearch.toLowerCase()) ||
      s.code.toLowerCase().includes(subjectSearch.toLowerCase())
    ), [subjectSearch]);

  const filteredTopStudents = useMemo(() =>
    TOP_STUDENTS.filter(s =>
      !topStudentSearch ||
      s.name.toLowerCase().includes(topStudentSearch.toLowerCase()) ||
      s.regNo.toLowerCase().includes(topStudentSearch.toLowerCase())
    ), [topStudentSearch]);

  const cgpaTotal = CGPA_BANDS.reduce((a, b) => a + b.count, 0);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight uppercase text-foreground">Academic Performance</h2>
          <p className="text-xs text-muted-foreground font-semibold mt-0.5">
            CGPA Analysis · Semester Results · Subject Performance · Arrear Monitoring
          </p>
        </div>
        <button
          type="button"
          onClick={() => alert('Performance report exported.')}
          className="h-9 px-4 bg-primary text-primary-foreground text-xs font-bold rounded-xl flex items-center gap-1.5 hover:bg-primary/90 transition-colors w-fit"
        >
          <Download className="h-4 w-4" /> Export Report
        </button>
      </div>

      {/* ── Top KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Overall Pass Rate',  value: `${overallPass}%`, icon: Target,    color: 'border-l-emerald-500', textColor: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
          { label: 'Dept. Avg CGPA',     value: avgCGPA,           icon: Award,     color: 'border-l-primary',     textColor: 'text-primary',     bg: 'bg-primary/5 border-primary/10' },
          { label: 'Total Students',     value: totalStudents,     icon: Users,     color: 'border-l-sky-500',     textColor: 'text-sky-600',     bg: 'bg-sky-50 border-sky-100' },
          { label: 'Active Backlogs',    value: totalBacklogs,     icon: Activity,  color: 'border-l-rose-500',    textColor: 'text-rose-600',    bg: 'bg-rose-50 border-rose-100' },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className={`border bg-card rounded-2xl p-5 shadow-sm border-l-4 ${k.color}`}>
              <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border mb-3 ${k.bg}`}>
                <Icon className={`h-4 w-4 ${k.textColor}`} />
              </div>
              <p className={`text-2xl font-black ${k.textColor}`}>{k.value}</p>
              <p className="text-[9px] uppercase font-bold text-muted-foreground mt-0.5">{k.label}</p>
            </div>
          );
        })}
      </div>

      {/* ── Row 2: Semester Bar Chart + CGPA Donut ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Semester-wise Pass % Bar Chart */}
        <div className="border bg-card p-5 rounded-2xl shadow-sm">
          <h3 className="text-xs font-extrabold uppercase text-muted-foreground tracking-wider mb-4 flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-primary" /> Semester-wise Pass %
          </h3>
          <div className="flex items-end gap-2 h-28 px-2">
            {SEMESTER_DATA.map(s => (
              <Bar
                key={s.sem}
                value={s.pass}
                label={s.sem.replace('Semester ', 'S')}
                color={s.pass >= 92 ? 'bg-emerald-500' : s.pass >= 89 ? 'bg-sky-500' : 'bg-amber-500'}
              />
            ))}
          </div>
          <div className="flex items-center gap-3 mt-4 text-[9px] font-bold text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" /> ≥ 92% Excellent</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sky-500 inline-block" /> 89–91% Good</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500 inline-block" /> &lt; 89% Average</span>
          </div>
        </div>

        {/* CGPA Distribution */}
        <div className="border bg-card p-5 rounded-2xl shadow-sm">
          <h3 className="text-xs font-extrabold uppercase text-muted-foreground tracking-wider mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> CGPA Distribution
          </h3>
          <div className="space-y-3">
            {CGPA_BANDS.map(band => {
              const pct = Math.round((band.count / cgpaTotal) * 100);
              return (
                <div key={band.label} className="flex items-center gap-3">
                  <span className={`text-[9px] font-extrabold border rounded px-2 py-0.5 uppercase shrink-0 w-28 text-center ${band.bg} ${band.text} ${band.border}`}>
                    {band.grade}
                  </span>
                  <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className={`${band.color} h-full rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-black w-8 text-right">{band.count}</span>
                </div>
              );
            })}
          </div>
          {/* Donut pills */}
          <div className="flex justify-around mt-4">
            {CGPA_BANDS.map(band => (
              <div key={band.label} className="flex flex-col items-center gap-1">
                <Donut pct={Math.round((band.count / cgpaTotal) * 100)} color={band.color.replace('bg-', '#').replace('emerald-500', '10b981').replace('sky-500', '0ea5e9').replace('amber-500', 'f59e0b').replace('rose-500', 'f43f5e')} />
                <span className="text-[8px] text-muted-foreground font-semibold">{band.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 3: Performance Trend (line-style) ── */}
      <div className="border bg-card p-5 rounded-2xl shadow-sm">
        <h3 className="text-xs font-extrabold uppercase text-muted-foreground tracking-wider mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" /> Performance Trend (2025-26)
        </h3>
        <div className="overflow-x-auto">
          <div className="flex items-end gap-2 h-24 min-w-[400px] px-2">
            {MONTHLY_TREND.map((m, idx) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex gap-1 items-end" style={{ height: 72 }}>
                  {/* Internal bar */}
                  <div
                    className="flex-1 bg-primary rounded-t-sm transition-all duration-700"
                    style={{ height: `${(m.internal / 100) * 72}px` }}
                    title={`Internal: ${m.internal}%`}
                  />
                  {/* University bar */}
                  <div
                    className="flex-1 bg-emerald-400 rounded-t-sm transition-all duration-700"
                    style={{ height: `${(m.university / 100) * 72}px` }}
                    title={`University: ${m.university}%`}
                  />
                </div>
                <span className="text-[8px] font-semibold text-muted-foreground">{m.month}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4 mt-3 text-[9px] font-bold text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-primary inline-block" /> Internal Assessment</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-emerald-400 inline-block" /> University Results</span>
        </div>
      </div>

      {/* ── Row 4: Subject Performance ── */}
      <div className="border bg-card rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-xs font-extrabold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" /> Subject-wise Performance
          </h3>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search subject…"
              value={subjectSearch}
              onChange={e => setSubjectSearch(e.target.value)}
              className="h-8 border rounded-lg bg-background pl-8 pr-3 text-xs font-semibold"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-semibold text-left">
            <thead>
              <tr className="border-b bg-muted/30 text-[9px] uppercase font-black text-muted-foreground">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3 min-w-[180px]">Subject</th>
                <th className="px-4 py-3 text-center">Attempts</th>
                <th className="px-4 py-3 min-w-[160px]">Internal Avg</th>
                <th className="px-4 py-3 min-w-[160px]">University Avg</th>
                <th className="px-4 py-3 min-w-[160px]">Pass Rate</th>
                <th className="px-4 py-3 text-center">Grade</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubjects.map(s => {
                const gradeColor = s.pass >= 95 ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : s.pass >= 90 ? 'bg-sky-50 text-sky-600 border-sky-200'
                  : s.pass >= 85 ? 'bg-amber-50 text-amber-600 border-amber-200'
                  : 'bg-rose-50 text-rose-600 border-rose-200';
                const barColor = s.pass >= 95 ? 'bg-emerald-500' : s.pass >= 90 ? 'bg-sky-500' : s.pass >= 85 ? 'bg-amber-500' : 'bg-rose-500';
                return (
                  <tr key={s.code} className="border-b last:border-b-0 hover:bg-muted/10">
                    <td className="px-4 py-3 font-mono font-black text-primary">{s.code}</td>
                    <td className="px-4 py-3 font-bold">{s.subject}</td>
                    <td className="px-4 py-3 text-center">{s.attempts}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden min-w-[60px]">
                          <div className="bg-primary h-full rounded-full" style={{ width: `${s.internal}%` }} />
                        </div>
                        <span className="font-bold text-[10px] w-8">{s.internal}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden min-w-[60px]">
                          <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${s.university}%` }} />
                        </div>
                        <span className="font-bold text-[10px] w-8">{s.university}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden min-w-[60px]">
                          <div className={`${barColor} h-full rounded-full`} style={{ width: `${s.pass}%` }} />
                        </div>
                        <span className="font-black text-[10px] w-8">{s.pass}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`border px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${gradeColor}`}>
                        {s.pass >= 95 ? 'Excellent' : s.pass >= 90 ? 'Good' : s.pass >= 85 ? 'Average' : 'Poor'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Row 5: Top Students + Arrear Analysis ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Students */}
        <div className="border bg-card rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-xs font-extrabold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" /> Top Performers
            </h3>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search…"
                value={topStudentSearch}
                onChange={e => setTopStudentSearch(e.target.value)}
                className="h-7 border rounded-lg bg-background pl-8 pr-3 text-xs font-semibold"
              />
            </div>
          </div>
          <div className="divide-y">
            {filteredTopStudents.map(s => (
              <div key={s.rank} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/10 transition-colors">
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                  s.rank === 1 ? 'bg-amber-100 text-amber-700 border border-amber-300' :
                  s.rank === 2 ? 'bg-slate-100 text-slate-600 border border-slate-300' :
                  s.rank === 3 ? 'bg-orange-100 text-orange-700 border border-orange-300' :
                  'bg-muted text-muted-foreground border'
                }`}>
                  {s.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">{s.name}</p>
                  <p className="text-[9px] text-muted-foreground font-semibold">{s.regNo} · {s.sem}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-primary">{s.cgpa}</span>
                  <p className="text-[8px] text-muted-foreground font-semibold">CGPA</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Arrear Analysis */}
        <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-xs font-extrabold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-rose-500" /> Arrear Analysis
          </h3>
          <div className="grid grid-cols-2 gap-3 mb-2">
            <div className="border bg-rose-50 border-rose-200 rounded-xl p-3 text-center">
              <span className="text-xl font-black text-rose-600 block">{totalBacklogs}</span>
              <span className="text-[9px] uppercase font-bold text-rose-500 mt-0.5 block">Total Arrears</span>
            </div>
            <div className="border bg-amber-50 border-amber-200 rounded-xl p-3 text-center">
              <span className="text-xl font-black text-amber-600 block">{ARREAR_DATA.reduce((a, b) => a + b.students, 0)}</span>
              <span className="text-[9px] uppercase font-bold text-amber-500 mt-0.5 block">Students Affected</span>
            </div>
          </div>
          <div className="space-y-3">
            {ARREAR_DATA.map(a => (
              <div key={a.sem} className="flex items-center justify-between text-xs font-semibold border-b last:border-b-0 pb-3 last:pb-0">
                <div>
                  <span className="font-bold">{a.sem}</span>
                  <div className="flex items-center gap-3 mt-1 text-[9px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />{a.students} students
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />{a.subjects} arrears
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-500 h-full rounded-full"
                      style={{ width: `${(a.students / 25) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Semester Detail Table ── */}
      <div className="border bg-card rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="text-xs font-extrabold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> Semester-wise Result Summary
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-semibold text-left">
            <thead>
              <tr className="border-b bg-muted/30 text-[9px] uppercase font-black text-muted-foreground">
                <th className="px-4 py-3">Semester</th>
                <th className="px-4 py-3 text-center">Total Students</th>
                <th className="px-4 py-3 text-center">Passed</th>
                <th className="px-4 py-3 text-center">Failed</th>
                <th className="px-4 py-3 min-w-[160px]">Pass Rate</th>
                <th className="px-4 py-3 text-center">Avg CGPA</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {SEMESTER_DATA.map(s => {
                const passed = Math.round((s.pass / 100) * s.total);
                const failed = s.total - passed;
                const barColor = s.pass >= 92 ? 'bg-emerald-500' : s.pass >= 89 ? 'bg-sky-500' : 'bg-amber-500';
                const statusColor = s.pass >= 92 ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : s.pass >= 89 ? 'bg-sky-50 text-sky-600 border-sky-200'
                  : 'bg-amber-50 text-amber-600 border-amber-200';
                return (
                  <tr key={s.sem} className="border-b last:border-b-0 hover:bg-muted/10">
                    <td className="px-4 py-3 font-bold">{s.sem}</td>
                    <td className="px-4 py-3 text-center">{s.total}</td>
                    <td className="px-4 py-3 text-center font-black text-emerald-600">{passed}</td>
                    <td className="px-4 py-3 text-center font-black text-rose-600">{failed}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden min-w-[80px]">
                          <div className={`${barColor} h-full rounded-full`} style={{ width: `${s.pass}%` }} />
                        </div>
                        <span className="font-black text-[11px] w-10">{s.pass}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-black">{s.avg_cgpa}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`border px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${statusColor}`}>
                        {s.pass >= 92 ? 'Excellent' : s.pass >= 89 ? 'Good' : 'Average'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AcademicPerformance;
