import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Download, FileSearch, Printer, RefreshCw, Search } from 'lucide-react';
import api from '../../lib/axios';
import { Button } from '../../components/ui/Button';
import ProfileAvatar from '../../components/common/ProfileAvatar';
import { toast } from '../../components/ui/Toast';
import { downloadFile } from '../../platform/download';
import { useLanguage } from '../../context/LanguageContext';

interface HallTicketRow {
  student: { id: string; userId?: string; name: string; registerNumber: string; department?: string; programme?: string; semester?: string; section?: string; profilePhoto?: string | null };
  exam?: { id: string; name: string; type: string } | null;
  status: 'AVAILABLE' | 'NOT_AVAILABLE';
  subjectCount: number;
}

export default function CoeHallTicketsPage() {
  const { t, formatNumber, direction } = useLanguage();
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [rows, setRows] = useState<HallTicketRow[]>([]);
  const [summary, setSummary] = useState({ available: 0, unavailable: 0 });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const pageSize = 20;

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await api.get('/coe/hall-tickets', { params: { q: submittedQuery || undefined, page, pageSize } });
      const data = response.data?.data || {};
      setRows(data.items || []); setSummary(data.summary || { available: 0, unavailable: 0 }); setTotal(data.total || 0);
    } catch { setError(t('coe.hallTickets.error')); }
    finally { setLoading(false); }
  }, [page, submittedQuery, t]);
  useEffect(() => { load(); }, [load]);

  const endpoint = (row: HallTicketRow) => `/coe/students/${row.student.id}/hall-ticket.pdf${row.exam?.id ? `?examId=${encodeURIComponent(row.exam.id)}` : ''}`;
  const openTicket = async (row: HallTicketRow, action: 'open' | 'save') => {
    const result = await downloadFile({ endpoint: endpoint(row), filename: `Hall_Ticket_${row.student.registerNumber}.pdf`, mimeType: 'application/pdf', action, dialogTitle: t('coe.hallTickets.title') });
    if (!result.success) toast.error(result.error || t('coe.hallTickets.downloadError'));
  };
  const printTicket = async (row: HallTicketRow) => {
    try {
      const response = await api.get(endpoint(row), { responseType: 'blob' });
      const url = URL.createObjectURL(response.data); const target = window.open(url, '_blank', 'noopener,noreferrer');
      if (!target) throw new Error();
      target.addEventListener('load', () => target.print(), { once: true }); window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch { toast.error(t('coe.hallTickets.downloadError')); }
  };

  return <main className="mx-auto w-full max-w-[1400px] space-y-6 pb-24" dir={direction}>
    <header className="flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-600">{t('coe.hallTickets.eyebrow')}</p><h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">{t('coe.hallTickets.title')}</h1><p className="mt-2 max-w-3xl text-sm text-muted-foreground">{t('coe.hallTickets.description')}</p></div>
      <Button variant="outline" onClick={load} disabled={loading}><RefreshCw className={`me-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />{t('common.refresh')}</Button>
    </header>

    <section className="grid gap-3 sm:grid-cols-2" aria-label={t('coe.hallTickets.status')}>
      <div className="rounded-xl border bg-card p-4"><p className="text-xs font-semibold text-muted-foreground">{t('coe.hallTickets.summaryAvailable')}</p><p className="mt-1 text-3xl font-bold text-emerald-700">{formatNumber(summary.available)}</p></div>
      <div className="rounded-xl border bg-card p-4"><p className="text-xs font-semibold text-muted-foreground">{t('coe.hallTickets.summaryUnavailable')}</p><p className="mt-1 text-3xl font-bold text-amber-700">{formatNumber(summary.unavailable)}</p></div>
    </section>

    <form className="flex flex-col gap-2 rounded-xl border bg-card p-3 sm:flex-row" onSubmit={(event) => { event.preventDefault(); setPage(1); setSubmittedQuery(query.trim()); }} role="search">
      <label className="relative flex-1"><span className="sr-only">{t('common.search')}</span><Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('coe.hallTickets.searchPlaceholder')} className="h-11 w-full rounded-lg border bg-background ps-10 pe-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" /></label>
      <Button type="submit"><Search className="me-2 h-4 w-4" />{t('common.search')}</Button>
      {submittedQuery && <Button type="button" variant="outline" onClick={() => { setQuery(''); setSubmittedQuery(''); setPage(1); }}>{t('common.clear')}</Button>}
    </form>

    {error ? <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><div className="flex-1"><p className="font-semibold">{t('coe.hallTickets.error')}</p></div><Button variant="outline" onClick={load}>{t('common.refresh')}</Button></div>
    : loading ? <div className="space-y-3">{Array.from({ length: 5 }, (_, index) => <div key={index} className="h-24 animate-pulse rounded-xl border bg-muted/40" />)}</div>
    : rows.length === 0 ? <div className="rounded-xl border border-dashed px-5 py-14 text-center"><FileSearch className="mx-auto h-9 w-9 text-muted-foreground" /><h2 className="mt-3 font-semibold">{t('coe.hallTickets.emptyTitle')}</h2><p className="mx-auto mt-1 max-w-xl text-sm text-muted-foreground">{t('coe.hallTickets.emptyBody')}</p></div>
    : <>
      <div className="hidden overflow-x-auto rounded-xl border lg:block"><table className="w-full min-w-[980px] bg-card text-sm"><thead className="bg-muted/60 text-start text-xs text-muted-foreground"><tr><th className="px-4 py-3 text-start">{t('coe.hallTickets.student')}</th><th className="px-4 py-3 text-start">{t('coe.hallTickets.programme')}</th><th className="px-4 py-3 text-start">{t('coe.hallTickets.exam')}</th><th className="px-4 py-3 text-start">{t('coe.hallTickets.status')}</th><th className="px-4 py-3 text-end">{t('coe.hallTickets.actions')}</th></tr></thead><tbody className="divide-y">{rows.map((row) => <tr key={row.student.id}><td className="px-4 py-3"><div className="flex items-center gap-3"><ProfileAvatar src={row.student.profilePhoto} name={row.student.name} size="md" shape="circle" /><div><p className="font-semibold">{row.student.name}</p><bdi className="text-xs text-muted-foreground">{row.student.registerNumber}</bdi></div></div></td><td className="px-4 py-3"><p>{row.student.programme || '-'}</p><p className="text-xs text-muted-foreground">{row.student.department} · {row.student.semester}</p></td><td className="px-4 py-3"><p>{row.exam?.name || '-'}</p>{row.subjectCount > 0 && <p className="text-xs text-muted-foreground">{t('coe.hallTickets.subjects', { count: row.subjectCount })}</p>}</td><td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${row.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{t(row.status === 'AVAILABLE' ? 'common.available' : 'common.notAvailable')}</span></td><td className="px-4 py-3"><div className="flex justify-end gap-1.5">{row.status === 'AVAILABLE' && <><Button size="sm" variant="outline" onClick={() => openTicket(row, 'open')}>{t('common.view')}</Button><Button size="sm" variant="outline" onClick={() => openTicket(row, 'save')} aria-label={t('common.download')}><Download className="h-4 w-4" /></Button><Button size="sm" variant="outline" onClick={() => printTicket(row)} aria-label={t('common.print')}><Printer className="h-4 w-4" /></Button></>}</div></td></tr>)}</tbody></table></div>
      <div className="grid gap-3 lg:hidden">{rows.map((row) => <article key={row.student.id} className="rounded-xl border bg-card p-4"><div className="flex items-start gap-3"><ProfileAvatar src={row.student.profilePhoto} name={row.student.name} size="lg" shape="circle" /><div className="min-w-0 flex-1"><h2 className="truncate font-semibold">{row.student.name}</h2><bdi className="text-xs text-muted-foreground">{row.student.registerNumber}</bdi><p className="mt-2 text-sm">{row.student.programme || '-'}</p><p className="text-xs text-muted-foreground">{row.student.department} · {row.student.semester}</p></div></div><div className="mt-4 border-t pt-3"><p className="text-sm font-medium">{row.exam?.name || t('common.notAvailable')}</p><span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${row.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{t(row.status === 'AVAILABLE' ? 'common.available' : 'common.notAvailable')}</span></div>{row.status === 'AVAILABLE' && <div className="mt-4 grid grid-cols-3 gap-2"><Button variant="outline" onClick={() => openTicket(row, 'open')}>{t('common.view')}</Button><Button variant="outline" onClick={() => openTicket(row, 'save')}><Download className="me-1 h-4 w-4" />{t('common.download')}</Button><Button variant="outline" onClick={() => printTicket(row)}><Printer className="me-1 h-4 w-4" />{t('common.print')}</Button></div>}</article>)}</div>
    </>}
    {total > pageSize && <nav className="flex items-center justify-between" aria-label={t('coe.hallTickets.title')}><Button variant="outline" disabled={page === 1 || loading} onClick={() => setPage((value) => value - 1)}>{t('common.previous')}</Button><span className="text-sm text-muted-foreground">{t('common.records', { count: total })}</span><Button variant="outline" disabled={page * pageSize >= total || loading} onClick={() => setPage((value) => value + 1)}>{t('common.next')}</Button></nav>}
  </main>;
}
