import React, { useState, useEffect } from 'react';
import api from '../lib/axios';
import { User, Search, Filter, Briefcase, Mail, Phone, Shield } from 'lucide-react';
import { FacultyProfilePage } from './FacultyProfilePage';

export const FacultyDirectory: React.FC = () => {
  const [faculty, setFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(null);

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const res = await api.get('/enterprise/hod/faculty');
      if (res.data?.status === 'success') {
        setFaculty(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch faculty:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  if (selectedFacultyId) {
    return <FacultyProfilePage facultyId={selectedFacultyId} onBack={() => setSelectedFacultyId(null)} />;
  }

  const filteredFaculty = faculty.filter((f) => {
    const q = search.toLowerCase();
    return (
      f.firstName?.toLowerCase().includes(q) ||
      f.lastName?.toLowerCase().includes(q) ||
      f.employeeId?.toLowerCase().includes(q) ||
      f.designation?.toLowerCase().includes(q) ||
      f.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 space-y-6 bg-slate-900 text-slate-100 min-h-screen">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <User className="w-7 h-7 text-purple-400" /> Faculty & Mentor Directory
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Browse active department faculty members, designations, and workload</p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800 relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-7 top-7" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by faculty name, employee ID, designation, email..."
          className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Faculty Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center p-8 text-slate-500">Loading faculty directory...</div>
        ) : filteredFaculty.length === 0 ? (
          <div className="col-span-full text-center p-8 text-slate-500">No faculty members found.</div>
        ) : (
          filteredFaculty.map((f) => (
            <div
              key={f.id}
              onClick={() => setSelectedFacultyId(f.id)}
              className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 hover:border-purple-500/60 hover:bg-slate-800/80 transition-all cursor-pointer space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-white text-base">{f.firstName} {f.lastName}</h3>
                  <span className="text-xs font-mono text-purple-400">{f.employeeId}</span>
                </div>
                <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-300 text-xs font-bold rounded-full border border-purple-500/30">
                  {f.designation}
                </span>
              </div>

              <div className="text-xs text-slate-400 space-y-1.5 border-t border-slate-700/50 pt-2">
                <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-500" /> {f.email}</div>
                <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-500" /> {f.phone || 'N/A'}</div>
                <div className="flex justify-between pt-1">
                  <span>Experience: <strong className="text-slate-200">{f.experience} Years</strong></span>
                  <span>Mentored Students: <strong className="text-indigo-400">{f.mentorAssignments?.length || 0}</strong></span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
