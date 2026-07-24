import React, { useState, useEffect } from "react";
import {
  CalendarDays, FileText, Send, Clock, CheckCircle, AlertTriangle, XCircle, Plus, ChevronRight, ArrowLeft
} from "lucide-react";
import { toast } from "../../components/ui/Toast";
import { Loading } from "../../components/ui/Loading";
import api from "../../lib/axios";

export const StudentLeaveOd: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  
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

  const fetchRequests = async () => {
    try {
      const res = await api.get('/workflows/requests');
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
  }, []);

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
      const res = await api.post('/workflows/requests', formData);
      if (res.data?.status === 'success') {
        toast.success("Leave/OD request submitted successfully!");
        setFormData({
          type: "LEAVE",
          title: "",
          reason: "",
          startDate: "",
          endDate: "",
          attachments: ""
        });
        fetchRequests();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'COMPLETED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1 w-fit"><CheckCircle className="h-3 w-3" /> Approved</span>;
      case 'REJECTED':
      case 'REJECTED_BY_MENTOR':
      case 'REJECTED_BY_HOD':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-100 flex items-center gap-1 w-fit"><XCircle className="h-3 w-3" /> Rejected</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-100 flex items-center gap-1 w-fit"><Clock className="h-3 w-3 animate-pulse" /> Pending</span>;
    }
  };

  if (isLoading) return <Loading text="Loading Leave & OD Requests..." />;

  return (
    <div className="space-y-6 text-left pb-12 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-indigo-600" /> Leave & OD Workspace
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Submit and monitor leave applications and OD requests</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ==================== LEFT COLUMN: REQUESTS LIST ==================== */}
        <div className="lg:col-span-7 space-y-4">
          <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white">
              My Request History
            </h2>

            {requests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-xs">
                No leave or OD requests submitted yet.
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {requests.map((r) => {
                  const isSelected = selectedRequest?.id === r.id;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedRequest(r)}
                      className={`p-4 border rounded-xl bg-background flex justify-between items-center transition-all cursor-pointer hover:border-indigo-200 hover:shadow-sm ${
                        isSelected ? 'border-indigo-600 ring-1 ring-indigo-600/20 bg-indigo-50/5' : ''
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
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ==================== RIGHT COLUMN: ACTION PANEL ==================== */}
        <div className="lg:col-span-5 space-y-4">
          
          {selectedRequest ? (
            /* ==================== REQUEST DETAILS & WORKFLOW TIMELINE ==================== */
            <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-4 animate-in slide-in-from-right duration-200">
              <div className="flex justify-between items-center border-b pb-3">
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="flex items-center gap-1 text-[10px] font-extrabold text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-wider"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Apply
                </button>
                {getStatusBadge(selectedRequest.status)}
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

                  {/* Step 2: Mentor / Advisor Approval */}
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
                      <h5 className="font-extrabold text-slate-800">Faculty Advisor Review</h5>
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
                        <p className="text-[10px] text-slate-400 mt-0.5">Awaiting faculty review and endorsement</p>
                      )}
                    </div>
                  </div>

                  {/* Step 3: HOD Approval */}
                  <div className="relative">
                    {selectedRequest.status === 'APPROVED' || selectedRequest.status === 'COMPLETED' ? (
                      <span className="absolute -left-[21px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white border-2 border-card">
                        <CheckCircle className="h-2.5 w-2.5" />
                      </span>
                    ) : selectedRequest.status === 'REJECTED_BY_HOD' ? (
                      <span className="absolute -left-[21px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-white border-2 border-card">
                        <XCircle className="h-2.5 w-2.5" />
                      </span>
                    ) : (
                      <span className="absolute -left-[21px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-slate-400 border-2 border-card">
                        <Clock className="h-2.5 w-2.5" />
                      </span>
                    )}
                    <div className="text-xs">
                      <h5 className="font-extrabold text-slate-800">HOD Final Approval</h5>
                      {selectedRequest.history?.find((h: any) => h.stage === 'HOD') ? (
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Action by {selectedRequest.history.find((h: any) => h.stage === 'HOD').actionByName}
                          {selectedRequest.history.find((h: any) => h.stage === 'HOD').comment && (
                            <span className="block italic text-[9px] text-rose-500 mt-0.5 font-bold">
                              Remarks/Reason: "{selectedRequest.history.find((h: any) => h.stage === 'HOD').comment}"
                            </span>
                          )}
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-400 mt-0.5">Pending HOD authorization</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ==================== SUBMIT NEW REQUEST FORM ==================== */
            <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-4 animate-in slide-in-from-right duration-200">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
                <FileText className="h-4.5 w-4.5 text-indigo-600" /> Apply Leave / OD
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                
                {/* Type Selection */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Request Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg bg-background font-medium focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all outline-none"
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
                    className="w-full px-3 py-2 border rounded-lg bg-background font-semibold focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all outline-none"
                    required
                  />
                </div>

                {/* Date Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg bg-background font-semibold focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">End Date</label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg bg-background font-semibold focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Reason Textarea */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Reason / Explanation</label>
                  <textarea
                    name="reason"
                    rows={3}
                    value={formData.reason}
                    onChange={handleInputChange}
                    placeholder="Provide details about your request..."
                    className="w-full px-3 py-2 border rounded-lg bg-background font-medium focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all outline-none resize-none"
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
                    className="w-full px-3 py-2 border rounded-lg bg-background font-medium focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg shadow-md hover:shadow-lg transition-all"
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
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default StudentLeaveOd;
