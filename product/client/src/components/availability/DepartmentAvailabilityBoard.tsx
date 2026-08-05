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
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg">
                <Radio className="w-6 h-6 animate-pulse" />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                  Realtime Department Availability Board
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    LIVE
                  </span>
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  Live tracking of active Faculty & Student Leave and On-Duty (OD) statuses across departments.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => fetchBoardData(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-sm font-medium transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Board'}
          </button>
        </div>

        {/* Stats Grid */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {/* Faculty Availability */}
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
                <span>Faculty On-Campus</span>
                <UserCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <div className="text-2xl font-bold text-white">
                  {summary.faculty.present} <span className="text-xs text-slate-400 font-normal">/ {summary.faculty.total}</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {summary.faculty.availabilityRate}% Present
                </span>
              </div>
              <div className="mt-3 flex gap-3 text-xs text-slate-400">
                <span className="text-amber-400 font-medium">{summary.faculty.onLeave} On Leave</span>
                <span>•</span>
                <span className="text-blue-400 font-medium">{summary.faculty.onOD} On-Duty</span>
              </div>
            </div>

            {/* Student Availability */}
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
                <span>Students On-Campus</span>
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <div className="text-2xl font-bold text-white">
                  {summary.student.present} <span className="text-xs text-slate-400 font-normal">/ {summary.student.total}</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {summary.student.availabilityRate}% Present
                </span>
              </div>
              <div className="mt-3 flex gap-3 text-xs text-slate-400">
                <span className="text-amber-400 font-medium">{summary.student.onLeave} On Leave</span>
                <span>•</span>
                <span className="text-blue-400 font-medium">{summary.student.onOD} On-Duty</span>
              </div>
            </div>

            {/* Total On Leave */}
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
                <span>Active Leaves Today</span>
                <CalendarOff className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-2 text-2xl font-bold text-amber-400">
                {summary.overall.totalOnLeave}
              </div>
              <p className="mt-3 text-xs text-slate-400">
                Approved casual, medical & personal leaves
              </p>
            </div>

            {/* Total On Duty */}
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
                <span>Active On-Duty (OD)</span>
                <Briefcase className="w-4 h-4 text-blue-400" />
              </div>
              <div className="mt-2 text-2xl font-bold text-blue-400">
                {summary.overall.totalOnOD}
              </div>
              <p className="mt-3 text-xs text-slate-400">
                Official events, symposiums & work duty
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Filter Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Department Filter (For Deans & VPs) */}
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5">
            <Building className="w-4 h-4 text-slate-400" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-transparent text-white text-sm focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-1">
            <button
              onClick={() => setSelectedRole('ALL')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedRole === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Roles
            </button>
            <button
              onClick={() => setSelectedRole('FACULTY')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedRole === 'FACULTY' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Faculty
            </button>
            <button
              onClick={() => setSelectedRole('STUDENT')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedRole === 'STUDENT' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Students
            </button>
          </div>

          {/* Type Filter */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-1">
            <button
              onClick={() => setSelectedType('ALL')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedType === 'ALL' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setSelectedType('LEAVE')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedType === 'LEAVE' ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              Leaves Only
            </button>
            <button
              onClick={() => setSelectedType('ON_DUTY')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedType === 'ON_DUTY' ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              OD Only
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, ID or dept..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 text-sm rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500" />
          <p className="text-sm font-medium">Fetching real-time department availability status...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="text-lg font-semibold text-white">Full On-Campus Availability</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            No active approved student or faculty leaves/OD requests registered for today under the selected filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-lg transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header Badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      item.category === 'ON_DUTY'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {item.category === 'ON_DUTY' ? (
                      <Briefcase className="w-3.5 h-3.5" />
                    ) : (
                      <CalendarOff className="w-3.5 h-3.5" />
                    )}
                    {item.category === 'ON_DUTY' ? 'ON DUTY (OD)' : `LEAVE (${item.leaveType})`}
                  </span>

                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded ${
                      item.role === 'FACULTY'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {item.role}
                  </span>
                </div>

                {/* Person Profile */}
                <div className="flex items-start gap-3 mt-2">
                  <div className="w-11 h-11 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-semibold overflow-hidden shrink-0">
                    {item.avatarUrl ? (
                      <img src={item.avatarUrl} alt={item.personName} className="w-full h-full object-cover" />
                    ) : (
                      <span>{item.personName.substring(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-white leading-snug">{item.personName}</h4>
                    <p className="text-xs text-slate-400">{item.subTitle}</p>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <Building className="w-3 h-3 text-slate-400" />
                      {item.department} {item.identifier ? `• ${item.identifier}` : ''}
                    </p>
                  </div>
                </div>

                {/* Duration & Details */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>
                      {formatDate(item.startDate)} - {formatDate(item.endDate)} {item.isHalfDay ? '(Half Day)' : ''}
                    </span>
                  </div>

                  <div className="text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60 italic">
                    "{item.reason || 'No reason provided'}"
                  </div>

                  {/* Faculty Substitute Info */}
                  {item.substituteName && (
                    <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/30 p-2 rounded border border-emerald-900/40 text-xs">
                      <UserCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>Substitute Assigned: <strong>{item.substituteName}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action / Document Link */}
              {item.proofDocumentUrl && (
                <div className="mt-4 pt-2 flex justify-end">
                  <a
                    href={item.proofDocumentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
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
