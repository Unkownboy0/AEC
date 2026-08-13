import React, { useState, useEffect } from 'react';
import {
  Plus, Award
} from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import api from '../../lib/axios';

export const Examinations: React.FC = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [marksRecord, setMarksRecord] = useState<any>(null); // State to open marks entry modal
  const [marksMap, setMarksMap] = useState<Record<string, { internal: number; external: number; practical: number }>>({});

  const fetchRelations = async () => {
    try {
      const [eRes, cRes, semRes, yRes, subRes] = await Promise.all([
        api.get('/enterprise/exams?pageSize=50'),
        api.get('/academics/courses?pageSize=50'),
        api.get('/academics/semesters?pageSize=50'),
        api.get('/academics/years?pageSize=50'),
        api.get('/academics/subjects?pageSize=50'),
      ]);
      setExams(eRes.data?.data || []);
      setCourses(cRes.data?.data || []);
      setSemesters(semRes.data?.data || []);
      setAcademicYears(yRes.data?.data || []);
      setSubjects(subRes.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRelations();
  }, []);

  const handleCreateExam = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: fd.get('name'),
      type: fd.get('type'),
      startDate: fd.get('startDate'),
      endDate: fd.get('endDate'),
      academicYearId: fd.get('academicYearId'),
      courseId: fd.get('courseId'),
      semesterId: fd.get('semesterId'),
      status: 'SCHEDULED',
    };

    try {
      const res = await api.post('/enterprise/exams', payload);
      if (res.data?.status === 'success') {
        toast.success('Exam schedule created successfully');
        setIsFormOpen(false);
        fetchRelations();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create exam');
    }
  };

  const openMarksEntry = async (exam: any) => {
    setMarksRecord(exam);
    try {
      // Fetch students for the exam course/semester
      const res = await api.get(`/enterprise/students?pageSize=100&courseId=${exam.courseId}&semesterId=${exam.semesterId}`);
      setStudents(res.data?.data || []);
      
      const initMap: Record<string, { internal: number; external: number; practical: number }> = {};
      (res.data?.data || []).forEach((s: any) => {
        initMap[s.id] = { internal: 0, external: 0, practical: 0 };
      });
      setMarksMap(initMap);
    } catch (err) {
      toast.error('Failed to load students for marks entry');
    }
  };

  const submitMarks = async () => {
    if (!marksRecord) return;
    const firstSubject = subjects.find(s => s.semesterId === marksRecord.semesterId);
    if (!firstSubject) {
      toast.error('No subjects registered under this semester for marks mapping');
      return;
    }

    try {
      let count = 0;
      for (const sid of Object.keys(marksMap)) {
        const val = marksMap[sid];
        await api.post('/enterprise/marks', {
          examId: marksRecord.id,
          studentId: sid,
          subjectId: firstSubject.id,
          internalMarks: val.internal,
          externalMarks: val.external,
          practicalMarks: val.practical,
          status: 'DRAFT',
        });
        count++;
      }
      toast.success(`Saved ${count} student mark records as draft`);
      setMarksRecord(null);
    } catch (err) {
      toast.error('Failed to save exam marks');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Examinations & Marks Entry</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Publish midterm timetables, allocate halls, invigilate seats, record internal/external marks, and export transcript grade reports.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-1 h-4 w-4" /> Create Exam Schedule
        </Button>
      </div>

      {/* Timetable schedule grid */}
      <div className="border bg-card rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-xs uppercase font-extrabold tracking-wider text-muted-foreground">Timetables</h3>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-muted/30 rounded animate-pulse" />)}
          </div>
        ) : exams.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">No exams scheduled currently</p>
        ) : (
          <div className="w-full overflow-x-auto max-w-[90vw] md:max-w-full pb-2 scrollbar-thin"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Semester / Course</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-bold">{row.name}</TableCell>
                  <TableCell>{row.type}</TableCell>
                  <TableCell>{new Date(row.startDate).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(row.endDate).toLocaleDateString()}</TableCell>
                  <TableCell>{row.semester?.name} ({row.course?.code})</TableCell>
                  <TableCell className="text-right space-x-1.5">
                    <button
                      onClick={() => openMarksEntry(row)}
                      className="inline-flex flex-wrap items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-indigo-500/10 text-indigo-600 rounded hover:bg-indigo-500/20"
                    >
                      <Award className="h-3 w-3" /> Input Marks
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        )}
      </div>

      {/* Create Exam Dialog */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Create Exam Schedule">
        <form onSubmit={handleCreateExam} className="space-y-4 p-4 text-xs font-semibold">
          <Input label="Exam Term Name" name="name" required />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Type</label>
              <select name="type" className="h-10 border rounded bg-background px-3">
                <option value="INTERNAL">Internal Assessment</option>
                <option value="EXTERNAL">Semester End Practical/Theory</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Academic Year</label>
              <select name="academicYearId" required className="h-10 border rounded bg-background px-3">
                {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Start Date" name="startDate" type="date" required />
            <Input label="End Date" name="endDate" type="date" required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Course</label>
              <select name="courseId" required className="h-10 border rounded bg-background px-3">
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Semester</label>
              <select name="semesterId" required className="h-10 border rounded bg-background px-3">
                {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Create Schedule</Button>
          </div>
        </form>
      </Modal>

      {/* Marks Entry Modal */}
      <Modal isOpen={!!marksRecord} onClose={() => setMarksRecord(null)} title="Semester Marks Assessment Roll">
        {marksRecord && (
          <div className="p-4 space-y-4 text-xs font-semibold">
            <p className="text-muted-foreground">
              Input scores for the scheduled midterm. (Assigned Subject: {subjects.find(s => s.semesterId === marksRecord.semesterId)?.name || 'General Coursework'})
            </p>
            <div className="w-full overflow-x-auto max-w-[90vw] md:max-w-full pb-2 scrollbar-thin"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admission No</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead className="w-[80px]">Internal (40)</TableHead>
                  <TableHead className="w-[80px]">External (60)</TableHead>
                  <TableHead className="w-[80px]">Practical (20)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => {
                  const val = marksMap[student.id] || { internal: 0, external: 0, practical: 0 };
                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-mono">{student.admissionNo}</TableCell>
                      <TableCell className="font-bold">{student.firstName} {student.lastName}</TableCell>
                      <TableCell>
                        <input
                          type="number"
                          value={val.internal}
                          onChange={(e) => setMarksMap(prev => ({
                            ...prev,
                            [student.id]: { ...val, internal: parseInt(e.target.value) || 0 }
                          }))}
                          className="w-16 border rounded p-1 text-center font-bold bg-background"
                        />
                      </TableCell>
                      <TableCell>
                        <input
                          type="number"
                          value={val.external}
                          onChange={(e) => setMarksMap(prev => ({
                            ...prev,
                            [student.id]: { ...val, external: parseInt(e.target.value) || 0 }
                          }))}
                          className="w-16 border rounded p-1 text-center font-bold bg-background"
                        />
                      </TableCell>
                      <TableCell>
                        <input
                          type="number"
                          value={val.practical}
                          onChange={(e) => setMarksMap(prev => ({
                            ...prev,
                            [student.id]: { ...val, practical: parseInt(e.target.value) || 0 }
                          }))}
                          className="w-16 border rounded p-1 text-center font-bold bg-background"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table></div>
            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setMarksRecord(null)}>Cancel</Button>
              <Button variant="primary" onClick={submitMarks}>Publish Grades</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
