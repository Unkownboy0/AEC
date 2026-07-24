import React, { useState } from 'react';
import { Compass, Users, Calendar, Trophy, Clock, CheckCircle, Star, Plus, ExternalLink, Mail, ChevronRight } from 'lucide-react';
import { toast } from '../../components/ui/Toast';

interface Club {
  id: string;
  name: string;
  description: string;
  category: string;
  memberCount: number;
  coordinator: string;
  meetingSchedule: string;
  isMember: boolean;
  achievements: string[];
  upcomingEvent?: { title: string; date: string };
  logo: string;
  color: string;
}

const CLUBS: Club[] = [
  { id: '1', name: 'IEEE Student Chapter', category: 'Technical', description: 'Advancing technology for humanity. IEEE GIT chapter organizes workshops, seminars, hackathons, and paper presentations aligned with IEEE standards.', memberCount: 312, coordinator: 'Dr. Anand Kumar', meetingSchedule: 'Every Friday, 4:00 PM', isMember: true, achievements: ['Best Chapter Award 2025', 'National Hackathon Finalist'], upcomingEvent: { title: 'AI/ML Workshop Series Vol. 4', date: '2026-07-30' }, logo: 'IEEE', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' },
  { id: '2', name: 'ACM Student Chapter', category: 'Technical', description: 'ACM GIT engages students in advanced computing challenges, competitive programming, and system design contests. Monthly coding leagues hosted.', memberCount: 248, coordinator: 'Prof. Maya Devi', meetingSchedule: 'Every Saturday, 3:00 PM', isMember: true, achievements: ['ICPC Asia Regionals 2025', 'CodeForces Rating 1800+'], upcomingEvent: { title: 'ICPC Pre-Training Contest', date: '2026-08-04' }, logo: 'ACM', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' },
  { id: '3', name: 'Robotics & Automation Club', category: 'Technical', description: 'Hands-on engineering with Arduino, Raspberry Pi, embedded systems, and autonomous robots. Participates in ROBOCON and national robotics competitions.', memberCount: 156, coordinator: 'Mr. Suresh Nair', meetingSchedule: 'Wednesday, 5:00 PM', isMember: false, achievements: ['ROBOCON 2025 – Top 10', 'Smart India Hackathon Finalist'], upcomingEvent: { title: 'Line-Following Bot Contest', date: '2026-08-10' }, logo: 'ROB', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' },
  { id: '4', name: 'Entrepreneurship & Innovation Cell', category: 'Professional', description: 'E-Cell fosters entrepreneurial mindset through startup pitches, investor meets, mentorship programs, and incubation support for student ventures.', memberCount: 195, coordinator: 'Dr. Preethi Raj', meetingSchedule: 'Tuesday, 4:30 PM', isMember: false, achievements: ['Startup India Recognition 2025', '₹12L Seed Funding Secured'], upcomingEvent: { title: 'Startup Pitch Day Season 4', date: '2026-08-20' }, logo: 'E-CELL', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
  { id: '5', name: 'Photography & Media Club', category: 'Cultural', description: 'Creative hub for photography, videography, graphic design, and digital content. Manages campus media including social media, college magazine, and event coverage.', memberCount: 98, coordinator: 'Ms. Divya Krishnan', meetingSchedule: 'Thursday, 5:00 PM', isMember: false, achievements: ['Best College Magazine 2025', 'State Photography Competition – Gold'], logo: 'PHOTO', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400' },
  { id: '6', name: 'NSS Unit – Social Service Wing', category: 'Social', description: 'National Service Scheme unit conducts blood donation camps, environmental drives, village digitization programs, and awareness campaigns across Tamil Nadu.', memberCount: 420, coordinator: 'Prof. Ramesh Babu', meetingSchedule: 'Monday, 4:00 PM', isMember: false, achievements: ['Best NSS Unit Award – State Level', '5000+ Hours Community Service'], upcomingEvent: { title: 'Tree Plantation Drive 2026', date: '2026-08-15' }, logo: 'NSS', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400' },
];

export const StudentClubs: React.FC = () => {
  const [clubs, setClubs] = useState<Club[]>(CLUBS);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [membershipFilter, setMembershipFilter] = useState<'ALL' | 'JOINED'>('ALL');

  const handleJoin = (id: string) => {
    setClubs(prev => prev.map(c => c.id === id ? { ...c, isMember: true, memberCount: c.memberCount + 1 } : c));
    const club = clubs.find(c => c.id === id);
    toast.success(`Successfully joined ${club?.name}! Welcome aboard.`);
  };

  const handleLeave = (id: string) => {
    setClubs(prev => prev.map(c => c.id === id ? { ...c, isMember: false, memberCount: c.memberCount - 1 } : c));
    const club = clubs.find(c => c.id === id);
    toast.success(`Left ${club?.name}.`);
  };

  const categories = ['ALL', 'Technical', 'Professional', 'Cultural', 'Social'];
  const filtered = clubs.filter(c => {
    const matchCat = categoryFilter === 'ALL' || c.category === categoryFilter;
    const matchMembership = membershipFilter === 'ALL' || c.isMember;
    return matchCat && matchMembership;
  });

  const joinedClubs = clubs.filter(c => c.isMember);

  return (
    <div className="space-y-6 text-left pb-12 animate-in fade-in duration-200">
      <div>
        <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
          <Compass className="h-5 w-5 text-indigo-600" /> Campus Clubs & Societies
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Technical, cultural, and professional clubs — explore and join</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Clubs', value: clubs.length },
          { label: 'My Memberships', value: joinedClubs.length },
          { label: 'Total Campus Members', value: clubs.reduce((a, c) => a + c.memberCount, 0).toLocaleString() },
          { label: 'Upcoming Events', value: clubs.filter(c => c.upcomingEvent).length },
        ].map((s, idx) => (
          <div key={idx} className="border bg-card p-4 rounded-2xl shadow-sm text-center">
            <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">{s.label}</p>
            <p className="text-xl font-black text-slate-800 dark:text-white mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* My Memberships banner */}
      {joinedClubs.length > 0 && (
        <div className="border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl">
          <p className="text-[10px] uppercase font-black text-indigo-600 tracking-wider mb-2">Active Memberships</p>
          <div className="flex flex-wrap gap-2">
            {joinedClubs.map(c => (
              <span key={c.id} className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-700 rounded-full text-xs font-bold text-indigo-700 dark:text-indigo-300">
                <CheckCircle className="h-3 w-3" />{c.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-center">
        <div className="flex gap-2 flex-wrap flex-1">
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-[10px] font-black rounded-xl border transition-colors ${categoryFilter === cat ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-card hover:bg-muted'}`}>
              {cat === 'ALL' ? 'All Clubs' : cat}
            </button>
          ))}
        </div>
        <button onClick={() => setMembershipFilter(v => v === 'ALL' ? 'JOINED' : 'ALL')}
          className={`px-3 py-1.5 text-[10px] font-black rounded-xl border transition-colors ${membershipFilter === 'JOINED' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-card hover:bg-muted'}`}>
          {membershipFilter === 'JOINED' ? '✓ My Clubs Only' : 'My Clubs Only'}
        </button>
      </div>

      {/* Clubs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(club => (
          <div key={club.id} className={`border bg-card rounded-2xl shadow-sm p-5 space-y-4 hover:shadow-md transition-all flex flex-col ${club.isMember ? 'border-indigo-200 dark:border-indigo-800' : ''}`}>
            <div className="flex items-start justify-between">
              <div className={`px-3 py-2 rounded-xl font-black text-sm ${club.color}`}>{club.logo}</div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[8.5px] font-black uppercase px-2 py-0.5 rounded bg-muted text-slate-500">{club.category}</span>
                {club.isMember && <span className="text-[8.5px] font-black text-emerald-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Joined</span>}
              </div>
            </div>

            <div className="flex-1 space-y-1.5">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-white leading-tight">{club.name}</h3>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed line-clamp-3">{club.description}</p>
            </div>

            <div className="space-y-1.5 text-[10px] font-bold text-slate-500">
              <div className="flex items-center gap-1.5"><Users className="h-3 w-3" />{club.memberCount} members</div>
              <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" />{club.meetingSchedule}</div>
              <div className="flex items-center gap-1.5"><Mail className="h-3 w-3" />Coord: {club.coordinator}</div>
            </div>

            {club.upcomingEvent && (
              <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-[10px]">
                <p className="font-extrabold text-amber-700 dark:text-amber-400">🗓 {club.upcomingEvent.title}</p>
                <p className="text-amber-600 dark:text-amber-500 font-bold">{new Date(club.upcomingEvent.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            )}

            {club.achievements.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {club.achievements.map((a, idx) => (
                  <span key={idx} className="bg-muted text-slate-500 text-[8.5px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Trophy className="h-2.5 w-2.5 text-amber-500" />{a}
                  </span>
                ))}
              </div>
            )}

            <button
              onClick={() => club.isMember ? handleLeave(club.id) : handleJoin(club.id)}
              className={`w-full py-2 text-xs font-black rounded-xl transition-colors ${
                club.isMember
                  ? 'border border-rose-200 dark:border-rose-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}>
              {club.isMember ? 'Leave Club' : 'Join Club'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentClubs;
