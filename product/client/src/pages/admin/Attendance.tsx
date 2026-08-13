import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarOff,
  BadgeCheck,
  Send,
  RotateCcw,
  Sparkles,
  BookOpen,
  Users,
  Search,
  CalendarDays
} from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import api from '../../lib/axios';

export const Attendance: React.FC = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState<any>(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE' | 'OD'>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSections = async () => {
    try {
      const res = await api.get('/academics/sections?pageSize=100');
      const list = res.data?.data || [];
      setSections(list);
      if (list.length > 0) {
        setSelectedSection(list[0]);
      }
    } catch (err) {
      console.error('Failed to load sections:', err);
    }
  };

  const fetchStudentsForSection = async (secId: string) => {
    if (!secId) return;
    try {
      setIsLoading(true);
      const res = await api.get(`/enterprise/students?pageSize=100&sectionId=${secId}`);
      const studentsList = res.data?.data || [];
      setStudents(studentsList);

      // Default all to PRESENT
      const map: Record<string, 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE' | 'OD'> = {};
      studentsList.forEach((s: any) => {
        map[s.id] = 'PRESENT';
      });
      setAttendanceMap(map);
    } catch (err) {
      console.error('Failed to load students:', err);
    } fontally: {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const handleSelectSection = (sec: any) => {
    setSelectedSection(sec);
    fetchStudentsForSection(sec.id);
    setStep(2);
  };

  const toggleStatus = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE' | 'OD') => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleMarkAllPresent = () => {
    const map: Record<string, 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE' | 'OD'> = {};
    students.forEach((s) => {
      map[s.id] = 'PRESENT';
    });
    setAttendanceMap(map);
    toast.success('Marked all students as Present');
  };

  const handleClearAll = () => {
    setAttendanceMap({});
    toast.info('Cleared rollcall choices');
  };

  const saveAttendance = async () => {
    if (Object.keys(attendanceMap).length === 0) {
      toast.error('Please mark attendance before committing');
      return;
    }

    try {
      setIsSubmitting(true);
      const records = Object.keys(attendanceMap).map((sid) => ({
        studentId: sid,
        status: attendanceMap[sid],
        remarks: `Guided Period Rollcall (${attendanceMap[sid]})`,
      }));

      const res = await api.post('/enterprise/attendance/bulk', {
        date: attendanceDate,
        type: 'DAILY',
        records,
      });

      if (res.data?.status === 'success') {
        toast.success(`Successfully published attendance for ${res.data.data?.count || records.length} students!`);
        setStep(1);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit attendance rollcall sheet');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Summary Metrics
  const counts = {
    present: Object.values(attendanceMap).filter((s) => s === 'PRESENT').length,
    absent: Object.values(attendanceMap).filter((s) => s === 'ABSENT').length,
    late: Object.values(attendanceMap).filter((s) => s === 'LATE').length,
    leave: Object.values(attendanceMap).filter((s) => s === 'LEAVE').length,
    od: Object.values(attendanceMap).filter((s) => s === 'OD').length,
  };

  const filteredStudents = students.filter(
    (s) =>
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.admissionNo || s.username || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface border border-border p-5 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
            <ClipboardCheck className="w-4 h-4" />
            <span>Faculty Attendance Desk</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
            Icon-Guided Period Attendance Sheet
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Select a class, mark student statuses with visual badges, review summary counts, and commit.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <input
            type="date"
            value={attendanceDate}
            onChange={(e) => setAttendanceDate(e.target.value)}
            className="px-3 py-2 bg-surface-soft border border-border rounded-xl text-xs font-bold text-text-primary focus:outline-none"
          />
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-surface-soft text-text-secondary hover:text-text-primary border border-border transition-colors"
            >
              Change Class
            </button>
          )}
        </div>
      </div>

      {/* STEP 1: CLASS SELECTION */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-text-muted flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <span>Step 1: Select Today's Class / Section</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sections.length === 0 ? (
              <div className="col-span-full p-8 text-center bg-surface rounded-2xl border border-border text-text-muted">
                No active sections assigned.
              </div>
            ) : (
              sections.map((sec) => (
                <div
                  key={sec.id}
                  onClick={() => handleSelectSection(sec)}
                  className="p-5 bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer group active:scale-98"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-1 text-[10px] font-extrabold bg-surface-soft text-text-secondary rounded-full border border-border">
                      {sec.semester?.name || 'Current Sem'}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-text-primary group-hover:text-primary transition-colors">
                    {sec.name}
                  </h3>
                  <p className="text-xs text-text-muted mt-1 font-medium">
                    {sec.department?.name || 'Department Section'}
                  </p>

                  <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
                    <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <ClipboardCheck className="w-4 h-4" />
                      Take Attendance
                    </span>
                    <span className="text-[11px] font-semibold text-text-muted">
                      {sec.studentCount || 'Enrolled'} Students
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* STEP 2: MARK ATTENDANCE */}
      {step === 2 && selectedSection && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Active Class Header & Quick Control Bar */}
          <div className="bg-surface p-5 rounded-2xl border border-border shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-[10px] font-extrabold uppercase rounded-full border border-primary/20">
                Active Rollcall
              </span>
              <h2 className="text-lg font-extrabold text-text-primary mt-1">
                {selectedSection.name} — {selectedSection.department?.name || 'Department'}
              </h2>
            </div>

            {/* Quick Action Tools */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleMarkAllPresent}
                className="px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold hover:bg-emerald-500/20 transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark All Present</span>
              </button>
              <button
                onClick={handleClearAll}
                className="px-3 py-2 rounded-xl bg-surface-soft text-text-secondary border border-border text-xs font-bold hover:text-text-primary transition-all flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Clear All</span>
              </button>
            </div>
          </div>

          {/* STEP 3: LIVE REVIEW KPI SUMMARY BAR */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                PRESENT
              </span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{counts.present}</span>
            </div>
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
                ABSENT
              </span>
              <span className="text-xl font-black text-rose-600 dark:text-rose-400">{counts.absent}</span>
            </div>
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                LATE
              </span>
              <span className="text-xl font-black text-amber-600 dark:text-amber-400">{counts.late}</span>
            </div>
            <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                LEAVE
              </span>
              <span className="text-xl font-black text-blue-600 dark:text-blue-400">{counts.leave}</span>
            </div>
            <div className="p-3.5 bg-purple-500/10 border border-purple-500/20 rounded-2xl col-span-2 sm:col-span-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
                ON DUTY (OD)
              </span>
              <span className="text-xl font-black text-purple-600 dark:text-purple-400">{counts.od}</span>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student by name or register number..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none font-medium"
            />
          </div>

          {/* Student Rollcall Card List */}
          {isLoading ? (
            <div className="p-12 text-center text-xs text-text-muted">Loading class roster...</div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-xs text-text-muted bg-surface rounded-2xl border border-border">
              No matching students found in this section.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredStudents.map((stu) => {
                const currentStatus = attendanceMap[stu.id] || 'PRESENT';
                const fullName = `${stu.firstName || ''} ${stu.lastName || ''}`.trim() || stu.username;
                const regNo = stu.admissionNo || stu.username || `STU-${stu.id.slice(-4).toUpperCase()}`;

                return (
                  <div
                    key={stu.id}
                    className="p-4 bg-surface rounded-2xl border border-border/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-border transition-all"
                  >
                    {/* Student Info */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-extrabold text-xs flex items-center justify-center shrink-0 border border-primary/20">
                        {stu.profilePhoto ? (
                          <img src={stu.profilePhoto} alt={fullName} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          fullName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-text-primary leading-tight">{fullName}</h4>
                        <p className="text-[11px] font-mono text-text-muted mt-0.5">Reg: {regNo}</p>
                      </div>
                    </div>

                    {/* Status Button Group */}
                    <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => toggleStatus(stu.id, 'PRESENT')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                          currentStatus === 'PRESENT'
                            ? 'bg-emerald-500 text-white shadow-xs'
                            : 'bg-surface-soft text-text-muted hover:text-text-primary border border-border'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Present</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleStatus(stu.id, 'ABSENT')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                          currentStatus === 'ABSENT'
                            ? 'bg-rose-500 text-white shadow-xs'
                            : 'bg-surface-soft text-text-muted hover:text-text-primary border border-border'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Absent</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleStatus(stu.id, 'LATE')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                          currentStatus === 'LATE'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-surface-soft text-text-muted hover:text-text-primary border border-border'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Late</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleStatus(stu.id, 'LEAVE')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                          currentStatus === 'LEAVE'
                            ? 'bg-blue-500 text-white shadow-xs'
                            : 'bg-surface-soft text-text-muted hover:text-text-primary border border-border'
                        }`}
                      >
                        <CalendarOff className="w-3.5 h-3.5" />
                        <span>Leave</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleStatus(stu.id, 'OD')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                          currentStatus === 'OD'
                            ? 'bg-purple-500 text-white shadow-xs'
                            : 'bg-surface-soft text-text-muted hover:text-text-primary border border-border'
                        }`}
                      >
                        <BadgeCheck className="w-3.5 h-3.5" />
                        <span>OD</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* STEP 4: STICKY SUBMIT BUTTON */}
          <div className="sticky bottom-6 z-30 pt-4 bg-gradient-to-t from-app-bg via-app-bg to-transparent">
            <button
              onClick={saveAttendance}
              disabled={isSubmitting || students.length === 0}
              className="w-full py-3.5 px-6 rounded-2xl bg-primary text-primary-foreground font-extrabold text-sm shadow-xl hover:bg-primary-hover active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Publishing Sheet...' : 'Submit Attendance Sheet'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
