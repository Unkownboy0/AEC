import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  CalendarOff, 
  Briefcase, 
  Search, 
  RefreshCw, 
  Filter, 
  Clock, 
  FileText, 
  User, 
  CheckCircle2,
  Building,
  Radio,
  ExternalLink
} from 'lucide-react';
import api from '../../lib/api';

interface BoardSummary {
  faculty: {
    total: number;
    present: number;
    onLeave: number;
    onOD: number;
    availabilityRate: number;
  };
  student: {
    total: number;
    present: number;
    onLeave: number;
    onOD: number;
    availabilityRate: number;
  };
  overall: {
    totalOnLeave: number;
    totalOnOD: number;
    totalAbsentFromCampus: number;
  };
}

interface BoardItem {
  id: string;
  requestId: string;
  personId: string;
  personName: string;
  avatarUrl?: string;
  identifier?: string;
  subTitle: string;
  role: 'FACULTY' | 'STUDENT';
  department: string;
  departmentId?: string;
  leaveType: string;
  category: 'LEAVE' | 'ON_DUTY';
  reason: string;
  startDate: string;
  endDate: string;
  isHalfDay: boolean;
  substituteName?: string | null;
  proofDocumentUrl?: string | null;
}

interface DepartmentOption {
  id: string;
  name: string;
  code: string;
}

export const DepartmentAvailabilityBoard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [summary, setSummary] = useState<BoardSummary | null>(null);
  const [items, setItems] = useState<BoardItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  
  // Filters
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedRole, setSelectedRole] = useState<'ALL' | 'FACULTY' | 'STUDENT'>('ALL');
  const [selectedType, setSelectedType] = useState<'ALL' | 'LEAVE' | 'ON_DUTY'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchBoardData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const params: any = {};
      if (selectedDept !== 'ALL') params.departmentId = selectedDept;
      if (selectedRole !== 'ALL') params.role = selectedRole;
      if (selectedType !== 'ALL') params.type = selectedType;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const response = await api.get('/enterprise/availability-board', { params });
      if (response.data?.status === 'success') {
        setSummary(response.data.data.summary);
        setItems(response.data.data.items);
        setDepartments(response.data.data.departments || []);
      }
    } catch (err) {
      console.error('Failed to load availability board', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBoardData();
  }, [selectedDept, selectedRole, selectedType]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBoardData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-28 sm:pb-12 p-3 sm:p-6">
      {/* Header Bar */}
      <div className="bg-gradient-to-b from-blue-50/80 via-surface to-surface dark:from-blue-950/40 dark:via-surface dark:to-surface border border-blue-200/60 dark:border-blue-800/40 rounded-3xl p-4 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-2 bg-primary/10 text-primary rounded-xl border border-primary/20">
                <Radio className="w-5 h-5 animate-pulse" />
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                LIVE SYNC
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
              Realtime Department Availability Board
            </h1>
            <p className="text-text-muted text-xs sm:text-sm mt-1 leading-relaxed">
              Live tracking of active Faculty &amp; Student Leave and On-Duty (OD) statuses across departments.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchBoardData(true)}
            disabled={refreshing || loading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-surface hover:bg-surface-soft text-text-primary border border-border rounded-xl text-xs font-extrabold transition-all shadow-xs shrink-0 disabled:opacity-50 active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-primary ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Board'}</span>
          </button>
        </div>

        {/* Stats Grid */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-5">
            {/* Faculty Availability */}
            <div className="bg-surface border border-border/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-text-muted text-[11px] font-bold uppercase tracking-wider">
                <span>Faculty On-Campus</span>
                <UserCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <div className="text-xl sm:text-2xl font-extrabold text-text-primary">
                  {summary.faculty.present} <span className="text-xs text-text-muted font-normal">/ {summary.faculty.total}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  {summary.faculty.availabilityRate}% Present
                </span>
              </div>
              <div className="mt-2.5 flex items-center gap-2 text-xs font-semibold text-text-muted pt-2 border-t border-border/60">
                <span className="text-amber-600 dark:text-amber-400">{summary.faculty.onLeave} On Leave</span>
                <span>•</span>
                <span className="text-blue-600 dark:text-blue-400">{summary.faculty.onOD} On-Duty</span>
              </div>
            </div>

            {/* Student Availability */}
            <div className="bg-surface border border-border/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-text-muted text-[11px] font-bold uppercase tracking-wider">
                <span>Students On-Campus</span>
                <Users className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <div className="text-xl sm:text-2xl font-extrabold text-text-primary">
                  {summary.student.present} <span className="text-xs text-text-muted font-normal">/ {summary.student.total}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  {summary.student.availabilityRate}% Present
                </span>
              </div>
              <div className="mt-2.5 flex items-center gap-2 text-xs font-semibold text-text-muted pt-2 border-t border-border/60">
                <span className="text-amber-600 dark:text-amber-400">{summary.student.onLeave} On Leave</span>
                <span>•</span>
                <span className="text-blue-600 dark:text-blue-400">{summary.student.onOD} On-Duty</span>
              </div>
            </div>

            {/* Total On Leave */}
            <div className="bg-surface border border-border/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-text-muted text-[11px] font-bold uppercase tracking-wider">
                <span>Active Leaves Today</span>
                <CalendarOff className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-2 text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                {summary.overall.totalOnLeave}
              </div>
              <p className="mt-2 text-xs text-text-muted pt-2 border-t border-border/60 truncate">
                Approved casual &amp; personal leaves
              </p>
            </div>

            {/* Total On Duty */}
            <div className="bg-surface border border-border/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-text-muted text-[11px] font-bold uppercase tracking-wider">
                <span>Active On-Duty (OD)</span>
                <Briefcase className="w-4 h-4 text-blue-500" />
              </div>
              <div className="mt-2 text-xl sm:text-2xl font-extrabold text-blue-600 dark:text-blue-400">
                {summary.overall.totalOnOD}
              </div>
              <p className="mt-2 text-xs text-text-muted pt-2 border-t border-border/60 truncate">
                Official events &amp; academic duty
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-3">
          {/* Department Filter */}
          <div className="flex items-center gap-2 bg-surface-soft border border-border rounded-xl px-3 py-2">
            <Building className="w-4 h-4 text-text-muted shrink-0" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-transparent text-text-primary text-xs font-bold focus:outline-none w-full cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          {/* Role Filter Chips */}
          <div className="flex items-center bg-surface-soft border border-border rounded-xl p-1 shrink-0 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedRole('ALL')}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                selectedRole === 'ALL' ? 'bg-primary text-white shadow-xs' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              All Roles
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('FACULTY')}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                selectedRole === 'FACULTY' ? 'bg-primary text-white shadow-xs' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Faculty
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('STUDENT')}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                selectedRole === 'STUDENT' ? 'bg-primary text-white shadow-xs' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Students
            </button>
          </div>

          {/* Type Filter */}
          <div className="flex items-center bg-surface-soft border border-border rounded-xl p-1 shrink-0 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedType('ALL')}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                selectedType === 'ALL' ? 'bg-surface text-text-primary shadow-xs border border-border' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              All Types
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('LEAVE')}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                selectedType === 'LEAVE' ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Leaves Only
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('ON_DUTY')}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                selectedType === 'ON_DUTY' ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              OD Only
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, employee/admission ID or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-soft border border-border rounded-xl text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60 font-medium"
          />
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="bg-surface border border-border/80 rounded-2xl p-12 text-center text-text-muted space-y-3 shadow-xs">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-sm font-bold text-text-primary">Fetching real-time department availability status...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-surface border border-border/80 rounded-2xl p-12 text-center space-y-3 shadow-xs">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-base font-extrabold text-text-primary">Full On-Campus Availability</h3>
          <p className="text-text-muted text-xs max-w-md mx-auto">
            No active approved student or faculty leaves/OD requests registered for today under the selected filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-surface border border-border/80 hover:border-primary/40 rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between space-y-4 group"
            >
              <div>
                {/* Header Badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                      item.category === 'ON_DUTY'
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    {item.category === 'ON_DUTY' ? (
                      <Briefcase className="w-3 h-3" />
                    ) : (
                      <CalendarOff className="w-3 h-3" />
                    )}
                    {item.category === 'ON_DUTY' ? 'ON DUTY (OD)' : `LEAVE (${item.leaveType})`}
                  </span>

                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                      item.role === 'FACULTY'
                        ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800'
                        : 'bg-surface-soft text-text-muted border-border'
                    }`}
                  >
                    {item.role}
                  </span>
                </div>

                {/* Person Profile */}
                <div className="flex items-start gap-3 mt-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-extrabold text-xs overflow-hidden shrink-0">
                    {item.avatarUrl ? (
                      <img src={item.avatarUrl} alt={item.personName} className="w-full h-full object-cover" />
                    ) : (
                      <span>{item.personName.substring(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-extrabold text-text-primary leading-snug group-hover:text-primary transition-colors truncate">{item.personName}</h4>
                    <p className="text-xs text-text-muted">{item.subTitle}</p>
                    <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
                      <Building className="w-3 h-3 text-text-muted" />
                      {item.department} {item.identifier ? `• ${item.identifier}` : ''}
                    </p>
                  </div>
                </div>

                {/* Duration & Details */}
                <div className="mt-4 pt-3 border-t border-border/60 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 text-text-primary font-semibold">
                    <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>
                      {formatDate(item.startDate)} - {formatDate(item.endDate)} {item.isHalfDay ? '(Half Day)' : ''}
                    </span>
                  </div>

                  <div className="text-text-muted bg-surface-soft p-2.5 rounded-xl border border-border/60 text-xs leading-relaxed italic">
                    "{item.reason || 'No reason provided'}"
                  </div>

                  {/* Faculty Substitute Info */}
                  {item.substituteName && (
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs font-medium">
                      <UserCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>Substitute: <strong>{item.substituteName}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action / Document Link */}
              {item.proofDocumentUrl && (
                <div className="pt-2 flex justify-end">
                  <a
                    href={item.proofDocumentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline transition-all"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Proof Document</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
