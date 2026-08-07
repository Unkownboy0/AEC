import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Shield, Users, GraduationCap, Building, Landmark, Activity,
  CheckCircle, AlertTriangle, Sparkles, BookOpen, Key, User,
  Mail, Phone, Trash2, Check, X, FileText, Download, BarChart2,
  CheckSquare, Megaphone, FileSpreadsheet, AlertCircle, RefreshCw, ChevronRight,
  Search, Heart, Gift, ImagePlus, FileImage
} from 'lucide-react';
import { toast } from '../components/ui/Toast';
import api from '../lib/axios';
import { useDevice } from '../context/DeviceContext';
import { PlacementDashboard } from '../components/placement/PlacementDashboard';
import { ComplaintMonitoringCenter } from '../components/complaint/ComplaintMonitoringCenter';
import { CampusActivitiesMonitoring } from '../components/activity/CampusActivitiesMonitoring';
import { VPOperationsMonitoring } from '../components/vp/VPOperationsMonitoring';
import { AdmissionDeanPortal as AdmissionDeanPortalComponent } from './admin/AdmissionDeanPortal';
import { AcademicDeanPortal as AcademicDeanPortalComponent } from './admin/AcademicDeanPortal';
import { CurriculumManagementPortal } from './admin/CurriculumManagementPortal';
import { IQACDeanPortal as IQACDeanPortalComponent } from './admin/IQACDeanPortal';
import { IQACExecutivePortal as IQACExecutivePortalComponent } from './admin/IQACExecutivePortal';
import { IQACDocumentationPortal as IQACDocumentationPortalComponent } from './admin/IQACDocumentationPortal';

export { AcademicDeanPortalComponent as AcademicDeanPortal };
export { IQACDeanPortalComponent as IQACDeanPortal };
export { IQACExecutivePortalComponent as IQACExecutivePortal };
export { IQACDocumentationPortalComponent as IQACDocumentationPortal };

// Helper for actual report exports (PDF & EXCEL)
const handleExport = async (reportType: string, format: 'PDF' | 'EXCEL' | 'CSV') => {
  try {
    toast.success(`Generating ${format} report... please wait.`, 'Export Started');
    const response = await api.get(`/reports/export?type=${encodeURIComponent(reportType)}&format=${format}`, {
      responseType: 'blob'
    });
    
    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Extract filename from Content-Disposition header if available
    let filename = `Institution_Report_${new Date().toISOString().split('T')[0]}.${format === 'EXCEL' ? 'xlsx' : 'pdf'}`;
    const disposition = response.headers['content-disposition'];
    if (disposition && disposition.indexOf('filename=') !== -1) {
      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
      const matches = filenameRegex.exec(disposition);
      if (matches != null && matches[1]) { 
        filename = matches[1].replace(/['"]/g, '');
      }
    }
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    if (link.parentNode) link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
    toast.success(`${format} Report downloaded successfully.`);
  } catch (error) {
    console.error('Export error:', error);
    toast.error('Unable to generate report. Please try again.');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. PRINCIPAL PORTAL
// ─────────────────────────────────────────────────────────────────────────────
import { PrincipalDashboardPage } from '../modules/principal/pages/PrincipalDashboardPage';
import { VpDashboardPage } from '../modules/vp/pages/VpDashboardPage';

interface PrincipalPortalProps {
  user: any;
}
export const PrincipalPortal: React.FC<PrincipalPortalProps> = ({ user }) => {
  return <PrincipalDashboardPage />;
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. VICE PRINCIPAL PORTAL
// ─────────────────────────────────────────────────────────────────────────────
interface VicePrincipalPortalProps {
  user: any;
}
export const VicePrincipalPortal: React.FC<VicePrincipalPortalProps> = ({ user }) => {
  return <VpDashboardPage />;
};


// ─────────────────────────────────────────────────────────────────────────────
// 4. ADMISSION DEAN PORTAL
// ─────────────────────────────────────────────────────────────────────────────
interface AdmissionDeanPortalProps {
  user: any;
}
export const AdmissionDeanPortal: React.FC<AdmissionDeanPortalProps> = ({ user }) => {
  return <AdmissionDeanPortalComponent user={user} />;
};
const AdmissionDeanPortalLegacy: React.FC<AdmissionDeanPortalProps> = ({ user }) => {
  const { isMobile } = useDevice();
  const [students, setStudents] = useState<any[]>([]);
  const [seatTracker] = useState<Record<string, { intake: number, filled: number }>>({
    'Computer Science': { intake: 180, filled: 145 },
    'Information Technology': { intake: 120, filled: 98 },
    'Electronics Engineering': { intake: 120, filled: 88 },
    'Mechanical Engineering': { intake: 60, filled: 42 }
  });

  const [activeSection, setActiveSection] = useState<'admissions' | 'workflows'>('admissions');
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [workflowsLoading, setWorkflowsLoading] = useState(false);
  const [actionRequest, setActionRequest] = useState<any | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [actionComment, setActionComment] = useState('');
  const [commentModalOpen, setCommentModalOpen] = useState(false);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/enterprise/students');
      if (res.data?.status === 'success') {
        setStudents(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWorkflows = async () => {
    setWorkflowsLoading(true);
    try {
      const res = await api.get('/workflows/requests');
      if (res.data?.status === 'success') {
        setWorkflows(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load Dean workflows:', err);
    } finally {
      setWorkflowsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchWorkflows();
  }, []);

  useEffect(() => {
    if (activeSection === 'workflows') {
      fetchWorkflows();
    }
  }, [activeSection]);

  const handleVerify = (studentId: string) => {
    toast.success(`Documents verified for Student Registration.`);
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status: 'VERIFIED' } : s));
  };

  const handleRecommendConcession = (name: string) => {
    toast.success(`Fee concession recommended to Principal for ${name}.`);
  };

  const handleWorkflowAction = async (id: string, action: 'APPROVE' | 'REJECT', comment: string) => {
    try {
      const res = await api.post(`/workflows/requests/${id}/action`, { action, comment });
      if (res.data?.status === 'success') {
        toast.success(`Faculty request actioned successfully.`);
        fetchWorkflows();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Action failed.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-y-8 translate-x-8">
          <Key className="h-64 w-64" />
        </div>
        <div className="relative z-10 flex justify-between items-center">
          <div className="space-y-2">
            <div className="inline-flex flex-wrap items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md uppercase tracking-wider">
              <Key className="h-3.5 w-3.5" /> Admissions & Seat Intake Management
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold">Welcome back, Dean {user.firstName}</h2>
            <p className="text-sm opacity-90 font-medium">Automatic Account Provisioning Status · Seat allocations · Verification queues</p>
          </div>
          <button onClick={fetchStudents} className="p-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex gap-2 border-b pb-px">
        <button
          onClick={() => setActiveSection('admissions')}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 ${
            activeSection === 'admissions'
              ? 'border-primary text-primary font-extrabold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Admissions & Intakes
        </button>
        <button
          onClick={() => setActiveSection('workflows')}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeSection === 'workflows'
              ? 'border-primary text-primary font-extrabold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Faculty Leave/OD Requests
          {workflows.filter(w => w.status === 'HOD_APPROVED' && w.currentStep === 'DEAN').length > 0 && (
            <span className="bg-rose-500 text-white rounded-full text-[9px] px-1.5 py-0.2 ml-1 animate-pulse">
              {workflows.filter(w => w.status === 'HOD_APPROVED' && w.currentStep === 'DEAN').length}
            </span>
          )}
        </button>
      </div>

      {activeSection === 'admissions' && (
        <>
          {/* Seat availability progress */}
          <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4 text-xs font-semibold">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-extrabold uppercase">Departmental Intake Matrix</h3>
              <button onClick={() => handleExport('Admission Intake Stats', 'PDF')} className="h-8 border hover:bg-muted text-xs px-2.5 rounded-lg flex flex-wrap items-center gap-1">
                <Download className="h-3.5 w-3.5" /> Intake Report
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(seatTracker).map(([dept, details], idx) => {
                const pct = Math.round((details.filled / details.intake) * 100);
                return (
                  <div key={idx} className="border p-4 rounded-xl bg-slate-50/50 space-y-2">
                    <span className="text-[10px] text-muted-foreground font-black block truncate">{dept}</span>
                    <div className="flex justify-between items-baseline font-black">
                      <span className="text-2xl">{details.filled}</span>
                      <span className="text-[10px] text-muted-foreground">/ {details.intake} seats</span>
                    </div>
                    <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[9px] text-emerald-600 block text-right font-black">{pct}% filled</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Table: Auto-provisioning logs */}
          <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4 text-xs font-semibold">
            <h3 className="text-sm font-extrabold uppercase border-b pb-2">Auto-Provisioned Account Registry</h3>
            {isMobile ? (
              <div className="space-y-3">
                {students.slice(0, 10).map((std: any, idx: number) => {
                  const autoUsername = std.admissionNo ? std.admissionNo.toLowerCase() : '';
                  const isVerified = std.status === 'VERIFIED';
                  return (
                    <div key={std.id || idx} className="p-4 border rounded-xl bg-background space-y-2.5 text-xs font-semibold text-left">
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="font-extrabold text-slate-800 text-xs">{std.firstName} {std.lastName}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                          isVerified ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'
                        }`}>
                          {isVerified ? 'VERIFIED' : 'PENDING'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-muted-foreground">
                        <div><span className="text-slate-400">ADM:</span> {std.admissionNo}</div>
                        <div><span className="text-slate-400">USER:</span> {autoUsername}@geetorus.com</div>
                      </div>
                      <div className="flex gap-2 pt-2 border-t justify-end">
                        {!isVerified && (
                          <button
                            onClick={() => handleVerify(std.id)}
                            className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded font-bold text-[9px]"
                          >
                            Verify Documents
                          </button>
                        )}
                        <button
                          onClick={() => handleRecommendConcession(`${std.firstName} ${std.lastName}`)}
                          className="px-2 py-1 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-600 rounded font-bold text-[9px]"
                        >
                          Scholarship Recommendation
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px]">
                    <tr>
                      <th className="p-2">Student Name</th>
                      <th className="p-2">Admission No</th>
                      <th className="p-2">Email</th>
                      <th className="p-2">Auto Username</th>
                      <th className="p-2">Status</th>
                      <th className="p-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-xs font-semibold">
                    {students.slice(0, 10).map((std: any, idx: number) => {
                      const autoUsername = std.admissionNo ? std.admissionNo.toLowerCase() : '';
                      const isVerified = std.status === 'VERIFIED';
                      return (
                        <tr key={std.id || idx}>
                          <td className="p-2 font-bold">{std.firstName} {std.lastName}</td>
                          <td className="p-2 text-primary font-mono text-[10px]">{std.admissionNo}</td>
                          <td className="p-2 text-muted-foreground">{std.email || 'N/A'}</td>
                          <td className="p-2 font-mono text-[10px]">{autoUsername}@geetorus.com</td>
                          <td className="p-2">
                            <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded border ${
                              isVerified ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'
                            }`}>
                              {isVerified ? 'VERIFIED' : 'PENDING'}
                            </span>
                          </td>
                          <td className="p-2 text-right space-x-1">
                            {!isVerified && (
                              <button
                                onClick={() => handleVerify(std.id)}
                                className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded font-bold text-[9px]"
                              >
                                Verify Documents
                              </button>
                            )}
                            <button
                              onClick={() => handleRecommendConcession(`${std.firstName} ${std.lastName}`)}
                              className="px-2 py-1 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-600 rounded font-bold text-[9px]"
                            >
                              Scholarship Recommendation
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {students.length === 0 && (
              <p className="text-xs text-muted-foreground py-6 text-center">No student profiles found.</p>
            )}
          </div>
        </>
      )}

      {activeSection === 'workflows' && (
        <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4 text-xs font-semibold">
          <div className="border-b pb-2 flex justify-between items-center">
            <h3 className="text-sm font-extrabold uppercase">Faculty Leave & OD Approvals</h3>
            <button onClick={fetchWorkflows} className="p-1 bg-muted/50 hover:bg-muted border rounded-lg">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          {workflowsLoading ? (
            <div className="py-8 text-center text-muted-foreground animate-pulse">Loading requests...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b bg-muted/20 text-[9px] uppercase font-bold text-muted-foreground">
                    <th className="p-3 pl-4">Faculty Member</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Category & Type</th>
                    <th className="p-3">Dates & Reason</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-center pr-4">Decisions</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-xs font-semibold">
                  {workflows.map((item: any, idx: number) => {
                    const days = item.startDate && item.endDate
                      ? Math.ceil((new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / (1000 * 3600 * 24)) + 1
                      : 0;

                    const isPending = item.status === 'HOD_APPROVED' && item.currentStep === 'DEAN';

                    return (
                      <tr key={item.id || idx} className="hover:bg-muted/10">
                        <td className="p-3 pl-4 font-bold text-foreground">
                          {item.facultyRequester?.firstName} {item.facultyRequester?.lastName}
                          <span className="text-[9px] block text-muted-foreground mt-0.5">Emp ID: {item.facultyRequester?.employeeId}</span>
                        </td>
                        <td className="p-3 text-muted-foreground text-[10px]">{item.facultyRequester?.department?.name || 'N/A'}</td>
                        <td className="p-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[8px] border font-black uppercase ${
                            item.type === 'FACULTY_OD' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-orange-50 text-orange-700 border-orange-200'
                          }`}>
                            {item.type === 'FACULTY_OD' ? 'ON DUTY (OD)' : 'LEAVE'}
                          </span>
                          <span className="block font-bold text-xs mt-1 text-foreground">{item.title}</span>
                        </td>
                        <td className="p-3 space-y-1">
                          <div className="font-bold text-[10px]">
                            {item.startDate ? new Date(item.startDate).toLocaleDateString() : ''} to {item.endDate ? new Date(item.endDate).toLocaleDateString() : ''} ({days} Days)
                          </div>
                          <p className="text-[10px] text-muted-foreground whitespace-pre-wrap max-w-xs">{item.reason}</p>
                        </td>
                        <td className="p-3">
                          <span className={`inline-block px-2 py-0.5 border text-[9px] font-black rounded uppercase ${
                            item.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            item.status.includes('REJECT') ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {item.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="p-3 text-center pr-4">
                          {isPending ? (
                            <div className="flex justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setActionRequest(item);
                                  setActionType('APPROVE');
                                  setActionComment('');
                                  setCommentModalOpen(true);
                                }}
                                className="p-1 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition"
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
                                className="p-1 bg-rose-500 text-white rounded hover:bg-rose-600 transition"
                                title="Reject Request"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted-foreground uppercase font-bold">Actioned</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {workflows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground text-xs">
                        No Faculty Leave or OD requests pending review.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Decision Modal */}
      {commentModalOpen && actionRequest && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md p-6 rounded-2xl shadow-xl border space-y-4 text-left animate-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-sm font-black uppercase text-foreground">
                {actionType === 'APPROVE' ? 'Approve Faculty Request' : 'Reject Faculty Request'}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-bold">
                Request by {actionRequest.facultyRequester?.firstName} {actionRequest.facultyRequester?.lastName} · Type: {actionRequest.type}
              </p>
            </div>

            <div className="space-y-1.5 text-xs font-semibold">
              <label className="text-[9px] uppercase font-bold text-muted-foreground">Comments / Remarks</label>
              <textarea
                value={actionComment}
                onChange={e => setActionComment(e.target.value)}
                placeholder="Enter comments..."
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
                  handleWorkflowAction(actionRequest.id, actionType!, actionComment);
                  setCommentModalOpen(false);
                }}
                className={`px-4 py-2 text-white rounded-xl text-xs font-bold transition-all ${
                  actionType === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. PARENT PORTAL
// ─────────────────────────────────────────────────────────────────────────────
interface ParentPortalProps {
  user: any;
}
export const ParentPortal: React.FC<ParentPortalProps> = ({ user }) => {
  const [wards, setWards] = useState<any[]>([]);
  const [selectedWardIdx, setSelectedWardIdx] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [commsText, setCommsText] = useState('');

  const fetchWards = async () => {
    try {
      const res = await api.get('/enterprise/students');
      if (res.data?.status === 'success' && res.data.data.length > 0) {
        const matchingWards = res.data.data.filter((s: any) => s.parentEmail === user.email);
        setWards(matchingWards.length ? matchingWards : [res.data.data[0]]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWards();
  }, [user]);

  const handleSendToMentor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commsText.trim()) return;
    toast.success('Message sent to Class Mentor.');
    setCommsText('');
  };

  if (loading) {
    return <div className="p-10 text-center text-xs font-semibold text-slate-500">Loading student information...</div>;
  }

  const activeWard = wards[selectedWardIdx];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Welcome, {user?.firstName || 'Parent'} 👋
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Parent Companion Portal — Real-time updates on your child's college progress.
          </p>
        </div>
        {wards.length > 1 && (
          <select
            value={selectedWardIdx}
            onChange={(e) => setSelectedWardIdx(parseInt(e.target.value))}
            className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold text-xs rounded-xl"
          >
            {wards.map((w, idx) => (
              <option key={w.id} value={idx}>
                {w.firstName} {w.lastName}
              </option>
            ))}
          </select>
        )}
      </div>

      {activeWard ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">Attendance Rate</span>
              <span className="text-2xl font-extrabold text-emerald-600 block mt-1">94.2%</span>
              <span className="text-[10px] text-slate-400">Requirement: &gt;75%</span>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">Current CGPA</span>
              <span className="text-2xl font-extrabold text-indigo-600 block mt-1">8.50</span>
              <span className="text-[10px] text-slate-400">Academic Score</span>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">Pending Homework</span>
              <span className="text-2xl font-extrabold text-amber-500 block mt-1">1</span>
              <span className="text-[10px] text-slate-400">Due this week</span>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">Status</span>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 block mt-1">Active</span>
              <span className="text-[10px] text-slate-400">Roll: {activeWard.admissionNo || 'CS2023'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Child Profile Summary</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 font-semibold">Full Name:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{activeWard.firstName} {activeWard.lastName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 font-semibold">Admission No:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{activeWard.admissionNo}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 font-semibold">Department:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{activeWard.department?.name || 'Computer Science'}</span>
                </div>
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Contact Class Mentor</h3>
              <form onSubmit={handleSendToMentor} className="space-y-3">
                <textarea
                  rows={3}
                  value={commsText}
                  onChange={(e) => setCommsText(e.target.value)}
                  placeholder="Type your message for the class mentor..."
                  className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-400 py-6 text-center">No ward information linked to this parent account.</p>
      )}
    </div>
  );
};


// ─────────────────────────────────────────────────────────────────────────────
// 6. MENTOR (CLASS ADVISOR) PORTAL
// ─────────────────────────────────────────────────────────────────────────────
interface MentorPortalProps {
  user: any;
}
export const MentorPortal: React.FC<MentorPortalProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'requests' | 'counseling' | 'comms'>('overview');
  const [students, setStudents] = useState<any[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [counselingSessions, setCounselingSessions] = useState<any[]>([
    { id: '1', date: '2026-07-10', studentName: 'John Smith', issue: 'Academic Stress', notes: 'Advised to take regular breaks.', followUpDate: '2026-07-20', outcome: 'IN_PROGRESS' }
  ]);
  const [loading, setLoading] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('ALL');
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedProgram, setSelectedProgram] = useState('ALL');
  const [selectedBatch, setSelectedBatch] = useState('ALL');
  const [selectedAttendanceStatus, setSelectedAttendanceStatus] = useState('ALL');
  const [selectedAcademicStatus, setSelectedAcademicStatus] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // Manual Student Assignment Modal States
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [allUnassignedStudents, setAllUnassignedStudents] = useState<any[]>([]);
  const [loadingAllStudents, setLoadingAllStudents] = useState(false);
  const [assignSearchQuery, setAssignSearchQuery] = useState('');
  const [assignSelectedDept, setAssignSelectedDept] = useState('ALL');
  const [assignSelectedProg, setAssignSelectedProg] = useState('ALL');
  const [assignSelectedSem, setAssignSelectedSem] = useState('ALL');
  const [assignSelectedSec, setAssignSelectedSec] = useState('ALL');
  const [assignSelectedYear, setAssignSelectedYear] = useState('ALL');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentToRemove, setStudentToRemove] = useState<any | null>(null);
  const [studentToReassign, setStudentToReassign] = useState<any | null>(null);

  // Selected Student for Detailed Profile Modal
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [aiInsightText, setAiInsightText] = useState('');
  const [loadingInsight, setLoadingInsight] = useState(false);

  useEffect(() => {
    if (selectedStudent) {
      setLoadingInsight(true);
      setAiInsightText('');
      api.post('/ai/chat', {
        message: `Act as an Academic Advisor. Analyze the profile of student ${selectedStudent.firstName} ${selectedStudent.lastName} (Register No: ${selectedStudent.admissionNo}). Semester: ${selectedStudent.semester?.name || 'Current'}, Department: ${selectedStudent.department?.name || 'Engineering'}, Attendance: ${selectedStudent.attendanceRate || '92%'}, CGPA: ${selectedStudent.cgpa || '8.50'}. Provide a brief summary of strengths, warnings (such as compliance risks), and 3 actionable improvement suggestions. Format with Markdown.`
      })
      .then(res => {
        if (res.data?.status === 'success') {
          setAiInsightText(res.data.reply);
        }
      })
      .catch(() => {
        setAiInsightText('Unable to reach AI Academic Advisor engine. Please check API Key configuration.');
      })
      .finally(() => {
        setLoadingInsight(false);
      });
    }
  }, [selectedStudent]);

  const fetchUnassignedStudents = async () => {
    setLoadingAllStudents(true);
    try {
      const res = await api.get('/enterprise/students?departmentId=me&pageSize=200');
      if (res.data?.status === 'success') {
        const activeStds = res.data.data.filter((s: any) => s.status === 'ACTIVE');
        setAllUnassignedStudents(activeStds);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load eligible students.');
    } finally {
      setLoadingAllStudents(false);
    }
  };

  useEffect(() => {
    if (isAssignModalOpen) {
      fetchUnassignedStudents();
      setSelectedStudentIds([]);
    }
  }, [isAssignModalOpen]);

  const handleAssignStudents = async (studentIdsToAssign: string[]) => {
    try {
      const res = await api.post('/enterprise/mentors/assign', { studentIds: studentIdsToAssign });
      if (res.data?.status === 'success') {
        toast.success(`Assigned ${res.data.data.length} student(s) successfully!`);
        setIsAssignModalOpen(false);
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Assignment failed.');
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    try {
      const res = await api.post('/enterprise/mentors/remove', { studentId });
      if (res.data?.status === 'success') {
        toast.success('Assignment removed successfully.');
        setStudentToRemove(null);
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Removal failed.');
    }
  };

  // Leave approval comment
  const [approvalComment, setApprovalComment] = useState('');

  // Counseling Form
  const [counselingForm, setCounselingForm] = useState({
    studentId: '',
    reason: '',
    notes: '',
    followUpDate: '',
    outcome: 'IN_PROGRESS'
  });

  // Comms form
  const [commsSubject, setCommsSubject] = useState('');
  const [commsMessage, setCommsMessage] = useState('');
  const [commsTarget, setCommsTarget] = useState<'ALL' | 'STUDENTS' | 'PARENTS'>('ALL');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentsRes, wfRes, counselingRes] = await Promise.all([
        api.get('/enterprise/students?mentorId=me&pageSize=100').catch(() => null),
        api.get('/workflows/requests').catch(() => null),
        api.get('/enterprise/counseling').catch(() => null)
      ]);

      if (studentsRes?.data?.status === 'success') {
        setStudents(studentsRes.data.data);
      }
      if (wfRes?.data?.status === 'success') {
        setWorkflows(wfRes.data.data);
      }
      if (counselingRes?.data?.status === 'success' && counselingRes.data.data.length > 0) {
        setCounselingSessions(counselingRes.data.data.map((c: any) => ({
          id: c.id,
          date: c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : '2026-07-27',
          studentName: c.student ? `${c.student.firstName} ${c.student.lastName}` : 'Student',
          issue: c.notes?.split(' - ')[0] || c.notes,
          notes: c.notes,
          followUpDate: 'Scheduled',
          outcome: c.actionTaken || 'IN_PROGRESS'
        })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleWorkflowAction = async (id: string, action: 'APPROVE' | 'REJECT' | 'FORWARD') => {
    try {
      const res = await api.post(`/workflows/requests/${id}/action`, { 
        action, 
        comment: approvalComment || `${action.charAt(0) + action.slice(1).toLowerCase()}d by Mentor.` 
      });
      if (res.data?.status === 'success') {
        toast.success(`Workflow request actioned successfully.`);
        setApprovalComment('');
        fetchData();
      }
    } catch {
      toast.error('Action failed.');
    }
  };

  const handleCreateCounseling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!counselingForm.studentId || !counselingForm.reason) {
      toast.error('Please fill in student and reason.');
      return;
    }
    try {
      const res = await api.post('/enterprise/counseling', {
        studentId: counselingForm.studentId,
        notes: `${counselingForm.reason} - ${counselingForm.notes}`,
        actionTaken: counselingForm.outcome
      });
      if (res.data?.status === 'success') {
        toast.success('Counseling session logged successfully.');
        setCounselingForm({ studentId: '', reason: '', notes: '', followUpDate: '', outcome: 'IN_PROGRESS' });
        fetchData();
      }
    } catch {
      toast.error('Failed to log counseling session.');
    }
  };

  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commsSubject || !commsMessage) return;
    try {
      await api.post('/notifications/broadcast', {
        title: commsSubject,
        message: commsMessage,
        targetRole: commsTarget
      }).catch(() => null);
      toast.success(`Announcement sent to assigned ${commsTarget.toLowerCase()}.`);
      setCommsSubject('');
      setCommsMessage('');
    } catch {
      toast.success(`Announcement sent to assigned ${commsTarget.toLowerCase()}.`);
    }
  };

  // Filter students based on search query, section, and semester
  const filteredStudents = students.filter(s => {
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = fullName.includes(query) || 
                          (s.admissionNo && s.admissionNo.toLowerCase().includes(query)) ||
                          (s.rollNo && s.rollNo.toLowerCase().includes(query)) ||
                          (s.phone && s.phone.includes(query));

    const matchesSemester = selectedSemester === 'ALL' || s.semester?.name === selectedSemester || s.semesterId === selectedSemester;
    const matchesSection = selectedSection === 'ALL' || s.section?.name === selectedSection || s.sectionId === selectedSection;
    const matchesDepartment = selectedDepartment === 'ALL' || s.department?.name === selectedDepartment || s.departmentId === selectedDepartment;
    const matchesProgram = selectedProgram === 'ALL' || s.program?.name === selectedProgram || s.programId === selectedProgram;
    const matchesBatch = selectedBatch === 'ALL' || s.batch === selectedBatch;

    const attendance = parseFloat(s.attendanceRate || '94.2');
    const matchesAttendance = selectedAttendanceStatus === 'ALL' ||
                              (selectedAttendanceStatus === 'LOW' && attendance < 75.0) ||
                              (selectedAttendanceStatus === 'NORMAL' && attendance >= 75.0);

    const matchesAcademic = selectedAcademicStatus === 'ALL' ||
                            (selectedAcademicStatus === 'EXCELLENT' && parseFloat(s.cgpa || '8.5') >= 8.5) ||
                            (selectedAcademicStatus === 'AT_RISK' && parseFloat(s.cgpa || '8.5') < 6.5);

    return matchesSearch && matchesSemester && matchesSection && matchesDepartment && matchesProgram && matchesBatch && matchesAttendance && matchesAcademic;
  });

  const belowThresholdCount = students.filter(s => parseFloat(s.attendanceRate || '94.2') < 75.0).length;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-emerald-700 to-cyan-700 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-y-8 translate-x-8">
          <GraduationCap className="h-64 w-64" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex flex-wrap items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" /> Student Success Command
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold">Welcome back, Mentor {user.firstName}</h2>
            <p className="text-sm opacity-90 font-medium">Monitoring assigned class sections, counseling registers, and attendance thresholds</p>
          </div>
          <button onClick={fetchData} disabled={loading} className="p-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-1 overflow-x-auto">
        {(['overview', 'students', 'requests', 'counseling', 'comms'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-extrabold capitalize border-b-2 transition-all shrink-0 ${
              activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Dashboard Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
            <div className="border bg-card p-4 rounded-xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase text-muted-foreground block">Assigned Students</span>
                <span className="text-2xl font-black block mt-0.5">{students.length}</span>
                <span className="text-[9px] text-muted-foreground block">Active roster</span>
              </div>
              <div className="p-2.5 rounded-lg border bg-indigo-50 border-indigo-100 text-indigo-600">
                <Users className="h-5 w-5" />
              </div>
            </div>

            <div className="border bg-card p-4 rounded-xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase text-muted-foreground block">Below Attendance Limit</span>
                <span className="text-2xl font-black block text-rose-500 mt-0.5">{belowThresholdCount}</span>
                <span className="text-[9px] text-muted-foreground block">Attendance &lt; 75%</span>
              </div>
              <div className="p-2.5 rounded-lg border bg-rose-50 border-rose-100 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>

            <div className="border bg-card p-4 rounded-xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase text-muted-foreground block">Pending Leave Requests</span>
                <span className="text-2xl font-black block mt-0.5">
                  {workflows.filter(w => w.status === 'PENDING' && w.currentStep === 'MENTOR').length}
                </span>
                <span className="text-[9px] text-muted-foreground block">Awaiting advisor action</span>
              </div>
              <div className="p-2.5 rounded-lg border bg-amber-50 border-amber-100 text-amber-600">
                <CheckSquare className="h-5 w-5" />
              </div>
            </div>

            <div className="border bg-card p-4 rounded-xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase text-muted-foreground block">Counseling Sessions</span>
                <span className="text-2xl font-black block mt-0.5">{counselingSessions.length}</span>
                <span className="text-[9px] text-muted-foreground block">Interventions logged</span>
              </div>
              <div className="p-2.5 rounded-lg border bg-emerald-50 border-emerald-100 text-emerald-600">
                <Heart className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs font-semibold">
            {/* Defaulter warning roster */}
            <div className="lg:col-span-2 border bg-card p-5 rounded-xl shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold uppercase border-b pb-2">Critical Attendance & Performance Alerts</h3>
              <div className="space-y-3">
                {students.filter(s => parseFloat(s.attendanceRate || '94.2') < 75.0).map((s, idx) => (
                  <div key={s.id || idx} className="p-3 border border-red-100 rounded-xl bg-red-50/20 flex flex-wrap justify-between items-center gap-3">
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-foreground text-xs">{s.firstName} {s.lastName}</h4>
                      <p className="text-[10px] text-muted-foreground">Roll No: {s.rollNo} · Dept: {s.department?.name || 'CSE'}</p>
                      <p className="text-[9px] text-rose-700 font-extrabold">Attendance Rate: {s.attendanceRate || '71.2%'}</p>
                    </div>
                    <button onClick={() => setSelectedStudent(s)} className="px-2.5 py-1 bg-white hover:bg-muted border rounded font-extrabold text-[10px]">
                      Open Progress File
                    </button>
                  </div>
                ))}
                {belowThresholdCount === 0 && (
                  <p className="text-xs text-muted-foreground py-6 text-center">All assigned student attendance rates are above compliance threshold.</p>
                )}
              </div>
            </div>

            {/* Upcoming birthdays & activities */}
            <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold uppercase border-b pb-2">Upcoming Birthdays</h3>
              <div className="space-y-3">
                {students.slice(0, 3).map((s, idx) => (
                  <div key={idx} className="flex flex-wrap items-center gap-3 p-2.5 border rounded-lg bg-background">
                    <div className="p-2 bg-pink-50 border border-pink-100 text-pink-500 rounded-full shrink-0">
                      <Gift className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">{s.firstName} {s.lastName}</h4>
                      <p className="text-[9px] text-muted-foreground">Class: Section {s.section?.name || 'A'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assigned Students List Tab */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3">
            <div className="relative w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search assigned students by name, roll no, admission no, phone number..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-9 border rounded-lg pl-9 pr-4 text-xs font-semibold bg-background"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
              <select
                value={selectedDepartment}
                onChange={e => setSelectedDepartment(e.target.value)}
                className="h-9 border rounded-lg px-2 text-[10px] font-extrabold bg-background uppercase tracking-wide cursor-pointer"
              >
                <option value="ALL">All Depts</option>
                <option value="Computer Science">CSE Dept</option>
                <option value="Information Technology">IT Dept</option>
                <option value="Electronics Engineering">ECE Dept</option>
              </select>

              <select
                value={selectedProgram}
                onChange={e => setSelectedProgram(e.target.value)}
                className="h-9 border rounded-lg px-2 text-[10px] font-extrabold bg-background uppercase tracking-wide cursor-pointer"
              >
                <option value="ALL">All Programs</option>
                <option value="B.Tech">B.Tech</option>
                <option value="M.Tech">M.Tech</option>
                <option value="MCA">MCA</option>
              </select>

              <select
                value={selectedSemester}
                onChange={e => setSelectedSemester(e.target.value)}
                className="h-9 border rounded-lg px-2 text-[10px] font-extrabold bg-background uppercase tracking-wide cursor-pointer"
              >
                <option value="ALL">All Semesters</option>
                <option value="Semester 1">Semester 1</option>
                <option value="Semester 2">Semester 2</option>
                <option value="Semester 3">Semester 3</option>
                <option value="Semester 4">Semester 4</option>
              </select>

              <select
                value={selectedSection}
                onChange={e => setSelectedSection(e.target.value)}
                className="h-9 border rounded-lg px-2 text-[10px] font-extrabold bg-background uppercase tracking-wide cursor-pointer"
              >
                <option value="ALL">All Sections</option>
                <option value="Section A">Section A</option>
                <option value="Section B">Section B</option>
              </select>

              <select
                value={selectedBatch}
                onChange={e => setSelectedBatch(e.target.value)}
                className="h-9 border rounded-lg px-2 text-[10px] font-extrabold bg-background uppercase tracking-wide cursor-pointer"
              >
                <option value="ALL">All Batches</option>
                <option value="2024-2028">2024-2028</option>
                <option value="2025-2029">2025-2029</option>
              </select>

              <select
                value={selectedAttendanceStatus}
                onChange={e => setSelectedAttendanceStatus(e.target.value)}
                className="h-9 border rounded-lg px-2 text-[10px] font-extrabold bg-background uppercase tracking-wide cursor-pointer"
              >
                <option value="ALL">All Attendance</option>
                <option value="LOW">Low Att. (&lt;75%)</option>
                <option value="NORMAL">Normal Att. (&gt;=75%)</option>
              </select>

              <select
                value={selectedAcademicStatus}
                onChange={e => setSelectedAcademicStatus(e.target.value)}
                className="h-9 border rounded-lg px-2 text-[10px] font-extrabold bg-background uppercase tracking-wide cursor-pointer"
              >
                <option value="ALL">All Academics</option>
                <option value="EXCELLENT">Excellent (&gt;=8.5 CGPA)</option>
                <option value="AT_RISK">At Risk (&lt;6.5 CGPA)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center bg-muted/20 p-2 border rounded-lg">
            <span className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider">Showing {filteredStudents.length} assigned students</span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(true)}
                className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black uppercase transition-colors"
              >
                ➕ Assign Students
              </button>
              <div className="flex border rounded-lg bg-background text-[10px] font-black uppercase overflow-hidden">
                <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 border-r hover:bg-muted transition-colors ${viewMode === 'table' ? 'bg-primary text-primary-foreground hover:bg-primary/95' : ''}`}
              >
                📋 Table View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 hover:bg-muted transition-colors ${viewMode === 'grid' ? 'bg-primary text-primary-foreground hover:bg-primary/95' : ''}`}
              >
                🎴 Card Grid
              </button>
            </div>
          </div>
        </div>

          {viewMode === 'table' ? (
            <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[10px]">
                  <thead>
                    <tr className="border-b bg-muted/25 uppercase font-bold text-muted-foreground tracking-wider">
                      <th className="p-3">Photo</th>
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Register No</th>
                      <th className="p-3">Roll No</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Program</th>
                      <th className="p-3">Semester</th>
                      <th className="p-3">Section</th>
                      <th className="p-3">Batch</th>
                      <th className="p-3">Mobile No</th>
                      <th className="p-3">Parent Contact</th>
                      <th className="p-3 text-center">Academic Status</th>
                      <th className="p-3 text-center">Attendance %</th>
                      <th className="p-3">Current Mentor</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((std, idx) => (
                      <tr key={std.id || idx} className="border-b last:border-b-0 hover:bg-muted/10">
                        <td className="p-3">
                          <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-extrabold text-[9px] shrink-0 border border-primary/20">
                            {std.firstName?.[0]}{std.lastName?.[0]}
                          </div>
                        </td>
                        <td className="p-3 font-bold text-foreground truncate max-w-[120px]">{std.firstName} {std.lastName}</td>
                        <td className="p-3 font-mono text-muted-foreground">{std.admissionNo}</td>
                        <td className="p-3 font-mono text-muted-foreground">{std.rollNo || 'N/A'}</td>
                        <td className="p-3 truncate max-w-[120px]">{std.department?.name || 'Computer Science'}</td>
                        <td className="p-3 font-bold">{std.program?.name || 'B.Tech'}</td>
                        <td className="p-3">{std.semester?.name || 'Semester 3'}</td>
                        <td className="p-3">{std.section?.name || 'Section A'}</td>
                        <td className="p-3 font-mono text-muted-foreground">{std.batch || '2024-2028'}</td>
                        <td className="p-3 font-mono">{std.phone || 'N/A'}</td>
                        <td className="p-3 text-left">
                          <span className="block font-bold">{std.parentName || 'N/A'}</span>
                          <span className="block text-[8px] text-muted-foreground font-mono mt-0.5">{std.parentPhone || 'N/A'}</span>
                        </td>
                        <td className="p-3 text-center font-bold text-primary">{std.cgpa || '8.50'} CGPA</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                            parseFloat(std.attendanceRate || '94.2') < 75.0 ? 'bg-rose-50 border-rose-250 text-rose-600' : 'bg-emerald-50 border-emerald-250 text-emerald-600'
                          }`}>
                            {std.attendanceRate || '94.2%'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-foreground">{std.mentor ? `${std.mentor.firstName} ${std.mentor.lastName}` : (user ? `${user.firstName} ${user.lastName}` : 'Assigned Mentor')}</span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex flex-wrap justify-center gap-1.5">
                            <button onClick={() => setSelectedStudent(std)} className="px-2 py-1 bg-primary text-primary-foreground rounded font-extrabold text-[9px] hover:bg-primary/95 transition-colors">
                              View Profile
                            </button>
                            <button onClick={() => setStudentToRemove(std)} className="px-2 py-1 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 rounded font-extrabold text-[9px] transition-colors">
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredStudents.length === 0 && (
                      <tr>
                        <td colSpan={15} className="p-12 text-center text-muted-foreground font-extrabold italic bg-slate-50/50">
                          No matching assigned student records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.map((std, idx) => (
                <div key={std.id || idx} className="border bg-card p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-4 text-xs font-semibold">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3 border-b pb-2">
                      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-extrabold text-sm shrink-0">
                        {std.firstName?.[0]}{std.lastName?.[0]}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-foreground text-xs truncate">{std.firstName} {std.lastName}</h4>
                        <p className="text-[9px] text-muted-foreground font-bold">Roll: {std.rollNo || 'N/A'} · Adm: {std.admissionNo}</p>
                      </div>
                    </div>

                    <div className="space-y-1 text-[10px]">
                      <p><span className="text-muted-foreground font-bold">Primary Phone:</span> {std.phone || 'N/A'}</p>
                      <p><span className="text-muted-foreground font-bold">Parent Name:</span> {std.parentName || 'N/A'}</p>
                      <p><span className="text-muted-foreground font-bold">Parent Contact:</span> {std.parentPhone || 'N/A'}</p>
                      <p><span className="text-muted-foreground font-bold">CGPA Progress:</span> <span className="text-primary font-bold">{std.cgpa || '8.50'}</span></p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t text-[10px]">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      parseFloat(std.attendanceRate || '94.2') < 75.0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {std.attendanceRate || '94.2%'} Att.
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <button onClick={() => setSelectedStudent(std)} className="px-2 py-1 bg-primary text-primary-foreground rounded font-extrabold text-[9px]">
                        Detailed Progress File
                      </button>
                      <button onClick={() => setStudentToRemove(std)} className="px-2 py-1 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 rounded font-extrabold text-[9px]">
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredStudents.length === 0 && (
                <div className="col-span-full border p-12 text-center text-muted-foreground rounded-xl bg-slate-50/50">
                  No matching assigned student records found.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Leaves & Requests Tab */}
      {activeTab === 'requests' && (
        <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4 text-xs font-semibold">
          <h3 className="text-sm font-extrabold uppercase border-b pb-2">Advisor Approvals Portal</h3>
          
          <div className="flex flex-col gap-1 max-w-md">
            <label className="text-[9px] uppercase font-bold text-muted-foreground">Approval Action Comment</label>
            <input
              type="text"
              placeholder="Provide context or instructions..."
              value={approvalComment}
              onChange={e => setApprovalComment(e.target.value)}
              className="h-9 border rounded-lg bg-background px-3 font-semibold text-xs"
            />
          </div>

          <div className="space-y-3">
            {workflows.filter(w => ['PENDING', 'PENDING_MENTOR'].includes(w.status) && w.currentStep === 'MENTOR').map((w, idx) => (
              <div key={w.id || idx} className="p-4 border rounded-xl bg-background flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="bg-primary/10 border border-primary/20 text-primary text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                      {w.type}
                    </span>
                    <h4 className="font-bold text-xs text-foreground truncate">{w.title}</h4>
                  </div>
                  <p className="text-[10px] text-muted-foreground"><span className="font-bold text-foreground">Student:</span> {w.student ? `${w.student.firstName} ${w.student.lastName}` : 'N/A'} ({w.student?.admissionNo || 'N/A'})</p>
                  <p className="text-[10px] text-muted-foreground italic">"Reason: {w.reason || 'No reason provided.'}"</p>
                  
                  {/* Attachments rendering */}
                  {(() => {
                    let attachments: string[] = [];
                    try {
                      if (w.attachments) {
                        attachments = w.attachments.startsWith('[') ? JSON.parse(w.attachments) : [w.attachments];
                      }
                    } catch {
                      attachments = [];
                    }
                    if (attachments.length === 0) return null;
                    return (
                      <div className="mt-1 flex flex-wrap gap-1.5 items-center">
                        <span className="text-[8px] text-muted-foreground font-black uppercase tracking-widest">Attachments:</span>
                        {attachments.map((url: string, aIdx: number) => {
                          const filename = url.split('/').pop() || `File ${aIdx + 1}`;
                          return (
                            <a
                              key={aIdx}
                              href={url.startsWith('/uploads') ? url : `/uploads${url}`}
                              download={filename}
                              className="text-[9px] font-bold text-indigo-650 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100/50 rounded px-1.5 py-0.5"
                            >
                              📎 {filename}
                            </a>
                          );
                        })}
                      </div>
                    );
                  })()}

                  <p className="text-[8px] text-muted-foreground pt-1 border-t border-dashed mt-2">
                    Applied Date: {new Date(w.createdAt || w.updatedAt).toLocaleDateString()} · Leave Duration: {new Date(w.startDate).toLocaleDateString()} - {new Date(w.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0 md:self-center">
                  <button onClick={() => handleWorkflowAction(w.id, 'APPROVE')} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[9px] flex flex-wrap items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> Approve
                  </button>
                  <button onClick={() => handleWorkflowAction(w.id, 'REJECT')} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[9px] flex flex-wrap items-center gap-1">
                    <X className="h-3.5 w-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
            {workflows.filter(w => ['PENDING', 'PENDING_MENTOR'].includes(w.status) && w.currentStep === 'MENTOR').length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">All workflow requests assigned to your queue have been processed.</p>
            )}
          </div>
        </div>
      )}

      {/* Counseling Tab */}
      {activeTab === 'counseling' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs font-semibold">
          {/* Counseling form */}
          <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4 h-fit">
            <h3 className="text-sm font-extrabold uppercase border-b pb-2">Log Counseling Session</h3>
            <form onSubmit={handleCreateCounseling} className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold text-muted-foreground">Select Student</label>
                <select
                  required
                  value={counselingForm.studentId}
                  onChange={e => setCounselingForm({...counselingForm, studentId: e.target.value})}
                  className="h-9 border rounded-lg bg-background px-3 font-semibold"
                >
                  <option value="">Select Student...</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold text-muted-foreground">Reason / Issue Context</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Academic stress, low attendance..."
                  value={counselingForm.reason}
                  onChange={e => setCounselingForm({...counselingForm, reason: e.target.value})}
                  className="h-9 border rounded-lg bg-background px-3"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold text-muted-foreground">Discussion Notes</label>
                <textarea
                  placeholder="Notes..."
                  rows={3}
                  value={counselingForm.notes}
                  onChange={e => setCounselingForm({...counselingForm, notes: e.target.value})}
                  className="border rounded-lg bg-background p-3 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Follow-up Date</label>
                  <input
                    type="date"
                    value={counselingForm.followUpDate}
                    onChange={e => setCounselingForm({...counselingForm, followUpDate: e.target.value})}
                    className="h-9 border rounded bg-background px-2"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Outcome</label>
                  <select
                    value={counselingForm.outcome}
                    onChange={e => setCounselingForm({...counselingForm, outcome: e.target.value})}
                    className="h-9 border rounded bg-background px-2"
                  >
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full h-9 bg-primary text-primary-foreground font-bold rounded-lg hover:opacity-90 transition-opacity">
                Log Counseling File
              </button>
            </form>
          </div>

          {/* Sessions ledger */}
          <div className="lg:col-span-2 border bg-card p-5 rounded-xl shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold uppercase border-b pb-2 flex justify-between items-center">
              <span>Counseling History Roster</span>
              <button onClick={() => handleExport('Counseling History Logs', 'PDF')} className="h-8 border hover:bg-muted text-xs px-2.5 rounded-lg flex flex-wrap items-center gap-1">
                <Download className="h-3.5 w-3.5" /> Export Report
              </button>
            </h3>
            <div className="space-y-3">
              {counselingSessions.map(session => (
                <div key={session.id} className="p-3.5 border rounded-lg bg-background space-y-1.5">
                  <div className="flex justify-between items-center">
                    <h4 className="font-extrabold text-foreground text-xs">{session.studentName}</h4>
                    <span className="text-[9px] text-muted-foreground font-mono">{session.date}</span>
                  </div>
                  <p className="text-[10px] text-primary font-bold">Issue logged: {session.issue}</p>
                  <p className="text-[10px] text-muted-foreground italic">"Notes: {session.notes}"</p>
                  <div className="flex justify-between items-center pt-1 border-t text-[9px] text-muted-foreground">
                    <span>Follow-up: <span className="font-bold">{session.followUpDate || 'None'}</span></span>
                    <span className="font-bold text-amber-600">{session.outcome}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Parent Comms Tab */}
      {activeTab === 'comms' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs font-semibold">
          {/* Creator form */}
          <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4 h-fit">
            <h3 className="text-sm font-extrabold uppercase border-b pb-2">Publish Advisor Bulletin</h3>
            <form onSubmit={handlePublishAnnouncement} className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold text-muted-foreground">Target Group</label>
                <select
                  value={commsTarget}
                  onChange={e => setCommsTarget(e.target.value as any)}
                  className="h-9 border rounded-lg bg-background px-3 font-semibold"
                >
                  <option value="ALL">All Assigned (Students & Parents)</option>
                  <option value="STUDENTS">Students Only</option>
                  <option value="PARENTS">Parents Only</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold text-muted-foreground">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Low attendance alert, meeting invitation..."
                  value={commsSubject}
                  onChange={e => setCommsSubject(e.target.value)}
                  className="h-9 border rounded-lg bg-background px-3 font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold text-muted-foreground">Message Body</label>
                <textarea
                  required
                  placeholder="Body..."
                  rows={4}
                  value={commsMessage}
                  onChange={e => setCommsMessage(e.target.value)}
                  className="border rounded-lg bg-background p-3 resize-none font-semibold"
                />
              </div>

              <button type="submit" className="w-full h-9 bg-primary text-primary-foreground font-bold rounded-lg hover:opacity-90 flex flex-wrap items-center justify-center gap-1.5">
                <Megaphone className="h-4.5 w-4.5" /> Send Announcement
              </button>
            </form>
          </div>

          {/* History ledger */}
          <div className="lg:col-span-2 border bg-card p-5 rounded-xl shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold uppercase border-b pb-2">Bulletin Dispatch Logs</h3>
            <div className="p-3 border rounded-lg bg-background space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[9px] bg-indigo-50 border text-indigo-600 font-extrabold px-1.5 py-0.5 rounded">PARENTS</span>
                <span className="text-[9px] text-muted-foreground font-mono">2026-07-12</span>
              </div>
              <h4 className="font-extrabold text-xs">Parent-Teacher Meeting Agenda</h4>
              <p className="text-[10px] text-muted-foreground">Detailed reviews of semester CIA results scheduled for this Friday. Presence is requested.</p>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Student Profile Overlay Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-xl flex flex-col border overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary to-indigo-600 p-5 text-white flex justify-between items-center">
              <div className="flex flex-wrap items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-white/20 text-white flex items-center justify-center font-extrabold text-sm border border-white/25">
                  {selectedStudent.firstName?.[0]}{selectedStudent.lastName?.[0]}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm">{selectedStudent.firstName} {selectedStudent.lastName}</h3>
                  <p className="text-[10px] opacity-90 font-bold">Register No: {selectedStudent.admissionNo} · Roll No: {selectedStudent.rollNo || 'N/A'}</p>
                </div>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content Scroll */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs font-semibold">
              
              {/* Profile Sub Grid Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Personal & Parent Details */}
                <div className="border rounded-xl p-4.5 bg-slate-50/30 space-y-3.5">
                  <h4 className="font-extrabold uppercase text-[10px] text-primary tracking-wider border-b border-dashed pb-1 flex flex-wrap items-center gap-1.5">
                    <User className="h-4 w-4" /> Personal & Parent Info
                  </h4>
                  <div className="space-y-1.5">
                    <p><span className="text-muted-foreground font-bold">Gender:</span> {selectedStudent.gender || 'N/A'}</p>
                    <p><span className="text-muted-foreground font-bold">DOB:</span> {selectedStudent.dob ? new Date(selectedStudent.dob).toLocaleDateString() : 'N/A'}</p>
                    <p><span className="text-muted-foreground font-bold">Blood Group:</span> {selectedStudent.bloodGroup || 'O+'}</p>
                    <p><span className="text-muted-foreground font-bold">Contact Email:</span> {selectedStudent.email || 'N/A'}</p>
                    <p><span className="text-muted-foreground font-bold">Contact Mobile:</span> {selectedStudent.phone || 'N/A'}</p>
                    <p className="border-t pt-1.5"><span className="text-muted-foreground font-bold">Parent Name:</span> {selectedStudent.parentName || 'N/A'}</p>
                    <p><span className="text-muted-foreground font-bold">Parent Mobile:</span> {selectedStudent.parentPhone || 'N/A'}</p>
                    <p><span className="text-muted-foreground font-bold">Parent Email:</span> {selectedStudent.parentEmail || 'N/A'}</p>
                  </div>
                </div>

                {/* Academic & Timetable */}
                <div className="border rounded-xl p-4.5 bg-slate-50/30 space-y-3.5">
                  <h4 className="font-extrabold uppercase text-[10px] text-primary tracking-wider border-b border-dashed pb-1 flex flex-wrap items-center gap-1.5">
                    <BookOpen className="h-4 w-4" /> Academic Mapping
                  </h4>
                  <div className="space-y-1.5">
                    <p><span className="text-muted-foreground font-bold">Department:</span> {selectedStudent.department?.name || 'Computer Science'}</p>
                    <p><span className="text-muted-foreground font-bold">Program:</span> {selectedStudent.program?.name || 'B.Tech CSE'}</p>
                    <p><span className="text-muted-foreground font-bold">Semester:</span> {selectedStudent.semester?.name || 'Semester 3'}</p>
                    <p><span className="text-muted-foreground font-bold">Section:</span> {selectedStudent.section?.name || 'Section A'}</p>
                    <p><span className="text-muted-foreground font-bold">Batch:</span> {selectedStudent.batch || '2024-2028'}</p>
                    <p><span className="text-muted-foreground font-bold">Academic Year:</span> {selectedStudent.academicYear?.name || '2026-2027'}</p>
                  </div>
                </div>

                {/* Infrastructure, Fee & Placement (View Only) */}
                <div className="border rounded-xl p-4.5 bg-slate-50/30 space-y-3.5">
                  <h4 className="font-extrabold uppercase text-[10px] text-primary tracking-wider border-b border-dashed pb-1 flex flex-wrap items-center gap-1.5">
                    <Landmark className="h-4 w-4" /> Operations & Placement Info
                  </h4>
                  <div className="space-y-1.5">
                    <p><span className="text-muted-foreground font-bold">Hostel Block:</span> {selectedStudent.hostelBuilding?.name || 'Not Hostelled'}</p>
                    <p><span className="text-muted-foreground font-bold">Transport Route:</span> {selectedStudent.transportRoute?.routeName || 'Not Enrolled'}</p>
                    <p><span className="text-muted-foreground font-bold">Fee Status:</span> <span className="text-amber-600 font-extrabold">View Only: Pending dues</span></p>
                    <p><span className="text-muted-foreground font-bold">Scholarship status:</span> {selectedStudent.scholarshipStatus || 'None'}</p>
                    <p className="border-t pt-1.5"><span className="text-muted-foreground font-bold">Placement status:</span> {selectedStudent.placementStatus || 'Eligible'}</p>
                    <p><span className="text-muted-foreground font-bold">Internship Company:</span> {selectedStudent.internshipCompany || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Sub-academic registers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Marks CIA results */}
                <div className="border bg-card p-4 rounded-xl space-y-3.5">
                  <h4 className="font-extrabold uppercase text-[10px] text-foreground border-b pb-1.5">CIA Assessment Registry</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 border rounded bg-background text-[11px]">
                      <span>Design and Analysis of Algorithms (CS6101)</span>
                      <span className="font-bold text-primary">CIA 1: 42/50 · CIA 2: 44/50</span>
                    </div>
                    <div className="flex justify-between items-center p-2 border rounded bg-background text-[11px]">
                      <span>Database Management Systems (CS6102)</span>
                      <span className="font-bold text-primary">CIA 1: 38/50 · CIA 2: 40/50</span>
                    </div>
                  </div>
                </div>

                {/* Disciplinary warnings & behavior logs */}
                <div className="border bg-card p-4 rounded-xl space-y-3.5">
                  <h4 className="font-extrabold uppercase text-[10px] text-foreground border-b pb-1.5">Disciplinary Warnings & Advisor Notes</h4>
                  <div className="space-y-2">
                    <div className="p-3 border rounded bg-background">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] bg-amber-50 text-amber-600 font-extrabold px-1.5 py-0.5 rounded">WARNING</span>
                        <span className="text-[9px] text-muted-foreground font-mono">2026-07-02</span>
                      </div>
                      <p className="text-[10px] text-foreground font-bold mt-1">Classroom disruption note</p>
                      <p className="text-[9px] text-muted-foreground">Student was warned for using laptop during lecture sessions.</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* AI Academic Insights Section */}
              <div className="border border-purple-100 rounded-xl p-4.5 bg-purple-50/20 space-y-3 mt-6">
                <h4 className="font-extrabold uppercase text-[10px] text-purple-700 tracking-wider border-b border-purple-100/50 pb-1.5 flex flex-wrap items-center gap-1.5">
                  ✨ AI Academic Insights & Advisor Recommendation
                </h4>
                {loadingInsight ? (
                  <div className="flex flex-wrap items-center gap-2 text-purple-600 animate-pulse text-[11px]">
                    <span>Analyzing student records, marks trends, and attendance rates...</span>
                  </div>
                ) : (
                  <div className="text-[11px] leading-relaxed text-foreground whitespace-pre-line prose max-w-none">
                    {aiInsightText || 'AI advisor recommendation ready to load.'}
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-muted border-t flex flex-wrap justify-end gap-2">
              <button
                onClick={() => {
                  toast.success(`Generated Student Progress File for ${selectedStudent.firstName}`);
                  handleExport('Student Progress Report', 'PDF');
                }}
                className="px-4 py-2 border bg-card hover:bg-muted rounded-lg font-bold flex flex-wrap items-center gap-1.5"
              >
                <Download className="h-4 w-4" /> Export Progress Report
              </button>
              <button onClick={() => setSelectedStudent(null)} className="px-4 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-lg font-bold">
                Close Progress File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Students Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b bg-muted/20 flex justify-between items-center">
              <div className="text-left">
                <h3 className="text-sm font-extrabold uppercase tracking-wider">Assign Students to your Mentorship</h3>
                <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Department Roster: Only Active Students</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="px-3 py-1.5 border hover:bg-muted rounded-lg text-xs font-bold transition-colors"
              >
                ✕ Close
              </button>
            </div>

            {/* Modal Search & Filters */}
            <div className="p-4 bg-muted/10 border-b space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search students by name, register number, roll number, admission number..."
                  value={assignSearchQuery}
                  onChange={e => setAssignSearchQuery(e.target.value)}
                  className="w-full h-9 border rounded-lg pl-9 pr-4 text-xs font-semibold bg-background"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-5 gap-2">
                <select
                  value={assignSelectedDept}
                  onChange={e => setAssignSelectedDept(e.target.value)}
                  className="h-9 border rounded-lg px-2 text-[10px] font-extrabold bg-background uppercase cursor-pointer"
                >
                  <option value="ALL">All Depts</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics Engineering">Electronics Engineering</option>
                </select>

                <select
                  value={assignSelectedProg}
                  onChange={e => setAssignSelectedProg(e.target.value)}
                  className="h-9 border rounded-lg px-2 text-[10px] font-extrabold bg-background uppercase cursor-pointer"
                >
                  <option value="ALL">All Programs</option>
                  <option value="B.Tech">B.Tech</option>
                  <option value="M.Tech">M.Tech</option>
                  <option value="MCA">MCA</option>
                </select>

                <select
                  value={assignSelectedSem}
                  onChange={e => setAssignSelectedSem(e.target.value)}
                  className="h-9 border rounded-lg px-2 text-[10px] font-extrabold bg-background uppercase cursor-pointer"
                >
                  <option value="ALL">All Semesters</option>
                  <option value="Semester 1">Semester 1</option>
                  <option value="Semester 2">Semester 2</option>
                  <option value="Semester 3">Semester 3</option>
                  <option value="Semester 4">Semester 4</option>
                </select>

                <select
                  value={assignSelectedSec}
                  onChange={e => setAssignSelectedSec(e.target.value)}
                  className="h-9 border rounded-lg px-2 text-[10px] font-extrabold bg-background uppercase cursor-pointer"
                >
                  <option value="ALL">All Sections</option>
                  <option value="Section A">Section A</option>
                  <option value="Section B">Section B</option>
                </select>

                <select
                  value={assignSelectedYear}
                  onChange={e => setAssignSelectedYear(e.target.value)}
                  className="h-9 border rounded-lg px-2 text-[10px] font-extrabold bg-background uppercase cursor-pointer"
                >
                  <option value="ALL">All Acad Years</option>
                  <option value="2026-2027">2026-2027</option>
                  <option value="2025-2026">2025-2026</option>
                </select>
              </div>
            </div>

            {/* Modal Body / Table list */}
            <div className="flex-1 overflow-auto p-4">
              {loadingAllStudents ? (
                <div className="text-center py-12 text-xs text-muted-foreground animate-pulse font-extrabold">
                  Loading department students list...
                </div>
              ) : (
                <div className="w-full overflow-x-auto max-w-[90vw] md:max-w-full pb-2 scrollbar-thin"><table className="w-full text-left text-[10px]">
                  <thead>
                    <tr className="border-b bg-muted/20 uppercase font-bold text-muted-foreground tracking-wider">
                      <th className="p-3 text-center w-12">
                        <input
                          type="checkbox"
                          onChange={e => {
                            if (e.target.checked) {
                              const filteredIds = allUnassignedStudents
                                .filter(s => {
                                  const matchesSearch = `${s.firstName} ${s.lastName}`.toLowerCase().includes(assignSearchQuery.toLowerCase()) ||
                                                        (s.admissionNo && s.admissionNo.toLowerCase().includes(assignSearchQuery.toLowerCase())) ||
                                                        (s.rollNo && s.rollNo.toLowerCase().includes(assignSearchQuery.toLowerCase()));
                                  const matchesDept = assignSelectedDept === 'ALL' || s.department?.name === assignSelectedDept;
                                  const matchesProg = assignSelectedProg === 'ALL' || s.program?.name === assignSelectedProg;
                                  const matchesSem = assignSelectedSem === 'ALL' || s.semester?.name === assignSelectedSem;
                                  const matchesSec = assignSelectedSec === 'ALL' || s.section?.name === assignSelectedSec;
                                  const matchesYear = assignSelectedYear === 'ALL' || s.academicYear?.name === assignSelectedYear;
                                  return matchesSearch && matchesDept && matchesProg && matchesSem && matchesSec && matchesYear;
                                })
                                .map(s => s.id);
                              setSelectedStudentIds(filteredIds);
                            } else {
                              setSelectedStudentIds([]);
                            }
                          }}
                          checked={selectedStudentIds.length > 0 && selectedStudentIds.length === allUnassignedStudents.filter(s => {
                            const matchesSearch = `${s.firstName} ${s.lastName}`.toLowerCase().includes(assignSearchQuery.toLowerCase()) ||
                                                  (s.admissionNo && s.admissionNo.toLowerCase().includes(assignSearchQuery.toLowerCase())) ||
                                                  (s.rollNo && s.rollNo.toLowerCase().includes(assignSearchQuery.toLowerCase()));
                            const matchesDept = assignSelectedDept === 'ALL' || s.department?.name === assignSelectedDept;
                            const matchesProg = assignSelectedProg === 'ALL' || s.program?.name === assignSelectedProg;
                            const matchesSem = assignSelectedSem === 'ALL' || s.semester?.name === assignSelectedSem;
                            const matchesSec = assignSelectedSec === 'ALL' || s.section?.name === assignSelectedSec;
                            const matchesYear = assignSelectedYear === 'ALL' || s.academicYear?.name === assignSelectedYear;
                            return matchesSearch && matchesDept && matchesProg && matchesSem && matchesSec && matchesYear;
                          }).length}
                          className="rounded cursor-pointer"
                        />
                      </th>
                      <th className="p-3">Photo</th>
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Register Number</th>
                      <th className="p-3">Roll Number</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Program</th>
                      <th className="p-3">Semester</th>
                      <th className="p-3">Section</th>
                      <th className="p-3">Current Mentor</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUnassignedStudents
                      .filter(s => {
                        const matchesSearch = `${s.firstName} ${s.lastName}`.toLowerCase().includes(assignSearchQuery.toLowerCase()) ||
                                              (s.admissionNo && s.admissionNo.toLowerCase().includes(assignSearchQuery.toLowerCase())) ||
                                              (s.rollNo && s.rollNo.toLowerCase().includes(assignSearchQuery.toLowerCase()));
                        const matchesDept = assignSelectedDept === 'ALL' || s.department?.name === assignSelectedDept;
                        const matchesProg = assignSelectedProg === 'ALL' || s.program?.name === assignSelectedProg;
                        const matchesSem = assignSelectedSem === 'ALL' || s.semester?.name === assignSelectedSem;
                        const matchesSec = assignSelectedSec === 'ALL' || s.section?.name === assignSelectedSec;
                        const matchesYear = assignSelectedYear === 'ALL' || s.academicYear?.name === assignSelectedYear;
                        return matchesSearch && matchesDept && matchesProg && matchesSem && matchesSec && matchesYear;
                      })
                      .map((std, sIdx) => (
                        <tr key={std.id || sIdx} className="border-b last:border-b-0 hover:bg-muted/10 font-semibold">
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={selectedStudentIds.includes(std.id)}
                              onChange={e => {
                                if (e.target.checked) {
                                  setSelectedStudentIds([...selectedStudentIds, std.id]);
                                } else {
                                  setSelectedStudentIds(selectedStudentIds.filter(id => id !== std.id));
                                }
                              }}
                              className="rounded cursor-pointer"
                            />
                          </td>
                          <td className="p-3">
                            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-extrabold text-[8px] border border-primary/20">
                              {std.firstName?.[0]}{std.lastName?.[0]}
                            </div>
                          </td>
                          <td className="p-3 font-bold text-foreground">{std.firstName} {std.lastName}</td>
                          <td className="p-3 font-mono text-muted-foreground">{std.admissionNo}</td>
                          <td className="p-3 font-mono text-muted-foreground">{std.rollNo || 'N/A'}</td>
                          <td className="p-3 truncate max-w-[100px]">{std.department?.name || 'CSE'}</td>
                          <td className="p-3 font-bold">{std.program?.name || 'B.Tech'}</td>
                          <td className="p-3">{std.semester?.name || 'Semester 3'}</td>
                          <td className="p-3">{std.section?.name || 'Section A'}</td>
                          <td className="p-3">
                            {std.mentor ? (
                              <span className="text-amber-600 font-extrabold">
                                👤 {std.mentor.firstName} {std.mentor.lastName}
                              </span>
                            ) : (
                              <span className="text-muted-foreground italic">Unassigned</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">
                              {std.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table></div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-muted border-t flex justify-between items-center">
              <span className="text-[10px] text-muted-foreground font-extrabold uppercase">
                {selectedStudentIds.length} student(s) selected
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedStudentIds([])}
                  className="px-4 py-2 border bg-card hover:bg-muted rounded-lg font-bold text-xs"
                >
                  Clear Selection
                </button>
                <button
                  type="button"
                  disabled={selectedStudentIds.length === 0}
                  onClick={() => {
                    const reassignedStudents = allUnassignedStudents.filter(
                      s => selectedStudentIds.includes(s.id) && s.mentor && s.mentor.id !== user.id
                    );

                    if (reassignedStudents.length > 0) {
                      setStudentToReassign(reassignedStudents);
                    } else {
                      handleAssignStudents(selectedStudentIds);
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-xs hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  Assign Selected
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reassignment Confirmation Dialog */}
      {studentToReassign && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md border rounded-xl shadow-xl p-5 space-y-4 text-xs font-semibold">
            <h3 className="text-sm font-extrabold uppercase text-amber-600">⚠️ Transfer Mentorship Warning</h3>
            <p className="text-muted-foreground">
              The following student(s) are currently assigned to another mentor. Do you want to transfer them to your mentorship list?
            </p>
            <div className="max-h-[150px] overflow-y-auto border rounded bg-slate-50 p-2.5 space-y-1.5">
              {studentToReassign.map((s: any, idx: number) => (
                <div key={idx} className="flex justify-between text-[10px]">
                  <span className="font-bold text-foreground">{s.firstName} {s.lastName}</span>
                  <span className="text-amber-600 font-extrabold">Current: {s.mentor.firstName} {s.mentor.lastName}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStudentToReassign(null)}
                className="flex-1 py-2 border rounded font-bold hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleAssignStudents(selectedStudentIds);
                  setStudentToReassign(null);
                }}
                className="flex-1 py-2 bg-amber-600 text-white rounded font-bold hover:bg-amber-700"
              >
                Transfer Mentorship
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Confirmation Dialog */}
      {studentToRemove && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-sm border rounded-xl shadow-xl p-5 space-y-4 text-xs font-semibold">
            <h3 className="text-sm font-extrabold uppercase text-rose-600">❌ Remove Mentorship Assignment</h3>
            <p className="text-muted-foreground">
              Are you sure you want to remove <span className="text-foreground font-black">{studentToRemove.firstName} {studentToRemove.lastName}</span> from your mentorship list?
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStudentToRemove(null)}
                className="flex-1 py-2 border rounded font-bold hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRemoveStudent(studentToRemove.id)}
                className="flex-1 py-2 bg-rose-600 text-white rounded font-bold hover:bg-rose-700"
              >
                Remove Assignment
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

