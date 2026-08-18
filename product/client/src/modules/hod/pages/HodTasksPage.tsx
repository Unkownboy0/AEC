import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, Plus, Clock, RefreshCw, Send, AlertCircle, HelpCircle, Layers, Calendar, User, Paperclip, X, FileText, Users, ChevronDown } from 'lucide-react';
import { DataTable, Column } from '../../../design-system/components/DataTable';
import { StatusBadge } from '../../../design-system/components/StatusBadge';
import { ErrorState } from '../../../design-system/components/ErrorState';
import { Skeleton } from '../../../design-system/components/Skeleton';
import { Modal } from '../../../design-system/components/Modal';
import { pageVariants } from '../../../design-system/tokens/motion';
import api from '../../../lib/axios';
import { toast } from '../../../components/ui/Toast';
import { VoiceNoteRecorder } from '../../../components/ui/VoiceNoteRecorder';

export const HodTasksPage: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'received' | 'assigned'>('received');

  // Tasks HOD assigned to faculty
  const [assignedTasks, setAssignedTasks] = useState<any[]>([]);
  const [isLoadingAssigned, setIsLoadingAssigned] = useState(false);

  // Department faculty for the assignment modal
  const [deptFaculty, setDeptFaculty] = useState<any[]>([]);

  // Create task modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', description: '', priority: 'MEDIUM', dueAt: '', assigneeUserIds: [] as string[] });
  const [isCreating, setIsCreating] = useState(false);

  // Action modal
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [modalType, setModalType] = useState<'QUERY' | 'SUBMIT' | null>(null);
  const [inputNote, setInputNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // File Attachment State
  const [attachedFile, setAttachedFile] = useState<{ url: string; name: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTasks = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    setError(null);
    try {
      // Query all 3 task endpoints in parallel
      const [hodRes, academicDeanRes, enterpriseRes] = await Promise.allSettled([
        api.get('/hod/tasks'),
        api.get('/hod/academic-tasks'),
        api.get('/tasks'),
      ]);

      const combinedTasks: any[] = [];
      const seenIds = new Set<string>();
      let summaryData: any = null;

      // 1. Process standard HOD tasks
      if (hodRes.status === 'fulfilled' && (hodRes.value.data?.success || hodRes.value.data?.status === 'success')) {
        summaryData = hodRes.value.data.summary || null;
        const queue = hodRes.value.data.queue || hodRes.value.data.data?.queue || hodRes.value.data.data || [];
        if (Array.isArray(queue)) {
          queue.forEach((t: any) => {
            if (!seenIds.has(t.id)) {
              seenIds.add(t.id);
              combinedTasks.push({
                id: t.id,
                rawId: t.id,
                isAcademicDeanTask: false,
                isEnterpriseTask: false,
                title: t.title,
                description: t.description || t.title,
                creatorRole: t.creator?.role?.name || t.creatorRole || 'HOD Task',
                creatorName: t.creator ? `${t.creator.firstName} ${t.creator.lastName}` : 'Executive Authority',
                priority: t.priority || 'MEDIUM',
                status: t.status || 'ASSIGNED',
                dueDate: t.dueDate,
                createdAt: t.createdAt,
              });
            }
          });
        }
      }

      // 2. Process Academic Dean tasks
      if (academicDeanRes.status === 'fulfilled' && academicDeanRes.value.data?.status === 'success') {
        const academicAssignments = academicDeanRes.value.data.data || [];
        if (Array.isArray(academicAssignments)) {
          academicAssignments.forEach((a: any) => {
            const parentTask = a.task || a;
            const taskKey = `academic-${a.id}`;
            if (!seenIds.has(taskKey) && !seenIds.has(a.id)) {
              seenIds.add(taskKey);
              combinedTasks.push({
                id: taskKey,
                assignmentId: a.id,
                taskId: parentTask.id || a.taskId,
                isAcademicDeanTask: true,
                isEnterpriseTask: false,
                title: parentTask.title || 'Academic Dean Directive',
                description: parentTask.description || parentTask.title,
                creatorRole: 'Academic Dean',
                creatorName: parentTask.createdByUser ? `${parentTask.createdByUser.firstName} ${parentTask.createdByUser.lastName}` : 'Academic Dean',
                priority: parentTask.priority || 'HIGH',
                status: a.status || parentTask.status || 'PUBLISHED',
                dueDate: a.currentDueAt || parentTask.dueDate,
                createdAt: a.createdAt || parentTask.createdAt,
              });
            }
          });
        }
      }

      // 3. Process Enterprise VP / Dean / Principal tasks
      if (enterpriseRes.status === 'fulfilled' && (enterpriseRes.value.data?.status === 'success' || enterpriseRes.value.data?.success)) {
        const entTasks = enterpriseRes.value.data.data?.tasks || enterpriseRes.value.data.data || enterpriseRes.value.data.tasks || [];
        if (Array.isArray(entTasks)) {
          entTasks.forEach((t: any) => {
            if (!seenIds.has(t.id)) {
              seenIds.add(t.id);
              combinedTasks.push({
                id: t.id,
                rawId: t.id,
                isAcademicDeanTask: false,
                isEnterpriseTask: true,
                title: t.title,
                description: t.description || t.title,
                creatorRole: t.createdBy?.role?.name || 'Executive Directive',
                creatorName: t.createdBy ? `${t.createdBy.firstName} ${t.createdBy.lastName}` : 'Executive Officer',
                priority: t.priority || 'HIGH',
                status: t.status || 'ASSIGNED',
                dueDate: t.dueDate,
                createdAt: t.createdAt,
              });
            }
          });
        }
      }

      setSummary(summaryData);
      setTasks(combinedTasks);
    } catch (err: any) {
      setError(err.message || 'Failed to load department tasks');
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, []);

  // Fetch tasks assigned BY this HOD to faculty
  const fetchAssignedTasks = useCallback(async () => {
    setIsLoadingAssigned(true);
    try {
      const res = await api.get('/hod/tasks/assigned-by-me');
      setAssignedTasks(res.data?.data || []);
    } catch {
      // non-fatal
    } finally {
      setIsLoadingAssigned(false);
    }
  }, []);

  // Fetch department faculty for create modal
  const fetchDeptFaculty = useCallback(async () => {
    try {
      const res = await api.get('/hod/faculty');
      setDeptFaculty(res.data?.data || []);
    } catch {}
  }, []);

  // Initial load + Realtime polling interval (every 6s) + Window SSE listener
  useEffect(() => {
    fetchTasks(false);
    fetchAssignedTasks();
    fetchDeptFaculty();

    const interval = setInterval(() => {
      fetchTasks(true);
    }, 6000);

    const handleRealtime = () => {
      fetchTasks(true);
    };

    window.addEventListener('realtime:any', handleRealtime);
    window.addEventListener('realtime:TASK_UPDATED', handleRealtime);
    window.addEventListener('realtime:TASK_CREATED', handleRealtime);

    return () => {
      clearInterval(interval);
      window.removeEventListener('realtime:any', handleRealtime);
      window.removeEventListener('realtime:TASK_UPDATED', handleRealtime);
      window.removeEventListener('realtime:TASK_CREATED', handleRealtime);
    };
  }, [fetchTasks, fetchAssignedTasks, fetchDeptFaculty]);

  // Handle creating a task and assigning to faculty
  const handleCreateTask = async () => {
    if (!createForm.title.trim()) { toast.error('Task title is required.'); return; }
    setIsCreating(true);
    try {
      await api.post('/hod/tasks', {
        ...createForm,
        assigneeUserIds: createForm.assigneeUserIds,
      });
      toast.success('Task assigned to faculty successfully.');
      setShowCreateModal(false);
      setCreateForm({ title: '', description: '', priority: 'MEDIUM', dueAt: '', assigneeUserIds: [] });
      fetchAssignedTasks();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create task.');
    } finally {
      setIsCreating(false);
    }
  };

  // Base64 File Upload implementation complying with backend /api/files/upload JSON contract
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const result = reader.result as string;
          const base64Content = result.includes(',') ? result.split(',')[1] : result;

          const res = await api.post('/files/upload', {
            name: file.name,
            mimeType: file.type || 'application/pdf',
            folder: '/tasks',
            base64: base64Content,
          });

          const fileUrl = res.data?.data?.path || res.data?.data?.url || res.data?.url || `/uploads/${file.name}`;
          setAttachedFile({ url: fileUrl, name: file.name });
          toast.success(`Attachment "${file.name}" uploaded successfully`);
        } catch (err: any) {
          toast.error(err.response?.data?.message || err.response?.data?.error || 'File upload failed. Please try again.');
        } finally {
          setIsUploading(false);
        }
      };

      reader.onerror = () => {
        toast.error('Failed to read selected file');
        setIsUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      toast.error('File upload error');
      setIsUploading(false);
    }
  };

  const handleAcknowledge = async (item: any) => {
    try {
      if (item.isAcademicDeanTask) {
        await api.post(`/hod/academic-tasks/${item.assignmentId}/start`);
      } else if (item.isEnterpriseTask) {
        await api.patch(`/tasks/${item.rawId}/status`, { status: 'IN_PROGRESS' });
      } else {
        await api.post(`/hod/tasks/${item.id}/acknowledge`);
      }
      toast.success('Task acknowledged');
      fetchTasks(true);
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Action failed');
    }
  };

  const handleStart = async (item: any) => {
    try {
      if (item.isAcademicDeanTask) {
        await api.post(`/hod/academic-tasks/${item.assignmentId}/start`);
      } else if (item.isEnterpriseTask) {
        await api.patch(`/tasks/${item.rawId}/status`, { status: 'IN_PROGRESS' });
      } else {
        await api.post(`/hod/tasks/${item.id}/start`);
      }
      toast.success('Task marked in-progress');
      fetchTasks(true);
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Start task failed');
    }
  };

  const handleModalSubmit = async () => {
    if (!selectedTask || !modalType) return;
    setIsSubmitting(true);
    try {
      const fullNote = attachedFile
        ? `${inputNote}\n\n[Attached File: ${attachedFile.name}](${attachedFile.url})`
        : inputNote;

      if (selectedTask.isAcademicDeanTask) {
        if (modalType === 'QUERY') {
          await api.post(`/hod/academic-tasks/${selectedTask.assignmentId}/queries`, {
            message: fullNote,
            taskId: selectedTask.taskId || selectedTask.assignmentId,
          });
          toast.success('Query raised to Academic Dean');
        } else if (modalType === 'SUBMIT') {
          await api.post(`/hod/academic-tasks/${selectedTask.assignmentId}/submit`, {
            notes: fullNote,
            submissionUrl: attachedFile?.url || undefined,
          });
          toast.success('Academic task submitted to Academic Dean');
        }
      } else if (selectedTask.isEnterpriseTask) {
        if (modalType === 'QUERY') {
          await api.post(`/tasks/${selectedTask.rawId}/comments`, { content: `[QUERY Doubt]: ${fullNote}` });
          toast.success('Query comment sent to task creator');
        } else if (modalType === 'SUBMIT') {
          await api.patch(`/tasks/${selectedTask.rawId}/status`, { status: 'SUBMITTED', remarks: fullNote });
          toast.success('Task work submitted successfully');
        }
      } else {
        if (modalType === 'QUERY') {
          await api.post(`/hod/tasks/${selectedTask.id}/query`, {
            queryText: fullNote,
          });
          toast.success('Query raised to task creator');
        } else if (modalType === 'SUBMIT') {
          await api.post(`/hod/tasks/${selectedTask.id}/submit`, {
            submissionNotes: fullNote,
            submissionUrl: attachedFile?.url || undefined,
          });
          toast.success('Work submitted successfully');
        }
      }
      setSelectedTask(null);
      setModalType(null);
      setInputNote('');
      setAttachedFile(null);
      fetchTasks(true);
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderActionButtons = (item: any) => (
    <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
      {['ASSIGNED', 'DELIVERED', 'VIEWED', 'PUBLISHED', 'PENDING', 'NOT_STARTED', 'NOT_SEEN'].includes(item.status) && (
        <button
          onClick={() => handleAcknowledge(item)}
          className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-2xs cursor-pointer"
        >
          Acknowledge
        </button>
      )}
      {item.status === 'ACKNOWLEDGED' && (
        <button
          onClick={() => handleStart(item)}
          className="px-3 py-1.5 text-xs font-bold rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-2xs cursor-pointer"
        >
          Start Task
        </button>
      )}
      {['IN_PROGRESS', 'ACKNOWLEDGED', 'UNDER_REVIEW', 'PUBLISHED', 'QUERY_RAISED', 'NOT_SEEN'].includes(item.status) && (
        <>
          <button
            onClick={() => { setSelectedTask(item); setModalType('QUERY'); setAttachedFile(null); }}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-2xs cursor-pointer"
          >
            Query
          </button>
          <button
            onClick={() => { setSelectedTask(item); setModalType('SUBMIT'); setAttachedFile(null); }}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-2xs cursor-pointer"
          >
            Submit Work
          </button>
        </>
      )}
    </div>
  );

  const columns: Column<any>[] = [
    {
      key: 'title',
      header: 'Task Details',
      sortable: true,
      render: (item) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-foreground block text-xs md:text-sm">{item.title}</span>
            {item.isAcademicDeanTask && (
              <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                Dean Task
              </span>
            )}
            {item.isEnterpriseTask && (
              <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                Executive Task
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground line-clamp-2 max-w-md">{item.description}</p>
        </div>
      ),
    },
    {
      key: 'creator',
      header: 'Assigned By',
      render: (item) => (
        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
          {item.creatorRole || 'Executive Authority'}
        </span>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      render: (item) => (
        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
          item.priority === 'HIGH' || item.priority === 'URGENT'
            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
        }`}>
          {item.priority || 'MEDIUM'}
        </span>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      sortable: true,
      render: (item) => (
        <span className="font-mono text-xs text-muted-foreground flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'No Deadline'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status || 'ASSIGNED'} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => renderActionButtons(item),
    },
  ];

  const renderMobileTaskCard = (item: any) => (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-extrabold text-foreground text-sm">{item.title}</span>
            {item.isAcademicDeanTask && (
              <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-full bg-purple-500/10 text-purple-600 border border-purple-500/20">
                Dean Task
              </span>
            )}
            {item.isEnterpriseTask && (
              <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-full bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                Executive Task
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{item.description}</p>
        </div>
        <StatusBadge status={item.status || 'ASSIGNED'} size="sm" />
      </div>

      <div className="flex flex-wrap items-center justify-between text-xs pt-1 border-t border-border/60 text-muted-foreground gap-2">
        <span className="flex items-center gap-1">
          <User className="h-3 w-3 text-primary" />
          {item.creatorRole || 'Executive Authority'}
        </span>
        <span className="flex items-center gap-1 font-mono text-[11px]">
          <Calendar className="h-3 w-3" />
          Due: {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'N/A'}
        </span>
      </div>

      <div className="pt-2">{renderActionButtons(item)}</div>
    </div>
  );

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-5 rounded-2xl shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            HOD Task Desk
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage tasks assigned to you and assign tasks to your faculty.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => { setShowCreateModal(true); }}
            className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" /> Assign to Faculty
          </button>
          <button
            onClick={() => fetchTasks(false)}
            className="px-3 py-2 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted/50 border border-border w-fit">
        <button
          onClick={() => setActiveTab('received')}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'received' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Assigned to Me ({tasks.length})
        </button>
        <button
          onClick={() => { setActiveTab('assigned'); fetchAssignedTasks(); }}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'assigned' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Assigned by Me ({assignedTasks.length})
        </button>
      </div>

      {/* Summary Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-card border border-border rounded-xl shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Assigned Tasks</span>
          <span className="text-xl md:text-2xl font-extrabold text-primary block mt-0.5">{tasks.length}</span>
        </div>
        <div className="p-3.5 bg-card border border-border rounded-xl shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Executive Directives</span>
          <span className="text-xl md:text-2xl font-extrabold text-purple-500 block mt-0.5">
            {tasks.filter(t => t.isAcademicDeanTask || t.isEnterpriseTask).length}
          </span>
        </div>
        <div className="p-3.5 bg-card border border-border rounded-xl shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">In Progress</span>
          <span className="text-xl md:text-2xl font-extrabold text-amber-500 block mt-0.5">{tasks.filter(t => t.status === 'IN_PROGRESS').length}</span>
        </div>
        <div className="p-3.5 bg-card border border-border rounded-xl shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Submitted</span>
          <span className="text-xl md:text-2xl font-extrabold text-emerald-500 block mt-0.5">{tasks.filter(t => t.status === 'SUBMITTED' || t.status === 'COMPLETED').length}</span>
        </div>
      </div>

      {error ? (
        <ErrorState title="Unable to load tasks" message={error} onRetry={() => fetchTasks(false)} />
      ) : activeTab === 'received' ? (
        <DataTable
          columns={columns}
          data={tasks}
          isLoading={isLoading}
          keyExtractor={(item) => item.id}
          mobileCardRender={renderMobileTaskCard}
          emptyTitle="No assigned tasks found"
          emptyDescription="Tasks assigned by VP, Academic Dean, Admission Dean, and Principal will appear here automatically."
        />
      ) : (
        /* Assigned by HOD tab */
        <div className="space-y-3">
          {isLoadingAssigned ? (
            <div className="p-6 text-center text-muted-foreground text-sm">Loading...</div>
          ) : assignedTasks.length === 0 ? (
            <div className="p-10 text-center">
              <Users className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30"/>
              <p className="text-sm font-medium text-muted-foreground">No tasks assigned to faculty yet</p>
              <p className="text-xs text-muted-foreground mt-1">Use "Assign to Faculty" above to create faculty tasks</p>
            </div>
          ) : assignedTasks.map((t: any) => (
            <div key={t.id} className="bg-card border border-border rounded-xl p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm text-foreground">{t.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                </div>
                <StatusBadge status={t.status || 'ASSIGNED'} size="sm" />
              </div>
              <div className="flex flex-wrap gap-1.5 text-xs">
                <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                  Priority: {t.priority}
                </span>
                {t.dueDate && (
                  <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border flex items-center gap-1">
                    <Calendar className="w-3 h-3"/> Due: {new Date(t.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
              {t.assignees && t.assignees.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-semibold">Assigned to:</span>{' '}
                  {t.assignees.map((a: any) => `${a.assignee?.firstName || ''} ${a.assignee?.lastName || ''}`.trim()).join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Query / Submit Modal with Base64 File Attachment */}
      <Modal
        isOpen={!!selectedTask && !!modalType}
        onClose={() => { setSelectedTask(null); setModalType(null); setAttachedFile(null); }}
        title={modalType === 'QUERY' ? 'Raise Query to Task Creator' : 'Submit Task Completion Work'}
        subtitle={selectedTask?.title}
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <textarea
            rows={4}
            className="w-full border border-border rounded-xl p-3 bg-background text-foreground outline-none resize-none focus:ring-2 focus:ring-primary/20"
            placeholder={modalType === 'QUERY' ? 'Describe your question or blocker for the Executive Authority...' : 'Provide submission notes or work description...'}
            value={inputNote}
            onChange={(e) => setInputNote(e.target.value)}
          />

          {/* File & Voice Note Attachment Area */}
          <div className="space-y-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />

            <div className="flex flex-wrap items-center gap-2">
              {attachedFile ? (
                <div className="flex items-center justify-between p-2.5 bg-primary/10 rounded-xl border border-primary/20 text-xs flex-1">
                  <span className="flex items-center gap-2 font-semibold text-primary">
                    <FileText className="h-4 w-4" />
                    {attachedFile.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAttachedFile(null)}
                    className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-muted/40 hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer"
                >
                  <Paperclip className="h-3.5 w-3.5 text-primary" />
                  {isUploading ? 'Uploading Attachment...' : 'Add Attachment File'}
                </button>
              )}
            </div>

            {/* Mobile / Web Native Voice Note Attachment */}
            <VoiceNoteRecorder
              onRecordingComplete={(rec) => {
                toast.success(`Voice note (${Math.round(rec.durationMs / 1000)}s) attached to task note.`);
                setInputNote((prev) => `${prev ? prev + '\n' : ''}[Voice Note attached: ${Math.round(rec.durationMs / 1000)}s]`);
              }}
              label="Attach Voice Note / Audio Explanation"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => { setSelectedTask(null); setModalType(null); setAttachedFile(null); }}
              className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleModalSubmit}
              disabled={isSubmitting || (!inputNote.trim() && !attachedFile)}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50 shadow-xs hover:bg-primary/90 cursor-pointer"
            >
              {isSubmitting ? 'Sending...' : 'Submit'}
            </button>
          </div>
        </div>
      </Modal>
      {/* Create Task Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setCreateForm({ title: '', description: '', priority: 'MEDIUM', dueAt: '', assigneeUserIds: [] }); }}
        title="Assign Task to Faculty"
        subtitle="Create and assign a task to one or more faculty members"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Task Title *</label>
            <input
              type="text"
              value={createForm.title}
              onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Submit attendance report for week 3"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
            <textarea
              rows={3}
              value={createForm.description}
              onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Task details and instructions for faculty..."
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Priority</label>
              <div className="relative">
                <select
                  value={createForm.priority}
                  onChange={e => setCreateForm(f => ({ ...f, priority: e.target.value }))}
                  className="w-full appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {['LOW','MEDIUM','HIGH','URGENT'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-3 w-4 h-4 text-muted-foreground pointer-events-none"/>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Due Date</label>
              <input
                type="date"
                value={createForm.dueAt}
                onChange={e => setCreateForm(f => ({ ...f, dueAt: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assign to Faculty (multi-select)</label>
            <div className="border border-border rounded-xl p-2 bg-background max-h-40 overflow-y-auto space-y-1">
              {deptFaculty.length === 0 ? (
                <p className="text-xs text-muted-foreground p-2">No department faculty loaded</p>
              ) : deptFaculty.map((f: any) => {
                const checked = createForm.assigneeUserIds.includes(f.userId || f.id);
                const assigneeId = f.userId || f.id;
                return (
                  <label key={f.id} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${checked ? 'bg-primary/10' : 'hover:bg-muted'}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => setCreateForm(prev => ({
                        ...prev,
                        assigneeUserIds: checked
                          ? prev.assigneeUserIds.filter(id => id !== assigneeId)
                          : [...prev.assigneeUserIds, assigneeId],
                      }))}
                      className="rounded border-border"
                    />
                    <span className="text-sm text-foreground">{f.firstName} {f.lastName}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{f.designation}</span>
                  </label>
                );
              })}
            </div>
            {createForm.assigneeUserIds.length > 0 && (
              <p className="text-xs text-primary font-medium">{createForm.assigneeUserIds.length} faculty member(s) selected</p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted">Cancel</button>
            <button
              type="button"
              onClick={handleCreateTask}
              disabled={isCreating || !createForm.title.trim()}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50 shadow-xs hover:bg-primary/90 cursor-pointer flex items-center gap-1.5"
            >
              {isCreating ? <RefreshCw className="w-3.5 h-3.5 animate-spin"/> : <Send className="w-3.5 h-3.5"/>}
              {isCreating ? 'Assigning...' : 'Assign Task'}
            </button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};
