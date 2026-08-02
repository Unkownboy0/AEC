import React, { useState, useEffect } from 'react';
import api from '../../lib/axios';
import { CheckCircle2, Clock, AlertTriangle, MessageSquare, User, Calendar, Plus, Send } from 'lucide-react';

export const TaskBoard: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [commentText, setCommentText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
    assigneeIds: [],
  });

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tasks', { params: { status: filterStatus } });
      if (res.data?.status === 'success') {
        setTasks(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [filterStatus]);

  const handleSelectTask = async (taskId: string) => {
    try {
      const res = await api.get(`/tasks/${taskId}`);
      if (res.data?.status === 'success') {
        setSelectedTask(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load task details:', err);
    }
  };

  const handleStatusUpdate = async (taskId: string, status: string) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status });
      fetchTasks();
      if (selectedTask?.id === taskId) {
        handleSelectTask(taskId);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !commentText.trim()) return;

    try {
      await api.post(`/tasks/${selectedTask.id}/comments`, { content: commentText });
      setCommentText('');
      handleSelectTask(selectedTask.id);
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">Urgent</span>;
      case 'HIGH':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">High</span>;
      case 'MEDIUM':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">Medium</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30">Low</span>;
    }
  };

  const getStatusBadge = (status: string, isOverdue: boolean) => {
    if (isOverdue) {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-600/20 text-red-400 border border-red-500/40 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Overdue</span>;
    }
    switch (status) {
      case 'COMPLETED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Completed</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center gap-1"><Clock className="w-3 h-3" /> In Progress</span>;
      case 'ACCEPTED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">Accepted</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-600/20 text-slate-300 border border-slate-500/30">Not Seen</span>;
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-900 text-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Clock className="w-7 h-7 text-indigo-400" /> Enterprise Task & Collaboration Workspace
          </h1>
          <p className="text-slate-400 text-sm mt-1">Realtime task lifecycle, department scoping, and discussion threads</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">All Statuses</option>
            <option value="NOT_SEEN">Not Seen</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Task List (Left) */}
        <div className="lg:col-span-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Assigned Tasks ({tasks.length})</h2>
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="p-8 text-center bg-slate-800/40 rounded-xl border border-slate-800 text-slate-400">No tasks found</div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => handleSelectTask(task.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedTask?.id === task.id
                    ? 'bg-indigo-950/40 border-indigo-500/80 shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-800/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-mono text-indigo-400 font-semibold">{task.taskNumber}</span>
                  <div className="flex gap-2">
                    {getPriorityBadge(task.priority)}
                    {getStatusBadge(task.status, task.isOverdue)}
                  </div>
                </div>
                <h3 className="font-semibold text-slate-100 text-base mb-1">{task.title}</h3>
                <p className="text-slate-400 text-xs line-clamp-2 mb-3">{task.description}</p>
                
                {/* Progress bar */}
                <div className="w-full bg-slate-700 rounded-full h-1.5 mb-3 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${task.completionPercent}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-xs text-slate-400 border-t border-slate-700/40 pt-2">
                  <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {task.createdBy?.firstName} {task.createdBy?.lastName}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Due Date'}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Task Details & Discussion (Right) */}
        <div className="lg:col-span-7">
          {selectedTask ? (
            <div className="bg-slate-800/60 rounded-xl border border-slate-700/80 p-6 space-y-6">
              <div className="flex justify-between items-start border-b border-slate-700 pb-4">
                <div>
                  <span className="text-xs font-mono text-indigo-400 font-bold">{selectedTask.taskNumber}</span>
                  <h2 className="text-xl font-bold text-white mt-1">{selectedTask.title}</h2>
                  <p className="text-slate-400 text-sm mt-2">{selectedTask.description}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getPriorityBadge(selectedTask.priority)}
                  {getStatusBadge(selectedTask.status, selectedTask.isOverdue)}
                </div>
              </div>

              {/* Task Actions */}
              <div className="flex flex-wrap gap-3 bg-slate-900/60 p-4 rounded-lg border border-slate-700/50">
                {selectedTask.status === 'NOT_SEEN' || selectedTask.status === 'SEEN' ? (
                  <button
                    onClick={() => handleStatusUpdate(selectedTask.id, 'ACCEPTED')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-xs transition-all shadow-md"
                  >
                    Accept Task
                  </button>
                ) : null}

                {['ACCEPTED', 'IN_PROGRESS'].includes(selectedTask.status) ? (
                  <button
                    onClick={() => handleStatusUpdate(selectedTask.id, 'COMPLETED')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-xs transition-all shadow-md flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Mark as Completed
                  </button>
                ) : null}
              </div>

              {/* Discussion Thread */}
              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-400" /> Discussion Thread ({selectedTask.comments?.length || 0})
                </h3>

                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                  {selectedTask.comments?.map((c: any) => (
                    <div key={c.id} className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-700/60 space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-indigo-300">{c.author?.firstName} {c.author?.lastName} ({c.author?.role})</span>
                        <span className="text-slate-500">{new Date(c.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-200 text-sm">{c.content}</p>
                    </div>
                  ))}
                </div>

                {/* Add Comment Input */}
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Type a comment or mention user with @email..."
                    className="flex-1 bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg font-semibold text-xs transition-all flex items-center gap-1"
                  >
                    <Send className="w-4 h-4" /> Send
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/30 rounded-xl border border-slate-800 p-12 text-center text-slate-500">
              Select a task to view details, timeline, and discussion thread.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
