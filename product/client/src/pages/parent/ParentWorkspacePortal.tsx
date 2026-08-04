import React, { useState, useEffect } from 'react';
import {
  Users, User, CheckSquare, BarChart2, DollarSign, Calendar, Clock,
  MessageSquare, ChevronRight, ShieldAlert, Award, FileText, Download, Send, CheckCircle2
} from 'lucide-react';
import api from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../components/ui/Toast';

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
  const [activeTab, setActiveTab] = useState<'attendance' | 'marks' | 'fees' | 'leave' | 'timetable'>('attendance');
  const [loading, setLoading] = useState(true);

  // Tab Data States
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [marksData, setMarksData] = useState<any[]>([]);
  const [feesData, setFeesData] = useState<any[]>([]);
  const [leaveData, setLeaveData] = useState<any[]>([]);
  const [timetableData, setTimetableData] = useState<any[]>([]);

  // Contact Mentor Modal
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [mentorMessage, setMentorMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  useEffect(() => {
    fetchLinkedChildren();
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

  const fetchTabContent = async (childId: string, tab: string) => {
    try {
      if (tab === 'attendance') {
        const res = await api.get(`/parent/child/${childId}/attendance`);
        if (res.data?.status === 'success') setAttendanceData(res.data.data);
      } else if (tab === 'marks') {
        const res = await api.get(`/parent/child/${childId}/marks`);
        if (res.data?.status === 'success') setMarksData(res.data.data);
      } else if (tab === 'fees') {
        const res = await api.get(`/parent/child/${childId}/fees`);
        if (res.data?.status === 'success') setFeesData(res.data.data);
      } else if (tab === 'leave') {
        const res = await api.get(`/parent/child/${childId}/leave-od`);
        if (res.data?.status === 'success') setLeaveData(res.data.data);
      } else if (tab === 'timetable') {
        const res = await api.get(`/parent/child/${childId}/timetable`);
        if (res.data?.status === 'success') setTimetableData(res.data.data);
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

  const currentChild = childrenList.find((c) => c.id === selectedChildId);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-card border rounded-2xl p-6 shadow-xs gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
            Parent Portal Workspace
          </span>
          <h1 className="text-2xl font-black tracking-tight mt-1">Welcome, {user?.firstName} {user?.lastName}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor attendance, marks, fees, and academic progress of your linked children.
          </p>
        </div>

        {/* Child Selector */}
        {childrenList.length > 0 && (
          <div className="flex items-center gap-3 bg-muted/30 border p-2 rounded-xl shrink-0">
            <User className="h-4 w-4 text-primary shrink-0" />
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Select Student</span>
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="bg-transparent text-xs font-black focus:outline-none cursor-pointer"
              >
                {childrenList.map((child) => (
                  <option key={child.id} value={child.id}>
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
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-extrabold">
                {currentChild.firstName[0]}{currentChild.lastName[0]}
              </div>
              <div>
                <h3 className="text-sm font-extrabold">{currentChild.firstName} {currentChild.lastName}</h3>
                <p className="text-[11px] text-muted-foreground font-mono">Reg: {currentChild.admissionNo}</p>
              </div>
            </div>

            <div className="space-y-0.5 border-r pr-4">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Department / Program</span>
              <p className="text-xs font-extrabold">{currentChild.departmentName || 'N/A'}</p>
              <p className="text-[11px] text-muted-foreground">{currentChild.programCode} • Sem {currentChild.semesterNumber} (Sec {currentChild.sectionName})</p>
            </div>

            <div className="space-y-0.5 border-r pr-4">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Assigned Mentor</span>
              <p className="text-xs font-extrabold text-primary">{currentChild.mentorName}</p>
              <p className="text-[10px] text-muted-foreground">{currentChild.mentorEmail || currentChild.mentorPhone || 'No contact info'}</p>
            </div>

            <div className="flex justify-start md:justify-end">
              <button
                onClick={() => setIsContactModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-extrabold rounded-xl shadow-xs hover:bg-primary/95 transition-all"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Contact Mentor</span>
              </button>
            </div>
          </div>

          {/* Workspace Tabs */}
          <div className="flex border-b gap-2 overflow-x-auto pb-1">
            {[
              { id: 'attendance', label: 'Attendance Record', icon: CheckSquare },
              { id: 'marks', label: 'Marks & Results', icon: BarChart2 },
              { id: 'fees', label: 'Fee Bills & Receipts', icon: DollarSign },
              { id: 'leave', label: 'Leave & OD History', icon: Calendar },
              { id: 'timetable', label: 'Class Timetable', icon: Clock },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

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
                <h3 className="text-sm font-extrabold">Recent Attendance Activity</h3>
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
              <h3 className="text-sm font-extrabold">Academic Internal & External Examination Marks</h3>
              {marksData.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4">No published exam mark records found for this student.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/30 border-b text-[10px] font-bold uppercase text-muted-foreground">
                      <tr>
                        <th className="p-3">Examination</th>
                        <th className="p-3">Subject</th>
                        <th className="p-3">Internal (40)</th>
                        <th className="p-3">External (60)</th>
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
                          <td className="p-3 font-mono font-bold text-primary">{m.totalMarks}</td>
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
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold">Semester Fee Bills & Payment History</h3>
              </div>
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
                          <span className="text-[10px] text-muted-foreground block">Amount Due</span>
                          <span className="text-sm font-black text-primary">₹{b.balanceDue.toLocaleString('en-IN')}</span>
                        </div>
                        {b.balanceDue > 0 && (
                          <button
                            onClick={() => toast.info('Online payment gateway simulation initialized.', 'Proceed to Pay')}
                            className="px-3.5 py-1.5 bg-primary text-primary-foreground text-xs font-extrabold rounded-xl shadow-xs hover:bg-primary/95"
                          >
                            Pay Online
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: LEAVE & OD */}
          {activeTab === 'leave' && (
            <div className="bg-card border rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold">Student Leave & On-Duty (OD) Applications</h3>
              {leaveData.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4">No leave or OD applications submitted.</p>
              ) : (
                <div className="space-y-2.5">
                  {leaveData.map((l) => (
                    <div key={l.id} className="p-3.5 border rounded-xl bg-muted/10 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{l.type === 'ON_DUTY' ? 'On-Duty (OD) Request' : 'Leave Request'} ({l.requestNumber})</span>
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
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

          {/* TAB 5: TIMETABLE */}
          {activeTab === 'timetable' && (
            <div className="bg-card border rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold">Weekly Class Schedule</h3>
              {timetableData.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4">No published timetable slots available.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {timetableData.map((t) => (
                    <div key={t.id} className="p-3 border rounded-xl bg-muted/10 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-primary">{t.dayOfWeek} • Period {t.slotIndex}</span>
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
                  placeholder="Enter your message regarding your child's attendance or academic progress..."
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
                  className="px-4 py-2 bg-primary text-primary-foreground text-xs font-extrabold rounded-xl hover:bg-primary/95 flex items-center gap-1.5"
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
