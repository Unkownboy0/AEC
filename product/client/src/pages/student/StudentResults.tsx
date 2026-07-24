import React, { useState } from 'react';
import { Award, BarChart2, CheckCircle2, Download, ExternalLink, Calendar, Search } from 'lucide-react';
import { toast } from '../../components/ui/Toast';

interface GradeRecord {
  code: string;
  name: string;
  internal: number;
  external: number;
  total: number;
  grade: string;
  credits: number;
  status: 'PASS' | 'FAIL';
}

const RESULTS_DATA: Record<string, GradeRecord[]> = {
  'Semester 5': [
    { code: 'CS5101', name: 'Computer Networks', internal: 38, external: 52, total: 90, grade: 'S', credits: 4, status: 'PASS' },
    { code: 'CS5102', name: 'Software Engineering', internal: 34, external: 48, total: 82, grade: 'A', credits: 3, status: 'PASS' },
    { code: 'CS5103', name: 'Theory of Computation', internal: 30, external: 42, total: 72, grade: 'B', credits: 4, status: 'PASS' },
    { code: 'CS5104', name: 'Artificial Intelligence', internal: 36, external: 50, total: 86, grade: 'A', credits: 3, status: 'PASS' }
  ],
  'Semester 4': [
    { code: 'CS4101', name: 'Computer Organization & Architecture', internal: 35, external: 45, total: 80, grade: 'A', credits: 4, status: 'PASS' },
    { code: 'CS4102', name: 'Object Oriented Programming', internal: 38, external: 54, total: 92, grade: 'S', credits: 4, status: 'PASS' }
  ]
};

export const StudentResults: React.FC = () => {
  const [selectedSem, setSelectedSem] = useState<string>('Semester 5');

  return (
    <div className="space-y-6 text-left pb-12 animate-in fade-in duration-200">
      
      {/* Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Award className="h-5 w-5 text-indigo-600" /> Academic Results & Transcripts
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Track CGPA trend lines, semester grade reports, and export official transcripts</p>
        </div>
        <button
          onClick={() => toast.info('Official digital transcript download started.')}
          className="px-3.5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow hover:bg-indigo-700 transition-all flex items-center gap-1.5"
        >
          <Download className="h-4 w-4" /> Download Official Transcript
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Cumulative GPA (CGPA)', value: '8.84 / 10.0', colorClass: 'text-indigo-600' },
          { label: 'Semester GPA (SGPA)', value: '8.92' },
          { label: 'Credits Earned', value: '94 / 160 Credits' },
          { label: 'Academic Standing', value: 'First Class Distinction', colorClass: 'text-emerald-600 font-extrabold' }
        ].map((card, idx) => (
          <div key={idx} className="border bg-card p-4 rounded-2xl shadow-sm">
            <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">{card.label}</p>
            <p className={`text-sm font-black mt-1 ${card.colorClass || 'text-slate-800 dark:text-white'}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* CGPA Trend SVG Chart & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Trend Line Chart */}
        <div className="lg:col-span-8 space-y-4">
          <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
              <BarChart2 className="h-4 w-4 text-indigo-600" /> CGPA Growth Trend
            </h3>
            
            <div className="w-full flex justify-center py-2">
              <svg className="w-full max-w-[500px]" viewBox="0 0 500 180" fill="none">
                {/* Grid helper lines */}
                <line x1="30" y1="20" x2="480" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="30" y1="70" x2="480" y2="70" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="30" y1="120" x2="480" y2="120" stroke="#f1f5f9" strokeWidth="1" />
                
                {/* Trend line path */}
                <path d="M 60 110 L 170 100 L 280 85 L 390 70" fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" />
                
                {/* Points */}
                {[
                  { sem: 'Sem 1', x: 60, y: 110, cgpa: '8.10' },
                  { sem: 'Sem 2', x: 170, y: 100, cgpa: '8.34' },
                  { sem: 'Sem 3', x: 280, y: 85, cgpa: '8.65' },
                  { sem: 'Sem 4', x: 390, y: 70, cgpa: '8.84' }
                ].map((pt, i) => (
                  <g key={i}>
                    <circle cx={pt.x} cy={pt.y} r="5" fill="#4f46e5" stroke="#ffffff" strokeWidth="2" />
                    <text x={pt.x} y="150" textAnchor="middle" fill="#94a3b8" fontSize="10" className="font-extrabold uppercase">{pt.sem}</text>
                    <text x={pt.x} y={pt.y - 10} textAnchor="middle" fill="#1e293b" fontSize="10" className="font-black">{pt.cgpa}</text>
                  </g>
                ))}
              </svg>
            </div>

          </div>
        </div>

        {/* Right Info Panels */}
        <div className="lg:col-span-4 space-y-6">
          <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-4 text-xs font-semibold text-slate-700">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Verification Authority</h3>
            <p className="text-slate-500 font-medium leading-relaxed">
              All digital marksheets and grade ledger details are digitally verified by the office of the Controller of Examinations and hashed for secure university ledger validation.
            </p>
          </div>
        </div>

      </div>

      {/* Grade Ledger list */}
      <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-4">
        
        {/* Semester Toggles */}
        <div className="flex border rounded-xl overflow-hidden text-xs font-bold w-fit bg-card">
          {Object.keys(RESULTS_DATA).map(sem => (
            <button
              key={sem}
              onClick={() => setSelectedSem(sem)}
              className={`px-4 py-2.5 border-r last:border-r-0 transition-colors ${
                selectedSem === sem
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:bg-muted'
              }`}
            >
              {sem}
            </button>
          ))}
        </div>

        {/* Table Ledger */}
        <div className="border rounded-2xl shadow-sm overflow-hidden bg-background">
          <table className="w-full border-collapse text-xs font-semibold">
            <thead>
              <tr className="border-b bg-muted/20 text-[9px] uppercase font-black text-slate-400 tracking-wider">
                <th className="p-4 text-left">Subject details</th>
                <th className="p-4 text-center">Credits</th>
                <th className="p-4 text-center">Internal (40)</th>
                <th className="p-4 text-center">External (60)</th>
                <th className="p-4 text-center">Total (100)</th>
                <th className="p-4 text-center">Letter Grade</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(RESULTS_DATA[selectedSem] || []).map((rec) => (
                <tr key={rec.code} className="hover:bg-muted/10 transition-colors">
                  <td className="p-4 text-left">
                    <span className="font-extrabold text-slate-800 dark:text-white block">{rec.name}</span>
                    <span className="text-[9px] font-mono text-slate-400 block mt-0.5">{rec.code}</span>
                  </td>
                  <td className="p-4 text-center font-bold text-slate-700">{rec.credits}</td>
                  <td className="p-4 text-center font-bold text-slate-700">{rec.internal}</td>
                  <td className="p-4 text-center font-bold text-slate-700">{rec.external}</td>
                  <td className="p-4 text-center font-extrabold text-slate-900">{rec.total}</td>
                  <td className="p-4 text-center font-mono font-black text-indigo-600">{rec.grade}</td>
                  <td className="p-4 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {rec.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};

export default StudentResults;
