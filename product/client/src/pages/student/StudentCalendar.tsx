import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, AlertCircle, BookOpen, Briefcase, Award } from 'lucide-react';

interface CalendarEvent {
  date: string;
  title: string;
  type: 'EXAM' | 'PLACEMENT' | 'HOLIDAY' | 'CLASS' | 'EVENT' | 'DEADLINE';
  time?: string;
  location?: string;
}

const EVENTS: CalendarEvent[] = [
  { date: '2026-07-25', title: 'Internal Assessment – Design of Algorithms', type: 'EXAM', time: '10:00 AM', location: 'Exam Hall B' },
  { date: '2026-07-28', title: 'Anti-Ragging Awareness Session', type: 'EVENT', time: '10:00 AM', location: 'Main Auditorium' },
  { date: '2026-07-28', title: 'Library Book Return Deadline (CLRS)', type: 'DEADLINE', time: 'By 5:00 PM' },
  { date: '2026-08-01', title: 'Fee Payment Last Date', type: 'DEADLINE' },
  { date: '2026-08-05', title: 'Placement Drive: Google India (Registration Deadline)', type: 'PLACEMENT', time: '11:59 PM' },
  { date: '2026-08-10', title: 'Pre-Placement Talk – TCS & Cognizant', type: 'PLACEMENT', time: '2:00 PM', location: 'Placement Cell' },
  { date: '2026-08-12', title: 'Campus Recruitment: TCS Digital', type: 'PLACEMENT', time: '9:00 AM', location: 'CSE Dept. Hall' },
  { date: '2026-08-14', title: 'Campus Recruitment: Cognizant GenC Next', type: 'PLACEMENT', time: '9:00 AM', location: 'IT Dept. Hall' },
  { date: '2026-08-15', title: 'Independence Day – National Holiday', type: 'HOLIDAY' },
  { date: '2026-08-20', title: 'Annual Sports Day 2026', type: 'EVENT', time: '8:00 AM', location: 'Sports Ground' },
  { date: '2026-11-03', title: 'Semester End Examinations Begin', type: 'EXAM' },
];

const TYPE_COLORS: Record<string, string> = {
  EXAM: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400',
  PLACEMENT: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400',
  HOLIDAY: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400',
  CLASS: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
  EVENT: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400',
  DEADLINE: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400',
};

const DOT_COLORS: Record<string, string> = {
  EXAM: 'bg-rose-500',
  PLACEMENT: 'bg-indigo-500',
  HOLIDAY: 'bg-emerald-500',
  CLASS: 'bg-blue-500',
  EVENT: 'bg-amber-500',
  DEADLINE: 'bg-orange-500',
};

export const StudentCalendar: React.FC = () => {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string>(today.toISOString().split('T')[0]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const monthName = currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getEventsForDate = (dateStr: string) => EVENTS.filter(e => e.date === dateStr);
  const selectedEvents = getEventsForDate(selectedDate);

  const upcomingEvents = EVENTS
    .filter(e => new Date(e.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 8);

  return (
    <div className="space-y-6 text-left pb-12 animate-in fade-in duration-200">
      <div>
        <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
          <Calendar className="h-5 w-5 text-indigo-600" /> Academic Calendar
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Exams, placements, holidays, and institutional events</p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px] font-black">
        {Object.entries(DOT_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${color}`} />
            <span className="text-slate-500">{type}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 border bg-card rounded-2xl shadow-sm p-5 space-y-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <button onClick={prevMonth} className="p-2 hover:bg-muted rounded-xl border transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="text-sm font-extrabold text-slate-800 dark:text-white">{monthName}</h2>
            <button onClick={nextMonth} className="p-2 hover:bg-muted rounded-xl border transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-[9px] font-black uppercase text-slate-400 py-1">{day}</div>
            ))}
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const events = getEventsForDate(dateStr);
              const isToday = dateStr === today.toISOString().split('T')[0];
              const isSelected = dateStr === selectedDate;

              return (
                <button key={day} onClick={() => setSelectedDate(dateStr)}
                  className={`relative p-1.5 rounded-xl flex flex-col items-center gap-0.5 transition-all hover:bg-indigo-50 dark:hover:bg-indigo-900/20 min-h-[42px] ${
                    isSelected ? 'bg-indigo-600 text-white hover:bg-indigo-600' :
                    isToday ? 'bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-400' : ''
                  }`}>
                  <span className={`text-xs font-extrabold ${isSelected ? 'text-white' : isToday ? 'text-indigo-600' : 'text-slate-700 dark:text-slate-200'}`}>
                    {day}
                  </span>
                  {events.length > 0 && (
                    <div className="flex gap-0.5 flex-wrap justify-center">
                      {events.slice(0, 3).map((e, idx) => (
                        <span key={idx} className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : DOT_COLORS[e.type]}`} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Day Events */}
          {selectedEvents.length > 0 && (
            <div className="border-t pt-4 space-y-2">
              <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                Events on {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              {selectedEvents.map((e, idx) => (
                <div key={idx} className={`p-3 rounded-xl border text-xs ${TYPE_COLORS[e.type]}`}>
                  <p className="font-extrabold">{e.title}</p>
                  {e.time && <p className="text-[10px] font-bold mt-0.5 flex items-center gap-1"><Clock className="h-3 w-3" />{e.time}{e.location && ` · ${e.location}`}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Events */}
        <div className="border bg-card rounded-2xl shadow-sm p-5 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Upcoming Events</h3>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {upcomingEvents.map((e, idx) => (
              <div key={idx} className="flex gap-3 items-start">
                <div className="text-center shrink-0 min-w-[36px]">
                  <p className="text-xs font-black text-slate-800 dark:text-white">
                    {new Date(e.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric' })}
                  </p>
                  <p className="text-[8px] uppercase font-black text-slate-400">
                    {new Date(e.date + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short' })}
                  </p>
                </div>
                <div className="flex-1 border-l pl-3">
                  <p className="text-[11px] font-extrabold text-slate-800 dark:text-white leading-tight">{e.title}</p>
                  {e.time && <p className="text-[9px] text-slate-400 font-bold mt-0.5">{e.time}</p>}
                  <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded mt-1 inline-block border ${TYPE_COLORS[e.type]}`}>{e.type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentCalendar;
