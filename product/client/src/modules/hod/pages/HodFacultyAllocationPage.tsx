import React, { useState, useEffect, useCallback } from "react";
import { BookOpen, Users, Plus, Trash2, RefreshCw, AlertCircle, CheckCircle, ChevronDown, Layers } from "lucide-react";
import api from "../../../lib/axios";
import { toast } from "../../../components/ui/Toast";

export const HodFacultyAllocationPage: React.FC = () => {
  const [faculty, setFaculty] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ facultyId: "", subjectId: "", sectionId: "", requiredTheoryHours: 4, requiredLabHours: 0 });

  const fetchAll = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      const [fRes, sRes, secRes, aRes] = await Promise.all([
        api.get("/hod/allocation/faculty-workload"),
        api.get("/hod/allocation/subjects"),
        api.get("/hod/allocation/sections"),
        api.get("/hod/allocation"),
      ]);
      setFaculty(fRes.data?.data || []);
      setSubjects(sRes.data?.data || []);
      setSections(secRes.data?.data || []);
      setAllocations(aRes.data?.data || []);
    } catch (err: any) { setError(err.response?.data?.error || "Failed to load data."); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleAssign = async () => {
    if (!form.facultyId || !form.subjectId || !form.sectionId) { toast.error("Select faculty, subject, and section."); return; }
    setIsSaving(true);
    try {
      await api.post("/hod/allocation/assign", form);
      toast.success("Faculty allocation saved.");
      setForm({ facultyId: "", subjectId: "", sectionId: "", requiredTheoryHours: 4, requiredLabHours: 0 });
      fetchAll();
    } catch (err: any) { toast.error(err.response?.data?.error || "Failed to save."); }
    finally { setIsSaving(false); }
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Remove this allocation?")) return;
    try { await api.delete(`/hod/allocation/${id}`); toast.success("Removed."); fetchAll(); }
    catch { toast.error("Failed to remove."); }
  };

  const selectedFac = faculty.find((f) => f.id === form.facultyId);

  if (isLoading) return <div className="p-6 animate-pulse space-y-4"><div className="h-8 bg-muted rounded-xl w-64"/><div className="h-64 bg-muted rounded-2xl"/></div>;
  if (error) return <div className="p-6 flex flex-col items-center gap-4 text-center"><AlertCircle className="w-12 h-12 text-destructive"/><p className="text-text-secondary">{error}</p><button onClick={fetchAll} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2"><RefreshCw className="w-4 h-4"/>Retry</button></div>;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2"><Layers className="w-6 h-6 text-primary"/>Faculty Allocation</h1>
          <p className="text-sm text-text-secondary mt-1">Assign faculty to subjects and sections in your department</p>
        </div>
        <button onClick={fetchAll} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm text-text-secondary hover:bg-surface-soft transition-colors"><RefreshCw className="w-4 h-4"/>Refresh</button>
      </div>

      {/* Assign Form */}
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
        <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-primary"/>Assign Faculty to Subject/Section</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: "Faculty *", value: form.facultyId, key: "facultyId", options: faculty.map((f) => ({ value: f.id, label: `${f.name} — ${f.designation} (${f.totalPeriods}h/wk)` })) },
            { label: "Subject *", value: form.subjectId, key: "subjectId", options: subjects.map((s) => ({ value: s.id, label: `${s.name} (${s.code})${s.semester ? ` — Sem ${s.semester.semesterNumber}` : ""}` })) },
            { label: "Section *", value: form.sectionId, key: "sectionId", options: sections.map((s) => ({ value: s.id, label: `Year ${s.year} — ${s.name}` })) },
          ].map(({ label, value, key, options }) => (
            <div key={key} className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{label}</label>
              <div className="relative">
                <select value={value} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="w-full appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                  <option value="">Select…</option>
                  {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-3 w-4 h-4 text-text-muted pointer-events-none"/>
              </div>
            </div>
          ))}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Theory Hrs/Week</label>
            <input type="number" min={0} max={10} value={form.requiredTheoryHours} onChange={(e) => setForm((f) => ({ ...f, requiredTheoryHours: Number(e.target.value) }))}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"/>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Lab Hrs/Week</label>
            <input type="number" min={0} max={10} value={form.requiredLabHours} onChange={(e) => setForm((f) => ({ ...f, requiredLabHours: Number(e.target.value) }))}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"/>
          </div>
          <div className="flex items-end">
            <button onClick={handleAssign} disabled={isSaving || !form.facultyId || !form.subjectId || !form.sectionId}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover active:scale-[0.98] transition-all disabled:opacity-50 shadow-sm">
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin"/> : <CheckCircle className="w-4 h-4"/>}
              {isSaving ? "Saving…" : "Assign"}
            </button>
          </div>
        </div>
        {selectedFac && (
          <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/20 text-sm">
            <span className="font-medium text-primary">Workload for {selectedFac.name}:</span>{" "}
            <span className="text-text-secondary">{selectedFac.totalPeriods} periods/week · {selectedFac.allocations?.length || 0} subject(s)</span>
          </div>
        )}
      </div>

      {/* Allocations Table */}
      <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary"/>
          <h2 className="text-base font-semibold text-text-primary">Current Allocations</h2>
          <span className="ml-auto text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-semibold">{allocations.length}</span>
        </div>
        {allocations.length === 0 ? (
          <div className="p-10 text-center text-text-muted"><Users className="w-10 h-10 mx-auto mb-3 opacity-30"/><p className="font-medium">No allocations yet</p><p className="text-sm mt-1">Use the form above to assign faculty to subjects</p></div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-soft border-b border-border">
                  <tr>{["Faculty","Subject","Section","Hrs","Action"].map((h) => <th key={h} className={`px-4 py-3 text-${h==="Action"?"right":"left"} font-semibold text-text-secondary text-xs uppercase tracking-wider`}>{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {allocations.map((a) => (
                    <tr key={a.id} className="hover:bg-surface-soft transition-colors">
                      <td className="px-4 py-3"><div className="font-medium text-text-primary">{a.faculty?.firstName} {a.faculty?.lastName}</div><div className="text-xs text-text-muted">{a.faculty?.employeeId} · {a.faculty?.designation}</div></td>
                      <td className="px-4 py-3"><div className="font-medium text-text-primary">{a.subject?.name}</div><div className="text-xs text-text-muted">{a.subject?.code}</div></td>
                      <td className="px-4 py-3"><div className="font-medium text-text-primary">Year {a.section?.year} — {a.section?.name}</div>{a.semester && <div className="text-xs text-text-muted">Sem {a.semester.semesterNumber}</div>}</td>
                      <td className="px-4 py-3 text-text-secondary">{a.requiredTheoryHours}T+{a.requiredLabHours}L</td>
                      <td className="px-4 py-3 text-right"><button onClick={() => handleRemove(a.id)} className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"><Trash2 className="w-4 h-4"/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y divide-border">
              {allocations.map((a) => (
                <div key={a.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div><p className="font-semibold text-text-primary text-sm">{a.faculty?.firstName} {a.faculty?.lastName}</p><p className="text-xs text-text-muted">{a.faculty?.designation}</p></div>
                    <button onClick={() => handleRemove(a.id)} className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors shrink-0"><Trash2 className="w-4 h-4"/></button>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{a.subject?.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-surface-soft text-text-secondary border border-border">Year {a.section?.year} · {a.section?.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-surface-soft text-text-secondary border border-border">{a.requiredTheoryHours}T+{a.requiredLabHours}L hrs</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HodFacultyAllocationPage;
