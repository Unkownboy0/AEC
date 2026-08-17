import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, CheckCircle2, ShieldAlert, FileText, Send, Eye, Users } from 'lucide-react';
import { ActorAttributionLabel } from '../delegation/ActorAttributionLabel';
import { apiGet, apiPost } from '../../shared/api/api-client';

export const CircularCenter: React.FC = () => {
  const [circulars, setCirculars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('ACADEMIC');
  const [priority, setPriority] = useState('NORMAL');
  const [content, setContent] = useState('');
  const [broadcastLevel, setBroadcastLevel] = useState('ALL_CAMPUS');
  const [isEmergency, setIsEmergency] = useState(false);
  const [acknowledgementRequired, setAcknowledgementRequired] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchCirculars = async () => {
    try {
      const json = await apiGet<any>('/circulars');
      if (Array.isArray(json)) {
        setCirculars(json);
      } else if (json?.data) {
        setCirculars(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch circulars:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCirculars();
  }, []);

  const handleCreateCircular = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiPost('/circulars', {
        title,
        category,
        priority,
        content,
        broadcastLevel,
        isEmergency,
        acknowledgementRequired
      });
      setIsModalOpen(false);
      setTitle('');
      setContent('');
      fetchCirculars();
    } catch (err) {
      console.error('Failed to publish circular:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      await apiPost(`/circulars/${id}/acknowledge`);
      fetchCirculars();
    } catch (err) {
      console.error('Failed to acknowledge circular:', err);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-950 text-slate-100 min-h-screen">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-violet-950 via-slate-900 to-indigo-950 p-6 rounded-2xl border border-violet-500/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-violet-400 uppercase tracking-wider">
            <Megaphone className="w-4 h-4" /> Institutional Circular System
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1">Campus Announcements & Circular Center</h1>
          <p className="text-xs text-slate-400 mt-0.5">Publish and track institutional notifications with instant target delivery</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Publish New Circular
        </button>
      </div>

      {/* Circulars List */}
      <div className="space-y-4">
        {circulars.map((c) => (
          <div
            key={c.id}
            className={`p-5 rounded-2xl border transition-all space-y-3 ${
              c.isEmergency
                ? 'bg-rose-950/20 border-rose-500/50 text-white shadow-xl'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-violet-400 text-xs font-bold">{c.circularNumber}</span>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase ${
                  c.isEmergency ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40' : 'bg-slate-800 text-slate-300'
                }`}>
                  {c.category}
                </span>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-violet-500/20 text-violet-300 border border-violet-500/30 uppercase">
                  Target: {c.broadcastLevel.replace('_', ' ')}
                </span>
              </div>

              <span className="text-[11px] text-slate-400 font-medium">
                Published {new Date(c.publishedAt || c.createdAt).toLocaleDateString()}
              </span>
            </div>

            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                {c.isEmergency && <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />}
                {c.title}
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{c.content}</p>
            </div>

            {/* Attribution Badge */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-3 border-t border-slate-800/80">
              <ActorAttributionLabel
                actorName={c.publishedAs || c.authorRole || 'Institutional Executive'}
                actorRole={c.authorRole || 'Leadership'}
                performedAsRole={c.delegationId ? 'ACTING_PRINCIPAL' : undefined}
                actionType="PUBLISHED"
                timestamp={c.publishedAt}
              />

              {c.userStatus === 'ACKNOWLEDGED' ? (
                <span className="px-3.5 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-extrabold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Acknowledged
                </span>
              ) : (
                <button
                  onClick={() => handleAcknowledge(c.id)}
                  className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Acknowledge Circular
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-violet-500/30 rounded-2xl max-w-lg w-full p-6 text-slate-100 shadow-2xl space-y-4">
            <h2 className="text-lg font-black text-white">Publish New Institutional Circular</h2>

            <form onSubmit={handleCreateCircular} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block mb-1 font-bold text-slate-300">Circular Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Mandatory Academic Audit & Timetable Schedule"
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 w-full font-semibold focus:outline-none focus:border-violet-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-300">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 w-full font-semibold focus:outline-none"
                  >
                    <option value="ACADEMIC">Academic</option>
                    <option value="EXAMINATION">Examination</option>
                    <option value="IQAC">IQAC & NAAC</option>
                    <option value="GENERAL">General Notice</option>
                    <option value="EMERGENCY">Emergency Notice</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-300">Target Audience</label>
                  <select
                    value={broadcastLevel}
                    onChange={(e) => setBroadcastLevel(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 w-full font-semibold focus:outline-none"
                  >
                    <option value="ALL_CAMPUS">Entire Campus</option>
                    <option value="FACULTY_ONLY">Faculty Only</option>
                    <option value="STUDENT_ONLY">Students Only</option>
                    <option value="DEPARTMENT_SPECIFIC">Department Specific</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-300">Circular Content / Message</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  placeholder="Enter full details of the circular notice..."
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 w-full font-semibold focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isEmergency}
                    onChange={(e) => setIsEmergency(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-violet-600 focus:ring-0"
                  />
                  <span className="font-bold text-rose-400">Emergency Alert Notice</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acknowledgementRequired}
                    onChange={(e) => setAcknowledgementRequired(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-violet-600 focus:ring-0"
                  />
                  <span className="font-bold text-slate-300">Require Acknowledgement</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white font-extrabold rounded-xl shadow-lg"
                >
                  {submitting ? 'Publishing...' : 'Publish Circular'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
