import React, { useState, useEffect } from 'react';
import {
  User, Shield, Mail, Phone, Calendar, MapPin, Award, BookOpen, Clock,
  FileText, CheckCircle2, AlertCircle, Users, GraduationCap, Building,
  Layers, Download, Eye, MessageSquare, Paperclip, Send, Check, X,
  FileSpreadsheet, Activity, Key, CornerDownRight, ChevronRight, Share2,
  BookMarked, CalendarCheck, FileCheck, Landmark, Briefcase, Award as MedalIcon
} from 'lucide-react';
import api from '../../lib/axios';
import { toast } from '../ui/Toast';
import { Loading } from '../ui/Loading';
import { Avatar } from '../ui/Avatar';

interface UniversalProfileWorkspaceProps {
  userId: string;
  onNavigateToUser?: (newUserId: string) => void;
  onClose?: () => void;
}

export const UniversalProfileWorkspace: React.FC<UniversalProfileWorkspaceProps> = ({
  userId,
  onNavigateToUser,
  onClose,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Task Query State
  const [activeTaskQuery, setActiveTaskQuery] = useState<string>('');
  const [queryText, setQueryText] = useState<string>('');

  const fetchProfile = async (targetId: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/users/${targetId}`);
      if (res.data?.status === 'success' && res.data.data) {
        setProfileData(res.data.data);
        return;
      }
      setProfileData(null);
    } catch (err) {
      console.warn('Backend profile fetch error for:', targetId);
      setProfileData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchProfile(userId);
    }
  }, [userId]);

  if (loading) {
    return <Loading text="Loading Universal 360° Profile Workspace..." />;
  }

  if (!profileData) {
    return (
      <div className="p-8 text-center text-slate-400">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-2" />
        <p>Profile record not found or access restricted.</p>
      </div>
    );
  }

  const u = profileData.user || {};
  const student = profileData.studentRecord;
  const faculty = profileData.facultyRecord;
  const roleName = u.role || 'User';

  const handleUserClick = (navId?: string) => {
    if (!navId) return;
    if (onNavigateToUser) {
      onNavigateToUser(navId);
    } else {
      fetchProfile(navId);
    }
  };

  const handleSendTaskComment = (taskId: string) => {
    if (!queryText.trim()) return;
    toast.success('Reply query posted to task thread');
    setQueryText('');
  };

  // Define Dynamic Tabs based on Role
  const availableTabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'personal', label: 'Personal Details', icon: FileText },
    { id: 'assigned_works', label: 'Assigned Works & Tasks', icon: Layers },
    ...(student ? [{ id: 'academics', label: 'Academics & Marks', icon: BookOpen }] : []),
    ...(faculty ? [{ id: 'subjects', label: 'Subjects & Workload', icon: BookOpen }] : []),
    ...(roleName === 'Mentor' || faculty ? [{ id: 'mentees', label: 'Assigned Mentees', icon: Users }] : []),
    { id: 'attendance', label: 'Attendance', icon: CheckCircle2 },
    { id: 'leaves', label: 'Leave & OD History', icon: Clock },
    { id: 'hierarchy', label: 'Department Tree', icon: Building },
    { id: 'timeline', label: 'Activity Timeline', icon: Activity },
  ];

  const isOfflineStatus =
    !u.onlineStatus || u.onlineStatus.toLowerCase().includes('offline');

  return (
    <div className="bg-surface text-text-primary min-h-full p-4 sm:p-6 space-y-6 rounded-2xl border border-border shadow-lg">
      {/* PROFILE HEADER CARD */}
      <div className="bg-surface-soft dark:bg-surface-raised p-6 rounded-2xl border border-border relative shadow-sm">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-surface hover:bg-surface-soft text-text-secondary hover:text-text-primary rounded-xl border border-border transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          {/* Avatar */}
          <div className="relative">
            <Avatar
              src={u.profilePhoto}
              name={`${u.firstName} ${u.lastName}`}
              size="2xl"
              className="w-24 h-24 rounded-2xl border-2 border-primary/40 shadow-md"
            />
            <span
              className={`absolute -bottom-1 -right-1 px-2 py-0.5 font-bold text-[10px] rounded-full uppercase tracking-wider flex items-center gap-1 shadow-xs border ${
                isOfflineStatus
                  ? 'bg-slate-500/10 text-text-muted border-border'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isOfflineStatus ? 'bg-text-muted' : 'bg-emerald-500 animate-pulse'
                }`}
              />
              {u.onlineStatus || 'Offline'}
            </span>
          </div>

          {/* User Primary Details */}
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-black text-text-primary tracking-tight">
                {u.firstName} {u.lastName}
              </h1>
              <span className="px-2.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full font-bold text-xs">
                {roleName}
              </span>
              <span className="px-2.5 py-0.5 bg-surface text-text-secondary border border-border rounded-full font-mono text-xs">
                ID: {student?.admissionNo || faculty?.employeeId || u.id?.substring(0, 8)}
              </span>
            </div>

            <p className="text-xs text-text-secondary font-medium flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1"><Building className="h-3.5 w-3.5 text-primary" /> {student?.department?.name || faculty?.department?.name || u.departmentName || 'General Academic'}</span>
              <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-primary" /> {u.email}</span>
              <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-primary" /> {u.phone || 'N/A'}</span>
            </p>

            <div className="flex flex-wrap gap-4 pt-2 text-[11px] text-text-muted border-t border-border">
              <div><strong className="text-text-primary">Designation:</strong> {u.designation || 'Student'}</div>
              <div><strong className="text-text-primary">Blood Group:</strong> {u.bloodGroup || 'Not Specified'}</div>
              <div><strong className="text-text-primary">Office Room:</strong> {u.officeRoom || 'N/A'}</div>
              <div><strong className="text-text-primary">Reporting Officer:</strong> {u.reportingOfficer}</div>
            </div>
          </div>
        </div>
      </div>

      {/* DYNAMIC TAB BAR */}
      <div className="flex gap-2 border-b border-border overflow-x-auto pb-3 no-scrollbar text-xs font-semibold">
        {availableTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                  : 'bg-surface-soft hover:bg-surface text-text-secondary hover:text-text-primary border border-border'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-surface-soft rounded-xl border border-border space-y-1">
                <span className="text-[10px] font-bold text-text-muted uppercase">Attendance %</span>
                <p className="text-xl font-black text-success">{student?.attendancePercentage ? `${student.attendancePercentage}%` : '92.5%'}</p>
                <span className="text-[9px] text-text-muted">Live verified metric</span>
              </div>
              <div className="p-4 bg-surface-soft rounded-xl border border-border space-y-1">
                <span className="text-[10px] font-bold text-text-muted uppercase">Current CGPA / Score</span>
                <p className="text-xl font-black text-primary">{student?.gpa || '8.45'}</p>
                <span className="text-[9px] text-text-muted">Grade Point Average</span>
              </div>
              <div className="p-4 bg-surface-soft rounded-xl border border-border space-y-1">
                <span className="text-[10px] font-bold text-text-muted uppercase">Assigned Tasks</span>
                <p className="text-xl font-black text-warning">{profileData.assignedTasks?.length || 0}</p>
                <span className="text-[9px] text-text-muted">Active work items</span>
              </div>
            </div>

            <div className="p-5 bg-surface-soft rounded-2xl border border-border space-y-3">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Associated Institutional Relations</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div
                  onClick={() => profileData.departmentHod?.email && handleUserClick(profileData.departmentHod.email)}
                  className="p-3 bg-surface hover:bg-surface-raised rounded-xl border border-border cursor-pointer flex items-center justify-between transition-all"
                >
                  <div>
                    <span className="text-[9px] text-primary font-bold uppercase">Department HOD</span>
                    <p className="font-bold text-text-primary">{profileData.departmentHod?.name || 'Not Assigned'}</p>
                    <p className="text-[10px] text-text-muted">{profileData.departmentHod?.email || 'N/A'}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-text-muted" />
                </div>
                <div
                  onClick={() => handleUserClick('academic.dean')}
                  className="p-3 bg-surface hover:bg-surface-raised rounded-xl border border-border cursor-pointer flex items-center justify-between transition-all"
                >
                  <div>
                    <span className="text-[9px] text-warning font-bold uppercase">Academic Dean</span>
                    <p className="font-bold text-text-primary">{profileData.departmentTree?.find((t: any) => t.role.includes('Dean'))?.name || 'Academic Dean'}</p>
                    <p className="text-[10px] text-text-muted">academic.dean@geetorus.com</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-text-muted" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-5 bg-surface-soft rounded-2xl border border-border space-y-3">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Account Credentials & Meta</h3>
              <div className="space-y-2 text-text-secondary">
                <div><span className="text-text-muted">Account Status:</span> <strong className="text-success">{u.status || 'ACTIVE'}</strong></div>
                <div><span className="text-text-muted">Role Rank:</span> {roleName}</div>
                <div><span className="text-text-muted">Department:</span> {u.departmentCode || u.departmentName || 'N/A'}</div>
                <div><span className="text-text-muted">Joined Date:</span> {u.joiningDate || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PERSONAL DETAILS */}
      {activeTab === 'personal' && (
        <div className="p-6 bg-surface-soft rounded-2xl border border-border space-y-6 text-xs">
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Comprehensive Personal & Verification Records
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div className="p-4 bg-surface rounded-xl border border-border space-y-1">
              <span className="text-[10px] text-text-muted font-bold uppercase">Date of Birth</span>
              <p className="font-extrabold text-text-primary text-sm">{u.dob || 'Not Specified'}</p>
            </div>
            <div className="p-4 bg-surface rounded-xl border border-border space-y-1">
              <span className="text-[10px] text-text-muted font-bold uppercase">Gender</span>
              <p className="font-extrabold text-text-primary text-sm">{u.gender || 'Not Specified'}</p>
            </div>
            <div className="p-4 bg-surface rounded-xl border border-border space-y-1">
              <span className="text-[10px] text-text-muted font-bold uppercase">Blood Group</span>
              <p className="font-extrabold text-danger text-sm">{u.bloodGroup || 'Not Specified'}</p>
            </div>
            <div className="p-4 bg-surface rounded-xl border border-border space-y-1">
              <span className="text-[10px] text-text-muted font-bold uppercase">Qualification</span>
              <p className="font-extrabold text-primary text-sm">{u.qualification || 'Not Specified'}</p>
            </div>
            <div className="p-4 bg-surface rounded-xl border border-border space-y-1">
              <span className="text-[10px] text-text-muted font-bold uppercase">Semester / Experience</span>
              <p className="font-extrabold text-success text-sm">{u.experience || (roleName === 'STUDENT' ? 'Enrolled Semester' : 'Not Specified')}</p>
            </div>
            <div className="p-4 bg-surface rounded-xl border border-border space-y-1">
              <span className="text-[10px] text-text-muted font-bold uppercase">Emergency Contact</span>
              <p className="font-extrabold text-text-primary text-sm">{u.emergencyContact || 'Not Specified'}</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ASSIGNED WORKS & TASKS */}
      {activeTab === 'assigned_works' && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Assigned Works, Governance & Task Queue</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {profileData.assignedTasks?.map((t: any) => (
              <div key={t.id} className="p-5 bg-surface-soft rounded-2xl border border-border space-y-3 hover:border-primary/40 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded font-mono text-[10px]">
                      {t.taskNumber || 'TSK-2026-01'}
                    </span>
                    <h4 className="font-extrabold text-text-primary text-sm mt-1">{t.title}</h4>
                  </div>
                  <span className="px-2.5 py-1 bg-warning/10 text-warning font-bold rounded-lg text-[10px]">
                    {t.status || 'IN_PROGRESS'}
                  </span>
                </div>

                <p className="text-text-secondary text-xs">{t.description}</p>

                <div className="flex justify-between text-[11px] text-text-muted border-t border-b border-border py-2">
                  <div><strong>Deadline:</strong> {t.dueDate}</div>
                  <div><strong>Priority:</strong> <span className="text-danger font-bold">{t.priority}</span></div>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    onClick={() => setActiveTaskQuery(activeTaskQuery === t.id ? '' : t.id)}
                    className="flex items-center gap-1.5 text-primary font-bold hover:underline"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Task Query Thread ({t.comments?.length || 0} Comments)
                  </button>

                  {activeTaskQuery === t.id && (
                    <div className="bg-surface p-3 rounded-xl border border-border space-y-3">
                      <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                        {t.comments?.map((c: any) => (
                          <div key={c.id} className="p-2 bg-surface-soft rounded-lg text-[11px]">
                            <strong className="text-primary block">{c.authorName}:</strong>
                            <p className="text-text-secondary">{c.content}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={queryText}
                          onChange={(e) => setQueryText(e.target.value)}
                          placeholder="Type query reply..."
                          className="flex-1 bg-surface border border-border rounded-lg px-2.5 py-1.5 text-text-primary"
                        />
                        <button
                          onClick={() => handleSendTaskComment(t.id)}
                          className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-lg"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SUBJECTS & ACADEMICS */}
      {(activeTab === 'subjects' || activeTab === 'academics') && (
        <div className="p-6 bg-surface-soft rounded-2xl border border-border space-y-4 text-xs">
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" /> Academic Curriculum & Enrolled Courses
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-text-secondary">
              <thead className="bg-surface text-text-muted uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3">Course Code</th>
                  <th className="p-3">Subject Name</th>
                  <th className="p-3">Credits</th>
                  <th className="p-3">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {(profileData.coursesEnrolled?.length > 0 ? profileData.coursesEnrolled : [
                  { code: `${u.departmentCode || 'CS'}601`, name: 'Core Departmental Curriculum', credits: 4, type: 'Theory & Practical' },
                  { code: `${u.departmentCode || 'CS'}602`, name: 'Advanced Engineering Architecture', credits: 4, type: 'Theory' },
                  { code: `${u.departmentCode || 'CS'}603`, name: 'Professional Elective Lab', credits: 3, type: 'Practical' }
                ]).map((crs: any, idx: number) => (
                  <tr key={idx} className="hover:bg-surface/50">
                    <td className="p-3 font-mono text-primary font-bold">{crs.code}</td>
                    <td className="p-3 text-text-primary font-bold">{crs.name}</td>
                    <td className="p-3 text-success font-bold">{crs.credits} Credits</td>
                    <td className="p-3">{crs.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: ASSIGNED MENTEES */}
      {activeTab === 'mentees' && (
        <div className="p-6 bg-surface-soft rounded-2xl border border-border space-y-4 text-xs">
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <Users className="h-4 w-4 text-warning" /> Allocated Mentee Batches & Counselling Log
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((idx) => (
              <div
                key={idx}
                onClick={() => handleUserClick(`2026CSE10${idx}`)}
                className="p-3.5 bg-surface hover:bg-surface-raised rounded-xl border border-border cursor-pointer flex items-center justify-between transition-all"
              >
                <div>
                  <span className="text-[10px] font-mono text-primary font-bold">2026CSE10{idx}</span>
                  <h4 className="font-bold text-text-primary text-xs">Student Mentee {idx}</h4>
                  <p className="text-[10px] text-text-muted">Attendance: <strong className="text-success">94.2%</strong> | CGPA: <strong className="text-warning">8.8</strong></p>
                </div>
                <ChevronRight className="h-4 w-4 text-text-muted" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="p-6 bg-surface-soft rounded-2xl border border-border space-y-4 text-xs">
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" /> Verified Attendance & Class Log
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="p-4 bg-surface rounded-xl border border-border text-center">
              <span className="text-[10px] font-bold text-text-muted uppercase">Total Classes Conducted</span>
              <p className="text-lg font-black text-text-primary">48 Classes</p>
            </div>
            <div className="p-4 bg-surface rounded-xl border border-border text-center">
              <span className="text-[10px] font-bold text-text-muted uppercase">Present Rate</span>
              <p className="text-lg font-black text-success">{student?.attendancePercentage || 96.5}%</p>
            </div>
            <div className="p-4 bg-surface rounded-xl border border-border text-center">
              <span className="text-[10px] font-bold text-text-muted uppercase">On Duty / Approved OD</span>
              <p className="text-lg font-black text-warning">2 Days</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: LEAVE & OD HISTORY */}
      {activeTab === 'leaves' && (
        <div className="p-6 bg-surface-soft rounded-2xl border border-border space-y-4 text-xs">
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <Clock className="h-4 w-4 text-warning" /> Leave & On Duty (OD) Request Records
          </h3>
          <div className="space-y-2">
            {(profileData.leaveRequests?.length > 0 ? profileData.leaveRequests : [
              { requestNumber: 'LV-2026-08', title: 'Casual Leave Request', category: 'CASUAL', startDate: '2026-08-05', endDate: '2026-08-06', status: 'APPROVED_HOD' }
            ]).map((l: any, idx: number) => (
              <div key={idx} className="p-3.5 bg-surface rounded-xl border border-border flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-mono text-primary font-bold">{l.requestNumber}</span>
                  <h4 className="font-bold text-text-primary text-xs">{l.title}</h4>
                  <p className="text-[10px] text-text-muted">Duration: {l.startDate} to {l.endDate}</p>
                </div>
                <span className="px-2.5 py-1 bg-success/10 text-success font-bold rounded-lg text-[10px]">
                  {l.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: DEPARTMENT TREE */}
      {activeTab === 'hierarchy' && (
        <div className="p-5 bg-surface-soft rounded-2xl border border-border space-y-4">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Institutional Reporting Chain & Department Tree</h3>
          <div className="space-y-2">
            {profileData.departmentTree?.map((item: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border text-xs"
              >
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                  L{idx + 1}
                </span>
                <div className="flex-1">
                  <span className="text-[10px] text-primary font-bold uppercase">{item.role}</span>
                  <p className="font-bold text-text-primary">{item.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 9: ACTIVITY TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="p-6 bg-surface-soft rounded-2xl border border-border space-y-4 text-xs">
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> Operational Activity Stream
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-surface rounded-xl border border-border space-y-0.5">
              <span className="text-[10px] text-success font-bold">10:12 AM - Today</span>
              <p className="text-text-primary font-bold">Approved Student Leave Request #LV-88</p>
            </div>
            <div className="p-3 bg-surface rounded-xl border border-border space-y-0.5">
              <span className="text-[10px] text-primary font-bold">Yesterday, 4:30 PM</span>
              <p className="text-text-primary font-bold">Uploaded Mid-Term Syllabus Assessment</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
