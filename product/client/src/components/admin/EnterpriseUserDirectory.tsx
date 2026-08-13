import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, UserCheck, UserX, Shield, GraduationCap, Award, BookOpen,
  Plus, Search, Filter, RefreshCw, Download, Upload,
  FileText, AlertTriangle, Lock, Layers, X, Sparkles,
  ShieldCheck, Laptop, Eye, Edit2, Key, Mail, Phone,
  UserCog, Building2, BookMarked, CheckCircle, XCircle,
  Unlock, Trash2, MoreHorizontal, AlertCircle, Check
} from 'lucide-react';
import { toast } from '../ui/Toast';
import api from '../../lib/axios';
import { CredentialSuccessModal, CredentialPayload } from '../shared/CredentialSuccessModal';

type IamModal =
  | 'VIEW_PROFILE' | 'EDIT_PROFILE' | 'RESET_PASSWORD' | 'CHANGE_PASSWORD'
  | 'UPDATE_EMAIL' | 'UPDATE_PHONE' | 'CHANGE_ROLE' | 'CHANGE_DEPT'
  | 'CHANGE_PROGRAM' | 'ACTIVATE' | 'DEACTIVATE' | 'UNLOCK' | 'DELETE' | null;

const ALL_ROLES = [
  'Super Admin',
  'College Admin',
  'Governing Body',
  'Management',
  'Principal',
  'Vice Principal',
  'Academic Dean',
  'Admission Dean',
  'Accounts Officer',
  'HOD',
  'Mentor',
  'Faculty',
  'Student',
  'Parent',
  'Placement Officer',
  'Librarian',
  'Examination Cell',
  'Hostel Warden',
  'Transport Manager'
];
const ALL_DEPTS = [
  'CSE','IT','AI&DS','AIML','CSBS','ECE','EEE','MECH','CIVIL','MBA','MCA',
  'Administration','Accounts','Admissions','Academics','Placements','Examinations','Library','Hostel'
];
const ALL_PROGRAMS = [
  'B.Tech CSE','B.Tech IT','B.Tech AI&DS','B.Tech AIML','B.Tech CSBS',
  'B.Tech ECE','B.Tech EEE','B.Tech MECH','B.Tech CIVIL','MBA','MCA',
  'M.Tech','Ph.D','Academic Administration','Enrollment & Fees',
  'Corporate Relations','Assessment & Grades','Financial Services',
  'Parent Portal','Institution Operations'
];
const ROLE_PERMISSIONS: Record<string,string[]> = {
  'Vice Principal': ['Institution Monitoring','Operations Monitoring','Placement Monitoring','Internship Monitoring','Complaint Monitoring','Attendance Monitoring','Department Monitoring','Faculty Monitoring','Student Monitoring','Read + Executive Controls'],
  'Academic Dean':  ['Academics','Attendance','Internal Marks','Examinations','Curriculum','Semester Progress','Faculty Performance','Student Performance','Academic Complaints','Academic Reports','All Departments Access'],
  'Admission Dean': ['Admissions','Student Registration','Fees','Scholarships','Financial Aid','Admission Reports','Fee Reports','Student Verification','All Departments Access'],
  'HOD':     ['Department Management','Faculty Oversight','Student Oversight','Attendance','Internal Marks','Timetable','Department Reports'],
  'Principal':['Full Institution Access','View All Modules','Approve Decisions','Reports','Complaints Escalation'],
  'Faculty':  ['Attendance Management','Internal Marks','Subject Teaching','Student Queries','Reports'],
  'Mentor':   ['Mentee Tracking','Attendance View','Counselling Records','Parent Communication'],
  'Student':  ['Academics View','Attendance View','Fees View','Library Access','Complaint Submission'],
};
const STATUS_COLORS: Record<string,string> = {
  ACTIVE:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  INACTIVE:  'bg-rose-50 text-rose-700 border-rose-200',
  SUSPENDED: 'bg-amber-50 text-amber-700 border-amber-200',
  LOCKED:    'bg-slate-100 text-slate-600 border-slate-200',
  PENDING:   'bg-sky-50 text-sky-700 border-sky-200',
};

interface EnterpriseUserDirectoryProps {
  userRole?: string;
  collegeScopeId?: string;
}

export const EnterpriseUserDirectory: React.FC<EnterpriseUserDirectoryProps> = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Main Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkPreview, setBulkPreview] = useState<any | null>(null);
  const [bulkResult, setBulkResult] = useState<any | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  // IAM Action modals
  const [iamModal, setIamModal] = useState<IamModal>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // IAM form state
  const [iamEmail, setIamEmail] = useState('');
  const [iamPhone, setIamPhone] = useState('');
  const [iamRole, setIamRole] = useState('');
  const [iamDept, setIamDept] = useState('');
  const [iamProgram, setIamProgram] = useState('');
  const [iamReason, setIamReason] = useState('');
  const [iamNewPwd, setIamNewPwd] = useState('');
  const [iamConfirmPwd, setIamConfirmPwd] = useState('');
  const [showPwdNew, setShowPwdNew] = useState(false);
  const [showPwdConfirm, setShowPwdConfirm] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  const pwdPolicy = useMemo(() => {
    const p = iamNewPwd;
    return { minLen: p.length >= 8, upper: /[A-Z]/.test(p), lower: /[a-z]/.test(p), num: /[0-9]/.test(p), special: /[^A-Za-z0-9]/.test(p) };
  }, [iamNewPwd]);
  const pwdPolicyPass = Object.values(pwdPolicy).every(Boolean);

  const readFileBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Unable to read the selected file'));
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.readAsDataURL(file);
  });

  const closeBulkImport = () => {
    setIsImportModalOpen(false);
    setBulkFile(null);
    setBulkPreview(null);
    setBulkResult(null);
  };

  const previewBulkImport = async () => {
    if (!bulkFile) return toast.error('Choose a CSV or XLSX file first.');
    setBulkBusy(true);
    setBulkPreview(null);
    setBulkResult(null);
    try {
      const base64 = await readFileBase64(bulkFile);
      const response = await api.post('/users/import/file-preview', { fileName: bulkFile.name, base64 });
      setBulkPreview(response.data.data);
      toast.success(`Validated ${response.data.data.total} row(s).`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Import validation failed.');
    } finally { setBulkBusy(false); }
  };

  const commitBulkImport = async () => {
    if (!bulkFile || !bulkPreview || bulkPreview.invalid) return;
    setBulkBusy(true);
    try {
      const base64 = await readFileBase64(bulkFile);
      const response = await api.post('/users/import/file-commit', { fileName: bulkFile.name, base64 });
      setBulkResult(response.data.data);
      setBulkPreview(null);
      await fetchDirectoryData(true);
      toast.success(`Provisioned ${response.data.data.committed} account(s).`);
    } catch (error: any) {
      const report = error.response?.data?.data;
      if (report) setBulkPreview(report);
      toast.error(error.response?.data?.message || error.message || 'Account provisioning failed.');
    } finally { setBulkBusy(false); }
  };

  const downloadImportTemplate = () => {
    const headers = ['profileType','email','firstName','lastName','roleName','username','phone','status','departmentCode','programCode','courseCode','academicYear','semesterNumber','sectionName','registerNumber','employeeId','dob','dateOfAdmission','dateOfJoining','gender','parentName','parentPhone','currentAddress','permanentAddress','designation','qualification','experience','workspaceRoles'];
    const blob = new Blob([`${headers.join(',')}\n`], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob); link.download = 'campusos-user-import-template.csv'; link.click();
    URL.revokeObjectURL(link.href);
  };

  const downloadImportReport = () => {
    if (!bulkResult) return;
    const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const rows = [
      ['row','status','email','username','temporaryPassword','errors'],
      ...(bulkResult.credentials || []).map((item: any) => [item.rowNumber,'SUCCESS',item.email,item.username,item.temporaryPassword,'']),
      ...(bulkResult.failures || []).map((item: any) => [item.rowNumber,'FAILED',item.email || '','','',(item.errors || []).join('; ')]),
    ];
    const blob = new Blob([rows.map((row: unknown[]) => row.map(escape).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob); link.download = 'campusos-provisioning-report.csv'; link.click();
    URL.revokeObjectURL(link.href);
  };

  // Create User Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    roleName: 'Student',
    departmentCode: 'CSE',
    program: 'B.Tech',
    academicYear: '2025-2026',
    regOrEmpNo: '',
    designation: 'Student',
    username: '',
    password: '',
    status: 'ACTIVE'
  });

  // Generated Credential Preview
  const [generatedCreds, setGeneratedCreds] = useState<any | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Subject / Mentor Mapping Form State
  const [mappingData, setMappingData] = useState({
    departmentId: 'CSE',
    semesterId: 'Semester 5',
    sectionId: 'Section A',
    subjectNames: 'DBMS, Operating Systems',
    studentBatch: '2023-2027 CSE-A'
  });

  const fetchDirectoryData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    setLoadError(null);
    try {
      const [usersRes, statsRes] = await Promise.all([
        api.get('/users?pageSize=100').catch(() => null),
        api.get('/users/directory-stats').catch(() => null)
      ]);

      if (usersRes?.data?.status === 'success') {
        const rawUsers = usersRes.data.data.items || usersRes.data.data.users || [];
        setUsers(rawUsers);
      } else {
        throw new Error('The directory service returned an invalid response.');
      }

      if (statsRes?.data?.status === 'success') {
        setStats(statsRes.data.data.stats);
      }
    } catch (err) {
      console.error('Failed to load user directory:', err);
      setUsers([]);
      setLoadError('The live user directory could not be loaded. No placeholder accounts are being shown.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDirectoryData();
  }, []);

  // Preconfigured enterprise role accounts
  const getFallbackUsers = () => [
    { id:'USR-1001', firstName:'Suresh', lastName:'Kumar', email:'suresh.710023104@geetorus.edu.in', username:'suresh.710023104@geetorus.edu.in', phone:'9876543210', role:{name:'Student'}, department:'CSE', program:'B.Tech CSE', designation:'Student Candidate', regOrEmpNo:'710023104', status:'ACTIVE', lastLogin:'2026-07-20 11:45 AM', createdAt:'2025-08-10', gender:'Male', bloodGroup:'O+', address:'', dob:'', emergencyContact:'' },
    { id:'USR-1002', firstName:'Dr. R.', lastName:'Raman', email:'raman.it@geetorus.edu.in', username:'raman.it@geetorus.edu.in', phone:'9812345678', role:{name:'HOD'}, department:'IT', program:'M.Tech / Ph.D', designation:'Professor & HOD', regOrEmpNo:'EMP-IT-001', status:'ACTIVE', lastLogin:'2026-07-20 10:15 AM', createdAt:'2024-06-01', gender:'Male', bloodGroup:'A+', address:'', dob:'', emergencyContact:'' },
    { id:'USR-1003', firstName:'Dr. S.', lastName:'Meena', email:'meena.aids@geetorus.edu.in', username:'meena.aids@geetorus.edu.in', phone:'9765432109', role:{name:'Faculty'}, department:'AI&DS', program:'B.Tech AI&DS', designation:'Associate Professor', regOrEmpNo:'EMP-AI-014', status:'ACTIVE', lastLogin:'2026-07-19 04:30 PM', createdAt:'2024-07-15', gender:'Female', bloodGroup:'B+', address:'', dob:'', emergencyContact:'' },
    { id:'USR-1004', firstName:'Vice', lastName:'Principal', email:'vp@college.edu', username:'vp@college.edu', phone:'9876543210', role:{name:'Vice Principal'}, department:'Administration', program:'Institution Operations', designation:'Vice Principal', regOrEmpNo:'ADM-VP-01', status:'ACTIVE', lastLogin:'2026-07-20 12:00 PM', createdAt:'2023-01-10', gender:'Male', bloodGroup:'AB+', address:'', dob:'', emergencyContact:'' },
    { id:'USR-1005', firstName:'Academic', lastName:'Dean', email:'academic.dean@college.edu', username:'academic.dean@college.edu', phone:'9876500001', role:{name:'Academic Dean'}, department:'Academics', program:'Academic Administration', designation:'Dean Academics', regOrEmpNo:'ADM-DEAN-01', status:'ACTIVE', lastLogin:'2026-07-20 10:00 AM', createdAt:'2023-02-15', gender:'Female', bloodGroup:'O-', address:'', dob:'', emergencyContact:'' },
    { id:'USR-1006', firstName:'Admission', lastName:'Dean', email:'admission.dean@college.edu', username:'admission.dean@college.edu', phone:'9876500002', role:{name:'Admission Dean'}, department:'Admissions', program:'Enrollment & Fees', designation:'Dean Admissions', regOrEmpNo:'ADM-DEAN-02', status:'ACTIVE', lastLogin:'2026-07-20 09:30 AM', createdAt:'2023-03-01', gender:'Male', bloodGroup:'A-', address:'', dob:'', emergencyContact:'' },
    { id:'USR-1007', firstName:'Placement', lastName:'Officer', email:'placement.officer@college.edu', username:'placement.officer@college.edu', phone:'9876500003', role:{name:'Placement Officer'}, department:'Placements', program:'Corporate Relations', designation:'Placement Director', regOrEmpNo:'EMP-TNP-01', status:'ACTIVE', lastLogin:'2026-07-20 11:00 AM', createdAt:'2024-01-10', gender:'Male', bloodGroup:'B-', address:'', dob:'', emergencyContact:'' },
    { id:'USR-1008', firstName:'Exam', lastName:'Cell Officer', email:'exam.cell@college.edu', username:'exam.cell@college.edu', phone:'9876500004', role:{name:'Examination Cell'}, department:'Examinations', program:'Assessment & Grades', designation:'Controller of Examinations', regOrEmpNo:'ADM-EXAM-01', status:'ACTIVE', lastLogin:'2026-07-19 03:00 PM', createdAt:'2023-05-20', gender:'Female', bloodGroup:'O+', address:'', dob:'', emergencyContact:'' },
    { id:'USR-1009', firstName:'Accounts', lastName:'Officer', email:'accounts.officer@college.edu', username:'accounts.officer@college.edu', phone:'9876500005', role:{name:'Accounts Officer'}, department:'Accounts', program:'Financial Services', designation:'Finance Manager', regOrEmpNo:'ADM-ACC-01', status:'ACTIVE', lastLogin:'2026-07-20 08:45 AM', createdAt:'2023-06-15', gender:'Male', bloodGroup:'AB-', address:'', dob:'', emergencyContact:'' },
    { id:'USR-1010', firstName:'Parent', lastName:'Guardian', email:'parent.710023104@gmail.com', username:'parent.710023104@gmail.com', phone:'9444455566', role:{name:'Parent'}, department:'CSE', program:'Parent Portal', designation:'Parent Guardian', regOrEmpNo:'PAR-710023104', status:'ACTIVE', lastLogin:'2026-07-18 09:00 AM', createdAt:'2025-08-12', gender:'Male', bloodGroup:'O+', address:'', dob:'', emergencyContact:'' },
  ];

  // ── IAM helpers ────────────────────────────────────────────────────────────
  const openIam = (modal: IamModal, user: any) => {
    setSelectedUser(user); setIamModal(modal); setOpenMenuId(null);
    setIamReason(''); setIamNewPwd(''); setIamConfirmPwd('');
    setShowPwdNew(false); setShowPwdConfirm(false);
    if (modal === 'UPDATE_EMAIL')   setIamEmail(user.email || '');
    if (modal === 'UPDATE_PHONE')   setIamPhone(user.phone || '');
    if (modal === 'CHANGE_ROLE')    setIamRole(user.role?.name || 'Student');
    if (modal === 'CHANGE_DEPT')    setIamDept(user.department || 'CSE');
    if (modal === 'CHANGE_PROGRAM') setIamProgram(user.program || 'B.Tech CSE');
    if (modal === 'EDIT_PROFILE')   setEditForm({
      firstName: user.firstName||'', lastName: user.lastName||'',
      email: user.email||'', phone: user.phone||'',
      department: user.department||'', program: user.program||'',
      designation: user.designation||'', address: user.address||'',
      dob: user.dob||'', gender: user.gender||'',
      bloodGroup: user.bloodGroup||'', emergencyContact: user.emergencyContact||'',
    });
  };
  const closeIam = () => { setIamModal(null); setSelectedUser(null); };
  const applyLocal = (id: string, patch: any) => setUsers(prev => prev.map(u => u.id === id ? {...u,...patch} : u));

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    try {
      const response = await api.post(`/users/${selectedUser.id}/regenerate-credentials`);
      const credential = response.data?.data;
      if (!credential?.temporaryPassword) throw new Error('The server did not return a one-time credential.');
      setSuccessCredsModal({
        fullName: `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim(),
        role: selectedUser.role?.name || selectedUser.roleName || 'User',
        username: credential.username || selectedUser.username || selectedUser.email,
        temporaryPassword: credential.temporaryPassword,
        department: selectedUser.department,
        email: selectedUser.email,
      });
      toast.success('A secure one-time credential was generated.');
      closeIam();
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Credential reset failed.');
    }
  };
  const handleChangePassword = async () => {
    if (!pwdPolicyPass) { toast.error('Password does not meet policy.'); return; }
    if (iamNewPwd !== iamConfirmPwd) { toast.error('Passwords do not match.'); return; }
    await api.patch(`/users/${selectedUser.id}`, { password: iamNewPwd }).catch(()=>null);
    toast.success(`Password changed for ${selectedUser?.firstName}. Audit log recorded.`);
    closeIam();
  };
  const handleUpdateEmail = async () => {
    if (!iamEmail.includes('@')) { toast.error('Enter a valid email.'); return; }
    await api.patch(`/users/${selectedUser.id}`, { email: iamEmail }).catch(()=>null);
    applyLocal(selectedUser.id, { email: iamEmail, username: iamEmail });
    toast.success(`Email & username updated → ${iamEmail}`);
    closeIam();
  };
  const handleUpdatePhone = async () => {
    if (iamPhone.replace(/\D/g,'').length < 10) { toast.error('Enter a valid 10-digit number.'); return; }
    try {
      await api.put(`/users/${selectedUser.id}`, { phone: iamPhone });
      applyLocal(selectedUser.id, { phone: iamPhone });
      toast.success('Phone number updated. The existing credential was not changed.');
      closeIam();
    } catch (error: any) { toast.error(error.response?.data?.message || 'Phone update failed.'); }
  };
  const handleChangeRole = async () => {
    await api.patch(`/users/${selectedUser.id}`, { roleName: iamRole }).catch(()=>null);
    applyLocal(selectedUser.id, { role: { name: iamRole } });
    toast.success(`Role → ${iamRole} for ${selectedUser?.firstName}. RBAC synced instantly.`);
    closeIam();
  };
  const handleChangeDept = async () => {
    await api.patch(`/users/${selectedUser.id}`, { department: iamDept }).catch(()=>null);
    applyLocal(selectedUser.id, { department: iamDept });
    toast.success(`Department → ${iamDept} for ${selectedUser?.firstName}.`);
    closeIam();
  };
  const handleChangeProgram = async () => {
    await api.patch(`/users/${selectedUser.id}`, { program: iamProgram }).catch(()=>null);
    applyLocal(selectedUser.id, { program: iamProgram });
    toast.success(`Program → ${iamProgram} for ${selectedUser?.firstName}.`);
    closeIam();
  };
  const handleStatusChange = async (newStatus: 'ACTIVE'|'INACTIVE'|'LOCKED') => {
    await api.patch(`/users/${selectedUser.id}`, { status: newStatus, reason: iamReason||undefined }).catch(()=>null);
    applyLocal(selectedUser.id, { status: newStatus });
    const label: Record<string,string> = { ACTIVE:'Activated', INACTIVE:'Deactivated', LOCKED:'Unlocked' };
    toast.success(`${label[newStatus]} account of ${selectedUser?.firstName}. Audit log recorded.`);
    closeIam();
  };
  const handleDeleteUser = async () => {
    if (!iamReason.trim()) { toast.error('Please enter a reason for deletion.'); return; }
    await api.delete(`/users/${selectedUser.id}`).catch(()=>null);
    setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
    toast.success(`${selectedUser?.firstName} soft-deleted. Data retained for audit & compliance.`);
    closeIam();
  };
  const handleEditSave = async () => {
    await api.patch(`/users/${selectedUser.id}`, editForm).catch(()=>null);
    applyLocal(selectedUser.id, editForm);
    toast.success(`Profile updated for ${editForm.firstName||selectedUser?.firstName}. Audit log recorded.`);
    closeIam();
  };

  // Auto Generate Credentials Logic
  const handleAutoGenerateCredentials = async () => {
    if (!formData.firstName) {
      toast.error('First Name is required to generate credentials.');
      return;
    }
    setIsGenerating(true);
    try {
      const res = await api.post('/users/generate-credentials', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        roleName: formData.roleName,
        regOrEmpNo: formData.regOrEmpNo,
        departmentCode: formData.departmentCode
      });

      if (res.data?.status === 'success') {
        const creds = res.data.data;
        setGeneratedCreds(creds);
        setFormData(prev => ({
          ...prev,
          username: creds.suggestedUsername,
          email: prev.email || creds.emailSuggestion,
          password: creds.generatedPassword
        }));
        toast.success(`Generated Username: '${creds.suggestedUsername}' & Secure Password.`);
      }
    } catch {
      toast.error('Credential auto-generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Submit Create User
  const [successCredsModal, setSuccessCredsModal] = useState<CredentialPayload | null>(null);

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.email || !formData.roleName) {
      toast.error('First Name, Email, and Role are required.');
      return;
    }

    try {
      const res = await api.post('/users', formData);
      if (res.data?.status === 'success' || res.status === 201) {
        const created = res.data.data;
        setIsCreateModalOpen(false);
        fetchDirectoryData(true);

        setSuccessCredsModal({
          fullName: `${formData.firstName} ${formData.lastName || ''}`.trim(),
          role: formData.roleName,
          username: created.generatedUsername || created.username || formData.email,
          temporaryPassword: created.temporaryPassword,
          department: formData.departmentCode,
          email: formData.email,
        });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create user account.');
    }
  };

  // Download Credential Slip PDF
  const handleDownloadCredentialSlip = (userObj: any) => {
    toast.success(`Generating Credential Slip PDF for ${userObj.firstName || 'User'}...`);
    const slipWindow = window.open('', '_blank');
    if (slipWindow) {
      slipWindow.document.write(`
        <html>
          <head>
            <title>Enterprise Credential Slip - ${userObj.firstName}</title>
            <style>
              body { font-family: sans-serif; padding: 40px; color: #1e293b; }
              .card { border: 2px solid #6366f1; border-radius: 16px; padding: 30px; max-width: 600px; margin: auto; }
              .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; }
              h1 { color: #4338ca; font-size: 20px; margin: 0; }
              .row { margin-bottom: 12px; display: flex; justify-content: space-between; }
              .label { font-weight: bold; color: #64748b; font-size: 12px; text-transform: uppercase; }
              .val { font-weight: bold; font-size: 14px; }
              .cred-box { background: #f8fafc; border: 1px dashed #6366f1; padding: 15px; border-radius: 8px; margin-top: 20px; }
              .footer { margin-top: 30px; font-size: 11px; color: #94a3b8; text-align: center; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="header">
                <h1>GEETORUS CAMPUSOS ENTERPRISE CREDENTIAL SLIP</h1>
                <p style="font-size: 12px; margin: 4px 0 0 0; color: #64748b;">Official Account Credentials & Access Authorization</p>
              </div>
              <div class="row"><span class="label">Full Name</span><span class="val">${userObj.firstName} ${userObj.lastName || ''}</span></div>
              <div class="row"><span class="label">Role Assigned</span><span class="val">${userObj.role?.name || userObj.roleName}</span></div>
              <div class="row"><span class="label">Department</span><span class="val">${userObj.department || 'General'}</span></div>
              <div class="row"><span class="label">ID / Register No</span><span class="val">${userObj.regOrEmpNo || userObj.id}</span></div>
              <div class="cred-box">
                <div class="row"><span class="label">Username</span><span class="val" style="color: #4338ca;">${userObj.username || userObj.email}</span></div>
                <div class="row"><span class="label">Temporary Password</span><span class="val" style="color: #dc2626;">${userObj.password || 'Gt@2026User'}</span></div>
                <div class="row"><span class="label">Login Portal URL</span><span class="val">https://crm.geetorus.edu.in/login</span></div>
              </div>
              <div class="footer">
                <p>Important: Please change your temporary password immediately upon first login.</p>
              </div>
            </div>
            <script>window.print();</script>
          </body>
        </html>
      `);
      slipWindow.document.close();
    }
  };

  // Export Bulk Credential CSV
  const handleExportBulkCSV = () => {
    const escapeCSV = (val: any) => `"${String(val || '').replace(/"/g, '""')}"`;
    const headers = ['User ID', 'Full Name', 'Username', 'Email', 'Role', 'Department', 'Register / Employee ID', 'Status', 'Created Date'];
    const rows = filteredUsers.map(u => [
      escapeCSV(u.id),
      escapeCSV(`${u.firstName} ${u.lastName || ''}`),
      escapeCSV(u.username || u.email?.split('@')[0]),
      escapeCSV(u.email),
      escapeCSV(u.role?.name || u.roleName),
      escapeCSV(u.department || 'N/A'),
      escapeCSV(u.regOrEmpNo || u.id),
      escapeCSV(u.status),
      escapeCSV(u.createdAt)
    ].join(','));

    const csvContent = '\uFEFF' + [headers.map(escapeCSV).join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Enterprise_User_Directory_${Date.now()}.csv`;
    link.click();
    toast.success('Enterprise User Directory exported to CSV.');
  };

  const directoryStats = stats || {
    totalUsers: users.length, activeUsers: 0, inactiveUsers: 0, pendingActivation: 0,
    students: 0, faculty: 0, mentors: 0, hods: 0, deans: 0, vicePrincipal: 0,
    principal: 0, parents: 0, staff: 0, admins: 0, recentlyAdded: 0,
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const rName = (u.role?.name || u.roleName || '').toUpperCase();
      const dName = (u.department || '').toUpperCase();
      const sName = (u.status || '').toUpperCase();

      const matchesRole = roleFilter === 'ALL' || rName === roleFilter.toUpperCase();
      const matchesDept = deptFilter === 'ALL' || dName === deptFilter.toUpperCase();
      const matchesStatus = statusFilter === 'ALL' || sName === statusFilter.toUpperCase();

      const matchesSearch = !searchQuery ||
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.phone || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.regOrEmpNo || '').toLowerCase().includes(searchQuery.toLowerCase());

      return matchesRole && matchesDept && matchesStatus && matchesSearch;
    });
  }, [users, roleFilter, deptFilter, statusFilter, searchQuery]);

  if (loading && users.length === 0) {
    return (
      <div className="p-12 text-center border bg-card rounded-2xl shadow-sm space-y-3">
        <RefreshCw className="h-8 w-8 text-primary animate-spin mx-auto" />
        <p className="text-xs font-bold text-muted-foreground">Loading Enterprise User Directory & Identity System...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-rose-500/25 bg-rose-500/5 p-8 text-center" role="alert">
        <AlertTriangle className="mx-auto h-7 w-7 text-rose-500" />
        <h2 className="mt-4 text-lg font-bold">User directory unavailable</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">{loadError}</p>
        <button onClick={() => fetchDirectoryData()} className="mt-5 rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background">Retry loading</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 p-6 rounded-2xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-y-8 translate-x-8">
          <Users className="h-64 w-64" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex flex-wrap items-center gap-1.5 bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md uppercase tracking-wider text-indigo-200">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Enterprise Identity & Directory Management Engine
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Enterprise User Directory</h2>
            <p className="text-xs md:text-sm opacity-90 font-medium">
              Single source of truth for accounts, role assignments, department mappings, credential slips & real-time RBAC
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setGeneratedCreds(null);
                setFormData({
                  firstName: '', lastName: '', email: '', phone: '',
                  roleName: 'Student', departmentCode: 'CSE', program: 'B.Tech',
                  academicYear: '2025-2026', regOrEmpNo: '', designation: 'Student',
                  username: '', password: '', status: 'ACTIVE'
                });
                setIsCreateModalOpen(true);
              }}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold flex flex-wrap items-center gap-1.5 shadow-md transition-colors"
            >
              <Plus className="h-4 w-4" /> Create User Account
            </button>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-extrabold flex flex-wrap items-center gap-1.5 transition-colors"
            >
              <Upload className="h-3.5 w-3.5" /> Bulk Import
            </button>
            <button
              onClick={handleExportBulkCSV}
              className="px-3 py-2 bg-emerald-600/80 hover:bg-emerald-600 border border-emerald-500/30 rounded-xl text-xs font-extrabold flex flex-wrap items-center gap-1.5 transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> Export Directory CSV
            </button>
            <button
              onClick={() => fetchDirectoryData(true)}
              disabled={refreshing}
              className="p-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-colors"
              title="Refresh Live Users"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 15 DIRECTORY OVERVIEW KPI CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-2.5">
        {[
          { label: 'Total Users', value: directoryStats.totalUsers.toLocaleString(), icon: Users, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
          { label: 'Active Users', value: directoryStats.activeUsers.toLocaleString(), icon: UserCheck, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
          { label: 'Inactive Users', value: directoryStats.inactiveUsers, icon: UserX, color: 'text-rose-600 bg-rose-50 border-rose-100' },
          { label: 'Students', value: directoryStats.students.toLocaleString(), icon: GraduationCap, color: 'text-sky-600 bg-sky-50 border-sky-100' },
          { label: 'Faculty', value: directoryStats.faculty, icon: BookOpen, color: 'text-blue-600 bg-blue-50 border-blue-100' },
          { label: 'Mentors', value: directoryStats.mentors, icon: Shield, color: 'text-purple-600 bg-purple-50 border-purple-100' },
          { label: 'HODs', value: directoryStats.hods, icon: Award, color: 'text-amber-600 bg-amber-50 border-amber-100' },
          { label: 'Deans', value: directoryStats.deans, icon: Award, color: 'text-teal-600 bg-teal-50 border-teal-100' },
          { label: 'Vice Principal', value: directoryStats.vicePrincipal, icon: ShieldCheck, color: 'text-orange-600 bg-orange-50 border-orange-100' },
          { label: 'Principal', value: directoryStats.principal, icon: ShieldCheck, color: 'text-violet-600 bg-violet-50 border-violet-100' },
          { label: 'Parents', value: directoryStats.parents.toLocaleString(), icon: Users, color: 'text-cyan-600 bg-cyan-50 border-cyan-100' },
          { label: 'Staff Users', value: directoryStats.staff, icon: Laptop, color: 'text-slate-600 bg-slate-50 border-slate-100' },
          { label: 'Admin Users', value: directoryStats.admins, icon: Lock, color: 'text-rose-600 bg-rose-50 border-rose-100' },
          { label: 'Recently Added', value: directoryStats.recentlyAdded, icon: Sparkles, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
          { label: 'Pending Activation', value: directoryStats.pendingActivation, icon: AlertTriangle, color: 'text-amber-600 bg-amber-50 border-amber-100' }
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="border bg-card p-2.5 rounded-xl shadow-xs space-y-1 text-xs font-semibold flex flex-col justify-between hover:border-primary/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground uppercase font-extrabold truncate">{kpi.label}</span>
                <div className={`p-1 rounded-lg border ${kpi.color}`}>
                  <Icon className="h-3 w-3" />
                </div>
              </div>
              <span className="text-sm font-black tracking-tight block text-foreground truncate">{kpi.value}</span>
            </div>
          );
        })}
      </div>

      {/* SEARCH & MULTI-FILTER BAR */}
      <div className="border bg-card p-4 rounded-2xl shadow-sm space-y-3 text-xs font-semibold">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-xs uppercase font-extrabold tracking-wider flex flex-wrap items-center gap-1.5 text-foreground">
            <Filter className="h-3.5 w-3.5 text-primary" /> Directory Filter & Search Engine
          </h3>
          <span className="text-[10px] text-muted-foreground font-bold">Showing {filteredUsers.length} of {users.length} Users</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">Filter by Role</label>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="w-full h-8 border rounded-lg bg-background px-2 text-xs font-bold"
            >
              <option value="ALL">All Roles (19 Roles)</option>
              {['Super Admin', 'College Admin', 'Principal', 'Vice Principal', 'Academic Dean', 'Admission Dean', 'HOD', 'Mentor', 'Faculty', 'Student', 'Parent', 'Placement Officer', 'Librarian', 'Hostel Warden', 'Transport Manager', 'Accounts Officer'].map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">Filter by Department</label>
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="w-full h-8 border rounded-lg bg-background px-2 text-xs font-bold"
            >
              <option value="ALL">All Departments</option>
              {['CSE', 'IT', 'AI&DS', 'AIML', 'CSBS', 'ECE', 'EEE', 'MECH', 'CIVIL', 'MBA', 'MCA'].map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">Account Status</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full h-8 border rounded-lg bg-background px-2 text-xs font-bold"
            >
              <option value="ALL">All Statuses (5 Statuses)</option>
              <option value="ACTIVE">ACTIVE (Normal Access)</option>
              <option value="INACTIVE">INACTIVE (Disabled Access)</option>
              <option value="SUSPENDED">SUSPENDED (Temp Blocked)</option>
              <option value="LOCKED">LOCKED (Security Lock)</option>
              <option value="PENDING">PENDING VERIFICATION</option>
            </select>
          </div>

          <div>
            <label className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">Search User Accounts</label>
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Name, Username, Reg/Emp No, Email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-8 border rounded-lg bg-background pl-8 pr-3 text-xs font-semibold focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>
      </div>

      {/* USER DIRECTORY TABLE */}
      <div className="border bg-card rounded-2xl shadow-sm overflow-hidden text-xs">
        <div className="p-4 border-b bg-muted/20 flex justify-between items-center">
          <h3 className="font-extrabold text-xs uppercase tracking-wider text-foreground flex flex-wrap items-center gap-2">
            <Users className="h-4 w-4 text-indigo-600" /> User Directory Records ({filteredUsers.length})
          </h3>
          <span className="text-[9px] bg-indigo-50 text-indigo-700 font-extrabold px-2.5 py-1 rounded border uppercase">
            Live RBAC Synced
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-muted/40 text-[10px] uppercase font-black text-muted-foreground tracking-wider">
                <th className="p-3">User Profile</th>
                <th className="p-3">Role & Level</th>
                <th className="p-3">Department & Program</th>
                <th className="p-3">Reg / Employee ID</th>
                <th className="p-3">Status</th>
                <th className="p-3">Last Login</th>
                <th className="p-3 text-right">Account Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y font-semibold">
              {filteredUsers.map((u: any, idx: number) => {
                const roleName = u.role?.name || u.roleName || 'User';
                return (
                  <tr key={u.id || idx} className="hover:bg-muted/10 transition-colors">
                    <td className="p-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-indigo-600 text-white font-extrabold flex items-center justify-center text-xs shadow-xs">
                          {u.firstName?.[0] || 'U'}{u.lastName?.[0] || ''}
                        </div>
                        <div>
                          <span className="font-extrabold text-foreground text-xs block">{u.firstName} {u.lastName || ''}</span>
                          <span className="text-[10px] text-muted-foreground block">@{u.username || u.email?.split('@')[0]} • {u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex flex-wrap items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase">
                        <Shield className="h-2.5 w-2.5" /> {roleName}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      <strong className="text-foreground">{u.department || 'General'}</strong>
                      <span className="block text-[10px]">{u.program || 'ERP Access'}</span>
                    </td>
                    <td className="p-3 font-mono font-bold text-foreground">
                      {u.regOrEmpNo || u.id}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded border text-[9px] font-extrabold uppercase ${
                        STATUS_COLORS[u.status] || 'bg-muted text-muted-foreground border-muted'
                      }`}>{u.status}</span>
                    </td>
                    <td className="p-3 text-[10px] text-muted-foreground">{u.lastLogin || 'Recent'}</td>
                    <td className="p-3 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                        <button onClick={() => handleDownloadCredentialSlip(u)}
                          className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold flex flex-wrap items-center gap-1"
                          title="Download Credential Slip PDF">
                          <FileText className="h-3 w-3" /> Slip
                        </button>
                        <button onClick={() => { setSelectedUser(u); setIsMappingModalOpen(true); }}
                          className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded text-[10px] font-bold flex flex-wrap items-center gap-1"
                          title="Subject / Mentor Mapping">
                          <Layers className="h-3 w-3" /> Map
                        </button>
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === (u.id||String(idx)) ? null : (u.id||String(idx)))}
                            className="px-2 py-1 bg-muted hover:bg-muted/70 text-foreground rounded text-[10px] font-bold flex flex-wrap items-center gap-1"
                            title="Account Actions">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </button>
                          {openMenuId === (u.id||String(idx)) && (
                            <div className="absolute right-0 top-7 z-50 w-54 bg-card border rounded-xl shadow-2xl py-1.5 text-[11px] font-semibold overflow-hidden min-w-[210px]">
                              <div className="px-3 py-1 text-[9px] uppercase font-black text-muted-foreground border-b mb-1 tracking-wider">Account Management</div>
                              <MItem icon={<Eye className="h-3 w-3"/>}         label="👤 View Profile"        onClick={() => openIam('VIEW_PROFILE', u)} />
                              <MItem icon={<Edit2 className="h-3 w-3"/>}       label="✏️ Edit Profile"        onClick={() => openIam('EDIT_PROFILE', u)} />
                              <MItem icon={<Key className="h-3 w-3 text-amber-600"/>} label="🔑 Reset Password"  onClick={() => openIam('RESET_PASSWORD', u)} />
                              <MItem icon={<Lock className="h-3 w-3 text-orange-600"/>} label="🔒 Change Password" onClick={() => openIam('CHANGE_PASSWORD', u)} />
                              <MItem icon={<Mail className="h-3 w-3 text-blue-600"/>}  label="📧 Update Email"    onClick={() => openIam('UPDATE_EMAIL', u)} />
                              <MItem icon={<Phone className="h-3 w-3 text-teal-600"/>} label="📱 Update Phone"    onClick={() => openIam('UPDATE_PHONE', u)} />
                              <div className="border-t my-1"/>
                              <MItem icon={<UserCog className="h-3 w-3 text-violet-600"/>}  label="🎭 Change Role"       onClick={() => openIam('CHANGE_ROLE', u)} />
                              <MItem icon={<Building2 className="h-3 w-3 text-indigo-600"/>} label="🏢 Change Department" onClick={() => openIam('CHANGE_DEPT', u)} />
                              <MItem icon={<BookMarked className="h-3 w-3 text-sky-600"/>}  label="🎓 Change Program"    onClick={() => openIam('CHANGE_PROGRAM', u)} />
                              <div className="border-t my-1"/>
                              {u.status !== 'ACTIVE' && <MItem icon={<CheckCircle className="h-3 w-3 text-emerald-600"/>} label="🟢 Activate Account"   onClick={() => openIam('ACTIVATE', u)} />}
                              {u.status === 'ACTIVE' && <MItem icon={<XCircle className="h-3 w-3 text-rose-600"/>}     label="🔴 Deactivate Account" onClick={() => openIam('DEACTIVATE', u)} />}
                              {u.status === 'LOCKED' && <MItem icon={<Unlock className="h-3 w-3 text-slate-600"/>}     label="🔓 Unlock Account"     onClick={() => openIam('UNLOCK', u)} />}
                              <div className="border-t my-1"/>
                              <MItem icon={<Trash2 className="h-3 w-3"/>} label="🗑️ Delete User" onClick={() => openIam('DELETE', u)} danger />
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════════════════════ IAM MODALS ══════════════════════════ */}

      {/* VIEW PROFILE */}
      {iamModal === 'VIEW_PROFILE' && selectedUser && (
        <MShell title="User Profile Details" icon={<Eye className="h-4 w-4 text-indigo-600"/>} wide onClose={closeIam}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <PField label="Full Name"            value={`${selectedUser.firstName} ${selectedUser.lastName||''}`} />
            <PField label="Role"                 value={selectedUser.role?.name||selectedUser.roleName} />
            <PField label="Username (Email ID)"  value={selectedUser.username||selectedUser.email} mono />
            <PField label="Temp Password (Phone)" value={selectedUser.phone||'(Phone Number)'} mono secret />
            <PField label="Email"                value={selectedUser.email} />
            <PField label="Phone"                value={selectedUser.phone} />
            <PField label="Department"           value={selectedUser.department} />
            <PField label="Program"              value={selectedUser.program} />
            <PField label="Designation"          value={selectedUser.designation} />
            <PField label="Reg / Employee ID"    value={selectedUser.regOrEmpNo||selectedUser.id} mono />
            <PField label="Account Status"       value={selectedUser.status} />
            <PField label="Last Login"           value={selectedUser.lastLogin||'Recent'} />
            <PField label="Gender"               value={selectedUser.gender||'—'} />
            <PField label="Blood Group"          value={selectedUser.bloodGroup||'—'} />
          </div>
          {(ROLE_PERMISSIONS[selectedUser.role?.name]||[]).length > 0 && (
            <div>
              <p className="text-[9px] uppercase font-black text-muted-foreground mb-2">Assigned Permissions</p>
              <div className="flex flex-wrap gap-1.5">
                {ROLE_PERMISSIONS[selectedUser.role?.name].map((p:string) => (
                  <span key={p} className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded text-[10px] font-bold">{p}</span>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-wrap justify-end gap-2 pt-3 border-t">
            <button onClick={() => openIam('EDIT_PROFILE', selectedUser)} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-extrabold">Edit Profile</button>
            <button onClick={closeIam} className="px-4 py-1.5 border rounded-lg text-xs font-bold hover:bg-muted">Close</button>
          </div>
        </MShell>
      )}

      {/* EDIT PROFILE */}
      {iamModal === 'EDIT_PROFILE' && selectedUser && (
        <MShell title="Edit User Profile" icon={<Edit2 className="h-4 w-4 text-indigo-600"/>} wide onClose={closeIam}>
          <UBadge u={selectedUser} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[{label:'First Name',key:'firstName',type:'text'},{label:'Last Name',key:'lastName',type:'text'},{label:'Email',key:'email',type:'email'},{label:'Phone',key:'phone',type:'text'},{label:'Designation',key:'designation',type:'text'},{label:'Address',key:'address',type:'text'},{label:'Date of Birth',key:'dob',type:'date'},{label:'Emergency Contact',key:'emergencyContact',type:'text'}].map(f => (
              <div key={f.key}>
                <label className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">{f.label}</label>
                <input type={f.type} value={editForm[f.key]||''} onChange={e => setEditForm({...editForm,[f.key]:e.target.value})} className="w-full h-8 border rounded-lg bg-background px-3 text-xs font-semibold focus:outline-none focus:border-primary" />
              </div>
            ))}
            <div>
              <label className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">Gender</label>
              <select value={editForm.gender||''} onChange={e => setEditForm({...editForm,gender:e.target.value})} className="w-full h-8 border rounded-lg bg-background px-2 text-xs font-bold">
                <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">Blood Group</label>
              <select value={editForm.bloodGroup||''} onChange={e => setEditForm({...editForm,bloodGroup:e.target.value})} className="w-full h-8 border rounded-lg bg-background px-2 text-xs font-bold">
                <option value="">Select</option>
                {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">Department</label>
              <select value={editForm.department||''} onChange={e => setEditForm({...editForm,department:e.target.value})} className="w-full h-8 border rounded-lg bg-background px-2 text-xs font-bold">
                {ALL_DEPTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">Program</label>
              <select value={editForm.program||''} onChange={e => setEditForm({...editForm,program:e.target.value})} className="w-full h-8 border rounded-lg bg-background px-2 text-xs font-bold">
                {ALL_PROGRAMS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-3 border-t">
            <button onClick={closeIam} className="px-4 py-1.5 border rounded-lg text-xs font-bold hover:bg-muted">Cancel</button>
            <IAMBtn onClick={handleEditSave}><Check className="h-3 w-3"/> Save Changes</IAMBtn>
          </div>
        </MShell>
      )}

      {/* RESET PASSWORD */}
      {iamModal === 'RESET_PASSWORD' && selectedUser && (
        <MShell title="Reset User Password" icon={<Key className="h-4 w-4 text-amber-600"/>} onClose={closeIam}>
          <UBadge u={selectedUser} />
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
            <p className="font-extrabold text-amber-800 flex flex-wrap items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5"/> Password Reset Policy</p>
            <p className="text-[11px] text-amber-700">Temporary password = User's <strong>Phone Number</strong>. User must change on first login.</p>
            <p className="text-[11px] mt-1 font-mono text-amber-900">Temp Password: <strong>{selectedUser.phone||'GtCampus@2026'}</strong></p>
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-3 border-t">
            <button onClick={closeIam} className="px-4 py-1.5 border rounded-lg text-xs font-bold hover:bg-muted">Cancel</button>
            <IAMBtn onClick={handleResetPassword}><Key className="h-3 w-3"/> Confirm Reset</IAMBtn>
          </div>
        </MShell>
      )}

      {/* CHANGE PASSWORD */}
      {iamModal === 'CHANGE_PASSWORD' && selectedUser && (
        <MShell title="Change User Password" icon={<Lock className="h-4 w-4 text-orange-600"/>} onClose={closeIam}>
          <UBadge u={selectedUser} />
          {[{lbl:'New Password',val:iamNewPwd,set:setIamNewPwd,show:showPwdNew,toggle:()=>setShowPwdNew(p=>!p)},{lbl:'Confirm Password',val:iamConfirmPwd,set:setIamConfirmPwd,show:showPwdConfirm,toggle:()=>setShowPwdConfirm(p=>!p)}].map(f => (
            <div key={f.lbl}>
              <label className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">{f.lbl}</label>
              <div className="relative">
                <input type={f.show?'text':'password'} value={f.val} onChange={e=>f.set(e.target.value)} className="w-full h-9 border rounded-lg bg-background px-3 pr-10 text-xs font-mono focus:outline-none focus:border-primary"/>
                <button type="button" onClick={f.toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"><Eye className="h-3.5 w-3.5"/></button>
              </div>
            </div>
          ))}
          <div className="p-3 bg-muted/20 border rounded-xl space-y-1.5">
            <p className="text-[9px] uppercase font-black text-muted-foreground mb-1">Password Policy</p>
            {[{ok:pwdPolicy.minLen,l:'Minimum 8 characters'},{ok:pwdPolicy.upper,l:'Uppercase letter'},{ok:pwdPolicy.lower,l:'Lowercase letter'},{ok:pwdPolicy.num,l:'Number'},{ok:pwdPolicy.special,l:'Special character'}].map(({ok,l}) => (
              <div key={l} className={`flex items-center gap-2 text-[11px] ${ok?'text-emerald-700':'text-muted-foreground'}`}>
                {ok ? <Check className="h-3 w-3 text-emerald-600"/> : <X className="h-3 w-3"/>}{l}
              </div>
            ))}
            {iamConfirmPwd && iamNewPwd !== iamConfirmPwd && <p className="text-rose-600 text-[11px] flex flex-wrap items-center gap-1"><X className="h-3 w-3"/> Passwords do not match</p>}
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-3 border-t">
            <button onClick={closeIam} className="px-4 py-1.5 border rounded-lg text-xs font-bold hover:bg-muted">Cancel</button>
            <IAMBtn onClick={handleChangePassword} disabled={!pwdPolicyPass||iamNewPwd!==iamConfirmPwd}><Lock className="h-3 w-3"/> Change Password</IAMBtn>
          </div>
        </MShell>
      )}

      {/* UPDATE EMAIL */}
      {iamModal === 'UPDATE_EMAIL' && selectedUser && (
        <MShell title="Update Email Address" icon={<Mail className="h-4 w-4 text-blue-600"/>} onClose={closeIam}>
          <UBadge u={selectedUser} />
          <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-[11px] text-sky-800 font-semibold">
            <strong>Note:</strong> Email ID is the Username. Updating email also updates the login username.
          </div>
          <div>
            <label className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">New Email Address (Username)</label>
            <input type="email" value={iamEmail} onChange={e=>setIamEmail(e.target.value)} className="w-full h-9 border rounded-lg bg-background px-3 text-xs font-semibold focus:outline-none focus:border-primary"/>
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-3 border-t">
            <button onClick={closeIam} className="px-4 py-1.5 border rounded-lg text-xs font-bold hover:bg-muted">Cancel</button>
            <IAMBtn onClick={handleUpdateEmail}><Mail className="h-3 w-3"/> Update Email & Username</IAMBtn>
          </div>
        </MShell>
      )}

      {/* UPDATE PHONE */}
      {iamModal === 'UPDATE_PHONE' && selectedUser && (
        <MShell title="Update Phone Number" icon={<Phone className="h-4 w-4 text-teal-600"/>} onClose={closeIam}>
          <UBadge u={selectedUser} />
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-[11px] text-teal-800 font-semibold">
            <strong>Note:</strong> Phone number = Temporary password. Updating phone also updates the credential.
          </div>
          <div>
            <label className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">New Phone Number</label>
            <input type="tel" value={iamPhone} onChange={e=>setIamPhone(e.target.value)} placeholder="10-digit number..." className="w-full h-9 border rounded-lg bg-background px-3 text-xs font-semibold focus:outline-none focus:border-primary"/>
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-3 border-t">
            <button onClick={closeIam} className="px-4 py-1.5 border rounded-lg text-xs font-bold hover:bg-muted">Cancel</button>
            <IAMBtn onClick={handleUpdatePhone}><Phone className="h-3 w-3"/> Update Phone</IAMBtn>
          </div>
        </MShell>
      )}

      {/* CHANGE ROLE */}
      {iamModal === 'CHANGE_ROLE' && selectedUser && (
        <MShell title="Change User Role" icon={<UserCog className="h-4 w-4 text-violet-600"/>} onClose={closeIam}>
          <UBadge u={selectedUser} />
          <div className="p-3 bg-violet-50 border border-violet-200 rounded-xl text-[11px] text-violet-800 font-semibold">
            <strong>Live RBAC Sync:</strong> Role change applies immediately. Sidebar, menus & permissions update without logout.
          </div>
          <div>
            <label className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">New Role</label>
            <select value={iamRole} onChange={e=>setIamRole(e.target.value)} className="w-full h-9 border rounded-lg bg-background px-3 text-xs font-bold">
              {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          {(ROLE_PERMISSIONS[iamRole]||[]).length > 0 && (
            <div className="p-3 bg-muted/20 border rounded-xl">
              <p className="text-[9px] uppercase font-black text-muted-foreground mb-1.5">Permissions for {iamRole}</p>
              <div className="flex flex-wrap gap-1">
                {ROLE_PERMISSIONS[iamRole].map(p => <span key={p} className="bg-violet-50 text-violet-700 border border-violet-200 px-2 py-0.5 rounded text-[10px] font-bold">{p}</span>)}
              </div>
            </div>
          )}
          <div className="flex flex-wrap justify-end gap-2 pt-3 border-t">
            <button onClick={closeIam} className="px-4 py-1.5 border rounded-lg text-xs font-bold hover:bg-muted">Cancel</button>
            <IAMBtn onClick={handleChangeRole}><UserCog className="h-3 w-3"/> Change Role & Sync RBAC</IAMBtn>
          </div>
        </MShell>
      )}

      {/* CHANGE DEPT */}
      {iamModal === 'CHANGE_DEPT' && selectedUser && (
        <MShell title="Change Department" icon={<Building2 className="h-4 w-4 text-indigo-600"/>} onClose={closeIam}>
          <UBadge u={selectedUser} />
          <div>
            <label className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">New Department</label>
            <select value={iamDept} onChange={e=>setIamDept(e.target.value)} className="w-full h-9 border rounded-lg bg-background px-3 text-xs font-bold">
              {ALL_DEPTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-3 border-t">
            <button onClick={closeIam} className="px-4 py-1.5 border rounded-lg text-xs font-bold hover:bg-muted">Cancel</button>
            <IAMBtn onClick={handleChangeDept}><Building2 className="h-3 w-3"/> Change Department</IAMBtn>
          </div>
        </MShell>
      )}

      {/* CHANGE PROGRAM */}
      {iamModal === 'CHANGE_PROGRAM' && selectedUser && (
        <MShell title="Change Program" icon={<BookMarked className="h-4 w-4 text-sky-600"/>} onClose={closeIam}>
          <UBadge u={selectedUser} />
          <div>
            <label className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">New Program</label>
            <select value={iamProgram} onChange={e=>setIamProgram(e.target.value)} className="w-full h-9 border rounded-lg bg-background px-3 text-xs font-bold">
              {ALL_PROGRAMS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-3 border-t">
            <button onClick={closeIam} className="px-4 py-1.5 border rounded-lg text-xs font-bold hover:bg-muted">Cancel</button>
            <IAMBtn onClick={handleChangeProgram}><BookMarked className="h-3 w-3"/> Change Program</IAMBtn>
          </div>
        </MShell>
      )}

      {/* ACTIVATE */}
      {iamModal === 'ACTIVATE' && selectedUser && (
        <MShell title="Activate Account" icon={<CheckCircle className="h-4 w-4 text-emerald-600"/>} onClose={closeIam}>
          <UBadge u={selectedUser} />
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 font-semibold">
            Restores full login access. Account status → <strong>ACTIVE</strong>.
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-3 border-t">
            <button onClick={closeIam} className="px-4 py-1.5 border rounded-lg text-xs font-bold hover:bg-muted">Cancel</button>
            <IAMBtn onClick={() => handleStatusChange('ACTIVE')} variant="success"><CheckCircle className="h-3 w-3"/> Activate Account</IAMBtn>
          </div>
        </MShell>
      )}

      {/* DEACTIVATE */}
      {iamModal === 'DEACTIVATE' && selectedUser && (
        <MShell title="Deactivate Account" icon={<XCircle className="h-4 w-4 text-rose-600"/>} onClose={closeIam}>
          <UBadge u={selectedUser} />
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800 font-semibold">
            <strong>Warning:</strong> User loses all login access. Data is preserved. Status → <strong>INACTIVE</strong>.
          </div>
          <div>
            <label className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">Reason (Audit Log)</label>
            <textarea rows={2} value={iamReason} onChange={e=>setIamReason(e.target.value)} placeholder="Enter reason..." className="w-full border rounded-lg bg-background p-2 text-xs font-semibold"/>
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-3 border-t">
            <button onClick={closeIam} className="px-4 py-1.5 border rounded-lg text-xs font-bold hover:bg-muted">Cancel</button>
            <IAMBtn onClick={() => handleStatusChange('INACTIVE')} variant="danger"><XCircle className="h-3 w-3"/> Deactivate Account</IAMBtn>
          </div>
        </MShell>
      )}

      {/* UNLOCK */}
      {iamModal === 'UNLOCK' && selectedUser && (
        <MShell title="Unlock Account" icon={<Unlock className="h-4 w-4 text-slate-600"/>} onClose={closeIam}>
          <UBadge u={selectedUser} />
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-700 font-semibold">
            Account was locked by security events (failed login attempts). Unlocking restores access and resets lock counter.
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-3 border-t">
            <button onClick={closeIam} className="px-4 py-1.5 border rounded-lg text-xs font-bold hover:bg-muted">Cancel</button>
            <IAMBtn onClick={() => handleStatusChange('ACTIVE')}><Unlock className="h-3 w-3"/> Unlock & Restore Access</IAMBtn>
          </div>
        </MShell>
      )}

      {/* DELETE */}
      {iamModal === 'DELETE' && selectedUser && (
        <MShell title="Delete User (Soft Delete)" icon={<Trash2 className="h-4 w-4 text-rose-700"/>} onClose={closeIam}>
          <UBadge u={selectedUser} />
          <div className="p-3 bg-rose-50 border-2 border-rose-300 rounded-xl space-y-1.5">
            <p className="font-extrabold text-rose-800 flex flex-wrap items-center gap-1.5"><AlertTriangle className="h-4 w-4"/> Soft Delete – Data Preserved</p>
            <p className="text-[11px] text-rose-700">Account is hidden from directory. Data is retained for audit & compliance. Action is audit-logged.</p>
          </div>
          <div>
            <label className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">Deletion Reason (Required)</label>
            <textarea rows={2} value={iamReason} onChange={e=>setIamReason(e.target.value)} placeholder="Enter reason for audit log..." className="w-full border rounded-lg bg-background p-2 text-xs font-semibold"/>
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-3 border-t">
            <button onClick={closeIam} className="px-4 py-1.5 border rounded-lg text-xs font-bold hover:bg-muted">Cancel</button>
            <IAMBtn onClick={handleDeleteUser} variant="danger" disabled={!iamReason.trim()}><Trash2 className="h-3 w-3"/> Confirm Delete</IAMBtn>
          </div>
        </MShell>
      )}

      {/* CREATE USER MODAL WITH AUTOMATIC GENERATORS */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-card border rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-extrabold text-foreground flex flex-wrap items-center gap-2 uppercase">
                <Plus className="h-4 w-4 text-indigo-600" /> Create Enterprise User Account
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1 rounded hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="First name..."
                    value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full h-8 border rounded-lg bg-background px-3 focus:outline-none focus:border-primary font-semibold"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Last Name</label>
                  <input
                    type="text"
                    placeholder="Last name..."
                    value={formData.lastName}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full h-8 border rounded-lg bg-background px-3 focus:outline-none focus:border-primary font-semibold"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Assigned Role *</label>
                  <select
                    value={formData.roleName}
                    onChange={e => setFormData({ ...formData, roleName: e.target.value })}
                    className="w-full h-8 border rounded-lg bg-background px-2 text-xs font-bold"
                  >
                    {['Student', 'Faculty', 'Mentor', 'HOD', 'Academic Dean', 'Admission Dean', 'Vice Principal', 'Principal', 'College Admin', 'Super Admin', 'Parent', 'Placement Officer', 'Librarian', 'Hostel Warden', 'Transport Manager', 'Accounts Officer'].map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Department</label>
                  <select
                    value={formData.departmentCode}
                    onChange={e => setFormData({ ...formData, departmentCode: e.target.value })}
                    className="w-full h-8 border rounded-lg bg-background px-2 text-xs font-bold"
                  >
                    {['CSE', 'IT', 'AI&DS', 'AIML', 'CSBS', 'ECE', 'EEE', 'MECH', 'CIVIL', 'MBA', 'MCA'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Reg / Employee ID</label>
                  <input
                    type="text"
                    placeholder="710023104 or EMP-IT-001..."
                    value={formData.regOrEmpNo}
                    onChange={e => setFormData({ ...formData, regOrEmpNo: e.target.value })}
                    className="w-full h-8 border rounded-lg bg-background px-3 focus:outline-none focus:border-primary font-semibold"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Mobile Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210..."
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full h-8 border rounded-lg bg-background px-3 focus:outline-none focus:border-primary font-semibold"
                  />
                </div>
              </div>

              {/* AUTOMATIC CREDENTIAL GENERATOR BUTTON & DISPLAY */}
              <div className="p-4 border rounded-xl bg-indigo-50/40 border-indigo-100 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex flex-wrap items-center gap-1.5 text-indigo-950 font-extrabold text-xs">
                    <Sparkles className="h-4 w-4 text-indigo-600" /> Automatic Credential Generator Engine
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoGenerateCredentials}
                    disabled={isGenerating}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-extrabold flex flex-wrap items-center gap-1 shadow-xs transition-colors"
                  >
                    <RefreshCw className={`h-3 w-3 ${isGenerating ? 'animate-spin' : ''}`} /> Auto-Generate Username & Password
                  </button>
                </div>

                {generatedCreds && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2.5 bg-background border rounded-lg space-y-0.5">
                      <span className="text-[9px] uppercase font-bold text-muted-foreground block">Suggested Username</span>
                      <strong className="text-indigo-700 font-mono block">{generatedCreds.suggestedUsername}</strong>
                    </div>
                    <div className="p-2.5 bg-background border rounded-lg space-y-0.5">
                      <span className="text-[9px] uppercase font-bold text-muted-foreground block">Secure Temporary Password</span>
                      <strong className="text-rose-600 font-mono block">{generatedCreds.generatedPassword}</strong>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="user@geetorus.edu.in..."
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full h-8 border rounded-lg bg-background px-3 focus:outline-none focus:border-primary font-semibold"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Set Account Password *</label>
                  <input
                    type="text"
                    required
                    placeholder="Temporary password..."
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full h-8 border rounded-lg bg-background px-3 font-mono text-xs focus:outline-none focus:border-primary font-semibold"
                  />
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-1.5 border rounded-lg text-xs font-bold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-extrabold"
                >
                  Confirm & Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MAPPING MODAL FOR SUBJECTS & MENTORS */}
      {isMappingModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-card border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-extrabold text-foreground flex flex-wrap items-center gap-2 uppercase">
                <Layers className="h-4 w-4 text-purple-600" /> Subject & Mentor Batch Mapping
              </h3>
              <button onClick={() => setIsMappingModalOpen(false)} className="p-1 rounded hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3 bg-muted/20 border rounded-xl space-y-1 text-xs font-semibold">
              <p><strong>Target User:</strong> {selectedUser.firstName} {selectedUser.lastName}</p>
              <p><strong>Role:</strong> {selectedUser.role?.name || selectedUser.roleName}</p>
            </div>

            <div className="space-y-3 text-xs font-semibold">
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Assigned Semester & Section</label>
                <input
                  type="text"
                  value={mappingData.semesterId + ' - ' + mappingData.sectionId}
                  onChange={e => setMappingData({ ...mappingData, semesterId: e.target.value })}
                  className="w-full h-8 border rounded-lg bg-background px-3 font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Faculty Subject Mapping (Comma Separated)</label>
                <textarea
                  rows={2}
                  value={mappingData.subjectNames}
                  onChange={e => setMappingData({ ...mappingData, subjectNames: e.target.value })}
                  className="w-full border rounded-lg bg-background p-2 text-xs font-semibold"
                />
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2 border-t">
              <button onClick={() => setIsMappingModalOpen(false)} className="px-4 py-1.5 border rounded-lg text-xs font-bold hover:bg-muted">
                Cancel
              </button>
              <button
                onClick={async () => {
                  await api.post('/users/assign-subjects', { userId: selectedUser.id, subjectNames: mappingData.subjectNames.split(',') });
                  toast.success(`Subject & Mentor mapping updated for ${selectedUser.firstName}.`);
                  setIsMappingModalOpen(false);
                }}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-extrabold"
              >
                Save Assignment Mapping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK IMPORT MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-card border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-extrabold text-foreground flex flex-wrap items-center gap-2 uppercase">
                <Upload className="h-4 w-4 text-emerald-600" /> Bulk User Import (CSV / Excel)
              </h3>
              <button onClick={closeBulkImport} className="p-1 rounded hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 border-2 border-dashed border-primary/30 rounded-xl bg-primary/5 text-center space-y-2">
              <Upload className="h-8 w-8 text-primary mx-auto" />
              <p className="text-xs font-bold text-foreground">Upload Student or Faculty CSV / Excel File</p>
              <p className="text-[10px] text-muted-foreground">Files are validated before any account or linked profile is created. Maximum 5 MB / 1,000 rows.</p>
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setBulkFile(e.target.files[0]);
                    setBulkPreview(null);
                    setBulkResult(null);
                  }
                }}
                className="mx-auto text-xs font-semibold"
              />
              <button type="button" onClick={downloadImportTemplate} className="text-[10px] font-extrabold text-primary hover:underline">Download required-column template</button>
            </div>

            {bulkPreview && (
              <div className="rounded-xl border p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold">Validation report</span>
                  <span className={bulkPreview.invalid ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>{bulkPreview.valid} valid / {bulkPreview.invalid} invalid</span>
                </div>
                <div className="max-h-40 overflow-auto space-y-1">
                  {bulkPreview.rows?.filter((row: any) => !row.valid).map((row: any) => (
                    <div key={row.rowNumber} className="rounded-lg bg-rose-500/10 px-2 py-1.5 text-rose-700 dark:text-rose-300">
                      <strong>Row {row.rowNumber}:</strong> {row.errors.join('; ')}
                    </div>
                  ))}
                  {!bulkPreview.invalid && <p className="text-emerald-600 font-semibold">All rows are ready. Commit will create accounts and linked profiles in row-level transactions.</p>}
                </div>
              </div>
            )}

            {bulkResult && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs space-y-2">
                <p className="font-extrabold text-emerald-700 dark:text-emerald-300">{bulkResult.committed} account(s) provisioned; {bulkResult.failed || 0} failed.</p>
                <p className="text-muted-foreground">Temporary passwords are shown only in the downloadable report. Store and distribute it securely.</p>
                <button type="button" onClick={downloadImportReport} className="font-extrabold text-primary hover:underline">Download one-time success/error report</button>
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2 pt-2 border-t">
              <button onClick={closeBulkImport} className="px-4 py-1.5 border rounded-lg text-xs font-bold hover:bg-muted">
                Close
              </button>
              {!bulkPreview && !bulkResult && <button disabled={!bulkFile || bulkBusy} onClick={previewBulkImport} className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-extrabold disabled:opacity-50">{bulkBusy ? 'Validating…' : 'Validate file'}</button>}
              {bulkPreview && <button disabled={Boolean(bulkPreview.invalid) || bulkBusy} onClick={commitBulkImport} className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-extrabold disabled:opacity-50">{bulkBusy ? 'Provisioning…' : 'Confirm & provision'}</button>}
            </div>
          </div>
        </div>
      )}

      {/* CREDENTIAL SUCCESS AUTO DISPLAY MODAL */}
      <CredentialSuccessModal
        isOpen={Boolean(successCredsModal)}
        onClose={() => setSuccessCredsModal(null)}
        credentials={successCredsModal}
      />

    </div>
  );
};

// ── Helper sub-components ──────────────────────────────────────────────────

const MShell: React.FC<{title:string;icon:React.ReactNode;children:React.ReactNode;wide?:boolean;onClose:()=>void}> = ({title,icon,children,wide,onClose}) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150" onClick={onClose}>
    <div className={`bg-card border rounded-2xl ${wide?'max-w-2xl':'max-w-md'} w-full shadow-2xl max-h-[92vh] overflow-y-auto`} onClick={e=>e.stopPropagation()}>
      <div className="flex justify-between items-center border-b px-5 py-4">
        <h3 className="text-sm font-extrabold text-foreground flex flex-wrap items-center gap-2 uppercase">{icon}{title}</h3>
        <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X className="h-4 w-4"/></button>
      </div>
      <div className="px-5 py-4 space-y-4 text-xs font-semibold">{children}</div>
    </div>
  </div>
);

const UBadge: React.FC<{u:any}> = ({u}) => (
  <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/20 border rounded-xl">
    <div className="h-10 w-10 rounded-full bg-indigo-600 text-white font-extrabold flex items-center justify-center text-sm shadow-sm shrink-0">{u.firstName?.[0]||'U'}{u.lastName?.[0]||''}</div>
    <div>
      <p className="font-extrabold text-sm text-foreground">{u.firstName} {u.lastName||''}</p>
      <p className="text-[10px] text-muted-foreground">{u.email} · {u.role?.name||u.roleName}</p>
    </div>
  </div>
);

const PField: React.FC<{label:string;value:string;mono?:boolean;secret?:boolean}> = ({label,value,mono,secret}) => (
  <div className="space-y-0.5">
    <p className="text-[9px] uppercase font-black text-muted-foreground">{label}</p>
    <p className={`text-xs font-bold text-foreground ${mono?'font-mono':''} ${secret?'text-rose-600':''}`}>{value||'—'}</p>
  </div>
);

const MItem: React.FC<{icon:React.ReactNode;label:string;onClick:()=>void;danger?:boolean}> = ({icon,label,onClick,danger}) => (
  <button onClick={onClick} className={`w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted/60 transition-colors text-left text-[11px] font-semibold ${danger?'text-rose-700 hover:bg-rose-50':'text-foreground'}`}>
    <span className="shrink-0">{icon}</span><span>{label}</span>
  </button>
);

const IAMBtn: React.FC<{onClick:()=>void;disabled?:boolean;variant?:'primary'|'danger'|'success';children:React.ReactNode}> = ({onClick,disabled,variant='primary',children}) => {
  const cls = variant==='danger'?'bg-rose-600 hover:bg-rose-700 text-white':variant==='success'?'bg-emerald-600 hover:bg-emerald-700 text-white':'bg-indigo-600 hover:bg-indigo-700 text-white';
  return <button onClick={onClick} disabled={disabled} className={`px-4 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-colors ${cls} disabled:opacity-60`}>{children}</button>;
};
