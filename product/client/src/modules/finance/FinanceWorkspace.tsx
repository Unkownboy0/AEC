import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  AlertTriangle, ArrowDownToLine, BadgeIndianRupee, BarChart3, Building2, Check, CheckCircle2, Clock3,
  CreditCard, FileDown, FileSearch, IndianRupee, Landmark, Loader2, Receipt, RefreshCw, Search, Send,
  ShieldCheck, UsersRound, X, Plus, RotateCcw, DollarSign, Wallet
} from 'lucide-react';
import api from '../../lib/axios';
import { toast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { downloadAndOpen } from '../../platform/download';

const money = (v: any) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const day = (v: any) => v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const Status = ({ value }: { value: string }) => (
  <span className={`inline-flex rounded-md px-2 py-1 text-[10px] font-extrabold ${
    String(value).includes('APPROVED') || value === 'SUCCEEDED' || value === 'RESOLVED' || value === 'HEALTHY'
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
      : String(value).includes('RETURN') || value === 'FAILED' || value === 'REJECTED' || value === 'WARNING'
      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
  }`}>
    {String(value).replaceAll('_', ' ')}
  </span>
);
const Card = ({ label, value, icon: Icon, tone = 'text-primary' }: any) => (
  <article className="rounded-2xl border border-border bg-card p-4 text-left shadow-xs">
    <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
      <span>{label}</span>
      <Icon className={`h-4 w-4 ${tone}`} />
    </div>
    <p className="mt-3 text-xl font-black tabular-nums text-foreground">{value}</p>
  </article>
);
const Empty = ({ text }: { text: string }) => <div className="py-14 text-center text-xs text-muted-foreground">{text}</div>;

export default function FinanceWorkspace() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const ao = pathname.startsWith('/ao');
  const principal = pathname.startsWith('/principal');
  const slug = pathname.split('/').filter(Boolean).slice(1).join('/') || 'dashboard';

  const [data, setData] = useState<any>(null);
  const [budgetsData, setBudgetsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState<Record<string, string>>({});

  // Modal State for Expenses & Reversals
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [showReversalModal, setShowReversalModal] = useState(false);
  const [reversalTargetId, setReversalTargetId] = useState('');
  const [reversalReason, setReversalReason] = useState('');

  // Form Inputs for Expense Voucher
  const [payeeName, setPayeeName] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('OPERATIONAL_EXPENSE');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');

  const section = principal ? 'dashboard' : slug;
  const endpoint = useMemo(() => {
    if (section === 'dashboard' || section === 'collection-overview' || section === 'pending-fees' || section === 'daily-collection') return '/finance/dashboard';
    if (section === 'fee-collection' || section === 'student-search') return null;
    if (section.includes('closing')) return '/finance/closings';
    if (section === 'reconciliation') return '/finance/reconciliation';
    if (section === 'audit-logs') return '/finance/audit-logs';
    if (section === 'budgets' || section === 'department-budgets') return '/finance/budgets';
    if (['refund-requests', 'refund-approvals'].includes(section)) return '/finance/requests?type=REFUND';
    if (['scholarships', 'scholarships-concessions'].includes(section)) return '/finance/requests';
    return '/finance/transactions';
  }, [section]);

  const load = async () => {
    setLoading(true);
    try {
      if (endpoint) {
        const r = await api.get(endpoint);
        setData(r.data.data);
      } else {
        setData(null);
      }
      const bRes = await api.get('/finance/budgets').catch(() => null);
      if (bRes?.data?.status === 'success') setBudgetsData(bRes.data.data);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Finance workspace could not load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();

    const handleFinanceUpdate = (e: any) => {
      const type = e?.detail?.type || e?.data?.type;
      if (!type || type.startsWith('FINANCE_')) {
        load();
      }
    };

    window.addEventListener('campusos:finance_sync', handleFinanceUpdate);
    window.addEventListener('rbac:change', handleFinanceUpdate);
    return () => {
      window.removeEventListener('campusos:finance_sync', handleFinanceUpdate);
      window.removeEventListener('rbac:change', handleFinanceUpdate);
    };
  }, [endpoint]);


  const search = async () => {
    if (!query.trim()) return;
    setBusy(true);
    try {
      const r = await api.get('/finance/students', { params: { q: query } });
      setStudents(r.data.data);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Student search failed');
    } finally {
      setBusy(false);
    }
  };

  const openStudent = async (id: string) => {
    setBusy(true);
    try {
      const r = await api.get(`/finance/students/${id}`);
      setSelected(r.data.data);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Fee account could not load');
    } finally {
      setBusy(false);
    }
  };

  const collect = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await api.post('/finance/payments/offline', Object.fromEntries(f.entries()));
      toast.success('Payment recorded, ledger posted and receipt generated');
      setSelected(null);
      setStudents([]);
      setQuery('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Payment could not be recorded');
    } finally {
      setBusy(false);
    }
  };

  const submitClosing = async () => {
    setBusy(true);
    try {
      const p = await api.get('/finance/closings/preview');
      await api.post('/finance/closings/submit', { ...p.data.data, remarks: 'Daily collection verified and submitted', cashCount: p.data.data.cashTotal });
      toast.success('Daily closing submitted to AO');
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Closing submission failed');
    } finally {
      setBusy(false);
    }
  };

  const reviewClosing = async (id: string, action: 'APPROVE' | 'RETURN' | 'QUERY') => {
    if (action !== 'APPROVE' && !reason[id]?.trim()) {
      toast.error('Enter a reason before returning or raising a query');
      return;
    }
    setBusy(true);
    try {
      await api.post(`/finance/closings/${id}/review`, { action, reason: reason[id] || '' });
      toast.success(`Closing ${action.toLowerCase()}d`);
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Closing review failed');
    } finally {
      setBusy(false);
    }
  };

  const reviewRequest = async (id: string, decision: 'APPROVE' | 'REJECT' | 'RETURN') => {
    if (decision !== 'APPROVE' && !reason[id]?.trim()) {
      toast.error('Enter a decision reason');
      return;
    }
    setBusy(true);
    try {
      await api.post(`/finance/requests/${id}/review`, { decision, reason: reason[id] || '' });
      toast.success(`Request ${decision.toLowerCase()}d`);
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Request review failed');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payeeName.trim() || !expenseAmount) return;
    try {
      setBusy(true);
      const res = await api.post('/finance/vouchers', {
        payeeName: payeeName.trim(),
        category: expenseCategory,
        amount: Number(expenseAmount),
        description: expenseDesc.trim() || undefined
      });
      if (res.data?.status === 'success') {
        toast.success(res.data.data?.status === 'SUBMITTED_TO_AO' ? 'Expense voucher submitted to AO for approval (>₹50k threshold)' : 'Expense voucher approved and posted!');
        setShowVoucherModal(false);
        setPayeeName('');
        setExpenseAmount('');
        setExpenseDesc('');
        load();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create voucher');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateReversal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reversalReason.trim()) return;
    try {
      setBusy(true);
      const res = await api.post('/finance/reversals', {
        targetPaymentId: reversalTargetId,
        reason: reversalReason.trim(),
        amount: 1000
      });
      if (res.data?.status === 'success') {
        toast.success('Immutable compensating reversal entry posted to finance ledger!');
        setShowReversalModal(false);
        setReversalReason('');
        load();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Reversal creation failed');
    } fontally: {
      setBusy(false);
    }
  };

  const exportReport = async (format: 'xlsx' | 'pdf') => {
    try {
      const res = await downloadAndOpen(
        `/finance/reports/transactions.${format}`,
        `CampusOS_Finance_Report.${format}`
      );
      if (res.success) {
        toast.success(`Finance report (${format.toUpperCase()}) downloaded successfully.`);
      } else {
        toast.error(res.error || 'Report export failed.');
      }
    } catch {
      toast.error('Report export failed');
    }
  };

  const title = section.split('-').map(w => w[0]?.toUpperCase() + w.slice(1)).join(' ');

  if (loading) return (
    <div className="mx-auto max-w-7xl space-y-4 pb-20 text-left">
      <div className="h-28 animate-pulse rounded-3xl bg-card border" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-28 animate-pulse rounded-2xl bg-card border" />)}
      </div>
      <div className="h-72 animate-pulse rounded-3xl bg-card border" />
    </div>
  );

  return (
    <main className="mx-auto max-w-7xl space-y-6 pb-24 text-left animate-in fade-in duration-200">
      <header className="relative overflow-hidden rounded-3xl border border-border bg-card px-5 py-6 sm:px-7 shadow-xs">
        <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-indigo-600">
              {principal ? 'Principal Finance Overview' : ao ? 'AO Finance Control & Governance' : 'Accountant Financial Workspace'}
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground sm:text-3xl">{title}</h1>
            <p className="mt-1 max-w-2xl text-xs leading-6 text-muted-foreground">
              {principal ? 'Read-only institutional finance monitoring & budget analytics.' : ao ? 'Review collections, approvals, vouchers, reversals, and financial controls.' : 'Collect fees, manage receipts, record expense vouchers, and close daily ledgers.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowVoucherModal(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="h-4 w-4" /> Record Expense Voucher
            </button>
            <button onClick={load} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-extrabold hover:bg-muted">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>
        </div>
      </header>

      {(section === 'dashboard' || section === 'collection-overview' || section === 'pending-fees' || section === 'daily-collection') && data && (
        <Dashboard data={data} ao={ao || principal} onSubmit={principal ? undefined : submitClosing} busy={busy} budgets={budgetsData} />
      )}

      {(section === 'fee-collection' || section === 'student-search') && (
        <section className="grid gap-5 lg:grid-cols-[.85fr_1.15fr]">
          <article className="rounded-3xl border bg-card p-5 shadow-xs space-y-4">
            <h2 className="font-extrabold text-sm">Find Student Fee Account</h2>
            <p className="text-xs text-muted-foreground">Search student name, admission number, or mobile.</p>
            <div className="flex gap-2">
              <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()} className="h-11 min-w-0 flex-1 rounded-xl border bg-background px-4 text-xs outline-none focus:border-indigo-600" placeholder="Search student..." />
              <button onClick={search} disabled={busy} className="min-h-11 rounded-xl bg-indigo-600 px-4 text-white hover:bg-indigo-500 font-bold text-xs"><Search className="h-4 w-4" /></button>
            </div>
            <div className="divide-y border-t pt-2">
              {students.map(s => (
                <button key={s.id} onClick={() => openStudent(s.id)} className="flex w-full items-center justify-between py-3 text-left hover:bg-muted/10 px-2 rounded-xl">
                  <div>
                    <b className="text-xs">{s.firstName} {s.lastName}</b>
                    <p className="text-[10px] text-muted-foreground">{s.admissionNo} · {s.department?.name}</p>
                  </div>
                  <span className="text-xs font-bold text-indigo-600">Open Ledger</span>
                </button>
              ))}
              {!students.length && <Empty text="Search to open a student fee account." />}
            </div>
          </article>
          <StudentAccount account={selected} collect={collect} busy={busy} />
        </section>
      )}

      {section.includes('closing') && <ClosingList rows={data || []} ao={ao} reason={reason} setReason={setReason} review={reviewClosing} submit={submitClosing} busy={busy} />}
      {['refund-requests', 'refund-approvals', 'scholarships', 'scholarships-concessions'].includes(section) && <RequestList rows={data || []} ao={ao} reason={reason} setReason={setReason} review={reviewRequest} />}
      {section === 'reconciliation' && <SimpleTable title="Bank Reconciliation Exceptions" rows={data || []} columns={[['caseNumber', 'Case'], ['exceptionType', 'Exception'], ['campusAmount', 'Campus Amount'], ['gatewayAmount', 'Gateway Amount'], ['status', 'Status']]} />}
      {section === 'audit-logs' && <SimpleTable title="Immutable Finance Audit Trail" rows={data || []} columns={[['createdAt', 'Time'], ['actor.email', 'Actor'], ['action', 'Action'], ['resourceType', 'Resource'], ['resourceId', 'Resource ID']]} />}
      {(section === 'budgets' || section === 'department-budgets') && <DepartmentBudgetsView rows={budgetsData} />}
      {['reports', 'receipts', 'transactions', 'online-payments', 'offline-payments', 'adjustments'].includes(section) && (
        <Transactions rows={Array.isArray(data) ? data : []} title={title} exportReport={exportReport} onReversal={(id: string) => { setReversalTargetId(id); setShowReversalModal(true); }} />
      )}

      {/* CREATE EXPENSE VOUCHER MODAL */}
      {showVoucherModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 text-left">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-black uppercase text-slate-800 dark:text-white">Record Expense Voucher</h3>
              <button onClick={() => setShowVoucherModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>
            <form onSubmit={handleCreateVoucher} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Payee / Vendor Name *</label>
                <input type="text" placeholder="e.g. Lab Supplies Co, Electricity Board" value={payeeName} onChange={(e) => setPayeeName(e.target.value)} className="w-full px-3 py-2 border rounded-xl bg-background outline-none font-bold" required />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Expense Category</label>
                <select value={expenseCategory} onChange={(e) => setExpenseCategory(e.target.value)} className="w-full px-3 py-2 border rounded-xl bg-background outline-none font-bold">
                  <option value="OPERATIONAL_EXPENSE">Operational Expense</option>
                  <option value="MAINTENANCE">Facility Maintenance</option>
                  <option value="LAB_SUPPLIES">Lab & Academic Supplies</option>
                  <option value="VENDOR_PAYMENT">Vendor Invoice Payment</option>
                  <option value="UTILITIES">Electricity & Utilities</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Voucher Amount (₹) *</label>
                <input type="number" step="0.01" placeholder="5000" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} className="w-full px-3 py-2 border rounded-xl bg-background outline-none font-mono font-bold" required />
                <p className="text-[9px] text-slate-400 mt-1">Note: Vouchers ≥ ₹50,000 automatically require AO Maker/Checker approval.</p>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Description / Notes</label>
                <textarea rows={2} placeholder="Purpose of expenditure..." value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} className="w-full p-2.5 border rounded-xl bg-background outline-none text-xs resize-none" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowVoucherModal(false)} className="px-4 py-2 border text-xs font-bold rounded-xl hover:bg-muted">Cancel</button>
                <button type="submit" disabled={busy} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow">Save & Post Voucher</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE IMMUTABLE REVERSAL ENTRY MODAL */}
      {showReversalModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 text-left">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-black uppercase text-rose-600 flex items-center gap-1.5"><RotateCcw className="h-4 w-4" /> Post Compensating Reversal Entry</h3>
              <button onClick={() => setShowReversalModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>
            <form onSubmit={handleCreateReversal} className="space-y-3 text-xs font-semibold">
              <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-[11px]">
                <p className="font-bold">Immutable Ledger Policy</p>
                <p className="mt-0.5 opacity-90">Financial records cannot be deleted. This action will post an audit-logged compensating reversal entry (`DEBIT`) to correct the transaction history.</p>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Reversal Reason *</label>
                <textarea rows={3} placeholder="Provide audit reason for correcting this entry..." value={reversalReason} onChange={(e) => setReversalReason(e.target.value)} className="w-full p-2.5 border rounded-xl bg-background outline-none text-xs resize-none" required />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowReversalModal(false)} className="px-4 py-2 border text-xs font-bold rounded-xl hover:bg-muted">Cancel</button>
                <button type="submit" disabled={busy} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow">Post Reversal Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

function Dashboard({ data, ao, onSubmit, busy, budgets }: any) {
  const cards = [
    ['Today Collection', money(data.cards.todayCollection), IndianRupee],
    ['Month Collection', money(data.cards.monthCollection), BarChart3],
    ['Online Collection', money(data.cards.onlineCollection), CreditCard],
    ['Offline Collection', money(data.cards.offlineCollection), Landmark],
    ['Pending Fees', money(data.cards.pendingFees), Clock3],
    ['Overdue Amount', money(data.cards.overdueAmount), AlertTriangle],
    ['Students With Due', data.cards.studentsWithDue, UsersRound],
    ['Refund Pending', data.cards.refundPending, ArrowDownToLine],
    ['Pending Payments', data.cards.pendingPayments, Clock3],
    ['Failed Payments', data.cards.failedPayments, X],
    ['Closing Approvals', data.cards.closingsAwaitingApproval, ShieldCheck],
    ['Reconciliation Cases', data.cards.unreconciledTransactions, FileSearch]
  ];
  const max = Math.max(1, ...data.trend.map((x: any) => x.amount));

  return (
    <>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(c => <Card key={c[0]} label={c[0]} value={c[1]} icon={c[2]} />)}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <article className="rounded-3xl border border-border bg-card p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-sm">Collection Trend</h2>
              <p className="text-xs text-muted-foreground">Verified ledger-backed daily payments</p>
            </div>
            {onSubmit && (
              <button onClick={onSubmit} disabled={busy} className="min-h-9 rounded-xl bg-indigo-600 px-4 text-xs font-extrabold text-white hover:bg-indigo-500">
                Submit Daily Closing
              </button>
            )}
          </div>
          <div className="mt-4 flex h-44 items-end gap-2 overflow-x-auto pt-4">
            {data.trend.map((x: any) => (
              <div key={x.date} className="flex min-w-10 flex-1 flex-col items-center gap-2">
                <span className="text-[9px] font-bold text-muted-foreground">{money(x.amount)}</span>
                <div className="w-full rounded-t-lg bg-indigo-600/80" style={{ height: `${Math.max(4, x.amount / max * 130)}px` }} />
                <span className="text-[9px] text-muted-foreground">{x.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-3xl border border-border bg-card p-5 shadow-xs space-y-4">
          <h2 className="font-extrabold text-sm">Payment Methods Breakdown</h2>
          <div className="space-y-4 pt-1">
            {data.methods.map((m: any) => (
              <div key={m.method}>
                <div className="flex justify-between text-xs font-bold">
                  <span>{m.method.replaceAll('_', ' ')}</span>
                  <span>{money(m.amount)}</span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-indigo-600" style={{ width: `${Math.min(100, m.amount / Math.max(1, data.cards.monthCollection) * 100)}%` }} />
                </div>
              </div>
            ))}
            {!data.methods.length && <Empty text="No verified payments in this period." />}
          </div>
        </article>
      </section>

      {budgets && budgets.length > 0 && <DepartmentBudgetsView rows={budgets} />}

      <SimpleTable title="Department Collection Overview" rows={data.departments} columns={[['department', 'Department'], ['expected', 'Expected'], ['collected', 'Collected'], ['pending', 'Pending'], ['collectionPercentage', 'Collection %']]} />
      <Transactions rows={data.recentTransactions} title="Recent Ledger Transactions" compact />
    </>
  );
}

function StudentAccount({ account, collect, busy }: any) {
  if (!account) return <article className="rounded-3xl border border-dashed p-10"><Empty text="Select a student to view fee details and collect payment." /></article>;
  return (
    <article className="rounded-3xl border bg-card p-5 shadow-xs space-y-4 text-left">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-extrabold text-base">{account.student.firstName} {account.student.lastName}</h2>
          <p className="text-xs text-muted-foreground">{account.student.admissionNo} · {account.student.department?.name} · {account.student.semester?.name}</p>
        </div>
        <Status value={account.summary.remaining ? 'DUE' : 'PAID'} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card label="Total Fees" value={money(account.summary.total)} icon={BadgeIndianRupee} />
        <Card label="Total Paid" value={money(account.summary.paid)} icon={CheckCircle2} />
        <Card label="Balance Due" value={money(account.summary.remaining)} icon={Clock3} />
        <Card label="Scholarship" value={money(account.summary.scholarship)} icon={ShieldCheck} />
      </div>

      <form onSubmit={collect} className="space-y-3 rounded-2xl bg-muted/20 p-4 border text-xs font-semibold">
        <h3 className="text-xs font-black uppercase text-slate-800 dark:text-white">Collect Authorized Payment</h3>
        <select name="billId" required className="h-10 w-full rounded-xl border bg-background px-3 text-xs font-bold">
          {account.bills.filter((b: any) => b.balance > 0).map((b: any) => (
            <option key={b.id} value={b.id}>{b.category.name} · Balance {money(b.balance)}</option>
          ))}
        </select>
        <div className="grid gap-3 sm:grid-cols-2">
          <input name="amount" type="number" min="1" step=".01" required placeholder="Amount (₹)" className="h-10 rounded-xl border bg-background px-3 text-xs font-mono font-bold" />
          <select name="method" className="h-10 rounded-xl border bg-background px-3 text-xs font-bold">
            <option value="CASH">Cash</option>
            <option value="UPI_DIRECT">UPI Direct</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CHEQUE">Cheque</option>
            <option value="DD">Demand Draft</option>
            <option value="POS">POS Machine</option>
          </select>
        </div>
        <input name="reference" placeholder="Transaction / UTR / Cheque Reference" className="h-10 w-full rounded-xl border bg-background px-3 text-xs" />
        <button disabled={busy || !account.bills.some((b: any) => b.balance > 0)} className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 font-extrabold text-white text-xs hover:bg-indigo-500 disabled:opacity-50 transition-all">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />} Record Payment & Post Ledger
        </button>
      </form>
    </article>
  );
}

function ClosingList({ rows, ao, reason, setReason, review, submit, busy }: any) {
  return (
    <section className="rounded-3xl border bg-card p-5 shadow-xs space-y-4 text-left">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <h2 className="font-extrabold text-sm">Daily Cash Closing Workflow (Maker/Checker)</h2>
          <p className="text-xs text-muted-foreground">Submitted figures are immutable and every decision is audited.</p>
        </div>
        {!ao && (
          <button onClick={submit} disabled={busy} className="min-h-9 rounded-xl bg-indigo-600 px-4 text-xs font-extrabold text-white hover:bg-indigo-500">
            Submit Today's Closing
          </button>
        )}
      </div>

      <div className="space-y-3">
        {rows.map((r: any) => (
          <article key={r.id} className="rounded-2xl border p-4 bg-muted/10 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <b className="text-xs font-black">{r.closingNumber}</b>
                <p className="text-[10px] text-muted-foreground mt-0.5">{day(r.closingDate)} · {r.accountant?.firstName} {r.accountant?.lastName}</p>
              </div>
              <div className="text-right">
                <b className="text-xs font-mono font-black">{money(r.actualTotal)}</b>
                <div className="mt-0.5"><Status value={r.status} /></div>
              </div>
            </div>
            {ao && r.status === 'SUBMITTED_TO_AO' && (
              <div className="flex flex-col gap-2 sm:flex-row pt-2 border-t">
                <input value={reason[r.id] || ''} onChange={e => setReason((v: any) => ({ ...v, [r.id]: e.target.value }))} placeholder="Reason for return or query" className="h-9 min-w-0 flex-1 rounded-xl border bg-background px-3 text-xs" />
                <button onClick={() => review(r.id, 'APPROVE')} className="rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white">Approve</button>
                <button onClick={() => review(r.id, 'RETURN')} className="rounded-xl border border-rose-500/30 px-4 text-xs font-bold text-rose-500">Return</button>
              </div>
            )}
          </article>
        ))}
        {!rows.length && <Empty text="No daily closings found." />}
      </div>
    </section>
  );
}

function RequestList({ rows, ao, reason, setReason, review }: any) {
  return (
    <section className="rounded-3xl border bg-card p-5 shadow-xs space-y-4 text-left">
      <h2 className="font-extrabold text-sm">Refund, Scholarship & Concession Requests (Maker/Checker)</h2>
      <div className="space-y-3">
        {rows.map((r: any) => (
          <article key={r.id} className="rounded-2xl border p-4 bg-muted/10 space-y-2">
            <div className="flex justify-between gap-4">
              <div>
                <b className="text-xs font-extrabold">{r.requestNumber} · {r.requestType}</b>
                <p className="text-xs text-muted-foreground mt-0.5">{r.student ? `${r.student.firstName} ${r.student.lastName}` : 'Institution Request'} · {r.reason}</p>
              </div>
              <div className="text-right">
                <b className="text-xs font-mono font-black">{money(r.amount)}</b>
                <div className="mt-0.5"><Status value={r.status} /></div>
              </div>
            </div>
            {ao && ['REQUESTED', 'UNDER_REVIEW', 'RETURNED'].includes(r.status) && (
              <div className="flex flex-col gap-2 sm:flex-row pt-2 border-t">
                <input value={reason[r.id] || ''} onChange={e => setReason((v: any) => ({ ...v, [r.id]: e.target.value }))} placeholder="Decision reason" className="h-9 flex-1 rounded-xl border bg-background px-3 text-xs" />
                <button onClick={() => review(r.id, 'APPROVE')} className="rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white">Approve</button>
                <button onClick={() => review(r.id, 'REJECT')} className="rounded-xl border border-rose-500/30 px-4 text-xs font-bold text-rose-500">Reject</button>
              </div>
            )}
          </article>
        ))}
        {!rows.length && <Empty text="No finance requests found." />}
      </div>
    </section>
  );
}

function DepartmentBudgetsView({ rows }: { rows: any[] }) {
  return (
    <section className="rounded-3xl border bg-card p-5 shadow-xs space-y-4 text-left">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <h2 className="font-extrabold text-sm">Department Budgets & Variance Analysis</h2>
          <p className="text-xs text-muted-foreground">Annual allocation, spent tracking, and variance performance</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {rows.map((b) => (
          <div key={b.id || b.code} className="p-4 border rounded-2xl bg-muted/10 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black">{b.departmentName} ({b.code})</span>
              <Status value={b.status} />
            </div>
            <div className="space-y-1 text-xs font-semibold">
              <div className="flex justify-between">
                <span className="text-slate-400">Allocated Budget</span>
                <span className="font-mono">{money(b.allocatedBudget)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Spent to Date</span>
                <span className="font-mono text-indigo-600">{money(b.spentAmount)}</span>
              </div>
              <div className="flex justify-between border-t pt-1 font-bold">
                <span>Remaining Balance</span>
                <span className="font-mono text-emerald-600">{money(b.remainingBudget)}</span>
              </div>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full" style={{ width: `${Math.min(100, (b.spentAmount / b.allocatedBudget) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Transactions({ rows, title, exportReport, compact, onReversal }: any) {
  return (
    <section className="overflow-hidden rounded-3xl border bg-card shadow-xs text-left">
      <div className="flex items-center justify-between border-b p-5">
        <div>
          <h2 className="font-extrabold text-sm">{title}</h2>
          <p className="text-xs text-muted-foreground">Verified and traceable payment records</p>
        </div>
        {exportReport && (
          <div className="flex gap-2">
            <button onClick={() => exportReport('xlsx')} className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold hover:bg-muted">
              <FileDown className="h-4 w-4" /> Excel
            </button>
            <button onClick={() => exportReport('pdf')} className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold hover:bg-muted">
              <FileDown className="h-4 w-4" /> PDF
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/30 text-[10px] font-bold uppercase text-muted-foreground border-b">
            <tr>
              {['Date', 'Receipt', 'Student', 'Register No.', 'Fee Type', 'Method', 'Amount', 'Status', 'Action'].map(h => (
                <th key={h} className="px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r: any) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-medium">{day(r.date || r.paymentDate || r.createdAt)}</td>
                <td className="px-4 font-mono font-bold text-indigo-600">{r.receiptNumber || '—'}</td>
                <td className="px-4 font-bold">{r.studentName || `${r.student?.firstName || ''} ${r.student?.lastName || ''}`}</td>
                <td className="px-4 font-mono">{r.registerNumber || r.student?.admissionNo}</td>
                <td className="px-4">{r.feeType || r.bill?.category?.name}</td>
                <td className="px-4">{String(r.method || '').replaceAll('_', ' ')}</td>
                <td className="px-4 font-black font-mono">{money(r.amount)}</td>
                <td className="px-4"><Status value={r.status} /></td>
                <td className="px-4">
                  {onReversal && (
                    <button onClick={() => onReversal(r.id)} title="Post Compensating Reversal Entry" className="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[10px] font-bold hover:bg-rose-100 flex items-center gap-1">
                      <RotateCcw className="h-3 w-3" /> Reversal
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <Empty text="No transactions match this view." />}
      </div>
    </section>
  );
}

function getPath(obj: any, path: string) {
  return path.split('.').reduce((v, k) => v?.[k], obj);
}

function SimpleTable({ title, rows, columns }: any) {
  return (
    <section className="overflow-hidden rounded-3xl border bg-card shadow-xs text-left">
      <div className="border-b p-5">
        <h2 className="font-extrabold text-sm">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/30 border-b">
            <tr>
              {columns.map((c: any) => <th key={c[0]} className="px-4 py-3 text-[10px] font-bold uppercase text-muted-foreground">{c[1]}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r: any) => (
              <tr key={r.id || r.department}>
                {columns.map((c: any) => (
                  <td key={c[0]} className="px-4 py-3">
                    {c[0] === 'status' ? <Status value={getPath(r, c[0])} /> : c[0].toLowerCase().includes('amount') || ['expected', 'collected', 'pending'].includes(c[0]) ? money(getPath(r, c[0])) : c[0].includes('At') ? day(getPath(r, c[0])) : String(getPath(r, c[0]) ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <Empty text="No records found." />}
      </div>
    </section>
  );
}
