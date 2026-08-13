import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Calendar, User, FileText, RefreshCw } from 'lucide-react';
import api from '../../../lib/axios';
import { Skeleton } from '../../../design-system/components/Skeleton';
import { EmptyState } from '../../../design-system/components/EmptyState';
import { ErrorState } from '../../../design-system/components/ErrorState';
import { Modal } from '../../../design-system/components/Modal';
import { toast } from '../../../components/ui/Toast';

export const MentorCounsellingPage: React.FC = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    studentId: '',
    topic: '',
    notes: '',
    followUpDate: '',
  });

  const fetchCounsellingSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/mentor/counselling');
      if (res.data?.status === 'success' || res.data?.success) {
        setSessions(res.data.data || []);
      } else if (Array.isArray(res.data)) {
        setSessions(res.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch counselling sessions:', err);
      setError(err.response?.data?.message || 'Failed to load counselling records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounsellingSessions();
  }, []);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.notes) {
      toast.error('Session notes are required.');
      return;
    }
    try {
      const res = await api.post('/mentor/counselling', formData);
      if (res.data?.status === 'success' || res.status === 201) {
        toast.success('Counselling session recorded.');
        setIsCreateOpen(false);
        setFormData({ studentId: '', topic: '', notes: '', followUpDate: '' });
        fetchCounsellingSessions();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to log counselling session.');
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-7xl mx-auto">
        <Skeleton variant="card" count={3} />
      </div>
    );
  }

  if (error && sessions.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <ErrorState title="Counselling Log Unavailable" description={error} onRetry={fetchCounsellingSessions} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in-50 duration-200">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border p-5 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
            <MessageSquare className="w-4 h-4" /> Mentor Workspace
          </div>
          <h1 className="text-xl font-extrabold text-foreground mt-0.5">Mentee Counselling & Guidance Records</h1>
          <p className="text-xs text-muted-foreground">
            Document 1-on-1 advisement sessions, behavioral tracking, and intervention notes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-3.5 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Log Session
          </button>
          <button
            onClick={fetchCounsellingSessions}
            className="px-3 py-2 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          title="No Counselling Sessions Logged"
          description="Log 1-on-1 mentee advisement sessions to maintain confidential guidance history."
          actionLabel="Log First Session"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sessions.map((item: any) => (
            <div key={item.id} className="p-5 bg-card border border-border rounded-2xl shadow-xs space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-extrabold text-sm text-foreground">{item.studentName || item.student?.name || 'Mentee Session'}</h3>
                  <span className="text-[11px] text-muted-foreground">{item.date || new Date().toLocaleDateString()}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-extrabold border border-purple-500/20">
                  {item.topic || 'General Guidance'}
                </span>
              </div>
              <p className="text-xs text-foreground/90 leading-relaxed bg-muted/30 p-3 rounded-xl border border-border/50">
                {item.notes || 'Routine academic progress review and personal motivation discussion.'}
              </p>
              {item.followUpDate && (
                <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Follow-up scheduled: {item.followUpDate}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal for creating a new session */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Log Mentee Counselling Session"
      >
        <form onSubmit={handleCreateSession} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Session Topic</label>
            <input
              type="text"
              placeholder="e.g. Academic Performance / Attendance Recovery"
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Session Notes & Summary</label>
            <textarea
              rows={4}
              placeholder="Enter detailed observation notes, guidance given, and mentee commitments..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Follow-up Date (Optional)</label>
            <input
              type="date"
              value={formData.followUpDate}
              onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs outline-none focus:border-primary"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 border border-border rounded-xl text-xs font-bold hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 shadow-xs"
            >
              Save Session Note
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
