import React, { useState } from 'react';
import { BadgeCheck, Plus, TrendingUp, Award, Star, BarChart2, Zap, Code, Globe, Cpu, BookOpen } from 'lucide-react';
import { toast } from '../../components/ui/Toast';

interface Skill {
  name: string;
  category: string;
  proficiency: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  verified: boolean;
  source?: string;
}

interface Certification {
  name: string;
  issuer: string;
  date: string;
  credentialId?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'IN_PROGRESS';
  badge?: string;
}

const SKILLS: Skill[] = [
  { name: 'TypeScript', category: 'Languages', proficiency: 'EXPERT', verified: true, source: 'GitHub Activity' },
  { name: 'React.js', category: 'Frontend', proficiency: 'EXPERT', verified: true, source: 'Project Portfolio' },
  { name: 'Node.js', category: 'Backend', proficiency: 'ADVANCED', verified: true, source: 'Internship – Google' },
  { name: 'PostgreSQL', category: 'Database', proficiency: 'ADVANCED', verified: true, source: 'Academic Project' },
  { name: 'Python', category: 'Languages', proficiency: 'ADVANCED', verified: true, source: 'Coursera' },
  { name: 'System Design', category: 'Architecture', proficiency: 'INTERMEDIATE', verified: false },
  { name: 'Docker & Kubernetes', category: 'DevOps', proficiency: 'INTERMEDIATE', verified: true, source: 'Microsoft Course' },
  { name: 'Machine Learning', category: 'AI/ML', proficiency: 'INTERMEDIATE', verified: false },
  { name: 'Java', category: 'Languages', proficiency: 'INTERMEDIATE', verified: true, source: 'LeetCode 345 solved' },
  { name: 'Data Structures & Algorithms', category: 'CS Fundamentals', proficiency: 'ADVANCED', verified: true, source: 'LeetCode – Top 12%' },
  { name: 'REST API Design', category: 'Backend', proficiency: 'ADVANCED', verified: true },
  { name: 'Git & GitHub', category: 'DevOps', proficiency: 'EXPERT', verified: true, source: '400+ commits' },
];

const CERTIFICATIONS: Certification[] = [
  { name: 'AWS Cloud Practitioner', issuer: 'Amazon Web Services', date: '2026-03', credentialId: 'AWS-CP-20260310', status: 'ACTIVE', badge: 'AWS' },
  { name: 'Google Cloud Associate Engineer', issuer: 'Google', date: '2025-11', credentialId: 'GCP-ACE-2025', status: 'ACTIVE', badge: 'GCP' },
  { name: 'Meta React Developer', issuer: 'Meta (Coursera)', date: '2025-08', credentialId: 'META-REACT-2025', status: 'ACTIVE', badge: 'META' },
  { name: 'Microsoft Azure Fundamentals AZ-900', issuer: 'Microsoft', date: '2025-06', credentialId: 'AZ900-MSFT-2025', status: 'ACTIVE', badge: 'AZURE' },
  { name: 'NPTEL – Data Science for Engineers', issuer: 'IIT Madras (NPTEL)', date: '2024-12', credentialId: 'NPTEL-DSE-2024', status: 'ACTIVE', badge: 'NPTEL' },
  { name: 'Google Cybersecurity Certificate', issuer: 'Google', date: '2026-06', status: 'IN_PROGRESS', badge: 'GOOG' },
];

const PROFICIENCY_CONFIG = {
  EXPERT: { label: 'Expert', color: 'text-indigo-600', bar: 'bg-indigo-600', width: '95%' },
  ADVANCED: { label: 'Advanced', color: 'text-emerald-600', bar: 'bg-emerald-500', width: '75%' },
  INTERMEDIATE: { label: 'Intermediate', color: 'text-amber-600', bar: 'bg-amber-500', width: '55%' },
  BEGINNER: { label: 'Beginner', color: 'text-slate-500', bar: 'bg-slate-400', width: '30%' },
};

const BADGE_COLORS: Record<string, string> = {
  AWS: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  GCP: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  META: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400',
  AZURE: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400',
  NPTEL: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  GOOG: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400',
};

export const StudentSkills: React.FC = () => {
  const [skills] = useState<Skill[]>(SKILLS);
  const [certifications] = useState<Certification[]>(CERTIFICATIONS);
  const [activeTab, setActiveTab] = useState<'skills' | 'certifications'>('skills');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [newSkill, setNewSkill] = useState('');
  const [localSkills, setLocalSkills] = useState<Skill[]>([]);

  const allSkills = [...skills, ...localSkills];
  const categories = ['ALL', ...Array.from(new Set(allSkills.map(s => s.category)))];
  const filteredSkills = allSkills.filter(s => categoryFilter === 'ALL' || s.category === categoryFilter);

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    setLocalSkills(prev => [...prev, { name: newSkill.trim(), category: 'Other', proficiency: 'BEGINNER', verified: false }]);
    setNewSkill('');
    toast.success('Skill added to your profile.');
  };

  const expertCount = allSkills.filter(s => s.proficiency === 'EXPERT').length;
  const verifiedCount = allSkills.filter(s => s.verified).length;
  const activeCerts = certifications.filter(c => c.status === 'ACTIVE').length;

  return (
    <div className="space-y-6 text-left pb-12 animate-in fade-in duration-200">
      <div>
        <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
          <BadgeCheck className="h-5 w-5 text-indigo-600" /> Skills & Certifications Hub
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Track proficiency, verified credentials, and industry certifications</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Skills', value: allSkills.length, icon: <Zap className="h-4 w-4 text-amber-500" /> },
          { label: 'Expert Level', value: expertCount, icon: <Star className="h-4 w-4 text-indigo-500 fill-indigo-500" /> },
          { label: 'Verified Skills', value: verifiedCount, icon: <BadgeCheck className="h-4 w-4 text-emerald-500" /> },
          { label: 'Active Certifications', value: activeCerts, icon: <Award className="h-4 w-4 text-amber-500" /> },
        ].map((s, idx) => (
          <div key={idx} className="border bg-card p-4 rounded-2xl shadow-sm flex items-center gap-3">
            <div className="p-2 rounded-xl bg-muted/50 shrink-0">{s.icon}</div>
            <div>
              <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">{s.label}</p>
              <p className="text-xl font-black text-slate-800 dark:text-white mt-0.5">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b text-xs font-bold gap-1">
        <button onClick={() => setActiveTab('skills')}
          className={`pb-2.5 px-3 border-b-2 transition-colors ${activeTab === 'skills' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-muted-foreground'}`}>
          Technical Skills ({allSkills.length})
        </button>
        <button onClick={() => setActiveTab('certifications')}
          className={`pb-2.5 px-3 border-b-2 transition-colors ${activeTab === 'certifications' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-muted-foreground'}`}>
          Certifications ({certifications.length})
        </button>
      </div>

      {activeTab === 'skills' && (
        <div className="space-y-5">
          <div className="flex flex-col md:flex-row gap-3 items-center">
            <div className="flex gap-2 flex-wrap flex-1">
              {categories.map(cat => (
                <button key={cat} onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 text-[10px] font-black rounded-xl border transition-colors ${categoryFilter === cat ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-card hover:bg-muted'}`}>
                  {cat}
                </button>
              ))}
            </div>
            <form onSubmit={handleAddSkill} className="flex gap-2">
              <input type="text" placeholder="Add new skill..." value={newSkill} onChange={e => setNewSkill(e.target.value)}
                className="text-xs px-3 py-1.5 border rounded-xl bg-card outline-none font-semibold w-40" />
              <button type="submit" className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-black rounded-xl flex items-center gap-1">
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSkills.map((skill, idx) => {
              const prof = PROFICIENCY_CONFIG[skill.proficiency];
              return (
                <div key={idx} className="border bg-card p-4 rounded-2xl shadow-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-extrabold text-slate-800 dark:text-white">{skill.name}</p>
                      {skill.verified && <BadgeCheck className="h-4 w-4 text-indigo-500 shrink-0" aria-label="Verified" />}
                    </div>
                    <span className={`text-[9px] font-black uppercase ${prof.color}`}>{prof.label}</span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${prof.bar} rounded-full transition-all duration-500`} style={{ width: prof.width }} />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                    <span>{skill.category}</span>
                    {skill.source && <span className="italic">{skill.source}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'certifications' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {certifications.map((cert, idx) => (
            <div key={idx} className="border bg-card p-4 rounded-2xl shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className={`px-3 py-2 rounded-xl font-black text-sm ${BADGE_COLORS[cert.badge || 'AWS']}`}>
                  {cert.badge}
                </div>
                <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded border ${
                  cert.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                  cert.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                  'bg-rose-50 text-rose-700 border-rose-100'
                }`}>{cert.status.replace('_', ' ')}</span>
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-800 dark:text-white leading-tight">{cert.name}</p>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">{cert.issuer}</p>
              </div>
              <div className="text-[9px] text-slate-400 font-semibold space-y-0.5">
                <p>Issued: {cert.date}</p>
                {cert.credentialId && <p className="font-mono text-[8px]">ID: {cert.credentialId}</p>}
              </div>
              <button onClick={() => toast.info('Opening credential verification page.')}
                className="w-full py-1.5 border text-[10px] font-black rounded-xl hover:bg-muted transition-colors">
                Verify Credential
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentSkills;
