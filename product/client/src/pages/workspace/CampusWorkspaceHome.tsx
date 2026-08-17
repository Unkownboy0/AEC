import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Table2, Presentation, ClipboardList, FileQuestion,
  NotebookPen, BarChart3, LayoutTemplate, FolderOpen,
  Plus, Search, Clock, Star, Users, Building2, CheckCircle2,
  AlertCircle, RotateCcw, RefreshCw, Filter, Grid3X3, List,
  Sparkles, ChevronRight, ArrowUpRight, Eye, Edit3, Share2,
  Download, MoreHorizontal, HardDrive, Zap, File
} from 'lucide-react';
import { workspaceApi, WorkspaceDocument } from '../../services/workspace.api';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../components/ui/Toast';

// ─── Types ──────────────────────────────────────────────────────────────────

type QuickCreateType = 'DOC' | 'SHEET' | 'SLIDE' | 'FORM' | 'QUIZ' | 'PDF' | 'NOTE' | 'REPORT';
type FilterType = 'ALL' | 'DOC' | 'SHEET' | 'SLIDE' | 'FORM' | 'QUIZ' | 'PDF' | 'NOTE' | 'REPORT';
type ViewMode = 'grid' | 'list';

// ─── Constants ────────────────────────────────────────────────────────────────

const MODULE_CONFIG = {
  DOC: { label: 'Campus Docs', icon: FileText, color: '#1a73e8', bg: '#e8f0fe', path: 'docs' },
  SHEET: { label: 'Campus Sheets', icon: Table2, color: '#0f9d58', bg: '#e6f4ea', path: 'sheets' },
  SLIDE: { label: 'Campus Slides', icon: Presentation, color: '#f4b400', bg: '#fef7e0', path: 'slides' },
  FORM: { label: 'Campus Forms', icon: ClipboardList, color: '#db4437', bg: '#fce8e6', path: 'forms' },
  QUIZ: { label: 'Campus Quiz', icon: FileQuestion, color: '#8e24aa', bg: '#f3e8fd', path: 'quiz' },
  PDF: { label: 'Campus PDF', icon: File, color: '#e53935', bg: '#fde8e7', path: 'pdf' },
  NOTE: { label: 'Campus Notes', icon: NotebookPen, color: '#fb8c00', bg: '#fff3e0', path: 'notes' },
  REPORT: { label: 'Campus Reports', icon: BarChart3, color: '#00897b', bg: '#e0f2f1', path: 'reports' },
} as const;

const STATUS_CONFIG = {
  DRAFT: { label: 'Draft', color: '#6b7280', bg: '#f3f4f6' },
  SUBMITTED: { label: 'Submitted', color: '#2563eb', bg: '#dbeafe' },
  IN_REVIEW: { label: 'In Review', color: '#d97706', bg: '#fef3c7' },
  RETURNED: { label: 'Returned', color: '#dc2626', bg: '#fee2e2' },
  APPROVED: { label: 'Approved', color: '#16a34a', bg: '#dcfce7' },
  PUBLISHED: { label: 'Published', color: '#7c3aed', bg: '#ede9fe' },
  ARCHIVED: { label: 'Archived', color: '#9ca3af', bg: '#f9fafb' },
};

// ─── Components ────────────────────────────────────────────────────────────────

const QuickCreateButton: React.FC<{ type: QuickCreateType; onCreate: (type: QuickCreateType) => void }> = ({ type, onCreate }) => {
  const cfg = MODULE_CONFIG[type];
  const Icon = cfg.icon;
  return (
    <button
      onClick={() => onCreate(type)}
      className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-transparent hover:border-current/20 hover:shadow-md transition-all duration-200 group"
      style={{ background: cfg.bg }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: cfg.color }}>
        <Icon size={20} color="white" />
      </div>
      <span className="text-xs font-medium text-gray-700 text-center leading-tight">{cfg.label.replace('Campus ', '')}</span>
    </button>
  );
};

const DocumentCard: React.FC<{
  doc: WorkspaceDocument;
  viewMode: ViewMode;
  onOpen: (doc: WorkspaceDocument) => void;
}> = ({ doc, viewMode, onOpen }) => {
  const cfg = MODULE_CONFIG[doc.type as QuickCreateType];
  const statusCfg = STATUS_CONFIG[doc.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.DRAFT;
  const Icon = cfg?.icon || FileText;
  const updatedAgo = getTimeAgo(doc.updatedAt);

  if (viewMode === 'list') {
    return (
      <div
        className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-gray-50 cursor-pointer group transition-colors border border-transparent hover:border-gray-200"
        onClick={() => onOpen(doc)}
      >
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: cfg?.bg || '#f3f4f6' }}>
          <Icon size={18} style={{ color: cfg?.color || '#6b7280' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
          <p className="text-xs text-gray-500">{doc.authorName} · {updatedAgo}</p>
        </div>
        <span className="text-xs px-2 py-1 rounded-full font-medium flex-shrink-0" style={{ color: statusCfg.color, background: statusCfg.bg }}>
          {statusCfg.label}
        </span>
        <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
          <button className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"><Eye size={14} className="text-gray-500" /></button>
          <button className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"><Share2 size={14} className="text-gray-500" /></button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-lg cursor-pointer transition-all duration-200 overflow-hidden group bg-white"
      onClick={() => onOpen(doc)}
    >
      <div className="h-32 flex items-center justify-center" style={{ background: cfg?.bg || '#f3f4f6' }}>
        <Icon size={40} style={{ color: cfg?.color || '#6b7280', opacity: 0.7 }} />
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold text-gray-900 truncate mb-1">{doc.title}</p>
        <p className="text-xs text-gray-500 mb-2">{doc.authorName} · {updatedAgo}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: statusCfg.color, background: statusCfg.bg }}>
            {statusCfg.label}
          </span>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs text-gray-400">{doc.commentsCount} comments</span>
          </div>
        </div>
      </div>
    </div>
  );
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

// ─── Main Component ────────────────────────────────────────────────────────────

const CampusWorkspaceHome: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [owned, setOwned] = useState<WorkspaceDocument[]>([]);
  const [shared, setShared] = useState<WorkspaceDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeTab, setActiveTab] = useState<'recent' | 'mine' | 'shared' | 'pending'>('recent');
  const [creating, setCreating] = useState(false);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const result = await workspaceApi.listDocuments({
        type: filterType !== 'ALL' ? filterType : undefined,
        search: search || undefined,
      });
      setOwned(result.owned || []);
      setShared(result.shared || []);
    } catch (e) {
      console.error('Failed to load workspace documents', e);
    } finally {
      setLoading(false);
    }
  }, [filterType, search]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleQuickCreate = async (type: QuickCreateType) => {
    setCreating(true);
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
      navigate(`/workspace/${MODULE_CONFIG[type].path}/${doc.id}`);
    } catch (e) {
      toast.error('Failed to create document. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenDocument = (doc: WorkspaceDocument) => {
    const cfg = MODULE_CONFIG[doc.type as QuickCreateType];
    if (cfg) navigate(`/workspace/${cfg.path}/${doc.id}`);
  };

  // Derived lists
  const pending = [...owned, ...shared].filter((d) => ['SUBMITTED', 'IN_REVIEW', 'RETURNED'].includes(d.status));
  const recentOwned = [...owned].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 12);

  const displayDocs =
    activeTab === 'recent' ? recentOwned :
    activeTab === 'mine' ? owned :
    activeTab === 'shared' ? shared :
    pending;

  const tabs: Array<{ key: 'recent' | 'mine' | 'shared' | 'pending'; label: string; icon: React.ElementType; count?: number }> = [
    { key: 'recent', label: 'Recent', icon: Clock },
    { key: 'mine', label: 'Mine', icon: FolderOpen },
    { key: 'shared', label: 'Shared', icon: Users },
    { key: 'pending', label: 'Pending', icon: AlertCircle, count: pending.length },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm">
                <Sparkles size={18} color="white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Campus Workspace</h1>
                <p className="text-xs text-gray-500">Your institutional productivity suite</p>
              </div>
            </div>

            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search documents, sheets, forms…"
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-100 hover:bg-gray-200 focus:bg-white border border-transparent focus:border-blue-500 rounded-xl outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/workspace/drive')}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <HardDrive size={16} />
                <span className="hidden sm:inline">Drive</span>
              </button>
              <button
                onClick={loadDocuments}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 space-y-8">

        {/* ─── Quick Create ─────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <Zap size={16} className="text-yellow-500" />
              Quick Create
            </h2>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {(Object.keys(MODULE_CONFIG) as QuickCreateType[]).map((type) => (
              <QuickCreateButton key={type} type={type} onCreate={handleQuickCreate} />
            ))}
          </div>
        </section>

        {/* ─── Pending Actions Banner ─────────────────────────────────── */}
        {pending.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
                <AlertCircle size={16} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  {pending.filter((d) => d.status === 'RETURNED').length > 0
                    ? `${pending.filter((d) => d.status === 'RETURNED').length} document(s) returned for revision`
                    : `${pending.length} document(s) pending review`}
                </p>
                <p className="text-xs text-amber-700">Review and take action</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('pending')}
              className="flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-900 transition-colors"
            >
              View all <ChevronRight size={12} />
            </button>
          </div>
        )}

        {/* ─── Documents Section ──────────────────────────────────────── */}
        <section>
          {/* Tabs */}
          <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
              {tabs.map(({ key, label, icon: Icon, count }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeTab === key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon size={12} />
                  {label}
                  {count !== undefined && count > 0 && (
                    <span className="bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {/* Type filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as FilterType)}
                className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="ALL">All Types</option>
                {Object.entries(MODULE_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>

              {/* View mode */}
              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'} transition-colors`}
                >
                  <Grid3X3 size={14} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'} transition-colors`}
                >
                  <List size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Documents grid/list */}
          {loading ? (
            <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4' : 'space-y-1'}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`animate-pulse bg-gray-200 rounded-2xl ${viewMode === 'grid' ? 'h-48' : 'h-12'}`} />
              ))}
            </div>
          ) : displayDocs.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
              <FolderOpen size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-500">No documents found</p>
              <p className="text-xs text-gray-400 mt-1">
                {activeTab === 'pending' ? 'No documents awaiting your attention.' : 'Create your first document using Quick Create above.'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {displayDocs.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} viewMode="grid" onOpen={handleOpenDocument} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
              {displayDocs.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} viewMode="list" onOpen={handleOpenDocument} />
              ))}
            </div>
          )}
        </section>

        {/* ─── Module Navigation Cards ───────────────────────────────── */}
        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Building2 size={16} className="text-blue-500" />
            All Modules
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(Object.entries(MODULE_CONFIG) as [QuickCreateType, typeof MODULE_CONFIG[QuickCreateType]][]).map(([type, cfg]) => {
              const Icon = cfg.icon;
              const typeCount = owned.filter((d) => d.type === type).length;
              return (
                <button
                  key={type}
                  onClick={() => navigate(`/workspace/${cfg.path}`)}
                  className="p-4 bg-white rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-md text-left transition-all duration-200 group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: cfg.bg }}>
                      <Icon size={20} style={{ color: cfg.color }} />
                    </div>
                    <ArrowUpRight size={14} className="text-gray-300 group-hover:text-gray-600 transition-colors" />
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{cfg.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{typeCount} {typeCount === 1 ? 'item' : 'items'}</p>
                </button>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
};

export default CampusWorkspaceHome;
