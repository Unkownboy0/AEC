import React, { useState, useEffect } from 'react';
import {
  FolderOpen, Download, FileText, CheckCircle2, Clock, AlertCircle,
  Plus, Eye, Search, ShieldCheck, ArrowRight, ArrowLeft, RefreshCw, XCircle
} from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';
import api from '../../lib/axios';
import { downloadFile } from '../../platform/download';

interface DocumentRequest {
  id: string;
  type: string;
  title: string;
  reason: string;
  status: string;
  createdAt: string;
  approvedAt?: string;
  documentUrl?: string;
}

const DOCUMENT_TYPES = [
  { id: 'BONAFIDE', title: 'Bonafide Certificate', desc: 'Proof of enrollment for bank, passport, or bus pass' },
  { id: 'CONDUCT_CERTIFICATE', title: 'Conduct & Character Certificate', desc: 'Attestation of academic conduct and behavior' },
  { id: 'TRANSCRIPT', title: 'Official Academic Transcript', desc: 'Complete semester marksheet & transcript copy' },
  { id: 'MARKSHEET_COPY', title: 'Semester Marksheet Duplicate Copy', desc: 'Attested copy of semester examination marksheet' },
  { id: 'INTERNSHIP_LETTER', title: 'NOC / Internship Permission Letter', desc: 'Recommendation letter for external industry training' },
  { id: 'TC', title: 'Transfer Certificate (TC)', desc: 'Institutional transfer documentation' },
];

export const StudentDocuments: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'vault' | 'request' | 'track'>('vault');
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [search, setSearch] = useState('');

  // Request Form State
  const [selectedType, setSelectedType] = useState('BONAFIDE');
  const [purpose, setPurpose] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/workflows/requests');
      if (res.data?.status === 'success' || Array.isArray(res.data?.data)) {
        const list = res.data.data || [];
        setRequests(list.filter((r: any) => 
          ['BONAFIDE', 'CONDUCT_CERTIFICATE', 'TRANSCRIPT', 'MARKSHEET_COPY', 'INTERNSHIP_LETTER', 'TC', 'DOCUMENT'].includes(r.type)
        ));
      }
    } catch (err) {
      console.error('Failed to fetch document requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose.trim()) {
      toast.error('Please specify the reason/purpose for requesting this document.');
      return;
    }

    const typeObj = DOCUMENT_TYPES.find(t => t.id === selectedType);
    const title = typeObj ? typeObj.title : selectedType;

    try {
      setIsSubmitting(true);
      const res = await api.post('/workflows/requests', {
        type: selectedType,
        title,
        reason: `${purpose.trim()}${additionalDetails ? ` (${additionalDetails.trim()})` : ''}`,
      });

      if (res.data?.status === 'success') {
        toast.success('Document request submitted successfully! Tracking initiated.');
        setPurpose('');
        setAdditionalDetails('');
        setActiveTab('track');
        fetchRequests();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit document request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'APPROVED' || s === 'COMPLETED' || s === 'ISSUED') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
          <CheckCircle2 className="h-3 w-3" /> Approved & Issued
        </span>
      );
    }
    if (s.includes('REJECT')) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 w-fit">
          <XCircle className="h-3 w-3" /> Rejected
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 w-fit">
        <Clock className="h-3 w-3 animate-pulse" /> Pending Review ({status})
      </span>
    );
  };

  if (isLoading) return <Loading text="Loading Document Vault & Requests..." />;

  const approvedDocs = requests.filter(r => r.status === 'APPROVED' || r.status === 'COMPLETED' || r.status === 'ISSUED');

  return (
    <div className="space-y-6 text-left pb-16 animate-in fade-in duration-200">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <FolderOpen className="h-6 w-6 text-indigo-600" /> Student Documents Workspace
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Request official certificates, track workflow approvals, and download approved document files
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('request')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5 transition-all"
          >
            <Plus className="h-4 w-4" /> Request Document
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav aria-label="Document sections" className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('vault')}
          className={`pb-3 transition-colors border-b-2 ${activeTab === 'vault' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Approved Documents ({approvedDocs.length})
        </button>
        <button
          onClick={() => setActiveTab('track')}
          className={`pb-3 transition-colors border-b-2 ${activeTab === 'track' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Track Requests ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab('request')}
          className={`pb-3 transition-colors border-b-2 ${activeTab === 'request' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          New Document Request
        </button>
      </nav>

      {/* TAB 1: APPROVED DOCUMENTS VAULT */}
      {activeTab === 'vault' && (
        <div className="space-y-4">
          {approvedDocs.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center bg-card">
              <ShieldCheck className="mx-auto h-8 w-8 text-indigo-500 opacity-60" />
              <h3 className="mt-3 text-sm font-extrabold text-slate-800 dark:text-white">No Approved Documents Downloadable Yet</h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                Once your document requests are approved by administration or faculty, official signed files will appear here for instant download.
              </p>
              <button
                onClick={() => setActiveTab('request')}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl"
              >
                Submit First Request
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {approvedDocs.map((doc) => (
                <div key={doc.id} className="border bg-card p-4 rounded-2xl shadow-sm space-y-3 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 shrink-0">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-800 dark:text-white truncate">{doc.title}</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">Approved: {new Date(doc.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {getStatusBadge(doc.status)}
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl">
                    {doc.reason}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t">
                    <span className="text-[9px] font-mono font-bold text-slate-400">ID: {doc.id.slice(0, 8)}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          const targetUrl = doc.documentUrl || `/api/files/${doc.id}/download`;
                          toast.show(`Opening ${doc.title}...`, 'info');
                          const res = await downloadFile({ endpoint: targetUrl, filename: `${doc.title.replace(/\s+/g, '_')}.pdf`, action: 'open' });
                          if (res.success) {
                            toast.success(`Opened ${doc.title}`);
                          } else {
                            toast.error(res.error || 'Failed to open document');
                          }
                        }}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 transition-all"
                      >
                        <Eye className="h-3 w-3" /> Open
                      </button>
                      <button
                        onClick={async () => {
                          const targetUrl = doc.documentUrl || `/api/files/${doc.id}/download`;
                          toast.show(`Saving ${doc.title} to device...`, 'info');
                          const res = await downloadFile({ endpoint: targetUrl, filename: `${doc.title.replace(/\s+/g, '_')}.pdf`, action: 'save' });
                          if (res.success) {
                            toast.success(`Saved ${doc.title} to device successfully`);
                          } else {
                            toast.error(res.error || 'Failed to save document');
                          }
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-all border border-slate-700"
                      >
                        <Download className="h-3 w-3" /> Save to Device
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TRACK REQUESTS STATUS */}
      {activeTab === 'track' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Document Requests Workflow Trail</h3>
            <button onClick={fetchRequests} className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:underline">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh Status
            </button>
          </div>

          {requests.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-center bg-card text-xs text-slate-400">
              No active or previous document requests found.
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((r) => (
                <div key={r.id} className="border bg-card p-4 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[9px] font-black bg-indigo-100 text-indigo-700 rounded uppercase">{r.type}</span>
                      <h4 className="text-xs font-black text-slate-800 dark:text-white">{r.title}</h4>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">{r.reason}</p>
                    <p className="text-[10px] text-slate-400 font-semibold">Submitted on: {new Date(r.createdAt).toLocaleString()}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {getStatusBadge(r.status)}
                    {(r.status === 'APPROVED' || r.status === 'COMPLETED' || r.status === 'ISSUED') && (
                      <button
                        onClick={() => toast.success(`Downloading ${r.title}...`)}
                        className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center gap-1"
                      >
                        <Download className="h-3.5 w-3.5" /> Download
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: NEW DOCUMENT REQUEST FORM */}
      {activeTab === 'request' && (
        <div className="max-w-2xl mx-auto border bg-card p-6 rounded-2xl shadow-sm space-y-5">
          <div>
            <h3 className="text-sm font-black uppercase text-slate-800 dark:text-white">Apply for Official Document / Certificate</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Select certificate type and state the purpose for institutional authorization</p>
          </div>

          <form onSubmit={handleApply} className="space-y-4 text-xs font-semibold">
            <div>
              <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Select Document Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2.5 border rounded-xl bg-background outline-none font-bold text-xs"
              >
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.title} — {t.desc}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Reason / Purpose for Request</label>
              <input
                type="text"
                placeholder="e.g. Passport application, Educational loan, Higher studies admission"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-3 py-2.5 border rounded-xl bg-background outline-none text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Additional Details / Notes (Optional)</label>
              <textarea
                rows={3}
                placeholder="Provide any specific requirements or organization details..."
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
                className="w-full p-3 border rounded-xl bg-background outline-none text-xs resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            >
              {isSubmitting ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4" /> Submit Document Request
                </>
              )}
            </button>
          </form>
        </div>
      )}

    </div>
  );
};

export default StudentDocuments;
