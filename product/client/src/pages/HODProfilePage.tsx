import React, { useState, useEffect } from 'react';
import api from '../lib/axios';
import { Shield, User, Building2, Users, GraduationCap, Clock, Award } from 'lucide-react';

export const HODProfilePage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHODProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/enterprise/hod/profile');
      if (res.data?.status === 'success') {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load HOD profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHODProfile();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-400 bg-slate-900 min-h-screen">Loading HOD Profile...</div>;
  }

  const user = data?.user;
  const prof = data?.facultyProfile;
  const stats = data?.departmentStats;

  return (
    <div className="p-6 space-y-6 bg-slate-900 text-slate-100 min-h-screen">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
          <Shield className="w-4 h-4" /> Head of Department Executive Profile
        </div>
        <h1 className="text-2xl font-bold text-white mt-1">
          {user?.firstName} {user?.lastName}
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">{prof?.designation} - {prof?.department?.name} ({prof?.department?.code})</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/80 flex items-center gap-4">
          <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-lg"><Users className="w-6 h-6" /></div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Faculty Members Managed</span>
            <h3 className="text-2xl font-bold text-white">{stats?.facultyCount}</h3>
          </div>
        </div>

        <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/80 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-lg"><GraduationCap className="w-6 h-6" /></div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Department Students</span>
            <h3 className="text-2xl font-bold text-white">{stats?.studentCount}</h3>
          </div>
        </div>

        <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/80 flex items-center gap-4">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-lg"><Clock className="w-6 h-6" /></div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Pending Approvals</span>
            <h3 className="text-2xl font-bold text-white">{stats?.pendingApprovals}</h3>
          </div>
        </div>
      </div>

      {/* Details Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-800/40 p-6 rounded-xl border border-slate-800">
        <div className="space-y-3 text-sm text-slate-300">
          <h3 className="font-bold text-white text-base border-b border-slate-700 pb-2">Academic & Experience</h3>
          <div><span className="text-slate-500">Employee ID:</span> {prof?.employeeId}</div>
          <div><span className="text-slate-500">Qualification:</span> {prof?.qualification}</div>
          <div><span className="text-slate-500">Experience:</span> {prof?.experience} Years</div>
          <div><span className="text-slate-500">Email:</span> {user?.email}</div>
        </div>

        <div className="space-y-3 text-sm text-slate-300">
          <h3 className="font-bold text-white text-base border-b border-slate-700 pb-2">Responsibilities</h3>
          <div>• Department Academic Leadership & Faculty Workload Allocation</div>
          <div>• Student Leave & OD Stage 2 Approval Authority</div>
          <div>• IQAC Self-Audit & Course Outcome Compliance Head</div>
        </div>
      </div>
    </div>
  );
};
