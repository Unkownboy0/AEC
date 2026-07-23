import React, { useState } from 'react';
import { FileText, Download, BarChart2, Users, BookOpen, ClipboardList, TrendingUp } from 'lucide-react';
import { toast } from '../../components/ui/Toast';

type ReportType = 'attendance' | 'results' | 'faculty' | 'students';

const mockReports: Record<ReportType, any[]> = {
  attendance: [
    { title: 'Department Attendance Summary', period: 'June 2026', status: 'Ready', date: '2026-06-30' },
    { title: 'Low Attendance Defaulters List', period: 'June 2026', status: 'Ready', date: '2026-06-30' },
    { title: 'Class-wise Attendance Report', period: 'May 2026', status: 'Ready', date: '2026-05-31' },
  ],
  results: [
    { title: 'Internal Assessment Results', period: 'Semester 6', status: 'Ready', date: '2026-04-15' },
    { title: 'University Exam Result Analysis', period: 'Nov/Dec 2025', status: 'Ready', date: '2026-01-20' },
    { title: 'Pass/Fail Summary Report', period: 'Nov/Dec 2025', status: 'Ready', date: '2026-01-20' },
  ],
  faculty: [
    { title: 'Faculty Workload Report', period: 'Odd Semester 2025-26', status: 'Ready', date: '2026-01-10' },
    { title: 'Faculty Performance Summary', period: '2025-26', status: 'Ready', date: '2026-03-15' },
    { title: 'Faculty Attendance Submission Status', period: 'June 2026', status: 'Generating', date: '2026-06-30' },
  ],
  students: [
    { title: 'Student Directory Report', period: '2025-26', status: 'Ready', date: '2026-06-01' },
    { title: 'CGPA Performance Analysis', period: '2025-26', status: 'Ready', date: '2026-05-20' },
    { title: 'Backlog Students Report', period: 'Nov/Dec 2025', status: 'Ready', date: '2026-01-25' },
  ],
};

const categories = [
  { key: 'attendance' as ReportType, label: 'Attendance Reports', icon: ClipboardList, color: 'text-sky-600 bg-sky-50 border-sky-200' },
  { key: 'results' as ReportType, label: 'Result Reports', icon: BarChart2, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  { key: 'faculty' as ReportType, label: 'Faculty Reports', icon: Users, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { key: 'students' as ReportType, label: 'Student Reports', icon: BookOpen, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
];

export const DepartmentReports: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<ReportType>('attendance');

  const handleDownload = (format: 'PDF' | 'Excel', title: string) => {
    toast.success(`${title} exported as ${format}.`);
  };

  const reports = mockReports[activeCategory];

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <div>
        <h2 className="text-xl font-extrabold text-foreground tracking-tight uppercase">Reports & Analytics</h2>
        <p className="text-xs text-muted-foreground font-semibold">Department Reporting Center — Export Attendance, Results, Faculty & Student Reports</p>
      </div>

      {/* Summary KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map(cat => {
          const Icon = cat.icon;
          return (
            <div
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`border p-4 rounded-2xl shadow-sm cursor-pointer transition-all ${activeCategory === cat.key ? 'ring-2 ring-primary bg-card' : 'bg-card hover:shadow-md'}`}
            >
              <div className={`inline-flex items-center justify-center h-8 w-8 rounded-lg border mb-2 ${cat.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="block text-sm font-black">{mockReports[cat.key].length}</span>
              <span className="block text-[9px] uppercase font-bold text-muted-foreground mt-0.5">{cat.label}</span>
            </div>
          );
        })}
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setActiveCategory(cat.key)}
            className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${activeCategory === cat.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:bg-muted text-muted-foreground'}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {reports.map((report, idx) => (
          <div key={idx} className="border bg-card p-5 rounded-2xl shadow-sm hover:shadow-md transition-all space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h4 className="text-sm font-bold text-foreground leading-snug">{report.title}</h4>
                <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">{report.period}</p>
              </div>
              <FileText className="h-5 w-5 text-primary/60 shrink-0" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className={`border text-[9px] font-extrabold px-2 py-0.5 rounded uppercase ${report.status === 'Ready' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                  {report.status}
                </span>
                <span className="text-[9px] text-muted-foreground font-semibold">{report.date}</span>
              </div>
            </div>
            {report.status === 'Ready' && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleDownload('PDF', report.title)}
                  className="flex-1 py-1.5 border border-rose-200 bg-rose-50 text-rose-600 text-[10px] font-extrabold rounded-lg hover:bg-rose-100 flex items-center justify-center gap-1"
                >
                  <Download className="h-3 w-3" /> PDF
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload('Excel', report.title)}
                  className="flex-1 py-1.5 border border-emerald-200 bg-emerald-50 text-emerald-600 text-[10px] font-extrabold rounded-lg hover:bg-emerald-100 flex items-center justify-center gap-1"
                >
                  <Download className="h-3 w-3" /> Excel
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Analytics Summary */}
      <div className="border bg-card p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-extrabold uppercase">Quick Analytics Summary</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
          {[
            { label: 'Department Attendance', value: '83.4%', trend: '+2.1%', color: 'text-sky-600' },
            { label: 'Department Pass Rate', value: '91.2%', trend: '+4.5%', color: 'text-emerald-600' },
            { label: 'Avg Faculty Workload', value: '16 hrs/wk', trend: '—', color: 'text-amber-600' },
          ].map(item => (
            <div key={item.label} className="border rounded-xl p-4 space-y-1 bg-muted/20">
              <span className="text-[9px] uppercase font-bold text-muted-foreground">{item.label}</span>
              <span className={`text-xl font-black block ${item.color}`}>{item.value}</span>
              <span className="text-[9px] text-emerald-500 font-bold">{item.trend} from last month</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DepartmentReports;
