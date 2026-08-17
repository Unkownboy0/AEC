import React, { useState, useEffect } from 'react';
import {
  Users, User, CheckSquare, BarChart2, DollarSign, Calendar, Clock,
  MessageSquare, ChevronRight, ShieldAlert, Award, FileText, Download, Send, CheckCircle2,
  Bus, Megaphone, Bell, Settings, AlertTriangle, ArrowRight, RefreshCw, Phone, Mail
} from 'lucide-react';
import api from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../components/ui/Toast';
import { downloadAndOpen } from '../../platform/download';

interface LinkedChild {
  id: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
  departmentName?: string;
  programCode?: string;
  courseName?: string;
  semesterNumber?: number;
  sectionName?: string;
  mentorName?: string;
  mentorPhone?: string;
  mentorEmail?: string;
}

export const ParentWorkspacePortal: React.FC = () => {
  const { user } = useAuth();
  const [childrenList, setChildrenList] = useState<LinkedChild[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<
    'overview' | 'attendance' | 'marks' | 'fees' | 'receipts' | 'leave' | 'timetable' | 'transport' | 'circulars' | 'mentor' | 'preferences'
  >('overview');
  const [loading, setLoading] = useState(true);

  // Tab Data States
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [marksData, setMarksData] = useState<any[]>([]);
  const [feesData, setFeesData] = useState<any[]>([]);
  const [receiptsData, setReceiptsData] = useState<any[]>([]);
  const [leaveData, setLeaveData] = useState<any[]>([]);
  const [timetableData, setTimetableData] = useState<any[]>([]);
  const [transportData, setTransportData] = useState<any>(null);
  const [circularsData, setCircularsData] = useState<any[]>([]);
  const [alertsData, setAlertsData] = useState<any[]>([]);
  const [meetingsData, setMeetingsData] = useState<any[]>([]);
  const [notificationPrefs, setNotificationPrefs] = useState<any>({
    attendanceAlerts: true,
    feeDueAlerts: true,
    examResultAlerts: true,
    circularAlerts: true,
    emailNotifications: true,
    smsNotifications: true,
  });

  // Contact / Meeting Modal State
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [mentorMessage, setMentorMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    fetchLinkedChildren();
    fetchNotificationPrefs();
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      fetchTabContent(selectedChildId, activeTab);
    }
  }, [selectedChildId, activeTab]);

  const fetchLinkedChildren = async () => {
    try {
      setLoading(true);
      const res = await api.get('/parent/children');
      if (res.data?.status === 'success' && Array.isArray(res.data.data)) {
        setChildrenList(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedChildId(res.data.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch linked children:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationPrefs = async () => {
    try {
      const res = await api.get('/parent/notification-preferences');
      if (res.data?.status === 'success' && res.data.data) {
        setNotificationPrefs(res.data.data);
      }
    } catch (_) {}
  };

  const fetchTabContent = async (childId: string, tab: string) => {
    try {
      if (tab === 'overview') {
        const [attRes, feeRes, alertRes] = await Promise.all([
          api.get(`/parent/child/${childId}/attendance`).catch(() => null),
          api.get(`/parent/child/${childId}/fees`).catch(() => null),
          api.get(`/parent/child/${childId}/alerts`).catch(() => null),
        ]);
        if (attRes?.data?.status === 'success') setAttendanceData(attRes.data.data);
        if (feeRes?.data?.status === 'success') setFeesData(feeRes.data.data);
        if (alertRes?.data?.status === 'success') setAlertsData(alertRes.data.data);
      } else if (tab === 'attendance') {
        const res = await api.get(`/parent/child/${childId}/attendance`);
        if (res.data?.status === 'success') setAttendanceData(res.data.data);
      } else if (tab === 'marks') {
        const res = await api.get(`/parent/child/${childId}/marks`);
        if (res.data?.status === 'success') setMarksData(res.data.data);
      } else if (tab === 'fees') {
        const res = await api.get(`/parent/child/${childId}/fees`);
        if (res.data?.status === 'success') setFeesData(res.data.data);
      } else if (tab === 'receipts') {
        const res = await api.get(`/parent/child/${childId}/receipts`);
        if (res.data?.status === 'success') setReceiptsData(res.data.data);
      } else if (tab === 'leave') {
        const res = await api.get(`/parent/child/${childId}/leave-od`);
        if (res.data?.status === 'success') setLeaveData(res.data.data);
      } else if (tab === 'timetable') {
        const res = await api.get(`/parent/child/${childId}/timetable`);
        if (res.data?.status === 'success') setTimetableData(res.data.data);
      } else if (tab === 'transport') {
        const res = await api.get(`/parent/child/${childId}/transport`);
        if (res.data?.status === 'success') setTransportData(res.data.data);
      } else if (tab === 'circulars') {
        const res = await api.get(`/parent/child/${childId}/circulars`);
        if (res.data?.status === 'success') setCircularsData(res.data.data);
      } else if (tab === 'mentor') {
        const res = await api.get(`/parent/child/${childId}/mentor-meetings`);
        if (res.data?.status === 'success') setMeetingsData(res.data.data);
      }
    } catch (err) {
      console.error(`Failed to fetch ${tab} content:`, err);
    }
  };

  const handleContactMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mentorMessage.trim()) return;

    try {
      setIsSendingMessage(true);
      const res = await api.post(`/parent/child/${selectedChildId}/contact-mentor`, {
        message: mentorMessage,
      });
      if (res.data?.status === 'success') {
        toast.success(res.data.data.message || 'Message sent to Mentor!');
        setIsContactModalOpen(false);
        setMentorMessage('');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send message to Mentor');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleSavePrefs = async () => {
    try {
      setSavingPrefs(true);
      const res = await api.put('/parent/notification-preferences', notificationPrefs);
      if (res.data?.status === 'success') {
        toast.success('Notification preferences updated successfully!');
      }
    } catch (err) {
      toast.error('Failed to save preferences.');
    } finally {
      setSavingPrefs(false);
    }
  };

  const currentChild = childrenList.find((c) => c.id === selectedChildId);

  return (
    <div className="space-y-6 text-left pb-16 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-card border rounded-2xl p-6 shadow-xs gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
            Parent Companion Workspace
          </span>
          <h1 className="text-2xl font-black tracking-tight mt-1">Welcome, {user?.firstName} {user?.lastName} 👋</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor attendance, marks, fees, transport, and circulars for your explicitly linked children.
          </p>
        </div>

        {/* Child Selector for Multi-child Families */}
        {childrenList.length > 0 && (
          <div className="flex items-center gap-3 bg-muted/40 border border-slate-200/80 dark:border-slate-800 p-2.5 rounded-2xl shrink-0">
            <User className="h-5 w-5 text-indigo-600 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Select Active Child</span>
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="bg-transparent text-xs font-black text-slate-800 dark:text-white focus:outline-none cursor-pointer pr-2"
              >
                {childrenList.map((child) => (
                  <option key={child.id} value={child.id} className="bg-card text-foreground">
                    {child.firstName} {child.lastName} ({child.admissionNo})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-muted-foreground animate-pulse">
          Loading student profile information...
        </div>
      ) : !currentChild ? (
        <div className="bg-card border rounded-2xl p-8 text-center space-y-3">
          <ShieldAlert className="h-10 w-10 text-amber-500 mx-auto" />
          <h3 className="text-base font-extrabold">No Linked Child Records Found</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Your parent account is currently not linked to any active student records. Please contact the college administration office with your registered email ({user?.email}) to map your child's student admission profile.
          </p>
        </div>
      ) : (
        <>
          {/* Child Details Profile Card */}
          <div className="bg-card border rounded-2xl p-5 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <div className="flex items-center gap-3 border-r pr-4">
              <div className="h-12 w-12 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 flex items-center justify-center text-lg font-extrabold shrink-0">
                {currentChild.firstName[0]}{currentChild.lastName[0]}
              </div>
              <div>
                <h3 className="text-sm font-extrabold">{currentChild.firstName} {currentChild.lastName}</h3>
                <p className="text-[11px] text-muted-foreground font-mono">Admission No: {currentChild.admissionNo}</p>
              </div>
            </div>

            <div className="space-y-0.5 border-r pr-4">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Department / Program</span>
              <p className="text-xs font-extrabold">{currentChild.departmentName || 'Academic Department'}</p>
              <p className="text-[11px] text-muted-foreground">{currentChild.programCode || 'Degree'} • Sem {currentChild.semesterNumber || 1} (Sec {currentChild.sectionName || 'A'})</p>
            </div>

            <div className="space-y-0.5 border-r pr-4">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Assigned Mentor</span>
              <p className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">{currentChild.mentorName}</p>
              <p className="text-[10px] text-muted-foreground">{currentChild.mentorEmail || currentChild.mentorPhone || 'Official Work Contact'}</p>
            </div>

            <div className="flex justify-start md:justify-end">
              <button
                onClick={() => setIsContactModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow transition-all"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Contact Mentor</span>
              </button>
            </div>
          </div>

          {/* Important Alerts Banner */}
          {alertsData.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Important Child Alerts</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {alertsData.map((alt) => (
                  <div key={alt.id} className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
                    alt.severity === 'HIGH' ? 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/30 dark:text-rose-200' :
                    alt.severity === 'MEDIUM' ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200' :
                    'bg-indigo-50 border-indigo-200 text-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-200'
                  }`}>
                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold">{alt.title}</p>
                      <p className="text-[11px] opacity-90 mt-0.5">{alt.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex border-b gap-2 overflow-x-auto pb-1">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart2 },
              { id: 'attendance', label: 'Attendance', icon: CheckSquare },
              { id: 'marks', label: 'Marks & Results', icon: Award },
              { id: 'fees', label: 'Fee Bills', icon: DollarSign },
              { id: 'receipts', label: 'Fee Receipts', icon: FileText },
              { id: 'leave', label: 'Leave & OD', icon: Calendar },
              { id: 'timetable', label: 'Timetable', icon: Clock },
              { id: 'transport', label: 'Transport', icon: Bus },
              { id: 'circulars', label: 'Circulars', icon: Megaphone },
              { id: 'mentor', label: 'Mentor Meetings', icon: MessageSquare },
              { id: 'preferences', label: 'Preferences', icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 0: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-card border rounded-2xl shadow-xs">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Overall Attendance</span>
                  <p className={`text-2xl font-black mt-1 ${
                    (attendanceData?.summary?.attendancePercentage || 92) >= 75 ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {attendanceData?.summary?.attendancePercentage ?? '92.8'}%
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">Requirement: &gt;75%</p>
                </div>

                <div className="p-4 bg-card border rounded-2xl shadow-xs">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Recent Academic Status</span>
                  <p className="text-2xl font-black mt-1 text-indigo-600">Active</p>
                  <p className="text-[10px] text-slate-400 mt-1">Sem {currentChild.semesterNumber || 1} • In Progress</p>
                </div>

                <div className="p-4 bg-card border rounded-2xl shadow-xs">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Assigned Bus Transport</span>
                  <p className="text-2xl font-black mt-1 text-slate-800 dark:text-white">
                    {transportData?.isAssigned ? transportData.routeNumber : 'Standard'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">{transportData?.pickupStop || 'Campus Access'}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              {attendanceData?.summary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-card border rounded-2xl shadow-xs">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Attendance Rate</span>
                    <p className={`text-2xl font-black mt-1 ${
                      attendanceData.summary.attendancePercentage >= 75 ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {attendanceData.summary.attendancePercentage}%
                    </p>
                  </div>
                  <div className="p-4 bg-card border rounded-2xl shadow-xs">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Total Sessions</span>
                    <p className="text-2xl font-black mt-1 text-foreground">{attendanceData.summary.totalSessions}</p>
                  </div>
                  <div className="p-4 bg-card border rounded-2xl shadow-xs">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Classes Present</span>
                    <p className="text-2xl font-black mt-1 text-emerald-600">{attendanceData.summary.presentCount}</p>
                  </div>
                  <div className="p-4 bg-card border rounded-2xl shadow-xs">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Classes Absent</span>
                    <p className="text-2xl font-black mt-1 text-rose-600">{attendanceData.summary.absentCount}</p>
                  </div>
                </div>
              )}

              <div className="bg-card border rounded-2xl p-5 shadow-xs space-y-3">
                <h3 className="text-sm font-extrabold">Period & Daily Attendance Log</h3>
                {!attendanceData?.recentRecords || attendanceData.recentRecords.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4">No recent attendance records logged yet.</p>
                ) : (
                  <div className="divide-y max-h-96 overflow-y-auto">
                    {attendanceData.recentRecords.map((r: any) => (
                      <div key={r.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-foreground">{r.subjectName}</p>
                          <p className="text-[10px] text-muted-foreground">{new Date(r.date).toLocaleDateString('en-IN')}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                          r.status === 'PRESENT' ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-700 border border-rose-500/20'
                        }`}>
                          {r.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MARKS & RESULTS */}
          {activeTab === 'marks' && (
            <div className="bg-card border rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold">Academic Internal Assessment Marks & Semester Results</h3>
              {marksData.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4">No published exam mark records found for this student.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/30 border-b text-[10px] font-bold uppercase text-muted-foreground">
                      <tr>
                        <th className="p-3">Examination</th>
                        <th className="p-3">Subject</th>
                        <th className="p-3">Internal</th>
                        <th className="p-3">External</th>
                        <th className="p-3">Total Marks</th>
                        <th className="p-3">Grade</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {marksData.map((m) => (
                        <tr key={m.id} className="hover:bg-muted/10">
                          <td className="p-3 font-bold">{m.examName}</td>
                          <td className="p-3">
                            <span className="font-bold text-foreground">{m.subjectName}</span>
                            <span className="text-[10px] text-muted-foreground block font-mono">{m.subjectCode}</span>
                          </td>
                          <td className="p-3 font-mono font-semibold">{m.internalMarks}</td>
                          <td className="p-3 font-mono font-semibold">{m.externalMarks}</td>
                          <td className="p-3 font-mono font-bold text-indigo-600">{m.totalMarks}</td>
                          <td className="p-3 font-black text-xs">{m.grade}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              m.status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-amber-500/10 text-amber-700'
                            }`}>
                              {m.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FEES */}
          {activeTab === 'fees' && (
            <div className="bg-card border rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold">Semester Fee Bills & Outstanding Balance</h3>
              {feesData.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4">No fee bills issued for this student.</p>
              ) : (
                <div className="space-y-3">
                  {feesData.map((b) => (
                    <div key={b.id} className="p-4 border rounded-2xl bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold">{b.categoryName}</span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            b.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-700 border border-rose-500/20'
                          }`}>
                            {b.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Billing Date: {new Date(b.billingDate).toLocaleDateString('en-IN')} • Due Date: {new Date(b.dueDate).toLocaleDateString('en-IN')}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right font-mono">
                          <span className="text-[10px] text-muted-foreground block">Balance Due</span>
                          <span className="text-sm font-black text-indigo-600">₹{b.balanceDue.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: RECEIPTS */}
          {activeTab === 'receipts' && (
            <div className="bg-card border rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold">Verified Fee Payment Receipts</h3>
              {receiptsData.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4">No fee payment receipts recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {receiptsData.map((rec) => (
                    <div key={rec.id} className="p-4 border rounded-2xl bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold">{rec.categoryName} — Receipt #{rec.receiptNumber}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Mode: {rec.paymentMode} • Txn: {rec.transactionId || 'N/A'}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black font-mono text-emerald-600">₹{rec.amountPaid.toLocaleString('en-IN')}</span>
                        <button
                          onClick={async () => {
                            const res = await downloadAndOpen(
                              `/enterprise/fees/student/payments/${rec.id}/receipt`,
                              `CampusOS_Receipt_${rec.receiptNumber || rec.id}.pdf`
                            );
                            if (res.success) {
                              toast.success(`Receipt #${rec.receiptNumber} downloaded successfully.`);
                            } else {
                              toast.error(res.error || 'Unable to download receipt PDF.');
                            }
                          }}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-all"
                        >
                          <Download className="h-3.5 w-3.5" /> Receipt PDF
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: LEAVE & OD */}
          {activeTab === 'leave' && (
            <div className="bg-card border rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold">Student Leave & On-Duty (OD) History</h3>
              {leaveData.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4">No leave or OD applications submitted.</p>
              ) : (
                <div className="space-y-2.5">
                  {leaveData.map((l) => (
                    <div key={l.id} className="p-3.5 border rounded-xl bg-muted/10 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{l.type === 'ON_DUTY' ? 'On-Duty (OD) Request' : 'Leave Request'} ({l.requestNumber})</span>
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {l.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">Reason: {l.reason}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Duration: {new Date(l.startDate).toLocaleDateString('en-IN')} to {new Date(l.endDate).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: TIMETABLE */}
          {activeTab === 'timetable' && (
            <div className="bg-card border rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold">Weekly Class Timetable Schedule</h3>
              {timetableData.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4">No published timetable slots available.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {timetableData.map((t) => (
                    <div key={t.id} className="p-3 border rounded-xl bg-muted/10 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-600">{t.dayOfWeek} • Period {t.slotIndex}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">{t.startTime} - {t.endTime}</span>
                      </div>
                      <p className="text-xs font-extrabold">{t.subjectName}</p>
                      <p className="text-[10px] text-muted-foreground">Faculty: {t.facultyName} • Room: {t.roomNo}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: TRANSPORT */}
          {activeTab === 'transport' && (
            <div className="bg-card border rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold">Bus Transport & Route Allocation</h3>
              {!transportData?.isAssigned ? (
                <p className="text-xs text-muted-foreground py-4">No bus transport assigned for this student.</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3.5 border rounded-xl bg-muted/10">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Route & Bus</span>
                      <p className="text-xs font-extrabold">{transportData.routeName} ({transportData.routeNumber})</p>
                      <p className="text-[10px] text-muted-foreground">Bus: {transportData.busNumber} • Reg: {transportData.vehicleReg}</p>
                    </div>
                    <div className="p-3.5 border rounded-xl bg-muted/10">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Assigned Pickup Stop</span>
                      <p className="text-xs font-extrabold text-indigo-600">{transportData.pickupStop}</p>
                    </div>
                    <div className="p-3.5 border rounded-xl bg-muted/10">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Driver Work Contact</span>
                      <p className="text-xs font-extrabold">{transportData.driverName || 'Campus Driver'}</p>
                      <p className="text-[10px] text-muted-foreground">{transportData.driverPhone || 'Contact transport office'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 8: CIRCULARS */}
          {activeTab === 'circulars' && (
            <div className="bg-card border rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold">College Notices & Institutional Circulars</h3>
              {circularsData.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4">No published circulars for this student's department.</p>
              ) : (
                <div className="space-y-3">
                  {circularsData.map((c) => (
                    <div key={c.id} className="p-4 border rounded-2xl bg-muted/10 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-indigo-600 uppercase">{c.category || c.broadcastLevel || 'Notice'}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(c.publishedAt || c.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-white">{c.title}</h4>
                      {c.content && <p className="text-xs text-muted-foreground line-clamp-2">{c.content}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 9: MENTOR MEETINGS */}
          {activeTab === 'mentor' && (
            <div className="bg-card border rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold">Mentor Consultations & Scheduled Meetings</h3>
                <button
                  onClick={() => setIsContactModalOpen(true)}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl"
                >
                  Request Meeting
                </button>
              </div>

              {meetingsData.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4">No previous mentor meeting records logged.</p>
              ) : (
                <div className="space-y-3">
                  {meetingsData.map((m) => (
                    <div key={m.id} className="p-3.5 border rounded-xl bg-muted/10 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold">{m.summary}</p>
                        <p className="text-[10px] text-muted-foreground">Date: {new Date(m.sessionDate).toLocaleDateString('en-IN')}</p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {m.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 10: NOTIFICATION PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="max-w-xl border bg-card p-6 rounded-2xl shadow-sm space-y-5">
              <div>
                <h3 className="text-sm font-black uppercase text-slate-800 dark:text-white">Parent Notification Preferences</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Customize how and when you receive automated updates regarding your child</p>
              </div>

              <div className="space-y-3 text-xs">
                {[
                  { key: 'attendanceAlerts', label: 'Attendance Shortage Alerts (<75%)' },
                  { key: 'feeDueAlerts', label: 'Fee Billing & Balance Reminders' },
                  { key: 'examResultAlerts', label: 'Semester Exam Grade & Result Publications' },
                  { key: 'circularAlerts', label: 'College Notices & Circular Notifications' },
                  { key: 'emailNotifications', label: 'Receive Email Notifications' },
                  { key: 'smsNotifications', label: 'Receive SMS Mobile Alerts' },
                ].map((pref) => (
                  <div key={pref.key} className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{pref.label}</span>
                    <input
                      type="checkbox"
                      checked={!!notificationPrefs[pref.key]}
                      onChange={(e) => setNotificationPrefs({ ...notificationPrefs, [pref.key]: e.target.checked })}
                      className="h-4.5 w-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
                ))}

                <button
                  onClick={handleSavePrefs}
                  disabled={savingPrefs}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow transition-all disabled:opacity-60 mt-2"
                >
                  {savingPrefs ? 'Saving Preferences...' : 'Save Notification Preferences'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Contact Mentor Modal */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-extrabold">Message Student Mentor</h3>
              <button onClick={() => setIsContactModalOpen(false)} className="text-xs text-muted-foreground">✕</button>
            </div>
            <form onSubmit={handleContactMentor} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Mentor Name</label>
                <input
                  type="text"
                  disabled
                  value={currentChild?.mentorName || 'Unassigned'}
                  className="w-full h-9 border rounded-xl bg-muted/30 px-3 text-xs font-bold text-muted-foreground"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Your Query / Message</label>
                <textarea
                  rows={4}
                  value={mentorMessage}
                  onChange={(e) => setMentorMessage(e.target.value)}
                  placeholder="Enter your message regarding your child's attendance, fees, or academic progress..."
                  className="w-full border rounded-xl bg-background p-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsContactModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingMessage}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-extrabold rounded-xl hover:bg-indigo-500 flex items-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{isSendingMessage ? 'Sending...' : 'Send Message'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentWorkspacePortal;
