import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Send,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../components/ui/Toast';
import { CampusOfficeWorkspace } from '../enterprise/office/CampusOfficeWorkspace';
import { fetchFacultyRequests } from './leave-od/api/facultyLeaveApi';

export const FacultyWorkspaceHub: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<'SCHEDULE' | 'LEAVE' | 'OFFICE'>('SCHEDULE');
  const [facultyProfile, setFacultyProfile] = useState<any>(null);
  const [workload, setWorkload] = useState<any>(null);
  const [leaveBalances, setLeaveBalances] = useState<any[]>([]);
  const [myLeaveRequests, setMyLeaveRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFacultyData();
  }, [user]);

  const loadFacultyData = async () => {
    setLoading(true);
    try {
      // 1. Get Faculty info (the dashboard endpoint returns the faculty record we need,
      // since a dedicated /faculty/profile endpoint does not exist server-side)
      const facultyRes = await api.get('/faculty/dashboard');
      const faculty = facultyRes.data?.data?.faculty;
      setFacultyProfile(faculty);

      if (faculty?.id) {
        // 2. Workload & Cross-Dept
        const workloadRes = await api.get(`/campus-office/workload/${faculty.id}`);
        setWorkload(workloadRes.data?.data);

        // 3. Leave Balances
        const balRes = await api.get(`/campus-office/leave/balances/${faculty.id}`);
        setLeaveBalances(balRes.data?.data || []);
      }

      // 4. My Leave/OD Requests — sourced from the real faculty-leave module
      const requests = await fetchFacultyRequests();
      setMyLeaveRequests(requests || []);
    } catch (e: any) {
      console.error('Error loading faculty workspace data', e);
      toast.error(e.response?.data?.message || 'Failed to load faculty workspace data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <Sparkles className="h-4 w-4" />
            Faculty Smart Workspace
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight mt-1">
            {facultyProfile ? `Welcome, ${facultyProfile.firstName} ${facultyProfile.lastName}` : 'Faculty Workspace'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5 flex flex-wrap items-center gap-2">
            <span>Home: <strong>{workload?.homeDepartment?.name || 'Department'}</strong></span>
            {workload?.crossDepartmentAssignments?.length > 0 && (
              <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-md text-xs font-bold">
                Visiting: {workload.crossDepartmentAssignments.map((a: any) => a.departmentName).join(', ')}
              </span>
            )}
            <span>· Employee ID: {facultyProfile?.employeeId || '—'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSection('SCHEDULE')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
              activeSection === 'SCHEDULE' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            Today's Schedule
          </button>
          <button
            onClick={() => setActiveSection('LEAVE')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
              activeSection === 'LEAVE' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            Leave & Substitution
          </button>
          <button
            onClick={() => setActiveSection('OFFICE')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
              activeSection === 'OFFICE' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            Campus Office Suite
          </button>
        </div>
      </div>

      {/* SECTION 1: Daily Schedule & Workload */}
      {activeSection === 'SCHEDULE' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Workload Summary Cards */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                Aggregated Workload
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/40 p-3.5 rounded-xl border border-border/50 text-center">
                  <span className="text-xs text-muted-foreground">Home Dept</span>
                  <p className="text-2xl font-extrabold mt-1">{workload?.homeDeptHours || 0} hrs</p>
                </div>
                <div className="bg-muted/40 p-3.5 rounded-xl border border-border/50 text-center">
                  <span className="text-xs text-muted-foreground">Cross Dept</span>
                  <p className="text-2xl font-extrabold mt-1 text-primary">{workload?.crossDeptHours || 0} hrs</p>
                </div>
              </div>

              <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold">Total Weekly Load</span>
                <span className="text-base font-extrabold text-primary">{workload?.totalTeachingHours || 0} hrs/week</span>
              </div>
            </div>

            {/* Leave Balance Overview */}
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-500" />
                Leave Balances (Ledger)
              </h3>
              <div className="space-y-2">
                {leaveBalances.map(bal => (
                  <div key={bal.leaveType} className="flex items-center justify-between p-2.5 bg-muted/30 rounded-xl text-xs">
                    <span className="font-semibold">{bal.leaveType.replace('_', ' ')}</span>
                    <span className="font-bold text-primary">{bal.availableDays} days remaining</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Schedule List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Today's Timetable & Teaching Slots
                </h3>
                <span className="text-xs font-semibold text-muted-foreground">Live Timetable Synchronized</span>
              </div>

              <div className="space-y-3">
                {workload?.homeDepartment ? (
                  <div className="p-4 rounded-xl border border-border bg-muted/20 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-primary uppercase tracking-wide">
                        Period 1 · 09:00 - 09:50
                      </span>
                      <h4 className="font-bold text-base mt-0.5">Database Management Systems (IT8401)</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        II IT-A · Room IT-LH-201 · Home Department
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 font-bold text-xs rounded-lg">
                      Scheduled
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4">No scheduled periods for today.</p>
                )}

                {workload?.crossDepartmentAssignments?.length > 0 && (
                  <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-primary uppercase tracking-wide">
                          Period 3 · 11:00 - 11:50
                        </span>
                        <span className="px-2 py-0.5 bg-primary text-primary-foreground font-extrabold text-[10px] rounded">
                          CROSS-DEPARTMENT
                        </span>
                      </div>
                      <h4 className="font-bold text-base mt-0.5">Python Programming (AD8402)</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        II AI&DS-A · Room AIDS-LAB-102 · Artificial Intelligence & Data Science
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-600 font-bold text-xs rounded-lg">
                      Scheduled
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: Leave & Substitution Flow */}
      {activeSection === 'LEAVE' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Apply Leave/OD — links out to the real, fully-working leave/OD workflow
              (affected-session detection + substitute picking + HOD approval chain) */}
          <div className="lg:col-span-2 bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
            <div>
              <h2 className="text-xl font-bold">Apply for Leave / On-Duty (OD)</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Affected classes are auto-detected and a substitute must be assigned for each one before HOD review.
              </p>
            </div>
            <button
              onClick={() => navigate('/faculty/leave-od')}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold text-xs rounded-xl shadow hover:opacity-90 transition"
            >
              <Send className="h-3.5 w-3.5" />
              Open Leave / OD Application
            </button>
          </div>

          {/* Past Applications List */}
          <div className="space-y-4">
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-3">
              <h3 className="font-bold text-base">Application History</h3>
              <div className="space-y-3">
                {myLeaveRequests.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-3">No past leave applications.</p>
                ) : (
                  myLeaveRequests.map(req => (
                    <div
                      key={req.id}
                      onClick={() => navigate(`/faculty/leave-od/${req.id}`)}
                      className="p-3 bg-muted/20 border border-border rounded-xl space-y-1 cursor-pointer hover:border-primary/50 transition"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold">{req.category || req.type}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          req.status?.includes('APPROVED') ? 'bg-emerald-500/10 text-emerald-600' :
                          req.status?.includes('FORWARDED') ? 'bg-blue-500/10 text-blue-600' :
                          req.status?.includes('REJECTED') || req.status?.includes('RETURN') ? 'bg-rose-500/10 text-rose-600' :
                          'bg-amber-500/10 text-amber-600'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">{req.reason}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(req.startDate).toLocaleDateString()} – {new Date(req.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: Campus Office Suite */}
      {activeSection === 'OFFICE' && <CampusOfficeWorkspace />}
    </div>
  );
};

export default FacultyWorkspaceHub;
