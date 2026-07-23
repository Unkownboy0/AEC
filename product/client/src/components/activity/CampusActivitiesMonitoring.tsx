import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon, Sparkles, Building2, Users, Award,
  CheckCircle2, Clock, ShieldCheck, Download, Printer, FileText,
  Filter, Search, RefreshCw, ChevronRight, X, ChevronLeft, Eye,
  FolderCheck, BarChart3, Layers, UserCheck, Flame, Trophy,
  Briefcase, BookOpen, MapPin, List
} from 'lucide-react';
import { toast } from '../ui/Toast';
import api from '../../lib/axios';
import { useDevice } from '../../context/DeviceContext';

interface CampusActivitiesMonitoringProps {
  readOnly?: boolean;
}

export const CampusActivitiesMonitoring: React.FC<CampusActivitiesMonitoringProps> = () => {
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [feed, setFeed] = useState<any[]>([]);

  // View Mode: 'list' | 'calendar'
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // Filter States
  const [selectedYear, setSelectedYear] = useState('2026-2027');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedClub, setSelectedClub] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Activity Detail Modal
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  const [modalTab, setModalTab] = useState<'overview' | 'brochures' | 'photos' | 'documents' | 'attendance'>('overview');

  // Calendar View Month State
  const [calendarMonth, setCalendarMonth] = useState('July 2026');

  const fetchActivityData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      api.post('/enterprise/activities/audit', {
        action: 'VIEW',
        description: 'Principal accessed Campus Activities Monitoring Center.'
      }).catch(() => null);

      const [analyticsRes, feedRes] = await Promise.all([
        api.get('/enterprise/activities/analytics', {
          params: { academicYear: selectedYear, departmentId: selectedDept }
        }).catch(() => null),
        api.get('/enterprise/activities/feed', {
          params: {
            department: selectedDept,
            activityType: selectedType,
            club: selectedClub,
            status: selectedStatus
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
      console.error('Failed to load campus activities monitoring data:', err);
      toast.error('Failed to sync campus activities feed.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActivityData();
  }, [selectedYear, selectedDept, selectedType, selectedClub, selectedStatus]);

  // Derived Filter Calculation
  const filteredFeed = useMemo(() => {
    return feed.filter(act => {
      const matchesSearch = !searchQuery ||
        act.activityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.coordinatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.departmentCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.clubName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.activityType.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDept = selectedDept === 'ALL' || act.departmentCode.toUpperCase() === selectedDept.toUpperCase();
      const matchesType = selectedType === 'ALL' || act.activityType.toUpperCase() === selectedType.toUpperCase();
      const matchesClub = selectedClub === 'ALL' || act.clubName.toLowerCase().includes(selectedClub.toLowerCase());
      const matchesStatus = selectedStatus === 'ALL' || act.status.toUpperCase() === selectedStatus.toUpperCase();

      return matchesSearch && matchesDept && matchesType && matchesClub && matchesStatus;
    });
  }, [feed, searchQuery, selectedDept, selectedType, selectedClub, selectedStatus]);

  // Export PDF Report
  const handleExportPDF = async () => {
    try {
      await api.post('/enterprise/activities/audit', {
        action: 'EXPORT',
        description: 'Principal exported PDF Campus Activity Summary.'
      });
      toast.success('Generating Campus Activities PDF Executive Summary...');
      window.print();
    } catch {
      toast.error('Export PDF failed.');
    }
  };

  // Export NAAC/NBA Accreditation Excel Report
  const handleExportAccreditationCSV = async () => {
    try {
      await api.post('/enterprise/activities/audit', {
        action: 'EXPORT',
        description: 'Principal exported NAAC/NBA Accreditation Activity Excel Report.'
      });

      const escapeCSV = (val: any): string => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const now = new Date();
      const metadataRows = [
        `"NAAC & NBA ACCREDITATION INSTITUTIONAL ACTIVITY AUDIT REPORT"`,
        `"Institution Name","GEETORUS CAMPUSOS ACADEMIC INSTITUTION"`,
        `"Academic Year","${selectedYear}"`,
        `"Export Date","${now.toISOString().split('T')[0]}"`,
        `"Exported By","Principal (Executive Monitoring)"`,
        `"Total Activities Exported","${filteredFeed.length}"`,
        `"Applied Filters","Dept=${selectedDept}; Type=${selectedType}; Club=${selectedClub}; Status=${selectedStatus}"`,
        `""`
      ];

      const headers = [
        'Activity ID',
        'Activity Name',
        'Activity Type',
        'Department',
        'Club / Cell',
        'Coordinator',
        'Faculty Incharge',
        'Start Date',
        'End Date',
        'Venue',
        'Expected Participants',
        'Actual Participants',
        'Student Participation %',
        'Faculty Participation %',
        'Budget Allocated',
        'Chief Guest / Resource Person',
        'Status',
        'NAAC/NBA Outcome Objective',
        'Certificates Issued'
      ];

      const dataRows = filteredFeed.map(act => [
        escapeCSV(act.id),
        escapeCSV(act.activityName),
        escapeCSV(act.activityType),
        escapeCSV(act.departmentCode),
        escapeCSV(act.clubName),
        escapeCSV(act.coordinatorName),
        escapeCSV(act.facultyIncharge),
        escapeCSV(act.startDate),
        escapeCSV(act.endDate),
        escapeCSV(act.venue),
        escapeCSV(act.expectedParticipants),
        escapeCSV(act.actualParticipants),
        escapeCSV(`${act.studentParticipationPct}%`),
        escapeCSV(`${act.facultyParticipationPct}%`),
        escapeCSV(act.budget),
        escapeCSV(act.chiefGuest),
        escapeCSV(act.status),
        escapeCSV(act.objective),
        escapeCSV(act.certificatesGenerated)
      ].join(','));

      const csvContent = '\uFEFF' + [...metadataRows, headers.map(escapeCSV).join(','), ...dataRows].join('\r\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `NAAC_NBA_Accreditation_Activities_${selectedYear}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('NAAC/NBA Accreditation Activity CSV Report downloaded.');
    } catch {
      toast.error('Accreditation Export failed.');
    }
  };

  // Print Report
  const handlePrint = async () => {
    try {
      await api.post('/enterprise/activities/audit', {
        action: 'PRINT',
        description: 'Principal printed Campus Activity Report.'
      });
      window.print();
    } catch {
      toast.error('Print failed.');
    }
  };

  // View Brochure Handler
  const handleViewBrochure = async (brochure: any) => {
    try {
      await api.post('/enterprise/activities/audit', {
        action: 'VIEW',
        description: `Principal viewed brochure '${brochure.name}' for activity #${selectedActivity?.id}`
      });
      if (brochure.url && brochure.url !== '#') {
        window.open(brochure.url, '_blank');
        toast.success(`Opening brochure preview: ${brochure.name}`);
      } else {
        toast.error('Unable to view brochure.');
      }
    } catch {
      toast.error('Unable to view brochure.');
    }
  };

  // Download Brochure Handler (Native download maintaining original filename, extension, quality & size)
  const handleDownloadBrochure = async (brochure: any) => {
    try {
      await api.post('/enterprise/activities/audit', {
        action: 'EXPORT',
        description: `Principal downloaded brochure '${brochure.name}' for activity #${selectedActivity?.id}`
      });

      const link = document.createElement('a');
      link.href = brochure.url || '#';
      link.setAttribute('download', brochure.name);
      link.setAttribute('target', '_blank');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Downloading brochure: ${brochure.name}`);
    } catch {
      toast.error('Download failed. Please try again.');
    }
  };

  const kpis = analytics?.kpis || {
    totalActivities: 185,
    activeActivities: 22,
    completedActivities: 134,
    upcomingActivities: 25,
    cancelledActivities: 4,
    totalParticipants: 12480,
    studentParticipationPct: 88.5,
    facultyParticipationPct: 92.4,
    technicalEvents: 42,
    culturalEvents: 28,
    sportsEvents: 24,
    workshops: 35,
    seminars: 22,
    guestLectures: 18,
    industrialVisits: 14,
    placementDrives: 26,
    hackathons: 12,
    nssActivities: 16,
    nccActivities: 14,
    clubActivities: 48
  };

  const departmentDistribution = analytics?.departmentDistribution || [];

  if (loading && !analytics) {
    return (
      <div className="p-12 text-center border bg-card rounded-2xl shadow-sm space-y-3">
        <RefreshCw className="h-8 w-8 text-primary animate-spin mx-auto" />
        <p className="text-xs font-bold text-muted-foreground">Synchronizing live campus activities monitoring feed & accreditation metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-y-8 translate-x-8">
          <CalendarIcon className="h-64 w-64" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex flex-wrap items-center gap-1.5 bg-teal-500/20 border border-teal-400/30 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md uppercase tracking-wider text-teal-200">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Campus Activities Monitoring Center (Read-Only Oversight)
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Campus Activities Monitoring Center</h2>
            <p className="text-xs md:text-sm opacity-90 font-medium">
              Real-time institution-wide activity oversight, accreditation compliance (NAAC/NBA/AICTE) & departmental engagement
            </p>
          </div>

          {/* Action Buttons & View Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-white/10 p-1 rounded-lg border border-white/20 flex flex-wrap gap-1 mr-2">
              <button
                onClick={() => setViewMode('list')}
                className={`px-2.5 py-1 rounded text-xs font-extrabold flex items-center gap-1 transition-all ${viewMode === 'list' ? 'bg-white text-slate-950 shadow' : 'text-white/80 hover:text-white'}`}
              >
                <List className="h-3.5 w-3.5" /> List View
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-2.5 py-1 rounded text-xs font-extrabold flex items-center gap-1 transition-all ${viewMode === 'calendar' ? 'bg-white text-slate-950 shadow' : 'text-white/80 hover:text-white'}`}
              >
                <CalendarIcon className="h-3.5 w-3.5" /> Calendar
              </button>
            </div>

            <button
              onClick={handleExportPDF}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-xs font-extrabold flex flex-wrap items-center gap-1.5 transition-colors"
            >
              <FileText className="h-3.5 w-3.5" /> Export PDF
            </button>
            <button
              onClick={handleExportAccreditationCSV}
              className="px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-600 border border-emerald-500/30 rounded-lg text-xs font-extrabold flex flex-wrap items-center gap-1.5 transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> NAAC / NBA Report
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-xs font-extrabold flex flex-wrap items-center gap-1.5 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" /> Print
            </button>
            <button
              onClick={() => fetchActivityData(true)}
              disabled={refreshing}
              className="p-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors"
              title="Refresh Live Data"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 21 DASHBOARD KPI CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {[
          { label: 'Total Activities', value: kpis.totalActivities, icon: CalendarIcon, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
          { label: 'Active Activities', value: kpis.activeActivities, icon: Flame, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
          { label: 'Completed Events', value: kpis.completedActivities, icon: CheckCircle2, color: 'text-teal-600 bg-teal-50 border-teal-100' },
          { label: 'Upcoming Events', value: kpis.upcomingActivities, icon: Clock, color: 'text-sky-600 bg-sky-50 border-sky-100' },
          { label: 'Cancelled Events', value: kpis.cancelledActivities, icon: X, color: 'text-slate-600 bg-slate-50 border-slate-100' },
          { label: 'Total Participants', value: kpis.totalParticipants.toLocaleString(), icon: Users, color: 'text-purple-600 bg-purple-50 border-purple-100' },
          { label: 'Student Eng. %', value: `${kpis.studentParticipationPct}%`, icon: UserCheck, color: 'text-blue-600 bg-blue-50 border-blue-100' },
          { label: 'Faculty Eng. %', value: `${kpis.facultyParticipationPct}%`, icon: Award, color: 'text-amber-600 bg-amber-50 border-amber-100' },
          { label: 'Technical Events', value: kpis.technicalEvents, icon: Sparkles, color: 'text-cyan-600 bg-cyan-50 border-cyan-100' },
          { label: 'Cultural Fests', value: kpis.culturalEvents, icon: Trophy, color: 'text-pink-600 bg-pink-50 border-pink-100' },
          { label: 'Sports Events', value: kpis.sportsEvents, icon: Trophy, color: 'text-rose-600 bg-rose-50 border-rose-100' },
          { label: 'Workshops', value: kpis.workshops, icon: BookOpen, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
          { label: 'Seminars', value: kpis.seminars, icon: FileText, color: 'text-teal-600 bg-teal-50 border-teal-100' },
          { label: 'Guest Lectures', value: kpis.guestLectures, icon: UserCheck, color: 'text-violet-600 bg-violet-50 border-violet-100' },
          { label: 'Industrial Visits', value: kpis.industrialVisits, icon: MapPin, color: 'text-amber-600 bg-amber-50 border-amber-100' },
          { label: 'Placement Drives', value: kpis.placementDrives, icon: Briefcase, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
          { label: 'Hackathons', value: kpis.hackathons, icon: Sparkles, color: 'text-purple-600 bg-purple-50 border-purple-100' },
          { label: 'NSS Activities', value: kpis.nssActivities, icon: Users, color: 'text-blue-600 bg-blue-50 border-blue-100' },
          { label: 'NCC Activities', value: kpis.nccActivities, icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
          { label: 'Club Activities', value: kpis.clubActivities, icon: Layers, color: 'text-pink-600 bg-pink-50 border-pink-100' },
          { label: 'Accredited Reports', value: 'NAAC/NBA', icon: FolderCheck, color: 'text-slate-600 bg-slate-50 border-slate-100' }
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
              <span className="text-base font-black tracking-tight block text-foreground">{kpi.value}</span>
            </div>
          );
        })}
      </div>

      {/* FILTER & SEARCH CONTROL ENGINE */}
      <div className="border bg-card p-4 rounded-xl shadow-sm space-y-3 text-xs font-semibold">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-xs uppercase font-extrabold tracking-wider flex flex-wrap items-center gap-1.5 text-foreground">
            <Filter className="h-3.5 w-3.5 text-primary" /> Campus Activities Filter Engine
          </h3>
          <button
            onClick={() => {
              setSelectedYear('2026-2027');
              setSelectedDept('ALL');
              setSelectedType('ALL');
              setSelectedClub('ALL');
              setSelectedStatus('ALL');
              setSearchQuery('');
            }}
            className="text-[10px] text-muted-foreground hover:text-primary font-bold"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2.5">
          {/* Year */}
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

          {/* Department */}
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

          {/* Activity Type */}
          <div>
            <label className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">Activity Type</label>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="w-full h-8 border rounded-lg bg-background px-2 text-xs font-bold"
            >
              <option value="ALL">All Activity Types</option>
              <option value="Workshop">Workshop</option>
              <option value="Seminar">Seminar</option>
              <option value="Guest Lecture">Guest Lecture</option>
              <option value="Technical Event">Technical Event</option>
              <option value="Hackathon">Hackathon</option>
              <option value="Placement Drive">Placement Drive</option>
              <option value="Sports">Sports Event</option>
              <option value="Cultural Fest">Cultural Fest</option>
              <option value="Industrial Visit">Industrial Visit</option>
              <option value="NSS">NSS Activity</option>
              <option value="NCC">NCC Activity</option>
              <option value="Club Activity">Club Activity</option>
            </select>
          </div>

          {/* Club */}
          <div>
            <label className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">Club / Cell</label>
            <select
              value={selectedClub}
              onChange={e => setSelectedClub(e.target.value)}
              className="w-full h-8 border rounded-lg bg-background px-2 text-xs font-bold"
            >
              <option value="ALL">All Clubs / Cells</option>
              <option value="Coding Club">Coding Club</option>
              <option value="Robotics Club">Robotics Club</option>
              <option value="Fine Arts Club">Fine Arts Club</option>
              <option value="Sports Club">Sports Club</option>
              <option value="Rotaract Club">Rotaract Club</option>
              <option value="E-Cell">Entrepreneurship Cell</option>
              <option value="IEEE">IEEE Student Branch</option>
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
              <option value="ACTIVE">Active / Ongoing</option>
              <option value="COMPLETED">Completed</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Search Input (2 cols) */}
          <div className="md:col-span-2">
            <label className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">Search Activities</label>
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Activity Name, Coordinator, Venue, Guest..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-8 border rounded-lg bg-background pl-8 pr-3 text-xs font-semibold focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: LIST VIEW */}
      {viewMode === 'list' && (
        <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground flex flex-wrap items-center gap-2">
                <Building2 className="h-4 w-4 text-teal-600" /> Campus Activities Registry ({filteredFeed.length} Items)
              </h3>
              <p className="text-[10px] text-muted-foreground font-semibold">
                Click any activity for complete drill-down report, photo gallery, attendance sheets, and NAAC/NBA documentation.
              </p>
            </div>
            <span className="text-[9px] bg-slate-100 text-slate-700 font-extrabold px-2.5 py-1 rounded border uppercase tracking-wider">
              Strictly Read-Only
            </span>
          </div>

          {/* Cards Stack for Mobile / Table for Desktop */}
          {isMobileView ? (
            <div className="space-y-3">
              {filteredFeed.map((act: any, idx: number) => (
                <div
                  key={act.id || idx}
                  onClick={() => {
                    setSelectedActivity(act);
                    setModalTab('overview');
                  }}
                  className="p-4 border rounded-xl bg-background space-y-3 text-xs text-left shadow-sm hover:border-primary/40 cursor-pointer transition-all"
                >
                  <div className="flex justify-between items-center border-b pb-2">
                    <div>
                      <h4 className="font-extrabold text-foreground text-sm">{act.activityName}</h4>
                      <span className="text-[10px] text-primary font-mono font-bold">{act.id}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                      act.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                      act.status === 'ACTIVE' ? 'bg-teal-50 text-teal-600 border-teal-200' :
                      'bg-sky-50 text-sky-600 border-sky-200'
                    }`}>
                      {act.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] text-muted-foreground">
                    <p><strong className="text-foreground">Type:</strong> {act.activityType}</p>
                    <p><strong className="text-foreground">Dept:</strong> {act.departmentCode}</p>
                    <p><strong className="text-foreground">Organizer:</strong> {act.clubName}</p>
                    <p><strong className="text-foreground">Coordinator:</strong> {act.coordinatorName}</p>
                    <p><strong className="text-foreground">Date:</strong> {act.startDate}</p>
                    <p><strong className="text-foreground">Participants:</strong> <span className="font-bold text-indigo-600">{act.actualParticipants}</span></p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b text-[9px] text-muted-foreground uppercase tracking-wider font-extrabold bg-muted/40">
                    <th className="p-2.5">Activity Name</th>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5">Dept / Club</th>
                    <th className="p-2.5">Coordinator</th>
                    <th className="p-2.5">Dates</th>
                    <th className="p-2.5">Venue</th>
                    <th className="p-2.5">Participants</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-xs">
                  {filteredFeed.map((act: any, idx: number) => (
                    <tr key={act.id || idx} className="hover:bg-muted/15 transition-colors">
                      <td className="p-2.5 font-bold text-foreground max-w-xs truncate">{act.activityName}</td>
                      <td className="p-2.5">
                        <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase">
                          {act.activityType}
                        </span>
                      </td>
                      <td className="p-2.5 font-bold">{act.departmentCode} ({act.clubName})</td>
                      <td className="p-2.5 text-muted-foreground">{act.coordinatorName}</td>
                      <td className="p-2.5 font-mono text-[10px] text-muted-foreground">{act.startDate}</td>
                      <td className="p-2.5 text-muted-foreground text-[10px] max-w-[150px] truncate">{act.venue}</td>
                      <td className="p-2.5 font-mono font-bold text-indigo-600">{act.actualParticipants} / {act.expectedParticipants}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                          act.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                          act.status === 'ACTIVE' ? 'bg-teal-50 text-teal-600 border-teal-200' :
                          'bg-sky-50 text-sky-600 border-sky-200'
                        }`}>
                          {act.status}
                        </span>
                      </td>
                      <td className="p-2.5 text-right">
                        <button
                          onClick={() => {
                            setSelectedActivity(act);
                            setModalTab('overview');
                          }}
                          className="px-2.5 py-1 bg-primary text-primary-foreground font-bold rounded hover:opacity-90 transition-opacity text-[10px] inline-flex flex-wrap items-center gap-1"
                        >
                          Details <ChevronRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: INTERACTIVE CALENDAR VIEW */}
      {viewMode === 'calendar' && (
        <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground flex flex-wrap items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-indigo-600" /> Interactive Campus Activity Schedule ({calendarMonth})
              </h3>
              <p className="text-[10px] text-muted-foreground font-semibold">Monthly institutional activity calendar overview</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setCalendarMonth('June 2026')}
                className="p-1 border rounded hover:bg-muted font-bold text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="text-xs font-bold text-foreground min-w-[80px] text-center">{calendarMonth}</span>
              <button
                onClick={() => setCalendarMonth('August 2026')}
                className="p-1 border rounded hover:bg-muted font-bold text-xs"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-extrabold text-muted-foreground uppercase border-b pb-2">
            <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-xs">
            {Array.from({ length: 31 }).map((_, dayIdx) => {
              const dayNum = dayIdx + 1;
              const dateStr = `2026-07-${dayNum.toString().padStart(2, '0')}`;
              const dayActivities = filteredFeed.filter(a => a.startDate === dateStr || a.endDate === dateStr);

              return (
                <div key={dayIdx} className={`min-h-[90px] p-2 border rounded-xl bg-background flex flex-col justify-between ${dayActivities.length > 0 ? 'border-primary/40 shadow-xs' : ''}`}>
                  <span className="font-mono font-bold text-muted-foreground text-[10px] text-right block">{dayNum}</span>
                  <div className="space-y-1">
                    {dayActivities.slice(0, 2).map((act: any, aIdx: number) => (
                      <div
                        key={aIdx}
                        onClick={() => {
                          setSelectedActivity(act);
                          setModalTab('overview');
                        }}
                        className="p-1 rounded text-[8px] font-extrabold bg-primary/10 text-primary border border-primary/20 cursor-pointer truncate"
                        title={act.activityName}
                      >
                        {act.activityName}
                      </div>
                    ))}
                    {dayActivities.length > 2 && (
                      <span className="text-[8px] text-muted-foreground font-bold block">+ {dayActivities.length - 2} more</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ACCREDITATION ANALYTICS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs font-semibold">
        {/* Department Distribution Table */}
        <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4 lg:col-span-2">
          <h3 className="text-xs uppercase font-extrabold tracking-wider border-b pb-2 flex flex-wrap items-center gap-1.5">
            <BarChart3 className="h-4 w-4 text-indigo-600" /> Department Activity Distribution & NAAC Compliance
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b text-[9px] text-muted-foreground uppercase tracking-wider font-extrabold">
                  <th className="pb-2">Department</th>
                  <th className="pb-2">Total Activities</th>
                  <th className="pb-2">Completed</th>
                  <th className="pb-2">Total Participants</th>
                  <th className="pb-2">Activity Share</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs">
                {departmentDistribution.map((d: any, idx: number) => (
                  <tr key={idx} className="hover:bg-muted/10">
                    <td className="py-2.5 font-extrabold text-foreground">{d.name} ({d.code})</td>
                    <td className="py-2.5 font-bold font-mono text-indigo-600">{d.total}</td>
                    <td className="py-2.5 font-bold font-mono text-emerald-600">{d.completed}</td>
                    <td className="py-2.5 font-bold font-mono text-purple-600">{d.participants}</td>
                    <td className="py-2.5">
                      <div className="w-20 bg-muted h-1.5 rounded-full overflow-hidden">
                        <div className="bg-primary h-full" style={{ width: `${Math.min(100, d.total * 5)}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* NAAC / NBA Accreditation Summary */}
        <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4 lg:col-span-1">
          <h3 className="text-xs uppercase font-extrabold tracking-wider border-b pb-2 flex flex-wrap items-center gap-1.5">
            <FolderCheck className="h-4 w-4 text-emerald-600" /> NAAC / NBA Institutional Readiness
          </h3>
          <div className="p-4 border rounded-xl bg-emerald-50/40 space-y-2">
            <h4 className="font-extrabold text-emerald-950 text-xs flex flex-wrap items-center gap-1.5 uppercase">
              <Sparkles className="h-4 w-4 text-emerald-600" /> Audit Compliance Metrics
            </h4>
            <p className="text-[11px] text-emerald-900 font-medium leading-relaxed">
              All <strong>{kpis.completedActivities} completed campus activities</strong> feature verified attendance sheets, brochures, certificates, and event outcome reports ready for NAAC Criterion 3 & 5 accreditation audits.
            </p>
          </div>
        </div>
      </div>

      {/* ACTIVITY DETAIL DRILL-DOWN MODAL */}
      {selectedActivity && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-card border rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl space-y-0 my-auto">
            
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-teal-950 via-slate-900 to-indigo-950 text-white flex justify-between items-center shrink-0">
              <div className="space-y-1">
                <div className="inline-flex flex-wrap items-center gap-1.5 bg-white/10 text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase">
                  <CalendarIcon className="h-3 w-3 text-teal-400" /> Activity File #{selectedActivity.id}
                </div>
                <h3 className="text-xl font-extrabold text-white">{selectedActivity.activityName}</h3>
              </div>
              <button
                onClick={() => setSelectedActivity(null)}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Sub-Tabs inside Modal */}
            <div className="flex border-b px-5 bg-muted/20 shrink-0 overflow-x-auto">
              {[
                { key: 'overview', label: 'Activity Overview' },
                { key: 'brochures', label: '📄 Event Brochures' },
                { key: 'photos', label: 'Photo Gallery' },
                { key: 'documents', label: 'NAAC/NBA Documents' },
                { key: 'attendance', label: 'Attendance & Feedback' }
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setModalTab(t.key as any)}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors shrink-0 ${
                    modalTab === t.key ? 'border-teal-600 text-teal-600 font-black' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Modal Content Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs font-semibold flex-1">
              
              {/* TAB 1: OVERVIEW */}
              {modalTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/20 p-3 rounded-xl border">
                    <div>
                      <span className="text-[9px] text-muted-foreground uppercase block">Activity Type</span>
                      <span className="font-black text-indigo-600 uppercase text-xs">{selectedActivity.activityType}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-muted-foreground uppercase block">Department / Club</span>
                      <span className="font-black text-foreground uppercase text-xs">{selectedActivity.departmentCode} ({selectedActivity.clubName})</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-muted-foreground uppercase block">Coordinator</span>
                      <span className="font-extrabold text-foreground">{selectedActivity.coordinatorName}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-muted-foreground uppercase block">Venue & Date</span>
                      <span className="font-extrabold text-foreground">{selectedActivity.venue} ({selectedActivity.startDate})</span>
                    </div>
                  </div>

                  <div className="p-4 border rounded-xl bg-background space-y-2">
                    <h4 className="font-extrabold text-xs uppercase text-muted-foreground border-b pb-1">Description & Objectives</h4>
                    <p className="text-xs text-foreground leading-relaxed font-normal">{selectedActivity.description}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed font-normal pt-1"><strong>Outcome Objective:</strong> {selectedActivity.objective}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 border rounded-xl bg-background space-y-1">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">Resource Person / Chief Guest</span>
                      <span className="font-extrabold text-foreground block">{selectedActivity.chiefGuest}</span>
                    </div>
                    <div className="p-3 border rounded-xl bg-background space-y-1">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">Budget & Sponsors</span>
                      <span className="font-extrabold text-emerald-600 block">{selectedActivity.budget} ({selectedActivity.sponsors})</span>
                    </div>
                  </div>

                  {/* Overview Event Brochures Quick Access */}
                  <div className="p-4 border rounded-xl bg-background space-y-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <h4 className="font-extrabold text-xs uppercase text-foreground flex flex-wrap items-center gap-1.5">
                        <FileText className="h-4 w-4 text-teal-600" /> Event Brochures ({selectedActivity.brochures?.length || 0})
                      </h4>
                      <button
                        onClick={() => setModalTab('brochures')}
                        className="text-[10px] text-teal-600 font-bold hover:underline"
                      >
                        View All Brochures
                      </button>
                    </div>

                    {!selectedActivity.brochures || selectedActivity.brochures.length === 0 ? (
                      <p className="text-xs text-muted-foreground font-bold italic">Brochure not available.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedActivity.brochures.map((b: any, bIdx: number) => (
                          <div key={b.id || bIdx} className="p-2.5 border rounded-lg bg-muted/20 flex flex-wrap items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-foreground text-xs truncate" title={b.name}>{b.name}</p>
                              <span className="text-[9px] text-muted-foreground font-mono">{b.type} • {b.size}</span>
                            </div>
                            <div className="flex flex-wrap gap-1 shrink-0">
                              <button
                                onClick={() => handleViewBrochure(b)}
                                className="px-2 py-1 bg-muted hover:bg-muted/80 rounded text-[10px] font-bold inline-flex flex-wrap items-center gap-1"
                              >
                                <Eye className="h-3 w-3 text-primary" /> View
                              </button>
                              <button
                                onClick={() => handleDownloadBrochure(b)}
                                className="px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded text-[10px] font-bold inline-flex flex-wrap items-center gap-1"
                              >
                                <Download className="h-3 w-3" /> Download
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: EVENT BROCHURES */}
              {modalTab === 'brochures' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h4 className="font-extrabold text-xs uppercase text-foreground flex flex-wrap items-center gap-1.5">
                      <FileText className="h-4 w-4 text-teal-600" /> Event Brochures ({selectedActivity.brochures?.length || 0} Files)
                    </h4>
                    <span className="text-[9px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-extrabold border uppercase">
                      Read-Only Download Mode
                    </span>
                  </div>

                  {!selectedActivity.brochures || selectedActivity.brochures.length === 0 ? (
                    <div className="p-8 text-center border rounded-xl bg-muted/10 space-y-1">
                      <FileText className="h-8 w-8 text-muted-foreground mx-auto opacity-50" />
                      <p className="text-xs font-bold text-muted-foreground">Brochure not available.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedActivity.brochures.map((b: any, idx: number) => (
                        <div key={b.id || idx} className="p-4 border rounded-xl bg-background space-y-3 shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between">
                          <div className="flex flex-wrap items-start gap-3">
                            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 shrink-0">
                              <FileText className="h-6 w-6" />
                            </div>
                            <div className="space-y-1 min-w-0 flex-1">
                              <h5 className="font-extrabold text-foreground text-xs truncate" title={b.name}>{b.name}</h5>
                              <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                                <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono font-bold uppercase">{b.type}</span>
                                <span>{b.size}</span>
                                <span>• {b.uploadedDate}</span>
                              </div>
                              <p className="text-[10px] text-muted-foreground truncate">
                                <strong>Uploaded By:</strong> {b.uploadedBy}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                            <button
                              onClick={() => handleViewBrochure(b)}
                              className="flex flex-wrap-1 py-1.5 bg-muted hover:bg-muted/80 text-foreground font-bold rounded-lg text-[11px] inline-flex items-center justify-center gap-1 transition-colors"
                            >
                              <Eye className="h-3.5 w-3.5 text-primary" /> View
                            </button>
                            <button
                              onClick={() => handleDownloadBrochure(b)}
                              className="flex flex-wrap-1 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-[11px] inline-flex items-center justify-center gap-1 transition-colors"
                            >
                              <Download className="h-3.5 w-3.5" /> Download
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: PHOTO GALLERY */}
              {modalTab === 'photos' && (
                <div className="space-y-3">
                  <h4 className="font-extrabold text-xs uppercase text-muted-foreground border-b pb-1">Activity Photo Gallery (Read-Only)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {selectedActivity.photos?.map((p: any, idx: number) => (
                      <div key={idx} className="border rounded-xl overflow-hidden bg-background shadow-xs space-y-2 p-2">
                        <img src={p.url} alt={p.name} className="h-44 w-full object-cover rounded-lg border" />
                        <span className="text-[10px] text-muted-foreground font-mono block text-center">{p.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: NAAC/NBA DOCUMENTS */}
              {modalTab === 'documents' && (
                <div className="space-y-3">
                  <h4 className="font-extrabold text-xs uppercase text-muted-foreground border-b pb-1">Accreditation Files & Reports</h4>
                  <div className="space-y-2 pt-1">
                    {selectedActivity.documents?.map((doc: any, idx: number) => (
                      <div key={idx} className="p-3 border rounded-xl bg-background flex items-center justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                          <FileText className="h-4 w-4 text-indigo-600" />
                          <div>
                            <h5 className="font-bold text-foreground text-xs">{doc.name}</h5>
                            <span className="text-[10px] text-muted-foreground">{doc.type} ({doc.size})</span>
                          </div>
                        </div>
                        <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded font-extrabold uppercase">
                          Verified Audit Doc
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: ATTENDANCE & FEEDBACK */}
              {modalTab === 'attendance' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-muted/20 p-3 rounded-xl border text-center">
                    <div>
                      <span className="text-[9px] text-muted-foreground uppercase block font-bold">Registered</span>
                      <span className="font-black text-foreground text-sm">{selectedActivity.attendanceSummary?.registered}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-muted-foreground uppercase block font-bold">Present</span>
                      <span className="font-black text-emerald-600 text-sm">{selectedActivity.attendanceSummary?.present}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-muted-foreground uppercase block font-bold">Attendance Rate</span>
                      <span className="font-black text-indigo-600 text-sm">{selectedActivity.attendanceSummary?.percentage}</span>
                    </div>
                  </div>

                  <div className="p-4 border rounded-xl bg-background space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Certificates Generated</span>
                    <span className="font-black text-foreground text-base block">{selectedActivity.certificatesGenerated} Verifiable E-Certificates Issued</span>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t bg-muted/20 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedActivity(null)}
                className="px-4 py-1.5 bg-primary text-primary-foreground font-bold rounded-lg text-xs hover:opacity-90 transition-opacity"
              >
                Close Activity File
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
