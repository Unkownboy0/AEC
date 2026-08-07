import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, Plus, RefreshCw } from 'lucide-react';
import api from '../../../lib/axios';
import { Skeleton } from '../../../design-system/components/Skeleton';
import { EmptyState } from '../../../design-system/components/EmptyState';
import { ErrorState } from '../../../design-system/components/ErrorState';
import { Modal } from '../../../design-system/components/Modal';
import { toast } from '../../../components/ui/Toast';

export const MentorMeetingsPage: React.FC = () => {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    agenda: '',
  });

  const fetchMeetings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/mentor/meetings');
      if (res.data?.status === 'success' || res.data?.success) {
        setMeetings(res.data.data || []);
      } else if (Array.isArray(res.data)) {
        setMeetings(res.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch mentor meetings:', err);
      setError(err.response?.data?.message || 'Unable to load scheduled mentor meetings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date) {
      toast.error('Title and Date are required.');
      return;
    }
    try {
      const res = await api.post('/mentor/meetings', formData);
      if (res.data?.status === 'success' || res.status === 201) {
        toast.success('Mentee meeting scheduled.');
        setIsScheduleOpen(false);
        setFormData({ title: '', date: '', time: '', location: '', agenda: '' });
        fetchMeetings();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to schedule meeting.');
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-7xl mx-auto">
        <Skeleton variant="card" count={3} />
      </div>
    );
  }

  if (error && meetings.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <ErrorState title="Meetings Schedule Unavailable" description={error} onRetry={fetchMeetings} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in-50 duration-200">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border p-5 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
            <Calendar className="w-4 h-4" /> Mentor Workspace
          </div>
          <h1 className="text-xl font-extrabold text-foreground mt-0.5">Mentee Group & Individual Meetings</h1>
          <p className="text-xs text-muted-foreground">
            Schedule periodic mentee group meetings, review sessions, and advisement assemblies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsScheduleOpen(true)}
            className="px-3.5 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Schedule Meeting
          </button>
          <button
            onClick={fetchMeetings}
            className="px-3 py-2 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {meetings.length === 0 ? (
        <EmptyState
          title="No Scheduled Meetings"
          description="Schedule periodic group advisement meetings or individual review sessions with assigned mentees."
          actionLabel="Schedule First Meeting"
          onAction={() => setIsScheduleOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {meetings.map((item: any) => (
            <div key={item.id} className="p-5 bg-card border border-border rounded-2xl shadow-xs space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="font-extrabold text-sm text-foreground">{item.title}</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-extrabold border border-purple-500/20">
                  {item.status || 'UPCOMING'}
                </span>
              </div>
              <p className="text-xs text-foreground/90 leading-relaxed bg-muted/30 p-3 rounded-xl border border-border/50">
                {item.agenda || 'Semester review, attendance audit, and upcoming internal test preparation.'}
              </p>
              <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40 gap-2">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-muted-foreground" /> {item.date}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-muted-foreground" /> {item.time || '10:00 AM'}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-muted-foreground" /> {item.location || 'Department Seminar Hall'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for scheduling meeting */}
      <Modal isOpen={isScheduleOpen} onClose={() => setIsScheduleOpen(false)} title="Schedule Mentee Meeting">
        <form onSubmit={handleScheduleMeeting} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Meeting Title</label>
            <input
              type="text"
              placeholder="e.g. Monthly Mentee Review & Progress Audit"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs outline-none focus:border-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Time</label>
              <input
                type="text"
                placeholder="e.g. 10:30 AM"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs outline-none focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Location / Venue</label>
            <input
              type="text"
              placeholder="e.g. CSE Conference Room 204"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Agenda</label>
            <textarea
              rows={3}
              placeholder="Enter meeting agenda and discussion topics..."
              value={formData.agenda}
              onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs outline-none focus:border-primary"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsScheduleOpen(false)} className="px-4 py-2 border border-border rounded-xl text-xs font-bold hover:bg-muted">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 shadow-xs">
              Schedule Meeting
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
