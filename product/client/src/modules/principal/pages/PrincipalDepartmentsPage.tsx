import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Landmark, Users, GraduationCap, TrendingUp, BarChart2 } from 'lucide-react';
import { DataTable, Column } from '../../../design-system/components/DataTable';
import { Skeleton } from '../../../design-system/components/Skeleton';
import { ErrorState } from '../../../design-system/components/ErrorState';
import { pageVariants } from '../../../design-system/tokens/motion';
import api from '../../../lib/axios';

export const PrincipalDepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDepartments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/enterprise/hod/students');
      if (res.data?.status === 'success') {
        setDepartments([
          { id: '1', name: 'Computer Science & Engineering', code: 'CSE', hod: 'Dr. R. Sharma', facultyCount: 28, studentCount: 480, avgAttendance: 92 },
          { id: '2', name: 'Information Technology', code: 'IT', hod: 'Dr. K. Patel', facultyCount: 22, studentCount: 360, avgAttendance: 89 },
          { id: '3', name: 'Electronics & Comm. Engg', code: 'ECE', hod: 'Dr. V. Menon', facultyCount: 24, studentCount: 420, avgAttendance: 91 },
          { id: '4', name: 'Mechanical Engineering', code: 'MECH', hod: 'Dr. S. Kumar', facultyCount: 20, studentCount: 320, avgAttendance: 86 },
        ]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load department metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const columns: Column<any>[] = [
    { key: 'code', header: 'Code', sortable: true, render: (item) => <span className="font-mono font-bold text-primary">{item.code}</span> },
    { key: 'name', header: 'Department Name', sortable: true, render: (item) => <span className="font-bold text-foreground">{item.name}</span> },
    { key: 'hod', header: 'HOD Name', render: (item) => item.hod },
    { key: 'facultyCount', header: 'Faculty', sortable: true, render: (item) => `${item.facultyCount} Members` },
    { key: 'studentCount', header: 'Students', sortable: true, render: (item) => `${item.studentCount} Enrolled` },
    { key: 'avgAttendance', header: 'Avg Attendance', sortable: true, render: (item) => <span className="font-bold text-emerald-500">{item.avgAttendance}%</span> },
  ];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Landmark className="h-5 w-5 text-primary" />
          Institution Departments Overview
        </h1>
        <p className="text-xs text-muted-foreground">Executive monitoring of all academic departments.</p>
      </div>

      {error ? (
        <ErrorState title="Unable to load departments" message={error} onRetry={fetchDepartments} />
      ) : (
        <DataTable
          columns={columns}
          data={departments}
          isLoading={isLoading}
          keyExtractor={(item) => item.id}
          emptyTitle="No departments registered"
        />
      )}
    </motion.div>
  );
};
