import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Users,
  GraduationCap,
  UserCheck,
  Search,
  Filter,
  ShieldCheck,
  ChevronRight,
  Mail,
  Phone,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { pageVariants } from '../../design-system/tokens/motion';
import api from '../../lib/axios';

interface MemberItem {
  id: string;
  name: string;
  code: string;
  role: string;
  department: string;
  departmentCode: string;
  email: string;
  phone: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'ON_DUTY';
  details: string;
}

export const InstitutionDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const [members, setMembers] = useState<MemberItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time API Sync from Database (Users + Availability Board)
  const fetchRealtimeMembers = async () => {
    try {
      setLoading(true);
      setError(null);

      const [usersRes, availRes] = await Promise.allSettled([
        api.get('/users?pageSize=100'),
        api.get('/enterprise/analytics/department-availability')
      ]);

      const rawUsers = usersRes.status === 'fulfilled' ? (usersRes.value.data?.data?.users || usersRes.value.data?.data || []) : [];
      const availData = availRes.status === 'fulfilled' ? (availRes.value.data?.data || {}) : {};

      const leaveStaffSet = new Set<string>();
      const odStaffSet = new Set<string>();

      (availData.facultyOnLeaveToday || []).forEach((item: any) => {
        if (item.registerOrEmpId) leaveStaffSet.add(item.registerOrEmpId.toLowerCase());
        if (item.name) leaveStaffSet.add(item.name.toLowerCase());
      });

      (availData.facultyOnOdToday || []).forEach((item: any) => {
        if (item.registerOrEmpId) odStaffSet.add(item.registerOrEmpId.toLowerCase());
        if (item.name) odStaffSet.add(item.name.toLowerCase());
      });

      if (Array.isArray(rawUsers) && rawUsers.length > 0) {
        const mapped: MemberItem[] = rawUsers
          .filter((u: any) => {
            const roleName = (typeof u.role === 'object' ? u.role?.name : String(u.role || '')).toUpperCase();
            return !roleName.includes('STUDENT') && !roleName.includes('ADMIN') && !roleName.includes('PRINCIPAL');
          })
          .map((u: any) => {
            const roleStr = (typeof u.role === 'object' ? u.role?.name : String(u.role || '')).toUpperCase();
            let displayRole = 'FACULTY';
            if (roleStr.includes('VP') || roleStr.includes('VICE')) displayRole = 'VP';
            else if (roleStr.includes('HOD')) displayRole = 'HOD';
            else if (roleStr.includes('DEAN')) displayRole = 'DEAN';
            else if (roleStr.includes('FACULTY') || roleStr.includes('MENTOR')) displayRole = 'FACULTY';
            else displayRole = roleStr;

            const deptName = u.department?.name || u.facultyProfile?.department?.name || 'General Academic';
            const deptCode = u.department?.code || u.facultyProfile?.department?.code || 'GEN';
            const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username || 'Staff Member';
            const empId = u.username || u.facultyProfile?.employeeId || u.email || '';

            // Compute real-time Leave / OD status
            let realStatus: 'ACTIVE' | 'ON_LEAVE' | 'ON_DUTY' = 'ACTIVE';
            let detailText = u.facultyProfile?.designation || `${roleStr.replace('_', ' ')} • ${deptName}`;

            if (odStaffSet.has(empId.toLowerCase()) || odStaffSet.has(fullName.toLowerCase())) {
              realStatus = 'ON_DUTY';
              detailText = 'On Official Duty (OD) • Approved';
            } else if (leaveStaffSet.has(empId.toLowerCase()) || leaveStaffSet.has(fullName.toLowerCase()) || u.status === 'INACTIVE') {
              realStatus = 'ON_LEAVE';
              detailText = 'On Approved Leave';
            }

            return {
              id: u.id,
              name: fullName,
              code: u.username || u.facultyProfile?.employeeId || `EMP-${u.id.slice(-4).toUpperCase()}`,
              role: displayRole,
              department: deptName,
              departmentCode: deptCode,
              email: u.email || 'N/A',
              phone: u.phone || '+91 98765 43210',
              status: realStatus,
              details: detailText,
            };
          });

        setMembers(mapped);
        return;
      }
    } catch (err: any) {
      console.warn('Real-time Users API sync fallback for Institution Directory:', err?.message);
    } finally {
      setLoading(false);
    }

    setMembers([]);
  };

  useEffect(() => {
    fetchRealtimeMembers();
  }, []);

  // Filtering Logic
  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = selectedRole === 'ALL' || m.role === selectedRole;
    const matchesDepartment = selectedDepartment === 'ALL' || m.departmentCode === selectedDepartment;
    const matchesStatus = selectedStatus === 'ALL' || m.status === selectedStatus;

    return matchesSearch && matchesRole && matchesDepartment && matchesStatus;
  });

  const countHODs = members.filter((m) => m.role === 'HOD').length;
  const countFaculties = members.filter((m) => m.role === 'FACULTY').length;
  const countDeans = members.filter((m) => m.role === 'DEAN').length;

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6 max-w-7xl mx-auto pb-12 p-4 sm:p-6"
    >
      {/* Institution Master Header */}
      <div className="relative bg-gradient-to-b from-purple-100/60 via-purple-50/40 to-transparent dark:from-purple-950/30 dark:via-purple-900/10 dark:to-transparent rounded-3xl p-4 sm:p-6 border border-purple-200/50 dark:border-purple-800/40 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <div>
            <div className="flex items-center gap-1.5 text-primary font-bold text-xs uppercase tracking-wider mb-1">
              <Building2 className="w-3.5 h-3.5" /> Institution Master Directory
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
              Staff &amp; Leadership Directory
            </h1>
            <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
              Explore active Faculties, HODs, and Deans across departments.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/principal/reports')}
            className="px-3.5 py-2 rounded-xl font-bold text-xs border border-primary/40 bg-surface text-primary hover:bg-primary-soft transition-all flex items-center gap-1.5 shadow-xs shrink-0 active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Executive Reports</span>
          </button>
        </div>

        {/* Telemetry Count Summary */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="p-3 bg-surface rounded-2xl border border-border/80 shadow-xs flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-lg font-extrabold text-text-primary leading-none">{countHODs}</p>
              <p className="text-[10px] sm:text-[11px] font-bold text-text-muted truncate mt-0.5">HODs</p>
            </div>
          </div>

          <div className="p-3 bg-surface rounded-2xl border border-border/80 shadow-xs flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-lg font-extrabold text-text-primary leading-none">{countFaculties}</p>
              <p className="text-[10px] sm:text-[11px] font-bold text-text-muted truncate mt-0.5">Faculties</p>
            </div>
          </div>

          <div className="p-3 bg-surface rounded-2xl border border-border/80 shadow-xs flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-lg font-extrabold text-text-primary leading-none">{countDeans}</p>
              <p className="text-[10px] sm:text-[11px] font-bold text-text-muted truncate mt-0.5">Deans</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border/80 shadow-xs space-y-3">
        {/* Search Box */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search staff by name, employee ID, email, department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-soft border border-border rounded-xl text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60 font-medium"
          />
        </div>

        {/* Dropdowns Row */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
          {/* Department Filter */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[11px] font-bold text-text-muted shrink-0 hidden sm:inline-flex items-center gap-1">
              <Filter className="w-3 h-3" /> Dept:
            </span>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full sm:w-auto px-2.5 py-2 bg-surface-soft border border-border rounded-xl text-xs font-bold text-text-primary focus:outline-none"
            >
              <option value="ALL">All Departments</option>
              {Array.from(new Set(members.map((m) => m.departmentCode).filter(Boolean))).map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="min-w-0">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full sm:w-auto px-2.5 py-2 bg-surface-soft border border-border rounded-xl text-xs font-bold text-text-primary focus:outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active / Present</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="ON_DUTY">On Duty</option>
            </select>
          </div>
        </div>

        {/* Role Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-border/60 pb-1 scrollbar-none">
          <span className="text-[11px] font-bold text-text-muted shrink-0 mr-1">Role:</span>
          {['ALL', 'VP', 'DEAN', 'HOD', 'FACULTY'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setSelectedRole(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
                selectedRole === r
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface-soft text-text-muted hover:text-text-primary border border-border'
              }`}
            >
              {r === 'ALL' ? 'All Roles' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Member Cards Grid */}
      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center bg-surface rounded-2xl border border-border/80 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm font-bold text-text-primary">Syncing Real-time Institution Members...</p>
          <p className="text-xs text-text-muted">Fetching live staff records directly from database.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className="p-5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                    member.role === 'PRINCIPAL'
                      ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800'
                      : member.role === 'VP'
                      ? 'bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800'
                      : member.role === 'DEAN'
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
                      : member.role === 'HOD'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                      : member.role === 'FACULTY'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                      : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                  }`}>
                    {member.role}
                  </span>

                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    member.status === 'ACTIVE'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                      : member.status === 'ON_DUTY'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                      : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                  }`}>
                    {member.status.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="font-extrabold text-text-primary text-base group-hover:text-primary transition-colors">
                  {member.name}
                </h3>
                <p className="text-xs font-semibold text-text-muted mt-0.5">
                  {member.department} • {member.code}
                </p>
                <p className="text-xs text-text-muted mt-2 leading-relaxed bg-surface-soft p-2.5 rounded-xl border border-border/60">
                  {member.details}
                </p>
              </div>

              <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                <div className="text-[11px] text-text-muted space-y-0.5 min-w-0">
                  <div className="truncate flex items-center gap-1">
                    <Mail className="w-3 h-3 text-text-muted shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/profile/${member.id}`)}
                  className="px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 shrink-0"
                >
                  <span>360° Profile</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredMembers.length === 0 && (
        <div className="p-12 text-center bg-surface rounded-2xl border border-border space-y-2">
          <p className="text-base font-bold text-text-primary">No members match your criteria</p>
          <p className="text-xs text-text-muted">Try adjusting your search keyword or clearing the department/role filters.</p>
        </div>
      )}
    </motion.div>
  );
};

export default InstitutionDetailsPage;
