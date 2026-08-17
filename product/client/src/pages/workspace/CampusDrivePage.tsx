import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Folder, FolderOpen, FileText, Table2, Presentation, ClipboardList,
  FileQuestion, NotebookPen, BarChart3, File, Image,
  Plus, Upload, Search, Grid3X3, List, Star, StarOff, Trash2,
  Download, Share2, MoreHorizontal, ArrowLeft, HardDrive, Users,
  Building2, Globe, ChevronRight, FolderPlus, Home, ArrowUpRight,
  Loader2, RefreshCw, FolderUp
} from 'lucide-react';
import { workspaceApi } from '../../services/workspace.api';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../components/ui/Toast';

// ─── Types ───────────────────────────────────────────────────────────────────

type DriveScope = 'PERSONAL' | 'DEPARTMENT' | 'SHARED' | 'COLLEGE';

interface DriveItem {
  id: string;
  name: string;
  isFolder: boolean;
  parentId?: string;
  mimeType?: string;
  fileSize?: number;
  fileUrl?: string;
  documentId?: string;
  ownerId: string;
  scope: string;
  isStarred: boolean;
  isTrashed: boolean;
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

function getTimeAgo(dateStr: string): string {
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
  const [scope, setScope] = useState<DriveScope>('PERSONAL');
  const [currentParentId, setCurrentParentId] = useState<string | undefined>(undefined);
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string; name: string }>>([]);
  const [items, setItems] = useState<DriveItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selected, setSelected] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await workspaceApi.getDriveItems(scope, currentParentId);
      setItems(data || []);
    } catch {
      toast.error('Failed to load drive items.');
    } finally {
      setLoading(false);
    }
  }, [scope, currentParentId]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleCreateFolder = async () => {
    const name = window.prompt('Folder name:');
    if (!name) return;
    setCreating(true);
    try {
      await workspaceApi.createDriveItem({ name, isFolder: true, parentId: currentParentId, scope });
      await loadItems();
      toast.success('Folder created.');
    } catch {
      toast.error('Failed to create folder.');
    } finally {
      setCreating(false);
    }
  };

  const handleNavigateFolder = (item: DriveItem) => {
    if (!item.isFolder) return;
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

  const filteredItems = items.filter((i) =>
    !search || i.name.toLowerCase().includes(search.toLowerCase())
  );

  const folders = filteredItems.filter((i) => i.isFolder);
  const files = filteredItems.filter((i) => !i.isFolder);

  const SCOPE_CONFIG = {
    PERSONAL: { label: 'My Drive', icon: HardDrive, color: '#1a73e8' },
    DEPARTMENT: { label: 'Department', icon: Building2, color: '#0f9d58' },
    SHARED: { label: 'Shared with me', icon: Users, color: '#f4b400' },
    COLLEGE: { label: 'College Drive', icon: Globe, color: '#8e24aa' },
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* ─── Sidebar ────────────────────────────────────────────── */}
      <div className="w-52 bg-white border-r border-gray-200 flex flex-col overflow-hidden flex-shrink-0">
        <div className="px-4 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <HardDrive size={18} className="text-blue-500" />
            <h2 className="text-sm font-bold text-gray-800">Campus Drive</h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {(Object.entries(SCOPE_CONFIG) as [DriveScope, typeof SCOPE_CONFIG[DriveScope]][]).map(([key, cfg]) => {
            const Icon = cfg.icon;
            return (
              <button
                key={key}
                onClick={() => { setScope(key); setBreadcrumbs([]); setCurrentParentId(undefined); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  scope === key ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon size={16} style={{ color: cfg.color }} />
                <span className="text-sm">{cfg.label}</span>
              </button>
            );
          })}

          <div className="mt-3 pt-3 border-t border-gray-100 px-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Quick Links</p>
            <button className="w-full flex items-center gap-2 py-1.5 text-xs text-gray-600 hover:text-yellow-600 transition-colors">
              <Star size={13} className="text-yellow-500" /> Starred
            </button>
            <button className="w-full flex items-center gap-2 py-1.5 text-xs text-gray-600 hover:text-red-600 transition-colors">
              <Trash2 size={13} /> Trash
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="p-3 border-t border-gray-200 space-y-1">
          <button
            onClick={handleCreateFolder}
            disabled={creating}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <FolderPlus size={14} /> New Folder
          </button>
          <button
            onClick={() => navigate('/workspace')}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft size={14} /> Back to Workspace
          </button>
        </div>
      </div>

      {/* ─── Main Content ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <div className="bg-white border-b border-gray-200 flex items-center gap-3 px-4 py-3 flex-shrink-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-sm text-gray-500 flex-1 min-w-0">
            <button onClick={() => handleBreadcrumbClick(-1)} className="hover:text-blue-600 font-medium text-gray-700 transition-colors flex-shrink-0">
              {SCOPE_CONFIG[scope].label}
            </button>
            {breadcrumbs.map((bc, i) => (
              <React.Fragment key={bc.id}>
                <ChevronRight size={13} className="text-gray-400 flex-shrink-0" />
                <button
                  onClick={() => handleBreadcrumbClick(i)}
                  className="hover:text-blue-600 transition-colors truncate max-w-[150px]"
                >
                  {bc.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-52 flex-shrink-0">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files…"
              className="w-full pl-8 pr-3 py-2 text-xs bg-gray-100 rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-blue-400 transition-all"
            />
          </div>

          {/* View mode */}
          <div className="flex border border-gray-200 rounded-lg overflow-hidden flex-shrink-0">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'} transition-colors`}><Grid3X3 size={14} /></button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'} transition-colors`}><List size={14} /></button>
          </div>

          <button onClick={loadItems} className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* File grid/list */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className={viewMode === 'grid' ? 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4' : 'space-y-1'}>
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className={`animate-pulse bg-gray-200 rounded-2xl ${viewMode === 'grid' ? 'h-28' : 'h-10'}`} />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
              <FolderOpen size={48} className="opacity-40" />
              <p className="text-sm">This drive section is empty.</p>
              <button onClick={handleCreateFolder} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors">
                <FolderPlus size={14} /> Create a folder
              </button>
            </div>
          ) : (
            <>
              {/* Folders */}
              {folders.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Folders</h3>
                  <div className={viewMode === 'grid' ? 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3' : 'space-y-1'}>
                    {folders.map((item) => (
                      <DriveItemCard key={item.id} item={item} viewMode={viewMode} onNavigate={() => handleNavigateFolder(item)} onStar={() => handleToggleStar(item)} onTrash={() => handleTrash(item)} />
                    ))}
                  </div>
                </div>
              )}

              {/* Files */}
              {files.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Files</h3>
                  <div className={viewMode === 'grid' ? 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3' : 'space-y-1'}>
                    {files.map((item) => (
                      <DriveItemCard key={item.id} item={item} viewMode={viewMode} onNavigate={() => {}} onStar={() => handleToggleStar(item)} onTrash={() => handleTrash(item)} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Drive Item Card ──────────────────────────────────────────────────────────

const DriveItemCard: React.FC<{
  item: DriveItem;
  viewMode: 'grid' | 'list';
  onNavigate: () => void;
  onStar: () => void;
  onTrash: () => void;
}> = ({ item, viewMode, onNavigate, onStar, onTrash }) => {
  const Icon = getFileIcon(item);
  const color = getFileColor(item);

  if (viewMode === 'list') {
    return (
      <div className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-xl group cursor-pointer transition-colors" onDoubleClick={onNavigate}>
        <Icon size={18} style={{ color }} />
        <span className="flex-1 text-sm text-gray-800 truncate">{item.name}</span>
        {item.fileSize && <span className="text-xs text-gray-400 flex-shrink-0">{formatFileSize(item.fileSize)}</span>}
        <span className="text-xs text-gray-400 flex-shrink-0">{getTimeAgo(item.updatedAt)}</span>
        <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onStar(); }} className="p-1 hover:text-yellow-500 text-gray-400">
            {item.isStarred ? <Star size={13} className="fill-yellow-400 text-yellow-400" /> : <Star size={13} />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onTrash(); }} className="p-1 hover:text-red-500 text-gray-400">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group flex flex-col items-center gap-2 p-3 rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-md cursor-pointer bg-white transition-all relative"
      onDoubleClick={onNavigate}
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
        <Icon size={24} style={{ color }} />
      </div>
      <span className="text-xs text-gray-700 text-center truncate w-full">{item.name}</span>
      {item.fileSize && <span className="text-[10px] text-gray-400">{formatFileSize(item.fileSize)}</span>}

      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity">
        <button onClick={(e) => { e.stopPropagation(); onStar(); }} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-yellow-500 transition-colors">
          {item.isStarred ? <Star size={11} className="fill-yellow-400 text-yellow-400" /> : <Star size={11} />}
        </button>
        <button onClick={(e) => { e.stopPropagation(); onTrash(); }} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
};

export default CampusDrivePage;
