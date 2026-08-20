import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  MapPin,
  Clock,
  Phone,
  AlertCircle,
  CheckCircle,
  Navigation,
  Bus,
  User,
  Shield,
  Plus,
  RefreshCw,
  Home,
  Compass,
  Zap,
  Info,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';
import api from '../../lib/axios';
import { LiveBusMap } from '../../components/transport/LiveBusMap';

export interface TransportTrackingData {
  isEligible: boolean;
  passengerType?: string;
  passengerName?: string;
  reason?: 'HOSTELLER' | 'NON_COLLEGE_BUS' | 'ALLOCATION_PENDING' | 'NO_LINKED_STUDENT' | string;
  studentType?: string;
  transportMode?: string;
  message?: string;
  allocationId?: string;
  route?: {
    id: string;
    name: string;
    code: string;
    startPoint: string;
    endPoint: string;
    totalDistanceKm: number;
  };
  assignedStop?: {
    id: string;
    name: string;
    sequence: number;
    pickupTime: string;
    dropTime: string;
    landmark?: string;
    latitude: number;
    longitude: number;
  };
  vehicle?: {
    id: string;
    number: string;
    type: string;
    registrationNo: string;
  } | null;
  driver?: {
    name: string;
    phone: string;
  } | null;
  liveLocation?: {
    latitude: number;
    longitude: number;
    speedKmH: number;
    heading: number;
    recordedAt?: string;
    ageSeconds?: number | null;
    isStale: boolean;
    statusText: string;
  };
  stops?: Array<{
    id: string;
    name: string;
    sequence: number;
    pickupTime?: string;
    dropTime?: string;
    isPassengerStop?: boolean;
    latitude: number;
    longitude: number;
  }>;
  tripStatus?: string;
  etaMinutes?: number;
  distanceKm?: number;
}

export const StudentTransport: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<TransportTrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState('Route 06 — Vadavalli Metro');
  const [preferredStop, setPreferredStop] = useState('Navavoor Pirivu');
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);

  const fetchTransportData = useCallback(async (showIndicator = false) => {
    try {
      if (showIndicator) setIsRefreshing(true);
      const res = await api.get('/transport/my-allocation');
      if (res?.data?.status === 'success') {
        setData(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch transport allocation:', err);
      setData({
        isEligible: false,
        reason: 'ALLOCATION_PENDING',
        message: 'Unable to verify transport allocation status.',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTransportData();

    // Polling every 15 seconds for live GPS updates when active
    const interval = setInterval(() => {
      if (data?.isEligible) {
        fetchTransportData(false);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchTransportData, data?.isEligible]);

  const handleApplyBus = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setApplicationSubmitted(true);
      setShowApplyModal(false);
      toast.success('College Bus pass application submitted to Transport Department!');
    } catch {
      toast.error('Failed to submit application.');
    }
  };

  if (isLoading) return <Loading text="Verifying Campus Transport Allocation & GPS Status..." />;

  // ── 1. Hosteller Resident View ──────────────────────────────────────────
  if (data && !data.isEligible && data.reason === 'HOSTELLER') {
    return (
      <div className="space-y-6 text-left pb-12 animate-in fade-in duration-200">
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Truck className="h-5 w-5 text-indigo-600" /> Campus Commute & Residency
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Student profile: <span className="font-bold text-emerald-600">On-Campus Hosteller Resident</span>
          </p>
        </div>

        <div className="p-6 rounded-3xl border bg-card shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl">
              <Home className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Hostel Resident Profile
              </h2>
              <p className="text-xs text-muted-foreground">
                You are registered as an on-campus resident in the Student Hostels. Daily College Bus tracking is not applicable.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Hostel residents have access to campus facilities, dining mess, outing permissions, and night attendance tracking through the Hostel Portal.
            </p>
            <div className="pt-2">
              <button
                onClick={() => navigate('/student/hostel')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2"
              >
                <Home className="h-4 w-4" /> Open Student Hostel Portal
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── 2. Day Scholar Non-College Bus / Allocation Pending View ─────────────
  if (data && !data.isEligible) {
    return (
      <div className="space-y-6 text-left pb-12 animate-in fade-in duration-200">
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Truck className="h-5 w-5 text-indigo-600" /> Campus Transport Allocation
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Commute profile: <span className="font-bold text-indigo-600">Day Scholar</span> ({data.transportMode || 'Independent Commute'})
          </p>
        </div>

        <div className="p-6 rounded-3xl border bg-card shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl">
              <Bus className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                {data.reason === 'ALLOCATION_PENDING'
                  ? 'Transport Allocation Pending Review'
                  : 'Self / Local Transit Commute'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {data.message || 'You are currently not allocated an active College Bus seat.'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-2">
            <p>
              Institutional buses operate across 25+ city routes with dedicated GPS trackers and emergency assistance. If you wish to avail or renew your college bus pass, please submit an allocation request below.
            </p>
          </div>

          {applicationSubmitted ? (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
              Bus Pass application for {selectedRoute} ({preferredStop}) submitted and awaiting Transport Manager allocation.
            </div>
          ) : (
            <button
              onClick={() => setShowApplyModal(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all shadow-md flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Apply for College Bus Pass
            </button>
          )}
        </div>

        {/* Application Modal */}
        {showApplyModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-card border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                College Bus Pass Application
              </h3>
              <form onSubmit={handleApplyBus} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Select Preferred Route
                  </label>
                  <select
                    value={selectedRoute}
                    onChange={(e) => setSelectedRoute(e.target.value)}
                    className="w-full p-2.5 rounded-xl border bg-background text-foreground"
                  >
                    <option value="Route 06 — Vadavalli Metro">Route 06 — Vadavalli Metro</option>
                    <option value="Route 01 — North Metro Express">Route 01 — North Metro Express</option>
                    <option value="Route 12 — South Ring Road">Route 12 — South Ring Road</option>
                    <option value="Route 18 — Tech Corridor Line">Route 18 — Tech Corridor Line</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Preferred Boarding Stop
                  </label>
                  <input
                    type="text"
                    value={preferredStop}
                    onChange={(e) => setPreferredStop(e.target.value)}
                    placeholder="Enter landmark or stop name"
                    className="w-full p-2.5 rounded-xl border bg-background text-foreground"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowApplyModal(false)}
                    className="px-4 py-2 rounded-xl border bg-card hover:bg-accent font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                  >
                    Submit Application
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── 3. Full Active Live Tracking View ──────────────────────────────────
  return (
    <div className="space-y-6 text-left pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              My College Bus
            </h1>
            <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-black rounded-full uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active Allocation
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {data?.route?.name} • Boarding: <strong className="text-slate-900 dark:text-white">{data?.assignedStop?.name}</strong>
          </p>
        </div>

        <button
          onClick={() => fetchTransportData(true)}
          disabled={isRefreshing}
          className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-card hover:bg-accent text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 shadow-xs transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
          <span>Refresh GPS</span>
        </button>
      </div>

      {/* ── Interactive Live Map ── */}
      <LiveBusMap
        vehicleNumber={data?.vehicle?.number}
        routeName={data?.route?.name}
        stops={data?.stops || []}
        assignedStop={data?.assignedStop}
        liveLocation={data?.liveLocation}
        tripStatus={data?.tripStatus}
        etaMinutes={data?.etaMinutes}
        distanceKm={data?.distanceKm}
        onRefresh={() => fetchTransportData(true)}
      />

      {/* ── Vehicle & Boarding Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Stop Summary */}
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Assigned Boarding Stop
          </div>
          <div className="text-sm font-extrabold text-slate-900 dark:text-white">
            {data?.assignedStop?.name}
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-2 pt-0.5">
            <span>Pickup: <strong className="text-slate-700 dark:text-slate-300">{data?.assignedStop?.pickupTime}</strong></span>
            <span>•</span>
            <span>Drop: <strong className="text-slate-700 dark:text-slate-300">{data?.assignedStop?.dropTime}</strong></span>
          </div>
        </div>

        {/* Vehicle Summary */}
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Bus className="w-3.5 h-3.5 text-indigo-600" /> Vehicle Assigned
          </div>
          <div className="text-sm font-extrabold text-slate-900 dark:text-white">
            {data?.vehicle?.number || 'TN 38 BX 4421'}
          </div>
          <div className="text-xs text-muted-foreground pt-0.5">
            Type: {data?.vehicle?.type || 'College Deluxe Bus'}
          </div>
        </div>

        {/* Driver Contact */}
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-blue-600" /> Assigned Driver
          </div>
          <div className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center justify-between">
            <span>{data?.driver?.name || 'Senthil Kumar'}</span>
            {data?.driver?.phone && (
              <a
                href={`tel:${data.driver.phone}`}
                className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors"
                title="Call Driver"
              >
                <Phone className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
          <div className="text-xs text-muted-foreground pt-0.5">
            Operational Contact: {data?.driver?.phone || 'Available via Transport Desk'}
          </div>
        </div>
      </div>

      {/* ── Ordered Stops Route Timeline ── */}
      <div className="p-6 rounded-3xl border bg-card shadow-xs space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Navigation className="w-4 h-4 text-indigo-600" /> Route Stops Timeline ({data?.stops?.length || 0} stops)
        </h3>

        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {data?.stops?.map((stop, idx) => {
            const isMyStop = stop.id === data.assignedStop?.id || stop.isPassengerStop;
            const isFirst = idx === 0;
            const isLast = idx === (data?.stops?.length || 0) - 1;

            return (
              <div key={stop.id} className="relative flex items-start justify-between gap-3 text-xs">
                {/* Dot */}
                <div
                  className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 ${
                    isMyStop
                      ? 'bg-emerald-500 border-white ring-4 ring-emerald-500/20'
                      : isFirst || isLast
                      ? 'bg-indigo-600 border-white'
                      : 'bg-card border-slate-400'
                  }`}
                />

                <div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${isMyStop ? 'text-emerald-600 dark:text-emerald-400 text-sm' : 'text-slate-800 dark:text-slate-200'}`}>
                      {stop.name}
                    </span>
                    {isMyStop && (
                      <span className="px-2 py-0.5 bg-emerald-500 text-slate-950 font-black text-[9px] rounded-md">
                        Your Stop
                      </span>
                    )}
                    {isLast && (
                      <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-600 text-[9px] font-bold rounded-md">
                        Destination
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Sequence #{stop.sequence}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">
                    {stop.pickupTime || '07:30 AM'}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Drop: {stop.dropTime || '04:45 PM'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StudentTransport;
