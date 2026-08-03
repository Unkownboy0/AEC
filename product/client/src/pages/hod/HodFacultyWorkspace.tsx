import React, { useState, useEffect } from 'react';
import { UserCheck, BookOpen, Clock, RefreshCw, Award, CheckCircle2 } from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';

export const HodFacultyWorkspace: React.FC = () => {
  const { showToast } = useToast();
  const [faculty, setFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const res = await api.get('/hod/faculty');
      setFaculty(res.data?.data || []);
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Failed to load department faculty', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-emerald-600" /> Department Faculty Roster & Workload
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Monitor teaching workloads, assigned subjects, weekly hours, and mentor capacities.
          </p>
        </div>
        <button onClick={fetchFaculty} className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {faculty.map(f => (
          <div key={f.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono text-slate-400">{f.employeeId}</span>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">{f.name}</h3>
                <div className="text-xs text-indigo-600 font-semibold">{f.designation}</div>
              </div>
              {f.isOnLeave ? (
                <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-md text-[10px] font-bold">ON LEAVE</span>
              ) : (
                <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold">ACTIVE</span>
              )}
            </div>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span>Assigned Subjects:</span>
                <span className="font-bold">{f.subjectCount} Subjects</span>
              </div>
              <div className="flex justify-between">
                <span>Mentored Students:</span>
                <span className="font-bold">{f.mentoredStudentCount} Students</span>
              </div>
              <div className="flex justify-between">
                <span>Weekly Teaching Hours:</span>
                <span className="font-bold">{f.weeklyTeachingHours} Hours</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span>Workload Capacity</span>
                <span>{f.workloadPercentage}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full transition-all" style={{ width: `${f.workloadPercentage}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HodFacultyWorkspace;
