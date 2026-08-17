import React, { useEffect, useMemo, useState } from 'react';
import { Award, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';
import api from '../../lib/axios';

interface MarkRecord {
  id: string;
  internalMarks: number;
  externalMarks: number;
  practicalMarks: number;
  grade: string;
  status: string;
  exam: { id: string; name: string };
  subject: { code: string; name: string; credits?: number };
}

/*
  Results are real, student-scoped data from GET /enterprise/marks (the same
  endpoint Faculty use to enter marks — SecurityHelper.applySecurityFilters
  restricts a Student caller to their own studentId server-side). Only
  PUBLISHED marks are shown — DRAFT rows are still being entered by faculty
  and aren't a real result yet. There is no CGPA/transcript computation or
  transcript-export endpoint anywhere in the backend, so this page does not
  show a CGPA trend or a "download transcript" action — showing either would
  be fabricated data, not a real feature.
*/
export const StudentResults: React.FC = () => {
  const [marks, setMarks] = useState<MarkRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedExam, setSelectedExam] = useState<string>('');

  const fetchMarks = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.get('/enterprise/marks', { params: { pageSize: 200 } });
      const items: MarkRecord[] = (res.data?.data || []).filter((m: MarkRecord) => m.status === 'PUBLISHED');
      setMarks(items);
      if (items.length > 0) setSelectedExam((prev) => prev || items[0].exam?.name || '');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to load results.');
      toast.error('Failed to load results.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMarks();
  }, []);

  const examNames = useMemo(
    () => Array.from(new Set(marks.map((m) => m.exam?.name).filter(Boolean))),
    [marks]
  );
  const visibleMarks = marks.filter((m) => m.exam?.name === selectedExam);

  if (isLoading) return <Loading text="Loading Results..." />;

  return (
    <div className="space-y-6 text-left pb-12 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Award className="h-5 w-5 text-indigo-600" /> Academic Results
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Published exam results, by exam</p>
        </div>
      </div>

      {error && (
        <div className="border bg-card p-6 rounded-2xl shadow-sm text-center">
          <AlertCircle className="mx-auto h-6 w-6 text-rose-500" />
          <p className="mt-2 text-xs text-muted-foreground">{error}</p>
          <button onClick={fetchMarks} className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl">
            <RefreshCw className="h-3.5 w-3.5" /> Try again
          </button>
        </div>
      )}

      {!error && marks.length === 0 && (
        <div className="border-2 border-dashed rounded-2xl p-12 text-center bg-card">
          <Award className="h-8 w-8 text-slate-300 mx-auto" />
          <h3 className="mt-3 text-sm font-extrabold text-slate-800 dark:text-white">No results published yet</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
            Once your faculty submit marks and they are published by the examination office, your results will appear here.
          </p>
        </div>
      )}

      {!error && marks.length > 0 && (
        <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex border rounded-xl overflow-hidden text-xs font-bold w-fit bg-card">
            {examNames.map((name) => (
              <button
                key={name}
                onClick={() => setSelectedExam(name)}
                className={`px-4 py-2.5 border-r last:border-r-0 transition-colors ${
                  selectedExam === name ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'
                }`}
              >
                {name}
              </button>
            ))}
          </div>

          <div className="border rounded-2xl shadow-sm overflow-hidden bg-background overflow-x-auto">
            <table className="w-full border-collapse text-xs font-semibold min-w-[560px]">
              <thead>
                <tr className="border-b bg-muted/20 text-[9px] uppercase font-black text-slate-400 tracking-wider">
                  <th className="p-4 text-left">Subject details</th>
                  <th className="p-4 text-center">Internal</th>
                  <th className="p-4 text-center">External</th>
                  <th className="p-4 text-center">Total</th>
                  <th className="p-4 text-center">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {visibleMarks.map((rec) => (
                  <tr key={rec.id} className="hover:bg-muted/10 transition-colors">
                    <td className="p-4 text-left">
                      <span className="font-extrabold text-slate-800 dark:text-white block">{rec.subject?.name}</span>
                      <span className="text-[9px] font-mono text-slate-400 block mt-0.5">{rec.subject?.code}</span>
                    </td>
                    <td className="p-4 text-center font-bold text-slate-700">{rec.internalMarks}</td>
                    <td className="p-4 text-center font-bold text-slate-700">{rec.externalMarks}</td>
                    <td className="p-4 text-center font-extrabold text-slate-900">
                      {rec.internalMarks + rec.externalMarks + rec.practicalMarks}
                    </td>
                    <td className="p-4 text-center font-mono font-black text-indigo-600">{rec.grade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentResults;
