import React, { useEffect, useState } from 'react';
import {
  Kanban,
  ListTodo,
  Users,
  Calendar as CalendarIcon,
  Plus,
  CheckSquare,
  Clock,
  AlertCircle,
  FileText,
  MessageSquare,
  Send,
  UserCheck,
  Shield,
  Layers,
  ChevronRight,
} from 'lucide-react';
import api from '../../lib/axios';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';

export const WorkManagementWorkspace: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'kanban' | 'list' | 'workload' | 'templates'>('kanban');
  const [isLoading, setIsLoading] = useState(true);
  const [kanbanData, setKanbanData] = useState<any>({ totalTasks: 0, columns: {} });
  const [workloadData, setWorkloadData] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [newComment, setNewComment] = useState('');

  const fetchKanban = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/enterprise/tasks/kanban');
      if (res.data?.status === 'success') {
        setKanbanData(res.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load Kanban board tasks.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWorkload = async () => {
    try {
      const res = await api.get('/enterprise/tasks/workload-analytics');
      if (res.data?.status === 'success') {
        setWorkloadData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/enterprise/tasks/templates');
      if (res.data?.status === 'success') {
        setTemplates(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'kanban' || activeTab === 'list') fetchKanban();
    if (activeTab === 'workload') fetchWorkload();
    if (activeTab === 'templates') fetchTemplates();
  }, [activeTab]);

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const res = await api.patch(`/enterprise/tasks/${taskId}/status`, { status: newStatus });
      if (res.data?.status === 'success') {
        toast.success(`Task status updated to ${newStatus}`);
        fetchKanban();
        if (selectedTask?.id === taskId) {
          setSelectedTask(res.data.data);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update task status.');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTask) return;
    try {
      const res = await api.post(`/enterprise/tasks/${selectedTask.id}/comments`, {
        content: newComment.trim(),
      });
      if (res.data?.status === 'success') {
        toast.success('Comment posted');
        setNewComment('');
        const taskRes = await api.get(`/enterprise/tasks/${selectedTask.id}`);
        if (taskRes.data?.status === 'success') {
          setSelectedTask(taskRes.data.data);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to post comment.');
    }
  };

  const columnKeys = ['NOT_SEEN', 'SEEN', 'ACCEPTED', 'IN_PROGRESS', 'WAITING_APPROVAL', 'COMPLETED', 'REJECTED'];
  const columnTitles: Record<string, string> = {
    NOT_SEEN: 'Not Seen',
    SEEN: 'Seen / Opened',
    ACCEPTED: 'Accepted',
    IN_PROGRESS: 'In Progress',
    WAITING_APPROVAL: 'Waiting Approval',
    COMPLETED: 'Completed',
    REJECTED: 'Rejected',
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200 p-2 md:p-4">
      {/* Top Bar Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-foreground tracking-tight uppercase flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" /> Enterprise Work Management & Collaboration
          </h2>
          <p className="text-xs text-muted-foreground font-semibold">
            Jira & ClickUp Style Task Engine, SLA Tracking & Workload Balancer
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('kanban')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'kanban' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-secondary text-secondary-foreground'
            }`}
          >
            <Kanban className="h-3.5 w-3.5" /> Kanban Board
          </button>
          <button
            onClick={() => setActiveTab('workload')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'workload' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-secondary text-secondary-foreground'
            }`}
          >
            <Users className="h-3.5 w-3.5" /> Workload Balancer
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'templates' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-secondary text-secondary-foreground'
            }`}
          >
            <FileText className="h-3.5 w-3.5" /> Template Library
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-[60vh] items-center justify-center">
          <Loading text="Loading Work Management System..." />
        </div>
      ) : (
        <>
          {/* TAB 1: KANBAN BOARD */}
          {activeTab === 'kanban' && (
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3 overflow-x-auto min-h-[65vh]">
              {columnKeys.map((colKey) => {
                const list = kanbanData.columns[colKey] || [];
                return (
                  <div key={colKey} className="bg-card border rounded-2xl p-3 flex flex-col space-y-3 min-w-[240px]">
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                        {columnTitles[colKey]}
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                        {list.length}
                      </span>
                    </div>

                    <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[70vh]">
                      {list.map((task: any) => (
                        <div
                          key={task.id}
                          onClick={() => setSelectedTask(task)}
                          className="p-3 border rounded-xl bg-background hover:border-primary cursor-pointer transition shadow-xs space-y-2"
                        >
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className="text-primary">{task.taskNumber}</span>
                            <span
                              className={`px-1.5 py-0.5 rounded-md uppercase text-[8px] font-extrabold ${
                                task.priority === 'URGENT'
                                  ? 'bg-red-500/20 text-red-500'
                                  : task.priority === 'HIGH'
                                  ? 'bg-amber-500/20 text-amber-500'
                                  : 'bg-emerald-500/20 text-emerald-500'
                              }`}
                            >
                              {task.priority}
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-foreground line-clamp-2">{task.title}</h4>

                          <div className="flex items-center justify-between text-[9px] text-muted-foreground pt-1 border-t">
                            <span>{task.category || 'ACADEMIC'}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5" />
                              {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Due Date'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: WORKLOAD BALANCER */}
          {activeTab === 'workload' && workloadData && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border bg-card p-4 rounded-2xl shadow-sm text-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Total Monitored Staff</span>
                  <span className="text-2xl font-black text-primary">{workloadData.totalStaff}</span>
                </div>
                <div className="border bg-card p-4 rounded-2xl shadow-sm text-center border-l-4 border-l-red-500">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Overloaded Staff (High Risk)</span>
                  <span className="text-2xl font-black text-red-500">{workloadData.highLoadStaffCount}</span>
                </div>
                <div className="border bg-card p-4 rounded-2xl shadow-sm text-center border-l-4 border-l-emerald-500">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Healthy Capacity</span>
                  <span className="text-2xl font-black text-emerald-500">{workloadData.totalStaff - workloadData.highLoadStaffCount}</span>
                </div>
              </div>

              <div className="border bg-card rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-extrabold uppercase text-muted-foreground">Department Faculty & Staff Workload Heatmap</h4>
                <div className="space-y-2">
                  {workloadData.workloadList?.map((staff: any) => (
                    <div key={staff.userId} className="flex items-center justify-between p-3 border rounded-xl bg-background">
                      <div>
                        <h5 className="text-xs font-bold text-foreground">{staff.name}</h5>
                        <p className="text-[10px] text-muted-foreground">{staff.designation || 'Staff Member'} · {staff.email}</p>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-bold">
                        <span>{staff.activeTasksCount} Active Tasks</span>
                        <span>{staff.totalEstimatedHours} Est. Hours</span>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            staff.loadRisk === 'HIGH_LOAD'
                              ? 'bg-red-500/20 text-red-500'
                              : staff.loadRisk === 'MEDIUM'
                              ? 'bg-amber-500/20 text-amber-500'
                              : 'bg-emerald-500/20 text-emerald-500'
                          }`}
                        >
                          {staff.loadRisk}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TEMPLATES */}
          {activeTab === 'templates' && (
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold uppercase text-muted-foreground">Centralized Task Template Library</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {templates.map((tpl: any) => (
                  <div key={tpl.id} className="border bg-card p-4 rounded-2xl space-y-2">
                    <span className="text-[9px] font-bold text-primary tracking-wider uppercase block">{tpl.category}</span>
                    <h5 className="text-sm font-bold text-foreground">{tpl.name}</h5>
                    <p className="text-xs text-muted-foreground">{tpl.description || 'Standard academic compliance template.'}</p>
                    <div className="flex justify-between items-center text-[10px] font-semibold text-muted-foreground pt-2 border-t">
                      <span>Timeline: {tpl.suggestedTimelineDays} Days</span>
                      <span>SLA: {tpl.slaHours} Hours</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TASK DETAILS MODAL */}
          {selectedTask && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-card border rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start border-b pb-3">
                  <div>
                    <span className="text-xs font-bold text-primary">{selectedTask.taskNumber}</span>
                    <h3 className="text-lg font-black text-foreground">{selectedTask.title}</h3>
                  </div>
                  <button onClick={() => setSelectedTask(null)} className="text-xs font-bold text-muted-foreground">✕ Close</button>
                </div>

                <div className="space-y-2 text-xs">
                  <p className="text-muted-foreground">{selectedTask.description || 'No detailed description provided.'}</p>

                  <div className="flex items-center gap-2 pt-2">
                    <span className="font-bold text-muted-foreground">Update Status:</span>
                    {columnKeys.map((k) => (
                      <button
                        key={k}
                        onClick={() => handleStatusChange(selectedTask.id, k)}
                        className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                          selectedTask.status === k ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                        }`}
                      >
                        {columnTitles[k]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comments */}
                <div className="border-t pt-3 space-y-3">
                  <h4 className="text-xs font-extrabold uppercase text-muted-foreground flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" /> Discussion Thread
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto text-xs">
                    {selectedTask.comments?.map((c: any) => (
                      <div key={c.id} className="p-2 border rounded-xl bg-background">
                        <span className="font-bold text-primary">{c.author?.firstName} {c.author?.lastName}</span>
                        <p className="text-muted-foreground">{c.content}</p>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleAddComment} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Add a comment or reply..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="flex-1 text-xs border rounded-xl p-2 bg-background"
                    />
                    <button type="submit" className="p-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold">
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WorkManagementWorkspace;
