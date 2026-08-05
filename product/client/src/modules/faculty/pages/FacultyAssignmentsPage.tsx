import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, Calendar, CheckSquare } from 'lucide-react';
import { DataTable, Column } from '../../../design-system/components/DataTable';
import { StatusBadge } from '../../../design-system/components/StatusBadge';
import { ErrorState } from '../../../design-system/components/ErrorState';
import { pageVariants } from '../../../design-system/tokens/motion';
import api from '../../../lib/axios';

export const FacultyAssignmentsPage: React.FC = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/assignments');
      if (res.data?.status === 'success') {
        setAssignments(res.data.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load coursework & assignments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const columns: Column<any>[] = [
    { key: 'title', header: 'Assignment Title', sortable: true, render: (item) => <span className="font-bold text-foreground">{item.title}</span> },
    { key: 'subject', header: 'Subject', sortable: true, render: (item) => item.subjectName || item.subjectCode || 'Coursework' },
    { key: 'dueDate', header: 'Due Date', sortable: true, render: (item) => item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'No Deadline' },
    { key: 'submissions', header: 'Submissions', render: (item) => `${item.submissionCount || 0} / ${item.totalStudents || 60}` },
    { key: 'status', header: 'Status', render: (item) => <StatusBadge status={item.status || 'PUBLISHED'} /> },
  ];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Course Assignments & Homework
          </h1>
          <p className="text-xs text-muted-foreground">Manage coursework, deadlines, and student submissions.</p>
        </div>
      </div>

      {error ? (
        <ErrorState title="Unable to load assignments" message={error} onRetry={fetchAssignments} />
      ) : (
        <DataTable
          columns={columns}
          data={assignments}
          isLoading={isLoading}
          keyExtractor={(item) => item.id}
          emptyTitle="No assignments published"
          emptyDescription="You have not created any coursework assignments yet."
        />
      )}
    </motion.div>
  );
};
