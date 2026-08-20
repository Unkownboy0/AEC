import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Quote, Code, Minus, Link as LinkIcon,
  Image as ImageIcon, Table as TableIcon, Undo, Redo,
  ChevronDown, Save, Send, Share2, Clock, MessageSquare,
  Eye, ArrowLeft, Loader2, CheckCircle2, AlertCircle,
  Subscript as SubIcon, Superscript as SupIcon,
  Highlighter, Type, Palette, MoreVertical, X
} from 'lucide-react';
import { workspaceApi, WorkspaceDocumentDetail, downloadBlob } from '../../services/workspace.api';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../components/ui/Toast';
import CampusDataFieldPicker from '../../components/workspace/CampusDataFieldPicker';
import WorkspaceCommentsPanel from '../../components/workspace/WorkspaceCommentsPanel';
import WorkspaceVersionsPanel from '../../components/workspace/WorkspaceVersionsPanel';
import WorkspaceShareModal from '../../components/workspace/WorkspaceShareModal';

// ─── Toolbar ────────────────────────────────────────────────────────────────

const FONT_SIZES = ['10', '12', '14', '16', '18', '20', '24', '28', '32', '36', '48'];
const FONT_FAMILIES = ['Inter', 'Georgia', 'Times New Roman', 'Courier New', 'Arial', 'Verdana'];

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ onClick, active, disabled, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`w-7 h-7 flex items-center justify-center rounded-md text-sm transition-all shrink-0 ${
      active
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
    } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    {children}
  </button>
);

const Divider: React.FC = () => <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5 shrink-0" />;

// ─── Main Editor ─────────────────────────────────────────────────────────────

const CampusDocsEditor: React.FC = () => {
  const params = useParams<{ id?: string; documentId?: string }>();
  const id = params.id || params.documentId;
  const { user } = useAuth();
  const navigate = useNavigate();

  const [doc, setDoc] = useState<WorkspaceDocumentDetail | null>(null);
  const [title, setTitle] = useState('');
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
  const [loading, setLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showDataPicker, setShowDataPicker] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasUnsavedChanges = useRef(false);

  // ─── TipTap Editor ──────────────────────────────────────────────────────

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Start writing your document…' }),
      Subscript,
      Superscript,
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: { type: 'doc', content: [{ type: 'paragraph' }] },
    onUpdate: () => {
      if (!doc?.permissions.canEdit) return;
      setSaveState('unsaved');
      hasUnsavedChanges.current = true;
      scheduleAutosave();
    },
  });

  // ─── Load Document ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await workspaceApi.getDocument(id);
        setDoc(data);
        setTitle(data.title);
        const contentObj = typeof data.contentJson === 'string'
          ? JSON.parse(data.contentJson)
          : data.contentJson;
        if (editor && contentObj && contentObj.type === 'doc') {
          editor.commands.setContent(contentObj);
        }
        setSaveState('saved');
      } catch (e) {
        toast.error('Failed to load document.');
        navigate('/workspace');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, editor]);

  // ─── Autosave ────────────────────────────────────────────────────────────

  const scheduleAutosave = useCallback(() => {
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(performSave, 2000);
  }, []);

  const performSave = useCallback(async () => {
    if (!id || !editor || !hasUnsavedChanges.current) return;
    setSaveState('saving');
    try {
      const contentJson = editor.getJSON();
      const contentHtml = editor.getHTML();
      await workspaceApi.updateDocument(id, { title, contentJson, contentHtml });
      setSaveState('saved');
      hasUnsavedChanges.current = false;
    } catch (e) {
      setSaveState('error');
    }
  }, [id, editor, title]);

  // Manual Ctrl+S save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        performSave();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [performSave]);

  // Warn on unsaved close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    setSaveState('unsaved');
    hasUnsavedChanges.current = true;
    scheduleAutosave();
  };

  // ─── Workflow Actions ────────────────────────────────────────────────────

  const handleSubmitForReview = async () => {
    if (!id) return;
    await performSave();
    setSubmitting(true);
    try {
      await workspaceApi.submitForWorkflow(id);
      toast.success('Document submitted for HOD review.');
      const updated = await workspaceApi.getDocument(id);
      setDoc(updated);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to submit.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (action: 'APPROVE' | 'RETURN' | 'REJECT', comment?: string) => {
    if (!id) return;
    setSubmitting(true);
    try {
      await workspaceApi.reviewDocument(id, action, comment);
      toast.success(`Document ${action.toLowerCase()}d.`);
      const updated = await workspaceApi.getDocument(id);
      setDoc(updated);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Action failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Export ─────────────────────────────────────────────────────────────

  const handleExport = async (format: 'pdf' | 'docx') => {
    if (!id) return;
    try {
      await performSave();
      const blob = await workspaceApi.exportDocument(id, format);
      downloadBlob(blob, `${title || 'document'}.${format}`);
      toast.success(`Downloaded as ${format.toUpperCase()}`);
    } catch {
      toast.error('Export failed. Please try again.');
    }
  };

  // ─── Insert Campus Data Field ────────────────────────────────────────────

  const handleInsertToken = (token: string) => {
    editor?.commands.insertContent(`{{${token}}}`);
    setShowDataPicker(false);
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 size={32} className="mx-auto animate-spin text-blue-500 mb-3" />
          <p className="text-sm text-gray-500">Loading document…</p>
        </div>
      </div>
    );
  }

  const canEdit = doc?.permissions.canEdit ?? false;
  const canSubmit = doc?.permissions.canSubmit ?? false;
  const canReview = doc?.permissions.canReview ?? false;

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden">

      {/* ─── Top Bar ───────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 flex-shrink-0 z-20">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 sm:p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl sm:rounded-lg text-slate-600 dark:text-slate-300 transition-colors shrink-0 cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>

          {/* Title Input */}
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            disabled={!canEdit}
            className="flex-1 text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-50 bg-transparent outline-none border-b border-transparent focus:border-blue-500 transition-colors disabled:cursor-default truncate max-w-xs sm:max-w-md"
            placeholder="Document title"
          />

          {/* Save state */}
          <div className="hidden min-[480px]:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
            {saveState === 'saving' && <><Loader2 size={12} className="animate-spin text-blue-500" /> <span className="hidden sm:inline">Saving…</span></>}
            {saveState === 'saved' && <><CheckCircle2 size={12} className="text-green-500" /> <span className="hidden sm:inline">Saved</span></>}
            {saveState === 'unsaved' && <><AlertCircle size={12} className="text-amber-500" /> <span className="hidden sm:inline">Unsaved</span></>}
            {saveState === 'error' && <><AlertCircle size={12} className="text-red-500" /> <span className="hidden sm:inline">Save failed</span></>}
          </div>

          {/* Status badge */}
          {doc && (
            <span className="hidden sm:inline-flex text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium shrink-0">
              {doc.status}
            </span>
          )}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            title="Comments"
            className={`p-1.5 rounded-lg transition-colors relative ${showComments ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
          >
            <MessageSquare size={16} />
            {doc && ((doc.commentsCount ?? 0) > 0) && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{doc.commentsCount}</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setShowVersions(!showVersions)}
            title="Version History"
            className={`p-1.5 rounded-lg transition-colors ${showVersions ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
          >
            <Clock size={16} />
          </button>
          <button
            type="button"
            onClick={() => setShowShare(true)}
            title="Share"
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
          >
            <Share2 size={16} />
          </button>

          {/* Export */}
          <div className="relative group">
            <button type="button" className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
              <Eye size={16} />
              <span>Export</span> <ChevronDown size={10} />
            </button>
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-850 shadow-xl border border-slate-200 dark:border-slate-750 rounded-xl z-50 py-1 min-w-[130px] hidden group-hover:block">
              <button type="button" onClick={() => handleExport('pdf')} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Export as PDF</button>
              <button type="button" onClick={() => handleExport('docx')} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Export as DOCX</button>
            </div>
          </div>

          {/* Workflow buttons */}
          {canSubmit && doc?.status === 'DRAFT' && (
            <button
              type="button"
              onClick={handleSubmitForReview}
              disabled={submitting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg font-medium transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              Submit for Review
            </button>
          )}
          {canSubmit && doc?.status === 'RETURNED' && (
            <button
              type="button"
              onClick={handleSubmitForReview}
              disabled={submitting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg font-medium transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <Send size={12} />
              Resubmit
            </button>
          )}
          {canReview && doc?.status === 'SUBMITTED' && (
            <div className="flex gap-1">
              <button type="button" onClick={() => handleReview('APPROVE')} className="px-2.5 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors font-medium cursor-pointer">Approve</button>
              <button type="button" onClick={() => handleReview('RETURN', 'Please revise.')} className="px-2.5 py-1.5 bg-amber-500 text-white text-xs rounded-lg hover:bg-amber-600 transition-colors font-medium cursor-pointer">Return</button>
            </div>
          )}
        </div>

        {/* Mobile Actions Menu Trigger */}
        <div className="flex md:hidden items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            aria-label="More actions"
          >
            {showMobileMenu ? <X size={20} /> : <MoreVertical size={20} />}
          </button>
        </div>
      </div>

      {/* ─── Mobile Action Drawer ────────────────────────────────────────── */}
      {showMobileMenu && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 space-y-2.5 z-20 shadow-md animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Status: <strong className="text-slate-800 dark:text-slate-200">{doc?.status || 'DRAFT'}</strong></span>
            <span>
              {saveState === 'saving' && 'Saving changes…'}
              {saveState === 'saved' && 'All changes saved'}
              {saveState === 'unsaved' && 'Unsaved edits'}
              {saveState === 'error' && 'Failed to save'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => { setShowComments(!showComments); setShowMobileMenu(false); }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              <MessageSquare size={15} />
              <span>Comments ({doc?.commentsCount ?? 0})</span>
            </button>
            <button
              type="button"
              onClick={() => { setShowVersions(!showVersions); setShowMobileMenu(false); }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              <Clock size={15} />
              <span>Version History</span>
            </button>
            <button
              type="button"
              onClick={() => { setShowShare(true); setShowMobileMenu(false); }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              <Share2 size={15} />
              <span>Share Doc</span>
            </button>
            <button
              type="button"
              onClick={() => { setShowDataPicker(true); setShowMobileMenu(false); }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-xs font-semibold text-blue-600 dark:text-blue-300"
            >
              <Type size={15} />
              <span>Campus Data</span>
            </button>
          </div>

          <div className="flex gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => { handleExport('pdf'); setShowMobileMenu(false); }}
              className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 text-center"
            >
              Export PDF
            </button>
            <button
              type="button"
              onClick={() => { handleExport('docx'); setShowMobileMenu(false); }}
              className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 text-center"
            >
              Export DOCX
            </button>
          </div>

          {canSubmit && (doc?.status === 'DRAFT' || doc?.status === 'RETURNED') && (
            <button
              type="button"
              onClick={() => { handleSubmitForReview(); setShowMobileMenu(false); }}
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold text-center shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {doc?.status === 'RETURNED' ? 'Resubmit for Review' : 'Submit for Review'}
            </button>
          )}
        </div>
      )}

      {/* ─── Toolbar (Horizontally Scrollable) ────────────────────────── */}
      {canEdit && editor && (
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center gap-0.5 px-3 sm:px-4 py-1.5 flex-nowrap overflow-x-auto no-scrollbar touch-pan-x flex-shrink-0 z-10">

          {/* Undo/Redo */}
          <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo (Ctrl+Z)">
            <Undo size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo (Ctrl+Y)">
            <Redo size={14} />
          </ToolbarButton>
          <Divider />

          {/* Heading styles */}
          <select
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'p') editor.chain().focus().setParagraph().run();
              else editor.chain().focus().toggleHeading({ level: parseInt(val) as 1 | 2 | 3 | 4 }).run();
            }}
            className="text-xs border border-slate-200 dark:border-slate-700 rounded-md px-1.5 py-1 bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-200 outline-none cursor-pointer h-7 shrink-0"
            defaultValue="p"
          >
            <option value="p">Normal</option>
            <option value="1">Heading 1</option>
            <option value="2">Heading 2</option>
            <option value="3">Heading 3</option>
            <option value="4">Heading 4</option>
          </select>
          <Divider />

          {/* Bold/Italic/Underline/Strike */}
          <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (Ctrl+B)">
            <Bold size={13} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (Ctrl+I)">
            <Italic size={13} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline (Ctrl+U)">
            <UnderlineIcon size={13} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
            <Strikethrough size={13} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive('subscript')} title="Subscript">
            <SubIcon size={13} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive('superscript')} title="Superscript">
            <SupIcon size={13} />
          </ToolbarButton>
          <Divider />

          {/* Colors */}
          <div className="relative group shrink-0">
            <ToolbarButton onClick={() => {}} title="Text color">
              <Palette size={13} />
            </ToolbarButton>
            <div className="absolute left-0 top-full mt-1 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 p-2 hidden group-hover:grid grid-cols-6 gap-1">
              {['#000000', '#dc2626', '#d97706', '#16a34a', '#2563eb', '#7c3aed', '#db2777', '#6b7280', '#9ca3af'].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => editor.chain().focus().setColor(color).run()}
                  className="w-5 h-5 rounded-md border border-slate-200 dark:border-slate-700 hover:scale-110 transition-transform cursor-pointer"
                  style={{ background: color }}
                />
              ))}
            </div>
          </div>
          <div className="relative group shrink-0">
            <ToolbarButton onClick={() => {}} title="Highlight">
              <Highlighter size={13} />
            </ToolbarButton>
            <div className="absolute left-0 top-full mt-1 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 p-2 hidden group-hover:grid grid-cols-5 gap-1">
              {['#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca', '#e9d5ff'].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => editor.chain().focus().toggleHighlight({ color }).run()}
                  className="w-5 h-5 rounded-md border border-slate-200 dark:border-slate-700 hover:scale-110 transition-transform cursor-pointer"
                  style={{ background: color }}
                />
              ))}
            </div>
          </div>
          <Divider />

          {/* Alignment */}
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align Left">
            <AlignLeft size={13} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align Center">
            <AlignCenter size={13} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align Right">
            <AlignRight size={13} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify">
            <AlignJustify size={13} />
          </ToolbarButton>
          <Divider />

          {/* Lists */}
          <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
            <List size={13} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered List">
            <ListOrdered size={13} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')} title="Checklist">
            <CheckCircle2 size={13} />
          </ToolbarButton>
          <Divider />

          {/* Block elements */}
          <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Quote">
            <Quote size={13} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block">
            <Code size={13} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">
            <Minus size={13} />
          </ToolbarButton>
          <Divider />

          {/* Insert Table */}
          <ToolbarButton
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            title="Insert Table"
          >
            <TableIcon size={13} />
          </ToolbarButton>

          {/* Insert Image */}
          <ToolbarButton
            onClick={() => {
              const url = window.prompt('Image URL:');
              if (url) editor.chain().focus().setImage({ src: url }).run();
            }}
            title="Insert Image"
          >
            <ImageIcon size={13} />
          </ToolbarButton>

          {/* Insert Link */}
          <ToolbarButton
            onClick={() => {
              const url = window.prompt('URL:');
              if (url) editor.chain().focus().setLink({ href: url }).run();
            }}
            active={editor.isActive('link')}
            title="Insert Link"
          >
            <LinkIcon size={13} />
          </ToolbarButton>
          <Divider />

          {/* Campus Data Field Picker */}
          <button
            type="button"
            onClick={() => setShowDataPicker(!showDataPicker)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 rounded-md transition-colors border border-blue-200 dark:border-blue-800 shrink-0 cursor-pointer"
          >
            <Type size={12} />
            Campus Data
          </button>
        </div>
      )}

      {/* ─── Editor Area ───────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Page Canvas with responsive padding */}
        <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-950 p-2 min-[440px]:p-4 sm:p-8">
          <div className="max-w-[210mm] mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl sm:rounded-sm">
            {/* Responsive page padding: Comfortable margins on mobile, A4 margins on desktop */}
            <div className="px-4 py-6 min-[480px]:px-8 min-[480px]:py-8 sm:px-[25.4mm] sm:py-[25.4mm] min-h-[360px] sm:min-h-[297mm]">
              <EditorContent
                editor={editor}
                className="prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[240px]"
              />
            </div>
          </div>
        </div>

        {/* Side Panels */}
        {showComments && (
          <div className="fixed inset-y-0 right-0 w-full max-w-xs sm:static sm:w-72 sm:max-w-none border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl sm:shadow-none overflow-y-auto flex-shrink-0 z-30">
            <WorkspaceCommentsPanel
              documentId={id!}
              userRole={user?.role || ''}
              onClose={() => setShowComments(false)}
            />
          </div>
        )}
        {showVersions && (
          <div className="fixed inset-y-0 right-0 w-full max-w-xs sm:static sm:w-72 sm:max-w-none border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl sm:shadow-none overflow-y-auto flex-shrink-0 z-30">
            <WorkspaceVersionsPanel
              documentId={id!}
              currentVersion={doc?.currentVersion || 1}
              onClose={() => setShowVersions(false)}
              onRestore={() => { setShowVersions(false); window.location.reload(); }}
            />
          </div>
        )}
      </div>

      {/* ─── Modals ─────────────────────────────────────────────────────── */}
      {showShare && id && (
        <WorkspaceShareModal documentId={id} title={title} onClose={() => setShowShare(false)} />
      )}
      {showDataPicker && (
        <CampusDataFieldPicker onInsert={handleInsertToken} onClose={() => setShowDataPicker(false)} />
      )}
    </div>
  );
};

export default CampusDocsEditor;
