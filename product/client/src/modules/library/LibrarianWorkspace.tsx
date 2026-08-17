import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen, Search, RotateCcw, Clock, AlertTriangle,
  Users, TrendingUp, Plus, BookMarked, ChevronRight,
  CheckCircle2, XCircle, Download, Filter
} from 'lucide-react';
import api from '../../lib/axios';
import { useInstitution } from '../../context/InstitutionContext';

/* ─── Metric Card ─────────────────────────────────────────────── */
function MetricCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string | number; icon: React.ElementType;
  color: string; sub?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-4">
      <div className={`p-2.5 rounded-lg ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/* ─── Transaction Row ─────────────────────────────────────────── */
function TransactionRow({ item, onReturn }: { item: any; onReturn?: (id: string) => void }) {
  const isOverdue = item.dueDate && new Date(item.dueDate) < new Date() && item.status === 'ISSUED';
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/40 transition-colors">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
        item.status === 'RETURNED' ? 'bg-emerald-500' :
        isOverdue ? 'bg-red-500' : 'bg-blue-500'
      }`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{item.bookTitle || item.title}</p>
        <p className="text-xs text-muted-foreground">{item.studentName || item.borrower} · {item.issueDate ? new Date(item.issueDate).toLocaleDateString('en-IN') : '—'}</p>
      </div>
      <div className="flex items-center gap-2">
        {isOverdue && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-medium">OVERDUE</span>}
        {item.status === 'RETURNED' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-medium">RETURNED</span>}
        {item.status === 'ISSUED' && !isOverdue && onReturn && (
          <button
            onClick={() => onReturn(item.id)}
            className="text-[10px] px-2 py-1 rounded border border-border hover:bg-muted text-foreground transition-colors"
          >Return</button>
        )}
      </div>
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────────── */
export default function LibrarianWorkspace() {
  const { collegeName } = useInstitution();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'issued' | 'catalog'>('overview');

  const { data: statsData } = useQuery({
    queryKey: ['library-stats'],
    queryFn: async () => {
      try {
        const res = await api.get('/enterprise/library/stats');
        return res.data?.data;
      } catch {
        return null;
      }
    },
    staleTime: 60_000,
  });

  const { data: transactionsData } = useQuery({
    queryKey: ['library-transactions', search],
    queryFn: async () => {
      try {
        const res = await api.get('/enterprise/library/transactions', {
          params: { search: search || undefined, limit: 50 },
        });
        return res.data?.data?.transactions || res.data?.data || [];
      } catch {
        return [];
      }
    },
    staleTime: 30_000,
  });

  const transactions: any[] = Array.isArray(transactionsData) ? transactionsData : [];
  const stats = statsData || {};

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <BookOpen className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground">Library Management</h1>
              <p className="text-xs text-muted-foreground">{collegeName} · {today}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              <Plus className="h-3.5 w-3.5" /> Issue Book
            </button>
            <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-foreground">
              <Download className="h-3.5 w-3.5" /> Export
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Total Books" value={stats.totalBooks ?? '—'} icon={BookOpen}
            color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
            sub={`${stats.availableBooks ?? 0} available`} />
          <MetricCard label="Issued Today" value={stats.issuedToday ?? '—'} icon={BookMarked}
            color="bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
            sub="transactions today" />
          <MetricCard label="Returned Today" value={stats.returnedToday ?? '—'} icon={RotateCcw}
            color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" />
          <MetricCard label="Overdue" value={stats.overdueCount ?? '—'} icon={AlertTriangle}
            color="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
            sub="require follow-up" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
          {(['overview', 'issued', 'catalog'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-xs px-4 py-1.5 rounded-md transition-colors capitalize ${
                activeTab === tab
                  ? 'bg-background text-foreground shadow-sm font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'issued' ? 'Issued Books' : tab === 'catalog' ? 'Book Catalog' : 'Overview'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search books, students…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Transactions */}
        <div className="bg-card border border-border rounded-xl">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              {activeTab === 'issued' ? 'Currently Issued' : 'Recent Transactions'}
            </h2>
            <span className="text-xs text-muted-foreground">{transactions.length} records</span>
          </div>
          <div className="p-2 divide-y divide-border/50">
            {transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No transactions found</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Book issue/return records will appear here</p>
              </div>
            ) : (
              transactions.map((item: any) => (
                <TransactionRow key={item.id} item={item} />
              ))
            )}
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">Active Borrowers</h3>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.activeBorrowers ?? '—'}</p>
            <p className="text-xs text-muted-foreground mt-1">Students with issued books</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">This Month</h3>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.monthlyTransactions ?? '—'}</p>
            <p className="text-xs text-muted-foreground mt-1">Total transactions</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">Avg Return Time</h3>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.avgReturnDays ?? '—'}<span className="text-sm font-normal text-muted-foreground ml-1">days</span></p>
            <p className="text-xs text-muted-foreground mt-1">Policy: 14 days</p>
          </div>
        </div>
      </div>
    </div>
  );
}
