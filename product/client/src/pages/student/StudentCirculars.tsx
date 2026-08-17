import React, { useState, useEffect } from 'react';
import { Bell, Search, Download, Pin, ChevronRight, AlertCircle, Info, CheckCircle, Megaphone, type LucideIcon } from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';
import api from '../../lib/axios';
import { markCircularRead } from '../../modules/circulars/api/circularApi';
import { downloadAndOpen } from '../../platform/download';

// Map backend priority values to display config
const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  HIGH:    { label: 'High Priority', className: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/30 dark:text-rose-400' },
  URGENT:  { label: 'Urgent',        className: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/30 dark:text-rose-400' },
  MEDIUM:  { label: 'Medium',        className: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400' },
  NORMAL:  { label: 'Normal',        className: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400' },
  LOW:     { label: 'General',       className: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400' },
};
const DEFAULT_PRIORITY = PRIORITY_CONFIG['LOW'];

// Store Lucide component references — never store JSX at module scope
const CATEGORY_CONFIG: Record<string, { Icon: LucideIcon; color: string }> = {
  EXAMINATION: { Icon: AlertCircle, color: 'text-rose-500' },
  PLACEMENT:   { Icon: CheckCircle, color: 'text-indigo-500' },
  GENERAL:     { Icon: Info,        color: 'text-slate-400' },
  SPORTS:      { Icon: Megaphone,   color: 'text-emerald-500' },
  FEES:        { Icon: AlertCircle, color: 'text-amber-500' },
  ACADEMIC:    { Icon: Info,        color: 'text-blue-500' },
  ANNOUNCEMENT:{ Icon: Megaphone,   color: 'text-indigo-500' },
};
const DEFAULT_CATEGORY = CATEGORY_CONFIG['GENERAL'];

/** Safely resolve a department/issuedBy value from API — handles string, object, or undefined */
function resolveIssuedBy(c: any): string {
  if (c.issuedBy && typeof c.issuedBy === 'string') return c.issuedBy;
  if (c.publishedBy) {
    const pb = c.publishedBy;
    if (typeof pb === 'string') return pb;
    if (pb.firstName) return `${pb.firstName} ${pb.lastName || ''}`.trim();
  }
  if (c.department) {
    const dept = c.department;
    if (typeof dept === 'string') return dept;
    if (dept.name) return dept.name;
  }
  return 'Administration';
}

/** Safely resolve category — maps ANNOUNCEMENT → GENERAL etc. */
function resolveCategory(raw: string | undefined): string {
  if (!raw) return 'GENERAL';
  const upper = raw.toUpperCase();
  if (CATEGORY_CONFIG[upper]) return upper;
  return 'GENERAL';
}

/** Safely resolve priority — maps NORMAL → LOW etc. */
function resolvePriority(raw: string | undefined): string {
  if (!raw) return 'LOW';
  const upper = raw.toUpperCase();
  if (PRIORITY_CONFIG[upper]) return upper;
  return 'LOW';
}

export const StudentCirculars: React.FC = () => {
  const [circulars, setCirculars] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCirculars = async () => {
      try {
        setIsLoading(true);
        const res = await api.get('/circulars');
        const list = res.data?.data ?? res.data?.circulars ?? (Array.isArray(res.data) ? res.data : []);
        if (Array.isArray(list)) {
          const mapped = list.map((c: any) => ({
            id: c.id,
            title: c.title || 'Untitled Circular',
            content: (typeof c.content === 'string' ? c.content : '') || (typeof c.description === 'string' ? c.description : '') || '',
            category: resolveCategory(c.category),
            priority: resolvePriority(c.priority),
            issuedBy: resolveIssuedBy(c),
            createdAt: c.createdAt || c.publishedAt || new Date().toISOString(),
            pinned: c.isPinned === true || c.pinned === true,
            isRead: Boolean(c.isRead || c.userReadAt),
            attachmentUrl: c.attachmentUrl,
          }));
          setCirculars(mapped);
        }
      } catch (err) {
        console.error('Error loading student circulars:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCirculars();
  }, []);

  const categories = ['ALL', 'EXAMINATION', 'PLACEMENT', 'GENERAL', 'SPORTS', 'FEES'];
  const filtered = circulars.filter(c => {
    const matchSearch = (c.title || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'ALL' || c.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const pinned = filtered.filter(c => c.pinned);
  const rest = filtered.filter(c => !c.pinned);
  const viewCircular = async (id: string) => {
    setExpandedId(current => current === id ? null : id);
    const target = circulars.find(c => c.id === id);
    if (target && !target.isRead) {
      setCirculars(items => items.map(item => item.id === id ? { ...item, isRead: true } : item));
      await markCircularRead(id).catch(() => undefined);
    }
  };

  if (isLoading) return <Loading text="Loading Circulars..." />;

  return (
    <div className="space-y-6 text-left pb-12 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Bell className="h-5 w-5 text-indigo-600" /> Institutional Circulars Board
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Official notices, academic announcements, and institutional circulars</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-center">
        <div className="flex flex-1 w-full items-center gap-2 border px-3 py-1.5 rounded-xl bg-card">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search circulars..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-xs outline-none w-full font-semibold"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-[10px] font-black rounded-xl border transition-colors ${categoryFilter === cat ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-card hover:bg-muted'}`}
            >
              {cat === 'ALL' ? 'All Notices' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Pinned */}
      {pinned.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] uppercase font-black tracking-wider text-slate-400 flex items-center gap-1.5">
            <Pin className="h-3 w-3" /> Pinned Notices
          </p>
          {pinned.map(c => (
            <CircularCard key={c.id} circular={c} expandedId={expandedId} onView={viewCircular} />
          ))}
        </div>
      )}

      {/* Regular */}
      <div className="space-y-3">
        {pinned.length > 0 && (
          <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">All Circulars</p>
        )}
        {rest.map(c => (
          <CircularCard key={c.id} circular={c} expandedId={expandedId} onView={viewCircular} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed rounded-2xl">
            <Bell className="h-8 w-8 text-slate-300 mx-auto" />
            <p className="text-xs text-muted-foreground mt-2">No circulars found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const CircularCard: React.FC<{
  circular: any;
  expandedId: string | null;
  onView: (id: string) => void;
}> = ({ circular, expandedId, onView }) => {
  const isExpanded = expandedId === circular.id;
  const catConfig = CATEGORY_CONFIG[circular.category] || DEFAULT_CATEGORY;
  const prioConfig = PRIORITY_CONFIG[circular.priority] || DEFAULT_PRIORITY;
  const CatIcon = catConfig.Icon;

  // Safe date formatting
  const formattedDate = (() => {
    try {
      return new Date(circular.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return circular.createdAt || '';
    }
  })();

  return (
    <div className={`border bg-card rounded-2xl shadow-sm overflow-hidden transition-all ${circular.pinned ? 'border-indigo-200 dark:border-indigo-800' : ''}`}>
      <button
        className="w-full p-4 text-left flex items-start gap-3"
        onClick={() => onView(circular.id)}
      >
        <div className={`p-2 rounded-xl bg-muted/50 mt-0.5 shrink-0 ${catConfig.color}`}>
          <CatIcon className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-white leading-tight">{circular.title}</h3>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-[8.5px] font-black uppercase px-1.5 py-0.5 rounded border ${prioConfig.className}`}>
                {prioConfig.label}
              </span>
              <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400 font-bold flex-wrap">
            <span>{circular.issuedBy}</span>
            <span>·</span>
            <span>{formattedDate}</span>
            <span>·</span>
            <span className="text-[9px] uppercase font-black">{circular.category}</span>
          </div>
        </div>
      </button>
      {isExpanded && (
        <div className="px-4 pb-4 border-t bg-muted/10">
          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed pt-3">
            {circular.content || 'No additional content.'}
          </p>
          {circular.attachmentUrl && (
            <button
              type="button"
              onClick={async () => {
                const res = await downloadAndOpen(
                  circular.attachmentUrl,
                  `${circular.title?.slice(0, 30) || 'Circular_Attachment'}.pdf`
                );
                if (!res.success) {
                  toast.error(res.error || 'Unable to open attachment.');
                }
              }}
              className="mt-3 inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-[10px] font-black hover:bg-muted"
            >
              <Download className="h-3.5 w-3.5 text-indigo-500" /> Open attachment
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentCirculars;
