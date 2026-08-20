import React, { useState, useEffect } from "react";
import {
  TrendingUp, Award, Clock, AlertTriangle, ArrowRight, User, Shield,
  ChevronRight, Sparkles, CheckCircle2, Star, Info, FileText, BarChart2,
  Cpu, Globe, GitBranch, Check, Play, MessageSquare, AlertCircle,
  Bookmark, Download, X
} from "lucide-react";
import { toast } from "../../components/ui/Toast";
import { Loading } from "../../components/ui/Loading";
import api from "../../lib/axios";

interface AlumniMentor {
  name: string;
  role: string;
  company: string;
  batch: string;
  avatar: string;
}

const ALUMNI_MENTORS: AlumniMentor[] = [
  { name: "Aravind Swaminathan", role: "Staff Engineer", company: "Google India", batch: "Class of 2021", avatar: "AS" },
  { name: "Megha Sharma", role: "Product Manager", company: "Microsoft", batch: "Class of 2022", avatar: "MS" },
  { name: "Rohan Gupta", role: "Security Analyst", company: "AWS", batch: "Class of 2020", avatar: "RG" },
];

export const StudentCareerDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [interviewStatus, setInterviewStatus] = useState<"idle" | "started" | "feedback">("idle");
  const [interviewRole, setInterviewRole] = useState("SDE");
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [mockScore, setMockScore] = useState(88);

  const [codingStats, setCodingStats] = useState({
    solved: 342,
    easy: 120,
    medium: 180,
    hard: 42,
    rank: "Top 4.2%",
  });

  const [offer, setOffer] = useState<any>({
    company: "Zoho Corporation",
    role: "Member Technical Staff",
    ctc: "8.5 LPA",
    base: "7.2 LPA",
    joining: "July 2026",
    status: "PENDING",
  });

  const interviewQuestions = [
    { q: "Explain how a Hash Map handles collision resolution in Java/C++.", role: "SDE" },
    { q: "What is the difference between synchronous and asynchronous event handling in modern JS engines?", role: "Frontend" },
    { q: "Describe a scenario where you would choose NoSQL over a Relational SQL Database.", role: "SDE" },
  ];

  const handleStartInterview = () => {
    setInterviewStatus("started");
    setCurrentQuestionIdx(0);
    setUserAnswer("");
  };

  const handleNextQuestion = () => {
    if (!userAnswer.trim()) {
      toast.error("Please enter your answer before proceeding.");
      return;
    }
    if (currentQuestionIdx + 1 < interviewQuestions.length) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setUserAnswer("");
    } else {
      setInterviewStatus("feedback");
      setMockScore(92);
      toast.success("AI interview assessment completed!");
    }
  };

  const handleAcceptOffer = () => {
    setOffer((prev: any) => ({ ...prev, status: "ACCEPTED" }));
    toast.success("Offer letter accepted! Pre-joining checklist unlocked.");
  };

  const handleDeclineOffer = () => {
    setOffer((prev: any) => ({ ...prev, status: "DECLINED" }));
    toast.error("Offer letter declined.");
  };

  if (isLoading) return <Loading text="Syncing Career parameters..." />;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto text-left pb-28 animate-in fade-in duration-200">
      
      {/* Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-5 sm:p-7 shadow-xs">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Career & Employability Readiness</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2.5">
              <TrendingUp className="h-7 w-7 text-primary" /> Career Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Track coding metrics, simulate AI mock interviews, connect with alumni mentors, and review official job offers.
            </p>
          </div>
        </div>
      </section>

      {/* KPI Cards Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            label: "Employability Index",
            value: "94 / 100",
            sub: "Tier-1 Placement Eligibility",
            icon: Sparkles,
            tone: "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
          },
          {
            label: "Problems Solved",
            value: `${codingStats.solved}`,
            sub: `${codingStats.rank} global ranking`,
            icon: GitBranch,
            tone: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
          },
          {
            label: "Mock Interview Score",
            value: `${mockScore}%`,
            sub: "Communication: Excellent",
            icon: Cpu,
            tone: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
          },
          {
            label: "Offer Letters",
            value: offer.status === "ACCEPTED" ? "1 Accepted" : "1 Received",
            sub: `Package: ${offer.ctc}`,
            icon: Award,
            tone: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
          },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between gap-3 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-muted-foreground">
                  {card.label}
                </span>
                <div className={`p-2 rounded-xl border ${card.tone}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-black text-foreground block tracking-tight">
                  {card.value}
                </span>
                <span className="text-[10px] sm:text-xs text-muted-foreground font-semibold block mt-0.5 truncate">
                  {card.sub}
                </span>
              </div>
            </div>
          );
        })}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Mock Interviews & Coding Profile */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* AI Mock Interview Arena */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h3 className="text-xs font-black uppercase text-foreground tracking-wider flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" /> AI Mock Interview Board
              </h3>
              {interviewStatus === "idle" && (
                <select
                  value={interviewRole}
                  onChange={(e) => setInterviewRole(e.target.value)}
                  className="text-xs font-bold px-3 py-1.5 border border-border rounded-xl bg-background outline-none text-foreground cursor-pointer"
                >
                  <option value="SDE">Software Engineer (SDE)</option>
                  <option value="Frontend">Frontend Specialist</option>
                  <option value="DataScience">Data Scientist</option>
                </select>
              )}
            </div>

            {interviewStatus === "idle" && (
              <div className="text-left space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Simulate interactive technical and HR interview rounds with real-time AI evaluation and feedback.
                </p>
                <button
                  onClick={handleStartInterview}
                  className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Play className="h-4 w-4" /> Start AI Mock Session
                </button>
              </div>
            )}

            {interviewStatus === "started" && (
              <div className="p-4 border border-border bg-background rounded-2xl space-y-3.5 text-xs">
                <div className="flex justify-between font-black text-primary">
                  <span>Question {currentQuestionIdx + 1} of {interviewQuestions.length}</span>
                  <span>Target Role: {interviewRole}</span>
                </div>
                <p className="text-foreground font-black text-sm leading-normal">
                  {interviewQuestions[currentQuestionIdx].q}
                </p>
                <textarea
                  placeholder="Type your explanation or pseudocode here..."
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2.5 border border-border bg-card rounded-xl outline-none text-foreground resize-none placeholder:text-muted-foreground focus:border-primary"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleNextQuestion}
                    className="px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    Submit & Continue
                  </button>
                </div>
              </div>
            )}

            {interviewStatus === "feedback" && (
              <div className="p-4 border border-primary/20 bg-primary/5 rounded-2xl space-y-3 text-xs">
                <h4 className="font-black text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> AI Evaluation Feedback Summary
                </h4>
                <div className="space-y-2 leading-relaxed text-muted-foreground font-medium">
                  <p>✓ Excellent core data structure knowledge. Complexity calculations were correct.</p>
                  <p>✓ Pace and clarity: 135 wpm (Stable). Technical confidence index: High (94%).</p>
                  <p>• Recommendation: Add practical concurrency and deadlock resolution examples.</p>
                </div>
                <button
                  onClick={() => setInterviewStatus("idle")}
                  className="px-4 py-2 border border-border bg-card hover:bg-muted text-foreground font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Start New Session
                </button>
              </div>
            )}
          </div>

          {/* Coding Profile Integrations */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4 text-left">
            <h3 className="text-xs font-black uppercase text-foreground tracking-wider flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-primary" /> Coding Activity Sync (GitHub & LeetCode)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-border bg-background rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-foreground">LeetCode Profile</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    Connected
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
                  <div className="p-2.5 bg-card border border-border rounded-xl">
                    <span className="text-[8px] uppercase text-muted-foreground block">Easy</span>
                    <span className="text-foreground text-sm font-black mt-0.5 block">{codingStats.easy}</span>
                  </div>
                  <div className="p-2.5 bg-card border border-border rounded-xl">
                    <span className="text-[8px] uppercase text-muted-foreground block">Medium</span>
                    <span className="text-foreground text-sm font-black mt-0.5 block">{codingStats.medium}</span>
                  </div>
                  <div className="p-2.5 bg-card border border-border rounded-xl">
                    <span className="text-[8px] uppercase text-muted-foreground block">Hard</span>
                    <span className="text-foreground text-sm font-black mt-0.5 block">{codingStats.hard}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 border border-border bg-background rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-foreground">GitHub Contributions</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    Connected
                  </span>
                </div>
                <div className="h-10 flex gap-1 items-end justify-between border-b border-border pb-1">
                  {[2, 5, 8, 4, 12, 18, 5, 14, 22, 10, 8, 16, 25, 4, 18].map((c, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-emerald-500/80 hover:bg-emerald-500 rounded-xs transition-colors"
                      style={{ height: `${c * 1.5}px` }}
                      title={`${c} commits`}
                    />
                  ))}
                </div>
                <span className="text-[9px] text-muted-foreground block text-right font-medium">
                  Recent 15 days contribution activity
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Offer Management & Alumni Mentorship */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Offer Letter Board */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase text-foreground tracking-wider flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" /> Offer Letter Locker
            </h3>

            <div className="p-4 border border-border bg-background rounded-2xl space-y-3.5 text-xs font-semibold">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-black text-foreground text-sm">{offer.company}</h4>
                  <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">{offer.role}</p>
                </div>
                <span
                  className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                    offer.status === "ACCEPTED"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      : offer.status === "PENDING"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                        : "bg-muted text-muted-foreground border-transparent"
                  }`}
                >
                  {offer.status}
                </span>
              </div>

              <div className="space-y-1.5 border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground font-semibold">
                <div className="flex justify-between">
                  <span>CTC Package</span>
                  <b className="text-foreground">{offer.ctc}</b>
                </div>
                <div className="flex justify-between">
                  <span>Base Compensation</span>
                  <b className="text-foreground">{offer.base}</b>
                </div>
                <div className="flex justify-between">
                  <span>Target Joining</span>
                  <b className="text-foreground">{offer.joining}</b>
                </div>
              </div>

              {offer.status === "PENDING" && (
                <div className="flex gap-2 pt-2 border-t border-border">
                  <button
                    onClick={handleDeclineOffer}
                    className="flex-1 py-2 border border-border hover:bg-muted rounded-xl text-muted-foreground font-bold transition-colors cursor-pointer"
                  >
                    Decline
                  </button>
                  <button
                    onClick={handleAcceptOffer}
                    className="flex-1 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    Accept Offer
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Alumni Mentor Connections */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4 text-left">
            <h3 className="text-xs font-black uppercase text-foreground tracking-wider flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> Alumni Mentor Network
            </h3>

            <div className="space-y-2.5">
              {ALUMNI_MENTORS.map((mentor, idx) => (
                <div
                  key={idx}
                  className="p-3 border border-border bg-background rounded-2xl flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-primary/10 text-primary border border-primary/20 rounded-full flex items-center justify-center font-black">
                      {mentor.avatar}
                    </div>
                    <div>
                      <h5 className="font-bold text-foreground">{mentor.name}</h5>
                      <p className="text-[10px] text-muted-foreground font-medium">
                        {mentor.role} • {mentor.company}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => toast.success(`Mentorship connection requested for ${mentor.name}.`)}
                    className="p-2 hover:bg-muted border border-border rounded-xl text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="Send Message"
                  >
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
