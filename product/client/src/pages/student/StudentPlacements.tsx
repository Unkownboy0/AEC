import React, { useState, useEffect } from 'react';
import {
  Briefcase, Search, Filter, Download, Star, Info, FileText, BarChart2,
  CheckCircle, Clock, AlertTriangle, ArrowRight, User, Shield, ChevronRight,
  TrendingUp, Award, MapPin, Building2, Calendar, FileDown, Eye, CheckCircle2,
  HelpCircle, Sparkles, X, Plus, Upload, Trash2, Globe
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
    highestLpa: 44.0,
    avgLpa: 7.8
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [packageFilter, setPackageFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [locationFilter, setLocationFilter] = useState('ALL');
  const [selectedDrive, setSelectedDrive] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'tracker'>('overview');

  // Documents
  const [resumes, setResumes] = useState<string[]>(['John_Smith_Resume_SDE.pdf']);
  const [newResumeName, setNewResumeName] = useState('');

  const fetchPlacementsData = async () => {
    try {
      const studentRes = await api.get('/enterprise/students');
      if (studentRes.data?.status === 'success' && studentRes.data.data?.length > 0) {
        const student = studentRes.data.data[0];
        setStudentInfo(student);

        const drivesRes = await api.get('/placements/drives');
        if (drivesRes.data?.status === 'success') {
          const rawDrives = drivesRes.data.data;
          
          // Calculate student eligibility & stats
          const studentCgpa = student.cgpa || 9.5;
          const studentBacklogs = student.backlogs || 0;
          const studentDept = student.department?.code || '';

          const enriched = rawDrives.map((d: any) => {
            // Parse details safely
            const depts = d.eligibilityDept ? d.eligibilityDept.split(',') : [];
            const isDeptEligible = depts.length === 0 || depts.includes(studentDept);
            const isCgpaEligible = studentCgpa >= d.eligibilityCgpa;
            const isArrearsEligible = studentBacklogs <= d.maxArrears;
            const eligible = isDeptEligible && isCgpaEligible && isArrearsEligible;

            // Resolve student application
            const myApp = d.applications?.find((app: any) => app.studentId === student.id);

            return {
              ...d,
              eligible,
              myApp
            };
          });

          setDrives(enriched);

          // Calculate counters
          const appliedList = enriched.filter((d: any) => !!d.myApp);
          const selectedList = enriched.filter((d: any) => d.myApp?.status === 'SELECTED' || d.myApp?.status === 'PLACED');

          setStats({
            activeDrives: enriched.filter((d: any) => d.status === 'OPEN').length,
            eligibleDrives: enriched.filter((d: any) => d.eligible).length,
            applied: appliedList.length,
            selected: selectedList.length,
            highestLpa: Math.max(...enriched.map((d: any) => d.package), 44.0),
            avgLpa: parseFloat((enriched.reduce((acc: number, d: any) => acc + d.package, 0) / (enriched.length || 1)).toFixed(2)) || 7.8
          });
        }
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
      const res = await api.post('/placements/drives/apply', {
        driveId,
        studentId: studentInfo.id
      });
      if (res.data?.status === 'success') {
        toast.success('Registered successfully for recruitment drive!');
        await fetchPlacementsData();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit application.');
    }
  };

  const handleWithdraw = async (appId: string) => {
    try {
      // Direct status update to WITHDRAWN
      const res = await api.put(`/placements/applications/${appId}/status`, {
        status: 'WITHDRAWN'
      });
      if (res.data?.status === 'success') {
        toast.success('Withdrew application successfully.');
        await fetchPlacementsData();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to withdraw application.');
    }
  };

  const handleAddResume = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResumeName.trim()) return;
    setResumes(prev => [...prev, newResumeName.trim() + '.pdf']);
    setNewResumeName('');
    toast.success('Resume profile registered.');
  };

  const handleDeleteResume = (index: number) => {
    setResumes(prev => prev.filter((_, i) => i !== index));
    toast.success('Resume deleted.');
  };

  const filteredDrives = drives.filter(d => {
    const matchesSearch = d.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          d.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPkg = packageFilter === 'ALL' ||
                       (packageFilter === 'tier1' && d.package >= 15) ||
                       (packageFilter === 'tier2' && d.package >= 7 && d.package < 15) ||
                       (packageFilter === 'mass' && d.package < 7);
    const matchesType = typeFilter === 'ALL' || d.industry.toLowerCase().includes(typeFilter.toLowerCase());
    return matchesSearch && matchesPkg && matchesType;
  });

  if (isLoading) return <Loading text="Syncing Recruitment Dashboard..." />;

  return (
    <div className="dark bg-slate-950 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-6 text-left pb-12 animate-in fade-in duration-200">
      
      {/* Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-500 animate-ping"></span>
            <span className="text-[10px] uppercase font-black tracking-wider text-cyan-400">GEETORUS CAMPUS RECRUITMENT</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1 flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-cyan-500" /> Recruitment Drive Hub
          </h1>
          <p className="text-xs text-slate-400">Tier-1 campus recruitment registry and placement records</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => toast.info('JD summary sheet export is simulated.')} className="px-3.5 py-2 bg-slate-900 border border-slate-800 text-xs font-extrabold rounded-xl hover:bg-slate-800 flex items-center gap-1.5 text-slate-200">
            <Download className="h-4 w-4" /> Export Analytics
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Opportunities', value: `${stats.activeDrives} Open Drives`, sub: 'Direct registrations open', icon: <Building2 className="h-4 w-4 text-cyan-400" /> },
          { label: 'Eligible Drives', value: `${stats.eligibleDrives} Companies`, sub: 'Matches CGPA & criteria', icon: <Award className="h-4 w-4 text-emerald-400" /> },
          { label: 'Applied Drives', value: `${stats.applied} Registered`, sub: 'Application pipelines active', icon: <CheckCircle className="h-4 w-4 text-indigo-400" /> },
          { label: 'Highest Package Offered', value: `${stats.highestLpa} LPA`, sub: `Average: ${stats.avgLpa} LPA`, icon: <TrendingUp className="h-4 w-4 text-amber-400" /> }
        ].map((card, idx) => (
          <div key={idx} className="border border-slate-800/80 bg-slate-900/50 p-4 rounded-xl shadow-md flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[9px] uppercase font-black tracking-wider text-slate-400 block">{card.label}</span>
              <span className="text-lg font-black text-white block">{card.value}</span>
              <span className="text-[9px] text-slate-500 font-bold block">{card.sub}</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Directory Left, Resume uploads right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Placements listings */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between border border-slate-800 bg-slate-900/40 p-4 rounded-xl">
            <div className="flex flex-1 w-full md:w-auto items-center gap-2 border border-slate-800 px-3 py-1.5 rounded-xl bg-slate-950">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by company or role..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-transparent text-xs outline-none w-full font-semibold text-slate-200 placeholder:text-slate-600"
              />
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
              <select
                value={packageFilter}
                onChange={e => setPackageFilter(e.target.value)}
                className="text-xs font-semibold px-3 py-2 border border-slate-800 rounded-xl bg-slate-950 outline-none text-slate-300"
              >
                <option value="ALL">All Package tiers</option>
                <option value="tier1">Tier 1 (15+ LPA)</option>
                <option value="tier2">Tier 2 (7 - 15 LPA)</option>
                <option value="mass">Standard (&lt; 7 LPA)</option>
              </select>

              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="text-xs font-semibold px-3 py-2 border border-slate-800 rounded-xl bg-slate-950 outline-none text-slate-300"
              >
                <option value="ALL">All Sectors</option>
                <option value="technology">Tech Sector</option>
                <option value="finance">Finance / FinTech</option>
                <option value="consulting">Consulting</option>
              </select>
            </div>
          </div>

          {/* Company Drive Cards */}
          <div className="space-y-4">
            {filteredDrives.length > 0 ? (
              filteredDrives.map((drive) => {
                const isApplied = !!drive.myApp;
                const appStatus = drive.myApp?.status || 'PENDING';

                return (
                  <div key={drive.id} className="border border-slate-800 bg-slate-900/40 p-5 rounded-xl hover:border-slate-700/80 transition-all flex flex-col md:flex-row justify-between gap-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-indigo-600 w-0 group-hover:w-full transition-all duration-300" />
                    
                    <div className="space-y-3.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] uppercase font-black tracking-wider text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded">
                          {drive.industry}
                        </span>
                        {drive.eligible ? (
                          <span className="text-[10px] uppercase font-black tracking-wider text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
                            Eligible
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase font-black tracking-wider text-rose-400 bg-rose-950/40 border border-rose-800/40 px-2 py-0.5 rounded">
                            Not Eligible
                          </span>
                        )}
                        {isApplied && (
                          <span className="text-[10px] uppercase font-black tracking-wider text-indigo-400 bg-indigo-950/40 border border-indigo-800/40 px-2 py-0.5 rounded">
                            {appStatus}
                          </span>
                        )}
                      </div>

                      <div className="text-left space-y-1">
                        <h3 className="text-base font-black text-white">{drive.company}</h3>
                        <p className="text-xs font-bold text-slate-300">{drive.role}</p>
                        <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-600" /> {drive.location} · Drive Date: {new Date(drive.driveDate).toLocaleDateString('en-IN')}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1.5 border-t border-slate-800/60">
                        <div className="text-left">
                          <span className="text-[8px] uppercase font-black text-slate-500 block">CTC Package</span>
                          <span className="text-xs font-extrabold text-amber-400">{drive.package} LPA</span>
                        </div>
                        <div className="text-left">
                          <span className="text-[8px] uppercase font-black text-slate-500 block">Min CGPA Required</span>
                          <span className="text-xs font-extrabold text-slate-200">{drive.eligibilityCgpa} CGPA</span>
                        </div>
                        <div className="text-left">
                          <span className="text-[8px] uppercase font-black text-slate-500 block">Standing Arrears</span>
                          <span className="text-xs font-extrabold text-slate-200">{drive.maxArrears} Max</span>
                        </div>
                        <div className="text-left">
                          <span className="text-[8px] uppercase font-black text-slate-500 block">Min Attendance</span>
                          <span className="text-xs font-extrabold text-slate-200">{drive.minAttendance}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col justify-end gap-2 shrink-0 self-end md:self-center w-full md:w-auto">
                      <button
                        onClick={() => setSelectedDrive(drive)}
                        className="flex-1 md:flex-initial px-3.5 py-2 border border-slate-800 bg-slate-950 text-slate-300 text-xs font-extrabold rounded-xl hover:bg-slate-900 transition-colors flex items-center justify-center gap-1"
                      >
                        <Eye className="h-3.5 w-3.5" /> Details
                      </button>

                      {isApplied ? (
                        <button
                          onClick={() => handleWithdraw(drive.myApp.id)}
                          className="flex-1 md:flex-initial px-3.5 py-2 bg-rose-950/30 border border-rose-800/40 text-rose-400 text-xs font-extrabold rounded-xl hover:bg-rose-950/50 transition-colors"
                        >
                          Withdraw
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRegister(drive.id)}
                          disabled={!drive.eligible}
                          className="flex-1 md:flex-initial px-3.5 py-2 bg-cyan-600 text-slate-950 text-xs font-extrabold rounded-xl hover:bg-cyan-500 disabled:bg-slate-900 disabled:text-slate-600 disabled:border-slate-800 border disabled:cursor-not-allowed transition-colors"
                        >
                          Register Drive
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
                <Briefcase className="h-10 w-10 text-slate-700 mx-auto" />
                <p className="text-xs text-slate-500 font-bold mt-2.5">No recruitment drives found matching criteria.</p>
              </div>
            )}
          </div>
        </div>

        {/* Resumes & documents upload center */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Resume Uploads */}
          <div className="border border-slate-800 bg-slate-900/40 p-5 rounded-xl space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-cyan-400" /> Active Resume Profiles
            </h3>

            <div className="space-y-2">
              {resumes.map((resName, idx) => (
                <div key={idx} className="p-3 border border-slate-800 bg-slate-950 rounded-xl flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-200 truncate pr-2">{resName}</span>
                  <button onClick={() => handleDeleteResume(idx)} className="p-1 hover:text-rose-500 text-slate-500 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddResume} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New Resume Name..."
                  value={newResumeName}
                  onChange={e => setNewResumeName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-800 bg-slate-950 rounded-lg text-xs outline-none text-slate-200"
                />
                <button type="submit" className="p-2 bg-slate-850 hover:bg-slate-800 border border-slate-700 rounded-lg text-cyan-400">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <p className="text-[9px] text-slate-600 font-bold block">Must be compiled with CV/Resume builder standards.</p>
            </form>
          </div>

          {/* Student Document Lockers */}
          <div className="border border-slate-800 bg-slate-900/40 p-5 rounded-xl space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-cyan-400" /> Credentials Locker
            </h3>

            <div className="space-y-2.5 text-xs font-bold text-slate-400">
              {[
                { name: '10th Marksheet', ok: true },
                { name: '12th Marksheet', ok: true },
                { name: 'Semester Marksheets', ok: true },
                { name: 'PAN & Aadhaar Mapped', ok: true },
                { name: 'College Bonafide', ok: false }
              ].map((doc, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 rounded bg-slate-950/60 border border-slate-900">
                  <span>{doc.name}</span>
                  {doc.ok ? (
                    <span className="text-[8px] uppercase font-black bg-emerald-950/40 text-emerald-400 border border-emerald-800/30 px-1.5 py-0.5 rounded">Verified</span>
                  ) : (
                    <span className="text-[8px] uppercase font-black bg-slate-900 text-slate-500 px-1.5 py-0.5 rounded">Missing</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Details drawer/modal */}
      {selectedDrive && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative space-y-6 text-left animate-in zoom-in duration-200">
            <button onClick={() => setSelectedDrive(null)} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div>
              <span className="text-[10px] uppercase font-black text-cyan-400 bg-cyan-950/40 px-2.5 py-0.5 rounded border border-cyan-800/40 inline-block">
                Recruitment drive
              </span>
              <h2 className="text-xl font-black text-white mt-2">{selectedDrive.company}</h2>
              <p className="text-sm font-extrabold text-slate-300">{selectedDrive.role}</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-800 text-xs font-bold gap-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-2 px-2 border-b-2 transition-colors ${
                  activeTab === 'overview' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Drive Details
              </button>
              <button
                onClick={() => setActiveTab('timeline')}
                className={`pb-2 px-2 border-b-2 transition-colors ${
                  activeTab === 'timeline' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Selection Rounds
              </button>
              <button
                onClick={() => setActiveTab('tracker')}
                className={`pb-2 px-2 border-b-2 transition-colors ${
                  activeTab === 'tracker' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Application status
              </button>
            </div>

            {/* Tab Contents */}
            {activeTab === 'overview' && (
              <div className="space-y-4 text-xs font-semibold text-slate-300 leading-relaxed">
                <div>
                  <h4 className="font-extrabold text-white text-[11px] uppercase tracking-wider mb-1">Company Description</h4>
                  <p className="text-slate-400 font-medium">
                    {selectedDrive.description || 'Global technology enterprise, providing next-generation software development and infrastructure solutions. Mapped to Tier-1 placement program.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-3 border border-slate-800 bg-slate-950/40 rounded-xl">
                    <span className="text-[8px] uppercase font-black text-slate-500 block">Annual CTC Package</span>
                    <span className="text-base font-black text-amber-400 mt-0.5 block">{selectedDrive.package} LPA</span>
                  </div>
                  <div className="p-3 border border-slate-800 bg-slate-950/40 rounded-xl">
                    <span className="text-[8px] uppercase font-black text-slate-500 block">Drive Location</span>
                    <span className="text-base font-black text-slate-200 mt-0.5 block">{selectedDrive.location}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'timeline' && (
              <div className="space-y-4">
                <h4 className="font-extrabold text-white text-[11px] uppercase tracking-wider">Scheduled Selection Rounds</h4>
                <div className="space-y-3">
                  {[
                    { round: 'Round 1: Online Assessment', desc: 'Quantitative aptitude, logical reasoning, and basic coding puzzles.', date: 'Date: Immediate' },
                    { round: 'Round 2: Technical Interview', desc: 'Core DSA concepts, database management, and architecture details.', date: 'Date: Mid August' },
                    { round: 'Round 3: HR & Management Discussion', desc: 'Behavioral analytics, fitment checks, and background registry.', date: 'Date: Late August' }
                  ].map((r, i) => (
                    <div key={i} className="p-3 border border-slate-800 bg-slate-950 rounded-xl text-xs">
                      <h5 className="font-black text-slate-200">{r.round}</h5>
                      <p className="text-[10.5px] text-slate-500 mt-0.5 font-medium">{r.desc}</p>
                      <span className="text-[9px] text-cyan-400 font-black mt-1 block">{r.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'tracker' && (
              <div className="space-y-4">
                <h4 className="font-extrabold text-white text-[11px] uppercase tracking-wider">Recruitment Progress Timeline</h4>
                
                <div className="relative pl-6 space-y-4 border-l border-slate-800 ml-2 pt-1 text-xs">
                  {[
                    { label: 'Application Submitted', date: selectedDrive.myApp ? new Date(selectedDrive.myApp.submittedAt || selectedDrive.myApp.createdAt).toLocaleDateString('en-IN') : 'Pending', ok: !!selectedDrive.myApp },
                    { label: 'Academic & CGPA Verification', date: selectedDrive.eligible ? 'Eligible' : 'Not Eligible', ok: selectedDrive.eligible },
                    { label: 'Interview Shortlist Status', date: selectedDrive.myApp?.status === 'SELECTED' || selectedDrive.myApp?.status === 'PLACED' ? 'Shortlisted' : 'Awaiting Assessment', ok: selectedDrive.myApp?.status === 'SELECTED' || selectedDrive.myApp?.status === 'PLACED' }
                  ].map((step, idx) => (
                    <div key={idx} className="relative">
                      <div className={`absolute left-[-29px] top-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                        step.ok ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}>
                        {step.ok && <span className="h-1.5 w-1.5 bg-white rounded-full"></span>}
                      </div>
                      <div className="text-left pl-2">
                        <h5 className={`font-black ${step.ok ? 'text-slate-200' : 'text-slate-500'}`}>{step.label}</h5>
                        <p className="text-[10px] text-slate-500 font-bold">{step.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPlacements;
