import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppWindow, Bell, CalendarDays, ClipboardList, FileBarChart, FileText,
  Fingerprint, Grid3X3, HardDrive, ListChecks, Loader2, Megaphone,
  MessagesSquare, NotebookPen, Presentation, School, Search, Settings2,
  Sparkles, Table2, Video, X, type LucideIcon,
} from 'lucide-react';
import { workspaceApi, type CampusSuiteApplication, type CampusSuiteCategory } from '../../services/workspace.api';
import { toast } from '../ui/Toast';

const ICONS: Record<string, LucideIcon> = {
  AppWindow, Bell, CalendarDays, ClipboardList, FileBarChart, FileText,
  Fingerprint, HardDrive, ListChecks, Megaphone, MessagesSquare,
  NotebookPen, Presentation, School, Settings2, Sparkles, Table2, Video,
};

const CATEGORY_ORDER: CampusSuiteCategory[] = [
  'Productivity', 'Communication', 'Calendar', 'Academic', 'Intelligence', 'Administration',
];

const RECENT_APPS_KEY = 'campusos:recent-applications';

function readRecentIds(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(RECENT_APPS_KEY) || '[]');
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').slice(0, 5) : [];
  } catch {
    return [];
  }
}

function AppTile({ app, onOpen }: { app: CampusSuiteApplication; onOpen: (app: CampusSuiteApplication) => void }) {
  const Icon = ICONS[app.icon] || AppWindow;
  return (
    <button
      type="button"
      onClick={() => onOpen(app)}
      className="group min-h-28 rounded-2xl bg-surface-soft/70 p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface hover:shadow-card active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label={`Open ${app.name}`}
    >
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary transition-transform duration-200 group-hover:scale-105">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="block text-sm font-semibold leading-tight text-text-primary">{app.shortName}</span>
      <span className="mt-1 line-clamp-2 text-[11px] leading-snug text-text-muted">{app.description}</span>
    </button>
  );
}

export const CampusAppLauncher: React.FC = () => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [applications, setApplications] = useState<CampusSuiteApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'All' | CampusSuiteCategory>('All');
  const [recentIds, setRecentIds] = useState<string[]>(readRecentIds);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setLoading(true);
    workspaceApi.listApplications()
      .then((items) => {
        if (active) setApplications(items);
      })
      .catch(() => {
        if (active) {
          setApplications([]);
          toast.error('The application catalog could not be loaded. Check your connection and try again.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => {
      active = false;
      window.clearTimeout(focusTimer);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  const categories = useMemo(
    () => CATEGORY_ORDER.filter((category) => applications.some((app) => app.category === category)),
    [applications]
  );

  const filteredApps = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return applications.filter((app) => {
      if (activeCategory !== 'All' && app.category !== activeCategory) return false;
      if (!normalizedQuery) return true;
      return [app.name, app.shortName, app.description, app.category, ...app.keywords]
        .some((value) => value.toLowerCase().includes(normalizedQuery));
    });
  }, [activeCategory, applications, query]);

  const recentApps = useMemo(
    () => recentIds.map((id) => applications.find((app) => app.id === id)).filter((app): app is CampusSuiteApplication => Boolean(app)),
    [applications, recentIds]
  );

  const openApplication = (app: CampusSuiteApplication) => {
    const nextRecentIds = [app.id, ...recentIds.filter((id) => id !== app.id)].slice(0, 5);
    setRecentIds(nextRecentIds);
    localStorage.setItem(RECENT_APPS_KEY, JSON.stringify(nextRecentIds));
    setIsOpen(false);
    setQuery('');
    setActiveCategory('All');
    navigate(app.path);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex h-12 w-12 items-center justify-center rounded-xl text-text-secondary transition-colors hover:bg-surface-soft hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:h-10 sm:w-10"
        aria-label="Open CampusOS applications"
        aria-haspopup="dialog"
      >
        <Grid3X3 className="h-5 w-5" aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-start sm:p-6 md:p-12">
          <button
            type="button"
            className="fixed inset-0 cursor-default bg-slate-950/55 backdrop-blur-xs"
            onClick={() => setIsOpen(false)}
            aria-label="Close application launcher"
          />

          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="campus-app-launcher-title"
            className="relative z-10 flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-border bg-surface shadow-modal sm:max-h-[84dvh] sm:rounded-3xl"
          >
            <header className="border-b border-border px-4 pb-4 pt-5 sm:px-6 sm:pt-6">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-primary">GEETORUS CAMPUSOS</p>
                  <h2 id="campus-app-launcher-title" className="mt-1 text-xl font-semibold tracking-tight text-text-primary">
                    Applications
                  </h2>
                  <p className="mt-1 max-w-lg text-sm text-text-muted">
                    Only applications authorized for your active workspace are shown.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-surface-soft hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Close application launcher"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <label className="relative block">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
                <span className="sr-only">Search applications</span>
                <input
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search applications"
                  className="h-12 w-full rounded-xl border border-border bg-surface-soft pl-10 pr-4 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>

              {categories.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Application categories">
                  {(['All', ...categories] as Array<'All' | CampusSuiteCategory>).map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setActiveCategory(category)}
                      className={`min-h-10 shrink-0 rounded-xl px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        activeCategory === category ? 'bg-primary text-primary-foreground' : 'bg-surface-soft text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              )}
            </header>

            <div className="overflow-y-auto px-4 py-5 sm:px-6">
              {loading ? (
                <div className="grid min-h-48 place-items-center text-sm text-text-muted" role="status">
                  <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading authorized applications</span>
                </div>
              ) : filteredApps.length === 0 ? (
                <div className="grid min-h-48 place-items-center rounded-2xl bg-surface-soft px-6 text-center">
                  <div>
                    <Search className="mx-auto h-7 w-7 text-text-muted" aria-hidden="true" />
                    <p className="mt-3 text-sm font-semibold text-text-primary">No authorized application matches</p>
                    <p className="mt-1 text-xs text-text-muted">Try another name or choose a different category.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {!query && activeCategory === 'All' && recentApps.length > 0 && (
                    <section aria-labelledby="recent-apps-title">
                      <h3 id="recent-apps-title" className="mb-3 text-xs font-semibold text-text-secondary">Recently opened</h3>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                        {recentApps.map((app) => <AppTile key={`recent-${app.id}`} app={app} onOpen={openApplication} />)}
                      </div>
                    </section>
                  )}

                  {CATEGORY_ORDER.map((category) => {
                    const categoryApps = filteredApps.filter((app) => app.category === category);
                    if (categoryApps.length === 0) return null;
                    return (
                      <section key={category} aria-labelledby={`app-category-${category}`}>
                        <h3 id={`app-category-${category}`} className="mb-3 text-xs font-semibold text-text-secondary">{category}</h3>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                          {categoryApps.map((app) => <AppTile key={app.id} app={app} onOpen={openApplication} />)}
                        </div>
                      </section>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
};
