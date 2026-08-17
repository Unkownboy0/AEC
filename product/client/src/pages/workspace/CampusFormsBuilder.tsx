import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, GripVertical, ChevronDown, Eye, BarChart3,
  Download, Share2, Loader2, CheckCircle2, AlertCircle, Send, Link as LinkIcon,
  AlignJustify, ToggleLeft, Star, List, Hash, Type, Mail, Phone, Calendar,
  FileUp, CheckSquare, CircleDot
} from 'lucide-react';
import { workspaceApi, WorkspaceDocumentDetail, downloadBlob } from '../../services/workspace.api';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../components/ui/Toast';

// ─── Types ───────────────────────────────────────────────────────────────────

type QuestionType =
  | 'SHORT_TEXT' | 'LONG_TEXT' | 'NUMBER' | 'EMAIL' | 'PHONE' | 'DATE'
  | 'CHOICE' | 'CHECKBOX' | 'DROPDOWN' | 'RATING' | 'FILE_UPLOAD';

interface FormQuestion {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  options?: string[];
  maxRating?: number;
  validationMin?: number;
  validationMax?: number;
  placeholder?: string;
  logic?: { if_answer: string; jump_to: string };
}

interface FormSettings {
  requiresLogin: boolean;
  limitResponses: boolean;
  maxResponses?: number;
  isAnonymous: boolean;
  openAt?: string;
  closeAt?: string;
  confirmationMessage?: string;
  allowEdit?: boolean;
}

interface FormContent {
  questions: FormQuestion[];
  settings: FormSettings;
  title?: string;
  description?: string;
}

const QUESTION_TYPES: Array<{ type: QuestionType; label: string; icon: React.ElementType }> = [
  { type: 'SHORT_TEXT', label: 'Short Text', icon: Type },
  { type: 'LONG_TEXT', label: 'Long Text', icon: AlignJustify },
  { type: 'NUMBER', label: 'Number', icon: Hash },
  { type: 'EMAIL', label: 'Email', icon: Mail },
  { type: 'PHONE', label: 'Phone', icon: Phone },
  { type: 'DATE', label: 'Date', icon: Calendar },
  { type: 'CHOICE', label: 'Multiple Choice', icon: CircleDot },
  { type: 'CHECKBOX', label: 'Checkboxes', icon: CheckSquare },
  { type: 'DROPDOWN', label: 'Dropdown', icon: ChevronDown },
  { type: 'RATING', label: 'Rating', icon: Star },
  { type: 'FILE_UPLOAD', label: 'File Upload', icon: FileUp },
];

// ─── Question Editor ──────────────────────────────────────────────────────────

const QuestionEditor: React.FC<{
  q: FormQuestion;
  index: number;
  onChange: (updates: Partial<FormQuestion>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}> = ({ q, index, onChange, onDelete, onDuplicate }) => {
  const Icon = QUESTION_TYPES.find((t) => t.type === q.type)?.icon || Type;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
        <GripVertical size={16} className="text-gray-400 cursor-grab" />
        <span className="text-xs font-medium text-gray-500">Q{index + 1}</span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Icon size={14} className="text-blue-500" />
          <select
            value={q.type}
            onChange={(e) => onChange({ type: e.target.value as QuestionType })}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white outline-none focus:border-blue-400 cursor-pointer"
          >
            {QUESTION_TYPES.map((t) => (
              <option key={t.type} value={t.type}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={q.required}
              onChange={(e) => onChange({ required: e.target.checked })}
              className="rounded accent-blue-600"
            />
            Required
          </label>
          <button onClick={onDuplicate} className="text-xs text-blue-500 hover:text-blue-700 transition-colors">Copy</button>
          <button onClick={onDelete} className="text-xs text-red-500 hover:text-red-700 transition-colors">Delete</button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Question Title */}
        <input
          type="text"
          value={q.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Question text"
          className="w-full text-sm font-medium text-gray-800 outline-none border-b border-transparent focus:border-blue-400 pb-1 transition-colors"
        />

        {/* Description */}
        <input
          type="text"
          value={q.description || ''}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Description (optional)"
          className="w-full text-xs text-gray-500 outline-none"
        />

        {/* Options for CHOICE/CHECKBOX/DROPDOWN */}
        {['CHOICE', 'CHECKBOX', 'DROPDOWN'].includes(q.type) && (
          <div className="space-y-2">
            {(q.options || ['Option 1']).map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const opts = [...(q.options || [])];
                    opts[idx] = e.target.value;
                    onChange({ options: opts });
                  }}
                  className="flex-1 text-sm outline-none border-b border-transparent hover:border-gray-300 focus:border-blue-400 pb-0.5 transition-colors"
                />
                <button
                  onClick={() => {
                    const opts = (q.options || []).filter((_, i) => i !== idx);
                    onChange({ options: opts });
                  }}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            <button
              onClick={() => onChange({ options: [...(q.options || []), `Option ${(q.options || []).length + 1}`] })}
              className="text-xs text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
            >
              <Plus size={12} /> Add option
            </button>
          </div>
        )}

        {/* Rating */}
        {q.type === 'RATING' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Max rating:</span>
            <select
              value={q.maxRating || 5}
              onChange={(e) => onChange({ maxRating: parseInt(e.target.value) })}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none"
            >
              {[3, 4, 5, 7, 10].map((n) => <option key={n} value={n}>{n} stars</option>)}
            </select>
            <div className="flex gap-0.5">
              {Array.from({ length: q.maxRating || 5 }, (_, i) => (
                <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />
              ))}
            </div>
          </div>
        )}

        {/* Placeholder for text types */}
        {['SHORT_TEXT', 'LONG_TEXT', 'NUMBER', 'EMAIL', 'PHONE'].includes(q.type) && (
          <input
            type="text"
            value={q.placeholder || ''}
            onChange={(e) => onChange({ placeholder: e.target.value })}
            placeholder="Placeholder text (optional)"
            className="w-full text-xs text-gray-400 outline-none border border-dashed border-gray-200 rounded-lg px-2 py-1"
          />
        )}
      </div>
    </div>
  );
};

// ─── Form Response Preview ────────────────────────────────────────────────────

const FormResponsePreview: React.FC<{ content: FormContent; formId: string; onClose: () => void }> = ({ content, formId, onClose }) => {
  const { user } = useAuth();
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const setAnswer = (qId: string, val: any) => setAnswers((prev) => ({ ...prev, [qId]: val }));

  const handleSubmit = async () => {
    // Validate required
    const missing = content.questions.filter((q) => q.required && !answers[q.id]);
    if (missing.length > 0) {
      toast.error(`Please answer required questions: ${missing.map((q) => q.title).join(', ')}`);
      return;
    }
    setSubmitting(true);
    try {
      await workspaceApi.submitFormResponse(formId, answers);
      setSubmitted(true);
      toast.success('Response submitted!');
    } catch {
      toast.error('Failed to submit response.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <CheckCircle2 size={48} className="text-green-500" />
        <h2 className="text-xl font-bold text-gray-800">Response submitted!</h2>
        <p className="text-sm text-gray-500">{content.settings.confirmationMessage || 'Thank you for your response.'}</p>
        <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition-colors">Close Preview</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-4">
      <div className="bg-blue-600 text-white rounded-2xl p-6">
        <h1 className="text-xl font-bold">{content.title || 'Untitled Form'}</h1>
        {content.description && <p className="text-blue-100 text-sm mt-1">{content.description}</p>}
      </div>
      {content.questions.map((q) => (
        <div key={q.id} className="bg-white rounded-2xl border border-gray-200 p-5">
          <label className="block text-sm font-medium text-gray-800 mb-2">
            {q.title}
            {q.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {q.description && <p className="text-xs text-gray-500 mb-3">{q.description}</p>}
          {q.type === 'SHORT_TEXT' && <input type="text" onChange={(e) => setAnswer(q.id, e.target.value)} placeholder={q.placeholder} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400" />}
          {q.type === 'LONG_TEXT' && <textarea rows={3} onChange={(e) => setAnswer(q.id, e.target.value)} placeholder={q.placeholder} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none" />}
          {q.type === 'NUMBER' && <input type="number" onChange={(e) => setAnswer(q.id, e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400" />}
          {q.type === 'EMAIL' && <input type="email" onChange={(e) => setAnswer(q.id, e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400" />}
          {q.type === 'DATE' && <input type="date" onChange={(e) => setAnswer(q.id, e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400" />}
          {q.type === 'CHOICE' && (q.options || []).map((opt) => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer mb-2">
              <input type="radio" name={q.id} onChange={() => setAnswer(q.id, opt)} className="accent-blue-600" />
              <span className="text-sm">{opt}</span>
            </label>
          ))}
          {q.type === 'CHECKBOX' && (q.options || []).map((opt) => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer mb-2">
              <input type="checkbox" onChange={(e) => {
                const prev = answers[q.id] || [];
                setAnswer(q.id, e.target.checked ? [...prev, opt] : prev.filter((v: string) => v !== opt));
              }} className="accent-blue-600" />
              <span className="text-sm">{opt}</span>
            </label>
          ))}
          {q.type === 'DROPDOWN' && (
            <select onChange={(e) => setAnswer(q.id, e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400">
              <option value="">Select…</option>
              {(q.options || []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          )}
          {q.type === 'RATING' && (
            <div className="flex gap-2">
              {Array.from({ length: q.maxRating || 5 }, (_, i) => (
                <button key={i} onClick={() => setAnswer(q.id, i + 1)} className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${(answers[q.id] || 0) > i ? 'bg-yellow-400 text-white' : 'bg-gray-100 text-gray-600 hover:bg-yellow-100'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Submit
        </button>
        <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
      </div>
    </div>
  );
};

// ─── Main Forms Builder ───────────────────────────────────────────────────────

const CampusFormsBuilder: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [doc, setDoc] = useState<WorkspaceDocumentDetail | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<FormContent>({
    questions: [],
    settings: { requiresLogin: false, limitResponses: false, isAnonymous: false },
  });
  const [activeView, setActiveView] = useState<'build' | 'preview' | 'responses' | 'settings'>('build');
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
  const [loading, setLoading] = useState(true);
  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasUnsaved = useRef(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await workspaceApi.getDocument(id);
        setDoc(data);
        setTitle(data.title);
        const parsed = typeof data.contentJson === 'string' ? JSON.parse(data.contentJson) : data.contentJson;
        if (parsed?.questions !== undefined) setContent(parsed);
        setSaveState('saved');
      } catch {
        toast.error('Failed to load form.');
        navigate('/workspace');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const scheduleAutosave = useCallback((newContent: FormContent, newTitle: string) => {
    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    autosaveRef.current = setTimeout(async () => {
      if (!id) return;
      setSaveState('saving');
      try {
        await workspaceApi.updateDocument(id, { title: newTitle, contentJson: newContent });
        setSaveState('saved');
        hasUnsaved.current = false;
      } catch { setSaveState('error'); }
    }, 2000);
  }, [id]);

  const updateContent = (updater: (c: FormContent) => FormContent) => {
    setContent((prev) => {
      const next = updater(prev);
      hasUnsaved.current = true;
      setSaveState('unsaved');
      scheduleAutosave(next, title);
      return next;
    });
  };

  const addQuestion = (type: QuestionType = 'SHORT_TEXT') => {
    const q: FormQuestion = {
      id: `q_${Date.now()}`,
      type,
      title: 'Question',
      required: false,
      options: ['CHOICE', 'CHECKBOX', 'DROPDOWN'].includes(type) ? ['Option 1', 'Option 2'] : undefined,
      maxRating: type === 'RATING' ? 5 : undefined,
    };
    updateContent((c) => ({ ...c, questions: [...c.questions, q] }));
  };

  const updateQuestion = (qId: string, updates: Partial<FormQuestion>) => {
    updateContent((c) => ({
      ...c,
      questions: c.questions.map((q) => q.id === qId ? { ...q, ...updates } : q),
    }));
  };

  const deleteQuestion = (qId: string) => {
    updateContent((c) => ({ ...c, questions: c.questions.filter((q) => q.id !== qId) }));
  };

  const duplicateQuestion = (qId: string) => {
    updateContent((c) => {
      const original = c.questions.find((q) => q.id === qId);
      if (!original) return c;
      const copy = { ...original, id: `q_${Date.now()}` };
      const idx = c.questions.findIndex((q) => q.id === qId);
      const newQuestions = [...c.questions];
      newQuestions.splice(idx + 1, 0, copy);
      return { ...c, questions: newQuestions };
    });
  };

  const canEdit = doc?.permissions.canEdit ?? false;

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-50"><Loader2 size={32} className="animate-spin text-red-500" /></div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">

      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 flex items-center gap-3 px-4 py-2.5 flex-shrink-0">
        <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-gray-100 rounded-lg"><ArrowLeft size={16} className="text-gray-600" /></button>
        <input
          type="text"
          value={title}
          onChange={(e) => { setTitle(e.target.value); hasUnsaved.current = true; setSaveState('unsaved'); scheduleAutosave(content, e.target.value); }}
          disabled={!canEdit}
          className="flex-1 text-base font-semibold text-gray-900 bg-transparent outline-none border-b border-transparent focus:border-red-400 max-w-xs"
        />
        <div className="flex items-center gap-1 text-xs text-gray-500">
          {saveState === 'saving' && <Loader2 size={12} className="animate-spin" />}
          {saveState === 'saved' && <CheckCircle2 size={12} className="text-green-500" />}
          {saveState === 'unsaved' && <AlertCircle size={12} className="text-amber-500" />}
        </div>

        {/* View tabs */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 mx-2">
          {(['build', 'preview', 'responses', 'settings'] as const).map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                activeView === view ? 'bg-white text-red-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {view === 'responses' ? `Responses (${doc?.commentsCount || 0})` : view}
            </button>
          ))}
        </div>

        {doc?.status === 'DRAFT' && canEdit && (
          <button
            onClick={() => workspaceApi.submitForWorkflow(id!).then(() => toast.success('Form submitted for review.'))}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700"
          >
            <Send size={12} /> Publish
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeView === 'build' && (
          <div className="max-w-2xl mx-auto py-6 px-4 space-y-4">
            {/* Form header */}
            <div className="bg-white rounded-2xl border-t-4 border-red-500 border border-gray-200 p-5">
              <input
                type="text"
                value={content.title || title}
                onChange={(e) => updateContent((c) => ({ ...c, title: e.target.value }))}
                placeholder="Form title"
                className="w-full text-xl font-bold text-gray-800 outline-none border-b border-transparent focus:border-red-400 pb-1"
              />
              <input
                type="text"
                value={content.description || ''}
                onChange={(e) => updateContent((c) => ({ ...c, description: e.target.value }))}
                placeholder="Form description (optional)"
                className="w-full text-sm text-gray-500 outline-none mt-2"
              />
            </div>

            {/* Questions */}
            {content.questions.map((q, idx) => (
              <QuestionEditor
                key={q.id}
                q={q}
                index={idx}
                onChange={(updates) => updateQuestion(q.id, updates)}
                onDelete={() => deleteQuestion(q.id)}
                onDuplicate={() => duplicateQuestion(q.id)}
              />
            ))}

            {/* Add question */}
            {canEdit && (
              <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-4">
                <p className="text-xs font-medium text-gray-500 mb-3">Add Question</p>
                <div className="flex flex-wrap gap-2">
                  {QUESTION_TYPES.map(({ type, label, icon: Icon }) => (
                    <button
                      key={type}
                      onClick={() => addQuestion(type)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs border border-gray-200 rounded-xl hover:border-red-300 hover:bg-red-50 hover:text-red-700 transition-all"
                    >
                      <Icon size={12} /> {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeView === 'preview' && (
          <FormResponsePreview content={content} formId={id!} onClose={() => setActiveView('build')} />
        )}

        {activeView === 'responses' && (
          <div className="max-w-2xl mx-auto py-6 px-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
              <BarChart3 size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">Response analytics coming soon.</p>
              <p className="text-xs text-gray-400 mt-1">Responses are stored and retrievable via the API.</p>
            </div>
          </div>
        )}

        {activeView === 'settings' && (
          <div className="max-w-2xl mx-auto py-6 px-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
              <h2 className="text-sm font-semibold text-gray-800">Form Settings</h2>
              {[
                { key: 'requiresLogin', label: 'Require sign-in', desc: 'Only logged-in users can respond' },
                { key: 'isAnonymous', label: 'Collect anonymous responses', desc: 'Do not record respondent identity' },
                { key: 'limitResponses', label: 'Limit responses', desc: 'Stop accepting after max responses' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{label}</p>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={(content.settings as any)[key] || false}
                    onChange={(e) => updateContent((c) => ({ ...c, settings: { ...c.settings, [key]: e.target.checked } }))}
                    className="w-4 h-4 accent-red-600"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Confirmation message</label>
                <input
                  type="text"
                  value={content.settings.confirmationMessage || ''}
                  onChange={(e) => updateContent((c) => ({ ...c, settings: { ...c.settings, confirmationMessage: e.target.value } }))}
                  placeholder="Your response has been recorded."
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-red-400"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampusFormsBuilder;
