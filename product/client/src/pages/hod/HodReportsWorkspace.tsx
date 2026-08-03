import React, { useState } from 'react';
import { Download, FileText, Users, UserCheck, AlertTriangle, RefreshCw } from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';

export const HodReportsWorkspace: React.FC = () => {
  const { showToast } = useToast();
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleExport = async (dataset: 'STUDENTS' | 'FACULTY' | 'LEAVES' | 'ATTENDANCE') => {
    try {
      setDownloading(dataset);
      const res = await api.get(`/hod/reports/export?dataset=${dataset}`);
      const data = res.data?.data || [];

      if (data.length === 0) {
        showToast('No records available for export', 'error');
        return;
      }

      const keys = Object.keys(data[0]);
      const headers = keys.join(',');
      const rows = data.map((item: any) =>
        keys.map(k => `"${String(item[k] ?? '').replace(/"/g, '""')}"`).join(',')
      );

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Department_${dataset}_Export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast(`Exported ${data.length} records successfully`, 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Export failed', 'error');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Download className="w-6 h-6 text-indigo-600" /> Department Reports & Export Studio
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Generate real-time filtered dataset exports in CSV/Excel formats for official record keeping.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { key: 'STUDENTS', title: 'Student Roster Report', desc: 'Complete list of department students with attendance % and assigned mentors.', icon: Users },
          { key: 'LEAVES', title: 'Leave & OD History', desc: 'Audit log of all student leave and on-duty requests with workflow decisions.', icon: FileText },
          { key: 'ATTENDANCE', title: 'Attendance Shortage List', desc: 'List of students falling below 75% and 65% threshold levels.', icon: AlertTriangle },
          { key: 'FACULTY', title: 'Faculty Workload Report', desc: 'Department faculty teaching loads, assigned subjects, and mentor capacities.', icon: UserCheck },
        ].map((r) => {
          const Icon = r.icon;
          const isExporting = downloading === r.key;

          return (
            <div key={r.key} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-xl w-fit">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">{r.title}</h3>
                <p className="text-xs text-slate-500">{r.desc}</p>
              </div>

              <button
                disabled={!!isExporting}
                onClick={() => handleExport(r.key as any)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2"
              >
                <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
                {isExporting ? 'Generating...' : 'Export Dataset CSV'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HodReportsWorkspace;
