import React, { useState, useEffect, useRef } from 'react';
import {
  User, BookOpen, Calendar, Clock, Landmark,
  Book, Home, FileText, Send, Sparkles, Cpu, CreditCard,
  Upload, Download, Search, CheckCircle, AlertTriangle, Briefcase,
  MessageSquare, Compass, ShieldAlert, Award as Trophy, Layers, ExternalLink,
  Printer
} from 'lucide-react';
import { toast } from '../components/ui/Toast';
import { Loading } from '../components/ui/Loading';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import { useDevice } from '../context/DeviceContext';
import { DigitalIdCard } from './DigitalIdCard';

import { useSearchParams } from 'react-router-dom';

interface StudentPortalProps {
  user: any;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({ user }) => {
  const { isMobile } = useDevice();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'overview');

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);
  const [selectedTimetableDay, setSelectedTimetableDay] = useState<string>(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    return today === 'Sunday' ? 'Monday' : today;
  });
  const [profileData, setProfileData] = useState<any>(null);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [showFrontSide, setShowFrontSide] = useState(true);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Form payload
  const [formData, setFormData] = useState<any>({
    firstName: '',
    lastName: '',
    preferredName: '',
    phone: '',
    altPhone: '',
    email: '',
    currentAddress: '',
    permanentAddress: '',
    city: '',
    district: '',
    state: '',
    country: '',
    pinCode: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    parentPhone: '',
    parentEmail: '',
    linkedin: '',
    github: '',
    portfolio: '',
    technicalSkills: '',
    softSkills: '',
    languagesKnown: '',
    certifications: '',
    careerObjective: '',
    areasOfInterest: '',
  });

  // Base64 attachments
  const [profilePhotoBase64, setProfilePhotoBase64] = useState<string | null>(null);
  const [resumeBase64, setResumeBase64] = useState<string | null>(null);
  const [resumeName, setResumeName] = useState<string>('');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Sync profile data to edit form
  useEffect(() => {
    if (studentInfo) {
      setFormData({
        firstName: studentInfo.firstName || '',
        lastName: studentInfo.lastName || '',
        preferredName: studentInfo.preferredName || '',
        phone: studentInfo.phone || '',
        altPhone: studentInfo.altPhone || '',
        email: studentInfo.email || '',
        currentAddress: studentInfo.currentAddress || '',
        permanentAddress: studentInfo.permanentAddress || '',
        city: studentInfo.city || '',
        district: studentInfo.district || '',
        state: studentInfo.state || '',
        country: studentInfo.country || '',
        pinCode: studentInfo.pinCode || '',
        emergencyContactName: studentInfo.emergencyContactName || '',
        emergencyContactPhone: studentInfo.emergencyContactPhone || '',
        emergencyContactRelation: studentInfo.emergencyContactRelation || '',
        parentPhone: studentInfo.parentPhone || '',
        parentEmail: studentInfo.parentEmail || '',
        linkedin: studentInfo.linkedin || '',
        github: studentInfo.github || '',
        portfolio: studentInfo.portfolio || '',
        technicalSkills: studentInfo.technicalSkills || '',
        softSkills: studentInfo.softSkills || '',
        languagesKnown: studentInfo.languagesKnown || '',
        certifications: studentInfo.certifications || '',
        careerObjective: studentInfo.careerObjective || '',
        areasOfInterest: studentInfo.areasOfInterest || '',
      });
    }
  }, [studentInfo]);

  // Client-side image resizing via canvas
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Unsupported image format. Use JPG, JPEG, PNG, or WEBP.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
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
          toast.success('Photo uploaded and scaled successfully.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Resume file size exceeds 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setResumeBase64(event.target?.result as string);
      setResumeName(file.name);
      toast.success(`Resume selected: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All password fields are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    setChangingPassword(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      toast.success('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || 'Failed to update credentials.');
    } finally {
      setChangingPassword(false);
    }
  };
  const [timetable, setTimetable] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [marks, setMarks] = useState<any[]>([]);
  const [library, setLibrary] = useState<any>(null);
  const [hostel, setHostel] = useState<any>(null);
  const [transport, setTransport] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);

  // Form Inputs
  // Form Inputs & Leave/OD System States
  const [requestTab, setRequestTab] = useState<'LEAVE' | 'OD' | 'HISTORY'>('HISTORY');
  const [leaveType, setLeaveType] = useState('LEAVE');
  const [leaveSubCategory, setLeaveSubCategory] = useState('Sick Leave');
  const [odSubCategory, setOdSubCategory] = useState('Internship');
  const [leaveTitle, setLeaveTitle] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [odEventName, setOdEventName] = useState('');
  const [odOrgName, setOdOrgName] = useState('');
  const [proofDocAttachment, setProofDocAttachment] = useState<{ base64: string; name: string; mimeType: string } | null>(null);
  const [historyFilterStatus, setHistoryFilterStatus] = useState<string>('ALL');
  const [cancellingRequestId, setCancellingRequestId] = useState<string | null>(null);

  // Messaging States
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversation, setActiveConversation] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyInput, setReplyInput] = useState('');
  const [replyAttachment, setReplyAttachment] = useState<{ base64: string; name: string } | null>(null);
  const [editMessageId, setEditMessageId] = useState<string | null>(null);
  const [editMessageText, setEditMessageText] = useState('');
  const [chatFilterStatus, setChatFilterStatus] = useState<'ALL' | 'UNREAD'>('ALL');
  const [availableFacultyList, setAvailableFacultyList] = useState<any[]>([]);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [newChatForm, setNewChatForm] = useState({
    recipientId: '',
    subject: '',
    message: '',
    priority: 'NORMAL',
    attachmentBase64: '',
    attachmentName: ''
  });
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [downloadingMarks, setDownloadingMarks] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [selectedBookSearch, setSelectedBookSearch] = useState('');
  const [bookResults, setBookResults] = useState<any[]>([]);

  // Modals
  const [isHallTicketOpen, setIsHallTicketOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);

  // ADVANCED SERVICES STATE
  // AI Assistant
  const [aiMessage, setAiMessage] = useState('');
  const [aiHistory, setAiHistory] = useState<any[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSubTab, setAiSubTab] = useState<'academic' | 'revision'>('academic');
  const [revisionSubject, setRevisionSubject] = useState('');
  const [revisionFormat, setRevisionFormat] = useState('Quick Revision Notes');
  const [revisionTopic, setRevisionTopic] = useState('');
  const [revisionResult, setRevisionResult] = useState('');
  const [revisionLoading, setRevisionLoading] = useState(false);
  const [aiHistoryLoaded, setAiHistoryLoaded] = useState(false);

  // Placements & Skills
  const [jobs, setJobs] = useState<any[]>([
    { id: '1', company: 'Google', role: 'Software Engineer', lpa: 35.5, eligibility: 'ELIGIBLE', status: 'APPLIED', date: '2026-07-22' },
    { id: '2', company: 'Microsoft', role: 'Cloud Developer', lpa: 28.0, eligibility: 'ELIGIBLE', status: 'NOT APPLIED', date: '2026-07-28' },
    { id: '3', company: 'Uber', role: 'System Engineer', lpa: 31.2, eligibility: 'CGPA GAP (Req: 9.6)', status: 'INELIGIBLE', date: '2026-07-30' }
  ]);
  const [skills, setSkills] = useState<any[]>([
    { name: 'TypeScript', level: 'ADVANCED', verified: true },
    { name: 'Node.js', level: 'ADVANCED', verified: true },
    { name: 'React', level: 'INTERMEDIATE', verified: false }
  ]);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState('BEGINNER');

  // Internships
  const [internships, setInternships] = useState<any[]>([]);
  const [internCompany, setInternCompany] = useState('');
  const [internDuration, setInternDuration] = useState('');
  const [activeInternshipId, setActiveInternshipId] = useState<string | null>(null);
  const [uploadDocType, setUploadDocType] = useState('Offer Letter');
  const [internshipFile, setInternshipFile] = useState<File | null>(null);
  const [internUploadProgress, setInternUploadProgress] = useState(0);
  const [isInternUploading, setIsInternUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type: string } | null>(null);
  const [imgZoom, setImgZoom] = useState(1);
  const [imgRotation, setImgRotation] = useState(0);

  // Events & Clubs
  const [registeredEvents, setRegisteredEvents] = useState<string[]>(['1']);
  const [clubs, setClubs] = useState<any[]>([
    { name: 'IEEE Student Chapter', status: 'MEMBER' },
    { name: 'E-Cell (Entrepreneurship)', status: 'NOT JOINED' },
    { name: 'Robotics Club', status: 'NOT JOINED' }
  ]);

  // Projects & Portfolio
  const [projects, setProjects] = useState<any[]>([
    { title: 'CampusOS Secure Database Engine', tech: 'Rust, Prisma', type: 'Major', guide: 'Dr. Evelyn Boyd', link: 'github.com/geetorus/campusos' }
  ]);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectTech, setNewProjectTech] = useState('');
  const [newProjectLink, setNewProjectLink] = useState('');

  // Grievance Feedback
  const [grievanceCategory, setGrievanceCategory] = useState('ACADEMIC');
  const [grievanceTitle, setGrievanceTitle] = useState('');
  const [grievanceText, setGrievanceText] = useState('');
  const [submittedGrievances, setSubmittedGrievances] = useState<any[]>([
    { category: 'INFRASTRUCTURE', title: 'Wi-Fi connection latency in lab 3', status: 'IN_PROGRESS', date: '2026-07-10' }
  ]);

  const fetchStudentDashboardData = async () => {
    try {
      setIsLoading(true);
      
      const [statsRes, timetableRes, workflowRes, assignmentsRes, studentProfileRes, marksRes, internshipsRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/timetables/slots'),
        api.get('/workflows/requests'),
        api.get('/assignments').catch(() => ({ data: { status: 'error' } })),
        api.get('/enterprise/students').catch(() => null),
        api.get('/enterprise/marks?pageSize=100').catch(() => null),
        api.get('/enterprise/internships').catch(() => null)
      ]);

      if (studentProfileRes && studentProfileRes.data?.status === 'success' && studentProfileRes.data.data.length > 0) {
        setStudentInfo(studentProfileRes.data.data[0]);
      }

      if ((assignmentsRes as any).data?.status === 'success') {
        setAssignments((assignmentsRes as any).data.data);
      }

      if (internshipsRes && internshipsRes.data?.status === 'success') {
        setInternships(internshipsRes.data.data);
      }

      if (statsRes.data?.status === 'success') {
        const metrics = statsRes.data.data.metrics;
        setProfileData(metrics);
        
        setSubjects([
          { code: 'CS6101', name: 'Design and Analysis of Algorithms', faculty: 'Dr. Evelyn Boyd', credits: 4, theory: 3, practical: 2, attendance: 96, internal: 38 },
          { code: 'CS6102', name: 'Database Management Systems', faculty: 'Prof. Alan Turing', credits: 4, theory: 3, practical: 2, attendance: 92, internal: 36 },
          { code: 'CS6103', name: 'Operating Systems Concepts', faculty: 'Dr. Grace Hopper', credits: 3, theory: 3, practical: 0, attendance: 88, internal: 34 },
          { code: 'CS6104', name: 'Theory of Computation', faculty: 'Prof. John von Neumann', credits: 3, theory: 3, practical: 0, attendance: 95, internal: 39 }
        ]);

        setAttendance({
          overall: 92.8,
          totalClasses: 180,
          presentClasses: 167,
          absentClasses: 13,
          subjectWise: [
            { name: 'Analysis of Algorithms', present: 45, total: 47, percent: 95.7 },
            { name: 'Database Systems', present: 42, total: 45, percent: 93.3 },
            { name: 'Operating Systems', present: 40, total: 45, percent: 88.8 },
            { name: 'Theory of Computation', present: 40, total: 43, percent: 93.0 }
          ]
        });

        setAssignments([
          { id: '1', title: 'Dynamic Programming Exercises', subject: 'Analysis of Algorithms', due: '2026-07-25', status: 'PENDING', marks: null, feedback: null },
          { id: '2', title: 'ER Diagram & Normalization Schema', subject: 'Database Systems', due: '2026-07-12', status: 'SUBMITTED', marks: 18, feedback: 'Excellent DB normalization structure.' },
          { id: '3', title: 'Multithreading & Process Synch', subject: 'Operating Systems', due: '2026-07-18', status: 'PENDING', marks: null, feedback: null }
        ]);

        setExams([
          { subject: 'Analysis of Algorithms', date: '2026-08-05', time: '10:00 AM - 01:00 PM', hall: 'Exam Block A - Room 102', seat: 'A-34', invigilator: 'Prof. Charles Babbage' },
          { subject: 'Database Systems', date: '2026-08-07', time: '10:00 AM - 01:00 PM', hall: 'Exam Block A - Room 104', seat: 'B-12', invigilator: 'Dr. Evelyn Boyd' },
          { subject: 'Operating Systems', date: '2026-08-10', time: '10:00 AM - 01:00 PM', hall: 'Exam Block B - Room 201', seat: 'C-08', invigilator: 'Dr. Grace Hopper' }
        ]);

        if (marksRes && marksRes.data?.status === 'success') {
          const liveMarks = marksRes.data.data.map((m: any) => ({
            id: m.id,
            subject: m.subject?.name || 'N/A',
            code: m.subject?.code || '',
            credits: m.subject?.credits || 4,
            internal: m.internalMarks,
            external: m.externalMarks,
            total: m.internalMarks + m.externalMarks,
            grade: m.grade,
            gpa: m.gpa,
            cgpa: m.cgpa,
            result: (m.internalMarks + m.externalMarks) >= 40 ? 'PASS' : 'FAIL'
          }));
          if (liveMarks.length > 0) {
            setMarks(liveMarks);
          } else {
            setMarks([
              { subject: 'Analysis of Algorithms', internal: 38, external: 54, total: 92, grade: 'S', gpa: 10, cgpa: 10, credits: 4, result: 'PASS', code: 'CS6101' },
              { subject: 'Database Systems', internal: 36, external: 48, total: 84, grade: 'A', gpa: 9, cgpa: 9, credits: 4, result: 'PASS', code: 'CS6102' },
              { subject: 'Operating Systems', internal: 34, external: 46, total: 80, grade: 'A', gpa: 9, cgpa: 9, credits: 3, result: 'PASS', code: 'CS6103' },
              { subject: 'Theory of Computation', internal: 39, external: 56, total: 95, grade: 'S', gpa: 10, cgpa: 10, credits: 3, result: 'PASS', code: 'CS6104' }
            ]);
          }
        } else {
          setMarks([
            { subject: 'Analysis of Algorithms', internal: 38, external: 54, total: 92, grade: 'S', gpa: 10, cgpa: 10, credits: 4, result: 'PASS', code: 'CS6101' },
            { subject: 'Database Systems', internal: 36, external: 48, total: 84, grade: 'A', gpa: 9, cgpa: 9, credits: 4, result: 'PASS', code: 'CS6102' },
            { subject: 'Operating Systems', internal: 34, external: 46, total: 80, grade: 'A', gpa: 9, cgpa: 9, credits: 3, result: 'PASS', code: 'CS6103' },
            { subject: 'Theory of Computation', internal: 39, external: 56, total: 95, grade: 'S', gpa: 10, cgpa: 10, credits: 3, result: 'PASS', code: 'CS6104' }
          ]);
        }

        setLibrary({
          issued: [
            { title: 'Introduction to Algorithms (CLRS)', returnDate: '2026-07-28', fine: 0 },
            { title: 'Database System Concepts (Silberschatz)', returnDate: '2026-07-20', fine: 0 }
          ],
          history: [
            { title: 'Operating System Concepts', returnedDate: '2026-06-15' }
          ]
        });

        setHostel({
          name: 'Niels Bohr Men Residence',
          roomNo: '304-B',
          block: 'Block-A',
          roommates: ['Alex Rivera (ADM2026002)', 'David Miller (ADM2026003)'],
          messMenu: {
            breakfast: 'Idly, Vada, Sambhar, Coffee',
            lunch: 'Steamed Rice, Sambhar, Rasam, Curd, Veg Poriyal',
            dinner: 'Chapati, Paneer Butter Massala, Fruit Custard'
          }
        });

        setTransport({
          busNo: 'Bus-12 (Route A)',
          driverName: 'Robert Downing',
          driverPhone: '+91 99887 76655',
          route: 'Central Terminus -> Campus Main Gate',
          pickup: 'Central Bus Terminus (07:45 AM)',
          drop: 'Central Bus Terminus (04:45 PM)',
          gpsStatus: 'Active - Connected'
        });

        // Fetch live department-isolated circulars
        try {
          const circsRes = await api.get('/circulars');
          if (circsRes.data?.status === 'success') {
            const list = circsRes.data.data;
            setAnnouncements(list.map((c: any) => ({
              id: c.id,
              title: c.title,
              date: new Date(c.createdAt).toLocaleDateString('en-IN'),
              content: c.content,
              imageUrl: c.images?.[0]?.url || c.imageUrl || '',
              attachmentUrl: c.attachmentUrl || '',
              attachmentName: c.attachmentName || '',
              isRead: c.isRead
            })));

            // Automatically mark unread circulars as read on display
            for (const item of list) {
              if (!item.isRead) {
                api.post(`/circulars/${item.id}/read`).catch(() => null);
              }
            }
          }
        } catch (_) {}
      }

      if (timetableRes.data?.status === 'success') {
        setTimetable(timetableRes.data.data);
      }

      if (workflowRes.data?.status === 'success') {
        setRequests(workflowRes.data.data);
      }

    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load student command center parameters.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentDashboardData();
  }, [user]);

  useEffect(() => {
    if (aiSubTab === 'academic') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiHistory, aiLoading, aiSubTab]);

  // Download academic marksheet transcript PDF
  const handleDownloadMarksPDF = async () => {
    if (!studentInfo || marks.length === 0) {
      toast.error('No result records available to generate transcript PDF.');
      return;
    }
    setDownloadingMarks(true);
    try {
      const element = document.getElementById('printable-marksheet-area');
      if (!element) {
        throw new Error('Printable marksheet element not found');
      }

      // Temporarily render offscreen
      const originalClassName = element.className;
      const originalPosition = element.style.position;
      const originalTop = element.style.top;
      const originalLeft = element.style.left;

      element.className = 'bg-white text-slate-800 block';
      element.style.position = 'fixed';
      element.style.top = '-9999px';
      element.style.left = '-9999px';

      // Wait for any logo or signature images to resolve
      const imgs = element.querySelectorAll('img');
      await Promise.all(
        Array.from(imgs).map((img) => {
          return new Promise((resolve) => {
            if (img.complete) {
              resolve(null);
            } else {
              img.onload = () => resolve(null);
              img.onerror = () => resolve(null);
            }
          });
        })
      );

      const { default: html2canvas } = await import('html2canvas');
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(element, {
        scale: 2, // Optimized resolution scale
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.7); // Compress canvas to JPEG at 70% quality

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // A4 dimensions: 210mm x 297mm
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');

      // Restore original visibility classes
      element.className = originalClassName;
      element.style.position = originalPosition;
      element.style.top = originalTop;
      element.style.left = originalLeft;

      const details = getIdCardDetails();
      const registerNo = details?.registerNo || studentInfo.admissionNo;
      const sem = studentInfo.semester?.name || 'Sem';
      const name = `${studentInfo.firstName}_${registerNo}_${sem.replace(/\s+/g, '')}_Result.pdf`;
      pdf.save(name);

      toast.success('Semester Marks PDF downloaded successfully.');
    } catch (err) {
      console.error('Failed to generate marks PDF:', err);
      toast.error('Failed to download marks transcript PDF.');
    } finally {
      setDownloadingMarks(false);
    }
  };

  // File selection handler for Leave/OD proof documents
  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Document proof file size exceeds 10MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setProofDocAttachment({
        base64,
        name: file.name,
        mimeType: file.type || 'application/pdf',
      });
      toast.success(`Attached supporting proof: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  // Submit Leave or OD Request
  const handleSubmitLeaveOrODRequest = async (e: React.FormEvent, isOD: boolean) => {
    e.preventDefault();
    const type = isOD ? `OD (${odSubCategory})` : `LEAVE (${leaveSubCategory})`;
    const title = isOD 
      ? `OD Request: ${odSubCategory} - ${odEventName || 'Event'}`
      : `Leave Request: ${leaveSubCategory} - ${leaveTitle || 'Absence'}`;
    
    const reason = isOD 
      ? `Event: ${odEventName}\nOrganization: ${odOrgName}\nReason: ${leaveReason}`
      : leaveReason;

    if (!leaveReason || (isOD && (!odEventName || !odOrgName))) {
      toast.error('Please complete all required fields.');
      return;
    }

    try {
      let attachmentUrl = '';
      if (proofDocAttachment) {
        try {
          const uploadRes = await api.post('/files/upload', {
            name: proofDocAttachment.name,
            mimeType: proofDocAttachment.mimeType,
            folder: '/documents',
            base64: proofDocAttachment.base64.split(',')[1] || proofDocAttachment.base64,
          });
          if (uploadRes.data?.status === 'success') {
            attachmentUrl = uploadRes.data.data.path;
          }
        } catch {
          // If upload endpoint fails, fallback to inline base64 reference
          attachmentUrl = proofDocAttachment.base64;
        }
      }

      const res = await api.post('/workflows/requests', {
        type,
        title,
        reason,
        startDate: leaveStart || new Date().toISOString().split('T')[0],
        endDate: leaveEnd || new Date().toISOString().split('T')[0],
        attachments: attachmentUrl ? JSON.stringify([attachmentUrl]) : '[]',
      });

      if (res.data?.status === 'success') {
        toast.success(`Your ${isOD ? 'On-Duty (OD)' : 'Leave'} request has been submitted to your Faculty Advisor / Class Advisor.`);
        setLeaveTitle('');
        setLeaveReason('');
        setLeaveStart('');
        setLeaveEnd('');
        setOdEventName('');
        setOdOrgName('');
        setProofDocAttachment(null);
        fetchStudentDashboardData();
        setRequestTab('HISTORY');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Request submission failed.');
    }
  };

  // Cancel Pending Request
  const handleCancelRequest = async (requestId: string) => {
    setCancellingRequestId(requestId);
    try {
      const res = await api.post(`/workflows/requests/${requestId}/cancel`);
      if (res.data?.status === 'success') {
        toast.success('Request cancelled successfully.');
        fetchStudentDashboardData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel request.');
    } finally {
      setCancellingRequestId(null);
    }
  };

  // File selection handler for assignments
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExtensions = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'zip', 'rar', 'jpg', 'jpeg', 'png', 'webp'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !allowedExtensions.includes(ext)) {
      toast.error('Unsupported file type. Supported types: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, ZIP, RAR, JPG, JPEG, PNG, WEBP.');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      toast.error('File size exceeds 25MB limit.');
      return;
    }

    setSelectedFile(file);
    setUploadProgress(0);
  };

  // Convert File object to Base64 string
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Submit Assignment with file upload to real API
  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    if (!selectedFile) {
      toast.error('Please select a solution file to upload.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      // Convert file to base64
      const base64 = await fileToBase64(selectedFile);
      setUploadProgress(40);

      // Upload file to media files directory
      const uploadRes = await api.post('/files/upload', {
        name: selectedFile.name,
        mimeType: selectedFile.type || 'application/octet-stream',
        folder: '/submissions',
        base64
      });

      setUploadProgress(80);

      if (uploadRes.data?.status === 'success') {
        const mediaFile = uploadRes.data.data;
        
        // Submit assignment solution to backend with file metadata
        const res = await api.post(`/assignments/${selectedAssignment.id}/submit`, {
          fileUrl: mediaFile.path,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          fileType: selectedFile.type || 'application/octet-stream'
        });

        setUploadProgress(100);

        if (res.data?.status === 'success') {
          toast.success('Assignment submitted successfully!');
          setSelectedAssignment(null);
          setSelectedFile(null);
          setUploadProgress(0);
          setIsUploading(false);
          
          // Refresh assignments list
          const updatedRes = await api.get('/assignments');
          if (updatedRes.data?.status === 'success') {
            setAssignments(updatedRes.data.data);
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Submission failed.');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Library Book Search
  const handleBookSearch = async () => {
    if (!selectedBookSearch) return;
    try {
      const res = await api.get(`/enterprise/library/books?search=${selectedBookSearch}`);
      if (res.data?.status === 'success') {
        setBookResults(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to search books database.');
    }
  };

  // Fee Payment Simulation
  const handlePayment = async () => {
    if (!selectedBill) return;
    try {
      const res = await api.post(`/enterprise/fees/bills/${selectedBill.id}/pay`);
      if (res.data?.status === 'success') {
        toast.success('Payment settled successfully. Receipt generated.', 'Success');
        setIsPaymentModalOpen(false);
        fetchStudentDashboardData();
      }
    } catch (err) {
      toast.error('Payment checkout failed.');
    }
  };

  // Load conversations list for student
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

  // Load message history
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

  // Load available instructors list for student to start messaging
  const fetchAvailableFaculty = async () => {
    try {
      const res = await api.get('/chat/faculty/list');
      if (res.data?.status === 'success') {
        setAvailableFacultyList(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch available faculty list:', err);
    }
  };

  // Start new conversation from modal
  const handleSendNewChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatForm.recipientId || (!newChatForm.message.trim() && !newChatForm.attachmentBase64)) {
      toast.error('Recipient and message content are required.');
      return;
    }

    try {
      const res = await api.post('/chat/messages', newChatForm);
      if (res.data?.status === 'success') {
        toast.success('Message sent successfully!');
        setIsNewChatModalOpen(false);
        setNewChatForm({
          recipientId: '',
          subject: '',
          message: '',
          priority: 'NORMAL',
          attachmentBase64: '',
          attachmentName: ''
        });

        // Refresh list
        await fetchConversations();

        // Auto select
        const targetCid = res.data.data.conversationId;
        const matched = conversations.find(c => c.conversationId === targetCid);
        if (matched) {
          setActiveConversation(matched);
        } else {
          const fresh = await api.get('/chat/conversations');
          const found = fresh.data.data.find((c: any) => c.conversationId === targetCid);
          if (found) setActiveConversation(found);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to start conversation.');
    }
  };

  // Send quick reply from chat thread panel
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversation) return;
    if (!replyInput.trim() && !replyAttachment) {
      toast.error('Message content or attachment is required.');
      return;
    }

    try {
      const payload = {
        recipientId: activeConversation.participant.id,
        message: replyInput,
        priority: 'NORMAL',
        attachmentBase64: replyAttachment?.base64 || undefined,
        attachmentName: replyAttachment?.name || undefined
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
    if (!confirm('Are you sure you want to delete this message from your view?')) return;
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

  // Convert files locally to Base64 (supporting PDF, DOC, DOCX, PPT, PPTX, PNG, JPG, JPEG, ZIP; Max 25MB)
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
        setNewChatForm(prev => ({
          ...prev,
          attachmentBase64: base64,
          attachmentName: file.name
        }));
      }
      toast.success(`Attached ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  // Setup messaging triggers
  useEffect(() => {
    if (activeTab === 'messages') {
      fetchConversations();
      fetchAvailableFaculty();
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

  // AI Adviser - send message to real API
  const handleSendAiMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = aiMessage.trim();
    if (!trimmed) return;
    setAiHistory(prev => [...prev, { role: 'user', content: trimmed }]);
    setAiMessage('');
    setAiLoading(true);
    try {
      const res = await api.post('/ai/chat', { message: trimmed });
      if (res.data?.status === 'success') {
        setAiHistory(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
      }
    } catch (err: any) {
      setAiHistory(prev => [...prev, { role: 'assistant', content: '⚠️ Unable to reach AI Adviser. Please try again shortly.' }]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleLoadAiHistory = async () => {
    if (aiHistoryLoaded) return;
    try {
      const res = await api.get('/ai/history?limit=30');
      if (res.data?.status === 'success' && res.data.data.length > 0) {
        setAiHistory(res.data.data);
      } else {
        setAiHistory([{ role: 'assistant', content: '👋 Hello! I am your AI Academic Adviser. Ask me about your attendance, grades, fees, assignments, timetable, hostel, or any academic concern!' }]);
      }
      setAiHistoryLoaded(true);
    } catch {
      setAiHistory([{ role: 'assistant', content: '👋 Hello! I am your AI Academic Adviser. Ask me about your attendance, grades, fees, assignments, timetable, hostel, or any academic concern!' }]);
      setAiHistoryLoaded(true);
    }
  };

  const handleClearAiHistory = async () => {
    try {
      await api.delete('/ai/history');
      setAiHistory([{ role: 'assistant', content: '🧹 Chat history cleared. How can I help you today?' }]);
      toast.success('Chat history cleared.');
    } catch {
      toast.error('Could not clear history.');
    }
  };

  // Skill Add
  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    setSkills([...skills, { name: newSkillName, level: newSkillLevel, verified: false }]);
    setNewSkillName('');
    toast.success('Skill added and queued for advisor verification.');
  };

  // Apply Internship
  const handleApplyInternship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!internCompany.trim() || !internDuration.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }
    try {
      const res = await api.post('/enterprise/internships', {
        company: internCompany,
        duration: internDuration,
        credits: 2
      });
      if (res.data?.status === 'success') {
        setInternships(prev => [res.data.data, ...prev]);
        toast.success('Internship authorization request filed.');
      } else {
        toast.error('Failed to register internship request.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to file internship request.');
    }
    setInternCompany('');
    setInternDuration('');
  };

  const handleUploadInternshipDoc = async (internshipId: string) => {
    if (!internshipFile) {
      toast.error('Please select a document file to upload.');
      return;
    }
    const MAX_SIZE = 25 * 1024 * 1024; // 25 MB
    if (internshipFile.size > MAX_SIZE) {
      toast.error('File size exceeds the maximum limit of 25MB.');
      return;
    }

    setIsInternUploading(true);
    setInternUploadProgress(10);
    try {
      const base64 = await fileToBase64(internshipFile);
      setInternUploadProgress(50);
      
      const uploadRes = await api.post('/files/upload', {
        name: internshipFile.name,
        mimeType: internshipFile.type || 'application/octet-stream',
        folder: '/internships',
        base64
      });
      setInternUploadProgress(80);

      if (uploadRes.data?.status === 'success') {
        const mediaFile = uploadRes.data.data;
        const res = await api.post(`/enterprise/internships/${internshipId}/documents`, {
          documentType: uploadDocType,
          fileName: internshipFile.name,
          fileUrl: mediaFile.path,
          fileSize: internshipFile.size,
          fileType: internshipFile.type || 'application/octet-stream'
        });
        setInternUploadProgress(100);

        if (res.data?.status === 'success') {
          toast.success(`${uploadDocType} uploaded successfully!`);
          setInternshipFile(null);
          setInternUploadProgress(0);
          setIsInternUploading(false);

          // Refresh internships list
          const updated = await api.get('/enterprise/internships');
          if (updated.data?.status === 'success') {
            setInternships(updated.data.data);
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Document upload failed.');
      setIsInternUploading(false);
      setInternUploadProgress(0);
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

  // Project Repos
  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTitle.trim()) return;
    setProjects([...projects, { title: newProjectTitle, tech: newProjectTech, type: 'Mini', guide: 'Ada Lovelace', link: newProjectLink }]);
    setNewProjectTitle('');
    setNewProjectTech('');
    setNewProjectLink('');
    toast.success('Project details logged to departmental repository.');
  };

  // Grievance Submit
  const handleGrievanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!grievanceTitle.trim()) return;
    setSubmittedGrievances([...submittedGrievances, { category: grievanceCategory, title: grievanceTitle, status: 'SUBMITTED', date: new Date().toISOString().split('T')[0] }]);
    setGrievanceTitle('');
    setGrievanceText('');
  };

  const [downloading, setDownloading] = useState(false);
  const [downloadingAttendance, setDownloadingAttendance] = useState(false);

  const handleGenerateRevision = async () => {
    if (!revisionSubject) return;
    setRevisionLoading(true);
    setRevisionResult('');
    try {
      const res = await api.post('/ai/revision', {
        subject: revisionSubject,
        format: revisionFormat,
        topic: revisionTopic
      });
      if (res.data?.status === 'success') {
        setRevisionResult(res.data.data);
        toast.success('Study ledger generated successfully!');
      } else {
        toast.error(res.data?.message || 'Failed to generate revision material.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to connect to revision engine.');
    } finally {
      setRevisionLoading(false);
    }
  };

  const getIdCardDetails = () => {
    if (!studentInfo) return null;
    const year = studentInfo.dateOfAdmission ? new Date(studentInfo.dateOfAdmission).getFullYear() : 2026;
    const yearSuffix = String(year).slice(-2);
    const deptCode = studentInfo.department?.code || 'CSE';
    const seq = studentInfo.admissionNo.replace(/^\D+/g, '') || '001';
    const sequence = seq.slice(-3);
    const registerNo = `${yearSuffix}${deptCode}${sequence}`;
    const rollNo = `${yearSuffix}${deptCode}${sequence}`;
    const duration = studentInfo.program?.duration || 4;
    const validUntil = `${year} - ${year + duration}`;
    
    const qrPayload = JSON.stringify({
      studentId: studentInfo.id,
      registerNo,
      admissionNo: studentInfo.admissionNo,
      collegeId: 'GEETORUS-CAMPUS',
      verificationUrl: `https://geetorus.com/verify/student/${studentInfo.id}`
    });
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrPayload)}`;

    return {
      registerNo,
      rollNo,
      validUntil,
      qrUrl
    };
  };

  const handleDownloadPDF = async () => {
    if (!studentInfo) {
      toast.error('Student profile data is not loaded yet.');
      return;
    }
    setDownloading(true);
    try {
      const element = document.getElementById('printable-id-card-area');
      if (!element) {
        throw new Error('Printable element not found');
      }

      // Temporarily make the printable area visible off-screen for html2canvas capture
      const originalClassName = element.className;
      const originalPosition = element.style.position;
      const originalTop = element.style.top;
      const originalLeft = element.style.left;

      element.className = 'flex flex-col gap-6 p-4 bg-white';
      element.style.position = 'fixed';
      element.style.top = '-9999px';
      element.style.left = '-9999px';

      const cardPages = element.querySelectorAll('.print-card-page');
      if (cardPages.length === 0) {
        throw new Error('No printable card pages found.');
      }

      const { default: html2canvas } = await import('html2canvas');
      const { jsPDF } = await import('jspdf');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [53.98, 85.6]
      });

      for (let i = 0; i < cardPages.length; i++) {
        const cardPage = cardPages[i] as HTMLElement;

        // Ensure all images are fully loaded before capturing
        const imgs = cardPage.querySelectorAll('img');
        await Promise.all(
          Array.from(imgs).map((img) => {
            return new Promise((resolve) => {
              if (img.complete) {
                resolve(null);
              } else {
                img.onload = () => resolve(null);
                img.onerror = () => resolve(null);
              }
            });
          })
        );

        const canvas = await html2canvas(cardPage, {
          scale: 4, // 4x rendering scale for super crisp vector-like text and images (400% zoom crispness!)
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false
        });

        const imgData = canvas.toDataURL('image/png');

        if (i > 0) {
          pdf.addPage([53.98, 85.6], 'portrait');
        }

        pdf.addImage(imgData, 'PNG', 0, 0, 53.98, 85.6);
      }

      // Restore original visibility classes
      element.className = originalClassName;
      element.style.position = originalPosition;
      element.style.top = originalTop;
      element.style.left = originalLeft;

      const details = getIdCardDetails();
      const registerNo = details?.registerNo || studentInfo.admissionNo;
      const name = `${studentInfo.firstName}_${registerNo}_IDCard.pdf`;
      pdf.save(name);

      toast.success('Digital ID Card PDF downloaded successfully.', 'Download Complete');
    } catch (err) {
      console.error('Failed to generate client PDF:', err);
      toast.error('Failed to download ID Card PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadAttendancePDF = async () => {
    if (!studentInfo) {
      toast.error('Student profile data is not loaded yet.');
      return;
    }
    setDownloadingAttendance(true);
    try {
      const res = await api.get(`/enterprise/students/${studentInfo.id}/attendance/pdf`, {
        responseType: 'blob'
      });

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const details = getIdCardDetails();
      const registerNo = details?.registerNo || studentInfo.admissionNo;
      const filename = `${studentInfo.firstName}_${registerNo}_Attendance_Report.pdf`;

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Attendance report PDF downloaded successfully.', 'Download Complete');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to download Attendance report PDF.');
    } finally {
      setDownloadingAttendance(false);
    }
  };

  const handlePrintCard = () => {
    if (!studentInfo) {
      toast.error('Student profile data is not loaded yet.');
      return;
    }
    window.print();
  };

  const { refreshUser } = useAuth();

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('First Name and Last Name are required.');
      return;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Invalid personal email format.');
      return;
    }
    if (formData.parentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parentEmail)) {
      toast.error('Invalid parent email format.');
      return;
    }
    if (formData.pinCode && !/^\d{6}$/.test(formData.pinCode)) {
      toast.error('PIN Code must be exactly 6 digits.');
      return;
    }
    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/[\s-()]/g, ''))) {
      toast.error('Mobile Number must be a valid 10-digit number.');
      return;
    }

    setSavingProfile(true);
    try {
      const payload: any = {
        ...formData,
      };

      if (profilePhotoBase64) {
        payload.profilePhoto = profilePhotoBase64;
      }
      if (resumeBase64) {
        payload.resumeBase64 = resumeBase64;
        payload.resumeName = resumeName;
      }

      const res = await api.put('/users/profile', payload);
      if (res.data?.status === 'success') {
        toast.success('Profile Updated Successfully');
        
        // Fetch latest student profile from database
        const studentProfileRes = await api.get('/enterprise/students').catch(() => null);
        if (studentProfileRes && studentProfileRes.data?.status === 'success' && studentProfileRes.data.data.length > 0) {
          setStudentInfo(studentProfileRes.data.data[0]);
        }

        // Trigger context refresh to update header avatar/name and navigation profile
        await refreshUser();
        
        // Reset base64 local states
        setProfilePhotoBase64(null);
        setResumeBase64(null);
        setResumeName('');
        
        // Exit Edit Mode
        setIsEditingProfile(false);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const getProfileCompleteness = () => {
    if (!studentInfo) return { percent: 0, missing: [] };
    const items = [
      { label: 'Upload Profile Photo', val: studentInfo.user?.profilePhoto },
      { label: 'Add First Name', val: studentInfo.firstName },
      { label: 'Add Last Name', val: studentInfo.lastName },
      { label: 'Add Mobile Number', val: studentInfo.phone },
      { label: 'Add Personal Email', val: studentInfo.email },
      { label: 'Add Address', val: studentInfo.currentAddress },
      { label: 'Add Permanent Address', val: studentInfo.permanentAddress },
      { label: 'Add City', val: studentInfo.city },
      { label: 'Add PIN Code', val: studentInfo.pinCode },
      { label: 'Add Emergency Contact Phone', val: studentInfo.emergencyContactPhone },
      { label: 'Add Emergency Contact Name', val: studentInfo.emergencyContactName },
      { label: 'Add Emergency Contact Relationship', val: studentInfo.emergencyContactRelation },
      { label: 'Add Parent Mobile Number', val: studentInfo.parentPhone },
      { label: 'Add Parent Email', val: studentInfo.parentEmail },
      { label: 'Add Social Link (LinkedIn/GitHub/Portfolio)', val: studentInfo.linkedin || studentInfo.github || studentInfo.portfolio },
      { label: 'Add Technical/Soft Skills', val: studentInfo.technicalSkills || studentInfo.softSkills },
      { label: 'Upload Resume', val: studentInfo.resumeUrl },
      { label: 'Add Career Objective', val: studentInfo.careerObjective },
      { label: 'Add Areas of Interest', val: studentInfo.areasOfInterest },
    ];
    
    const completed = items.filter(i => i.val && String(i.val).trim() !== '');
    const percent = Math.round((completed.length / items.length) * 100);
    const missing = items.filter(i => !i.val || String(i.val).trim() === '').map(i => i.label);
    
    return { percent, missing };
  };

  if (isLoading) {
    return (
      <div className="flex h-[75vh] items-center justify-center">
        <Loading text="Initializing secure student environment..." />
      </div>
    );
  }

  const cardDetails = getIdCardDetails();
  const tabsList = [
    { id: 'overview', name: 'Overview', icon: Layers },
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'student_id', name: 'ID Card', icon: CreditCard },
    { id: 'ai_assistant', name: 'AI Adviser', icon: Cpu },
    { id: 'career_placements', name: 'Placements', icon: Briefcase },
    { id: 'campus_life', name: 'Clubs & Events', icon: Compass },
    { id: 'research_portfolio', name: 'Portfolio', icon: Trophy },
    { id: 'grievance_portal', name: 'Grievance', icon: ShieldAlert },
    { id: 'requests', name: 'Requests', icon: Send },
    { id: 'messages', name: 'Advisor Chat', icon: MessageSquare }
  ];

  return (
    <div className={`${isMobile ? 'flex flex-col space-y-4' : 'grid grid-cols-1 lg:grid-cols-4 gap-6'} animate-in fade-in-50 duration-200`}>
      
      {/* Student Command Bar Navigation (Desktop & Laptop sidebar) */}
      {!isMobile && (
        <div className="lg:col-span-1 border bg-card p-4 rounded-xl shadow-sm space-y-3.5 h-fit">
          
          {/* Profile Card Header */}
          <div className="flex flex-wrap items-center gap-3 pb-3 border-b border-slate-100">
            <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-extrabold text-lg overflow-hidden shrink-0 shadow-sm border border-slate-100">
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} className="h-full w-full object-cover" alt="Student Profile" />
              ) : (
                user ? `${user.firstName[0]}${user.lastName[0]}` : 'U'
              )}
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-black text-slate-800 truncate">{user?.firstName ? `${user.firstName} ${user.lastName}` : 'Unknown Student'}</h4>
              <span className="inline-block bg-primary/10 text-primary font-black px-1.5 py-0.5 rounded text-[8px] tracking-wider uppercase mt-1">
                STUDENT
              </span>
            </div>
          </div>

          {/* Academic Details List */}
          {studentInfo && (
            <div className="space-y-1.5 text-[9px] font-bold text-slate-600 border-b pb-3 border-slate-100">
              <p className="flex justify-between">
                <span className="text-slate-400">Reg No:</span>
                <span className="text-slate-800 font-extrabold">{cardDetails?.registerNo || 'N/A'}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-slate-400">Adm No:</span>
                <span className="text-slate-800 font-extrabold">{studentInfo.admissionNo || 'N/A'}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-slate-400">Roll No:</span>
                <span className="text-slate-800 font-extrabold">{cardDetails?.rollNo || 'N/A'}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-slate-400">Dept:</span>
                <span className="text-slate-800 truncate max-w-[120px]" title={studentInfo.department?.name}>{studentInfo.department?.code || 'N/A'}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-slate-400">Prog:</span>
                <span className="text-slate-800 truncate max-w-[120px]" title={studentInfo.program?.name}>{studentInfo.program?.code || 'N/A'}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-slate-400">Term:</span>
                <span className="text-slate-800 font-extrabold">Sem {studentInfo.semester?.number || 'N/A'} · Sec {studentInfo.section?.name || 'N/A'}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-slate-400">Acd Year:</span>
                <span className="text-slate-800">{studentInfo.academicYear?.name || 'N/A'}</span>
              </p>
            </div>
          )}


        </div>
      )}

      {/* Swipeable Tabs Bar (Mobile only) */}
      {isMobile && (
        <div className="flex flex-wrap overflow-x-auto gap-2 pb-2.5 pt-1 px-1 scrollbar-none shrink-0 border-b bg-card -mx-4 px-4 sticky top-0 z-20 shadow-sm">
          {tabsList.map(tab => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)} 
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected 
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Workspace Area */}
      <div className={isMobile ? 'flex-1 space-y-4' : 'lg:col-span-3 space-y-6'}>

        {/* OVERVIEW DASHBOARD */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-4 gap-4 animate-in slide-in-from-top-4 duration-300">
              <div className="border bg-card p-4 rounded-xl shadow-sm text-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Attendance Rate</span>
                <span className={`text-2xl font-extrabold block mt-2 ${attendance.overall < 75 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {attendance.overall}%
                </span>
                {attendance.overall < 75 && (
                  <span className="text-[9px] text-rose-500 font-semibold block mt-1 flex flex-wrap items-center justify-center gap-0.5">
                    <AlertTriangle className="h-3 w-3" /> Danger Warning
                  </span>
                )}
              </div>
              <div className="border bg-card p-4 rounded-xl shadow-sm text-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">CGPA Cumulative</span>
                <span className="text-2xl font-extrabold text-primary block mt-2">9.50</span>
                <span className="text-[9px] text-muted-foreground font-semibold block mt-1">Class Rank: 4th</span>
              </div>
              <div className="border bg-card p-4 rounded-xl shadow-sm text-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Pending Tasks</span>
                <span className="text-2xl font-extrabold text-amber-500 block mt-2">
                  {assignments.filter(a => a.status === 'PENDING').length}
                </span>
                <span className="text-[9px] text-muted-foreground font-semibold block mt-1">Assignments Dues</span>
              </div>
              <div className="border bg-card p-4 rounded-xl shadow-sm text-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Dues Balance</span>
                <span className="text-2xl font-extrabold text-rose-500 block mt-2">$2,500</span>
                <span className="text-[9px] text-muted-foreground font-semibold block mt-1">Tuition Dues</span>
              </div>
            </div>

            {/* Leave & OD Management Overview Card */}
            <div className="border bg-card p-4 rounded-xl shadow-sm flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-primary/5 via-card to-card">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-primary/10 text-primary font-black px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">Leave & OD Portal</span>
                  <span className="text-[10px] text-muted-foreground font-semibold">Total Filed: {requests.length}</span>
                </div>
                <h4 className="text-xs font-black text-foreground">Student Leave & On-Duty (OD) Approval Workflow</h4>
                <p className="text-[11px] text-muted-foreground">Apply for Leave or OD permissions, upload proof documents, and track multi-level Faculty Advisor, Class Advisor & HOD status.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => { setActiveTab('requests'); setRequestTab('LEAVE'); }}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm transition-all flex items-center gap-1.5"
                >
                  🌴 Apply Leave
                </button>
                <button
                  onClick={() => { setActiveTab('requests'); setRequestTab('OD'); }}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-sm transition-all flex items-center gap-1.5"
                >
                  🏆 Apply OD
                </button>
                <button
                  onClick={() => { setActiveTab('requests'); setRequestTab('HISTORY'); }}
                  className="px-3.5 py-1.5 rounded-lg border bg-background text-xs font-bold hover:bg-muted transition-all"
                >
                  📋 History ({requests.length})
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Daily Schedule */}
              <div className="border bg-card p-4 rounded-xl shadow-sm space-y-3">
                <h4 className="text-xs uppercase font-extrabold text-muted-foreground tracking-wider">Today's Class Timetable</h4>
                <div className="space-y-2">
                  {timetable.length > 0 ? (
                    timetable.slice(0, 3).map((slot, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 border rounded-lg bg-background">
                        <div>
                          <span className="text-[9px] font-bold text-primary tracking-wider uppercase">{slot.dayOfWeek} · Period {slot.slotIndex}</span>
                          <h5 className="text-xs font-bold">{slot.subject?.name}</h5>
                          <p className="text-[10px] text-muted-foreground">{slot.faculty?.firstName} {slot.faculty?.lastName} · Room {slot.roomNo}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground py-4">No scheduled periods for today.</p>
                  )}
                </div>
              </div>

              {/* Latest Announcements */}
              <div className="border bg-card p-4 rounded-xl shadow-sm space-y-3">
                <h4 className="text-xs uppercase font-extrabold text-muted-foreground tracking-wider">Academic Board Bulletins</h4>
                <div className="space-y-3">
                  {announcements.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">No recent circulars received.</p>
                  ) : (
                    announcements.map((item, idx) => (
                      <div key={idx} className="border-b last:border-b-0 pb-2.5 last:pb-0 space-y-1">
                        <div className="flex justify-between items-center">
                          <h5 className="text-xs font-bold text-foreground">{item.title}</h5>
                          <span className="text-[9px] text-muted-foreground font-semibold">{item.date}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">{item.content}</p>
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl.startsWith('http') ? item.imageUrl : `${(import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace('/api', '')}${item.imageUrl}`}
                            alt={item.title}
                            className="w-full max-h-36 object-cover rounded-lg border mt-1.5"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        )}
                        {item.attachmentUrl && (
                          <div className="mt-2">
                            <a
                              href={item.attachmentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-[9px] font-bold text-primary hover:underline"
                            >
                              <Download className="h-3 w-3" />
                              Download Attachment: {item.attachmentName || 'Document'}
                            </a>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 1. AI ACADEMIC ADVISER */}
        {activeTab === 'ai_assistant' && (
          <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4 h-[650px] flex flex-col" ref={(el) => { if (el && !aiHistoryLoaded) handleLoadAiHistory(); }}>
            <div className="flex justify-between items-center border-b pb-3 shrink-0">
              <div className="flex flex-wrap items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600 animate-pulse" />
                <div className="text-left">
                  <h3 className="text-sm font-extrabold uppercase">AI Study & Counselor Agent</h3>
                  <p className="text-[10px] text-muted-foreground">Context-Aware Academic Copilot</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <div className="flex border rounded-lg overflow-hidden text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setAiSubTab('academic')}
                    className={`px-3 py-1.5 transition-colors ${aiSubTab === 'academic' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted text-muted-foreground'}`}
                  >
                    💬 Doubt Assistant
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiSubTab('revision')}
                    className={`px-3 py-1.5 transition-colors ${aiSubTab === 'revision' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted text-muted-foreground'}`}
                  >
                    ⚡ Revision Assistant
                  </button>
                </div>
                {aiSubTab === 'academic' && (
                  <button
                    onClick={handleClearAiHistory}
                    className="text-[10px] text-rose-500 hover:text-rose-700 font-bold px-2 py-1.5 border border-rose-200 rounded-lg transition-colors"
                  >
                    🗑 Clear
                  </button>
                )}
              </div>
            </div>

            {/* Sub-tab 1: Doubt Solver Chat */}
            {aiSubTab === 'academic' && (
              <>
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto space-y-3 py-2 text-xs font-semibold pr-1">
                  {aiHistory.length === 0 && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center space-y-2 text-muted-foreground">
                        <Sparkles className="h-8 w-8 mx-auto opacity-30" />
                        <p className="text-xs">Loading your AI Adviser...</p>
                      </div>
                    </div>
                  )}
                  {aiHistory.map((item, idx) => {
                    const isUser = item.role === 'user' || item.sender === 'Me';
                    const text = item.content || item.text || '';
                    return (
                      <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                        {!isUser && (
                          <div className="h-7 w-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-2 mt-1 shrink-0 text-[10px] font-black">AI</div>
                        )}
                        <div className={`p-3 rounded-2xl max-w-[80%] whitespace-pre-line leading-relaxed text-left ${
                          isUser
                            ? 'bg-primary text-primary-foreground rounded-br-sm'
                            : 'bg-muted text-foreground rounded-bl-sm'
                        }`}>
                          {text}
                        </div>
                      </div>
                    );
                  })}
                  {aiLoading && (
                    <div className="flex justify-start">
                      <div className="h-7 w-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-2 shrink-0 text-[10px] font-black">AI</div>
                      <div className="p-3 rounded-2xl bg-muted text-foreground rounded-bl-sm">
                        <span className="inline-flex flex-wrap gap-1">
                          <span className="animate-bounce delay-0">●</span>
                          <span className="animate-bounce delay-150">●</span>
                          <span className="animate-bounce delay-300">●</span>
                        </span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Quick Action Chips */}
                <div className="flex flex-wrap gap-2 pb-1 overflow-x-auto text-[10px] font-bold shrink-0">
                  {[
                    { label: '📊 My Attendance', msg: 'What is my attendance percentage?' },
                    { label: '📝 My Grades', msg: 'Show me my current marks and GPA.' },
                    { label: '💰 Fee Status', msg: 'Do I have any pending fee dues?' },
                    { label: '📋 Assignments', msg: 'What assignments do I have pending?' },
                    { label: '🗓️ Timetable', msg: 'Tell me about my current semester schedule.' },
                  ].map((chip, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAiMessage(chip.msg)}
                      className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-full shrink-0 hover:bg-indigo-100 transition-colors"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* Input */}
                <form onSubmit={handleSendAiMessage} className="flex flex-wrap gap-2 border-t pt-3 shrink-0">
                  <input
                    type="text"
                    placeholder="Ask about attendance, grades, fees, assignments, hostel..."
                    value={aiMessage}
                    onChange={e => setAiMessage(e.target.value)}
                    disabled={aiLoading}
                    className="flex-1 h-10 border rounded-lg bg-background px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={aiLoading || !aiMessage.trim()}
                    className="h-10 w-10 bg-primary text-primary-foreground rounded-lg flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </>
            )}

            {/* Sub-tab 2: Revision Assistant Form */}
            {aiSubTab === 'revision' && (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs font-semibold text-left">
                <div className="bg-slate-50 border rounded-xl p-4 space-y-3.5">
                  <h4 className="text-[11px] font-extrabold uppercase tracking-wide text-indigo-700">Configure Revision Session</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px]">
                    <div className="flex flex-col gap-1">
                      <label className="uppercase text-[9px] font-bold text-muted-foreground">Target Course / Subject</label>
                      <select
                        value={revisionSubject}
                        onChange={e => setRevisionSubject(e.target.value)}
                        className="h-9 border bg-background rounded px-2.5 font-bold"
                      >
                        <option value="">Select subject...</option>
                        {subjects.map((sub, i) => (
                          <option key={i} value={sub.name}>{sub.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="uppercase text-[9px] font-bold text-muted-foreground">Revision Format</label>
                      <select
                        value={revisionFormat}
                        onChange={e => setRevisionFormat(e.target.value)}
                        className="h-9 border bg-background rounded px-2.5 font-bold"
                      >
                        <option value="Quick Revision Notes">Quick Revision Notes</option>
                        <option value="Important Topics">Important Topics</option>
                        <option value="Frequently Asked Questions">Frequently Asked Questions</option>
                        <option value="Important Formula Sheet">Important Formula Sheet</option>
                        <option value="Exam Tips">Exam Tips</option>
                        <option value="Last Minute Revision">Last Minute Revision</option>
                        <option value="One-Page Summary">One-Page Summary</option>
                        <option value="MCQ Practice">MCQ Practice</option>
                        <option value="Viva Questions">Viva Questions</option>
                        <option value="Flash Cards">Flash Cards</option>
                        <option value="Key Definitions">Key Definitions</option>
                        <option value="Memory Tricks">Memory Tricks</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="uppercase text-[9px] font-bold text-muted-foreground">Specific Topic or Chapter (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Unit 3 Dynamic Programming, Graph Traversals..."
                      value={revisionTopic}
                      onChange={e => setRevisionTopic(e.target.value)}
                      className="h-9 border bg-background rounded px-3"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateRevision}
                    disabled={revisionLoading || !revisionSubject}
                    className="w-full h-9 bg-primary text-primary-foreground rounded-lg font-bold flex flex-wrap items-center justify-center gap-1.5 hover:bg-primary/95 disabled:opacity-50 transition-colors"
                  >
                    {revisionLoading ? (
                      <>
                        <span className="animate-spin mr-1">⌛</span> Generating Study Ledger...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" /> Generate Revision Material
                      </>
                    )}
                  </button>
                </div>

                {revisionResult && (
                  <div className="border rounded-xl p-4 bg-background shadow-sm space-y-2.5">
                    <div className="flex justify-between items-center border-b pb-2 border-slate-100">
                      <h4 className="font-extrabold text-xs uppercase tracking-wider text-indigo-700">Generated Study Ledger</h4>
                      <button type="button" onClick={() => { navigator.clipboard.writeText(revisionResult); toast.success('Copied to clipboard'); }} className="text-[10px] text-muted-foreground hover:text-foreground">📋 Copy</button>
                    </div>
                    <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap select-text font-medium font-sans">
                      {revisionResult}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 2. DIGITAL STUDENT ID */}
        {activeTab === 'student_id' && (
          <div className="py-6 w-full">
            <DigitalIdCard role="Student" entityId={studentInfo?.id} />
          </div>
        )}
        {activeTab === 'student_id_legacy_disabled' && (
          <div className="flex flex-col items-center justify-center py-10 space-y-6">
            
            {/* Embedded styles for browser print dialog formatting */}
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                body * {
                  visibility: hidden !important;
                }
                #printable-id-card-area, #printable-id-card-area * {
                  visibility: visible !important;
                }
                #printable-id-card-area {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  height: 100% !important;
                  display: flex !important;
                  flex-direction: column !important;
                  align-items: center !important;
                  justify-content: center !important;
                  background: white !important;
                  gap: 20px !important;
                }
                .print-card-page {
                  width: 53.98mm !important;
                  height: 85.6mm !important;
                  page-break-after: always !important;
                  box-shadow: none !important;
                  border: 1px solid #cbd5e1 !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  display: flex !important;
                  flex-direction: column !important;
                  justify-content: space-between !important;
                  border-radius: 8px !important;
                  overflow: hidden !important;
                  background: #ffffff !important;
                }
                @page {
                  size: 54mm 86mm;
                  margin: 0;
                }
              }
            ` }} />

            {!studentInfo ? (
              <div className="text-center py-12 text-xs text-muted-foreground bg-card border rounded-xl w-full p-8 max-w-[340px]">
                <Loading text="Retrieving student credential registry..." />
              </div>
            ) : (() => {
              const details = getIdCardDetails();
              const brandColor = profileData?.brandColor || '#4f46e5';
              return (
                <>
                  {/* Warning message if photo is missing */}
                  {!studentInfo?.user?.profilePhoto && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-xs flex flex-wrap items-start gap-2.5 max-w-[340px] animate-in fade-in duration-200">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                      <div>
                        <p className="font-bold">Identity Photo Required</p>
                        <p className="mt-1">A valid student profile photo is required to download or print your official ID card. Please upload a photo under Settings.</p>
                      </div>
                    </div>
                  )}

                  {/* Front/Back Flip Toggles */}
                  <div className="flex flex-wrap gap-2 bg-muted p-1 rounded-lg text-xs font-bold shadow-sm">
                    <button 
                      onClick={() => setShowFrontSide(true)}
                      className={`px-4 py-1.5 rounded-md transition-all ${showFrontSide ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      Front Side
                    </button>
                    <button 
                      onClick={() => setShowFrontSide(false)}
                      className={`px-4 py-1.5 rounded-md transition-all ${!showFrontSide ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      Back Side
                    </button>
                  </div>

                  {/* On-screen Preview Card (CR80 Credit-card scale: 340px x 538px) */}
                  <div className="w-[340px] h-[538px] border border-slate-200 bg-white text-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col justify-between relative font-semibold transition-all duration-300">
                    {showFrontSide ? (
                      // FRONT SIDE PREVIEW
                      <>
                        {/* Top banner */}
                        <div style={{ backgroundColor: brandColor }} className="text-white p-5 text-center space-y-1">
                          <h2 className="text-xs font-extrabold tracking-wider">GEETORUS INSTITUTE OF TECHNOLOGY</h2>
                          <span className="text-[9px] uppercase tracking-widest block opacity-80">Official Student Identity Card</span>
                        </div>

                        {/* Photo & main details */}
                        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
                          <div className="h-28 w-28 rounded-full border-4 border-slate-100 bg-slate-100 flex items-center justify-center text-primary shadow overflow-hidden shrink-0">
                            {studentInfo?.user?.profilePhoto ? (
                              <img src={studentInfo.user.profilePhoto} alt="Student Profile" className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-4xl font-black text-slate-400">{studentInfo.firstName[0]}{studentInfo.lastName[0]}</span>
                            )}
                          </div>

                          <div className="text-center space-y-1 text-xs">
                            <h3 className="text-base font-black text-slate-900 leading-tight">{studentInfo.firstName} {studentInfo.lastName}</h3>
                            <span style={{ color: brandColor, backgroundColor: `${brandColor}15` }} className="inline-block font-black px-2 py-0.5 rounded text-[9px] tracking-wider uppercase mb-1">
                              STUDENT
                            </span>
                          </div>

                          {/* Details Table */}
                          <div className="w-full text-[11px] space-y-1.5 border-t pt-3 font-medium">
                            <div className="flex justify-between">
                              <span className="text-slate-500 font-bold">Admission No:</span>
                              <span className="text-slate-800 font-bold">{studentInfo.admissionNo}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500 font-bold">Register No:</span>
                              <span className="text-slate-800 font-bold">{details?.registerNo}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500 font-bold">Roll Number:</span>
                              <span className="text-slate-800 font-bold">{details?.rollNo}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500 font-bold">Program / Dept:</span>
                              <span className="text-slate-800 font-bold">{studentInfo.program?.code} / {studentInfo.department?.code}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500 font-bold">Sem / Section:</span>
                              <span className="text-slate-800 font-bold">{studentInfo.semester?.name} / {studentInfo.section?.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500 font-bold">Blood Group:</span>
                              <span className="text-slate-800 font-bold">{studentInfo.bloodGroup || 'N/A'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Barcode & Signatures footer */}
                        <div className="bg-slate-50 p-4 border-t flex justify-between items-center">
                          <div className="space-y-1">
                            <div className="w-32 h-6 bg-white flex items-center justify-center border font-mono text-[9px] tracking-[4px] text-slate-700 select-none">
                              ||||| | | |||| || ||| |
                            </div>
                            <span className="text-[7px] text-slate-400 font-bold block uppercase tracking-widest">{studentInfo.admissionNo}</span>
                          </div>
                          <div className="text-right">
                            <div className="h-9 flex items-end justify-center">
                              {profileData?.principalSignature ? (
                                <img src={profileData.principalSignature} className="h-8 object-contain" alt="Principal Signature" />
                              ) : (
                                <span className="font-mono text-indigo-700 text-xs italic tracking-widest leading-none mr-2">C. Xavier</span>
                              )}
                            </div>
                            <span className="text-[7px] text-slate-400 font-bold block uppercase tracking-widest border-t pt-0.5">Principal</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      // BACK SIDE PREVIEW
                      <>
                        {/* Top header */}
                        <div style={{ backgroundColor: brandColor }} className="text-white py-3.5 text-center">
                          <h2 className="text-[10px] font-extrabold tracking-wider">EMERGENCY INFORMATION & ADDRESS</h2>
                        </div>

                        {/* Info & terms */}
                        <div className="flex-1 flex flex-col p-5 space-y-4 text-xs">
                          <div className="space-y-2 border-b pb-3 font-medium">
                            <div className="flex">
                              <span className="w-24 text-slate-500 font-bold">Parent Name:</span>
                              <span className="text-slate-800 font-bold">{studentInfo.parentName}</span>
                            </div>
                            <div className="flex">
                              <span className="w-24 text-slate-500 font-bold">Emergency Phone:</span>
                              <span className="text-slate-800 font-bold">{studentInfo.parentPhone}</span>
                            </div>
                            <div className="flex">
                              <span className="w-24 text-slate-500 font-bold">College Address:</span>
                              <span className="text-slate-800 leading-tight font-bold max-w-[170px]">{profileData?.collegeAddress || '123 Education Boulevard, Campus City, 600001'}</span>
                            </div>
                            <div className="flex">
                              <span className="w-24 text-slate-500 font-bold">College Phone:</span>
                              <span className="text-slate-800 font-bold">{profileData?.collegePhone || '+91 98765 43210'}</span>
                            </div>
                            <div className="flex">
                              <span className="w-24 text-slate-500 font-bold">Website:</span>
                              <span className="text-slate-800 font-bold">{profileData?.collegeWebsite || 'https://geetorus.com'}</span>
                            </div>
                            <div className="flex">
                              <span className="w-24 text-slate-500 font-bold">Valid Until:</span>
                              <span className="text-slate-800 font-bold">{details?.validUntil}</span>
                            </div>
                          </div>

                          {/* Instructions box */}
                          <div className="bg-slate-50 border p-3 rounded-lg space-y-1.5 text-[9px] text-slate-600 leading-normal font-medium">
                            <p className="font-extrabold text-[10px] text-slate-700">INSTRUCTIONS:</p>
                            <p>1. This card is non-transferable and remains college property.</p>
                            <p>2. Must be visible at all times on campus premises.</p>
                            <p>3. Report loss immediately to the Registrar office.</p>
                            <p>4. If found, return to the administration department.</p>
                          </div>
                        </div>

                        {/* QR Code footer */}
                        <div className="bg-slate-50 p-4 border-t flex justify-between items-center">
                          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider max-w-[130px] leading-tight">
                            SCAN TO VERIFY CARD AUTHENTICITY AND RECORD
                          </span>
                          <div className="h-12 w-12 bg-white p-1 border rounded flex items-center justify-center shrink-0">
                            <img src={details?.qrUrl} alt="Verification QR Code" className="h-full w-full object-contain" />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Print and Download Action Buttons */}
                  <div className="flex flex-wrap gap-4">
                    <button 
                      onClick={handlePrintCard}
                      disabled={!studentInfo?.user?.profilePhoto}
                      className="flex flex-wrap items-center gap-1.5 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <Printer className="h-4 w-4" /> Print ID Card
                    </button>
                    <button 
                      onClick={handleDownloadPDF} 
                      disabled={downloading || !studentInfo?.user?.profilePhoto}
                      className="flex flex-wrap items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary/95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <Download className="h-4 w-4" /> {downloading ? 'Generating PDF...' : 'Download PDF'}
                    </button>
                  </div>

                  {/* Hidden print area containing physical layout templates */}
                  <div id="printable-id-card-area" className="hidden">
                    {/* FRONT SIDE */}
                    <div className="print-card-page" style={{ 
                      width: '340px', 
                      height: '538px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'space-between', 
                      backgroundColor: '#ffffff',
                      color: '#1e293b',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      position: 'relative',
                      border: 'none',
                      boxShadow: 'none',
                      margin: '0',
                      padding: '0',
                      boxSizing: 'border-box'
                    }}>
                      {/* Top banner */}
                      <div style={{ backgroundColor: brandColor }} className="text-white p-5 text-center space-y-1">
                        <h2 className="text-xs font-extrabold tracking-wider">GEETORUS INSTITUTE OF TECHNOLOGY</h2>
                        <span className="text-[9px] uppercase tracking-widest block opacity-80">Official Student Identity Card</span>
                      </div>

                      {/* Photo & main details */}
                      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
                        <div className="h-28 w-28 rounded-full border-4 border-slate-100 bg-slate-100 flex items-center justify-center text-primary shadow overflow-hidden shrink-0">
                          {studentInfo?.user?.profilePhoto ? (
                            <img src={studentInfo.user.profilePhoto} alt="Student Profile" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-4xl font-black text-slate-400">{studentInfo.firstName[0]}{studentInfo.lastName[0]}</span>
                          )}
                        </div>

                        <div className="text-center space-y-1 text-xs">
                          <h3 className="text-base font-black text-slate-900 leading-tight">{studentInfo.firstName} {studentInfo.lastName}</h3>
                          <span style={{ color: brandColor, backgroundColor: `${brandColor}15` }} className="inline-block font-black px-2 py-0.5 rounded text-[9px] tracking-wider uppercase mb-1">
                            STUDENT
                          </span>
                        </div>

                        {/* Details Table */}
                        <div className="w-full text-[11px] space-y-1.5 border-t pt-3 font-medium">
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-bold">Admission No:</span>
                            <span className="text-slate-800 font-bold">{studentInfo.admissionNo}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-bold">Register No:</span>
                            <span className="text-slate-800 font-bold">{details?.registerNo}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-bold">Roll Number:</span>
                            <span className="text-slate-800 font-bold">{details?.rollNo}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-bold">Program / Dept:</span>
                            <span className="text-slate-800 font-bold">{studentInfo.program?.code} / {studentInfo.department?.code}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-bold">Sem / Section:</span>
                            <span className="text-slate-800 font-bold">{studentInfo.semester?.name} / {studentInfo.section?.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-bold">Blood Group:</span>
                            <span className="text-slate-800 font-bold">{studentInfo.bloodGroup || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Barcode & Signatures footer */}
                      <div className="bg-slate-50 p-4 border-t flex justify-between items-center">
                        <div className="space-y-1">
                          <div className="w-32 h-6 bg-white flex items-center justify-center border font-mono text-[9px] tracking-[4px] text-slate-700 select-none">
                            ||||| | | |||| || ||| |
                          </div>
                          <span className="text-[7px] text-slate-400 font-bold block uppercase tracking-widest">{studentInfo.admissionNo}</span>
                        </div>
                        <div className="text-right">
                          <div className="h-9 flex items-end justify-center">
                            {profileData?.principalSignature ? (
                              <img src={profileData.principalSignature} className="h-8 object-contain" alt="Principal Signature" />
                            ) : (
                              <span className="font-mono text-indigo-700 text-xs italic tracking-widest leading-none mr-2">C. Xavier</span>
                            )}
                          </div>
                          <span className="text-[7px] text-slate-400 font-bold block uppercase tracking-widest border-t pt-0.5">Principal</span>
                        </div>
                      </div>
                    </div>

                    {/* BACK SIDE */}
                    <div className="print-card-page" style={{ 
                      width: '340px', 
                      height: '538px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'space-between', 
                      backgroundColor: '#ffffff',
                      color: '#1e293b',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      position: 'relative',
                      border: 'none',
                      boxShadow: 'none',
                      margin: '0',
                      padding: '0',
                      boxSizing: 'border-box'
                    }}>
                      {/* Top header */}
                      <div style={{ backgroundColor: brandColor }} className="text-white py-3.5 text-center">
                        <h2 className="text-[10px] font-extrabold tracking-wider">EMERGENCY INFORMATION & ADDRESS</h2>
                      </div>

                      {/* Info & terms */}
                      <div className="flex-1 flex flex-col p-5 space-y-4 text-xs">
                        <div className="space-y-2 border-b pb-3 font-medium">
                          <div className="flex">
                            <span className="w-24 text-slate-500 font-bold">Parent Name:</span>
                            <span className="text-slate-800 font-bold">{studentInfo.parentName}</span>
                          </div>
                          <div className="flex">
                            <span className="w-24 text-slate-500 font-bold">Emergency Phone:</span>
                            <span className="text-slate-800 font-bold">{studentInfo.parentPhone}</span>
                          </div>
                          <div className="flex">
                            <span className="w-24 text-slate-500 font-bold">College Address:</span>
                            <span className="text-slate-800 leading-tight font-bold max-w-[170px]">{profileData?.collegeAddress || '123 Education Boulevard, Campus City, 600001'}</span>
                          </div>
                          <div className="flex">
                            <span className="w-24 text-slate-500 font-bold">College Phone:</span>
                            <span className="text-slate-800 font-bold">{profileData?.collegePhone || '+91 98765 43210'}</span>
                          </div>
                          <div className="flex">
                            <span className="w-24 text-slate-500 font-bold">Website:</span>
                            <span className="text-slate-800 font-bold">{profileData?.collegeWebsite || 'https://geetorus.com'}</span>
                          </div>
                          <div className="flex">
                            <span className="w-24 text-slate-500 font-bold">Valid Until:</span>
                            <span className="text-slate-800 font-bold">{details?.validUntil}</span>
                          </div>
                        </div>

                        {/* Instructions box */}
                        <div className="bg-slate-50 border p-3 rounded-lg space-y-1.5 text-[9px] text-slate-600 leading-normal font-medium">
                          <p className="font-extrabold text-[10px] text-slate-700">INSTRUCTIONS:</p>
                          <p>1. This card is non-transferable and remains college property.</p>
                          <p>2. Must be visible at all times on campus premises.</p>
                          <p>3. Report loss immediately to the Registrar office.</p>
                          <p>4. If found, return to the administration department.</p>
                        </div>
                      </div>

                      {/* QR Code footer */}
                      <div className="bg-slate-50 p-4 border-t flex justify-between items-center">
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider max-w-[130px] leading-tight">
                          SCAN TO VERIFY CARD AUTHENTICITY AND RECORD
                        </span>
                        <div className="h-12 w-12 bg-white p-1 border rounded flex items-center justify-center shrink-0">
                          <img src={details?.qrUrl} alt="Verification QR Code" className="h-full w-full object-contain" />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* 3. CAREER & PLACEMENTS */}
        {activeTab === 'career_placements' && (
          <div className="space-y-6">
            
            {/* Career roadmaps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border bg-card p-4 rounded-xl shadow-sm space-y-1">
                <span className="text-[9px] uppercase font-bold text-muted-foreground block">Placement Readiness</span>
                <span className="text-2xl font-extrabold text-emerald-500">92 / 100</span>
                <p className="text-[9px] text-muted-foreground mt-1">Excellent aptitude & interview readiness</p>
              </div>
              <div className="border bg-card p-4 rounded-xl shadow-sm space-y-1">
                <span className="text-[9px] uppercase font-bold text-muted-foreground block">Resume Score</span>
                <span className="text-2xl font-extrabold text-primary">85%</span>
                <p className="text-[9px] text-muted-foreground mt-1">ATS Checked · Tailored to Software roles</p>
              </div>
              <div className="border bg-card p-4 rounded-xl shadow-sm space-y-1">
                <span className="text-[9px] uppercase font-bold text-muted-foreground block">Coding Practice</span>
                <span className="text-2xl font-extrabold text-amber-500">120 Solved</span>
                <p className="text-[9px] text-muted-foreground mt-1">Target Path: Full Stack Rust Developer</p>
              </div>
            </div>

            {/* Placements drives */}
            <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold uppercase border-b pb-2">Active Placement Drives</h3>
              <div className="space-y-3 text-xs font-semibold">
                {jobs.map((job) => (
                  <div key={job.id} className="p-3.5 border rounded-lg bg-background flex flex-col md:flex-row justify-between md:items-center gap-3">
                    <div>
                      <h4 className="font-bold text-foreground">{job.company} · {job.role}</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Package: {job.lpa} LPA · Drive Date: {job.date}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`text-[10px] font-bold ${job.eligibility === 'ELIGIBLE' ? 'text-emerald-600' : 'text-rose-600'}`}>{job.eligibility}</span>
                      {job.eligibility === 'ELIGIBLE' && (
                        <button
                          disabled={job.status === 'APPLIED'}
                          onClick={() => {
                            const updated = jobs.map(j => j.id === job.id ? { ...j, status: 'APPLIED' } : j);
                            setJobs(updated);
                            toast.success(`Application registered for ${job.company}`);
                          }}
                          className={`px-3 py-1.5 rounded text-[10px] font-bold ${
                            job.status === 'APPLIED' ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground'
                          }`}
                        >
                          {job.status === 'APPLIED' ? 'Applied' : 'Apply Now'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skill certifications tracker */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Add and view skills */}
              <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4">
                <h3 className="text-sm font-extrabold uppercase border-b pb-2">Skill Tracker</h3>
                <form onSubmit={handleAddSkill} className="flex flex-wrap gap-2 text-xs font-semibold">
                  <input
                    type="text"
                    required
                    placeholder="Enter skill name (e.g. Docker)..."
                    value={newSkillName}
                    onChange={e => setNewSkillName(e.target.value)}
                    className="flex-1 h-9 border rounded bg-background px-3"
                  />
                  <select
                    value={newSkillLevel}
                    onChange={e => setNewSkillLevel(e.target.value)}
                    className="h-9 border rounded bg-background px-2"
                  >
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                  </select>
                  <button type="submit" className="px-3 bg-primary text-primary-foreground rounded font-bold hover:bg-primary/95">
                    Add
                  </button>
                </form>

                <div className="space-y-2 pt-2 text-xs font-semibold">
                  {skills.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2.5 border rounded bg-background">
                      <span>{item.name} · <span className="text-[10px] text-muted-foreground">{item.level}</span></span>
                      <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                        item.verified ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}>{item.verified ? 'Verified' : 'Pending Verification'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Internship Tracker */}
              <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4">
                <h3 className="text-sm font-extrabold uppercase border-b pb-2">Internships Tracker</h3>
                <form onSubmit={handleApplyInternship} className="space-y-3 text-xs font-semibold">
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Company Name..."
                      value={internCompany}
                      onChange={e => setInternCompany(e.target.value)}
                      className="flex-1 h-9 border rounded bg-background px-3"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Duration (e.g. 6 Months)..."
                      value={internDuration}
                      onChange={e => setInternDuration(e.target.value)}
                      className="w-32 h-9 border rounded bg-background px-3"
                    />
                  </div>
                  <button type="submit" className="w-full h-9 bg-primary text-primary-foreground rounded font-bold hover:bg-primary/95">
                    File Internship Approval Request
                  </button>
                </form>

                <div className="space-y-3 pt-2 text-xs font-semibold">
                  {internships.length === 0 ? (
                    <p className="text-muted-foreground italic text-center py-4">No internships registered yet.</p>
                  ) : (
                    internships.map((item, idx) => {
                      const isExpanded = activeInternshipId === item.id;
                      return (
                        <div key={idx} className="border rounded-xl bg-background p-3.5 space-y-3 text-left">
                          <div
                            className="flex justify-between items-center cursor-pointer select-none"
                            onClick={() => setActiveInternshipId(isExpanded ? null : item.id)}
                          >
                            <div>
                              <h5 className="font-extrabold text-slate-800">{item.company}</h5>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{item.duration} · Credits: {item.credits}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                              <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                                item.status === 'APPROVED' ? 'bg-emerald-50 border border-emerald-200 text-emerald-600' :
                                item.status === 'REJECTED' ? 'bg-rose-50 border border-rose-200 text-rose-500' :
                                'bg-amber-50 border border-amber-200 text-amber-600'
                              }`}>{item.status}</span>
                              <span className="text-muted-foreground text-[10px]">{isExpanded ? '▲' : '▼'}</span>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="border-t pt-3.5 space-y-3.5 animate-in fade-in-50 duration-150">
                              {/* Upload Form */}
                              <div className="bg-slate-50 p-3 rounded-lg border space-y-2.5">
                                <h6 className="text-[10px] font-extrabold uppercase text-indigo-700 tracking-wide">Upload Internship Document</h6>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                                  <div className="flex flex-col gap-1">
                                    <label className="text-[9px] uppercase font-bold text-muted-foreground">Document Type</label>
                                    <select
                                      value={uploadDocType}
                                      onChange={e => setUploadDocType(e.target.value)}
                                      className="h-8 border bg-background rounded px-2 font-bold"
                                    >
                                      <option value="Offer Letter">Offer Letter</option>
                                      <option value="Internship Completion Certificate">Internship Completion Certificate</option>
                                      <option value="Joining Letter">Joining Letter</option>
                                      <option value="Experience Letter">Experience Letter</option>
                                      <option value="Internship Report">Internship Report</option>
                                      <option value="Weekly Report">Weekly Report</option>
                                      <option value="Daily Log Book">Daily Log Book</option>
                                      <option value="Project Report">Project Report</option>
                                      <option value="Evaluation Form">Evaluation Form</option>
                                      <option value="NOC Letter">NOC Letter</option>
                                      <option value="Company ID Card">Company ID Card</option>
                                      <option value="Company Approval Letter">Company Approval Letter</option>
                                      <option value="PPT Presentation">PPT Presentation</option>
                                      <option value="ZIP Archive">ZIP Archive</option>
                                    </select>
                                  </div>

                                  <div className="flex flex-col gap-1">
                                    <label className="text-[9px] uppercase font-bold text-muted-foreground">Select File (Max 25MB)</label>
                                    <input
                                      type="file"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          setInternshipFile(file);
                                        }
                                      }}
                                      className="h-8 border bg-background rounded px-2 pt-1 font-mono text-[9px] overflow-hidden"
                                    />
                                  </div>
                                </div>

                                {internshipFile && (
                                  <p className="text-[9px] text-muted-foreground font-mono truncate">
                                    Selected: {internshipFile.name} ({(internshipFile.size / 1024 / 1024).toFixed(2)} MB)
                                  </p>
                                )}

                                {internUploadProgress > 0 && (
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[8px] text-muted-foreground font-bold">
                                      <span>Uploading document...</span>
                                      <span>{internUploadProgress}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                      <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${internUploadProgress}%` }}></div>
                                    </div>
                                  </div>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleUploadInternshipDoc(item.id)}
                                  disabled={isInternUploading || !internshipFile}
                                  className="w-full h-8 bg-indigo-600 text-white rounded font-bold text-[10px] hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                >
                                  {isInternUploading ? 'Uploading...' : 'Upload Document'}
                                </button>
                              </div>

                              {/* Documents list */}
                              <div className="space-y-2">
                                <h6 className="text-[10px] font-extrabold uppercase text-slate-700 tracking-wide">Uploaded Documents</h6>
                                {(!item.documents || item.documents.length === 0) ? (
                                  <p className="text-[10px] text-muted-foreground italic">No documents uploaded yet.</p>
                                ) : (
                                  <div className="space-y-2">
                                    {item.documents.map((doc: any, dIdx: number) => (
                                      <div key={dIdx} className="flex justify-between items-center p-2.5 border rounded-lg bg-slate-50 text-[10px]">
                                        <div className="text-left max-w-[60%]">
                                          <p className="font-extrabold text-slate-800">{doc.documentType}</p>
                                          <p className="text-[9px] text-muted-foreground truncate mt-0.5">{doc.fileName}</p>
                                          <p className="text-[8px] text-muted-foreground mt-0.5">{(doc.fileSize / 1024 / 1024).toFixed(2)} MB · {new Date(doc.uploadedAt || doc.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className={`text-[8px] px-1.5 py-0.5 rounded font-black tracking-wider uppercase border ${
                                            doc.verificationStatus === 'VERIFIED' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                                            doc.verificationStatus === 'REJECTED' ? 'bg-rose-50 border-rose-200 text-rose-500' :
                                            'bg-amber-50 border-amber-200 text-amber-600'
                                          }`}>{doc.verificationStatus}</span>
                                          <div className="flex flex-wrap gap-1.5">
                                            <button
                                              type="button"
                                              onClick={() => setPreviewFile({ url: getFileUrl(doc.fileUrl), name: doc.fileName, type: doc.documentType })}
                                              className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded px-2 py-1 bg-white hover:bg-indigo-50/50"
                                            >
                                              View
                                            </button>
                                            <a
                                              href={getFileUrl(doc.fileUrl)}
                                              download={doc.fileName}
                                              className="text-[9px] font-bold text-slate-600 hover:text-slate-800 border border-slate-200 rounded px-2 py-1 bg-white hover:bg-slate-50/50"
                                            >
                                              Download
                                            </a>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. CAMPUS CLUBS & EVENTS */}
        {activeTab === 'campus_life' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Clubs and societies */}
            <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold uppercase border-b pb-2">Clubs & Societies</h3>
              <div className="space-y-3 text-xs font-semibold">
                {clubs.map((club, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 border rounded-lg bg-background">
                    <div>
                      <h4 className="font-bold">{club.name}</h4>
                      <span className="text-[10px] text-muted-foreground block">Technical Club</span>
                    </div>

                    {club.status === 'MEMBER' ? (
                      <span className="text-[9px] text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded font-extrabold uppercase">Member</span>
                    ) : (
                      <button
                        onClick={() => {
                          const updated = clubs.map((c, i) => i === idx ? { ...c, status: 'MEMBER' } : c);
                          setClubs(updated);
                          toast.success(`Membership request sent to ${club.name}`);
                        }}
                        className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-[10px] font-bold"
                      >
                        Join Club
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Events Board */}
            <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold uppercase border-b pb-2">Events Registration</h3>
              <div className="space-y-3 text-xs font-semibold">
                <div className="p-3 border rounded-lg bg-background flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-bold bg-primary/10 text-primary border px-1.5 py-0.5 rounded uppercase">HACKATHON</span>
                    <h4 className="font-bold mt-1.5">Campus HackFest 2026</h4>
                    <p className="text-[9px] text-muted-foreground mt-0.5">Date: 2026-07-26 · Prizes: $5,000</p>
                  </div>

                  {registeredEvents.includes('1') ? (
                    <button
                      onClick={() => {
                        setRegisteredEvents(registeredEvents.filter(e => e !== '1'));
                        toast.success('Registration cancelled.');
                      }}
                      className="px-3 py-1.5 border rounded text-[10px] font-bold text-rose-500 hover:bg-muted"
                    >
                      Cancel Entry
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setRegisteredEvents([...registeredEvents, '1']);
                        toast.success('Registered successfully! Entry ticket generated.');
                      }}
                      className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-[10px] font-bold"
                    >
                      Register
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* 5. RESEARCH & PORTFOLIO */}
        {activeTab === 'research_portfolio' && (
          <div className="space-y-6">
            
            {/* Add Project */}
            <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold uppercase border-b pb-2">Add Project / Publication</h3>
              <form onSubmit={handleAddProject} className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-semibold">
                <input
                  type="text"
                  required
                  placeholder="Project Title..."
                  value={newProjectTitle}
                  onChange={e => setNewProjectTitle(e.target.value)}
                  className="h-9 border rounded bg-background px-3"
                />
                <input
                  type="text"
                  required
                  placeholder="Technologies used (e.g. Rust)..."
                  value={newProjectTech}
                  onChange={e => setNewProjectTech(e.target.value)}
                  className="h-9 border rounded bg-background px-3"
                />
                <input
                  type="text"
                  required
                  placeholder="GitHub Repository Link..."
                  value={newProjectLink}
                  onChange={e => setNewProjectLink(e.target.value)}
                  className="h-9 border rounded bg-background px-3"
                />
                <button type="submit" className="md:col-span-3 h-9 bg-primary text-primary-foreground rounded font-bold hover:bg-primary/95">
                  Publish to Department Project Repository
                </button>
              </form>
            </div>

            {/* List logged projects */}
            <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold uppercase border-b pb-2">Project Repository Mappings</h3>
              <div className="space-y-3 text-xs font-semibold">
                {projects.map((item, idx) => (
                  <div key={idx} className="p-3.5 border rounded-lg bg-background flex flex-col md:flex-row justify-between md:items-center gap-3">
                    <div>
                      <h4 className="font-bold">{item.title}</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Stack: {item.tech} · Faculty Guide: {item.guide}</p>
                    </div>
                    <a href={`https://${item.link}`} target="_blank" rel="noreferrer" className="text-[10px] text-primary flex flex-wrap items-center gap-0.5 hover:underline font-bold">
                      GitHub Source <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* 6. GRIEVANCE & FEEDBACK */}
        {activeTab === 'grievance_portal' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Lodge Grievance */}
            <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4 md:col-span-1">
              <h3 className="text-sm font-extrabold uppercase border-b pb-2">Lodge Feedback / Grievance</h3>
              <form onSubmit={handleGrievanceSubmit} className="space-y-4 text-xs font-semibold">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Category</label>
                  <select
                    value={grievanceCategory}
                    onChange={e => setGrievanceCategory(e.target.value)}
                    className="h-9 border rounded bg-background px-3"
                  >
                    <option value="ACADEMIC">Academic Complaint</option>
                    <option value="FACULTY">Faculty Feedback</option>
                    <option value="INFRASTRUCTURE">Infrastructure Complaint</option>
                    <option value="HOSTEL">Hostel Complaint</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Complaint Subject</label>
                  <input
                    type="text"
                    required
                    value={grievanceTitle}
                    onChange={e => setGrievanceTitle(e.target.value)}
                    placeholder="e.g. Wi-Fi latency in Library"
                    className="h-9 border rounded bg-background px-3"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Detailed description</label>
                  <textarea
                    required
                    value={grievanceText}
                    onChange={e => setGrievanceText(e.target.value)}
                    placeholder="Provide details here..."
                    className="h-20 border rounded bg-background p-2.5"
                  />
                </div>

                <button type="submit" className="w-full h-9 bg-primary text-primary-foreground rounded font-bold hover:bg-primary/95">
                  Submit Feedback
                </button>
              </form>
            </div>

            {/* View logged grievances */}
            <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4 md:col-span-2">
              <h3 className="text-sm font-extrabold uppercase border-b pb-2">My Filed Grievances</h3>
              <div className="space-y-3 text-xs font-semibold">
                {submittedGrievances.map((item, idx) => (
                  <div key={idx} className="p-3.5 border rounded-lg bg-background flex justify-between items-center">
                    <div>
                      <span className="text-[9px] font-bold bg-primary/10 text-primary border px-1.5 py-0.5 rounded uppercase">{item.category}</span>
                      <h4 className="font-bold mt-1.5">{item.title}</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Filed Date: {item.date}</p>
                    </div>
                    <span className="text-[10px] font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase">{item.status}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* MY PROFILE */}
        {activeTab === 'profile' && (() => {
          const completeness = getProfileCompleteness();
          const cardDetails = getIdCardDetails();
          
          return (
            <div className="space-y-6">
              
              {/* Profile Completeness Header */}
              <div className="border bg-card p-6 rounded-xl shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <h3 className="text-sm font-extrabold uppercase text-slate-900">Student Profile Credentials</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Manage your personal identity, contact logs, skills registry, and credentials</p>
                  </div>
                  {!isEditingProfile && (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary/95 shadow-sm transition-all"
                    >
                      ✏️ Edit Profile Settings
                    </button>
                  )}
                </div>

                {/* Completeness Indicator */}
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                    <span className="flex flex-wrap items-center gap-1.5">
                      📊 Profile Completeness Registry
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                      completeness.percent >= 80 ? 'bg-emerald-50 text-emerald-600' :
                      completeness.percent >= 50 ? 'bg-amber-50 text-amber-600' :
                      'bg-rose-50 text-rose-600'
                    }`}>
                      {completeness.percent}% Completed
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500" 
                      style={{ width: `${completeness.percent}%` }}
                    />
                  </div>
                  {completeness.missing.length > 0 ? (
                    <div className="text-[10px] text-muted-foreground space-y-1 pt-1.5 border-t">
                      <span className="font-bold text-slate-700">💡 Suggested Actions to Complete Profile:</span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {completeness.missing.slice(0, 4).map((m, idx) => (
                          <span key={idx} className="bg-slate-200/60 border text-slate-600 px-2 py-0.5 rounded-md font-bold">
                            + {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-emerald-600 font-extrabold">🎉 Congratulations! Your profile records are fully complete.</p>
                  )}
                </div>
              </div>

              {isEditingProfile ? (
                // ==========================================
                // EDIT PROFILE FORM MODE
                // ==========================================
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  
                  {/* Photo & Basic Details card */}
                  <div className="border bg-card p-6 rounded-xl shadow-sm space-y-6">
                    <h4 className="text-xs uppercase font-extrabold text-primary tracking-wider border-b pb-2">Profile Photo & Identity</h4>
                    
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      {/* Avatar preview */}
                      <div className="relative h-24 w-24 rounded-full border-4 border-slate-100 bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 group shadow-md">
                        {profilePhotoBase64 ? (
                          <img src={profilePhotoBase64} alt="Preview" className="h-full w-full object-cover" />
                        ) : studentInfo?.user?.profilePhoto ? (
                          <img src={studentInfo.user.profilePhoto} alt="Current" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-3xl font-black text-slate-300 uppercase">{studentInfo?.firstName[0]}{studentInfo?.lastName[0]}</span>
                        )}
                      </div>

                      {/* Photo actions */}
                      <div className="space-y-2 text-center md:text-left">
                        <label className="inline-block px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors">
                          📷 Upload New Photo
                          <input 
                            type="file" 
                            accept="image/jpeg,image/jpg,image/png,image/webp" 
                            onChange={handlePhotoUpload} 
                            className="hidden" 
                          />
                        </label>
                        <p className="text-[9px] text-muted-foreground">Supported formats: JPG, JPEG, PNG, WEBP. Images are automatically resized locally for fast processing.</p>
                      </div>
                    </div>

                    {/* Name Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-600 font-bold">First Name <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          required
                          value={formData.firstName}
                          onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                          className="h-9 border rounded bg-background px-3"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-600 font-bold">Last Name <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          required
                          value={formData.lastName}
                          onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                          className="h-9 border rounded bg-background px-3"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-600 font-bold">Preferred Name (Optional)</label>
                        <input
                          type="text"
                          value={formData.preferredName}
                          onChange={e => setFormData({ ...formData, preferredName: e.target.value })}
                          className="h-9 border rounded bg-background px-3"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Personal & Contact details */}
                  <div className="border bg-card p-6 rounded-xl shadow-sm space-y-4">
                    <h4 className="text-xs uppercase font-extrabold text-primary tracking-wider border-b pb-2">Personal & Contact Registry</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-600 font-bold">Personal Email Address</label>
                        <input
                          type="email"
                          placeholder="e.g. john.smith@gmail.com"
                          value={formData.email}
                          onChange={e => setFormData({ ...formData, email: e.target.value })}
                          className="h-9 border rounded bg-background px-3"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-600 font-bold">Mobile Number (10 Digits)</label>
                        <input
                          type="tel"
                          placeholder="e.g. 9876543210"
                          value={formData.phone}
                          onChange={e => setFormData({ ...formData, phone: e.target.value })}
                          className="h-9 border rounded bg-background px-3"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-600 font-bold">Alternate Mobile Number</label>
                        <input
                          type="tel"
                          placeholder="e.g. 9876543211"
                          value={formData.altPhone}
                          onChange={e => setFormData({ ...formData, altPhone: e.target.value })}
                          className="h-9 border rounded bg-background px-3"
                        />
                      </div>
                    </div>

                    {/* Address details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold mt-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-600 font-bold">Current Mailing Address</label>
                        <textarea
                          placeholder="Current residential address..."
                          value={formData.currentAddress}
                          onChange={e => setFormData({ ...formData, currentAddress: e.target.value })}
                          className="h-20 border rounded bg-background p-2.5 font-medium"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-600 font-bold">Permanent Address</label>
                        <textarea
                          placeholder="Permanent legal address..."
                          value={formData.permanentAddress}
                          onChange={e => setFormData({ ...formData, permanentAddress: e.target.value })}
                          className="h-20 border rounded bg-background p-2.5 font-medium"
                        />
                      </div>
                    </div>

                    {/* Location breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-5 gap-3 text-xs font-semibold mt-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-600 font-bold">City</label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={e => setFormData({ ...formData, city: e.target.value })}
                          className="h-9 border rounded bg-background px-3"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-600 font-bold">District</label>
                        <input
                          type="text"
                          value={formData.district}
                          onChange={e => setFormData({ ...formData, district: e.target.value })}
                          className="h-9 border rounded bg-background px-3"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-600 font-bold">State</label>
                        <input
                          type="text"
                          value={formData.state}
                          onChange={e => setFormData({ ...formData, state: e.target.value })}
                          className="h-9 border rounded bg-background px-3"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-600 font-bold">Country</label>
                        <input
                          type="text"
                          value={formData.country}
                          onChange={e => setFormData({ ...formData, country: e.target.value })}
                          className="h-9 border rounded bg-background px-3"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-600 font-bold">PIN Code (6 digits)</label>
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="600001"
                          value={formData.pinCode}
                          onChange={e => setFormData({ ...formData, pinCode: e.target.value })}
                          className="h-9 border rounded bg-background px-3"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Emergency contacts card */}
                  <div className="border bg-card p-6 rounded-xl shadow-sm space-y-4">
                    <h4 className="text-xs uppercase font-extrabold text-primary tracking-wider border-b pb-2">Emergency Contact Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-600 font-bold">Contact Person Name</label>
                        <input
                          type="text"
                          value={formData.emergencyContactName}
                          onChange={e => setFormData({ ...formData, emergencyContactName: e.target.value })}
                          className="h-9 border rounded bg-background px-3"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-600 font-bold">Contact Phone Number</label>
                        <input
                          type="tel"
                          value={formData.emergencyContactPhone}
                          onChange={e => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                          className="h-9 border rounded bg-background px-3"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-600 font-bold">Contact Relationship</label>
                        <input
                          type="text"
                          placeholder="e.g. Father, Mother, Brother"
                          value={formData.emergencyContactRelation}
                          onChange={e => setFormData({ ...formData, emergencyContactRelation: e.target.value })}
                          className="h-9 border rounded bg-background px-3"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Parent Information card */}
                  <div className="border bg-card p-6 rounded-xl shadow-sm space-y-4">
                    <h4 className="text-xs uppercase font-extrabold text-primary tracking-wider border-b pb-2">Parent / Guardian Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-600 font-bold">Parent Mobile Number</label>
                        <input
                          type="tel"
                          value={formData.parentPhone}
                          onChange={e => setFormData({ ...formData, parentPhone: e.target.value })}
                          className="h-9 border rounded bg-background px-3"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-600 font-bold">Parent Email Address</label>
                        <input
                          type="email"
                          value={formData.parentEmail}
                          onChange={e => setFormData({ ...formData, parentEmail: e.target.value })}
                          className="h-9 border rounded bg-background px-3"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Social Links card */}
                  <div className="border bg-card p-6 rounded-xl shadow-sm space-y-4">
                    <h4 className="text-xs uppercase font-extrabold text-primary tracking-wider border-b pb-2">Professional Social Links</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-600 font-bold">LinkedIn Profile URL</label>
                        <input
                          type="url"
                          placeholder="https://linkedin.com/in/username"
                          value={formData.linkedin}
                          onChange={e => setFormData({ ...formData, linkedin: e.target.value })}
                          className="h-9 border rounded bg-background px-3"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-600 font-bold">GitHub Profile URL</label>
                        <input
                          type="url"
                          placeholder="https://github.com/username"
                          value={formData.github}
                          onChange={e => setFormData({ ...formData, github: e.target.value })}
                          className="h-9 border rounded bg-background px-3"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-600 font-bold">Portfolio Website URL</label>
                        <input
                          type="url"
                          placeholder="https://portfolio.me"
                          value={formData.portfolio}
                          onChange={e => setFormData({ ...formData, portfolio: e.target.value })}
                          className="h-9 border rounded bg-background px-3"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Skills card */}
                  <div className="border bg-card p-6 rounded-xl shadow-sm space-y-4">
                    <h4 className="text-xs uppercase font-extrabold text-primary tracking-wider border-b pb-2">Skills & Certifications</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-600 font-bold">Technical Skills (Comma-separated)</label>
                        <input
                          type="text"
                          placeholder="e.g. React, Node.js, Rust, Docker"
                          value={formData.technicalSkills}
                          onChange={e => setFormData({ ...formData, technicalSkills: e.target.value })}
                          className="h-9 border rounded bg-background px-3"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-600 font-bold">Soft Skills (Comma-separated)</label>
                        <input
                          type="text"
                          placeholder="e.g. Leadership, Public Speaking, Agile"
                          value={formData.softSkills}
                          onChange={e => setFormData({ ...formData, softSkills: e.target.value })}
                          className="h-9 border rounded bg-background px-3"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-600 font-bold">Languages Known (Comma-separated)</label>
                        <input
                          type="text"
                          placeholder="e.g. English, Spanish, German"
                          value={formData.languagesKnown}
                          onChange={e => setFormData({ ...formData, languagesKnown: e.target.value })}
                          className="h-9 border rounded bg-background px-3"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-600 font-bold">Certifications (Comma-separated)</label>
                        <input
                          type="text"
                          placeholder="e.g. AWS Cloud Practitioner, Scrum Master"
                          value={formData.certifications}
                          onChange={e => setFormData({ ...formData, certifications: e.target.value })}
                          className="h-9 border rounded bg-background px-3"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Placements & objective card */}
                  <div className="border bg-card p-6 rounded-xl shadow-sm space-y-4">
                    <h4 className="text-xs uppercase font-extrabold text-primary tracking-wider border-b pb-2">Placement & Career Details</h4>
                    
                    <div className="flex flex-col gap-1.5 text-xs font-semibold">
                      <label className="text-[10px] text-slate-600 font-bold">Career Objective</label>
                      <textarea
                        placeholder="Write your career aspiration statement..."
                        value={formData.careerObjective}
                        onChange={e => setFormData({ ...formData, careerObjective: e.target.value })}
                        className="h-20 border rounded bg-background p-2.5 font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold mt-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-600 font-bold">Areas of Interest (Comma-separated)</label>
                        <input
                          type="text"
                          placeholder="e.g. Web Development, Deep Learning, Cloud Architecture"
                          value={formData.areasOfInterest}
                          onChange={e => setFormData({ ...formData, areasOfInterest: e.target.value })}
                          className="h-9 border rounded bg-background px-3"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-600 font-bold">Resume Upload (PDF/Word up to 5MB)</label>
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="h-9 px-3 bg-white border border-slate-200 rounded flex items-center justify-center text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors shrink-0">
                            📎 Choose File
                            <input 
                              type="file" 
                              accept=".pdf,.doc,.docx" 
                              onChange={handleResumeUpload} 
                              className="hidden" 
                            />
                          </label>
                          <span className="text-[10px] text-muted-foreground truncate">
                            {resumeName ? `New Selected: ${resumeName}` : studentInfo?.resumeUrl ? '✅ Existing Resume Uploaded' : 'No file selected'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submission and controls */}
                  <div className="flex flex-wrap justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingProfile(false);
                        setProfilePhotoBase64(null);
                        setResumeBase64(null);
                        setResumeName('');
                      }}
                      className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold shadow-sm transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {savingProfile ? 'Saving profile changes...' : 'Save Profile Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                // ==========================================
                // READ-ONLY PROFILE VIEWER MODE
                // ==========================================
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Column: Photo card & Completeness suggestions */}
                  <div className="lg:col-span-1 space-y-6">
                    {/* Visual profile card */}
                    <div className="border bg-card p-6 rounded-xl shadow-sm text-center flex flex-col items-center justify-center space-y-4">
                      <div className="h-28 w-28 rounded-full border-4 border-slate-100 bg-slate-100 flex items-center justify-center text-primary shadow overflow-hidden shrink-0">
                        {studentInfo?.user?.profilePhoto ? (
                          <img src={studentInfo.user.profilePhoto} alt="Student Profile" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-4xl font-black text-slate-300 uppercase">{studentInfo.firstName[0]}{studentInfo.lastName[0]}</span>
                        )}
                      </div>
                      <div>
                        <h4 className="text-base font-black text-slate-900 leading-tight">{studentInfo.firstName} {studentInfo.lastName}</h4>
                        {studentInfo.preferredName && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">"{studentInfo.preferredName}"</p>
                        )}
                        <span className="inline-block bg-primary/10 text-primary font-black px-2 py-0.5 rounded text-[9px] tracking-wider uppercase mt-2 select-none">
                          STUDENT
                        </span>
                      </div>

                      {/* Contact items */}
                      <div className="w-full text-left text-xs font-semibold pt-4 border-t space-y-2 text-slate-600">
                        <p className="truncate">📧 {studentInfo.email || user.email}</p>
                        <p>📞 {studentInfo.phone || 'No Mobile Number added'}</p>
                        {studentInfo.altPhone && <p>📞 {studentInfo.altPhone} (Alt)</p>}
                        {studentInfo.city && <p>📍 {studentInfo.city}, {studentInfo.state || studentInfo.country}</p>}
                      </div>
                    </div>

                    {/* Missing actions list box */}
                    {completeness.missing.length > 0 && (
                      <div className="border bg-card p-5 rounded-xl shadow-sm space-y-3">
                        <h4 className="text-xs uppercase font-extrabold text-slate-700">Missing Credentials</h4>
                        <div className="space-y-2 text-[10px] font-bold text-slate-600">
                          {completeness.missing.map((missingItem, idx) => (
                            <div key={idx} className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-50 border rounded-lg">
                              <span className="text-rose-500">❌</span>
                              <span>{missingItem}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Social profiles card */}
                    {(studentInfo.linkedin || studentInfo.github || studentInfo.portfolio) && (
                      <div className="border bg-card p-5 rounded-xl shadow-sm space-y-3">
                        <h4 className="text-xs uppercase font-extrabold text-slate-700">Social Connections</h4>
                        <div className="space-y-2 text-xs font-bold">
                          {studentInfo.linkedin && (
                            <a href={studentInfo.linkedin} target="_blank" rel="noopener noreferrer" className="flex flex-wrap items-center gap-2 p-2 border rounded-lg hover:bg-slate-50 transition-colors">
                              🔗 LinkedIn Profile
                            </a>
                          )}
                          {studentInfo.github && (
                            <a href={studentInfo.github} target="_blank" rel="noopener noreferrer" className="flex flex-wrap items-center gap-2 p-2 border rounded-lg hover:bg-slate-50 transition-colors">
                              💻 GitHub Repository
                            </a>
                          )}
                          {studentInfo.portfolio && (
                            <a href={studentInfo.portfolio} target="_blank" rel="noopener noreferrer" className="flex flex-wrap items-center gap-2 p-2 border rounded-lg hover:bg-slate-50 transition-colors">
                              🌐 Portfolio Website
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Grid Details Viewer */}
                  <div className="lg:col-span-2 space-y-6">
                    
                    {/* Academic & Placement details */}
                    <div className="border bg-card p-6 rounded-xl shadow-sm space-y-4">
                      <h4 className="text-xs uppercase font-extrabold text-primary tracking-wider border-b pb-2">Academic Placement Details</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                        <div className="space-y-2 bg-slate-50 border border-slate-100 p-3 rounded-lg relative">
                          <span className="absolute top-2 right-2 text-[9px]" title="Institution Managed Field">🔒 Institution Managed</span>
                          <p className="text-slate-500 text-[10px]">Academic Enrolment</p>
                          <p className="text-slate-800">Admission No: <span className="font-extrabold">{studentInfo.admissionNo}</span></p>
                          <p className="text-slate-800">Register No: <span className="font-extrabold">{cardDetails?.registerNo}</span></p>
                          <p className="text-slate-800">Roll Number: <span className="font-extrabold">{cardDetails?.rollNo}</span></p>
                          <p className="text-slate-800">Admission Date: <span className="font-extrabold">{studentInfo.dateOfAdmission ? new Date(studentInfo.dateOfAdmission).toLocaleDateString() : 'N/A'}</span></p>
                        </div>

                        <div className="space-y-2 bg-slate-50 border border-slate-100 p-3 rounded-lg relative">
                          <span className="absolute top-2 right-2 text-[9px]" title="Institution Managed Field">🔒 Institution Managed</span>
                          <p className="text-slate-500 text-[10px]">Academic Placement</p>
                          <p className="text-slate-800">Department: <span className="font-extrabold">{studentInfo.department?.name}</span></p>
                          <p className="text-slate-800">Program: <span className="font-extrabold">{studentInfo.program?.name} ({studentInfo.program?.code})</span></p>
                          <p className="text-slate-800">Semester/Section: <span className="font-extrabold">{studentInfo.semester?.name} / {studentInfo.section?.name}</span></p>
                          <p className="text-slate-800">Academic Term: <span className="font-extrabold">{studentInfo.academicYear?.name}</span></p>
                        </div>
                      </div>
                    </div>

                    {/* Address & Emergency Info Viewer */}
                    <div className="border bg-card p-6 rounded-xl shadow-sm space-y-4">
                      <h4 className="text-xs uppercase font-extrabold text-primary tracking-wider border-b pb-2">Personal & Emergency Contact Details</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                        <div className="space-y-2">
                          <p className="text-slate-500 text-[10px]">Address Details</p>
                          <p className="text-slate-800 font-bold leading-relaxed">{studentInfo.currentAddress || 'No current address added'}</p>
                          {studentInfo.pinCode && <p className="text-slate-500">PIN Code: <span className="text-slate-800 font-bold">{studentInfo.pinCode}</span></p>}
                          {studentInfo.permanentAddress && (
                            <div className="border-t pt-2 mt-2">
                              <p className="text-slate-500 text-[10px]">Permanent Address</p>
                              <p className="text-slate-800 font-bold leading-relaxed">{studentInfo.permanentAddress}</p>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2 bg-slate-50 border p-3 rounded-lg">
                          <p className="text-slate-500 text-[10px]">Emergency Coordinates</p>
                          {studentInfo.emergencyContactName ? (
                            <>
                              <p className="text-slate-800">Contact: <span className="font-extrabold">{studentInfo.emergencyContactName}</span></p>
                              <p className="text-slate-800">Mobile: <span className="font-extrabold">{studentInfo.emergencyContactPhone}</span></p>
                              <p className="text-slate-800">Relation: <span className="font-extrabold">{studentInfo.emergencyContactRelation}</span></p>
                            </>
                          ) : (
                            <p className="text-slate-400 italic">No Emergency contact information logged.</p>
                          )}
                          
                          <div className="border-t pt-2 mt-2 space-y-1">
                            <p className="text-slate-500 text-[10px]">Parent Coordinates</p>
                            <p className="text-slate-800">Parent Name: <span className="font-bold">{studentInfo.parentName}</span></p>
                            <p className="text-slate-800">Parent Mobile: <span className="font-bold">{studentInfo.parentPhone}</span></p>
                            {studentInfo.parentEmail && <p className="text-slate-800">Parent Email: <span className="font-bold">{studentInfo.parentEmail}</span></p>}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Skills & Resume details */}
                    {(studentInfo.technicalSkills || studentInfo.softSkills || studentInfo.resumeUrl || studentInfo.careerObjective) && (
                      <div className="border bg-card p-6 rounded-xl shadow-sm space-y-4">
                        <h4 className="text-xs uppercase font-extrabold text-primary tracking-wider border-b pb-2">Skills & Credentials Records</h4>
                        
                        {studentInfo.careerObjective && (
                          <div className="text-xs font-medium bg-slate-50 p-3 border rounded-lg">
                            <p className="text-slate-500 text-[10px] font-bold">Career Objective</p>
                            <p className="text-slate-700 italic leading-relaxed mt-1">"{studentInfo.careerObjective}"</p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold pt-2">
                          {studentInfo.technicalSkills && (
                            <div>
                              <p className="text-slate-500 text-[10px]">Technical Skills</p>
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {studentInfo.technicalSkills.split(',').map((s: string, idx: number) => (
                                  <span key={idx} className="bg-indigo-50 border text-indigo-700 px-2 py-0.5 rounded-md font-bold">
                                    {s.trim()}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {studentInfo.softSkills && (
                            <div>
                              <p className="text-slate-500 text-[10px]">Soft Skills</p>
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {studentInfo.softSkills.split(',').map((s: string, idx: number) => (
                                  <span key={idx} className="bg-slate-100 border text-slate-700 px-2 py-0.5 rounded-md font-bold">
                                    {s.trim()}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {studentInfo.resumeUrl && (
                          <div className="border-t pt-3 flex justify-between items-center text-xs">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-lg">📄</span>
                              <div>
                                <p className="font-bold text-slate-800">Student Professional Resume</p>
                                <p className="text-[9px] text-muted-foreground">Uploaded & Verified on department records</p>
                              </div>
                            </div>
                            <a 
                              href={studentInfo.resumeUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="px-3 py-1.5 bg-primary text-primary-foreground font-bold rounded-lg text-[10px] hover:bg-primary/95 transition-all"
                            >
                              Download Resume
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Change Password Form (Security subpanel) */}
                    <div className="border bg-card p-6 rounded-xl shadow-sm space-y-4">
                      <h4 className="text-xs uppercase font-extrabold text-primary tracking-wider border-b pb-2">Security & Credentials Management</h4>
                      <form onSubmit={handlePasswordUpdate} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end text-xs font-semibold">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-slate-600 font-bold">Current Password</label>
                          <input
                            type="password"
                            required
                            value={currentPassword}
                            onChange={e => setCurrentPassword(e.target.value)}
                            className="h-9 border rounded bg-background px-3"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-slate-600 font-bold">New Password</label>
                          <input
                            type="password"
                            required
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            className="h-9 border rounded bg-background px-3"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-slate-600 font-bold">Confirm New Password</label>
                          <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className="h-9 border rounded bg-background px-3"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={changingPassword}
                          className="md:col-span-3 h-9 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/95 transition-colors disabled:opacity-50"
                        >
                          {changingPassword ? 'Verifying & updating password...' : 'Update Password & Terminate Other Device Sessions'}
                        </button>
                      </form>
                    </div>

                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* MY SUBJECTS */}
        {activeTab === 'subjects' && (
          <div className="space-y-6">
            <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold uppercase border-b pb-2">Academic Subjects & Faculty Mappings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subjects.map((sub, idx) => (
                  <div key={idx} className="p-4 border rounded-xl bg-background space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-bold bg-primary/10 text-primary border px-1.5 py-0.5 rounded">{sub.code}</span>
                        <span className="text-[10px] font-bold text-muted-foreground">{sub.credits} Credits</span>
                      </div>
                      <h4 className="text-xs font-bold mt-2">{sub.name}</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Faculty Coordinator: {sub.faculty}</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 pt-3 border-t">
                      <button className="flex flex-wrap-1 flex items-center justify-center gap-1 py-1.5 border rounded text-[10px] font-bold hover:bg-muted">
                        <BookOpen className="h-3 w-3" /> Notes
                      </button>
                    </div>
                  </div>
                ))}
              </div>
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
            <div className="border bg-card p-4 md:p-5 rounded-xl shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b pb-2">
                <h3 className="text-sm font-extrabold uppercase">Current Semester Period Allocations</h3>
                {isMobile && (
                  <span className="text-[10px] text-primary font-bold uppercase">
                    Select a day to view schedules
                  </span>
                )}
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

              <div className="space-y-3">
                {filteredTimetable.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic text-center py-6">No classes scheduled for {isMobile ? selectedTimetableDay : 'this day'}.</p>
                ) : (
                  filteredTimetable.map((slot, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3.5 border rounded-lg bg-background hover:shadow-sm transition-all">
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-primary tracking-wider uppercase">
                          {slot.dayOfWeek} · Period {slot.slotIndex}
                        </span>
                        <h4 className="text-xs font-bold">{slot.subject?.name || slot.subject}</h4>
                        <p className="text-[10px] text-muted-foreground">{slot.faculty?.firstName} {slot.faculty?.lastName} · Location: {slot.roomNo}</p>
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-muted px-2.5 py-1 rounded shrink-0">
                        {slot.startTime} - {slot.endTime}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })()}

        {/* ATTENDANCE */}
        {activeTab === 'attendance' && (
          <div className="border bg-card p-4 md:p-5 rounded-xl shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b pb-2">
              <h3 className="text-sm font-extrabold uppercase font-sans">Detailed Attendance Ledger</h3>
              <button 
                onClick={handleDownloadAttendancePDF} 
                disabled={downloadingAttendance}
                className="flex flex-wrap items-center justify-center gap-1.5 px-4 py-2 border rounded-lg text-xs font-bold hover:bg-muted bg-primary text-primary-foreground hover:bg-primary/95 disabled:opacity-50 transition-all shadow-sm"
              >
                <Download className="h-3.5 w-3.5" /> 
                {downloadingAttendance ? 'Generating PDF...' : 'Download Report (PDF)'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Overall Circular Progress stats */}
              <div className="border rounded-xl p-5 bg-background shadow-sm flex flex-col items-center justify-center text-center space-y-4">
                <h4 className="text-xs uppercase font-extrabold text-muted-foreground tracking-wider">Overall Attendance Progress</h4>
                
                {/* SVG Progress Ring */}
                <div className="relative flex items-center justify-center">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="54" stroke="hsl(var(--muted))" strokeWidth="10" fill="transparent" />
                    <circle 
                      cx="64" 
                      cy="64" 
                      r="54" 
                      stroke={attendance?.overall < 75 ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'} 
                      strokeWidth="10" 
                      fill="transparent" 
                      strokeDasharray={2 * Math.PI * 54}
                      strokeDashoffset={2 * Math.PI * 54 * (1 - (attendance?.overall || 0) / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-2xl font-black">{attendance?.overall}%</span>
                    <span className="text-[8px] uppercase tracking-wider text-muted-foreground font-black">Overall</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full text-center text-xs font-bold pt-3 border-t">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Attended</span>
                    <span className="text-foreground text-sm font-extrabold">{attendance?.presentClasses} / {attendance?.totalClasses}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Absent</span>
                    <span className="text-rose-500 text-sm font-extrabold">{attendance?.absentClasses} classes</span>
                  </div>
                </div>
              </div>

              {/* Subject Attendance Matrix */}
              <div className="space-y-4">
                <h4 className="text-xs uppercase font-extrabold text-muted-foreground tracking-wider">Subject Attendance Matrix</h4>
                <div className="space-y-3 text-xs font-semibold">
                  {attendance?.subjectWise?.map((item: any, idx: number) => (
                    <div key={idx} className="p-3 border rounded-lg bg-background space-y-2 hover:shadow-sm transition-all">
                      <div className="flex justify-between items-center">
                        <span className="font-bold">{item.name}</span>
                        <span className={`font-bold ${item.percent < 75 ? 'text-rose-500' : 'text-emerald-500'}`}>{item.percent}%</span>
                      </div>
                      <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                        <div className={`h-full ${item.percent < 75 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${item.percent}%` }} />
                      </div>
                      <p className="text-[9px] text-muted-foreground">{item.present} Present / {item.total} Total Periods</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ASSIGNMENTS */}
        {activeTab === 'assignments' && (
          <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-extrabold uppercase">Assignments & Upload Solutions</h3>
              <span className="text-[10px] text-muted-foreground font-bold">
                {assignments.filter((a: any) => !a.mySubmission).length} Pending
              </span>
            </div>
            {assignments.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">No assignments found for your current semester.</p>
            ) : (
              <div className="space-y-3 text-xs font-semibold">
                {assignments.map((item: any, idx: number) => {
                  const mySubmission = item.mySubmission;
                  const isLate = item.dueDate && new Date() > new Date(item.dueDate);
                  return (
                    <div key={item.id || idx} className="p-3.5 border rounded-lg bg-background flex flex-col md:flex-row justify-between md:items-center gap-3">
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">
                          {item.targetSubject || item.subject?.name || item.subject || 'N/A'} · {item.targetClass || item.section?.name || ''}
                        </span>
                        <h4 className="text-xs font-bold">{item.title}</h4>
                        <p className={`text-[10px] font-bold ${isLate ? 'text-rose-500' : 'text-amber-500'}`}>
                          {isLate ? '⚠️ Overdue · ' : '📅 Due: '}
                          {item.dueDate ? new Date(item.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : item.due}
                        </p>
                        {item.description && (
                          <p className="text-[10px] text-muted-foreground">{item.description}</p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 shrink-0">
                        {mySubmission ? (
                          <div className="text-right space-y-1">
                            <div className="flex flex-wrap items-center gap-2 justify-end">
                              <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold uppercase ${
                                mySubmission.status === 'GRADED' ? 'bg-emerald-50 text-emerald-600' :
                                mySubmission.status === 'LATE' ? 'bg-amber-50 text-amber-600' :
                                'bg-blue-50 text-blue-600'
                              }`}>{mySubmission.status}</span>
                              
                              {/* Re-submit/Replace Button */}
                              {mySubmission.status !== 'GRADED' && (
                                <button
                                  onClick={() => setSelectedAssignment(item)}
                                  className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 underline"
                                >
                                  Replace
                                </button>
                              )}
                            </div>
                            
                            {mySubmission.fileUrl && (
                              <div className="flex flex-wrap items-center justify-end gap-1 text-[9px] text-indigo-600">
                                <FileText className="h-3 w-3" />
                                <a 
                                  href={mySubmission.fileUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="hover:underline max-w-[120px] truncate"
                                  title={mySubmission.fileName || 'View Submission'}
                                >
                                  {mySubmission.fileName || 'View File'}
                                </a>
                              </div>
                            )}

                            {mySubmission.submittedAt && (
                              <p className="text-[9px] text-muted-foreground">
                                Submitted: {new Date(mySubmission.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} {new Date(mySubmission.submittedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            )}

                            {mySubmission.marksObtained != null && (
                              <p className="text-[10px] text-muted-foreground">Score: {mySubmission.marksObtained}/{item.maxMarks}</p>
                            )}
                            {mySubmission.feedback && (
                              <p className="text-[10px] text-emerald-700 italic font-medium">"{mySubmission.feedback}"</p>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedAssignment(item)}
                            className={`px-3 py-1.5 text-[10px] font-bold rounded hover:opacity-90 ${
                              isLate ? 'bg-rose-500 text-white' : 'bg-primary text-primary-foreground'
                            }`}
                          >
                            {isLate ? 'Submit Late' : 'Submit Solution'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {selectedAssignment && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="w-full max-w-md border bg-card p-6 rounded-2xl shadow-xl space-y-4 text-xs font-semibold">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-extrabold uppercase">Submit Solution</h3>
                    <button onClick={() => { setSelectedAssignment(null); setSelectedFile(null); }} className="text-muted-foreground hover:text-foreground">✕</button>
                  </div>
                  <form onSubmit={handleSubmitAssignment} className="space-y-4">
                    <p className="text-muted-foreground">Uploading solution for: <span className="font-bold text-foreground">{selectedAssignment.title}</span></p>
                    <p className="text-[10px] text-muted-foreground">Subject: {selectedAssignment.subject?.name || selectedAssignment.subject}</p>
                    
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      className="hidden" 
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar,.jpg,.jpeg,.png,.webp"
                    />

                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col gap-1.5 border border-dashed rounded p-4 text-center cursor-pointer hover:bg-muted/10"
                    >
                      <Upload className="h-5 w-5 mx-auto text-muted-foreground" />
                      {selectedFile ? (
                        <div className="space-y-1">
                          <span className="text-[10px] text-indigo-600 font-bold block truncate">{selectedFile.name}</span>
                          <span className="text-[9px] text-slate-400 block">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                        </div>
                      ) : (
                        <>
                          <span className="text-[10px]">Attach solution file (PDF, DOCX, ZIP etc. up to 25MB)</span>
                          <span className="text-[9px] text-muted-foreground">Drag & Drop or click to choose file</span>
                        </>
                      )}
                    </div>

                    {isUploading && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] text-muted-foreground">
                          <span>Uploading...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-indigo-600 h-full transition-all duration-300" 
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap justify-end gap-2 pt-2">
                      <button 
                        type="button" 
                        onClick={() => { setSelectedAssignment(null); setSelectedFile(null); }} 
                        className="px-4 py-2 border rounded font-bold hover:bg-muted"
                        disabled={isUploading}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="px-4 py-2 bg-primary text-primary-foreground rounded font-bold hover:bg-primary/95 disabled:opacity-50"
                        disabled={isUploading || !selectedFile}
                      >
                        {isUploading ? 'Submitting...' : 'Submit Solution'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}


        {/* MID/TERM EXAMS */}
        {activeTab === 'exams' && (
          <div className="border bg-card p-5 rounded-xl shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-extrabold uppercase">Mid-Term / Term Examination Cards</h3>
              <button onClick={() => setIsHallTicketOpen(true)} className="flex flex-wrap items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs font-bold hover:bg-primary/90">
                <FileText className="h-4 w-4" /> Download Hall Ticket
              </button>
            </div>

            <div className="space-y-3">
              {exams.map((item, idx) => (
                <div key={idx} className="p-4 border rounded-xl bg-background grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-primary tracking-wider">Subject</span>
                    <h4 className="text-xs font-bold mt-0.5">{item.subject}</h4>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-primary tracking-wider">Date & Time</span>
                    <p className="text-xs mt-0.5">{item.date} · {item.time}</p>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-primary tracking-wider">Room Allocation</span>
                    <p className="text-xs mt-0.5">{item.hall} (Seat: {item.seat})</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Hall Ticket Printable Modal */}
            {isHallTicketOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="w-full max-w-2xl border bg-card p-8 rounded-2xl shadow-xl space-y-6 text-xs font-semibold max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-start border-b pb-4">
                    <div>
                      <h2 className="text-sm font-extrabold tracking-wider uppercase text-primary">GEETORUS INSTITUTE OF TECHNOLOGY</h2>
                      <span className="text-[10px] text-muted-foreground block font-bold">End Semester Examinations Hall Ticket - Fall 2026</span>
                    </div>
                    <button onClick={() => setIsHallTicketOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-4 gap-4 bg-muted/20 p-4 rounded-xl">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-muted-foreground block">Student Name</span>
                      <span className="font-bold">{user.firstName} {user.lastName}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-muted-foreground block">Register No</span>
                      <span className="font-mono font-bold">{profileData?.rollNo || 'CS2026001'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-muted-foreground block">Department</span>
                      <span className="font-bold">Computer Science</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-muted-foreground block">Academic Year</span>
                      <span className="font-bold">2026-2027</span>
                    </div>
                  </div>

                  <div className="w-full overflow-x-auto max-w-[90vw] md:max-w-full pb-2 scrollbar-thin"><table className="w-full text-xs text-left border">
                    <thead>
                      <tr className="border-b bg-muted/30 text-[9px] uppercase font-bold text-muted-foreground">
                        <th className="p-2.5">Subject Code</th>
                        <th className="p-2.5">Subject Name</th>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Session</th>
                        <th className="p-2.5">Hall No</th>
                        <th className="p-2.5 text-center">Invigilator Sign</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exams.map((item, idx) => (
                        <tr key={idx} className="border-b last:border-b-0">
                          <td className="p-2.5 font-bold">CS610{idx+1}</td>
                          <td className="p-2.5">{item.subject}</td>
                          <td className="p-2.5 font-mono">{item.date}</td>
                          <td className="p-2.5">{item.time}</td>
                          <td className="p-2.5 font-mono">{item.hall.split('-')[1] || 'Room 102'}</td>
                          <td className="p-2.5 text-center text-muted-foreground italic">__________</td>
                        </tr>
                      ))}
                    </tbody>
                  </table></div>

                  <div className="border-t pt-4 space-y-2">
                    <h4 className="text-[10px] uppercase font-bold text-primary tracking-wider">Candidate Instructions</h4>
                    <ul className="list-disc list-inside text-[9px] text-muted-foreground space-y-1">
                      <li>Candidates must present this Hall Ticket and Student ID card to enter the hall.</li>
                      <li>Calculators, cellular devices, and other digital interfaces are strictly prohibited inside.</li>
                      <li>Be seated at least 15 minutes before the commencement of the examination.</li>
                    </ul>
                  </div>

                  <div className="flex flex-wrap justify-end gap-2 pt-2 border-t">
                    <button type="button" onClick={() => setIsHallTicketOpen(false)} className="px-4 py-2 border rounded font-bold hover:bg-muted">Close</button>
                    <button type="button" onClick={() => { window.print(); }} className="px-4 py-2 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700">Print Hall Ticket</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MARKS & RESULTS */}
        {activeTab === 'marks' && (() => {
          const details = getIdCardDetails();
          return (
            <div className="border bg-card p-5 rounded-xl shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-extrabold uppercase">Internal Marks & Semester Transcripts</h3>
              <button 
                onClick={handleDownloadMarksPDF} 
                disabled={downloadingMarks}
                className="flex flex-wrap items-center gap-1 px-3 py-1.5 border rounded text-xs font-bold hover:bg-muted bg-primary text-primary-foreground hover:bg-primary/95 disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" /> {downloadingMarks ? 'Generating PDF...' : 'Download Transcript (PDF)'}
              </button>
            </div>

            {isMobile ? (
              <div className="space-y-3">
                {marks.map((item, idx) => (
                  <div key={idx} className="p-4 border rounded-xl bg-background space-y-3 hover:shadow-sm transition-all text-xs font-semibold">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-extrabold text-slate-800 text-xs">{item.subject}</span>
                      <span className="bg-indigo-50 border px-2 py-0.5 rounded text-[10px] text-indigo-600 font-extrabold uppercase">{item.grade}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <span className="text-slate-400 block uppercase">Internal Marks</span>
                        <span className="text-slate-800 font-bold font-mono text-sm">{item.internal} / 40</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase">External Marks</span>
                        <span className="text-slate-800 font-bold font-mono text-sm">{item.external} / 60</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase">Total Score</span>
                        <span className="text-primary font-extrabold font-mono text-sm">{item.total} / 100</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase">Grade Points</span>
                        <span className="text-slate-800 font-bold font-mono text-sm">{item.gpa}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full overflow-x-auto max-w-[90vw] md:max-w-full pb-2 scrollbar-thin"><table className="w-full text-xs text-left border">
                <thead>
                  <tr className="border-b bg-muted/20 text-[9px] uppercase font-bold text-muted-foreground">
                    <th className="p-2.5">Subject</th>
                    <th className="p-2.5 text-center">Internal Marks (40)</th>
                    <th className="p-2.5 text-center">External Marks (60)</th>
                    <th className="p-2.5 text-center">Total Score (100)</th>
                    <th className="p-2.5 text-center">Grade Letter</th>
                    <th className="p-2.5 text-center">Grade Points</th>
                  </tr>
                </thead>
                <tbody>
                  {marks.map((item, idx) => (
                    <tr key={idx} className="border-b last:border-b-0 hover:bg-muted/10 font-semibold">
                      <td className="p-2.5 font-bold">{item.subject}</td>
                      <td className="p-2.5 text-center font-mono">{item.internal}</td>
                      <td className="p-2.5 text-center font-mono">{item.external}</td>
                      <td className="p-2.5 text-center font-mono text-primary">{item.total}</td>
                      <td className="p-2.5 text-center">
                        <span className="bg-indigo-50 border px-2 py-0.5 rounded text-[10px] text-indigo-600 font-extrabold uppercase">{item.grade}</span>
                      </td>
                      <td className="p-2.5 text-center font-mono">{item.gpa}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            )}

            {/* Printable Marksheet Container */}
            <div id="printable-marksheet-area" className="hidden" style={{ width: '794px', height: '1123px', boxSizing: 'border-box' }}>
              <div className="p-12 h-full flex flex-col justify-between" style={{ fontFamily: 'Inter, sans-serif' }}>
                <div className="space-y-6">
                  {/* Top Header/Branding */}
                  <div className="flex items-center justify-between border-b pb-4 border-slate-300">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="h-14 w-14 bg-indigo-600 rounded flex items-center justify-center text-white text-xl font-bold">
                        G
                      </div>
                      <div className="text-left">
                        <h1 className="text-base font-extrabold text-slate-900 tracking-wide uppercase">Geetorus Institute of Technology</h1>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Official Semester Grade Ledger</p>
                        <p className="text-[9px] text-slate-400">123 Education Boulevard, Campus City, 600001</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] px-2 py-0.5 rounded font-black text-indigo-700 bg-indigo-50 tracking-wider border border-indigo-100 uppercase">
                        Official Transcript
                      </span>
                    </div>
                  </div>

                  {/* Student Details Section */}
                  <div className="bg-slate-50 rounded-xl p-4 border grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5 text-[10px] text-left">
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[9px] block">Student Name</span>
                      <span className="text-slate-800 font-extrabold text-xs">{studentInfo?.firstName} {studentInfo?.lastName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[9px] block">Register Number</span>
                      <span className="text-slate-800 font-extrabold text-xs">{details?.registerNo || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[9px] block">Admission Number</span>
                      <span className="text-slate-800 font-bold">{studentInfo?.admissionNo}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[9px] block">Roll Number</span>
                      <span className="text-slate-800 font-bold">{details?.rollNo || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[9px] block">Academic Program / Dept</span>
                      <span className="text-slate-800 font-bold">{studentInfo?.program?.name || 'N/A'} / {studentInfo?.department?.name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[9px] block">Semester / Section</span>
                      <span className="text-slate-800 font-bold">{studentInfo?.semester?.name || 'N/A'} · {studentInfo?.section?.name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[9px] block">Academic Year</span>
                      <span className="text-slate-800 font-bold">{studentInfo?.academicYear?.name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[9px] block">Examination Type</span>
                      <span className="text-slate-800 font-bold">End-Semester Examinations</span>
                    </div>
                  </div>

                  {/* Subject wise marks table */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider text-left">Subject-Wise Performance</h3>
                    <div className="w-full overflow-x-auto max-w-[90vw] md:max-w-full pb-2 scrollbar-thin"><table className="w-full text-[10px] text-left border border-slate-200 rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-[9px] uppercase font-bold text-slate-600">
                          <th className="p-3">Subject Code</th>
                          <th className="p-3">Subject Name</th>
                          <th className="p-3 text-center">Credits</th>
                          <th className="p-3 text-center">Internal</th>
                          <th className="p-3 text-center">External</th>
                          <th className="p-3 text-center">Total</th>
                          <th className="p-3 text-center">Grade</th>
                          <th className="p-3 text-center">GP</th>
                          <th className="p-3 text-center">Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {marks.map((item: any, idx: number) => (
                          <tr key={idx} className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50 font-semibold text-slate-700">
                            <td className="p-3 font-mono font-bold text-slate-900">{item.code || 'CS610' + (idx+1)}</td>
                            <td className="p-3 text-slate-900">{item.subject}</td>
                            <td className="p-3 text-center font-mono">{item.credits || 4}</td>
                            <td className="p-3 text-center font-mono">{item.internal}</td>
                            <td className="p-3 text-center font-mono">{item.external}</td>
                            <td className="p-3 text-center font-mono text-indigo-600 font-bold">{item.total}</td>
                            <td className="p-3 text-center">
                              <span className="bg-indigo-50 border px-1.5 py-0.5 rounded text-[9px] text-indigo-600 font-bold uppercase">{item.grade}</span>
                            </td>
                            <td className="p-3 text-center font-mono">{item.gpa}</td>
                            <td className="p-3 text-center">
                              <span className={`text-[9px] font-bold ${item.result === 'PASS' ? 'text-emerald-600' : 'text-rose-500'}`}>{item.result || 'PASS'}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table></div>
                  </div>

                  {/* Summary/Grades Section */}
                  <div className="flex flex-wrap gap-4">
                    <div className="flex-1 border rounded-xl p-4 bg-slate-50 flex items-center justify-around text-center border-slate-200">
                      <div>
                        <span className="text-slate-400 font-bold uppercase text-[8px] block">Semester GPA</span>
                        <span className="text-lg font-black text-indigo-700 font-mono">
                          {(marks.reduce((acc, m) => acc + (m.gpa || 0), 0) / marks.length).toFixed(2)}
                        </span>
                      </div>
                      <div className="border-l h-8 border-slate-300"></div>
                      <div>
                        <span className="text-slate-400 font-bold uppercase text-[8px] block">Cumulative GPA</span>
                        <span className="text-lg font-black text-indigo-700 font-mono">
                          {marks[0]?.cgpa || (marks.reduce((acc, m) => acc + (m.gpa || 0), 0) / marks.length).toFixed(2)}
                        </span>
                      </div>
                      <div className="border-l h-8 border-slate-300"></div>
                      <div>
                        <span className="text-slate-400 font-bold uppercase text-[8px] block">Credits Earned</span>
                        <span className="text-lg font-black text-indigo-700 font-mono">
                          {marks.reduce((acc, m) => acc + (m.credits || 4), 0)}
                        </span>
                      </div>
                      <div className="border-l h-8 border-slate-300"></div>
                      <div>
                        <span className="text-slate-400 font-bold uppercase text-[8px] block">Overall Result</span>
                        <span className="text-lg font-black text-emerald-600 uppercase">
                          {marks.every(m => m.result !== 'FAIL') ? 'PASS' : 'FAIL'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer and Signatures */}
                <div className="border-t pt-6 border-slate-300 flex justify-between items-end">
                  <div className="space-y-1 text-left">
                    <p className="text-[8px] text-slate-400 font-bold uppercase">Geetorus CampusOS Verification System</p>
                    <p className="text-[8px] text-slate-400">Generated: {new Date().toLocaleDateString('en-IN')} {new Date().toLocaleTimeString('en-IN')}</p>
                    <p className="text-[8px] text-slate-400">Page 1 of 1</p>
                  </div>
                  
                  {/* Signature */}
                  <div className="text-center">
                    <div className="h-10 flex items-end justify-center">
                      {profileData?.principalSignature ? (
                        <img src={profileData.principalSignature} className="h-8 object-contain" alt="Principal Signature" />
                      ) : (
                        <span className="font-mono text-indigo-700 text-xs italic tracking-widest leading-none mr-2">C. Xavier</span>
                      )}
                    </div>
                    <span className="text-[8px] text-slate-400 font-bold block uppercase tracking-widest border-t pt-1 border-slate-300 w-32">Controller of Exams</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          );
        })()}

        {/* SETTLE FEES */}
        {activeTab === 'fees' && (
          <div className="border bg-card p-5 rounded-xl shadow-sm space-y-6">
            <h3 className="text-sm font-extrabold uppercase border-b pb-2">Pending Fee Liability & Billing Ledger</h3>
            <div className="space-y-3 font-semibold text-xs">
              {profileData?.feeBills && profileData.feeBills.length > 0 ? (
                profileData.feeBills.map((bill: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-3.5 border rounded-lg bg-background">
                    <div>
                      <h4 className="font-bold">Semester Academic Tuition Fee (Fall 2026)</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Due Date: {new Date(bill.dueDate).toLocaleDateString()}</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="text-sm font-extrabold text-foreground">${bill.amount}</span>
                      {bill.status === 'PAID' ? (
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded font-extrabold uppercase">Paid & Settled</span>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedBill(bill);
                            setIsPaymentModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-700"
                        >
                          Settle Dues
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center py-6">All financial dues have been successfully settled.</p>
              )}
            </div>

            {/* Payment Modal */}
            {isPaymentModalOpen && selectedBill && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="w-full max-w-sm border bg-card p-6 rounded-2xl shadow-xl space-y-4 text-xs font-semibold">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-extrabold uppercase">Settle Tuition Bill Dues</h3>
                    <button onClick={() => setIsPaymentModalOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
                  </div>
                  <div className="space-y-2 p-3 bg-muted/20 rounded-lg">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Tuition Dues Amount</span>
                      <span className="text-foreground font-extrabold">${selectedBill.amount}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Convenience Charges</span>
                      <span className="text-foreground font-extrabold">$0.00</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold text-foreground">
                      <span>Grand Total</span>
                      <span>${selectedBill.amount}</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-muted-foreground text-center">
                    By clicking Pay, you will simulate a secure gateway authorization.
                  </p>
                  
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="flex-1 py-2 border rounded font-bold hover:bg-muted">Cancel</button>
                    <button type="button" onClick={handlePayment} className="flex-1 py-2 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-700">Authorize Payment</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* LIBRARY CARD */}
        {activeTab === 'library' && (
          <div className="space-y-6">
            <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold uppercase border-b pb-2">Issued Books & Library Records</h3>
              <div className="space-y-3 text-xs font-semibold">
                {library?.issued?.map((book: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-3 border rounded-lg bg-background">
                    <div>
                      <h4 className="font-bold">{book.title}</h4>
                      <p className="text-[9px] text-rose-500 mt-0.5">Return Deadline: {book.returnDate}</p>
                    </div>
                    <button onClick={() => toast.success('Book renewal request submitted successfully.')} className="px-2.5 py-1.5 border rounded text-[10px] font-bold hover:bg-muted">
                      Renew Book
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Search Books */}
            <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold uppercase border-b pb-2">Search Library Catalogue</h3>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  placeholder="Enter book title, author, or subject keyword..."
                  value={selectedBookSearch}
                  onChange={e => setSelectedBookSearch(e.target.value)}
                  className="flex-1 h-9 border rounded bg-background px-3 text-xs font-semibold"
                />
                <button onClick={handleBookSearch} className="px-4 py-1.5 bg-primary text-primary-foreground rounded text-xs font-bold flex flex-wrap items-center gap-1.5 hover:bg-primary/95">
                  <Search className="h-4 w-4" /> Query Catalog
                </button>
              </div>

              {bookResults.length > 0 && (
                <div className="space-y-2 border-t pt-3">
                  {bookResults.map((book, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2.5 border rounded bg-background text-xs font-semibold">
                      <div>
                        <h5 className="font-bold">{book.title}</h5>
                        <p className="text-[10px] text-muted-foreground">{book.author} · ISBN: {book.isbn}</p>
                      </div>
                      <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                        book.availableQuantity > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                      }`}>{book.availableQuantity > 0 ? 'Available' : 'Reserved'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* HOSTEL & TRANSPORT */}
        {activeTab === 'hostel_transport' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Hostel details */}
            <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold uppercase border-b pb-2">Hostel & Mess Mappings</h3>
              <div className="space-y-3 text-xs font-semibold">
                {hostel && (
                  <div className="p-3 border rounded-lg bg-background space-y-1.5">
                    <h4 className="font-bold text-primary">{hostel.name}</h4>
                    <p className="text-muted-foreground">Block/Room Allocation: <span className="text-foreground">{hostel.block} / {hostel.roomNo}</span></p>
                    <p className="text-muted-foreground font-bold">Roommates:</p>
                    <ul className="list-disc list-inside text-muted-foreground pl-1.5">
                      {hostel.roommates.map((rm: string, idx: number) => (
                        <li key={idx} className="text-foreground">{rm}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {hostel && (
                  <div className="p-3 border rounded-lg bg-background space-y-2">
                    <h4 className="font-bold text-primary">Daily Mess Menu Summary</h4>
                    <p className="text-muted-foreground">Breakfast: <span className="text-foreground">{hostel.messMenu.breakfast}</span></p>
                    <p className="text-muted-foreground">Lunch: <span className="text-foreground">{hostel.messMenu.lunch}</span></p>
                    <p className="text-muted-foreground">Dinner: <span className="text-foreground">{hostel.messMenu.dinner}</span></p>
                  </div>
                )}
              </div>
            </div>

            {/* Transport details */}
            <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold uppercase border-b pb-2">Transport Vehicle Details</h3>
              <div className="space-y-3 text-xs font-semibold">
                {transport && (
                  <div className="p-3 border rounded-lg bg-background space-y-2">
                    <h4 className="font-bold text-primary">{transport.busNo}</h4>
                    <p className="text-muted-foreground">Route Details: <span className="text-foreground">{transport.route}</span></p>
                    <p className="text-muted-foreground">Pickup Station: <span className="text-foreground">{transport.pickup}</span></p>
                    <p className="text-muted-foreground">Driver Coordinator: <span className="text-foreground">{transport.driverName} ({transport.driverPhone})</span></p>
                    <p className="text-muted-foreground">Live Telematics Status: <span className="text-emerald-600 font-extrabold">{transport.gpsStatus}</span></p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* LEAVE & OD REQUEST MANAGEMENT SYSTEM */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            
            {/* Header & Sub-Navigation */}
            <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
                <div>
                  <h3 className="text-base font-black tracking-tight text-foreground flex items-center gap-2">
                    <Send className="h-5 w-5 text-primary" /> Leave & On-Duty (OD) Management System
                  </h3>
                  <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                    Submit applications, track multi-level approval workflow (Faculty/Advisor → HOD), and view request logs.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-muted p-1 rounded-xl">
                  <button
                    onClick={() => setRequestTab('LEAVE')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      requestTab === 'LEAVE' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    🌴 Apply Leave
                  </button>
                  <button
                    onClick={() => setRequestTab('OD')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      requestTab === 'OD' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    🏆 Apply OD
                  </button>
                  <button
                    onClick={() => setRequestTab('HISTORY')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      requestTab === 'HISTORY' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    📋 Request History ({requests.length})
                  </button>
                </div>
              </div>

              {/* Auto-Filled Student Details Banner */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-3 bg-muted/40 rounded-xl text-xs font-bold text-slate-700 border">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Student Name</span>
                  <span className="font-extrabold text-foreground truncate block">{user?.firstName} {user?.lastName}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Register / Adm No</span>
                  <span className="font-extrabold text-primary font-mono block">{studentInfo?.admissionNo || cardDetails?.registerNo || 'ADM2026001'}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Department</span>
                  <span className="font-bold text-foreground block truncate">{studentInfo?.department?.code || studentInfo?.department?.name || 'CSE'}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Academic Year</span>
                  <span className="font-bold text-foreground block">{studentInfo?.academicYear?.name || '2026-2027'}</span>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Section & Term</span>
                  <span className="font-bold text-foreground block">Sem {studentInfo?.semester?.number || '1'} · Sec {studentInfo?.section?.name || 'A'}</span>
                </div>
              </div>
            </div>

            {/* TAB 1: APPLY LEAVE FORM */}
            {requestTab === 'LEAVE' && (
              <div className="border bg-card p-6 rounded-xl shadow-sm space-y-5 animate-in fade-in-50 duration-200">
                <div className="border-b pb-3">
                  <h4 className="text-sm font-extrabold uppercase text-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-emerald-500" /> Submit Student Leave Application
                  </h4>
                  <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                    Your leave request will be forwarded to your assigned Faculty Advisor / Class Advisor (Level 1) and HOD (Level 2, if forwarded) for review.
                  </p>
                </div>

                <form onSubmit={e => handleSubmitLeaveOrODRequest(e, false)} className="space-y-4 text-xs font-semibold">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">Leave Category</label>
                      <select
                        value={leaveSubCategory}
                        onChange={e => setLeaveSubCategory(e.target.value)}
                        className="h-10 border rounded-xl bg-background px-3 font-bold"
                      >
                        <option value="Sick Leave">Sick Leave</option>
                        <option value="Personal Leave">Personal Leave</option>
                        <option value="Emergency Leave">Emergency Leave</option>
                        <option value="Medical Leave">Medical Leave</option>
                        <option value="Other">Other Leave</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">Subject / Title</label>
                      <input
                        type="text"
                        required
                        value={leaveTitle}
                        onChange={e => setLeaveTitle(e.target.value)}
                        placeholder="e.g. High fever medical rest"
                        className="h-10 border rounded-xl bg-background px-3 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">From Date</label>
                      <input
                        type="date"
                        required
                        value={leaveStart}
                        onChange={e => setLeaveStart(e.target.value)}
                        className="h-10 border rounded-xl bg-background px-3"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">To Date</label>
                      <input
                        type="date"
                        required
                        value={leaveEnd}
                        onChange={e => setLeaveEnd(e.target.value)}
                        className="h-10 border rounded-xl bg-background px-3"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Reason for Leave</label>
                    <textarea
                      required
                      value={leaveReason}
                      onChange={e => setLeaveReason(e.target.value)}
                      rows={3}
                      placeholder="State the detailed reason for your absence..."
                      className="border rounded-xl bg-background p-3 font-medium"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Supporting Medical/Proof Document (Optional)</label>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleProofUpload}
                      className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                    />
                    {proofDocAttachment && (
                      <p className="text-[10px] text-emerald-600 font-bold mt-1">✓ Attached: {proofDocAttachment.name}</p>
                    )}
                  </div>

                  <div className="pt-2">
                    <button type="submit" className="h-10 px-6 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/95 shadow-sm transition-all flex items-center gap-2">
                      <Send className="h-4 w-4" /> Submit Leave Application
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 2: APPLY OD FORM */}
            {requestTab === 'OD' && (
              <div className="border bg-card p-6 rounded-xl shadow-sm space-y-5 animate-in fade-in-50 duration-200">
                <div className="border-b pb-3">
                  <h4 className="text-sm font-extrabold uppercase text-foreground flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-indigo-500" /> Submit On-Duty (OD) Permission Request
                  </h4>
                  <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                    OD requests automatically mark your attendance as "On Duty (Present)" upon approval by your Faculty / Class Advisor and HOD (if forwarded).
                  </p>
                </div>

                <form onSubmit={e => handleSubmitLeaveOrODRequest(e, true)} className="space-y-4 text-xs font-semibold">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">OD Category</label>
                      <select
                        value={odSubCategory}
                        onChange={e => setOdSubCategory(e.target.value)}
                        className="h-10 border rounded-xl bg-background px-3 font-bold"
                      >
                        <option value="Internship">Internship</option>
                        <option value="Placement Drive">Placement Drive</option>
                        <option value="Hackathon">Hackathon</option>
                        <option value="Symposium">Symposium</option>
                        <option value="Workshop">Workshop</option>
                        <option value="Industrial Visit">Industrial Visit</option>
                        <option value="Sports">Sports Event</option>
                        <option value="NSS/NCC">NSS / NCC Event</option>
                        <option value="Cultural Event">Cultural Event</option>
                        <option value="Other">Other OD Event</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">Event / Competition Name</label>
                      <input
                        type="text"
                        required
                        value={odEventName}
                        onChange={e => setOdEventName(e.target.value)}
                        placeholder="e.g. National Hackathon 2026"
                        className="h-10 border rounded-xl bg-background px-3 font-semibold"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">Organization / Venue Name</label>
                      <input
                        type="text"
                        required
                        value={odOrgName}
                        onChange={e => setOdOrgName(e.target.value)}
                        placeholder="e.g. IIT Madras / Google Campus"
                        className="h-10 border rounded-xl bg-background px-3 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">From Date</label>
                      <input
                        type="date"
                        required
                        value={leaveStart}
                        onChange={e => setLeaveStart(e.target.value)}
                        className="h-10 border rounded-xl bg-background px-3"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">To Date</label>
                      <input
                        type="date"
                        required
                        value={leaveEnd}
                        onChange={e => setLeaveEnd(e.target.value)}
                        className="h-10 border rounded-xl bg-background px-3"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Detailed Description / Objective</label>
                    <textarea
                      required
                      value={leaveReason}
                      onChange={e => setLeaveReason(e.target.value)}
                      rows={3}
                      placeholder="Describe the event, team participation details, or invitation specifics..."
                      className="border rounded-xl bg-background p-3 font-medium"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Proof Document / Invitation Letter Upload (Optional)</label>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleProofUpload}
                      className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                    />
                    {proofDocAttachment && (
                      <p className="text-[10px] text-emerald-600 font-bold mt-1">✓ Attached Proof: {proofDocAttachment.name}</p>
                    )}
                  </div>

                  <div className="pt-2">
                    <button type="submit" className="h-10 px-6 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/95 shadow-sm transition-all flex items-center gap-2">
                      <Send className="h-4 w-4" /> Submit OD Request
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 3: REQUEST HISTORY & APPROVAL TRACKER */}
            {requestTab === 'HISTORY' && (
              <div className="border bg-card p-6 rounded-xl shadow-sm space-y-5 animate-in fade-in-50 duration-200">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                  <div>
                    <h4 className="text-sm font-extrabold uppercase text-foreground">My Request History & Multi-Level Status Tracking</h4>
                    <p className="text-xs text-muted-foreground font-semibold mt-0.5">Track real-time progress through Faculty / Class Advisor and HOD approval stages.</p>
                  </div>
                  
                  {/* Status Filter Pills */}
                  <div className="flex flex-wrap gap-1 bg-muted p-1 rounded-xl text-[10px] font-bold">
                    {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map((st) => (
                      <button
                        key={st}
                        onClick={() => setHistoryFilterStatus(st)}
                        className={`px-3 py-1 rounded-lg transition-all ${
                          historyFilterStatus === st ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {requests.filter(r => historyFilterStatus === 'ALL' || r.status.includes(historyFilterStatus)).length === 0 ? (
                  <div className="text-center py-12 border border-dashed rounded-xl space-y-2">
                    <p className="text-xs font-bold text-muted-foreground">No requests found matching filter "{historyFilterStatus}".</p>
                    <button onClick={() => setRequestTab('LEAVE')} className="text-xs text-primary font-bold hover:underline">
                      + Click here to file a Leave or OD Request
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests
                      .filter(r => historyFilterStatus === 'ALL' || r.status.includes(historyFilterStatus))
                      .map((reqItem) => {
                        const historyList = reqItem.history || [];
                        const mentorLog = historyList.find((h: any) => h.stage === 'MENTOR');
                        const hodLog = historyList.find((h: any) => h.stage === 'HOD');

                        let parsedAttachments: string[] = [];
                        try {
                          parsedAttachments = JSON.parse(reqItem.attachments || '[]');
                        } catch {}

                        return (
                          <div key={reqItem.id} className="border rounded-2xl p-5 bg-card hover:shadow-md transition-all space-y-4">
                            <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                    reqItem.type.includes('OD') ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                  }`}>
                                    {reqItem.type}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground font-mono">
                                    Submitted: {new Date(reqItem.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <h4 className="text-sm font-extrabold text-foreground">{reqItem.title}</h4>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                                  reqItem.status === 'APPROVED' 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                    : ['REJECTED', 'REJECTED_BY_MENTOR', 'REJECTED_BY_HOD'].includes(reqItem.status) 
                                    ? 'bg-rose-50 text-rose-700 border-rose-200' 
                                    : reqItem.status === 'CANCELLED' 
                                    ? 'bg-slate-50 text-slate-600 border-slate-200' 
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                  {['PENDING', 'PENDING_MENTOR'].includes(reqItem.status) 
                                    ? `Pending Faculty/Advisor Approval` 
                                    : reqItem.status === 'MENTOR_APPROVED' 
                                    ? 'Faculty Approved (Awaiting HOD)' 
                                    : reqItem.status === 'REJECTED_BY_MENTOR' 
                                    ? 'Rejected by Faculty/Advisor' 
                                    : reqItem.status === 'REJECTED_BY_HOD' 
                                    ? 'Rejected by HOD' 
                                    : reqItem.status === 'APPROVED' 
                                    ? 'Approved' 
                                    : reqItem.status.replace(/_/g, ' ')}
                                </span>

                                {(reqItem.status === 'PENDING' || reqItem.status === 'MENTOR_APPROVED' || reqItem.status.startsWith('PENDING')) && (
                                  <button
                                    onClick={() => handleCancelRequest(reqItem.id)}
                                    disabled={cancellingRequestId === reqItem.id}
                                    className="px-3 py-1 rounded-lg border border-rose-200 text-rose-600 text-xs font-bold hover:bg-rose-50 transition-colors"
                                  >
                                    {cancellingRequestId === reqItem.id ? 'Cancelling...' : 'Cancel Request'}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold bg-muted/30 p-3 rounded-xl border">
                              <div>
                                <span className="text-[9px] uppercase font-bold text-muted-foreground block">Duration Period</span>
                                <span className="text-foreground font-bold">
                                  {reqItem.startDate ? new Date(reqItem.startDate).toLocaleDateString() : 'N/A'} — {reqItem.endDate ? new Date(reqItem.endDate).toLocaleDateString() : 'N/A'}
                                </span>
                              </div>
                              <div className="md:col-span-2">
                                <span className="text-[9px] uppercase font-bold text-muted-foreground block">Reason / Details</span>
                                <span className="text-foreground whitespace-pre-wrap">{reqItem.reason}</span>
                              </div>
                            </div>

                            {/* Attachments */}
                            {parsedAttachments.length > 0 && (
                              <div className="flex items-center gap-2 text-xs font-bold text-primary">
                                <FileText className="h-4 w-4" /> Supporting Proof Document:
                                {parsedAttachments.map((url, i) => (
                                  <a key={i} href={url} target="_blank" rel="noreferrer" className="underline hover:text-primary/80">
                                    View Attached Document #{i + 1}
                                  </a>
                                ))}
                              </div>
                            )}

                            {/* Approval Flow Progress Timeline */}
                            <div className="border-t pt-4 space-y-2">
                              <span className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-wider block">Approval Workflow Pipeline</span>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {/* Level 1: Faculty / Class Advisor */}
                                <div className={`p-3 rounded-xl border text-xs ${
                                  mentorLog?.action === 'APPROVE' 
                                    ? 'bg-emerald-50/60 border-emerald-200' 
                                    : mentorLog?.action === 'REJECT' 
                                    ? 'bg-rose-50/60 border-rose-200' 
                                    : 'bg-background border-slate-200'
                                }`}>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-extrabold text-foreground">Level 1: Faculty/Advisor Approval</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                      mentorLog?.action === 'APPROVE' ? 'bg-emerald-100 text-emerald-700' : mentorLog?.action === 'REJECT' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                                    }`}>
                                      {mentorLog ? mentorLog.action : (reqItem.currentStep === 'MENTOR' ? 'Pending Action' : 'Completed')}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground">
                                    {mentorLog ? `Actioned by: ${mentorLog.actionByName} · "${mentorLog.comment || 'No remarks'}"` : 'Awaiting review by assigned Faculty Advisor / Class Advisor.'}
                                  </p>
                                </div>

                                {/* Level 2: HOD */}
                                <div className={`p-3 rounded-xl border text-xs ${
                                  hodLog?.action === 'APPROVE' 
                                    ? 'bg-emerald-50/60 border-emerald-200' 
                                    : hodLog?.action === 'REJECT' 
                                    ? 'bg-rose-50/60 border-rose-200' 
                                    : 'bg-background border-slate-200'
                                }`}>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-extrabold text-foreground">Level 2: HOD Final Approval</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                      hodLog?.action === 'APPROVE' ? 'bg-emerald-100 text-emerald-700' : hodLog?.action === 'REJECT' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                      {hodLog ? hodLog.action : (reqItem.currentStep === 'HOD' ? 'Pending Action' : 'Awaiting Mentor')}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground">
                                    {hodLog ? `Actioned by: ${hodLog.actionByName} · "${hodLog.comment || 'No remarks'}"` : 'Pending final approval from Department Head.'}
                                  </p>
                                </div>
                              </div>
                            </div>

                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* MESSAGES / CHAT */}
        {activeTab === 'messages' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[75vh] min-h-[550px] animate-in fade-in-50 duration-300">
            
            {/* Sidebar: Conversations List */}
            {(!isMobile || !activeConversation) && (
              <div className="border bg-card rounded-2xl shadow-sm flex flex-col overflow-hidden h-full">
                <div className="p-4 border-b space-y-3 bg-muted/10">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs uppercase font-extrabold tracking-wide text-foreground">Faculty Chats</h3>
                    <button 
                      type="button"
                      onClick={() => {
                        setNewChatForm({
                          recipientId: '',
                          subject: '',
                          message: '',
                          priority: 'NORMAL',
                          attachmentBase64: '',
                          attachmentName: ''
                        });
                        setIsNewChatModalOpen(true);
                      }}
                      className="flex flex-wrap items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-lg hover:bg-primary/95 shadow-sm transition-all"
                    >
                      <MessageSquare className="h-3 w-3" /> New Message
                    </button>
                  </div>
                  
                  {/* Search Bar */}
                  <input 
                    type="text"
                    placeholder="🔍 Search by Faculty Name, Mentor Name, Subject or Message..."
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
                  {(() => {
                    const filtered = conversations.filter(c => {
                      const query = searchQuery.trim().toLowerCase();
                      const matchUnread = chatFilterStatus === 'ALL' || c.unreadCount > 0;
                      if (!query) return matchUnread;

                      const name = (c.participant.name || '').toLowerCase();
                      const designation = (c.participant.designation || '').toLowerCase();
                      const department = (c.participant.department || '').toLowerCase();
                      const employeeId = (c.participant.employeeId || '').toLowerCase();
                      const subject = (c.lastMessage?.subject || '').toLowerCase();
                      const message = (c.lastMessage?.message || '').toLowerCase();

                      const matchSearch = 
                        name.includes(query) ||
                        designation.includes(query) ||
                        department.includes(query) ||
                        employeeId.includes(query) ||
                        subject.includes(query) ||
                        message.includes(query);

                      return matchSearch && matchUnread;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-3">
                          <div className="w-12 h-12 bg-primary/5 text-primary rounded-full flex items-center justify-center text-xl shadow-inner animate-pulse">🔍</div>
                          <h4 className="text-[11px] font-black uppercase text-foreground">No conversations found</h4>
                          <p className="text-[9px] text-muted-foreground max-w-[200px] font-medium leading-relaxed">
                            We couldn't find any chats matching "{searchQuery}". Try searching for another name, subject, or message.
                          </p>
                        </div>
                      );
                    }

                    return filtered.map((conv, idx) => {
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
                              {conv.lastMessage.senderRole === 'Student' ? 'You: ' : ''}
                              {conv.lastMessage.message || 'Sent an attachment'}
                            </p>
                            <span className="text-[8px] text-muted-foreground uppercase font-semibold">
                              {conv.participant.designation} · {conv.participant.department}
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
                    });
                  })()}
                </div>
              </div>
            )}

            {/* Chat Thread Panel */}
            {(!isMobile || activeConversation) && (
              <div className="lg:col-span-2 border bg-card rounded-2xl shadow-sm flex flex-col overflow-hidden h-full">
                {activeConversation ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b bg-muted/10 flex justify-between items-center shrink-0">
                      <div className="flex flex-wrap items-center gap-3">
                        {isMobile && (
                          <button
                            type="button"
                            onClick={() => setActiveConversation(null)}
                            className="mr-2 p-1 border rounded-full hover:bg-muted font-bold text-muted-foreground flex items-center justify-center h-8 w-8 text-xs shrink-0"
                          >
                            ←
                          </button>
                        )}
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
                            {activeConversation.participant.designation} · Dept: {activeConversation.participant.department}
                          </p>
                        </div>
                      </div>
                    </div>

                  {/* Message Bubbles Area */}
                  <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50 space-y-3 flex flex-col">
                    {chatMessages.map((msg, index) => {
                      const isMe = msg.senderRole === 'Student';
                      const isRead = msg.status === 'READ';
                      const studentProfilePhoto = studentInfo?.user?.profilePhoto || null;
                      
                      return (
                        <div 
                          key={msg.id || index}
                          className={`flex gap-2 items-end max-w-[75%] ${isMe ? 'self-end justify-end' : 'self-start justify-start'}`}
                        >
                          {/* Incoming: Display Advisor profile photo beside incoming messages */}
                          {!isMe && (
                            activeConversation.participant.profilePhoto ? (
                              <img src={activeConversation.participant.profilePhoto} className="w-8 h-8 rounded-full object-cover border shrink-0" alt="" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] uppercase shrink-0">
                                {activeConversation.participant.name.substring(0, 2)}
                              </div>
                            )
                          )}

                          <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            {/* Sender name & Subject tag */}
                            <div className="flex flex-wrap items-center gap-1.5 text-[8px] text-muted-foreground font-semibold mb-1">
                              {!isMe && <span>{activeConversation.participant.name}</span>}
                              {msg.subject && <span className="bg-slate-200 px-1 rounded truncate max-w-[120px]">Sub: {msg.subject}</span>}
                              {msg.priority && msg.priority !== 'NORMAL' && (
                                <span className={`px-1 rounded font-black text-[7px] text-white ${msg.priority === 'URGENT' ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`}>
                                  {msg.priority}
                                </span>
                              )}
                              {isMe && <span>You</span>}
                            </div>

                            {/* Text Bubble */}
                            <div className={`px-4 py-3 rounded-2xl shadow-sm text-xs font-semibold text-left relative group [&_a]:text-primary [&_a]:underline-offset-2 hover:[&_a]:underline ${
                              isMe 
                                ? 'bg-primary text-white rounded-tr-none' 
                                : 'bg-[#F3F4F6] text-[#111827] dark:bg-[#1F2937] dark:text-[#F9FAFB] rounded-tl-none border border-slate-200/50 dark:border-slate-800'
                            }`}>
                              {editMessageId === msg.id ? (
                                <div className="space-y-2 min-w-[200px]">
                                  <textarea 
                                    value={editMessageText}
                                    onChange={e => setEditMessageText(e.target.value)}
                                    className="w-full text-foreground p-1.5 text-xs border rounded bg-background"
                                  />
                                  <div className="flex flex-wrap justify-end gap-1.5">
                                    <button type="button" onClick={() => setEditMessageId(null)} className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-[9px] font-bold">Cancel</button>
                                    <button type="button" onClick={() => handleEditMessage(msg.id)} className="px-2 py-0.5 bg-primary text-primary-foreground rounded text-[9px] font-bold">Save</button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <p className="whitespace-pre-line leading-relaxed">{msg.message}</p>
                                  
                                  {/* Attachment display inside a white card */}
                                  {msg.attachmentUrl && (
                                    <div className="mt-3 p-3 bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-[11px] shadow-sm">
                                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                                        <span className="text-lg shrink-0">📄</span>
                                        <div className="min-w-0">
                                          <p className="font-extrabold truncate max-w-[130px]">{msg.attachmentName || 'Attachment'}</p>
                                          <p className="text-[9px] text-muted-foreground uppercase font-black">{msg.attachmentType || 'File'}</p>
                                        </div>
                                      </div>
                                      <div className="flex flex-wrap gap-1.5 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setPreviewFile({
                                              url: msg.attachmentUrl,
                                              name: msg.attachmentName || 'Attachment',
                                              type: msg.attachmentType || 'File'
                                            });
                                          }}
                                          className="px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded text-[9px] font-bold transition-colors"
                                        >
                                          Preview
                                        </button>
                                        <a 
                                          href={msg.attachmentUrl} 
                                          download={msg.attachmentName || 'attachment'}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="px-2 py-1 bg-primary text-primary-foreground hover:opacity-95 rounded text-[9px] font-bold transition-colors"
                                        >
                                          Download
                                        </a>
                                      </div>
                                    </div>
                                  )}

                                  {/* Hover actions */}
                                  <div className="absolute top-1/2 -translate-y-1/2 hidden group-hover:flex flex-wrap gap-1 bg-white dark:bg-slate-900 border shadow-md p-1 rounded-lg z-10 -left-12">
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
                            <div className="flex flex-wrap items-center gap-1 mt-1 text-[12px] text-[#6B7280] font-medium w-full justify-end">
                              <span>{new Date(msg.sentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {isMe && (
                                <span className={isRead ? 'text-primary font-black' : 'text-slate-400 font-semibold'}>
                                  {isRead ? '✓✓' : '✓'}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Outgoing: Display Student profile photo beside outgoing messages */}
                          {isMe && (
                            studentProfilePhoto ? (
                              <img src={studentProfilePhoto} className="w-8 h-8 rounded-full object-cover border shrink-0" alt="" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] uppercase shrink-0">
                                You
                              </div>
                            )
                          )}
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
                      placeholder="Type a reply..."
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
                    <h4 className="font-extrabold text-foreground text-xs uppercase tracking-wide">Instructor Messaging</h4>
                    <p className="text-[10px] text-muted-foreground max-w-sm mt-0.5">Select a faculty chat to reply or download course guidelines and reference materials.</p>
                  </div>
                </div>
              )}
            </div>
            )}
          </div>
        )}

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
      {/* New Message Composer Modal for Student */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSendNewChat} className="bg-card w-full max-w-lg border rounded-2xl shadow-2xl overflow-hidden flex flex-col text-xs font-semibold">
            <div className="px-5 py-4 border-b bg-muted/20 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-extrabold uppercase">New Message</h3>
                <p className="text-[9px] text-muted-foreground uppercase font-black tracking-wider">Send message to an instructor</p>
              </div>
              <button 
                type="button" 
                onClick={() => setIsNewChatModalOpen(false)}
                className="px-2.5 py-1 border rounded hover:bg-muted font-bold"
              >
                ✕
              </button>
            </div>
            
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Select Instructor Dropdown */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold text-muted-foreground">Select Instructor</label>
                <select
                  required
                  value={newChatForm.recipientId}
                  onChange={e => setNewChatForm(prev => ({ ...prev, recipientId: e.target.value }))}
                  className="h-9 border rounded-lg bg-background px-3 font-semibold text-xs"
                >
                  <option value="">Choose an instructor...</option>
                  {availableFacultyList.map((fac) => (
                    <option key={fac.id} value={fac.id}>
                      {fac.name} ({fac.designation} · {fac.department}) {fac.isMentor ? '⭐ Mentor' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold text-muted-foreground">Subject Title (Optional)</label>
                <input 
                  type="text"
                  placeholder="e.g. Question on Lecture 5, Attendance Discrepancy"
                  value={newChatForm.subject}
                  onChange={e => setNewChatForm(prev => ({ ...prev, subject: e.target.value }))}
                  className="h-9 border rounded-lg bg-background px-3"
                />
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
                {newChatForm.attachmentName && (
                  <p className="text-[9px] text-primary font-bold">Attached: {newChatForm.attachmentName}</p>
                )}
              </div>

              {/* Message text */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold text-muted-foreground">Message Details</label>
                <textarea 
                  placeholder="Type message content..."
                  value={newChatForm.message}
                  onChange={e => setNewChatForm(prev => ({ ...prev, message: e.target.value }))}
                  className="h-24 border rounded-lg bg-background p-2.5"
                  required={!newChatForm.attachmentBase64}
                />
              </div>
            </div>

            <div className="px-5 py-4 border-t bg-muted flex flex-wrap justify-end gap-2 shrink-0">
              <button 
                type="button" 
                onClick={() => setIsNewChatModalOpen(false)}
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

    </div>
  );
};
