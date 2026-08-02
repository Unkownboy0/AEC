import React, { useState, useEffect } from 'react';
import { Layers, Plus, CheckCircle2, Clock, Calendar, UserCheck, RefreshCw } from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';

export const HodTaskWorkspace: React.FC = () => {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // Form State
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [priority, setPriority] = useState<string>('MEDIUM');
  const [dueDate, setDueDate] = useState<string>('');
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const [tRes, fRes] = await Promise.all([
        api.get('/api/hod/tasks'),
        api.get('/api/hod/faculty'),
      ]);
      setTasks(tRes.data?.data || []);
      setFaculty(fRes.data?.data || []);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to load department task workspace', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreateTask = async () => {
    if (!title.trim() || !dueDate) {
      showToast('Task title and due date are required', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/api/hod/tasks', {
        title: title.trim(),
        description: description.trim(),
        priority,
        dueDate,
        assigneeIds: selectedAssigneeIds,
      });

      showToast('Department task created and assigned successfully', 'success');
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      setSelectedAssigneeIds([]);
      fetchTasks();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to create task', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-amber-600" /> Department Task Workspace
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Create, assign, track, and review department academic tasks for faculty and mentors.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Create Department Task
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map(t => (
          <div key={t.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-indigo-600">{t.taskNumber}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                t.priority === 'HIGH' || t.priority === 'URGENT' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
              }`}>
                {t.priority}
              </span>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">{t.title}</h3>
            {t.description && <p className="text-xs text-slate-500 line-clamp-2">{t.description}</p>}
            <div className="text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-between">
              <span>Due: {new Date(t.dueDate).toLocaleDateString()}</span>
              <span className="font-semibold text-emerald-600">{t.status}</span>
            </div>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create Department Task</h3>
            <input
              type="text"
              placeholder="Task Title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 bg-slate-50 border rounded-xl text-sm"
            />
            <textarea
              rows={3}
              placeholder="Detailed Instructions / Guidelines..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 bg-slate-50 border rounded-xl text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500">Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm mt-1">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Due Date</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-xl text-sm mt-1" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-slate-600 text-sm font-semibold">Cancel</button>
              <button disabled={submitting} onClick={handleCreateTask} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold">Create & Assign</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HodTaskWorkspace;
