import React, { useState, useEffect } from 'react';
import { Bell, Search, Download, Pin, ChevronRight, AlertCircle, Info, CheckCircle, Megaphone, type LucideIcon } from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';
import api from '../../lib/axios';

const DEMO_CIRCULARS = [
  { id: 'CIR-2026-041', title: 'Semester End Examination Time Table – November 2026', content: 'The Examination Cell hereby notifies that the Semester End Examinations for all UG/PG programs will commence from November 3, 2026. Students are advised to report to their respective halls 30 minutes prior to the scheduled time. Hall tickets must be collected from the department office between October 25–30, 2026.', category: 'EXAMINATION', priority: 'HIGH', issuedBy: 'Principal Office', createdAt: '2026-07-22', pinned: true },
  { id: 'CIR-2026-040', title: 'Campus Recruitment Drive – TCS & Cognizant (August 2026)', content: 'The Placement Cell invites all eligible final year students to register for the upcoming TCS and Cognizant recruitment drives scheduled for August 12–14, 2026. Students must ensure their resumes are uploaded on the placement portal before August 5, 2026. Mandatory pre-placement talk on August 10.', category: 'PLACEMENT', priority: 'HIGH', issuedBy: 'Placement Cell', createdAt: '2026-07-20', pinned: true },
  { id: 'CIR-2026-039', title: 'Anti-Ragging Committee Awareness Session – Mandatory Attendance', content: 'An awareness session on the Prevention of Ragging Act will be conducted on July 28, 2026 at 10:00 AM in the Main Auditorium. Attendance is compulsory for all students. Absentees will be noted and reported to the disciplinary committee.', category: 'GENERAL', priority: 'MEDIUM', issuedBy: 'Student Welfare Committee', createdAt: '2026-07-18', pinned: false },
  { id: 'CIR-2026-038', title: 'Library Automation System Upgrade – Temporary Disruption', content: 'The library RFID tracking system will undergo maintenance on July 26–27, 2026. During this period, book issue and return services will be available only between 9:00 AM and 12:00 PM. E-library access will remain unaffected.', category: 'GENERAL', priority: 'LOW', issuedBy: 'Library Department', createdAt: '2026-07-15', pinned: false },
  { id: 'CIR-2026-037', title: 'Annual Sports Day – Registration Open', content: 'The Department of Physical Education invites all students to participate in the Annual Sports Day 2026 scheduled for August 20, 2026. Events include athletics, basketball, volleyball, chess, and table tennis. Register through the Sports Department office or the campus portal before August 10.', category: 'SPORTS', priority: 'LOW', issuedBy: 'Physical Education Dept.', createdAt: '2026-07-12', pinned: false },
  { id: 'CIR-2026-036', title: 'Fee Payment – Last Date Reminder', content: 'Students who have not cleared their pending fees for the academic year 2026-2027 are reminded that the last date for payment is August 1, 2026. Failure to pay before the deadline will result in withholding of hall tickets and academic records.', category: 'FEES', priority: 'HIGH', issuedBy: 'Accounts Department', createdAt: '2026-07-10', pinned: false },
];

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
  const [circulars, setCirculars] = useState<any[]>(DEMO_CIRCULARS);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCirculars = async () => {
      try {
        const res = await api.get('/circulars');
        if (res.data?.status === 'success' && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const mapped = res.data.data.map((c: any) => ({
            id: c.id,
            title: c.title || 'Untitled Circular',
            content: (typeof c.content === 'string' ? c.content : '') || (typeof c.description === 'string' ? c.description : '') || '',
            category: resolveCategory(c.category),
            priority: resolvePriority(c.priority),
            issuedBy: resolveIssuedBy(c),
            createdAt: c.createdAt || c.publishedAt || new Date().toISOString(),
            pinned: c.isPinned === true || c.pinned === true,
          }));
          // Merge: demo circulars first, then live ones with distinct IDs
          setCirculars([
            ...DEMO_CIRCULARS,
            ...mapped.filter((c: any) => !DEMO_CIRCULARS.find(d => d.id === c.id)),
          ]);
        }
      } catch {
        // API failed or student has no department — demo data already loaded
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
            <CircularCard key={c.id} circular={c} expandedId={expandedId} setExpandedId={setExpandedId} />
          ))}
        </div>
      )}

      {/* Regular */}
      <div className="space-y-3">
        {pinned.length > 0 && (
          <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">All Circulars</p>
        )}
        {rest.map(c => (
          <CircularCard key={c.id} circular={c} expandedId={expandedId} setExpandedId={setExpandedId} />
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
  setExpandedId: (id: string | null) => void;
}> = ({ circular, expandedId, setExpandedId }) => {
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
        onClick={() => setExpandedId(isExpanded ? null : circular.id)}
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
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => toast.success('Circular marked as read.')}
              className="px-3 py-1.5 text-[10px] font-black border rounded-lg hover:bg-muted flex items-center gap-1"
            >
              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Mark Read
            </button>
            <button
              onClick={() => toast.success('Circular downloaded.')}
              className="px-3 py-1.5 text-[10px] font-black border rounded-lg hover:bg-muted flex items-center gap-1"
            >
              <Download className="h-3.5 w-3.5 text-indigo-500" /> Download
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentCirculars;
