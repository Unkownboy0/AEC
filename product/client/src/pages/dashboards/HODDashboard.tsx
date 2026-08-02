import React, { useState, useEffect } from 'react';
import api from '../../lib/axios';
import { Users, GraduationCap, UserCheck, Clock, FileText, CheckCircle2, Shield } from 'lucide-react';

export const HODDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'faculty' | 'students'>('overview');
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [studentList, setStudentList] = useState<any[]>([]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/enterprise/hod/dashboard');
      if (res.data?.status === 'success') {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load HOD dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFaculty = async () => {
    try {
      const res = await api.get('/enterprise/hod/faculty');
      if (res.data?.status === 'success') {
        setFacultyList(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load faculty:', err);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get('/enterprise/hod/students');
      if (res.data?.status === 'success') {
        setStudentList(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (activeTab === 'faculty') fetchFaculty();
    if (activeTab === 'students') fetchStudents();
  }, [activeTab]);

  if (loading) {
    return <div className="p-8 text-center text-slate-400 bg-slate-900 min-h-screen">Loading Department Workspace...</div>;
  }

  const dept = data?.department;
  const stats = data?.stats;

  return (
    <div className="p-6 space-y-6 bg-slate-900 text-slate-100 min-h-screen">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            <Shield className="w-4 h-4" /> HOD Department Workspace
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">
            {dept?.name} ({dept?.code})
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Head of Department: {dept?.hodName}</p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-800/80 p-1 rounded-lg border border-slate-700">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'overview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Department Overview
          </button>
          <button
            onClick={() => setActiveTab('faculty')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'faculty' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Faculty Directory
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'students' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Student Roster
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/80 flex items-center gap-4">
              <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-lg">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium">Active Faculty</span>
                <h3 className="text-2xl font-bold text-white">{stats?.facultyCount || 0}</h3>
              </div>
            </div>

            <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/80 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-lg">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium">Department Students</span>
                <h3 className="text-2xl font-bold text-white">{stats?.studentCount || 0}</h3>
              </div>
            </div>

            <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/80 flex items-center gap-4">
              <div className="p-3 bg-purple-500/20 text-purple-400 rounded-lg">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium">Assigned Mentors</span>
                <h3 className="text-2xl font-bold text-white">{stats?.mentorCount || 0}</h3>
              </div>
            </div>

            <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/80 flex items-center gap-4">
              <div className="p-3 bg-amber-500/20 text-amber-400 rounded-lg">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium">Pending HOD Approvals</span>
                <h3 className="text-2xl font-bold text-white">{stats?.pendingApprovals || 0}</h3>
              </div>
            </div>
          </div>

          {/* Department Tasks & Circulars */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-800 space-y-3">
              <h3 className="font-semibold text-white text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" /> Department Tasks & Actions
              </h3>
              <div className="space-y-2">
                {data?.recentTasks?.map((task: any) => (
                  <div key={task.id} className="p-3.5 bg-slate-900/80 rounded-lg border border-slate-700/60 space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-indigo-400">{task.taskNumber}</span>
                      <span className="text-slate-400">{task.status}</span>
                    </div>
                    <h4 className="font-semibold text-slate-100 text-sm">{task.title}</h4>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-800 space-y-3">
              <h3 className="font-semibold text-white text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" /> Department Circulars
              </h3>
              <div className="space-y-2">
                {data?.recentCirculars?.map((c: any) => (
                  <div key={c.id} className="p-3.5 bg-slate-900/80 rounded-lg border border-slate-700/60 space-y-1">
                    <span className="text-xs text-slate-400 font-mono">{c.category}</span>
                    <h4 className="font-semibold text-slate-100 text-sm">{c.title}</h4>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'faculty' && (
        <div className="bg-slate-800/40 rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4">Employee ID</th>
                <th className="p-4">Name</th>
                <th className="p-4">Designation</th>
                <th className="p-4">Email</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {facultyList.map((f) => (
                <tr key={f.id} className="hover:bg-slate-800/60">
                  <td className="p-4 font-mono text-xs text-indigo-400">{f.employeeId}</td>
                  <td className="p-4 font-semibold text-slate-100">{f.firstName} {f.lastName}</td>
                  <td className="p-4">{f.designation}</td>
                  <td className="p-4">{f.email}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 text-xs font-bold bg-emerald-500/20 text-emerald-400 rounded-full">
                      {f.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'students' && (
        <div className="bg-slate-800/40 rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4">Admission No</th>
                <th className="p-4">Student Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Assigned Mentor</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {studentList.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/60">
                  <td className="p-4 font-mono text-xs text-indigo-400">{s.admissionNo}</td>
                  <td className="p-4 font-semibold text-slate-100">{s.firstName} {s.lastName}</td>
                  <td className="p-4">{s.email}</td>
                  <td className="p-4 text-purple-400 font-medium">
                    {s.mentor ? `${s.mentor.firstName} ${s.mentor.lastName}` : 'Unassigned'}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 text-xs font-bold bg-emerald-500/20 text-emerald-400 rounded-full">
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
