import React, { useEffect, useState } from 'react';
import { AlertTriangle, CalendarDays, Clock3, Download, MapPin, Printer, RefreshCw } from 'lucide-react';
import api from '../../lib/axios';
import { Button } from '../../components/ui/Button';
import { downloadFile } from '../../platform/download';
import { toast } from '../../components/ui/Toast';
import { useLanguage } from '../../context/LanguageContext';

interface HallAllocation {
  id: string; seatNumber: string;
  exam?: { name: string; type: string };
  subject?: { name: string; code: string };
  schedule?: { examDate: string; session: string; startTime: string; endTime: string; instructions?: string };
  room?: { name: string; code: string; building: string; floor?: string };
}

export const StudentExaminations: React.FC = () => {
  const { t, formatDate } = useLanguage();
  const [items, setItems] = useState<HallAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async () => {
    setLoading(true); setError('');
    try { const response = await api.get('/coe/student/hall-allotments'); setItems(response.data?.data || []); }
    catch { setError(t('student.exams.error')); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const downloadHallTicket = async () => {
    const result = await downloadFile({ endpoint: '/coe/student/hall-ticket.pdf', filename: 'Hall_Ticket.pdf', mimeType: 'application/pdf', action: 'open', dialogTitle: t('student.exams.openShare') });
    if (!result.success) toast.error(result.error || t('coe.hallTickets.downloadError'));
  };
  const printHallTicket = async () => {
    try {
      const response = await api.get('/coe/student/hall-ticket.pdf', { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const printWindow = window.open(url, '_blank', 'noopener,noreferrer');
      if (!printWindow) throw new Error('Allow pop-ups to print the hall ticket.');
      printWindow.addEventListener('load', () => printWindow.print(), { once: true });
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch { toast.error(t('coe.hallTickets.downloadError')); }
  };

  return <div className="space-y-6 pb-12">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">{t('student.exams.eyebrow')}</p><h1 className="mt-1 text-2xl font-bold">{t('student.exams.title')}</h1><p className="mt-1 text-sm text-muted-foreground">{t('student.exams.description')}</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={load} disabled={loading}><RefreshCw className={`me-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />{t('common.refresh')}</Button>{items.length > 0 && <><Button variant="outline" onClick={printHallTicket}><Printer className="me-2 h-4 w-4" />{t('common.print')}</Button><Button onClick={downloadHallTicket}><Download className="me-2 h-4 w-4" />{t('student.exams.download')}</Button></>}</div></header>
    {error && <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertTriangle className="h-5 w-5 shrink-0" /><div className="flex-1"><p className="font-semibold">{t('student.exams.errorTitle')}</p><p>{error}</p></div><Button variant="outline" onClick={load}>{t('common.refresh')}</Button></div>}
    {loading ? <div className="grid gap-3">{[1,2,3].map(item=><div key={item} className="h-32 animate-pulse rounded-2xl border bg-muted/40" />)}</div> : items.length === 0 ? <div className="rounded-2xl border border-dashed p-10 text-center"><CalendarDays className="mx-auto h-8 w-8 text-muted-foreground" /><h2 className="mt-3 font-semibold">{t('student.exams.emptyTitle')}</h2><p className="mt-1 text-sm text-muted-foreground">{t('student.exams.emptyBody')}</p></div> : <div className="grid gap-3">{items.map(item=><article key={item.id} className="rounded-2xl border bg-card p-5"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-bold uppercase tracking-wide text-indigo-600">{item.exam?.name || t('student.exams.examination')}</p><h2 className="mt-1 text-lg font-semibold">{item.subject?.name || t('student.exams.subject')} <bdi className="font-mono text-sm text-muted-foreground">{item.subject?.code}</bdi></h2></div><div className="rounded-xl bg-indigo-50 px-4 py-2 text-center text-indigo-700"><p className="text-[10px] font-bold uppercase">{t('student.exams.seat')}</p><bdi className="font-mono text-xl font-bold">{item.seatNumber}</bdi></div></div><div className="mt-4 grid gap-3 border-t pt-4 text-sm sm:grid-cols-3"><p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-muted-foreground" />{item.schedule?.examDate ? formatDate(item.schedule.examDate) : t('student.exams.datePending')}</p><p className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-muted-foreground" /><bdi>{item.schedule?.startTime}-{item.schedule?.endTime} · {item.schedule?.session}</bdi></p><p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" />{item.room?.building}, {item.room?.name}</p></div>{item.schedule?.instructions && <p className="mt-4 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">{item.schedule.instructions}</p>}</article>)}</div>}
  </div>;
};

export default StudentExaminations;
