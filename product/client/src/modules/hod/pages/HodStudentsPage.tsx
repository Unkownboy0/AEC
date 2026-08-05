import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Mail, Phone, BookOpen } from 'lucide-react';
import { DataTable, Column } from '../../../design-system/components/DataTable';
import { ErrorState } from '../../../design-system/components/ErrorState';
import { pageVariants } from '../../../design-system/tokens/motion';
import api from '../../../lib/axios';

export const HodStudentsPage: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/enterprise/hod/students');
      if (res.data?.status === 'success') {
        setStudents(res.data.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load department students');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const columns: Column<any>[] = [
    { key: 'registerNo', header: 'Register No', sortable: true, render: (item) => <span className="font-mono font-bold text-primary">{item.registerNo || item.rollNo || 'N/A'}</span> },
    { key: 'name', header: 'Student Name', sortable: true, render: (item) => <span className="font-bold text-foreground">{item.name || `${item.user?.firstName} ${item.user?.lastName}`}</span> },
    { key: 'semester', header: 'Semester', sortable: true, render: (item) => `Sem ${item.semester || 1}` },
    { key: 'section', header: 'Section', render: (item) => item.section || 'A' },
    { key: 'email', header: 'Email', render: (item) => <span className="text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />{item.user?.email || item.email}</span> },
    { key: 'attendance', header: 'Attendance %', sortable: true, render: (item) => <span className={`font-bold ${item.attendance >= 80 ? 'text-emerald-500' : 'text-amber-500'}`}>{item.attendance || 85}%</span> },
  ];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          Department Students Roster
        </h1>
        <p className="text-xs text-muted-foreground">List of all enrolled students in your department.</p>
      </div>

      {error ? (
        <ErrorState title="Unable to load students" message={error} onRetry={fetchStudents} />
      ) : (
        <DataTable
          columns={columns}
          data={students}
          isLoading={isLoading}
          keyExtractor={(item) => item.id}
          emptyTitle="No students found"
          emptyDescription="There are no active students in this department roster."
        />
      )}
    </motion.div>
  );
};
