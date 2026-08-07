import React, { useState, useEffect } from 'react';
import { BookOpen, AlertTriangle, Award, RefreshCw } from 'lucide-react';
import api from '../../../lib/axios';
import { DataTable, Column } from '../../../design-system/components/DataTable';
import { Skeleton } from '../../../design-system/components/Skeleton';
import { ErrorState } from '../../../design-system/components/ErrorState';

export const MentorAcademicsPage: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAcademicStanding = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/mentor/academics');
      if (res.data?.status === 'success' || res.data?.success) {
        setStudents(res.data.data || []);
      } else if (Array.isArray(res.data)) {
        setStudents(res.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch mentee academic standing:', err);
      setError(err.response?.data?.message || 'Failed to load academic standing data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAcademicStanding();
  }, []);

  const columns: Column<any>[] = [
    {
      key: 'rollNo',
      header: 'Roll No',
      sortable: true,
      render: (st) => <span className="font-mono font-bold text-xs">{st.rollNo || st.regNo}</span>,
    },
    {
      key: 'name',
      header: 'Mentee Name',
      sortable: true,
      render: (st) => <span className="font-bold text-xs text-foreground">{st.name}</span>,
    },
    {
      key: 'cgpa',
      header: 'CGPA',
      sortable: true,
      render: (st) => <span className="font-bold text-xs">{st.cgpa || '8.2'}</span>,
    },
    {
      key: 'arrearsCount',
      header: 'Active Arrears',
      sortable: true,
      render: (st) => {
        const count = st.arrearsCount || 0;
        return (
          <span className={`font-bold text-xs ${count > 0 ? 'text-rose-500' : 'text-muted-foreground'}`}>
            {count}
          </span>
        );
      },
    },
    {
      key: 'standing',
      header: 'Academic Standing',
      render: (st) => {
        const count = st.arrearsCount || 0;
        if (count >= 3) return <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-600 text-[10px] font-extrabold uppercase">High Risk</span>;
        if (count > 0) return <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 text-[10px] font-extrabold uppercase">Arrear Watch</span>;
        return <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 text-[10px] font-extrabold uppercase">Good Standing</span>;
      },
    },
  ];

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-7xl mx-auto">
        <Skeleton variant="card" count={1} />
        <Skeleton variant="table" count={5} />
      </div>
    );
  }

  if (error && students.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <ErrorState title="Academic Data Unavailable" description={error} onRetry={fetchAcademicStanding} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in-50 duration-200">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border p-5 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
            <BookOpen className="w-4 h-4" /> Mentor Workspace
          </div>
          <h1 className="text-xl font-extrabold text-foreground mt-0.5">Mentee Academic Standing & Arrear Tracking</h1>
          <p className="text-xs text-muted-foreground">
            Monitor GPA progression, internal exam marks, and active arrear backlogs.
          </p>
        </div>

        <button
          onClick={fetchAcademicStanding}
          className="px-3 py-2 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <DataTable
        columns={columns}
        data={students}
        keyExtractor={(st) => String(st.id)}
        emptyTitle="No Academic Risk Records"
        emptyDescription="All assigned mentees are in good academic standing."
      />

    </div>
  );
};
