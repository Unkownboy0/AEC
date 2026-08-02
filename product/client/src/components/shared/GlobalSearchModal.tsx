import React, { useState } from 'react';
import api from '../../lib/axios';
import { Search, X, User, GraduationCap, Building2, BookOpen, Layers } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const GlobalSearchModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const isExecutive = [
    'Super Admin', 'College Admin', 'Principal', 'Vice Principal',
    'Academic Dean', 'Admission Dean', 'IQAC Dean',
  ].includes(user?.role || '');

  if (!isOpen || !isExecutive) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      setLoading(true);
      const res = await api.get('/enterprise/search/global', { params: { q: query } });
      if (res.data?.status === 'success') {
        setResults(res.data.data);
      }
    } catch (err) {
      console.error('Failed to perform global search:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-start justify-center pt-20 p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden">
        {/* Search Header */}
        <form onSubmit={handleSearch} className="flex items-center gap-3 p-4 border-b border-slate-800 bg-slate-850">
          <Search className="w-5 h-5 text-indigo-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Students, Faculty, HODs, Departments, Programs, Subjects..."
            className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm outline-none"
            autoFocus
          />
          <button type="submit" className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold">
            Search
          </button>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </form>

        {/* Results Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {loading ? (
            <div className="text-center p-8 text-slate-400 text-sm">Searching enterprise records...</div>
          ) : results ? (
            <div className="space-y-6">
              {/* Students */}
              {results.students?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-emerald-400" /> Students ({results.students.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {results.students.map((s: any) => (
                      <div key={s.id} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/60 flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-sm text-slate-100">{s.firstName} {s.lastName}</div>
                          <div className="text-xs text-indigo-400 font-mono">{s.admissionNo}</div>
                        </div>
                        <span className="text-xs text-slate-400">{s.email}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Faculty */}
              {results.faculty?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4 text-purple-400" /> Faculty & HODs ({results.faculty.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {results.faculty.map((f: any) => (
                      <div key={f.id} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/60 flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-sm text-slate-100">{f.firstName} {f.lastName}</div>
                          <div className="text-xs text-purple-400">{f.designation}</div>
                        </div>
                        <span className="text-xs text-slate-400 font-mono">{f.employeeId}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Departments */}
              {results.departments?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-400" /> Departments ({results.departments.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {results.departments.map((d: any) => (
                      <div key={d.id} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/60 flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-sm text-slate-100">{d.name} ({d.code})</div>
                          <div className="text-xs text-slate-400">HOD: {d.hodName || 'Unassigned'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-8 text-slate-500 text-xs">Enter a search query to inspect college-wide database records.</div>
          )}
        </div>
      </div>
    </div>
  );
};
