import React, { useState, useEffect } from 'react';
import api from '../../lib/axios';
import { Building2, Users, GraduationCap, Clock, AlertTriangle, BarChart3, Plus, ShieldCheck } from 'lucide-react';

export const DeanDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'HIGH',
    dueDate: '',
    departmentId: '',
    assigneeIds: [],
  });

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/enterprise/dean/dashboard');
      if (res.data?.status === 'success') {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load Dean dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-400 bg-slate-900 min-h-screen">Loading Executive Dean Workspace...</div>;
  }

  const stats = data?.overviewStats;
  const comparisons = data?.departmentComparison || [];

  return (
    <div className="p-6 space-y-6 bg-slate-900 text-slate-100 min-h-screen">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" /> Executive Monitoring Center ({data?.executiveRole})
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">
            College-Wide Department Comparison & Task Delegation
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Realtime academic, administrative, and compliance metrics</p>
        </div>
      </div>

      {/* Top Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/80 flex items-center gap-3">
          <div className="p-3 bg-blue-500/20 text-blue-400 rounded-lg"><Building2 className="w-5 h-5" /></div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Departments</span>
            <h3 className="text-xl font-bold text-white">{stats?.totalDepartments}</h3>
          </div>
        </div>

        <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/80 flex items-center gap-3">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-lg"><GraduationCap className="w-5 h-5" /></div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Total Students</span>
            <h3 className="text-xl font-bold text-white">{stats?.totalStudents}</h3>
          </div>
        </div>

        <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/80 flex items-center gap-3">
          <div className="p-3 bg-purple-500/20 text-purple-400 rounded-lg"><Users className="w-5 h-5" /></div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Total Faculty</span>
            <h3 className="text-xl font-bold text-white">{stats?.totalFaculty}</h3>
          </div>
        </div>

        <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/80 flex items-center gap-3">
          <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-lg"><Clock className="w-5 h-5" /></div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Total Tasks</span>
            <h3 className="text-xl font-bold text-white">{stats?.totalTasks}</h3>
          </div>
        </div>

        <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/80 flex items-center gap-3">
          <div className="p-3 bg-rose-500/20 text-rose-400 rounded-lg"><AlertTriangle className="w-5 h-5" /></div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Overdue Tasks</span>
            <h3 className="text-xl font-bold text-rose-400">{stats?.overdueTasks}</h3>
          </div>
        </div>
      </div>

      {/* Department Comparison Matrix Table */}
      <div className="bg-slate-800/40 rounded-xl border border-slate-800 p-5 space-y-4">
        <h3 className="font-bold text-white text-base flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-400" /> Department Performance & Task Matrix
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4">Department</th>
                <th className="p-4">HOD</th>
                <th className="p-4">Faculty</th>
                <th className="p-4">Students</th>
                <th className="p-4">Total Tasks</th>
                <th className="p-4">Completion Rate</th>
                <th className="p-4">Overdue Work</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {comparisons.map((dept: any) => (
                <tr key={dept.id} className="hover:bg-slate-800/60 transition-colors">
                  <td className="p-4 font-bold text-slate-100 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: dept.color }} />
                    {dept.name} ({dept.code})
                  </td>
                  <td className="p-4">{dept.hodName || 'Unassigned'}</td>
                  <td className="p-4 font-semibold">{dept.facultyCount}</td>
                  <td className="p-4 font-semibold">{dept.studentCount}</td>
                  <td className="p-4 font-mono">{dept.totalTasks}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-2 rounded-full"
                          style={{ width: `${dept.completionRate}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-emerald-400">{dept.completionRate}%</span>
                    </div>
                  </td>
                  <td className="p-4">
                    {dept.overdueTasks > 0 ? (
                      <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-400 text-xs font-bold rounded-full border border-rose-500/30">
                        {dept.overdueTasks} Overdue
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">None</span>
                    )}
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
