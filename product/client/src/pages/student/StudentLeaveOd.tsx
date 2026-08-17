import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CalendarDays, FileText, Send, Clock, CheckCircle, AlertTriangle, XCircle, Plus, ChevronRight, ArrowLeft, Ban, RotateCcw
} from "lucide-react";
import { toast } from "../../components/ui/Toast";
import { Loading } from "../../components/ui/Loading";
import api from "../../lib/axios";

// Real Prisma states (schema.prisma StudentLeaveRequest.status), grouped into
// the 7 user-facing stages: Draft / Submitted / Under Review / Returned /
// Approved / Rejected / Completed.
const STATUS_GROUPS: Record<string, { label: string; className: string; Icon: any }> = {
  DRAFT: { label: 'Draft', className: 'bg-slate-100 text-slate-600 border-slate-200', Icon: FileText },
  PENDING_MENTOR: { label: 'Under Review (Mentor)', className: 'bg-amber-50 text-amber-700 border-amber-100', Icon: Clock },
  PENDING_HOD: { label: 'Under Review (HOD)', className: 'bg-amber-50 text-amber-700 border-amber-100', Icon: Clock },
  PENDING_DEAN: { label: 'Under Review (Dean)', className: 'bg-amber-50 text-amber-700 border-amber-100', Icon: Clock },
  RETURNED_TO_STUDENT: { label: 'Returned — action needed', className: 'bg-orange-50 text-orange-700 border-orange-200', Icon: AlertTriangle },
  RETURNED_TO_MENTOR: { label: 'Under Review (Mentor)', className: 'bg-amber-50 text-amber-700 border-amber-100', Icon: Clock },
  REJECTED_BY_MENTOR: { label: 'Rejected', className: 'bg-rose-50 text-rose-700 border-rose-100', Icon: XCircle },
  REJECTED_BY_HOD: { label: 'Rejected', className: 'bg-rose-50 text-rose-700 border-rose-100', Icon: XCircle },
  APPROVED: { label: 'Approved', className: 'bg-emerald-50 text-emerald-700 border-emerald-100', Icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', className: 'bg-slate-100 text-slate-500 border-slate-200', Icon: Ban },
  EXPIRED: { label: 'Expired', className: 'bg-slate-100 text-slate-500 border-slate-200', Icon: Clock },
  COMPLETED: { label: 'Completed', className: 'bg-emerald-50 text-emerald-700 border-emerald-100', Icon: CheckCircle },
};

const OD_MIN_ADVANCE_DAYS = 2;

function minStartDate(type: string): string {
  const min = new Date();
  if (type === "OD") min.setDate(min.getDate() + OD_MIN_ADVANCE_DAYS);
  return min.toISOString().slice(0, 10);
}

export const StudentLeaveOd: React.FC = () => {
  const { id: routeId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [mobileView, setMobileView] = useState<'apply' | 'history'>('apply');
  const [odLeadTimeDays, setOdLeadTimeDays] = useState<number>(2);
  
  // Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: "LEAVE",
    title: "",
    reason: "",
    startDate: "",
    endDate: "",
    attachments: ""
  });

  // Timetable & Period State
  const [timetableSlots, setTimetableSlots] = useState<any[]>([]);
  const [selectedPeriods, setSelectedPeriods] = useState<number[]>([]);
  const [availableFaculties, setAvailableFaculties] = useState<any[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>("ALL");

  function minStartDate(type: string, advanceDays: number): string {
    const min = new Date();
    if (type === "OD") {
      min.setDate(min.getDate() + advanceDays);
    }
    return min.toISOString().slice(0, 10);
  }

  const fetchRequests = async () => {
    try {
      const res = await api.get('/student/leave-od/my-requests');
      if (res.data?.status === 'success') {
        setRequests(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();

    const fetchOdLeadTimeSetting = async () => {
      try {
        const res = await api.get('/settings');
        const settings = res.data?.data || [];
        const odSetting = settings.find((s: any) => s.key === 'od_min_advance_days' || s.key === 'OD_MIN_ADVANCE_DAYS');
        if (odSetting && !isNaN(parseInt(odSetting.value, 10))) {
          setOdLeadTimeDays(parseInt(odSetting.value, 10));
        }
      } catch (_) {}
    };
    fetchOdLeadTimeSetting();

    const fetchTimetable = async () => {
      try {
        const res = await api.get('/timetables/slots?studentId=me');
        if (res.data?.status === 'success') {
          const slots = res.data.data || [];
          setTimetableSlots(slots);
          
          const facMap = new Map();
          slots.forEach((s: any) => {
            if (s.faculty && !facMap.has(s.faculty.id)) {
              facMap.set(s.faculty.id, {
                id: s.faculty.id,
                name: `${s.faculty.firstName} ${s.faculty.lastName}`,
                subject: s.subject?.name || 'Subject'
              });
            }
          });
          setAvailableFaculties(Array.from(facMap.values()));
        }
      } catch (err) {
        console.error('Failed to load timetable slots:', err);
      }
    };
    fetchTimetable();
  }, []);

  // Deep-link entry point: /student/leave-od/:id (from a notification tap or
  // a direct link). Fetches that specific request and opens its detail panel.
  useEffect(() => {
    if (!routeId) return;
    (async () => {
      try {
        const res = await api.get(`/student/leave-od/details/${routeId}`);
        if (res.data?.status === 'success' && res.data.data) {
          setSelectedRequest(res.data.data);
          setMobileView('apply');
        } else {
          toast.error('This request could not be found.');
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Unable to open this request.');
      }
    })();
  }, [routeId]);

  const togglePeriod = (periodNum: number) => {
    setSelectedPeriods(prev => 
      prev.includes(periodNum) 
        ? prev.filter(p => p !== periodNum)
        : [...prev, periodNum].sort((a, b) => a - b)
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.reason.trim() || !formData.startDate || !formData.endDate) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const affectedFacultyIdsSet = new Set<string>();
      if (selectedFacultyId !== 'ALL' && selectedFacultyId !== '') {
        affectedFacultyIdsSet.add(selectedFacultyId);
      }

      if (selectedPeriods.length > 0 && timetableSlots.length > 0) {
        timetableSlots.forEach((slot: any) => {
          if (selectedPeriods.includes(slot.slotIndex) && slot.facultyId) {
            affectedFacultyIdsSet.add(slot.facultyId);
          }
        });
      }

      const attachmentsPayload = JSON.stringify({
        url: formData.attachments,
        periods: selectedPeriods,
        affectedFacultyIds: Array.from(affectedFacultyIdsSet)
      });

      const res = await api.post('/student/leave-od', {
        type: formData.type === 'OD' ? 'ON_DUTY' : 'LEAVE',
        requestCategory: formData.title,
        reason: formData.reason,
        description: formData.title,
        startDate: formData.startDate,
        endDate: formData.endDate,
        attachmentUrl: formData.attachments || undefined,
        attachments: attachmentsPayload,
      });

      if (res.data?.status === 'success') {
        toast.success("Leave/OD request submitted to Mentor!");
        setFormData({
          type: "LEAVE",
          title: "",
          reason: "",
          startDate: "",
          endDate: "",
          attachments: ""
        });
        setSelectedPeriods([]);
        setSelectedFacultyId("ALL");
        setMobileView('history');
        fetchRequests();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const cfg = STATUS_GROUPS[status] || STATUS_GROUPS.PENDING_MENTOR;
    const Icon = cfg.Icon;
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border flex items-center gap-1 w-fit ${cfg.className}`}>
        <Icon className="h-3 w-3" /> {cfg.label}
      </span>
    );
  };

  const startResubmit = (request: any) => {
    setFormData({
      type: request.type === 'ON_DUTY' ? 'OD' : 'LEAVE',
      title: request.title || request.requestCategory || '',
      reason: request.reason || '',
      startDate: request.startDate ? String(request.startDate).slice(0, 10) : '',
      endDate: request.endDate ? String(request.endDate).slice(0, 10) : '',
      attachments: request.attachmentUrl || '',
    });
    setSelectedRequest(null);
    setMobileView('apply');
    if (routeId) navigate('/student/leave-od');
    toast.info('Review the details below and resubmit your request.');
  };

  const cancelRequest = async (id: string) => {
    if (!window.confirm('Cancel this Leave/OD request?')) return;
    try {
      await api.post(`/workflows/requests/${id}/cancel`);
      toast.success('Request cancelled.');
      setSelectedRequest(null);
      await fetchRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Request could not be cancelled.');
    }
  };

  if (isLoading) return <Loading text="Loading Leave & OD Requests..." />;

  return (
    <div className="mx-auto max-w-[1320px] space-y-5 pb-6 text-left sm:space-y-7 sm:pb-12">
      
      {/* Page Header */}
      <header className="relative overflow-hidden rounded-[1.75rem] bg-[#111722] px-5 py-6 text-white shadow-[0_28px_80px_-44px_rgba(15,23,42,0.9)] sm:px-8 sm:py-8">
        <div className="absolute -right-14 -top-20 h-52 w-52 rounded-full border border-indigo-400/20" aria-hidden="true" />
        <div className="relative flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-400/15 text-indigo-200">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-indigo-300">Student requests</p>
            <h1 className="mt-1 text-2xl font-bold tracking-[-0.035em] sm:text-3xl">Leave & OD workspace</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">Apply, follow Mentor and HOD decisions, and keep every request in one place.</p>
          </div>
        </div>
      </header>

      <nav aria-label="Leave and OD views" className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1 lg:hidden dark:bg-slate-900">
        <button type="button" onClick={() => { setMobileView('apply'); setSelectedRequest(null); }} className={`min-h-11 rounded-xl px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${mobileView === 'apply' ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white' : 'text-slate-500'}`}>
          Apply
        </button>
        <button type="button" onClick={() => setMobileView('history')} className={`min-h-11 rounded-xl px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${mobileView === 'history' ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white' : 'text-slate-500'}`}>
          History <span className="ml-1 font-mono text-xs tabular-nums">{requests.length}</span>
        </button>
      </nav>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-7">
        
        {/* ==================== LEFT COLUMN: REQUESTS LIST ==================== */}
        <div className={`${mobileView === 'history' ? 'block' : 'hidden'} space-y-4 lg:col-span-7 lg:block`}>
          <section className="space-y-5 rounded-[1.5rem] border border-slate-200/70 bg-white p-4 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.45)] sm:p-6 dark:border-slate-800 dark:bg-[#10141d]">
            <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
              Request history
            </h2>

            {requests.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 px-5 py-12 text-center dark:bg-slate-900/70">
                <FileText className="mx-auto h-7 w-7 text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">No requests yet</p>
                <p className="mt-1 text-xs text-slate-500">Your submitted Leave and OD requests will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3 lg:max-h-[650px] lg:overflow-y-auto lg:pr-1">
                {requests.map((r) => {
                  const isSelected = selectedRequest?.id === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => { setSelectedRequest(r); setMobileView('apply'); }}
                      className={`flex min-h-20 w-full items-center justify-between rounded-2xl border p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        isSelected ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10' : 'border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/60'
                      }`}
                    >
                      <div className="space-y-1 pr-4 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                            r.type === 'OD' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {r.type}
                          </span>
                          <h5 className="font-extrabold text-xs text-slate-800 truncate">{r.title}</h5>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium line-clamp-1">{r.reason}</p>
                        <p className="text-[9px] text-slate-400 font-semibold">
                          Duration: {r.startDate ? new Date(r.startDate).toLocaleDateString() : ''} - {r.endDate ? new Date(r.endDate).toLocaleDateString() : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {getStatusBadge(r.status)}
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* ==================== RIGHT COLUMN: ACTION PANEL ==================== */}
        <div className={`${mobileView === 'apply' ? 'block' : selectedRequest ? 'block' : 'hidden'} space-y-4 lg:col-span-5 lg:block`}>
          
          {selectedRequest ? (
            /* ==================== REQUEST DETAILS & WORKFLOW TIMELINE ==================== */
            <section className="space-y-5 rounded-[1.5rem] border border-slate-200/70 bg-white p-4 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.45)] sm:p-6 dark:border-slate-800 dark:bg-[#10141d]">
              <div className="flex justify-between items-center border-b pb-3">
                <button
                  onClick={() => { setSelectedRequest(null); if (routeId) navigate('/student/leave-od'); }}
                  className="flex items-center gap-1 text-[10px] font-extrabold text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-wider"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Apply
                </button>
                {getStatusBadge(selectedRequest.status)}
                <div className="ml-auto flex items-center gap-2">
                  {selectedRequest.status === 'RETURNED_TO_STUDENT' && (
                    <button type="button" onClick={() => startResubmit(selectedRequest)} className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50">
                      <RotateCcw className="h-3.5 w-3.5" /> Edit & resubmit
                    </button>
                  )}
                  {(selectedRequest.status === 'DRAFT' || selectedRequest.status.startsWith('PENDING') || selectedRequest.status === 'MENTOR_APPROVED' || selectedRequest.status === 'RETURNED_TO_STUDENT') && (
                    <button type="button" onClick={() => cancelRequest(selectedRequest.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50">
                      <Ban className="h-3.5 w-3.5" /> Cancel request
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2.5">
                <span className="text-[9px] font-black px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full uppercase tracking-wider">
                  {selectedRequest.type} Request
                </span>
                <h3 className="font-black text-sm text-slate-800 leading-tight">{selectedRequest.title}</h3>
                
                <div className="text-xs space-y-1.5 bg-slate-50/50 dark:bg-muted/10 p-3 rounded-xl border border-slate-100">
                  <p className="text-[11px]"><span className="font-bold text-slate-400">Duration:</span> <span className="font-semibold text-slate-700">{selectedRequest.startDate ? new Date(selectedRequest.startDate).toLocaleDateString() : ''} to {selectedRequest.endDate ? new Date(selectedRequest.endDate).toLocaleDateString() : ''}</span></p>
                  <p className="text-[11px]"><span className="font-bold text-slate-400">Reason:</span> <span className="font-semibold text-slate-700">{selectedRequest.reason}</span></p>
                  {selectedRequest.attachments && selectedRequest.attachments !== '[]' && (
                    <p className="text-[11px]"><span className="font-bold text-slate-400">Attachments:</span> <span className="font-semibold text-indigo-600 underline truncate block">{selectedRequest.attachments}</span></p>
                  )}
                </div>
              </div>

              {/* TIMELINE PROGRESSION */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b pb-1.5">
                  Approval Timeline
                </h4>
                
                <div className="relative pl-6 space-y-4">
                  {/* Vertical Line */}
                  <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-slate-200" />

                  {/* Step 1: Student Submitted */}
                  <div className="relative">
                    <span className="absolute -left-[21px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white border-2 border-card">
                      <CheckCircle className="h-2.5 w-2.5" />
                    </span>
                    <div className="text-xs">
                      <h5 className="font-extrabold text-slate-800">Request Submitted</h5>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {selectedRequest.createdAt ? new Date(selectedRequest.createdAt).toLocaleString() : ''}
                      </p>
                    </div>
                  </div>

                  {/* Step 2: Mentor Approval */}
                  <div className="relative">
                    {selectedRequest.status === 'PENDING_MENTOR' || selectedRequest.status === 'PENDING' ? (
                      <span className="absolute -left-[21px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white border-2 border-card animate-pulse">
                        <Clock className="h-2.5 w-2.5" />
                      </span>
                    ) : selectedRequest.status.startsWith('REJECTED') ? (
                      <span className="absolute -left-[21px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-white border-2 border-card">
                        <XCircle className="h-2.5 w-2.5" />
                      </span>
                    ) : (
                      <span className="absolute -left-[21px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white border-2 border-card">
                        <CheckCircle className="h-2.5 w-2.5" />
                      </span>
                    )}
                    <div className="text-xs">
                      <h5 className="font-extrabold text-slate-800">Mentor Review & Decision</h5>
                      {selectedRequest.history?.find((h: any) => h.stage === 'MENTOR' || h.stage === 'FACULTY') ? (
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Action by {selectedRequest.history.find((h: any) => h.stage === 'MENTOR' || h.stage === 'FACULTY').actionByName}
                          {selectedRequest.history.find((h: any) => h.stage === 'MENTOR' || h.stage === 'FACULTY').comment && (
                            <span className="block italic text-[9px] text-slate-400 mt-0.5">
                              Remarks: "{selectedRequest.history.find((h: any) => h.stage === 'MENTOR' || h.stage === 'FACULTY').comment}"
                            </span>
                          )}
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-400 mt-0.5">Awaiting Mentor review and authorization</p>
                      )}
                    </div>
                  </div>

                  {/* Step 3: HOD Approval / Final Decision */}
                  <div className="relative">
                    {selectedRequest.status === 'APPROVED_HOD' || selectedRequest.status === 'APPROVED' || selectedRequest.status === 'COMPLETED' ? (
                      <span className="absolute -left-[21px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white border-2 border-card">
                        <CheckCircle className="h-2.5 w-2.5" />
                      </span>
                    ) : selectedRequest.status === 'REJECTED_HOD' || selectedRequest.status === 'REJECTED_BY_HOD' ? (
                      <span className="absolute -left-[21px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-white border-2 border-card">
                        <XCircle className="h-2.5 w-2.5" />
                      </span>
                    ) : selectedRequest.status === 'APPROVED_MENTOR' || selectedRequest.status === 'MENTOR_APPROVED' ? (
                      <span className="absolute -left-[21px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white border-2 border-card animate-pulse">
                        <Clock className="h-2.5 w-2.5" />
                      </span>
                    ) : (
                      <span className="absolute -left-[21px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-300 text-white border-2 border-card">
                        <Clock className="h-2.5 w-2.5" />
                      </span>
                    )}
                    <div className="text-xs">
                      <h5 className="font-extrabold text-slate-800">HOD Review & Final Decision</h5>
                      {selectedRequest.history?.find((h: any) => h.stage === 'HOD') ? (
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Action by {selectedRequest.history.find((h: any) => h.stage === 'HOD').actionByName}
                          {selectedRequest.history.find((h: any) => h.stage === 'HOD').comment && (
                            <span className="block italic text-[9px] text-slate-400 mt-0.5">
                              Remarks: "{selectedRequest.history.find((h: any) => h.stage === 'HOD').comment}"
                            </span>
                          )}
                        </p>
                      ) : selectedRequest.status === 'APPROVED_HOD' || selectedRequest.status === 'APPROVED' || selectedRequest.status === 'COMPLETED' ? (
                        <p className="text-[10px] text-emerald-600 font-bold mt-0.5">Final Approval Granted by HOD</p>
                      ) : selectedRequest.status === 'REJECTED_HOD' || selectedRequest.status === 'REJECTED_BY_HOD' ? (
                        <p className="text-[10px] text-rose-600 font-bold mt-0.5">Request Rejected by HOD</p>
                      ) : selectedRequest.status === 'APPROVED_MENTOR' || selectedRequest.status === 'MENTOR_APPROVED' ? (
                        <p className="text-[10px] text-amber-600 font-semibold mt-0.5">Awaiting HOD final authorization & sign-off</p>
                      ) : (
                        <p className="text-[10px] text-slate-400 mt-0.5">Pending Mentor endorsement prior to HOD review</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            /* ==================== SUBMIT NEW REQUEST FORM ==================== */
            <section className="space-y-5 rounded-[1.5rem] border border-slate-200/70 bg-white p-4 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.45)] sm:p-6 dark:border-slate-800 dark:bg-[#10141d]">
              <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                <FileText className="h-4 w-4 text-indigo-500" /> Apply for Leave / OD
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-5 text-xs">
                
                {/* Type Selection */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Request Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-medium text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="LEAVE">Leave (Sick, Personal, etc.)</option>
                    <option value="OD">On Duty (OD - Hackathon, Seminar, etc.)</option>
                  </select>
                </div>

                {/* Category/Title */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Request Title / Topic</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g. Sick Leave - fever, Hackathon"
                    className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-medium text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    required
                  />
                </div>

                {/* Date Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      min={minStartDate(formData.type, odLeadTimeDays)}
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-medium text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      required
                    />
                    {formData.type === 'OD' && (
                      <p className="text-[9px] text-slate-400 mt-1">OD requests must be submitted at least {odLeadTimeDays} {odLeadTimeDays === 1 ? 'day' : 'days'} in advance.</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">End Date</label>
                    <input
                      type="date"
                      name="endDate"
                      min={formData.startDate || minStartDate(formData.type, odLeadTimeDays)}
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-medium text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      required
                    />
                  </div>
                </div>

                {/* Period Selection (Optional) */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase">Period Selection (Optional)</label>
                    <span className="text-[9px] text-indigo-600 font-bold">
                      {selectedPeriods.length === 0 ? "Full-Day Leave" : `${selectedPeriods.length} Period(s) Selected`}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 rounded-2xl bg-slate-50 p-2 dark:bg-slate-900/70">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((periodNum) => {
                      const isChecked = selectedPeriods.includes(periodNum);
                      const slot = timetableSlots.find((s: any) => s.slotIndex === periodNum);
                      return (
                        <button
                          type="button"
                          key={periodNum}
                          onClick={() => togglePeriod(periodNum)}
                          className={`flex min-h-11 flex-col items-center justify-center rounded-xl border px-2 py-2 text-center text-[10px] font-bold transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                            isChecked
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-background text-slate-700 hover:border-indigo-200'
                          }`}
                        >
                          <span>P{periodNum}</span>
                          {slot?.subject?.code && (
                            <span className={`text-[8px] truncate max-w-full ${isChecked ? 'text-indigo-100' : 'text-slate-400'}`}>
                              {slot.subject.code}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1 italic">
                    If no periods are checked, request will be treated as full-day leave.
                  </p>
                </div>

                {/* Affected Faculty (Optional Dropdown populated from Timetable) */}
                {availableFaculties.length > 0 && (
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Affected Faculty (Optional)</label>
                    <select
                      value={selectedFacultyId}
                      onChange={(e) => setSelectedFacultyId(e.target.value)}
                      className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-medium text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    >
                      <option value="ALL">Auto-notify from Timetable</option>
                      {availableFaculties.map((fac) => (
                        <option key={fac.id} value={fac.id}>
                          {fac.subject} - {fac.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-[9px] text-slate-400 mt-1">
                      Faculties receive informational notification only (No approval required).
                    </p>
                  </div>
                )}

                {/* Reason Textarea */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Reason / Explanation</label>
                  <textarea
                    name="reason"
                    rows={3}
                    value={formData.reason}
                    onChange={handleInputChange}
                    placeholder="Provide details about your request..."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 font-medium leading-5 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    required
                  />
                </div>

                {/* Optional Attachments link */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Medical Certificate / Proof Link (Optional)</label>
                  <input
                    type="url"
                    name="attachments"
                    value={formData.attachments}
                    onChange={handleInputChange}
                    placeholder="https://drive.google.com/..."
                    className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-medium text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-indigo-500 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <div className="h-4.5 w-4.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4" /> Submit Application
                    </>
                  )}
                </button>

              </form>
            </section>
          )}

        </div>

      </section>
    </div>
  );
};

export default StudentLeaveOd;
