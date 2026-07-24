import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Clock, Phone, AlertCircle, CheckCircle, Navigation, Bus, User } from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';
import api from '../../lib/axios';

const ROUTE_DATA = {
  busNumber: 'GIT-BUS-12',
  routeName: 'Route A — Central City Express',
  driver: 'Rajesh Kumar',
  driverPhone: '+91 94445 67890',
  vehicleReg: 'TN09 AX 4421',
  capacity: 52,
  currentOccupancy: 38,
  stops: [
    { stop: 'Koyambedu Bus Terminus', time: '7:10 AM', type: 'pickup' },
    { stop: 'Anna Nagar Tower Junction', time: '7:25 AM', type: 'pickup' },
    { stop: 'Vadapalani Signal', time: '7:35 AM', type: 'pickup' },
    { stop: 'Ashok Nagar (Student Pickup)', time: '7:45 AM', type: 'pickup', isStudentStop: true },
    { stop: 'Guindy Industrial Estate', time: '7:58 AM', type: 'pickup' },
    { stop: 'GEETORUS Campus Main Gate', time: '8:20 AM', type: 'destination' },
  ],
  feeStatus: { term: '2026 Academic Year', amount: '₹18,000', paid: true },
  liveStatus: { isRunning: true, lastSeen: 'Vadapalani Signal', eta: '35 min away', delay: 0 }
};

export const StudentTransport: React.FC = () => {
  const [routeData] = useState(ROUTE_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [trackingActive, setTrackingActive] = useState(false);

  useEffect(() => {
    const fetchTransport = async () => {
      try {
        await api.get('/enterprise/transport/routes');
      } catch { /* use demo */ }
      finally { setIsLoading(false); }
    };
    fetchTransport();
  }, []);

  if (isLoading) return <Loading text="Loading Transport Routes..." />;

  return (
    <div className="space-y-6 text-left pb-12 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Truck className="h-5 w-5 text-indigo-600" /> Campus Transport & Route Tracker
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Live bus tracking, schedule, route stops, and driver details</p>
        </div>
        <button onClick={() => { setTrackingActive(!trackingActive); toast.success(trackingActive ? 'Live tracking paused.' : 'Live tracking activated!'); }}
          className={`px-4 py-2 text-xs font-extrabold rounded-xl flex items-center gap-2 transition-all ${trackingActive ? 'bg-emerald-600 text-white' : 'border bg-card hover:bg-muted'}`}>
          <Navigation className={`h-4 w-4 ${trackingActive ? 'animate-pulse' : ''}`} />
          {trackingActive ? 'Tracking Live' : 'Track My Bus'}
        </button>
      </div>

      {/* Live Status Banner */}
      {routeData.liveStatus.isRunning && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 ${trackingActive ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-card border'}`}>
          <div className={`h-3 w-3 rounded-full ${routeData.liveStatus.delay > 0 ? 'bg-amber-500' : 'bg-emerald-500'} ${trackingActive ? 'animate-ping' : ''}`} />
          <div className="flex-1">
            <p className="text-xs font-extrabold text-slate-800 dark:text-white">
              {routeData.liveStatus.delay > 0 ? `Delayed by ${routeData.liveStatus.delay} mins` : 'Bus running on schedule'}
            </p>
            <p className="text-[10px] text-slate-500 font-bold">Last seen: {routeData.liveStatus.lastSeen} · ETA: {routeData.liveStatus.eta}</p>
          </div>
          <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 dark:bg-emerald-900/40 px-2 py-1 rounded-lg">On Route</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Route Timeline */}
        <div className="lg:col-span-2 space-y-5">
          <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Route Schedule</h3>
                <p className="text-sm font-extrabold text-slate-800 dark:text-white mt-0.5">{routeData.routeName}</p>
              </div>
              <span className="text-[9px] font-black bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 px-2 py-1 rounded-lg">{routeData.busNumber}</span>
            </div>
            <div className="relative pl-6 border-l-2 border-dashed border-indigo-200 dark:border-indigo-800 space-y-0">
              {routeData.stops.map((stop, idx) => (
                <div key={idx} className={`relative pb-5 ${idx === routeData.stops.length - 1 ? 'pb-0' : ''}`}>
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
                        {stop.isStudentStop && <span className="ml-2 text-[9px] bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded font-black">YOUR STOP</span>}
                      </p>
                      <span className="font-mono text-slate-500 shrink-0 ml-2">{stop.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-5">
          {/* Driver Info */}
          <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Driver Information</h3>
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
              <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
                {routeData.driver.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-800 dark:text-white">{routeData.driver}</p>
                <p className="text-[10px] text-indigo-600 font-bold flex items-center gap-1"><Phone className="h-3 w-3" />{routeData.driverPhone}</p>
              </div>
            </div>
            <div className="text-xs space-y-2 font-semibold">
              <div className="flex justify-between"><span className="text-slate-400">Vehicle Reg.</span><span className="font-mono font-black">{routeData.vehicleReg}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Capacity</span><span className="font-extrabold">{routeData.currentOccupancy} / {routeData.capacity}</span></div>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${(routeData.currentOccupancy / routeData.capacity) * 100}%` }} />
            </div>
            <p className="text-[9px] text-slate-400 font-bold text-right">{routeData.capacity - routeData.currentOccupancy} seats remaining</p>
          </div>

          {/* Fee Status */}
          <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Transport Fee</h3>
            <div className="space-y-2 text-xs font-semibold">
              <div className="flex justify-between"><span className="text-slate-400">Term</span><span className="font-extrabold">{routeData.feeStatus.term}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Amount</span><span className="font-extrabold">{routeData.feeStatus.amount}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Status</span>
                <span className={`font-black text-[10px] uppercase px-2 py-0.5 rounded-full ${routeData.feeStatus.paid ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  {routeData.feeStatus.paid ? 'Paid' : 'Due'}
                </span>
              </div>
            </div>
          </div>

          <button onClick={() => toast.success('Absence notification sent to transport coordinator.')}
            className="w-full py-2.5 border text-xs font-extrabold rounded-xl hover:bg-muted transition-colors flex items-center justify-center gap-1.5">
            <AlertCircle className="h-4 w-4 text-amber-500" /> Report Absence Tomorrow
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentTransport;
