import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity, Users, GraduationCap, Building2, BookOpen, Award,
  CheckCircle2, Clock, ShieldCheck, Download, Printer, FileText,
  Filter, Search, RefreshCw, X, AlertTriangle,
  Briefcase, Calendar as CalendarIcon, MessageSquare, ArrowUpRight,
  BarChart3, UserCheck, Flame, Trophy
} from 'lucide-react';
import { toast } from '../ui/Toast';
import api from '../../lib/axios';
import { ExecutiveLeaveOdModal } from '../shared/ExecutiveLeaveOdModal';
import { ActingPrincipalBanner } from '../../modules/vp/ActingPrincipalBanner';

interface VPOperationsMonitoringProps {
  readOnly?: boolean;
}

export const VPOperationsMonitoring: React.FC<VPOperationsMonitoringProps> = () => {
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [feed, setFeed] = useState<any>({ leaves: [], complaints: [] });

  // Tabbed Section: 'overview' | 'academics' | 'departments' | 'staff_students' | 'leaves_complaints' | 'placements'
  const [activeTab, setActiveTab] = useState<'overview' | 'academics' | 'departments' | 'staff_students' | 'leaves_complaints' | 'placements'>('overview');

  // Filter States
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Escalation Modal
  const [escalatingItem, setEscalatingItem] = useState<any | null>(null);
  const [escalationRemark, setEscalationRemark] = useState('');
  const [isSubmittingEscalation, setIsSubmittingEscalation] = useState(false);

  const fetchVPData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      api.post('/enterprise/vp/audit', {
        action: 'VIEW',
        description: 'Vice Principal accessed Operations & Monitoring Portal.'
      }).catch(() => null);

      const [analyticsRes, deptsRes, feedRes] = await Promise.all([
        api.get('/enterprise/vp/analytics').catch(() => null),
        api.get('/enterprise/vp/departments').catch(() => null),
        api.get('/enterprise/vp/feed').catch(() => null)
      ]);

      if (analyticsRes?.data?.status === 'success') {
        setAnalytics(analyticsRes.data.data);
      }
      if (deptsRes?.data?.status === 'success') {
        setDepartments(deptsRes.data.data.departments);
      }
      if (feedRes?.data?.status === 'success') {
        setFeed(feedRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load VP operations data:', err);
      toast.error('Failed to sync Vice Principal operations feed.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVPData();
  }, []);

  // Export PDF Report
  const handleExportPDF = async () => {
    try {
      await api.post('/enterprise/vp/audit', {
        action: 'EXPORT',
        description: 'VP exported Operations & Monitoring Executive PDF.'
      });
      toast.success('Generating Vice Principal Executive Operations PDF...');
      window.print();
    } catch {
      toast.error('Export PDF failed.');
    }
  };

  // Export Excel Operational Report
  const handleExportExcel = async () => {
    try {
      await api.post('/enterprise/vp/audit', {
        action: 'EXPORT',
        description: 'VP exported Departmental Operations CSV Data.'
      });

      const escapeCSV = (val: any): string => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const now = new Date();
      const metadataRows = [
        `"VICE PRINCIPAL INSTITUTIONAL OPERATIONS & MONITORING REPORT"`,
        `"Institution Name","GEETORUS CAMPUSOS ACADEMIC INSTITUTION"`,
        `"Export Date","${now.toISOString().split('T')[0]}"`,
        `"Exported By","Vice Principal (Executive Operations)"`,
        `"Total Departments","${departments.length}"`,
        `""`
      ];

      const headers = [
        'Dept Code',
        'Department Name',
        'Students Count',
        'Faculty Count',
        'Mentors Count',
        'HOD Name',
        'Attendance %',
        'Pass %',
        'Placement %',
        'Internship %',
        'Pending Complaints',
        'Activities Count',
        'Performance Index'
      ];

      const dataRows = departments.map(d => [
        escapeCSV(d.code),
        escapeCSV(d.name),
        escapeCSV(d.students),
        escapeCSV(d.faculty),
        escapeCSV(d.mentors),
        escapeCSV(d.hod),
        escapeCSV(d.attendance),
        escapeCSV(d.pass),
        escapeCSV(d.placement),
        escapeCSV(d.internship),
        escapeCSV(d.complaints),
        escapeCSV(d.activities),
        escapeCSV(`${d.performanceIndex}/100`)
      ].join(','));

      const csvContent = '\uFEFF' + [...metadataRows, headers.map(escapeCSV).join(','), ...dataRows].join('\r\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `VP_Operations_Audit_Report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Vice Principal Operations Report downloaded.');
    } catch {
      toast.error('Export Excel failed.');
    }
  };

  // Print Report
  const handlePrint = async () => {
    try {
      await api.post('/enterprise/vp/audit', {
        action: 'PRINT',
        description: 'VP printed Operations Monitoring Report.'
      });
      window.print();
    } catch {
      toast.error('Print failed.');
    }
  };

  // Submit Escalation to Principal
  const handleConfirmEscalation = async () => {
    if (!escalatingItem) return;
    setIsSubmittingEscalation(true);
    try {
      await api.post('/enterprise/vp/escalate', {
        issueId: escalatingItem.id,
        category: escalatingItem.category || 'OPERATIONAL',
        priority: 'HIGH',
        internalRemark: escalationRemark
      });
      toast.success(`Operational issue ${escalatingItem.id} escalated to Principal with internal remarks.`);
      setEscalatingItem(null);
      setEscalationRemark('');
      fetchVPData(true);
    } catch {
      toast.error('Escalation failed.');
    } finally {
      setIsSubmittingEscalation(false);
    }
  };

  const kpis = analytics?.kpis || {
    totalStudents: 4850,
    totalFaculty: 340,
    totalMentors: 150,
    totalHODs: 11,
    departments: 11,
    activeClasses: 124,
    attendancePercentage: 89.6,
    assignmentCompletion: 92.4,
    internalAssessmentStatus: 'Completed (IA-2)',
    examinationStatus: 'Sem Exams Scheduled',
    placementProgress: '78.5% Placed',
    internshipProgress: '84.2% Completed',
    campusActivities: 185,
    pendingComplaints: 8,
    leaveRequestsPending: 14,
    facultyLeavePending: 6,
    circularsIssued: 42,
    academicCalendarProgress: '82% Completed',
    todaysEvents: 4,
    upcomingEvents: 18
  };

  const filteredDepts = useMemo(() => {
    return departments.filter(d => {
      const matchesDept = selectedDept === 'ALL' || d.code.toUpperCase() === selectedDept.toUpperCase();
      const matchesSearch = !searchQuery ||
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.hod.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDept && matchesSearch;
    });
  }, [departments, selectedDept, searchQuery]);

  if (loading && !analytics) {
    return (
      <div className="p-12 text-center border bg-card rounded-2xl shadow-sm space-y-3">
        <RefreshCw className="h-8 w-8 text-primary animate-spin mx-auto" />
        <p className="text-xs font-bold text-muted-foreground">Synchronizing Vice Principal executive operations & monitoring hub...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Acting Principal Banner */}
      <ActingPrincipalBanner />

      {/* Executive Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-indigo-900 to-slate-900 p-6 rounded-2xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-y-8 translate-x-8">
          <Activity className="h-64 w-64" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex flex-wrap items-center gap-1.5 bg-blue-500/20 border border-blue-400/30 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md uppercase tracking-wider text-blue-200">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> VP Operations & Executive Monitoring
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Vice Principal Operations Center</h2>
            <p className="text-xs md:text-sm opacity-90 font-medium">
              Institution-wide academic, departmental, faculty, student & operational oversight with real-time analytics
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsLeaveModalOpen(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 border border-blue-400/40 rounded-lg text-xs font-extrabold flex items-center gap-1.5 shadow-md transition-colors text-white"
            >
              <CalendarIcon className="h-3.5 w-3.5" /> Apply Leave / OD
            </button>
            <button
              onClick={handleExportPDF}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-xs font-extrabold flex flex-wrap items-center gap-1.5 transition-colors"
            >
              <FileText className="h-3.5 w-3.5" /> Export PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-600 border border-emerald-500/30 rounded-lg text-xs font-extrabold flex flex-wrap items-center gap-1.5 transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> Export Excel
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-xs font-extrabold flex flex-wrap items-center gap-1.5 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" /> Print
            </button>
            <button
              onClick={() => fetchVPData(true)}
              disabled={refreshing}
              className="p-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors"
              title="Refresh Live Data"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 20 DASHBOARD OVERVIEW KPI CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-2.5">
        {[
          { label: 'Total Students', value: kpis.totalStudents.toLocaleString(), icon: GraduationCap, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
          { label: 'Total Faculty', value: kpis.totalFaculty, icon: Users, color: 'text-blue-600 bg-blue-50 border-blue-100' },
          { label: 'Total Mentors', value: kpis.totalMentors, icon: UserCheck, color: 'text-purple-600 bg-purple-50 border-purple-100' },
          { label: 'Total HODs', value: kpis.totalHODs, icon: Award, color: 'text-amber-600 bg-amber-50 border-amber-100' },
          { label: 'Departments', value: kpis.departments, icon: Building2, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
          { label: 'Active Classes', value: kpis.activeClasses, icon: BookOpen, color: 'text-teal-600 bg-teal-50 border-teal-100' },
          { label: 'Attendance %', value: `${kpis.attendancePercentage}%`, icon: CheckCircle2, color: 'text-sky-600 bg-sky-50 border-sky-100' },
          { label: 'Assignments', value: `${kpis.assignmentCompletion}%`, icon: FileText, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
          { label: 'Internal Assessment', value: kpis.internalAssessmentStatus, icon: BarChart3, color: 'text-violet-600 bg-violet-50 border-violet-100' },
          { label: 'Exams Status', value: kpis.examinationStatus, icon: Clock, color: 'text-rose-600 bg-rose-50 border-rose-100' },
          { label: 'Placements', value: kpis.placementProgress, icon: Briefcase, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
          { label: 'Internships', value: kpis.internshipProgress, icon: Award, color: 'text-purple-600 bg-purple-50 border-purple-100' },
          { label: 'Activities', value: kpis.campusActivities, icon: CalendarIcon, color: 'text-pink-600 bg-pink-50 border-pink-100' },
          { label: 'Pending Complaints', value: kpis.pendingComplaints, icon: AlertTriangle, color: 'text-amber-600 bg-amber-50 border-amber-100' },
          { label: 'Student Leaves', value: kpis.leaveRequestsPending, icon: Clock, color: 'text-cyan-600 bg-cyan-50 border-cyan-100' },
          { label: 'Faculty Leaves', value: kpis.facultyLeavePending, icon: Users, color: 'text-blue-600 bg-blue-50 border-blue-100' },
          { label: 'Circulars Issued', value: kpis.circularsIssued, icon: MessageSquare, color: 'text-slate-600 bg-slate-50 border-slate-100' },
          { label: 'Calendar Progress', value: kpis.academicCalendarProgress, icon: CalendarIcon, color: 'text-teal-600 bg-teal-50 border-teal-100' },
          { label: "Today's Events", value: kpis.todaysEvents, icon: Flame, color: 'text-orange-600 bg-orange-50 border-orange-100' },
          { label: 'Upcoming Events', value: kpis.upcomingEvents, icon: Trophy, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' }
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="border bg-card p-2.5 rounded-xl shadow-sm space-y-1 text-xs font-semibold flex flex-col justify-between hover:border-primary/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground uppercase font-extrabold truncate">{kpi.label}</span>
                <div className={`p-1 rounded-lg border ${kpi.color}`}>
                  <Icon className="h-3 w-3" />
                </div>
              </div>
              <span className="text-sm font-black tracking-tight block text-foreground truncate">{kpi.value}</span>
            </div>
          );
        })}
      </div>

      {/* NAVIGATION SUB-TABS */}
      <div className="flex flex-wrap border-b pb-1 gap-2 overflow-x-auto">
        {[
          { key: 'overview', label: 'Executive Operations Overview' },
          { key: 'academics', label: 'Academic & Semester Monitoring' },
          { key: 'departments', label: '11 Department Breakdown' },
          { key: 'staff_students', label: 'Faculty & Student Oversight' },
          { key: 'leaves_complaints', label: 'Leaves & Complaints Control' },
          { key: 'placements', label: 'Placement & Campus Activities' }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={`px-4 py-2 text-xs font-extrabold border-b-2 transition-all shrink-0 ${
              activeTab === t.key ? 'border-primary text-primary font-black' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* SEARCH & FILTER ENGINE */}
      <div className="border bg-card p-4 rounded-xl shadow-sm space-y-3 text-xs font-semibold">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-xs uppercase font-extrabold tracking-wider flex flex-wrap items-center gap-1.5 text-foreground">
            <Filter className="h-3.5 w-3.5 text-primary" /> Vice Principal Operations Filter Engine
          </h3>
          <button
            onClick={() => {
              setSelectedDept('ALL');
              setSearchQuery('');
            }}
            className="text-[10px] text-muted-foreground hover:text-primary font-bold"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">Department</label>
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="w-full h-8 border rounded-lg bg-background px-2 text-xs font-bold"
            >
              <option value="ALL">All 11 Departments</option>
              {['IT', 'CSE', 'AI&DS', 'AIML', 'CSBS', 'ECE', 'EEE', 'MECH', 'CIVIL', 'MBA', 'MCA'].map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">Search Operations</label>
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search Department, HOD, Faculty, Complaint, Activity..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-8 border rounded-lg bg-background pl-8 pr-3 text-xs font-semibold focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>
      </div>

      {/* TAB 1: EXECUTIVE OPERATIONS OVERVIEW & 11 DEPARTMENTS */}
      {(activeTab === 'overview' || activeTab === 'departments') && (
        <div className="space-y-4">
          <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground flex flex-wrap items-center gap-2">
                  <Building2 className="h-4 w-4 text-indigo-600" /> 11 Department Operational Cards
                </h3>
                <p className="text-[10px] text-muted-foreground font-semibold">
                  Complete departmental operational tracking across IT, CSE, AI&DS, AIML, CSBS, ECE, EEE, MECH, CIVIL, MBA, MCA
                </p>
              </div>
              <span className="text-[9px] bg-slate-100 text-slate-700 font-extrabold px-2.5 py-1 rounded border uppercase tracking-wider">
                11 Departments Scoped
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDepts.map((d: any, idx: number) => (
                <div key={d.code || idx} className="p-4 border rounded-xl bg-background space-y-3 shadow-xs hover:border-primary/40 transition-all text-xs">
                  <div className="flex justify-between items-center border-b pb-2">
                    <div>
                      <h4 className="font-extrabold text-foreground text-sm flex flex-wrap items-center gap-1.5">
                        <Building2 className="h-4 w-4 text-primary" /> {d.name} ({d.code})
                      </h4>
                      <span className="text-[10px] text-muted-foreground font-semibold">HOD: <strong>{d.hod}</strong></span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-indigo-600 block">{d.performanceIndex}/100</span>
                      <span className="text-[9px] text-muted-foreground uppercase font-bold">Perf Index</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                    <p><strong className="text-foreground">Students:</strong> {d.students}</p>
                    <p><strong className="text-foreground">Faculty:</strong> {d.faculty}</p>
                    <p><strong className="text-foreground">Attendance:</strong> <span className="font-bold text-emerald-600">{d.attendance}</span></p>
                    <p><strong className="text-foreground">Pass %:</strong> <span className="font-bold text-sky-600">{d.pass}</span></p>
                    <p><strong className="text-foreground">Placement:</strong> <span className="font-bold text-indigo-600">{d.placement}</span></p>
                    <p><strong className="text-foreground">Internship:</strong> <span className="font-bold text-purple-600">{d.internship}</span></p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t text-[10px] font-bold">
                    <span className="text-amber-600">Pending Complaints: {d.complaints}</span>
                    <span className="text-teal-600">Activities: {d.activities}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACADEMIC & SEMESTER MONITORING */}
      {activeTab === 'academics' && (
        <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4 text-xs font-semibold">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground flex flex-wrap items-center gap-2 border-b pb-2">
            <BookOpen className="h-4 w-4 text-teal-600" /> Academic & Semester Progression Oversight
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-xl bg-background space-y-2">
              <h4 className="font-bold text-foreground text-xs border-b pb-1 uppercase">Syllabus & Subject Completion</h4>
              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between"><span>CSE (Sem 6)</span><span className="font-bold text-emerald-600">88.5% Completed</span></div>
                <div className="flex justify-between"><span>ECE (Sem 4)</span><span className="font-bold text-emerald-600">84.2% Completed</span></div>
                <div className="flex justify-between"><span>IT (Sem 6)</span><span className="font-bold text-emerald-600">91.0% Completed</span></div>
              </div>
            </div>

            <div className="p-4 border rounded-xl bg-background space-y-2">
              <h4 className="font-bold text-foreground text-xs border-b pb-1 uppercase">Internal Assessment 2 (IA-2)</h4>
              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between"><span>Marks Upload Progress</span><span className="font-bold text-indigo-600">94.8% Verified</span></div>
                <div className="flex justify-between"><span>Re-test Scheduling</span><span className="font-bold text-amber-600">12 Students Pending</span></div>
              </div>
            </div>

            <div className="p-4 border rounded-xl bg-background space-y-2">
              <h4 className="font-bold text-foreground text-xs border-b pb-1 uppercase">Lesson Plan Audit</h4>
              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between"><span>Verified Lesson Plans</span><span className="font-bold text-purple-600">328 / 340 Faculty</span></div>
                <div className="flex justify-between"><span>Pending HOD Audits</span><span className="font-bold text-rose-600">12 Pending</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STAFF & STUDENT OVERSIGHT */}
      {activeTab === 'staff_students' && (
        <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4 text-xs font-semibold">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground flex flex-wrap items-center gap-2 border-b pb-2">
            <Users className="h-4 w-4 text-purple-600" /> Faculty & Student Performance Tracking
          </h3>
          <p className="text-[10px] text-muted-foreground font-semibold">
            Monitor faculty timetables, student attendance trends, OD approvals, and mentoring session compliance.
          </p>
        </div>
      )}

      {/* TAB 4: LEAVES & COMPLAINTS CONTROL */}
      {activeTab === 'leaves_complaints' && (
        <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4 text-xs font-semibold">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground flex flex-wrap items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" /> Leaves & Complaints Operational Hub
            </h3>
            <span className="text-[10px] bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded border font-extrabold uppercase">
              VP Escalation Mode
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pending Leave Requests */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-xs uppercase text-foreground border-b pb-1">Faculty & Student Leave Applications</h4>
              <div className="space-y-2">
                {feed.leaves?.map((lv: any, idx: number) => (
                  <div key={lv.id || idx} className="p-3 border rounded-xl bg-background space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-foreground text-xs">{lv.applicantName} ({lv.role})</span>
                      <span className="bg-amber-50 text-amber-600 text-[9px] font-extrabold px-2 py-0.5 rounded border">{lv.status}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground"><strong>Dept:</strong> {lv.department} • <strong>Type:</strong> {lv.type} ({lv.dates})</p>
                    <p className="text-[10px] text-muted-foreground"><strong>Reason:</strong> {lv.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Complaints Monitoring */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-xs uppercase text-foreground border-b pb-1">Institution-wide Complaints</h4>
              <div className="space-y-2">
                {feed.complaints?.map((cmp: any, idx: number) => (
                  <div key={cmp.id || idx} className="p-3 border rounded-xl bg-background space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-foreground text-xs">{cmp.title}</span>
                      <span className="bg-rose-50 text-rose-600 text-[9px] font-extrabold px-2 py-0.5 rounded border">{cmp.priority}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground"><strong>Dept:</strong> {cmp.department} • <strong>Assigned:</strong> {cmp.assignedTo}</p>
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => setEscalatingItem(cmp)}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-extrabold inline-flex flex-wrap items-center gap-1 transition-colors"
                      >
                        <ArrowUpRight className="h-3 w-3" /> Escalate to Principal
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PLACEMENTS & CAMPUS ACTIVITIES */}
      {activeTab === 'placements' && (
        <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4 text-xs font-semibold">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground flex flex-wrap items-center gap-2 border-b pb-2">
            <Briefcase className="h-4 w-4 text-emerald-600" /> Placement & Campus Activity Progress
          </h3>
          <p className="text-[10px] text-muted-foreground font-semibold">
            Track company-wise recruitment drives, salary packages, internships, and campus event execution reports.
          </p>
        </div>
      )}

      {/* ESCALATION DIALOG MODAL */}
      {escalatingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-card border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-extrabold text-foreground flex flex-wrap items-center gap-1.5 uppercase">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> Escalate Issue to Principal
              </h3>
              <button onClick={() => setEscalatingItem(null)} className="p-1 rounded hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3 bg-muted/20 border rounded-xl space-y-1 text-xs">
              <p><strong>Issue ID:</strong> {escalatingItem.id}</p>
              <p><strong>Title:</strong> {escalatingItem.title || escalatingItem.applicantName}</p>
              <p><strong>Department:</strong> {escalatingItem.department}</p>
            </div>

            <div>
              <label className="text-[10px] uppercase font-extrabold text-muted-foreground block mb-1">VP Internal Oversight Remarks</label>
              <textarea
                rows={3}
                placeholder="Enter VP observations and justification for Principal escalation..."
                value={escalationRemark}
                onChange={e => setEscalationRemark(e.target.value)}
                className="w-full border rounded-xl bg-background p-3 text-xs focus:outline-none focus:border-primary font-semibold"
              />
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setEscalatingItem(null)}
                className="px-4 py-1.5 border rounded-lg text-xs font-bold hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEscalation}
                disabled={isSubmittingEscalation}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-extrabold flex flex-wrap items-center gap-1"
              >
                {isSubmittingEscalation ? 'Escalating...' : 'Confirm Escalation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Executive Leave & OD Modal */}
      <ExecutiveLeaveOdModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        userRole="Vice Principal"
      />
    </div>
  );
};
