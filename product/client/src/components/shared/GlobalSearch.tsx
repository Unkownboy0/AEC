import React, { useState, useEffect } from 'react';
import { Search, ArrowRight, X, Command } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/axios';

interface GlobalSearchProps {
  userRole: string;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ userRole }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();

  // Search permissions: Super Admin, College Admin, Principal, Vice Principal, Academic Dean, Admission Dean, IQAC Dean, HOD, Faculty, Mentor, Student, Parent
  const canAccess = Boolean(userRole);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (canAccess) setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canAccess]);

  useEffect(() => {
    const searchTerm = query.trim();
    if (searchTerm.length < 2) {
      setResults([]);
      setError(null);
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/enterprise/search?q=${encodeURIComponent(searchTerm)}`, {
          signal: controller.signal,
        });
        if (res.data?.status === 'success') {
          setResults(res.data.data.map((item: any) => ({
            id: item.id,
            title: item.title,
            subtitle: item.subtitle,
            type: item.type,
            department: item.department,
            path: item.link,
          })));
          setActiveIndex(0);
        }
      } catch (searchError: any) {
        if (searchError?.code !== 'ERR_CANCELED') {
          setResults([]);
          setError(searchError?.response?.data?.message || 'Search is unavailable. Please try again.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const openResult = (result: any) => {
    setIsOpen(false);
    setQuery('');
    navigate(result.path);
  };


  if (!canAccess) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="hidden md:flex items-center gap-2 h-9 px-3 bg-muted/40 hover:bg-muted/80 text-muted-foreground border rounded-lg text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden md:inline">Universal Search...</span>
        <kbd className="hidden md:inline-flex items-center gap-0.5 text-[9px] bg-background border px-1.5 py-0.5 rounded font-mono font-bold">
          <Command className="h-2.5 w-2.5" /> K
        </kbd>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
          <div className="bg-card w-full max-w-xl rounded-xl shadow-2xl border overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex items-center px-4 border-b bg-muted/10">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Search pages and records available to you"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowDown' && results.length > 0) {
                    event.preventDefault();
                    setActiveIndex((index) => (index + 1) % results.length);
                  } else if (event.key === 'ArrowUp' && results.length > 0) {
                    event.preventDefault();
                    setActiveIndex((index) => (index - 1 + results.length) % results.length);
                  } else if (event.key === 'Enter' && results[activeIndex]) {
                    event.preventDefault();
                    openResult(results[activeIndex]);
                  } else if (event.key === 'Escape') {
                    setIsOpen(false);
                  }
                }}
                className="w-full h-12 bg-transparent px-3 text-xs font-semibold focus:outline-none"
              />
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3 max-h-80 overflow-y-auto">
              {loading && <p className="text-xs text-muted-foreground p-3 text-center">Searching enterprise database...</p>}
              {!loading && error && (
                <p className="text-xs text-destructive p-3 text-center" role="alert">{error}</p>
              )}
              {!loading && !error && results.length === 0 && query.trim().length >= 2 && (
                <p className="text-xs text-muted-foreground p-3 text-center">No records available in your access scope.</p>
              )}
              {!loading && results.length === 0 && query.trim() === '' && (
                <div className="p-3 space-y-2">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Executive Quick Actions</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button onClick={() => { setIsOpen(false); navigate('/dashboard'); }} className="p-2 border rounded-lg hover:bg-muted/50 text-left font-semibold flex items-center justify-between">
                      <span>Department Rankings</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    </button>
                    <button onClick={() => { setIsOpen(false); navigate('/vp/placements'); }} className="p-2 border rounded-lg hover:bg-muted/50 text-left font-semibold flex items-center justify-between">
                      <span>Placement Drives</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              )}
              {results.map((r, idx) => (
                <button
                  type="button"
                  key={`${r.type}-${r.id}`}
                  onClick={() => openResult(r)}
                  className={`w-full p-2.5 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${activeIndex === idx ? 'bg-muted' : 'hover:bg-muted'}`}
                >
                  <div>
                    <p className="font-bold">{r.title}</p>
                    <p className="text-[10px] text-muted-foreground">{r.subtitle}</p>
                  </div>
                  <span className="text-[9px] bg-primary/10 border border-primary/20 text-primary font-bold px-2 py-0.5 rounded">
                    {r.type}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
