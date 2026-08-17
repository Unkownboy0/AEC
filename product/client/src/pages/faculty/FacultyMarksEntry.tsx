import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Award, Save, Send, RefreshCw } from 'lucide-react';
import api from '../../lib/axios';
import { toast } from '../../components/ui/Toast';

interface MarksRow {
  internal: string;
  external: string;
  practical: string;
  status: string;
}

const emptyRow: MarksRow = { internal: '', external: '', practical: '', status: '' };

export const FacultyMarksEntry: React.FC = () => {
  const [subjectAssignments, setSubjectAssignments] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [loadingContext, setLoadingContext] = useState(true);

  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('');

  const [students, setStudents] = useState<any[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [marksMap, setMarksMap] = useState<Record<string, MarksRow>>({});
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  const selectedAssignment = useMemo(
    () => subjectAssignments.find((s) => s.id === selectedAssignmentId) || null,
    [subjectAssignments, selectedAssignmentId]
  );

  const selectedExam = useMemo(
    () => exams.find((e) => e.id === selectedExamId) || null,
    [exams, selectedExamId]
  );

  const examOptions = useMemo(() => {
    if (!selectedAssignment) return exams;
    const filtered = exams.filter((e) => e.semesterId === selectedAssignment.semesterId);
    return filtered.length > 0 ? filtered : exams;
  }, [exams, selectedAssignment]);

  const loadContext = useCallback(async () => {
    setLoadingContext(true);
    try {
      const [subjectsRes, examsRes] = await Promise.all([
        api.get('/faculty/subjects'),
        api.get('/enterprise/exams?pageSize=100'),
      ]);
      const subjectsData = subjectsRes.data?.data || (subjectsRes.data?.success ? subjectsRes.data.data : []);
      setSubjectAssignments(Array.isArray(subjectsData) ? subjectsData : []);
      setExams(examsRes.data?.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load subjects/exams for marks entry.');
    } finally {
      setLoadingContext(false);
    }
  }, []);

  useEffect(() => {
    loadContext();
  }, [loadContext]);

  const loadRosterAndMarks = useCallback(async () => {
    if (!selectedAssignment || !selectedExamId) return;
    setLoadingRoster(true);
    setDirtyIds(new Set());
    try {
      const [studentsRes, marksRes] = await Promise.all([
        api.get('/enterprise/students', { params: { semesterId: selectedAssignment.semesterId, pageSize: 300 } }),
        api.get('/enterprise/marks', { params: { examId: selectedExamId, subjectId: selectedAssignment.subjectId, pageSize: 300 } }),
      ]);

      const allStudents = studentsRes.data?.data || [];
      const roster = allStudents.filter((s: any) => (s.section?.id || s.sectionId) === selectedAssignment.sectionId);
      roster.sort((a: any, b: any) => (a.firstName || '').localeCompare(b.firstName || ''));
      setStudents(roster);

      const existingMarks = marksRes.data?.data || [];
      const marksByStudent: Record<string, any> = {};
      existingMarks.forEach((m: any) => { marksByStudent[m.studentId] = m; });

      const nextMap: Record<string, MarksRow> = {};
      roster.forEach((s: any) => {
        const existing = marksByStudent[s.id];
        nextMap[s.id] = existing
          ? {
              internal: String(existing.internalMarks ?? ''),
              external: String(existing.externalMarks ?? ''),
              practical: String(existing.practicalMarks ?? ''),
              status: existing.status || '',
            }
          : { ...emptyRow };
      });
      setMarksMap(nextMap);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load roster or existing marks.');
    } finally {
      setLoadingRoster(false);
    }
  }, [selectedAssignment, selectedExamId]);

  useEffect(() => {
    if (selectedAssignmentId && selectedExamId) loadRosterAndMarks();
    else { setStudents([]); setMarksMap({}); }
  }, [selectedAssignmentId, selectedExamId, loadRosterAndMarks]);

  const updateField = (studentId: string, field: 'internal' | 'external' | 'practical', value: string) => {
    setMarksMap((prev) => ({ ...prev, [studentId]: { ...(prev[studentId] || emptyRow), [field]: value } }));
    setDirtyIds((prev) => new Set(prev).add(studentId));
  };

  const isLocked = (studentId: string) => ['LOCKED', 'PUBLISHED'].includes(marksMap[studentId]?.status);

  const handleSave = async (targetStatus: 'DRAFT' | 'SUBMITTED') => {
    if (!selectedAssignment || !selectedExamId) return;
    const idsToSave = Array.from(dirtyIds).filter((id) => !isLocked(id));
    if (idsToSave.length === 0) {
      toast.error('Enter marks for at least one student before saving.');
      return;
    }
    setIsSaving(true);
    try {
      const results = await Promise.allSettled(
        idsToSave.map((studentId) => {
          const row = marksMap[studentId];
          return api.post('/enterprise/marks', {
            examId: selectedExamId,
            studentId,
            subjectId: selectedAssignment.subjectId,
            internalMarks: Number(row.internal) || 0,
            externalMarks: Number(row.external) || 0,
            practicalMarks: Number(row.practical) || 0,
            status: targetStatus,
          });
        })
      );

      const failures = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
      const succeeded = results.length - failures.length;

      if (succeeded > 0) {
        toast.success(`Saved marks for ${succeeded} student${succeeded === 1 ? '' : 's'} as ${targetStatus === 'DRAFT' ? 'draft' : 'submitted'}.`);
      }
      if (failures.length > 0) {
        const firstMessage = failures[0].reason?.response?.data?.message || failures[0].reason?.message || 'Unknown error';
        toast.error(`Failed to save marks for ${failures.length} student${failures.length === 1 ? '' : 's'}: ${firstMessage}`);
      }
      loadRosterAndMarks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save marks.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 bg-background text-foreground">
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-2xl border border-border">
        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
          <Award className="h-4 w-4" />
          Internal Marks Entry
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Exam Marks & Assessment Roll</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Select an exam and one of your assigned subjects to enter internal, external, and practical marks for your students.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1.5">Subject & Class</label>
            <select
              value={selectedAssignmentId}
              onChange={(e) => setSelectedAssignmentId(e.target.value)}
              disabled={loadingContext}
              className="w-full h-10 bg-background border border-border rounded-xl px-3 text-xs font-semibold"
            >
              <option value="">-- Select your subject --</option>
              {subjectAssignments.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.subject?.code ? `${s.subject.code} — ` : ''}{s.subject?.name || 'Untitled Subject'} ({s.section?.name || 'Section N/A'})
                </option>
              ))}
            </select>
            {!loadingContext && subjectAssignments.length === 0 && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">No subjects are currently assigned to you.</p>
            )}
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1.5">Exam</label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              disabled={loadingContext || !selectedAssignmentId}
              className="w-full h-10 bg-background border border-border rounded-xl px-3 text-xs font-semibold disabled:opacity-50"
            >
              <option value="">-- Select exam --</option>
              {examOptions.map((e) => (
                <option key={e.id} value={e.id}>{e.name} ({e.type})</option>
              ))}
            </select>
            {!loadingContext && selectedAssignmentId && examOptions.length === 0 && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">No exams have been scheduled yet.</p>
            )}
          </div>
        </div>

        {selectedAssignment && selectedExam && (
          <div className="flex items-center justify-between border-t border-border pt-3">
            <p className="text-[11px] text-muted-foreground">
              Max marks — Internal: <strong className="text-foreground">{selectedAssignment.subject?.internalMarks ?? 40}</strong> · External: <strong className="text-foreground">{selectedAssignment.subject?.externalMarks ?? 60}</strong>
            </p>
            <button onClick={loadRosterAndMarks} className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold flex items-center gap-1">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>
        )}
      </div>

      {selectedAssignmentId && selectedExamId && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {loadingRoster ? (
            <div className="text-center py-12 text-xs text-muted-foreground">Loading roster…</div>
          ) : students.length === 0 ? (
            <div className="text-center py-12 text-xs text-muted-foreground">No students found for this subject's section.</div>
          ) : (
            <>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border text-[10px] uppercase text-muted-foreground font-bold">
                      <th className="p-3">Admission No</th>
                      <th className="p-3">Student Name</th>
                      <th className="p-3 w-24">Internal</th>
                      <th className="p-3 w-24">External</th>
                      <th className="p-3 w-24">Practical</th>
                      <th className="p-3">Saved Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => {
                      const row = marksMap[student.id] || emptyRow;
                      const locked = isLocked(student.id);
                      return (
                        <tr key={student.id} className="border-b border-border/60">
                          <td className="p-3 font-mono">{student.admissionNo}</td>
                          <td className="p-3 font-bold">{student.firstName} {student.lastName}</td>
                          <td className="p-3">
                            <input
                              type="number"
                              min={0}
                              disabled={locked}
                              value={row.internal}
                              onChange={(e) => updateField(student.id, 'internal', e.target.value)}
                              className="w-16 border border-border rounded-lg p-1.5 text-center font-bold bg-background disabled:opacity-50"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              min={0}
                              disabled={locked}
                              value={row.external}
                              onChange={(e) => updateField(student.id, 'external', e.target.value)}
                              className="w-16 border border-border rounded-lg p-1.5 text-center font-bold bg-background disabled:opacity-50"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              min={0}
                              disabled={locked}
                              value={row.practical}
                              onChange={(e) => updateField(student.id, 'practical', e.target.value)}
                              className="w-16 border border-border rounded-lg p-1.5 text-center font-bold bg-background disabled:opacity-50"
                            />
                          </td>
                          <td className="p-3">
                            {row.status ? (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase ${
                                row.status === 'PUBLISHED' || row.status === 'LOCKED' ? 'bg-emerald-500/10 text-emerald-600' :
                                row.status === 'SUBMITTED' ? 'bg-blue-500/10 text-blue-600' :
                                'bg-amber-500/10 text-amber-600'
                              }`}>{row.status}</span>
                            ) : (
                              <span className="text-muted-foreground">Not entered</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap justify-end gap-2 p-4 border-t border-border">
                <button
                  onClick={() => handleSave('DRAFT')}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" /> Save as Draft
                </button>
                <button
                  onClick={() => handleSave('SUBMITTED')}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" /> {isSaving ? 'Saving…' : 'Submit Marks'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default FacultyMarksEntry;
