import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Users, Search, Filter, ShieldCheck, Download, RefreshCw, UserCheck, Check, UserPlus, Heart } from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';

export const HodStudentWorkspace: React.FC = () => {
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const isMentorPath = location.pathname.includes('/mentors');
  const [activeTab, setActiveTab] = useState<'students' | 'mentors'>(isMentorPath ? 'mentors' : 'students');

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

  useEffect(() => {
    setActiveTab(location.pathname.includes('/mentors') ? 'mentors' : 'students');
  }, [location.pathname]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stRes, mRes] = await Promise.all([
        api.get(`/hod/students?search=${search}&attendanceFilter=${attendanceFilter}`),
        api.get('/hod/faculty'),
      ]);
      setStudents(stRes.data?.data || []);
      setMentors(mRes.data?.data || []);
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Failed to load department student roster', 'error');
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
      const res = await api.post('/hod/students/assign-mentor', {
        mentorId: targetMentorId,
        studentIds: selectedIds,
      });
      showToast(`Assigned ${selectedIds.length} students to mentor ${res.data?.data?.mentorName || 'Faculty'}`, 'success');
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
            {activeTab === 'students' ? (
              <><Users className="w-6 h-6 text-indigo-600" /> Department Students Directory</>
            ) : (
              <><Heart className="w-6 h-6 text-pink-600" /> Department Mentor Allocation & Capacities</>
            )}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {activeTab === 'students'
              ? 'View department student roster, track attendance shortages, and monitor active leaves.'
              : 'View department faculty mentors, mentee allocation metrics, and bulk assign students.'}
          </p>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => { setActiveTab('students'); navigate('/hod/students'); }}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'students'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Users className="w-4 h-4" /> Students Directory ({students.length})
            </button>
            <button
              onClick={() => { setActiveTab('mentors'); navigate('/hod/mentors'); }}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'mentors'
                  ? 'bg-pink-600 text-white shadow-md shadow-pink-600/20'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <UserPlus className="w-4 h-4" /> Mentor Allocation Desk ({mentors.length})
            </button>
          </div>
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

      {activeTab === 'mentors' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mentors.map(m => (
            <div key={m.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-mono text-slate-400">{m.employeeId || 'FACULTY'}</span>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {typeof m.name === 'string' ? m.name : `${m.firstName || ''} ${m.lastName || ''}`.trim() || 'Faculty'}
                  </h3>
                  <div className="text-xs text-indigo-600 font-semibold">{m.designation || 'Assistant Professor'}</div>
                </div>
                <span className="px-2.5 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 rounded-lg text-xs font-bold flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" /> MENTOR
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex justify-between">
                  <span>Assigned Mentees:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{m.mentoredStudentCount || m.assignedStudentCount || 0} Students</span>
                </div>
                <div className="flex justify-between">
                  <span>Contact Email:</span>
                  <span className="font-mono text-slate-500">{m.email || 'N/A'}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setTargetMentorId(m.id);
                    setShowAssignModal(true);
                  }}
                  className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" /> Assign Students to {typeof m.name === 'string' ? m.name.split(' ')[0] : (m.firstName || 'Faculty')}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Students Data Table */
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
                      <td className="p-4">
                        {typeof st.semester === 'object' ? (st.semester?.name || `Sem ${st.semester?.number || 1}`) : String(st.semester || 'Sem 1')} • Sec {typeof st.section === 'object' ? (st.section?.name || 'A') : String(st.section || 'A')}
                      </td>
                      <td className="p-4 font-medium text-slate-700 dark:text-slate-300">
                        {typeof st.mentor === 'object' ? (`${st.mentor?.firstName || ''} ${st.mentor?.lastName || ''}`.trim() || 'Unassigned') : String(st.mentor || 'Unassigned')}
                      </td>
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
      )}

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
