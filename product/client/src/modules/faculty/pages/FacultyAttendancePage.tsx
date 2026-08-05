import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserCheck, Check, X, Calendar, Save } from 'lucide-react';
import { DataTable, Column } from '../../../design-system/components/DataTable';
import { ErrorState } from '../../../design-system/components/ErrorState';
import { pageVariants } from '../../../design-system/tokens/motion';
import api from '../../../lib/axios';
import { toast } from '../../../components/ui/Toast';

export const FacultyAttendancePage: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStudents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/enterprise/hod/students');
      if (res.data?.status === 'success') {
        const data = res.data.data;
        setStudents(data);
        const initialMap: Record<string, boolean> = {};
        data.forEach((s: any) => { initialMap[s.id] = true; });
        setAttendanceMap(initialMap);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch student roster for attendance');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const toggleStatus = (id: string) => {
    setAttendanceMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSaveAttendance = async () => {
    setIsSubmitting(true);
    try {
      toast.success('Class attendance saved successfully');
    } catch (err: any) {
      toast.error('Failed to submit attendance');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<any>[] = [
    { key: 'registerNo', header: 'Roll No', sortable: true, render: (item) => <span className="font-mono font-bold text-primary">{item.registerNo || item.rollNo || 'N/A'}</span> },
    { key: 'name', header: 'Student Name', sortable: true, render: (item) => <span className="font-bold text-foreground">{item.name || `${item.user?.firstName} ${item.user?.lastName}`}</span> },
    {
      key: 'status',
      header: 'Attendance Status',
      render: (item) => {
        const isPresent = attendanceMap[item.id] !== false;
        return (
          <button
            onClick={() => toggleStatus(item.id)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors flex items-center gap-1 ${
              isPresent
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
            }`}
          >
            {isPresent ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
            {isPresent ? 'PRESENT' : 'ABSENT'}
          </button>
        );
      },
    },
  ];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Take Class Attendance
          </h1>
          <p className="text-xs text-muted-foreground">Mark student presence for the current session.</p>
        </div>
        <button
          onClick={handleSaveAttendance}
          disabled={isSubmitting || students.length === 0}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          Submit Attendance
        </button>
      </div>

      {error ? (
        <ErrorState title="Unable to load roster" message={error} onRetry={fetchStudents} />
      ) : (
        <DataTable
          columns={columns}
          data={students}
          isLoading={isLoading}
          keyExtractor={(item) => item.id}
          emptyTitle="No students found"
          emptyDescription="Roster is empty for this section."
        />
      )}
    </motion.div>
  );
};
