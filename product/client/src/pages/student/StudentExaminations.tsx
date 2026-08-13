import React, { useEffect, useState } from 'react';
import { AlertTriangle, CalendarDays, Clock3, MapPin, RefreshCw } from 'lucide-react';
import api from '../../lib/axios';
import { Button } from '../../components/ui/Button';

interface HallAllocation {
  id: string; seatNumber: string;
  exam?: { name: string; type: string };
  subject?: { name: string; code: string };
  schedule?: { examDate: string; session: string; startTime: string; endTime: string; instructions?: string };
  room?: { name: string; code: string; building: string; floor?: string };
}

export const StudentExaminations: React.FC = () => {
  const [items, setItems] = useState<HallAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async () => {
    setLoading(true); setError('');
    try { const response = await api.get('/coe/student/hall-allotments'); setItems(response.data?.data || []); }
    catch (requestError: any) { setError(requestError.response?.data?.message || 'Unable to load your examination schedule. Check your connection and try again.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  return <div className="space-y-6 pb-12">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">My examinations</p><h1 className="mt-1 text-2xl font-bold">Exam schedule & hall allotment</h1><p className="mt-1 text-sm text-muted-foreground">Only COE-published schedules and authorized seat allocations appear here.</p></div><Button variant="outline" onClick={load} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh</Button></header>
    {error && <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertTriangle className="h-5 w-5 shrink-0" /><div className="flex-1"><p className="font-semibold">Schedule unavailable</p><p>{error}</p></div><Button variant="outline" onClick={load}>Retry</Button></div>}
    {loading ? <div className="grid gap-3">{[1,2,3].map(item=><div key={item} className="h-32 animate-pulse rounded-2xl border bg-muted/40" />)}</div> : items.length === 0 ? <div className="rounded-2xl border border-dashed p-10 text-center"><CalendarDays className="mx-auto h-8 w-8 text-muted-foreground" /><h2 className="mt-3 font-semibold">No published hall allotments</h2><p className="mt-1 text-sm text-muted-foreground">Your COE-published exam schedule and seat details will appear here.</p></div> : <div className="grid gap-3">{items.map(item=><article key={item.id} className="rounded-2xl border bg-card p-5"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-bold uppercase tracking-wide text-indigo-600">{item.exam?.name || 'Examination'}</p><h2 className="mt-1 text-lg font-semibold">{item.subject?.name || 'Subject'} <span className="font-mono text-sm text-muted-foreground">{item.subject?.code}</span></h2></div><div className="rounded-xl bg-indigo-50 px-4 py-2 text-center text-indigo-700"><p className="text-[10px] font-bold uppercase">Seat</p><p className="font-mono text-xl font-bold">{item.seatNumber}</p></div></div><div className="mt-4 grid gap-3 border-t pt-4 text-sm sm:grid-cols-3"><p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-muted-foreground" />{item.schedule?.examDate ? new Date(item.schedule.examDate).toLocaleDateString() : 'Date pending'}</p><p className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-muted-foreground" />{item.schedule?.startTime}–{item.schedule?.endTime} · {item.schedule?.session}</p><p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" />{item.room?.building}, {item.room?.name}</p></div>{item.schedule?.instructions && <p className="mt-4 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">{item.schedule.instructions}</p>}</article>)}</div>}
  </div>;
};

export default StudentExaminations;
