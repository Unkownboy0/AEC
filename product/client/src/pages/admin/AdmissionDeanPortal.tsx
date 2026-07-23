import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserCheck, ShieldAlert, Award,
  Clock, DollarSign, Download, Plus, Search, CheckCircle,
  XCircle, FileText, AlertTriangle, RefreshCw, Send, Sparkles,
  ChevronRight, Calendar, UserPlus, Eye, BookOpen, Layers, Check, X
} from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';
import api from '../../lib/axios';

// ── KPI Card helper ──────────────────────────────────────────────────────────
const KPICard: React.FC<{ title: string; value: string | number; icon: React.ComponentType<any>; colorClass: string }> = ({ title, value, icon: Icon, colorClass }) => (
  <div className="border bg-card p-4 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
    <div className="flex items-center justify-between">
      <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{title}</span>
      <div className={`p-2 rounded-lg ${colorClass}`}>
        <Icon className="h-4 w-4" />
      </div>
    </div>
    <span className="text-2xl font-extrabold tracking-tight mt-3 block">{value}</span>
  </div>
);

interface AdmissionDeanPortalProps {
  user: any;
}

const VALID_TABS = ['overview','applications','faculty_leaves','seats','scholarships','enquiries','counselling','payments'] as const;
type AdmissionTab = typeof VALID_TABS[number];

export const AdmissionDeanPortal: React.FC<AdmissionDeanPortalProps> = ({ user }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Derive active tab from URL ?tab= param (sidebar navigation support)
  const rawTab = searchParams.get('tab') as AdmissionTab | null;
  const activeTab: AdmissionTab = rawTab && (VALID_TABS as readonly string[]).includes(rawTab) ? rawTab : 'overview';

  const setActiveTab = (tab: AdmissionTab) => {
    setSelectedApp(null);
    navigate(`/?tab=${tab}`, { replace: true });
  };
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [intakeMatrix, setIntakeMatrix] = useState<any[]>([]);
  const [scholarships, setScholarships] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [counsellingSessions, setCounsellingSessions] = useState<any[]>([]);
  const [paymentLedger, setPaymentLedger] = useState<any[]>([]);

  // Faculty Leave & OD Requests state
  const [facultyRequests, setFacultyRequests] = useState<any[]>([]);
  const [facultyFilter, setFacultyFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
  const [selectedFacultyReq, setSelectedFacultyReq] = useState<any | null>(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionReqType, setActionReqType] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [actionRemarks, setActionRemarks] = useState('');
  const [auditModalOpen, setAuditModalOpen] = useState(false);

  // Search & Filters
  const [appSearch, setAppSearch] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState('');
  const [appDeptFilter, setAppDeptFilter] = useState('');
  const [enquirySearch, setEnquirySearch] = useState('');

  // Loading flags
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Form Inputs
  const [newEnquiry, setNewEnquiry] = useState({
    studentName: '',
    parentName: '',
    phone: '',
    email: '',
    source: 'Walk-in',
    notes: ''
  });
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);

  const [newSession, setNewSession] = useState({
    title: '',
    dateTime: '',
    counsellor: '',
    notes: '',
    studentIds: [] as string[]
  });
  const [showCounsellingModal, setShowCounsellingModal] = useState(false);

  const [transferDeptId, setTransferDeptId] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Bulk operation tracking
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [analyticsRes, appsRes, seatsRes, scholarshipsRes, enquiriesRes, counsellingRes, paymentsRes, wfRes] = await Promise.all([
        api.get('/enterprise/admission/analytics').catch(() => null),
        api.get('/enterprise/admission/applications').catch(() => null),
        api.get('/enterprise/admission/seats').catch(() => null),
        api.get('/enterprise/admission/scholarships').catch(() => null),
        api.get('/enterprise/admission/enquiries').catch(() => null),
        api.get('/enterprise/admission/counselling').catch(() => null),
        api.get('/enterprise/admission/payments').catch(() => null),
        api.get('/workflows/requests').catch(() => null)
      ]);

      if (analyticsRes?.data?.status === 'success') setAnalytics(analyticsRes.data.data);
      if (appsRes?.data?.status === 'success') setApplications(appsRes.data.data);
      if (seatsRes?.data?.status === 'success') setIntakeMatrix(seatsRes.data.data);
      if (scholarshipsRes?.data?.status === 'success') setScholarships(scholarshipsRes.data.data);
      if (enquiriesRes?.data?.status === 'success') setEnquiries(enquiriesRes.data.data);
      if (counsellingRes?.data?.status === 'success') setCounsellingSessions(counsellingRes.data.data);
      if (paymentsRes?.data?.status === 'success') setPaymentLedger(paymentsRes.data.data);
      if (wfRes?.data?.status === 'success') {
        const facReqs = wfRes.data.data.filter((r: any) => r.facultyRequesterId || r.facultyRequester);
        setFacultyRequests(facReqs);
      }

    } catch (err) {
      toast.error('Failed to load admission command registry.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch once on mount only
  useEffect(() => {
    fetchData();
  }, []);

  // Bulk Selection Handlers
  const handleSelectApp = (id: string) => {
    setSelectedAppIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllApps = () => {
    if (selectedAppIds.length === applications.length) {
      setSelectedAppIds([]);
    } else {
      setSelectedAppIds(applications.map(app => app.id));
    }
  };

  // Bulk Actions
  const handleBulkStatusUpdate = async (status: 'APPROVED' | 'REJECTED') => {
    if (selectedAppIds.length === 0) {
      toast.error('No applications selected.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.post('/enterprise/admission/applications/bulk-status', {
        ids: selectedAppIds,
        status
      });
      if (res.data?.status === 'success') {
        toast.success(`Successfully actioned ${selectedAppIds.length} profiles.`);
        setSelectedAppIds([]);
        fetchData();
      }
    } catch (err) {
      toast.error('Bulk update operations failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Document Verification Handlers
  const handleVerifyDocument = async (appId: string, docName: string, action: 'APPROVED' | 'REJECTED' | 'REUPLOAD_REQUESTED', notes: string = '') => {
    setActionLoading(true);
    try {
      const res = await api.post(`/enterprise/admission/applications/${appId}/verify-document`, {
        docName,
        action,
        notes
      });
      if (res.data?.status === 'success') {
        toast.success(`Document ${docName} marked as ${action}.`);
        if (selectedApp?.id === appId) {
          setSelectedApp(res.data.data);
        }
        fetchData();
      }
    } catch (err) {
      toast.error('Document verification action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Seat Allocation & Confirmations
  const handleAllocateSeat = async (appId: string, quotaType: 'GOVERNMENT' | 'MANAGEMENT') => {
    setActionLoading(true);
    try {
      const res = await api.post(`/enterprise/admission/seats/${appId}/allocate`, {
        mode: 'MANUAL',
        quotaType
      });
      if (res.data?.status === 'success') {
        toast.success('Seat quota allocated and merit validation complete.');
        if (selectedApp?.id === appId) {
          setSelectedApp(res.data.data);
        }
        fetchData();
      }
    } catch (err) {
      toast.error('Seat allocation failed. Check department capacity thresholds.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAutoAllocate = async () => {
    setActionLoading(true);
    try {
      const res = await api.post('/enterprise/admission/seats/allocate');
      if (res.data?.status === 'success') {
        toast.success(res.data.message || 'Auto merit seat allocations complete.');
        fetchData();
      }
    } catch (err) {
      toast.error('Auto seat allocation run failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Status updates
  const handleStatusUpdate = async (appId: string, status: string) => {
    setActionLoading(true);
    try {
      const res = await api.put(`/enterprise/admission/applications/${appId}/status`, { status });
      if (res.data?.status === 'success') {
        toast.success(`Application status updated to ${status}.`);
        if (selectedApp?.id === appId) {
          setSelectedApp(res.data.data);
        }
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to update application status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Department Transfer
  const handleTransferDept = async () => {
    if (!transferDeptId) {
      toast.error('Please select target department');
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.post(`/enterprise/admission/seats/${selectedApp.id}/transfer`, {
        targetDepartmentId: transferDeptId
      });
      if (res.data?.status === 'success') {
        toast.success('Department transfer request processed. Quota counts recalculated.');
        setShowTransferModal(false);
        setSelectedApp(res.data.data);
        fetchData();
      }
    } catch (err) {
      toast.error('Transfer department request failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Scholarship Actions
  const handleScholarshipAction = async (appId: string, status: 'APPROVED' | 'REJECTED', type: string = 'None', amount: number = 0) => {
    setActionLoading(true);
    try {
      const res = await api.put(`/enterprise/admission/applications/${appId}/status`, {
        scholarshipStatus: status,
        scholarshipType: type,
        scholarshipAmount: amount
      });
      if (res.data?.status === 'success') {
        toast.success(`Scholarship request marked as ${status}.`);
        fetchData();
      }
    } catch (err) {
      toast.error('Scholarship update failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // CRM Enquiry Handlers
  const handleCreateEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.post('/enterprise/admission/enquiries', newEnquiry);
      if (res.data?.status === 'success') {
        toast.success('CRM Enquiry lead logged successfully.');
        setShowEnquiryModal(false);
        setNewEnquiry({ studentName: '', parentName: '', phone: '', email: '', source: 'Walk-in', notes: '' });
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to log enquiry.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateEnquiry = async (enqId: string, status: string, notes: string = '') => {
    setActionLoading(true);
    try {
      const res = await api.put(`/enterprise/admission/enquiries/${enqId}`, {
        status,
        notes: notes || undefined
      });
      if (res.data?.status === 'success') {
        toast.success(`Enquiry lead status updated to ${status}.`);
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to update lead status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvertEnquiry = async (enqId: string, deptId: string, progId: string, marks: number) => {
    setActionLoading(true);
    try {
      const res = await api.post(`/enterprise/admission/enquiries/${enqId}/convert`, {
        departmentId: deptId,
        programId: progId,
        academicMarks: marks
      });
      if (res.data?.status === 'success') {
        toast.success('Enquiry converted successfully to live Admission Application!');
        fetchData();
      }
    } catch (err) {
      toast.error('Conversion process failed. Ensure department selection is configured.');
    } finally {
      setActionLoading(false);
    }
  };

  // Counselling Round Scheduling
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.post('/enterprise/admission/counselling', newSession);
      if (res.data?.status === 'success') {
        toast.success('Counselling session panel created.');
        setShowCounsellingModal(false);
        setNewSession({ title: '', dateTime: '', counsellor: '', notes: '', studentIds: [] });
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to schedule session.');
    } finally {
      setActionLoading(false);
    }
  };

  // Excel / CSV Export simulated logic
  const handleExport = (filename: string, format: 'CSV' | 'EXCEL' | 'PDF') => {
    if (format === 'PDF') {
      window.print();
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    if (filename.includes('Applications')) {
      csvContent += 'Application No,Name,Email,Department,Marks,Status,Payment\n';
      applications.forEach(app => {
        csvContent += `${app.applicationNo},${app.firstName} ${app.lastName},${app.email},${app.department?.code || ''},${app.academicMarks},${app.status},${app.paymentStatus}\n`;
      });
    } else if (filename.includes('CRM')) {
      csvContent += 'Lead Name,Phone,Email,Source,Status,Created At\n';
      enquiries.forEach(e => {
        csvContent += `${e.studentName},${e.phone},${e.email || 'N/A'},${e.source},${e.status},${e.createdAt}\n`;
      });
    } else {
      csvContent += 'Department,Quota Type,Intake Capacity,Filled Seats,Available Seats\n';
      intakeMatrix.forEach(i => {
        csvContent += `${i.department?.name},Government,${i.governmentQuotaIntake},${i.governmentQuotaFilled},${i.governmentQuotaIntake - i.governmentQuotaFilled}\n`;
        csvContent += `${i.department?.name},Management,${i.managementQuotaIntake},${i.managementQuotaFilled},${i.managementQuotaIntake - i.managementQuotaFilled}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename.toLowerCase().replace(/ /g, '_')}_export.${format.toLowerCase()}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${format} successfully.`);
  };

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loading text="Loading Admission Command Center controls..." />
      </div>
    );
  }

  // Filtered applications
  const filteredApps = applications.filter(app => {
    const matchesSearch =
      appSearch === '' ||
      app.applicationNo.toLowerCase().includes(appSearch.toLowerCase()) ||
      `${app.firstName} ${app.lastName}`.toLowerCase().includes(appSearch.toLowerCase()) ||
      app.email.toLowerCase().includes(appSearch.toLowerCase());
    const matchesStatus = appStatusFilter === '' || app.status === appStatusFilter;
    const matchesDept = appDeptFilter === '' || app.departmentId === appDeptFilter;
    return matchesSearch && matchesStatus && matchesDept;
  });

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200 print:bg-white print:p-0">
      
      {/* Dynamic Print Stylesheet (Inject only for reports page) */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #print-section, #print-section * {
            visibility: visible !important;
          }
          #print-section {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
          }
          .no-print {
            display: none !important;
          }
        }
      ` }} />

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-purple-600 to-pink-600 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden no-print">
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-y-8 translate-x-8">
          <UserPlus className="h-64 w-64" />
        </div>
        <div className="relative z-10 flex justify-between items-center">
          <div className="space-y-2">
            <div className="inline-flex flex-wrap items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md uppercase tracking-wider">
              <Layers className="h-3.5 w-3.5" /> Admission Command Center
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold">Welcome back, Dean {user.firstName}</h2>
            <p className="text-sm opacity-90 font-medium">Verify credentials · Run merit algorithms · Manage seat distributions</p>
          </div>
          <button onClick={fetchData} className="p-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex flex-wrap gap-2 border-b pb-px no-print">
        {[
          { key: 'overview', label: 'Admission Overview', icon: LayoutDashboard },
          { key: 'applications', label: 'Candidate Screening', icon: Users },
          { key: 'faculty_leaves', label: 'Faculty Leave & OD Approvals', icon: FileText },
          { key: 'seats', label: 'Seat Allocations', icon: Layers },
          { key: 'scholarships', label: 'Scholarships & Waivers', icon: Award },
          { key: 'enquiries', label: 'Admission CRM', icon: UserPlus },
          { key: 'counselling', label: 'Counselling Rounds', icon: Calendar },
          { key: 'payments', label: 'Fee ledger', icon: DollarSign },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key as any); setSelectedApp(null); }}
              className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === tab.key
                  ? 'border-primary text-primary font-extrabold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents: Overview */}
      {activeTab === 'overview' && analytics && (
        <div className="space-y-6">
          {/* Executive Stats Card list */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 no-print">
            <KPICard title="Total Applicants" value={analytics.metrics.totalApplications} icon={Users} colorClass="bg-indigo-500/10 text-indigo-500" />
            <KPICard title="Pending Review" value={analytics.metrics.pendingApplications} icon={Clock} colorClass="bg-amber-500/10 text-amber-500" />
            <KPICard title="Confirmed Admissions" value={analytics.metrics.admissionsCompleted} icon={CheckCircle} colorClass="bg-emerald-500/10 text-emerald-500" />
            <KPICard title="Intake Occupancy" value={`${analytics.metrics.seatOccupancyPercent}%`} icon={Layers} colorClass="bg-purple-500/10 text-purple-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Department intake status */}
            <div className="lg:col-span-2 border bg-card p-5 rounded-xl shadow-sm space-y-4 text-xs font-bold">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-sm font-extrabold uppercase">Department-wise Intake Capacity</h3>
                <button onClick={() => handleExport('Department Seats', 'CSV')} className="h-8 border hover:bg-muted text-xs px-2.5 rounded-lg flex flex-wrap items-center gap-1">
                  <Download className="h-3.5 w-3.5" /> CSV Report
                </button>
              </div>

              <div className="space-y-3.5 pt-2">
                {analytics.departmentAdmissions.map((dept: any, idx: number) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-baseline text-xs font-black">
                      <span>{dept.name} ({dept.code})</span>
                      <span className="text-slate-500">{dept.filled} / {dept.intake} seats ({dept.percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full transition-all" style={{ width: `${dept.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Checklist items list */}
            <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4 text-xs font-bold text-left">
              <h3 className="text-sm font-extrabold uppercase border-b pb-2">Verification Queue Alerts</h3>
              <div className="space-y-3 pt-2">
                <div className="p-3 bg-amber-50/50 border border-amber-200 text-amber-900 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 font-extrabold">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span>Documents Pending Verification</span>
                  </div>
                  <p className="text-[10px] text-amber-700">There are {analytics.metrics.documentVerificationPending} applicant profiles awaiting document auditing.</p>
                </div>
                
                <div className="p-3 bg-indigo-50/50 border border-indigo-200 text-indigo-900 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 font-extrabold">
                    <Award className="h-4 w-4 text-indigo-500" />
                    <span>Scholarship Request Tickets</span>
                  </div>
                  <p className="text-[10px] text-indigo-700">We have {analytics.metrics.scholarshipApplications} sports, merit or concession requests waiting decision.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Tab Contents: Candidate Screening */}
      {activeTab === 'applications' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Applications list (col-span-2) */}
          <div className="lg:col-span-2 border bg-card p-5 rounded-xl shadow-sm space-y-4 text-xs font-bold text-left">
            <div className="flex flex-wrap justify-between items-center gap-2 border-b pb-3">
              <div>
                <h3 className="text-sm font-extrabold uppercase">Admission Applications Registry</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Filter, verify credentials, and trigger bulk updates.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleBulkStatusUpdate('APPROVED')}
                  disabled={selectedAppIds.length === 0 || actionLoading}
                  className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-[10px] font-black uppercase disabled:opacity-50"
                >
                  Bulk Approve
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('REJECTED')}
                  disabled={selectedAppIds.length === 0 || actionLoading}
                  className="px-2.5 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-lg text-[10px] font-black uppercase disabled:opacity-50"
                >
                  Bulk Reject
                </button>
                <button onClick={() => handleExport('Admission Applications', 'CSV')} className="h-8 border hover:bg-muted px-2.5 rounded-lg flex flex-wrap items-center gap-1">
                  <Download className="h-3.5 w-3.5" /> CSV
                </button>
              </div>
            </div>

            {/* Filter controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search app no, name..."
                  value={appSearch}
                  onChange={e => setAppSearch(e.target.value)}
                  className="pl-8 h-9 w-full bg-background border rounded-lg"
                />
              </div>
              <select
                value={appStatusFilter}
                onChange={e => setAppStatusFilter(e.target.value)}
                className="h-9 w-full bg-background border rounded-lg px-2.5"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">PENDING</option>
                <option value="REVIEWING">REVIEWING</option>
                <option value="APPROVED">APPROVED</option>
                <option value="REJECTED">REJECTED</option>
                <option value="HOLD">HOLD</option>
                <option value="CONFIRMED">CONFIRMED</option>
              </select>
              <select
                value={appDeptFilter}
                onChange={e => setAppDeptFilter(e.target.value)}
                className="h-9 w-full bg-background border rounded-lg px-2.5"
              >
                <option value="">All Departments</option>
                {intakeMatrix.map(item => (
                  <option key={item.departmentId} value={item.departmentId}>{item.department.code}</option>
                ))}
              </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-[11px] text-left border-collapse">
                <thead>
                  <tr className="bg-muted/40 text-muted-foreground uppercase text-[9px] font-black border-b">
                    <th className="py-2.5 px-3">
                      <input
                        type="checkbox"
                        checked={selectedAppIds.length === applications.length && applications.length > 0}
                        onChange={handleSelectAllApps}
                        className="rounded"
                      />
                    </th>
                    <th className="py-2.5 px-2">Application No</th>
                    <th className="py-2.5 px-2">Applicant</th>
                    <th className="py-2.5 px-2">Department</th>
                    <th className="py-2.5 px-2 text-right">Marks</th>
                    <th className="py-2.5 px-2 text-center">Status</th>
                    <th className="py-2.5 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredApps.map(app => (
                    <tr key={app.id} className="hover:bg-muted/10 cursor-pointer" onClick={() => setSelectedApp(app)}>
                      <td className="py-3 px-3" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedAppIds.includes(app.id)}
                          onChange={() => handleSelectApp(app.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="py-3 px-2 font-mono font-bold">{app.applicationNo}</td>
                      <td className="py-3 px-2">
                        <div className="font-extrabold text-slate-900">{app.firstName} {app.lastName}</div>
                        <span className="text-[9px] text-muted-foreground font-semibold">{app.email}</span>
                      </td>
                      <td className="py-3 px-2 font-extrabold">{app.department?.code} - {app.program?.code}</td>
                      <td className="py-3 px-2 text-right font-mono font-extrabold">{app.academicMarks}%</td>
                      <td className="py-3 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black border ${
                          app.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                          app.status === 'APPROVED' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                          app.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                          app.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <button className="text-primary hover:underline font-extrabold flex items-center justify-end gap-0.5">
                          Inspect <ChevronRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredApps.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground italic">No applications match the search criteria.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Details Sidebar (col-span-1) */}
          <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4 text-xs font-bold text-left min-h-[500px]">
            {selectedApp ? (
              <div className="space-y-4">
                <div className="border-b pb-3 flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-black text-indigo-600 block font-mono uppercase">{selectedApp.applicationNo}</span>
                    <h3 className="text-sm font-extrabold uppercase mt-0.5">{selectedApp.firstName} {selectedApp.lastName}</h3>
                  </div>
                  <span className="text-[8px] text-muted-foreground uppercase font-black tracking-widest">{selectedApp.category} Category</span>
                </div>

                <div className="space-y-2.5 text-[10px] leading-relaxed">
                  <div className="grid grid-cols-2 gap-2 border-b pb-2">
                    <div><span className="text-slate-400 font-bold uppercase block">Parent Name</span><span className="font-extrabold text-slate-800">{selectedApp.parentName}</span></div>
                    <div><span className="text-slate-400 font-bold uppercase block">Phone</span><span className="font-extrabold text-slate-800">{selectedApp.phone}</span></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-b pb-2">
                    <div><span className="text-slate-400 font-bold uppercase block">Academic Marks</span><span className="font-mono font-extrabold text-slate-800 text-[11px]">{selectedApp.academicMarks}%</span></div>
                    <div><span className="text-slate-400 font-bold uppercase block">Payment Status</span><span className="font-extrabold text-emerald-600">{selectedApp.paymentStatus}</span></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-b pb-2">
                    <div><span className="text-slate-400 font-bold uppercase block">Dept / Program</span><span className="font-extrabold text-slate-800">{selectedApp.department?.code} / {selectedApp.program?.code}</span></div>
                    <div><span className="text-slate-400 font-bold uppercase block">Counselling Status</span><span className="font-extrabold text-slate-800">{selectedApp.counsellingStatus}</span></div>
                  </div>
                </div>

                {/* Documents List */}
                <div className="space-y-2 border bg-slate-50/50 p-3.5 rounded-xl">
                  <h4 className="font-black text-[10px] uppercase text-indigo-700 tracking-wider">Submitted Credentials & Documents</h4>
                  <div className="divide-y divide-slate-100 text-[10px]">
                    {JSON.parse(selectedApp.documents || '[]').map((doc: any, idx: number) => (
                      <div key={idx} className="py-2 flex justify-between items-center gap-2">
                        <span className="font-bold truncate max-w-[130px]">{doc.name}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          {doc.status === 'PENDING' ? (
                            <>
                              <button
                                onClick={() => handleVerifyDocument(selectedApp.id, doc.name, 'APPROVED')}
                                className="h-5 px-1.5 bg-emerald-500 text-white rounded text-[8px] font-black uppercase hover:bg-emerald-600"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleVerifyDocument(selectedApp.id, doc.name, 'REJECTED')}
                                className="h-5 px-1.5 bg-rose-500 text-white rounded text-[8px] font-black uppercase hover:bg-rose-600"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${
                              doc.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}>
                              {doc.status}
                            </span>
                          )}
                          {doc.url && (
                            <a href={doc.url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-800 text-[9px] font-black">
                              📄 View
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Main Action buttons */}
                <div className="flex flex-wrap gap-2 border-t pt-3.5">
                  {selectedApp.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(selectedApp.id, 'REVIEWING')}
                        className="flex-1 h-9 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg font-black uppercase hover:bg-indigo-100 text-[10px]"
                      >
                        Begin Review
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(selectedApp.id, 'REJECTED')}
                        className="flex-1 h-9 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg font-black uppercase hover:bg-rose-100 text-[10px]"
                      >
                        Reject Profile
                      </button>
                    </>
                  )}

                  {selectedApp.status === 'REVIEWING' && (
                    <>
                      <button
                        onClick={() => handleAllocateSeat(selectedApp.id, 'GOVERNMENT')}
                        className="flex-1 h-9 bg-primary text-primary-foreground rounded-lg font-black uppercase hover:bg-primary/95 text-[10px]"
                      >
                        Allocate Quota Seat
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(selectedApp.id, 'HOLD')}
                        className="flex-1 h-9 bg-slate-50 border rounded-lg font-black uppercase hover:bg-slate-100 text-[10px] text-slate-700"
                      >
                        Hold Application
                      </button>
                    </>
                  )}

                  {selectedApp.status === 'APPROVED' && (
                    <button
                      onClick={() => handleStatusUpdate(selectedApp.id, 'CONFIRMED')}
                      className="w-full h-9 bg-emerald-500 text-white rounded-lg font-black uppercase hover:bg-emerald-600 text-[10px] flex items-center justify-center gap-1"
                    >
                      <UserCheck className="h-4 w-4" /> Confirm Admission & Create Profile
                    </button>
                  )}

                  {selectedApp.status === 'CONFIRMED' && (
                    <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-center font-extrabold w-full text-[10px] tracking-wide uppercase border border-emerald-100">
                      Admission Completed & Sync'd to ERP!
                    </div>
                  )}

                  {/* Transfer action */}
                  {selectedApp.status !== 'CONFIRMED' && (
                    <button
                      onClick={() => { setTransferDeptId(selectedApp.departmentId); setShowTransferModal(true); }}
                      className="w-full h-8 border border-dashed rounded-lg font-black text-slate-500 hover:text-slate-700 hover:bg-muted text-[10px] uppercase mt-2"
                    >
                      🔁 Transfer Department / Major
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center h-full text-muted-foreground p-8 space-y-2">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center text-3xl">📇</div>
                <div>
                  <h4 className="font-extrabold text-foreground text-xs uppercase">No Candidate Selected</h4>
                  <p className="text-[10px] mt-0.5 max-w-[200px]">Select a candidate profile from the screen list registry to perform screening, verification or quota mappings.</p>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Tab Contents: Seat Allocations */}
      {activeTab === 'seats' && (
        <div className="space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-2 border-b pb-3 no-print">
            <div>
              <h3 className="text-sm font-extrabold uppercase">Departmental Allocation Controls</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Check occupancy capacities, reserved seats, and execute auto-merit calculations.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAutoAllocate}
                disabled={actionLoading}
                className="px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-xs font-black uppercase flex items-center gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" /> Auto-Allocate Merit Seats
              </button>
            </div>
          </div>

          <div className="border bg-card p-5 rounded-xl shadow-sm text-xs font-bold text-left overflow-x-auto">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-muted/40 uppercase text-[9px] font-black border-b text-muted-foreground">
                  <th className="py-3 px-3">Department Name</th>
                  <th className="py-3 px-2">Total Capacity</th>
                  <th className="py-3 px-2">Govt Quota (Intake/Filled)</th>
                  <th className="py-3 px-2">Mgmt Quota (Intake/Filled)</th>
                  <th className="py-3 px-2">Reserved Quota</th>
                  <th className="py-3 px-2">Available Seats</th>
                  <th className="py-3 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {intakeMatrix.map((item, idx) => {
                  const availabilityPct = Math.round((item.filledSeats / item.intakeCapacity) * 100);
                  const isFull = item.availableSeats <= 0;
                  return (
                    <tr key={item.id || idx} className="hover:bg-muted/10">
                      <td className="py-3.5 px-3 font-extrabold text-slate-800">{item.department?.name} ({item.department?.code})</td>
                      <td className="py-3.5 px-2 font-mono font-extrabold">{item.intakeCapacity}</td>
                      <td className="py-3.5 px-2 font-mono text-slate-600">
                        {item.governmentQuotaIntake} / <span className="font-extrabold text-indigo-600">{item.governmentQuotaFilled}</span>
                      </td>
                      <td className="py-3.5 px-2 font-mono text-slate-600">
                        {item.managementQuotaIntake} / <span className="font-extrabold text-purple-600">{item.managementQuotaFilled}</span>
                      </td>
                      <td className="py-3.5 px-2 font-mono">{item.reservedSeats}</td>
                      <td className="py-3.5 px-2">
                        <span className={`font-mono font-extrabold text-sm ${isFull ? 'text-rose-500' : 'text-emerald-600'}`}>
                          {item.availableSeats}
                        </span>
                      </td>
                      <td className="py-3.5 px-2">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black ${
                          isFull ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {isFull ? 'FULL' : 'SEATS AVAILABLE'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Contents: Scholarships */}
      {activeTab === 'scholarships' && (
        <div className="space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-2 border-b pb-3 no-print">
            <div>
              <h3 className="text-sm font-extrabold uppercase">Scholarship Approval Board</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Audit merit and sports scholarship requests submitted during candidate application.</p>
            </div>
            <button onClick={() => handleExport('Scholarship Registry', 'CSV')} className="h-8 border hover:bg-muted px-2.5 rounded-lg flex flex-wrap items-center gap-1 text-xs">
              <Download className="h-3.5 w-3.5" /> CSV Export
            </button>
          </div>

          <div className="border bg-card p-5 rounded-xl shadow-sm text-xs font-bold text-left overflow-x-auto">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-muted/40 uppercase text-[9px] font-black border-b text-muted-foreground">
                  <th className="py-3 px-3">Application No</th>
                  <th className="py-3 px-2">Applicant</th>
                  <th className="py-3 px-2">Department</th>
                  <th className="py-3 px-2 text-right">Academic Marks</th>
                  <th className="py-3 px-2">Requested Category</th>
                  <th className="py-3 px-2 text-center">Status</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {scholarships.map((app, idx) => (
                  <tr key={app.id || idx} className="hover:bg-muted/10">
                    <td className="py-3.5 px-3 font-mono font-bold">{app.applicationNo}</td>
                    <td className="py-3.5 px-2 font-extrabold text-slate-800">{app.firstName} {app.lastName}</td>
                    <td className="py-3.5 px-2">{app.department?.code}</td>
                    <td className="py-3.5 px-2 text-right font-mono font-bold">{app.academicMarks}%</td>
                    <td className="py-3.5 px-2 uppercase font-black text-indigo-700">{app.scholarshipType || 'General Merit'}</td>
                    <td className="py-3.5 px-2 text-center">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black border ${
                        app.scholarshipStatus === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                        app.scholarshipStatus === 'APPLIED' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                        'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                        {app.scholarshipStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-right">
                      {app.scholarshipStatus === 'APPLIED' ? (
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleScholarshipAction(app.id, 'APPROVED', app.scholarshipType || 'Merit', 25000)}
                            className="px-2 py-1 bg-emerald-500 text-white rounded font-black uppercase text-[8px] hover:bg-emerald-600"
                          >
                            Approve Grant
                          </button>
                          <button
                            onClick={() => handleScholarshipAction(app.id, 'REJECTED')}
                            className="px-2 py-1 bg-rose-500 text-white rounded font-black uppercase text-[8px] hover:bg-rose-600"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic">Action Complete</span>
                      )}
                    </td>
                  </tr>
                ))}
                {scholarships.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground italic">No scholarship application queries found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Contents: Admission CRM */}
      {activeTab === 'enquiries' && (
        <div className="space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-2 border-b pb-3 no-print">
            <div>
              <h3 className="text-sm font-extrabold uppercase">Admission CRM Pipeline</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Store inquiries, walk-ins, phone logs, and convert leads to live applicants.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowEnquiryModal(true)}
                className="px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-xs font-black uppercase flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> Log Lead / Enquiry
              </button>
              <button onClick={() => handleExport('CRM Leads', 'CSV')} className="h-8 border hover:bg-muted px-2.5 rounded-lg flex flex-wrap items-center gap-1 text-xs">
                <Download className="h-3.5 w-3.5" /> CSV
              </button>
            </div>
          </div>

          {/* CRM Enquiry Pipeline Table */}
          <div className="border bg-card p-5 rounded-xl shadow-sm text-xs font-bold text-left overflow-x-auto">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-muted/40 uppercase text-[9px] font-black border-b text-muted-foreground">
                  <th className="py-3 px-3">Lead Student</th>
                  <th className="py-3 px-2">Contact Details</th>
                  <th className="py-3 px-2">Source</th>
                  <th className="py-3 px-2">Follow-up Status</th>
                  <th className="py-3 px-2">Assigned Counsellor</th>
                  <th className="py-3 px-2">Log Notes</th>
                  <th className="py-3 px-2 text-right">CRM Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {enquiries.map((enq, idx) => (
                  <tr key={enq.id || idx} className="hover:bg-muted/10">
                    <td className="py-3.5 px-3">
                      <div className="font-extrabold text-slate-850">{enq.studentName}</div>
                      <span className="text-[9px] text-muted-foreground">Parent: {enq.parentName || 'N/A'}</span>
                    </td>
                    <td className="py-3.5 px-2">
                      <div>{enq.phone}</div>
                      <span className="text-[9px] text-muted-foreground font-mono">{enq.email || 'N/A'}</span>
                    </td>
                    <td className="py-3.5 px-2">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-black text-[9px] uppercase">
                        {enq.source}
                      </span>
                    </td>
                    <td className="py-3.5 px-2">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black border ${
                        enq.status === 'CONVERTED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                        enq.status === 'NEW' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-amber-50 text-amber-600 border-amber-200'
                      }`}>
                        {enq.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-2">{enq.assignedCounsellor || 'Not Assigned'}</td>
                    <td className="py-3.5 px-2 text-slate-500 font-medium truncate max-w-[150px]">{enq.notes || '—'}</td>
                    <td className="py-3.5 px-2 text-right">
                      {enq.status !== 'CONVERTED' ? (
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => {
                              const dept = intakeMatrix[0]?.departmentId;
                              const prog = intakeMatrix[0]?.department?.programs[0]?.id;
                              if (dept) {
                                handleConvertEnquiry(enq.id, dept, prog || '', 85);
                              } else {
                                toast.error('No departments configured to map.');
                              }
                            }}
                            className="px-2 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded font-black uppercase text-[8px] hover:bg-indigo-100"
                          >
                            Convert to App
                          </button>
                          <button
                            onClick={() => handleUpdateEnquiry(enq.id, 'IN_PROGRESS')}
                            className="px-2 py-1 bg-slate-100 text-slate-700 rounded font-black uppercase text-[8px] hover:bg-slate-200"
                          >
                            Mark In Progress
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-extrabold uppercase">Converted 🎉</span>
                      )}
                    </td>
                  </tr>
                ))}
                {enquiries.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground italic">No CRM enquiry leads stored yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Contents: Counselling Rounds */}
      {activeTab === 'counselling' && (
        <div className="space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-2 border-b pb-3 no-print">
            <div>
              <h3 className="text-sm font-extrabold uppercase">Counselling Board & Scheduling</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Define round slots, map candidate cohorts and monitor conversion rates.</p>
            </div>
            <button
              onClick={() => setShowCounsellingModal(true)}
              className="px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-xs font-black uppercase flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" /> Create Counselling Session
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {counsellingSessions.map((session, idx) => {
              const studentsCount = JSON.parse(session.studentIds || '[]').length;
              return (
                <div key={session.id || idx} className="border bg-card p-5 rounded-xl shadow-sm text-xs font-bold text-left space-y-3.5">
                  <div className="flex justify-between items-start border-b pb-2">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800">{session.title}</h4>
                      <span className="text-[9px] text-muted-foreground">Counsellor: {session.counsellor}</span>
                    </div>
                    <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[9px] px-2 py-0.5 rounded font-black">
                      Round {idx + 1}
                    </span>
                  </div>

                  <div className="space-y-1 text-slate-600 font-medium">
                    <p className="flex items-center gap-1 text-[10px]">
                      <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                      <span>{new Date(session.dateTime).toLocaleString()}</span>
                    </p>
                    <p className="flex items-center gap-1 text-[10px] mt-1.5">
                      <Users className="h-3.5 w-3.5 text-purple-500" />
                      <span>{studentsCount} Students Assigned</span>
                    </p>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border text-[10px] text-slate-500 leading-relaxed font-medium">
                    <span className="font-extrabold text-slate-700 block uppercase text-[8px] tracking-wider">Counselling Agenda / Notes</span>
                    {session.notes || 'No notes loaded.'}
                  </div>
                </div>
              );
            })}
            {counsellingSessions.length === 0 && (
              <div className="md:col-span-3 border p-8 rounded-xl bg-slate-50 text-center text-muted-foreground italic">
                No active counselling cohorts scheduled.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Contents: Faculty Leave & OD Approvals */}
      {activeTab === 'faculty_leaves' && (() => {
        const pendingDean = facultyRequests.filter((r: any) => r.status === 'HOD_APPROVED' || (r.currentStep === 'DEAN' && r.status !== 'APPROVED' && r.status !== 'REJECTED_BY_DEAN'));
        const approvedDean = facultyRequests.filter((r: any) => r.status === 'APPROVED');
        const rejectedDean = facultyRequests.filter((r: any) => ['REJECTED_BY_DEAN', 'REJECTED_BY_HOD'].includes(r.status));

        const filteredFacultyReqs = facultyRequests.filter((r: any) => {
          if (facultyFilter === 'PENDING') return r.status === 'HOD_APPROVED' || (r.currentStep === 'DEAN' && r.status !== 'APPROVED' && r.status !== 'REJECTED_BY_DEAN');
          if (facultyFilter === 'APPROVED') return r.status === 'APPROVED';
          if (facultyFilter === 'REJECTED') return ['REJECTED_BY_DEAN', 'REJECTED_BY_HOD'].includes(r.status);
          return true;
        });

        const handleActionSubmit = async () => {
          if (!selectedFacultyReq) return;
          setActionLoading(true);
          try {
            const res = await api.post(`/workflows/requests/${selectedFacultyReq.id}/action`, {
              action: actionReqType,
              comment: actionRemarks || (actionReqType === 'APPROVE' ? 'Final approved by Admission Dean' : 'Rejected by Admission Dean')
            });
            if (res.data?.status === 'success') {
              toast.success(`Faculty request ${actionReqType === 'APPROVE' ? 'Final Approved' : 'Rejected'}.`);
              setActionModalOpen(false);
              setSelectedFacultyReq(null);
              setActionRemarks('');
              fetchData();
            }
          } catch (err: any) {
            toast.error(err.response?.data?.message || 'Action failed.');
          } finally {
            setActionLoading(false);
          }
        };

        return (
          <div className="space-y-6 animate-in fade-in duration-300 text-left">
            <div className="flex flex-wrap justify-between items-center gap-2 border-b pb-3 no-print">
              <div>
                <h3 className="text-sm font-extrabold uppercase">Faculty Leave & OD Approvals</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Final Level-2 authorization management for HOD-approved Faculty Leave and On-Duty applications across all departments.</p>
              </div>
              <button onClick={() => handleExport('Faculty Leave Approvals', 'CSV')} className="h-8 border hover:bg-muted px-2.5 rounded-lg flex flex-wrap items-center gap-1 text-xs">
                <Download className="h-3.5 w-3.5" /> Export CSV
              </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="border bg-amber-50/70 border-amber-200 p-4 rounded-xl shadow-sm flex justify-between items-center">
                <div>
                  <span className="text-[9px] uppercase font-bold text-amber-700 tracking-wider block">Pending Final Approval</span>
                  <span className="text-2xl font-extrabold text-amber-800">{pendingDean.length}</span>
                </div>
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div className="border bg-emerald-50/70 border-emerald-200 p-4 rounded-xl shadow-sm flex justify-between items-center">
                <div>
                  <span className="text-[9px] uppercase font-bold text-emerald-700 tracking-wider block">Final Approved</span>
                  <span className="text-2xl font-extrabold text-emerald-800">{approvedDean.length}</span>
                </div>
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="border bg-rose-50/70 border-rose-200 p-4 rounded-xl shadow-sm flex justify-between items-center">
                <div>
                  <span className="text-[9px] uppercase font-bold text-rose-700 tracking-wider block">Rejected</span>
                  <span className="text-2xl font-extrabold text-rose-800">{rejectedDean.length}</span>
                </div>
                <XCircle className="h-6 w-6 text-rose-600" />
              </div>
            </div>

            {/* Sub-tab filter buttons */}
            <div className="flex border rounded-xl overflow-hidden text-xs font-bold w-fit bg-card">
              {[
                { id: 'PENDING', label: 'HOD Approved (Pending Dean)' },
                { id: 'APPROVED', label: 'Final Approved' },
                { id: 'REJECTED', label: 'Rejected' },
                { id: 'ALL', label: 'All Requests' },
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFacultyFilter(f.id as any)}
                  className={`px-4 py-2 border-r last:border-r-0 transition-colors ${
                    facultyFilter === f.id
                      ? 'bg-primary text-primary-foreground font-extrabold'
                      : 'bg-card text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Main Table */}
            <div className="border bg-card p-5 rounded-xl shadow-sm text-xs font-bold text-left overflow-x-auto">
              {filteredFacultyReqs.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground italic">
                  No faculty leave/OD requests found for selected view filter.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="border-b bg-muted/20 text-[9px] uppercase font-bold text-muted-foreground">
                      <th className="p-3">Faculty Member</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Request Details</th>
                      <th className="p-3">Duration</th>
                      <th className="p-3">HOD Remarks</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredFacultyReqs.map((req: any, idx: number) => {
                      const fac = req.facultyRequester;
                      const days = req.startDate && req.endDate
                        ? Math.ceil((new Date(req.endDate).getTime() - new Date(req.startDate).getTime()) / (1000 * 3600 * 24)) + 1
                        : 1;
                      const hodHistory = req.history?.find((h: any) => h.stage === 'HOD');

                      return (
                        <tr key={req.id || idx} className="hover:bg-muted/10 transition-colors">
                          <td className="p-3">
                            <p className="font-extrabold text-foreground">{fac ? `${fac.firstName} ${fac.lastName}` : 'Faculty Member'}</p>
                            <p className="text-[9px] text-muted-foreground font-mono">Emp ID: {fac?.employeeId || 'N/A'}</p>
                            <p className="text-[9px] text-muted-foreground">{fac?.email}</p>
                          </td>
                          <td className="p-3 font-semibold text-muted-foreground">
                            {fac?.department?.name || 'N/A'}
                          </td>
                          <td className="p-3 max-w-[200px] space-y-1">
                            <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                              req.type === 'FACULTY_OD' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-orange-50 text-orange-700 border border-orange-200'
                            }`}>
                              {req.type === 'FACULTY_OD' ? 'ON DUTY (OD)' : 'LEAVE'}
                            </span>
                            <p className="font-bold text-foreground truncate">{req.title || req.type}</p>
                            <p className="text-[9px] text-muted-foreground leading-relaxed line-clamp-2">{req.reason}</p>
                          </td>
                          <td className="p-3 whitespace-nowrap space-y-1">
                            <p className="font-bold text-foreground">
                              {req.startDate ? new Date(req.startDate).toLocaleDateString('en-IN') : 'N/A'} to{' '}
                              {req.endDate ? new Date(req.endDate).toLocaleDateString('en-IN') : 'N/A'}
                            </p>
                            <span className="inline-block bg-slate-100 px-1.5 py-0.5 rounded text-[9px] font-black text-slate-600">
                              {days} {days === 1 ? 'Day' : 'Days'}
                            </span>
                          </td>
                          <td className="p-3 max-w-[180px]">
                            <p className="text-[9px] text-muted-foreground">
                              <span className="font-extrabold text-slate-700 block">By: {hodHistory?.actionByName || 'HOD'}</span>
                              {hodHistory?.comment || 'Approved by HOD'}
                            </p>
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${
                              req.status === 'HOD_APPROVED' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              req.status === 'REJECTED_BY_DEAN' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                              req.status === 'REJECTED_BY_HOD' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                              'bg-slate-50 text-slate-700 border-slate-200'
                            }`}>
                              {req.status === 'HOD_APPROVED' ? 'HOD Approved' :
                               req.status === 'APPROVED' ? 'Final Approved' :
                               req.status === 'REJECTED_BY_DEAN' ? 'Rejected by Dean' :
                               req.status === 'REJECTED_BY_HOD' ? 'Rejected by HOD' : req.status}
                            </span>
                          </td>
                          <td className="p-3 text-right whitespace-nowrap">
                            <div className="flex justify-end gap-1.5">
                              {(req.status === 'HOD_APPROVED' || (req.currentStep === 'DEAN' && req.status !== 'APPROVED' && req.status !== 'REJECTED_BY_DEAN')) && (
                                <>
                                  <button
                                    onClick={() => {
                                      setSelectedFacultyReq(req);
                                      setActionReqType('APPROVE');
                                      setActionRemarks('');
                                      setActionModalOpen(true);
                                    }}
                                    className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold hover:bg-emerald-700 shadow-sm"
                                  >
                                    Final Approve
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedFacultyReq(req);
                                      setActionReqType('REJECT');
                                      setActionRemarks('');
                                      setActionModalOpen(true);
                                    }}
                                    className="px-2.5 py-1 bg-rose-600 text-white rounded text-[10px] font-bold hover:bg-rose-700 shadow-sm"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedFacultyReq(req);
                                  setAuditModalOpen(true);
                                }}
                                className="px-2 py-1 border rounded text-[10px] font-bold hover:bg-muted"
                              >
                                Audit Log
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Action Remarks Modal */}
            {actionModalOpen && selectedFacultyReq && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-card w-full max-w-md border rounded-xl shadow-xl p-5 space-y-4 text-xs font-semibold">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h4 className="text-sm font-extrabold uppercase text-foreground">
                      {actionReqType === 'APPROVE' ? 'Final Approve Faculty Request' : 'Reject Faculty Request'}
                    </h4>
                    <button onClick={() => setActionModalOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
                  </div>
                  <p className="text-muted-foreground text-[11px]">
                    Faculty Member: <span className="font-bold text-foreground">{selectedFacultyReq.facultyRequester?.firstName} {selectedFacultyReq.facultyRequester?.lastName}</span>
                  </p>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Final Remarks / Notes</label>
                    <textarea
                      value={actionRemarks}
                      onChange={e => setActionRemarks(e.target.value)}
                      placeholder={actionReqType === 'APPROVE' ? 'Enter final approval remarks...' : 'Enter rejection reason...'}
                      rows={3}
                      className="border rounded-lg bg-background p-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => setActionModalOpen(false)} className="px-3 py-1.5 border rounded-lg font-bold">Cancel</button>
                    <button
                      onClick={handleActionSubmit}
                      disabled={actionLoading}
                      className={`px-4 py-1.5 text-white rounded-lg font-bold shadow-sm ${
                        actionReqType === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                      }`}
                    >
                      {actionLoading ? 'Processing...' : actionReqType === 'APPROVE' ? 'Confirm Final Approval' : 'Confirm Rejection'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Audit Log Modal */}
            {auditModalOpen && selectedFacultyReq && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-card w-full max-w-lg border rounded-xl shadow-xl p-5 space-y-4 text-xs font-semibold">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h4 className="text-sm font-extrabold uppercase text-foreground">Audit Log & Timeline</h4>
                    <button onClick={() => setAuditModalOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
                  </div>
                  <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                    <div className="bg-muted/30 p-3 rounded-lg space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Request Info</p>
                      <p className="font-bold text-foreground">{selectedFacultyReq.title || selectedFacultyReq.type}</p>
                      <p className="text-[11px] text-muted-foreground">{selectedFacultyReq.reason}</p>
                    </div>

                    <div className="border-l-2 border-primary/30 pl-4 space-y-4 py-2">
                      {selectedFacultyReq.history?.map((h: any, i: number) => (
                        <div key={h.id || i} className="relative space-y-0.5">
                          <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary border-2 border-card" />
                          <div className="flex justify-between text-[10px]">
                            <span className="font-extrabold uppercase text-primary">{h.stage} Stage — {h.action}</span>
                            <span className="text-muted-foreground">{new Date(h.createdAt).toLocaleString('en-IN')}</span>
                          </div>
                          <p className="text-xs font-bold text-foreground">{h.actionByName}</p>
                          <p className="text-[11px] text-muted-foreground">{h.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button onClick={() => setAuditModalOpen(false)} className="px-4 py-1.5 border rounded-lg font-bold">Close</button>
                  </div>
                </div>
              </div>
            )}

          </div>
        );
      })()}

      {/* Tab Contents: Fee ledger (View Only) */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-2 border-b pb-3 no-print">
            <div>
              <h3 className="text-sm font-extrabold uppercase">Fee Coordination & Billing (Read-Only)</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Audit transaction bills, adjustments and confirmation receipts synced from the Finance module.</p>
            </div>
            <button onClick={() => handleExport('Finance Coordination Ledger', 'CSV')} className="h-8 border hover:bg-muted px-2.5 rounded-lg flex flex-wrap items-center gap-1 text-xs">
              <Download className="h-3.5 w-3.5" /> Export csv
            </button>
          </div>

          <div className="border bg-card p-5 rounded-xl shadow-sm text-xs font-bold text-left overflow-x-auto">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-muted/40 uppercase text-[9px] font-black border-b text-muted-foreground">
                  <th className="py-3 px-3">Receipt No</th>
                  <th className="py-3 px-2">Application No</th>
                  <th className="py-3 px-2">Applicant</th>
                  <th className="py-3 px-2 text-right">Application Fee</th>
                  <th className="py-3 px-2 text-right">Admission Tuition Fee</th>
                  <th className="py-3 px-2 text-right">Concession Adjustment</th>
                  <th className="py-3 px-2 text-right">Net Payable</th>
                  <th className="py-3 px-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paymentLedger.map((pay, idx) => (
                  <tr key={pay.id || idx} className="hover:bg-muted/10">
                    <td className="py-3.5 px-3 font-mono font-extrabold text-indigo-700">{pay.receiptNo}</td>
                    <td className="py-3.5 px-2 font-mono">{pay.applicationNo}</td>
                    <td className="py-3.5 px-2 font-extrabold text-slate-800">{pay.applicantName}</td>
                    <td className="py-3.5 px-2 text-right font-mono">₹{pay.applicationFee}</td>
                    <td className="py-3.5 px-2 text-right font-mono">₹{pay.admissionFee}</td>
                    <td className="py-3.5 px-2 text-right font-mono text-emerald-600">-₹{pay.concession}</td>
                    <td className="py-3.5 px-2 text-right font-mono font-black text-slate-900">₹{pay.finalFee}</td>
                    <td className="py-3.5 px-2 text-center">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black border ${
                        pay.paymentStatus === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'
                      }`}>
                        {pay.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Log CRM Enquiry Lead */}
      {showEnquiryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border overflow-hidden p-6 text-left space-y-4 text-xs font-bold">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-extrabold uppercase">Log New CRM Enquiry Lead</h3>
              <button onClick={() => setShowEnquiryModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleCreateEnquiry} className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-muted-foreground uppercase">Student Full Name</label>
                <input
                  type="text"
                  required
                  value={newEnquiry.studentName}
                  onChange={e => setNewEnquiry(prev => ({ ...prev, studentName: e.target.value }))}
                  className="h-9 px-3 border rounded-lg bg-background font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-muted-foreground uppercase">Parent Name</label>
                <input
                  type="text"
                  value={newEnquiry.parentName}
                  onChange={e => setNewEnquiry(prev => ({ ...prev, parentName: e.target.value }))}
                  className="h-9 px-3 border rounded-lg bg-background font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-muted-foreground uppercase">Registered Phone No</label>
                <input
                  type="text"
                  required
                  value={newEnquiry.phone}
                  onChange={e => setNewEnquiry(prev => ({ ...prev, phone: e.target.value }))}
                  className="h-9 px-3 border rounded-lg bg-background font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-muted-foreground uppercase">Email Address (Optional)</label>
                <input
                  type="email"
                  value={newEnquiry.email}
                  onChange={e => setNewEnquiry(prev => ({ ...prev, email: e.target.value }))}
                  className="h-9 px-3 border rounded-lg bg-background font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-muted-foreground uppercase">Inquiry Source</label>
                <select
                  value={newEnquiry.source}
                  onChange={e => setNewEnquiry(prev => ({ ...prev, source: e.target.value }))}
                  className="h-9 px-3 border rounded-lg bg-background"
                >
                  <option value="Walk-in">Walk-in</option>
                  <option value="Phone Call">Phone Call</option>
                  <option value="Website Lead">Website Lead</option>
                  <option value="Campaign Lead">Campaign Lead</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-muted-foreground uppercase">Notes / Interest Details</label>
                <textarea
                  value={newEnquiry.notes}
                  onChange={e => setNewEnquiry(prev => ({ ...prev, notes: e.target.value }))}
                  className="h-16 p-3 border rounded-lg bg-background"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full h-9 bg-primary text-primary-foreground font-black uppercase rounded-lg hover:bg-primary/95 text-[10px]"
              >
                Log Inquiry Lead
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Create Counselling Session */}
      {showCounsellingModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border overflow-hidden p-6 text-left space-y-4 text-xs font-bold">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-extrabold uppercase">Schedule Counselling Session</h3>
              <button onClick={() => setShowCounsellingModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleCreateSession} className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-muted-foreground uppercase">Session Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Merit Round 1 Counselling"
                  value={newSession.title}
                  onChange={e => setNewSession(prev => ({ ...prev, title: e.target.value }))}
                  className="h-9 px-3 border rounded-lg bg-background"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-muted-foreground uppercase">Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={newSession.dateTime}
                  onChange={e => setNewSession(prev => ({ ...prev, dateTime: e.target.value }))}
                  className="h-9 px-3 border rounded-lg bg-background"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-muted-foreground uppercase">Assigned Head Counsellor</label>
                <input
                  type="text"
                  required
                  value={newSession.counsellor}
                  onChange={e => setNewSession(prev => ({ ...prev, counsellor: e.target.value }))}
                  className="h-9 px-3 border rounded-lg bg-background"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-muted-foreground uppercase">Agenda / Notes</label>
                <textarea
                  value={newSession.notes}
                  onChange={e => setNewSession(prev => ({ ...prev, notes: e.target.value }))}
                  className="h-16 p-3 border rounded-lg bg-background font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full h-9 bg-primary text-primary-foreground font-black uppercase rounded-lg hover:bg-primary/95 text-[10px]"
              >
                Schedule Counselling
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Transfer Department */}
      {showTransferModal && selectedApp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-sm rounded-2xl shadow-xl border overflow-hidden p-6 text-left space-y-4 text-xs font-bold">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-extrabold uppercase">Departmental Transfer</h3>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg text-[10px] font-medium text-slate-650">
                You are initiating a department transfer for applicant <span className="font-extrabold text-slate-800">{selectedApp.firstName} {selectedApp.lastName}</span>.
                This will release their allocated seat in the old department and require a new seat allocation audit.
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-muted-foreground uppercase">Select Target Department</label>
                <select
                  value={transferDeptId}
                  onChange={e => setTransferDeptId(e.target.value)}
                  className="h-9 px-3 border rounded-lg bg-background"
                >
                  {intakeMatrix.map(item => (
                    <option key={item.departmentId} value={item.departmentId}>
                      {item.department.name} ({item.department.code}) — {item.availableSeats} Seats Available
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 h-9 border rounded-lg uppercase hover:bg-slate-50 text-[10px]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTransferDept}
                  disabled={actionLoading}
                  className="flex-1 h-9 bg-primary text-primary-foreground rounded-lg font-black uppercase hover:bg-primary/95 text-[10px]"
                >
                  Confirm Transfer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
