import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Folder, FolderOpen, FileText, Table2, Presentation,
  File, Image, Upload, Search, Grid3X3, List, Star, Trash2,
  Download, Share2, ArrowLeft, HardDrive, Users,
  Building2, Globe, ChevronRight, FolderPlus,
  Loader2, RefreshCw, Undo2, AlertTriangle, X, Check, Lock
} from 'lucide-react';
import { workspaceApi } from '../../services/workspace.api';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../components/ui/Toast';
import { downloadFile } from '../../platform/download';
import { AppErrorState } from '../../components/shared/AppErrorState';
import { classifyAppError, type AppErrorView } from '../../shared/errors/app-error';
import { prepareFileUpload } from '../../services/file-upload';

// ─── Types ───────────────────────────────────────────────────────────────────

export type DriveScope = 'PERSONAL' | 'DEPARTMENT' | 'SHARED' | 'COLLEGE' | 'TRASH' | 'STARRED';

export interface DriveItem {
  id: string;
  name: string;
  isFolder: boolean;
  parentId?: string;
  mimeType?: string;
  fileSize?: number;
  fileUrl?: string;
  fileId?: string;
  downloadUrl?: string;
  documentId?: string;
  ownerId: string;
  scope: string;
  isStarred: boolean;
  isTrashed: boolean;
  trashedAt?: string;
  createdAt: string;
  updatedAt: string;
  owner?: { faculty?: { firstName: string; lastName: string } };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getFileIcon(item: DriveItem): React.ElementType {
  if (item.isFolder) return FolderOpen;
  const mime = item.mimeType || '';
  if (mime.includes('image')) return Image;
  if (mime.includes('pdf')) return FileText;
  if (mime.includes('sheet') || mime.includes('csv')) return Table2;
  if (mime.includes('presentation') || mime.includes('pptx')) return Presentation;
  if (mime.includes('word') || mime.includes('docx')) return FileText;
  return File;
}

function getFileColor(item: DriveItem): string {
  if (item.isFolder) return '#f4b400';
  const mime = item.mimeType || '';
  if (mime.includes('image')) return '#00897b';
  if (mime.includes('pdf')) return '#e53935';
  if (mime.includes('sheet') || mime.includes('csv')) return '#0f9d58';
  if (mime.includes('presentation')) return '#f4b400';
  if (mime.includes('word')) return '#1a73e8';
  return '#6b7280';
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

function getTimeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Campus Drive Page ────────────────────────────────────────────────────────

const CampusDrivePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialScope = (searchParams.get('scope')?.toUpperCase() as DriveScope) || 'PERSONAL';
  const [scope, setScope] = useState<DriveScope>(
    ['PERSONAL', 'DEPARTMENT', 'SHARED', 'COLLEGE', 'TRASH', 'STARRED'].includes(initialScope) ? initialScope : 'PERSONAL'
  );
  const [currentParentId, setCurrentParentId] = useState<string | undefined>(undefined);
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string; name: string }>>([]);
  const [items, setItems] = useState<DriveItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadError, setLoadError] = useState<AppErrorView | null>(null);
  const [shareModalItem, setShareModalItem] = useState<DriveItem | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      if (scope === 'TRASH') {
        const data = await workspaceApi.getDriveItems('PERSONAL', undefined, { trashed: true, search: search.trim() || undefined });
        setItems(data || []);
      } else if (scope === 'STARRED') {
        const data = await workspaceApi.getDriveItems('PERSONAL', undefined, { search: search.trim() || undefined });
        setItems((data || []).filter((i: DriveItem) => i.isStarred && !i.isTrashed));
      } else {
        const data = await workspaceApi.getDriveItems(scope, currentParentId, { search: search.trim() || undefined });
        setItems(data || []);
      }
    } catch (error) {
      setItems([]);
      setLoadError(classifyAppError(error, 'Campus Drive files'));
    } finally {
      setLoading(false);
    }
  }, [scope, currentParentId, search, user?.activeWorkspace]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleCreateFolder = async () => {
    const name = window.prompt('Folder name:');
    if (!name) return;
    setCreating(true);
    try {
      await workspaceApi.createDriveItem({ name, isFolder: true, parentId: currentParentId, scope: scope === 'TRASH' || scope === 'STARRED' ? 'PERSONAL' : scope });
      await loadItems();
      toast.success('Folder created.');
    } catch {
      toast.error('Failed to create folder.');
    } finally {
      setCreating(false);
    }
  };

  const handleNavigateFolder = (item: DriveItem) => {
    if (!item.isFolder || scope === 'TRASH') return;
    setBreadcrumbs((prev) => [...prev, { id: item.id, name: item.name }]);
    setCurrentParentId(item.id);
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      setBreadcrumbs([]);
      setCurrentParentId(undefined);
    } else {
      setBreadcrumbs((prev) => prev.slice(0, index + 1));
      setCurrentParentId(breadcrumbs[index].id);
    }
  };

  const handleToggleStar = async (item: DriveItem) => {
    try {
      await workspaceApi.updateDriveItem(item.id, { isStarred: !item.isStarred });
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, isStarred: !i.isStarred } : i));
      toast.success(item.isStarred ? 'Removed from Starred' : 'Added to Starred');
    } catch {
      toast.error('Failed to update item.');
    }
  };

  const handleTrash = async (item: DriveItem) => {
    if (!window.confirm(`Move "${item.name}" to trash?`)) return;
    try {
      await workspaceApi.updateDriveItem(item.id, { isTrashed: true });
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast.success('Moved to trash.');
    } catch {
      toast.error('Failed to trash item.');
    }
  };

  const handleRestore = async (item: DriveItem) => {
    try {
      await workspaceApi.restoreDriveItem(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast.success(`Restored "${item.name}" to My Drive.`);
    } catch {
      toast.error('Failed to restore item.');
    }
  };

  const handlePermanentDelete = async (item: DriveItem) => {
    if (!window.confirm(`Permanently delete "${item.name}"? This action cannot be undone.`)) return;
    try {
      if (item.fileId) {
        await workspaceApi.permanentlyDeleteDriveItem(item.id, item.fileId);
      } else {
        await workspaceApi.permanentlyDeleteDriveFolder(item.id);
      }
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast.success(`Permanently deleted "${item.name}".`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to permanently delete item.');
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const payload = await prepareFileUpload(file, {
        allowedMimeTypes: [
          'application/pdf', 'image/png', 'image/jpeg', 'image/webp',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv',
          'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'application/zip', 'application/x-zip-compressed', 'text/plain',
        ],
        maximumBytes: 25 * 1024 * 1024,
        label: 'Campus Drive upload',
      });
      await workspaceApi.uploadDriveFile({
        name: payload.name,
        mimeType: payload.mimeType,
        base64: payload.base64,
        parentId: currentParentId,
        scope: scope === 'SHARED' || scope === 'TRASH' || scope === 'STARRED' ? 'PERSONAL' : scope,
        sourceModule: 'CAMPUS_DRIVE',
      });
      await loadItems();
      toast.success(`Uploaded "${file.name}" to Campus Drive.`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'File upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileAction = async (item: DriveItem, action: 'open' | 'save' | 'share') => {
    if (item.documentId) {
      const workspaceKind = (item.mimeType?.split('.').pop() || 'doc').toLowerCase();
      const routeKind: Record<string, string> = {
        doc: 'docs', sheet: 'sheets', slide: 'slides', form: 'forms', quiz: 'quiz', note: 'notes', report: 'reports',
      };
      const destination = `/workspace/${routeKind[workspaceKind] || 'docs'}/${item.documentId}`;
      if (action !== 'open') toast.info('Open the Workspace document to export or manage sharing.');
      navigate(destination);
      return;
    }
    if (action === 'share') {
      setShareModalItem(item);
      return;
    }
    if (!item.downloadUrl) return;
    const result = await downloadFile({ endpoint: item.downloadUrl, filename: item.name, action });
    if (!result.success) toast.error(result.error || `Unable to ${action} this file.`);
  };

  const folders = items.filter((i) => i.isFolder);
  const files = items.filter((i) => !i.isFolder);

  const SCOPE_CONFIG = {
    PERSONAL: { label: 'My Drive', icon: HardDrive, color: '#1a73e8' },
    DEPARTMENT: { label: 'Department', icon: Building2, color: '#0f9d58' },
    SHARED: { label: 'Shared with me', icon: Users, color: '#f4b400' },
    COLLEGE: { label: 'College Drive', icon: Globe, color: '#8e24aa' },
    STARRED: { label: 'Starred', icon: Star, color: '#eab308' },
    TRASH: { label: 'Trash', icon: Trash2, color: '#ef4444' },
  };

  return (
    <div className="flex min-h-full bg-app-bg overflow-hidden text-foreground">

      {/* ─── Sidebar ────────────────────────────────────────────── */}
      <div className="hidden w-56 bg-card border-r border-border md:flex flex-col overflow-hidden flex-shrink-0">
        <div className="px-4 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <HardDrive size={18} className="text-blue-500" />
            <h2 className="text-sm font-bold text-foreground">Campus Drive</h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {(['PERSONAL', 'DEPARTMENT', 'SHARED', 'COLLEGE'] as DriveScope[]).map((key) => {
            const cfg = SCOPE_CONFIG[key];
            const Icon = cfg.icon;
            return (
              <button
                key={key}
                onClick={() => { setScope(key); setBreadcrumbs([]); setCurrentParentId(undefined); setSearchParams({ scope: key }); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  scope === key ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <Icon size={16} style={{ color: cfg.color }} />
                <span className="text-sm">{cfg.label}</span>
              </button>
            );
          })}

          <div className="mt-3 pt-3 border-t border-border px-2 space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 mb-2">Shortcuts</p>
            <button
              onClick={() => { setScope('STARRED'); setBreadcrumbs([]); setCurrentParentId(undefined); setSearchParams({ scope: 'STARRED' }); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs transition-colors ${
                scope === 'STARRED' ? 'bg-yellow-500/10 text-yellow-600 font-bold' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <Star size={15} className="text-yellow-500" /> Starred
            </button>
            <button
              onClick={() => { setScope('TRASH'); setBreadcrumbs([]); setCurrentParentId(undefined); setSearchParams({ scope: 'TRASH' }); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs transition-colors ${
                scope === 'TRASH' ? 'bg-red-500/10 text-red-600 font-bold' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <Trash2 size={15} className="text-red-500" /> Trash
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="p-3 border-t border-border space-y-1">
          {scope !== 'TRASH' && (
            <button
              onClick={handleCreateFolder}
              disabled={creating}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted rounded-xl transition-colors"
            >
              <FolderPlus size={14} /> New Folder
            </button>
          )}
          <button
            onClick={() => navigate('/workspace')}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:bg-muted rounded-xl transition-colors"
          >
            <ArrowLeft size={14} /> Back to Workspace
          </button>
        </div>
      </div>

      {/* ─── Main Content ───────────────────────────────────────── */}
      <div className="min-w-0 flex-1 flex flex-col overflow-hidden">

        {/* Mobile Horizontal Tabs */}
        <div className="flex gap-2 overflow-x-auto border-b border-border bg-card px-3 py-2 md:hidden">
          {(['PERSONAL', 'DEPARTMENT', 'SHARED', 'COLLEGE', 'STARRED', 'TRASH'] as DriveScope[]).map((key) => {
            const cfg = SCOPE_CONFIG[key];
            const Icon = cfg.icon;
            return (
              <button
                key={key}
                onClick={() => { setScope(key); setBreadcrumbs([]); setCurrentParentId(undefined); setSearchParams({ scope: key }); }}
                className={`flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-bold ${
                  scope === key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Top bar */}
        <div className="bg-card border-b border-border flex flex-wrap items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4 flex-shrink-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground flex-1 min-w-0">
            <button onClick={() => handleBreadcrumbClick(-1)} className="hover:text-primary font-bold text-foreground transition-colors flex-shrink-0">
              {SCOPE_CONFIG[scope].label}
            </button>
            {breadcrumbs.map((bc, i) => (
              <React.Fragment key={bc.id}>
                <ChevronRight size={13} className="text-muted-foreground flex-shrink-0" />
                <button
                  onClick={() => handleBreadcrumbClick(i)}
                  className="hover:text-primary transition-colors truncate max-w-[150px]"
                >
                  {bc.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Search */}
          <div className="relative order-3 w-full flex-shrink-0 sm:order-none sm:w-52">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files…"
              className="w-full pl-8 pr-3 py-2 text-xs bg-muted text-foreground rounded-xl outline-none focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {scope !== 'TRASH' && scope !== 'SHARED' && (
            <>
              <input ref={uploadInputRef} type="file" className="sr-only" onChange={handleUpload} accept=".pdf,.png,.jpg,.jpeg,.webp,.xlsx,.csv,.xls,.docx,.pptx,.zip,.txt" />
              <button onClick={() => uploadInputRef.current?.click()} disabled={uploading} className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-45">
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Upload
              </button>
            </>
          )}

          {/* View mode */}
          <div className="flex border border-border rounded-lg overflow-hidden flex-shrink-0">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'} transition-colors`}><Grid3X3 size={14} /></button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'} transition-colors`}><List size={14} /></button>
          </div>

          <button onClick={loadItems} className="p-2 text-muted-foreground hover:bg-muted rounded-xl transition-colors flex-shrink-0">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Trash Banner if in Trash Scope */}
        {scope === 'TRASH' && (
          <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2.5 flex items-center justify-between text-xs text-red-600 dark:text-red-400">
            <div className="flex items-center gap-2">
              <Trash2 size={14} />
              <span>Items in Trash are quarantined and can be restored or permanently deleted.</span>
            </div>
          </div>
        )}

        {/* File grid/list */}
        <div className="flex-1 overflow-y-auto p-3 pb-24 sm:p-4 md:pb-4">
          {loadError ? (
            <AppErrorState error={loadError} onRetry={loadItems} onBack={() => navigate(-1)} />
          ) : loading ? (
            <div className={viewMode === 'grid' ? 'grid grid-cols-2 min-[390px]:grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3' : 'space-y-1'}>
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className={`animate-pulse bg-muted rounded-2xl ${viewMode === 'grid' ? 'h-28' : 'h-10'}`} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
              {scope === 'TRASH' ? (
                <>
                  <Trash2 size={48} className="opacity-40 text-red-500" />
                  <p className="text-sm font-semibold">Trash is empty.</p>
                </>
              ) : (
                <>
                  <FolderOpen size={48} className="opacity-40" />
                  <p className="text-sm">This drive section is empty.</p>
                  {scope !== 'SHARED' && (
                    <button onClick={handleCreateFolder} className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors">
                      <FolderPlus size={14} /> Create a folder
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            <>
              {/* Folders */}
              {folders.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Folders</h3>
                  <div className={viewMode === 'grid' ? 'grid grid-cols-2 min-[390px]:grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3' : 'space-y-1'}>
                    {folders.map((item) => (
                      <DriveItemCard
                        key={item.id}
                        item={item}
                        viewMode={viewMode}
                        isTrashView={scope === 'TRASH'}
                        onNavigate={() => handleNavigateFolder(item)}
                        onStar={() => handleToggleStar(item)}
                        onTrash={() => handleTrash(item)}
                        onRestore={() => handleRestore(item)}
                        onPermanentDelete={() => handlePermanentDelete(item)}
                        onFileAction={handleFileAction}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Files */}
              {files.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Files</h3>
                  <div className={viewMode === 'grid' ? 'grid grid-cols-2 min-[390px]:grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3' : 'space-y-1'}>
                    {files.map((item) => (
                      <DriveItemCard
                        key={item.id}
                        item={item}
                        viewMode={viewMode}
                        isTrashView={scope === 'TRASH'}
                        onNavigate={() => handleFileAction(item, 'open')}
                        onStar={() => handleToggleStar(item)}
                        onTrash={() => handleTrash(item)}
                        onRestore={() => handleRestore(item)}
                        onPermanentDelete={() => handlePermanentDelete(item)}
                        onFileAction={handleFileAction}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ─── Share Modal ────────────────────────────────────────── */}
      {shareModalItem && (
        <ShareModal item={shareModalItem} onClose={() => setShareModalItem(null)} />
      )}
    </div>
  );
};

// ─── Drive Item Card ──────────────────────────────────────────────────────────

const DriveItemCard: React.FC<{
  item: DriveItem;
  viewMode: 'grid' | 'list';
  isTrashView?: boolean;
  onNavigate: () => void;
  onStar: () => void;
  onTrash: () => void;
  onRestore: () => void;
  onPermanentDelete: () => void;
  onFileAction: (item: DriveItem, action: 'open' | 'save' | 'share') => void;
}> = ({ item, viewMode, isTrashView, onNavigate, onStar, onTrash, onRestore, onPermanentDelete, onFileAction }) => {
  const Icon = getFileIcon(item);
  const color = getFileColor(item);

  if (viewMode === 'list') {
    return (
      <div className="flex items-center gap-3 px-3 py-2 hover:bg-muted rounded-xl group cursor-pointer transition-colors" onDoubleClick={onNavigate}>
        <Icon size={18} style={{ color }} />
        <span className="flex-1 text-sm text-foreground truncate">{item.name}</span>
        {item.fileSize && <span className="text-xs text-muted-foreground flex-shrink-0">{formatFileSize(item.fileSize)}</span>}
        <span className="text-xs text-muted-foreground flex-shrink-0">{getTimeAgo(item.trashedAt || item.updatedAt)}</span>
        
        <div className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 flex gap-1 transition-opacity">
          {isTrashView ? (
            <>
              <button onClick={(e) => { e.stopPropagation(); onRestore(); }} className="p-1 hover:text-green-600 text-muted-foreground transition-colors" title="Restore"><Undo2 size={14} /></button>
              <button onClick={(e) => { e.stopPropagation(); onPermanentDelete(); }} className="p-1 hover:text-red-600 text-muted-foreground transition-colors" title="Delete permanently"><Trash2 size={14} /></button>
            </>
          ) : (
            <>
              {!item.isFolder && <button onClick={(e) => { e.stopPropagation(); onFileAction(item, 'save'); }} className="p-1 hover:text-primary text-muted-foreground" title="Save to device"><Download size={14} /></button>}
              {!item.isFolder && <button onClick={(e) => { e.stopPropagation(); onFileAction(item, 'share'); }} className="p-1 hover:text-primary text-muted-foreground" title="Share with Campus users"><Share2 size={14} /></button>}
              <button onClick={(e) => { e.stopPropagation(); onStar(); }} className="p-1 hover:text-yellow-500 text-muted-foreground">
                {item.isStarred ? <Star size={14} className="fill-yellow-400 text-yellow-400" /> : <Star size={14} />}
              </button>
              <button onClick={(e) => { e.stopPropagation(); onTrash(); }} className="p-1 hover:text-red-500 text-muted-foreground" title="Move to trash">
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="group flex flex-col items-center gap-2 p-3 rounded-2xl border border-border hover:border-primary/35 hover:shadow-md cursor-pointer bg-card transition-all relative"
      onDoubleClick={onNavigate}
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
        <Icon size={24} style={{ color }} />
      </div>
      <span className="text-xs text-foreground text-center truncate w-full">{item.name}</span>
      {item.fileSize && <span className="text-[10px] text-muted-foreground">{formatFileSize(item.fileSize)}</span>}

      <div className="absolute top-2 right-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 flex gap-0.5 transition-opacity bg-card/90 rounded-lg p-0.5 backdrop-blur-sm">
        {isTrashView ? (
          <>
            <button onClick={(e) => { e.stopPropagation(); onRestore(); }} className="p-1 hover:bg-green-500/10 rounded-lg text-muted-foreground hover:text-green-600 transition-colors" title="Restore"><Undo2 size={13} /></button>
            <button onClick={(e) => { e.stopPropagation(); onPermanentDelete(); }} className="p-1 hover:bg-red-500/10 rounded-lg text-muted-foreground hover:text-red-600 transition-colors" title="Delete permanently"><Trash2 size={13} /></button>
          </>
        ) : (
          <>
            {!item.isFolder && <button onClick={(e) => { e.stopPropagation(); onFileAction(item, 'save'); }} className="p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary transition-colors" title="Save to device"><Download size={13} /></button>}
            {!item.isFolder && <button onClick={(e) => { e.stopPropagation(); onFileAction(item, 'share'); }} className="p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary transition-colors" title="Share with Campus users"><Share2 size={13} /></button>}
            <button onClick={(e) => { e.stopPropagation(); onStar(); }} className="p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-yellow-500 transition-colors">
              {item.isStarred ? <Star size={13} className="fill-yellow-400 text-yellow-400" /> : <Star size={13} />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); onTrash(); }} className="p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-red-500 transition-colors" title="Move to trash">
              <Trash2 size={13} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Share Modal ──────────────────────────────────────────────────────────────

const ShareModal: React.FC<{ item: DriveItem; onClose: () => void }> = ({ item, onClose }) => {
  const [recipientType, setRecipientType] = useState<'SPECIFIC_USER' | 'ROLE' | 'DEPARTMENT' | 'ALL_INSTITUTION'>('SPECIFIC_USER');
  const [recipientId, setRecipientId] = useState('');
  const [accessLevel, setAccessLevel] = useState<'VIEW' | 'COMMENT' | 'EDIT' | 'MANAGE'>('VIEW');
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    if (recipientType !== 'ALL_INSTITUTION' && !recipientId.trim()) {
      toast.error('Please enter a recipient ID, Email, or Role.');
      return;
    }
    setSharing(true);
    try {
      if (item.isFolder) {
        await workspaceApi.shareDriveFolder(item.id, {
          principalType: recipientType,
          principalId: recipientType === 'ALL_INSTITUTION' ? undefined : recipientId.trim(),
          accessLevel,
        });
      } else if (item.fileId) {
        await workspaceApi.shareDriveFile(item.fileId, {
          driveItemId: item.id,
          principalType: recipientType,
          principalId: recipientType === 'ALL_INSTITUTION' ? undefined : recipientId.trim(),
          accessLevel,
        });
      }
      toast.success(`Shared "${item.name}" with ${recipientType === 'ALL_INSTITUTION' ? 'All Campus' : recipientId}. Recipient notified.`);
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to share file.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Share2 className="text-primary h-5 w-5" />
            <h3 className="text-sm font-bold text-foreground truncate">Share "{item.name}"</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Share with</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['SPECIFIC_USER', 'ROLE', 'ALL_INSTITUTION'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setRecipientType(type)}
                  className={`py-1.5 px-2 text-xs rounded-xl font-medium border transition-colors ${
                    recipientType === type ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border'
                  }`}
                >
                  {type === 'SPECIFIC_USER' ? 'User' : type === 'ROLE' ? 'Role' : 'All Campus'}
                </button>
              ))}
            </div>
          </div>

          {recipientType !== 'ALL_INSTITUTION' && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                {recipientType === 'SPECIFIC_USER' ? 'User ID or Email' : 'Role Name (e.g. Faculty, HOD)'}
              </label>
              <input
                type="text"
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                placeholder={recipientType === 'SPECIFIC_USER' ? 'Enter user ID or email...' : 'e.g. Faculty, HOD'}
                className="w-full px-3 py-2 text-xs bg-muted text-foreground rounded-xl outline-none focus:bg-background focus:ring-2 focus:ring-primary/20 border border-border"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Permission Level</label>
            <select
              value={accessLevel}
              onChange={(e) => setAccessLevel(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-muted text-foreground rounded-xl outline-none focus:bg-background focus:ring-2 focus:ring-primary/20 border border-border"
            >
              <option value="VIEW">Viewer (Can read and preview)</option>
              <option value="COMMENT">Commenter (Can add comments)</option>
              <option value="EDIT">Editor (Can modify file)</option>
              <option value="MANAGE">Manager (Can share and organize)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <button onClick={onClose} className="px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted rounded-xl transition-colors">
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={sharing}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {sharing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check size={14} />} Share & Notify
          </button>
        </div>
      </div>
    </div>
  );
};

export default CampusDrivePage;
