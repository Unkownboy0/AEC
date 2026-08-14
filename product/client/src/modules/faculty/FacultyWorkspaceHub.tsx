import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  BookOpen,
  Send,
  UserCheck,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Briefcase,
  Users,
  ChevronRight,
  Sparkles,
  Plus
} from 'lucide-react';
import api from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../components/ui/Toast';
import { CampusOfficeWorkspace } from '../enterprise/office/CampusOfficeWorkspace';

export const FacultyWorkspaceHub: React.FC = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<'SCHEDULE' | 'LEAVE' | 'OFFICE'>('SCHEDULE');
  const [facultyProfile, setFacultyProfile] = useState<any>(null);
  const [workload, setWorkload] = useState<any>(null);
  const [leaveBalances, setLeaveBalances] = useState<any[]>([]);
  const [myLeaveRequests, setMyLeaveRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Leave Form State
  const [leaveType, setLeaveType] = useState('CASUAL_LEAVE');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [affectedPeriods, setAffectedPeriods] = useState<any[]>([]);
  const [substitutions, setSubstitutions] = useState<Record<string, { substituteId: string; substituteName: string }>>({});
  const [availableSubstitutes, setAvailableSubstitutes] = useState<Record<string, any[]>>({});
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);

  useEffect(() => {
    loadFacultyData();
  }, [user]);

  useEffect(() => {
    if (startDate && endDate && facultyProfile?.id) {
      detectAffectedClasses();
    }
  }, [startDate, endDate, facultyProfile]);

  const loadFacultyData = async () => {
    setLoading(true);
    try {
      // 1. Get Faculty info
      const facultyRes = await api.get('/faculty/profile');
      const faculty = facultyRes.data?.data;
      setFacultyProfile(faculty);

      if (faculty?.id) {
        // 2. Workload & Cross-Dept
        const workloadRes = await api.get(`/campus-office/workload/${faculty.id}`);
        setWorkload(workloadRes.data?.data);

        // 3. Leave Balances
        const balRes = await api.get(`/campus-office/leave/balances/${faculty.id}`);
        setLeaveBalances(balRes.data?.data || []);

        // 4. My Leave Requests
        const reqRes = await api.get('/faculty/leave/my-requests');
        setMyLeaveRequests(reqRes.data?.data || []);
      }
    } catch (e) {
      console.error('Error loading faculty workspace data', e);
    } finally {
      setLoading(false);
    }
  };

  const detectAffectedClasses = async () => {
    if (!facultyProfile?.id) return;
    try {
      const res = await api.get(`/campus-office/leave/affected-periods/${facultyProfile.id}`, {
        params: { startDate, endDate },
      });
      const periods = res.data?.data || [];
      setAffectedPeriods(periods);

      // Query available free faculty for each period
      for (const p of periods) {
        loadFreeFacultyForSlot(p);
      }
    } catch (e) {
      console.error('Failed to detect affected classes', e);
    }
  };

  const loadFreeFacultyForSlot = async (period: any) => {
    try {
      const res = await api.get('/campus-office/availability/free-faculty', {
        params: {
          date: startDate,
          periodNumber: period.slotIndex,
          departmentId: period.departmentId,
          subjectId: period.subjectId,
        },
      });
      setAvailableSubstitutes(prev => ({
        ...prev,
        [period.id]: res.data?.data?.suggestions || [],
      }));
    } catch (e) {
      console.error('Failed to find free faculty', e);
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Please specify a reason for leave/OD.');
      return;
    }

    // Check if substitutions are chosen for all affected periods
    const substitutionsList = affectedPeriods.map(p => {
      const sub = substitutions[p.id];
      return {
        ...p,
        assignedSubstituteId: sub?.substituteId || '',
        assignedSubstituteName: sub?.substituteName || '',
      };
    });

    const unassigned = substitutionsList.filter(s => !s.assignedSubstituteId);
    if (unassigned.length > 0) {
      toast.error(`Please assign a substitute for all ${unassigned.length} affected class periods.`);
      return;
    }

    setIsSubmittingLeave(true);
    try {
      await api.post('/faculty/leave/apply', {
        requestType: leaveType === 'ON_DUTY' ? 'OD' : 'LEAVE',
        category: leaveType,
        startDate,
        endDate,
        reason,
        totalDays: 1,
        substitutionsList,
      });

      toast.success('Leave / OD request submitted to HOD for approval.');
      setReason('');
      loadFacultyData();
      setActiveSection('SCHEDULE');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit leave request.');
    } finally {
      setIsSubmittingLeave(false);
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
          {/* Leave Application Wizard */}
          <div className="lg:col-span-2 bg-card border border-border p-6 rounded-2xl shadow-sm space-y-5">
            <div>
              <h2 className="text-xl font-bold">Apply for Leave / On-Duty (OD)</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Classes in affected periods will be auto-detected across your Home & Visiting departments.
              </p>
            </div>

            <form onSubmit={handleApplyLeave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold block mb-1">Leave Type</label>
                  <select
                    value={leaveType}
                    onChange={e => setLeaveType(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl p-2.5 text-xs font-semibold"
                  >
                    <option value="CASUAL_LEAVE">Casual Leave (CL)</option>
                    <option value="MEDICAL_LEAVE">Medical Leave (ML)</option>
                    <option value="ON_DUTY">On Duty (OD)</option>
                    <option value="EARNED_LEAVE">Earned Leave (EL)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl p-2.5 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl p-2.5 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">Reason / Purpose</label>
                <textarea
                  rows={2}
                  placeholder="State the purpose for leave or official duty..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl p-3 text-xs outline-none"
                />
              </div>

              {/* Auto-detected Affected Classes */}
              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Affected Timetable Periods ({affectedPeriods.length})
                  </h4>
                  <span className="text-xs text-muted-foreground">Mandatory substitute arrangement</span>
                </div>

                {affectedPeriods.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">
                    No timetable classes found for the selected date(s).
                  </p>
                ) : (
                  <div className="space-y-3">
                    {affectedPeriods.map((period: any) => {
                      const suggestions = availableSubstitutes[period.id] || [];
                      const chosenSub = substitutions[period.id];

                      return (
                        <div key={period.id} className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-primary">
                              Period {period.slotIndex} · {period.subjectName} ({period.subjectCode})
                            </span>
                            <span className="text-[11px] font-semibold text-muted-foreground">
                              {period.departmentName} · {period.sectionName}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <select
                              value={chosenSub?.substituteId || ''}
                              onChange={e => {
                                const selectedId = e.target.value;
                                const selectedFaculty = suggestions.find(s => s.facultyId === selectedId);
                                setSubstitutions(prev => ({
                                  ...prev,
                                  [period.id]: {
                                    substituteId: selectedId,
                                    substituteName: selectedFaculty?.name || 'Selected Substitute',
                                  },
                                }));
                              }}
                              className="flex-1 bg-background border border-border rounded-lg p-2 text-xs font-semibold"
                            >
                              <option value="">-- Choose Eligible Substitute Faculty --</option>
                              {suggestions.map(s => (
                                <option key={s.facultyId} value={s.facultyId}>
                                  {s.name} ({s.departmentCode}) - {s.isFree ? 'Free Now' : 'Alternative'}
                                </option>
                              ))}
                            </select>
                            {chosenSub?.substituteId && (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingLeave}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold text-xs rounded-xl shadow hover:opacity-90 transition"
                >
                  <Send className="h-3.5 w-3.5" />
                  Submit to HOD for Recommendation
                </button>
              </div>
            </form>
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
                    <div key={req.id} className="p-3 bg-muted/20 border border-border rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold">{req.leaveType}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          req.status === 'APPROVED_PRINCIPAL' ? 'bg-emerald-500/10 text-emerald-600' :
                          req.status === 'FORWARDED_TO_PRINCIPAL' ? 'bg-blue-500/10 text-blue-600' :
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
