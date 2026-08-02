import React, { useState, useEffect } from 'react';
import { AlertTriangle, Download, RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';

export const HodAttendanceWorkspace: React.FC = () => {
  const { showToast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/hod/attendance');
      setData(res.data?.data || null);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to load attendance monitoring data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const critical = data?.criticalList || [];
  const shortage = data?.shortageList || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-rose-600" /> Department Attendance Shortage Monitor
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time tracking of students below 75% warning and 65% critical attendance thresholds.
          </p>
        </div>
        <button onClick={fetchAttendance} className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div className="text-xs font-semibold text-slate-400">Total Enrolled Students</div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">{data?.totalStudents || 0}</div>
        </div>
        <div className="p-5 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-900">
          <div className="text-xs font-semibold text-amber-800 dark:text-amber-300">Warning Shortage (&lt;75%)</div>
          <div className="text-3xl font-black text-amber-800 dark:text-amber-300 mt-1">{data?.warningCount || 0}</div>
        </div>
        <div className="p-5 bg-rose-50 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-900">
          <div className="text-xs font-semibold text-rose-800 dark:text-rose-300">Critical Shortage (&lt;65%)</div>
          <div className="text-3xl font-black text-rose-800 dark:text-rose-300 mt-1">{data?.criticalCount || 0}</div>
        </div>
      </div>

      {/* Critical List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-4">
        <h3 className="text-base font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5" /> Critical Attendance Shortage Roster (&lt;65%)
        </h3>
        {critical.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-sm">No critical attendance shortages detected.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Admission No</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Section</th>
                  <th className="p-3">Mentor</th>
                  <th className="p-3">Classes (Present / Total)</th>
                  <th className="p-3">Attendance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {critical.map((st: any) => (
                  <tr key={st.id}>
                    <td className="p-3 font-mono font-semibold">{st.admissionNo}</td>
                    <td className="p-3 font-bold">{st.name}</td>
                    <td className="p-3">{st.semester} • Sec {st.section}</td>
                    <td className="p-3">{st.mentor}</td>
                    <td className="p-3 font-medium">{st.presentClasses} / {st.totalClasses}</td>
                    <td className="p-3 font-black text-rose-600">{st.attendancePct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HodAttendanceWorkspace;
