import React, { useState } from 'react';
import { Plus, RefreshCw, FileText, Send, Users, Globe } from 'lucide-react';
import { useCirculars } from '../hooks/useCirculars';
import { CircularCard } from '../components/CircularCard';
import { CircularDetail } from '../components/CircularDetail';
import { createCircular } from '../api/circularApi';
import { Circular, CreateCircularPayload, CircularCategory, CircularPriority, BroadcastLevel } from '../types/circular.types';
import { PriorityBadge, CategoryBadge } from '../components/CircularBadge';

const CATEGORIES: CircularCategory[] = [
  'GENERAL', 'ACADEMIC', 'EXAMINATION', 'ADMISSION', 'IQAC',
  'PLACEMENT', 'INTERNSHIP', 'FEES', 'TRANSPORT', 'EMERGENCY', 'EVENT',
];

const BROADCAST_OPTIONS: { value: BroadcastLevel; label: string; description: string }[] = [
  { value: 'ALL_CAMPUS', label: 'Entire Institution', description: 'All students, faculty, and staff' },
  { value: 'FACULTY_ONLY', label: 'Faculty & Staff Only', description: 'All teaching and non-teaching staff' },
  { value: 'STUDENT_ONLY', label: 'All Students', description: 'All enrolled students' },
  { value: 'HOD_ONLY', label: 'All HODs', description: 'Department heads only' },
  { value: 'MENTOR_ONLY', label: 'All Mentors', description: 'Faculty with mentor role' },
  { value: 'DEPARTMENT_SPECIFIC', label: 'Specific Departments', description: 'Selected departments only' },
  { value: 'SELECTED_USERS', label: 'Selected Users', description: 'Manually chosen individuals' },
];

const emptyForm = (): CreateCircularPayload => ({
  title: '',
  category: 'GENERAL',
  priority: 'NORMAL',
  description: '',
  content: '',
  broadcastLevel: 'ALL_CAMPUS',
  targetDepartments: [],
  targetRoles: [],
  targetYears: [],
  targetSemesters: [],
  targetSections: [],
  selectedUserIds: [],
  attachmentUrl: '',
  attachmentName: '',
  referenceLink: '',
  isPinned: false,
  isEmergency: false,
  acknowledgementRequired: false,
});

export const PrincipalCircularsPage: React.FC = () => {
  const { circulars, loading, error, refresh, acknowledge } = useCirculars();
  const [selected, setSelected] = useState<Circular | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateCircularPayload>(emptyForm());
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [acknowledging, setAcknowledging] = useState(false);

  const handleAcknowledge = async (id: string) => {
    setAcknowledging(true);
    await acknowledge(id);
    setAcknowledging(false);
  };

  const handlePublish = async () => {
    setPublishing(true);
    setPublishError('');
    try {
      await createCircular(form);
      setShowCreate(false);
      setForm(emptyForm());
      refresh();
    } catch (err: any) {
      const serverError = err?.response?.data;
      if (serverError?.details) {
        const detailsStr = Object.entries(serverError.details)
          .map(([field, errs]: [string, any]) => `${field}: ${(errs as string[]).join(', ')}`)
          .join(' | ');
        setPublishError(`Validation Error — ${detailsStr}`);
      } else {
        setPublishError(serverError?.error ?? err?.message ?? 'Failed to publish');
      }
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Circulars</h1>
          <p className="text-xs text-gray-400">Principal · Institution-wide</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refresh} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <RefreshCw className="w-5 h-5 text-gray-500" />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 active:scale-[0.97] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Circular</span>
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {loading && <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-28 rounded-2xl bg-gray-100 animate-pulse" />)}</div>}
        {error && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-3">{error}</p>
            <button onClick={refresh} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold">Retry</button>
          </div>
        )}
        {!loading && !error && circulars.length === 0 && (
          <div className="text-center py-16">
            <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No circulars published yet</p>
          </div>
        )}
        {!loading && circulars.length > 0 && (
          <div className="space-y-3">
            {circulars.map(c => <CircularCard key={c.id} circular={c} onClick={setSelected} onAcknowledge={handleAcknowledge} />)}
          </div>
        )}
      </div>

      {/* Detail Sheet */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full sm:max-w-2xl sm:mx-4 sm:rounded-2xl max-h-[90vh] rounded-t-2xl overflow-hidden shadow-2xl">
            <CircularDetail circular={selected} onClose={() => setSelected(null)} onAcknowledge={handleAcknowledge} acknowledging={acknowledging} />
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full sm:max-w-lg sm:mx-4 bg-white dark:bg-gray-900 sm:rounded-2xl rounded-t-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 dark:text-white">New Institution Circular</h2>
              <button onClick={() => setShowCreate(false)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400 text-xl">×</button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              <input
                type="text"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Circular title *"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  className="border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value as CircularCategory }))}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                  className="border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  value={form.priority}
                  onChange={e => setForm(f => ({ ...f, priority: e.target.value as CircularPriority }))}
                >
                  {['LOW', 'NORMAL', 'HIGH', 'URGENT'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              {/* Broadcast Level */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Target Audience</label>
                <div className="space-y-2">
                  {BROADCAST_OPTIONS.map(opt => (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        form.broadcastLevel === opt.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="broadcastLevel"
                        value={opt.value}
                        checked={form.broadcastLevel === opt.value}
                        onChange={() => setForm(f => ({ ...f, broadcastLevel: opt.value }))}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{opt.label}</p>
                        <p className="text-xs text-gray-500">{opt.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <textarea
                rows={5}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="Circular content *"
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              />
              <div className="flex gap-3 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isPinned} onChange={e => setForm(f => ({ ...f, isPinned: e.target.checked }))} className="rounded" />
                  <span className="text-sm text-gray-600">📌 Pin</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isEmergency} onChange={e => setForm(f => ({ ...f, isEmergency: e.target.checked }))} className="rounded" />
                  <span className="text-sm text-red-600">🚨 Emergency</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.acknowledgementRequired} onChange={e => setForm(f => ({ ...f, acknowledgementRequired: e.target.checked }))} className="rounded" />
                  <span className="text-sm text-gray-600">Require Ack</span>
                </label>
              </div>
              {publishError && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2 border border-red-100">{publishError}</p>}
            </div>
            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={handlePublish}
                disabled={publishing || !form.title.trim() || !form.content.trim()}
                className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                {publishing ? 'Publishing...' : 'Publish Institution Circular'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrincipalCircularsPage;
