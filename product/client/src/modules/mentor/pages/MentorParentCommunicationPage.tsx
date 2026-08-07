import React, { useState, useEffect } from 'react';
import { UserCheck, Phone, Mail, Calendar, MessageSquare, Plus, RefreshCw } from 'lucide-react';
import api from '../../../lib/axios';
import { Skeleton } from '../../../design-system/components/Skeleton';
import { EmptyState } from '../../../design-system/components/EmptyState';
import { ErrorState } from '../../../design-system/components/ErrorState';
import { Modal } from '../../../design-system/components/Modal';
import { toast } from '../../../components/ui/Toast';

export const MentorParentCommunicationPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [formData, setFormData] = useState({
    studentId: '',
    parentName: '',
    phone: '',
    topic: '',
    notes: '',
  });

  const fetchParentLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/mentor/parents');
      if (res.data?.status === 'success' || res.data?.success) {
        setLogs(res.data.data || []);
      } else if (Array.isArray(res.data)) {
        setLogs(res.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch parent communication logs:', err);
      setError(err.response?.data?.message || 'Unable to load parent communication history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParentLogs();
  }, []);

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.notes) {
      toast.error('Communication notes are required.');
      return;
    }
    try {
      const res = await api.post('/mentor/parents', formData);
      if (res.data?.status === 'success' || res.status === 201) {
        toast.success('Parent communication recorded.');
        setIsLogOpen(false);
        setFormData({ studentId: '', parentName: '', phone: '', topic: '', notes: '' });
        fetchParentLogs();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record parent communication.');
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-7xl mx-auto">
        <Skeleton variant="card" count={3} />
      </div>
    );
  }

  if (error && logs.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <ErrorState title="Parent Logs Unavailable" description={error} onRetry={fetchParentLogs} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in-50 duration-200">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border p-5 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            <UserCheck className="w-4 h-4" /> Mentor Workspace
          </div>
          <h1 className="text-xl font-extrabold text-foreground mt-0.5">Parent Communication & Follow-up Logs</h1>
          <p className="text-xs text-muted-foreground">
            Document calls, emails, and meetings held with parents regarding mentee progress.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLogOpen(true)}
            className="px-3.5 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Log Parent Call
          </button>
          <button
            onClick={fetchParentLogs}
            className="px-3 py-2 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {logs.length === 0 ? (
        <EmptyState
          title="No Parent Communication Logged"
          description="Maintain call and meeting logs with parents regarding attendance or academic standing."
          actionLabel="Log First Communication"
          onAction={() => setIsLogOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {logs.map((item: any) => (
            <div key={item.id} className="p-5 bg-card border border-border rounded-2xl shadow-xs space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-extrabold text-sm text-foreground">{item.parentName || 'Parent / Guardian'}</h3>
                  <span className="text-[11px] text-muted-foreground">Mentee: {item.studentName || item.student?.name || 'Student'}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-extrabold border border-indigo-500/20">
                  {item.topic || 'Progress Review'}
                </span>
              </div>
              <p className="text-xs text-foreground/90 leading-relaxed bg-muted/30 p-3 rounded-xl border border-border/50">
                {item.notes || 'Discussed recent attendance recovery and semester examination schedule.'}
              </p>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-muted-foreground" /> {item.phone || '+91 98765 43210'}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-muted-foreground" /> {item.date || new Date().toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for logging parent call */}
      <Modal isOpen={isLogOpen} onClose={() => setIsLogOpen(false)} title="Log Parent Communication">
        <form onSubmit={handleCreateLog} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Parent Name</label>
            <input
              type="text"
              placeholder="Parent or Guardian Name"
              value={formData.parentName}
              onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Contact Phone Number</label>
            <input
              type="text"
              placeholder="+91 Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Topic / Discussion Summary</label>
            <textarea
              rows={4}
              placeholder="Record details of conversation, parent feedback, and agreed action steps..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs outline-none focus:border-primary"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsLogOpen(false)} className="px-4 py-2 border border-border rounded-xl text-xs font-bold hover:bg-muted">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 shadow-xs">
              Save Log
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
