import { Capacitor } from '@capacitor/core';
import React, { useState, useEffect, useRef } from 'react';
import {
  Search, X, ArrowRight, User, BookOpen, FileCheck, Megaphone,
  GraduationCap, Building2, Loader2, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';

interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  type: 'STUDENT' | 'FACULTY' | 'USER' | 'CIRCULAR' | 'DEPARTMENT' | 'PROGRAM' | 'SUBJECT';
  link: string;
}

export const SearchBar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { user } = useAuth();
  const navigate = useNavigate();
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Keyboard shortcut ⌘K / Ctrl+K ──────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ─── Live API Search Debounce ───────────────────────────────────
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/enterprise/search?q=${encodeURIComponent(query.trim())}`);
        if (res.data?.data) {
          setResults(res.data.data);
          setSelectedIndex(0);
        } else {
          setResults([]);
        }
      } catch (err) {
        console.warn('[SearchBar] Search API error:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [query]);

  const handleSelect = (path: string) => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
    navigate(path);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (results.length > 0 ? (prev + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length > 0 && results[selectedIndex]) {
        handleSelect(results[selectedIndex].link);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const getQuickLinks = () => {
    const role = (user?.role || '').toUpperCase();
    if (role.includes('STUDENT')) {
      return [
        { label: 'View Timetable', path: '/student/timetable', icon: <BookOpen className="w-4 h-4 text-primary" /> },
        { label: 'Check Attendance', path: '/student/attendance', icon: <User className="w-4 h-4 text-primary" /> },
        { label: 'Apply Leave / OD', path: '/student/leave-od', icon: <FileCheck className="w-4 h-4 text-primary" /> },
        { label: 'View Circulars', path: '/student/circulars', icon: <Megaphone className="w-4 h-4 text-primary" /> },
      ];
    }
    if (role.includes('HOD')) {
      return [
        { label: 'Pending Approvals', path: '/hod/approvals', icon: <FileCheck className="w-4 h-4 text-primary" /> },
        { label: 'Faculty Directory', path: '/hod/faculty', icon: <User className="w-4 h-4 text-primary" /> },
        { label: 'Department Board', path: '/hod/department-availability', icon: <BookOpen className="w-4 h-4 text-primary" /> },
      ];
    }
    return [
      { label: 'Mark Attendance', path: '/faculty/attendance', icon: <User className="w-4 h-4 text-primary" /> },
      { label: 'My Subjects', path: '/faculty/subjects', icon: <BookOpen className="w-4 h-4 text-primary" /> },
      { label: 'Leave Requests', path: '/faculty/leave-od', icon: <FileCheck className="w-4 h-4 text-primary" /> },
      { label: 'Institution Circulars', path: '/circulars', icon: <Megaphone className="w-4 h-4 text-primary" /> },
    ];
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'STUDENT': return <GraduationCap className="w-4 h-4 text-primary" />;
      case 'FACULTY': return <User className="w-4 h-4 text-primary" />;
      case 'CIRCULAR': return <Megaphone className="w-4 h-4 text-amber-500" />;
      case 'DEPARTMENT': return <Building2 className="w-4 h-4 text-emerald-500" />;
      default: return <User className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        type="button"
        className="hidden md:flex items-center gap-2 px-3.5 py-2 bg-surface-soft hover:bg-surface border border-border rounded-xl text-xs text-text-muted hover:text-text-primary transition-colors w-64 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Search className="w-3.5 h-3.5 text-text-muted shrink-0" />
        <span className="truncate flex-1 text-left font-medium">Search anything...</span>
        {!Capacitor.isNativePlatform() && (
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-extrabold bg-surface border border-border rounded text-text-muted">
            ⌘K
          </kbd>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative mx-auto max-w-xl bg-surface border border-border rounded-2xl shadow-modal overflow-hidden z-50 animate-in zoom-in-95 duration-150">
            {/* Input Header */}
            <div className="flex items-center px-4 border-b border-border bg-surface-soft">
              <Search className="w-5 h-5 text-primary shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Search students (e.g. student001.cse), faculty, circulars..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-3 py-4 text-sm bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none font-medium"
              />
              {loading && <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0 mr-2" />}
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(''); setResults([]); }}
                  className="p-1 text-text-muted hover:text-text-primary rounded-lg mr-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Results Body */}
            <div className="p-3 space-y-4 max-h-96 overflow-y-auto">
              {/* Live Search Results */}
              {query.trim().length >= 2 && !loading && results.length > 0 && (
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted px-2.5 mb-1.5">
                    Search Results ({results.length})
                  </p>
                  <div className="space-y-1">
                    {results.map((item, idx) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelect(item.link)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-colors group ${
                          idx === selectedIndex ? 'bg-primary-soft text-primary font-bold' : 'hover:bg-surface-soft text-text-primary'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-xl bg-surface border border-border/60 shrink-0">
                            {getItemIcon(item.type)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-text-primary truncate">{item.title}</p>
                            <p className="text-[11px] text-text-muted truncate mt-0.5">{item.subtitle}</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results Empty State */}
              {query.trim().length >= 2 && !loading && results.length === 0 && (
                <div className="p-8 text-center text-xs text-text-muted flex flex-col items-center justify-center gap-2">
                  <Sparkles className="w-6 h-6 text-primary/40" />
                  <p className="font-bold text-text-primary text-sm">No results found for "{query}"</p>
                  <p className="text-text-muted">Try searching by student register number, faculty employee ID, or circular title.</p>
                </div>
              )}

              {/* Suggested Quick Actions */}
              {(!query.trim() || query.trim().length < 2) && (
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted px-2.5 mb-1.5">
                    Suggested Quick Actions
                  </p>
                  <div className="space-y-1">
                    {getQuickLinks().map((link, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelect(link.path)}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-surface-soft text-xs font-bold text-text-primary transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-primary-soft/50 border border-primary/20 shrink-0">
                            {link.icon}
                          </div>
                          <span>{link.label}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
