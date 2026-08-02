import React, { useEffect, useState } from 'react';
import { Activity, ShieldCheck, AlertCircle, Award, RefreshCw, ChevronRight } from 'lucide-react';
import api from '../../lib/axios';

export interface DepartmentHealth {
  id: string;
  name: string;
  code: string;
  score: number;
  statusLabel: 'Excellent' | 'Good' | 'Average' | 'Needs Attention' | 'Critical';
  attendanceRate: number;
  passPercentage: number;
  placementRate: number;
  facultyCount: number;
  studentCount: number;
  openComplaints: number;
  researchPublications: number;
}

export const DepartmentHealthScoreWidget: React.FC = () => {
  const [departments, setDepartments] = useState<DepartmentHealth[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHealthScores = async () => {
    setLoading(true);
    try {
      const res = await api.get('/enterprise/executive/health-scores');
      if (res.data?.status === 'success') {
        setDepartments(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthScores();
  }, []);

  const getStatusBadgeClass = (statusLabel: string) => {
    switch (statusLabel) {
      case 'Excellent': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Good': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Average': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Needs Attention': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'Critical': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Department Health Scores</h3>
            <p className="text-[11px] text-slate-400">Automated institutional composite health index</p>
          </div>
        </div>
        <button
          onClick={fetchHealthScores}
          className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-slate-500 animate-pulse">
          Calculating health scores across active departments...
        </div>
      ) : departments.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-500">No active departments found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <div key={dept.id} className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-300 font-bold text-xs rounded">
                    {dept.code}
                  </span>
                  <span className="text-xs font-semibold text-slate-200 truncate max-w-[140px]">{dept.name}</span>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${getStatusBadgeClass(dept.statusLabel)}`}>
                  {dept.statusLabel}
                </span>
              </div>

              {/* Progress bar */}
              <div className="my-3">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">Composite Score</span>
                  <span className="font-bold text-slate-200">{dept.score}/100</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      dept.score >= 85 ? 'bg-emerald-500' : dept.score >= 70 ? 'bg-indigo-500' : dept.score >= 55 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${dept.score}%` }}
                  />
                </div>
              </div>

              {/* Breakdown metrics */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/60 text-[10px]">
                <div>
                  <div className="text-slate-500">Attendance</div>
                  <div className="font-semibold text-slate-200">{dept.attendanceRate}%</div>
                </div>
                <div>
                  <div className="text-slate-500">Pass Rate</div>
                  <div className="font-semibold text-slate-200">{dept.passPercentage}%</div>
                </div>
                <div>
                  <div className="text-slate-500">Placements</div>
                  <div className="font-semibold text-slate-200">{dept.placementRate}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
