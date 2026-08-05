import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock, XCircle, AlertTriangle, FileText, User, Building2, Calendar, ShieldCheck, Download } from 'lucide-react';
import { fetchFacultyRequestById } from '../api/facultyLeaveApi';
import { FacultyLeaveOdRequest } from '../types/facultyLeave.types';

export const FacultyLeaveDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<FacultyLeaveOdRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchFacultyRequestById(id)
      .then(setRequest)
      .catch(err => setError(err?.response?.data?.error ?? 'Request not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading request timeline...</div>;
  if (error || !request) return <div className="p-8 text-center text-red-500">{error ?? 'Request not found'}</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-gray-900">
        <ArrowLeft className="w-4 h-4" /> Back to My Requests
      </button>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-6 shadow-sm">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-black ${request.type === 'LEAVE' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                {request.type}
              </span>
              <span className="text-xs text-gray-400 font-mono">#{request.requestNumber || request.id.slice(0, 8)}</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{request.title}</h1>
            <p className="text-xs text-gray-500 mt-1">{request.reason}</p>
          </div>
          <div className="text-right">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {request.status}
            </span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-xs">
          <div>
            <p className="text-gray-400">From Date</p>
            <p className="font-bold text-gray-800 dark:text-gray-200">{new Date(request.startDate).toLocaleDateString('en-IN')}</p>
          </div>
          <div>
            <p className="text-gray-400">To Date</p>
            <p className="font-bold text-gray-800 dark:text-gray-200">{new Date(request.endDate).toLocaleDateString('en-IN')}</p>
          </div>
          <div>
            <p className="text-gray-400">Total Duration</p>
            <p className="font-bold text-gray-800 dark:text-gray-200">{request.totalDays} Day(s)</p>
          </div>
          <div>
            <p className="text-gray-400">Current Approver</p>
            <p className="font-bold text-blue-600">{request.currentStep}</p>
          </div>
        </div>

        {/* Handover & Substitute */}
        {request.workHandoverDetails && (
          <div className="p-4 border rounded-xl space-y-1">
            <p className="text-xs font-bold text-gray-700">Work Handover Instructions</p>
            <p className="text-xs text-gray-600">{request.workHandoverDetails}</p>
          </div>
        )}

        {/* Workflow Timeline (Database Backed) */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Real-time Approval Timeline
          </h3>

          <div className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-3 pl-6 space-y-6">
            {(request.history || []).map((h, idx) => (
              <div key={h.id || idx} className="relative">
                <span className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-white dark:ring-gray-900" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">{h.stage} Stage</span>
                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{h.action}</span>
                    {h.performedAsRole === 'ACTING_PRINCIPAL' && (
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        Vice Principal — Acting Principal
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{h.comment}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">By {h.actionByName} • {new Date(h.createdAt).toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyLeaveDetailPage;
