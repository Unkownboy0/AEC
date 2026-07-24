import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Award, Clock, AlertTriangle, ArrowRight, User, Shield, ChevronRight,
  Sparkles, CheckCircle2, Star, Info, FileText, BarChart2, Cpu, Globe, GitBranch,
  Github, Check, Play, MessageSquare, AlertCircle, Bookmark, Download, X
} from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';
import api from '../../lib/axios';

interface AlumniMentor {
  name: string;
  role: string;
  company: string;
  batch: string;
  avatar: string;
}

const ALUMNI_MENTORS: AlumniMentor[] = [
  { name: 'Aravind Swaminathan', role: 'Staff Engineer', company: 'Google India', batch: 'Class of 2021', avatar: 'AS' },
  { name: 'Megha Sharma', role: 'Product Manager', company: 'Microsoft', batch: 'Class of 2022', avatar: 'MS' },
  { name: 'Rohan Gupta', role: 'Security Analyst', company: 'AWS', batch: 'Class of 2020', avatar: 'RG' }
];

export const StudentCareerDashboard: React.FC = () => {
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock Interview State
  const [interviewRole, setInterviewRole] = useState('SDE');
  const [interviewStatus, setInterviewStatus] = useState<'idle' | 'started' | 'feedback'>('idle');
  const [mockScore, setMockScore] = useState(88);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');

  const interviewQuestions = [
    { q: 'What is the time complexity of building a heap from an unsorted array?', ans: 'O(N)' },
    { q: 'Explain the difference between optimistic and pessimistic locking in database transaction isolation.', ans: 'Optimistic locking checks for conflict before commit, pessimistic locks records immediately.' },
    { q: 'Why is Git rebasing preferred over merging in large collaborate workflows?', ans: 'It maintains a clean linear commit history.' }
  ];

  // LeetCode Stats
  const [codingStats, setCodingStats] = useState({
    solved: 345,
    easy: 120,
    medium: 180,
    hard: 45,
    rank: 'Top 12%'
  });

  // Offer Letter Management
  const [offer, setOffer] = useState<any>({
    company: 'Google India',
    role: 'Associate Software Engineer',
    ctc: '32.5 LPA',
    base: '₹18,00,000',
    joining: '2026-08-01',
    status: 'PENDING'
  });

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await api.get('/enterprise/students');
        if (res.data?.status === 'success' && res.data.data?.length > 0) {
          setStudentInfo(res.data.data[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInfo();
  }, []);

  const handleStartInterview = () => {
    setInterviewStatus('started');
    setCurrentQuestionIdx(0);
    setUserAnswer('');
    toast.success('AI Mock Interview started! Type answers.');
  };

  const handleNextQuestion = () => {
    if (currentQuestionIdx < interviewQuestions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
      setUserAnswer('');
    } else {
      setInterviewStatus('feedback');
      toast.success('Mock Interview completed! AI assessment loaded.');
    }
  };

  const handleAcceptOffer = () => {
    setOffer((prev: any) => ({ ...prev, status: 'ACCEPTED' }));
    toast.success('Offer letter accepted! Pre-joining checklist unlocked.');
  };

  const handleDeclineOffer = () => {
    setOffer((prev: any) => ({ ...prev, status: 'DECLINED' }));
    toast.error('Offer letter declined.');
  };

  if (isLoading) return <Loading text="Syncing Career parameters..." />;

  return (
    <div className="dark bg-slate-950 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-6 text-left pb-12 animate-in fade-in duration-200">
      
      {/* Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-black tracking-wider text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded flex items-center gap-1">
              <Sparkles className="h-3 w-3 animate-pulse" /> Employability Analytics
            </span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1.5 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-indigo-500" /> Career & Readiness Center
          </h1>
          <p className="text-xs text-slate-400">Track coding metrics, mock interview history, alumni network, and job offers</p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Employability Index', value: '94 / 100', sub: 'High Probability Class Tier', icon: <Sparkles className="h-4 w-4 text-cyan-400" /> },
          { label: 'LeetCode Solved', value: `${codingStats.solved} Problems`, sub: `${codingStats.rank} global rank`, icon: <Github className="h-4 w-4 text-emerald-400" /> },
          { label: 'Mock Interview Grade', value: `${mockScore}%`, sub: 'Communication: Excellent', icon: <Cpu className="h-4 w-4 text-indigo-400" /> },
          { label: 'Offers Mapped', value: offer.status === 'ACCEPTED' ? '1 Accepted' : '1 Offer Received', sub: 'CTC: 32.5 LPA', icon: <Award className="h-4 w-4 text-amber-400" /> }
        ].map((card, idx) => (
          <div key={idx} className="border border-slate-800 bg-slate-900/50 p-4 rounded-xl shadow-md flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[9px] uppercase font-black tracking-wider text-slate-400 block">{card.label}</span>
              <span className="text-lg font-black text-white block">{card.value}</span>
              <span className="text-[9px] text-slate-500 font-bold block">{card.sub}</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-800 border border-slate-700/60">
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Mock Interviews & Coding Profile */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* AI Mock Interview Arena */}
          <div className="border border-slate-800 bg-slate-900/40 p-5 rounded-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <Cpu className="h-4 w-4 text-indigo-400" /> AI Mock Interview Board
              </h3>
              {interviewStatus === 'idle' && (
                <select
                  value={interviewRole}
                  onChange={e => setInterviewRole(e.target.value)}
                  className="text-xs font-semibold px-2 py-1 border border-slate-800 rounded bg-slate-950 outline-none text-slate-300"
                >
                  <option value="SDE">Software Engineer (SDE)</option>
                  <option value="Frontend">Frontend Specialist</option>
                  <option value="DataScience">Data Scientist</option>
                </select>
              )}
            </div>

            {interviewStatus === 'idle' && (
              <div className="text-left space-y-3">
                <p className="text-xs text-slate-400">
                  Simulate interactive technical/HR interview boards with automated evaluation algorithms.
                </p>
                <button
                  onClick={handleStartInterview}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-slate-950 text-xs font-black rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Play className="h-4 w-4" /> Start AI Mock Session
                </button>
              </div>
            )}

            {interviewStatus === 'started' && (
              <div className="p-4 border border-slate-800 bg-slate-950 rounded-xl space-y-3.5 text-xs">
                <div className="flex justify-between font-black text-indigo-400">
                  <span>Question {currentQuestionIdx + 1} of {interviewQuestions.length}</span>
                  <span>Target: {interviewRole}</span>
                </div>
                <p className="text-slate-200 font-extrabold text-sm leading-normal">
                  {interviewQuestions[currentQuestionIdx].q}
                </p>
                <textarea
                  placeholder="Type your explanation answer here..."
                  value={userAnswer}
                  onChange={e => setUserAnswer(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-800 bg-slate-900 rounded-lg outline-none text-slate-200 resize-none placeholder:text-slate-800"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleNextQuestion}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-slate-950 font-black rounded-lg transition-colors"
                  >
                    Submit & Continue
                  </button>
                </div>
              </div>
            )}

            {interviewStatus === 'feedback' && (
              <div className="p-4 border border-indigo-950 bg-indigo-950/20 rounded-xl space-y-3 text-xs">
                <h4 className="font-extrabold text-white flex items-center gap-1"><Sparkles className="h-4 w-4 text-cyan-400" /> AI Feedback Summary</h4>
                <div className="space-y-2 leading-relaxed text-slate-300 font-semibold">
                  <p>✓ Excellent core data structure knowledge. Solved complexity calculations correctly.</p>
                  <p>✓ Speech rate: 135 wpm (Stable). Emotion index: Confidence high (94%).</p>
                  <p>• Recommendation: Clarify transaction locks with specific examples like database deadlocks.</p>
                </div>
                <button
                  onClick={() => setInterviewStatus('idle')}
                  className="px-3.5 py-1.5 border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 font-black rounded-lg transition-colors"
                >
                  Configure New Session
                </button>
              </div>
            )}
          </div>

          {/* Coding Profile Integrations */}
          <div className="border border-slate-800 bg-slate-900/40 p-5 rounded-xl space-y-4 text-left">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
              Automatic Coding Profile Sync (GitHub & LeetCode)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-slate-800 bg-slate-950 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-slate-200">LeetCode Profile</span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-900/30 px-2 py-0.5 rounded">Connected</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
                  <div className="p-2 bg-slate-900 rounded">
                    <span className="text-[8px] uppercase text-slate-500 block">Easy</span>
                    <span className="text-slate-200">{codingStats.easy}</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded">
                    <span className="text-[8px] uppercase text-slate-500 block">Medium</span>
                    <span className="text-slate-200">{codingStats.medium}</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded">
                    <span className="text-[8px] uppercase text-slate-500 block">Hard</span>
                    <span className="text-slate-200">{codingStats.hard}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 border border-slate-800 bg-slate-950 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-slate-200">GitHub Contributions</span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-900/30 px-2 py-0.5 rounded">Connected</span>
                </div>
                <div className="h-10 flex gap-0.5 items-end justify-between border-b pb-1">
                  {[2, 5, 8, 4, 12, 18, 5, 14, 22, 10, 8, 16, 25, 4, 18].map((c, i) => (
                    <div key={i} className="flex-1 bg-emerald-600 rounded-xs hover:bg-emerald-500 cursor-pointer" style={{ height: `${c * 1.5}px` }} title={`${c} commits`}></div>
                  ))}
                </div>
                <span className="text-[8px] text-slate-500 block text-right font-bold">Latest 15 days contribution activity</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Offer Management & Alumni Mentorship */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Offer Letter Board */}
          <div className="border border-slate-800 bg-slate-900/40 p-5 rounded-xl space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
              Offer Letter Locker
            </h3>

            <div className="p-4 border border-slate-800 bg-slate-950 rounded-xl space-y-3.5 text-xs font-semibold">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-extrabold text-white text-[13px]">{offer.company}</h4>
                  <p className="text-[10.5px] text-slate-400 font-bold mt-0.5">{offer.role}</p>
                </div>
                <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded ${
                  offer.status === 'ACCEPTED' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40' :
                  offer.status === 'PENDING' ? 'bg-amber-950/40 text-amber-400 border border-amber-800/40' :
                  'bg-slate-900 text-slate-500'
                }`}>
                  {offer.status}
                </span>
              </div>

              <div className="space-y-1.5 border-t border-slate-850 pt-3 text-[11px] leading-relaxed text-slate-400 font-bold">
                <div className="flex justify-between">
                  <span>CTC Package</span>
                  <span className="text-slate-200">{offer.ctc}</span>
                </div>
                <div className="flex justify-between">
                  <span>Base Compensation</span>
                  <span className="text-slate-200">{offer.base}</span>
                </div>
                <div className="flex justify-between">
                  <span>Target Joining</span>
                  <span className="text-slate-200">{offer.joining}</span>
                </div>
              </div>

              {offer.status === 'PENDING' && (
                <div className="flex gap-2 pt-1 border-t border-slate-850">
                  <button onClick={handleDeclineOffer} className="flex-1 py-2 border border-slate-800 hover:bg-slate-900 rounded-lg text-slate-400 font-extrabold transition-colors">
                    Decline
                  </button>
                  <button onClick={handleAcceptOffer} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-slate-950 rounded-lg font-black transition-colors">
                    Accept Offer
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Alumni Mentor Connections */}
          <div className="border border-slate-800 bg-slate-900/40 p-5 rounded-xl space-y-4 text-left">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
              Alumni Mentor Network
            </h3>

            <div className="space-y-3">
              {ALUMNI_MENTORS.map((mentor, idx) => (
                <div key={idx} className="p-3 border border-slate-800 bg-slate-950 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-indigo-950 text-indigo-400 rounded-full flex items-center justify-center font-black">
                      {mentor.avatar}
                    </div>
                    <div>
                      <h5 className="font-extrabold text-slate-200">{mentor.name}</h5>
                      <p className="text-[10px] text-slate-500 font-bold">{mentor.role} · {mentor.company}</p>
                    </div>
                  </div>
                  <button onClick={() => toast.success(`Mentorship invitation sent to ${mentor.name}.`)} className="p-1.5 hover:bg-slate-900 border border-slate-800 rounded-lg text-slate-400 transition-colors">
                    <MessageSquare className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentCareerDashboard;
