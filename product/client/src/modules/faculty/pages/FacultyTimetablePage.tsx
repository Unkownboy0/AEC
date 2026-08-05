import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, MapPin, BookOpen } from 'lucide-react';
import { Skeleton } from '../../../design-system/components/Skeleton';
import { ErrorState } from '../../../design-system/components/ErrorState';
import { EmptyState } from '../../../design-system/components/EmptyState';
import { pageVariants } from '../../../design-system/tokens/motion';
import api from '../../../lib/axios';

export const FacultyTimetablePage: React.FC = () => {
  const [slots, setSlots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTimetable = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/timetables/slots');
      if (res.data?.status === 'success') {
        setSlots(res.data.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load faculty schedule');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, []);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Faculty Class Schedule
        </h1>
        <p className="text-xs text-muted-foreground">Your weekly lecture schedule and assigned room locations.</p>
      </div>

      {isLoading ? (
        <Skeleton variant="card" count={3} />
      ) : error ? (
        <ErrorState title="Unable to load schedule" message={error} onRetry={fetchTimetable} />
      ) : slots.length === 0 ? (
        <EmptyState title="No classes scheduled" description="You have no assigned lecture slots for this week." icon={Clock} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {days.map((day) => {
            const daySlots = slots.filter((s) => s.dayOfWeek?.toLowerCase() === day.toLowerCase());
            return (
              <div key={day} className="bg-card border border-border rounded-2xl p-4 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  {day}
                </h3>
                {daySlots.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground italic py-2">No lectures</p>
                ) : (
                  <div className="space-y-2">
                    {daySlots.map((slot) => (
                      <div key={slot.id} className="p-3 bg-muted/30 rounded-xl border border-border/60 text-xs space-y-1">
                        <div className="flex justify-between font-bold text-foreground">
                          <span className="flex items-center gap-1 text-primary">
                            <BookOpen className="h-3.5 w-3.5" />
                            {slot.subjectName || slot.subjectCode || 'Lecture'}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground">{slot.startTime} - {slot.endTime}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-muted-foreground">
                          <span>Sec {slot.sectionName || 'A'}</span>
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Room {slot.roomNo || '301'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};
