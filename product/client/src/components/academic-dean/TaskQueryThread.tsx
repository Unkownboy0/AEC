import React, { useState } from 'react';
import {
  MessageSquare, Send, CheckCircle, Lock, Users, Pin,
  CornerDownRight, User, AlertCircle
} from 'lucide-react';
import { toast } from '../ui/Toast';
import api from '../../lib/axios';

interface QueryItem {
  id: string;
  message: string;
  status: string;
  visibility: string;
  isPinned: boolean;
  createdBy?: any;
  createdAt: string;
  replies?: QueryItem[];
}

interface TaskQueryThreadProps {
  taskId: string;
  assignmentId?: string;
  queries: QueryItem[];
  currentUserRole: string;
  onQueryPosted?: () => void;
}

export const TaskQueryThread: React.FC<TaskQueryThreadProps> = ({
  taskId,
  assignmentId,
  queries = [],
  currentUserRole,
  onQueryPosted,
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [replyParentId, setReplyParentId] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<'ASSIGNMENT_PRIVATE' | 'COMMON_TO_ALL_RECIPIENTS'>('ASSIGNMENT_PRIVATE');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDean = ['Academic Dean', 'Super Admin', 'College Admin', 'Principal'].includes(currentUserRole);

  const getUserName = (createdBy: any) => {
    if (!createdBy) return 'User';
    if (typeof createdBy === 'string') return createdBy;
    const name = `${createdBy.firstName || ''} ${createdBy.lastName || ''}`.trim();
    return name || createdBy.email || 'User';
  };

  const getUserRole = (createdBy: any) => {
    if (!createdBy) return 'User';
    if (typeof createdBy.role === 'string') return createdBy.role;
    if (createdBy.role?.name) return createdBy.role.name;
    return 'User';
  };

  const formatDateStr = (dateStr: any) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? '' : d.toLocaleString();
    } catch (_) {
      return '';
    }
  };

  const handlePostQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsSubmitting(true);
    try {
      const endpoint = isDean && assignmentId
        ? `/academic-dean/task-assignments/${assignmentId}/queries`
        : `/hod/academic-tasks/${assignmentId}/queries`;

      await api.post(endpoint, {
        taskId,
        assignmentId,
        parentQueryId: replyParentId,
        message: newMessage.trim(),
        visibility,
      });

      toast.success('Query posted successfully');
      setNewMessage('');
      setReplyParentId(null);
      if (onQueryPosted) onQueryPosted();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to post query');
    } finally {
      setIsSubmitting(false);
    }
  };

  const safeQueries = Array.isArray(queries) ? queries : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <h4 className="text-sm font-bold flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" /> Task Query & Discussion Space
        </h4>
        <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 flex items-center gap-1">
          <Lock className="h-3 w-3" /> Department Isolated Thread
        </span>
      </div>

      {/* Post Box */}
      <form onSubmit={handlePostQuery} className="bg-card border rounded-xl p-3 space-y-3 shadow-xs">
        {replyParentId && (
          <div className="flex items-center justify-between bg-muted/60 px-3 py-1.5 rounded-lg text-xs">
            <span className="text-muted-foreground flex items-center gap-1 font-medium">
              <CornerDownRight className="h-3.5 w-3.5 text-primary" /> Replying to thread...
            </span>
            <button
              type="button"
              onClick={() => setReplyParentId(null)}
              className="text-[10px] text-red-500 font-bold hover:underline"
            >
              Cancel Reply
            </button>
          </div>
        )}

        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={isDean ? 'Reply to HOD query or post clarification...' : 'Ask Academic Dean a question or request clarification...'}
          className="w-full text-xs bg-background border rounded-lg p-3 min-h-[80px] focus:ring-2 focus:ring-primary/20 outline-none resize-none"
        />

        <div className="flex items-center justify-between pt-1">
          {isDean ? (
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="vis"
                  checked={visibility === 'ASSIGNMENT_PRIVATE'}
                  onChange={() => setVisibility('ASSIGNMENT_PRIVATE')}
                  className="text-primary"
                />
                Private to HOD
              </label>
              <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="vis"
                  checked={visibility === 'COMMON_TO_ALL_RECIPIENTS'}
                  onChange={() => setVisibility('COMMON_TO_ALL_RECIPIENTS')}
                  className="text-primary"
                />
                Common Clarification (All Departments)
              </label>
            </div>
          ) : <div />}

          <button
            type="submit"
            disabled={isSubmitting || !newMessage.trim()}
            className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 hover:bg-primary/90 disabled:opacity-50 transition-all cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" /> {isSubmitting ? 'Posting...' : 'Post Message'}
          </button>
        </div>
      </form>

      {/* Query List */}
      <div className="space-y-3 pt-2">
        {safeQueries.length === 0 ? (
          <div className="text-center py-8 border border-dashed rounded-xl text-xs text-muted-foreground">
            No queries raised yet for this task assignment.
          </div>
        ) : (
          safeQueries.map((q) => (
            <div
              key={q.id || Math.random()}
              className={`border rounded-xl p-3.5 shadow-2xs space-y-2 ${
                q.visibility === 'COMMON_TO_ALL_RECIPIENTS' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-card'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">
                    {getUserName(q.createdBy)}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] uppercase font-bold">
                    {getUserRole(q.createdBy)}
                  </span>
                  {q.visibility === 'COMMON_TO_ALL_RECIPIENTS' && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 text-[10px] font-bold flex items-center gap-1">
                      <Users className="h-3 w-3" /> Common Clarification
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {formatDateStr(q.createdAt)}
                </span>
              </div>

              <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{q.message || ''}</p>

              <div className="flex items-center justify-between pt-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setReplyParentId(q.id)}
                  className="text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <CornerDownRight className="h-3 w-3" /> Reply
                </button>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  q.status === 'RESOLVED' ? 'bg-green-500/10 text-green-600' : 'bg-blue-500/10 text-blue-600'
                }`}>
                  {q.status || 'OPEN'}
                </span>
              </div>

              {/* Thread Replies */}
              {Array.isArray(q.replies) && q.replies.length > 0 && (
                <div className="pl-4 border-l-2 border-primary/20 space-y-2 pt-2 mt-2">
                  {q.replies.map((reply) => (
                    <div key={reply.id || Math.random()} className="bg-muted/40 p-2.5 rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-foreground">
                          {getUserName(reply.createdBy)}
                          <span className="ml-1.5 px-1 py-0.2 rounded bg-primary/10 text-primary text-[9px] uppercase font-bold">
                            {getUserRole(reply.createdBy)}
                          </span>
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {formatDateStr(reply.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/90">{reply.message || ''}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
