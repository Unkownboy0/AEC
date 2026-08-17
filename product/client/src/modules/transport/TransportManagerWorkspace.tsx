import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bus, MapPin, Users, AlertTriangle, CheckCircle2,
  Plus, Search, Clock, Navigation, Route, FileText
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

function RouteRow({ route }: { route: any }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/40 transition-colors">
      <div className="p-1.5 rounded bg-blue-100 dark:bg-blue-900/30">
        <Route className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{route.name || `Route ${route.routeNumber}`}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <p className="text-xs text-muted-foreground truncate">{route.startPoint} → {route.endPoint}</p>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs font-semibold text-foreground">{route.studentsCount ?? 0} students</p>
        <p className="text-xs text-muted-foreground">{route.departureTime || '—'}</p>
      </div>
    </div>
  );
}

function BusRow({ bus }: { bus: any }) {
  const statusColor =
    bus.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
    bus.status === 'MAINTENANCE' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
    'bg-muted text-muted-foreground';
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/40 transition-colors">
      <div className="p-1.5 rounded bg-muted">
        <Bus className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{bus.vehicleNumber || bus.registrationNumber}</p>
        <p className="text-xs text-muted-foreground">{bus.model || 'Bus'} · Capacity: {bus.capacity ?? '—'}</p>
      </div>
      <div className="flex items-center gap-2">
        <p className="text-xs text-muted-foreground">{bus.driverName || '—'}</p>
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${statusColor}`}>
          {bus.status || 'UNKNOWN'}
        </span>
      </div>
    </div>
  );
}

export default function TransportManagerWorkspace() {
  const { collegeName } = useInstitution();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'routes' | 'buses' | 'students'>('routes');

  const { data: statsData } = useQuery({
    queryKey: ['transport-stats'],
    queryFn: async () => {
      try {
        const res = await api.get('/enterprise/transport/stats');
        return res.data?.data;
      } catch { return null; }
    },
    staleTime: 60_000,
  });

  const { data: routesData } = useQuery({
    queryKey: ['transport-routes', search],
    queryFn: async () => {
      try {
        const res = await api.get('/enterprise/transport/routes', { params: { search: search || undefined } });
        return res.data?.data?.routes || res.data?.data || [];
      } catch { return []; }
    },
    staleTime: 30_000,
  });

  const { data: busesData } = useQuery({
    queryKey: ['transport-buses'],
    queryFn: async () => {
      try {
        const res = await api.get('/enterprise/transport/vehicles');
        return res.data?.data?.vehicles || res.data?.data || [];
      } catch { return []; }
    },
    staleTime: 60_000,
  });

  const stats = statsData || {};
  const routes: any[] = Array.isArray(routesData) ? routesData : [];
  const buses: any[] = Array.isArray(busesData) ? busesData : [];
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Bus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground">Transport Management</h1>
              <p className="text-xs text-muted-foreground">{collegeName} · {today}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              <Plus className="h-3.5 w-3.5" /> Add Route
            </button>
            <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-foreground">
              <FileText className="h-3.5 w-3.5" /> Daily Report
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Routes" value={stats.totalRoutes ?? '—'} icon={Route}
            color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" />
          <StatCard label="Active Buses" value={stats.activeBuses ?? '—'} icon={Bus}
            color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
            sub={`of ${stats.totalBuses ?? 0} total`} />
          <StatCard label="Students Using" value={stats.studentCount ?? '—'} icon={Users}
            color="bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400" sub="enrolled" />
          <StatCard label="Maintenance Due" value={stats.maintenanceDue ?? '—'} icon={AlertTriangle}
            color="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
          {(['routes', 'buses', 'students'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`text-xs px-4 py-1.5 rounded-md transition-colors capitalize ${
                activeTab === tab ? 'bg-background text-foreground shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'
              }`}>
              {tab === 'routes' ? 'Routes' : tab === 'buses' ? 'Fleet' : 'Students'}
            </button>
          ))}
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={activeTab === 'buses' ? 'Search vehicles…' : 'Search routes…'}
            className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>

        {activeTab === 'routes' && (
          <div className="bg-card border border-border rounded-xl">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Active Routes</h2>
              <span className="text-xs text-muted-foreground">{routes.length} routes</span>
            </div>
            <div className="p-2 divide-y divide-border/50">
              {routes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Route className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No routes configured</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Add transport routes to manage student allocations</p>
                </div>
              ) : (
                routes.map((route: any) => <RouteRow key={route.id} route={route} />)
              )}
            </div>
          </div>
        )}

        {activeTab === 'buses' && (
          <div className="bg-card border border-border rounded-xl">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Fleet</h2>
              <span className="text-xs text-muted-foreground">{buses.length} vehicles</span>
            </div>
            <div className="p-2 divide-y divide-border/50">
              {buses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bus className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No vehicles registered</p>
                </div>
              ) : (
                buses.map((bus: any) => <BusRow key={bus.id} bus={bus} />)
              )}
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="bg-card border border-border rounded-xl">
            <div className="p-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Student Allocations</h2>
            </div>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Student allocation data</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Allocated students will appear once routes are configured</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
