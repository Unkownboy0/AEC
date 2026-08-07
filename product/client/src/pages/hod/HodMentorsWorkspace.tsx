import React, { useState, useEffect } from 'react';
import { UserPlus, Users, Search, RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react';
import api from '../../lib/axios';
import { DataTable, Column } from '../../design-system/components/DataTable';
import { StatusBadge } from '../../design-system/components/StatusBadge';
import { Skeleton } from '../../design-system/components/Skeleton';
import { ErrorState } from '../../design-system/components/ErrorState';

export const HodMentorsWorkspace: React.FC = () => {
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDepartmentMentors = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/hod/mentors');
      if (res.data?.status === 'success' || res.data?.success) {
        setMentors(res.data.data || []);
      } else if (Array.isArray(res.data)) {
        setMentors(res.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch department mentors:', err);
      setError(err.response?.data?.message || 'Failed to load department mentor allocation list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartmentMentors();
  }, []);

  const columns: Column<any>[] = [
    {
      key: 'employeeId',
      header: 'Emp ID',
      sortable: true,
      render: (m) => <span className="font-mono font-bold text-xs">{m.employeeId || m.empId || 'EMP-102'}</span>,
    },
    {
      key: 'name',
      header: 'Faculty Mentor Name',
      sortable: true,
      render: (m) => (
        <div>
          <span className="font-bold text-xs text-foreground block">{m.name || `${m.firstName || ''} ${m.lastName || ''}`}</span>
          <span className="text-[10px] text-muted-foreground">{m.designation || 'Assistant Professor'}</span>
        </div>
      ),
    },
    {
      key: 'menteeCount',
      header: 'Assigned Mentees',
      sortable: true,
      render: (m) => <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400">{m.menteeCount || m.assignedStudentsCount || 20} Students</span>,
    },
    {
      key: 'pendingApprovals',
      header: 'Pending Approvals',
      sortable: true,
      render: (m) => {
        const cnt = m.pendingApprovals || 0;
        return <span className={`font-bold text-xs ${cnt > 0 ? 'text-amber-500' : 'text-muted-foreground'}`}>{cnt} Pending</span>;
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (m) => <StatusBadge status={m.status || 'ACTIVE'} />,
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

  if (error && mentors.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <ErrorState title="Mentor Allocation List Offline" description={error} onRetry={fetchDepartmentMentors} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in-50 duration-200">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border p-5 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            <UserPlus className="w-4 h-4" /> HOD Workspace
          </div>
          <h1 className="text-xl font-extrabold text-foreground mt-0.5">Faculty Mentor Allocation & Oversight</h1>
          <p className="text-xs text-muted-foreground">
            Manage faculty mentor assignments and track mentee advisement metrics for your department.
          </p>
        </div>

        <button
          onClick={fetchDepartmentMentors}
          className="px-3 py-2 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh List
        </button>
      </div>

      <DataTable
        columns={columns}
        data={mentors}
        keyExtractor={(m) => String(m.id)}
        emptyTitle="No Mentor Allocations Found"
        emptyDescription="Assign department faculty members as mentors to enable student advisement."
      />

    </div>
  );
};
