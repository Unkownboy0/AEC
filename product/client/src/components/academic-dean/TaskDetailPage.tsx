import { useState, useEffect } from 'react';
import {
  ArrowLeft, CheckCircle, AlertCircle, Clock, FileText,
  MessageSquare, Download, RefreshCw, Send, ShieldAlert,
  Building, User, ChevronRight, CornerDownRight, Plus, X, Eye, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { toast } from '../ui/Toast';
import { Loading } from '../ui/Loading';
import api from '../../lib/axios';
import { TaskQueryThread } from './TaskQueryThread';
import { TaskTimeline } from './TaskTimeline';

interface TaskDetailPageProps {
  taskId: string;
  onBack: () => void;
}

export const TaskDetailPage: React.FC<TaskDetailPageProps> = ({ taskId, onBack }) => {
  const [task, setTask] = useState<any | null>(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SUBMISSION' | 'QUERIES' | 'FILES' | 'TIMELINE'>('OVERVIEW');
  const [reviewAction, setReviewAction] = useState<string | null>(null);
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTaskDetails();
  }, [taskId]);

  const fetchTaskDetails = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/academic-dean/tasks/${taskId}`);
      const data = res.data.data;
      setTask(data);
      if (data?.assignments?.length > 0 && !selectedAssignmentId) {
        setSelectedAssignmentId(data.assignments[0].id);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch task details');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedAssignment = task?.assignments?.find((a: any) => a.id === selectedAssignmentId) || task?.assignments?.[0];

  const handleReviewAction = async () => {
    if (!reviewAction || !selectedAssignmentId) return;
    if (!reviewRemarks.trim() && reviewAction !== 'APPROVE') {
      toast.error('Review remarks are required when requesting correction or returning task');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/academic-dean/task-assignments/${selectedAssignmentId}/review`, {
        action: reviewAction,
        remarks: reviewRemarks.trim() || 'Approved by Academic Dean',
      });

      toast.success(`Task submission updated: ${reviewAction}`);
      setReviewAction(null);
      setReviewRemarks('');
      fetchTaskDetails();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <Loading text="Loading task workspace detail..." />;

  if (!task) return null;

  const totalQueries = task.assignments?.reduce((acc: number, a: any) => acc + (a.queries?.length || 0), 0) || 0;

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Navigation Header */}
      <div className="flex items-center justify-between border-b pb-3 bg-card p-4 rounded-xl shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                {task.taskCode}
              </span>
              <h2 className="text-base font-extrabold text-foreground">{task.title}</h2>
              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-extrabold ${
                task.computedStatus === 'COMPLETED'
                  ? 'bg-green-500/10 text-green-600'
                  : task.computedStatus === 'OVERDUE'
                  ? 'bg-red-500/10 text-red-600'
                  : 'bg-blue-500/10 text-blue-600'
              }`}>
                {task.computedStatus}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Category: <span className="font-semibold text-foreground">{task.category}</span> • Priority:{' '}
              <span className="font-semibold text-foreground">{task.priority}</span> • Total HOD Queries:{' '}
              <span className="font-bold text-amber-600">{totalQueries}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTaskDetails}
            className="p-2 rounded-lg border hover:bg-muted text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh Telemetry
          </button>
        </div>
      </div>

      {/* Main Split Pane Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Department Assignments List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-card border rounded-xl p-3 shadow-xs space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Department Recipient HODs ({task.assignments?.length || 0})</span>
              <span className="text-primary font-mono">{task.progressPercent || 0}% Done</span>
            </h3>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {task.assignments?.map((a: any) => {
                const queryCount = a.queries?.length || 0;
                const isViewed = !!a.viewedAt || a.status === 'VIEWED' || a.status === 'IN_PROGRESS' || a.status === 'ACKNOWLEDGED' || a.status === 'SUBMITTED' || a.status === 'COMPLETED';

                return (
                  <div
                    key={a.id}
                    onClick={() => setSelectedAssignmentId(a.id)}
                    className={`p-3 border rounded-xl cursor-pointer transition-all ${
                      selectedAssignmentId === a.id
                        ? 'border-primary bg-primary/5 shadow-xs'
                        : 'bg-card hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5 text-primary" /> {a.department?.code} - {a.department?.name}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ${
                        a.status === 'COMPLETED'
                          ? 'bg-green-500/10 text-green-600'
                          : a.status === 'SUBMITTED'
                          ? 'bg-blue-500/10 text-blue-600'
                          : a.status === 'QUERY_RAISED'
                          ? 'bg-amber-500/10 text-amber-600'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {a.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-muted-foreground mt-1.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3 text-primary" /> HOD: {a.assignedHod?.firstName} {a.assignedHod?.lastName}
                        </span>
                        {queryCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-600 font-extrabold text-[10px] flex items-center gap-0.5">
                            <MessageSquare className="h-3 w-3" /> {queryCount} Query
                          </span>
                        )}
                      </div>

                      {/* Explicit Who-Viewed Telemetry */}
                      <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px]">
                        {isViewed ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            Viewed {a.viewedAt ? new Date(a.viewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'by HOD'}
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Unread by HOD
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Selected Department Assignment Details (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedAssignment ? (
            <div className="bg-card border rounded-xl p-4 shadow-xs space-y-4">
              {/* Assignment Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-3">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Building className="h-4 w-4 text-primary" /> {selectedAssignment.department?.name} (HOD:{' '}
                    {selectedAssignment.assignedHod?.firstName} {selectedAssignment.assignedHod?.lastName})
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span>Code: {selectedAssignment.assignmentCode}</span>
                    <span>•</span>
                    {selectedAssignment.viewedAt ? (
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" /> Viewed by HOD on {new Date(selectedAssignment.viewedAt).toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-amber-600 font-semibold flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> Pending First View by HOD
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setReviewAction('APPROVE')}
                    className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-bold hover:bg-green-700 cursor-pointer shadow-2xs"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setReviewAction('REQUEST_CORRECTION')}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 cursor-pointer shadow-2xs"
                  >
                    Request Correction
                  </button>
                </div>
              </div>

              {/* Review Remarks Modal Overlay */}
              {reviewAction && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-700">
                    <span>Perform Review Action: {reviewAction.replace(/_/g, ' ')}</span>
                    <button onClick={() => setReviewAction(null)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <textarea
                    value={reviewRemarks}
                    onChange={(e) => setReviewRemarks(e.target.value)}
                    placeholder="Enter review remarks / correction instructions for HOD..."
                    className="w-full text-xs bg-background border rounded-lg p-2 min-h-[60px] outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setReviewAction(null)} className="px-3 py-1 bg-card border rounded-lg text-xs font-bold">
                      Cancel
                    </button>
                    <button
                      onClick={handleReviewAction}
                      disabled={isSubmitting}
                      className="px-4 py-1 bg-primary text-primary-foreground rounded-lg text-xs font-bold"
                    >
                      {isSubmitting ? 'Submitting...' : 'Confirm Review'}
                    </button>
                  </div>
                </div>
              )}

              {/* Inner Workspace Tabs */}
              <div className="flex items-center gap-2 border-b pb-2 text-xs font-bold">
                {[
                  { id: 'OVERVIEW', label: 'Overview' },
                  { id: 'SUBMISSION', label: `Submission (v${selectedAssignment.submissions?.[0]?.submissionVersion || 0})` },
                  { id: 'QUERIES', label: `Queries (${selectedAssignment.queries?.length || 0})` },
                  { id: 'TIMELINE', label: 'Timeline' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground shadow-2xs'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === 'OVERVIEW' && (
                <div className="space-y-3 text-xs">
                  <div className="bg-muted/30 p-3 rounded-lg space-y-1">
                    <h5 className="font-bold text-foreground">Task Instructions</h5>
                    <p className="text-muted-foreground leading-relaxed">{task.instructions || task.description || 'No custom instructions provided.'}</p>
                  </div>

                  {selectedAssignment.queries?.length > 0 && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1">
                      <div className="flex items-center justify-between font-bold text-amber-700">
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          HOD Raised {selectedAssignment.queries.length} Query(s) on this Task
                        </span>
                        <button
                          onClick={() => setActiveTab('QUERIES')}
                          className="px-2.5 py-1 rounded-md bg-amber-600 text-white text-[11px] font-bold"
                        >
                          View & Reply Queries
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'SUBMISSION' && (
                <div className="space-y-3 text-xs">
                  {selectedAssignment.submissions?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border border-dashed rounded-xl">
                      No submission uploaded yet by HOD.
                    </div>
                  ) : (
                    selectedAssignment.submissions.map((sub: any) => (
                      <div key={sub.id} className="border rounded-xl p-3 bg-card space-y-2">
                        <div className="flex items-center justify-between font-bold">
                          <span>{sub.title}</span>
                          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px]">
                            Version {sub.submissionVersion}
                          </span>
                        </div>
                        {sub.notes && <p className="text-muted-foreground leading-relaxed">{sub.notes}</p>}
                        <div className="text-[10px] text-muted-foreground">
                          Submitted on {new Date(sub.submittedAt).toLocaleString()} by {sub.submittedBy?.firstName} {sub.submittedBy?.lastName}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'QUERIES' && (
                <TaskQueryThread
                  taskId={task.id}
                  assignmentId={selectedAssignment.id}
                  queries={selectedAssignment.queries || []}
                  currentUserRole="Academic Dean"
                  onQueryPosted={fetchTaskDetails}
                />
              )}

              {activeTab === 'TIMELINE' && <TaskTimeline timeline={task.timeline || []} />}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl text-xs">
              Select a department assignment from the left column to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
