import React, { useState, useEffect } from 'react';
import {
  CalendarDays, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import {  } from '../../components/ui/Loading';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import api from '../../lib/axios';

export const Attendance: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [sectionFilter, setSectionFilter] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LATE'>>({});
  const [isLoading, setIsLoading] = useState(false);

  const fetchSections = async () => {
    try {
      const res = await api.get('/academics/sections?pageSize=100');
      setSections(res.data?.data || []);
      if (res.data?.data?.length > 0) {
        setSectionFilter(res.data.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudentsForSection = async () => {
    if (!sectionFilter) return;
    try {
      setIsLoading(true);
      const res = await api.get(`/enterprise/students?pageSize=100&sectionId=${sectionFilter}`);
      const studentsList = res.data?.data || [];
      setStudents(studentsList);
      
      // Initialize all to PRESENT
      const map: Record<string, 'PRESENT' | 'ABSENT' | 'LATE'> = {};
      studentsList.forEach((s: any) => {
        map[s.id] = 'PRESENT';
      });
      setAttendanceMap(map);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  useEffect(() => {
    fetchStudentsForSection();
  }, [sectionFilter]);

  const toggleStatus = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const saveAttendance = async () => {
    try {
      const records = Object.keys(attendanceMap).map(sid => ({
        studentId: sid,
        status: attendanceMap[sid],
        remarks: attendanceMap[sid] === 'ABSENT' ? 'Daily Rollcall Absent' : 'Present',
      }));

      const res = await api.post('/enterprise/attendance/bulk', {
        date: attendanceDate,
        type: 'DAILY',
        records,
      });

      if (res.data?.status === 'success') {
        toast.success(`Saved attendance sheet for ${res.data.data.count} students!`);
      }
    } catch (err) {
      toast.error('Failed to submit attendance rollcall sheet');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Attendance Center</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Perform daily student rollcalls, input period attendance sheets, and view monthly summary reports.
        </p>
      </div>

      <div className="border bg-card p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 flex flex-col gap-1.5 text-xs font-bold text-muted-foreground">
          <span>Date</span>
          <Input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} className="h-9" />
        </div>
        <div className="flex-1 flex flex-col gap-1.5 text-xs font-bold text-muted-foreground">
          <span>Select Class Section</span>
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="h-9 border rounded-lg bg-background px-3 text-xs"
          >
            {sections.map(s => <option key={s.id} value={s.id}>{s.name} ({s.semester?.name})</option>)}
          </select>
        </div>
        <Button variant="primary" className="h-9 text-xs" onClick={saveAttendance} disabled={students.length === 0}>
          Commit Rollcall Sheet
        </Button>
      </div>

      <div className="border bg-card rounded-xl p-5 shadow-sm space-y-4">
        {isLoading ? (
          <div className="space-y-3 py-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-muted/30 rounded animate-pulse" />
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CalendarDays className="h-8 w-8 mx-auto mb-2 text-neutral-400" />
            <p className="text-xs font-semibold">No students mapped to this section</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto max-w-[90vw] md:max-w-full pb-2 scrollbar-thin"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admission No</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead className="text-center">Rollcall Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => {
                const currentStatus = attendanceMap[student.id] || 'PRESENT';
                return (
                  <TableRow key={student.id}>
                    <TableCell className="font-mono text-xs">{student.admissionNo}</TableCell>
                    <TableCell className="font-bold">{student.firstName} {student.lastName}</TableCell>
                    <TableCell className="flex flex-wrap justify-center gap-2">
                      <button
                        onClick={() => toggleStatus(student.id, 'PRESENT')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all ${
                          currentStatus === 'PRESENT'
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        <CheckCircle className="h-3.5 w-3.5" /> Present
                      </button>
                      <button
                        onClick={() => toggleStatus(student.id, 'ABSENT')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all ${
                          currentStatus === 'ABSENT'
                            ? 'bg-red-500 text-white shadow-sm'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        <XCircle className="h-3.5 w-3.5" /> Absent
                      </button>
                      <button
                        onClick={() => toggleStatus(student.id, 'LATE')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all ${
                          currentStatus === 'LATE'
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        <AlertCircle className="h-3.5 w-3.5" /> Late
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table></div>
        )}
      </div>
    </div>
  );
};
