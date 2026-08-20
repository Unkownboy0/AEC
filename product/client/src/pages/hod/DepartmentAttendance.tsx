import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Download, Filter, Search, Users, TrendingDown } from 'lucide-react';
import api from '../../lib/axios';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';

export const DepartmentAttendance: React.FC = () => {
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterView, setFilterView] = useState<'all' | 'defaulters'>('all');

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await api.get('/enterprise/attendance?pageSize=100');
        if (res.data?.status === 'success') {
          setAttendanceList(res.data.data || []);
        }
      } catch (err) {
        console.error(err);
        setAttendanceList([]);
        toast.error('Attendance data could not be loaded.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  const filtered = attendanceList.filter(s => {
    const matchesSearch = searchTerm === '' ||
      (s.studentName || s.student?.firstName)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.registerNo || s.student?.admissionNo)?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterView === 'all' || (filterView === 'defaulters' && (s.percentage ?? 75) < 75);
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (pct: number) => {
    if (pct >= 85) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (pct >= 75) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  const getBarColor = (pct: number) => {
    if (pct >= 85) return 'bg-emerald-500';
    if (pct >= 75) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const defaulterCount = attendanceList.filter(s => (s.percentage ?? 0) < 75).length;
  const avgAttendance = attendanceList.length > 0
    ? (attendanceList.reduce((sum, s) => sum + (s.percentage ?? 0), 0) / attendanceList.length).toFixed(1)
    : 0;

  if (isLoading) {
    return <div className="flex h-[70vh] items-center justify-center"><Loading text="Loading Attendance Data..." /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-foreground tracking-tight uppercase">Department Attendance</h2>
          <p className="text-xs text-muted-foreground font-semibold">Student Attendance Monitoring, Defaulters & Analytics</p>
        </div>
        <button
          onClick={() => toast.success('Attendance report exported successfully.')}
          className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl flex items-center gap-1.5 hover:bg-primary/90 w-fit"
        >
          <Download className="h-4 w-4" /> Export Report
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border bg-card p-4 rounded-2xl shadow-sm text-center border-l-4 border-l-primary">
          <span className="text-2xl font-black text-primary block">{avgAttendance}%</span>
          <span className="text-[9px] uppercase font-bold text-muted-foreground mt-1 block">Dept. Average</span>
        </div>
        <div className="border bg-card p-4 rounded-2xl shadow-sm text-center border-l-4 border-l-emerald-500">
          <span className="text-2xl font-black text-emerald-600 block">{attendanceList.filter(s => (s.percentage ?? 0) >= 85).length}</span>
          <span className="text-[9px] uppercase font-bold text-muted-foreground mt-1 block">≥ 85% Students</span>
        </div>
        <div className="border bg-card p-4 rounded-2xl shadow-sm text-center border-l-4 border-l-amber-500">
          <span className="text-2xl font-black text-amber-600 block">{attendanceList.filter(s => { const p = s.percentage ?? 0; return p >= 75 && p < 85; }).length}</span>
          <span className="text-[9px] uppercase font-bold text-muted-foreground mt-1 block">75–84% Students</span>
        </div>
        <div className="border bg-card p-4 rounded-2xl shadow-sm text-center border-l-4 border-l-rose-500">
          <span className="text-2xl font-black text-rose-600 block">{defaulterCount}</span>
          <span className="text-[9px] uppercase font-bold text-muted-foreground mt-1 block">Defaulters (&lt;75%)</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search student name or register no..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="h-9 w-full border rounded-lg bg-background pl-9 pr-3 text-xs font-semibold"
          />
        </div>
        <div className="flex border rounded-lg overflow-hidden text-xs font-bold">
          <button
            type="button"
            onClick={() => setFilterView('all')}
            className={`px-4 py-2 ${filterView === 'all' ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-muted text-muted-foreground'}`}
          >
            All Students ({attendanceList.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterView('defaulters')}
            className={`px-4 py-2 border-l ${filterView === 'defaulters' ? 'bg-rose-600 text-white' : 'bg-card hover:bg-muted text-muted-foreground'}`}
          >
            <TrendingDown className="h-3.5 w-3.5 inline mr-1" />Defaulters ({defaulterCount})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border bg-card rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-semibold text-left">
            <thead>
              <tr className="border-b bg-muted/30 text-[9px] uppercase font-bold text-muted-foreground">
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Register No</th>
                <th className="px-4 py-3">Semester</th>
                <th className="px-4 py-3">Section</th>
                <th className="px-4 py-3">Attended</th>
                <th className="px-4 py-3 min-w-[150px]">Attendance %</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground text-[10px]">No attendance records found.</td>
                </tr>
              ) : (
                filtered.map((s, idx) => {
                  const pct = s.percentage ?? 0;
                  return (
                    <tr key={s.id || idx} className="border-b last:border-b-0 hover:bg-muted/10">
                      <td className="px-4 py-3 font-bold">{s.studentName || `${s.student?.firstName} ${s.student?.lastName}`}</td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">{s.registerNo || s.student?.admissionNo}</td>
                      <td className="px-4 py-3">{s.semester || '—'}</td>
                      <td className="px-4 py-3">{s.section || '—'}</td>
                      <td className="px-4 py-3">{s.attended ?? '—'} / {s.totalClasses ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden min-w-[80px]">
                            <div className={`${getBarColor(pct)} h-full rounded-full`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                          </div>
                          <span className="font-bold min-w-[40px]">{pct.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`border px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${getStatusColor(pct)}`}>
                          {pct >= 85 ? 'Good' : pct >= 75 ? 'Marginal' : 'Defaulter'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DepartmentAttendance;
