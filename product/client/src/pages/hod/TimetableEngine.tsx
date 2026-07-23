import React, { useState, useEffect } from 'react';
import {
  CalendarDays, Clock, Search, ShieldAlert, Sparkles, Send, CheckCircle,
  Plus, Trash2, ArrowRight, BookOpen, User, RefreshCw, Grid, Layers, Download
} from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import api from '../../lib/axios';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const SLOTS = [1, 2, 3, 4, 5, 6, 7, 8];

export const TimetableEngine: React.FC = () => {
  // Masters state
  const [departments, setDepartments] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);

  // Filter Selection
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSem, setSelectedSem] = useState('');
  const [selectedSec, setSelectedSec] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  // Loaded Slots
  const [timetableSlots, setTimetableSlots] = useState<any[]>([]);
  const [publishStatus, setPublishStatus] = useState<string>('DRAFT');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

  // Form State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formSlot, setFormSlot] = useState({
    dayOfWeek: 'MONDAY',
    slotIndex: '1',
    startTime: '09:00',
    endTime: '09:50',
    subjectId: '',
    facultyId: '',
    roomNo: '',
    isLab: false
  });

  // Load configuration masters
  useEffect(() => {
    const loadMasters = async () => {
      try {
        const [deptRes, semRes, secRes, subRes, facRes, yrRes] = await Promise.all([
          api.get('/academics/departments'),
          api.get('/academics/semesters'),
          api.get('/academics/sections'),
          api.get('/academics/subjects'),
          api.get('/enterprise/faculty'),
          api.get('/academics/years')
        ]);

        if (deptRes.data?.status === 'success') setDepartments(deptRes.data.data || []);
        if (semRes.data?.status === 'success') setSemesters(semRes.data.data || []);
        if (secRes.data?.status === 'success') setSections(secRes.data.data || []);
        if (subRes.data?.status === 'success') setSubjects(subRes.data.data || []);
        if (facRes.data?.status === 'success') setFaculties(facRes.data.data || []);
        if (yrRes.data?.status === 'success') setAcademicYears(yrRes.data.data || []);
      } catch (err) {
        console.error('Failed to load academic configs:', err);
      }
    };
    loadMasters();
  }, []);

  // Fetch timetable slots & approval status when filters change
  useEffect(() => {
    if (selectedDept && selectedSem && selectedSec && selectedYear) {
      fetchTimetable();
    }
  }, [selectedDept, selectedSem, selectedSec, selectedYear]);

  const fetchTimetable = async () => {
    setIsLoading(true);
    try {
      const slotsRes = await api.get('/timetable/slots', {
        params: {
          sectionId: selectedSec,
          departmentId: selectedDept,
          semesterId: selectedSem
        }
      });
      const statusRes = await api.get('/timetable/publish-status', {
        params: {
          departmentId: selectedDept,
          semesterId: selectedSem,
          academicYearId: selectedYear
        }
      });

      if (slotsRes.data?.status === 'success') {
        setTimetableSlots(slotsRes.data.data || []);
      }
      if (statusRes.data?.status === 'success') {
        setPublishStatus(statusRes.data.data?.status || 'DRAFT');
      }
    } catch (err) {
      toast.error('Failed to load timetable.');
    } finally {
      setIsLoading(false);
    }
  };

  // Add timetable slot
  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSlot.subjectId || !formSlot.facultyId || !formSlot.roomNo) {
      toast.error('Please fill in all slot details.');
      return;
    }

    try {
      setIsSubmitLoading(true);
      const res = await api.post('/timetable/slots', {
        ...formSlot,
        academicYearId: selectedYear,
        departmentId: selectedDept,
        semesterId: selectedSem,
        sectionId: selectedSec
      });

      if (res.data?.status === 'success') {
        toast.success('Timetable slot added successfully.');
        setIsAddOpen(false);
        setFormSlot({
          dayOfWeek: 'MONDAY',
          slotIndex: '1',
          startTime: '09:00',
          endTime: '09:50',
          subjectId: '',
          facultyId: '',
          roomNo: '',
          isLab: false
        });
        fetchTimetable();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Conflict detected. Slot not created.');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  // Delete slot
  const handleDeleteSlot = async (id: string) => {
    if (!confirm('Are you sure you want to remove this slot?')) return;
    try {
      const res = await api.delete(`/timetable/slots/${id}`);
      if (res.data?.status === 'success') {
        toast.success('Slot removed.');
        fetchTimetable();
      }
    } catch (err) {
      toast.error('Failed to remove slot.');
    }
  };

  // Trigger AI Auto Generator
  const handleAutoGenerate = async () => {
    if (!selectedDept || !selectedSem || !selectedYear) {
      toast.error('Please select Department, Semester, and Academic Year first.');
      return;
    }
    if (!confirm('Auto generation will overwrite all current timetable slots for this department and semester. Proceed?')) return;

    try {
      setIsLoading(true);
      const res = await api.post('/timetable/ai-generate', {
        departmentId: selectedDept,
        semesterId: selectedSem,
        academicYearId: selectedYear
      });

      if (res.data?.status === 'success') {
        toast.success('AI Timetable generated successfully.');
        fetchTimetable();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to auto-generate timetable.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit timetable draft to Academic Dean
  const handleSubmitReview = async () => {
    try {
      const res = await api.post('/timetable/submit-review', {
        departmentId: selectedDept,
        semesterId: selectedSem,
        academicYearId: selectedYear
      });
      if (res.data?.status === 'success') {
        toast.success('Timetable submitted for Academic Dean review.');
        setPublishStatus('HOD_REVIEW');
      }
    } catch (err) {
      toast.error('Failed to submit review.');
    }
  };

  // Find slot mapping helper
  const getSlotDetails = (day: string, slotIdx: number) => {
    return timetableSlots.find(s => s.dayOfWeek === day && s.slotIndex === slotIdx);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary animate-pulse" />
            Timetable Engine
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Prepare, analyze, auto-generate, and publish conflicts-free institutional timetables.
          </p>
        </div>
        
        {/* Quick actions depending on publish status */}
        {selectedSec && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleAutoGenerate}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Auto Timetable Generator
            </button>

            {publishStatus === 'DRAFT' && (
              <button
                onClick={handleSubmitReview}
                className="px-3.5 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold shadow flex items-center gap-1.5 transition-colors"
              >
                <Send className="h-3.5 w-3.5" />
                Submit to Dean
              </button>
            )}

            <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
              publishStatus === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              publishStatus === 'HOD_REVIEW' ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
              'bg-slate-50 text-slate-700 border-slate-200'
            }`}>
              Status: {publishStatus.replace('_', ' ')}
            </span>
          </div>
        )}
      </div>

      {/* Filter Selection Panel */}
      <div className="border bg-card p-4 rounded-xl shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-semibold">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-bold text-muted-foreground">Department</label>
          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="h-9 border rounded-lg bg-background px-2"
          >
            <option value="">Select Department</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-bold text-muted-foreground">Semester</label>
          <select
            value={selectedSem}
            onChange={e => setSelectedSem(e.target.value)}
            className="h-9 border rounded-lg bg-background px-2"
          >
            <option value="">Select Semester</option>
            {semesters.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-bold text-muted-foreground">Section</label>
          <select
            value={selectedSec}
            onChange={e => setSelectedSec(e.target.value)}
            className="h-9 border rounded-lg bg-background px-2"
          >
            <option value="">Select Section</option>
            {sections.filter(s => s.semesterId === selectedSem).map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-bold text-muted-foreground">Academic Year</label>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
            className="h-9 border rounded-lg bg-background px-2"
          >
            <option value="">Select Year</option>
            {academicYears.map(y => (
              <option key={y.id} value={y.id}>{y.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Workspace */}
      {!selectedSec ? (
        <div className="border bg-card p-12 text-center rounded-xl flex flex-col items-center justify-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Layers className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm font-bold text-foreground">Select filters to get started</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            Pick department, semester, section, and year from above to construct, auto-allocate, or view the timetable.
          </p>
        </div>
      ) : isLoading ? (
        <div className="border bg-card p-12 text-center rounded-xl flex items-center justify-center">
          <RefreshCw className="h-6 w-6 text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Main Grid View */}
          <div className="border bg-card p-5 rounded-xl shadow-sm lg:col-span-3 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-extrabold uppercase flex items-center gap-1.5">
                <Grid className="h-4 w-4 text-indigo-500" />
                Timetable Matrix
              </h3>
              {publishStatus === 'DRAFT' && (
                <button
                  onClick={() => setIsAddOpen(true)}
                  className="h-7 px-3 bg-primary text-primary-foreground font-bold text-xs rounded-lg flex items-center gap-1 hover:bg-primary/95 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Manual Slot
                </button>
              )}
            </div>

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
                                  <span className="truncate">{slot.faculty?.firstName} {slot.faculty?.lastName[0]}.</span>
                                  <span className="bg-background px-1 border rounded">{slot.roomNo}</span>
                                </div>

                                {publishStatus === 'DRAFT' && (
                                  <button
                                    onClick={() => handleDeleteSlot(slot.id)}
                                    className="absolute top-1.5 right-1.5 p-1 bg-white hover:bg-rose-50 text-rose-500 rounded border border-rose-100 hover:border-rose-300 opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="h-full flex items-center justify-center text-muted-foreground/30 text-[9px] font-bold italic">
                                Empty
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

          {/* Timing details & legends */}
          <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold uppercase border-b pb-3 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-emerald-500" />
              Timing Schedules
            </h3>

            <div className="space-y-2 text-xs font-semibold">
              <div className="flex justify-between py-1.5 border-b">
                <span>Period 1</span>
                <span className="font-mono text-muted-foreground">09:00 - 09:50</span>
              </div>
              <div className="flex justify-between py-1.5 border-b">
                <span>Period 2</span>
                <span className="font-mono text-muted-foreground">09:50 - 10:40</span>
              </div>
              <div className="flex justify-between py-1.5 border-b text-amber-600 font-bold bg-amber-50/50 px-2 rounded">
                <span>Tea Break</span>
                <span className="font-mono">10:40 - 11:00</span>
              </div>
              <div className="flex justify-between py-1.5 border-b">
                <span>Period 3</span>
                <span className="font-mono text-muted-foreground">11:00 - 11:50</span>
              </div>
              <div className="flex justify-between py-1.5 border-b">
                <span>Period 4</span>
                <span className="font-mono text-muted-foreground">11:50 - 12:40</span>
              </div>
              <div className="flex justify-between py-1.5 border-b text-amber-600 font-bold bg-amber-50/50 px-2 rounded">
                <span>Lunch Break</span>
                <span className="font-mono">12:40 - 01:30</span>
              </div>
              <div className="flex justify-between py-1.5 border-b">
                <span>Period 5</span>
                <span className="font-mono text-muted-foreground">01:30 - 02:20</span>
              </div>
              <div className="flex justify-between py-1.5 border-b">
                <span>Period 6</span>
                <span className="font-mono text-muted-foreground">02:20 - 03:10</span>
              </div>
              <div className="flex justify-between py-1.5 border-b">
                <span>Period 7</span>
                <span className="font-mono text-muted-foreground">03:10 - 04:00</span>
              </div>
            </div>
            
            <div className="bg-muted/30 border rounded-lg p-3 space-y-2 text-[10px]">
              <p className="font-extrabold uppercase text-muted-foreground tracking-wider">Conflict Detection</p>
              <p className="text-muted-foreground leading-relaxed">
                The Timetable Engine auto-scans for conflicts dynamically:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Faculty Clashes (two classes at same time)</li>
                <li>Classroom / Lab Clashes</li>
                <li>Period & Year allocation rules</li>
              </ul>
            </div>
          </div>

        </div>
      )}

      {/* Manual Slot Creator Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="border bg-card rounded-xl shadow-lg w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-sm font-extrabold uppercase border-b pb-2 mb-4">Add Manual Timetable Slot</h3>
            
            <form onSubmit={handleAddSlot} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Day of Week</label>
                  <select
                    value={formSlot.dayOfWeek}
                    onChange={e => setFormSlot({ ...formSlot, dayOfWeek: e.target.value })}
                    className="h-9 border rounded-lg bg-background px-2"
                  >
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Period Index</label>
                  <select
                    value={formSlot.slotIndex}
                    onChange={e => setFormSlot({ ...formSlot, slotIndex: e.target.value })}
                    className="h-9 border rounded-lg bg-background px-2"
                  >
                    {SLOTS.map(s => <option key={s} value={String(s)}>Period {s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Start Time</label>
                  <input
                    type="text"
                    required
                    value={formSlot.startTime}
                    onChange={e => setFormSlot({ ...formSlot, startTime: e.target.value })}
                    placeholder="09:00"
                    className="h-9 border rounded-lg bg-background px-3"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">End Time</label>
                  <input
                    type="text"
                    required
                    value={formSlot.endTime}
                    onChange={e => setFormSlot({ ...formSlot, endTime: e.target.value })}
                    placeholder="09:50"
                    className="h-9 border rounded-lg bg-background px-3"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Subject</label>
                <select
                  value={formSlot.subjectId}
                  onChange={e => setFormSlot({ ...formSlot, subjectId: e.target.value })}
                  className="h-9 border rounded-lg bg-background px-2"
                >
                  <option value="">Select Subject</option>
                  {subjects.filter(s => s.departmentId === selectedDept).map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Faculty Member</label>
                <select
                  value={formSlot.facultyId}
                  onChange={e => setFormSlot({ ...formSlot, facultyId: e.target.value })}
                  className="h-9 border rounded-lg bg-background px-2"
                >
                  <option value="">Select Faculty</option>
                  {faculties.map(f => (
                    <option key={f.id} value={f.id}>{f.firstName} {f.lastName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Room / Lab No</label>
                  <input
                    type="text"
                    required
                    value={formSlot.roomNo}
                    onChange={e => setFormSlot({ ...formSlot, roomNo: e.target.value })}
                    placeholder="e.g. Lab 4B"
                    className="h-9 border rounded-lg bg-background px-3"
                  />
                </div>
                
                <div className="flex items-center gap-2 mt-4">
                  <input
                    type="checkbox"
                    id="isLabCheck"
                    checked={formSlot.isLab}
                    onChange={e => setFormSlot({ ...formSlot, isLab: e.target.checked })}
                    className="h-4 w-4 border rounded accent-primary"
                  />
                  <label htmlFor="isLabCheck" className="text-[10px] uppercase font-bold text-muted-foreground select-none">
                    Is Lab Session
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="h-9 px-4 border rounded-lg hover:bg-muted font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitLoading}
                  className="h-9 px-4 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/95 transition-colors flex items-center gap-1.5"
                >
                  {isSubmitLoading && <RefreshCw className="h-3 w-3 animate-spin" />}
                  Confirm Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
