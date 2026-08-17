import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, GripVertical, CheckCircle2, Clock,
  Award, HelpCircle, Shuffle, RotateCcw, Save, Send, Eye,
  BarChart3, Settings2, Loader2, AlertCircle, Sparkles, Check,
  Percent, FileText, ChevronRight
} from 'lucide-react';
import { workspaceApi, WorkspaceDocumentDetail } from '../../services/workspace.api';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../components/ui/Toast';

// ─── Quiz Types ──────────────────────────────────────────────────────────────

type QuizQuestionType = 'MCQ_SINGLE' | 'MCQ_MULTI' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'NUMERICAL';

interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  question: string;
  explanation?: string;
  points: number;
  negativePoints?: number;
  options: QuizOption[];
  numericalAnswer?: number;
  numericalTolerance?: number;
  shortAnswerKeywords?: string[];
}

interface QuizSettings {
  timeLimitMinutes: number; // 0 = no limit
  attemptsAllowed: number; // 0 = unlimited
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  passScorePercentage: number;
  showCorrectAnswersAfterSubmit: boolean;
  showScoreImmediately: boolean;
  requiresWebcam?: boolean;
}

interface QuizContent {
  title?: string;
  description?: string;
  instructions?: string;
  questions: QuizQuestion[];
  settings: QuizSettings;
}

// ─── Quiz Builder Component ──────────────────────────────────────────────────

const CampusQuizBuilder: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [doc, setDoc] = useState<WorkspaceDocumentDetail | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<QuizContent>({
    questions: [],
    settings: {
      timeLimitMinutes: 30,
      attemptsAllowed: 1,
      shuffleQuestions: true,
      shuffleOptions: true,
      passScorePercentage: 50,
      showCorrectAnswersAfterSubmit: true,
      showScoreImmediately: true,
    },
  });
  const [activeTab, setActiveTab] = useState<'questions' | 'settings' | 'preview' | 'results'>('questions');
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
  const [loading, setLoading] = useState(true);
  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasUnsaved = useRef(false);

  // ─── Load Quiz ─────────────────────────────────────────────────────────────

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
        toast.error('Failed to load quiz.');
        navigate('/workspace');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // ─── Autosave ──────────────────────────────────────────────────────────────

  const scheduleAutosave = useCallback((newContent: QuizContent, newTitle: string) => {
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

  const updateContent = (updater: (c: QuizContent) => QuizContent) => {
    setContent((prev) => {
      const next = updater(prev);
      hasUnsaved.current = true;
      setSaveState('unsaved');
      scheduleAutosave(next, title);
      return next;
    });
  };

  // ─── Question Operations ───────────────────────────────────────────────────

  const addQuestion = (type: QuizQuestionType = 'MCQ_SINGLE') => {
    const q: QuizQuestion = {
      id: `quiz_q_${Date.now()}`,
      type,
      question: 'New Question',
      points: 1,
      negativePoints: 0,
      options: type === 'TRUE_FALSE' ? [
        { id: 'opt_1', text: 'True', isCorrect: true },
        { id: 'opt_2', text: 'False', isCorrect: false },
      ] : [
        { id: 'opt_1', text: 'Option A', isCorrect: true },
        { id: 'opt_2', text: 'Option B', isCorrect: false },
        { id: 'opt_3', text: 'Option C', isCorrect: false },
        { id: 'opt_4', text: 'Option D', isCorrect: false },
      ],
      explanation: '',
    };
    updateContent((c) => ({ ...c, questions: [...c.questions, q] }));
  };

  const updateQuestion = (qId: string, updates: Partial<QuizQuestion>) => {
    updateContent((c) => ({
      ...c,
      questions: c.questions.map((q) => q.id === qId ? { ...q, ...updates } : q),
    }));
  };

  const deleteQuestion = (qId: string) => {
    updateContent((c) => ({ ...c, questions: c.questions.filter((q) => q.id !== qId) }));
  };

  const setCorrectOption = (qId: string, optId: string, isMulti: boolean = false) => {
    updateContent((c) => ({
      ...c,
      questions: c.questions.map((q) => {
        if (q.id !== qId) return q;
        const newOptions = q.options.map((opt) => {
          if (isMulti) {
            return opt.id === optId ? { ...opt, isCorrect: !opt.isCorrect } : opt;
          } else {
            return { ...opt, isCorrect: opt.id === optId };
          }
        });
        return { ...q, options: newOptions };
      }),
    }));
  };

  const totalPoints = content.questions.reduce((sum, q) => sum + (q.points || 0), 0);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-50"><Loader2 size={32} className="animate-spin text-purple-600" /></div>;
  }

  const canEdit = doc?.permissions.canEdit ?? false;

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
      {/* ─── Top Bar ──────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 flex items-center justify-between px-6 py-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft size={16} className="text-gray-600" />
          </button>
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); hasUnsaved.current = true; setSaveState('unsaved'); scheduleAutosave(content, e.target.value); }}
              disabled={!canEdit}
              className="text-base font-bold text-gray-900 bg-transparent outline-none border-b border-transparent focus:border-purple-500 max-w-sm"
              placeholder="Quiz title"
            />
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
              <span>{content.questions.length} Questions</span>
              <span>•</span>
              <span>Total Points: {totalPoints}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock size={11} /> {content.settings.timeLimitMinutes > 0 ? `${content.settings.timeLimitMinutes}m` : 'No limit'}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {(['questions', 'settings', 'preview', 'results'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                activeTab === tab ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-gray-500 mr-2">
            {saveState === 'saving' && <Loader2 size={12} className="animate-spin" />}
            {saveState === 'saved' && <CheckCircle2 size={12} className="text-green-500" />}
            {saveState === 'unsaved' && <AlertCircle size={12} className="text-amber-500" />}
          </div>
          {canEdit && (
            <button
              onClick={() => workspaceApi.submitForWorkflow(id!).then(() => toast.success('Quiz published / submitted.'))}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
            >
              <Send size={13} /> Publish Quiz
            </button>
          )}
        </div>
      </div>

      {/* ─── Main Content ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'questions' && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Header info */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
              <input
                type="text"
                value={content.title || title}
                onChange={(e) => updateContent((c) => ({ ...c, title: e.target.value }))}
                placeholder="Quiz Title"
                className="w-full text-xl font-bold text-gray-900 outline-none border-b border-transparent focus:border-purple-400 pb-1"
              />
              <textarea
                value={content.description || ''}
                onChange={(e) => updateContent((c) => ({ ...c, description: e.target.value }))}
                placeholder="Instructions or description for students…"
                rows={2}
                className="w-full text-xs text-gray-600 outline-none resize-none border border-gray-100 rounded-xl p-2.5 bg-gray-50"
              />
            </div>

            {/* Questions List */}
            {content.questions.map((q, qIndex) => (
              <div key={q.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4 hover:border-purple-200 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-purple-100 text-purple-700 font-bold rounded-lg text-xs flex items-center justify-center">
                      {qIndex + 1}
                    </span>
                    <select
                      value={q.type}
                      onChange={(e) => updateQuestion(q.id, { type: e.target.value as QuizQuestionType })}
                      className="text-xs border border-gray-200 rounded-lg px-2.5 py-1 bg-white font-medium text-gray-700 outline-none cursor-pointer"
                    >
                      <option value="MCQ_SINGLE">Multiple Choice (Single)</option>
                      <option value="MCQ_MULTI">Multiple Choice (Multiple Correct)</option>
                      <option value="TRUE_FALSE">True / False</option>
                      <option value="SHORT_ANSWER">Short Answer</option>
                      <option value="NUMERICAL">Numerical</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500 font-medium">Points:</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={q.points}
                        onChange={(e) => updateQuestion(q.id, { points: parseFloat(e.target.value) || 0 })}
                        className="w-12 text-xs border border-gray-200 rounded-lg px-2 py-1 text-center font-bold text-purple-700 outline-none"
                      />
                    </div>
                    <button onClick={() => deleteQuestion(q.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Question Input */}
                <input
                  type="text"
                  value={q.question}
                  onChange={(e) => updateQuestion(q.id, { question: e.target.value })}
                  placeholder="Enter your question text…"
                  className="w-full text-sm font-semibold text-gray-900 outline-none border-b border-gray-200 focus:border-purple-500 pb-1"
                />

                {/* Options for MCQ / True False */}
                {['MCQ_SINGLE', 'MCQ_MULTI', 'TRUE_FALSE'].includes(q.type) && (
                  <div className="space-y-2 pt-2">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      Options (Click checkmark to mark correct answer)
                    </p>
                    {q.options.map((opt, optIndex) => (
                      <div key={opt.id} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCorrectOption(q.id, opt.id, q.type === 'MCQ_MULTI')}
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                            opt.isCorrect
                              ? 'bg-green-500 text-white shadow-sm'
                              : 'border-2 border-gray-300 text-transparent hover:border-green-400'
                          }`}
                        >
                          <Check size={13} strokeWidth={3} />
                        </button>
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => {
                            const newOpts = [...q.options];
                            newOpts[optIndex].text = e.target.value;
                            updateQuestion(q.id, { options: newOpts });
                          }}
                          className={`flex-1 text-xs border rounded-xl px-3 py-2 outline-none transition-colors ${
                            opt.isCorrect ? 'border-green-300 bg-green-50/50 font-medium text-gray-900' : 'border-gray-200'
                          }`}
                        />
                        {q.type !== 'TRUE_FALSE' && q.options.length > 2 && (
                          <button
                            onClick={() => {
                              const newOpts = q.options.filter((_, i) => i !== optIndex);
                              updateQuestion(q.id, { options: newOpts });
                            }}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))}

                    {q.type !== 'TRUE_FALSE' && (
                      <button
                        onClick={() => {
                          const newOpts = [...q.options, { id: `opt_${Date.now()}`, text: `Option ${String.fromCharCode(65 + q.options.length)}`, isCorrect: false }];
                          updateQuestion(q.id, { options: newOpts });
                        }}
                        className="text-xs text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-1 mt-1"
                      >
                        <Plus size={12} /> Add Option
                      </button>
                    )}
                  </div>
                )}

                {/* Explanation */}
                <div className="pt-2">
                  <input
                    type="text"
                    value={q.explanation || ''}
                    onChange={(e) => updateQuestion(q.id, { explanation: e.target.value })}
                    placeholder="Explanation / feedback for students after evaluation (optional)…"
                    className="w-full text-xs text-gray-500 italic outline-none border border-dashed border-gray-200 rounded-xl px-3 py-2 bg-gray-50"
                  />
                </div>
              </div>
            ))}

            {/* Add question button */}
            {canEdit && (
              <div className="flex gap-2">
                <button
                  onClick={() => addQuestion('MCQ_SINGLE')}
                  className="flex-1 py-3 border-2 border-dashed border-purple-200 hover:border-purple-400 hover:bg-purple-50 text-purple-700 font-semibold text-xs rounded-2xl flex items-center justify-center gap-1.5 transition-all"
                >
                  <Plus size={14} /> Add Multiple Choice Question
                </button>
                <button
                  onClick={() => addQuestion('TRUE_FALSE')}
                  className="px-4 py-3 border-2 border-dashed border-gray-200 hover:border-gray-400 text-gray-600 font-medium text-xs rounded-2xl flex items-center gap-1.5 transition-all"
                >
                  <Plus size={14} /> True / False
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Settings2 size={18} className="text-purple-600" />
              Quiz Assessment Rules & Configuration
            </h2>

            <div className="space-y-4 divide-y divide-gray-100">
              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Time Limit (Minutes)</p>
                  <p className="text-xs text-gray-500">Auto-submits when time expires. Set 0 for untimed.</p>
                </div>
                <input
                  type="number"
                  min={0}
                  max={360}
                  value={content.settings.timeLimitMinutes}
                  onChange={(e) => updateContent((c) => ({ ...c, settings: { ...c.settings, timeLimitMinutes: parseInt(e.target.value) || 0 } }))}
                  className="w-20 text-sm border border-gray-200 rounded-xl px-3 py-2 text-center font-bold text-purple-700 outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Passing Score (%)</p>
                  <p className="text-xs text-gray-500">Minimum percentage required to clear assessment.</p>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={content.settings.passScorePercentage}
                    onChange={(e) => updateContent((c) => ({ ...c, settings: { ...c.settings, passScorePercentage: parseInt(e.target.value) || 0 } }))}
                    className="w-16 text-sm border border-gray-200 rounded-xl px-2 py-2 text-center font-bold text-purple-700 outline-none"
                  />
                  <span className="text-xs font-bold text-gray-400">%</span>
                </div>
              </div>

              {[
                { key: 'shuffleQuestions', label: 'Shuffle Question Order', desc: 'Randomizes order for every candidate to prevent cheating' },
                { key: 'shuffleOptions', label: 'Shuffle Answer Choices', desc: 'Randomizes choice ordering inside multiple-choice questions' },
                { key: 'showScoreImmediately', label: 'Show Score Immediately', desc: 'Candidates see grade immediately upon submission' },
                { key: 'showCorrectAnswersAfterSubmit', label: 'Display Answer Key & Explanations', desc: 'Reveal correct solutions once quiz closes' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between pt-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{label}</p>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={(content.settings as any)[key] || false}
                    onChange={(e) => updateContent((c) => ({ ...c, settings: { ...c.settings, [key]: e.target.checked } }))}
                    className="w-4 h-4 rounded accent-purple-600 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-200 p-8 shadow-sm space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600">Candidate Preview</span>
              <h1 className="text-2xl font-bold text-gray-900 mt-1">{content.title || title}</h1>
              {content.description && <p className="text-xs text-gray-500 mt-1">{content.description}</p>}
            </div>

            <div className="space-y-6">
              {content.questions.map((q, i) => (
                <div key={q.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-3">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-semibold text-gray-800">
                      {i + 1}. {q.question}
                    </p>
                    <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                      {q.points} pt{q.points > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {q.options.map((opt) => (
                      <label key={opt.id} className="flex items-center gap-2 p-2 rounded-lg bg-white border border-gray-200 cursor-pointer hover:bg-purple-50/30 transition-colors">
                        <input type="radio" name={`preview_${q.id}`} className="accent-purple-600" />
                        <span className="text-xs text-gray-700">{opt.text}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
            <Award size={36} className="mx-auto text-purple-600 mb-3" />
            <h2 className="text-base font-bold text-gray-900">Quiz Submissions & Grading Analytics</h2>
            <p className="text-xs text-gray-500 mt-1">
              Automated scoring evaluates each candidate against answer keys. Full gradebook exported to Campus Sheets.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampusQuizBuilder;
