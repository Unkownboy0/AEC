import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User,
  BookOpen,
  Clock,
  FileCheck,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  LayoutGrid,
  CalendarDays,
  GraduationCap,
  MessageSquare,
  Home,
  Bus,
  DollarSign,
  Edit3,
  CheckCircle2,
  Plus,
  ShieldAlert,
} from 'lucide-react';
import api from '../../../lib/axios';
import { Skeleton } from '../../../design-system/components/Skeleton';
import { ErrorState } from '../../../design-system/components/ErrorState';
import { StatusBadge } from '../../../design-system/components/StatusBadge';
import { EmptyState } from '../../../design-system/components/EmptyState';
import { toast } from '../../../components/ui/Toast';

type TabKey = 'overview' | 'attendance' | 'marks' | 'leave' | 'services' | 'fees' | 'counseling';

const NOT_AVAILABLE = 'Not available';

const formatDate = (value?: string | null) => {
  if (!value) return NOT_AVAILABLE;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return NOT_AVAILABLE;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

export const MentorStudentDetailPage: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<any>(null);
  const [residentialData, setResidentialData] = useState<any>(null);
  const [feeData, setFeeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // Residential & Transport Edit Modal State
  const [isResidentialModalOpen, setIsResidentialModalOpen] = useState(false);
  const [resType, setResType] = useState<'HOSTELLER' | 'DAY_SCHOLAR'>('DAY_SCHOLAR');
  const [transMode, setTransMode] = useState<string>('OTHER');
  const [changeReason, setChangeReason] = useState('');
  const [changeRemarks, setChangeRemarks] = useState('');
  const [savingResidential, setSavingResidential] = useState(false);

  // Fee Assessment Modal State
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [feeAmount, setFeeAmount] = useState('');
  const [feeCategoryName, setFeeCategoryName] = useState('Tuition Fee');
  const [feeDueDate, setFeeDueDate] = useState('');
  const [feeScholarship, setFeeScholarship] = useState('0');
  const [feeReason, setFeeReason] = useState('');
  const [feeRemarks, setFeeRemarks] = useState('');
  const [savingFee, setSavingFee] = useState(false);

  const fetchStudentDetail = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    setError(null);
    try {
      const [mainRes, resRes, feeRes] = await Promise.allSettled([
        api.get(`/mentor/students/${studentId}`),
        api.get(`/mentor/students/${studentId}/residential`),
        api.get(`/mentor/students/${studentId}/fees`),
      ]);

      if (mainRes.status === 'fulfilled') {
        const payload = mainRes.value.data?.status === 'success' || mainRes.value.data?.success ? mainRes.value.data.data || mainRes.value.data : mainRes.value.data;
        setDetail(payload);
      } else {
        throw mainRes.reason;
      }

      if (resRes.status === 'fulfilled' && resRes.value.data?.data) {
        setResidentialData(resRes.value.data.data);
        setResType(resRes.value.data.data.residentialType || 'DAY_SCHOLAR');
        setTransMode(resRes.value.data.data.transportMode || 'OTHER');
      }

      if (feeRes.status === 'fulfilled' && feeRes.value.data?.data) {
        setFeeData(feeRes.value.data.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch mentee details:', err);
      setError(err.response?.data?.message || `Unable to load details for student ID #${studentId}.`);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchStudentDetail();
  }, [fetchStudentDetail]);

  const handleUpdateResidential = async () => {
    if (!changeReason.trim()) {
      toast.error('Please provide a mandatory reason for this residential/transport change.');
      return;
    }
    try {
      setSavingResidential(true);
      const res = await api.patch(`/mentor/students/${studentId}/residential`, {
        residentialType: resType,
        transportMode: resType === 'HOSTELLER' ? undefined : transMode,
        reason: changeReason,
        remarks: changeRemarks,
      });
      if (res.data?.status === 'success') {
        toast.success(res.data.message || 'Residential & Transport status updated successfully!');
        setIsResidentialModalOpen(false);
        setChangeReason('');
        setChangeRemarks('');
        fetchStudentDetail();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update residential status');
    } finally {
      setSavingResidential(false);
    }
  };

  const handleAssessFee = async () => {
    if (!feeAmount || Number(feeAmount) <= 0) {
      toast.error('Please enter a valid positive fee amount.');
      return;
    }
    if (!feeReason.trim()) {
      toast.error('Please enter a mandatory reason for assessing this fee.');
      return;
    }
    try {
      setSavingFee(true);
      const res = await api.post(`/mentor/students/${studentId}/fees`, {
        categoryName: feeCategoryName,
        amount: Number(feeAmount),
        scholarshipDiscount: Number(feeScholarship || 0),
        dueDate: feeDueDate || new Date(Date.now() + 30 * 86400000).toISOString(),
        reason: feeReason,
        remarks: feeRemarks,
      });
      if (res.data?.status === 'success') {
        toast.success('Fee assessed successfully for mentee!');
        setIsFeeModalOpen(false);
        setFeeAmount('');
        setFeeReason('');
        setFeeRemarks('');
        fetchStudentDetail();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to assess fee');
    } finally {
      setSavingFee(false);
    }
  };

  const student = detail?.student;
  const recentAttendance: any[] = detail?.recentAttendance || [];
  const academicMarks: any[] = detail?.academicMarks || [];
  const leaveRequests: any[] = detail?.leaveRequests || [];
  const counselingRecords: any[] = detail?.counselingRecords || [];

  const attendanceSummary = useMemo(() => {
    const total = recentAttendance.length;
    const present = recentAttendance.filter((a) => a.status === 'PRESENT').length;
    const pct = total > 0 ? Math.round((present / total) * 1000) / 10 : null;
    return { total, present, pct };
  }, [recentAttendance]);

  const academicSummary = useMemo(() => {
    const publishedMarks = academicMarks.filter((m) => m.status === 'PUBLISHED');
    const cgpa = publishedMarks.length > 0
      ? Math.round((publishedMarks.reduce((sum, m) => sum + (m.gpa || 0), 0) / publishedMarks.length) * 100) / 100
      : null;
    const arrearsCount = publishedMarks.filter((m) => m.grade === 'F').length;
    return { cgpa, arrearsCount };
  }, [academicMarks]);

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-7xl mx-auto">
        <Skeleton variant="card" count={2} />
        <Skeleton variant="table" count={4} />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <ErrorState
          title="Student Record Unavailable"
          description={error || 'Mentee record not found.'}
          onBack={() => navigate('/faculty/mentor/students')}
          onRetry={fetchStudentDetail}
        />
      </div>
    );
  }

  const isAttRisk = attendanceSummary.pct !== null && attendanceSummary.pct < 75;
  const fullName = student.firstName || student.lastName
    ? `${student.firstName || ''} ${student.lastName || ''}`.trim()
    : 'Mentee Name Unavailable';

  const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }[] = [
    { key: 'overview', label: 'Overview', icon: LayoutGrid },
    { key: 'services', label: 'Residential & Transport', icon: Home },
    { key: 'fees', label: 'Fees & Assessment', icon: DollarSign, count: feeData?.bills?.length },
    { key: 'attendance', label: 'Attendance', icon: CalendarDays, count: recentAttendance.length },
    { key: 'marks', label: 'Marks', icon: GraduationCap, count: academicMarks.length },
    { key: 'leave', label: 'Leave / OD', icon: FileCheck, count: leaveRequests.length },
    { key: 'counseling', label: 'Counseling Notes', icon: MessageSquare, count: counselingRecords.length },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in-50 duration-200">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/faculty/mentor/students')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground bg-muted/50 rounded-xl border border-border transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Mentees Roster
        </button>

        <button
          onClick={fetchStudentDetail}
          className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Student Profile Card */}
      <div className="bg-card border border-border p-6 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/60 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 font-extrabold text-xl flex items-center justify-center border border-purple-500/20">
              {student.firstName ? student.firstName.charAt(0) : 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-foreground">{fullName}</h1>
                <StatusBadge status={student.status || 'ACTIVE'} />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                Admission No: {student.admissionNo || studentId}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-bold">
            <button
              onClick={() => setIsResidentialModalOpen(true)}
              className="px-3.5 py-2 bg-indigo-600 text-white rounded-xl shadow-xs hover:bg-indigo-700 flex items-center gap-1.5 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Residential / Transport
            </button>
            <button
              onClick={() => setIsFeeModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl shadow-xs hover:bg-emerald-700 flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Assess Fee
            </button>
            <button
              onClick={() => navigate('/faculty/mentor/counselling')}
              className="px-3.5 py-2 bg-primary text-primary-foreground rounded-xl shadow-xs hover:bg-primary/90 transition-colors"
            >
              Log Counseling
            </button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs pt-2">
          <div className="p-3 bg-muted/30 border border-border/60 rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Residential Status</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-foreground">
                {residentialData?.residentialType || student.residentialType || 'DAY_SCHOLAR'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 font-bold">
                {residentialData?.residentialType === 'HOSTELLER' ? 'Hostel' : residentialData?.transportMode || 'Day Scholar'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-muted/30 border border-border/60 rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Attendance Percentage</span>
            <div className="flex items-center justify-between">
              <span className={`text-xl font-extrabold ${attendanceSummary.pct === null ? 'text-muted-foreground' : isAttRisk ? 'text-rose-500' : 'text-emerald-500'}`}>
                {attendanceSummary.pct === null ? NOT_AVAILABLE : `${attendanceSummary.pct}%`}
              </span>
              {isAttRisk && <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />}
            </div>
          </div>

          <div className="p-3 bg-muted/30 border border-border/60 rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">CGPA / Backlogs</span>
            <span className="text-sm font-extrabold text-foreground block">
              CGPA: {academicSummary.cgpa ?? 'N/A'} • Arrears: {academicSummary.arrearsCount}
            </span>
          </div>

          <div className="p-3 bg-muted/30 border border-border/60 rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Outstanding Fees</span>
            <span className={`text-sm font-extrabold block ${feeData?.summary?.outstanding > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              ₹{feeData?.summary?.outstanding?.toLocaleString('en-IN') ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors border ${
                isActive
                  ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                  : 'bg-card text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {typeof tab.count === 'number' && (
                <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-primary-foreground/20' : 'bg-muted'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border border-border p-5 rounded-2xl shadow-xs space-y-3">
            <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Contact Details
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-semibold text-foreground">{student.email || NOT_AVAILABLE}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-semibold text-foreground">{student.phone || NOT_AVAILABLE}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Parent Name</span><span className="font-semibold text-foreground">{student.parentName || NOT_AVAILABLE}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Parent Phone</span><span className="font-semibold text-foreground">{student.parentPhone || NOT_AVAILABLE}</span></div>
            </div>
          </div>
          <div className="bg-card border border-border p-5 rounded-2xl shadow-xs space-y-3">
            <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" /> Academic Hierarchy
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Program</span><span className="font-semibold text-foreground">{student.program?.name || NOT_AVAILABLE}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Department</span><span className="font-semibold text-foreground">{student.department?.name || NOT_AVAILABLE}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Semester</span><span className="font-semibold text-foreground">{student.semester?.number ?? NOT_AVAILABLE}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Section</span><span className="font-semibold text-foreground">{student.section?.name || NOT_AVAILABLE}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: RESIDENTIAL & TRANSPORT */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border border-border p-5 rounded-2xl shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5" /> Residential Status
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/10 text-indigo-600">
                  {residentialData?.residentialType || 'DAY_SCHOLAR'}
                </span>
              </div>
              {residentialData?.activeHostelAllocation ? (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1 text-xs">
                  <p className="font-bold text-emerald-700 dark:text-emerald-400">Active Hostel Allocation</p>
                  <p className="text-muted-foreground">Room: {residentialData.activeHostelAllocation.room?.roomNumber || 'Assigned'}</p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No active hostel room allocated.</p>
              )}
            </div>

            <div className="bg-card border border-border p-5 rounded-2xl shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Bus className="w-3.5 h-3.5" /> Transport Mode
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-500/10 text-purple-600">
                  {residentialData?.transportMode || 'OTHER'}
                </span>
              </div>
              {residentialData?.activeTransportAllocation ? (
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl space-y-1 text-xs">
                  <p className="font-bold text-indigo-700 dark:text-indigo-400">Active Bus Route Allocation</p>
                  <p className="text-muted-foreground">Route: {residentialData.activeTransportAllocation.route?.routeName || 'Assigned'}</p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No college bus route allocated.</p>
              )}
            </div>
          </div>

          {/* History Timeline */}
          <div className="bg-card border border-border p-5 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider">
              Residential & Transport Change History
            </h3>
            {residentialData?.history?.length > 0 ? (
              <div className="space-y-3">
                {residentialData.history.map((h: any) => (
                  <div key={h.id} className="p-3 bg-muted/30 border border-border/60 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">
                        {h.oldResidentialType} → {h.newResidentialType} ({h.newTransportMode || 'N/A'})
                      </span>
                      <span className="text-[10px] text-muted-foreground">{formatDate(h.createdAt)}</span>
                    </div>
                    <p className="text-muted-foreground"><strong className="text-foreground">Reason:</strong> {h.reason}</p>
                    {h.remarks && <p className="text-muted-foreground"><strong className="text-foreground">Remarks:</strong> {h.remarks}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No residential changes recorded yet.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB: FEES & ASSESSMENT */}
      {activeTab === 'fees' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-4 bg-card border border-border rounded-xl space-y-1">
              <span className="text-muted-foreground">Total Assessed</span>
              <p className="text-lg font-black text-foreground">₹{feeData?.summary?.totalAssessed?.toLocaleString('en-IN') ?? 0}</p>
            </div>
            <div className="p-4 bg-card border border-border rounded-xl space-y-1">
              <span className="text-muted-foreground">Scholarship / Concession</span>
              <p className="text-lg font-black text-emerald-600">₹{feeData?.summary?.totalScholarship?.toLocaleString('en-IN') ?? 0}</p>
            </div>
            <div className="p-4 bg-card border border-border rounded-xl space-y-1">
              <span className="text-muted-foreground">Total Paid</span>
              <p className="text-lg font-black text-indigo-600">₹{feeData?.summary?.totalPaid?.toLocaleString('en-IN') ?? 0}</p>
            </div>
            <div className="p-4 bg-card border border-border rounded-xl space-y-1">
              <span className="text-muted-foreground">Net Outstanding</span>
              <p className="text-lg font-black text-amber-600">₹{feeData?.summary?.outstanding?.toLocaleString('en-IN') ?? 0}</p>
            </div>
          </div>

          {/* Bills List */}
          <div className="bg-card border border-border rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-border/60 flex justify-between items-center">
              <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider">Fee Assessment Bills</h3>
              <button
                onClick={() => setIsFeeModalOpen(true)}
                className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Assess Fee
              </button>
            </div>
            {feeData?.bills?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40 text-[10px] uppercase font-bold text-muted-foreground">
                    <tr>
                      <th className="text-left px-4 py-2.5">Invoice / Head</th>
                      <th className="text-left px-4 py-2.5">Amount</th>
                      <th className="text-left px-4 py-2.5">Discount</th>
                      <th className="text-left px-4 py-2.5">Due Date</th>
                      <th className="text-left px-4 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {feeData.bills.map((b: any) => (
                      <tr key={b.id}>
                        <td className="px-4 py-2.5 font-bold text-foreground">
                          {b.category?.name || 'General Fee'}
                          <span className="block text-[10px] font-mono text-muted-foreground">{b.invoiceNumber}</span>
                        </td>
                        <td className="px-4 py-2.5 font-black text-foreground">₹{b.amount?.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-2.5 text-emerald-600">₹{b.scholarshipDiscount || 0}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{formatDate(b.dueDate)}</td>
                        <td className="px-4 py-2.5"><StatusBadge status={b.status} size="sm" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-muted-foreground">No fee bills recorded for this student.</div>
            )}
          </div>
        </div>
      )}

      {/* TAB: ATTENDANCE */}
      {activeTab === 'attendance' && (
        recentAttendance.length === 0 ? (
          <EmptyState title="No Attendance Records" description="No attendance has been recorded for this mentee yet." />
        ) : (
          <div className="bg-card border border-border rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/40 text-[10px] uppercase font-bold text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-2.5">Date</th>
                    <th className="text-left px-4 py-2.5">Type</th>
                    <th className="text-left px-4 py-2.5">Status</th>
                    <th className="text-left px-4 py-2.5">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {recentAttendance.map((a) => (
                    <tr key={a.id}>
                      <td className="px-4 py-2.5 font-semibold text-foreground">{formatDate(a.date)}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{a.type || 'DAILY'}</td>
                      <td className="px-4 py-2.5"><StatusBadge status={a.status} size="sm" /></td>
                      <td className="px-4 py-2.5 text-muted-foreground">{a.remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* TAB: MARKS */}
      {activeTab === 'marks' && (
        academicMarks.length === 0 ? (
          <EmptyState title="No Marks Recorded" description="No exam marks have been entered for this mentee yet." />
        ) : (
          <div className="bg-card border border-border rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/40 text-[10px] uppercase font-bold text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-2.5">Subject</th>
                    <th className="text-left px-4 py-2.5">Internal</th>
                    <th className="text-left px-4 py-2.5">External</th>
                    <th className="text-left px-4 py-2.5">Grade</th>
                    <th className="text-left px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {academicMarks.map((m) => (
                    <tr key={m.id}>
                      <td className="px-4 py-2.5 font-semibold text-foreground">
                        {m.subject?.name || 'Subject'}
                        <span className="block text-[10px] text-muted-foreground font-mono">{m.subject?.code}</span>
                      </td>
                      <td className="px-4 py-2.5">{m.internalMarks ?? '—'}</td>
                      <td className="px-4 py-2.5">{m.externalMarks ?? '—'}</td>
                      <td className="px-4 py-2.5 font-bold">{m.grade || '—'}</td>
                      <td className="px-4 py-2.5"><StatusBadge status={m.status} size="sm" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* TAB: LEAVE / OD */}
      {activeTab === 'leave' && (
        leaveRequests.length === 0 ? (
          <EmptyState title="No Leave Requests" description="No leave or OD applications found." />
        ) : (
          <div className="bg-card border border-border rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/40 text-[10px] uppercase font-bold text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-2.5">Type</th>
                    <th className="text-left px-4 py-2.5">Dates</th>
                    <th className="text-left px-4 py-2.5">Reason</th>
                    <th className="text-left px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {leaveRequests.map((l) => (
                    <tr key={l.id}>
                      <td className="px-4 py-2.5 font-bold">{l.type}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{formatDate(l.startDate)} → {formatDate(l.endDate)}</td>
                      <td className="px-4 py-2.5">{l.reason}</td>
                      <td className="px-4 py-2.5"><StatusBadge status={l.status} size="sm" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* TAB: COUNSELING */}
      {activeTab === 'counseling' && (
        counselingRecords.length === 0 ? (
          <EmptyState title="No Counseling Records" description="No notes logged for this student yet." />
        ) : (
          <div className="space-y-3">
            {counselingRecords.map((c) => (
              <div key={c.id} className="p-4 bg-card border border-border rounded-2xl shadow-xs text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-foreground">{c.actionTaken || 'Counseling Session'}</span>
                  <span className="text-[10px] text-muted-foreground">{formatDate(c.createdAt)}</span>
                </div>
                <p className="text-muted-foreground">{c.notes}</p>
              </div>
            ))}
          </div>
        )
      )}

      {/* MODAL: RESIDENTIAL & TRANSPORT EDIT */}
      {isResidentialModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <h2 className="text-lg font-black text-foreground">Update Residential & Transport Status</h2>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold block mb-1">Residential Classification</label>
                <select
                  value={resType}
                  onChange={(e) => setResType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-muted/40 border border-border font-bold text-foreground"
                >
                  <option value="DAY_SCHOLAR">Day Scholar</option>
                  <option value="HOSTELLER">Hosteller</option>
                </select>
              </div>

              {resType === 'DAY_SCHOLAR' && (
                <div>
                  <label className="font-bold block mb-1">Transport Mode</label>
                  <select
                    value={transMode}
                    onChange={(e) => setTransMode(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-muted/40 border border-border font-bold text-foreground"
                  >
                    <option value="COLLEGE_BUS">College Bus</option>
                    <option value="OUT_BUS">Out Bus</option>
                    <option value="OWN_VEHICLE">Own Vehicle (Bike/Car)</option>
                    <option value="PUBLIC_TRANSPORT">Public Transport (Train/Bus)</option>
                    <option value="PARENT_DROP_PICKUP">Parent Drop & Pick up</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              )}

              <div>
                <label className="font-bold block mb-1">Mandatory Reason for Change</label>
                <textarea
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="Explain why the student's residential/transport status is being modified..."
                  rows={3}
                  className="w-full p-2.5 rounded-xl bg-muted/40 border border-border text-foreground"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Additional Remarks (Optional)</label>
                <input
                  type="text"
                  value={changeRemarks}
                  onChange={(e) => setChangeRemarks(e.target.value)}
                  placeholder="Optional operational remarks..."
                  className="w-full p-2.5 rounded-xl bg-muted/40 border border-border text-foreground"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsResidentialModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-muted hover:bg-muted/80 text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateResidential}
                disabled={savingResidential}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {savingResidential ? 'Saving...' : 'Confirm & Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ASSESS FEE */}
      {isFeeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <h2 className="text-lg font-black text-foreground">Assess Student Fee</h2>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold block mb-1">Fee Category / Head</label>
                <select
                  value={feeCategoryName}
                  onChange={(e) => setFeeCategoryName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-muted/40 border border-border font-bold text-foreground"
                >
                  <option value="Tuition Fee">Tuition Fee</option>
                  <option value="Hostel Fee">Hostel Fee</option>
                  <option value="Mess Fee">Mess Fee</option>
                  <option value="Transport Fee">Transport Fee</option>
                  <option value="Exam Fee">Exam Fee</option>
                  <option value="Special Lab Fee">Special Lab Fee</option>
                  <option value="Admission Fee">Admission Fee</option>
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={feeAmount}
                  onChange={(e) => setFeeAmount(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full p-2.5 rounded-xl bg-muted/40 border border-border font-bold text-foreground"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Scholarship / Concession Discount (₹)</label>
                <input
                  type="number"
                  value={feeScholarship}
                  onChange={(e) => setFeeScholarship(e.target.value)}
                  placeholder="0"
                  className="w-full p-2.5 rounded-xl bg-muted/40 border border-border text-foreground"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Payment Due Date</label>
                <input
                  type="date"
                  value={feeDueDate}
                  onChange={(e) => setFeeDueDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-muted/40 border border-border text-foreground"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Reason for Assessment / Adjustment</label>
                <textarea
                  value={feeReason}
                  onChange={(e) => setFeeReason(e.target.value)}
                  placeholder="State assessment rationale for audit trail..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-muted/40 border border-border text-foreground"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsFeeModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-muted hover:bg-muted/80 text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleAssessFee}
                disabled={savingFee}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {savingFee ? 'Saving...' : 'Post Fee Bill'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorStudentDetailPage;
