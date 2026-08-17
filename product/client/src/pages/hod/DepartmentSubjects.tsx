import React, { useState, useMemo } from 'react';
import {
  BookOpen, Search, Download, Printer, Users, CheckCircle,
  FlaskConical, LayoutGrid, BarChart2, ChevronDown, X
} from 'lucide-react';
import { saveBlobAndOpen } from '../../platform/download';

// ─── Realistic Dummy Data ──────────────────────────────────────────────────────
const DUMMY_SUBJECTS = [
  { id: '1',  code: 'CS301', name: 'Data Structures',                    semester: 'Semester 3', credits: 4, type: 'Theory', faculty: 'Dr. Ramesh K',      status: 'ACTIVE',   regulation: '2021', cos: 5 },
  { id: '2',  code: 'CS302', name: 'Database Management Systems',        semester: 'Semester 3', credits: 4, type: 'Theory', faculty: 'Mrs. Anitha S',     status: 'ACTIVE',   regulation: '2021', cos: 5 },
  { id: '3',  code: 'CS303', name: 'Operating Systems',                  semester: 'Semester 3', credits: 3, type: 'Theory', faculty: 'Dr. Karthik V',     status: 'ACTIVE',   regulation: '2021', cos: 4 },
  { id: '4',  code: 'CS304', name: 'Computer Networks',                  semester: 'Semester 4', credits: 4, type: 'Theory', faculty: 'Mr. Surya M',       status: 'ACTIVE',   regulation: '2021', cos: 5 },
  { id: '5',  code: 'CS305', name: 'Web Technologies',                   semester: 'Semester 4', credits: 3, type: 'Theory', faculty: 'Dr. Priya N',       status: 'ACTIVE',   regulation: '2021', cos: 4 },
  { id: '6',  code: 'CS306', name: 'Software Engineering',               semester: 'Semester 5', credits: 4, type: 'Theory', faculty: 'Mrs. Deepa R',      status: 'ACTIVE',   regulation: '2021', cos: 5 },
  { id: '7',  code: 'CS307', name: 'Artificial Intelligence',            semester: 'Semester 5', credits: 3, type: 'Theory', faculty: 'Dr. Vijay M',       status: 'ACTIVE',   regulation: '2021', cos: 4 },
  { id: '8',  code: 'CS308', name: 'Cloud Computing',                    semester: 'Semester 6', credits: 3, type: 'Theory', faculty: 'Mr. Naveen R',      status: 'ACTIVE',   regulation: '2021', cos: 4 },
  { id: '9',  code: 'CS309', name: 'Machine Learning',                   semester: 'Semester 6', credits: 3, type: 'Theory', faculty: 'Dr. Shalini T',     status: 'ACTIVE',   regulation: '2021', cos: 4 },
  { id: '10', code: 'CS310', name: 'Cyber Security',                     semester: 'Semester 6', credits: 3, type: 'Theory', faculty: 'Dr. Karthik V',     status: 'ACTIVE',   regulation: '2021', cos: 3 },
  { id: '11', code: 'CS311', name: 'Design and Analysis of Algorithms',  semester: 'Semester 5', credits: 4, type: 'Theory', faculty: 'Mrs. Anitha S',     status: 'ACTIVE',   regulation: '2021', cos: 5 },
  { id: '12', code: 'CS312', name: 'Compiler Design',                    semester: 'Semester 5', credits: 3, type: 'Theory', faculty: 'Mr. Vignesh P',     status: 'INACTIVE', regulation: '2021', cos: 3 },
  // Labs
  { id: '13', code: 'CS3L1', name: 'Data Structures Lab',                semester: 'Semester 3', credits: 2, type: 'Lab',    faculty: 'Dr. Ramesh K',      status: 'ACTIVE',   regulation: '2021', cos: 3 },
  { id: '14', code: 'CS3L2', name: 'DBMS Lab',                           semester: 'Semester 3', credits: 2, type: 'Lab',    faculty: 'Mrs. Anitha S',     status: 'ACTIVE',   regulation: '2021', cos: 3 },
  { id: '15', code: 'CS4L1', name: 'Networks Lab',                       semester: 'Semester 4', credits: 2, type: 'Lab',    faculty: 'Mr. Surya M',       status: 'ACTIVE',   regulation: '2021', cos: 3 },
  { id: '16', code: 'CS4L2', name: 'Web Technologies Lab',               semester: 'Semester 4', credits: 2, type: 'Lab',    faculty: 'Dr. Priya N',       status: 'ACTIVE',   regulation: '2021', cos: 3 },
  { id: '17', code: 'CS5L1', name: 'AI & ML Lab',                        semester: 'Semester 5', credits: 2, type: 'Lab',    faculty: 'Dr. Vijay M',       status: 'ACTIVE',   regulation: '2021', cos: 3 },
  { id: '18', code: 'CS6L1', name: 'Cloud & DevOps Lab',                 semester: 'Semester 6', credits: 2, type: 'Lab',    faculty: 'Mr. Naveen R',      status: 'ACTIVE',   regulation: '2021', cos: 3 },
  // Electives
  { id: '19', code: 'CSE01', name: 'Internet of Things',                 semester: 'Semester 6', credits: 3, type: 'Elective', faculty: 'Dr. Shalini T',   status: 'ACTIVE',   regulation: '2021', cos: 3 },
  { id: '20', code: 'CSE02', name: 'Blockchain Technology',              semester: 'Semester 6', credits: 3, type: 'Elective', faculty: 'Mr. Vignesh P',   status: 'ACTIVE',   regulation: '2021', cos: 3 },
];

const SEMESTERS = ['All Semesters', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6'];
const TYPES     = ['All Types', 'Theory', 'Lab', 'Elective'];

// ─── Type badge helper ─────────────────────────────────────────────────────────
const typeBadge = (t: string) => {
  if (t === 'Lab')     return 'bg-indigo-50 text-indigo-600 border-indigo-200';
  if (t === 'Elective') return 'bg-purple-50 text-purple-600 border-purple-200';
  return 'bg-sky-50 text-sky-600 border-sky-200';
};

// ─── Export CSV helper ─────────────────────────────────────────────────────────
const exportCSV = async (data: typeof DUMMY_SUBJECTS) => {
  const header = 'Code,Name,Semester,Credits,Type,Faculty,Status,Regulation\n';
  const rows   = data.map(s =>
    `${s.code},"${s.name}",${s.semester},${s.credits},${s.type},"${s.faculty}",${s.status},${s.regulation}`
  ).join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv' });
  await saveBlobAndOpen(blob, 'CampusOS_Department_Subjects.csv', 'text/csv');
};

// ──────────────────────────────────────────────────────────────────────────────
export const DepartmentSubjects: React.FC = () => {
  const [search,  setSearch]  = useState('');
  const [sem,     setSem]     = useState('All Semesters');
  const [type,    setType]    = useState('All Types');
  const [view,    setView]    = useState<'table' | 'cards'>('table');

  const filtered = useMemo(() => DUMMY_SUBJECTS.filter(s => {
    const q = search.toLowerCase();
    const matchQ   = !q || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.faculty.toLowerCase().includes(q);
    const matchSem = sem  === 'All Semesters' || s.semester === sem;
    const matchTyp = type === 'All Types'     || s.type     === type;
    return matchQ && matchSem && matchTyp;
  }), [search, sem, type]);

  // KPI counts
  const total    = DUMMY_SUBJECTS.length;
  const theory   = DUMMY_SUBJECTS.filter(s => s.type === 'Theory').length;
  const labs     = DUMMY_SUBJECTS.filter(s => s.type === 'Lab').length;
  const active   = DUMMY_SUBJECTS.filter(s => s.status === 'ACTIVE').length;
  const facCount = new Set(DUMMY_SUBJECTS.map(s => s.faculty)).size;

  // Credits total
  const totalCredits = DUMMY_SUBJECTS.filter(s => s.status === 'ACTIVE').reduce((a, s) => a + s.credits, 0);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight uppercase text-foreground">Department Subjects</h2>
          <p className="text-xs text-muted-foreground font-semibold mt-0.5">
            Subject Registry · Faculty Mapping · Credits · Course Outcomes
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => exportCSV(filtered)}
            className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="h-9 px-4 border bg-card hover:bg-muted text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Printer className="h-4 w-4" /> Print
          </button>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Subjects',    value: total,       color: 'border-l-primary',      textColor: 'text-primary' },
          { label: 'Theory Courses',    value: theory,      color: 'border-l-sky-500',       textColor: 'text-sky-600' },
          { label: 'Lab Courses',       value: labs,        color: 'border-l-indigo-500',    textColor: 'text-indigo-600' },
          { label: 'Active Subjects',   value: active,      color: 'border-l-emerald-500',   textColor: 'text-emerald-600' },
          { label: 'Faculty Assigned',  value: facCount,    color: 'border-l-amber-500',     textColor: 'text-amber-600' },
        ].map(kpi => (
          <div key={kpi.label} className={`border bg-card rounded-2xl p-4 text-center shadow-sm border-l-4 ${kpi.color}`}>
            <span className={`text-2xl font-black block ${kpi.textColor}`}>{kpi.value}</span>
            <span className="text-[9px] uppercase font-bold text-muted-foreground mt-1 block leading-tight">{kpi.label}</span>
          </div>
        ))}
      </div>

      {/* ── Semester Distribution Mini-Chart ── */}
      <div className="border bg-card p-5 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-extrabold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-primary" /> Subjects by Semester
          </h3>
          <span className="text-[9px] text-muted-foreground font-bold">{totalCredits} total credits (active)</span>
        </div>
        <div className="space-y-2.5">
          {['Semester 3', 'Semester 4', 'Semester 5', 'Semester 6'].map(s => {
            const semSubjects = DUMMY_SUBJECTS.filter(x => x.semester === s);
            const pct = Math.round((semSubjects.length / total) * 100);
            const semCredits = semSubjects.filter(x => x.status === 'ACTIVE').reduce((a, x) => a + x.credits, 0);
            return (
              <div key={s} className="flex items-center gap-3 text-xs font-semibold">
                <span className="w-24 shrink-0 text-muted-foreground">{s}</span>
                <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-16 text-right text-muted-foreground">
                  {semSubjects.length} subj · {semCredits}cr
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Filters + View Toggle ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search code, name or faculty…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-9 w-full border rounded-xl bg-background pl-9 pr-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Semester */}
        <div className="relative">
          <select
            value={sem}
            onChange={e => setSem(e.target.value)}
            className="h-9 border rounded-xl bg-background pl-3 pr-8 text-xs font-semibold appearance-none cursor-pointer"
          >
            {SEMESTERS.map(s => <option key={s}>{s}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        </div>

        {/* Type */}
        <div className="relative">
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="h-9 border rounded-xl bg-background pl-3 pr-8 text-xs font-semibold appearance-none cursor-pointer"
          >
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        </div>

        {/* View Toggle */}
        <div className="flex border rounded-xl overflow-hidden text-xs font-bold">
          <button
            type="button"
            onClick={() => setView('table')}
            className={`px-3 py-2 ${view === 'table' ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-muted text-muted-foreground'}`}
            title="Table view"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setView('cards')}
            className={`px-3 py-2 border-l ${view === 'cards' ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-muted text-muted-foreground'}`}
            title="Card view"
          >
            <BookOpen className="h-3.5 w-3.5" />
          </button>
        </div>

        <span className="text-[10px] text-muted-foreground font-semibold ml-auto">
          {filtered.length} of {total} subjects
        </span>
      </div>

      {/* ── Table View ── */}
      {view === 'table' && (
        <div className="border bg-card rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-semibold text-left">
              <thead>
                <tr className="border-b bg-muted/30 text-[9px] uppercase font-black text-muted-foreground tracking-wider">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3 min-w-[200px]">Subject Name</th>
                  <th className="px-4 py-3">Semester</th>
                  <th className="px-4 py-3 text-center">Credits</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Assigned Faculty</th>
                  <th className="px-4 py-3">Regulation</th>
                  <th className="px-4 py-3 text-center">COs</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, idx) => (
                  <tr
                    key={s.id}
                    className="border-b last:border-b-0 hover:bg-muted/10 transition-colors"
                  >
                    <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                    <td className="px-4 py-3 font-mono font-black text-primary">{s.code}</td>
                    <td className="px-4 py-3 font-bold">{s.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.semester}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-black text-foreground">{s.credits}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`border px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${typeBadge(s.type)}`}>
                        {s.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="h-6 w-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                          <span className="text-[8px] font-black text-primary">{s.faculty.split(' ').map(w => w[0]).join('').slice(0, 2)}</span>
                        </div>
                        <span>{s.faculty}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">{s.regulation}</td>
                    <td className="px-4 py-3 text-center font-bold">{s.cos}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`border px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                        s.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Card View ── */}
      {view === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(s => (
            <div key={s.id} className="border bg-card p-5 rounded-2xl shadow-sm hover:shadow-md transition-all space-y-3 group">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-black text-primary">{s.code}</span>
                  <h4 className="text-sm font-bold mt-0.5 leading-snug">{s.name}</h4>
                </div>
                <span className={`border px-2 py-0.5 rounded text-[9px] font-extrabold uppercase shrink-0 ml-2 ${typeBadge(s.type)}`}>
                  {s.type}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-muted-foreground">
                <div className="space-y-0.5">
                  <span className="text-[8px] uppercase font-bold">Semester</span>
                  <p className="text-foreground font-bold">{s.semester}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[8px] uppercase font-bold">Credits</span>
                  <p className="text-foreground font-black text-sm">{s.credits}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[8px] uppercase font-bold">Regulation</span>
                  <p className="text-foreground font-bold">{s.regulation}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[8px] uppercase font-bold">Course Outcomes</span>
                  <p className="text-foreground font-bold">CO1–CO{s.cos}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 border-t pt-3">
                <div className="h-7 w-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-[9px] font-black text-primary">{s.faculty.split(' ').map(w => w[0]).join('').slice(0, 2)}</span>
                </div>
                <span className="text-xs font-bold flex-1 truncate">{s.faculty}</span>
                <span className={`border px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                  s.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>{s.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DepartmentSubjects;
