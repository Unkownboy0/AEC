import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import api from '../../../lib/axios';
import { DataTable, Column } from '../../../design-system/components/DataTable';
import { Skeleton } from '../../../design-system/components/Skeleton';
import { ErrorState } from '../../../design-system/components/ErrorState';

export const MentorAttendanceOverviewPage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendanceRisk = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/mentor/attendance');
      if (res.data?.status === 'success' || res.data?.success) {
        setData(res.data.data || []);
      } else if (Array.isArray(res.data)) {
        setData(res.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch mentor attendance risk data:', err);
      setError(err.response?.data?.message || 'Unable to fetch mentee attendance reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceRisk();
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
      key: 'totalClasses',
      header: 'Held / Attended',
      render: (st) => <span className="text-xs">{st.attendedClasses || 0} / {st.totalClasses || 0}</span>,
    },
    {
      key: 'attendancePercentage',
      header: 'Percentage',
      sortable: true,
      render: (st) => {
        const pct = st.attendancePercentage ?? 80;
        const isCritical = pct < 75;
        return (
          <span className={`font-bold text-xs ${isCritical ? 'text-rose-500' : 'text-emerald-600'}`}>
            {pct}%
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Risk Category',
      render: (st) => {
        const pct = st.attendancePercentage ?? 80;
        if (pct < 65) return <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-600 text-[10px] font-extrabold uppercase">Critical Risk</span>;
        if (pct < 75) return <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 text-[10px] font-extrabold uppercase">Moderate Risk</span>;
        return <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 text-[10px] font-extrabold uppercase">Satisfactory</span>;
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

  if (error && data.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <ErrorState title="Attendance Tracking Offline" description={error} onRetry={fetchAttendanceRisk} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in-50 duration-200">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border p-5 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-rose-500 uppercase tracking-wider">
            <Clock className="w-4 h-4" /> Mentor Workspace
          </div>
          <h1 className="text-xl font-extrabold text-foreground mt-0.5">Mentee Attendance Risk Overview</h1>
          <p className="text-xs text-muted-foreground">
            Track daily attendance percentages and flag students falling below 75% requirement.
          </p>
        </div>

        <button
          onClick={fetchAttendanceRisk}
          className="px-3 py-2 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
        </button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(st) => String(st.id)}
        emptyTitle="All Mentees Above Threshold"
        emptyDescription="No assigned mentees are currently at attendance risk."
      />

    </div>
  );
};
