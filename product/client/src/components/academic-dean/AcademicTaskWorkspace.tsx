import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Filter, RefreshCw, Clock, CheckCircle, AlertCircle,
  FileSpreadsheet, FileText, ChevronRight, Eye, Layers, Send, ChevronLeft
} from 'lucide-react';
import { toast } from '../ui/Toast';
import { Loading } from '../ui/Loading';
import api from '../../lib/axios';
import { CreateTaskWizard } from './CreateTaskWizard';
import { TaskDetailPage } from './TaskDetailPage';

interface AcademicTaskWorkspaceProps {
  user: any;
}

export const AcademicTaskWorkspace: React.FC<AcademicTaskWorkspaceProps> = ({ user }) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [createWizardOpen, setCreateWizardOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, [pagination.page, statusFilter, categoryFilter, priorityFilter]);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', String(pagination.page));
      params.append('limit', String(pagination.limit));
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (categoryFilter) params.append('category', categoryFilter);
      if (priorityFilter) params.append('priority', priorityFilter);

      const res = await api.get(`/academic-dean/tasks?${params.toString()}`);
      setTasks(res.data.data || []);
      if (res.data.meta) {
        setPagination((prev) => ({
          ...prev,
          total: res.data.meta.total,
          totalPages: res.data.meta.totalPages,
        }));
      }
    } catch (err: any) {
      toast.error('Failed to fetch tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchTasks();
  };

  if (selectedTaskId) {
    return <TaskDetailPage taskId={selectedTaskId} onBack={() => setSelectedTaskId(null)} />;
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" /> Academic Dean Task Workspace
          </h2>
          <p className="text-xs text-muted-foreground">
            Enterprise task assignment, HOD document collection, query resolution & compliance tracking
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTasks}
            className="p-2 rounded-xl border hover:bg-muted text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          <button
            onClick={() => setCreateWizardOpen(true)}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-extrabold flex items-center gap-2 shadow-sm hover:bg-primary/90 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Create Academic Task
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-card border rounded-xl p-3 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks by ID, title, instructions..."
            className="w-full text-xs bg-background border rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-primary/20"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto text-xs">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-background border rounded-lg px-2.5 py-1.5 outline-none font-semibold"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="PARTIALLY_SUBMITTED">Partially Submitted</option>
            <option value="COMPLETED">Completed</option>
            <option value="OVERDUE">Overdue</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-background border rounded-lg px-2.5 py-1.5 outline-none font-semibold"
          >
            <option value="">All Categories</option>
            <option value="ACADEMIC_REPORT">Academic Report</option>
            <option value="STUDENT_DETAILS">Student Details</option>
            <option value="ATTENDANCE_REPORT">Attendance Report</option>
            <option value="RESULT_ANALYSIS">Result Analysis</option>
            <option value="ACCREDITATION_DATA">Accreditation Data</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-background border rounded-lg px-2.5 py-1.5 outline-none font-semibold"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>

      {/* Task Table */}
      {isLoading ? (
        <Loading text="Loading Academic Dean Tasks..." />
      ) : (
        <div className="bg-card border rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-muted/40 border-b text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  <th className="p-3">Task ID</th>
                  <th className="p-3">Task Title</th>
                  <th className="p-3">Scope</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Start Date</th>
                  <th className="p-3">Due Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Progress</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-muted-foreground text-xs">
                      No academic tasks found matching the filter criteria.
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => (
                    <tr
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className="hover:bg-muted/40 cursor-pointer transition-all"
                    >
                      <td className="p-3 font-mono font-bold text-primary">{task.taskCode}</td>
                      <td className="p-3 font-bold text-foreground max-w-xs truncate">{task.title}</td>
                      <td className="p-3 font-semibold text-muted-foreground">{task.assignmentMode}</td>
                      <td className="p-3 font-bold">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          task.priority === 'URGENT'
                            ? 'bg-red-500/10 text-red-600'
                            : task.priority === 'HIGH'
                            ? 'bg-amber-500/10 text-amber-600'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground font-mono">
                        {new Date(task.startAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 font-mono font-bold text-red-600">
                        {new Date(task.dueAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 font-bold">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${
                          task.computedStatus === 'COMPLETED'
                            ? 'bg-green-500/10 text-green-600'
                            : task.computedStatus === 'OVERDUE'
                            ? 'bg-red-500/10 text-red-600'
                            : 'bg-blue-500/10 text-blue-600'
                        }`}>
                          {task.computedStatus}
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${task.progressPercent || 0}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-muted-foreground font-mono">{task.progressPercent || 0}%</span>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTaskId(task.id);
                          }}
                          className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary/20 cursor-pointer"
                        >
                          View Task
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-3 border-t bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Showing Page <strong className="text-foreground">{pagination.page}</strong> of{' '}
              <strong className="text-foreground">{pagination.totalPages}</strong> ({pagination.total} total tasks)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page === 1}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                className="px-3 py-1 rounded-lg border bg-card text-xs font-semibold disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                className="px-3 py-1 rounded-lg border bg-card text-xs font-semibold disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Wizard Modal */}
      {createWizardOpen && (
        <CreateTaskWizard
          onClose={() => setCreateWizardOpen(false)}
          onTaskCreated={() => {
            setCreateWizardOpen(false);
            fetchTasks();
          }}
        />
      )}
    </div>
  );
};
