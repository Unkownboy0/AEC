import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, ShieldCheck, Download, RefreshCw, UserCheck, Check } from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';

export const HodStudentWorkspace: React.FC = () => {
  const { showToast } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [attendanceFilter, setAttendanceFilter] = useState<'ALL' | 'BELOW_75' | 'BELOW_65'>('ALL');

  // Bulk Mentor Assignment Modal State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [targetMentorId, setTargetMentorId] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stRes, mRes] = await Promise.all([
        api.get(`/api/hod/students?search=${search}&attendanceFilter=${attendanceFilter}`),
        api.get('/api/hod/mentors'),
      ]);
      setStudents(stRes.data?.data || []);
      setMentors(mRes.data?.data?.mentors || []);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to load department student roster', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [attendanceFilter]);

  const handleAssignMentor = async () => {
    if (!targetMentorId) {
      showToast('Please select a mentor', 'error');
      return;
    }
    if (selectedIds.length === 0) return;

    try {
      setSubmitting(true);
      const res = await api.post('/api/hod/students/assign-mentor', {
        mentorId: targetMentorId,
        studentIds: selectedIds,
      });
      showToast(`Assigned ${selectedIds.length} students to mentor ${res.data?.data?.mentorName}`, 'success');
      setSelectedIds([]);
      setShowAssignModal(false);
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Mentor assignment failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" /> Department Student Roster & Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            View department students, monitor attendance shortage, and manage mentor assignments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <button
              onClick={() => setShowAssignModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition flex items-center gap-1.5"
            >
              <UserCheck className="w-4 h-4" /> Bulk Assign Mentor ({selectedIds.length})
            </button>
          )}
          <button
            onClick={fetchData}
            className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl border border-slate-200 dark:border-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name, register no, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchData()}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
          />
        </div>

        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={attendanceFilter}
            onChange={(e) => setAttendanceFilter(e.target.value as any)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm px-3 py-2 font-medium"
          >
            <option value="ALL">All Attendance Levels</option>
            <option value="BELOW_75">Shortage (&lt;75%)</option>
            <option value="BELOW_65">Critical (&lt;65%)</option>
          </select>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading department students...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === students.length && students.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds(students.map(s => s.id));
                        else setSelectedIds([]);
                      }}
                      className="rounded border-slate-300"
                    />
                  </th>
                  <th className="p-4">Admission No</th>
                  <th className="p-4">Student Name</th>
                  <th className="p-4">Sem & Section</th>
                  <th className="p-4">Assigned Mentor</th>
                  <th className="p-4">Attendance %</th>
                  <th className="p-4">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {students.map(st => (
                  <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(st.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedIds([...selectedIds, st.id]);
                          else setSelectedIds(selectedIds.filter(id => id !== st.id));
                        }}
                        className="rounded border-slate-300"
                      />
                    </td>
                    <td className="p-4 font-mono font-semibold text-slate-900 dark:text-white">{st.admissionNo}</td>
                    <td className="p-4 font-bold text-slate-900 dark:text-white">{st.name}</td>
                    <td className="p-4">{st.semester} • Sec {st.section}</td>
                    <td className="p-4 font-medium text-slate-700 dark:text-slate-300">{st.mentor}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${
                        st.attendancePercentage < 65 ? 'bg-rose-100 text-rose-700' :
                        st.attendancePercentage < 75 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {st.attendancePercentage}%
                      </span>
                    </td>
                    <td className="p-4 text-xs font-mono text-slate-500">{st.phone || st.parentPhone || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Mentor Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-700 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Assign Mentor ({selectedIds.length} Students)</h3>
            <p className="text-xs text-slate-500">Select a primary mentor from your department faculty roster.</p>
            <select
              value={targetMentorId}
              onChange={(e) => setTargetMentorId(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium"
            >
              <option value="">-- Select Department Mentor --</option>
              {mentors.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.assignedStudentCount} assigned)</option>
              ))}
            </select>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={() => setShowAssignModal(false)} className="px-4 py-2 text-slate-600 text-sm font-semibold">Cancel</button>
              <button disabled={submitting} onClick={handleAssignMentor} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold">Confirm Assignment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HodStudentWorkspace;
