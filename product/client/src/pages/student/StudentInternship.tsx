import React, { useState, useEffect } from 'react';
import {
  FileCode, Search, Download, Star, Info, FileText, CheckCircle, Clock,
  AlertTriangle, ArrowRight, User, Shield, ChevronRight, TrendingUp, Award,
  MapPin, Building2, Calendar, Upload, Plus, Trash2, BookOpen, UserCheck, Inbox, Flame, Sparkles
} from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';
import api from '../../lib/axios';

interface InternshipListing {
  id: string;
  company: string;
  role: string;
  duration: string;
  stipend: string;
  location: string;
  skills: string;
  logo: string;
}

const INTERNSHIP_LISTINGS: InternshipListing[] = [
  { id: 'INT-01', company: 'Google India', role: 'Software Engineering Intern', duration: '6 Months', stipend: '₹1,00,000 / mo', location: 'Bangalore (Hybrid)', skills: 'Java, Python, Algorithms, Go', logo: 'G' },
  { id: 'INT-02', company: 'Microsoft', role: 'Cloud & DevOps Intern', duration: '3 Months', stipend: '₹80,000 / mo', location: 'Hyderabad (Remote)', skills: 'Azure, C#, Docker, Kubernetes', logo: 'M' },
  { id: 'INT-03', company: 'Amazon', role: 'Systems Engineer Intern', duration: '6 Months', stipend: '₹75,000 / mo', location: 'Chennai (Onsite)', skills: 'Linux, Networking, C++, Python', logo: 'A' },
  { id: 'INT-04', company: 'Adobe Systems', role: 'Frontend Engineer Intern', duration: '4 Months', stipend: '₹90,000 / mo', location: 'Noida (Hybrid)', skills: 'React, TypeScript, CSS, UX Design', logo: 'AD' }
];

export const StudentInternship: React.FC = () => {
  const [internships, setInternships] = useState<any[]>([]);
  const [activeInternship, setActiveInternship] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Internship Request Form
  const [company, setCompany] = useState('');
  const [duration, setDuration] = useState('6 Months');
  const [credits, setCredits] = useState('3');

  // Logs & Weekly reports
  const [logs, setLogs] = useState<{ date: string; task: string }[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('student_internship_logs') || '[]');
    } catch {
      return [];
    }
  });
  const [logDate, setLogDate] = useState('');
  const [logTask, setLogTask] = useState('');

  // Upload helpers
  const [docType, setDocType] = useState('OFFER_LETTER');
  const [uploadedUrl, setUploadedUrl] = useState('');

  const fetchInternshipData = async () => {
    try {
      const res = await api.get('/internships');
      if (res.data?.status === 'success') {
        const data = res.data.data;
        setInternships(data);
        if (data.length > 0) {
          const active = data.find((i: any) => i.status === 'APPROVED' || i.status === 'STARTED') || data[0];
          setActiveInternship(active);
        } else {
          setActiveInternship(null);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load internship parameters.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInternshipData();
  }, []);

  const handleApplyListing = async (listing: InternshipListing) => {
    try {
      setIsSubmitting(true);
      const res = await api.post('/internships', {
        company: listing.company,
        duration: listing.duration,
        credits: 3
      });
      if (res.data?.status === 'success') {
        toast.success(`Filed internship request for ${listing.company}!`);
        await fetchInternshipData();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to file internship request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim()) {
      toast.error('Please specify company name.');
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await api.post('/internships', {
        company: company.trim(),
        duration,
        credits
      });
      if (res.data?.status === 'success') {
        toast.success('Internship proposal filed successfully!');
        setCompany('');
        await fetchInternshipData();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to propose internship.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInternship) {
      toast.error('No active internship selected.');
      return;
    }
    if (!uploadedUrl.trim()) {
      toast.error('Please specify document URL or link.');
      return;
    }
    try {
      setIsSubmitting(true);
      const cleanName = uploadedUrl.split('/').pop() || 'document.pdf';
      const res = await api.post(`/internships/${activeInternship.id}/documents`, {
        documentType: docType,
        fileName: cleanName,
        fileUrl: uploadedUrl.trim(),
        fileSize: 1024 * 400,
        fileType: 'application/pdf'
      });
      if (res.data?.status === 'success') {
        toast.success('Document uploaded for verification!');
        setUploadedUrl('');
        await fetchInternshipData();
      }
    } catch (err) {
      console.error(err);
      toast.error('Upload failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logDate || !logTask.trim()) return;
    const newLogs = [...logs, { date: logDate, task: logTask.trim() }];
    setLogs(newLogs);
    localStorage.setItem('student_internship_logs', JSON.stringify(newLogs));
    setLogDate('');
    setLogTask('');
    toast.success('Daily task logbook entry saved.');
  };

  const handleClearLogs = () => {
    setLogs([]);
    localStorage.removeItem('student_internship_logs');
    toast.success('Logbook cleared.');
  };

  if (isLoading) return <Loading text="Syncing Internship Records..." />;

  const appliedCount = internships.length;
  const approvedCount = internships.filter(i => i.status === 'APPROVED' || i.status === 'STARTED' || i.status === 'COMPLETED').length;
  const pendingCount = internships.filter(i => i.status === 'PENDING').length;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto text-left pb-28 animate-in fade-in duration-200">
      
      {/* Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-5 sm:p-7 shadow-xs">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Work-Study & Industry Training</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2.5">
              <FileCode className="h-7 w-7 text-primary" /> Internship & Work-Study Portal
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              File work-study proposals, upload verified offer certificates, and submit your daily technical logbook.
            </p>
          </div>
        </div>
      </section>

      {/* KPI Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Internships Filed', value: `${appliedCount} Proposals`, tone: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
          { label: 'Approved Positions', value: `${approvedCount} Approved`, tone: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Awaiting Cell Review', value: `${pendingCount} Pending`, tone: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20' },
          { label: 'Logbook Entries', value: `${logs.length} Days Logged`, tone: 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20' }
        ].map((card, idx) => (
          <div key={idx} className="bg-card border border-border p-4 sm:p-5 rounded-2xl shadow-xs">
            <p className="text-[10px] sm:text-xs uppercase font-black tracking-wider text-muted-foreground">{card.label}</p>
            <p className="text-base sm:text-lg font-black text-foreground mt-1">{card.value}</p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Listings & Workspace */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Active Internship Workspace */}
          {activeInternship ? (
            <div className="bg-card border border-border p-5 rounded-2xl shadow-xs space-y-4">
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div>
                  <span className="text-[9px] uppercase font-black tracking-wider text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
                    Active Workspace
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-foreground mt-1.5">{activeInternship.company}</h3>
                  <p className="text-xs text-muted-foreground font-semibold">
                    Duration: {activeInternship.duration} • Mapped Academic Credits: {activeInternship.credits}
                  </p>
                </div>
                <span className="text-[10px] uppercase font-black tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                  {activeInternship.status}
                </span>
              </div>

              {/* Progress Timeline */}
              <div className="border-t border-border pt-4">
                <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-3">Position Milestones</h4>
                <div className="grid grid-cols-5 gap-1.5 text-center text-[9px] font-black">
                  {[
                    { label: 'Propose', done: true },
                    { label: 'Cell Approve', done: activeInternship.status !== 'PENDING' },
                    { label: 'Offer Upload', done: activeInternship.documents?.some((d: any) => d.documentType === 'OFFER_LETTER') },
                    { label: 'Reports Filed', done: activeInternship.documents?.some((d: any) => d.documentType === 'WEEKLY_REPORT') },
                    { label: 'Certificate', done: activeInternship.documents?.some((d: any) => d.documentType === 'COMPLETION_CERTIFICATE') }
                  ].map((step, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className={`h-1.5 rounded-full ${step.done ? 'bg-primary shadow-xs' : 'bg-muted'}`} />
                      <span className={step.done ? 'text-foreground font-bold' : 'text-muted-foreground'}>{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upload Documents form */}
              <form onSubmit={handleUploadDocument} className="pt-4 border-t border-border space-y-3.5">
                <h4 className="text-[10px] font-black uppercase text-foreground tracking-wider flex items-center gap-1.5">
                  <Upload className="h-4 w-4 text-primary" /> Submit Document for Verification
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs font-semibold">
                  <div>
                    <label className="block text-[9px] uppercase font-black text-muted-foreground mb-1">Document Category</label>
                    <select
                      value={docType}
                      onChange={e => setDocType(e.target.value)}
                      className="w-full px-3 py-2 border border-border bg-background rounded-xl outline-none text-foreground cursor-pointer"
                    >
                      <option value="OFFER_LETTER">Offer Letter</option>
                      <option value="JOINING_LETTER">Joining Letter</option>
                      <option value="WEEKLY_REPORT">Weekly Summary Report</option>
                      <option value="MONTHLY_REPORT">Monthly Detailed Report</option>
                      <option value="COMPLETION_CERTIFICATE">Final Completion Certificate</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase font-black text-muted-foreground mb-1">Document Link / URL</label>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/..."
                      value={uploadedUrl}
                      onChange={e => setUploadedUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-border bg-background rounded-xl outline-none text-foreground placeholder:text-muted-foreground focus:border-primary"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  {isSubmitting ? 'Uploading...' : 'Verify Document'}
                </button>
              </form>

              {/* Uploaded Documents List */}
              {activeInternship.documents && activeInternship.documents.length > 0 && (
                <div className="pt-4 border-t border-border space-y-2">
                  <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Submitted Documents</h4>
                  <div className="space-y-1.5">
                    {activeInternship.documents.map((doc: any, i: number) => (
                      <div key={i} className="p-3 border border-border bg-background rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-foreground block">{doc.documentType}</span>
                          <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-[11px] text-primary hover:underline block truncate max-w-[250px] font-semibold">{doc.fileName}</a>
                        </div>
                        <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                          doc.verificationStatus === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-muted text-muted-foreground border-transparent'
                        }`}>
                          {doc.verificationStatus}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed border-border rounded-3xl bg-card p-6">
              <Flame className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <p className="text-xs text-muted-foreground font-bold mt-2.5">No active internship proposals filed yet.</p>
            </div>
          )}

          {/* Internship listings */}
          <div className="bg-card border border-border p-5 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase text-foreground tracking-wider">
              Recommended Campus Internship Opportunities
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {INTERNSHIP_LISTINGS.map((listing) => (
                <div key={listing.id} className="p-4 border border-border bg-background rounded-2xl hover:border-primary/40 transition-colors flex flex-col justify-between gap-3 text-left shadow-xs">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-foreground text-sm">{listing.company}</h4>
                      <span className="text-[9px] uppercase font-black text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">{listing.duration}</span>
                    </div>
                    <p className="text-xs font-bold text-muted-foreground">{listing.role}</p>
                    <p className="text-[10.5px] text-muted-foreground font-semibold flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-primary shrink-0" /> {listing.location} • {listing.stipend}</p>
                    <p className="text-[10px] text-muted-foreground font-medium truncate">Skills: {listing.skills}</p>
                  </div>
                  <button
                    onClick={() => handleApplyListing(listing)}
                    disabled={isSubmitting}
                    className="w-full py-2 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    Apply Proposal
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Daily Log Book */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Custom Propose Form */}
          <div className="bg-card border border-border p-5 rounded-2xl shadow-xs space-y-4 text-left">
            <h3 className="text-xs font-black uppercase text-foreground tracking-wider">
              Propose Custom Internship
            </h3>
            <form onSubmit={handleRequestCustom} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-[9px] uppercase font-black text-muted-foreground mb-1">Company Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corporation..."
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  className="w-full px-3 py-2 border border-border bg-background rounded-xl outline-none text-foreground focus:border-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] uppercase font-black text-muted-foreground mb-1">Duration</label>
                  <select
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    className="w-full px-3 py-2 border border-border bg-background rounded-xl outline-none text-foreground cursor-pointer"
                  >
                    <option value="3 Months">3 Months</option>
                    <option value="6 Months">6 Months</option>
                    <option value="1 Year">1 Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-black text-muted-foreground mb-1">Credits</label>
                  <select
                    value={credits}
                    onChange={e => setCredits(e.target.value)}
                    className="w-full px-3 py-2 border border-border bg-background rounded-xl outline-none text-foreground cursor-pointer"
                  >
                    <option value="2">2 Credits</option>
                    <option value="3">3 Credits</option>
                    <option value="4">4 Credits</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
              >
                File Internship Proposal
              </button>
            </form>
          </div>

          {/* Daily Log Book */}
          <div className="bg-card border border-border p-5 rounded-2xl shadow-xs space-y-4 text-left">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase text-foreground tracking-wider flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-primary" /> Daily Work Logbook
              </h3>
              {logs.length > 0 && (
                <button onClick={handleClearLogs} className="text-[10px] text-rose-500 font-bold hover:underline cursor-pointer">Clear</button>
              )}
            </div>

            <form onSubmit={handleAddLog} className="space-y-3 text-xs font-semibold border-b border-border pb-4">
              <div>
                <label className="block text-[9px] uppercase font-black text-muted-foreground mb-1">Date</label>
                <input
                  type="date"
                  value={logDate}
                  onChange={e => setLogDate(e.target.value)}
                  className="w-full px-3 py-2 border border-border bg-background rounded-xl outline-none text-foreground"
                  required
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase font-black text-muted-foreground mb-1">Tasks Completed</label>
                <textarea
                  placeholder="Describe your daily technical tasks..."
                  value={logTask}
                  onChange={e => setLogTask(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-border bg-background rounded-xl outline-none text-foreground resize-none placeholder:text-muted-foreground focus:border-primary"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="h-4 w-4" /> Save Logbook Entry
              </button>
            </form>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {logs.length > 0 ? (
                logs.map((log, i) => (
                  <div key={i} className="p-3 border border-border bg-background rounded-xl text-xs space-y-0.5">
                    <span className="font-bold text-primary block">{new Date(log.date).toLocaleDateString('en-IN')}</span>
                    <p className="text-muted-foreground font-medium">{log.task}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground italic py-4 text-center">No logbook entries recorded for this internship.</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentInternship;
