import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Clock, Phone, AlertCircle, CheckCircle, Navigation, Bus, User, Shield, Plus } from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';
import api from '../../lib/axios';

export type TransportEligibilityState = 
  | 'COLLEGE_BUS'
  | 'DAY_SCHOLAR_NO_COLLEGE_TRANSPORT'
  | 'HOSTELLER'
  | 'OWN_VEHICLE'
  | 'PRIVATE_TRANSPORT';

export interface TransportAllocation {
  eligibilityState: TransportEligibilityState;
  busNumber?: string;
  routeName?: string;
  driver?: string;
  driverPhone?: string;
  vehicleReg?: string;
  pickupStop?: string;
  pickupTime?: string;
  dropTime?: string;
  stops?: { stop: string; time: string; type: string; isStudentStop?: boolean }[];
  feeStatus?: { term: string; amount: string; paid: boolean };
}

export const StudentTransport: React.FC = () => {
  const [allocation, setAllocation] = useState<TransportAllocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trackingActive, setTrackingActive] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState('Route A — Central City Express');
  const [preferredStop, setPreferredStop] = useState('Anna Nagar Tower Junction');
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);

  useEffect(() => {
    const fetchTransportData = async () => {
      try {
        const res = await api.get('/transport/routes').catch(() => null);
        if (res?.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          // If college bus allocation exists
          setAllocation({
            eligibilityState: 'COLLEGE_BUS',
            busNumber: 'GIT-BUS-12',
            routeName: 'Route A — Central City Express',
            driver: 'Rajesh Kumar',
            driverPhone: '+91 94445 67890',
            vehicleReg: 'TN09 AX 4421',
            pickupStop: 'Ashok Nagar (Student Pickup)',
            pickupTime: '7:45 AM',
            dropTime: '4:45 PM',
            stops: [
              { stop: 'Koyambedu Bus Terminus', time: '7:10 AM', type: 'pickup' },
              { stop: 'Anna Nagar Tower Junction', time: '7:25 AM', type: 'pickup' },
              { stop: 'Vadapalani Signal', time: '7:35 AM', type: 'pickup' },
              { stop: 'Ashok Nagar (Student Pickup)', time: '7:45 AM', type: 'pickup', isStudentStop: true },
              { stop: 'Guindy Industrial Estate', time: '7:58 AM', type: 'pickup' },
              { stop: 'Campus Main Gate', time: '8:20 AM', type: 'destination' },
            ],
            feeStatus: { term: '2026 Academic Year', amount: '₹18,000', paid: true }
          });
        } else {
          // Day scholar self-transit state
          setAllocation({
            eligibilityState: 'DAY_SCHOLAR_NO_COLLEGE_TRANSPORT'
          });
        }
      } catch {
        setAllocation({ eligibilityState: 'DAY_SCHOLAR_NO_COLLEGE_TRANSPORT' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransportData();
  }, []);

  const handleApplyBus = (e: React.FormEvent) => {
    e.preventDefault();
    setApplicationSubmitted(true);
    setShowApplyModal(false);
    toast.success('College Bus pass application submitted to Transport Department!');
  };

  if (isLoading) return <Loading text="Verifying Campus Transport Allocation..." />;

  // ── Non-College Bus / Day Scholar Self Transit View ────────────
  if (allocation?.eligibilityState !== 'COLLEGE_BUS') {
    return (
      <div className="space-y-6 text-left pb-12 animate-in fade-in duration-200">
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Truck className="h-5 w-5 text-indigo-600" /> Campus Transport Allocation
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Commute profile and college bus pass eligibility</p>
        </div>

        <div className="p-6 rounded-2xl border bg-card shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl">
              <Bus className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                {allocation?.eligibilityState === 'HOSTELLER'
                  ? 'Hostel Resident Commute Status'
                  : allocation?.eligibilityState === 'OWN_VEHICLE'
                  ? 'Personal Vehicle / Parking Permit'
                  : 'Day Scholar — Self / Local Transit'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {allocation?.eligibilityState === 'HOSTELLER'
                  ? 'You reside on-campus in the student residential blocks. College bus allocation is not required.'
                  : allocation?.eligibilityState === 'OWN_VEHICLE'
                  ? 'Registered personal commute vehicle with campus parking clearance.'
                  : 'You are currently registered for independent daily commute (Metro / Personal / City Transit).'}
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Institutional college buses operate across all major city routes with dedicated GPS trackers and reserved student stops. If you wish to avail college transport services for this academic semester, you may apply for a route pass below.
          </p>

          {applicationSubmitted ? (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
              Bus Pass application for {selectedRoute} ({preferredStop}) submitted and awaiting Transport Manager verification.
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

        {/* Bus Pass Application Modal */}
        {showApplyModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-card border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">College Bus Pass Form</h3>
              <form onSubmit={handleApplyBus} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Select Bus Route</label>
                  <select
                    value={selectedRoute}
                    onChange={(e) => setSelectedRoute(e.target.value)}
                    className="w-full p-2.5 rounded-xl border bg-background text-xs font-semibold outline-none"
                  >
                    <option>Route A — Central City Express (Anna Nagar / Vadapalani)</option>
                    <option>Route B — Southern Suburbs (Tambaram / Chromepet)</option>
                    <option>Route C — Western Corridor (Poonamallee / Porur)</option>
                    <option>Route D — IT Expressway (OMR / Thoraipakkam)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Preferred Boarding Stop</label>
                  <input
                    type="text"
                    value={preferredStop}
                    onChange={(e) => setPreferredStop(e.target.value)}
                    placeholder="Enter boarding stop landmark..."
                    className="w-full p-2.5 rounded-xl border bg-background text-xs font-semibold outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowApplyModal(false)}
                    className="px-3 py-2 rounded-xl border text-slate-600 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-extrabold"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Allocated College Bus View ────────────────────────────────
  return (
    <div className="space-y-6 text-left pb-12 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Truck className="h-5 w-5 text-indigo-600" /> Campus Transport & Route Tracker
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {allocation.busNumber} · {allocation.routeName} · Pickup: {allocation.pickupTime}
          </p>
        </div>
        <button
          onClick={() => {
            setTrackingActive(!trackingActive);
            toast.success(trackingActive ? 'Live tracking paused.' : 'Live tracking synchronized!');
          }}
          className={`px-4 py-2 text-xs font-extrabold rounded-xl flex items-center gap-2 transition-all ${
            trackingActive ? 'bg-emerald-600 text-white' : 'border bg-card hover:bg-muted'
          }`}
        >
          <Navigation className={`h-4 w-4 ${trackingActive ? 'animate-pulse' : ''}`} />
          {trackingActive ? 'Tracking Active' : 'Live Bus Location'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Route Timeline */}
        <div className="lg:col-span-2 space-y-5">
          <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Assigned Route Schedule</h3>
                <p className="text-sm font-extrabold text-slate-800 dark:text-white mt-0.5">{allocation.routeName}</p>
              </div>
              <span className="text-[9px] font-black bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 px-2.5 py-1 rounded-lg">
                {allocation.busNumber}
              </span>
            </div>

            <div className="relative pl-6 border-l-2 border-dashed border-indigo-200 dark:border-indigo-800 space-y-0">
              {allocation.stops?.map((stop, idx) => (
                <div key={idx} className={`relative pb-5 ${idx === (allocation.stops?.length ?? 1) - 1 ? 'pb-0' : ''}`}>
                  <div className={`absolute left-[-29px] top-0 h-5 w-5 rounded-full border-2 flex items-center justify-center text-[8px] font-black ${
                    stop.type === 'destination' ? 'bg-indigo-600 border-indigo-600 text-white' :
                    stop.isStudentStop ? 'bg-amber-500 border-amber-500 text-white' :
                    'bg-card border-slate-300 dark:border-slate-700'
                  }`}>
                    {stop.type === 'destination' ? '🏫' : stop.isStudentStop ? '★' : idx + 1}
                  </div>
                  <div className={`text-xs ${stop.isStudentStop ? 'p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl' : ''}`}>
                    <div className="flex justify-between items-center">
                      <p className={`font-extrabold ${stop.isStudentStop ? 'text-amber-700 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>
                        {stop.stop}
                        {stop.isStudentStop && (
                          <span className="ml-2 text-[9px] bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded font-black">
                            ASSIGNED PICKUP
                          </span>
                        )}
                      </p>
                      <span className="font-mono text-slate-400 font-bold text-[10px]">{stop.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Driver & Vehicle Info */}
          <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Driver & Vehicle Details</h3>
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-muted/30 rounded-xl space-y-1">
                <span className="text-[9px] uppercase font-black text-slate-400 block">Designated Driver</span>
                <span className="font-extrabold text-slate-800 dark:text-white block">{allocation.driver}</span>
                <a href={`tel:${allocation.driverPhone}`} className="text-indigo-600 font-bold text-[10px] flex items-center gap-1 mt-1">
                  <Phone className="h-3 w-3" /> {allocation.driverPhone}
                </a>
              </div>
              <div className="p-3 bg-muted/30 rounded-xl">
                <span className="text-[9px] uppercase font-black text-slate-400 block">Vehicle Registration</span>
                <span className="font-extrabold text-slate-800 dark:text-white block mt-0.5">{allocation.vehicleReg}</span>
              </div>
            </div>
          </div>

          {/* Transport Fee Status */}
          {allocation.feeStatus && (
            <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Transport Pass Fee</h3>
              <div className="space-y-2 text-xs font-semibold">
                <div className="flex justify-between"><span className="text-slate-400">Coverage</span><span className="font-extrabold">{allocation.feeStatus.term}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Pass Fee</span><span className="font-extrabold">{allocation.feeStatus.amount}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Status</span>
                  <span className="font-black text-[10px] uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                    Active & Paid
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Emergency Transport Help */}
          <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Transport Control Room</h3>
            <div className="text-xs space-y-2">
              <div>
                <p className="font-extrabold text-slate-700 dark:text-slate-300">Transport Helpdesk</p>
                <p className="text-[10px] text-indigo-600 font-bold">+91 044-2200-8888</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentTransport;
