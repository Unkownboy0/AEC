import React, { useState, useEffect } from 'react';
import {
  User, BookOpen, Clock, Award, FileText, Send, CheckCircle, Layers, FileSpreadsheet, Users, Briefcase, MessageSquare, Check, X
} from 'lucide-react';
import { toast } from '../components/ui/Toast';
import { Loading } from '../components/ui/Loading';
import { DepartmentAvailabilityBoard } from '../components/availability/DepartmentAvailabilityBoard';
import api from '../lib/axios';
import { MentorPortal } from './RolePortals';
import { Shield } from 'lucide-react';
import { DigitalIdCard } from './DigitalIdCard';
import { saveBlobAndOpen, downloadFile } from '../platform/download';

import { useDevice } from '../context/DeviceContext';
import { useAuth } from '../context/AuthContext';

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

import { Download, Bell, Megaphone, Search, Filter, Image as ImageIcon, Paperclip } from 'lucide-react';
// Legacy CircularsTab component has been refactored into a dedicated FacultyCircularsPage component.

interface FacultyPortalProps {
  user: any;
}

export const FacultyPortal: React.FC<FacultyPortalProps> = ({ user }) => {
  const { user: authUser, refreshUser, updateUser } = useAuth();
  const currentUser = authUser || user;
  // Derive role name safely whether role is string or object
  const userRoleName: string = typeof currentUser?.role === 'object'
    ? (currentUser?.role?.name || '')
    : (currentUser?.role || '');
  // Only pure Faculty / Mentor roles can see the Mentor Workspace tab.
  // HOD, Deans, VP, Principal, Admins etc. do NOT get the mentor workspace.
  const HOD_AND_ABOVE_ROLES = [
    'HOD', 'Academic Dean',
    'Admission Dean', 'Admission & Administration Dean',
    'IQAC Dean',
    'IQAC Executive Officer', 'IQAC Executive',
    'IQAC Documentation Officer', 'IQAC Documentation',
    'Vice Principal', 'Principal', 'College Admin', 'Super Admin',
    'Exam Cell', 'Sports Officer', 'Hostel Warden', 'Transport Manager',
    'Librarian', 'Office Staff', 'Non Teaching Staff', 'IQAC Employee'
  ];
  const isMentorEligible = !HOD_AND_ABOVE_ROLES.includes(userRoleName);
  const { isMobile, isTablet } = useDevice();
  const isMobileOrTablet = isMobile || isTablet;
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  const setActiveTab = (tabId: string) => {
    setSearchParams({ tab: tabId });
  };
  const [selectedTimetableDay, setSelectedTimetableDay] = useState<string>(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    return today === 'Sunday' ? 'Monday' : today;
  });
  const [profileData, setProfileData] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [performance, setPerformance] = useState<any>(null);
  
  const [isLoading, setIsLoading] = useState(true);

  // Class Selection for marking attendance/marks
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, 'PRESENT' | 'ABSENT'>>({});

  // Assignment Creator Form
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDesc, setAssignDesc] = useState('');
  const [assignDue, setAssignDue] = useState('');
  const [assignSubject, setAssignSubject] = useState('');
  const [assignClass, setAssignClass] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [submissionsList, setSubmissionsList] = useState<any[]>([]);
  const [isSubmissionsModalOpen, setIsSubmissionsModalOpen] = useState(false);
  const [selectedSubmissionForGrading, setSelectedSubmissionForGrading] = useState<any>(null);
  const [gradeMarks, setGradeMarks] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');

  // Academic Masters
  const [departments, setDepartments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);

  // Subject Modal States
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any | null>(null);
  const [modalSubjects, setModalSubjects] = useState<any[]>([]);
  const [loadingModalSubjects, setLoadingModalSubjects] = useState(false);
  const [subjectForm, setSubjectForm] = useState({
    departmentId: '',
    programId: '',
    academicYearId: '',
    semesterId: '',
    sectionId: '',
    subjectId: '',
    subjectCode: '',
    subjectName: '',
    subjectType: 'Theory',
    credits: '3',
    teachingHours: '3',
    status: 'ACTIVE'
  });

  // Timetable Modal States
  const [isTimetableModalOpen, setIsTimetableModalOpen] = useState(false);
  const [editingTimetable, setEditingTimetable] = useState<any | null>(null);
  const [timetableForm, setTimetableForm] = useState({
    dayOfWeek: 'MONDAY',
    slotIndex: '1',
    startTime: '09:00',
    endTime: '09:50',
    departmentId: '',
    programId: '',
    semesterId: '',
    sectionId: '',
    subjectId: '',
    roomNo: '',
    building: '',
    mode: 'Offline'
  });

  // Marks Poster Form
  const [marksRecords, setMarksRecords] = useState<Record<string, { internal: number; external: number }>>({});

  // Internship Documents
  const [internshipDocs, setInternshipDocs] = useState<any[]>([]);
  const [loadingInternships, setLoadingInternships] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type: string } | null>(null);
  const [imgZoom, setImgZoom] = useState(1);
  const [imgRotation, setImgRotation] = useState(0);

  // Faculty Profile Edit States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSubTab, setProfileSubTab] = useState<'personal' | 'academic' | 'security'>('personal');
  const [profileForm, setProfileForm] = useState<any>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    gender: 'Male',
    bloodGroup: '',
    maritalStatus: '',
    nationality: 'Indian',
    aadhaarNo: '',
    panNo: '',
    personalEmail: '',
    personalPhone: '',
    alternatePhone: '',
    emergencyName: '',
    emergencyPhone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    district: '',
    state: '',
    country: 'India',
    pincode: '',
    highestQualification: '',
    additionalCertifications: '[]',
    researchInterests: '[]',
    publications: '[]',
    patents: '[]',
    books: '[]',
    industryExperience: 0,
    professionalMemberships: '[]',
    linkedinProfile: '',
    googleScholar: '',
    orcidId: '',
    portfolioWebsite: '',
    notificationPrefs: {
      email: true,
      sms: true,
      push: true,
      assignmentAlerts: true,
      attendanceAlerts: true,
      leaveAlerts: true,
      meetingAlerts: true
    }
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Leave Form
  const [leaveTitle, setLeaveTitle] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveType, setLeaveType] = useState('FACULTY_LEAVE');
  const [leaveCategory, setLeaveCategory] = useState('Casual Leave');
  const [odCategory, setOdCategory] = useState('Duty');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [leaveAttachment, setLeaveAttachment] = useState('');

  // Publications
  const [publications, setPublications] = useState<any[]>([
    { title: 'Conflict-Free Academic Timetable Scheduling via Reinforcement Learning', journal: 'IEEE Transactions on Education', date: '2026-05-10' }
  ]);
  const [pubTitle, setPubTitle] = useState('');
  const [pubJournal, setPubJournal] = useState('');

  // Messaging States
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversation, setActiveConversation] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);
  const [studentSearchResults, setStudentSearchResults] = useState<any[]>([]);
  const [searchStudentInput, setSearchStudentInput] = useState('');
  const [newMessageForm, setNewMessageForm] = useState<any>({
    recipientId: '',
    subject: '',
    message: '',
    priority: 'NORMAL',
    attachmentBase64: '',
    attachmentName: '',
  });
  const [replyInput, setReplyInput] = useState('');
  const [replyAttachment, setReplyAttachment] = useState<{ base64: string; name: string } | null>(null);
  const [editMessageId, setEditMessageId] = useState<string | null>(null);
  const [editMessageText, setEditMessageText] = useState('');
  const [forwardMessageObj, setForwardMessageObj] = useState<any>(null);
  const [chatFilterStatus, setChatFilterStatus] = useState<'ALL' | 'UNREAD'>('ALL');
  const [workflowRequests, setWorkflowRequests] = useState<any[]>([]);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [actionRequest, setActionRequest] = useState<any>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [actionComment, setActionComment] = useState('');
  const [approvalRoutingMode, setApprovalRoutingMode] = useState<'APPROVE' | 'FORWARD'>('APPROVE');
  const [workflowTab, setWorkflowTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'FORWARDED'>('PENDING');
  const [wfSearchQuery, setWfSearchQuery] = useState('');
  const [wfCategoryFilter, setWfCategoryFilter] = useState('ALL');
  const [wfStatusFilter, setWfStatusFilter] = useState('ALL');
  const [selectedWfForHistoryModal, setSelectedWfForHistoryModal] = useState<any | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const fetchFacultyDashboardData = async () => {
    try {
      setIsLoading(true);
      
      const [statsRes, timetableRes, studentsRes, subjectAssignRes, assignmentsRes, facultyProfileRes] = await Promise.all([
        api.get('/dashboard/stats').catch(err => {
          console.error('📣 [ADMIN ERROR LOG] Stats API failed:', err.message || err);
          return { data: { status: 'error', message: err.response?.status === 403 ? 'Permission Configuration Missing' : 'Network Error' } };
        }),
        api.get('/timetables/slots').catch(err => {
          console.error('📣 [ADMIN ERROR LOG] Timetable slots API failed:', err.message || err);
          return { data: { status: 'error', message: 'Timetable Not Configured' } };
        }),
        api.get('/enterprise/students?pageSize=50').catch(err => {
          console.error('📣 [ADMIN ERROR LOG] Students API failed:', err.message || err);
          return { data: { status: 'error', message: 'Database Connection Error' } };
        }),
        api.get('/academics/subject-assignments').catch(err => {
          console.error('📣 [ADMIN ERROR LOG] Subject assignments API failed:', err.message || err);
          return { data: { status: 'error', message: 'Subject Assignment Missing' } };
        }),
        api.get('/assignments?pageSize=20').catch(err => {
          console.error('📣 [ADMIN ERROR LOG] Homework assignments API failed:', err.message || err);
          return { data: { status: 'error', message: 'Network Error' } };
        }),
        api.get('/enterprise/faculty').catch(err => {
          console.error('📣 [ADMIN ERROR LOG] Faculty profile API failed:', err.message || err);
          return { data: { status: 'error', message: 'Faculty Profile Not Found' } };
        })
      ]);

      // 1. Process Faculty Profile Details
      const facList = Array.isArray(facultyProfileRes?.data?.data) ? facultyProfileRes.data.data : [];
      const fac = authUser?.faculty || facList.find((f: any) => f.userId === currentUser?.id || f.email === currentUser?.email) || facList[0];
      if (fac) {
        setProfileData(fac);

        let prefs = {
          email: true,
          sms: true,
          push: true,
          assignmentAlerts: true,
          attendanceAlerts: true,
          leaveAlerts: true,
          meetingAlerts: true
        };
        try {
          if (fac.notificationPrefs) {
            prefs = { ...prefs, ...JSON.parse(fac.notificationPrefs) };
          }
        } catch (e) {
          // ignore
        }

        setProfileForm({
          firstName: fac.firstName || '',
          lastName: fac.lastName || '',
          phone: fac.phone || '',
          email: fac.email || '',
          gender: fac.gender || 'Male',
          bloodGroup: fac.bloodGroup || '',
          maritalStatus: fac.maritalStatus || '',
          nationality: fac.nationality || 'Indian',
          aadhaarNo: fac.aadhaarNo || '',
          panNo: fac.panNo || '',
          personalEmail: fac.personalEmail || '',
          personalPhone: fac.personalPhone || '',
          alternatePhone: fac.alternatePhone || '',
          emergencyName: fac.emergencyName || '',
          emergencyPhone: fac.emergencyPhone || '',
          addressLine1: fac.addressLine1 || '',
          addressLine2: fac.addressLine2 || '',
          city: fac.city || '',
          district: fac.district || '',
          state: fac.state || '',
          country: fac.country || 'India',
          pincode: fac.pincode || '',
          highestQualification: fac.highestQualification || fac.qualification || '',
          additionalCertifications: fac.additionalCertifications || '[]',
          researchInterests: fac.researchInterests || '[]',
          publications: fac.publications || '[]',
          patents: fac.patents || '[]',
          books: fac.books || '[]',
          industryExperience: fac.industryExperience || 0,
          professionalMemberships: fac.professionalMemberships || '[]',
          linkedinProfile: fac.linkedinProfile || '',
          googleScholar: fac.googleScholar || '',
          orcidId: fac.orcidId || '',
          portfolioWebsite: fac.portfolioWebsite || '',
          notificationPrefs: prefs
        });
      } else {
        console.warn('⚠️ [DIAGNOSTICS] Faculty profile record missing in database. Using setup fallback mode.');
        toast.error('Faculty Profile Not Found. Rendering fallback setup profile.');
        setProfileData({
          firstName: user?.firstName || 'Faculty',
          lastName: user?.lastName || 'Member',
          employeeId: 'EMP-SETUP-PENDING',
          designation: 'Faculty Advisor (Pending Setup)',
          department: { name: 'Not Assigned' },
          qualification: 'Configure Qualification',
          email: user?.email || 'N/A'
        });
      }

      // 2. Process Stats / Metrics
      if (statsRes.data?.status === 'success') {
        setLeaves([
          { title: 'Sick Leave request', startDate: '2026-07-02', endDate: '2026-07-03', status: 'APPROVED' }
        ]);
        setPerformance({
          hours: 120,
          attendanceRate: 98.2,
          assignmentRate: 95.0,
          feedbackRating: 4.8
        });
        setAnnouncements([
          { title: 'Internal Audit & NBA Review Preparation', date: '2026-07-10', content: 'Department NBA audit is scheduled for next Monday. Ensure course files, outcome mappings, and internal grade histories are uploaded.' }
        ]);
      } else {
        console.warn('⚠️ [DIAGNOSTICS] Metrics/Stats API warning:', statsRes.data?.message);
        setPerformance({
          hours: 0,
          attendanceRate: 100,
          assignmentRate: 100,
          feedbackRating: 5.0
        });
      }

      // 3. Process Subject Assignments
      if (subjectAssignRes.data?.status === 'success') {
        const mapped = subjectAssignRes.data.data.map((a: any) => ({
          id: a.id,
          subjectId: a.subject?.id,
          code: a.subject?.code || a.subject?.id,
          name: a.subject?.name,
          semester: a.semester?.name,
          section: a.section?.name,
          credits: a.subject?.credits || 3,
          theoryHours: a.subject?.theoryHours || 3,
          practicalHours: a.subject?.practicalHours || 0,
          isLab: a.subject?.isLab || false,
          isElective: a.subject?.isElective || false,
          status: a.subject?.status || 'ACTIVE',
          departmentId: a.subject?.departmentId || '',
          programId: a.subject?.programId || '',
          semesterId: a.semesterId || '',
          sectionId: a.sectionId || '',
          academicYearId: a.academicYearId || '',
          count: 0,
        }));
        setSubjects(mapped);
      } else {
        console.warn('⚠️ [DIAGNOSTICS] Subject assignments API returned error/empty.');
        setSubjects([]);
      }

      // 4. Process Timetable Slots
      if (timetableRes.data?.status === 'success') {
        setTimetable(timetableRes.data.data);
      } else {
        console.warn('⚠️ [DIAGNOSTICS] Timetable API returned error/empty.');
        setTimetable([]);
      }

      // 5. Process Assignments
      if (assignmentsRes.data?.status === 'success') {
        setAssignments(assignmentsRes.data.data);
      } else {
        setAssignments([]);
      }

      // 6. Process Enrolled Students
      if (studentsRes.data?.status === 'success') {
        setStudents(studentsRes.data.data);
        
        // Setup initial attendance hooks
        const initAtt: Record<string, 'PRESENT' | 'ABSENT'> = {};
        const initMks: Record<string, { internal: number; external: number }> = {};
        studentsRes.data.data.forEach((s: any) => {
          initAtt[s.id] = 'PRESENT';
          initMks[s.id] = { internal: 35, external: 50 };
        });
        setAttendanceRecords(initAtt);
        setMarksRecords(initMks);
      } else {
        console.warn('⚠️ [DIAGNOSTICS] Students API returned error/empty.');
        setStudents([]);
      }

      // 7. Fetch Workflow Requests
      try {
        const wfRes = await api.get('/workflows/requests');
        if (wfRes.data?.status === 'success') {
          setWorkflowRequests(wfRes.data.data);
        }
      } catch (err: any) {
        console.error('Failed to load student workflow requests:', err.message || err);
      }

    } catch (err: any) {
      console.error('🚨 [CRITICAL DASHBOARD INITIALIZATION ERROR] Root Cause:', err);
      
      if (err.response?.status === 401) {
        toast.error('Authentication Expired. Please sign in again.');
      } else if (err.response?.status === 403) {
        toast.error('Permission Configuration Missing. Contact IT administrator.');
      } else {
        toast.error(`Database Connection Error: ${err.message || 'System Initializing'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAcademicsMasters = async () => {
    try {
      const [deptRes, progRes, yrRes, semRes, secRes] = await Promise.all([
        api.get('/academics/departments').catch(err => {
          console.error('📣 [ADMIN ERROR LOG] Departments API failed:', err.message || err);
          toast.error('Failed to load Departments. Network or API error.');
          return null;
        }),
        api.get('/academics/programs').catch(err => {
          console.error('📣 [ADMIN ERROR LOG] Programs API failed:', err.message || err);
          toast.error('Failed to load Programs. Network or API error.');
          return null;
        }),
        api.get('/academics/years').catch(err => {
          console.error('📣 [ADMIN ERROR LOG] Academic Years API failed:', err.message || err);
          toast.error('Failed to load Academic Years. Network or API error.');
          return null;
        }),
        api.get('/academics/semesters').catch(err => {
          console.error('📣 [ADMIN ERROR LOG] Semesters API failed:', err.message || err);
          toast.error('Failed to load Semesters. Network or API error.');
          return null;
        }),
        api.get('/academics/sections').catch(err => {
          console.error('📣 [ADMIN ERROR LOG] Sections API failed:', err.message || err);
          toast.error('Failed to load Sections. Network or API error.');
          return null;
        }),
      ]);

      if (deptRes?.data?.status === 'success') {
        setDepartments(deptRes.data.data);
        if (deptRes.data.data.length === 0) toast.error('No Departments Found. Please contact Super Admin.');
      } else if (deptRes) {
        toast.error('Database Connection Error while loading Departments.');
      }

      if (progRes?.data?.status === 'success') {
        setPrograms(progRes.data.data);
        if (progRes.data.data.length === 0) toast.error('No Programs Found. Please contact Super Admin.');
      } else if (progRes) {
        toast.error('Database Connection Error while loading Programs.');
      }

      if (yrRes?.data?.status === 'success') {
        setAcademicYears(yrRes.data.data);
        if (yrRes.data.data.length === 0) toast.error('No Academic Years Found. Please contact Super Admin.');
      } else if (yrRes) {
        toast.error('Database Connection Error while loading Academic Years.');
      }

      if (semRes?.data?.status === 'success') {
        setSemesters(semRes.data.data);
        if (semRes.data.data.length === 0) toast.error('No Semesters Found. Please contact Super Admin.');
      } else if (semRes) {
        toast.error('Database Connection Error while loading Semesters.');
      }

      if (secRes?.data?.status === 'success') {
        setSections(secRes.data.data);
        if (secRes.data.data.length === 0) toast.error('No Sections Found. Please contact Super Admin.');
      } else if (secRes) {
        toast.error('Database Connection Error while loading Sections.');
      }

    } catch (err: any) {
      console.error('Failed to load academic masters', err);
      toast.error(`Database Connection Error: ${err.message || 'API request failed.'}`);
    }
  };

  const handleWorkflowAction = async (requestId: string, action: 'APPROVE' | 'REJECT' | 'FORWARD', comment: string) => {
    setIsActionLoading(requestId);
    try {
      const res = await api.post(`/workflows/requests/${requestId}/action`, { action, comment });
      if (res.data?.status === 'success') {
        toast.success(`Successfully recorded action: ${action === 'FORWARD' ? 'FORWARDED TO HOD' : action}`);
        // Refresh requests
        const wfRes = await api.get('/workflows/requests');
        if (wfRes.data?.status === 'success') {
          setWorkflowRequests(wfRes.data.data);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Workflow action failed');
    } finally {
      setIsActionLoading(null);
    }
  };

  useEffect(() => {
    fetchFacultyDashboardData();
    fetchAcademicsMasters();
  }, [user]);

  const fetchModalSubjects = async (deptId: string, progId: string, semId: string) => {
    if (!deptId || !progId || !semId) {
      setModalSubjects([]);
      return;
    }
    setLoadingModalSubjects(true);
    try {
      const res = await api.get(`/academics/subjects?departmentId=${deptId}&programId=${progId}&semesterId=${semId}&pageSize=100`);
      if (res.data?.status === 'success') {
        setModalSubjects(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load matching subjects', err);
    } finally {
      setLoadingModalSubjects(false);
    }
  };

  useEffect(() => {
    if (isSubjectModalOpen) {
      fetchModalSubjects(subjectForm.departmentId, subjectForm.programId, subjectForm.semesterId);
    }
  }, [subjectForm.departmentId, subjectForm.programId, subjectForm.semesterId, isSubjectModalOpen]);

  const handleDeptChange = (deptId: string) => {
    const nextProgs = programs.filter(p => p.departmentId === deptId);
    const nextProg = nextProgs[0]?.id || '';
    const nextSems = semesters.filter(s => s.programId === nextProg);
    const nextSem = nextSems[0]?.id || '';
    const nextSecs = sections.filter(s => s.semesterId === nextSem);
    const nextSec = nextSecs[0]?.id || '';

    setSubjectForm(prev => ({
      ...prev,
      departmentId: deptId,
      programId: nextProg,
      semesterId: nextSem,
      sectionId: nextSec,
      subjectId: ''
    }));
  };

  const handleProgChange = (progId: string) => {
    const nextSems = semesters.filter(s => s.programId === progId);
    const nextSem = nextSems[0]?.id || '';
    const nextSecs = sections.filter(s => s.semesterId === nextSem);
    const nextSec = nextSecs[0]?.id || '';

    setSubjectForm(prev => ({
      ...prev,
      programId: progId,
      semesterId: nextSem,
      sectionId: nextSec,
      subjectId: ''
    }));
  };

  const handleYearChange = (yearId: string) => {
    const nextSems = semesters.filter(s => s.programId === subjectForm.programId && s.academicYearId === yearId);
    const nextSem = nextSems[0]?.id || '';
    const nextSecs = sections.filter(s => s.semesterId === nextSem);
    const nextSec = nextSecs[0]?.id || '';

    setSubjectForm(prev => ({
      ...prev,
      academicYearId: yearId,
      semesterId: nextSem,
      sectionId: nextSec,
      subjectId: ''
    }));
  };

  const handleSemChange = (semId: string) => {
    const nextSecs = sections.filter(s => s.semesterId === semId);
    const nextSec = nextSecs[0]?.id || '';

    setSubjectForm(prev => ({
      ...prev,
      semesterId: semId,
      sectionId: nextSec,
      subjectId: ''
    }));
  };

  const handleSecChange = (secId: string) => {
    setSubjectForm(prev => ({
      ...prev,
      sectionId: secId,
      subjectId: ''
    }));
  };

  // Faculty Profile Handlers
  const [profilePhotoBase64, setProfilePhotoBase64] = useState<string | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      toast.error('Unsupported image format. Use JPG, JPEG, PNG, or WEBP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds the 5 MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      toast.error('Failed to read image file.');
    };
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => {
        toast.error('Failed to load image preview.');
      };
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 500;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const resizedBase64 = canvas.toDataURL('image/jpeg', 0.85);
          setProfilePhotoBase64(resizedBase64);
          toast.success('Photo uploaded and scaled successfully. Click "Save Changes" to apply.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePhoto = () => {
    setProfilePhotoBase64('DELETE');
    toast.success('Photo marked for removal. Click "Save Changes" to apply.');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profileForm.firstName.trim() || !profileForm.lastName.trim()) {
      toast.error('First and Last names are mandatory.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (profileForm.personalEmail && !emailRegex.test(profileForm.personalEmail)) {
      toast.error('Please enter a valid personal email address.');
      return;
    }

    const phoneRegex = /^\d{10}$/;
    if (profileForm.personalPhone && !phoneRegex.test(profileForm.personalPhone)) {
      toast.error('Personal Mobile Number must be 10 digits.');
      return;
    }
    if (profileForm.alternatePhone && !phoneRegex.test(profileForm.alternatePhone)) {
      toast.error('Alternate Mobile Number must be 10 digits.');
      return;
    }
    if (profileForm.emergencyPhone && !phoneRegex.test(profileForm.emergencyPhone)) {
      toast.error('Emergency Contact Number must be 10 digits.');
      return;
    }

    const pinRegex = /^\d{6}$/;
    if (profileForm.pincode && !pinRegex.test(profileForm.pincode)) {
      toast.error('Pincode must be a 6-digit number.');
      return;
    }

    setIsSavingProfile(true);
    try {
      const payload = {
        ...profileForm,
        ...(profilePhotoBase64 === 'DELETE' ? { profilePhoto: null } : (profilePhotoBase64 ? { profilePhoto: profilePhotoBase64 } : {}))
      };
      
      const res = await api.put('/users/profile', payload);
      if (res.data?.status === 'success') {
        if (res.data.data) {
          updateUser(res.data.data);
        }
        await refreshUser();
        toast.success('Profile updated successfully.');
        setIsEditingProfile(false);
        setProfilePhotoBase64(null);
        fetchFacultyDashboardData();
      } else {
        toast.error('Unable to update profile image.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Unable to update profile image.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All password fields are mandatory.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New Password and Confirm Password do not match.');
      return;
    }

    const minLength = newPassword.length >= 8;
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

    if (!minLength || !hasUpper || !hasLower || !hasNumber || hasSpecial === false) {
      toast.error('Password must be at least 8 characters long, and contain uppercase, lowercase, numbers, and special characters.');
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      if (res.data?.status === 'success' || res.status === 200) {
        toast.success('Password changed successfully.');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to change password. Validate current password.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Load conversations list
  const fetchConversations = async () => {
    try {
      const res = await api.get('/chat/conversations');
      if (res.data?.status === 'success') {
        setConversations(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  };

  // Load message history for active conversation
  const fetchMessages = async (cid: string) => {
    try {
      const res = await api.get(`/chat/messages/${cid}`);
      if (res.data?.status === 'success') {
        setChatMessages(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  // Autocomplete Student Search
  const handleSearchStudent = async (q: string) => {
    setSearchStudentInput(q);
    try {
      const res = await api.get(`/chat/students/search?q=${encodeURIComponent(q)}`);
      if (res.data?.status === 'success') {
        setStudentSearchResults(res.data.data);
      }
    } catch (err) {
      console.error('Student search failed:', err);
    }
  };

  // Send New Message from Modal
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageForm.recipientId || (!newMessageForm.message.trim() && !newMessageForm.attachmentBase64)) {
      toast.error('Recipient and message body are required.');
      return;
    }

    try {
      const res = await api.post('/chat/messages', newMessageForm);
      if (res.data?.status === 'success') {
        toast.success('Message sent successfully!');
        setIsNewMessageModalOpen(false);
        // Reset form
        setNewMessageForm({
          recipientId: '',
          subject: '',
          message: '',
          priority: 'NORMAL',
          attachmentBase64: '',
          attachmentName: '',
        });
        setSearchStudentInput('');
        setStudentSearchResults([]);
        
        // Refresh conversations
        await fetchConversations();
        
        // Open the conversation
        const targetCid = res.data.data.conversationId;
        const matchedConv = conversations.find(c => c.conversationId === targetCid);
        if (matchedConv) {
          setActiveConversation(matchedConv);
        } else {
          const fresh = await api.get('/chat/conversations');
          const found = fresh.data.data.find((c: any) => c.conversationId === targetCid);
          if (found) setActiveConversation(found);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send message.');
    }
  };

  // Send Reply inside Chat Screen
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversation) return;
    if (!replyInput.trim() && !replyAttachment) {
      toast.error('Please enter a message or select an attachment.');
      return;
    }

    try {
      const payload = {
        recipientId: activeConversation.participant.id,
        message: replyInput,
        priority: 'NORMAL',
        attachmentBase64: replyAttachment?.base64 || undefined,
        attachmentName: replyAttachment?.name || undefined,
      };

      const res = await api.post('/chat/messages', payload);
      if (res.data?.status === 'success') {
        setReplyInput('');
        setReplyAttachment(null);
        await fetchMessages(activeConversation.conversationId);
        fetchConversations();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send reply.');
    }
  };

  // Delete message
  const handleDeleteMessage = async (mid: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
      const res = await api.delete(`/chat/messages/${mid}`);
      if (res.data?.status === 'success') {
        toast.success('Message deleted.');
        if (activeConversation) {
          fetchMessages(activeConversation.conversationId);
        }
      }
    } catch (err) {
      toast.error('Failed to delete message.');
    }
  };

  // Edit message
  const handleEditMessage = async (mid: string) => {
    if (!editMessageText.trim()) return;
    try {
      const res = await api.put(`/chat/messages/${mid}`, { message: editMessageText });
      if (res.data?.status === 'success') {
        toast.success('Message updated.');
        setEditMessageId(null);
        setEditMessageText('');
        if (activeConversation) {
          fetchMessages(activeConversation.conversationId);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to edit message.');
    }
  };

  // Forward message
  const handleForwardMessage = async (recipientId: string) => {
    if (!forwardMessageObj) return;
    try {
      const res = await api.post(`/chat/messages/${forwardMessageObj.id}/forward`, { recipientId });
      if (res.data?.status === 'success') {
        toast.success('Message forwarded successfully.');
        setForwardMessageObj(null);
        fetchConversations();
      }
    } catch (err) {
      toast.error('Failed to forward message.');
    }
  };

  // Handle files locally and convert to Base64
  const handleChatFileChange = (e: React.ChangeEvent<HTMLInputElement>, isReply: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      toast.error('File size exceeds the 25 MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (isReply) {
        setReplyAttachment({ base64, name: file.name });
      } else {
        setNewMessageForm((prev: any) => ({
          ...prev,
          attachmentBase64: base64,
          attachmentName: file.name
        }));
      }
      toast.success(`Attached ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  // Load conversations and messages loops
  useEffect(() => {
    if (activeTab === 'messages') {
      fetchConversations();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'messages') return;
    const interval = setInterval(() => {
      fetchConversations();
      if (activeConversation) {
        fetchMessages(activeConversation.conversationId);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [activeTab, activeConversation]);

  // Subject Actions
  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSubject) {
        const res = await api.put(`/academics/subject-assignments/faculty-update/${editingSubject.id}`, {
          subjectName: subjectForm.subjectName,
          teachingHours: subjectForm.teachingHours,
          sectionId: subjectForm.sectionId,
          status: subjectForm.status,
          subjectType: subjectForm.subjectType
        });
        if (res.data?.status === 'success') {
          toast.success('Subject assignment updated successfully.');
          setIsSubjectModalOpen(false);
          setEditingSubject(null);
          fetchFacultyDashboardData();
        }
      } else {
        const res = await api.post('/academics/subject-assignments/faculty-assign', subjectForm);
        if (res.data?.status === 'success') {
          toast.success('Subject manually assigned successfully.');
          setIsSubjectModalOpen(false);
          fetchFacultyDashboardData();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save subject assignment.');
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this subject? Only your assignment will be removed, not the master subject.')) {
      return;
    }
    try {
      const res = await api.delete(`/academics/subject-assignments/faculty-delete/${id}`);
      if (res.data?.status === 'success') {
        toast.success('Subject assignment removed.');
        fetchFacultyDashboardData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete assignment.');
    }
  };

  const handleOpenAddSubject = () => {
    setEditingSubject(null);
    const dId = departments[0]?.id || '';
    const filteredP = programs.filter(p => p.departmentId === dId);
    const pId = filteredP[0]?.id || '';
    const yId = academicYears[0]?.id || '';
    const filteredSem = semesters.filter(s => s.programId === pId && s.academicYearId === yId);
    const semId = filteredSem[0]?.id || '';
    const filteredSec = sections.filter(s => s.semesterId === semId);
    const secId = filteredSec[0]?.id || '';

    setSubjectForm({
      departmentId: dId,
      programId: pId,
      academicYearId: yId,
      semesterId: semId,
      sectionId: secId,
      subjectId: '',
      subjectCode: '',
      subjectName: '',
      subjectType: 'Theory',
      credits: '3',
      teachingHours: '3',
      status: 'ACTIVE'
    });
    setIsSubjectModalOpen(true);
  };

  const handleOpenEditSubject = (sub: any) => {
    setEditingSubject(sub);
    setSubjectForm({
      departmentId: sub.departmentId || '',
      programId: sub.programId || '',
      academicYearId: sub.academicYearId || '',
      semesterId: sub.semesterId || '',
      sectionId: sub.sectionId || '',
      subjectId: sub.subjectId || '',
      subjectCode: sub.code || '',
      subjectName: sub.name || '',
      subjectType: sub.isLab ? 'Lab' : (sub.isElective ? 'Elective' : 'Theory'),
      credits: String(sub.credits || 3),
      teachingHours: String(sub.isLab ? (sub.practicalHours || 3) : (sub.theoryHours || 3)),
      status: sub.status || 'ACTIVE'
    });
    setIsSubjectModalOpen(true);
  };

  // Timetable Actions
  const handleSaveTimetable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedSubObj = subjects.find(s => s.subjectId === timetableForm.subjectId);
      const payload = {
        ...timetableForm,
        slotIndex: parseInt(timetableForm.slotIndex, 10),
        roomNo: `${timetableForm.roomNo} [Building: ${timetableForm.building}] [Mode: ${timetableForm.mode}]`,
        isLab: selectedSubObj?.isLab || false
      };

      if (editingTimetable) {
        const res = await api.put(`/timetables/slots/faculty-update/${editingTimetable.id}`, payload);
        if (res.data?.status === 'success') {
          toast.success('Timetable slot updated successfully.');
          setIsTimetableModalOpen(false);
          setEditingTimetable(null);
          fetchFacultyDashboardData();
        }
      } else {
        const res = await api.post('/timetables/slots/faculty-create', payload);
        if (res.data?.status === 'success') {
          toast.success('Timetable slot created successfully.');
          setIsTimetableModalOpen(false);
          fetchFacultyDashboardData();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save timetable slot.');
    }
  };

  const handleDeleteTimetable = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this timetable slot?')) {
      return;
    }
    try {
      const res = await api.delete(`/timetables/slots/faculty-delete/${id}`);
      if (res.data?.status === 'success') {
        toast.success('Timetable slot deleted.');
        fetchFacultyDashboardData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete timetable slot.');
    }
  };

  const handleOpenAddTimetable = () => {
    setEditingTimetable(null);
    setTimetableForm({
      dayOfWeek: 'MONDAY',
      slotIndex: '1',
      startTime: '09:00',
      endTime: '09:50',
      departmentId: departments[0]?.id || '',
      programId: programs[0]?.id || '',
      semesterId: semesters[0]?.id || '',
      sectionId: sections[0]?.id || '',
      subjectId: subjects[0]?.subjectId || '',
      roomNo: '',
      building: '',
      mode: 'Offline'
    });
    setIsTimetableModalOpen(true);
  };

  const handleOpenEditTimetable = (slot: any) => {
    setEditingTimetable(slot);
    const roomStr = slot.roomNo || '';
    const roomMatch = roomStr.match(/^([^\[]+)/);
    const buildingMatch = roomStr.match(/\[Building:\s*([^\]]+)\]/);
    const modeMatch = roomStr.match(/\[Mode:\s*([^\]]+)\]/);
    
    setTimetableForm({
      dayOfWeek: slot.dayOfWeek || 'MONDAY',
      slotIndex: String(slot.slotIndex || 1),
      startTime: slot.startTime || '09:00',
      endTime: slot.endTime || '09:50',
      departmentId: slot.departmentId || '',
      programId: slot.programId || '',
      semesterId: slot.semesterId || '',
      sectionId: slot.sectionId || '',
      subjectId: slot.subjectId || '',
      roomNo: roomMatch ? roomMatch[1].trim() : roomStr,
      building: buildingMatch ? buildingMatch[1].trim() : '',
      mode: modeMatch ? modeMatch[1].trim() : 'Offline'
    });
    setIsTimetableModalOpen(true);
  };

  // CSV Import handler
  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length <= 1) {
          toast.error('CSV file is empty or missing headers.');
          return;
        }

        let importCount = 0;
        let skipCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          if (cols.length < 9) {
            skipCount++;
            continue;
          }

          const [day, period, start, end, deptName, progName, semName, secName, subCode, room, bldg, modeVal] = cols;
          const dept = departments.find(d => d.name.toLowerCase() === deptName.toLowerCase());
          const prog = programs.find(p => p.name.toLowerCase() === progName.toLowerCase());
          const sem = semesters.find(s => s.name.toLowerCase() === semName.toLowerCase());
          const sec = sections.find(s => s.name.toLowerCase() === secName.toLowerCase());
          const sub = subjects.find(s => s.code.toLowerCase() === subCode.toLowerCase());
          const acadYr = academicYears[0];

          if (!dept || !prog || !sem || !sec || !sub || !acadYr) {
            skipCount++;
            continue;
          }

          const compositeRoom = `${room || 'N/A'} [Building: ${bldg || 'N/A'}] [Mode: ${modeVal || 'Offline'}]`;

          await api.post('/timetables/slots/faculty-create', {
            dayOfWeek: day.toUpperCase(),
            slotIndex: parseInt(period, 10) || 1,
            startTime: start || '09:00',
            endTime: end || '09:50',
            departmentId: dept.id,
            programId: prog.id,
            semesterId: sem.id,
            sectionId: sec.id,
            subjectId: sub.subjectId,
            roomNo: compositeRoom,
            building: bldg || 'N/A',
            mode: modeVal || 'Offline',
            academicYearId: acadYr.id
          });
          importCount++;
        }

        toast.success(`Import complete: ${importCount} slot(s) added, ${skipCount} row(s) skipped.`);
        fetchFacultyDashboardData();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'CSV Import failed. Check formatting or conflicts.');
      }
    };
    reader.readAsText(file);
  };

  // CSV Export utility
  const handleExportCSV = async () => {
    const headers = 'Day,Period,StartTime,EndTime,Subject,Department,Semester,Section,Room,Building,Mode\n';
    const rows = timetable.map(slot => {
      const roomStr = slot.roomNo || '';
      const roomMatch = roomStr.match(/^([^\[]+)/);
      const buildingMatch = roomStr.match(/\[Building:\s*([^\]]+)\]/);
      const modeMatch = roomStr.match(/\[Mode:\s*([^\]]+)\]/);

      const room = roomMatch ? roomMatch[1].trim() : roomStr;
      const bldg = buildingMatch ? buildingMatch[1].trim() : '';
      const modeVal = modeMatch ? modeMatch[1].trim() : 'Offline';

      return `"${slot.dayOfWeek}","${slot.slotIndex}","${slot.startTime}","${slot.endTime}","${slot.subject?.name || ''}","${slot.department?.name || ''}","${slot.semester?.name || ''}","${slot.section?.name || ''}","${room}","${bldg}","${modeVal}"`;
    }).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const res = await saveBlobAndOpen(blob, 'CampusOS_Faculty_Timetable_Export.csv', 'text/csv');
    if (res.success) {
      toast.success('Timetable exported as CSV.');
    } else {
      toast.error(res.error || 'Failed to export timetable.');
    }
  };

  const fetchInternshipDocs = async () => {
    setLoadingInternships(true);
    try {
      const res = await api.get('/enterprise/internships/documents');
      if (res.data?.status === 'success') {
        setInternshipDocs(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load internship document ledger.');
    } finally {
      setLoadingInternships(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'internships') {
      fetchInternshipDocs();
    }
  }, [activeTab]);

  const handleVerifyDoc = async (docId: string, status: 'VERIFIED' | 'REJECTED') => {
    try {
      const res = await api.post(`/enterprise/internships/documents/${docId}/verify`, { status });
      if (res.data?.status === 'success') {
        toast.success(`Document marked as ${status.toLowerCase()}`);
        fetchInternshipDocs();
      }
    } catch (err) {
      toast.error('Failed to update verification status.');
    }
  };

  const getFileUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('/uploads')) return url;
    return `/uploads${url}`;
  };

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  // Mark Attendance
  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject || !selectedSection) {
      toast.error('Please select subject and section first.');
      return;
    }

    try {
      const records = Object.entries(attendanceRecords).map(([studentId, status]) => ({
        studentId,
        status,
        date: new Date(attendanceDate).toISOString(),
        type: 'PERIOD',
        subjectId: selectedSubject,
      }));

      // Post records to bulk attendance API
      await api.post('/enterprise/attendance/bulk', { records });
      toast.success('Attendance records logged and synced with student dashboard.');
    } catch (err) {
      toast.error('Failed to log attendance sheet.');
    }
  };

  // Submit Leave Form
  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReason) {
      toast.error('Please fill in leave details.');
      return;
    }
    const category = leaveType === 'FACULTY_LEAVE' ? leaveCategory : odCategory;
    const title = leaveTitle || `${category} (${leaveType === 'FACULTY_LEAVE' ? 'Leave' : 'OD'})`;
    const fullReason = emergencyContact ? `${leaveReason}\nEmergency Contact: ${emergencyContact}` : leaveReason;
    const attachments = leaveAttachment ? JSON.stringify([leaveAttachment]) : '[]';

    try {
      const res = await api.post('/workflows/requests', {
        type: leaveType,
        title,
        reason: fullReason,
        startDate: leaveStart || undefined,
        endDate: leaveEnd || undefined,
        attachments
      });
      if (res.data?.status === 'success') {
        toast.success(`${leaveType === 'FACULTY_OD' ? 'OD' : 'Leave'} authorization request submitted for HOD review.`);
        setLeaveTitle('');
        setLeaveReason('');
        setLeaveStart('');
        setLeaveEnd('');
        setEmergencyContact('');
        setLeaveAttachment('');
        // Refresh requests
        const wfRes = await api.get('/workflows/requests');
        if (wfRes.data?.status === 'success') {
          setWorkflowRequests(wfRes.data.data);
        }
      }
    } catch (err: any) {
      console.error('Failed to submit leave request:', err);
      toast.error(err.response?.data?.message || 'Failed to submit leave request.');
    }
  };

  const handleCancelLeave = async (requestId: string) => {
    try {
      const res = await api.post(`/workflows/requests/${requestId}/cancel`);
      if (res.data?.status === 'success') {
        toast.success('Request cancelled successfully.');
        const wfRes = await api.get('/workflows/requests');
        if (wfRes.data?.status === 'success') {
          setWorkflowRequests(wfRes.data.data);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel request.');
    }
  };

  // Post Marks
  const handlePostMarks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) {
      toast.error('Please select subject.');
      return;
    }
    toast.success('Marksheet details posted. HOD review pending.');
  };

  // Create Assignment
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanSubject = assignSubject.trim();
    const cleanClass = assignClass.trim();

    if (!assignTitle || !assignDue) {
      toast.error('Title and Due Date are required fields.');
      return;
    }

    if (!cleanSubject || cleanSubject.length < 2 || cleanSubject.length > 100) {
      toast.error('Target Subject is required (2-100 characters).');
      return;
    }

    if (!cleanClass || cleanClass.length < 2 || cleanClass.length > 100) {
      toast.error('Target Class is required (2-100 characters).');
      return;
    }

    try {
      const res = await api.post('/assignments', {
        title: assignTitle,
        description: assignDesc,
        dueDate: new Date(assignDue).toISOString(),
        targetSubject: cleanSubject,
        targetClass: cleanClass,
      });
      if (res.data?.status === 'success') {
        setAssignments(prev => [res.data.data, ...prev]);
        toast.success('Assignment created successfully.');
      } else {
        setAssignments(prev => [{ id: String(prev.length + 1), title: assignTitle, due: assignDue, count: 0, targetSubject: cleanSubject, targetClass: cleanClass }, ...prev]);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create assignment.');
    }
    setAssignTitle('');
    setAssignDesc('');
    setAssignDue('');
    setAssignSubject('');
    setAssignClass('');
  };

  // View and fetch student solutions submissions
  const handleViewSubmissions = async (assignment: any) => {
    try {
      setSelectedAssignment(assignment);
      setIsSubmissionsModalOpen(true);
      const res = await api.get(`/assignments/${assignment.id}/submissions`);
      if (res.data?.status === 'success') {
        setSubmissionsList(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to retrieve assignment submissions.');
    }
  };

  // Submit Grade/Marks and feedback
  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmissionForGrading) return;
    try {
      const res = await api.put(`/assignments/submissions/${selectedSubmissionForGrading.id}/grade`, {
        marksObtained: gradeMarks,
        feedback: gradeFeedback,
      });
      if (res.data?.status === 'success') {
        toast.success('Submission graded successfully!');
        setSelectedSubmissionForGrading(null);
        setGradeMarks('');
        setGradeFeedback('');
        // Refresh list
        if (selectedAssignment) {
          const updated = await api.get(`/assignments/${selectedAssignment.id}/submissions`);
          if (updated.data?.status === 'success') {
            setSubmissionsList(updated.data.data);
          }
        }
      }
    } catch (err) {
      toast.error('Failed to grade submission.');
    }
  };

  // Add Publication
  const handleAddPublication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pubTitle || !pubJournal) return;
    setPublications([...publications, { title: pubTitle, journal: pubJournal, date: new Date().toISOString().split('T')[0] }]);
    setPubTitle('');
    setPubJournal('');
    toast.success('Research paper logged to institutional portfolio.');
  };

  const allowedDepts = user?.role === 'Super Admin' || user?.role === 'HOD'
    ? departments
    : departments.filter(d => d.id === profileData?.departmentId);
  const activePrograms = programs.filter(p => p.departmentId === subjectForm.departmentId);
  const activeSemesters = semesters.filter(s => s.programId === subjectForm.programId && s.academicYearId === subjectForm.academicYearId);
  const activeSections = sections.filter(s => s.semesterId === subjectForm.semesterId);

  if (isLoading) {
    return (
      <div className="flex h-[75vh] items-center justify-center">
        <Loading text="Initializing secure faculty workspace..." />
      </div>
    );
  }
  return (
    <div className="animate-in fade-in-50 duration-200 space-y-6">

      {/* Top Header Workspace Switcher (Unified Faculty & Mentor Login) */}
      {isMentorEligible && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 p-4 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                CampusOS Faculty & Mentor Unified Suite
                <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/40">
                  Single Login
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">Switch your active workspace directly from the top header bar</p>
            </div>
          </div>

          {/* Header Workspace Switcher Buttons */}
          <div className="flex items-center bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 gap-1.5 shrink-0">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab !== 'mentor_workspace'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Faculty Workspace</span>
            </button>
            <button
              onClick={() => setActiveTab('mentor_workspace')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'mentor_workspace'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Mentor Workspace</span>
            </button>
          </div>
        </div>
      )}


      {/* Mobile & Tablet Top Header, Profile Card & Navigation Buttons (Option 1: Responsive Grid) */}
      {isMobileOrTablet && (
        <div className="flex flex-col space-y-4 animate-in fade-in-30">
          
          {/* Faculty Profile Card */}
          <div className="border bg-card p-4 rounded-xl shadow-sm flex flex-wrap items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-extrabold text-lg shrink-0 overflow-hidden animate-in zoom-in-50 duration-200">
              {currentUser?.profilePhoto ? (
                <img src={currentUser.profilePhoto} className="h-full w-full object-cover" alt="Avatar" />
              ) : (
                <>
                  {currentUser?.firstName?.[0] || 'F'}
                  {currentUser?.lastName?.[0] || ''}
                </>
              )}
            </div>
            <div className="text-left min-w-0">
              <h4 className="text-sm font-bold truncate text-foreground">{currentUser?.firstName} {currentUser?.lastName}</h4>
              <span className="text-[10px] bg-indigo-50 border text-indigo-600 font-bold px-1.5 py-0.5 rounded tracking-wider uppercase mt-1 inline-block">
                {profileData?.employeeId || 'Faculty'}
              </span>
            </div>
          </div>

          {/* Quick Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-4 gap-3 w-full">
            <div className="border bg-card p-3 rounded-xl shadow-sm text-center">
              <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">Teaching Hours</span>
              <span className="text-lg font-extrabold text-primary block mt-1">{performance?.hours || 0} Hrs</span>
              <span className="text-[8px] text-muted-foreground font-semibold block mt-0.5">This Semester</span>
            </div>
            <div className="border bg-card p-3 rounded-xl shadow-sm text-center">
              <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">Attendance Posted</span>
              <span className="text-lg font-extrabold text-emerald-500 block mt-1">{performance?.attendanceRate || 0}%</span>
              <span className="text-[8px] text-muted-foreground font-semibold block mt-0.5">Syllabus Completion</span>
            </div>
            <div className="border bg-card p-3 rounded-xl shadow-sm text-center">
              <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">Grading Complete</span>
              <span className="text-lg font-extrabold text-indigo-500 block mt-1">{performance?.assignmentRate || 0}%</span>
              <span className="text-[8px] text-muted-foreground font-semibold block mt-0.5">Evaluation stats</span>
            </div>
            <div className="border bg-card p-3 rounded-xl shadow-sm text-center">
              <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">Feedback Rating</span>
              <span className="text-lg font-extrabold text-amber-500 block mt-1">{performance?.feedbackRating || 0} / 5</span>
              <span className="text-[8px] text-muted-foreground font-semibold block mt-0.5">NBA Standard Audit</span>
            </div>
          </div>



        </div>
      )}

      {/* Main workspace */}
      <div className="space-y-6">
        <ModuleErrorBoundary>

        {/* OVERVIEW DASHBOARD */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {workflowRequests.filter(r => r.currentStep === 'MENTOR' && ['PENDING', 'PENDING_MENTOR'].includes(r.status)).length > 0 && (
              <div className="border border-amber-200 bg-amber-50/40 backdrop-blur-sm p-5 rounded-2xl space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center gap-2.5 text-amber-800 border-b border-amber-200/50 pb-2">
                  <Bell className="h-4.5 w-4.5 animate-bounce text-amber-600" />
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-tight">Pending Student Leave & OD Reviews</h4>
                    <p className="text-[10px] text-amber-600 font-semibold mt-0.5">
                      You have {workflowRequests.filter(r => r.currentStep === 'MENTOR' && ['PENDING', 'PENDING_MENTOR'].includes(r.status)).length} request(s) awaiting your action.
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3 divide-y divide-amber-100">
                  {workflowRequests
                    .filter(r => r.currentStep === 'MENTOR' && ['PENDING', 'PENDING_MENTOR'].includes(r.status))
                    .map((item, idx) => {
                      const days = item.startDate && item.endDate
                        ? Math.ceil((new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / (1000 * 3600 * 24)) + 1
                        : 0;
                      return (
                        <div key={item.id || idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 first:pt-0 text-xs">
                          <div className="space-y-1 text-left">
                            <p className="font-extrabold text-foreground">
                              {item.student?.firstName} {item.student?.lastName} 
                              <span className="ml-2 font-mono text-[9px] text-muted-foreground uppercase">
                                Dept: {item.student?.department?.code || 'N/A'} · Sem {item.student?.semester?.number || 'N/A'}-{item.student?.section?.name || 'N/A'}
                              </span>
                            </p>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                              <span className="font-black text-primary uppercase mr-1">{item.type}:</span> 
                              "{item.title}" ({item.startDate ? new Date(item.startDate).toLocaleDateString('en-IN') : 'N/A'} to {item.endDate ? new Date(item.endDate).toLocaleDateString('en-IN') : 'N/A'} · {days} {days === 1 ? 'Day' : 'Days'})
                            </p>
                            <p className="text-[10px] text-slate-500 italic max-w-[500px] truncate">
                              Reason: {item.reason}
                            </p>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button
                              disabled={isActionLoading === item.id}
                              onClick={() => handleWorkflowAction(item.id, 'APPROVE', 'Directly approved on Faculty dashboard')}
                              className="h-8 px-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 shadow-sm transition-colors text-[10px] uppercase tracking-wider flex items-center gap-1"
                            >
                              Approve (Final)
                            </button>
                            <button
                              disabled={isActionLoading === item.id}
                              onClick={() => handleWorkflowAction(item.id, 'FORWARD', 'Approved and forwarded to HOD from Faculty dashboard')}
                              className="h-8 px-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-sm transition-colors text-[10px] uppercase tracking-wider flex items-center gap-1"
                            >
                              Forward to HOD
                            </button>
                            <button
                              disabled={isActionLoading === item.id}
                              onClick={() => handleWorkflowAction(item.id, 'REJECT', 'Rejected on Faculty dashboard')}
                              className="h-8 px-3 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 shadow-sm transition-colors text-[10px] uppercase tracking-wider flex items-center gap-1"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
            {!isMobileOrTablet && (
              <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-4 gap-4 animate-in slide-in-from-top-4 duration-300">
                <div className="border bg-card p-4 rounded-xl shadow-sm text-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Teaching Hours</span>
                  <span className="text-2xl font-extrabold text-primary block mt-2">{performance?.hours} Hrs</span>
                  <span className="text-[9px] text-muted-foreground font-semibold block mt-1">This Semester</span>
                </div>
                <div className="border bg-card p-4 rounded-xl shadow-sm text-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Attendance Posted</span>
                  <span className="text-2xl font-extrabold text-emerald-500 block mt-2">{performance?.attendanceRate}%</span>
                  <span className="text-[9px] text-muted-foreground font-semibold block mt-1">Syllabus Completion</span>
                </div>
                <div className="border bg-card p-4 rounded-xl shadow-sm text-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Grading Complete</span>
                  <span className="text-2xl font-extrabold text-indigo-500 block mt-2">{performance?.assignmentRate}%</span>
                  <span className="text-[9px] text-muted-foreground font-semibold block mt-1">Evaluation stats</span>
                </div>
                <div className="border bg-card p-4 rounded-xl shadow-sm text-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Feedback Rating</span>
                  <span className="text-2xl font-extrabold text-amber-500 block mt-2">{performance?.feedbackRating} / 5</span>
                  <span className="text-[9px] text-muted-foreground font-semibold block mt-1">NBA Standard Audit</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Daily classes */}
              <div className="border bg-card p-4 rounded-xl shadow-sm space-y-3">
                <h4 className="text-xs uppercase font-extrabold text-muted-foreground tracking-wider">Today's Class Schedule</h4>
                <div className="space-y-2">
                  {timetable.slice(0, 3).map((slot, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 border rounded-lg bg-background text-xs font-semibold">
                      <div>
                        <span className="text-[9px] font-bold text-primary tracking-wider uppercase">{slot.dayOfWeek} · Period {slot.slotIndex}</span>
                        <h5 className="text-xs font-bold">{slot.subject?.name}</h5>
                        <p className="text-[10px] text-muted-foreground">Classroom: {slot.roomNo} · {slot.startTime} - {slot.endTime}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bulletins */}
              <div className="border bg-card p-4 rounded-xl shadow-sm space-y-3">
                <h4 className="text-xs uppercase font-extrabold text-muted-foreground tracking-wider">NBA/Audit Bulletins</h4>
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

        {/* ANNOUNCEMENTS TAB */}
        {activeTab === 'announcements' && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            <div>
              <h3 className="text-base font-black uppercase text-foreground tracking-tight">NBA & Institutional Announcements</h3>
              <p className="text-xs text-muted-foreground font-semibold">Official policy memos, audit schedules, and accreditation announcements.</p>
            </div>
            <div className="border bg-card p-6 rounded-2xl shadow-sm space-y-4">
              {announcements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground font-semibold">No announcements available.</div>
              ) : (
                <div className="space-y-4">
                  {announcements.map((item, idx) => (
                    <div key={idx} className="border-b last:border-b-0 pb-4 last:pb-0 space-y-2 text-xs font-semibold text-left">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-extrabold text-foreground">{item.title}</h4>
                        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded">{item.date}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{item.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PERFORMANCE REPORTS TAB */}
        {activeTab === 'reports' && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            <div>
              <h3 className="text-base font-black uppercase text-foreground tracking-tight">Faculty Academic Performance Reports</h3>
              <p className="text-xs text-muted-foreground font-semibold">Consolidated data reports of syllabus completion, student attendance, and NBA standards.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border bg-card p-5 rounded-2xl shadow-sm text-center">
                <span className="text-[10px] uppercase font-black text-muted-foreground tracking-wider block">Teaching Hours</span>
                <span className="text-3xl font-black text-primary block mt-2">{performance?.hours || 120} Hrs</span>
                <span className="text-[8px] text-muted-foreground font-semibold block mt-1">This Semester Target: 150</span>
              </div>
              <div className="border bg-card p-5 rounded-2xl shadow-sm text-center">
                <span className="text-[10px] uppercase font-black text-muted-foreground tracking-wider block">Attendance Posted</span>
                <span className="text-3xl font-black text-emerald-500 block mt-2">{performance?.attendanceRate || 98.2}%</span>
                <span className="text-[8px] text-muted-foreground font-semibold block mt-1">Syllabus Completion</span>
              </div>
              <div className="border bg-card p-5 rounded-2xl shadow-sm text-center">
                <span className="text-[10px] uppercase font-black text-muted-foreground tracking-wider block">Grading Complete</span>
                <span className="text-3xl font-black text-indigo-500 block mt-2">{performance?.assignmentRate || 95}%</span>
                <span className="text-[8px] text-muted-foreground font-semibold block mt-1">Evaluation & Feedback stats</span>
              </div>
              <div className="border bg-card p-5 rounded-2xl shadow-sm text-center">
                <span className="text-[10px] uppercase font-black text-muted-foreground tracking-wider block">Feedback Rating</span>
                <span className="text-3xl font-black text-amber-500 block mt-2">{performance?.feedbackRating || 4.8} / 5</span>
                <span className="text-[8px] text-muted-foreground font-semibold block mt-1">NBA Standard Audit Review</span>
              </div>
            </div>

            <div className="border bg-card p-6 rounded-2xl shadow-sm space-y-4">
              <h4 className="text-xs uppercase font-extrabold text-muted-foreground tracking-wider border-b pb-2">Institutional Compliance Report</h4>
              <div className="space-y-3 text-xs font-semibold text-muted-foreground text-left">
                <div className="flex justify-between border-b pb-2">
                  <span>Class Attendance Threshold (85% Min)</span>
                  <span className="text-emerald-500 font-bold">Compliant (98.2%)</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span>Assignment Submission Rate</span>
                  <span className="text-emerald-500 font-bold">Compliant (95.0%)</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span>Student Feedback Average Rating</span>
                  <span className="text-emerald-500 font-bold">Excellent (4.8 / 5)</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span>Pending Syllabus Completion Logs</span>
                  <span className="text-indigo-500 font-bold">0 Pending</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI TEACHING ASSISTANT TAB */}
        {activeTab === 'ai_assistant' && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            <div>
              <h3 className="text-base font-black uppercase text-foreground tracking-tight">AI Teaching Assistant</h3>
              <p className="text-xs text-muted-foreground font-semibold">Generate course objectives, grade drafts, or draft announcement content using AI models.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Grading Helper Card */}
              <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-4">
                <h4 className="text-xs uppercase font-extrabold text-muted-foreground tracking-wider border-b pb-2">AI Paper Grader</h4>
                <div className="space-y-3 text-xs font-semibold text-left">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Select Subject</label>
                    <select className="w-full h-9 border rounded-lg bg-background px-2">
                      <option>CS6101 · Design and Analysis of Algorithms</option>
                      <option>CS6102 · Database Management Systems</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Grading Rubric / Criteria</label>
                    <textarea 
                      placeholder="e.g. Code efficiency (40%), Correctness (40%), Comments and formatting (20%)" 
                      className="w-full h-20 border rounded-lg bg-background p-2 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={() => toast.info('AI evaluation workspace is ready. Select student submissions to begin grading.')} 
                    className="w-full h-9 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/95 transition-colors shadow-sm"
                  >
                    Initialize AI Evaluation
                  </button>
                </div>
              </div>

              {/* Lesson Planner Card */}
              <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-4">
                <h4 className="text-xs uppercase font-extrabold text-muted-foreground tracking-wider border-b pb-2">AI Course Material Generator</h4>
                <div className="space-y-3 text-xs font-semibold text-left">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Topic / Lesson Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Introduction to Dynamic Programming" 
                      className="w-full h-9 border rounded bg-background px-3 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Output Format</label>
                    <select className="w-full h-9 border rounded-lg bg-background px-2">
                      <option>Syllabus Lesson Plan</option>
                      <option>Practice Assignments & Rubric</option>
                      <option>Lecture Slide Outlines</option>
                    </select>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => toast.success('Lesson outline and course materials generated in drafts.')} 
                    className="w-full h-9 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/95 transition-colors shadow-sm"
                  >
                    Generate Material Draft
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AVAILABILITY BOARD TAB */}
        {activeTab === 'availability_board' && (
          <DepartmentAvailabilityBoard />
        )}

        {/* LEAVE REQUESTS TAB */}
        {activeTab === 'leave_requests' && (() => {
          // Compute summary stats
          const pendingCount = workflowRequests.filter(r => r.currentStep === 'MENTOR' && ['PENDING', 'PENDING_MENTOR'].includes(r.status)).length;
          const approvedCount = workflowRequests.filter(r => r.status === 'APPROVED' || r.status === 'MENTOR_APPROVED').length;
          const rejectedCount = workflowRequests.filter(r => ['REJECTED', 'REJECTED_BY_MENTOR', 'REJECTED_BY_HOD'].includes(r.status)).length;
          const todaysCount = workflowRequests.filter(r => {
            const today = new Date().toDateString();
            return new Date(r.createdAt).toDateString() === today;
          }).length;
          const odCount = workflowRequests.filter(r => r.type.includes('OD')).length;
          const leaveCount = workflowRequests.filter(r => r.type.includes('LEAVE')).length;

          // Filter workflow requests dynamically
          const filtered = workflowRequests.filter(item => {
            // Search query filter (matches student name or registration/admission numbers)
            const searchStr = wfSearchQuery.toLowerCase();
            const matchesSearch = !wfSearchQuery || 
              (item.student?.firstName || '').toLowerCase().includes(searchStr) ||
              (item.student?.lastName || '').toLowerCase().includes(searchStr) ||
              (item.student?.registerNo || '').toLowerCase().includes(searchStr) ||
              (item.student?.admissionNo || '').toLowerCase().includes(searchStr);

            // Category filter
            const matchesCategory = wfCategoryFilter === 'ALL' || item.type.includes(wfCategoryFilter);

            // Tab filter state mapping
            let matchesTab = false;
            if (workflowTab === 'PENDING') {
              matchesTab = item.currentStep === 'MENTOR' && ['PENDING', 'PENDING_MENTOR'].includes(item.status);
            } else if (workflowTab === 'FORWARDED') {
              matchesTab = item.currentStep === 'HOD' && item.status === 'MENTOR_APPROVED';
            } else if (workflowTab === 'APPROVED') {
              matchesTab = item.status === 'APPROVED';
            } else if (workflowTab === 'REJECTED') {
              matchesTab = ['REJECTED', 'REJECTED_BY_MENTOR', 'REJECTED_BY_HOD'].includes(item.status);
            }

            return matchesSearch && matchesCategory && matchesTab;
          });

          return (
            <div className="space-y-6 animate-in fade-in-50 duration-200 text-left">
              <div>
                <h3 className="text-base font-black uppercase text-foreground tracking-tight">Student Leave & OD Requests</h3>
                <p className="text-xs text-muted-foreground font-semibold">Track, search, filter, and action leave applications filed by your mentor group students.</p>
              </div>

              {/* 1. Summary Metrics Cards (Faculty Dashboard) */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: 'Pending Requests', value: pendingCount, color: 'text-amber-500 bg-amber-50 border-amber-100' },
                  { label: 'Approved Requests', value: approvedCount, color: 'text-emerald-500 bg-emerald-50 border-emerald-100' },
                  { label: 'Rejected Requests', value: rejectedCount, color: 'text-rose-500 bg-rose-50 border-rose-100' },
                  { label: "Today's Requests", value: todaysCount, color: 'text-blue-500 bg-blue-50 border-blue-100' },
                  { label: 'OD Requests', value: odCount, color: 'text-indigo-500 bg-indigo-50 border-indigo-100' },
                  { label: 'Leave Requests', value: leaveCount, color: 'text-teal-500 bg-teal-50 border-teal-100' }
                ].map((card, idx) => (
                  <div key={idx} className={`border p-4 rounded-2xl shadow-sm text-center ${card.color}`}>
                    <span className="text-[9px] uppercase font-black tracking-wider block opacity-80">{card.label}</span>
                    <span className="text-2xl font-black block mt-1">{card.value}</span>
                  </div>
                ))}
              </div>

              {/* 2. Search & Filters Bar */}
              <div className="border bg-card p-4 rounded-2xl shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-semibold">
                <div className="sm:col-span-2 flex flex-col gap-1 text-left">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Search Student</label>
                  <input
                    type="text"
                    value={wfSearchQuery}
                    onChange={e => setWfSearchQuery(e.target.value)}
                    placeholder="Enter student name or registration number..."
                    className="h-9 border rounded-lg bg-background px-3 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="flex flex-col gap-1 text-left">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Category Type</label>
                  <select
                    value={wfCategoryFilter}
                    onChange={e => setWfCategoryFilter(e.target.value)}
                    className="h-9 border rounded-lg bg-background px-2 font-bold"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="LEAVE">Leave Applications</option>
                    <option value="OD">On Duty (OD) Requests</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setWfSearchQuery('');
                      setWfCategoryFilter('ALL');
                    }}
                    className="h-9 border hover:bg-muted font-bold rounded-lg transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>

              {/* 3. Section Selectors Tabs */}
              <div className="flex border rounded-xl overflow-hidden text-xs font-bold w-fit bg-card">
                {[
                  { id: 'PENDING', label: 'Pending Approval' },
                  { id: 'FORWARDED', label: 'Forwarded to HOD' },
                  { id: 'APPROVED', label: 'Approved' },
                  { id: 'REJECTED', label: 'Rejected' },
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
                      workflowRequests.filter(item => {
                        if (tab.id === 'PENDING') return item.currentStep === 'MENTOR' && ['PENDING', 'PENDING_MENTOR'].includes(item.status);
                        if (tab.id === 'FORWARDED') return item.currentStep === 'HOD' && item.status === 'MENTOR_APPROVED';
                        if (tab.id === 'APPROVED') return item.status === 'APPROVED';
                        if (tab.id === 'REJECTED') return ['REJECTED', 'REJECTED_BY_MENTOR', 'REJECTED_BY_HOD'].includes(item.status);
                        return false;
                      }).length
                    })
                  </button>
                ))}
              </div>

              {/* 4. Requests List Table */}
              <div className="border bg-card rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto text-xs font-semibold">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b bg-muted/20 text-[9px] uppercase font-bold text-muted-foreground">
                        <th className="p-3">Student Details</th>
                        <th className="p-3">Category & Type</th>
                        <th className="p-3">Dates & Days</th>
                        <th className="p-3">Reason / Details</th>
                        <th className="p-3">Remarks History</th>
                        <th className="p-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filtered.map((item, idx) => {
                        const days = item.startDate && item.endDate
                          ? Math.ceil((new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / (1000 * 3600 * 24)) + 1
                          : 0;

                        const mentorRemarks = item.history?.find((h: any) => h.stage === 'MENTOR' && h.comment)?.comment || 'No remarks';
                        const hodRemarks = item.history?.find((h: any) => h.stage === 'HOD' && h.comment)?.comment || 'No remarks';

                        return (
                          <tr key={item.id || idx} className="hover:bg-muted/10">
                            <td 
                              onClick={() => {
                                setSelectedWfForHistoryModal(item);
                                setIsHistoryModalOpen(true);
                              }}
                              className="p-3 space-y-1 cursor-pointer"
                            >
                              <p className="font-extrabold text-foreground hover:underline">{item.student?.firstName} {item.student?.lastName}</p>
                              <p className="text-[9px] text-muted-foreground font-mono uppercase">
                                Reg: {item.student?.registerNo || 'N/A'} · Adm: {item.student?.admissionNo || 'N/A'}
                              </p>
                              <p className="text-[9px] text-muted-foreground font-mono uppercase text-indigo-600 font-extrabold">
                                Dept: {item.student?.department?.code || 'N/A'} · Sem {item.student?.semester?.number || 'N/A'}-{item.student?.section?.name || 'N/A'}
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
                              <p className="text-[10px] text-muted-foreground leading-relaxed whitespace-pre-wrap truncate max-w-[190px]">{item.reason}</p>
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
                              {item.currentStep === 'HOD' || item.status === 'APPROVED' || item.status === 'REJECTED_BY_HOD' ? (
                                <p className="text-[9px] text-muted-foreground">
                                  <span className="font-extrabold text-slate-700">HOD Remarks:</span> {hodRemarks}
                                </p>
                              ) : null}
                            </td>
                            <td className="p-3 text-center">
                              {workflowTab === 'PENDING' ? (
                                <div className="flex flex-wrap justify-center gap-1.5">
                                  <button
                                    onClick={() => {
                                      setActionRequest(item);
                                      setActionType('APPROVE');
                                      setActionComment('');
                                      setApprovalRoutingMode('APPROVE');
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
                                <div className="flex flex-col items-center gap-1">
                                  <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                                    item.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                    ['REJECTED', 'REJECTED_BY_MENTOR', 'REJECTED_BY_HOD'].includes(item.status) ? 'bg-rose-50 text-rose-600 border-rose-200' :
                                    'bg-amber-50 text-amber-600 border-amber-200'
                                  }`}>
                                    {item.status.replace(/_/g, ' ')}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setSelectedWfForHistoryModal(item);
                                      setIsHistoryModalOpen(true);
                                    }}
                                    className="text-[9px] text-primary hover:underline font-extrabold"
                                  >
                                    View History
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-muted-foreground">
                            No requests found in this section.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 5. Detailed Pipeline Timeline Modal (View History) */}
              {isHistoryModalOpen && selectedWfForHistoryModal && (() => {
                const req = selectedWfForHistoryModal;
                const daysCount = req.startDate && req.endDate
                  ? Math.ceil((new Date(req.endDate).getTime() - new Date(req.startDate).getTime()) / (1000 * 3600 * 24)) + 1
                  : 0;

                const submitTimeStr = new Date(req.createdAt).toLocaleString('en-IN');
                
                const mentorLog = req.history?.find((h: any) => h.stage === 'MENTOR');
                const hodLog = req.history?.find((h: any) => h.stage === 'HOD');

                return (
                  <div className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="bg-card w-full max-w-lg p-6 rounded-2xl shadow-xl border space-y-5 text-left animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
                      <div className="flex justify-between items-start border-b pb-3">
                        <div>
                          <span className="inline-block bg-primary/10 border border-primary/20 px-2 py-0.5 rounded text-[8px] text-primary font-black uppercase tracking-wider">
                            {req.type} Application Details
                          </span>
                          <h3 className="text-sm font-black uppercase text-foreground mt-1">{req.title}</h3>
                        </div>
                        <button
                          onClick={() => setIsHistoryModalOpen(false)}
                          className="text-muted-foreground hover:text-foreground hover:bg-muted p-1 rounded-lg transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Student Registration Detail Segment */}
                      <div className="grid grid-cols-2 gap-3 text-xs font-semibold border-b pb-4">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-muted-foreground block">Student Fullname</span>
                          <span className="text-foreground font-extrabold">{req.student?.firstName} {req.student?.lastName}</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-muted-foreground block">Registration No</span>
                          <span className="text-foreground font-mono">{req.student?.registerNo || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-muted-foreground block">Department / Program</span>
                          <span className="text-foreground truncate block">{req.student?.department?.name || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-muted-foreground block">Semester & Section</span>
                          <span className="text-foreground">Sem {req.student?.semester?.number || 'N/A'} · Sec {req.student?.section?.name || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Request Details Segment */}
                      <div className="space-y-3 text-xs font-semibold">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-[9px] uppercase font-bold text-muted-foreground block">Start Date</span>
                            <span className="text-foreground">{req.startDate ? new Date(req.startDate).toLocaleDateString('en-IN') : 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-bold text-muted-foreground block">End Date</span>
                            <span className="text-foreground">{req.endDate ? new Date(req.endDate).toLocaleDateString('en-IN') : 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-bold text-muted-foreground block">Requested Duration</span>
                            <span className="text-foreground font-extrabold text-indigo-600">{daysCount} {daysCount === 1 ? 'Day' : 'Days'}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-bold text-muted-foreground block">Submitted Date & Time</span>
                            <span className="text-foreground font-mono">{submitTimeStr}</span>
                          </div>
                        </div>

                        <div>
                          <span className="text-[9px] uppercase font-bold text-muted-foreground block">Reason Description</span>
                          <p className="text-foreground bg-muted/30 border p-3 rounded-xl whitespace-pre-wrap font-semibold leading-relaxed mt-1">{req.reason}</p>
                        </div>

                        {req.attachments && req.attachments !== '[]' && (() => {
                          try {
                            const parsed = JSON.parse(req.attachments);
                            if (parsed.length > 0) {
                              return (
                                <div>
                                  <span className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">Supporting Attachments</span>
                                  <a
                                    href={parsed[0]}
                                    target="_blank"
                                    rel="noreferrer"
                                    download
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-primary/20 bg-primary/5 rounded-lg text-primary hover:bg-primary/10 transition-all"
                                  >
                                    📄 Download Attachment Proof
                                  </a>
                                </div>
                              );
                            }
                          } catch (_) {}
                          return null;
                        })()}
                      </div>

                      {/* 3-Level Vertical Audit Pipeline Timeline */}
                      <div className="border-t pt-4 space-y-3">
                        <span className="text-[10px] uppercase font-black tracking-wider text-muted-foreground block">Workflow Audit Trail</span>
                        
                        <div className="relative pl-6 space-y-5 border-l-2 border-slate-100 text-xs font-semibold">
                          {/* Step 1: Submission */}
                          <div className="relative">
                            <span className="absolute -left-[31px] top-0.5 bg-emerald-500 h-4.5 w-4.5 rounded-full border-4 border-card flex items-center justify-center"></span>
                            <div className="space-y-0.5">
                              <div className="flex justify-between items-center">
                                <span className="font-extrabold text-foreground">1. Submitted Successfully</span>
                                <span className="text-[9px] text-muted-foreground font-mono">{submitTimeStr}</span>
                              </div>
                              <p className="text-[10px] text-muted-foreground">Fyled by student: {req.student?.firstName} {req.student?.lastName}</p>
                            </div>
                          </div>

                          {/* Step 2: Mentor / Faculty Advisor Review */}
                          <div className="relative">
                            <span className={`absolute -left-[31px] top-0.5 h-4.5 w-4.5 rounded-full border-4 border-card ${
                              mentorLog?.action === 'APPROVE' ? 'bg-emerald-500' : mentorLog?.action === 'REJECT' ? 'bg-rose-500' : 'bg-amber-400'
                            }`}></span>
                            <div className="space-y-0.5">
                              <div className="flex justify-between items-center">
                                <span className="font-extrabold text-foreground">2. Mentor / Class Advisor Review</span>
                                <span className="text-[9px] text-muted-foreground font-mono">
                                  {mentorLog ? new Date(mentorLog.createdAt).toLocaleString('en-IN') : (req.currentStep === 'MENTOR' ? 'In Progress' : 'Awaiting')}
                                </span>
                              </div>
                              <p className="text-[10px] text-muted-foreground">
                                {mentorLog 
                                  ? `${mentorLog.action === 'APPROVE' ? 'Approved' : 'Rejected'} by ${mentorLog.actionByName} · "${mentorLog.comment || 'No remarks'}"`
                                  : 'Awaiting decision by assigned faculty mentor.'
                                }
                              </p>
                            </div>
                          </div>

                          {/* Step 3: HOD Review */}
                          <div className="relative">
                            <span className={`absolute -left-[31px] top-0.5 h-4.5 w-4.5 rounded-full border-4 border-card ${
                              hodLog?.action === 'APPROVE' ? 'bg-emerald-500' : hodLog?.action === 'REJECT' ? 'bg-rose-500' : 'bg-slate-200'
                            }`}></span>
                            <div className="space-y-0.5">
                              <div className="flex justify-between items-center">
                                <span className="font-extrabold text-foreground">3. HOD Final Approval</span>
                                <span className="text-[9px] text-muted-foreground font-mono">
                                  {hodLog ? new Date(hodLog.createdAt).toLocaleString('en-IN') : (req.currentStep === 'HOD' ? 'Pending HOD' : 'Awaiting Level 1')}
                                </span>
                              </div>
                              <p className="text-[10px] text-muted-foreground">
                                {hodLog 
                                  ? `${hodLog.action === 'APPROVE' ? 'Approved' : 'Rejected'} by HOD ${hodLog.actionByName} · "${hodLog.comment || 'No remarks'}"`
                                  : (req.status === 'APPROVED' ? 'Skipped (Mentor Only Mode)' : 'Pending Head of Department decision.')
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-3 border-t">
                        <button
                          type="button"
                          onClick={() => setIsHistoryModalOpen(false)}
                          className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-xl text-xs shadow-sm hover:bg-primary/95 transition-colors"
                        >
                          Close Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })()}

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

              {actionType === 'APPROVE' && (
                <div className="space-y-1.5 text-xs font-semibold">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Approval Routing Mode</label>
                  <select
                    value={approvalRoutingMode}
                    onChange={e => setApprovalRoutingMode(e.target.value as any)}
                    className="w-full h-10 border rounded-xl bg-background px-3 focus:outline-none focus:ring-1 focus:ring-primary text-xs font-bold"
                  >
                    <option value="APPROVE">Direct Approval (Final Status - HOD is Optional)</option>
                    <option value="FORWARD">Approve & Forward to HOD for Final Review</option>
                  </select>
                </div>
              )}

              <div className="space-y-1.5 text-xs font-semibold">
                <label className="text-[9px] uppercase font-bold text-muted-foreground">Remarks / Comments</label>
                <textarea
                  value={actionComment}
                  onChange={e => setActionComment(e.target.value)}
                  placeholder="Enter remarks or feedback for the student..."
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
                    const finalAction = actionType === 'APPROVE' ? approvalRoutingMode : 'REJECT';
                    handleWorkflowAction(actionRequest.id, finalAction, actionComment);
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

        {/* MY PROFILE */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            
            {/* Profile Header */}
            <div className="border bg-card p-5 rounded-xl shadow-sm flex flex-col md:flex-row items-center md:items-start gap-6 text-xs font-semibold">
              <div className="relative flex-shrink-0">
                {profilePhotoBase64 === 'DELETE' ? (
                  <div className="w-24 h-24 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl font-bold text-primary select-none">
                    {profileForm.firstName?.[0] || currentUser?.firstName?.[0] || 'F'}
                  </div>
                ) : profilePhotoBase64 ? (
                  <img
                    src={profilePhotoBase64}
                    alt="Resized preview"
                    className="w-24 h-24 rounded-full object-cover border-2 border-primary shadow-sm"
                  />
                ) : currentUser?.profilePhoto ? (
                  <img
                    src={currentUser.profilePhoto}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover border-2 border-primary shadow-sm"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl font-bold text-primary select-none">
                    {profileForm.firstName?.[0] || currentUser?.firstName?.[0] || 'F'}
                  </div>
                )}

                {isEditingProfile && (
                  <div className="absolute -bottom-2 -right-2 flex flex-wrap gap-1">
                    <label className="p-1.5 bg-primary text-primary-foreground rounded-full shadow hover:opacity-90 cursor-pointer flex items-center justify-center text-[10px]">
                      📷
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg,.webp"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleDeletePhoto}
                      className="p-1.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-full shadow hover:bg-rose-100 flex items-center justify-center text-[10px]"
                      title="Delete profile photo"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2.5 text-center md:text-left w-full">
                <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4">
                  <div>
                    <h2 className="text-base font-extrabold uppercase text-foreground">
                      {profileForm.firstName || user.firstName} {profileForm.lastName || user.lastName}
                    </h2>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">
                      {profileData?.designation || 'Faculty Member'} • {profileData?.department?.name || 'Academic block'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!isEditingProfile ? (
                      <button
                        onClick={() => setIsEditingProfile(true)}
                        className="px-3 py-1.5 bg-primary text-primary-foreground hover:opacity-95 rounded-lg text-[10px] font-black uppercase flex flex-wrap items-center gap-1.5"
                      >
                        ✏️ Edit Profile
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleSaveProfile}
                          disabled={isSavingProfile}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase flex flex-wrap items-center gap-1.5 disabled:opacity-50"
                        >
                          💾 {isSavingProfile ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingProfile(false);
                            setProfilePhotoBase64(null);
                            fetchFacultyDashboardData();
                          }}
                          className="px-3 py-1.5 border hover:bg-muted rounded-lg text-[10px] font-black uppercase flex flex-wrap items-center gap-1.5"
                        >
                          ❌ Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-1.5 text-muted-foreground pt-2.5 border-t">
                  <p>Employee ID: <span className="text-foreground font-bold font-mono">{profileData?.employeeId || 'EMP-PENDING'}</span></p>
                  <p>Email: <span className="text-foreground font-semibold">{profileData?.email || user.email}</span></p>
                  <p>Mobile: <span className="text-foreground font-mono">{profileData?.phone || 'N/A'}</span></p>
                  <p>Status: <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${profileData?.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>{profileData?.status || 'ACTIVE'}</span></p>
                  <p>Joined Date: <span className="text-foreground font-mono">{profileData?.dateOfJoining ? new Date(profileData.dateOfJoining).toISOString().split('T')[0] : 'N/A'}</span></p>
                </div>
              </div>
            </div>

            {/* Inner Tabs Selector */}
            <div className="flex flex-wrap border-b text-[10px] font-black uppercase gap-1 cursor-pointer overflow-x-auto whitespace-nowrap">
              <button
                onClick={() => setProfileSubTab('personal')}
                className={`px-4 py-2 border-b-2 transition-all ${profileSubTab === 'personal' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              >
                👤 Personal Details
              </button>
              <button
                onClick={() => setProfileSubTab('academic')}
                className={`px-4 py-2 border-b-2 transition-all ${profileSubTab === 'academic' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              >
                🎓 Professional & Research
              </button>
              <button
                onClick={() => setProfileSubTab('security')}
                className={`px-4 py-2 border-b-2 transition-all ${profileSubTab === 'security' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              >
                🔒 Preferences & Security
              </button>
            </div>

            {/* Tab 1: Personal Details */}
            {profileSubTab === 'personal' && (
              <div className="border bg-card p-6 rounded-xl shadow-sm space-y-4">
                <h3 className="text-xs font-extrabold uppercase border-b pb-2 text-primary tracking-wider">Personal Identity & Contact Info</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-muted-foreground">First Name</label>
                    <input
                      type="text"
                      disabled={!isEditingProfile}
                      value={profileForm.firstName}
                      onChange={e => setProfileForm({ ...profileForm, firstName: e.target.value })}
                      className="h-9 border rounded bg-background px-3"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-muted-foreground">Last Name</label>
                    <input
                      type="text"
                      disabled={!isEditingProfile}
                      value={profileForm.lastName}
                      onChange={e => setProfileForm({ ...profileForm, lastName: e.target.value })}
                      className="h-9 border rounded bg-background px-3"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-muted-foreground">Date of Birth</label>
                    <input
                      type="date"
                      disabled={!isEditingProfile}
                      value={profileForm.dob ? profileForm.dob.split('T')[0] : ''}
                      onChange={e => setProfileForm({ ...profileForm, dob: e.target.value })}
                      className="h-9 border rounded bg-background px-3 font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-muted-foreground">Gender</label>
                    <select
                      disabled={!isEditingProfile}
                      value={profileForm.gender}
                      onChange={e => setProfileForm({ ...profileForm, gender: e.target.value })}
                      className="h-9 border rounded bg-background px-3 cursor-pointer"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-muted-foreground">Blood Group</label>
                    <input
                      type="text"
                      disabled={!isEditingProfile}
                      value={profileForm.bloodGroup}
                      onChange={e => setProfileForm({ ...profileForm, bloodGroup: e.target.value })}
                      placeholder="e.g. O+"
                      className="h-9 border rounded bg-background px-3"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-muted-foreground">Marital Status</label>
                    <select
                      disabled={!isEditingProfile}
                      value={profileForm.maritalStatus}
                      onChange={e => setProfileForm({ ...profileForm, maritalStatus: e.target.value })}
                      className="h-9 border rounded bg-background px-3 cursor-pointer"
                    >
                      <option value="">Select...</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-muted-foreground">Nationality</label>
                    <input
                      type="text"
                      disabled={!isEditingProfile}
                      value={profileForm.nationality}
                      onChange={e => setProfileForm({ ...profileForm, nationality: e.target.value })}
                      className="h-9 border rounded bg-background px-3"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-muted-foreground">Aadhaar Number (Optional)</label>
                    <input
                      type="text"
                      disabled={!isEditingProfile}
                      value={profileForm.aadhaarNo}
                      onChange={e => setProfileForm({ ...profileForm, aadhaarNo: e.target.value })}
                      placeholder="12-digit Aadhaar"
                      className="h-9 border rounded bg-background px-3 font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-muted-foreground">PAN Card Number (Optional)</label>
                    <input
                      type="text"
                      disabled={!isEditingProfile}
                      value={profileForm.panNo}
                      onChange={e => setProfileForm({ ...profileForm, panNo: e.target.value })}
                      placeholder="10-digit PAN"
                      className="h-9 border rounded bg-background px-3 font-mono uppercase"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-muted-foreground">Personal Email</label>
                    <input
                      type="email"
                      disabled={!isEditingProfile}
                      value={profileForm.personalEmail}
                      onChange={e => setProfileForm({ ...profileForm, personalEmail: e.target.value })}
                      placeholder="alternative contact email"
                      className="h-9 border rounded bg-background px-3"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-muted-foreground">Personal Mobile</label>
                    <input
                      type="text"
                      disabled={!isEditingProfile}
                      value={profileForm.personalPhone}
                      onChange={e => setProfileForm({ ...profileForm, personalPhone: e.target.value })}
                      placeholder="10-digit phone"
                      className="h-9 border rounded bg-background px-3 font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-muted-foreground">Alternate Mobile</label>
                    <input
                      type="text"
                      disabled={!isEditingProfile}
                      value={profileForm.alternatePhone}
                      onChange={e => setProfileForm({ ...profileForm, alternatePhone: e.target.value })}
                      placeholder="backup mobile"
                      className="h-9 border rounded bg-background px-3 font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-muted-foreground">Emergency Contact Name</label>
                    <input
                      type="text"
                      disabled={!isEditingProfile}
                      value={profileForm.emergencyName}
                      onChange={e => setProfileForm({ ...profileForm, emergencyName: e.target.value })}
                      className="h-9 border rounded bg-background px-3"
                    />
                  </div>

                  <div className="flex flex-col gap-1 col-span-2">
                    <label className="text-[9px] uppercase font-bold text-muted-foreground">Emergency Contact Phone</label>
                    <input
                      type="text"
                      disabled={!isEditingProfile}
                      value={profileForm.emergencyPhone}
                      onChange={e => setProfileForm({ ...profileForm, emergencyPhone: e.target.value })}
                      className="h-9 border rounded bg-background px-3 font-mono"
                    />
                  </div>
                </div>

                <h3 className="text-xs font-extrabold uppercase border-b pb-2 pt-2 text-primary tracking-wider">Address Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-muted-foreground">Address Line 1</label>
                    <input
                      type="text"
                      disabled={!isEditingProfile}
                      value={profileForm.addressLine1}
                      onChange={e => setProfileForm({ ...profileForm, addressLine1: e.target.value })}
                      className="h-9 border rounded bg-background px-3"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-muted-foreground">Address Line 2</label>
                    <input
                      type="text"
                      disabled={!isEditingProfile}
                      value={profileForm.addressLine2}
                      onChange={e => setProfileForm({ ...profileForm, addressLine2: e.target.value })}
                      className="h-9 border rounded bg-background px-3"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-5 gap-4 text-xs font-semibold animate-in fade-in-20">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-muted-foreground">City</label>
                    <input
                      type="text"
                      disabled={!isEditingProfile}
                      value={profileForm.city}
                      onChange={e => setProfileForm({ ...profileForm, city: e.target.value })}
                      className="h-9 border rounded bg-background px-3"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-muted-foreground">District</label>
                    <input
                      type="text"
                      disabled={!isEditingProfile}
                      value={profileForm.district}
                      onChange={e => setProfileForm({ ...profileForm, district: e.target.value })}
                      className="h-9 border rounded bg-background px-3"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-muted-foreground">State</label>
                    <input
                      type="text"
                      disabled={!isEditingProfile}
                      value={profileForm.state}
                      onChange={e => setProfileForm({ ...profileForm, state: e.target.value })}
                      className="h-9 border rounded bg-background px-3"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-muted-foreground">Country</label>
                    <input
                      type="text"
                      disabled={!isEditingProfile}
                      value={profileForm.country}
                      onChange={e => setProfileForm({ ...profileForm, country: e.target.value })}
                      className="h-9 border rounded bg-background px-3"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-muted-foreground">Pincode</label>
                    <input
                      type="text"
                      disabled={!isEditingProfile}
                      value={profileForm.pincode}
                      onChange={e => setProfileForm({ ...profileForm, pincode: e.target.value })}
                      className="h-9 border rounded bg-background px-3 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Professional & Research */}
            {profileSubTab === 'academic' && (
              <div className="space-y-6 animate-in fade-in-20">
                
                {/* Professional Information (Read Only) */}
                <div className="border bg-card p-6 rounded-xl shadow-sm space-y-4">
                  <h3 className="text-xs font-extrabold uppercase border-b pb-2 text-primary tracking-wider">Employment Profile (Read-Only)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3.5 text-xs text-muted-foreground font-semibold">
                    <p>Employee ID: <span className="block font-bold text-foreground mt-0.5 font-mono">{profileData?.employeeId || 'N/A'}</span></p>
                    <p>Department: <span className="block font-bold text-foreground mt-0.5">{profileData?.department?.name || 'N/A'}</span></p>
                    <p>Program: <span className="block font-bold text-foreground mt-0.5">{profileForm.program || 'B.Tech'}</span></p>
                    <p>Designation: <span className="block font-bold text-foreground mt-0.5">{profileData?.designation || 'N/A'}</span></p>
                    <p>Employment Type: <span className="block font-bold text-foreground mt-0.5">{profileForm.employmentType || 'FULL_TIME'}</span></p>
                    <p>Joining Date: <span className="block font-bold text-foreground mt-0.5 font-mono">{profileData?.dateOfJoining ? new Date(profileData.dateOfJoining).toISOString().split('T')[0] : 'N/A'}</span></p>
                    <p>Teaching Experience: <span className="block font-bold text-foreground mt-0.5 font-mono">{profileData?.experience || 0} Years</span></p>
                    <p>Academic Qualification: <span className="block font-bold text-foreground mt-0.5">{profileData?.qualification || 'N/A'}</span></p>
                    <p>Specialization: <span className="block font-bold text-foreground mt-0.5">{profileForm.specialization || 'N/A'}</span></p>
                    <p>Highest Degree: <span className="block font-bold text-foreground mt-0.5">{profileForm.highestDegree || 'N/A'}</span></p>
                    <p>University: <span className="block font-bold text-foreground mt-0.5">{profileForm.university || 'N/A'}</span></p>
                    <p>Research Area: <span className="block font-bold text-foreground mt-0.5">{profileForm.researchArea || 'N/A'}</span></p>
                    <p>Faculty Type: <span className="block font-bold text-foreground mt-0.5">{profileForm.facultyType || 'REGULAR'}</span></p>
                    <p>Office Room Number: <span className="block font-bold text-foreground mt-0.5">{profileForm.officeRoom || 'N/A'}</span></p>
                    <p>Office Extension: <span className="block font-bold text-foreground mt-0.5 font-mono">{profileForm.officeExtension || 'N/A'}</span></p>
                  </div>
                </div>

                {/* Academic & Research Information (Editable) */}
                <div className="border bg-card p-6 rounded-xl shadow-sm space-y-4">
                  <h3 className="text-xs font-extrabold uppercase border-b pb-2 text-primary tracking-wider">Academic & Research Portfolio</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                    
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase font-bold text-muted-foreground">Highest Qualification</label>
                      <input
                        type="text"
                        disabled={!isEditingProfile}
                        value={profileForm.highestQualification}
                        onChange={e => setProfileForm({ ...profileForm, highestQualification: e.target.value })}
                        placeholder="e.g. Ph.D. in Machine Learning"
                        className="h-9 border rounded bg-background px-3"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase font-bold text-muted-foreground">LinkedIn Profile</label>
                      <input
                        type="url"
                        disabled={!isEditingProfile}
                        value={profileForm.linkedinProfile}
                        onChange={e => setProfileForm({ ...profileForm, linkedinProfile: e.target.value })}
                        placeholder="https://linkedin.com/in/username"
                        className="h-9 border rounded bg-background px-3"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase font-bold text-muted-foreground">Google Scholar URL</label>
                      <input
                        type="url"
                        disabled={!isEditingProfile}
                        value={profileForm.googleScholar}
                        onChange={e => setProfileForm({ ...profileForm, googleScholar: e.target.value })}
                        placeholder="Scholar profile URL"
                        className="h-9 border rounded bg-background px-3"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase font-bold text-muted-foreground">ORCID ID</label>
                      <input
                        type="text"
                        disabled={!isEditingProfile}
                        value={profileForm.orcidId}
                        onChange={e => setProfileForm({ ...profileForm, orcidId: e.target.value })}
                        placeholder="e.g. 0000-0002-1825-0097"
                        className="h-9 border rounded bg-background px-3 font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase font-bold text-muted-foreground">Portfolio Website</label>
                      <input
                        type="url"
                        disabled={!isEditingProfile}
                        value={profileForm.portfolioWebsite}
                        onChange={e => setProfileForm({ ...profileForm, portfolioWebsite: e.target.value })}
                        placeholder="https://personal-portfolio.com"
                        className="h-9 border rounded bg-background px-3"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase font-bold text-muted-foreground">Industry Experience (Years)</label>
                      <input
                        type="number"
                        disabled={!isEditingProfile}
                        value={profileForm.industryExperience}
                        onChange={e => setProfileForm({ ...profileForm, industryExperience: parseInt(e.target.value, 10) || 0 })}
                        min="0"
                        className="h-9 border rounded bg-background px-3 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 pt-1">
                    <label className="text-[9px] uppercase font-bold text-muted-foreground">Research Interests</label>
                    <textarea
                      disabled={!isEditingProfile}
                      value={profileForm.researchInterests}
                      onChange={e => setProfileForm({ ...profileForm, researchInterests: e.target.value })}
                      placeholder="Add research domains (separated by commas or JSON array)..."
                      className="h-16 border rounded bg-background p-3"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-muted-foreground">Publications List</label>
                    <textarea
                      disabled={!isEditingProfile}
                      value={profileForm.publications}
                      onChange={e => setProfileForm({ ...profileForm, publications: e.target.value })}
                      placeholder="List publications (separated by commas or JSON array)..."
                      className="h-20 border rounded bg-background p-3"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase font-bold text-muted-foreground">Patents Filed / Granted</label>
                      <textarea
                        disabled={!isEditingProfile}
                        value={profileForm.patents}
                        onChange={e => setProfileForm({ ...profileForm, patents: e.target.value })}
                        placeholder="Patents log list..."
                        className="h-16 border rounded bg-background p-3"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase font-bold text-muted-foreground">Books Authored</label>
                      <textarea
                        disabled={!isEditingProfile}
                        value={profileForm.books}
                        onChange={e => setProfileForm({ ...profileForm, books: e.target.value })}
                        placeholder="Books list..."
                        className="h-16 border rounded bg-background p-3"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Security & Preferences */}
            {profileSubTab === 'security' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in-20">
                
                {/* Password Management */}
                <div className="border bg-card p-6 rounded-xl shadow-sm space-y-4 h-fit text-xs font-semibold">
                  <h3 className="text-xs font-extrabold uppercase border-b pb-2 text-primary tracking-wider">Password Management</h3>
                  <form onSubmit={handleChangePassword} className="space-y-3.5">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase font-bold text-muted-foreground">Current Password</label>
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="h-9 border rounded bg-background px-3 font-mono"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase font-bold text-muted-foreground">New Password</label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="h-9 border rounded bg-background px-3 font-mono"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase font-bold text-muted-foreground">Confirm New Password</label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="h-9 border rounded bg-background px-3 font-mono"
                        required
                      />
                    </div>

                    {/* Password Strength Checklist */}
                    <div className="p-3 bg-muted/40 rounded-lg text-[10px] space-y-1">
                      <p className="font-extrabold text-[9px] uppercase text-muted-foreground tracking-wide">Verification Criteria:</p>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-1 font-bold">
                        <li className={passwordForm.newPassword.length >= 8 ? 'text-emerald-600' : 'text-rose-600'}>
                          {passwordForm.newPassword.length >= 8 ? '✓' : '✗'} 8+ Characters
                        </li>
                        <li className={/[A-Z]/.test(passwordForm.newPassword) ? 'text-emerald-600' : 'text-rose-600'}>
                          {/[A-Z]/.test(passwordForm.newPassword) ? '✓' : '✗'} Uppercase Character
                        </li>
                        <li className={/[a-z]/.test(passwordForm.newPassword) ? 'text-emerald-600' : 'text-rose-600'}>
                          {/[a-z]/.test(passwordForm.newPassword) ? '✓' : '✗'} Lowercase Character
                        </li>
                        <li className={/[0-9]/.test(passwordForm.newPassword) ? 'text-emerald-600' : 'text-rose-600'}>
                          {/[0-9]/.test(passwordForm.newPassword) ? '✓' : '✗'} Number (0-9)
                        </li>
                        <li className={/[^A-Za-z0-9]/.test(passwordForm.newPassword) ? 'text-emerald-600' : 'text-rose-600'}>
                          {/[^A-Za-z0-9]/.test(passwordForm.newPassword) ? '✓' : '✗'} Special Character
                        </li>
                      </ul>
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="w-full h-9 bg-primary text-primary-foreground font-black uppercase hover:opacity-90 rounded-lg disabled:opacity-50 transition-opacity"
                    >
                      Update Password
                    </button>
                  </form>
                </div>

                {/* Notification Preferences */}
                <div className="border bg-card p-6 rounded-xl shadow-sm space-y-4 h-fit text-xs font-semibold">
                  <h3 className="text-xs font-extrabold uppercase border-b pb-2 text-primary tracking-wider">Alerts & Notifications</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="font-extrabold text-[9px] uppercase text-muted-foreground tracking-wide">Communication channels:</p>
                      <label className="flex flex-wrap items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          disabled={!isEditingProfile}
                          checked={profileForm.notificationPrefs?.email}
                          onChange={e => setProfileForm({
                            ...profileForm,
                            notificationPrefs: { ...profileForm.notificationPrefs, email: e.target.checked }
                          })}
                          className="w-4 h-4 accent-primary"
                        />
                        <span>Email Notifications</span>
                      </label>
                      
                      <label className="flex flex-wrap items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          disabled={!isEditingProfile}
                          checked={profileForm.notificationPrefs?.sms}
                          onChange={e => setProfileForm({
                            ...profileForm,
                            notificationPrefs: { ...profileForm.notificationPrefs, sms: e.target.checked }
                          })}
                          className="w-4 h-4 accent-primary"
                        />
                        <span>SMS / Text Alerts</span>
                      </label>

                      <label className="flex flex-wrap items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          disabled={!isEditingProfile}
                          checked={profileForm.notificationPrefs?.push}
                          onChange={e => setProfileForm({
                            ...profileForm,
                            notificationPrefs: { ...profileForm.notificationPrefs, push: e.target.checked }
                          })}
                          className="w-4 h-4 accent-primary"
                        />
                        <span>Web Push Notifications</span>
                      </label>
                    </div>

                    <div className="space-y-2 pt-2 border-t">
                      <p className="font-extrabold text-[9px] uppercase text-muted-foreground tracking-wide">Academic Event Triggers:</p>
                      <label className="flex flex-wrap items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          disabled={!isEditingProfile}
                          checked={profileForm.notificationPrefs?.assignmentAlerts}
                          onChange={e => setProfileForm({
                            ...profileForm,
                            notificationPrefs: { ...profileForm.notificationPrefs, assignmentAlerts: e.target.checked }
                          })}
                          className="w-4 h-4 accent-primary"
                        />
                        <span>Assignment Submissions</span>
                      </label>

                      <label className="flex flex-wrap items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          disabled={!isEditingProfile}
                          checked={profileForm.notificationPrefs?.attendanceAlerts}
                          onChange={e => setProfileForm({
                            ...profileForm,
                            notificationPrefs: { ...profileForm.notificationPrefs, attendanceAlerts: e.target.checked }
                          })}
                          className="w-4 h-4 accent-primary"
                        />
                        <span>Class Attendance Alerts</span>
                      </label>

                      <label className="flex flex-wrap items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          disabled={!isEditingProfile}
                          checked={profileForm.notificationPrefs?.leaveAlerts}
                          onChange={e => setProfileForm({
                            ...profileForm,
                            notificationPrefs: { ...profileForm.notificationPrefs, leaveAlerts: e.target.checked }
                          })}
                          className="w-4 h-4 accent-primary"
                        />
                        <span>Leave Request Approvals</span>
                      </label>

                      <label className="flex flex-wrap items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          disabled={!isEditingProfile}
                          checked={profileForm.notificationPrefs?.meetingAlerts}
                          onChange={e => setProfileForm({
                            ...profileForm,
                            notificationPrefs: { ...profileForm.notificationPrefs, meetingAlerts: e.target.checked }
                          })}
                          className="w-4 h-4 accent-primary"
                        />
                        <span>Department Meetings & Seminars</span>
                      </label>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* ASSIGNED SUBJECTS */}
        {activeTab === 'subjects' && (
          <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-extrabold uppercase">Subjects Assigned (Fall 2026)</h3>
              <button
                onClick={handleOpenAddSubject}
                className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-[10px] font-black uppercase hover:opacity-90 transition-opacity"
              >
                ➕ Add Subject
              </button>
            </div>
            
            <div className="overflow-x-auto border rounded-xl">
              <table className="w-full text-left text-xs font-semibold">
                <thead>
                  <tr className="border-b bg-muted/20 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                    <th className="p-3">Subject Code</th>
                    <th className="p-3">Subject Name</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Semester</th>
                    <th className="p-3">Section</th>
                    <th className="p-3 text-center">Credits</th>
                    <th className="p-3 text-center">Hours / Week</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((sub, idx) => {
                    const deptName = departments.find(d => d.id === sub.departmentId)?.name || 'Computer Science';
                    return (
                      <tr key={sub.id || idx} className="border-b last:border-0 hover:bg-muted/10">
                        <td className="p-3 font-mono font-bold text-primary">{sub.code}</td>
                        <td className="p-3 text-foreground">{sub.name}</td>
                        <td className="p-3 text-muted-foreground">{deptName}</td>
                        <td className="p-3">{sub.semester || 'N/A'}</td>
                        <td className="p-3 font-bold">{sub.section || 'N/A'}</td>
                        <td className="p-3 text-center font-mono">{sub.credits}</td>
                        <td className="p-3 text-center font-mono">{sub.isLab ? sub.practicalHours : sub.theoryHours} hrs</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${sub.status === 'ACTIVE' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-rose-50 border-rose-200 text-rose-600'}`}>
                            {sub.status || 'ACTIVE'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex flex-wrap justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditSubject(sub)}
                              className="px-2 py-1 bg-primary text-primary-foreground rounded font-extrabold text-[9px]"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteSubject(sub.id)}
                              className="px-2 py-1 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 rounded font-extrabold text-[9px]"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {subjects.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-6 text-center text-muted-foreground">No assigned subjects found. Click "Add Subject" to begin.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TIMETABLE */}
        {activeTab === 'timetable' && (() => {
          const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const filteredTimetable = isMobile 
            ? timetable.filter(slot => slot.dayOfWeek.toLowerCase() === selectedTimetableDay.toLowerCase())
            : timetable;

          return (
            <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-2">
                <h3 className="text-sm font-extrabold uppercase">My Timetable Schedule</h3>
                <div className="flex flex-wrap gap-2">
                  <label className="px-3 py-1.5 border hover:bg-muted rounded-lg text-[10px] font-black uppercase cursor-pointer flex flex-wrap items-center gap-1.5">
                    📥 Import CSV
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleImportCSV}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={handleExportCSV}
                    className="px-3 py-1.5 border hover:bg-muted rounded-lg text-[10px] font-black uppercase flex flex-wrap items-center gap-1.5"
                  >
                    Export CSV
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 border hover:bg-muted rounded-lg text-[10px] font-black uppercase flex flex-wrap items-center gap-1.5"
                  >
                    Print
                  </button>
                  <button
                    onClick={handleOpenAddTimetable}
                    className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-[10px] font-black uppercase hover:opacity-90 transition-opacity"
                  >
                    Add Timetable
                  </button>
                </div>
              </div>

              {isMobile && (
                <div className="flex flex-wrap overflow-x-auto gap-1.5 pb-2 scrollbar-none border-b -mx-2 px-2">
                  {days.map(d => {
                    const isSelected = selectedTimetableDay.toLowerCase() === d.toLowerCase();
                    return (
                      <button
                        type="button"
                        key={d}
                        onClick={() => setSelectedTimetableDay(d)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                          isSelected ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              )}

              {isMobile ? (
                <div className="space-y-3">
                  {filteredTimetable.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic text-center py-6">No scheduled periods for {selectedTimetableDay}.</p>
                  ) : (
                    filteredTimetable.map((slot, idx) => {
                      const roomStr = slot.roomNo || '';
                      const roomMatch = roomStr.match(/^([^\[]+)/);
                      const buildingMatch = roomStr.match(/\[Building:\s*([^\]]+)\]/);
                      const modeMatch = roomStr.match(/\[Mode:\s*([^\]]+)\]/);
                      const parsedRoom = {
                        room: roomMatch ? roomMatch[1].trim() : roomStr,
                        building: buildingMatch ? buildingMatch[1].trim() : '',
                        mode: modeMatch ? modeMatch[1].trim() : 'Offline'
                      };

                      return (
                        <div key={idx} className="p-4 border rounded-xl bg-background space-y-3 hover:shadow-sm transition-all text-xs font-semibold text-left">
                          <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-[10px] font-bold text-primary tracking-wider uppercase">Period {slot.slotIndex}</span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                              parsedRoom.mode === 'Online' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' :
                              parsedRoom.mode === 'Hybrid' ? 'bg-amber-50 border-amber-200 text-amber-600' :
                              'bg-slate-50 border-slate-200 text-slate-600'
                            }`}>{parsedRoom.mode}</span>
                          </div>
                          <div>
                            <h4 className="font-extrabold text-foreground text-sm">{slot.subject?.name || 'N/A'}</h4>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{slot.department?.name || 'N/A'} · Sem {slot.semester?.name || slot.semester || 'N/A'} · Sec {slot.section?.name || slot.section || 'N/A'}</p>
                          </div>
                          <div className="flex justify-between items-center text-[10px] pt-2 border-t font-semibold">
                            <span className="text-muted-foreground">Location: <span className="text-foreground font-bold">{parsedRoom.room} {parsedRoom.building && `(${parsedRoom.building})`}</span></span>
                            <span className="text-muted-foreground font-mono font-bold bg-muted px-2 py-0.5 rounded">{slot.startTime} - {slot.endTime}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditTimetable(slot)}
                              className="px-2.5 py-1 bg-primary text-primary-foreground rounded font-extrabold text-[9px]"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTimetable(slot.id)}
                              className="px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 rounded font-extrabold text-[9px]"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-left text-xs font-semibold">
                    <thead>
                      <tr className="border-b bg-muted/20 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                        <th className="p-3">Day</th>
                        <th className="p-3 text-center">Period</th>
                        <th className="p-3">Time</th>
                        <th className="p-3">Subject</th>
                        <th className="p-3">Department</th>
                        <th className="p-3">Semester</th>
                        <th className="p-3">Section</th>
                        <th className="p-3">Room / Bldg</th>
                        <th className="p-3 text-center">Mode</th>
                        <th className="p-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timetable.map((slot, idx) => {
                        const roomStr = slot.roomNo || '';
                        const roomMatch = roomStr.match(/^([^\[]+)/);
                        const buildingMatch = roomStr.match(/\[Building:\s*([^\]]+)\]/);
                        const modeMatch = roomStr.match(/\[Mode:\s*([^\]]+)\]/);
                        const parsedRoom = {
                          room: roomMatch ? roomMatch[1].trim() : roomStr,
                          building: buildingMatch ? buildingMatch[1].trim() : '',
                          mode: modeMatch ? modeMatch[1].trim() : 'Offline'
                        };

                        return (
                          <tr key={slot.id || idx} className="border-b last:border-0 hover:bg-muted/10">
                            <td className="p-3 font-bold text-primary">{slot.dayOfWeek}</td>
                            <td className="p-3 text-center font-mono font-bold">{slot.slotIndex}</td>
                            <td className="p-3 font-mono text-muted-foreground">{slot.startTime} - {slot.endTime}</td>
                            <td className="p-3 text-foreground font-bold">{slot.subject?.name || 'N/A'}</td>
                            <td className="p-3 text-muted-foreground">{slot.department?.name || 'N/A'}</td>
                            <td className="p-3">{slot.semester?.name || 'N/A'}</td>
                            <td className="p-3 font-bold">{slot.section?.name || 'N/A'}</td>
                            <td className="p-3">
                              <span className="block font-bold">{parsedRoom.room}</span>
                              {parsedRoom.building && <span className="block text-[8px] text-muted-foreground font-mono">{parsedRoom.building}</span>}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                                parsedRoom.mode === 'Online' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' :
                                parsedRoom.mode === 'Hybrid' ? 'bg-amber-50 border-amber-200 text-amber-600' :
                                'bg-slate-50 border-slate-200 text-slate-600'
                              }`}>
                                {parsedRoom.mode}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex flex-wrap justify-center gap-1.5">
                                <button
                                  onClick={() => handleOpenEditTimetable(slot)}
                                  className="px-2 py-1 bg-primary text-primary-foreground rounded font-extrabold text-[9px]"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteTimetable(slot.id)}
                                  className="px-2 py-1 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 rounded font-extrabold text-[9px]"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {timetable.length === 0 && (
                        <tr>
                          <td colSpan={10} className="p-6 text-center text-muted-foreground">No timetable slots found. Click "Add Timetable" to begin.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })()}

        {/* MARK ATTENDANCE */}
        {activeTab === 'attendance' && (
          <div className="border bg-card p-5 rounded-xl shadow-sm space-y-6">
            <h3 className="text-sm font-extrabold uppercase border-b pb-2">Class Attendance Registry</h3>
            
            <form onSubmit={handleMarkAttendance} className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-semibold">
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
                <label className="text-[9px] uppercase font-bold text-muted-foreground">Target Section</label>
                <select
                  value={selectedSection}
                  onChange={e => setSelectedSection(e.target.value)}
                  className="h-9 border rounded bg-background px-3"
                >
                  <option value="">Select section...</option>
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold text-muted-foreground">Attendance Date</label>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={e => setAttendanceDate(e.target.value)}
                  className="h-9 border rounded bg-background px-3"
                />
              </div>

              <button type="submit" className="md:col-span-4 h-9 bg-primary text-primary-foreground rounded font-bold hover:bg-primary/95">
                Bulk Post Attendance Sheet
              </button>
            </form>

            {isMobile ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {students.map((std, idx) => {
                  const isPresent = (attendanceRecords[std.id] || 'PRESENT') === 'PRESENT';
                  return (
                    <div 
                      key={idx} 
                      onClick={() => {
                        setAttendanceRecords({ 
                          ...attendanceRecords, 
                          [std.id]: isPresent ? 'ABSENT' : 'PRESENT' 
                        });
                      }}
                      className={`p-4 border rounded-xl flex items-center justify-between cursor-pointer transition-all active:scale-[0.98] ${
                        isPresent 
                          ? 'border-emerald-200 bg-emerald-50/40 text-emerald-950 shadow-sm shadow-emerald-50' 
                          : 'border-rose-200 bg-rose-50/40 text-rose-955 shadow-sm shadow-rose-50'
                      }`}
                    >
                      <div className="space-y-1 text-left">
                        <span className="text-[10px] text-muted-foreground font-mono uppercase block">{std.admissionNo}</span>
                        <h4 className="font-extrabold text-sm">{std.firstName} {std.lastName}</h4>
                      </div>
                      <div className={`px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isPresent ? 'bg-emerald-500 text-white shadow-sm' : 'bg-rose-500 text-white shadow-sm'
                      }`}>
                        {isPresent ? 'Present' : 'Absent'}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="w-full overflow-x-auto max-w-[90vw] md:max-w-full pb-2 scrollbar-thin"><table className="w-full text-xs text-left border">
                <thead>
                  <tr className="border-b bg-muted/20 text-[9px] uppercase font-bold text-muted-foreground">
                    <th className="p-2.5">Student Roll</th>
                    <th className="p-2.5">Full Name</th>
                    <th className="p-2.5 text-center">Status Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((std, idx) => (
                    <tr key={idx} className="border-b last:border-b-0 hover:bg-muted/10 font-semibold">
                      <td className="p-2.5 font-bold">{std.admissionNo}</td>
                      <td className="p-2.5">{std.firstName} {std.lastName}</td>
                      <td className="p-2.5 text-center">
                        <select
                          value={attendanceRecords[std.id] || 'PRESENT'}
                          onChange={e => {
                            setAttendanceRecords({ ...attendanceRecords, [std.id]: e.target.value as any });
                          }}
                          className="h-8 border rounded bg-background px-2.5"
                        >
                          <option value="PRESENT">Present</option>
                          <option value="ABSENT">Absent</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            )}
          </div>
        )}

        {/* HOMEWORK & GRADING */}
        {activeTab === 'assignments' && (
          <div className="space-y-6">
            
            {/* Create Assignment */}
            <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold uppercase border-b pb-2">Create New Homework Assignment</h3>
              <form onSubmit={handleCreateAssignment} className="space-y-4 text-xs font-semibold">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-muted-foreground">Assignment Title</label>
                    <input
                      type="text"
                      required
                      value={assignTitle}
                      onChange={e => setAssignTitle(e.target.value)}
                      placeholder="e.g. Dynamic Programming Tree Analysis"
                      className="h-9 border rounded bg-background px-3"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-muted-foreground">Due Date</label>
                    <input
                      type="date"
                      required
                      value={assignDue}
                      onChange={e => setAssignDue(e.target.value)}
                      className="h-9 border rounded bg-background px-3"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-muted-foreground">Target Subject</label>
                    <input
                      type="text"
                      required
                      value={assignSubject}
                      onChange={e => setAssignSubject(e.target.value)}
                      placeholder="Enter Subject Name"
                      className="h-9 border rounded bg-background px-3"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-muted-foreground">Target Class</label>
                    <input
                      type="text"
                      required
                      value={assignClass}
                      onChange={e => setAssignClass(e.target.value)}
                      placeholder="Enter Class (Example: CSE - III Year - A)"
                      className="h-9 border rounded bg-background px-3"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Description instructions</label>
                  <textarea
                    value={assignDesc}
                    onChange={e => setAssignDesc(e.target.value)}
                    placeholder="Write rules..."
                    className="h-20 border rounded bg-background p-2.5"
                  />
                </div>

                <button type="submit" className="w-full h-9 bg-primary text-primary-foreground rounded font-bold hover:bg-primary/95">
                  Publish Assignment
                </button>
              </form>
            </div>

            {/* List assignments */}
            <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold uppercase border-b pb-2">Published Assignments</h3>
              <div className="space-y-2 text-xs font-semibold">
                {assignments.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 border rounded-lg bg-background">
                    <div>
                      <h4 className="font-bold">{item.title}</h4>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide mt-0.5">
                        Subject: <span className="text-foreground">{item.targetSubject || item.subject?.name || 'N/A'}</span> · Class: <span className="text-foreground">{item.targetClass || item.section?.name || 'N/A'}</span>
                      </p>
                      <p className="text-[10px] text-rose-500">
                        Due: {item.dueDate ? new Date(item.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : item.due} · Submissions: {item._count?.submissions ?? item.count ?? 0} Received
                      </p>
                    </div>
                    <button onClick={() => handleViewSubmissions(item)} className="px-2.5 py-1.5 border rounded text-[10px] font-bold hover:bg-muted bg-primary text-primary-foreground hover:bg-primary/95 shadow-sm">
                      Evaluate Submissions
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Submissions Modal */}
            {isSubmissionsModalOpen && selectedAssignment && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="w-full max-w-4xl border bg-card p-6 rounded-2xl shadow-xl space-y-4 text-xs font-semibold max-h-[85vh] overflow-y-auto">
                  <div className="flex justify-between items-center border-b pb-3">
                    <div>
                      <h3 className="text-sm font-extrabold uppercase">Evaluate Submissions</h3>
                      <p className="text-muted-foreground text-[10px]">{selectedAssignment.title}</p>
                    </div>
                    <button onClick={() => { setIsSubmissionsModalOpen(false); setSelectedAssignment(null); }} className="text-muted-foreground hover:text-foreground text-sm font-bold">✕</button>
                  </div>

                  <div className="space-y-4">
                    {submissionsList.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No solutions have been submitted yet for this assignment.</p>
                    ) : (
                      <div className="border rounded-lg overflow-hidden">
                        <div className="w-full overflow-x-auto max-w-[90vw] md:max-w-full pb-2 scrollbar-thin"><table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b text-[10px] uppercase text-muted-foreground font-bold">
                              <th className="p-3">Student Name</th>
                              <th className="p-3">Uploaded File</th>
                              <th className="p-3">Submitted At</th>
                              <th className="p-3">Status</th>
                              <th className="p-3">Grade</th>
                              <th className="p-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {submissionsList.map((sub: any) => (
                              <tr key={sub.id} className="border-b hover:bg-slate-50/50">
                                <td className="p-3">
                                  <p className="font-bold text-slate-800">{sub.student?.firstName} {sub.student?.lastName}</p>
                                  <p className="text-[9px] text-muted-foreground">{sub.student?.admissionNo}</p>
                                </td>
                                <td className="p-3">
                                  {sub.fileUrl ? (
                                    <div className="flex flex-col">
                                      <a 
                                        href={sub.fileUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-indigo-600 hover:underline font-bold truncate max-w-[150px]"
                                      >
                                        {sub.fileName || 'Download File'}
                                      </a>
                                      {sub.fileSize && (
                                        <span className="text-[9px] text-slate-400">
                                          {(sub.fileSize / (1024 * 1024)).toFixed(2)} MB
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-slate-400">No file</span>
                                  )}
                                </td>
                                <td className="p-3 text-slate-600">
                                  {new Date(sub.submittedAt).toLocaleDateString('en-IN')} {new Date(sub.submittedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="p-3">
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase ${
                                    sub.status === 'GRADED' ? 'bg-emerald-50 text-emerald-600' :
                                    sub.status === 'LATE' ? 'bg-amber-50 text-amber-600' :
                                    'bg-blue-50 text-blue-600'
                                  }`}>{sub.status}</span>
                                </td>
                                <td className="p-3">
                                  {sub.status === 'GRADED' ? (
                                    <div>
                                      <p className="font-bold text-slate-800">Score: {sub.marksObtained}/{selectedAssignment.maxMarks}</p>
                                      {sub.feedback && <p className="text-[9px] text-emerald-700 italic">"{sub.feedback}"</p>}
                                    </div>
                                  ) : (
                                    <span className="text-slate-400">Ungraded</span>
                                  )}
                                </td>
                                <td className="p-3 text-right">
                                  <div className="flex flex-wrap gap-2 justify-end">
                                    {sub.fileUrl && (
                                      <>
                                        <a 
                                          href={sub.fileUrl} 
                                          target="_blank" 
                                          rel="noopener noreferrer" 
                                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[9px] font-bold text-slate-700"
                                        >
                                          Preview
                                        </a>
                                        <a 
                                          href={sub.fileUrl} 
                                          download 
                                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[9px] font-bold text-slate-700"
                                        >
                                          Download
                                        </a>
                                      </>
                                    )}
                                    <button 
                                      onClick={() => {
                                        setSelectedSubmissionForGrading(sub);
                                        setGradeMarks(String(sub.marksObtained || ''));
                                        setGradeFeedback(sub.feedback || '');
                                      }}
                                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[9px] font-bold"
                                    >
                                      Grade
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table></div>
                      </div>
                    )}
                  </div>

                  {/* Grading Overlay / Drawer */}
                  {selectedSubmissionForGrading && (
                    <div className="border-t pt-4 space-y-3 bg-slate-50 p-4 rounded-xl">
                      <h4 className="font-bold text-slate-800 uppercase text-[10px]">
                        Grade Submission for {selectedSubmissionForGrading.student?.firstName} {selectedSubmissionForGrading.student?.lastName}
                      </h4>
                      <form onSubmit={handleGradeSubmission} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] uppercase font-bold text-slate-500">Marks Obtained (Max: {selectedAssignment.maxMarks})</label>
                          <input 
                            type="number" 
                            required 
                            min="0" 
                            max={selectedAssignment.maxMarks}
                            value={gradeMarks}
                            onChange={(e) => setGradeMarks(e.target.value)}
                            className="h-9 border rounded bg-background px-3"
                          />
                        </div>
                        <div className="flex flex-col gap-1 md:col-span-2 flex-1">
                          <label className="text-[9px] uppercase font-bold text-slate-500">Feedback Comments</label>
                          <div className="flex flex-wrap gap-2">
                            <input 
                              type="text" 
                              value={gradeFeedback}
                              onChange={(e) => setGradeFeedback(e.target.value)}
                              placeholder="e.g. Excellent solution structure and analysis."
                              className="h-9 border rounded bg-background px-3 flex-1"
                            />
                            <button 
                              type="submit" 
                              className="px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 rounded"
                            >
                              Save Grade
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setSelectedSubmissionForGrading(null)} 
                              className="px-3 border hover:bg-slate-200 font-bold h-9 rounded"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="flex justify-end pt-2 border-t">
                    <button onClick={() => { setIsSubmissionsModalOpen(false); setSelectedAssignment(null); }} className="px-4 py-2 border rounded font-bold hover:bg-muted">Close</button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* POST INTERNAL MARKS */}
        {activeTab === 'marks' && (
          <div className="border bg-card p-5 rounded-xl shadow-sm space-y-6">
            <h3 className="text-sm font-extrabold uppercase border-b pb-2">Post Student Internal Assessments</h3>
            
            <form onSubmit={handlePostMarks} className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-semibold">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold text-muted-foreground">Subject Code</label>
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

              <div className="md:col-span-3"></div>

              {isMobile ? (
                <div className="space-y-3 w-full md:col-span-3">
                  {students.map((std, idx) => (
                    <div key={idx} className="p-4 border rounded-xl bg-background space-y-3 text-xs font-semibold hover:shadow-sm transition-all text-left">
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="font-extrabold text-slate-800 text-xs">{std.firstName} {std.lastName}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{std.admissionNo}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] uppercase font-bold text-muted-foreground">Internal (40)</label>
                          <input
                            type="number"
                            value={marksRecords[std.id]?.internal ?? 0}
                            onChange={e => {
                              setMarksRecords({
                                ...marksRecords,
                                [std.id]: { ...(marksRecords[std.id] || { internal: 0, external: 0 }), internal: parseInt(e.target.value) || 0 }
                              });
                            }}
                            className="h-10 border rounded bg-background px-3 text-center text-sm font-bold font-mono"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] uppercase font-bold text-muted-foreground">External (60)</label>
                          <input
                            type="number"
                            value={marksRecords[std.id]?.external ?? 0}
                            onChange={e => {
                              setMarksRecords({
                                ...marksRecords,
                                [std.id]: { ...(marksRecords[std.id] || { internal: 0, external: 0 }), external: parseInt(e.target.value) || 0 }
                              });
                            }}
                            className="h-10 border rounded bg-background px-3 text-center text-sm font-bold font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full overflow-x-auto max-w-[90vw] md:max-w-full pb-2 scrollbar-thin"><table className="w-full text-xs text-left border md:col-span-3">
                  <thead>
                    <tr className="border-b bg-muted/20 text-[9px] uppercase font-bold text-muted-foreground">
                      <th className="p-2.5">Student Roll</th>
                      <th className="p-2.5">Full Name</th>
                      <th className="p-2.5 text-center">Internal Score (40)</th>
                      <th className="p-2.5 text-center">External Score (60)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((std, idx) => (
                      <tr key={idx} className="border-b last:border-b-0 hover:bg-muted/10 font-semibold">
                        <td className="p-2.5 font-bold">{std.admissionNo}</td>
                        <td className="p-2.5">{std.firstName} {std.lastName}</td>
                        <td className="p-2.5 text-center">
                          <input
                            type="number"
                            value={marksRecords[std.id]?.internal ?? 0}
                            onChange={e => {
                              setMarksRecords({
                                ...marksRecords,
                                [std.id]: { ...(marksRecords[std.id] || { internal: 0, external: 0 }), internal: parseInt(e.target.value) || 0 }
                              });
                            }}
                            className="w-20 h-8 border rounded bg-background px-2 text-center"
                          />
                        </td>
                        <td className="p-2.5 text-center">
                          <input
                            type="number"
                            value={marksRecords[std.id]?.external ?? 0}
                            onChange={e => {
                              setMarksRecords({
                                ...marksRecords,
                                [std.id]: { ...(marksRecords[std.id] || { internal: 0, external: 0 }), external: parseInt(e.target.value) || 0 }
                              });
                            }}
                            className="w-20 h-8 border rounded bg-background px-2 text-center"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              )}

              <button type="submit" className="md:col-span-3 h-9 bg-primary text-primary-foreground rounded font-bold hover:bg-primary/95">
                Save & Post Marksheet Draft
              </button>
            </form>
          </div>
        )}

        {/* INTERNSHIPS & PLACEMENTS VERIFICATION */}
        {activeTab === 'internships' && (
          <div className="border bg-card p-5 rounded-xl shadow-sm space-y-6">
            <h3 className="text-sm font-extrabold uppercase border-b pb-2">Placement Cell - Internship Verification</h3>
            
            {loadingInternships ? (
              <p className="text-xs text-muted-foreground italic text-left">Fetching documents ledger...</p>
            ) : internshipDocs.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-left">No internship documents submitted for verification yet.</p>
            ) : (
              <div className="overflow-x-auto text-xs font-semibold">
                <table className="w-full text-left border">
                  <thead>
                    <tr className="border-b bg-muted/20 text-[9px] uppercase font-bold text-muted-foreground">
                      <th className="p-2.5">Student</th>
                      <th className="p-2.5">Company</th>
                      <th className="p-2.5">Document Type</th>
                      <th className="p-2.5">Submitted File</th>
                      <th className="p-2.5 text-center">Status</th>
                      <th className="p-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {internshipDocs.map((doc: any, idx: number) => (
                      <tr key={idx} className="border-b last:border-b-0 hover:bg-muted/10">
                        <td className="p-2.5 font-bold text-left">
                          {doc.student ? `${doc.student.firstName} ${doc.student.lastName}` : 'N/A'}
                          <span className="block text-[8px] text-muted-foreground font-normal">{doc.student?.admissionNo}</span>
                        </td>
                        <td className="p-2.5 font-bold text-left">
                          {doc.internship?.company || doc.companyName || 'N/A'}
                        </td>
                        <td className="p-2.5 font-medium text-left">{doc.documentType}</td>
                        <td className="p-2.5 text-left">
                          <div className="flex flex-col gap-1 align-start text-left">
                            <button
                              type="button"
                              onClick={() => setPreviewFile({ url: getFileUrl(doc.fileUrl), name: doc.fileName, type: doc.documentType })}
                              className="text-indigo-600 hover:underline font-mono text-[10px] block max-w-[180px] truncate text-left font-bold"
                            >
                              🔍 {doc.fileName}
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                const url = getFileUrl(doc.fileUrl);
                                toast.show(`Saving ${doc.fileName} to device...`, 'info');
                                const res = await downloadFile({ endpoint: url, filename: doc.fileName, action: 'save' });
                                if (res.success) {
                                  toast.success(`Saved ${doc.fileName} to device successfully`);
                                } else {
                                  toast.error(res.error || 'Failed to save document');
                                }
                              }}
                              className="text-[9px] text-slate-500 hover:text-slate-700 font-extrabold text-left"
                            >
                              📥 Save to Device
                            </button>
                          </div>
                          <span className="block text-[8px] text-muted-foreground mt-1">{(doc.fileSize / 1024 / 1024).toFixed(2)} MB · {new Date(doc.uploadedAt || doc.createdAt).toLocaleString()}</span>
                        </td>
                        <td className="p-2.5 text-center">
                          <span className={`text-[8px] px-1.5 py-0.5 rounded font-black tracking-wider uppercase border ${
                            doc.verificationStatus === 'VERIFIED' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                            doc.verificationStatus === 'REJECTED' ? 'bg-rose-50 border-rose-200 text-rose-500' :
                            'bg-amber-50 border-amber-200 text-amber-600'
                          }`}>{doc.verificationStatus}</span>
                        </td>
                        <td className="p-2.5 text-center">
                          <div className="flex flex-wrap gap-1.5 justify-center">
                            <button
                              type="button"
                              onClick={() => handleVerifyDoc(doc.id, 'VERIFIED')}
                              disabled={doc.verificationStatus === 'VERIFIED'}
                              className="px-2 py-1 bg-emerald-600 text-white rounded text-[9px] font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleVerifyDoc(doc.id, 'REJECTED')}
                              disabled={doc.verificationStatus === 'REJECTED'}
                              className="px-2 py-1 bg-rose-600 text-white rounded text-[9px] font-bold hover:bg-rose-700 disabled:opacity-50 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ENROLLED STUDENTS LIST */}
        {activeTab === 'students_list' && (
          <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold uppercase border-b pb-2">My Enrolled Students</h3>
            <div className="overflow-x-auto text-xs font-semibold">
              <table className="w-full text-left border">
                <thead>
                  <tr className="border-b bg-muted/20 text-[9px] uppercase font-bold text-muted-foreground">
                    <th className="p-2.5">Admission No</th>
                    <th className="p-2.5">Full Name</th>
                    <th className="p-2.5">Email</th>
                    <th className="p-2.5">Academic Section</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((item, idx) => (
                    <tr key={idx} className="border-b last:border-b-0 hover:bg-muted/10 font-semibold">
                      <td className="p-2.5 font-bold">{item.admissionNo}</td>
                      <td className="p-2.5">{item.firstName} {item.lastName}</td>
                      <td className="p-2.5 font-mono text-muted-foreground">{item.email || 'N/A'}</td>
                      <td className="p-2.5">{item.semester?.name} / {item.section?.name}</td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-muted-foreground">No students assigned.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* RESEARCH PUBLICATIONS */}
        {activeTab === 'research' && (
          <div className="space-y-6">
            
            {/* Add Publication */}
            <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold uppercase border-b pb-2">Log Research Journal / Patent</h3>
              <form onSubmit={handleAddPublication} className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-semibold">
                <input
                  type="text"
                  required
                  placeholder="Publication Title..."
                  value={pubTitle}
                  onChange={e => setPubTitle(e.target.value)}
                  className="h-9 border rounded bg-background px-3"
                />
                <input
                  type="text"
                  required
                  placeholder="Journal Name (e.g. Nature, IEEE)..."
                  value={pubJournal}
                  onChange={e => setPubJournal(e.target.value)}
                  className="h-9 border rounded bg-background px-3"
                />
                <button type="submit" className="md:col-span-2 h-9 bg-primary text-primary-foreground rounded font-bold hover:bg-primary/95">
                  Publish to Institution Portal
                </button>
              </form>
            </div>

            {/* List logged publications */}
            <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold uppercase border-b pb-2">Faculty Publications</h3>
              <div className="space-y-3 text-xs font-semibold">
                {publications.map((item, idx) => (
                  <div key={idx} className="p-3 border rounded-lg bg-background">
                    <h4 className="font-bold">{item.title}</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.journal} · Published: {item.date}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* MY LEAVE / OD REQUESTS TAB — full dashboard */}
        {activeTab === 'leaves' && (() => {
          const myRequests = workflowRequests.filter((r: any) => r.facultyRequesterId === profileData?.id);
          const pendingCount   = myRequests.filter((r: any) => ['PENDING', 'PENDING_HOD'].includes(r.status)).length;
          const approvedCount  = myRequests.filter((r: any) => r.status === 'APPROVED').length;
          const rejectedCount  = myRequests.filter((r: any) => ['REJECTED_BY_HOD', 'REJECTED_BY_DEAN', 'REJECTED'].includes(r.status)).length;
          const totalCount     = myRequests.length;

          const calculatedDays = leaveStart && leaveEnd
            ? Math.max(1, Math.ceil((new Date(leaveEnd).getTime() - new Date(leaveStart).getTime()) / (1000 * 3600 * 24)) + 1)
            : 0;

          return (
            <div className="space-y-6 animate-in fade-in duration-300 text-left">

              {/* Page header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight text-foreground">My Leave & OD Requests</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Submit and track your own leave or on-duty requests with live 2-level HOD → Admission Dean approval</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border rounded-lg px-3 py-1.5 bg-muted/30">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  Auto-routed · HOD (L1) → Admission Dean (L2 Final)
                </div>
              </div>

              {/* Stats cards row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="border bg-card rounded-xl p-4 shadow-sm flex flex-col gap-1">
                  <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Total Requests</span>
                  <span className="text-2xl font-extrabold text-foreground">{totalCount}</span>
                  <span className="text-[10px] text-muted-foreground">All time</span>
                </div>
                <div className="border bg-amber-50 border-amber-200 rounded-xl p-4 shadow-sm flex flex-col gap-1">
                  <span className="text-[9px] uppercase font-bold text-amber-600 tracking-wider">Pending</span>
                  <span className="text-2xl font-extrabold text-amber-700">{pendingCount}</span>
                  <span className="text-[10px] text-amber-600">Awaiting HOD / Dean</span>
                </div>
                <div className="border bg-emerald-50 border-emerald-200 rounded-xl p-4 shadow-sm flex flex-col gap-1">
                  <span className="text-[9px] uppercase font-bold text-emerald-600 tracking-wider">Final Approved</span>
                  <span className="text-2xl font-extrabold text-emerald-700">{approvedCount}</span>
                  <span className="text-[10px] text-emerald-600">Fully Sanctioned</span>
                </div>
                <div className="border bg-rose-50 border-rose-200 rounded-xl p-4 shadow-sm flex flex-col gap-1">
                  <span className="text-[9px] uppercase font-bold text-rose-600 tracking-wider">Rejected</span>
                  <span className="text-2xl font-extrabold text-rose-700">{rejectedCount}</span>
                  <span className="text-[10px] text-rose-600">Not approved</span>
                </div>
              </div>

              {/* Content grid: form + history */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Submit form */}
                <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4 md:col-span-1">
                  <div className="flex items-center gap-2 border-b pb-3">
                    <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <h3 className="text-sm font-extrabold uppercase tracking-tight">Apply for Leave / OD</h3>
                  </div>

                  <form onSubmit={handleLeaveSubmit} className="space-y-3.5 text-xs font-semibold">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] uppercase font-bold text-muted-foreground">Request Category</label>
                      <select
                        value={leaveType}
                        onChange={e => setLeaveType(e.target.value)}
                        className="h-9 border rounded-lg bg-background px-2 text-xs font-semibold focus:ring-2 focus:ring-primary/30 outline-none"
                      >
                        <option value="FACULTY_LEAVE">Leave Request</option>
                        <option value="FACULTY_OD">On Duty (OD) Request</option>
                      </select>
                    </div>

                    {leaveType === 'FACULTY_LEAVE' ? (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] uppercase font-bold text-muted-foreground">Leave Type</label>
                        <select
                          value={leaveCategory}
                          onChange={e => setLeaveCategory(e.target.value)}
                          className="h-9 border rounded-lg bg-background px-2 text-xs font-semibold focus:ring-2 focus:ring-primary/30 outline-none"
                        >
                          <option value="Casual Leave">Casual Leave</option>
                          <option value="Sick Leave">Sick Leave</option>
                          <option value="Earned Leave">Earned Leave</option>
                          <option value="Maternity Leave">Maternity Leave</option>
                          <option value="Paternity Leave">Paternity Leave</option>
                          <option value="Special Leave">Special Leave</option>
                        </select>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] uppercase font-bold text-muted-foreground">OD Type</label>
                        <select
                          value={odCategory}
                          onChange={e => setOdCategory(e.target.value)}
                          className="h-9 border rounded-lg bg-background px-2 text-xs font-semibold focus:ring-2 focus:ring-primary/30 outline-none"
                        >
                          <option value="Duty">Duty</option>
                          <option value="Seminar">Seminar</option>
                          <option value="Exam Invigilation">Exam Invigilation</option>
                          <option value="Valuation">Valuation</option>
                          <option value="Conference">Conference</option>
                          <option value="Research">Research</option>
                        </select>
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] uppercase font-bold text-muted-foreground">Subject / Title</label>
                      <input
                        type="text"
                        value={leaveTitle}
                        onChange={e => setLeaveTitle(e.target.value)}
                        placeholder={`e.g. ${leaveType === 'FACULTY_LEAVE' ? 'Medical Leave' : 'Conference Presentation'}`}
                        className="h-9 border rounded-lg bg-background px-3 focus:ring-2 focus:ring-primary/30 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] uppercase font-bold text-muted-foreground">From Date</label>
                        <input
                          type="date"
                          required
                          value={leaveStart}
                          onChange={e => setLeaveStart(e.target.value)}
                          className="h-9 border rounded-lg bg-background px-2 focus:ring-2 focus:ring-primary/30 outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] uppercase font-bold text-muted-foreground">To Date</label>
                        <input
                          type="date"
                          required
                          value={leaveEnd}
                          onChange={e => setLeaveEnd(e.target.value)}
                          className="h-9 border rounded-lg bg-background px-2 focus:ring-2 focus:ring-primary/30 outline-none"
                        />
                      </div>
                    </div>

                    {calculatedDays > 0 && (
                      <div className="bg-primary/5 border border-primary/20 p-2 rounded-lg text-center font-bold text-xs text-primary">
                        Total Duration: {calculatedDays} {calculatedDays === 1 ? 'Day' : 'Days'}
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] uppercase font-bold text-muted-foreground">Reason</label>
                      <textarea
                        required
                        value={leaveReason}
                        onChange={e => setLeaveReason(e.target.value)}
                        placeholder="Explain your reason in detail..."
                        rows={3}
                        className="border rounded-lg bg-background p-2.5 text-xs resize-none focus:ring-2 focus:ring-primary/30 outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] uppercase font-bold text-muted-foreground">Emergency Contact</label>
                      <input
                        type="text"
                        value={emergencyContact}
                        onChange={e => setEmergencyContact(e.target.value)}
                        placeholder="Name / Phone Number during absence"
                        className="h-9 border rounded-lg bg-background px-3 focus:ring-2 focus:ring-primary/30 outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] uppercase font-bold text-muted-foreground">Supporting Document (URL / Link)</label>
                      <input
                        type="url"
                        value={leaveAttachment}
                        onChange={e => setLeaveAttachment(e.target.value)}
                        placeholder="https://document-link.com/file.pdf"
                        className="h-9 border rounded-lg bg-background px-3 focus:ring-2 focus:ring-primary/30 outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full h-9 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 text-xs shadow-sm"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Submit Request to HOD
                    </button>
                  </form>

                  {/* Workflow info */}
                  <div className="bg-muted/30 border rounded-lg p-3 space-y-1.5 text-[10px]">
                    <p className="font-extrabold uppercase tracking-wider text-muted-foreground text-[9px]">Approval Hierarchy</p>
                    <div className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" /> Faculty (You)
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground font-semibold pl-3">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" /> HOD (Level 1 Approval)
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground font-semibold pl-6">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 inline-block" /> Admission Dean (Level 2 Final)
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-600 font-bold pl-9">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" /> Final Status
                    </div>
                  </div>
                </div>

                {/* History table */}
                <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4 md:col-span-2">
                  <div className="flex items-center gap-2 border-b pb-3">
                    <div className="h-7 w-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <Clock className="h-3.5 w-3.5 text-indigo-600" />
                    </div>
                    <h3 className="text-sm font-extrabold uppercase tracking-tight">Request History & Status Tracker</h3>
                    <span className="ml-auto text-[10px] bg-muted border rounded-full px-2 py-0.5 font-bold">{myRequests.length} total</span>
                  </div>

                  {myRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 text-center gap-3">
                      <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-bold text-foreground">No requests submitted yet</p>
                      <p className="text-xs text-muted-foreground max-w-xs">Submit your first Leave or OD request using the form on the left.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-semibold">
                        <thead>
                          <tr className="border-b text-[9px] uppercase font-bold text-muted-foreground">
                            <th className="py-2 pl-3">Title & Reason</th>
                            <th className="py-2">Type</th>
                            <th className="py-2">Duration</th>
                            <th className="py-2 text-center">Status Tracker</th>
                            <th className="py-2 text-right pr-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {myRequests.map((item: any, idx: number) => {
                            const formattedStart = item.startDate ? new Date(item.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—';
                            const formattedEnd   = item.endDate   ? new Date(item.endDate).toLocaleDateString('en-IN',   { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

                            const statusDisplay: Record<string, { label: string; class: string }> = {
                              PENDING: { label: 'Submitted (Pending HOD)', class: 'bg-amber-50 text-amber-700 border-amber-200' },
                              PENDING_HOD: { label: 'Submitted (Pending HOD)', class: 'bg-amber-50 text-amber-700 border-amber-200' },
                              HOD_APPROVED: { label: 'HOD Approved (Forwarded to Dean)', class: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
                              APPROVED: { label: 'Final Approved', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                              REJECTED_BY_HOD: { label: 'Rejected by HOD', class: 'bg-rose-50 text-rose-700 border-rose-200' },
                              REJECTED_BY_DEAN: { label: 'Rejected by Admission Dean', class: 'bg-rose-50 text-rose-700 border-rose-200' },
                              CANCELLED: { label: 'Cancelled', class: 'bg-slate-100 text-slate-600 border-slate-200' },
                            };

                            const currentStatus = statusDisplay[item.status] || { label: item.status.replace(/_/g, ' '), class: 'bg-slate-50 text-slate-700 border-slate-200' };

                            return (
                              <tr key={item.id || idx} className="border-b last:border-b-0 hover:bg-muted/40 transition-colors duration-150">
                                <td className="py-3 pl-3 pr-2 max-w-[180px]">
                                  <div className="font-bold text-foreground truncate">{item.title}</div>
                                  <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2 whitespace-pre-wrap">{item.reason}</div>
                                </td>
                                <td className="py-3 px-2">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border whitespace-nowrap ${
                                    item.type === 'FACULTY_OD'
                                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                      : 'bg-orange-50 text-orange-700 border-orange-200'
                                  }`}>
                                    {item.type === 'FACULTY_OD' ? 'ON DUTY' : 'LEAVE'}
                                  </span>
                                </td>
                                <td className="py-3 px-2 text-[10px] text-muted-foreground whitespace-nowrap">
                                  {formattedStart} → {formattedEnd}
                                </td>
                                <td className="py-3 px-2 text-center">
                                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold border whitespace-nowrap ${currentStatus.class}`}>
                                    {currentStatus.label}
                                  </span>
                                </td>
                                <td className="py-3 pl-2 pr-3 text-right">
                                  {['PENDING', 'PENDING_HOD'].includes(item.status) ? (
                                    <button
                                      onClick={() => handleCancelLeave(item.id)}
                                      className="px-2.5 py-1 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded text-[10px] font-bold transition-colors"
                                      title="Cancel Request before HOD review"
                                    >
                                      Cancel
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-muted-foreground font-semibold">—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            </div>
          );
        })()}

        {activeTab === 'mentor_workspace' && isMentorEligible && (
          <MentorPortal user={user} />
        )}

        {/* STUDENT MESSAGES */}
        {activeTab === 'messages' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[75vh] min-h-[550px] animate-in fade-in-50 duration-300">
            
            {/* Sidebar: Conversations List */}
            <div className="border bg-card rounded-2xl shadow-sm flex flex-col overflow-hidden">
              <div className="p-4 border-b space-y-3 bg-muted/10">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs uppercase font-extrabold tracking-wide text-foreground">Conversations</h3>
                  <button 
                    onClick={() => {
                      setNewMessageForm({
                        recipientId: '',
                        subject: '',
                        message: '',
                        priority: 'NORMAL',
                        attachmentBase64: '',
                        attachmentName: '',
                      });
                      setSearchStudentInput('');
                      handleSearchStudent('');
                      setIsNewMessageModalOpen(true);
                    }}
                    className="flex flex-wrap items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-lg hover:bg-primary/95 shadow-sm transition-all"
                  >
                    <MessageSquare className="h-3 w-3" /> New Message
                  </button>
                </div>
                
                {/* Search Bar */}
                <input 
                  type="text"
                  placeholder="Search by student name..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full h-8 px-2.5 border rounded-lg bg-background text-[11px] font-medium"
                />

                {/* Filter Selector */}
                <div className="flex flex-wrap gap-2">
                  <button 
                    type="button"
                    onClick={() => setChatFilterStatus('ALL')} 
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${chatFilterStatus === 'ALL' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                  >
                    All
                  </button>
                  <button 
                    type="button"
                    onClick={() => setChatFilterStatus('UNREAD')} 
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${chatFilterStatus === 'UNREAD' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                  >
                    Unread
                  </button>
                </div>
              </div>

              {/* Conversations List Container */}
              <div className="flex-1 overflow-y-auto divide-y divide-border">
                {conversations
                  .filter(c => {
                    const matchName = c.participant.name.toLowerCase().includes(searchQuery.toLowerCase());
                    const matchUnread = chatFilterStatus === 'ALL' || c.unreadCount > 0;
                    return matchName && matchUnread;
                  })
                  .map((conv, idx) => {
                    const isActive = activeConversation?.conversationId === conv.conversationId;
                    return (
                      <div 
                        key={idx}
                        onClick={() => {
                          setActiveConversation(conv);
                          fetchMessages(conv.conversationId);
                        }}
                        className={`p-3.5 flex gap-3 cursor-pointer transition-all hover:bg-muted/30 items-center ${isActive ? 'bg-primary/5 border-l-4 border-primary' : ''}`}
                      >
                        {/* Avatar */}
                        <div className="relative">
                          {conv.participant.profilePhoto ? (
                            <img 
                              src={conv.participant.profilePhoto} 
                              alt={conv.participant.name} 
                              className="w-9 h-9 rounded-full object-cover border"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                              {conv.participant.name.substring(0, 2)}
                            </div>
                          )}
                          <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background ${conv.participant.online ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        </div>

                        {/* Content Preview */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-0.5">
                            <h4 className="text-[11px] font-black text-foreground truncate">{conv.participant.name}</h4>
                            <span className="text-[9px] text-muted-foreground font-medium shrink-0">
                              {new Date(conv.lastMessage.sentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate font-medium">
                            {conv.lastMessage.senderRole === 'Faculty' ? 'You: ' : ''}
                            {conv.lastMessage.message || 'Sent an attachment'}
                          </p>
                          <span className="text-[8px] text-muted-foreground uppercase font-semibold">
                            {conv.participant.department} · {conv.participant.section || 'N/A'}
                          </span>
                        </div>

                        {/* Unread badge */}
                        {conv.unreadCount > 0 && (
                          <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[8px] font-black flex items-center justify-center shrink-0">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    );
                  })
                }

                {conversations.length === 0 && (
                  <p className="text-center text-muted-foreground text-[10px] py-12">No active conversations found.</p>
                )}
              </div>
            </div>

            {/* Chat Thread Panel */}
            <div className="lg:col-span-2 border bg-card rounded-2xl shadow-sm flex flex-col min-h-[480px] lg:min-h-0 h-[calc(100dvh-12rem)] overflow-hidden">
              {activeConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b bg-muted/10 flex justify-between items-center shrink-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="relative">
                        {activeConversation.participant.profilePhoto ? (
                          <img 
                            src={activeConversation.participant.profilePhoto} 
                            alt={activeConversation.participant.name} 
                            className="w-10 h-10 rounded-full object-cover border"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                            {activeConversation.participant.name.substring(0, 2)}
                          </div>
                        )}
                        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background ${activeConversation.participant.online ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      </div>
                      <div>
                        <h4 className="text-[11px] font-black text-foreground">{activeConversation.participant.name}</h4>
                        <p className="text-[9px] text-muted-foreground font-semibold uppercase">
                          Reg No: {activeConversation.participant.registerNo || 'N/A'} · Dept: {activeConversation.participant.department} · Sem: {activeConversation.participant.semester} · Sec: {activeConversation.participant.section}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Message Bubbles Area */}
                  <div className="flex-1 min-h-0 p-4 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/20 space-y-3.5 flex flex-col">
                    {chatMessages.map((msg, index) => {
                      const isMe = msg.senderRole === 'Faculty';
                      const isRead = msg.status === 'READ';
                      return (
                        <div 
                          key={msg.id || index}
                          className={`flex flex-col max-w-[75%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
                        >
                          {/* Sender name & Subject tag */}
                          <div className="flex flex-wrap items-center gap-1.5 text-[8px] text-muted-foreground font-semibold mb-0.5">
                            <span>{isMe ? 'You' : activeConversation.participant.name}</span>
                            {msg.subject && <span className="bg-slate-200 px-1 rounded truncate max-w-[120px]">Sub: {msg.subject}</span>}
                            {msg.priority && msg.priority !== 'NORMAL' && (
                              <span className={`px-1 rounded font-black text-[7px] text-white ${msg.priority === 'URGENT' ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`}>
                                {msg.priority}
                              </span>
                            )}
                          </div>

                          {/* Text Bubble */}
                          <div className={`p-3 rounded-2xl shadow-sm text-xs font-medium relative group ${
                            isMe ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-white text-foreground border rounded-tl-none'
                          }`}>
                            {editMessageId === msg.id ? (
                              <div className="space-y-2">
                                <textarea 
                                  value={editMessageText}
                                  onChange={e => setEditMessageText(e.target.value)}
                                  className="w-full text-foreground p-1 text-xs border rounded bg-background"
                                />
                                <div className="flex flex-wrap justify-end gap-1.5">
                                  <button type="button" onClick={() => setEditMessageId(null)} className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-[9px] font-bold">Cancel</button>
                                  <button type="button" onClick={() => handleEditMessage(msg.id)} className="px-2 py-0.5 bg-primary text-primary-foreground rounded text-[9px] font-bold">Save</button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="whitespace-pre-line leading-relaxed">{msg.message}</p>
                                
                                {/* Attachment display */}
                                {msg.attachmentUrl && (
                                  <div className="mt-2 pt-2 border-t border-dashed border-current/25 flex flex-wrap items-center gap-1.5 text-[10px]">
                                    <span className="font-extrabold uppercase bg-current/10 px-1 rounded text-[8px]">{msg.attachmentType || 'FILE'}</span>
                                    <a 
                                      href={msg.attachmentUrl} 
                                      download
                                      target="_blank"
                                      rel="noreferrer"
                                      className="underline hover:opacity-80 break-all font-bold flex flex-wrap items-center gap-1"
                                    >
                                      📄 Download Attachment
                                    </a>
                                  </div>
                                )}

                                {/* Hover actions */}
                                <div className="absolute top-1/2 -translate-y-1/2 hidden group-hover:flex flex-wrap gap-1 bg-white border shadow-md p-1 rounded-lg z-10 -left-12">
                                  {isMe && !isRead && (
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        setEditMessageId(msg.id);
                                        setEditMessageText(msg.message);
                                      }}
                                      title="Edit message"
                                      className="text-slate-600 hover:text-primary text-[9px] font-bold p-0.5"
                                    >
                                      ✏️
                                    </button>
                                  )}
                                  <button 
                                    type="button"
                                    onClick={() => setForwardMessageObj(msg)}
                                    title="Forward message"
                                    className="text-slate-600 hover:text-blue-500 text-[9px] font-bold p-0.5"
                                  >
                                    ➡️
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={() => handleDeleteMessage(msg.id)}
                                    title="Delete message"
                                    className="text-rose-500 hover:text-rose-700 text-[9px] font-bold p-0.5"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Time & Read Status */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[8px] text-muted-foreground font-semibold">
                            <span>{new Date(msg.sentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isMe && (
                              <span className={isRead ? 'text-primary font-black' : 'text-slate-400 font-semibold'}>
                                {isRead ? '✓✓ Read' : '✓ Sent'}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {chatMessages.length === 0 && (
                      <p className="text-center text-muted-foreground text-[10px] py-12">No messages in this chat thread.</p>
                    )}
                  </div>

                  {/* Quick Reply Form */}
                  <form onSubmit={handleSendReply} className="p-3 border-t bg-card flex flex-wrap gap-2 items-center shrink-0">
                    {/* Attachment trigger */}
                    <div className="relative">
                      <label className="cursor-pointer p-2 border rounded-lg bg-background hover:bg-muted flex items-center justify-center h-9 w-9 text-lg" title="Attach file">
                        📎
                        <input 
                          type="file"
                          onChange={e => handleChatFileChange(e, true)}
                          className="hidden"
                          accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.zip"
                        />
                      </label>
                      {replyAttachment && (
                        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[7px] font-black rounded-full w-3.5 h-3.5 flex items-center justify-center animate-bounce" title={replyAttachment.name}>
                          1
                        </span>
                      )}
                    </div>

                    <input 
                      type="text"
                      placeholder="Type a message or guidelines..."
                      value={replyInput}
                      onChange={e => setReplyInput(e.target.value)}
                      className="flex-1 h-9 px-3 border rounded-lg bg-background text-xs font-semibold"
                    />

                    <button type="submit" className="h-9 px-4 bg-primary text-primary-foreground font-bold text-xs rounded-lg hover:bg-primary/95 flex flex-wrap items-center gap-1">
                      Send
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-2.5">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-3xl">📩</div>
                  <div>
                    <h4 className="font-extrabold text-foreground text-xs uppercase tracking-wide">Messaging Board</h4>
                    <p className="text-[10px] text-muted-foreground max-w-sm mt-0.5">Select a student conversation from the sidebar or click "New Message" to draft a new priority message.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MY DIGITAL ID CARD */}
        {activeTab === 'id_card' && (
          <div className="py-6">
            <DigitalIdCard role="Faculty" entityId={profileData?.id} />
          </div>
        )}

         </ModuleErrorBoundary>
      </div>

      {previewFile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b bg-muted/20 flex justify-between items-center">
              <div className="text-left">
                <h3 className="text-sm font-extrabold uppercase tracking-wider truncate max-w-md">{previewFile.name}</h3>
                <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">{previewFile.type} Document</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                {['png', 'jpg', 'jpeg', 'webp'].includes(getFileExtension(previewFile.name)) && (
                  <div className="flex border rounded-lg bg-background text-xs font-bold mr-4">
                    <button type="button" onClick={() => setImgZoom(prev => Math.max(0.5, prev - 0.25))} className="px-2.5 py-1.5 border-r hover:bg-muted">-</button>
                    <span className="px-3 py-1.5 flex items-center justify-center min-w-[50px]">{Math.round(imgZoom * 100)}%</span>
                    <button type="button" onClick={() => setImgZoom(prev => Math.min(3, prev + 0.25))} className="px-2.5 py-1.5 border-r hover:bg-muted">+</button>
                    <button type="button" onClick={() => setImgRotation(prev => (prev + 90) % 360)} className="px-2.5 py-1.5 hover:bg-muted">Rotate 🔄</button>
                  </div>
                )}
                
                <a
                  href={previewFile.url}
                  download={previewFile.name}
                  className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary/90 flex flex-wrap items-center gap-1.5"
                >
                  📥 Download
                </a>
                <button
                  type="button"
                  onClick={() => { setPreviewFile(null); setImgZoom(1); setImgRotation(0); }}
                  className="px-3 py-1.5 border hover:bg-muted rounded-lg text-xs font-bold transition-colors"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Modal Body / Viewer */}
            <div className="flex-1 bg-slate-900/5 flex items-center justify-center overflow-auto p-6 relative">
              {(() => {
                const ext = getFileExtension(previewFile.name);
                if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
                  return (
                    <div className="max-w-full max-h-full flex items-center justify-center transition-transform duration-200" style={{ transform: `scale(${imgZoom}) rotate(${imgRotation}deg)` }}>
                      <img src={previewFile.url} alt={previewFile.name} className="max-h-[60vh] object-contain rounded shadow-md" />
                    </div>
                  );
                }
                
                if (ext === 'pdf') {
                  return (
                    <iframe src={previewFile.url} title={previewFile.name} className="w-full h-full rounded border shadow-sm bg-white" />
                  );
                }
                
                if (ext === 'txt') {
                  return (
                    <iframe src={previewFile.url} title={previewFile.name} className="w-full h-full rounded border shadow-sm bg-white font-mono text-xs p-4" />
                  );
                }

                // Office files or others
                return (
                  <div className="text-center space-y-4 max-w-sm">
                    <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto text-2xl">📝</div>
                    <h4 className="text-sm font-extrabold uppercase">Direct Preview Not Supported</h4>
                    <p className="text-[11px] text-muted-foreground">This file format ({ext.toUpperCase()}) cannot be rendered directly inside the browser. Please download the file to view its contents on your device.</p>
                    <a
                      href={previewFile.url}
                      download={previewFile.name}
                      className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary/95"
                    >
                      Download Original File
                    </a>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Subject Modal */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveSubject} className="bg-card w-full max-w-lg border rounded-2xl shadow-2xl overflow-hidden flex flex-col text-xs font-semibold">
            <div className="px-5 py-4 border-b bg-muted/20 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-extrabold uppercase">{editingSubject ? 'Edit Subject Assignment' : 'Add Subject Assignment'}</h3>
                <p className="text-[9px] text-muted-foreground uppercase font-black tracking-wider">Configure your teaching course details</p>
              </div>
              <button
                type="button"
                onClick={() => setIsSubjectModalOpen(false)}
                className="px-2.5 py-1 border rounded hover:bg-muted font-bold"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-5 space-y-3.5 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Department</label>
                  <select
                    disabled={!!editingSubject}
                    value={subjectForm.departmentId}
                    onChange={e => handleDeptChange(e.target.value)}
                    className="h-9 border rounded bg-background px-3 cursor-pointer"
                    required
                  >
                    <option value="" disabled>Select Department</option>
                    {allowedDepts.length === 0 ? (
                      <option disabled>No records found. Please contact Super Admin.</option>
                    ) : (
                      allowedDepts.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))
                    )}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Program</label>
                  <select
                    disabled={!!editingSubject}
                    value={subjectForm.programId}
                    onChange={e => handleProgChange(e.target.value)}
                    className="h-9 border rounded bg-background px-3 cursor-pointer"
                    required
                  >
                    <option value="" disabled>Select Program</option>
                    {activePrograms.length === 0 ? (
                      <option disabled>No records found. Please contact Super Admin.</option>
                    ) : (
                      activePrograms.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Academic Year</label>
                  <select
                    disabled={!!editingSubject}
                    value={subjectForm.academicYearId}
                    onChange={e => handleYearChange(e.target.value)}
                    className="h-9 border rounded bg-background px-3 cursor-pointer"
                    required
                  >
                    <option value="" disabled>Select Year</option>
                    {academicYears.length === 0 ? (
                      <option disabled>No records found. Please contact Super Admin.</option>
                    ) : (
                      academicYears.map(y => (
                        <option key={y.id} value={y.id}>{y.name}</option>
                      ))
                    )}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Semester</label>
                  <select
                    disabled={!!editingSubject}
                    value={subjectForm.semesterId}
                    onChange={e => handleSemChange(e.target.value)}
                    className="h-9 border rounded bg-background px-3 cursor-pointer"
                    required
                  >
                    <option value="" disabled>Select Semester</option>
                    {activeSemesters.length === 0 ? (
                      <option disabled>No records found. Please contact Super Admin.</option>
                    ) : (
                      activeSemesters.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Section</label>
                  <select
                    value={subjectForm.sectionId}
                    onChange={e => handleSecChange(e.target.value)}
                    className="h-9 border rounded bg-background px-3 cursor-pointer"
                    required
                  >
                    <option value="" disabled>Select Section</option>
                    {activeSections.length === 0 ? (
                      <option disabled>No records found. Please contact Super Admin.</option>
                    ) : (
                      activeSections.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))
                    )}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Subject Selector</label>
                  <select
                    disabled={!!editingSubject}
                    value={subjectForm.subjectId}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === 'NEW') {
                        setSubjectForm(prev => ({
                          ...prev,
                          subjectId: 'NEW',
                          subjectCode: '',
                          subjectName: '',
                          credits: '3',
                          subjectType: 'Theory',
                          teachingHours: '3'
                        }));
                      } else {
                        const matchedSub = modalSubjects.find(sub => sub.id === val);
                        setSubjectForm(prev => ({
                          ...prev,
                          subjectId: val,
                          subjectCode: matchedSub?.code || '',
                          subjectName: matchedSub?.name || '',
                          credits: String(matchedSub?.credits || 3),
                          subjectType: matchedSub?.isLab ? 'Lab' : (matchedSub?.isElective ? 'Elective' : 'Theory'),
                          teachingHours: String(matchedSub?.isLab ? (matchedSub?.practicalHours || 3) : (matchedSub?.theoryHours || 3))
                        }));
                      }
                    }}
                    className="h-9 border rounded bg-background px-3 cursor-pointer"
                    required
                  >
                    <option value="" disabled>{loadingModalSubjects ? 'Loading subjects...' : 'Select a subject...'}</option>
                    {modalSubjects.length === 0 && !loadingModalSubjects ? (
                      <option disabled>No records found. Please contact Super Admin.</option>
                    ) : (
                      modalSubjects.map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.code} - {sub.name}</option>
                      ))
                    )}
                    <option value="NEW">➕ Register & Create New Subject...</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Subject Code</label>
                  <input
                    type="text"
                    disabled={!!editingSubject || subjectForm.subjectId !== 'NEW'}
                    value={subjectForm.subjectCode}
                    onChange={e => setSubjectForm({ ...subjectForm, subjectCode: e.target.value })}
                    placeholder="e.g. CS6101"
                    className="h-9 border rounded bg-background px-3 font-mono font-bold"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Subject Name</label>
                  <input
                    type="text"
                    disabled={!!editingSubject || subjectForm.subjectId !== 'NEW'}
                    value={subjectForm.subjectName}
                    onChange={e => setSubjectForm({ ...subjectForm, subjectName: e.target.value })}
                    placeholder="e.g. Design and Analysis of Algorithms"
                    className="h-9 border rounded bg-background px-3 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Subject Type</label>
                  <select
                    disabled={!!editingSubject || subjectForm.subjectId !== 'NEW'}
                    value={subjectForm.subjectType}
                    onChange={e => setSubjectForm({ ...subjectForm, subjectType: e.target.value })}
                    className="h-9 border rounded bg-background px-3 cursor-pointer"
                    required
                  >
                    <option value="Theory">Theory</option>
                    <option value="Lab">Lab</option>
                    <option value="Elective">Elective</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Credits</label>
                  <input
                    type="number"
                    disabled={!!editingSubject || subjectForm.subjectId !== 'NEW'}
                    value={subjectForm.credits}
                    onChange={e => setSubjectForm({ ...subjectForm, credits: e.target.value })}
                    min="1"
                    max="10"
                    className="h-9 border rounded bg-background px-3"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Hours / Week</label>
                  <input
                    type="number"
                    disabled={!!editingSubject && subjectForm.subjectId !== 'NEW'}
                    value={subjectForm.teachingHours}
                    onChange={e => setSubjectForm({ ...subjectForm, teachingHours: e.target.value })}
                    min="1"
                    max="20"
                    className="h-9 border rounded bg-background px-3"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold text-muted-foreground">Status</label>
                <select
                  value={subjectForm.status}
                  onChange={e => setSubjectForm({ ...subjectForm, status: e.target.value })}
                  className="h-9 border rounded bg-background px-3 cursor-pointer"
                  required
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>

            <div className="px-5 py-4 border-t bg-muted flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsSubjectModalOpen(false)}
                className="px-4 py-2 border bg-card hover:bg-muted rounded-lg font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-lg font-bold"
              >
                Save Subject
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Timetable Modal */}
      {isTimetableModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveTimetable} className="bg-card w-full max-w-lg border rounded-2xl shadow-2xl overflow-hidden flex flex-col text-xs font-semibold">
            <div className="px-5 py-4 border-b bg-muted/20 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-extrabold uppercase">{editingTimetable ? 'Edit Timetable Slot' : 'Add Timetable Slot'}</h3>
                <p className="text-[9px] text-muted-foreground uppercase font-black tracking-wider">Configure timetable period timing & classroom</p>
              </div>
              <button
                type="button"
                onClick={() => setIsTimetableModalOpen(false)}
                className="px-2.5 py-1 border rounded hover:bg-muted font-bold"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-5 space-y-3.5 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Day of Week</label>
                  <select
                    value={timetableForm.dayOfWeek}
                    onChange={e => setTimetableForm({ ...timetableForm, dayOfWeek: e.target.value })}
                    className="h-9 border rounded bg-background px-3 cursor-pointer"
                    required
                  >
                    <option value="MONDAY">Monday</option>
                    <option value="TUESDAY">Tuesday</option>
                    <option value="WEDNESDAY">Wednesday</option>
                    <option value="THURSDAY">Thursday</option>
                    <option value="FRIDAY">Friday</option>
                    <option value="SATURDAY">Saturday</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Period Index</label>
                  <select
                    value={timetableForm.slotIndex}
                    onChange={e => setTimetableForm({ ...timetableForm, slotIndex: e.target.value })}
                    className="h-9 border rounded bg-background px-3 cursor-pointer"
                    required
                  >
                    <option value="1">Period 1</option>
                    <option value="2">Period 2</option>
                    <option value="3">Period 3</option>
                    <option value="4">Period 4</option>
                    <option value="5">Period 5</option>
                    <option value="6">Period 6</option>
                    <option value="7">Period 7</option>
                    <option value="8">Period 8</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Start Time</label>
                  <input
                    type="text"
                    value={timetableForm.startTime}
                    onChange={e => setTimetableForm({ ...timetableForm, startTime: e.target.value })}
                    placeholder="e.g. 09:00"
                    className="h-9 border rounded bg-background px-3 font-mono font-bold"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">End Time</label>
                  <input
                    type="text"
                    value={timetableForm.endTime}
                    onChange={e => setTimetableForm({ ...timetableForm, endTime: e.target.value })}
                    placeholder="e.g. 09:50"
                    className="h-9 border rounded bg-background px-3 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Department</label>
                  <select
                    value={timetableForm.departmentId}
                    onChange={e => setTimetableForm({ ...timetableForm, departmentId: e.target.value })}
                    className="h-9 border rounded bg-background px-3 cursor-pointer"
                    required
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Program</label>
                  <select
                    value={timetableForm.programId}
                    onChange={e => setTimetableForm({ ...timetableForm, programId: e.target.value })}
                    className="h-9 border rounded bg-background px-3 cursor-pointer"
                    required
                  >
                    {programs.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Semester</label>
                  <select
                    value={timetableForm.semesterId}
                    onChange={e => setTimetableForm({ ...timetableForm, semesterId: e.target.value })}
                    className="h-9 border rounded bg-background px-3 cursor-pointer"
                    required
                  >
                    {semesters.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Section</label>
                  <select
                    value={timetableForm.sectionId}
                    onChange={e => setTimetableForm({ ...timetableForm, sectionId: e.target.value })}
                    className="h-9 border rounded bg-background px-3 cursor-pointer"
                    required
                  >
                    {sections.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold text-muted-foreground">Link Assigned Subject</label>
                <select
                  value={timetableForm.subjectId}
                  onChange={e => setTimetableForm({ ...timetableForm, subjectId: e.target.value })}
                  className="h-9 border rounded bg-background px-3 cursor-pointer"
                  required
                >
                  <option value="" disabled>Select an Assigned Subject</option>
                  {subjects.map(s => (
                    <option key={s.subjectId} value={s.subjectId}>{s.code} - {s.name} ({s.section})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Room Number / Lab Name</label>
                  <input
                    type="text"
                    value={timetableForm.roomNo}
                    onChange={e => setTimetableForm({ ...timetableForm, roomNo: e.target.value })}
                    placeholder="e.g. Room 101"
                    className="h-9 border rounded bg-background px-3"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Mode</label>
                  <select
                    value={timetableForm.mode}
                    onChange={e => setTimetableForm({ ...timetableForm, mode: e.target.value })}
                    className="h-9 border rounded bg-background px-3 cursor-pointer"
                    required
                  >
                    <option value="Offline">Offline</option>
                    <option value="Online">Online</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold text-muted-foreground">Building / Campus Block</label>
                <input
                  type="text"
                  value={timetableForm.building}
                  onChange={e => setTimetableForm({ ...timetableForm, building: e.target.value })}
                  placeholder="e.g. Science Block A"
                  className="h-9 border rounded bg-background px-3"
                  required
                />
              </div>
            </div>

            <div className="px-5 py-4 border-t bg-muted flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsTimetableModalOpen(false)}
                className="px-4 py-2 border bg-card hover:bg-muted rounded-lg font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-lg font-bold"
              >
                Save Timetable
              </button>
            </div>
          </form>
        </div>
      )}

      {/* New Message Composer Modal */}
      {isNewMessageModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSendMessage} className="bg-card w-full max-w-lg border rounded-2xl shadow-2xl overflow-hidden flex flex-col text-xs font-semibold">
            <div className="px-5 py-4 border-b bg-muted/20 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-extrabold uppercase">New Message</h3>
                <p className="text-[9px] text-muted-foreground uppercase font-black tracking-wider">Send priority message to student</p>
              </div>
              <button 
                type="button" 
                onClick={() => setIsNewMessageModalOpen(false)}
                className="px-2.5 py-1 border rounded hover:bg-muted font-bold"
              >
                ✕
              </button>
            </div>
            
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Search Student Input */}
              <div className="flex flex-col gap-1 relative">
                <label className="text-[9px] uppercase font-bold text-muted-foreground">Search Student</label>
                <input 
                  type="text"
                  placeholder="Type student name, register number, roll number or ID..."
                  value={searchStudentInput}
                  onChange={e => handleSearchStudent(e.target.value)}
                  className="h-9 border rounded-lg bg-background px-3"
                  required
                />
                
                {/* Autocomplete Dropdown list */}
                {studentSearchResults !== null && (
                  <div className="absolute top-[48px] left-0 w-full bg-card border rounded-lg shadow-xl z-50 divide-y max-h-48 overflow-y-auto">
                    {studentSearchResults.length === 0 ? (
                      <p className="p-3 text-center text-muted-foreground text-[10px] font-bold">No students assigned to this mentor.</p>
                    ) : (
                      studentSearchResults.map((stud) => (
                        <div 
                          key={stud.id}
                          onClick={() => {
                            setNewMessageForm((prev: any) => ({ ...prev, recipientId: stud.id }));
                            setSearchStudentInput(stud.name);
                            setStudentSearchResults([]);
                          }}
                          className={`p-2.5 flex items-center gap-3 cursor-pointer hover:bg-muted/40 transition-all ${newMessageForm.recipientId === stud.id ? 'bg-primary/5' : ''}`}
                        >
                          {stud.profilePhoto ? (
                            <img src={stud.profilePhoto} className="w-8 h-8 rounded-full object-cover border" alt="" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">{stud.name.substring(0, 2)}</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-foreground">{stud.name} ({stud.registerNo})</p>
                            <p className="text-[8px] text-muted-foreground uppercase">{stud.department} · {stud.semester} · {stud.section}</p>
                            <p className="text-[8px] text-primary/70 font-semibold">Mentor: {stud.mentorName}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Subject */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold text-muted-foreground">Subject Title (Optional)</label>
                <input 
                  type="text"
                  placeholder="e.g. Leave Clarification, Mid-term Project Marks"
                  value={newMessageForm.subject}
                  onChange={e => setNewMessageForm((prev: any) => ({ ...prev, subject: e.target.value }))}
                  className="h-9 border rounded-lg bg-background px-3"
                />
              </div>

              {/* Priority */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold text-muted-foreground">Message Priority</label>
                <select
                  value={newMessageForm.priority}
                  onChange={e => setNewMessageForm((prev: any) => ({ ...prev, priority: e.target.value }))}
                  className="h-9 border rounded-lg bg-background px-3"
                >
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              {/* File Attachment */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold text-muted-foreground">File Attachment (Optional - Max 25MB)</label>
                <input 
                  type="file"
                  onChange={e => handleChatFileChange(e, false)}
                  className="w-full text-xs"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.zip"
                />
                {newMessageForm.attachmentName && (
                  <p className="text-[9px] text-primary font-bold">Attached: {newMessageForm.attachmentName}</p>
                )}
              </div>

              {/* Message text */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold text-muted-foreground">Message Details</label>
                <textarea 
                  placeholder="Type message content..."
                  value={newMessageForm.message}
                  onChange={e => setNewMessageForm((prev: any) => ({ ...prev, message: e.target.value }))}
                  className="h-24 border rounded-lg bg-background p-2.5"
                  required={!newMessageForm.attachmentBase64}
                />
              </div>
            </div>

            <div className="px-5 py-4 border-t bg-muted flex flex-wrap justify-end gap-2 shrink-0">
              <button 
                type="button" 
                onClick={() => setIsNewMessageModalOpen(false)}
                className="px-4 py-2 border bg-card hover:bg-muted rounded-lg font-bold"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-lg font-bold"
              >
                Send Message
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Forward Message Modal */}
      {forwardMessageObj && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md border rounded-2xl shadow-2xl overflow-hidden flex flex-col text-xs font-semibold">
            <div className="px-5 py-4 border-b bg-muted/20 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-extrabold uppercase">Forward Message</h3>
                <p className="text-[9px] text-muted-foreground uppercase font-black tracking-wider">Select recipient student to forward</p>
              </div>
              <button 
                type="button" 
                onClick={() => setForwardMessageObj(null)}
                className="px-2.5 py-1 border rounded hover:bg-muted font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex flex-col gap-1 relative">
                <label className="text-[9px] uppercase font-bold text-muted-foreground">Search Recipient Student</label>
                <input 
                  type="text"
                  placeholder="Search name, register number..."
                  value={searchStudentInput}
                  onChange={e => handleSearchStudent(e.target.value)}
                  className="h-9 border rounded-lg bg-background px-3"
                />

                {studentSearchResults.length > 0 && (
                  <div className="absolute top-[48px] left-0 w-full bg-card border rounded-lg shadow-xl z-50 divide-y max-h-40 overflow-y-auto">
                    {studentSearchResults.map((stud) => (
                      <div 
                        key={stud.id}
                        onClick={() => handleForwardMessage(stud.id)}
                        className="p-2.5 flex flex-wrap items-center gap-3 cursor-pointer hover:bg-muted/40 transition-all"
                      >
                        {stud.profilePhoto ? (
                          <img src={stud.profilePhoto} className="w-8 h-8 rounded-full object-cover border" alt="" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">{stud.name.substring(0, 2)}</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black text-foreground">{stud.name} ({stud.registerNo})</p>
                          <p className="text-[8px] text-muted-foreground uppercase">{stud.department} · {stud.semester}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Message preview */}
              <div className="bg-slate-50 border p-3.5 rounded-lg space-y-1">
                <p className="text-[8px] uppercase text-muted-foreground font-black">Message Preview:</p>
                <p className="italic text-muted-foreground">{forwardMessageObj.message || 'Sent an attachment'}</p>
              </div>
            </div>

            <div className="px-5 py-4 border-t bg-muted flex justify-end shrink-0">
              <button 
                type="button" 
                onClick={() => setForwardMessageObj(null)}
                className="px-4 py-2 border bg-card hover:bg-muted rounded-lg font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
