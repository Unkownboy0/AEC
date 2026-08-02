import React, { useState, useEffect } from 'react';
import {
  Layers, Clock, AlertCircle, CheckCircle, FileText, Download,
  Send, RefreshCw, Eye, Upload, MessageSquare, ArrowLeft, Plus, X
} from 'lucide-react';
import { toast } from '../ui/Toast';
import { Loading } from '../ui/Loading';
import api from '../../lib/axios';
import { TaskQueryThread } from '../academic-dean/TaskQueryThread';
import { TaskTimeline } from '../academic-dean/TaskTimeline';

interface HODAcademicTasksProps {
  user: any;
}

export const HODAcademicTasks: React.FC<HODAcademicTasksProps> = ({ user }) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Submission Form State
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [checklist, setChecklist] = useState<Array<{ id: string; title: string; isCompleted: boolean }>>([]);

  useEffect(() => {
    fetchHodTasks();
  }, [statusFilter]);

  const fetchHodTasks = async () => {
    setIsLoading(true);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const res = await api.get(`/hod/academic-tasks${params}`);
      setTasks(res.data.data || []);
    } catch (err: any) {
      toast.error('Failed to load assigned Academic Dean tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenTask = async (assignmentId: string) => {
    setIsLoading(true);
    try {
      const res = await api.get(`/hod/academic-tasks/${assignmentId}`);
      const data = res.data.data;
      setSelectedTask(data);

      // Parse requirements checklist
      let reqs: any = {};
      if (data?.task?.submissionRequirements) {
        try {
          reqs = JSON.parse(data.task.submissionRequirements);
        } catch (_) {}
      }

      if (reqs.checklistItems) {
        setChecklist(reqs.checklistItems.map((title: string, idx: number) => ({ id: String(idx), title, isCompleted: false })));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to open task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTask = async () => {
    if (!selectedTask) return;
    try {
      await api.post(`/hod/academic-tasks/${selectedTask.id}/start`);
      toast.success('Task marked in-progress');
      handleOpenTask(selectedTask.id);
    } catch (err: any) {
      toast.error('Failed to start task');
    }
  };

  const handleSubmitWork = async () => {
    if (!selectedTask) return;
    setIsSubmitting(true);
    try {
      await api.post(`/hod/academic-tasks/${selectedTask.id}/submit`, {
        notes: submissionNotes,
        checklistData: checklist,
      });

      toast.success('Task submitted directly to Academic Dean!');
      handleOpenTask(selectedTask.id);
      fetchHodTasks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (selectedTask) {
    return (
      <div className="space-y-4 animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 bg-card p-4 rounded-xl shadow-xs">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedTask(null)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <span className="font-mono text-xs font-bold text-primary">{selectedTask.assignmentCode}</span>
              <h2 className="text-base font-extrabold text-foreground">{selectedTask.task?.title}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedTask.status === 'ASSIGNED' || selectedTask.status === 'VIEWED' ? (
              <button
                onClick={handleStartTask}
                className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl shadow-xs"
              >
                Mark In Progress
              </button>
            ) : null}
          </div>
        </div>

        {/* Workspace Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7 space-y-4">
            {/* Overview Card */}
            <div className="bg-card border rounded-xl p-4 shadow-xs space-y-3 text-xs">
              <h3 className="font-bold border-b pb-2 text-foreground">Task Overview & Instructions</h3>
              <p className="text-muted-foreground leading-relaxed">
                {selectedTask.task?.instructions || selectedTask.task?.description || 'No instructions provided.'}
              </p>

              {/* Reference Files */}
              <div className="border-t pt-3 space-y-2">
                <h4 className="font-bold text-foreground">Academic Dean Reference Files</h4>
                {selectedTask.task?.files?.map((f: any) => (
                  <div key={f.id} className="flex items-center justify-between p-2.5 bg-muted/40 rounded-lg">
                    <span className="font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" /> {f.originalFileName}
                    </span>
                    <a
                      href={`/api/hod/academic-task-files/${f.id}/download`}
                      download
                      className="px-3 py-1 bg-primary/10 text-primary rounded-lg font-bold hover:bg-primary/20"
                    >
                      Download
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Submission Form */}
            <div className="bg-card border rounded-xl p-4 shadow-xs space-y-3 text-xs">
              <h3 className="font-bold border-b pb-2 text-foreground">HOD Submission Panel</h3>

              <div className="space-y-1">
                <label className="font-bold">Submission Notes / Summary Remarks</label>
                <textarea
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="Enter summary notes for Academic Dean..."
                  className="w-full text-xs bg-background border rounded-lg p-3 min-h-[90px] outline-none"
                />
              </div>

              {/* Checklist */}
              {checklist.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <label className="font-bold">Verification Checklist</label>
                  {checklist.map((item, idx) => (
                    <label key={item.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.isCompleted}
                        onChange={(e) => {
                          const updated = [...checklist];
                          updated[idx].isCompleted = e.target.checked;
                          setChecklist(updated);
                        }}
                      />
                      <span>{item.title}</span>
                    </label>
                  ))}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  disabled={isSubmitting}
                  onClick={handleSubmitWork}
                  className="px-5 py-2 bg-primary text-primary-foreground text-xs font-extrabold rounded-xl shadow-xs hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="h-4 w-4" /> {isSubmitting ? 'Submitting...' : 'Submit to Academic Dean'}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="bg-card border rounded-xl p-4 shadow-xs">
              <TaskQueryThread
                taskId={selectedTask.taskId}
                assignmentId={selectedTask.id}
                queries={selectedTask.queries || []}
                currentUserRole="HOD"
                onQueryPosted={() => handleOpenTask(selectedTask.id)}
              />
            </div>
            <div className="bg-card border rounded-xl p-4 shadow-xs">
              <TaskTimeline timeline={selectedTask.timeline || []} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" /> Academic Dean Tasks
          </h2>
          <p className="text-xs text-muted-foreground">Department task workspace assigned directly by Academic Dean</p>
        </div>

        <button onClick={fetchHodTasks} className="p-2 border rounded-xl text-xs font-bold flex items-center gap-1">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* Task Cards List */}
      {isLoading ? (
        <Loading text="Loading assigned academic tasks..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {tasks.length === 0 ? (
            <div className="col-span-full text-center py-12 border border-dashed rounded-2xl text-xs text-muted-foreground">
              No academic tasks currently assigned by Academic Dean.
            </div>
          ) : (
            tasks.map((t) => (
              <div
                key={t.id}
                onClick={() => handleOpenTask(t.id)}
                className="border bg-card p-4 rounded-xl shadow-2xs hover:shadow-md transition-all cursor-pointer space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-primary">{t.assignmentCode}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${
                      t.computedStatus === 'COMPLETED' ? 'bg-green-500/10 text-green-600' : 'bg-blue-500/10 text-blue-600'
                    }`}>
                      {t.computedStatus}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-foreground line-clamp-2">{t.task?.title}</h3>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t">
                  <span>Due: <strong className="text-red-600 font-mono">{new Date(t.currentDueAt).toLocaleDateString()}</strong></span>
                  <span className="text-primary font-bold">Open Task →</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
