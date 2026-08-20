import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, Clock, MapPin, Navigation, ArrowRight, ShieldCheck } from 'lucide-react';

interface MyBusDashboardCardProps {
  routeName?: string;
  vehicleNumber?: string;
  stopName?: string;
  pickupTime?: string;
  etaMinutes?: number;
  distanceKm?: number;
  tripStatus?: string;
  isStale?: boolean;
  targetRoute?: string;
}

export const MyBusDashboardCard: React.FC<MyBusDashboardCardProps> = ({
  routeName = 'Route 06 — Vadavalli Metro',
  vehicleNumber = 'TN 38 BX 4421',
  stopName = 'Navavoor Pirivu',
  pickupTime = '07:35 AM',
  etaMinutes = 10,
  distanceKm = 3.2,
  tripStatus = 'IN_PROGRESS',
  isStale = false,
  targetRoute = '/student/transport',
}) => {
  const navigate = useNavigate();

  return (
    <div className="p-5 rounded-3xl bg-linear-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/20 shadow-xl relative overflow-hidden group transition-all hover:border-indigo-500/40">
      {/* Background Glow */}
      <div className="absolute -right-12 -top-12 w-32 h-32 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-2xl shadow-inner group-hover:scale-105 transition-transform">
            <Bus className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-400">
                Campus Transport
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-400">Live Active</span>
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-white mt-0.5">
              {routeName}
            </h3>
          </div>
        </div>

        {/* ETA Bubble */}
        <div className="bg-indigo-600/30 border border-indigo-500/40 px-3 py-1.5 rounded-2xl text-right">
          <div className="text-[9px] font-bold text-indigo-300 uppercase flex items-center gap-1 justify-end">
            <Clock className="w-2.5 h-2.5" /> ETA
          </div>
          <div className="text-sm font-black text-white">
            ~{etaMinutes} min
          </div>
        </div>
      </div>

      {/* Stop & Vehicle Summary */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="truncate">
            <div className="text-[9px] font-semibold text-slate-400">Boarding Stop</div>
            <div className="font-bold text-white truncate">{stopName}</div>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2">
          <Navigation className="w-4 h-4 text-indigo-400 shrink-0" />
          <div className="truncate">
            <div className="text-[9px] font-semibold text-slate-400">Vehicle Assigned</div>
            <div className="font-bold text-white truncate">{vehicleNumber}</div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <span className="text-[11px] text-slate-400 font-medium">
          Pickup scheduled at <strong className="text-white">{pickupTime}</strong>
        </span>

        <button
          onClick={() => navigate(targetRoute)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
        >
          Track Live <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
