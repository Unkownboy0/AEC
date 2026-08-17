import React, { useState, useEffect } from 'react';
import { Clock, Calendar, MapPin, User, Download, ShieldCheck, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';
import api from '../../lib/axios';
import { saveBlobAndOpen } from '../../platform/download';

interface Slot {
  dayOfWeek: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  subjectCode: string;
  subjectName: string;
  facultyName: string;
  roomNo: string;
  building: string;
  isLab: boolean;
  labName?: string;
}

export const StudentTimetable: React.FC = () => {
  const [masterData, setMasterData] = useState<any | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>('MONDAY');
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [viewMode, setViewMode] = useState<'weekly' | 'daily'>('daily');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

  useEffect(() => {
    fetchCentralizedMasterTimetable();
  }, []);

  const fetchCentralizedMasterTimetable = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/enterprise/master-timetable/view');
      if (res.data?.status === 'success') {
        setMasterData(res.data.data);
      }
    } catch {
      toast.error('Failed to load Master Timetable');
    } finally {
      setIsLoading(false);
    }
  };

  const getDaySlots = (day: string): Slot[] => {
    if (!masterData || !Array.isArray(masterData.slots)) return [];
    return masterData.slots
      .filter((s: Slot) => s.dayOfWeek.toUpperCase() === day.toUpperCase())
      .sort((a: Slot, b: Slot) => a.periodNumber - b.periodNumber);
  };

  const currentDaySlots = getDaySlots(selectedDay);

  const ISO_WEEKDAY: Record<string, number> = {
    MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5, SATURDAY: 6, SUNDAY: 7,
  };
  const ICS_BYDAY: Record<string, string> = {
    MONDAY: 'MO', TUESDAY: 'TU', WEDNESDAY: 'WE', THURSDAY: 'TH', FRIDAY: 'FR', SATURDAY: 'SA', SUNDAY: 'SU',
  };

  const nextOccurrence = (weekday: number, hh: number, mm: number): Date => {
    const now = new Date();
    const result = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0);
    const currentIso = now.getDay() === 0 ? 7 : now.getDay();
    let diff = weekday - currentIso;
    if (diff < 0 || (diff === 0 && result <= now)) diff += 7;
    result.setDate(result.getDate() + diff);
    return result;
  };

  const icsDate = (d: Date) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}00`;

  const handleExportCalendar = async () => {
    if (!masterData || !Array.isArray(masterData.slots) || masterData.slots.length === 0) {
      toast.error('No published timetable to export yet.');
      return;
    }
    setIsExporting(true);
    try {
      const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CampusOS//Student Timetable//EN', 'CALSCALE:GREGORIAN'];
      masterData.slots.forEach((slot: Slot, i: number) => {
        const weekday = ISO_WEEKDAY[slot.dayOfWeek?.toUpperCase()];
        const byday = ICS_BYDAY[slot.dayOfWeek?.toUpperCase()];
        if (!weekday || !slot.startTime || !slot.endTime) return;
        const [sh, sm] = slot.startTime.split(':').map(Number);
        const [eh, em] = slot.endTime.split(':').map(Number);
        const start = nextOccurrence(weekday, sh || 0, sm || 0);
        const end = nextOccurrence(weekday, eh || 0, em || 0);
        lines.push(
          'BEGIN:VEVENT',
          `UID:campusos-timetable-${i}-${slot.subjectCode || 'slot'}@campusos.app`,
          `DTSTAMP:${icsDate(new Date())}Z`,
          `DTSTART:${icsDate(start)}`,
          `DTEND:${icsDate(end)}`,
          `RRULE:FREQ=WEEKLY;BYDAY=${byday}`,
          `SUMMARY:${(slot.subjectName || slot.subjectCode || 'Class').replace(/,/g, '\\,')}`,
          `LOCATION:${[slot.roomNo, slot.building].filter(Boolean).join(', ').replace(/,/g, '\\,')}`,
          `DESCRIPTION:${(slot.facultyName || '').replace(/,/g, '\\,')}`,
          'END:VEVENT'
        );
      });
      lines.push('END:VCALENDAR');
      const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
      const result = await saveBlobAndOpen(blob, 'campusos-timetable.ics');
      if (result.success) {
        toast.success('Timetable exported as a calendar file.');
      } else {
        toast.error(result.error || 'Unable to export calendar.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) return <Loading text="Loading Centralized Master Timetable..." />;

  return (
    <div className="space-y-6 text-left pb-16 animate-in fade-in duration-200">
      
      {/* Top Banner with Official Stamp */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 bg-card border p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
              <Clock className="h-6 w-6 text-indigo-600" /> Academic Class Schedule & Timetable
            </h1>
            <span className="text-[9px] font-black uppercase bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Single Source of Truth
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Centralized master schedule published by <span className="font-extrabold text-slate-700 dark:text-slate-200">{masterData?.publishedBy || 'COE & Dean Academics Office'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCalendar}
            disabled={isExporting}
            className="px-4 py-2 bg-indigo-600 text-white text-xs font-extrabold rounded-xl shadow hover:bg-indigo-700 transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> {isExporting ? 'Exporting…' : 'Export Calendar (.ics)'}
          </button>
        </div>
      </div>

      {/* Verification KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="border bg-card p-4 rounded-2xl shadow-sm">
          <span className="text-[9px] uppercase font-black text-slate-400 block">Academic Term</span>
          <span className="font-extrabold text-slate-800 dark:text-white mt-0.5 block">{masterData?.academicYear || '2026-2027'}</span>
        </div>
        <div className="border bg-card p-4 rounded-2xl shadow-sm">
          <span className="text-[9px] uppercase font-black text-slate-400 block">Semester & Section</span>
          <span className="font-extrabold text-slate-800 dark:text-white mt-0.5 block">{masterData?.semester || 'Semester VI'} - Sec {masterData?.section || 'A'}</span>
        </div>
        <div className="border bg-card p-4 rounded-2xl shadow-sm">
          <span className="text-[9px] uppercase font-black text-slate-400 block">Master Version</span>
          <span className="font-extrabold text-indigo-600 mt-0.5 block">Version v{masterData?.version || 1} (Locked)</span>
        </div>
        <div className="border bg-card p-4 rounded-2xl shadow-sm">
          <span className="text-[9px] uppercase font-black text-slate-400 block">Publication Date</span>
          <span className="font-mono text-emerald-600 font-bold mt-0.5 block">
            {masterData?.publishedAt ? new Date(masterData.publishedAt).toLocaleDateString('en-IN') : 'Verified'}
          </span>
        </div>
      </div>

      {/* Main Grid: Left Slots Navigator & Right Slot Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Schedule Column */}
        <div className="lg:col-span-8 space-y-4">
          <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-4">
            
            {/* Day Selector */}
            <div className="flex border rounded-xl overflow-hidden text-xs font-extrabold bg-card overflow-x-auto">
              {days.map((day) => (
                <button
                  key={day}
                  onClick={() => { setSelectedDay(day); setSelectedSlot(null); }}
                  className={`flex-1 py-2.5 px-3 text-center transition-all min-w-[80px] ${
                    selectedDay === day
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {day.substring(0, 3)}
                </button>
              ))}
            </div>

            {/* Slots List */}
            <div className="space-y-3">
              {currentDaySlots.length > 0 ? (
                currentDaySlots.map((slot) => {
                  const isSelected = selectedSlot?.periodNumber === slot.periodNumber;
                  return (
                    <div
                      key={slot.periodNumber}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-4 border rounded-2xl bg-background flex items-center justify-between transition-all cursor-pointer hover:border-indigo-300 ${
                        isSelected ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-900/10' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 font-mono font-black text-xs flex items-center justify-center shrink-0">
                          P{slot.periodNumber}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs text-slate-800 dark:text-white">{slot.subjectName}</span>
                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${
                              slot.isLab ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            }`}>
                              {slot.isLab ? 'LAB' : 'LECTURE'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                            {slot.facultyName} · {slot.roomNo} ({slot.building})
                          </p>
                        </div>
                      </div>

                      <div className="text-right font-mono text-xs font-bold text-slate-500">
                        {slot.startTime} - {slot.endTime}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-2xl text-slate-400 text-xs font-semibold">
                  No classes scheduled for {selectedDay}. Enjoy your academic study break!
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Right Slot Detail Console */}
        <div className="lg:col-span-4">
          <div className="border bg-card p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
              Period Detail Console
            </h3>

            {selectedSlot ? (
              <div className="space-y-4 text-xs font-semibold">
                <div>
                  <span className="text-[9px] font-mono font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    {selectedSlot.subjectCode}
                  </span>
                  <h4 className="text-base font-extrabold text-slate-800 dark:text-white mt-1 leading-tight">
                    {selectedSlot.subjectName}
                  </h4>
                </div>

                <div className="space-y-2 border-t pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Faculty Assigned</span>
                    <span className="font-extrabold text-slate-800 dark:text-white">{selectedSlot.facultyName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Location</span>
                    <span className="font-bold">{selectedSlot.roomNo} ({selectedSlot.building})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Time Window</span>
                    <span className="font-mono font-bold text-indigo-600">{selectedSlot.startTime} - {selectedSlot.endTime}</span>
                  </div>
                </div>

                {selectedSlot.isLab && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 rounded-xl space-y-1">
                    <p className="text-[10px] font-black text-amber-700 uppercase">Laboratory Allocation</p>
                    <p className="text-xs font-extrabold text-slate-800">{selectedSlot.labName || 'Practical Work'}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400 text-xs font-semibold">
                Click any scheduled period from the left schedule list to inspect classroom location and faculty assignments.
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentTimetable;
