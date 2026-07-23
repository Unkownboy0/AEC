import React, { useState, useEffect } from 'react';
import {
  User, Clock, Send, Cpu, ShieldAlert, Layers, Users, Check, X
} from 'lucide-react';
import { toast } from '../components/ui/Toast';
import { Loading } from '../components/ui/Loading';
import api from '../lib/axios';

import { useDevice } from '../context/DeviceContext';

import { useSearchParams } from 'react-router-dom';

class ModuleErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Module error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="border border-rose-200 bg-rose-50 p-6 rounded-2xl text-center space-y-3">
          <p className="text-rose-600 font-extrabold text-sm">Module temporarily unavailable</p>
          <p className="text-muted-foreground text-xs font-semibold">An error occurred while loading this workspace component. Please try again later.</p>
          <button 
            type="button"
            onClick={() => this.setState({ hasError: false })} 
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md"
          >
            Retry Workspace
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

interface HODPortalProps {
  user: any;
}

export const HODPortal: React.FC<HODPortalProps> = ({ user }) => {
  const { isMobile } = useDevice();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  const setActiveTab = (tabId: string) => {
    setSearchParams({ tab: tabId });
  };
  const [profileData, setProfileData] = useState<any>(null);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [workflowTab, setWorkflowTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'DEPARTMENT'>('PENDING');
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [actionRequest, setActionRequest] = useState<any>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [actionComment, setActionComment] = useState('');
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [performance, setPerformance] = useState<any>(null);
  
  const [isLoading, setIsLoading] = useState(true);

  // Timetable Slot Generator Form
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [slotDay, setSlotDay] = useState('MONDAY');
  const [slotIndex, setSlotIndex] = useState(1);
  const [roomNo, setRoomNo] = useState('');

  // Announcement Form
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceContent, setAnnounceContent] = useState('');

  // Faculty Allocator Form
  const [allocFaculty, setAllocFaculty] = useState('');
  const [allocSubject, setAllocSubject] = useState('');
  const [allocSection, setAllocSection] = useState('');

  const dataFetchedRef = React.useRef(false);

  const fetchHODDashboardData = async () => {
    if (dataFetchedRef.current) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      
      const [statsRes, timetableRes, studentsRes, facultyRes, workflowRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/timetables/slots'),
        api.get('/enterprise/students?pageSize=50'),
        api.get('/enterprise/faculty?pageSize=50'),
        api.get('/workflows/requests')
      ]);

      if (statsRes.data?.status === 'success') {
        const metrics = statsRes.data.data.metrics;
        setProfileData(metrics);

        setPrograms([
          { code: 'B.TECH-CSE', name: 'Bachelor of Technology in CSE', level: 'UG', duration: 4 },
          { code: 'M.TECH-CSE', name: 'Master of Technology in CSE', level: 'PG', duration: 2 }
        ]);



        setSubjects([
          { code: 'CS6101', name: 'Design and Analysis of Algorithms', credits: 4, theory: 3, practical: 2 },
          { code: 'CS6102', name: 'Database Management Systems', credits: 4, theory: 3, practical: 2 },
          { code: 'CS6103', name: 'Operating Systems Concepts', credits: 3, theory: 3, practical: 0 }
        ]);

        setPerformance({
          syllabusCompletion: 92.5,
          facultyAttendance: 98.0,
          studentPassRate: 94.2,
          counselingSessionCount: 14
        });

        setAnnouncements([
          { title: 'Odd Semester Course Mapping Review', date: '2026-07-12', content: 'All faculty must submit their subject outcomes mapping for evaluation by the curriculum committee.' }
        ]);
      }

      if (timetableRes.data?.status === 'success') {
        setTimetable(timetableRes.data.data);
      }

      if (studentsRes.data?.status === 'success') {
        setStudents(studentsRes.data.data);
      }

      if (facultyRes.data?.status === 'success') {
        setFaculty(facultyRes.data.data);
      }

      if (workflowRes.data?.status === 'success') {
        setRequests(workflowRes.data.data);
      }

      dataFetchedRef.current = true;
    } catch (err) {
      console.error(err);
      toast.error('Failed to load department HOD control center.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchHODDashboardData();
    }
  }, [user?.id]);

  // Handle Workflow Status Updates (Approve/Reject)
  const handleWorkflowAction = async (id: string, action: 'APPROVE' | 'REJECT', comment: string) => {
    setIsActionLoading(id);
    try {
      const res = await api.post(`/workflows/requests/${id}/action`, {
        action,
        comment
      });
      if (res.data?.status === 'success') {
        toast.success(`Workflow Request ${action === 'APPROVE' ? 'Approved' : 'Rejected'} successfully.`);
        fetchHODDashboardData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Action update failed.');
    } finally {
      setIsActionLoading(null);
    }
  };

  // Timetable Generator Slot creation
  const handleScheduleSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFaculty || !selectedSubject || !selectedSection || !selectedSemester || !roomNo) {
      toast.error('All timetable slot mappings are required.');
      return;
    }

    try {
      const res = await api.post('/timetables/slots', {
        departmentId: profileData?.departmentId || 'none',
        semesterId: selectedSemester,
        sectionId: selectedSection,
        subjectId: selectedSubject,
        facultyId: selectedFaculty,
        dayOfWeek: slotDay,
        slotIndex: Number(slotIndex),
        roomNo
      });

      if (res.data?.status === 'success') {
        toast.success('Timetable slot scheduled successfully with conflict-free validation.');
        fetchHODDashboardData();
        setRoomNo('');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Conflict detected in slot scheduling.');
    }
  };

  // Allocate Faculty
  const handleFacultyAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocFaculty || !allocSubject || !allocSection) return;
    toast.success('Subject allocation mapped successfully.');
    setAllocFaculty('');
    setAllocSubject('');
    setAllocSection('');
  };

  // Publish Circular notice
  const handlePublishAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announceTitle || !announceContent) return;
    setAnnouncements([...announcements, { title: announceTitle, date: new Date().toISOString().split('T')[0], content: announceContent }]);
    setAnnounceTitle('');
    setAnnounceContent('');
    toast.success('Circular announcement published to department dashboard.');
  };

  if (isLoading) {
    return (
      <div className="flex h-[75vh] items-center justify-center">
        <Loading text="Initializing secure HOD command center..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <ModuleErrorBoundary>

        {/* OVERVIEW DASHBOARD */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* HOD Profile Details Card */}
            <div className="border bg-card p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex flex-wrap items-center gap-4 text-center md:text-left">
                <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-extrabold text-xl overflow-hidden shrink-0 border-2 border-primary/20">
                  {user.profilePhoto ? (
                    <img src={user.profilePhoto} className="h-full w-full object-cover" alt="Avatar" />
                  ) : (
                    <>
                      {user.firstName[0]}
                      {user.lastName[0]}
                    </>
                  )}
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-foreground">{user.firstName} {user.lastName}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground font-black uppercase">
                    <span className="bg-indigo-50 border text-indigo-600 px-2 py-0.5 rounded">HOD CSE</span>
                    <span>Employee ID: {profileData?.employeeId || 'HOD001'}</span>
                  </div>
                  <div className="text-xs text-muted-foreground font-semibold space-y-0.5">
                    <p>Department: <span className="text-foreground font-bold">{profileData?.department?.name || 'Computer Science & Engineering'}</span></p>
                    <p>Designation: <span className="text-foreground font-bold">{profileData?.designation || 'Professor & Head'}</span></p>
                    <p>Email: <span className="text-foreground font-bold font-mono">{user.email}</span> · Phone: <span className="text-foreground font-bold font-mono">{user.phone || '+91 99999 11111'}</span></p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center md:items-end bg-muted/40 p-4 rounded-xl border text-xs font-bold leading-tight w-full md:w-auto">
                <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">Academic Year</span>
                <span className="text-lg font-extrabold text-primary block mt-1">2026-2027</span>
                <span className="text-[8px] text-muted-foreground font-black uppercase mt-1 block">Active Assignment</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-4 gap-4 animate-in slide-in-from-top-4 duration-300">
              <div className="border bg-card p-4 rounded-xl shadow-sm text-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Department Faculty</span>
                <span className="text-2xl font-extrabold text-primary block mt-2">{faculty.length} Faculty</span>
                <span className="text-[9px] text-muted-foreground font-semibold block mt-1">Accredited Staff</span>
              </div>
              <div className="border bg-card p-4 rounded-xl shadow-sm text-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Total Students</span>
                <span className="text-2xl font-extrabold text-emerald-500 block mt-2">{students.length} Students</span>
                <span className="text-[9px] text-muted-foreground font-semibold block mt-1">Enrolled CSE</span>
              </div>
              <div className="border bg-card p-4 rounded-xl shadow-sm text-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Syllabus Complete</span>
                <span className="text-2xl font-extrabold text-indigo-500 block mt-2">{performance?.syllabusCompletion}%</span>
                <span className="text-[9px] text-muted-foreground font-semibold block mt-1">Current Progress</span>
              </div>
              <div className="border bg-card p-4 rounded-xl shadow-sm text-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Student Pass Rate</span>
                <span className="text-2xl font-extrabold text-amber-500 block mt-2">{performance?.studentPassRate}%</span>
                <span className="text-[9px] text-muted-foreground font-semibold block mt-1">Exams Ledger</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Programs list */}
              <div className="border bg-card p-4 rounded-xl shadow-sm space-y-3">
                <h4 className="text-xs uppercase font-extrabold text-muted-foreground tracking-wider">Department Programs</h4>
                <div className="space-y-2 text-xs font-semibold">
                  {programs.map((prog, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 border rounded-lg bg-background">
                      <div>
                        <span className="text-[9px] font-bold text-primary tracking-wider uppercase">{prog.level} · {prog.duration} Years</span>
                        <h5 className="text-xs font-bold">{prog.name}</h5>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Department bullet bulletin */}
              <div className="border bg-card p-4 rounded-xl shadow-sm space-y-3">
                <h4 className="text-xs uppercase font-extrabold text-muted-foreground tracking-wider">Department Bulletins</h4>
                <div className="space-y-3 text-xs font-semibold">
                  {announcements.map((item, idx) => (
                    <div key={idx} className="border-b last:border-b-0 pb-2.5 last:pb-0 space-y-1">
                      <div className="flex justify-between items-center">
                        <h5 className="text-xs font-bold text-foreground">{item.title}</h5>
                        <span className="text-[9px] text-muted-foreground">{item.date}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">{item.content}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* WORKFLOW REQUESTS APPROVAL */}
        {activeTab === 'workflows' && (
          <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4 text-left">
            <div>
              <h3 className="text-sm font-extrabold uppercase border-b pb-2">Leave & OD Approvals</h3>
              <p className="text-[11px] text-muted-foreground mt-1">Review, approve, or reject department student leave and OD requests.</p>
            </div>

            {/* Tab Sections */}
            <div className="flex border rounded-xl overflow-hidden text-xs font-bold w-fit bg-card">
              {[
                { id: 'PENDING', label: 'Pending Approval' },
                { id: 'APPROVED', label: 'Approved' },
                { id: 'REJECTED', label: 'Rejected' },
                { id: 'DEPARTMENT', label: 'Department Requests' },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setWorkflowTab(tab.id as any)}
                  className={`px-4 py-2.5 border-r last:border-r-0 transition-colors ${
                    workflowTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {tab.label} ({
                    requests.filter(item => {
                      if (tab.id === 'PENDING') return item.currentStep === 'HOD' && item.status === 'MENTOR_APPROVED';
                      if (tab.id === 'APPROVED') return item.status === 'APPROVED';
                      if (tab.id === 'REJECTED') return ['REJECTED', 'REJECTED_BY_MENTOR', 'REJECTED_BY_HOD'].includes(item.status);
                      if (tab.id === 'DEPARTMENT') return true;
                      return false;
                    }).length
                  })
                </button>
              ))}
            </div>

            <div className="overflow-x-auto text-xs font-semibold">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b bg-muted/20 text-[9px] uppercase font-bold text-muted-foreground">
                    <th className="p-3">Student Details</th>
                    <th className="p-3">Category & Type</th>
                    <th className="p-3">Dates & Days</th>
                    <th className="p-3">Reason / Details</th>
                    <th className="p-3">Remarks History</th>
                    <th className="p-3 text-center">Decisions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {requests
                    .filter(item => {
                      if (workflowTab === 'PENDING') return item.currentStep === 'HOD' && item.status === 'MENTOR_APPROVED';
                      if (workflowTab === 'APPROVED') return item.status === 'APPROVED';
                      if (workflowTab === 'REJECTED') return ['REJECTED', 'REJECTED_BY_MENTOR', 'REJECTED_BY_HOD'].includes(item.status);
                      if (workflowTab === 'DEPARTMENT') return true;
                      return false;
                    })
                    .map((item, idx) => {
                      const days = item.startDate && item.endDate
                        ? Math.ceil((new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / (1000 * 3600 * 24)) + 1
                        : 0;

                      const mentorRemarks = item.history?.find((h: any) => h.stage === 'MENTOR' && h.comment)?.comment || 'No remarks';
                      const hodRemarks = item.history?.find((h: any) => h.stage === 'HOD' && h.comment)?.comment || 'No remarks';

                      return (
                        <tr key={item.id || idx} className="border-b last:border-b-0 hover:bg-muted/10">
                          <td className="p-3 space-y-1">
                            <p className="font-extrabold text-foreground">{item.student?.firstName} {item.student?.lastName}</p>
                            <p className="text-[9px] text-muted-foreground font-mono uppercase">
                              Reg: {item.student?.registerNo || 'N/A'} · Adm: {item.student?.admissionNo || 'N/A'}
                            </p>
                            <p className="text-[9px] text-muted-foreground font-mono uppercase">
                              Sem {item.student?.semester?.number || 'N/A'} · Sec {item.student?.section?.name || 'N/A'}
                            </p>
                          </td>
                          <td className="p-3 space-y-1">
                            <span className="inline-block bg-primary/10 border border-primary/20 px-2 py-0.5 rounded text-[8px] text-primary font-black uppercase">
                              {item.type}
                            </span>
                            <p className="text-[10px] font-bold text-foreground truncate max-w-[150px]">{item.title}</p>
                          </td>
                          <td className="p-3 space-y-1">
                            <p className="text-[10px] font-bold text-foreground">
                              {item.startDate ? new Date(item.startDate).toLocaleDateString('en-IN') : 'N/A'} to{' '}
                              {item.endDate ? new Date(item.endDate).toLocaleDateString('en-IN') : 'N/A'}
                            </p>
                            <span className="inline-block bg-slate-100 px-1.5 py-0.5 rounded text-[9px] font-black text-slate-600">
                              {days} {days === 1 ? 'Day' : 'Days'}
                            </span>
                          </td>
                          <td className="p-3 space-y-1 max-w-[200px]">
                            <p className="text-[10px] text-muted-foreground leading-relaxed whitespace-pre-wrap">{item.reason}</p>
                            {item.attachments && item.attachments !== '[]' && (() => {
                              try {
                                const parsed = JSON.parse(item.attachments);
                                if (parsed.length > 0) {
                                  return (
                                    <a
                                      href={parsed[0]}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 text-[9px] text-primary font-extrabold hover:underline"
                                    >
                                      📄 View Attachment
                                    </a>
                                  );
                                }
                              } catch (_) {}
                              return null;
                            })()}
                          </td>
                          <td className="p-3 space-y-1">
                            <p className="text-[9px] text-muted-foreground">
                              <span className="font-extrabold text-slate-700">Mentor Remarks:</span> {mentorRemarks}
                            </p>
                            {(item.status === 'APPROVED' || item.status === 'REJECTED_BY_HOD') && (
                              <p className="text-[9px] text-muted-foreground">
                                <span className="font-extrabold text-slate-700">HOD Remarks:</span> {hodRemarks}
                              </p>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {workflowTab === 'PENDING' ? (
                              <div className="flex flex-wrap justify-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setActionRequest(item);
                                    setActionType('APPROVE');
                                    setActionComment('');
                                    setCommentModalOpen(true);
                                  }}
                                  className="p-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-100 hover:text-emerald-700 transition-colors shadow-sm duration-200"
                                  title="Approve Request"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setActionRequest(item);
                                    setActionType('REJECT');
                                    setActionComment('');
                                    setCommentModalOpen(true);
                                  }}
                                  className="p-1.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-100 hover:text-rose-700 transition-colors shadow-sm duration-200"
                                  title="Reject Request"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                                item.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                ['REJECTED', 'REJECTED_BY_MENTOR', 'REJECTED_BY_HOD'].includes(item.status) ? 'bg-rose-50 text-rose-600 border-rose-200' :
                                'bg-amber-50 text-amber-600 border-amber-200'
                              }`}>
                                {item.status.replace(/_/g, ' ')}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  {requests.filter(item => {
                    if (workflowTab === 'PENDING') return item.currentStep === 'HOD' && item.status === 'MENTOR_APPROVED';
                    if (workflowTab === 'APPROVED') return item.status === 'APPROVED';
                    if (workflowTab === 'REJECTED') return ['REJECTED', 'REJECTED_BY_MENTOR', 'REJECTED_BY_HOD'].includes(item.status);
                    if (workflowTab === 'DEPARTMENT') return true;
                    return false;
                  }).length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        No workflow requests found in this section.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Decision Comments Modal */}
        {commentModalOpen && actionRequest && (
          <div className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-md p-6 rounded-2xl shadow-xl border space-y-4 text-left animate-in zoom-in-95 duration-200">
              <div>
                <h3 className="text-sm font-black uppercase text-foreground">
                  {actionType === 'APPROVE' ? 'Approve Student Request' : 'Reject Student Request'}
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-bold">
                  Request for {actionRequest.student?.firstName} {actionRequest.student?.lastName} · Category: {actionRequest.type}
                </p>
              </div>

              <div className="space-y-1.5 text-xs font-semibold">
                <label className="text-[9px] uppercase font-bold text-muted-foreground">Remarks / Comments</label>
                <textarea
                  value={actionComment}
                  onChange={e => setActionComment(e.target.value)}
                  placeholder="Enter HOD remarks or feedback..."
                  className="w-full h-24 border rounded-xl bg-background p-3 focus:outline-none focus:ring-1 focus:ring-primary text-xs font-semibold resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setCommentModalOpen(false)}
                  className="px-4 py-2 border bg-card hover:bg-muted rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleWorkflowAction(actionRequest.id, actionType, actionComment);
                    setCommentModalOpen(false);
                  }}
                  disabled={isActionLoading === actionRequest.id}
                  className={`px-4 py-2 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                    actionType === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {isActionLoading === actionRequest.id ? (
                    <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : null}
                  Confirm Action
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TIMETABLE SCHEDULER */}
        {activeTab === 'timetable' && (
          <div className="space-y-6">
            
            {/* Create Schedule Slot */}
            <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold uppercase border-b pb-2">Schedule Class Timetable Slot</h3>
              <form onSubmit={handleScheduleSlot} className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-semibold">
                
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Select Faculty</label>
                  <select
                    value={selectedFaculty}
                    onChange={e => setSelectedFaculty(e.target.value)}
                    className="h-9 border rounded bg-background px-3"
                  >
                    <option value="">Select faculty...</option>
                    {faculty.map((f, idx) => (
                      <option key={idx} value={f.id}>{f.firstName} {f.lastName}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Assigned Subject</label>
                  <select
                    value={selectedSubject}
                    onChange={e => setSelectedSubject(e.target.value)}
                    className="h-9 border rounded bg-background px-3"
                  >
                    <option value="">Select subject...</option>
                    {subjects.map((sub, idx) => (
                      <option key={idx} value={sub.code}>{sub.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Semester</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Semester 3"
                    value={selectedSemester}
                    onChange={e => setSelectedSemester(e.target.value)}
                    className="h-9 border rounded bg-background px-3"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Section</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Section A"
                    value={selectedSection}
                    onChange={e => setSelectedSection(e.target.value)}
                    className="h-9 border rounded bg-background px-3"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Day of week</label>
                  <select
                    value={slotDay}
                    onChange={e => setSlotDay(e.target.value)}
                    className="h-9 border rounded bg-background px-3"
                  >
                    <option value="MONDAY">Monday</option>
                    <option value="TUESDAY">Tuesday</option>
                    <option value="WEDNESDAY">Wednesday</option>
                    <option value="THURSDAY">Thursday</option>
                    <option value="FRIDAY">Friday</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Period Slot Index</label>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    required
                    value={slotIndex}
                    onChange={e => setSlotIndex(Number(e.target.value))}
                    className="h-9 border rounded bg-background px-3 text-center"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Room No Allocation</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lab 3 / Room 102"
                    value={roomNo}
                    onChange={e => setRoomNo(e.target.value)}
                    className="h-9 border rounded bg-background px-3"
                  />
                </div>

                <button type="submit" className="md:col-span-4 h-9 bg-primary text-primary-foreground rounded font-bold hover:bg-primary/95">
                  Publish Conflict-Free Slot
                </button>
              </form>
            </div>

            {/* List Timetable */}
            <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold uppercase border-b pb-2">Accredited Department Timetables</h3>
              <div className="space-y-3">
                {timetable.map((slot, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3.5 border rounded-lg bg-background text-xs font-semibold">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-primary tracking-wider uppercase">{slot.dayOfWeek} · Period {slot.slotIndex}</span>
                      <h4 className="text-xs font-bold">{slot.subject?.name}</h4>
                      <p className="text-[10px] text-muted-foreground">Faculty Coordinator: {slot.faculty?.firstName} {slot.faculty?.lastName} · Location: {slot.roomNo}</p>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-muted px-2.5 py-1 rounded">
                      {slot.startTime} - {slot.endTime}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* FACULTY ALLOCATIONS */}
        {activeTab === 'allocations' && (
          <div className="space-y-6">
            <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold uppercase border-b pb-2">Faculty Subject Mapping Allocator</h3>
              <form onSubmit={handleFacultyAllocation} className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-semibold">
                
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Select Faculty</label>
                  <select
                    value={allocFaculty}
                    onChange={e => setAllocFaculty(e.target.value)}
                    className="h-9 border rounded bg-background px-3"
                  >
                    <option value="">Select faculty...</option>
                    {faculty.map((f, idx) => (
                      <option key={idx} value={f.id}>{f.firstName} {f.lastName}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Subject Code</label>
                  <select
                    value={allocSubject}
                    onChange={e => setAllocSubject(e.target.value)}
                    className="h-9 border rounded bg-background px-3"
                  >
                    <option value="">Select subject...</option>
                    {subjects.map((sub, idx) => (
                      <option key={idx} value={sub.code}>{sub.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Section Placement</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Section A"
                    value={allocSection}
                    onChange={e => setAllocSection(e.target.value)}
                    className="h-9 border rounded bg-background px-3"
                  />
                </div>

                <button type="submit" className="md:col-span-4 h-9 bg-primary text-primary-foreground rounded font-bold hover:bg-primary/95">
                  Publish Subject Allocation
                </button>
              </form>
            </div>
          </div>
        )}

        {/* STUDENT DIRECTORY */}
        {activeTab === 'students' && (
          <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold uppercase border-b pb-2">Department Student Directory</h3>
            {isMobile ? (
              <div className="space-y-3">
                {students.map((std, idx) => (
                  <div key={idx} className="p-4 border rounded-xl bg-background space-y-2 text-xs font-semibold text-left">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-extrabold text-slate-800 text-xs">{std.firstName} {std.lastName}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{std.admissionNo}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] pt-1">
                      <span className="text-muted-foreground">Program / Sem: <span className="text-foreground font-bold">{std.program?.code} / {std.semester?.name}</span></span>
                      <span className="text-primary font-bold">CGPA: 9.50</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto text-xs font-semibold">
                <table className="w-full text-left border">
                  <thead>
                    <tr className="border-b bg-muted/20 text-[9px] uppercase font-bold text-muted-foreground">
                      <th className="p-2.5">Roll No</th>
                      <th className="p-2.5">Student Name</th>
                      <th className="p-2.5">Program / Semester</th>
                      <th className="p-2.5 text-center">CGPA Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((std, idx) => (
                      <tr key={idx} className="border-b last:border-b-0 hover:bg-muted/10 font-semibold">
                        <td className="p-2.5 font-mono font-bold">{std.admissionNo}</td>
                        <td className="p-2.5">{std.firstName} {std.lastName}</td>
                        <td className="p-2.5">{std.program?.code} / {std.semester?.name}</td>
                        <td className="p-2.5 text-center text-primary font-bold">9.50</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* FACULTY ROSTER */}
        {activeTab === 'faculty' && (
          <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold uppercase border-b pb-2">Accredited Department Faculty</h3>
            {isMobile ? (
              <div className="space-y-3">
                {faculty.map((f, idx) => (
                  <div key={idx} className="p-4 border rounded-xl bg-background space-y-2 text-xs font-semibold text-left">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-extrabold text-slate-800 text-xs">{f.firstName} {f.lastName}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{f.employeeId}</span>
                    </div>
                    <div className="flex flex-col gap-1 text-[10px] pt-1">
                      <p><span className="text-muted-foreground">Designation:</span> <span className="text-foreground font-bold">{f.designation}</span></p>
                      <p><span className="text-muted-foreground">Email:</span> <span className="text-foreground font-mono">{f.email}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto text-xs font-semibold">
                <table className="w-full text-left border">
                  <thead>
                    <tr className="border-b bg-muted/20 text-[9px] uppercase font-bold text-muted-foreground">
                      <th className="p-2.5">Employee ID</th>
                      <th className="p-2.5">Faculty Name</th>
                      <th className="p-2.5">Designation</th>
                      <th className="p-2.5">Contact Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {faculty.map((f, idx) => (
                      <tr key={idx} className="border-b last:border-b-0 hover:bg-muted/10 font-semibold">
                        <td className="p-2.5 font-mono font-bold">{f.employeeId}</td>
                        <td className="p-2.5">{f.firstName} {f.lastName}</td>
                        <td className="p-2.5 font-bold text-muted-foreground">{f.designation}</td>
                        <td className="p-2.5 font-mono text-muted-foreground">{f.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* PUBLISH ANNOUNCEMENT */}
        {activeTab === 'announcements' && (
          <div className="space-y-6">
            <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold uppercase border-b pb-2">Publish Department Notice Circular</h3>
              <form onSubmit={handlePublishAnnouncement} className="space-y-4 text-xs font-semibold">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Notice Title</label>
                  <input
                    type="text"
                    required
                    value={announceTitle}
                    onChange={e => setAnnounceTitle(e.target.value)}
                    placeholder="e.g. Mandatory Mid-term outcome review meeting"
                    className="h-9 border rounded bg-background px-3"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Content details</label>
                  <textarea
                    required
                    value={announceContent}
                    onChange={e => setAnnounceContent(e.target.value)}
                    placeholder="Write announcement body here..."
                    className="h-24 border rounded bg-background p-2.5"
                  />
                </div>

                <button type="submit" className="w-full h-9 bg-primary text-primary-foreground rounded font-bold hover:bg-primary/95">
                  Publish Circular Notice
                </button>
              </form>
            </div>
          </div>
        )}

        {/* FALLBACK FOR UNHANDLED TABS */}
        {!['overview', 'workflows', 'timetable', 'allocations', 'students', 'faculty', 'announcements'].includes(activeTab) && (
          <div className="border bg-card rounded-2xl p-12 text-center text-xs font-semibold space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 bg-muted/40 rounded-full flex items-center justify-center mx-auto text-2xl">🛠️</div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-foreground text-sm">Under Development</h4>
              <p className="text-muted-foreground text-[10px]">This features workspace is currently being configured by the system administrator.</p>
            </div>
          </div>
        )}

        </ModuleErrorBoundary>
    </div>
  );
};
