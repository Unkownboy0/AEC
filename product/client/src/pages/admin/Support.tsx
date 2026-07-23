import React, { useState, useEffect } from 'react';
import {
  LifeBuoy, Plus, ShieldAlert, Send, User, Tag, Clock, MessageSquare
} from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/axios';

const STATUS_DISPLAY_MAP: Record<string, string> = {
  OPEN: 'Submitted',
  IN_PROGRESS: 'Under Review',
  RESOLVED: 'Resolved',
  REJECTED: 'Rejected'
};

const STATUS_COLOR_MAP: Record<string, string> = {
  OPEN: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  IN_PROGRESS: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  RESOLVED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  REJECTED: 'bg-rose-500/10 text-rose-500 border-rose-500/20'
};

export const Support: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  
  // Filtering states (Deans/Admins)
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Reply / Update State
  const [replyText, setReplyText] = useState('');
  const [ticketStatus, setTicketStatus] = useState('');

  const isDeanOrAdmin = ['Academic Dean', 'Admission Dean', 'Principal', 'Vice Principal', 'Super Admin'].includes(user?.role || '');
  const isStudent = user?.role === 'Student';
  const isUnauthorized = !isDeanOrAdmin && !isStudent;

  const fetchTickets = async () => {
    if (isUnauthorized) return;
    try {
      setIsLoading(true);
      let query = '?pageSize=100';
      if (statusFilter !== 'ALL') query += `&status=${statusFilter}`;
      if (categoryFilter !== 'ALL') query += `&category=${categoryFilter}`;
      
      const res = await api.get(`/enterprise/tickets${query}`);
      setTickets(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, categoryFilter]);

  const handleCreateTicket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      title: fd.get('title'),
      description: fd.get('description'),
      category: fd.get('category'),
      priority: fd.get('priority'),
    };

    try {
      const res = await api.post('/enterprise/tickets', payload);
      if (res.data?.status === 'success') {
        toast.success('Support complaint logged successfully!');
        setIsFormOpen(false);
        fetchTickets();
      }
    } catch (err) {
      toast.error('Failed to submit ticket');
    }
  };

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() && !ticketStatus) return;

    const parsedReplies = JSON.parse(selectedTicket.replies || '[]');
    let updatedReplies = parsedReplies;

    if (replyText.trim()) {
      const newReply = {
        author: `${user?.firstName} ${user?.lastName}`,
        role: user?.role,
        message: replyText,
        timestamp: new Date().toISOString()
      };
      updatedReplies = [...parsedReplies, newReply];
    }

    try {
      const payload: any = { replies: JSON.stringify(updatedReplies) };
      if (isDeanOrAdmin && ticketStatus) {
        payload.status = ticketStatus;
      }

      const res = await api.put(`/enterprise/tickets/${selectedTicket.id}`, payload);
      if (res.data?.status === 'success') {
        toast.success('Ticket updated successfully!');
        setReplyText('');
        setSelectedTicket(res.data.data);
        fetchTickets();
      }
    } catch {
      toast.error('Failed to update ticket.');
    }
  };

  // If HOD or Faculty tries to access, render clean Access Denied block
  if (isUnauthorized) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border bg-card rounded-2xl shadow-sm text-center max-w-lg mx-auto mt-12 space-y-4 text-xs font-semibold">
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full">
          <ShieldAlert className="h-12 w-12" />
        </div>
        <h2 className="text-lg font-black tracking-tight">Access Restricted</h2>
        <p className="text-muted-foreground leading-relaxed">
          Only Deans and Executive Administrators can manage student complaints. Mentors and HODs do not have permissions to access the grievance desk.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-xs font-semibold">
      {/* Header Panel */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex flex-wrap items-center gap-2">
            <LifeBuoy className="h-6 w-6 text-primary" /> Grievance & Complaint Desk
          </h1>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {isStudent 
              ? 'Log Academic, Hostel, Transport, or general complaints and track real-time resolution stages.' 
              : 'Unified student grievance management, quality resolution tracing & executive response dispatcher.'}
          </p>
        </div>
        {isStudent && (
          <Button variant="primary" size="sm" onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-1 h-4 w-4" /> Open New Complaint
          </Button>
        )}
      </div>

      {/* Filters (For Deans) */}
      {isDeanOrAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border bg-card/60 backdrop-blur p-4 rounded-xl shadow-sm">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">Category Filter</label>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="h-9 border rounded-lg bg-background px-2.5"
            >
              <option value="ALL">All Categories</option>
              <option value="Academic">Academic</option>
              <option value="Faculty">Faculty</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Library">Library</option>
              <option value="Transport">Transport</option>
              <option value="Hostel">Hostel</option>
              <option value="Exam">Exam</option>
              <option value="Fees">Fees</option>
              <option value="Scholarship">Scholarship</option>
              <option value="Ragging">Ragging</option>
              <option value="Discipline">Discipline</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">Status Filter</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-9 border rounded-lg bg-background px-2.5"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Submitted</option>
              <option value="IN_PROGRESS">Under Review</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button variant="outline" size="sm" className="w-full h-9" onClick={() => { setCategoryFilter('ALL'); setStatusFilter('ALL'); }}>
              Reset Filters
            </Button>
          </div>
        </div>
      )}

      {/* Grid List/Table */}
      <div className="border bg-card rounded-xl p-5 shadow-sm space-y-4">
        {isLoading ? (
          <div className="space-y-3 py-6">
            {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-muted/30 rounded animate-pulse" />)}
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <LifeBuoy className="h-8 w-8 mx-auto mb-2 text-neutral-400" />
            <p className="text-xs font-semibold">No complaints filed under these parameters</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto max-w-[90vw] md:max-w-full pb-2 scrollbar-thin"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket ID</TableHead>
                <TableHead>Summary Title</TableHead>
                {isDeanOrAdmin && <TableHead>Student Name</TableHead>}
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Created Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((row) => (
                <TableRow 
                  key={row.id} 
                  className="hover:bg-muted/10 cursor-pointer"
                  onClick={() => {
                    setSelectedTicket(row);
                    setTicketStatus(row.status);
                  }}
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">#{row.id.substring(0, 8)}</TableCell>
                  <TableCell className="font-bold">{row.title}</TableCell>
                  {isDeanOrAdmin && (
                    <TableCell className="text-primary font-bold">
                      {row.student ? `${row.student.firstName} ${row.student.lastName}` : 'General / Guest'}
                    </TableCell>
                  )}
                  <TableCell>{row.category}</TableCell>
                  <TableCell>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                      row.priority === 'HIGH'
                        ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                        : row.priority === 'MEDIUM'
                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                    }`}>
                      {row.priority}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                      STATUS_COLOR_MAP[row.status] || 'bg-neutral-500/10 text-neutral-500'
                    }`}>
                      {STATUS_DISPLAY_MAP[row.status] || row.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{new Date(row.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        )}
      </div>

      {/* Grievance Submission Form Modal */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Log New Grievance/Complaint">
        <form onSubmit={handleCreateTicket} className="space-y-4 p-4 text-xs font-semibold">
          <Input label="Summary Title / Subject" name="title" placeholder="Brief summary of your grievance..." required />
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">Detailed Description</label>
            <textarea 
              name="description" 
              rows={4} 
              placeholder="Please provide full details, dates, and background context..."
              required 
              className="border rounded bg-background p-2.5 font-normal leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary" 
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Category</label>
              <select name="category" className="h-10 border rounded bg-background px-3 focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="Academic">Academic</option>
                <option value="Faculty">Faculty</option>
                <option value="Infrastructure">Infrastructure</option>
                <option value="Library">Library</option>
                <option value="Transport">Transport</option>
                <option value="Hostel">Hostel</option>
                <option value="Exam">Exam</option>
                <option value="Fees">Fees</option>
                <option value="Scholarship">Scholarship</option>
                <option value="Ragging">Ragging</option>
                <option value="Discipline">Discipline</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Priority</label>
              <select name="priority" className="h-10 border rounded bg-background px-3 focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High / Critical</option>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">File Complaint</Button>
          </div>
        </form>
      </Modal>

      {/* Ticket Details & Response Thread Modal */}
      {selectedTicket && (
        <Modal 
          isOpen={!!selectedTicket} 
          onClose={() => setSelectedTicket(null)} 
          title={`Grievance Details: #${selectedTicket.id.substring(0, 8)}`}
        >
          <div className="p-5 text-xs font-semibold space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Header info */}
            <div className="border bg-muted/30 p-4 rounded-xl space-y-3">
              <div className="flex flex-wrap justify-between items-start gap-4">
                <h3 className="text-sm font-extrabold text-foreground">{selectedTicket.title}</h3>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLOR_MAP[selectedTicket.status]}`}>
                  {STATUS_DISPLAY_MAP[selectedTicket.status]}
                </span>
              </div>
              <p className="text-[11px] font-normal leading-relaxed text-muted-foreground bg-background p-3 rounded-lg border">
                {selectedTicket.description}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-muted-foreground">
                <span className="flex flex-wrap items-center gap-1"><Tag className="h-3 w-3" /> Category: {selectedTicket.category}</span>
                <span className="flex flex-wrap items-center gap-1"><Clock className="h-3 w-3" /> Filed: {new Date(selectedTicket.createdAt).toLocaleString()}</span>
                {isDeanOrAdmin && selectedTicket.student && (
                  <span className="flex flex-wrap items-center gap-1">
                    <User className="h-3 w-3 text-primary" /> Student: {selectedTicket.student.firstName} {selectedTicket.student.lastName} ({selectedTicket.student.admissionNo})
                  </span>
                )}
              </div>
            </div>

            {/* Replies Thread */}
            <div className="space-y-3">
              <h4 className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex flex-wrap items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" /> Resolution Correspondence Thread
              </h4>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {JSON.parse(selectedTicket.replies || '[]').length === 0 ? (
                  <p className="text-muted-foreground italic text-[11px] text-center py-4 bg-muted/10 rounded-lg">
                    No replies or resolution updates logged yet.
                  </p>
                ) : (
                  JSON.parse(selectedTicket.replies || '[]').map((rep: any, idx: number) => {
                    const isAuthorSelf = rep.author.includes(user?.firstName || '');
                    return (
                      <div 
                        key={idx} 
                        className={`flex flex-col space-y-1 p-2.5 rounded-xl border max-w-[85%] ${
                          isAuthorSelf 
                            ? 'ml-auto bg-primary/5 border-primary/20 items-end' 
                            : 'bg-card border-border items-start'
                        }`}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-foreground">{rep.author}</span>
                          <span className="text-[9px] text-muted-foreground font-bold px-1.5 py-0.2 bg-muted rounded">
                            {rep.role}
                          </span>
                        </div>
                        <p className="text-[11px] font-normal leading-relaxed text-muted-foreground whitespace-pre-wrap">
                          {rep.message}
                        </p>
                        <span className="text-[9px] text-muted-foreground/80 mt-1 block">
                          {new Date(rep.timestamp).toLocaleString()}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Reply / Status Change Form */}
            <form onSubmit={handlePostReply} className="space-y-4 pt-3 border-t">
              {isDeanOrAdmin && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Resolution Action / Status</label>
                  <select
                    value={ticketStatus}
                    onChange={e => setTicketStatus(e.target.value)}
                    className="h-9 border rounded-lg bg-background px-2.5"
                  >
                    <option value="OPEN">Submitted (Open)</option>
                    <option value="IN_PROGRESS">Under Review (In Progress)</option>
                    <option value="RESOLVED">Resolved (Closed)</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">
                  {isDeanOrAdmin ? 'Resolution Message / Reply' : 'Add Reply Message'}
                </label>
                <div className="relative">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Type correspondence details here..."
                    rows={3}
                    className="w-full border rounded-xl bg-background p-2.5 pr-10 font-normal leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    className="absolute right-3.5 bottom-3.5 text-primary hover:text-primary/85 disabled:opacity-50"
                    disabled={!replyText.trim() && ticketStatus === selectedTicket.status}
                  >
                    <Send className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2 pt-1.5">
                <Button type="button" variant="outline" onClick={() => setSelectedTicket(null)}>Close Window</Button>
                <Button type="submit" variant="primary" disabled={!replyText.trim() && ticketStatus === selectedTicket.status}>
                  Save Correspondence
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Support;
