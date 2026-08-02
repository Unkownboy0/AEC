import React, { useState, useEffect } from 'react';
import {
  Briefcase, CheckCircle2, Clock, AlertTriangle, Calendar,
  MessageSquare, FileText, CheckSquare, Eye, Send, Paperclip,
  Smile, UserCheck, ShieldAlert, Award, FileSpreadsheet, Layers,
  ChevronRight, ArrowRight, Download, Upload, Trash2, Edit3, Check, X
} from 'lucide-react';
import api from '../../lib/axios';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';

import { HODAcademicTasks } from '../../components/hod/HODAcademicTasks';

interface ExecutiveWorkspaceProps {
  user: any;
}

export const ExecutiveWorkspace: React.FC<ExecutiveWorkspaceProps> = ({ user }) => {
  const [activeSubTab, setActiveSubTab] = useState<string>('academic_dean_tasks');
  const [loading, setLoading] = useState<boolean>(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  
  // Discussion / Query Panel state
  const [newComment, setNewComment] = useState<string>('');
  const [comments, setComments] = useState<any[]>([]);
  const [checklistItems, setChecklistItems] = useState<any[]>([]);

  const fetchExecutiveTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/enterprise/tasks/kanban');
      if (res.data?.status === 'success') {
        const columns = res.data.data.columns || {};
        const allTasks: any[] = [];
        Object.keys(columns).forEach((colKey) => {
          if (Array.isArray(columns[colKey])) {
            allTasks.push(...columns[colKey]);
          }
        });
        setTasks(allTasks);
        if (allTasks.length > 0 && !selectedTask) {
          setSelectedTask(allTasks[0]);
          setChecklistItems(allTasks[0].checklist || [
            { id: '1', title: 'Gather NAAC Criterion 3 documentation', completed: true },
            { id: '2', title: 'Verify faculty research publications', completed: true },
            { id: '3', title: 'Compile IQAC audit compliance deck', completed: false },
          ]);
        }
      }
    } catch (err) {
      console.error('Failed to load executive tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutiveTasks();
  }, []);

  const handleTaskSelect = (task: any) => {
    setSelectedTask(task);
    setChecklistItems(task.checklist || [
      { id: '1', title: 'Gather NAAC Criterion 3 documentation', completed: true },
      { id: '2', title: 'Verify faculty research publications', completed: true },
      { id: '3', title: 'Compile IQAC audit compliance deck', completed: false },
    ]);
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const commentObj = {
      id: Date.now().toString(),
      author: `${user?.firstName || 'HOD'} ${user?.lastName || ''}`,
      role: 'HOD',
      text: newComment,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      readReceipts: ['Principal', 'Academic Dean', 'Vice Principal']
    };
    setComments([...comments, commentObj]);
    setNewComment('');
    toast.success('Query comment posted with read receipts');
  };

  const handleToggleChecklist = (id: string) => {
    setChecklistItems(
      checklistItems.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const completedCount = checklistItems.filter((i) => i.completed).length;
  const progressPercent = checklistItems.length ? Math.round((completedCount / checklistItems.length) * 100) : 0;

  if (loading) {
    return <Loading text="Loading Executive & Leadership Workspace..." />;
  }

  return (
    <div className="space-y-6">
      {/* Executive Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 p-5 rounded-xl border border-amber-500/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <Award className="w-4 h-4" /> Executive Governance Workspace
          </div>
          <h2 className="text-xl font-bold text-white mt-1">Dean & Leadership Assigned Work</h2>
          <p className="text-xs text-slate-400 mt-0.5">Assigned by: Principal, Vice Principal, Academic Dean, IQAC Dean, Admission Dean</p>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="px-3 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg">
            SLA Compliance: 100%
          </span>
          <span className="px-3 py-1.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-lg">
            {tasks.length} Assigned Tasks
          </span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-slate-800/90 p-2 rounded-xl border border-slate-700/80 flex flex-wrap gap-1.5 overflow-x-auto text-xs font-semibold text-slate-300">
        {[
          { id: 'academic_dean_tasks', label: 'Academic Dean Tasks', icon: Layers },
          { id: 'dashboard', label: 'Executive Dashboard', icon: Briefcase },
          { id: 'workspace', label: 'Task Workspace & Query Panel', icon: Layers },
          { id: 'calendar', label: 'Executive Calendar', icon: Calendar },
          { id: 'analytics', label: 'Compliance & SLA Analytics', icon: FileSpreadsheet },
        ].map((item) => {
          const IconComponent = item.icon;
          const isActive = activeSubTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSubTab(item.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                isActive
                  ? 'bg-amber-600 text-white shadow-md font-bold'
                  : 'hover:bg-slate-700/70 hover:text-white text-slate-300'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* ACADEMIC DEAN TASKS */}
      {activeSubTab === 'academic_dean_tasks' && (
        <div className="bg-card text-foreground p-4 rounded-xl border shadow-xs">
          <HODAcademicTasks user={user} />
        </div>
      )}

      {/* EXECUTIVE DASHBOARD */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Executive Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs font-medium">
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-1">
              <span className="text-slate-400">Pending Tasks</span>
              <h3 className="text-2xl font-bold text-amber-400">3 Tasks</h3>
            </div>
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-1">
              <span className="text-slate-400">High Priority</span>
              <h3 className="text-2xl font-bold text-rose-400">2 Tasks</h3>
            </div>
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-1">
              <span className="text-slate-400">Overdue Tasks</span>
              <h3 className="text-2xl font-bold text-slate-400">0 Tasks</h3>
            </div>
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-1">
              <span className="text-slate-400">Completed Work</span>
              <h3 className="text-2xl font-bold text-emerald-400">12 Tasks</h3>
            </div>
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-1">
              <span className="text-slate-400">Unread Queries</span>
              <h3 className="text-2xl font-bold text-indigo-400">1 Message</h3>
            </div>
          </div>

          {/* Assigned Executive Tasks List */}
          <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Official Executive Assignments</h3>
            <div className="space-y-3 text-xs">
              {[
                {
                  id: 'task-1',
                  taskNumber: 'EXEC-NAAC-2026-09',
                  title: 'NAAC Criterion 3 Research & Extension Audit Documentation',
                  assignedBy: 'Academic Dean',
                  dueDate: '2026-08-15',
                  priority: 'HIGH',
                  status: 'In Progress',
                  viewed: 'Seen (Visited 10 mins ago)',
                  seenPercentage: '100% Viewed by Deans & HOD'
                },
                {
                  id: 'task-2',
                  taskNumber: 'EXEC-NBA-2026-14',
                  title: 'NBA Program Outcome (PO) Attainment Verification Deck',
                  assignedBy: 'IQAC Dean',
                  dueDate: '2026-08-20',
                  priority: 'URGENT',
                  status: 'Waiting Review',
                  viewed: 'Seen (Visited 1 hr ago)',
                  seenPercentage: '100% Viewed by Deans & HOD'
                },
                {
                  id: 'task-3',
                  taskNumber: 'EXEC-GOVT-2026-02',
                  title: 'Government Annual Institutional Compliance Survey Report',
                  assignedBy: 'Principal Office',
                  dueDate: '2026-08-28',
                  priority: 'MEDIUM',
                  status: 'Accepted',
                  viewed: 'Seen (Visited Yesterday)',
                  seenPercentage: '80% Viewed'
                }
              ].map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    handleTaskSelect(t);
                    setActiveSubTab('workspace');
                  }}
                  className="p-4 bg-slate-900/90 hover:bg-slate-900 rounded-xl border border-slate-700/70 hover:border-amber-500/50 transition-all cursor-pointer space-y-2"
                >
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <span className="text-amber-400 font-mono font-bold text-[11px]">{t.taskNumber}</span>
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Assigned By: {t.assignedBy}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {t.status}
                      </span>
                    </div>
                  </div>
                  <h4 className="font-bold text-white text-sm">{t.title}</h4>
                  <div className="flex flex-wrap justify-between items-center text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                    <span>Due Date: <strong className="text-white">{t.dueDate}</strong></span>
                    <span className="text-emerald-400 font-semibold">{t.viewed} · {t.seenPercentage}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TASK WORKSPACE & QUERY PANEL */}
      {activeSubTab === 'workspace' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Task Workspace Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-800 space-y-4 text-xs">
              {/* Task Header */}
              <div className="border-b border-slate-800 pb-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-amber-400 font-mono font-bold text-xs">
                    {selectedTask?.taskNumber || 'EXEC-NAAC-2026-09'}
                  </span>
                  <span className="px-2.5 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded text-[10px] font-bold">
                    HIGH PRIORITY
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white">
                  {selectedTask?.title || 'NAAC Criterion 3 Research & Extension Audit Documentation'}
                </h2>
                <div className="flex flex-wrap gap-4 text-slate-400 text-[11px] pt-1">
                  <span>Assigned By: <strong className="text-white">Academic Dean Office</strong></span>
                  <span>Due Date: <strong className="text-white">2026-08-15</strong></span>
                  <span>Department: <strong className="text-white">Computer Science & Engineering</strong></span>
                </div>
              </div>

              {/* Read Receipts & Viewing Tracking */}
              <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-700/60 space-y-1">
                <div className="flex justify-between text-[11px] text-slate-300">
                  <span className="font-bold flex items-center gap-1.5 text-emerald-400">
                    <Eye className="w-4 h-4" /> Task Read Status: 100% Viewed
                  </span>
                  <span>Last Opened: Today at 09:42 AM</span>
                </div>
                <p className="text-slate-400 text-[10px]">
                  Viewed by: Academic Dean (09:40 AM), Vice Principal (09:35 AM), HOD CSE (09:42 AM)
                </p>
              </div>

              {/* Task Instructions */}
              <div className="space-y-2">
                <h4 className="font-bold text-white text-xs uppercase">Task Description & Instructions</h4>
                <p className="text-slate-300 leading-relaxed bg-slate-900/60 p-3.5 rounded-lg border border-slate-800">
                  Compile all accredited research publication proof files, consultancy project invoices, and extension activities proof for NAAC Criterion 3 review. Submit final verified package by 15th August 2026.
                </p>
              </div>

              {/* Interactive Checklist & Progress Bar */}
              <div className="space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-white text-xs uppercase flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-amber-400" /> Executive Task Checklist
                  </h4>
                  <span className="text-amber-400 font-bold">{progressPercent}% Completed</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
                </div>
                <div className="space-y-2 pt-1">
                  {checklistItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleToggleChecklist(item.id)}
                      className="flex items-center gap-3 p-2 bg-slate-800/60 hover:bg-slate-800 rounded-lg cursor-pointer transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => {}}
                        className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                      />
                      <span className={`text-xs ${item.completed ? 'line-through text-slate-500' : 'text-slate-200 font-medium'}`}>
                        {item.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Attachments & Files */}
              <div className="space-y-3">
                <h4 className="font-bold text-white text-xs uppercase">Attached Official Documentation</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-700/70 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-400" />
                      <div>
                        <p className="font-bold text-white">NAAC_Criterion_3_Guideline.pdf</p>
                        <p className="text-[10px] text-slate-400">PDF · 2.4 MB</p>
                      </div>
                    </div>
                    <button className="p-1.5 text-slate-400 hover:text-white">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-700/70 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      <div>
                        <p className="font-bold text-white">Faculty_Publications_Template.xlsx</p>
                        <p className="text-[10px] text-slate-400">Excel · 850 KB</p>
                      </div>
                    </div>
                    <button className="p-1.5 text-slate-400 hover:text-white">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dedicated Discussion & Query Panel */}
          <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-800 flex flex-col justify-between space-y-4 text-xs">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
                <MessageSquare className="w-4 h-4 text-amber-400" /> Realtime Discussion Query Panel
              </h3>

              {/* Comments Stream */}
              <div className="space-y-3 mt-4 max-h-[420px] overflow-y-auto pr-1">
                <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-amber-400">Academic Dean</span>
                    <span className="text-slate-500">Yesterday at 04:15 PM</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">Please ensure all journal publications include impact factor details from SCOPUS/WoS.</p>
                  <span className="text-[9px] text-emerald-400 font-semibold block pt-1">Seen by HOD CSE</span>
                </div>

                {comments.map((c) => (
                  <div key={c.id} className="p-3 bg-indigo-950/40 rounded-lg border border-indigo-500/30 space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-indigo-300">{c.author} ({c.role})</span>
                      <span className="text-slate-500">{c.timestamp}</span>
                    </div>
                    <p className="text-slate-200 text-[11px]">{c.text}</p>
                    <span className="text-[9px] text-emerald-400 font-semibold block pt-1">Seen by Academic Dean, Vice Principal</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Query Form */}
            <form onSubmit={handlePostComment} className="space-y-2 pt-2 border-t border-slate-800">
              <textarea
                required
                rows={3}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Type query or update for Deans..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
              <div className="flex justify-between items-center">
                <div className="flex gap-2 text-slate-400">
                  <Paperclip className="w-4 h-4 cursor-pointer hover:text-white" />
                  <Smile className="w-4 h-4 cursor-pointer hover:text-white" />
                </div>
                <button type="submit" className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5" /> Post Query
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXECUTIVE CALENDAR */}
      {activeSubTab === 'calendar' && (
        <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-800 space-y-4 text-xs">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Executive Deadlines & Meeting Schedule</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-700 space-y-2">
              <span className="text-[10px] text-rose-400 font-bold uppercase">Critical Submission</span>
              <h4 className="font-bold text-white">NAAC Criterion 3 Final Submission</h4>
              <p className="text-slate-400 text-[11px]">Due Date: August 15, 2026</p>
            </div>
            <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-700 space-y-2">
              <span className="text-[10px] text-amber-400 font-bold uppercase">Committee Review</span>
              <h4 className="font-bold text-white">IQAC Quarterly Quality Review Meeting</h4>
              <p className="text-slate-400 text-[11px]">Date: August 20, 2026 | 02:00 PM</p>
            </div>
            <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-700 space-y-2">
              <span className="text-[10px] text-indigo-400 font-bold uppercase">Government Audit</span>
              <h4 className="font-bold text-white">State Higher Education Inspection</h4>
              <p className="text-slate-400 text-[11px]">Date: August 28, 2026</p>
            </div>
          </div>
        </div>
      )}

      {/* ANALYTICS & SLA COMPLIANCE */}
      {activeSubTab === 'analytics' && (
        <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-800 space-y-4 text-xs">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Executive Performance & Compliance Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-700 space-y-1">
              <span className="text-slate-400 text-[11px]">Avg Task Completion Time</span>
              <h3 className="text-xl font-bold text-emerald-400">2.4 Days</h3>
            </div>
            <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-700 space-y-1">
              <span className="text-slate-400 text-[11px]">SLA On-Time Rate</span>
              <h3 className="text-xl font-bold text-indigo-400">100%</h3>
            </div>
            <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-700 space-y-1">
              <span className="text-slate-400 text-[11px]">Department Audit Score</span>
              <h3 className="text-xl font-bold text-amber-400">96.8 / 100</h3>
            </div>
            <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-700 space-y-1">
              <span className="text-slate-400 text-[11px]">Governance Rating</span>
              <h3 className="text-xl font-bold text-emerald-400">Grade A+</h3>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
