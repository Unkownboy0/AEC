import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Bus,
  Navigation,
  MapPin,
  Compass,
  Zap,
  AlertTriangle,
  RotateCcw,
  Clock,
  Layers,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export interface MapStop {
  id: string;
  name: string;
  sequence: number;
  pickupTime?: string;
  dropTime?: string;
  isPassengerStop?: boolean;
  latitude: number;
  longitude: number;
}

export interface LiveLocationData {
  latitude: number;
  longitude: number;
  speedKmH?: number;
  heading?: number;
  recordedAt?: string;
  ageSeconds?: number | null;
  isStale?: boolean;
  statusText?: string;
}

interface LiveBusMapProps {
  vehicleNumber?: string;
  routeName?: string;
  stops: MapStop[];
  assignedStop?: MapStop;
  liveLocation?: LiveLocationData;
  tripStatus?: string;
  etaMinutes?: number;
  distanceKm?: number;
  onRefresh?: () => void;
}

export const LiveBusMap: React.FC<LiveBusMapProps> = ({
  vehicleNumber = 'TN 38 BX 4421',
  routeName = 'Route 06 — Vadavalli Metro',
  stops = [],
  assignedStop,
  liveLocation,
  tripStatus = 'IN_PROGRESS',
  etaMinutes = 10,
  distanceKm = 3.2,
  onRefresh,
}) => {
  const [isCentered, setIsCentered] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState<'BUS' | 'MY_STOP' | 'CAMPUS' | string | null>('BUS');
  const [mapZoom, setMapZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Interpolated smooth coordinate state
  const [currentPos, setCurrentPos] = useState({
    lat: liveLocation?.latitude || 13.0827,
    lng: liveLocation?.longitude || 80.2707,
  });

  // Calculate bounding box and SVG coordinates for the stops and bus
  const { normalizedStops, busSvgPos, myStopSvgPos, campusSvgPos, pathD } = useMemo(() => {
    if (!stops || stops.length === 0) {
      return {
        normalizedStops: [],
        busSvgPos: { x: 50, y: 50 },
        myStopSvgPos: { x: 70, y: 35 },
        campusSvgPos: { x: 90, y: 20 },
        pathD: 'M 10 80 Q 40 60 70 35 T 90 20',
      };
    }

    const lats = stops.map((s) => s.latitude || 13.0827);
    const lngs = stops.map((s) => s.longitude || 80.2707);

    if (liveLocation?.latitude) lats.push(liveLocation.latitude);
    if (liveLocation?.longitude) lngs.push(liveLocation.longitude);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latRange = maxLat - minLat || 0.01;
    const lngRange = maxLng - minLng || 0.01;

    // Convert lat/lng to SVG percentage viewBox (10% padding to 90%)
    const norm = stops.map((s) => {
      const x = 12 + (((s.longitude || 80.2707) - minLng) / lngRange) * 76;
      // Invert latitude for SVG Y (higher lat = lower Y)
      const y = 88 - (((s.latitude || 13.0827) - minLat) / latRange) * 76;
      return {
        ...s,
        svgX: Math.max(10, Math.min(90, x)),
        svgY: Math.max(10, Math.min(90, y)),
      };
    });

    const bX = liveLocation
      ? Math.max(10, Math.min(90, 12 + ((liveLocation.longitude - minLng) / lngRange) * 76))
      : norm[0]?.svgX || 50;
    const bY = liveLocation
      ? Math.max(10, Math.min(90, 88 - ((liveLocation.latitude - minLat) / latRange) * 76))
      : norm[0]?.svgY || 50;

    const myStop = norm.find((s) => s.id === assignedStop?.id || s.isPassengerStop);
    const myStopPos = myStop ? { x: myStop.svgX, y: myStop.svgY } : { x: 65, y: 40 };

    const campusStop = norm[norm.length - 1];
    const campusPos = campusStop ? { x: campusStop.svgX, y: campusStop.svgY } : { x: 88, y: 15 };

    // Generate smooth curve path through ordered stops
    let d = '';
    norm.forEach((pt, idx) => {
      if (idx === 0) d += `M ${pt.svgX} ${pt.svgY}`;
      else d += ` L ${pt.svgX} ${pt.svgY}`;
    });

    return {
      normalizedStops: norm,
      busSvgPos: { x: bX, y: bY },
      myStopSvgPos: myStopPos,
      campusSvgPos: campusPos,
      pathD: d,
    };
  }, [stops, liveLocation, assignedStop]);

  // Smooth position updates when new GPS data arrives
  useEffect(() => {
    if (liveLocation?.latitude && liveLocation?.longitude) {
      setCurrentPos({
        lat: liveLocation.latitude,
        lng: liveLocation.longitude,
      });
    }
  }, [liveLocation?.latitude, liveLocation?.longitude]);

  // Drag interaction handlers for interactive map feel
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    setIsCentered(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const recenter = () => {
    setPanOffset({ x: 0, y: 0 });
    setMapZoom(1);
    setIsCentered(true);
    setSelectedMarker('BUS');
  };

  return (
    <div className="relative w-full h-[380px] sm:h-[460px] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 shadow-xl select-none flex flex-col justify-between">
      {/* ── Top Floating Overlay: Route Status & Freshness ── */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto bg-slate-900/90 dark:bg-slate-900/95 backdrop-blur-md border border-slate-700/80 px-3.5 py-2 rounded-2xl shadow-lg flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                liveLocation?.isStale ? 'bg-amber-500' : 'bg-emerald-500'
              } animate-ping absolute`}
            />
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                liveLocation?.isStale ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
          </div>
          <div>
            <div className="text-[11px] font-black text-white tracking-wide flex items-center gap-1.5">
              <span>{routeName}</span>
              <span className="text-slate-400 font-normal">•</span>
              <span className="text-indigo-400 font-bold">{vehicleNumber}</span>
            </div>
            <div className="text-[10px] font-medium text-slate-400">
              {liveLocation?.isStale ? (
                <span className="text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Location not updated recently
                </span>
              ) : (
                <span>Live GPS • Updated {liveLocation?.ageSeconds || 4}s ago</span>
              )}
            </div>
          </div>
        </div>

        {/* ETA Badge */}
        <div className="pointer-events-auto bg-indigo-600/95 backdrop-blur-md text-white border border-indigo-400/40 px-3.5 py-2 rounded-2xl shadow-lg text-right">
          <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 flex items-center gap-1 justify-end">
            <Clock className="w-3 h-3" /> Arriving in
          </div>
          <div className="text-sm sm:text-base font-black tracking-tight">
            ~{etaMinutes} min <span className="text-[10px] font-normal text-indigo-200">({distanceKm} km)</span>
          </div>
        </div>
      </div>

      {/* ── Interactive Map Canvas Viewport ── */}
      <div
        className="relative w-full h-full cursor-grab active:cursor-grabbing overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Map Grid / Styled Road Background */}
        <div
          className="absolute inset-0 bg-[#0B1120] transition-transform duration-75"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${mapZoom})`,
            transformOrigin: 'center center',
          }}
        >
          {/* Subtle Institutional Map Texture Lines */}
          <svg className="w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="roadGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#roadGrid)" />
          </svg>

          {/* SVG Vector Route Geometry & Markers */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {/* Route Outer Glow */}
            <path
              d={pathD}
              fill="none"
              stroke="#6366F1"
              strokeWidth="1.8"
              strokeOpacity="0.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Route Polyline */}
            <path
              d={pathD}
              fill="none"
              stroke="#818CF8"
              strokeWidth="0.9"
              strokeDasharray="2, 1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Stops Along Route */}
            {normalizedStops.map((stop) => {
              const isAssigned = stop.id === assignedStop?.id || stop.isPassengerStop;
              const isCampus = stop.sequence === normalizedStops.length;

              if (isAssigned || isCampus) return null; // Rendered with custom HTML markers below for rich interactivity

              return (
                <circle
                  key={stop.id}
                  cx={stop.svgX}
                  cy={stop.svgY}
                  r="1.2"
                  fill="#94A3B8"
                  stroke="#1E293B"
                  strokeWidth="0.5"
                />
              );
            })}
          </svg>

          {/* ── High-Impact HTML Markers Overlaid on Canvas ── */}

          {/* 1. Regular Sequence Stops (Labeled) */}
          {normalizedStops.map((stop) => {
            const isAssigned = stop.id === assignedStop?.id || stop.isPassengerStop;
            const isCampus = stop.sequence === normalizedStops.length;
            if (isAssigned || isCampus) return null;

            return (
              <div
                key={`stop-${stop.id}`}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                style={{ left: `${stop.svgX}%`, top: `${stop.svgY}%` }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedMarker(stop.id);
                }}
              >
                <div className="w-4 h-4 rounded-full bg-slate-800 border-2 border-slate-400 flex items-center justify-center text-[8px] font-black text-slate-300 shadow-md group-hover:scale-125 transition-transform">
                  {stop.sequence}
                </div>
                <div className="hidden group-hover:block absolute bottom-5 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900/95 border border-slate-700 text-white text-[9px] font-semibold rounded-lg whitespace-nowrap shadow-xl z-20">
                  {stop.name} ({stop.pickupTime || 'Scheduled'})
                </div>
              </div>
            );
          })}

          {/* 2. My Stop Marker (High Visibility Green Badge) */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20"
            style={{ left: `${myStopSvgPos.x}%`, top: `${myStopSvgPos.y}%` }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedMarker('MY_STOP');
            }}
          >
            <div className="relative flex flex-col items-center">
              <div className="px-2 py-0.5 bg-emerald-500 text-slate-950 font-black text-[9px] rounded-md shadow-lg flex items-center gap-1 mb-1 animate-bounce">
                <MapPin className="w-2.5 h-2.5 fill-current" /> My Stop
              </div>
              <div className="w-5 h-5 rounded-full bg-emerald-500 border-2 border-white shadow-xl flex items-center justify-center text-white">
                <div className="w-2 h-2 rounded-full bg-slate-950" />
              </div>
            </div>
          </div>

          {/* 3. Campus / Destination Terminal Marker */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20"
            style={{ left: `${campusSvgPos.x}%`, top: `${campusSvgPos.y}%` }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedMarker('CAMPUS');
            }}
          >
            <div className="relative flex flex-col items-center">
              <div className="px-2 py-0.5 bg-indigo-500 text-white font-black text-[9px] rounded-md shadow-lg flex items-center gap-1 mb-1">
                🏫 Main Campus
              </div>
              <div className="w-5 h-5 rounded-full bg-indigo-600 border-2 border-white shadow-xl flex items-center justify-center text-white text-[9px] font-black">
                ★
              </div>
            </div>
          </div>

          {/* 4. Live Vehicle Bus Marker (Animated Pulse + Heading) */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30 transition-all duration-700 ease-out"
            style={{ left: `${busSvgPos.x}%`, top: `${busSvgPos.y}%` }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedMarker('BUS');
            }}
          >
            <div className="relative flex flex-col items-center">
              {/* Radar pulse wave */}
              <div className="absolute -inset-2 bg-indigo-500/30 rounded-full animate-ping pointer-events-none" />
              <div className="px-2.5 py-0.5 bg-indigo-600 border border-indigo-400/50 text-white font-black text-[10px] rounded-full shadow-2xl flex items-center gap-1 mb-1 whitespace-nowrap">
                <Bus className="w-3 h-3" /> {vehicleNumber}
              </div>
              <div className="w-7 h-7 rounded-2xl bg-indigo-600 border-2 border-white shadow-2xl flex items-center justify-center text-white">
                <Navigation
                  className="w-4 h-4 fill-white transition-transform duration-500"
                  style={{
                    transform: `rotate(${liveLocation?.heading || 45}deg)`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Floating Controls: Zoom, Recenter & Selected Info ── */}
      <div className="absolute bottom-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
        {/* Recenter / Focus Button */}
        <div className="pointer-events-auto flex items-center gap-2">
          {!isCentered && (
            <button
              onClick={recenter}
              className="px-3.5 py-2 bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 rounded-xl text-xs font-bold shadow-xl backdrop-blur-md flex items-center gap-1.5 transition-all active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5 text-indigo-400" /> Recenter Bus
            </button>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/90 border border-slate-700 p-1 rounded-xl shadow-xl backdrop-blur-md">
          <button
            onClick={() => setMapZoom((prev) => Math.min(2.2, prev + 0.25))}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-black flex items-center justify-center transition-all"
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={() => setMapZoom((prev) => Math.max(0.75, prev - 0.25))}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-black flex items-center justify-center transition-all"
            title="Zoom Out"
          >
            -
          </button>
        </div>
      </div>
    </div>
  );
};
