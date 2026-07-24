import React, { useState, useEffect } from 'react';
import { Sparkles, Trophy, Award, Flame, Gift, CheckCircle, Zap, Shield, Star, RefreshCw } from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';
import api from '../../lib/axios';

export const StudentGamification: React.FC = () => {
  const [profile, setProfile] = useState<any | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'leaderboard' | 'store'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchGamificationData();
  }, []);

  const fetchGamificationData = async () => {
    try {
      setIsLoading(true);
      const [profRes, leadRes, storeRes] = await Promise.all([
        api.get('/enterprise/gamification/profile'),
        api.get('/enterprise/gamification/leaderboard'),
        api.get('/enterprise/gamification/rewards'),
      ]);

      if (profRes.data?.status === 'success') setProfile(profRes.data.data);
      if (leadRes.data?.status === 'success') setLeaderboard(leadRes.data.data);
      if (storeRes.data?.status === 'success') setRewards(storeRes.data.data);
    } catch {
      toast.error('Failed to sync gamification stats');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedeem = async (rewardId: string) => {
    try {
      const res = await api.post('/enterprise/gamification/redeem', { rewardId });
      if (res.data?.status === 'success') {
        const { redemptionCode, remainingXp } = res.data.data;
        toast.success(`Redeemed! Code: ${redemptionCode}`);
        setProfile((prev: any) => ({ ...prev, xp: remainingXp }));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Redemption failed');
    }
  };

  if (isLoading) return <Loading text="Loading Gamification & Rewards..." />;

  return (
    <div className="space-y-6 text-left pb-16 animate-in fade-in duration-200">
      {/* Banner Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 bg-card border p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-amber-500" /> Student Achievement & Gamification Arena
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Earn XP for attendance, assignment submission streaks, and quiz masteries to unlock exclusive campus perks
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Experience (XP)', value: `${profile?.xp || 0} XP`, icon: <Zap className="h-4 w-4 text-amber-500" /> },
          { label: 'Academic Level', value: `Level ${profile?.level || 1}`, icon: <Shield className="h-4 w-4 text-indigo-500" /> },
          { label: 'Attendance Streak', value: `${profile?.attendanceStreak || 0} Days`, icon: <Flame className="h-4 w-4 text-rose-500" /> },
          { label: 'Assignment Streak', value: `${profile?.assignmentStreak || 0} Tasks`, icon: <CheckCircle className="h-4 w-4 text-emerald-500" /> },
        ].map((c, idx) => (
          <div key={idx} className="border bg-card p-4 rounded-2xl shadow-sm flex items-center gap-3">
            <div className="p-2 rounded-xl bg-muted/40">{c.icon}</div>
            <div>
              <span className="text-[9px] uppercase font-black tracking-wider text-slate-400 block">{c.label}</span>
              <span className="text-sm font-black text-slate-800 dark:text-white mt-0.5 block">{c.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Nav Tabs */}
      <div className="flex border-b text-xs font-bold gap-1">
        {[
          { id: 'overview', label: 'My Achievements & Streaks' },
          { id: 'leaderboard', label: 'Campus Leaderboard' },
          { id: 'store', label: 'XP Reward Store' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-amber-500 text-amber-600 font-extrabold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Unlocked Honor Badges</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { title: 'Attendance Champion', desc: 'Maintained >95% attendance for 30 days', icon: '🏆', unlocked: true },
                { title: 'Quiz Master', desc: 'Scored top marks in 5 consecutive quizzes', icon: '⚡', unlocked: true },
                { title: 'Code Ninja', desc: 'Submitted all coding assignments before deadline', icon: '🥷', unlocked: true },
                { title: 'Library Scholar', desc: 'Read over 10 digital library volumes', icon: '📚', unlocked: false },
              ].map((b, idx) => (
                <div
                  key={idx}
                  className={`border p-4 rounded-xl space-y-2 text-center transition-all ${
                    b.unlocked
                      ? 'bg-card border-indigo-200 dark:border-indigo-800/60 shadow-sm'
                      : 'bg-muted/20 opacity-50 border-dashed'
                  }`}
                >
                  <span className="text-2xl block">{b.icon}</span>
                  <p className="text-xs font-extrabold text-slate-800 dark:text-white">{b.title}</p>
                  <p className="text-[9px] text-muted-foreground font-medium">{b.desc}</p>
                  <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded inline-block ${
                    b.unlocked ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {b.unlocked ? 'UNLOCKED' : 'LOCKED'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div className="border bg-card rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-xs font-semibold border-collapse">
            <thead>
              <tr className="border-b bg-muted/20 text-[9px] uppercase font-black text-slate-400 tracking-wider">
                <th className="p-4 text-center">Rank</th>
                <th className="p-4 text-left">Student</th>
                <th className="p-4 text-left">Department</th>
                <th className="p-4 text-center">Level</th>
                <th className="p-4 text-right">XP Points</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {leaderboard.map((row) => (
                <tr key={row.rank} className={`hover:bg-muted/10 transition-colors ${row.rank <= 3 ? 'bg-amber-50/30 dark:bg-amber-900/10 font-bold' : ''}`}>
                  <td className="p-4 text-center">
                    {row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : `#${row.rank}`}
                  </td>
                  <td className="p-4 font-extrabold text-slate-800 dark:text-white">{row.studentName}</td>
                  <td className="p-4 text-slate-500">{row.department}</td>
                  <td className="p-4 text-center font-bold text-indigo-600">Level {row.level}</td>
                  <td className="p-4 text-right font-black text-amber-600">{row.xp} XP</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'store' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rewards.map((item) => (
            <div key={item.id} className="border bg-card p-5 rounded-2xl shadow-sm space-y-3 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[8.5px] font-black uppercase bg-amber-50 text-amber-700 px-2 py-0.5 rounded">
                  {item.category}
                </span>
                <h4 className="font-extrabold text-xs text-slate-800 dark:text-white">{item.title}</h4>
                <p className="text-[10px] text-muted-foreground font-medium">{item.description}</p>
                <span className="text-xs font-black text-amber-600 block mt-1">{item.xpCost} XP</span>
              </div>
              <button
                onClick={() => handleRedeem(item.id)}
                disabled={(profile?.xp || 0) < item.xpCost}
                className="px-4 py-2 bg-amber-500 text-white font-extrabold text-xs rounded-xl hover:bg-amber-600 disabled:opacity-40 shrink-0"
              >
                Redeem
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentGamification;
