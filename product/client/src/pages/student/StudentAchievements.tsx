import React, { useState, useEffect } from 'react';
import {
  Sparkles, Award, Plus, CheckCircle2, Lock, Eye, Trash2, Globe, FileText, ExternalLink, ShieldCheck
} from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';
import api from '../../lib/axios';

interface Achievement {
  id: string;
  title: string;
  category: string;
  description?: string;
  issuedBy?: string;
  issueDate?: string;
  certificateUrl?: string;
  verified: boolean;
  isPublished: boolean;
  createdAt: string;
}

const CATEGORIES = [
  'ACADEMIC', 'SPORTS', 'CULTURAL', 'RESEARCH', 'HACKATHON', 'CERTIFICATION', 'COMMUNITY', 'OTHER'
];

export const StudentAchievements: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('ACADEMIC');
  const [description, setDescription] = useState('');
  const [issuedBy, setIssuedBy] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [certificateUrl, setCertificateUrl] = useState('');
  const [isPublished, setIsPublished] = useState(false);

  const fetchAchievements = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/enterprise/students/me/achievements');
      if (res.data?.status === 'success') {
        setAchievements(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load achievements:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter an achievement title.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post('/enterprise/students/me/achievements', {
        title: title.trim(),
        category,
        description: description.trim() || undefined,
        issuedBy: issuedBy.trim() || undefined,
        issueDate: issueDate || undefined,
        certificateUrl: certificateUrl.trim() || undefined,
        isPublished,
      });

      if (res.data?.status === 'success' || res.data?.data) {
        toast.success('Achievement recorded securely!');
        setShowModal(false);
        setTitle('');
        setDescription('');
        setIssuedBy('');
        setIssueDate('');
        setCertificateUrl('');
        setIsPublished(false);
        fetchAchievements();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record achievement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const res = await api.put(`/enterprise/students/me/achievements/${id}/publish`, {
        isPublished: !currentStatus,
      });
      if (res.data?.status === 'success') {
        toast.success(!currentStatus ? 'Published to Campus Showcase!' : 'Achievement made Private.');
        setAchievements(prev => prev.map(a => a.id === id ? { ...a, isPublished: !currentStatus } : a));
      }
    } catch (err: any) {
      toast.error('Failed to update publication status.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this achievement record?')) return;
    try {
      await api.delete(`/enterprise/students/me/achievements/${id}`);
      toast.success('Achievement record deleted.');
      setAchievements(prev => prev.filter(a => a.id !== id));
    } catch (err: any) {
      toast.error('Failed to delete achievement.');
    }
  };

  if (isLoading) return <Loading text="Loading Verified Achievements..." />;

  const publishedCount = achievements.filter(a => a.isPublished).length;
  const verifiedCount = achievements.filter(a => a.verified).length;

  return (
    <div className="space-y-6 text-left pb-16 animate-in fade-in duration-200">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-amber-500" /> Verified Achievements Vault
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Store and publish your verified academic, sports, research, and hackathon accomplishments
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow flex items-center gap-1.5 transition-all"
        >
          <Plus className="h-4 w-4" /> Add Achievement
        </button>
      </header>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border bg-card p-4 rounded-2xl shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/30">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">Total Achievements</p>
            <p className="text-lg font-black text-slate-800 dark:text-white">{achievements.length} Records</p>
          </div>
        </div>

        <div className="border bg-card p-4 rounded-2xl shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">Institution Verified</p>
            <p className="text-lg font-black text-emerald-600">{verifiedCount} Verified</p>
          </div>
        </div>

        <div className="border bg-card p-4 rounded-2xl shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">Public Showcase</p>
            <p className="text-lg font-black text-indigo-600">{publishedCount} Published</p>
          </div>
        </div>
      </div>

      {/* Privacy Notice Alert */}
      <div className="p-4 rounded-2xl border border-indigo-200/80 bg-indigo-50/50 dark:bg-indigo-950/20 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-3">
        <Lock className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-extrabold">Privacy Controls Active</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-indigo-700 dark:text-indigo-300">
            Achievements marked <span className="font-bold">Private</span> are strictly confidential and visible only to you and your assigned mentor/faculty. Other students can only view achievements you explicitly choose to <span className="font-bold">Publish to Campus Showcase</span>.
          </p>
        </div>
      </div>

      {/* Achievements List Grid */}
      {achievements.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center bg-card">
          <Award className="mx-auto h-8 w-8 text-amber-400 opacity-60" />
          <h3 className="mt-3 text-sm font-extrabold text-slate-800 dark:text-white">No Achievements Recorded Yet</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
            Log your hackathon wins, research papers, certifications, and medals to build your verified academic portfolio.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 px-4 py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded-xl"
          >
            Add First Achievement
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map((ach) => (
            <div key={ach.id} className="border bg-card p-5 rounded-2xl shadow-sm space-y-3 flex flex-col justify-between hover:shadow-md transition-all">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[9px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded uppercase">
                      {ach.category}
                    </span>
                    {ach.verified ? (
                      <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Verified
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[9px] font-bold bg-slate-100 text-slate-600 rounded-full">
                        Pending Verification
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => togglePublish(ach.id, ach.isPublished)}
                      title={ach.isPublished ? "Make Private (Hide from other students)" : "Publish to Campus Showcase (Visible to students)"}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition-all ${
                        ach.isPublished ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {ach.isPublished ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                      {ach.isPublished ? 'Published' : 'Private'}
                    </button>

                    <button
                      onClick={() => handleDelete(ach.id)}
                      title="Delete"
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-black text-slate-800 dark:text-white leading-tight">{ach.title}</h3>
                {ach.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {ach.description}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span>{ach.issuedBy ? `Issued by: ${ach.issuedBy}` : 'Self-declared'}</span>
                {ach.certificateUrl && (
                  <a
                    href={ach.certificateUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 font-bold hover:underline flex items-center gap-1"
                  >
                    View Proof <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD ACHIEVEMENT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 text-left animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-black uppercase text-slate-800 dark:text-white flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-500" /> Log Verified Achievement
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Achievement Title *</label>
                <input
                  type="text"
                  placeholder="e.g. 1st Place - National Hackathon 2026, AWS Certified Developer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2.5 border rounded-xl bg-background outline-none font-bold text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 border rounded-xl bg-background outline-none font-bold text-xs"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Issuing Authority / Event</label>
                  <input
                    type="text"
                    placeholder="e.g. IEEE, Smart India Hackathon"
                    value={issuedBy}
                    onChange={(e) => setIssuedBy(e.target.value)}
                    className="w-full px-3 py-2.5 border rounded-xl bg-background outline-none text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Description / Summary</label>
                <textarea
                  rows={2}
                  placeholder="Describe your achievement, medal won, or project detail..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-background outline-none text-xs resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Certificate / Proof Link (URL)</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/... or certificate link"
                  value={certificateUrl}
                  onChange={(e) => setCertificateUrl(e.target.value)}
                  className="w-full px-3 py-2.5 border rounded-xl bg-background outline-none text-xs"
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="isPublished" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                  Publish to Campus Showcase (Other students can view this achievement)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border text-xs font-bold rounded-xl hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow flex items-center gap-1.5 transition-all disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <div className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>Save Achievement</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentAchievements;
