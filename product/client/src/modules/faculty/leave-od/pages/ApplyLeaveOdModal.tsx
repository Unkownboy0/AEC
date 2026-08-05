import React, { useState } from 'react';
import { X, Send, AlertCircle, Calendar } from 'lucide-react';
import { submitFacultyLeaveOd } from '../api/facultyLeaveApi';
import { LeaveCategory, OdCategory, RequestType } from '../types/facultyLeave.types';

const LEAVE_CATEGORIES: LeaveCategory[] = [
  'Casual Leave', 'Medical Leave', 'Earned Leave', 'Emergency Leave',
  'Compensatory Leave', 'Maternity Leave', 'Paternity Leave', 'Half-Day Leave', 'Permission', 'Other Leave',
];

const OD_CATEGORIES: OdCategory[] = [
  'Examination Duty', 'Academic Duty', 'Conference', 'Workshop', 'Seminar',
  'Faculty Development Programme', 'Industrial Visit', 'Placement Duty', 'Admission Duty',
  'IQAC Duty', 'Research Presentation', 'University Duty', 'Official Meeting', 'Other On Duty',
];

interface ApplyLeaveOdModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const ApplyLeaveOdModal: React.FC<ApplyLeaveOdModalProps> = ({ onClose, onSuccess }) => {
  const [requestType, setRequestType] = useState<RequestType>('LEAVE');
  const [category, setCategory] = useState<string>('Casual Leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [totalDays, setTotalDays] = useState(1);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [contactNumber, setContactNumber] = useState('');
  const [supportingDocumentUrl, setSupportingDocumentUrl] = useState('');
  const [workHandoverDetails, setWorkHandoverDetails] = useState('');
  
  // OD specific
  const [eventName, setEventName] = useState('');
  const [organization, setOrganization] = useState('');
  const [venue, setVenue] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) {
      setError('Please fill in all required fields (dates, reason)');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const cleanDocUrl = supportingDocumentUrl && (supportingDocumentUrl.startsWith('http://') || supportingDocumentUrl.startsWith('https://'))
        ? supportingDocumentUrl
        : undefined;

      await submitFacultyLeaveOd({
        requestType,
        category,
        startDate,
        endDate,
        isHalfDay,
        totalDays: Number(totalDays) || 1,
        reason,
        description: description || undefined,
        isEmergency,
        contactNumber: contactNumber || undefined,
        supportingDocumentUrl: cleanDocUrl,
        workHandoverDetails: workHandoverDetails || undefined,
        eventName: requestType === 'OD' ? eventName : undefined,
        organization: requestType === 'OD' ? organization : undefined,
        venue: requestType === 'OD' ? venue : undefined,
      });

      onSuccess();
    } catch (err: any) {
      const serverErr = err?.response?.data?.error;
      const serverDetails = err?.response?.data?.details;
      let errorMsg = serverErr || err?.response?.data?.message || err?.message || 'Failed to submit request';
      if (serverDetails && typeof serverDetails === 'object') {
        const detailStr = Object.entries(serverDetails)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join('; ');
        errorMsg += ` (${detailStr})`;
      }
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }

  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 className="font-bold text-lg text-gray-900 dark:text-white">Apply for Leave / On-Duty</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Type Picker */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => { setRequestType('LEAVE'); setCategory('Casual Leave'); }}
              className={`py-3 rounded-xl font-bold text-sm border transition-all ${requestType === 'LEAVE' ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
            >
              🌴 Leave Application
            </button>
            <button
              type="button"
              onClick={() => { setRequestType('OD'); setCategory('Examination Duty'); }}
              className={`py-3 rounded-xl font-bold text-sm border transition-all ${requestType === 'OD' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
            >
              💼 On-Duty (OD)
            </button>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Category *</label>
            <select
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-gray-800"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              {(requestType === 'LEAVE' ? LEAVE_CATEGORIES : OD_CATEGORIES).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">From Date *</label>
              <input
                type="date"
                required
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">To Date *</label>
              <input
                type="date"
                required
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Total Days *</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800"
                value={totalDays}
                onChange={e => setTotalDays(Number(e.target.value))}
              />
            </div>
            <div className="flex items-center gap-3 pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                <input type="checkbox" checked={isHalfDay} onChange={e => setIsHalfDay(e.target.checked)} className="rounded" />
                Half-Day
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-red-600">
                <input type="checkbox" checked={isEmergency} onChange={e => setIsEmergency(e.target.checked)} className="rounded" />
                Emergency
              </label>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Reason *</label>
            <input
              type="text"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
              placeholder="e.g. Attending University Board Exam Valuation"
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>

          {/* OD Specific Fields */}
          {requestType === 'OD' && (
            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
              <h4 className="text-xs font-bold text-blue-900">OD Event Details</h4>
              <input
                type="text"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs"
                placeholder="Event Name (e.g. IEEE International Conference)"
                value={eventName}
                onChange={e => setEventName(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs"
                  placeholder="Organization"
                  value={organization}
                  onChange={e => setOrganization(e.target.value)}
                />
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs"
                  placeholder="Venue"
                  value={venue}
                  onChange={e => setVenue(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Work Handover & Contact */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Work Handover / Class Substitutions</label>
            <textarea
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-2 text-xs resize-none"
              placeholder="Details of classes handed over or substitute faculty details..."
              value={workHandoverDetails}
              onChange={e => setWorkHandoverDetails(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Supporting Document URL (Optional)</label>
            <input
              type="url"
              className="w-full border border-gray-200 rounded-xl px-4 py-2 text-xs"
              placeholder="https://drive.google.com/..."
              value={supportingDocumentUrl}
              onChange={e => setSupportingDocumentUrl(e.target.value)}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border text-xs font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            <Send className="w-3.5 h-3.5" />
            {submitting ? 'Submitting...' : 'Submit to HOD'}
          </button>
        </div>
      </div>
    </div>
  );
};
