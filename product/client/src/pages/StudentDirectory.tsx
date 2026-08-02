import React, { useState, useEffect } from 'react';
import api from '../lib/axios';
import { GraduationCap, Search, Filter, ChevronRight, ChevronDown, User, Calendar, BookOpen, Layers } from 'lucide-react';
import { StudentProfilePage } from './StudentProfilePage';

export const StudentDirectory: React.FC = () => {
  const [viewMode, setViewMode] = useState<'roster' | 'yearClass'>('roster');
  const [students, setStudents] = useState<any[]>([]);
  const [hierarchy, setHierarchy] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [gender, setGender] = useState('');
  const [status, setStatus] = useState('');
  const [expandedYear, setExpandedYear] = useState<number | null>(1);
  const [expandedSem, setExpandedSem] = useState<string | null>(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/enterprise/hod/students', {
        params: { search, gender, status },
      });
      if (res.data?.status === 'success') {
        setStudents(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHierarchy = async () => {
    try {
      setLoading(true);
      const res = await api.get('/enterprise/students/hierarchy');
      if (res.data?.status === 'success') {
        setHierarchy(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch year/class hierarchy:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'roster') fetchStudents();
    if (viewMode === 'yearClass') fetchHierarchy();
  }, [viewMode, search, gender, status]);

  if (selectedStudentId) {
    return <StudentProfilePage studentId={selectedStudentId} onBack={() => setSelectedStudentId(null)} />;
  }

  return (
    <div className="p-6 space-y-6 bg-slate-900 text-slate-100 min-h-screen">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-emerald-400" /> Student Directory & Year/Class Hierarchy
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Filter by academic year, semester, section, mentor, or search parameters</p>
        </div>

        {/* View Switcher */}
        <div className="flex bg-slate-800/80 p-1 rounded-lg border border-slate-700">
          <button
            onClick={() => setViewMode('roster')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'roster' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Student Roster
          </button>
          <button
            onClick={() => setViewMode('yearClass')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'yearClass' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Year & Class Hierarchy View
          </button>
        </div>
      </div>

      {/* Roster View */}
      {viewMode === 'roster' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-800/50 p-4 rounded-xl border border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, roll, reg no, email, mobile..."
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none"
            >
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          {/* Student Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((s) => (
              <div
                key={s.id}
                onClick={() => setSelectedStudentId(s.id)}
                className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 hover:border-indigo-500/60 hover:bg-slate-800/80 transition-all cursor-pointer space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white text-base">{s.firstName} {s.lastName}</h3>
                    <span className="text-xs font-mono text-indigo-400">{s.admissionNo}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/30">
                    {s.status}
                  </span>
                </div>
                <div className="text-xs text-slate-400 space-y-1 border-t border-slate-700/50 pt-2">
                  <div className="flex justify-between"><span>Email:</span> <span className="text-slate-200">{s.email}</span></div>
                  <div className="flex justify-between"><span>Phone:</span> <span className="text-slate-200">{s.phone || 'N/A'}</span></div>
                  <div className="flex justify-between"><span>Assigned Mentor:</span> <span className="text-purple-400 font-medium">{s.mentor ? `${s.mentor.firstName} ${s.mentor.lastName}` : 'Unassigned'}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Year & Class Accordion View */}
      {viewMode === 'yearClass' && (
        <div className="space-y-4">
          {hierarchy.map((year) => (
            <div key={year.yearNumber} className="bg-slate-800/50 rounded-xl border border-slate-800 overflow-hidden">
              <button
                onClick={() => setExpandedYear(expandedYear === year.yearNumber ? null : year.yearNumber)}
                className="w-full p-4 flex justify-between items-center text-left bg-slate-800/80 hover:bg-slate-800 font-bold text-white text-base"
              >
                <span className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-400" /> {year.yearName}
                </span>
                {expandedYear === year.yearNumber ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </button>

              {expandedYear === year.yearNumber && (
                <div className="p-4 space-y-4">
                  {year.semesters.map((sem: any) => (
                    <div key={sem.id} className="bg-slate-900/60 p-4 rounded-lg border border-slate-700/60 space-y-3">
                      <h4 className="font-semibold text-indigo-300 text-sm">{sem.name}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {sem.sections.map((sec: any) => (
                          <div key={sec.id} className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-xs text-white">{sec.name}</span>
                              <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{sec.studentCount} Students</span>
                            </div>
                            <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                              {sec.students.map((st: any) => (
                                <div
                                  key={st.id}
                                  onClick={() => setSelectedStudentId(st.id)}
                                  className="text-xs text-slate-300 hover:text-white hover:bg-indigo-950/40 p-1.5 rounded cursor-pointer flex justify-between"
                                >
                                  <span>{st.firstName} {st.lastName}</span>
                                  <span className="font-mono text-[10px] text-slate-500">{st.admissionNo}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
