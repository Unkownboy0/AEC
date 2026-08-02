import React, { useState, useEffect } from 'react';
import api from '../lib/axios';
import { ArrowLeft, User, Briefcase, BookOpen, Clock, Users, Award, Calendar } from 'lucide-react';

export const FacultyProfilePage: React.FC<{ facultyId: string; onBack?: () => void }> = ({ facultyId, onBack }) => {
  const [faculty, setFaculty] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'subjects' | 'timetable' | 'mentoredStudents'>('profile');

  const fetchFullProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/enterprise/faculty/${facultyId}/full-profile`);
      if (res.data?.status === 'success') {
        setFaculty(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load faculty profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFullProfile();
  }, [facultyId]);

  if (loading) {
    return <div className="p-8 text-center text-slate-400 bg-slate-900 min-h-screen">Loading 360° Faculty Profile...</div>;
  }

  if (!faculty) {
    return <div className="p-8 text-center text-rose-400 bg-slate-900 min-h-screen">Faculty profile not found.</div>;
  }

  return (
    <div className="p-6 space-y-6 bg-slate-900 text-slate-100 min-h-screen">
      {/* Top Navigation */}
      <div className="flex items-center gap-4">
        {onBack && (
          <button onClick={onBack} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <User className="w-7 h-7 text-purple-400" /> {faculty.firstName} {faculty.lastName}
          </h1>
          <p className="text-xs font-mono text-purple-400">Employee ID: {faculty.employeeId} | {faculty.designation}</p>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex bg-slate-800/80 p-1 rounded-lg border border-slate-700 overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'profile' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Professional Profile
        </button>
        <button
          onClick={() => setActiveTab('subjects')}
          className={`px-4 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'subjects' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Assigned Subjects ({faculty.assignedSubjects?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('timetable')}
          className={`px-4 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'timetable' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Timetable & Workload ({faculty.timetableSlots?.length || 0} Slots)
        </button>
        <button
          onClick={() => setActiveTab('mentoredStudents')}
          className={`px-4 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'mentoredStudents' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Mentored Students ({faculty.mentoredStudents?.length || 0})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-800/40 p-6 rounded-xl border border-slate-800">
          <div className="space-y-3 text-sm text-slate-300">
            <h3 className="font-bold text-white text-base border-b border-slate-700 pb-2 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-purple-400" /> Academic & Experience
            </h3>
            <div><span className="text-slate-500">Department:</span> {faculty.department?.name} ({faculty.department?.code})</div>
            <div><span className="text-slate-500">Qualification:</span> {faculty.qualification}</div>
            <div><span className="text-slate-500">Total Experience:</span> {faculty.experience} Years</div>
            <div><span className="text-slate-500">Date of Joining:</span> {new Date(faculty.dateOfJoining).toLocaleDateString()}</div>
            <div><span className="text-slate-500">Email:</span> {faculty.email}</div>
            <div><span className="text-slate-500">Phone:</span> {faculty.phone}</div>
          </div>

          <div className="space-y-3 text-sm text-slate-300">
            <h3 className="font-bold text-white text-base border-b border-slate-700 pb-2 flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-400" /> Research & Publications
            </h3>
            <div><span className="text-slate-500">Specialization:</span> {faculty.specialization || 'Computer Science & Engineering'}</div>
            <div><span className="text-slate-500">Publications:</span> {faculty.publications || 'Indexed Journal Papers Submitted'}</div>
          </div>
        </div>
      )}

      {activeTab === 'subjects' && (
        <div className="bg-slate-800/40 p-6 rounded-xl border border-slate-800 space-y-4">
          <h3 className="font-bold text-white text-base border-b border-slate-700 pb-2 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-400" /> Assigned Subjects
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {faculty.assignedSubjects?.map((sub: any) => (
              <div key={sub.id} className="p-4 bg-slate-900/80 rounded-lg border border-slate-700/60 space-y-1">
                <span className="text-xs font-mono text-purple-400 font-semibold">{sub.code}</span>
                <h4 className="font-bold text-white text-base">{sub.name}</h4>
                <div className="text-xs text-slate-400">Credits: {sub.credits} | Theory: {sub.theoryHours}h</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'mentoredStudents' && (
        <div className="bg-slate-800/40 p-6 rounded-xl border border-slate-800 space-y-4">
          <h3 className="font-bold text-white text-base border-b border-slate-700 pb-2 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" /> Mentored Student Roster
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {faculty.mentoredStudents?.map((st: any) => (
              <div key={st.id} className="p-3 bg-slate-900/80 rounded-lg border border-slate-700/60 flex justify-between items-center">
                <div>
                  <div className="font-semibold text-slate-100 text-sm">{st.firstName} {st.lastName}</div>
                  <div className="text-xs font-mono text-indigo-400">{st.admissionNo}</div>
                </div>
                <span className="text-xs text-slate-400">{st.email}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyProfilePage;
