import React, { useState, useEffect } from 'react';
import {
  Briefcase, Search, Filter, Download, Star, Info, FileText, BarChart2,
  CheckCircle, Clock, AlertTriangle, ArrowRight, User, Shield, ChevronRight,
  TrendingUp, Award, MapPin, Building2, Calendar, FileDown, Eye, CheckCircle2,
  HelpCircle, Sparkles, X, Plus, Upload, Trash2, Globe, Check, AlertCircle
} from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';
import api from '../../lib/axios';

export const StudentPlacements: React.FC = () => {
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [drives, setDrives] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    activeDrives: 0,
    eligibleDrives: 0,
    applied: 0,
    selected: 0,
    highestLpa: 0,
    avgLpa: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [packageFilter, setPackageFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [onlyEligible, setOnlyEligible] = useState(false);
  const [selectedDrive, setSelectedDrive] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'tracker'>('overview');

  // Documents / Resumes
  const [resumes, setResumes] = useState<string[]>([
    'Software_Engineer_Resume_v2.pdf',
    'FullStack_Developer_Resume.pdf'
  ]);
  const [newResumeName, setNewResumeName] = useState('');

  const fetchPlacementsData = async () => {
    try {
      const studentRes = await api.get('/enterprise/placements/student-portal');
      if (studentRes.data?.status === 'success' && studentRes.data.data?.student) {
        const { student, drives: rawDrives } = studentRes.data.data;
        setStudentInfo(student);
          
        // Calculate student eligibility & stats
        const studentCgpa = student.cgpa || 0;
        const studentBacklogs = student.backlogs || 0;
        const studentDept = student.department?.code || '';

        const enriched = (rawDrives || []).map((d: any) => {
          const depts = d.eligibilityDept ? d.eligibilityDept.split(',') : [];
          const isDeptEligible = depts.length === 0 || depts.includes(studentDept);
          const isCgpaEligible = studentCgpa >= (d.eligibilityCgpa || 0);
          const isArrearsEligible = studentBacklogs <= (d.maxArrears ?? 99);
          const eligible = isDeptEligible && isCgpaEligible && isArrearsEligible;

          const myApp = d.applications?.find((app: any) => app.studentId === student.id);

          return {
            ...d,
            eligible,
            myApp
          };
        });

        setDrives(enriched);

        const appliedList = enriched.filter((d: any) => !!d.myApp);
        const selectedList = enriched.filter((d: any) => d.myApp?.status === 'SELECTED' || d.myApp?.status === 'PLACED');

        setStats({
          activeDrives: enriched.filter((d: any) => d.status === 'OPEN' || !d.status).length,
          eligibleDrives: enriched.filter((d: any) => d.eligible).length,
          applied: appliedList.length,
          selected: selectedList.length,
          highestLpa: enriched.length ? Math.max(...enriched.map((d: any) => d.package || 0)) : 0,
          avgLpa: enriched.length ? parseFloat((enriched.reduce((acc: number, d: any) => acc + (d.package || 0), 0) / enriched.length).toFixed(2)) : 0
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load placement registry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlacementsData();
  }, []);

  const handleRegister = async (driveId: string) => {
    if (!studentInfo) return;
    try {
      const res = await api.post('/enterprise/placements/student/apply', { driveId });
      if (res.data?.status === 'success') {
        toast.success('Registered successfully for recruitment drive!');
        await fetchPlacementsData();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to submit application.');
    }
  };

  const handleWithdraw = async (appId: string) => {
    if (!confirm('Are you sure you want to withdraw your application for this drive?')) return;
    try {
      const res = await api.post(`/enterprise/placements/student/applications/${appId}/withdraw`);
      if (res.data?.status === 'success') {
        toast.success('Application withdrawn successfully.');
        await fetchPlacementsData();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to withdraw application.');
    }
  };

  const handleAddResume = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResumeName.trim()) return;
    const cleanName = newResumeName.trim().endsWith('.pdf') ? newResumeName.trim() : `${newResumeName.trim()}.pdf`;
    setResumes(prev => [...prev, cleanName]);
    setNewResumeName('');
    toast.success('Resume profile registered.');
  };

  const handleDeleteResume = (index: number) => {
    setResumes(prev => prev.filter((_, i) => i !== index));
    toast.success('Resume deleted.');
  };

  const filteredDrives = drives.filter(d => {
    const matchesSearch = (d.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (d.role || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (d.industry || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPkg = packageFilter === 'ALL' ||
                       (packageFilter === 'tier1' && (d.package || 0) >= 15) ||
                       (packageFilter === 'tier2' && (d.package || 0) >= 7 && (d.package || 0) < 15) ||
                       (packageFilter === 'mass' && (d.package || 0) < 7);
    const matchesType = typeFilter === 'ALL' || (d.industry || '').toLowerCase().includes(typeFilter.toLowerCase());
    const matchesEligible = !onlyEligible || d.eligible;
    return matchesSearch && matchesPkg && matchesType && matchesEligible;
  });

  if (isLoading) return <Loading text="Loading placement opportunities..." />;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto text-left pb-28 animate-in fade-in duration-200">
      
      {/* Top Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-5 sm:p-7 shadow-xs">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Campus Recruitment & Career Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2.5">
              <Briefcase className="h-7 w-7 text-primary" /> Placement Opportunities
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Explore active recruitment drives, track eligibility status, submit registrations, and monitor your interview progress.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => toast.info('Placement analytics export downloaded.')}
              className="px-4 py-2.5 bg-card hover:bg-muted/80 text-foreground border border-border rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Download className="h-4 w-4 text-primary" /> Export Analytics
            </button>
          </div>
        </div>
      </section>

      {/* KPI Stats Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            label: 'Active Drives',
            value: `${stats.activeDrives} Open`,
            sub: 'Direct campus registrations',
            icon: Building2,
            tone: 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
          },
          {
            label: 'Eligible For You',
            value: `${stats.eligibleDrives} Companies`,
            sub: 'Matches CGPA & criteria',
            icon: Award,
            tone: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
          },
          {
            label: 'Applied Drives',
            value: `${stats.applied} Registered`,
            sub: 'Active application pipelines',
            icon: CheckCircle2,
            tone: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
          },
          {
            label: 'Highest CTC Offered',
            value: `${stats.highestLpa} LPA`,
            sub: `Average CTC: ${stats.avgLpa} LPA`,
            icon: TrendingUp,
            tone: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20'
          }
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

      {/* Main Content Layout: Drives List + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Placement Drives Directory (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Search & Multi-Filter Bar */}
          <div className="bg-card border border-border rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="flex flex-1 w-full items-center gap-2 border border-border px-3 py-2 rounded-xl bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  placeholder="Search company, job role, or industry..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="bg-transparent text-xs sm:text-sm outline-none w-full font-semibold text-foreground placeholder:text-muted-foreground"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="p-0.5 text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <select
                  value={packageFilter}
                  onChange={e => setPackageFilter(e.target.value)}
                  className="text-xs font-bold px-3 py-2 border border-border rounded-xl bg-background outline-none text-foreground cursor-pointer"
                >
                  <option value="ALL">All Package Tiers</option>
                  <option value="tier1">Tier 1 (15+ LPA)</option>
                  <option value="tier2">Tier 2 (7 - 15 LPA)</option>
                  <option value="mass">Standard (&lt; 7 LPA)</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  className="text-xs font-bold px-3 py-2 border border-border rounded-xl bg-background outline-none text-foreground cursor-pointer"
                >
                  <option value="ALL">All Sectors</option>
                  <option value="technology">Tech / IT</option>
                  <option value="core">Core Engineering</option>
                  <option value="finance">Finance / FinTech</option>
                  <option value="consulting">Consulting</option>
                </select>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border text-xs">
              <button
                onClick={() => setOnlyEligible(!onlyEligible)}
                className={`px-3 py-1 rounded-full font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                  onlyEligible
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-muted/80 text-muted-foreground hover:text-foreground border border-transparent'
                }`}
              >
                <CheckCircle className="h-3.5 w-3.5" />
                {onlyEligible ? 'Showing Eligible Drives Only' : 'Show Eligible Only'}
              </button>

              <span className="text-[11px] text-muted-foreground font-semibold">
                Showing <b className="text-foreground">{filteredDrives.length}</b> drive{filteredDrives.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          {/* Company Drive Cards */}
          <div className="space-y-3.5">
            {filteredDrives.length > 0 ? (
              filteredDrives.map((drive) => {
                const isApplied = !!drive.myApp;
                const appStatus = drive.myApp?.status || 'REGISTERED';

                return (
                  <div
                    key={drive.id}
                    className="bg-card border border-border rounded-2xl p-5 shadow-xs hover:border-primary/40 hover:shadow-md transition-all flex flex-col md:flex-row justify-between gap-5 relative overflow-hidden group"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-indigo-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="space-y-3 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] uppercase font-black tracking-wider text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
                          {drive.industry || 'Tech'}
                        </span>
                        {drive.eligible ? (
                          <span className="text-[10px] uppercase font-black tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="h-3 w-3" /> Eligible
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase font-black tracking-wider text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> Criteria Unmet
                          </span>
                        )}
                        {isApplied && (
                          <span className="text-[10px] uppercase font-black tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
                            Status: {appStatus}
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="text-base sm:text-lg font-black text-foreground truncate">{drive.company}</h3>
                        <p className="text-xs sm:text-sm font-bold text-muted-foreground mt-0.5">{drive.role}</p>
                        <p className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5 mt-1">
                          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>{drive.location || 'Campus Onsite'}</span>
                          <span>•</span>
                          <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>Drive Date: {drive.driveDate ? new Date(drive.driveDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'To Be Announced'}</span>
                        </p>
                      </div>

                      {/* Criteria Metric Badges */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border">
                        <div className="bg-muted/40 p-2 rounded-xl">
                          <span className="text-[9px] uppercase font-black text-muted-foreground block">CTC Package</span>
                          <span className="text-xs font-black text-amber-600 dark:text-amber-400 block mt-0.5">
                            {drive.package || 0} LPA
                          </span>
                        </div>
                        <div className="bg-muted/40 p-2 rounded-xl">
                          <span className="text-[9px] uppercase font-black text-muted-foreground block">Min CGPA</span>
                          <span className="text-xs font-bold text-foreground block mt-0.5">
                            {drive.eligibilityCgpa || 0} CGPA
                          </span>
                        </div>
                        <div className="bg-muted/40 p-2 rounded-xl">
                          <span className="text-[9px] uppercase font-black text-muted-foreground block">Max Arrears</span>
                          <span className="text-xs font-bold text-foreground block mt-0.5">
                            {drive.maxArrears ?? 0} Max
                          </span>
                        </div>
                        <div className="bg-muted/40 p-2 rounded-xl">
                          <span className="text-[9px] uppercase font-black text-muted-foreground block">Attendance</span>
                          <span className="text-xs font-bold text-foreground block mt-0.5">
                            {drive.minAttendance || 75}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-row md:flex-col justify-end gap-2 shrink-0 self-stretch md:self-center w-full md:w-40 pt-2 md:pt-0 border-t md:border-t-0 border-border">
                      <button
                        onClick={() => setSelectedDrive(drive)}
                        className="flex-1 md:flex-initial px-4 py-2.5 border border-border bg-card hover:bg-muted text-foreground text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5 text-primary" /> View Details
                      </button>

                      {isApplied ? (
                        <button
                          onClick={() => handleWithdraw(drive.myApp.id)}
                          className="flex-1 md:flex-initial px-4 py-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl hover:bg-rose-500/20 transition-colors cursor-pointer"
                        >
                          Withdraw
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRegister(drive.id)}
                          disabled={!drive.eligible}
                          className="flex-1 md:flex-initial px-4 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
                        >
                          Register Now
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16 border-2 border-dashed border-border rounded-3xl bg-card p-6 space-y-2">
                <Briefcase className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                <p className="text-sm font-bold text-foreground">No recruitment drives found</p>
                <p className="text-xs text-muted-foreground">Try adjusting your search terms or filter criteria.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Resume Profiles & Credentials Locker (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Resume Profiles Card */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase text-foreground tracking-wider flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Resume Profiles
            </h3>

            <div className="space-y-2">
              {resumes.map((resName, idx) => (
                <div
                  key={idx}
                  className="p-3 border border-border bg-background rounded-xl flex items-center justify-between text-xs font-bold"
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-foreground truncate">{resName}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteResume(idx)}
                    className="p-1 hover:text-rose-500 text-muted-foreground transition-colors cursor-pointer"
                    title="Remove Resume"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddResume} className="space-y-2 pt-2 border-t border-border">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New resume profile name..."
                  value={newResumeName}
                  onChange={e => setNewResumeName(e.target.value)}
                  className="w-full px-3 py-2 border border-border bg-background rounded-xl text-xs outline-none text-foreground focus:border-primary"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:bg-primary-hover transition-colors shrink-0 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">
                Make sure your resume is compiled with recent project and internship achievements.
              </p>
            </form>
          </div>

          {/* Student Document Locker */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase text-foreground tracking-wider flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" /> Credentials Locker
            </h3>

            <div className="space-y-2 text-xs font-bold">
              {[
                { name: '10th Marksheet', ok: true },
                { name: '12th Marksheet', ok: true },
                { name: 'Consolidated Marksheets', ok: true },
                { name: 'Aadhaar / Identity Verified', ok: true },
                { name: 'College Bonafide Certificate', ok: false }
              ].map((doc, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-2.5 rounded-xl bg-background border border-border"
                >
                  <span className="text-foreground">{doc.name}</span>
                  {doc.ok ? (
                    <span className="text-[9px] uppercase font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="h-2.5 w-2.5" /> Verified
                    </span>
                  ) : (
                    <span className="text-[9px] uppercase font-black bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                      Pending
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Details Modal / Drawer */}
      {selectedDrive && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-center items-end sm:items-center p-0 sm:p-4">
          <div className="bg-card border border-border rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative space-y-5 text-left animate-in zoom-in-95 duration-150 pb-safe">
            <button
              onClick={() => setSelectedDrive(null)}
              className="absolute top-5 right-5 p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Header */}
            <div className="pr-8 space-y-1">
              <span className="text-[10px] uppercase font-black text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20 inline-block">
                {selectedDrive.industry || 'Placement Drive'}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-foreground mt-1">{selectedDrive.company}</h2>
              <p className="text-xs sm:text-sm font-bold text-muted-foreground">{selectedDrive.role}</p>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-border text-xs font-bold gap-4">
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Drive Details
              </button>
              <button
                onClick={() => setActiveTab('timeline')}
                className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'timeline' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Selection Rounds
              </button>
              <button
                onClick={() => setActiveTab('tracker')}
                className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'tracker' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Application Status
              </button>
            </div>

            {/* Modal Tab Contents */}
            {activeTab === 'overview' && (
              <div className="space-y-4 text-xs font-medium text-muted-foreground leading-relaxed">
                <div>
                  <h4 className="font-black text-foreground text-xs uppercase tracking-wider mb-1.5">Company Description</h4>
                  <p className="text-muted-foreground">
                    {selectedDrive.description || 'Global technology enterprise, providing next-generation software development and digital infrastructure solutions.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 border border-border bg-background rounded-2xl">
                    <span className="text-[9px] uppercase font-black text-muted-foreground block">Annual CTC Package</span>
                    <span className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5 block">
                      {selectedDrive.package || 0} LPA
                    </span>
                  </div>
                  <div className="p-3.5 border border-border bg-background rounded-2xl">
                    <span className="text-[9px] uppercase font-black text-muted-foreground block">Drive Location</span>
                    <span className="text-base sm:text-lg font-black text-foreground mt-0.5 block">
                      {selectedDrive.location || 'Campus Onsite'}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 border border-border bg-background rounded-2xl space-y-2">
                  <h5 className="font-bold text-foreground text-xs">Eligibility Requirements</h5>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground text-[10px] block">Minimum CGPA</span>
                      <b className="text-foreground">{selectedDrive.eligibilityCgpa || 0}</b>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px] block">Allowed Arrears</span>
                      <b className="text-foreground">{selectedDrive.maxArrears ?? 0} max</b>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px] block">Attendance Cutoff</span>
                      <b className="text-foreground">{selectedDrive.minAttendance || 75}%</b>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'timeline' && (
              <div className="space-y-4">
                <h4 className="font-black text-foreground text-xs uppercase tracking-wider">Scheduled Selection Rounds</h4>
                <div className="space-y-2.5">
                  {[
                    { round: 'Round 1: Online Assessment', desc: 'Quantitative aptitude, logical reasoning, and core programming puzzles.', date: 'Stage 1' },
                    { round: 'Round 2: Technical Interview', desc: 'Data structures, algorithms, system design, and database queries.', date: 'Stage 2' },
                    { round: 'Round 3: HR & Management Discussion', desc: 'Behavioral analytics, fitment checks, and document verification.', date: 'Stage 3' }
                  ].map((r, i) => (
                    <div key={i} className="p-3.5 border border-border bg-background rounded-2xl text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <h5 className="font-bold text-foreground">{r.round}</h5>
                        <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">{r.date}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{r.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'tracker' && (
              <div className="space-y-4">
                <h4 className="font-black text-foreground text-xs uppercase tracking-wider">Recruitment Progress Tracker</h4>
                
                <div className="relative pl-6 space-y-5 border-l-2 border-border ml-3 pt-1 text-xs">
                  {[
                    {
                      label: 'Application Registration',
                      date: selectedDrive.myApp ? 'Completed' : 'Not yet applied',
                      ok: !!selectedDrive.myApp
                    },
                    {
                      label: 'Academic & CGPA Verification',
                      date: selectedDrive.eligible ? 'Criteria Met' : 'Unmet Criteria',
                      ok: selectedDrive.eligible
                    },
                    {
                      label: 'Interview Shortlist Status',
                      date: selectedDrive.myApp?.status === 'SELECTED' || selectedDrive.myApp?.status === 'PLACED' ? 'Shortlisted' : 'Pending Evaluation',
                      ok: selectedDrive.myApp?.status === 'SELECTED' || selectedDrive.myApp?.status === 'PLACED'
                    }
                  ].map((step, idx) => (
                    <div key={idx} className="relative">
                      <div
                        className={`absolute -left-[31px] top-0 h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                          step.ok
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'bg-card border-border text-muted-foreground'
                        }`}
                      >
                        {step.ok && <Check className="h-2.5 w-2.5" />}
                      </div>
                      <div className="text-left pl-2">
                        <h5 className={`font-bold ${step.ok ? 'text-foreground' : 'text-muted-foreground'}`}>{step.label}</h5>
                        <p className="text-[10px] text-muted-foreground font-semibold">{step.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="pt-3 border-t border-border flex gap-3">
              {selectedDrive.myApp ? (
                <button
                  onClick={() => {
                    handleWithdraw(selectedDrive.myApp.id);
                    setSelectedDrive(null);
                  }}
                  className="w-full py-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-bold rounded-xl text-xs hover:bg-rose-500/20 transition-colors cursor-pointer"
                >
                  Withdraw Application
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleRegister(selectedDrive.id);
                    setSelectedDrive(null);
                  }}
                  disabled={!selectedDrive.eligible}
                  className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-md"
                >
                  {selectedDrive.eligible ? 'Register for Drive' : 'Criteria Not Met'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPlacements;
