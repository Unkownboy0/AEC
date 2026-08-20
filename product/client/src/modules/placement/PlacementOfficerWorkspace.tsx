import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Briefcase, Users, Trophy, TrendingUp, Building2,
  Plus, Search, Calendar, ChevronRight, Target,
  FileText, CheckCircle2, Clock, Star, Download
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

function DriveCard({ drive }: { drive: any }) {
  const statusMap: Record<string, { label: string; cls: string }> = {
    UPCOMING: { label: 'Upcoming', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    ACTIVE: { label: 'Active', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    COMPLETED: { label: 'Completed', cls: 'bg-muted text-muted-foreground' },
    CANCELLED: { label: 'Cancelled', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  };
  const status = statusMap[drive.status] || statusMap['UPCOMING'];

  return (
    <div className="p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors cursor-pointer group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-violet-100 dark:bg-violet-900/30">
            <Building2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
            {drive.companyName}
          </p>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${status.cls}`}>
          {status.label}
        </span>
      </div>
      <p className="text-xs text-muted-foreground truncate">{drive.role || drive.position}</p>
      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          <span>{drive.applicantsCount ?? 0} applicants</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>{drive.driveDate ? new Date(drive.driveDate).toLocaleDateString('en-IN') : 'TBD'}</span>
        </div>
        {drive.ctcRange && (
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3" />
            <span>{drive.ctcRange}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function OfferRow({ offer }: { offer: any }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/40 transition-colors">
      <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{offer.studentName}</p>
        <p className="text-xs text-muted-foreground">{offer.companyName} · {offer.role || offer.position}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs font-semibold text-emerald-600">{offer.ctc || offer.package}</p>
        <p className="text-xs text-muted-foreground">{offer.department}</p>
      </div>
    </div>
  );
}

export default function PlacementOfficerWorkspace() {
  const { collegeName } = useInstitution();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'drives' | 'offers'>('drives');

  const { data: statsData } = useQuery({
    queryKey: ['placement-stats'],
    queryFn: async () => {
      try {
        const res = await api.get('/enterprise/placement/stats');
        return res.data?.data;
      } catch { return null; }
    },
    staleTime: 60_000,
  });

  const { data: drivesData } = useQuery({
    queryKey: ['placement-drives', search],
    queryFn: async () => {
      try {
        const res = await api.get('/enterprise/placement/drives', {
          params: { search: search || undefined, limit: 20 },
        });
        return res.data?.data?.drives || res.data?.data || [];
      } catch { return []; }
    },
    staleTime: 30_000,
  });

  const { data: offersData } = useQuery({
    queryKey: ['placement-offers'],
    queryFn: async () => {
      try {
        const res = await api.get('/enterprise/placement/offers', { params: { limit: 30 } });
        return res.data?.data?.offers || res.data?.data || [];
      } catch { return []; }
    },
    staleTime: 30_000,
  });

  const stats = statsData || {};
  const drives: any[] = Array.isArray(drivesData) ? drivesData : [];
  const offers: any[] = Array.isArray(offersData) ? offersData : [];
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const academicYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
              <Briefcase className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground">Placement Cell</h1>
              <p className="text-xs text-muted-foreground">{collegeName} · {academicYear}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              <Plus className="h-3.5 w-3.5" /> New Drive
            </button>
            <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-foreground">
              <Download className="h-3.5 w-3.5" /> Report
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Placed Students" value={stats.placedCount ?? '—'} icon={CheckCircle2}
            color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
            sub={`of ${stats.eligibleCount ?? 0} eligible`} />
          <StatCard label="Active Drives" value={stats.activeDrives ?? '—'} icon={Briefcase}
            color="bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400" />
          <StatCard label="Companies" value={stats.companiesCount ?? '—'} icon={Building2}
            color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" sub="this year" />
          <StatCard label="Highest CTC" value={stats.highestCtc ?? '—'} icon={TrendingUp}
            color="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
            sub={stats.avgCtc ? `Avg: ${stats.avgCtc}` : undefined} />
        </div>

        {/* Placement % Banner */}
        {stats.placementPct != null && (
          <div className="bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Placement Rate {academicYear}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stats.placedCount} students placed out of {stats.eligibleCount} eligible</p>
            </div>
            <div className="text-3xl font-black text-violet-600 dark:text-violet-400">
              {stats.placementPct}%
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
          {(['drives', 'offers'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`text-xs px-4 py-1.5 rounded-md transition-colors capitalize ${
                activeTab === tab ? 'bg-background text-foreground shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'
              }`}>
              {tab === 'drives' ? 'Placement Drives' : tab === 'offers' ? 'Offer Letters' : 'Eligible Students'}
            </button>
          ))}
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search companies, drives…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>

        {activeTab === 'drives' && (
          <div>
            {drives.length === 0 ? (
              <div className="bg-card border border-border rounded-xl flex flex-col items-center justify-center py-16 text-center">
                <Briefcase className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No drives scheduled yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Create a placement drive to get started</p>
                <button className="mt-4 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                  <Plus className="h-3.5 w-3.5" /> Schedule First Drive
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {drives.map((drive: any) => <DriveCard key={drive.id} drive={drive} />)}
              </div>
            )}
          </div>
        )}

        {activeTab === 'offers' && (
          <div className="bg-card border border-border rounded-xl">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Offer Letters</h2>
              <span className="text-xs text-muted-foreground">{offers.length} offers</span>
            </div>
            <div className="p-2 divide-y divide-border/50">
              {offers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Trophy className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No offer letters yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Offers will appear after drives are completed</p>
                </div>
              ) : (
                offers.map((offer: any) => <OfferRow key={offer.id} offer={offer} />)
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
