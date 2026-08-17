import React, { useState, useEffect, useCallback } from 'react';
import { X, Send, AlertCircle, Calendar, Users, Clock, Building2, BookOpen, MapPin, Sparkles, CheckCircle2, ChevronDown, UserCheck, RefreshCw, Layers } from 'lucide-react';
import { submitFacultyLeaveOd, fetchAffectedSessions, fetchAvailableSubstitutes } from '../api/facultyLeaveApi';
import { LeaveCategory, OdCategory, RequestType, AffectedClassSession, SubstituteCandidate } from '../types/facultyLeave.types';
import { minimumRequestDate, useRequestPolicy } from '../../../../shared/config/requestPolicy';

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
  const requestPolicy = useRequestPolicy();
  const [requestType, setRequestType] = useState<RequestType>('LEAVE');
  const [category, setCategory] = useState<string>('Casual Leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayPeriod, setHalfDayPeriod] = useState<'FIRST_HALF' | 'SECOND_HALF'>('FIRST_HALF');
  const [totalDays, setTotalDays] = useState(1);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [contactNumber, setContactNumber] = useState('');
  const [supportingDocumentUrl, setSupportingDocumentUrl] = useState('');
  
  // Dynamic Timetable State
  const [sessions, setSessions] = useState<AffectedClassSession[]>([]);
  const [loadingTimetable, setLoadingTimetable] = useState(false);
  const [timetableChecked, setTimetableChecked] = useState(false);
  const [nonWorkingDays, setNonWorkingDays] = useState<string[]>([]);
  const [noClassDays, setNoClassDays] = useState<string[]>([]);
  const [crossDeptExpanded, setCrossDeptExpanded] = useState<Record<string, boolean>>({});
  const [crossDeptCandidates, setCrossDeptCandidates] = useState<Record<string, SubstituteCandidate[]>>({});
  const [loadingCrossDept, setLoadingCrossDept] = useState<Record<string, boolean>>({});

  // OD specific
  const [eventName, setEventName] = useState('');
  const [organization, setOrganization] = useState('');
  const [venue, setVenue] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Auto-detect affected classes when dates or half-day toggle change
  const detectTimetable = useCallback(async () => {
    if (!startDate || !endDate) {
      setSessions([]);
      setTimetableChecked(false);
      return;
    }

    setLoadingTimetable(true);
    setError('');

    try {
      const res = await fetchAffectedSessions({
        startDate,
        endDate,
        isHalfDay,
        halfDayPeriod: isHalfDay ? halfDayPeriod : undefined,
      });

      setSessions(res.sessions || []);
      setNonWorkingDays(res.nonWorkingDays || []);
      setNoClassDays(res.noClassDays || []);
      setTimetableChecked(true);
    } catch (err: any) {
      console.error('Failed to load affected timetable', err);
      setError('Could not check timetable sessions. Please verify your selected dates.');
    } finally {
      setLoadingTimetable(false);
    }
  }, [startDate, endDate, isHalfDay, halfDayPeriod]);

  useEffect(() => {
    detectTimetable();
  }, [detectTimetable]);

  // Adjust total days on half-day toggle
  useEffect(() => {
    if (isHalfDay) {
      setTotalDays(0.5);
    } else if (startDate && endDate) {
      const d1 = new Date(startDate).getTime();
      const d2 = new Date(endDate).getTime();
      const diff = Math.max(1, Math.round((d2 - d1) / (1000 * 3600 * 24)) + 1);
      setTotalDays(diff);
    }
  }, [isHalfDay, startDate, endDate]);

  // Handle substitute selection for a session
  const handleSelectSubstitute = (sessionId: string, candidate: SubstituteCandidate) => {
    setSessions(prev =>
      prev.map(s => {
        if (s.sessionId === sessionId) {
          return {
            ...s,
            assignedSubstituteId: candidate.facultyId,
            assignedSubstituteName: candidate.name,
            assignedSubstituteDept: candidate.department.code,
            assignedSubstituteWorkload: candidate.workloadDisplay,
            subjectMatch: candidate.subjectMatchLabel,
          };
        }
        return s;
      })
    );
  };

  // Load cross-department eligible candidates on demand
  const handleLoadCrossDeptCandidates = async (session: AffectedClassSession) => {
    const sessionId = session.sessionId;
    setCrossDeptExpanded(prev => ({ ...prev, [sessionId]: !prev[sessionId] }));

    if (crossDeptCandidates[sessionId]) return; // Already cached

    setLoadingCrossDept(prev => ({ ...prev, [sessionId]: true }));
    try {
      const candidates = await fetchAvailableSubstitutes({
        date: session.date,
        periodStart: session.periodStart,
        periodEnd: session.periodEnd,
        departmentId: session.departmentId,
        subjectId: session.subjectId,
        includeCrossDept: true,
      });
      // Filter out candidates already in home pool to highlight cross-dept ones
      const crossOnly = candidates.filter(
        c => c.department.id !== session.departmentId
      );
      setCrossDeptCandidates(prev => ({ ...prev, [sessionId]: crossOnly }));
    } catch (err) {
      console.error('Failed to load cross-department substitutes', err);
    } finally {
      setLoadingCrossDept(prev => ({ ...prev, [sessionId]: false }));
    }
  };

  // Count unassigned sessions
  const unassignedCount = sessions.filter(s => !s.assignedSubstituteId).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) {
      setError('Please fill in all required fields (dates, reason)');
      return;
    }

    if (unassignedCount > 0) {
      setError(`${unassignedCount} affected session(s) still require an assigned substitute faculty.`);
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
        halfDayPeriod: isHalfDay ? halfDayPeriod : undefined,
        totalDays: Number(totalDays) || 1,
        reason,
        description: description || undefined,
        isEmergency,
        contactNumber: contactNumber || undefined,
        supportingDocumentUrl: cleanDocUrl,
        substitutionsList: sessions,
        affectedPeriods: sessions,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92dvh] border border-gray-100 dark:border-gray-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-850">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white">Apply for Leave / On-Duty</h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Timetable-aware leave & department-wise substitution</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Type Picker */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => { setRequestType('LEAVE'); setCategory('Casual Leave'); }}
              className={`py-2.5 rounded-xl font-bold text-xs sm:text-sm border transition-all flex items-center justify-center gap-2 ${
                requestType === 'LEAVE'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-400/20'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>🌴</span> Leave Application
            </button>
            <button
              type="button"
              onClick={() => { setRequestType('OD'); setCategory('Examination Duty'); }}
              className={`py-2.5 rounded-xl font-bold text-xs sm:text-sm border transition-all flex items-center justify-center gap-2 ${
                requestType === 'OD'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-400/20'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>💼</span> On-Duty (OD)
            </button>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Category *</label>
            <select
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              {(requestType === 'LEAVE' ? LEAVE_CATEGORIES : OD_CATEGORIES).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">From Date *</label>
              <input
                type="date"
                required
                min={minimumRequestDate(requestType, requestPolicy)}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value);
                  if (!endDate || endDate < e.target.value) {
                    setEndDate(e.target.value);
                  }
                }}
              />
              {requestType === 'OD' && (
                <p className="text-[10px] text-gray-400 mt-1">OD requests require min {requestPolicy.odMinAdvanceDays} days advance notice.</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">To Date *</label>
              <input
                type="date"
                required
                min={startDate || minimumRequestDate(requestType, requestPolicy)}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Total Days & Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Total Days *</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                value={totalDays}
                onChange={e => setTotalDays(Number(e.target.value))}
              />
            </div>
            <div className="flex items-center gap-4 pt-1 sm:pt-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={isHalfDay}
                  onChange={e => setIsHalfDay(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                Half-Day
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-red-600">
                <input
                  type="checkbox"
                  checked={isEmergency}
                  onChange={e => setIsEmergency(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500"
                />
                Emergency
              </label>
            </div>
          </div>

          {/* Half-Day Period Selector */}
          {isHalfDay && (
            <div className="p-3 bg-purple-50/70 dark:bg-purple-950/30 rounded-xl border border-purple-100 dark:border-purple-900/50 flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-purple-900 dark:text-purple-300">Half-Day Session:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setHalfDayPeriod('FIRST_HALF')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    halfDayPeriod === 'FIRST_HALF'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border'
                  }`}
                >
                  🌅 First Half (Morning)
                </button>
                <button
                  type="button"
                  onClick={() => setHalfDayPeriod('SECOND_HALF')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    halfDayPeriod === 'SECOND_HALF'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border'
                  }`}
                >
                  🌇 Second Half (Afternoon)
                </button>
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Reason *</label>
            <input
              type="text"
              required
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="e.g. Attending University Board Exam Valuation"
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>

          {/* OD Specific Fields */}
          {requestType === 'OD' && (
            <div className="p-4 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/50 space-y-3">
              <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> OD Event Details
              </h4>
              <input
                type="text"
                className="w-full border border-blue-200 dark:border-blue-800/60 rounded-xl px-3 py-2 text-xs bg-white dark:bg-gray-800"
                placeholder="Event Name (e.g. IEEE International Conference)"
                value={eventName}
                onChange={e => setEventName(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  className="w-full border border-blue-200 dark:border-blue-800/60 rounded-xl px-3 py-2 text-xs bg-white dark:bg-gray-800"
                  placeholder="Organization"
                  value={organization}
                  onChange={e => setOrganization(e.target.value)}
                />
                <input
                  type="text"
                  className="w-full border border-blue-200 dark:border-blue-800/60 rounded-xl px-3 py-2 text-xs bg-white dark:bg-gray-800"
                  placeholder="Venue"
                  value={venue}
                  onChange={e => setVenue(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* AFFECTED CLASSES & SUBSTITUTE FACULTY (AUTO TIMETABLE) */}
          {/* ======================================================== */}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                    Affected Classes & Substitute Faculty
                  </h3>
                  <p className="text-[10px] text-gray-400">
                    Automatically detected from your published timetable Revision
                  </p>
                </div>
              </div>

              {sessions.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 border border-indigo-200 dark:border-indigo-800">
                  {sessions.length} Session(s) Affected
                </span>
              )}
            </div>

            {/* Loading State */}
            {loadingTimetable && (
              <div className="p-5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-center gap-3 text-xs text-gray-500">
                <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
                <span>Checking your published timetable...</span>
              </div>
            )}

            {/* No Date Selected State */}
            {!startDate && !loadingTimetable && (
              <div className="p-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 text-center text-xs text-gray-400">
                Select leave dates above to detect your affected academic periods.
              </div>
            )}

            {/* Non-working day feedback */}
            {!loadingTimetable && timetableChecked && sessions.length === 0 && nonWorkingDays.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>No scheduled academic sessions are affected on this date (Sunday / Non-working Day).</span>
              </div>
            )}

            {/* No class on working day feedback */}
            {!loadingTimetable && timetableChecked && sessions.length === 0 && noClassDays.length > 0 && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>No timetable sessions are assigned to you for the selected date. Leave can proceed directly.</span>
              </div>
            )}

            {/* Affected Sessions Card List */}
            {!loadingTimetable && sessions.length > 0 && (
              <div className="space-y-3">
                {sessions.map((sess, idx) => {
                  const isCrossExpanded = crossDeptExpanded[sess.sessionId];
                  const extraCandidates = crossDeptCandidates[sess.sessionId] || [];
                  const isCrossLoading = loadingCrossDept[sess.sessionId];

                  return (
                    <div
                      key={sess.sessionId || idx}
                      className="p-4 rounded-2xl border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-850 shadow-sm space-y-3 hover:border-purple-300 dark:hover:border-purple-700 transition-all"
                    >
                      {/* Session Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800">
                            {sess.periodDisplay}
                          </span>
                          <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            {sess.startTime} – {sess.endTime}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                            {new Date(sess.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            sess.isLab ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          }`}>
                            {sess.slotType}
                          </span>
                        </div>
                      </div>

                      {/* Class & Subject Details */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800/60">
                          <p className="text-[10px] font-semibold text-gray-400 uppercase">Owning Dept</p>
                          <p className="font-bold text-gray-800 dark:text-gray-200 truncate" title={sess.departmentName}>
                            {sess.departmentCode || sess.departmentName}
                          </p>
                        </div>
                        <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800/60">
                          <p className="text-[10px] font-semibold text-gray-400 uppercase">Class / Sec</p>
                          <p className="font-bold text-gray-800 dark:text-gray-200 truncate">
                            {sess.sectionName || 'All Students'}
                          </p>
                        </div>
                        <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800/60">
                          <p className="text-[10px] font-semibold text-gray-400 uppercase">Subject</p>
                          <p className="font-bold text-gray-800 dark:text-gray-200 truncate" title={sess.subjectName}>
                            {sess.subjectName}
                          </p>
                        </div>
                        <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800/60">
                          <p className="text-[10px] font-semibold text-gray-400 uppercase">Venue</p>
                          <p className="font-bold text-gray-800 dark:text-gray-200 truncate flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5 text-gray-400" />
                            {sess.venue || 'Classroom'}
                          </p>
                        </div>
                      </div>

                      {/* Department-wise Substitute Selector */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                            Substitute Faculty ({sess.departmentCode || sess.departmentName} Pool) *
                          </label>
                          {sess.assignedSubstituteWorkload && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              Load: {sess.assignedSubstituteWorkload} • {sess.subjectMatch || 'Available'}
                            </span>
                          )}
                        </div>

                        {/* Dropdown for Department Candidates */}
                        {sess.eligibleSubstitutes && sess.eligibleSubstitutes.length > 0 ? (
                          <div className="relative">
                            <select
                              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                              value={sess.assignedSubstituteId || ''}
                              onChange={e => {
                                const cand = [...sess.eligibleSubstitutes, ...extraCandidates].find(
                                  c => c.facultyId === e.target.value
                                );
                                if (cand) handleSelectSubstitute(sess.sessionId, cand);
                              }}
                            >
                              <option value="">-- Select Available Substitute --</option>
                              {sess.eligibleSubstitutes.map(c => (
                                <option key={c.facultyId} value={c.facultyId}>
                                  {c.name} ({c.department.code}) — {c.subjectMatchLabel} [{c.workloadDisplay}]
                                </option>
                              ))}
                              {extraCandidates.map(c => (
                                <option key={c.facultyId} value={c.facultyId}>
                                  🌐 {c.name} ({c.department.code}) — Cross-Dept [{c.workloadDisplay}]
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs border border-amber-200 dark:border-amber-900/50 flex items-center justify-between">
                            <span>No available faculty in {sess.departmentCode || 'this department'} for this period.</span>
                          </div>
                        )}

                        {/* Secondary Action: Cross-Department Substitute Toggle */}
                        <div className="pt-1 flex items-center justify-between text-[11px]">
                          <button
                            type="button"
                            onClick={() => handleLoadCrossDeptCandidates(sess)}
                            className="text-purple-600 dark:text-purple-400 hover:text-purple-700 font-semibold flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3" />
                            {isCrossExpanded ? 'Hide Cross-Department Options' : 'Show Eligible Faculty from Other Departments'}
                          </button>
                        </div>

                        {/* Cross-Department Candidate Cards */}
                        {isCrossExpanded && (
                          <div className="p-3 bg-purple-50/40 dark:bg-purple-950/20 rounded-xl border border-purple-100 dark:border-purple-900/40 space-y-2 mt-2">
                            <p className="text-[10px] font-bold text-purple-900 dark:text-purple-300 uppercase">
                              Available Cross-Department Candidates:
                            </p>
                            {isCrossLoading && (
                              <p className="text-xs text-gray-400">Loading cross-department candidates...</p>
                            )}
                            {!isCrossLoading && extraCandidates.length === 0 && (
                              <p className="text-xs text-gray-400">No free faculty available in other departments.</p>
                            )}
                            {!isCrossLoading && extraCandidates.map(cand => (
                              <div
                                key={cand.facultyId}
                                onClick={() => handleSelectSubstitute(sess.sessionId, cand)}
                                className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between text-xs transition-all ${
                                  sess.assignedSubstituteId === cand.facultyId
                                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:border-purple-400'
                                }`}
                              >
                                <div>
                                  <p className="font-bold">{cand.name}</p>
                                  <p className="text-[10px] opacity-80">{cand.department.name} • {cand.designation}</p>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-black/10 font-mono">
                                    {cand.workloadDisplay}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Supporting Document & Optional Fields */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Supporting Document URL (Optional)</label>
            <input
              type="url"
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="https://drive.google.com/..."
              value={supportingDocumentUrl}
              onChange={e => setSupportingDocumentUrl(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Emergency Contact Number (Optional)</label>
            <input
              type="tel"
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="+91 98765 43210"
              value={contactNumber}
              onChange={e => setContactNumber(e.target.value)}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900">
          <div className="text-[11px] text-gray-400">
            {sessions.length > 0 ? (
              unassignedCount > 0 ? (
                <span className="text-red-500 font-semibold">{unassignedCount} period(s) require substitute faculty</span>
              ) : (
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> All substitutions assigned
                </span>
              )
            ) : (
              <span>Standard workflow</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || (sessions.length > 0 && unassignedCount > 0)}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-purple-500/20"
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? 'Submitting...' : 'Submit to HOD'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyLeaveOdModal;
