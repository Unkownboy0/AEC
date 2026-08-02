import React, { useState } from 'react';
import {
  Clock, CheckCircle, AlertCircle, FileText, MessageSquare,
  User, RefreshCw, Send, Shield, ChevronRight, CornerDownRight
} from 'lucide-react';

interface TimelineEvent {
  id: string;
  eventType: string;
  actorUserId: string;
  actorRole: string;
  actor?: { firstName: string; lastName: string };
  department?: { name: string; code: string };
  previousStatus?: string;
  newStatus?: string;
  remarks?: string;
  createdAt: string;
}

interface TaskTimelineProps {
  timeline: TimelineEvent[];
}

export const TaskTimeline: React.FC<TaskTimelineProps> = ({ timeline }) => {
  const [filter, setFilter] = useState<string>('ALL');

  const filteredEvents = timeline.filter((e) => {
    if (filter === 'ALL') return true;
    if (filter === 'QUERIES') return e.eventType.includes('QUERY');
    if (filter === 'FILES') return e.eventType.includes('FILE');
    if (filter === 'STATUS') return e.eventType.includes('SUBMITTED') || e.eventType.includes('APPROVED') || e.eventType.includes('CORRECTION');
    return true;
  });

  const getEventIcon = (type: string) => {
    if (type.includes('QUERY')) return <MessageSquare className="h-4 w-4 text-blue-500" />;
    if (type.includes('FILE')) return <FileText className="h-4 w-4 text-emerald-500" />;
    if (type.includes('SUBMITTED')) return <Send className="h-4 w-4 text-amber-500" />;
    if (type.includes('APPROVED') || type.includes('COMPLETED')) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (type.includes('CORRECTION')) return <AlertCircle className="h-4 w-4 text-red-500" />;
    return <Clock className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <h4 className="text-sm font-bold flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" /> Immutable Activity Timeline
        </h4>
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg text-xs font-semibold">
          {['ALL', 'QUERIES', 'FILES', 'STATUS'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-2.5 py-1 rounded-md transition-all ${
                filter === tab ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="text-center py-8 text-xs text-muted-foreground">
          No activity logs recorded for this task filter.
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
          {filteredEvents.map((event) => (
            <div key={event.id} className="relative flex items-start gap-3 group">
              <div className="absolute -left-6 top-1 p-1 bg-background border rounded-full shadow-xs">
                {getEventIcon(event.eventType)}
              </div>
              <div className="flex-1 bg-card border rounded-lg p-3 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    {event.actor?.firstName ? `${event.actor.firstName} ${event.actor.lastName}` : 'System'}
                    <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] uppercase font-bold">
                      {event.actorRole}
                    </span>
                    {event.department && (
                      <span className="px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold">
                        {event.department.code}
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {new Date(event.createdAt).toLocaleString()}
                  </span>
                </div>
                {event.remarks && (
                  <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                    {event.remarks}
                  </p>
                )}
                {event.previousStatus && event.newStatus && (
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground pt-1">
                    <span className="px-1.5 py-0.5 rounded bg-muted">{event.previousStatus}</span>
                    <ChevronRight className="h-3 w-3" />
                    <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">{event.newStatus}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
