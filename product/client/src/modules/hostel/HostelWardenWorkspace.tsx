import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Home, Users, BedDouble, AlertCircle, CheckCircle2,
  Plus, Search, Building2, Settings, FileText, Bell,
  Wrench, ChevronRight, BarChart3
} from 'lucide-react';
import api from '../../lib/axios';
import { useInstitution } from '../../context/InstitutionContext';

function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string | number; icon: React.ElementType;
  color: string; sub?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-4">
      <div className={`p-2.5 rounded-lg ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function RoomRow({ room }: { room: any }) {
  const occupancyPct = room.capacity ? Math.round((room.occupied / room.capacity) * 100) : 0;
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/40 transition-colors">
      <div className="p-1.5 rounded bg-muted">
        <BedDouble className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{room.roomNumber || room.name}</p>
        <p className="text-xs text-muted-foreground">{room.block || room.building} · {room.type || 'Standard'}</p>
      </div>
      <div className="text-right">
        <p className="text-xs font-semibold text-foreground">{room.occupied ?? 0}/{room.capacity ?? 0}</p>
        <div className="w-16 h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
          <div
            className={`h-full rounded-full ${occupancyPct >= 90 ? 'bg-red-500' : occupancyPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
            style={{ width: `${occupancyPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function MaintenanceRow({ request }: { request: any }) {
  const statusColor =
    request.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
    request.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/40">
      <Wrench className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{request.title || request.description}</p>
        <p className="text-xs text-muted-foreground">{request.roomNumber} · {request.reportedBy}</p>
      </div>
      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${statusColor}`}>
        {request.status?.replace('_', ' ')}
      </span>
    </div>
  );
}

export default function HostelWardenWorkspace() {
  const { collegeName } = useInstitution();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'rooms' | 'maintenance'>('overview');

  const { data: statsData } = useQuery({
    queryKey: ['hostel-stats'],
    queryFn: async () => {
      try {
        const res = await api.get('/enterprise/hostel/stats');
        return res.data?.data;
      } catch { return null; }
    },
    staleTime: 60_000,
  });

  const { data: roomsData } = useQuery({
    queryKey: ['hostel-rooms', search],
    queryFn: async () => {
      try {
        const res = await api.get('/enterprise/hostel/rooms', { params: { search: search || undefined } });
        return res.data?.data?.rooms || res.data?.data || [];
      } catch { return []; }
    },
    staleTime: 30_000,
  });

  const { data: maintenanceData } = useQuery({
    queryKey: ['hostel-maintenance'],
    queryFn: async () => {
      try {
        const res = await api.get('/enterprise/hostel/maintenance');
        return res.data?.data?.requests || res.data?.data || [];
      } catch { return []; }
    },
    staleTime: 30_000,
  });

  const stats = statsData || {};
  const rooms: any[] = Array.isArray(roomsData) ? roomsData : [];
  const maintenance: any[] = Array.isArray(maintenanceData) ? maintenanceData : [];
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30">
              <Home className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground">Hostel Management</h1>
              <p className="text-xs text-muted-foreground">{collegeName} · {today}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              <Plus className="h-3.5 w-3.5" /> Allot Room
            </button>
            <button className="relative p-2 rounded-lg border border-border hover:bg-muted transition-colors">
              <Bell className="h-4 w-4 text-muted-foreground" />
              {maintenance.filter((m: any) => m.status === 'PENDING').length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[9px] text-white flex items-center justify-center font-bold">
                  {maintenance.filter((m: any) => m.status === 'PENDING').length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Capacity" value={stats.totalCapacity ?? '—'} icon={BedDouble}
            color="bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400" sub="beds" />
          <StatCard label="Occupied" value={stats.occupied ?? '—'} icon={Users}
            color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
            sub={`${stats.occupancyPct ?? 0}% occupancy`} />
          <StatCard label="Vacant" value={stats.vacant ?? '—'} icon={BedDouble}
            color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" />
          <StatCard label="Maintenance" value={stats.pendingMaintenance ?? '—'} icon={Wrench}
            color="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" sub="pending requests" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
          {(['overview', 'rooms', 'maintenance'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`text-xs px-4 py-1.5 rounded-md transition-colors capitalize ${
                activeTab === tab ? 'bg-background text-foreground shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'
              }`}>
              {tab === 'maintenance' ? 'Maintenance' : tab === 'rooms' ? 'Room Status' : 'Overview'}
            </button>
          ))}
        </div>

        {activeTab !== 'maintenance' && (
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rooms, blocks…"
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        )}

        {(activeTab === 'overview' || activeTab === 'rooms') && (
          <div className="bg-card border border-border rounded-xl">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Room Occupancy</h2>
              <span className="text-xs text-muted-foreground">{rooms.length} rooms</span>
            </div>
            <div className="p-2 divide-y divide-border/50">
              {rooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Building2 className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">Room data will appear here</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Add hostel rooms via the admin panel to get started</p>
                </div>
              ) : (
                rooms.map((room: any) => <RoomRow key={room.id} room={room} />)
              )}
            </div>
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="bg-card border border-border rounded-xl">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Maintenance Requests</h2>
              <span className="text-xs text-muted-foreground">{maintenance.length} requests</span>
            </div>
            <div className="p-2 divide-y divide-border/50">
              {maintenance.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Wrench className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No maintenance requests</p>
                </div>
              ) : (
                maintenance.map((req: any) => <MaintenanceRow key={req.id} request={req} />)
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
