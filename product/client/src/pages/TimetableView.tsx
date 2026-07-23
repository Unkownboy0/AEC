import React, { useState, useEffect } from 'react';
import { CalendarDays, Clock, RefreshCw, Printer, Download, Grid } from 'lucide-react';
import { toast } from '../components/ui/Toast';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const SLOTS = [1, 2, 3, 4, 5, 6, 7, 8];

export const TimetableView: React.FC = () => {
  const { user } = useAuth();
  const [timetableSlots, setTimetableSlots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTimetable();
    }
  }, [user]);

  const fetchTimetable = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Pass studentId or facultyId to load correct timetable slots
      const params: any = {};
      if (user.role === 'Student') {
        const studentProfileRes = await api.get('/enterprise/students').catch(() => null);
        if (studentProfileRes?.data?.status === 'success' && studentProfileRes.data.data.length > 0) {
          params.studentId = studentProfileRes.data.data[0].id;
        } else {
          params.studentId = user.id;
        }
      } else if (user.role === 'Faculty') {
        const facultyProfileRes = await api.get('/enterprise/faculty').catch(() => null);
        if (facultyProfileRes?.data?.status === 'success' && facultyProfileRes.data.data.length > 0) {
          params.facultyId = facultyProfileRes.data.data[0].id;
        } else {
          params.facultyId = user.id;
        }
      }
      
      const res = await api.get('/timetable/slots', { params });
      if (res.data?.status === 'success') {
        setTimetableSlots(res.data.data || []);
      }
    } catch (err) {
      toast.error('Failed to load your timetable.');
    } finally {
      setIsLoading(false);
    }
  };

  const getSlotDetails = (day: string, slotIdx: number) => {
    return timetableSlots.find(s => s.dayOfWeek === day && s.slotIndex === slotIdx);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 print:p-0 print:m-0">
      
      {/* Page Header */}
      <div className="flex justify-between items-center border-b pb-4 print:hidden">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            My Timetable
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            View your scheduled classes and labs for the current semester
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTimetable}
            className="p-1.5 border rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh Timetable"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-primary text-primary-foreground font-bold text-xs rounded-lg flex items-center gap-1.5 hover:bg-primary/95 transition-colors"
          >
            <Printer className="h-3.5 w-3.5" />
            Print Schedule
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      {isLoading ? (
        <div className="border bg-card p-12 text-center rounded-xl flex items-center justify-center">
          <RefreshCw className="h-6 w-6 text-primary animate-spin" />
        </div>
      ) : timetableSlots.length === 0 ? (
        <div className="border bg-card p-12 text-center rounded-xl flex flex-col items-center justify-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Grid className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm font-bold text-foreground">No classes scheduled yet</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            Your department coordinator has not published a timetable for your class or section.
          </p>
        </div>
      ) : (
        <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs font-semibold min-w-[700px]">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="py-2.5 pl-3 border text-[10px] uppercase font-bold text-muted-foreground">Day / Period</th>
                  {SLOTS.map(p => (
                    <th key={p} className="py-2.5 px-3 border text-center text-[10px] uppercase font-bold text-muted-foreground">
                      Period {p}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map(day => (
                  <tr key={day} className="border-b hover:bg-muted/10 transition-colors">
                    <td className="py-4 pl-3 border font-extrabold uppercase text-[10px] text-muted-foreground bg-muted/10 w-24">
                      {day.slice(0, 3)}
                    </td>
                    {SLOTS.map(slotIdx => {
                      const slot = getSlotDetails(day, slotIdx);
                      return (
                        <td key={slotIdx} className="p-1 border text-center w-28 h-20 align-top relative">
                          {slot ? (
                            <div className={`p-2 rounded-lg text-left h-full flex flex-col justify-between border ${
                              slot.isLab ? 'bg-indigo-50/50 border-indigo-200 text-indigo-900' : 'bg-primary/5 border-primary/20 text-primary-900'
                            }`}>
                              <div>
                                <div className="font-extrabold text-[10px] truncate">{slot.subject?.name || 'Subject'}</div>
                                <div className="text-[8px] text-muted-foreground truncate mt-0.5">{slot.subject?.code}</div>
                              </div>
                              <div className="flex items-center justify-between mt-1 text-[8px] font-bold text-muted-foreground">
                                <span className="truncate">
                                  {user?.role === 'Faculty'
                                    ? `Section: ${slot.section?.name || 'A'}`
                                    : `${slot.faculty?.firstName} ${slot.faculty?.lastName[0]}.`
                                  }
                                </span>
                                <span className="bg-background px-1 border rounded">{slot.roomNo}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground/30 text-[9px] font-bold italic">
                              —
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Printable CSS Page Breaks */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            border: 1px solid #ddd !important;
            padding: 8px !important;
          }
        }
      `}</style>

    </div>
  );
};
