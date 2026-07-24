import React, { useState } from 'react';
import { FolderGit, Plus, Trash2, Github, Globe, ExternalLink, Star, Clock, CheckCircle, Award } from 'lucide-react';
import { toast } from '../../components/ui/Toast';

interface Project {
  id: string;
  title: string;
  description: string;
  tech: string[];
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PLANNED';
  github?: string;
  demo?: string;
  guide?: string;
  type: 'Major' | 'Minor' | 'Personal' | 'Research';
  year: string;
  stars?: number;
}

const PROJECTS: Project[] = [
  { id: '1', title: 'GEETORUS CampusOS – Enterprise ERP', description: 'A full-stack enterprise-grade campus management system handling student lifecycle, faculty operations, admissions, placements, and institutional analytics. Built with React, Node.js, Prisma, and PostgreSQL.', tech: ['React', 'TypeScript', 'Node.js', 'Prisma', 'PostgreSQL', 'JWT'], status: 'COMPLETED', github: 'https://github.com', demo: 'https://campusos.geetorus.edu.in', guide: 'Dr. Sarah Chen', type: 'Major', year: '2026', stars: 48 },
  { id: '2', title: 'Real-Time Collaborative Code Editor', description: 'A browser-based IDE with live multi-user collaboration powered by WebSockets and CRDT. Supports 12+ languages with syntax highlighting and auto-completion using Monaco Editor.', tech: ['React', 'WebSocket', 'Node.js', 'Monaco', 'Redis'], status: 'COMPLETED', github: 'https://github.com', guide: 'Prof. Mark Davis', type: 'Minor', year: '2025', stars: 31 },
  { id: '3', title: 'AI-Powered Resume Scoring Engine', description: 'Trained a BERT-based NLP model to evaluate resume ATS scores, keyword relevance, grammar quality, and role-fit probability. Deployed as a REST API with FastAPI.', tech: ['Python', 'PyTorch', 'BERT', 'FastAPI', 'Docker'], status: 'IN_PROGRESS', github: 'https://github.com', type: 'Personal', year: '2026', stars: 14 },
  { id: '4', title: 'Distributed Cache Invalidation System', description: 'Research prototype exploring cache coherence protocols in distributed key-value stores. Implemented three strategies: TTL, LRU, and event-sourced invalidation patterns.', tech: ['Go', 'Redis', 'Kafka', 'Docker', 'Kubernetes'], status: 'IN_PROGRESS', type: 'Research', year: '2026' },
];

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400',
  IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400',
  PLANNED: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400',
};

const TYPE_COLORS: Record<string, string> = {
  Major: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  Minor: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Personal: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  Research: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};

export const StudentPortfolio: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(PROJECTS);
  const [filter, setFilter] = useState<'ALL' | Project['type']>('ALL');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', description: '', tech: '', github: '', type: 'Personal', status: 'IN_PROGRESS' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.title.trim()) return;
    const p: Project = {
      id: Date.now().toString(),
      title: newProject.title,
      description: newProject.description,
      tech: newProject.tech.split(',').map(t => t.trim()).filter(Boolean),
      status: newProject.status as any,
      github: newProject.github || undefined,
      type: newProject.type as any,
      year: new Date().getFullYear().toString(),
    };
    setProjects(prev => [p, ...prev]);
    setNewProject({ title: '', description: '', tech: '', github: '', type: 'Personal', status: 'IN_PROGRESS' });
    setShowAddForm(false);
    toast.success('Project added to portfolio.');
  };

  const filtered = projects.filter(p => filter === 'ALL' || p.type === filter);

  return (
    <div className="space-y-6 text-left pb-12 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <FolderGit className="h-5 w-5 text-indigo-600" /> Engineering Portfolio
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Showcase your projects, research, and open-source contributions</p>
        </div>
        <button onClick={() => setShowAddForm(v => !v)}
          className="px-4 py-2 bg-indigo-600 text-white text-xs font-extrabold rounded-xl shadow hover:bg-indigo-700 flex items-center gap-1.5">
          <Plus className="h-4 w-4" /> Add Project
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Projects', value: projects.length },
          { label: 'Completed', value: projects.filter(p => p.status === 'COMPLETED').length },
          { label: 'In Progress', value: projects.filter(p => p.status === 'IN_PROGRESS').length },
          { label: 'Total GitHub Stars', value: projects.reduce((a, p) => a + (p.stars || 0), 0) },
        ].map((s, idx) => (
          <div key={idx} className="border bg-card p-4 rounded-2xl shadow-sm text-center">
            <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">{s.label}</p>
            <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">New Project Entry</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
            <div className="md:col-span-2">
              <label className="block text-[8px] uppercase font-black text-slate-500 mb-1">Project Title</label>
              <input type="text" required value={newProject.title} onChange={e => setNewProject(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. AI Resume Optimizer..." className="w-full px-3 py-2 border rounded-xl bg-background outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[8px] uppercase font-black text-slate-500 mb-1">Description</label>
              <textarea rows={2} value={newProject.description} onChange={e => setNewProject(p => ({ ...p, description: e.target.value }))}
                placeholder="Describe the project goals and approach..." className="w-full px-3 py-2 border rounded-xl bg-background outline-none resize-none" />
            </div>
            <div>
              <label className="block text-[8px] uppercase font-black text-slate-500 mb-1">Tech Stack (comma-separated)</label>
              <input type="text" value={newProject.tech} onChange={e => setNewProject(p => ({ ...p, tech: e.target.value }))}
                placeholder="React, Node.js, PostgreSQL..." className="w-full px-3 py-2 border rounded-xl bg-background outline-none" />
            </div>
            <div>
              <label className="block text-[8px] uppercase font-black text-slate-500 mb-1">GitHub URL</label>
              <input type="url" value={newProject.github} onChange={e => setNewProject(p => ({ ...p, github: e.target.value }))}
                placeholder="https://github.com/..." className="w-full px-3 py-2 border rounded-xl bg-background outline-none" />
            </div>
            <div>
              <label className="block text-[8px] uppercase font-black text-slate-500 mb-1">Project Type</label>
              <select value={newProject.type} onChange={e => setNewProject(p => ({ ...p, type: e.target.value }))}
                className="w-full px-3 py-2 border rounded-xl bg-background outline-none">
                {['Major', 'Minor', 'Personal', 'Research'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[8px] uppercase font-black text-slate-500 mb-1">Status</label>
              <select value={newProject.status} onChange={e => setNewProject(p => ({ ...p, status: e.target.value }))}
                className="w-full px-3 py-2 border rounded-xl bg-background outline-none">
                <option value="COMPLETED">Completed</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="PLANNED">Planned</option>
              </select>
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-black rounded-xl text-xs">Add Project</button>
              <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 border font-black rounded-xl text-xs hover:bg-muted">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap text-[10px] font-black">
        {(['ALL', 'Major', 'Minor', 'Personal', 'Research'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl border transition-colors ${filter === f ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-card hover:bg-muted'}`}>
            {f === 'ALL' ? 'All Projects' : f}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map(p => (
          <div key={p.id} className="border bg-card rounded-2xl shadow-sm p-5 space-y-3 hover:shadow-md transition-all group">
            <div className="flex items-start justify-between gap-2">
              <div className="flex gap-2 items-center flex-wrap">
                <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded ${TYPE_COLORS[p.type]}`}>{p.type}</span>
                <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded border ${STATUS_COLORS[p.status]}`}>{p.status.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {p.stars && <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400"><Star className="h-3 w-3 text-amber-400 fill-amber-400" />{p.stars}</span>}
                <span className="text-[9px] font-bold text-slate-400">{p.year}</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-white leading-tight">{p.title}</h3>
              {p.guide && <p className="text-[10px] text-slate-400 font-bold mt-0.5">Guide: {p.guide}</p>}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed line-clamp-3">{p.description}</p>
            <div className="flex flex-wrap gap-1.5">
              {p.tech.map(t => (
                <span key={t} className="bg-muted text-slate-600 dark:text-slate-300 text-[9px] font-bold px-2 py-0.5 rounded-full font-mono">{t}</span>
              ))}
            </div>
            <div className="flex gap-2 border-t pt-3">
              {p.github && (
                <a href={p.github} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                  className="flex items-center gap-1 text-[10px] font-black text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
                  <Github className="h-3.5 w-3.5" /> GitHub
                </a>
              )}
              {p.demo && (
                <a href={p.demo} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                  className="flex items-center gap-1 text-[10px] font-black text-indigo-600 hover:text-indigo-700 transition-colors">
                  <Globe className="h-3.5 w-3.5" /> Live Demo
                </a>
              )}
              <button onClick={() => { setProjects(prev => prev.filter(x => x.id !== p.id)); toast.success('Project removed.'); }}
                className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg">
                <Trash2 className="h-3.5 w-3.5 text-rose-400" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentPortfolio;
