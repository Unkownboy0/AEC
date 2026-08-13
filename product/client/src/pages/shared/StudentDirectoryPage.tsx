import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  Users,
  UserCheck,
  CalendarOff,
  Briefcase,
  Search,
  Filter,
  Mail,
  Phone,
  ArrowUpRight,
  Loader2,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { pageVariants } from '../../design-system/tokens/motion';
import api from '../../lib/axios';

interface StudentItem {
  id: string;
  name: string;
  rollNumber: string;
  department: string;
  departmentCode: string;
  email: string;
  phone: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'ON_DUTY';
  semester: string;
  section: string;
  details: string;
}

const DEPT_NAME_MAP: Record<string, string> = {
  CSE: 'Computer Science & Engg',
  EEE: 'Electrical & Electronics Engg',
  ECE: 'Electronics & Comm. Engg',
  MECH: 'Mechanical Engineering',
  CIVIL: 'Civil Engineering',
  IT: 'Information Technology',
  'AI-DS': 'AI & Data Science',
  GEN: 'General Academic',
};

const detectDepartment = (u: any) => {
  if (u.department?.name && u.department?.code) {
    return { name: u.department.name, code: u.department.code };
  }
  if (u.studentProfile?.department?.name && u.studentProfile?.department?.code) {
    return { name: u.studentProfile.department.name, code: u.studentProfile.department.code };
  }

  const text = `${u.firstName || ''} ${u.lastName || ''} ${u.username || ''} ${u.email || ''}`.toUpperCase();

  if (text.includes('EEE') || text.includes('.EEE@')) return { name: 'Electrical & Electronics Engg', code: 'EEE' };
  if (text.includes('CSE') || text.includes('.CSE@')) return { name: 'Computer Science & Engg', code: 'CSE' };
  if (text.includes('ECE') || text.includes('.ECE@')) return { name: 'Electronics & Comm. Engg', code: 'ECE' };
  if (text.includes('MECH') || text.includes('MECHANICAL') || text.includes('.MECH@')) return { name: 'Mechanical Engineering', code: 'MECH' };
  if (text.includes('CIVIL') || text.includes('.CIVIL@')) return { name: 'Civil Engineering', code: 'CIVIL' };
  if (text.includes('IT') || text.includes('.IT@')) return { name: 'Information Technology', code: 'IT' };
  if (text.includes('AI') || text.includes('DATA SCIENCE')) return { name: 'AI & Data Science', code: 'AI-DS' };

  return { name: 'General Academic', code: 'GEN' };
};

export const StudentDirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time Student Sync from Database
  const fetchRealtimeStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      const [usersRes, availRes] = await Promise.allSettled([
        api.get('/users?role=Student&pageSize=300'),
        api.get('/enterprise/analytics/department-availability')
      ]);

      const rawUsers = usersRes.status === 'fulfilled' ? (usersRes.value.data?.data?.users || usersRes.value.data?.data || []) : [];
      const availData = availRes.status === 'fulfilled' ? (availRes.value.data?.data || {}) : {};

      const leaveStudentSet = new Set<string>();
      const odStudentSet = new Set<string>();

      (availData.studentsOnLeaveToday || []).forEach((item: any) => {
        if (item.registerOrEmpId) leaveStudentSet.add(item.registerOrEmpId.toLowerCase());
        if (item.name) leaveStudentSet.add(item.name.toLowerCase());
      });

      (availData.studentsOnOdToday || []).forEach((item: any) => {
        if (item.registerOrEmpId) odStudentSet.add(item.registerOrEmpId.toLowerCase());
        if (item.name) odStudentSet.add(item.name.toLowerCase());
      });

      if (Array.isArray(rawUsers)) {
        const mapped: StudentItem[] = rawUsers.map((u: any) => {
          const deptInfo = detectDepartment(u);
          const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username || 'Student';
          const rollNo = u.username || u.studentProfile?.rollNumber || u.studentProfile?.admissionNo || `STU-${u.id.slice(-4).toUpperCase()}`;

          let realStatus: 'ACTIVE' | 'ON_LEAVE' | 'ON_DUTY' = 'ACTIVE';
          let detailText = `Roll No: ${rollNo} • Sem ${u.studentProfile?.semester || 'IV'} • Sec ${u.studentProfile?.section || 'A'}`;

          if (odStudentSet.has(rollNo.toLowerCase()) || odStudentSet.has(fullName.toLowerCase())) {
            realStatus = 'ON_DUTY';
            detailText = 'On Official Academic Duty (OD)';
          } else if (leaveStudentSet.has(rollNo.toLowerCase()) || leaveStudentSet.has(fullName.toLowerCase()) || u.status === 'INACTIVE') {
            realStatus = 'ON_LEAVE';
            detailText = 'On Approved Student Leave';
          }

          return {
            id: u.id,
            name: fullName,
            rollNumber: rollNo,
            department: deptInfo.name,
            departmentCode: deptInfo.code,
            email: u.email || 'N/A',
            phone: u.phone || '+91 98765 43210',
            status: realStatus,
            semester: u.studentProfile?.semester || 'IV',
            section: u.studentProfile?.section || 'A',
            details: detailText,
          };
        });

        setStudents(mapped);
      }
    } catch (err: any) {
      console.error('Real-time Students API sync error:', err?.message);
      setError('Failed to load realtime students from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealtimeStudents();
  }, []);

  // Filtering Logic
  const filteredStudents = students.filter((s) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      s.name.toLowerCase().includes(query) ||
      s.rollNumber.toLowerCase().includes(query) ||
      s.email.toLowerCase().includes(query) ||
      s.department.toLowerCase().includes(query) ||
      s.departmentCode.toLowerCase().includes(query);

    const matchesDepartment = selectedDepartment === 'ALL' || s.departmentCode === selectedDepartment;
    const matchesStatus = selectedStatus === 'ALL' || s.status === selectedStatus;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const totalCount = students.length;
  const activeCount = students.filter((s) => s.status === 'ACTIVE').length;
  const leaveCount = students.filter((s) => s.status === 'ON_LEAVE').length;
  const odCount = students.filter((s) => s.status === 'ON_DUTY').length;

  const availableDeptCodes = Array.from(new Set(students.map((s) => s.departmentCode).filter(Boolean))).sort();

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6 max-w-7xl mx-auto pb-28 sm:pb-12 p-4 sm:p-6"
    >
      {/* Student Directory Header */}
      <div className="relative bg-gradient-to-b from-blue-100/60 via-blue-50/40 to-transparent dark:from-blue-950/30 dark:via-blue-900/10 dark:to-transparent rounded-3xl p-4 sm:p-6 border border-blue-200/50 dark:border-blue-800/40 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <div>
            <div className="flex items-center gap-1.5 text-primary font-bold text-xs uppercase tracking-wider mb-1">
              <GraduationCap className="w-4 h-4" /> Student Master Directory
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
              Enrolled Student Registry
            </h1>
            <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
              Explore active enrolled students across all departments, programs, and academic semesters.
            </p>
          </div>
        </div>

        {/* Telemetry Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <div className="p-3 bg-surface rounded-2xl border border-border/80 shadow-xs flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-lg font-extrabold text-text-primary leading-none">{totalCount}</p>
              <p className="text-[10px] sm:text-[11px] font-bold text-text-muted leading-tight mt-0.5">Total Students</p>
            </div>
          </div>

          <div className="p-3 bg-surface rounded-2xl border border-border/80 shadow-xs flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-lg font-extrabold text-text-primary leading-none">{activeCount}</p>
              <p className="text-[10px] sm:text-[11px] font-bold text-text-muted leading-tight mt-0.5">On-Campus Present</p>
            </div>
          </div>

          <div className="p-3 bg-surface rounded-2xl border border-border/80 shadow-xs flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <CalendarOff className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-lg font-extrabold text-text-primary leading-none">{leaveCount}</p>
              <p className="text-[10px] sm:text-[11px] font-bold text-text-muted leading-tight mt-0.5">Approved Leave</p>
            </div>
          </div>

          <div className="p-3 bg-surface rounded-2xl border border-border/80 shadow-xs flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Briefcase className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-lg font-extrabold text-text-primary leading-none">{odCount}</p>
              <p className="text-[10px] sm:text-[11px] font-bold text-text-muted leading-tight mt-0.5">Official Duty</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border/80 shadow-xs space-y-3">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student by name, roll number, email, department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-soft border border-border rounded-xl text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60 font-medium"
          />
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
          {/* Department Filter */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[11px] font-bold text-text-muted shrink-0 hidden sm:inline-flex items-center gap-1">
              <Filter className="w-3 h-3" /> Dept:
            </span>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-surface-soft border border-border rounded-xl text-xs font-bold text-text-primary focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              {availableDeptCodes.map((code) => (
                <option key={code} value={code}>
                  {code} ({DEPT_NAME_MAP[code] || code})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="min-w-0">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-surface-soft border border-border rounded-xl text-xs font-bold text-text-primary focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active / Present</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="ON_DUTY">On Duty</option>
            </select>
          </div>

          {(selectedDepartment !== 'ALL' || selectedStatus !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedDepartment('ALL');
                setSelectedStatus('ALL');
              }}
              className="text-[11px] font-bold text-primary hover:underline px-2 py-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Student Cards Grid */}
      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center bg-surface rounded-2xl border border-border/80 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm font-bold text-text-primary">Syncing Real-time Enrolled Students...</p>
          <p className="text-xs text-text-muted">Fetching live student records directly from database.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="p-5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                    STUDENT
                  </span>

                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    student.status === 'ACTIVE'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                      : student.status === 'ON_DUTY'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                      : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                  }`}>
                    {student.status.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="font-extrabold text-text-primary text-base group-hover:text-primary transition-colors">
                  {student.name}
                </h3>
                <p className="text-xs font-semibold text-text-muted mt-0.5">
                  {student.department} • {student.rollNumber}
                </p>
                <p className="text-xs text-text-muted mt-2 leading-relaxed bg-surface-soft p-2.5 rounded-xl border border-border/60">
                  {student.details}
                </p>
              </div>

              <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                <div className="text-[11px] text-text-muted space-y-0.5 min-w-0">
                  <div className="truncate flex items-center gap-1">
                    <Mail className="w-3 h-3 text-text-muted shrink-0" />
                    <span className="truncate">{student.email}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/profile/${student.id}`)}
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

      {!loading && filteredStudents.length === 0 && (
        <div className="p-12 text-center bg-surface rounded-2xl border border-border space-y-2">
          <p className="text-base font-bold text-text-primary">No students match your criteria</p>
          <p className="text-xs text-text-muted">Try adjusting your search keyword or clearing the department filters.</p>
        </div>
      )}
    </motion.div>
  );
};

export default StudentDirectoryPage;
