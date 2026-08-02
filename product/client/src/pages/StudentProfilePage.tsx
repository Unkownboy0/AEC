import React, { useState, useEffect } from 'react';
import api from '../lib/axios';
import { ArrowLeft, User, GraduationCap, Heart, Clock, Award, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export const StudentProfilePage: React.FC<{ studentId: string; onBack?: () => void }> = ({ studentId, onBack }) => {
  const [student, setStudent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'personal' | 'academics' | 'parent' | 'workflows' | 'counseling' | 'fees'>('personal');

  const fetchFullProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/enterprise/students/${studentId}/full-profile`);
      if (res.data?.status === 'success') {
        setStudent(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load student full profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFullProfile();
  }, [studentId]);

  if (loading) {
    return <div className="p-8 text-center text-slate-400 bg-slate-900 min-h-screen">Loading 360° Student Profile...</div>;
  }

  if (!student) {
    return <div className="p-8 text-center text-rose-400 bg-slate-900 min-h-screen">Student profile not found.</div>;
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
            <GraduationCap className="w-7 h-7 text-emerald-400" /> {student.firstName} {student.lastName}
          </h1>
          <p className="text-xs font-mono text-indigo-400">Admission No: {student.admissionNo}</p>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex bg-slate-800/80 p-1 rounded-lg border border-slate-700 overflow-x-auto">
        <button
          onClick={() => setActiveTab('personal')}
          className={`px-4 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'personal' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Personal & Contact
        </button>
        <button
          onClick={() => setActiveTab('academics')}
          className={`px-4 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'academics' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Academics, Marks & Attendance
        </button>
        <button
          onClick={() => setActiveTab('parent')}
          className={`px-4 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'parent' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Parent & Guardian
        </button>
        <button
          onClick={() => setActiveTab('workflows')}
          className={`px-4 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'workflows' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Leave & OD History ({student.workflowRequests?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('counseling')}
          className={`px-4 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'counseling' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Mentor Counseling
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'personal' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-800/40 p-6 rounded-xl border border-slate-800">
          <div className="space-y-3">
            <h3 className="font-bold text-white text-base border-b border-slate-700 pb-2 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-400" /> Basic Details
            </h3>
            <div className="text-sm space-y-2 text-slate-300">
              <div><span className="text-slate-500">Gender:</span> {student.gender}</div>
              <div><span className="text-slate-500">Date of Birth:</span> {new Date(student.dob).toLocaleDateString()}</div>
              <div><span className="text-slate-500">Email:</span> {student.email}</div>
              <div><span className="text-slate-500">Phone:</span> {student.phone || 'N/A'}</div>
              <div><span className="text-slate-500">Current Address:</span> {student.currentAddress}</div>
              <div><span className="text-slate-500">Permanent Address:</span> {student.permanentAddress}</div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-white text-base border-b border-slate-700 pb-2 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-400" /> Program & Assigned Mentor
            </h3>
            <div className="text-sm space-y-2 text-slate-300">
              <div><span className="text-slate-500">Department:</span> {student.department?.name} ({student.department?.code})</div>
              <div><span className="text-slate-500">Program:</span> {student.program?.name}</div>
              <div><span className="text-slate-500">Semester & Section:</span> {student.semester?.name} - {student.section?.name}</div>
              <div><span className="text-slate-500">Assigned Mentor:</span> <span className="text-purple-400 font-semibold">{student.mentor ? `${student.mentor.firstName} ${student.mentor.lastName}` : 'Unassigned'}</span></div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'academics' && (
        <div className="space-y-6">
          <div className="bg-slate-800/40 p-6 rounded-xl border border-slate-800 space-y-4">
            <h3 className="font-bold text-white text-base border-b border-slate-700 pb-2">Academic Marks Ledger</h3>
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800 text-slate-400 text-xs uppercase">
                <tr>
                  <th className="p-3">Subject Code</th>
                  <th className="p-3">Subject Name</th>
                  <th className="p-3">Internal Marks</th>
                  <th className="p-3">External Marks</th>
                  <th className="p-3">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {student.marks?.map((m: any) => (
                  <tr key={m.id}>
                    <td className="p-3 font-mono text-xs text-indigo-400">{m.subject?.code}</td>
                    <td className="p-3 font-semibold">{m.subject?.name}</td>
                    <td className="p-3">{m.internalMarks} / 40</td>
                    <td className="p-3">{m.externalMarks} / 60</td>
                    <td className="p-3 font-bold text-emerald-400">{m.grade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'workflows' && (
        <div className="bg-slate-800/40 p-6 rounded-xl border border-slate-800 space-y-4">
          <h3 className="font-bold text-white text-base border-b border-slate-700 pb-2 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" /> Leave & OD Workflow Requests
          </h3>
          <div className="space-y-3">
            {student.workflowRequests?.map((r: any) => (
              <div key={r.id} className="p-4 bg-slate-900/80 rounded-xl border border-slate-700/60 space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-indigo-400">{r.type}</span>
                  <span className="text-emerald-400">{r.status}</span>
                </div>
                <h4 className="font-bold text-white text-base">{r.title}</h4>
                <p className="text-slate-400 text-sm">{r.reason}</p>
                <div className="text-xs text-slate-500 border-t border-slate-800 pt-2 flex justify-between">
                  <span>Current Step: {r.currentStep}</span>
                  <span>Submitted: {new Date(r.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfilePage;
