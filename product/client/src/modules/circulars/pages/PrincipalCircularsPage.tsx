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

const DEPARTMENTS_LIST = [
  { id: 'cse', name: 'Computer Science & Engineering', code: 'CSE' },
  { id: 'it', name: 'Information Technology', code: 'IT' },
  { id: 'ece', name: 'Electronics & Comm. Engg', code: 'ECE' },
  { id: 'eee', name: 'Electrical & Electronics Engg', code: 'EEE' },
  { id: 'mech', name: 'Mechanical Engineering', code: 'MECH' },
  { id: 'civil', name: 'Civil Engineering', code: 'CIVIL' },
  { id: 'aiml', name: 'AI & Machine Learning', code: 'AIML' },
  { id: 'aids', name: 'AI & Data Science', code: 'AIDS' },
  { id: 'mba', name: 'Master of Business Admin (MBA)', code: 'MBA' },
  { id: 'mca', name: 'Master of Computer Applications (MCA)', code: 'MCA' },
  { id: 'sh', name: 'Science & Humanities', code: 'S&H' },
];

export const PrincipalCircularsPage: React.FC = () => {
  const { circulars, loading, error, refresh, acknowledge } = useCirculars();
  const [selected, setSelected] = useState<Circular | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateCircularPayload>(emptyForm());
  const [userTagInput, setUserTagInput] = useState('');
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
      const payload: CreateCircularPayload = {
        ...form,
        attachmentUrl: form.attachmentUrl?.trim() || undefined,
        attachmentName: form.attachmentName?.trim() || undefined,
        referenceLink: form.referenceLink?.trim() || undefined,
        description: form.description?.trim() || undefined,
        targetDepartments: form.targetDepartments || [],
        selectedUserIds: form.selectedUserIds || [],
      };
      await createCircular(payload);
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs">
          <div className="w-full sm:max-w-lg sm:mx-4 bg-surface sm:rounded-2xl rounded-t-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-modal border border-border">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-bold text-text-primary">New Institution Circular</h2>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-xl hover:bg-surface-soft transition-colors text-text-muted hover:text-text-primary text-xl">×</button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <input
                type="text"
                className="w-full bg-surface-soft border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Circular title *"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  className="bg-surface-soft border border-border rounded-xl px-3 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value as CircularCategory }))}
                >
                  {CATEGORIES.map(c => <option key={c} value={c} className="bg-surface text-text-primary">{c}</option>)}
                </select>
                <select
                  className="bg-surface-soft border border-border rounded-xl px-3 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  value={form.priority}
                  onChange={e => setForm(f => ({ ...f, priority: e.target.value as CircularPriority }))}
                >
                  {['LOW', 'NORMAL', 'HIGH', 'URGENT'].map(p => <option key={p} value={p} className="bg-surface text-text-primary">{p}</option>)}
                </select>
              </div>
              {/* Broadcast Level */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-2">Target Audience</label>
                <div className="space-y-2">
                  {BROADCAST_OPTIONS.map(opt => (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        form.broadcastLevel === opt.value ? 'border-primary bg-primary-soft/50' : 'border-border bg-surface-soft hover:border-primary/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="broadcastLevel"
                        value={opt.value}
                        checked={form.broadcastLevel === opt.value}
                        onChange={() => setForm(f => ({ ...f, broadcastLevel: opt.value }))}
                        className="mt-0.5 accent-primary"
                      />
                      <div>
                        <p className="text-xs font-bold text-text-primary">{opt.label}</p>
                        <p className="text-[11px] text-text-muted mt-0.5">{opt.description}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Conditional Target Department Selection */}
                {form.broadcastLevel === 'DEPARTMENT_SPECIFIC' && (
                  <div className="mt-3 p-3.5 bg-surface-soft border border-border rounded-xl space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-border/60 pb-2">
                      <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                        Select Departments ({(form.targetDepartments || []).length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setForm(f => ({
                          ...f,
                          targetDepartments: (f.targetDepartments || []).length === DEPARTMENTS_LIST.map(d => d.id).length ? [] : DEPARTMENTS_LIST.map(d => d.id)
                        }))}
                        className="text-[11px] font-bold text-primary hover:underline"
                      >
                        {(form.targetDepartments || []).length === DEPARTMENTS_LIST.length ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {DEPARTMENTS_LIST.map(dept => {
                        const isChecked = (form.targetDepartments || []).includes(dept.id);
                        return (
                          <label
                            key={dept.id}
                            className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                              isChecked
                                ? 'border-primary bg-primary-soft/40 text-primary font-bold'
                                : 'border-border bg-surface text-text-secondary hover:border-primary/40'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setForm(f => {
                                  const currentDepts = f.targetDepartments || [];
                                  return {
                                    ...f,
                                    targetDepartments: isChecked
                                      ? currentDepts.filter(id => id !== dept.id)
                                      : [...currentDepts, dept.id]
                                  };
                                });
                              }}
                              className="accent-primary"
                            />
                            <span className="truncate">{dept.code} - {dept.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Conditional Selected Users Input */}
                {form.broadcastLevel === 'SELECTED_USERS' && (
                  <div className="mt-3 p-3.5 bg-surface-soft border border-border rounded-xl space-y-2.5 animate-in fade-in duration-200">
                    <span className="text-xs font-bold text-text-primary uppercase tracking-wider block">
                      Specific Recipients ({(form.selectedUserIds || []).length})
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={userTagInput}
                        onChange={e => setUserTagInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (userTagInput.trim()) {
                              const val = userTagInput.trim();
                              const currentUsers = form.selectedUserIds || [];
                              if (!currentUsers.includes(val)) {
                                setForm(f => ({ ...f, selectedUserIds: [...(f.selectedUserIds || []), val] }));
                              }
                              setUserTagInput('');
                            }
                          }
                        }}
                        placeholder="Type User ID or Email and press Enter"
                        className="flex-1 bg-surface border border-border rounded-xl px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (userTagInput.trim()) {
                            const val = userTagInput.trim();
                            const currentUsers = form.selectedUserIds || [];
                            if (!currentUsers.includes(val)) {
                              setForm(f => ({ ...f, selectedUserIds: [...(f.selectedUserIds || []), val] }));
                            }
                            setUserTagInput('');
                          }
                        }}
                        className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary-hover transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    {(form.selectedUserIds || []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1 max-h-36 overflow-y-auto">
                        {(form.selectedUserIds || []).map(uid => (
                          <span
                            key={uid}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-soft text-primary text-xs font-bold border border-primary/20"
                          >
                            <span>{uid}</span>
                            <button
                              type="button"
                              onClick={() => setForm(f => ({ ...f, selectedUserIds: (f.selectedUserIds || []).filter(id => id !== uid) }))}
                              className="hover:text-danger text-xs font-bold"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <textarea
                rows={5}
                className="w-full bg-surface-soft border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Circular content *"
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              />
              <div className="flex gap-4 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isPinned} onChange={e => setForm(f => ({ ...f, isPinned: e.target.checked }))} className="rounded accent-primary" />
                  <span className="text-xs font-medium text-text-secondary">📌 Pin to Top</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isEmergency} onChange={e => setForm(f => ({ ...f, isEmergency: e.target.checked }))} className="rounded accent-danger" />
                  <span className="text-xs font-medium text-danger">🚨 Emergency</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.acknowledgementRequired} onChange={e => setForm(f => ({ ...f, acknowledgementRequired: e.target.checked }))} className="rounded accent-primary" />
                  <span className="text-xs font-medium text-text-secondary">Require Ack</span>
                </label>
              </div>
              {publishError && <p className="text-xs text-danger bg-danger-light rounded-xl px-4 py-2.5 border border-danger/20 font-medium">{publishError}</p>}
            </div>
            <div className="px-5 py-4 border-t border-border">
              <button
                onClick={handlePublish}
                disabled={publishing || !form.title.trim() || !form.content.trim()}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary-hover active:scale-[0.98] transition-all disabled:opacity-60"
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
