import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, Filter, Info, AlertCircle, Award, BookOpen, Briefcase, Calendar } from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';

interface Notification {
  id: string;
  type: 'PLACEMENT' | 'ACADEMIC' | 'EXAM' | 'FEE' | 'GENERAL' | 'ACHIEVEMENT';
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

const DEMO_NOTIFICATIONS: Notification[] = [
  { id: '1', type: 'PLACEMENT', title: 'New Drive Registered: Google India', body: 'A new campus recruitment drive for Software Engineer role with 32 LPA package has been posted. Deadline: August 5, 2026.', timestamp: '2026-07-22T10:30:00', read: false },
  { id: '2', type: 'EXAM', title: 'Semester End Exam Schedule Released', body: 'The November 2026 semester examination timetable has been published. Check the Examinations section for your hall allocation.', timestamp: '2026-07-22T09:00:00', read: false },
  { id: '3', type: 'ACHIEVEMENT', title: 'Assignment Graded: Database Management Systems', body: 'Your assignment "Transaction Processing Simulator" has been evaluated. Score: 94/100. Great work!', timestamp: '2026-07-21T16:45:00', read: false },
  { id: '4', type: 'FEE', title: 'Fee Payment Reminder', body: 'Your academic fee for the 2026–2027 term is pending. Last date for payment without fine: August 1, 2026.', timestamp: '2026-07-20T08:00:00', read: true },
  { id: '5', type: 'ACADEMIC', title: 'Attendance Alert: Computer Networks', body: 'Your attendance in CS6103 (Computer Networks) has dropped to 72.5%. Minimum required is 75%. Please attend the next 3 sessions.', timestamp: '2026-07-19T14:00:00', read: true },
  { id: '6', type: 'GENERAL', title: 'Library Book Due: Introduction to Algorithms', body: 'Your issued book "Introduction to Algorithms (CLRS)" is due for return on July 28, 2026. Renew online to avoid fines.', timestamp: '2026-07-18T11:00:00', read: true },
  { id: '7', type: 'PLACEMENT', title: 'Internship Proposal Approved', body: 'Your internship proposal with Google India has been reviewed and approved by the Placement Cell. Please upload your offer letter.', timestamp: '2026-07-17T09:30:00', read: true },
];

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  PLACEMENT: { icon: <Briefcase className="h-4 w-4" />, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/30' },
  ACADEMIC: { icon: <BookOpen className="h-4 w-4" />, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/30' },
  EXAM: { icon: <AlertCircle className="h-4 w-4" />, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/30' },
  FEE: { icon: <AlertCircle className="h-4 w-4" />, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/30' },
  GENERAL: { icon: <Info className="h-4 w-4" />, color: 'text-slate-500', bg: 'bg-muted' },
  ACHIEVEMENT: { icon: <Award className="h-4 w-4" />, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
};

export const StudentNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>(DEMO_NOTIFICATIONS);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  const displayed = filter === 'UNREAD' ? notifications.filter(n => !n.read) : notifications;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success('All notifications marked as read.');
  };

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (isLoading) return <Loading text="Loading Notifications..." />;

  return (
    <div className="space-y-6 text-left pb-12 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Bell className="h-5 w-5 text-indigo-600" />
            Notifications Center
            {unreadCount > 0 && (
              <span className="h-5 w-5 rounded-full bg-indigo-600 text-white text-[9px] font-black flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Academic alerts, placement updates, and system messages</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead}
            className="px-4 py-2 border text-xs font-extrabold rounded-xl hover:bg-muted flex items-center gap-1.5 bg-card">
            <CheckCheck className="h-4 w-4" /> Mark All Read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b text-xs font-bold">
        <button onClick={() => setFilter('ALL')}
          className={`pb-2.5 px-3 border-b-2 transition-colors ${filter === 'ALL' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-muted-foreground'}`}>
          All ({notifications.length})
        </button>
        <button onClick={() => setFilter('UNREAD')}
          className={`pb-2.5 px-3 border-b-2 transition-colors ${filter === 'UNREAD' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-muted-foreground'}`}>
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {displayed.length > 0 ? displayed.map(n => {
          const config = TYPE_CONFIG[n.type] || TYPE_CONFIG['GENERAL'];
          return (
            <div key={n.id}
              className={`border rounded-2xl p-4 flex items-start gap-3 transition-all hover:shadow-sm cursor-pointer group ${!n.read ? 'bg-card border-indigo-200 dark:border-indigo-800/60' : 'bg-card opacity-80'}`}
              onClick={() => markRead(n.id)}>
              <div className={`p-2 rounded-xl ${config.bg} ${config.color} shrink-0 mt-0.5`}>
                {config.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-xs font-extrabold leading-tight ${!n.read ? 'text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                    {n.title}
                    {!n.read && <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-600 ml-2 align-middle" />}
                  </p>
                  <button onClick={e => { e.stopPropagation(); deleteNotification(n.id); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded-lg shrink-0">
                    <Trash2 className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                </div>
                <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed mt-1">{n.body}</p>
                <p className="text-[9px] text-slate-400 font-bold mt-1.5">
                  {new Date(n.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at {new Date(n.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        }) : (
          <div className="text-center py-16 border-2 border-dashed rounded-2xl">
            <Bell className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-xs text-muted-foreground mt-2 font-semibold">No {filter === 'UNREAD' ? 'unread' : ''} notifications</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentNotifications;
