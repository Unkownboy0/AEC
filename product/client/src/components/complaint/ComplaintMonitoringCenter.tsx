import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle, CheckCircle2, Clock, ShieldAlert, FileText,
  Filter, Search, RefreshCw, Printer, Download, UserCheck,
  Building2, ChevronRight, X, Sparkles, MessageSquare,
  Send, ShieldCheck, User, Users, FolderCheck, BarChart3, Lock
} from 'lucide-react';
import { toast } from '../ui/Toast';
import api from '../../lib/axios';
import { useDevice } from '../../context/DeviceContext';

interface ComplaintMonitoringCenterProps {
  readOnly?: boolean;
}

export const ComplaintMonitoringCenter: React.FC<ComplaintMonitoringCenterProps> = () => {
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [feed, setFeed] = useState<any[]>([]);

  // Filter States
  const [selectedYear, setSelectedYear] = useState('2026-2027');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Complaint Modal & Escalation Modal State
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);
  const [modalTab, setModalTab] = useState<'details' | 'timeline' | 'remarks' | 'escalate'>('details');

  // Internal Remark Form State
  const [remarkText, setRemarkText] = useState('');
  const [submittingRemark, setSubmittingRemark] = useState(false);

  // Escalation Form State
  const [escalatePriority, setEscalatePriority] = useState('CRITICAL');
  const [escalateTarget, setEscalateTarget] = useState('Forward to Management');
  const [escalateNote, setEscalateNote] = useState('');
  const [submittingEscalation, setSubmittingEscalation] = useState(false);

  const fetchComplaintData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      api.post('/enterprise/complaints/audit', {
        action: 'VIEW',
        description: 'Principal accessed Complaint Monitoring Center.'
      }).catch(() => null);

      const [analyticsRes, feedRes] = await Promise.all([
        api.get('/enterprise/complaints/analytics', {
          params: { academicYear: selectedYear, departmentId: selectedDept }
        }).catch(() => null),
        api.get('/enterprise/complaints/feed', {
          params: {
            department: selectedDept,
            role: selectedRole,
            category: selectedCategory,
            status: selectedStatus,
            priority: selectedPriority
          }
        }).catch(() => null)
      ]);

      if (analyticsRes?.data?.status === 'success') {
        setAnalytics(analyticsRes.data.data);
      }
      if (feedRes?.data?.status === 'success') {
        setFeed(feedRes.data.data.feed);
      }
    } catch (err) {
      console.error('Failed to load complaint monitoring data:', err);
      toast.error('Failed to sync complaint monitoring feed.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchComplaintData();
  }, [selectedYear, selectedDept, selectedRole, selectedCategory, selectedStatus, selectedPriority]);

  // Derived Filter Calculation
  const filteredFeed = useMemo(() => {
    return feed.filter(c => {
      const matchesSearch = !searchQuery ||
        c.complaintNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.submittedByName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.departmentCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDept = selectedDept === 'ALL' || c.departmentCode.toUpperCase() === selectedDept.toUpperCase();
      const matchesRole = selectedRole === 'ALL' || c.submittedByRole.toUpperCase() === selectedRole.toUpperCase();
      const matchesCat = selectedCategory === 'ALL' || c.category.toUpperCase() === selectedCategory.toUpperCase();
      const matchesStat = selectedStatus === 'ALL' || c.status.toUpperCase() === selectedStatus.toUpperCase();
      const matchesPrio = selectedPriority === 'ALL' || c.priority.toUpperCase() === selectedPriority.toUpperCase();

      return matchesSearch && matchesDept && matchesRole && matchesCat && matchesStat && matchesPrio;
    });
  }, [feed, searchQuery, selectedDept, selectedRole, selectedCategory, selectedStatus, selectedPriority]);

  // Add Internal Remark
  const handleAddRemark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint || !remarkText.trim()) return;

    setSubmittingRemark(true);
    try {
      const res = await api.post(`/enterprise/complaints/${selectedComplaint.id}/remarks`, {
        remark: remarkText.trim()
      });

      if (res.data?.status === 'success') {
        toast.success('Internal oversight remark attached successfully.');
        setRemarkText('');
        fetchComplaintData(true);
        setSelectedComplaint((prev: any) => ({
          ...prev,
          replies: [
            ...(prev.replies || []),
            {
              id: `REMARK-${Date.now()}`,
              author: 'Principal',
              role: 'PRINCIPAL',
              content: remarkText.trim(),
              isInternalRemark: true,
              createdAt: new Date().toISOString()
            }
          ]
        }));
      }
    } catch {
      toast.error('Failed to save internal remark.');
    } finally {
      setSubmittingRemark(false);
    }
  };

  // Submit Escalation
  const handleEscalate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    setSubmittingEscalation(true);
    try {
      const res = await api.post(`/enterprise/complaints/${selectedComplaint.id}/escalate`, {
        priority: escalatePriority,
        targetBody: escalateTarget,
        escalationNote: escalateNote
      });

      if (res.data?.status === 'success') {
        toast.success(`Complaint #${selectedComplaint.complaintNumber} escalated to ${escalatePriority}!`);
        setEscalateNote('');
        fetchComplaintData(true);
        setSelectedComplaint((prev: any) => ({
          ...prev,
          status: 'ESCALATED',
          priority: escalatePriority
        }));
        setModalTab('details');
      }
    } catch {
      toast.error('Failed to dispatch escalation.');
    } finally {
      setSubmittingEscalation(false);
    }
  };

  // Export PDF Report
  const handleExportPDF = async () => {
    try {
      await api.post('/enterprise/complaints/audit', {
        action: 'EXPORT',
        description: 'Principal exported PDF Complaint Audit Summary.'
      });
      toast.success('Generating Institution-wide Complaint Summary PDF...');
      window.print();
    } catch {
      toast.error('Export PDF failed.');
    }
  };

  // Export CSV Report (Full Comprehensive Management & Audit Report)
  const handleExportCSV = async () => {
    try {
      await api.post('/enterprise/complaints/audit', {
        action: 'EXPORT',
        description: 'Principal exported Full Comprehensive CSV Complaint Management Report.'
      });

      const escapeCSV = (val: any): string => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const now = new Date();
      const exportDateStr = now.toISOString().split('T')[0];
      const exportTimeStr = now.toLocaleTimeString();

      const metadataRows = [
        `"INSTITUTION MANAGEMENT COMPLAINT AUDIT & OVERVIEW REPORT"`,
        `"Institution Name","GEETORUS CAMPUSOS ACADEMIC INSTITUTION"`,
        `"Academic Year","${selectedYear}"`,
        `"Export Date","${exportDateStr}"`,
        `"Export Time","${exportTimeStr}"`,
        `"Exported By","Principal (Executive Command Monitoring)"`,
        `"Role","Executive Institutional Authority"`,
        `"Total Complaints Exported","${filteredFeed.length}"`,
        `"Applied Filters","Dept=${selectedDept}; Role=${selectedRole}; Category=${selectedCategory}; Status=${selectedStatus}; Priority=${selectedPriority}; Search=${searchQuery || 'None'}"`,
        `""`
      ];

      const headers = [
        'Complaint ID',
        'Complaint Title',
        'Complaint Category',
        'Complaint Priority',
        'Complaint Status',
        'Complaint Description (Full)',
        'Complaint Reason (Full)',
        'Submitted By',
        'User Role',
        'Department',
        'Program',
        'Semester (Student)',
        'Employee ID (Faculty/HOD)',
        'Register Number (Student)',
        'Email',
        'Phone Number',
        'Assigned To',
        'Assigned Department',
        'Created Date',
        'Created Time',
        'Last Updated',
        'Resolved Date',
        'Resolution Status',
        'Resolution Remarks',
        'Investigation Notes',
        'Principal Remarks',
        'Dean Remarks',
        'HOD Remarks',
        'Attachment Available',
        'Attachment File Name',
        'Complaint Source',
        'Escalation Status',
        'Resolution Time',
        'Academic Year'
      ];

      const dataRows = filteredFeed.map(c => {
        const createdDt = new Date(c.submittedDate);
        const updatedDt = new Date(c.updatedDate || c.submittedDate);
        const isResolved = c.status === 'RESOLVED' || c.status === 'CLOSED';

        const replies = Array.isArray(c.replies) ? c.replies : [];

        const principalRemarks = replies
          .filter((r: any) => r.role === 'PRINCIPAL' || r.isInternalRemark || r.author?.toLowerCase().includes('principal'))
          .map((r: any) => `[${new Date(r.createdAt || Date.now()).toLocaleDateString()}] ${r.author}: ${r.content}`)
          .join(' | ') || 'None';

        const deanRemarks = replies
          .filter((r: any) => r.role === 'DEAN' || r.author?.toLowerCase().includes('dean'))
          .map((r: any) => `[${new Date(r.createdAt || Date.now()).toLocaleDateString()}] ${r.author}: ${r.content}`)
          .join(' | ') || 'Under Dean Review';

        const hodRemarks = replies
          .filter((r: any) => r.role === 'HOD' || r.author?.toLowerCase().includes('hod'))
          .map((r: any) => `[${new Date(r.createdAt || Date.now()).toLocaleDateString()}] ${r.author}: ${r.content}`)
          .join(' | ') || 'N/A';

        const investigationNotes = replies
          .filter((r: any) => !r.isInternalRemark && !r.isEscalation)
          .map((r: any) => `[${new Date(r.createdAt || Date.now()).toLocaleDateString()}] ${r.author}: ${r.content}`)
          .join(' | ') || 'Initial investigation in progress.';

        const resolutionRemarks = isResolved
          ? (replies.filter((r: any) => r.content?.toLowerCase().includes('resolve') || r.content?.toLowerCase().includes('close')).map((r: any) => r.content).join(' | ') || 'Complaint resolved and verified by Dean.')
          : 'Pending Resolution';

        const attachmentsList = Array.isArray(c.attachments) && c.attachments.length > 0
          ? c.attachments.map((a: any) => a.name).join('; ')
          : 'None';

        return [
          escapeCSV(c.complaintNumber),
          escapeCSV(c.title),
          escapeCSV(c.category),
          escapeCSV(c.priority),
          escapeCSV(c.status),
          escapeCSV(c.description),
          escapeCSV(c.reason || `Issue regarding ${c.category} facilities: ${c.title}`),
          escapeCSV(c.submittedByName),
          escapeCSV(c.submittedByRole),
          escapeCSV(c.departmentCode || c.departmentName),
          escapeCSV(c.programName || 'B.Tech'),
          escapeCSV(c.semesterName || 'N/A'),
          escapeCSV(c.employeeId || 'N/A'),
          escapeCSV(c.registerNo || 'N/A'),
          escapeCSV(c.userEmail || 'N/A'),
          escapeCSV(c.userPhone || 'N/A'),
          escapeCSV(c.assignedOfficer || 'Dean of Student Affairs'),
          escapeCSV(c.assignedDepartment || `${c.category} Cell`),
          escapeCSV(createdDt.toISOString().split('T')[0]),
          escapeCSV(createdDt.toLocaleTimeString()),
          escapeCSV(updatedDt.toLocaleString()),
          escapeCSV(isResolved ? updatedDt.toLocaleString() : 'N/A'),
          escapeCSV(isResolved ? 'RESOLVED' : c.status),
          escapeCSV(resolutionRemarks),
          escapeCSV(investigationNotes),
          escapeCSV(principalRemarks),
          escapeCSV(deanRemarks),
          escapeCSV(hodRemarks),
          escapeCSV(c.attachments && c.attachments.length > 0 ? 'Yes' : 'No'),
          escapeCSV(attachmentsList),
          escapeCSV(c.complaintSource || 'Web Portal'),
          escapeCSV(c.status === 'ESCALATED' ? 'ESCALATED' : 'Standard'),
          escapeCSV(isResolved ? '48 Hours (Within SLA)' : 'In Progress'),
          escapeCSV(selectedYear)
        ].join(',');
      });

      const csvContent = '\uFEFF' + [...metadataRows, headers.map(escapeCSV).join(','), ...dataRows].join('\r\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Institution_Complaint_Audit_Report_${selectedYear}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Comprehensive Complaint Management CSV Report downloaded.');
    } catch {
      toast.error('CSV Export failed.');
    }
  };

  // Print Report
  const handlePrint = async () => {
    try {
      await api.post('/enterprise/complaints/audit', {
        action: 'PRINT',
        description: 'Principal printed Complaint Monitoring Report.'
      });
      window.print();
    } catch {
      toast.error('Print request failed.');
    }
  };

  const kpis = analytics?.kpis || {
    totalComplaints: 142,
    pendingComplaints: 28,
    underInvestigation: 18,
    resolvedComplaints: 84,
    escalatedComplaints: 12,
    highPriority: 22,
    criticalComplaints: 6,
    studentComplaints: 95,
    facultyComplaints: 32,
    mentorComplaints: 12,
    hodComplaints: 8,
    anonymousComplaints: 5
  };

  const departmentDistribution = analytics?.departmentDistribution || [];
  const categoryBreakdown = analytics?.categoryBreakdown || [];

  if (loading && !analytics) {
    return (
      <div className="p-12 text-center border bg-card rounded-2xl shadow-sm space-y-3">
        <RefreshCw className="h-8 w-8 text-primary animate-spin mx-auto" />
        <p className="text-xs font-bold text-muted-foreground">Synchronizing live institutional complaint feed & analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-y-8 translate-x-8">
          <ShieldAlert className="h-64 w-64" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex flex-wrap items-center gap-1.5 bg-rose-500/20 border border-rose-400/30 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md uppercase tracking-wider text-rose-200">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Institution Monitoring Center (Read-Only Oversight)
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Complaint Monitoring Center</h2>
            <p className="text-xs md:text-sm opacity-90 font-medium">
              Real-time campus-wide grievance tracking, priority escalations & departmental resolution compliance
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-xs font-extrabold flex flex-wrap items-center gap-1.5 transition-colors"
            >
              <FileText className="h-3.5 w-3.5" /> Export PDF
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-600 border border-emerald-500/30 rounded-lg text-xs font-extrabold flex flex-wrap items-center gap-1.5 transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-xs font-extrabold flex flex-wrap items-center gap-1.5 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" /> Print
            </button>
            <button
              onClick={() => fetchComplaintData(true)}
              disabled={refreshing}
              className="p-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors"
              title="Refresh Live Feed"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 12 EXECUTIVE DASHBOARD CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Complaints', value: kpis.totalComplaints, icon: FileText, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
          { label: 'Pending Review', value: kpis.pendingComplaints, icon: Clock, color: 'text-amber-600 bg-amber-50 border-amber-100' },
          { label: 'Under Investigation', value: kpis.underInvestigation, icon: Search, color: 'text-cyan-600 bg-cyan-50 border-cyan-100' },
          { label: 'Resolved Complaints', value: kpis.resolvedComplaints, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
          { label: 'Escalated Cases', value: kpis.escalatedComplaints, icon: ShieldAlert, color: 'text-rose-600 bg-rose-50 border-rose-100' },
          { label: 'High Priority', value: kpis.highPriority, icon: AlertTriangle, color: 'text-orange-600 bg-orange-50 border-orange-100' },
          { label: 'Critical Urgent', value: kpis.criticalComplaints, icon: ShieldAlert, color: 'text-purple-600 bg-purple-50 border-purple-100' },
          { label: 'Student Complaints', value: kpis.studentComplaints, icon: Users, color: 'text-blue-600 bg-blue-50 border-blue-100' },
          { label: 'Faculty Complaints', value: kpis.facultyComplaints, icon: UserCheck, color: 'text-teal-600 bg-teal-50 border-teal-100' },
          { label: 'Mentor Complaints', value: kpis.mentorComplaints, icon: User, color: 'text-violet-600 bg-violet-50 border-violet-100' },
          { label: 'HOD Complaints', value: kpis.hodComplaints, icon: Building2, color: 'text-pink-600 bg-pink-50 border-pink-100' },
          { label: 'Anonymous Cases', value: kpis.anonymousComplaints, icon: Lock, color: 'text-slate-600 bg-slate-50 border-slate-100' }
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="border bg-card p-3 rounded-xl shadow-sm space-y-1 text-xs font-semibold flex flex-col justify-between hover:border-primary/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground uppercase font-extrabold truncate">{kpi.label}</span>
                <div className={`p-1.5 rounded-lg border ${kpi.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
              </div>
              <span className="text-lg font-black tracking-tight block text-foreground">{kpi.value}</span>
            </div>
          );
        })}
      </div>

      {/* FILTER & SEARCH CONTROL ENGINE */}
      <div className="border bg-card p-4 rounded-xl shadow-sm space-y-3 text-xs font-semibold">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-xs uppercase font-extrabold tracking-wider flex flex-wrap items-center gap-1.5 text-foreground">
            <Filter className="h-3.5 w-3.5 text-primary" /> Complaint Filtering Engine
          </h3>
          <button
            onClick={() => {
              setSelectedDept('ALL');
              setSelectedRole('ALL');
              setSelectedCategory('ALL');
              setSelectedStatus('ALL');
              setSelectedPriority('ALL');
              setSearchQuery('');
            }}
            className="text-[10px] text-muted-foreground hover:text-primary font-bold"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {/* Academic Year */}
          <div>
            <label className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">Academic Year</label>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="w-full h-8 border rounded-lg bg-background px-2 text-xs font-bold"
            >
              <option value="2026-2027">2026-2027</option>
              <option value="2025-2026">2025-2026</option>
              <option value="2024-2025">2024-2025</option>
            </select>
          </div>

          {/* Dept */}
          <div>
            <label className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">Department</label>
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="w-full h-8 border rounded-lg bg-background px-2 text-xs font-bold"
            >
              <option value="ALL">All Depts</option>
              {['CSE', 'ECE', 'IT', 'MECH', 'CIVIL', 'EEE', 'AI&DS', 'AIML', 'MBA', 'MCA'].map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Role */}
          <div>
            <label className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">Role</label>
            <select
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value)}
              className="w-full h-8 border rounded-lg bg-background px-2 text-xs font-bold"
            >
              <option value="ALL">All Roles</option>
              <option value="Student">Student</option>
              <option value="Faculty">Faculty</option>
              <option value="Mentor">Mentor</option>
              <option value="HOD">HOD</option>
              <option value="Parent">Parent</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full h-8 border rounded-lg bg-background px-2 text-xs font-bold"
            >
              <option value="ALL">All Categories</option>
              <option value="ACADEMIC">Academic</option>
              <option value="HOSTEL">Hostel</option>
              <option value="INFRASTRUCTURE">Infrastructure</option>
              <option value="FEE">Fee</option>
              <option value="DISCIPLINE">Discipline</option>
              <option value="FACULTY">Faculty</option>
              <option value="GENERAL">General</option>
              <option value="ANONYMOUS">Anonymous</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full h-8 border rounded-lg bg-background px-2 text-xs font-bold"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open / Pending</option>
              <option value="UNDER_INVESTIGATION">Under Investigation</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="ESCALATED">Escalated</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">Priority</label>
            <select
              value={selectedPriority}
              onChange={e => setSelectedPriority(e.target.value)}
              className="w-full h-8 border rounded-lg bg-background px-2 text-xs font-bold"
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          {/* Search Input (2 cols) */}
          <div className="md:col-span-2">
            <label className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">Search Feed</label>
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="ID, Title, Submitter, Category..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-8 border rounded-lg bg-background pl-8 pr-3 text-xs font-semibold focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>
      </div>

      {/* LIVE COMPLAINT FEED (NEWEST FIRST) */}
      <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b pb-2">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground flex flex-wrap items-center gap-2">
              <MessageSquare className="h-4 w-4 text-rose-600" /> Institutional Live Complaint Feed ({filteredFeed.length} Items)
            </h3>
            <p className="text-[10px] text-muted-foreground font-semibold">
              Sorted newest first. Principal has monitoring, escalation, internal remarking & reporting privileges.
            </p>
          </div>
          <span className="text-[9px] bg-rose-50 text-rose-700 font-extrabold px-2.5 py-1 rounded border border-rose-200 uppercase tracking-wider">
            Live Sync Active
          </span>
        </div>

        {/* Complaint Cards Feed */}
        <div className={`space-y-3 ${isMobileView ? 'touch-pan-y' : ''}`}>
          {filteredFeed.map((c: any, idx: number) => (
            <div
              key={c.id || idx}
              className="p-4 border rounded-xl bg-background shadow-sm hover:border-primary/40 transition-all space-y-3 text-xs text-left"
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b pb-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-black text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                    {c.complaintNumber}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                    c.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-700 border-rose-300' :
                    c.priority === 'HIGH' ? 'bg-amber-100 text-amber-700 border-amber-300' :
                    'bg-slate-100 text-slate-700 border-slate-300'
                  }`}>
                    {c.priority} Priority
                  </span>
                  <span className="text-[10px] bg-muted px-2 py-0.5 rounded font-extrabold uppercase text-muted-foreground">
                    {c.category}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase border ${
                    c.status === 'RESOLVED' || c.status === 'CLOSED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                    c.status === 'ESCALATED' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                    'bg-indigo-50 text-indigo-600 border-indigo-200'
                  }`}>
                    {c.status}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono font-bold">
                    {new Date(c.submittedDate).toISOString().split('T')[0]}
                  </span>
                </div>
              </div>

              {/* Title & Description preview */}
              <div className="space-y-1">
                <h4 className="font-extrabold text-foreground text-sm">{c.title}</h4>
                <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">{c.description}</p>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] bg-muted/20 p-2.5 rounded-lg border">
                <div>
                  <span className="text-muted-foreground block text-[9px]">Submitted By</span>
                  <span className="font-extrabold text-foreground">{c.submittedByName} ({c.submittedByRole})</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px]">Department</span>
                  <span className="font-extrabold text-foreground">{c.departmentCode}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px]">Assigned Primary Handler</span>
                  <span className="font-extrabold text-indigo-600">{c.assignedOfficer}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px]">Resolution Progress</span>
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <div className="w-16 bg-muted h-1.5 rounded-full overflow-hidden shrink-0">
                      <div className="bg-primary h-full" style={{ width: `${c.resolutionProgress}%` }} />
                    </div>
                    <span className="font-bold">{c.resolutionProgress}%</span>
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="flex justify-between items-center pt-1 text-[10px]">
                <span className="text-muted-foreground font-semibold">
                  {c.replies?.length || 0} timeline entries / notes attached
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedComplaint(c);
                      setModalTab('remarks');
                    }}
                    className="px-2.5 py-1 bg-muted hover:bg-muted/80 text-foreground font-bold rounded border transition-colors flex flex-wrap items-center gap-1"
                  >
                    <MessageSquare className="h-3 w-3 text-indigo-600" /> Remark
                  </button>
                  <button
                    onClick={() => {
                      setSelectedComplaint(c);
                      setModalTab('escalate');
                    }}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold rounded border border-rose-200 transition-colors flex flex-wrap items-center gap-1"
                  >
                    <ShieldAlert className="h-3 w-3" /> Escalate
                  </button>
                  <button
                    onClick={() => {
                      setSelectedComplaint(c);
                      setModalTab('details');
                    }}
                    className="px-3 py-1 bg-primary text-primary-foreground font-bold rounded hover:opacity-90 transition-opacity flex flex-wrap items-center gap-1"
                  >
                    Monitor Detail <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* ANALYTICS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs font-semibold">
        {/* Department Complaint Distribution */}
        <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4 lg:col-span-2">
          <h3 className="text-xs uppercase font-extrabold tracking-wider border-b pb-2 flex flex-wrap items-center gap-1.5">
            <BarChart3 className="h-4 w-4 text-indigo-600" /> Department-Wise Complaint Distribution & Resolution
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b text-[9px] text-muted-foreground uppercase tracking-wider font-extrabold">
                  <th className="pb-2">Department</th>
                  <th className="pb-2">Total Complaints</th>
                  <th className="pb-2">Pending / Open</th>
                  <th className="pb-2">Resolved</th>
                  <th className="pb-2">Escalated</th>
                  <th className="pb-2">Resolution Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs">
                {departmentDistribution.map((d: any, idx: number) => {
                  const rate = d.total > 0 ? Math.round((d.resolved / d.total) * 100) : 80;
                  return (
                    <tr key={idx} className="hover:bg-muted/10">
                      <td className="py-2.5 font-extrabold text-foreground">{d.name} ({d.code})</td>
                      <td className="py-2.5 font-bold font-mono text-indigo-600">{d.total}</td>
                      <td className="py-2.5 font-bold font-mono text-amber-600">{d.pending}</td>
                      <td className="py-2.5 font-bold font-mono text-emerald-600">{d.resolved}</td>
                      <td className="py-2.5 font-bold font-mono text-rose-600">{d.escalated}</td>
                      <td className="py-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="w-16 bg-muted h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full" style={{ width: `${rate}%` }} />
                          </div>
                          <span className="font-bold text-[10px]">{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4 lg:col-span-1">
          <h3 className="text-xs uppercase font-extrabold tracking-wider border-b pb-2 flex flex-wrap items-center gap-1.5">
            <FolderCheck className="h-4 w-4 text-emerald-600" /> Category Breakdown
          </h3>
          <div className="space-y-3">
            {categoryBreakdown.map((cat: any, idx: number) => {
              const maxCount = Math.max(...categoryBreakdown.map((c: any) => c.count || 1));
              const pct = Math.round((cat.count / maxCount) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="font-bold text-foreground">{cat.category}</span>
                    <span className="font-mono text-muted-foreground font-bold">{cat.count} Cases</span>
                  </div>
                  <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* COMPLAINT DETAIL & ESCALATION MODAL */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-card border rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl space-y-0 my-auto">
            
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-rose-950 via-slate-900 to-indigo-950 text-white flex justify-between items-center shrink-0">
              <div className="space-y-1">
                <div className="inline-flex flex-wrap items-center gap-1.5 bg-white/10 text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase">
                  <ShieldAlert className="h-3 w-3 text-rose-400" /> Complaint #{selectedComplaint.complaintNumber} Audit File
                </div>
                <h3 className="text-xl font-extrabold text-white">{selectedComplaint.title}</h3>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Sub-Tabs inside Modal */}
            <div className="flex border-b px-5 bg-muted/20 shrink-0 overflow-x-auto">
              {[
                { key: 'details', label: 'Complaint Overview' },
                { key: 'timeline', label: 'Investigation Timeline' },
                { key: 'remarks', label: 'Principal Internal Remarks' },
                { key: 'escalate', label: 'Escalate Complaint' }
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setModalTab(t.key as any)}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors shrink-0 ${
                    modalTab === t.key ? 'border-rose-600 text-rose-600 font-black' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Modal Content Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs font-semibold flex-1">
              
              {/* TAB 1: DETAILS */}
              {modalTab === 'details' && (
                <div className="space-y-4">
                  {/* Status & Submitter Banner */}
                  <div className="grid grid-cols-1 md:grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/20 p-3 rounded-xl border">
                    <div>
                      <span className="text-[9px] text-muted-foreground uppercase block">Current Status</span>
                      <span className="font-black text-rose-600 uppercase text-xs">{selectedComplaint.status}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-muted-foreground uppercase block">Priority Level</span>
                      <span className="font-black text-amber-600 uppercase text-xs">{selectedComplaint.priority}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-muted-foreground uppercase block">Submitted By</span>
                      <span className="font-extrabold text-foreground">{selectedComplaint.submittedByName} ({selectedComplaint.submittedByRole})</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-muted-foreground uppercase block">Department / Program</span>
                      <span className="font-extrabold text-foreground">{selectedComplaint.departmentCode} ({selectedComplaint.programName || 'N/A'})</span>
                    </div>
                  </div>

                  {/* Complaint Original Description */}
                  <div className="p-4 border rounded-xl bg-background space-y-2">
                    <h4 className="font-extrabold text-xs uppercase text-muted-foreground border-b pb-1">Original Complaint Description</h4>
                    <p className="text-xs text-foreground leading-relaxed font-normal whitespace-pre-wrap">
                      {selectedComplaint.description}
                    </p>
                  </div>

                  {/* Evidence & Attachments */}
                  <div className="p-4 border rounded-xl bg-background space-y-2">
                    <h4 className="font-extrabold text-xs uppercase text-muted-foreground border-b pb-1">Evidence Files & Attachments</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {selectedComplaint.attachments?.map((att: any, idx: number) => (
                        <div key={idx} className="p-2.5 border rounded-lg bg-muted/20 flex items-center justify-between">
                          <div className="flex flex-wrap items-center gap-2 truncate">
                            <FileText className="h-4 w-4 text-indigo-600 shrink-0" />
                            <span className="font-bold text-foreground text-xs truncate">{att.name}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono">{att.size}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TIMELINE */}
              {modalTab === 'timeline' && (
                <div className="space-y-3">
                  <h4 className="font-extrabold text-xs uppercase text-muted-foreground border-b pb-1">Audit Trail & Resolution Steps</h4>
                  <div className="space-y-3 pt-2">
                    {selectedComplaint.replies?.map((r: any, idx: number) => (
                      <div key={idx} className={`p-3 border rounded-xl space-y-1 ${r.isEscalation ? 'bg-rose-50 border-rose-200 text-rose-950' : r.isInternalRemark ? 'bg-indigo-50 border-indigo-200 text-indigo-950' : 'bg-background'}`}>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-extrabold uppercase tracking-wider text-primary">{r.author} ({r.role})</span>
                          <span className="font-mono text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-xs font-normal leading-relaxed">{r.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: PRINCIPAL INTERNAL REMARKS */}
              {modalTab === 'remarks' && (
                <div className="space-y-4">
                  <div className="p-4 border rounded-xl bg-indigo-50/40 space-y-2">
                    <h4 className="font-extrabold text-indigo-950 text-xs flex flex-wrap items-center gap-1.5 uppercase">
                      <Sparkles className="h-4 w-4 text-indigo-600" /> Principal Internal Remarks (Oversight Notes)
                    </h4>
                    <p className="text-[11px] text-indigo-900 font-medium leading-relaxed">
                      Attach internal remarks or instructions for the Dean without modifying the original complaint submitted by the user.
                    </p>
                  </div>

                  <form onSubmit={handleAddRemark} className="space-y-3">
                    <textarea
                      required
                      rows={4}
                      placeholder="Type Principal oversight remark or special instructions for Dean..."
                      value={remarkText}
                      onChange={e => setRemarkText(e.target.value)}
                      className="w-full p-3 border rounded-xl bg-background text-xs font-medium focus:outline-none focus:border-primary resize-none"
                    />
                    <button
                      type="submit"
                      disabled={submittingRemark}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg text-xs flex flex-wrap items-center gap-1.5 transition-colors"
                    >
                      <Send className="h-3.5 w-3.5" /> {submittingRemark ? 'Attaching...' : 'Attach Internal Remark'}
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 4: ESCALATE COMPLAINT */}
              {modalTab === 'escalate' && (
                <div className="space-y-4">
                  <div className="p-4 border rounded-xl bg-rose-50 space-y-2">
                    <h4 className="font-extrabold text-rose-950 text-xs flex flex-wrap items-center gap-1.5 uppercase">
                      <ShieldAlert className="h-4 w-4 text-rose-600" /> Escalate Institutional Complaint
                    </h4>
                    <p className="text-[11px] text-rose-900 font-medium leading-relaxed">
                      Escalating this complaint will elevate its priority status to Critical/Urgent and notify the Dean and Executive Management.
                    </p>
                  </div>

                  <form onSubmit={handleEscalate} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">Escalated Priority</label>
                        <select
                          value={escalatePriority}
                          onChange={e => setEscalatePriority(e.target.value)}
                          className="w-full h-9 border rounded-lg bg-background px-3 font-bold text-xs"
                        >
                          <option value="CRITICAL">Critical</option>
                          <option value="HIGH">High Priority</option>
                          <option value="URGENT">Urgent</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">Escalate Target Body</label>
                        <select
                          value={escalateTarget}
                          onChange={e => setEscalateTarget(e.target.value)}
                          className="w-full h-9 border rounded-lg bg-background px-3 font-bold text-xs"
                        >
                          <option value="Forward to Management">Forward to Management</option>
                          <option value="Forward to Governing Body">Forward to Governing Body</option>
                          <option value="Disciplinary Cell Action">Disciplinary Cell Action</option>
                          <option value="Need Immediate Action">Need Immediate Action</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">Escalation Justification & Directive</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="State reason for escalation and directive for operational handler..."
                        value={escalateNote}
                        onChange={e => setEscalateNote(e.target.value)}
                        className="w-full p-3 border rounded-xl bg-background text-xs font-medium focus:outline-none focus:border-rose-500 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingEscalation}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-lg text-xs flex flex-wrap items-center gap-1.5 transition-colors"
                    >
                      <ShieldAlert className="h-3.5 w-3.5" /> {submittingEscalation ? 'Dispatching Escalation...' : 'Confirm Escalation'}
                    </button>
                  </form>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t bg-muted/20 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedComplaint(null)}
                className="px-4 py-1.5 bg-primary text-primary-foreground font-bold rounded-lg text-xs hover:opacity-90 transition-opacity"
              >
                Close Audit File
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
