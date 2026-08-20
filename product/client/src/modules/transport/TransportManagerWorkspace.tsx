import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bus,
  MapPin,
  Users,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Search,
  Clock,
  Navigation,
  Route,
  FileText,
  RefreshCw,
  Phone,
  Shield,
  Activity,
  UserCheck,
  Zap,
  ArrowRightLeft,
  X,
} from 'lucide-react';
import api from '../../lib/axios';
import { useInstitution } from '../../context/InstitutionContext';
import { toast } from '../../components/ui/Toast';

export default function TransportManagerWorkspace() {
  const { collegeName } = useInstitution();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'control' | 'routes' | 'fleet' | 'passengers'>('control');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [replaceTargetRoute, setReplaceTargetRoute] = useState<any>(null);
  const [replacementVehicleId, setReplacementVehicleId] = useState<string>('');

  // 1. Dashboard Metrics Query
  const { data: statsData, refetch: refetchStats } = useQuery({
    queryKey: ['transport-dashboard'],
    queryFn: async () => {
      const res = await api.get('/transport/dashboard');
      return res.data?.data || {};
    },
    refetchInterval: 20000,
  });

  // 2. Fleet Live Tracking Query
  const { data: fleetData, refetch: refetchFleet, isFetching: isFetchingFleet } = useQuery({
    queryKey: ['transport-fleet-live'],
    queryFn: async () => {
      const res = await api.get('/transport/fleet-live');
      return res.data?.data || [];
    },
    refetchInterval: 15000,
  });

  // 3. Routes Query
  const { data: routesData } = useQuery({
    queryKey: ['transport-routes'],
    queryFn: async () => {
      const res = await api.get('/transport/routes');
      return res.data?.data || [];
    },
  });

  // 4. Vehicles Query
  const { data: vehiclesData } = useQuery({
    queryKey: ['transport-vehicles'],
    queryFn: async () => {
      const res = await api.get('/transport/vehicles');
      return res.data?.data || [];
    },
  });

  // 5. Selected Route Passengers Query
  const { data: passengersData, isLoading: isLoadingPassengers } = useQuery({
    queryKey: ['transport-passengers', selectedRouteId],
    queryFn: async () => {
      if (!selectedRouteId) return [];
      const res = await api.get(`/transport/routes/${selectedRouteId}/passengers`);
      return res.data?.data || [];
    },
    enabled: Boolean(selectedRouteId),
  });

  // Replacement Vehicle Mutation
  const replaceVehicleMutation = useMutation({
    mutationFn: async (payload: { routeId: string; newVehicleId: string; reason: string }) => {
      const res = await api.post('/transport/trips/replace-vehicle', payload);
      return res.data?.data;
    },
    onSuccess: (data) => {
      toast.success(`Replacement vehicle assigned! ${data?.passengersNotified || 0} passengers notified.`);
      setShowReplaceModal(false);
      queryClient.invalidateQueries({ queryKey: ['transport-fleet-live'] });
      queryClient.invalidateQueries({ queryKey: ['transport-routes'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to assign replacement vehicle');
    },
  });

  const fleet: any[] = Array.isArray(fleetData) ? fleetData : [];
  const routes: any[] = Array.isArray(routesData) ? routesData : [];
  const vehicles: any[] = Array.isArray(vehiclesData) ? vehiclesData : [];
  const passengers: any[] = Array.isArray(passengersData) ? passengersData : [];
  const stats = statsData || {};

  const filteredFleet = fleet.filter((item) => {
    const matchesSearch =
      item.routeName.toLowerCase().includes(search.toLowerCase()) ||
      item.vehicleNumber.toLowerCase().includes(search.toLowerCase()) ||
      item.driverName.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'RUNNING') return item.status === 'RUNNING';
    if (statusFilter === 'DELAYED') return item.status === 'DELAYED';
    if (statusFilter === 'GPS_OFFLINE') return item.status === 'GPS_OFFLINE';
    return true;
  });

  const handleOpenReplace = (routeItem: any) => {
    setReplaceTargetRoute(routeItem);
    setReplacementVehicleId('');
    setShowReplaceModal(true);
  };

  const handleConfirmReplace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replaceTargetRoute || !replacementVehicleId) return;
    replaceVehicleMutation.mutate({
      routeId: replaceTargetRoute.routeId,
      newVehicleId: replacementVehicleId,
      reason: 'Operational Replacement',
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      {/* ── Header ── */}
      <div className="border-b border-border bg-card/70 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <Bus className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-foreground">
                  Transport Live Control Centre
                </h1>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-xs text-muted-foreground">{collegeName} • Fleet Operations</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                refetchFleet();
                refetchStats();
                toast.info('Fleet GPS coordinates refreshed');
              }}
              disabled={isFetchingFleet}
              className="flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-accent transition-colors font-bold"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetchingFleet ? 'animate-spin text-indigo-600' : ''}`} />
              <span>Refresh Fleet</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ── Metric Summary Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-600" /> Trips Running
            </div>
            <div className="text-xl font-black text-foreground mt-1">
              {stats.tripsRunningNow ?? fleet.length}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Active today</div>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Bus className="w-3.5 h-3.5 text-indigo-600" /> Active Fleet
            </div>
            <div className="text-xl font-black text-foreground mt-1">
              {stats.activeVehicles ?? vehicles.length}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">of {stats.totalVehicles ?? vehicles.length} total buses</div>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-600" /> Students Enrolled
            </div>
            <div className="text-xl font-black text-foreground mt-1">
              {stats.studentsAllocated ?? 0}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Day Scholar passes</div>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-purple-600" /> Faculty & Staff
            </div>
            <div className="text-xl font-black text-foreground mt-1">
              {stats.facultyAllocated ?? 0}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Staff bus allocations</div>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs col-span-2 lg:col-span-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Maintenance / Alerts
            </div>
            <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {stats.openBreakdowns ?? 0}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Open emergencies</div>
          </div>
        </div>

        {/* ── Navigation Tabs ── */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-1 bg-muted/60 p-1 rounded-xl w-fit">
            {(['control', 'routes', 'fleet', 'passengers'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-xs px-4 py-2 rounded-lg transition-all capitalize font-bold ${
                  activeTab === tab
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'control'
                  ? 'Live Fleet Map'
                  : tab === 'routes'
                  ? 'Routes & Stops'
                  : tab === 'fleet'
                  ? 'Vehicles'
                  : 'Passenger Directory'}
              </button>
            ))}
          </div>

          {/* Search & Filter */}
          <div className="flex items-center gap-2">
            <div className="relative w-48 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search route, vehicle, driver…"
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-border rounded-xl bg-card focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {activeTab === 'control' && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs p-1.5 border border-border rounded-xl bg-card text-foreground font-semibold"
              >
                <option value="ALL">All Statuses</option>
                <option value="RUNNING">Running</option>
                <option value="DELAYED">Delayed</option>
                <option value="GPS_OFFLINE">GPS Offline</option>
              </select>
            )}
          </div>
        </div>

        {/* ── TAB 1: Live Control Centre ── */}
        {activeTab === 'control' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFleet.map((bus) => {
                const isOnline = bus.status === 'RUNNING';
                const isDelayed = bus.status === 'DELAYED';

                return (
                  <div
                    key={bus.routeId}
                    className="p-5 rounded-3xl bg-card border border-border shadow-xs hover:border-indigo-500/30 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-foreground">
                            {bus.routeName}
                          </span>
                        </div>
                        <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                          Bus: {bus.vehicleNumber}
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isOnline
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : isDelayed
                            ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                            : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                        }`}
                      >
                        {bus.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50">
                        <div className="text-[9px] font-bold uppercase text-muted-foreground">Driver</div>
                        <div className="font-bold text-foreground truncate">{bus.driverName}</div>
                        <div className="text-[10px] text-muted-foreground">{bus.driverPhone}</div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50">
                        <div className="text-[9px] font-bold uppercase text-muted-foreground">Allocations</div>
                        <div className="font-bold text-foreground">{bus.passengerCount} passengers</div>
                        <div className="text-[10px] text-muted-foreground">{bus.stopsCount} stops total</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          setSelectedRouteId(bus.routeId);
                          setActiveTab('passengers');
                        }}
                        className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                      >
                        View Passengers ({bus.passengerCount})
                      </button>

                      <button
                        onClick={() => handleOpenReplace(bus)}
                        className="px-3 py-1.5 bg-amber-600/10 hover:bg-amber-600/20 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-xl flex items-center gap-1 transition-all"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" /> Replace Bus
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TAB 2: Routes & Stops ── */}
        {activeTab === 'routes' && (
          <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
            <h2 className="text-sm font-extrabold text-foreground">Configured Routes ({routes.length})</h2>
            <div className="divide-y divide-border/60">
              {routes.map((route: any) => (
                <div key={route.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-bold text-sm text-foreground">{route.routeName}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Driver: {route.driverName} ({route.driverPhone}) • Assigned Vehicle: {route.vehicleNo}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-foreground">
                      {route.transportStops?.length || 0} stops
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 3: Fleet Vehicles ── */}
        {activeTab === 'fleet' && (
          <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
            <h2 className="text-sm font-extrabold text-foreground">Registered Vehicles ({vehicles.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {vehicles.map((v: any) => (
                <div key={v.id} className="p-4 rounded-2xl border border-border bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-foreground">{v.vehicleNumber}</span>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 text-[10px] font-black rounded-md">
                      {v.status}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Type: {v.type} • Capacity: {v.capacity} seats
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Fuel: {v.fuelType || 'Diesel'} • Reg: {v.registrationNo || 'Standard'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 4: Categorized Passenger Directory ── */}
        {activeTab === 'passengers' && (
          <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-extrabold text-foreground">Route Passenger Directory</h2>
                <p className="text-xs text-muted-foreground">
                  Select a route to view allocated students and faculty/staff members
                </p>
              </div>

              <select
                value={selectedRouteId || ''}
                onChange={(e) => setSelectedRouteId(e.target.value || null)}
                className="text-xs p-2 rounded-xl border border-border bg-background text-foreground font-bold"
              >
                <option value="">-- Choose Route --</option>
                {routes.map((r: any) => (
                  <option key={r.id} value={r.id}>
                    {r.routeName}
                  </option>
                ))}
              </select>
            </div>

            {!selectedRouteId ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                Please select a route above to load passenger allocations.
              </div>
            ) : isLoadingPassengers ? (
              <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
                Loading route passengers...
              </div>
            ) : passengers.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No active passengers allocated to this route.
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {passengers.map((p: any) => (
                  <div key={p.allocationId} className="py-3 flex items-center justify-between gap-4 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-foreground">{p.passengerName}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            p.passengerType === 'STUDENT'
                              ? 'bg-blue-500/10 text-blue-600'
                              : 'bg-purple-500/10 text-purple-600'
                          }`}
                        >
                          {p.passengerType}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        ID: {p.identifier} • {p.department}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-foreground">{p.stopName}</div>
                      <div className="text-[10px] text-muted-foreground">Pickup: {p.pickupTime || '07:30 AM'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Vehicle Replacement Modal ── */}
      {showReplaceModal && replaceTargetRoute && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-foreground">
                Assign Replacement Vehicle
              </h3>
              <button
                onClick={() => setShowReplaceModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Replace active bus for <strong className="text-foreground">{replaceTargetRoute.routeName}</strong>. All allocated passengers will receive an immediate native alert.
            </p>

            <form onSubmit={handleConfirmReplace} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-foreground mb-1">
                  Select Replacement Vehicle
                </label>
                <select
                  value={replacementVehicleId}
                  onChange={(e) => setReplacementVehicleId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground"
                  required
                >
                  <option value="">-- Choose Vehicle --</option>
                  {vehicles
                    .filter((v: any) => v.id !== replaceTargetRoute.vehicleId)
                    .map((v: any) => (
                      <option key={v.id} value={v.id}>
                        {v.vehicleNumber} ({v.type} • {v.capacity} seats)
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReplaceModal(false)}
                  className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-accent font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={replaceVehicleMutation.isPending || !replacementVehicleId}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold disabled:opacity-50"
                >
                  {replaceVehicleMutation.isPending ? 'Assigning...' : 'Confirm & Notify Passengers'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
