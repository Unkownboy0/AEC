import React, { useCallback, useEffect, useState } from 'react';
import { Calendar, RefreshCw, UserX, Wifi, WifiOff } from 'lucide-react';
import api from '../../lib/axios';
import { realtimeClient } from '../../realtime/realtime-client';
import { useRealtime } from '../../realtime/RealtimeProvider';

interface LeaveOdItem {
  id: string;
  name: string;
  registerOrEmpId: string;
  userType: 'STUDENT' | 'FACULTY';
  type: 'LEAVE' | 'ON_DUTY';
  category?: string;
  year?: string;
  section?: string;
  startDate: string;
  endDate: string;
  status: string;
  reasonPublic: string;
}

export const DepartmentAvailabilityBoard: React.FC<{ departmentId?: string }> = ({ departmentId }) => {
  const { status: realtimeStatus, reconnect } = useRealtime();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [data, setData] = useState<{
    studentsOnLeaveToday: LeaveOdItem[];
    studentsOnOdToday: LeaveOdItem[];
    facultyOnLeaveToday: LeaveOdItem[];
    facultyOnOdToday: LeaveOdItem[];
  }>({
    studentsOnLeaveToday: [],
    studentsOnOdToday: [],
    facultyOnLeaveToday: [],
    facultyOnOdToday: [],
  });

  const fetchAvailability = useCallback(async (background = false) => {
    try {
      if (background) setRefreshing(true);
      else setLoading(true);
      const res = await api.get('/enterprise/analytics/department-availability', {
        params: { departmentId },
      });
      if (res.data?.status === 'success' && res.data.data) {
        setData(res.data.data);
        setLastUpdated(new Date(res.data.data.updatedAt || Date.now()));
        setError(null);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Availability data could not be synchronized.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [departmentId]);

  useEffect(() => {
    void fetchAvailability(false);
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) void fetchAvailability(true);
    }, 10_000);
    const syncOnResume = () => { if (document.visibilityState === 'visible') void fetchAvailability(true); };
    const syncOnOnline = () => void fetchAvailability(true);
    document.addEventListener('visibilitychange', syncOnResume);
    window.addEventListener('online', syncOnOnline);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', syncOnResume);
      window.removeEventListener('online', syncOnOnline);
    };
  }, [fetchAvailability]);

  useEffect(() => realtimeClient.subscribe((event: any) => {
    const type = String(event?.eventType || event?.type || '').toUpperCase();
    const domainType = String(event?.payload?.eventType || '').toUpperCase();
    if (type === 'DEPARTMENT_AVAILABILITY_UPDATED' || type === 'APPROVAL_UPDATED' || type === 'DASHBOARD_UPDATED' || ((type === 'NOTIFICATION:SENT' || type === 'NOTIFICATION_SENT') && /LEAVE|ON_DUTY|\bOD\b/.test(domainType))) {
      void fetchAvailability(true);
    }
  }), [fetchAvailability]);

  const totalStudentsAbsent = data.studentsOnLeaveToday.length + data.studentsOnOdToday.length;
  const totalFacultyAbsent = data.facultyOnLeaveToday.length + data.facultyOnOdToday.length;

  return (
    <div className="bg-card border rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold tracking-tight">Department daily availability</h3>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
              <span>Approved leave and OD active today</span>
              <span className={`inline-flex items-center gap-1 font-medium ${realtimeStatus === 'connected' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {realtimeStatus === 'connected' ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                {realtimeStatus === 'connected' ? 'Live sync connected' : realtimeStatus === 'reconnecting' || realtimeStatus === 'connecting' ? 'Reconnecting' : '10-second sync'}
              </span>
              {lastUpdated && <span>Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>}
            </div>
          </div>
        </div>
        <button
          onClick={() => realtimeStatus === 'error' ? reconnect() : void fetchAvailability(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold text-primary transition hover:bg-primary/5 active:scale-[0.98] disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {realtimeStatus === 'error' ? 'Reconnect' : 'Sync now'}
        </button>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-500/25 bg-rose-500/5 px-3 py-2 text-xs text-rose-700 dark:text-rose-300" role="alert">
          <span>{error} Showing the last successfully synchronized result.</span>
          <button onClick={() => void fetchAvailability(true)} className="shrink-0 font-semibold underline underline-offset-2">Retry</button>
        </div>
      )}

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300 block">Students On Leave</span>
          <span className="text-xl font-black text-amber-600 dark:text-amber-400">{data.studentsOnLeaveToday.length}</span>
        </div>
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-300 block">Students On OD</span>
          <span className="text-xl font-black text-blue-600 dark:text-blue-400">{data.studentsOnOdToday.length}</span>
        </div>
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-300 block">Faculty On Leave</span>
          <span className="text-xl font-black text-rose-600 dark:text-rose-400">{data.facultyOnLeaveToday.length}</span>
        </div>
        <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-300 block">Faculty On OD</span>
          <span className="text-xl font-black text-purple-600 dark:text-purple-400">{data.facultyOnOdToday.length}</span>
        </div>
      </div>

      {/* Active Listings */}
      {loading ? (
        <div className="py-6 text-center text-xs text-muted-foreground animate-pulse">
          Loading verified availability records…
        </div>
      ) : (
        <div className="space-y-4">
          {/* Students Section */}
          <div>
            <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-2">
              <UserX className="h-4 w-4 text-amber-600" />
              <span>Students On Leave / OD Today ({totalStudentsAbsent})</span>
            </h4>
            {[...data.studentsOnLeaveToday, ...data.studentsOnOdToday].length === 0 ? (
              <p className="text-[11px] text-muted-foreground bg-muted/20 p-3 rounded-xl">
                ✓ All students present in department today. No active approved leave or OD requests.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {[...data.studentsOnLeaveToday, ...data.studentsOnOdToday].map((item) => (
                  <div key={item.id} className="p-3 border rounded-xl bg-muted/10 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{item.name}</span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        item.type === 'ON_DUTY' ? 'bg-blue-500/10 text-blue-700 border border-blue-500/20' : 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
                      }`}>
                        {item.type === 'ON_DUTY' ? 'Approved OD' : 'Approved Leave'}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      Reg: {item.registerOrEmpId} {item.year ? `• Year ${item.year}` : ''} {item.section ? `• Sec ${item.section}` : ''}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Duration: {new Date(item.startDate).toLocaleDateString('en-IN')} to {new Date(item.endDate).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Faculty Section */}
          <div>
            <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-2">
              <UserX className="h-4 w-4 text-rose-600" />
              <span>Faculty On Leave / OD Today ({totalFacultyAbsent})</span>
            </h4>
            {[...data.facultyOnLeaveToday, ...data.facultyOnOdToday].length === 0 ? (
              <p className="text-[11px] text-muted-foreground bg-muted/20 p-3 rounded-xl">
                ✓ All department faculty members available on campus today.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {[...data.facultyOnLeaveToday, ...data.facultyOnOdToday].map((item) => (
                  <div key={item.id} className="p-3 border rounded-xl bg-muted/10 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{item.name}</span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        item.type === 'ON_DUTY' ? 'bg-purple-500/10 text-purple-700 border border-purple-500/20' : 'bg-rose-500/10 text-rose-700 border border-rose-500/20'
                      }`}>
                        {item.type === 'ON_DUTY' ? 'Faculty OD' : 'Faculty Leave'}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-mono">Emp ID: {item.registerOrEmpId}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Duration: {new Date(item.startDate).toLocaleDateString('en-IN')} to {new Date(item.endDate).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentAvailabilityBoard;
