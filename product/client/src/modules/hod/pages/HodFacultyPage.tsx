import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Mail, BookOpen, UserCheck } from 'lucide-react';
import { DataTable, Column } from '../../../design-system/components/DataTable';
import { StatusBadge } from '../../../design-system/components/StatusBadge';
import { ErrorState } from '../../../design-system/components/ErrorState';
import { pageVariants } from '../../../design-system/tokens/motion';
import api from '../../../lib/axios';

export const HodFacultyPage: React.FC = () => {
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFaculty = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/enterprise/faculty');
      if (res.data?.status === 'success') {
        setFacultyList(res.data.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load faculty directory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  const columns: Column<any>[] = [
    { key: 'name', header: 'Faculty Name', sortable: true, render: (item) => <span className="font-bold text-foreground">{item.name || `${item.user?.firstName} ${item.user?.lastName}`}</span> },
    { key: 'designation', header: 'Designation', sortable: true, render: (item) => item.designation || 'Assistant Professor' },
    { key: 'email', header: 'Email', render: (item) => <span className="text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />{item.user?.email || item.email}</span> },
    { key: 'workload', header: 'Weekly Workload', render: (item) => `${item.weeklyHours || 16} hrs/week` },
    { key: 'status', header: 'Status', render: (item) => <StatusBadge status={item.status || 'ACTIVE'} /> },
  ];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Department Faculty Members
        </h1>
        <p className="text-xs text-muted-foreground">Directory of teaching staff and faculty workloads.</p>
      </div>

      {error ? (
        <ErrorState title="Unable to load faculty members" message={error} onRetry={fetchFaculty} />
      ) : (
        <DataTable
          columns={columns}
          data={facultyList}
          isLoading={isLoading}
          keyExtractor={(item) => item.id}
          emptyTitle="No faculty members found"
          emptyDescription="There are no faculty members assigned to this department."
        />
      )}
    </motion.div>
  );
};
