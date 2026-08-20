import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileText, Table2, Presentation, ClipboardList, FileQuestion,
  NotebookPen, BarChart3, FolderOpen, Plus, Search, Clock,
  Users, Building2, AlertCircle, RefreshCw, Grid3X3, List,
  Sparkles, ChevronRight, ArrowUpRight, Eye, Share2,
  HardDrive, Zap, File, Download, X, MoreVertical, Trash2,
  RotateCcw, Edit3, Loader2
} from 'lucide-react';
import { workspaceApi, WorkspaceDocument, downloadBlob } from '../../services/workspace.api';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../components/ui/Toast';
import { AppErrorState } from '../../components/shared/AppErrorState';
import { classifyAppError, type AppErrorView } from '../../shared/errors/app-error';
import WorkspaceShareModal from '../../components/workspace/WorkspaceShareModal';

// ─── Types ──────────────────────────────────────────────────────────────────

type QuickCreateType = 'DOC' | 'SHEET' | 'SLIDE' | 'FORM' | 'QUIZ' | 'PDF' | 'NOTE' | 'REPORT';
type FilterType = 'ALL' | 'DOC' | 'SHEET' | 'SLIDE' | 'FORM' | 'QUIZ' | 'PDF' | 'NOTE' | 'REPORT';
type ViewMode = 'grid' | 'list';

// ─── Constants ────────────────────────────────────────────────────────────────

const MODULE_CONFIG = {
  DOC: { label: 'Campus Docs', icon: FileText, color: '#2563eb', bgLight: '#eff6ff', bgDark: '#1e293b', path: 'docs' },
  SHEET: { label: 'Campus Sheets', icon: Table2, color: '#16a34a', bgLight: '#f0fdf4', bgDark: '#14532d', path: 'sheets' },
  SLIDE: { label: 'Campus Slides', icon: Presentation, color: '#d97706', bgLight: '#fffbeb', bgDark: '#78350f', path: 'slides' },
  FORM: { label: 'Campus Forms', icon: ClipboardList, color: '#dc2626', bgLight: '#fef2f2', bgDark: '#7f1d1d', path: 'forms' },
  QUIZ: { label: 'Campus Quiz', icon: FileQuestion, color: '#9333ea', bgLight: '#faf5ff', bgDark: '#581c87', path: 'quiz' },
  PDF: { label: 'Campus PDF', icon: File, color: '#e11d48', bgLight: '#fff1f2', bgDark: '#881337', path: 'pdf' },
  NOTE: { label: 'Campus Notes', icon: NotebookPen, color: '#ea580c', bgLight: '#fff7ed', bgDark: '#7c2d12', path: 'notes' },
  REPORT: { label: 'Campus Reports', icon: BarChart3, color: '#0d9488', bgLight: '#f0fdfa', bgDark: '#134e4a', path: 'reports' },
} as const;

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  DRAFT: { label: 'Draft', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700' },
  SUBMITTED: { label: 'Submitted', className: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800' },
  IN_REVIEW: { label: 'In Review', className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800' },
  RETURNED: { label: 'Returned', className: 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800' },
  APPROVED: { label: 'Approved', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' },
  PUBLISHED: { label: 'Published', className: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800' },
  ARCHIVED: { label: 'Archived', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700' },
  TRASHED: { label: 'In Trash', className: 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800' },
};

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ─── Sub-Components ────────────────────────────────────────────────────────────

const QuickCreateButton: React.FC<{ type: QuickCreateType; onCreate: (type: QuickCreateType) => void }> = ({ type, onCreate }) => {
  const cfg = MODULE_CONFIG[type];
  const Icon = cfg.icon;
  return (
    <button
      onClick={() => onCreate(type)}
      className="flex min-w-[4.75rem] snap-start flex-col items-center gap-2 p-2.5 sm:min-w-0 sm:p-4 rounded-xl sm:rounded-2xl bg-surface dark:bg-slate-900/80 border border-border dark:border-slate-800 hover:border-primary/40 active:scale-[0.98] transition-all duration-200 group text-left cursor-pointer"
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110 shadow-xs"
        style={{ backgroundColor: cfg.color }}
      >
        <Icon size={22} className="text-white" />
      </div>
      <span className="text-xs font-semibold text-text-primary dark:text-slate-200 text-center leading-tight">
        {cfg.label.replace('Campus ', '')}
      </span>
    </button>
  );
};

const DocumentCard: React.FC<{
  doc: WorkspaceDocument;
  viewMode: ViewMode;
  isTrashTab?: boolean;
  onOpen: (doc: WorkspaceDocument) => void;
  onShare: (doc: WorkspaceDocument) => void;
  onRename: (doc: WorkspaceDocument) => void;
  onExport: (doc: WorkspaceDocument) => void;
  onTrash: (doc: WorkspaceDocument) => void;
  onRestore: (doc: WorkspaceDocument) => void;
  onPermanentDelete: (doc: WorkspaceDocument) => void;
}> = ({ doc, viewMode, isTrashTab, onOpen, onShare, onRename, onExport, onTrash, onRestore, onPermanentDelete }) => {
  const cfg = MODULE_CONFIG[doc.type as QuickCreateType];
  const statusCfg = STATUS_CONFIG[doc.status] || STATUS_CONFIG.DRAFT;
  const Icon = cfg?.icon || FileText;
  const updatedAgo = getTimeAgo(doc.updatedAt);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleAction = (action: () => void, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    action();
  };

  if (viewMode === 'list') {
    return (
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl hover:bg-surface-secondary dark:hover:bg-slate-800/60 cursor-pointer group transition-colors border border-transparent hover:border-border dark:hover:border-slate-700 relative"
        onClick={() => !isTrashTab && onOpen(doc)}
      >
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs"
            style={{ backgroundColor: cfg?.color || '#4f46e5' }}
          >
            <Icon size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary dark:text-slate-100 truncate">{doc.title}</p>
            <p className="text-xs text-text-muted dark:text-slate-400 truncate">{doc.authorName} · {updatedAgo}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium hidden min-[480px]:inline-block ${statusCfg.className}`}>
            {statusCfg.label}
          </span>

          {/* Trashed Document Actions */}
          {isTrashTab ? (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => handleAction(() => onRestore(doc), e)}
                className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 text-xs font-semibold flex items-center gap-1 transition-all"
                title="Restore Document"
              >
                <RotateCcw size={14} />
                <span className="hidden sm:inline">Restore</span>
              </button>
              <button
                onClick={(e) => handleAction(() => onPermanentDelete(doc), e)}
                className="p-2 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 text-xs font-semibold flex items-center gap-1 transition-all"
                title="Delete Forever"
              >
                <Trash2 size={14} />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </div>
          ) : (
            /* Active Document More Menu */
            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-secondary dark:hover:bg-slate-700 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                title="Document Options"
              >
                <MoreVertical size={16} />
              </button>

              {menuOpen && (
                <>
                <button aria-label="Close file actions" className="fixed inset-0 z-40 bg-slate-950/45 sm:hidden" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }} />
                <div className="fixed inset-x-3 bottom-[calc(var(--mobile-bottom-nav-height)+var(--safe-area-bottom)+10px)] z-50 bg-surface dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-xl py-2 text-left sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-full sm:mt-1 sm:w-44 animate-in slide-in-from-bottom-2 sm:fade-in duration-150">
                  <p className="px-3.5 pb-2 text-[11px] font-semibold text-text-muted truncate sm:hidden">{doc.title}</p>
                  <button onClick={(e) => handleAction(() => onOpen(doc), e)} className="w-full px-3.5 py-2 text-xs text-text-primary dark:text-slate-200 hover:bg-surface-secondary dark:hover:bg-slate-800 flex items-center gap-2">
                    <Eye size={14} className="text-text-muted" /> Open
                  </button>
                  <button onClick={(e) => handleAction(() => onShare(doc), e)} className="w-full px-3.5 py-2 text-xs text-text-primary dark:text-slate-200 hover:bg-surface-secondary dark:hover:bg-slate-800 flex items-center gap-2">
                    <Share2 size={14} className="text-text-muted" /> Share
                  </button>
                  <button onClick={(e) => handleAction(() => onRename(doc), e)} className="w-full px-3.5 py-2 text-xs text-text-primary dark:text-slate-200 hover:bg-surface-secondary dark:hover:bg-slate-800 flex items-center gap-2">
                    <Edit3 size={14} className="text-text-muted" /> Rename
                  </button>
                  <button onClick={(e) => handleAction(() => onExport(doc), e)} className="w-full px-3.5 py-2 text-xs text-text-primary dark:text-slate-200 hover:bg-surface-secondary dark:hover:bg-slate-800 flex items-center gap-2">
                    <Download size={14} className="text-text-muted" /> Download / Export
                  </button>
                  {doc.isOwner !== false && <><div className="h-px bg-border dark:bg-slate-800 my-1" />
                    <button onClick={(e) => handleAction(() => onTrash(doc), e)} className="w-full px-3.5 py-2.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-500/10 flex items-center gap-2">
                      <Trash2 size={14} /> Move to Trash
                    </button></>}
                </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl sm:rounded-2xl border border-border dark:border-slate-800 bg-surface dark:bg-slate-900/90 hover:border-border-hover dark:hover:border-slate-700 active:scale-[0.99] transition-all duration-200 overflow-hidden group cursor-pointer flex flex-col relative"
      onClick={() => !isTrashTab && onOpen(doc)}
    >
      <div className="h-20 sm:h-28 flex items-center justify-center relative overflow-hidden bg-surface-secondary dark:bg-slate-850/80">
        <div
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-xs transition-transform duration-200 group-hover:scale-105"
          style={{ backgroundColor: cfg?.color || '#4f46e5' }}
        >
          <Icon size={26} className="text-white" />
        </div>

        {/* Top-Right Context Menu */}
        <div className="absolute top-2 right-2" ref={menuRef}>
          {isTrashTab ? (
            <div className="flex gap-1">
              <button
                onClick={(e) => handleAction(() => onRestore(doc), e)}
                className="p-1.5 rounded-lg bg-surface/90 dark:bg-slate-900/90 text-emerald-600 hover:bg-emerald-500/20 shadow-xs transition-colors"
                title="Restore"
              >
                <RotateCcw size={14} />
              </button>
              <button
                onClick={(e) => handleAction(() => onPermanentDelete(doc), e)}
                className="p-1.5 rounded-lg bg-surface/90 dark:bg-slate-900/90 text-red-600 hover:bg-red-500/20 shadow-xs transition-colors"
                title="Delete Forever"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ) : (
            <div>
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                className="p-1.5 rounded-lg bg-surface/80 dark:bg-slate-900/80 hover:bg-surface dark:hover:bg-slate-800 text-text-muted hover:text-text-primary shadow-xs transition-colors"
                title="Options"
              >
                <MoreVertical size={15} />
              </button>

              {menuOpen && (
                <>
                <button aria-label="Close file actions" className="fixed inset-0 z-40 bg-slate-950/45 sm:hidden" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }} />
                <div className="fixed inset-x-3 bottom-[calc(var(--mobile-bottom-nav-height)+var(--safe-area-bottom)+10px)] z-50 bg-surface dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-xl py-2 text-left sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-full sm:mt-1 sm:w-44 animate-in slide-in-from-bottom-2 sm:fade-in duration-150">
                  <p className="px-3.5 pb-2 text-[11px] font-semibold text-text-muted truncate sm:hidden">{doc.title}</p>
                  <button onClick={(e) => handleAction(() => onOpen(doc), e)} className="w-full px-3.5 py-2 text-xs text-text-primary dark:text-slate-200 hover:bg-surface-secondary dark:hover:bg-slate-800 flex items-center gap-2">
                    <Eye size={14} className="text-text-muted" /> Open
                  </button>
                  <button onClick={(e) => handleAction(() => onShare(doc), e)} className="w-full px-3.5 py-2 text-xs text-text-primary dark:text-slate-200 hover:bg-surface-secondary dark:hover:bg-slate-800 flex items-center gap-2">
                    <Share2 size={14} className="text-text-muted" /> Share
                  </button>
                  <button onClick={(e) => handleAction(() => onRename(doc), e)} className="w-full px-3.5 py-2 text-xs text-text-primary dark:text-slate-200 hover:bg-surface-secondary dark:hover:bg-slate-800 flex items-center gap-2">
                    <Edit3 size={14} className="text-text-muted" /> Rename
                  </button>
                  <button onClick={(e) => handleAction(() => onExport(doc), e)} className="w-full px-3.5 py-2 text-xs text-text-primary dark:text-slate-200 hover:bg-surface-secondary dark:hover:bg-slate-800 flex items-center gap-2">
                    <Download size={14} className="text-text-muted" /> Download / Export
                  </button>
                  {doc.isOwner !== false && <><div className="h-px bg-border dark:bg-slate-800 my-1" />
                    <button onClick={(e) => handleAction(() => onTrash(doc), e)} className="w-full px-3.5 py-2.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-500/10 flex items-center gap-2">
                      <Trash2 size={14} /> Move to Trash
                    </button></>}
                </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <p className="text-xs sm:text-sm font-semibold text-text-primary dark:text-slate-100 line-clamp-2 leading-snug pr-5 mb-1">{doc.title}</p>
          <p className="text-[11px] text-text-muted dark:text-slate-400 mb-2.5 truncate">{doc.authorName} · {updatedAgo}</p>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-border/50 dark:border-slate-800">
          <span className={`text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full font-semibold ${statusCfg.className}`}>
            {statusCfg.label}
          </span>
          {(doc.commentsCount || 0) > 0 && <span className="text-[10.5px] text-text-muted dark:text-slate-500">{doc.commentsCount} notes</span>}
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

export const CampusWorkspaceHome: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedType = searchParams.get('type') as FilterType | null;
  const initialFilterType: FilterType = requestedType && requestedType in MODULE_CONFIG ? requestedType : 'ALL';
  
  const [owned, setOwned] = useState<WorkspaceDocument[]>([]);
  const [shared, setShared] = useState<WorkspaceDocument[]>([]);
  const [trashed, setTrashed] = useState<WorkspaceDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<FilterType>(initialFilterType);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeTab, setActiveTab] = useState<'recent' | 'mine' | 'shared' | 'pending' | 'trash'>('recent');
  const [loadError, setLoadError] = useState<AppErrorView | null>(null);
  
  // Mobile UI state
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [shareDoc, setShareDoc] = useState<WorkspaceDocument | null>(null);
  const [renameDoc, setRenameDoc] = useState<WorkspaceDocument | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [exportDoc, setExportDoc] = useState<WorkspaceDocument | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (requestedType && requestedType !== 'ALL' && requestedType in MODULE_CONFIG) {
      setFilterType(requestedType);
      setActiveTab('recent');
    }
  }, [requestedType]);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      if (activeTab === 'trash') {
        const result = await workspaceApi.listDocuments({
          status: 'TRASHED',
          type: filterType !== 'ALL' ? filterType : undefined,
          search: search || undefined,
        });
        setTrashed(result.owned || []);
      } else {
        const result = await workspaceApi.listDocuments({
          type: filterType !== 'ALL' ? filterType : undefined,
          search: search || undefined,
        });
        setOwned(result.owned || []);
        setShared(result.shared || []);
      }
    } catch (e) {
      console.error('Failed to load workspace documents', e);
      setOwned([]);
      setShared([]);
      setTrashed([]);
      setLoadError(classifyAppError(e, 'Campus Workspace documents'));
    } finally {
      setLoading(false);
    }
  }, [filterType, search, activeTab, user?.activeWorkspace]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleQuickCreate = async (type: QuickCreateType) => {
    setShowCreateSheet(false);
    try {
      const defaultTitles: Record<QuickCreateType, string> = {
        DOC: 'Untitled Document',
        SHEET: 'Untitled Spreadsheet',
        SLIDE: 'Untitled Presentation',
        FORM: 'Untitled Form',
        QUIZ: 'Untitled Quiz',
        PDF: 'PDF Document',
        NOTE: 'Untitled Note',
        REPORT: 'Untitled Report',
      };
      const doc = await workspaceApi.createDocument({ title: defaultTitles[type], type });
      toast.success(`Created new ${MODULE_CONFIG[type].label}`);
      navigate(`/workspace/${MODULE_CONFIG[type].path}/${doc.id}`);
    } catch (e) {
      toast.error('Failed to create document. Please try again.');
    }
  };

  const handleOpenDocument = (doc: WorkspaceDocument) => {
    const cfg = MODULE_CONFIG[doc.type as QuickCreateType];
    if (cfg) navigate(`/workspace/${cfg.path}/${doc.id}`);
  };

  const handleMoveToTrash = async (doc: WorkspaceDocument) => {
    if (!window.confirm(`Move "${doc.title}" to Trash?`)) return;
    try {
      await workspaceApi.deleteDocument(doc.id);
      toast.success(`"${doc.title}" moved to Trash.`);
      loadDocuments();
    } catch (e) {
      toast.error('Failed to move document to Trash.');
    }
  };

  const handleRestore = async (doc: WorkspaceDocument) => {
    try {
      await workspaceApi.restoreDocument(doc.id);
      toast.success(`"${doc.title}" restored to Active Workspace.`);
      loadDocuments();
    } catch (e) {
      toast.error('Failed to restore document.');
    }
  };

  const handlePermanentDelete = async (doc: WorkspaceDocument) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${doc.title}"? This cannot be undone.`)) {
      return;
    }
    try {
      await workspaceApi.permanentlyDeleteDocument(doc.id);
      toast.success(`"${doc.title}" permanently deleted.`);
      loadDocuments();
    } catch (e) {
      toast.error('Failed to permanently delete document.');
    }
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameDoc || !renameTitle.trim()) return;
    try {
      await workspaceApi.updateDocument(renameDoc.id, { title: renameTitle.trim() });
      toast.success('Document renamed.');
      setRenameDoc(null);
      loadDocuments();
    } catch (e) {
      toast.error('Failed to rename document.');
    }
  };

  const handleExportDownload = async (format: 'pdf' | 'docx' | 'xlsx' | 'csv' | 'pptx') => {
    if (!exportDoc) return;
    setExporting(true);
    try {
      const blob = await workspaceApi.exportDocument(exportDoc.id, format);
      const filename = `${exportDoc.title.replace(/\s+/g, '_')}.${format}`;
      await downloadBlob(blob, filename);
      toast.success(`Exported as ${format.toUpperCase()}`);
      setExportDoc(null);
    } catch (e) {
      toast.error(`Failed to export ${format.toUpperCase()}.`);
    } finally {
      setExporting(false);
    }
  };

  // Derived lists
  const pending = [...owned, ...shared].filter((d) => ['SUBMITTED', 'IN_REVIEW', 'RETURNED'].includes(d.status));
  const recentOwned = [...owned].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 12);

  const displayDocs =
    activeTab === 'recent' ? recentOwned :
    activeTab === 'mine' ? owned :
    activeTab === 'shared' ? shared :
    activeTab === 'trash' ? trashed :
    pending;

  const tabs: Array<{ key: 'recent' | 'mine' | 'shared' | 'pending' | 'trash'; label: string; icon: React.ElementType; count?: number }> = [
    { key: 'recent', label: 'Recent', icon: Clock },
    { key: 'mine', label: 'My Files', icon: FolderOpen },
    { key: 'shared', label: 'Shared', icon: Users },
    { key: 'trash', label: 'Trash', icon: Trash2 },
  ];

  return (
    <div className="min-h-full bg-transparent text-text-primary dark:text-slate-100 font-sans px-3 py-3 min-[360px]:px-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-8 max-w-7xl mx-auto pb-[calc(var(--mobile-bottom-nav-height)+var(--safe-area-bottom)+6rem)] sm:pb-8 overflow-x-hidden">
      
      {/* ─── Hero / Header Banner with Platform Buttons ────────────────── */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-surface dark:bg-slate-900/80 border border-border dark:border-slate-800 p-4 sm:p-8 shadow-card backdrop-blur-md">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
          {/* Left: Branding & Subtitle */}
          <div className="flex items-start sm:items-center gap-3.5 sm:gap-4">
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shrink-0">
              <Sparkles size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-text-primary dark:text-slate-50">
                  Campus Workspace
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-text-muted dark:text-slate-400 mt-0.5 sm:mt-1">
                Docs, sheets, slides, forms and files
              </p>
            </div>
          </div>

          {/* Right: Workspace actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Create Button (Mobile/Desktop) */}
            <button
              onClick={() => setShowCreateSheet(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-3.5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 active:scale-95 text-primary-foreground text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>New Asset</span>
            </button>

            {/* Drive Link */}
            <button
              onClick={() => navigate('/workspace/drive')}
              className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-surface-secondary dark:bg-slate-800/80 hover:bg-surface-secondary/80 border border-border dark:border-slate-700 text-text-primary dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer"
            >
              <HardDrive size={14} />
              <span>Drive Storage</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={loadDocuments}
              className="p-2 sm:p-2.5 rounded-xl bg-surface-secondary dark:bg-slate-800/80 hover:bg-surface-secondary/80 border border-border dark:border-slate-700 text-text-muted hover:text-text-primary dark:text-slate-300 transition-all cursor-pointer"
              title="Refresh Documents"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </section>

      {/* ─── Quick Create Grid ─────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold text-text-primary dark:text-slate-200 flex items-center gap-2">
            <Zap size={16} className="text-amber-500" />
            Quick Create New Asset
          </h2>
        </div>
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar snap-x pb-1 sm:grid sm:grid-cols-4 lg:grid-cols-8 sm:overflow-visible">
          {(Object.keys(MODULE_CONFIG) as QuickCreateType[]).map((type) => (
            <QuickCreateButton key={type} type={type} onCreate={handleQuickCreate} />
          ))}
        </div>
      </section>

      {/* ─── Pending Actions Banner ─────────────────────────────────── */}
      {pending.length > 0 && activeTab !== 'trash' && (
        <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
              <AlertCircle size={18} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                {pending.filter((d) => d.status === 'RETURNED').length > 0
                  ? `${pending.filter((d) => d.status === 'RETURNED').length} ${pending.filter((d) => d.status === 'RETURNED').length === 1 ? 'document' : 'documents'} returned for revision`
                  : `${pending.length} ${pending.length === 1 ? 'document' : 'documents'} pending review`}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300/80">Open the item to review its current workflow status</p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('pending')}
            className="flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline shrink-0 cursor-pointer"
          >
            View all <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* ─── Documents Section ──────────────────────────────────────── */}
      <section className="space-y-4">
        {/* Controls Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          {/* Tabs */}
          <div className="grid grid-cols-4 gap-1 bg-surface dark:bg-slate-900/90 border border-border dark:border-slate-800 rounded-xl sm:rounded-2xl p-1 overflow-hidden w-full lg:flex lg:w-auto">
            {tabs.map(({ key, label, icon: Icon, count }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`flex min-w-0 items-center justify-center gap-1 px-2 py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === key
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-text-muted hover:text-text-primary dark:text-slate-400 dark:hover:text-slate-100 hover:bg-surface-secondary dark:hover:bg-slate-800'
                }`}
              >
                <Icon size={13} className="hidden min-[375px]:block shrink-0" />
                <span>{label}</span>
                {count !== undefined && count > 0 && (
                  <span className="bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.2 min-w-4 text-center font-bold">
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search, Filter & View Mode */}
          <div className="flex flex-col min-[480px]:flex-row items-stretch min-[480px]:items-center gap-2.5 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 lg:w-60">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search documents..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface dark:bg-slate-900/90 border border-border dark:border-slate-800 rounded-xl text-text-primary dark:text-slate-100 placeholder:text-text-muted outline-none focus:border-primary transition-all"
              />
            </div>

            <div className="flex items-center gap-2 justify-between min-[480px]:justify-start">
              {/* Type Filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as FilterType)}
                className="flex-1 min-[480px]:flex-none text-xs border border-border dark:border-slate-800 rounded-xl px-3 py-1.5 bg-surface dark:bg-slate-900/90 text-text-primary dark:text-slate-200 outline-none focus:border-primary cursor-pointer"
              >
                <option value="ALL">All Types</option>
                {Object.entries(MODULE_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>

              {/* View Mode Toggle */}
              <div className="flex bg-surface dark:bg-slate-900/90 border border-border dark:border-slate-800 rounded-xl p-0.5 overflow-hidden shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-primary/15 text-primary'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                  title="Grid View"
                >
                  <Grid3X3 size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-primary/15 text-primary'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                  title="List View"
                >
                  <List size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Documents Grid / List */}
        {loadError ? (
          <AppErrorState error={loadError} onRetry={loadDocuments} onBack={() => navigate(-1)} />
        ) : loading ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4' : 'space-y-2'}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`animate-pulse bg-surface-secondary dark:bg-slate-850 rounded-2xl ${viewMode === 'grid' ? 'h-48' : 'h-14'}`} />
            ))}
          </div>
        ) : displayDocs.length === 0 ? (
          <div className="text-center py-16 bg-surface dark:bg-slate-900/60 rounded-3xl border border-dashed border-border dark:border-slate-800 p-8">
            <FolderOpen size={48} className="mx-auto text-text-muted/40 mb-3" />
            <p className="text-sm font-bold text-text-primary dark:text-slate-200">
              {activeTab === 'trash' ? 'Trash is empty.' : activeTab === 'shared' ? 'No files have been shared with you.' : activeTab === 'recent' ? 'No recent files.' : 'No files found.'}
            </p>
            <p className="text-xs text-text-muted dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {activeTab === 'trash'
                ? 'Items moved to trash will appear here for 30 days before permanent removal.'
                : activeTab === 'shared'
                ? 'Files shared with your account or role will appear here.'
                : activeTab === 'pending'
                ? 'No pending reviews currently requiring your attention.'
                : 'Create your first document using the Quick Create tools above.'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-4">
            {displayDocs.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                viewMode="grid"
                isTrashTab={activeTab === 'trash'}
                onOpen={handleOpenDocument}
                onShare={(d) => setShareDoc(d)}
                onRename={(d) => { setRenameDoc(d); setRenameTitle(d.title); }}
                onExport={(d) => setExportDoc(d)}
                onTrash={handleMoveToTrash}
                onRestore={handleRestore}
                onPermanentDelete={handlePermanentDelete}
              />
            ))}
          </div>
        ) : (
          <div className="bg-surface dark:bg-slate-900/90 rounded-2xl border border-border dark:border-slate-800 divide-y divide-border/60 dark:divide-slate-800 overflow-hidden shadow-xs">
            {displayDocs.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                viewMode="list"
                isTrashTab={activeTab === 'trash'}
                onOpen={handleOpenDocument}
                onShare={(d) => setShareDoc(d)}
                onRename={(d) => { setRenameDoc(d); setRenameTitle(d.title); }}
                onExport={(d) => setExportDoc(d)}
                onTrash={handleMoveToTrash}
                onRestore={handleRestore}
                onPermanentDelete={handlePermanentDelete}
              />
            ))}
          </div>
        )}
      </section>

      {/* ─── All Modules Navigation Cards ───────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-sm sm:text-base font-bold text-text-primary dark:text-slate-200 flex items-center gap-2">
          <Building2 size={16} className="text-primary" />
          All Workspace Modules
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {(Object.entries(MODULE_CONFIG) as [QuickCreateType, typeof MODULE_CONFIG[QuickCreateType]][]).map(([type, cfg]) => {
            const Icon = cfg.icon;
            const typeCount = owned.filter((d) => d.type === type).length;
            return (
              <button
                key={type}
                onClick={() => {
                  setFilterType(type);
                  setActiveTab('recent');
                  navigate(`/workspace?type=${type}`, { replace: true });
                }}
                className="p-3.5 sm:p-5 bg-surface dark:bg-slate-900/80 rounded-2xl border border-border dark:border-slate-800 hover:border-primary/40 dark:hover:border-slate-700 hover:shadow-card hover:-translate-y-0.5 active:translate-y-0 text-left transition-all duration-200 group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                  <div
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shadow-xs"
                    style={{ backgroundColor: cfg.color }}
                  >
                    <Icon size={20} className="text-white" />
                  </div>
                  <ArrowUpRight size={16} className="text-text-muted group-hover:text-primary transition-colors" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-text-primary dark:text-slate-100">{cfg.label}</p>
                <p className="text-[11px] sm:text-xs text-text-muted dark:text-slate-400 mt-0.5">
                  {typeCount} {typeCount === 1 ? 'item' : 'items'}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* ─── Mobile Floating "+" Quick Create Action Button ──────────── */}
      <div className="sm:hidden fixed right-4 bottom-[calc(var(--mobile-bottom-nav-height)+var(--safe-area-bottom)+14px)] z-40">
        <button
          onClick={() => setShowCreateSheet(true)}
          className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Create New Workspace Item"
        >
          <Plus size={22} />
        </button>
      </div>

      {/* ─── Mobile Bottom Sheet Quick Create Modal ───────────────────── */}
      {showCreateSheet && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-surface dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-border dark:border-slate-800 shadow-2xl p-6 overflow-hidden animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-text-primary dark:text-slate-100 flex items-center gap-2">
                <Plus size={18} className="text-primary" /> Create New Asset
              </h3>
              <button onClick={() => setShowCreateSheet(false)} className="p-1.5 text-text-muted hover:text-text-primary rounded-full hover:bg-surface-secondary">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {(Object.keys(MODULE_CONFIG) as QuickCreateType[]).map((type) => {
                const cfg = MODULE_CONFIG[type];
                const Icon = cfg.icon;
                return (
                  <button
                    key={type}
                    onClick={() => handleQuickCreate(type)}
                    className="flex items-center gap-3 p-3 rounded-2xl border border-border dark:border-slate-800 hover:border-primary/40 bg-surface-secondary/40 dark:bg-slate-800/40 text-left transition-all"
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs" style={{ backgroundColor: cfg.color }}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-text-primary dark:text-slate-200">{cfg.label.replace('Campus ', '')}</p>
                      <p className="text-[10px] text-text-muted">Create new</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── Rename Document Dialog ───────────────────────────────────── */}
      {renameDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-surface dark:bg-slate-900 rounded-3xl border border-border dark:border-slate-800 shadow-2xl p-6">
            <h3 className="text-base font-bold text-text-primary dark:text-slate-100 mb-3">
              Rename Document
            </h3>
            <form onSubmit={handleRenameSubmit} className="space-y-4">
              <input
                type="text"
                value={renameTitle}
                onChange={(e) => setRenameTitle(e.target.value)}
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-slate-800 bg-surface-secondary dark:bg-slate-800 text-sm text-text-primary dark:text-slate-100 outline-none focus:border-primary"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRenameDoc(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-text-muted hover:bg-surface-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Export Format Bottom Sheet ───────────────────────────────── */}
      {exportDoc && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-surface dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-border dark:border-slate-800 shadow-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-text-primary dark:text-slate-100 flex items-center gap-2">
                <Download size={18} className="text-primary" /> Export Document
              </h3>
              <button onClick={() => setExportDoc(null)} className="p-1 text-text-muted hover:text-text-primary">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-text-muted mb-4 truncate">
              Choose export format for <strong>{exportDoc.title}</strong>
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={exporting}
                onClick={() => handleExportDownload('pdf')}
                className="p-3 rounded-2xl border border-border dark:border-slate-800 hover:border-red-500/40 bg-surface-secondary/40 text-left transition-all"
              >
                <span className="text-xs font-bold block text-red-500">PDF Document</span>
                <span className="text-[10px] text-text-muted">Universal layout</span>
              </button>
              <button
                disabled={exporting}
                onClick={() => handleExportDownload('docx')}
                className="p-3 rounded-2xl border border-border dark:border-slate-800 hover:border-blue-500/40 bg-surface-secondary/40 text-left transition-all"
              >
                <span className="text-xs font-bold block text-blue-500">Word (DOCX)</span>
                <span className="text-[10px] text-text-muted">Editable document</span>
              </button>
              {exportDoc.type === 'SHEET' && (
                <>
                  <button
                    disabled={exporting}
                    onClick={() => handleExportDownload('xlsx')}
                    className="p-3 rounded-2xl border border-border dark:border-slate-800 hover:border-emerald-500/40 bg-surface-secondary/40 text-left transition-all"
                  >
                    <span className="text-xs font-bold block text-emerald-500">Excel (XLSX)</span>
                    <span className="text-[10px] text-text-muted">Spreadsheet</span>
                  </button>
                  <button
                    disabled={exporting}
                    onClick={() => handleExportDownload('csv')}
                    className="p-3 rounded-2xl border border-border dark:border-slate-800 hover:border-emerald-500/40 bg-surface-secondary/40 text-left transition-all"
                  >
                    <span className="text-xs font-bold block text-emerald-500">CSV Data</span>
                    <span className="text-[10px] text-text-muted">Comma separated</span>
                  </button>
                </>
              )}
              {exportDoc.type === 'SLIDE' && (
                <button
                  disabled={exporting}
                  onClick={() => handleExportDownload('pptx')}
                  className="p-3 rounded-2xl border border-border dark:border-slate-800 hover:border-amber-500/40 bg-surface-secondary/40 text-left transition-all col-span-2"
                >
                  <span className="text-xs font-bold block text-amber-500">PowerPoint (PPTX)</span>
                  <span className="text-[10px] text-text-muted">Slide presentation</span>
                </button>
              )}
            </div>

            {exporting && (
              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-primary font-semibold">
                <Loader2 size={16} className="animate-spin" /> Generating authenticated export...
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Share Modal ──────────────────────────────────────────────── */}
      {shareDoc && (
        <WorkspaceShareModal
          documentId={shareDoc.id}
          title={shareDoc.title}
          onClose={() => setShareDoc(null)}
        />
      )}

    </div>
  );
};

export default CampusWorkspaceHome;
