import React, { useState, useEffect } from 'react';
import { MessageSquare, X, CheckCircle2, Send, Loader2 } from 'lucide-react';
import { workspaceApi, WorkspaceComment } from '../../services/workspace.api';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../ui/Toast';

interface Props {
  documentId: string;
  userRole: string;
  onClose: () => void;
}

const WorkspaceCommentsPanel: React.FC<Props> = ({ documentId, userRole, onClose }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<WorkspaceComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [documentId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const doc = await workspaceApi.getDocument(documentId);
      setComments(doc.comments || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async () => {
    if (!newComment.trim()) return;
    setPosting(true);
    try {
      await workspaceApi.addComment(documentId, newComment.trim());
      setNewComment('');
      await loadComments();
      toast.success('Comment added.');
    } catch {
      toast.error('Failed to post comment.');
    } finally {
      setPosting(false);
    }
  };

  const handleResolve = async (commentId: string) => {
    try {
      await workspaceApi.resolveComment(documentId, commentId);
      await loadComments();
    } catch {
      toast.error('Failed to resolve comment.');
    }
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ' ' +
      date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const getAuthorName = (comment: WorkspaceComment) => {
    if (comment.author?.faculty) {
      return `${comment.author.faculty.firstName} ${comment.author.faculty.lastName}`;
    }
    return 'Unknown';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-blue-500" />
          <h3 className="text-sm font-semibold text-gray-800">Comments</h3>
          <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{comments.length}</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
          <X size={14} />
        </button>
      </div>

      {/* Comment Input */}
      <div className="p-3 border-b border-gray-100">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment…"
          rows={3}
          className="w-full text-xs border border-gray-200 rounded-xl p-2.5 resize-none outline-none focus:border-blue-400 transition-colors"
          onKeyDown={(e) => { if (e.ctrlKey && e.key === 'Enter') handlePost(); }}
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={handlePost}
            disabled={posting || !newComment.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {posting ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
            Post
          </button>
        </div>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <MessageSquare size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-xs">No comments yet.</p>
          </div>
        ) : (
          comments.map((c) => (
            <div key={c.id} className={`rounded-xl p-3 border ${c.resolved ? 'border-gray-100 bg-gray-50 opacity-60' : 'border-gray-200 bg-white'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-[10px] font-bold text-blue-700">
                    {getAuthorName(c)[0]}
                  </div>
                  <span className="text-xs font-semibold text-gray-800">{getAuthorName(c)}</span>
                </div>
                {!c.resolved && c.authorId === user?.id && (
                  <button onClick={() => handleResolve(c.id)} className="p-0.5 hover:text-green-600 transition-colors" title="Resolve">
                    <CheckCircle2 size={13} className="text-gray-400" />
                  </button>
                )}
                {c.resolved && <CheckCircle2 size={13} className="text-green-500" />}
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">{c.commentText}</p>
              <p className="text-[10px] text-gray-400 mt-1.5">{formatDate(c.createdAt)}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WorkspaceCommentsPanel;
