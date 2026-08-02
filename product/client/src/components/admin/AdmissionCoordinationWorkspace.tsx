import React, { useState, useEffect } from 'react';
import {
  Send, Plus, Search, Building, User, Clock, CheckCircle,
  AlertCircle, FileText, RefreshCw, Layers, Shield, X
} from 'lucide-react';
import { toast } from '../ui/Toast';
import { Loading } from '../ui/Loading';
import api from '../../lib/axios';

export const AdmissionCoordinationWorkspace: React.FC<{ user: any }> = ({ user }) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    requestType: 'VERIFY_PROGRAMME_CAPACITY',
    priority: 'MEDIUM',
    departmentId: '',
    dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [reqRes, deptRes] = await Promise.all([
        api.get('/admission-dean/coordination'),
        api.get('/academic-dean/departments'),
      ]);
      setRequests(reqRes.data.data || []);
      setDepartments(deptRes.data.data || []);
    } catch (_) {
      toast.error('Failed to load admission coordination workspace data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.departmentId || !form.dueAt) {
      toast.error('Title, department, and due date are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/admission-dean/coordination', form);
      toast.success('Admission coordination request sent to HOD!');
      setModalOpen(false);
      setForm({
        title: '',
        description: '',
        requestType: 'VERIFY_PROGRAMME_CAPACITY',
        priority: 'MEDIUM',
        departmentId: '',
        dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send coordination request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" /> Admission Coordination Workspace
          </h2>
          <p className="text-xs text-muted-foreground">
            Structured admission requests to department HODs for capacity, seat allocation & eligibility confirmation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={fetchData} className="p-2 rounded-xl border text-xs font-bold flex items-center gap-1">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-extrabold flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Send Request to HOD
          </button>
        </div>
      </div>

      {/* Request Cards Grid */}
      {isLoading ? (
        <Loading text="Loading admission coordination requests..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {requests.length === 0 ? (
            <div className="col-span-full text-center py-12 border border-dashed rounded-2xl text-xs text-muted-foreground">
              No admission coordination requests created yet.
            </div>
          ) : (
            requests.map((r) => (
              <div key={r.id} className="border bg-card p-4 rounded-xl shadow-2xs space-y-3 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-primary">{r.requestCode}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${
                      r.status === 'COMPLETED' ? 'bg-green-500/10 text-green-600' : 'bg-blue-500/10 text-blue-600'
                    }`}>
                      {r.status}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-foreground">{r.title}</h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{r.description}</p>
                </div>

                <div className="pt-2 border-t text-[11px] flex items-center justify-between text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Building className="h-3 w-3" /> {r.department?.code}
                  </span>
                  <span>Due: <strong className="text-red-600 font-mono">{new Date(r.dueAt).toLocaleDateString()}</strong></span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* New Request Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateRequest} className="bg-card border rounded-2xl shadow-xl w-full max-w-lg p-5 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Send className="h-4 w-4 text-primary" /> New Admission Coordination Request
              </h3>
              <button type="button" onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold">Target Department *</label>
                <select
                  value={form.departmentId}
                  onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                  className="w-full text-xs bg-background border rounded-lg p-2.5 outline-none font-semibold"
                >
                  <option value="">Select Department...</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code} - {d.name} (HOD: {d.hodUser?.firstName || 'Assigned'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold">Request Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Confirm B.Tech Lateral Entry Seat Capacity & Lab Eligibility"
                  className="w-full text-xs bg-background border rounded-lg p-2.5 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold">Description & Special Instructions *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Provide detailed query or information requested from the department..."
                  className="w-full text-xs bg-background border rounded-lg p-2.5 min-h-[80px] outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full text-xs bg-background border rounded-lg p-2.5 outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold">Due Date *</label>
                  <input
                    type="date"
                    value={form.dueAt}
                    onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
                    className="w-full text-xs bg-background border rounded-lg p-2.5 outline-none font-bold text-red-600"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded-xl text-xs font-bold">
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-primary text-primary-foreground text-xs font-extrabold rounded-xl shadow-xs"
              >
                {isSubmitting ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
