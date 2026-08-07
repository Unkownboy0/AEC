import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Filter, Mail, Phone, ExternalLink, RefreshCw } from 'lucide-react';
import api from '../../../lib/axios';
import { DataTable, Column } from '../../../design-system/components/DataTable';
import { StatusBadge } from '../../../design-system/components/StatusBadge';
import { Skeleton } from '../../../design-system/components/Skeleton';
import { ErrorState } from '../../../design-system/components/ErrorState';

export const MentorStudentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignedStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/mentor/students');
      if (res.data?.status === 'success' || res.data?.success) {
        setStudents(res.data.data || []);
      } else if (Array.isArray(res.data)) {
        setStudents(res.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch assigned mentees:', err);
      setError(err.response?.data?.message || 'Failed to load assigned mentees list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedStudents();
  }, []);

  const columns: Column<any>[] = [
    {
      key: 'rollNo',
      header: 'Roll No',
      sortable: true,
      render: (st) => <span className="font-mono font-bold text-xs">{st.rollNo || st.regNo || 'N/A'}</span>,
    },
    {
      key: 'name',
      header: 'Student Name',
      sortable: true,
      render: (st) => (
        <div>
          <span className="font-bold text-xs text-foreground block">{st.name || `${st.firstName} ${st.lastName}`}</span>
          <span className="text-[10px] text-muted-foreground">{st.email || st.user?.email}</span>
        </div>
      ),
    },
    {
      key: 'section',
      header: 'Section / Batch',
      sortable: true,
      render: (st) => <span className="text-xs">{st.section || 'A'} • {st.batch || '2022-2026'}</span>,
    },
    {
      key: 'attendancePercentage',
      header: 'Attendance',
      sortable: true,
      render: (st) => {
        const att = st.attendancePercentage ?? st.attendance ?? 85;
        const isCritical = att < 75;
        return (
          <span className={`font-bold text-xs ${isCritical ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {att}%
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Standing',
      render: (st) => <StatusBadge status={st.status || 'ACTIVE'} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (st) => (
        <button
          onClick={() => navigate(`/faculty/mentor/students/${st.id}`)}
          className="px-2.5 py-1 bg-muted hover:bg-muted/80 text-foreground text-[11px] font-bold rounded-lg border border-border flex items-center gap-1 transition-colors"
        >
          View Profile <ExternalLink className="w-3 h-3" />
        </button>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-7xl mx-auto">
        <Skeleton variant="card" count={1} />
        <Skeleton variant="table" count={6} />
      </div>
    );
  }

  if (error && students.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <ErrorState title="Failed to Load Mentees" description={error} onRetry={fetchAssignedStudents} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in-50 duration-200">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border p-5 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
            <Users className="w-4 h-4" /> Mentor Workspace
          </div>
          <h1 className="text-xl font-extrabold text-foreground mt-0.5">Assigned Mentees</h1>
          <p className="text-xs text-muted-foreground">
            Total {students.length} students assigned to your advisement roster.
          </p>
        </div>

        <button
          onClick={fetchAssignedStudents}
          className="px-3 py-2 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh List
        </button>
      </div>

      <DataTable
        columns={columns}
        data={students}
        keyExtractor={(st) => String(st.id)}
        emptyTitle="No Mentees Assigned"
        emptyDescription="You have no students assigned under mentor advisement for the active term."
      />

    </div>
  );
};
