import React, { useState, useEffect } from 'react';
import {
  FileCode, Search, Download, Star, Info, FileText, CheckCircle, Clock,
  AlertTriangle, ArrowRight, User, Shield, ChevronRight, TrendingUp, Award,
  MapPin, Building2, Calendar, Upload, Plus, Trash2, BookOpen, UserCheck, Inbox, Flame
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

  // Logs & Weekly reports stubs
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
          // Find first active/approved one
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
      toast.error('Please specify document URL/Link.');
      return;
    }
    try {
      setIsSubmitting(true);
      const cleanName = uploadedUrl.split('/').pop() || 'document.pdf';
      const res = await api.post(`/internships/${activeInternship.id}/documents`, {
        documentType: docType,
        fileName: cleanName,
        fileUrl: uploadedUrl.trim(),
        fileSize: 1024 * 400, // 400 KB mock
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
    <div className="dark bg-slate-950 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-6 text-left pb-12 animate-in fade-in duration-200">
      
      {/* Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping"></span>
            <span className="text-[10px] uppercase font-black tracking-wider text-indigo-400">GEETORUS CAREER PLAN</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1 flex items-center gap-2">
            <FileCode className="h-6 w-6 text-indigo-500" /> Internship & Work-Study Portal
          </h1>
          <p className="text-xs text-slate-400">File work-study proposals, upload certificates, and submit daily logs</p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Internships Filed', value: `${appliedCount} Proposals` },
          { label: 'Approved Positions', value: `${approvedCount} Approved` },
          { label: 'Awaiting Cell Review', value: `${pendingCount} Pending` },
          { label: 'Logbook Entries', value: `${logs.length} Days logged` }
        ].map((card, idx) => (
          <div key={idx} className="border border-slate-800 bg-slate-900/50 p-4 rounded-xl shadow-sm">
            <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">{card.label}</p>
            <p className="text-sm font-black text-slate-100 mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Listings & Workspace */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Active Internship Workspace */}
          {activeInternship ? (
            <div className="border border-slate-800 bg-slate-900/40 p-5 rounded-xl space-y-4">
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div>
                  <span className="text-[9px] uppercase font-black tracking-wider text-indigo-400 bg-indigo-950/40 border border-indigo-800/40 px-2 py-0.5 rounded">
                    Active Workspace
                  </span>
                  <h3 className="text-lg font-black text-white mt-1.5">{activeInternship.company}</h3>
                  <p className="text-xs text-slate-400 font-bold">Duration: {activeInternship.duration} · Mapped Credits: {activeInternship.credits}</p>
                </div>
                <span className="text-[10px] uppercase font-black tracking-wider text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded">
                  {activeInternship.status}
                </span>
              </div>

              {/* Progress Timeline */}
              <div className="border-t border-slate-800/60 pt-4">
                <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-3">Position Milestones</h4>
                <div className="grid grid-cols-5 gap-1.5 text-center text-[9px] font-black">
                  {[
                    { label: 'Propose', done: true },
                    { label: 'Cell Approve', done: activeInternship.status !== 'PENDING' },
                    { label: 'Offer upload', done: activeInternship.documents?.some((d: any) => d.documentType === 'OFFER_LETTER') },
                    { label: 'Reports filed', done: activeInternship.documents?.some((d: any) => d.documentType === 'WEEKLY_REPORT') },
                    { label: 'Certificate', done: activeInternship.documents?.some((d: any) => d.documentType === 'COMPLETION_CERTIFICATE') }
                  ].map((step, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className={`h-1.5 rounded-full ${step.done ? 'bg-indigo-500 shadow-sm shadow-indigo-500/50' : 'bg-slate-800'}`} />
                      <span className={step.done ? 'text-slate-200' : 'text-slate-600'}>{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upload Documents form */}
              <form onSubmit={handleUploadDocument} className="pt-4 border-t border-slate-800/60 space-y-3.5">
                <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                  <Upload className="h-4 w-4 text-indigo-400" /> Submit Document Verification
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs font-semibold">
                  <div>
                    <label className="block text-[8px] uppercase font-black text-slate-500 mb-1">Document Category</label>
                    <select
                      value={docType}
                      onChange={e => setDocType(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-800 bg-slate-950 rounded-lg outline-none text-slate-300"
                    >
                      <option value="OFFER_LETTER">Offer Letter</option>
                      <option value="JOINING_LETTER">Joining Letter</option>
                      <option value="WEEKLY_REPORT">Weekly Summary Report</option>
                      <option value="MONTHLY_REPORT">Monthly Detailed Report</option>
                      <option value="COMPLETION_CERTIFICATE">Final Completion Certificate</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[8px] uppercase font-black text-slate-500 mb-1">Document Link / URL</label>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/..."
                      value={uploadedUrl}
                      onChange={e => setUploadedUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-800 bg-slate-950 rounded-lg outline-none text-slate-300 placeholder:text-slate-700"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-slate-950 text-xs font-black rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {isSubmitting ? 'Uploading...' : 'Verify Document'}
                </button>
              </form>

              {/* Uploaded Documents List */}
              {activeInternship.documents && activeInternship.documents.length > 0 && (
                <div className="pt-4 border-t border-slate-800/60 space-y-2">
                  <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Submitted Sheets</h4>
                  <div className="space-y-1.5">
                    {activeInternship.documents.map((doc: any, i: number) => (
                      <div key={i} className="p-2 border border-slate-800 bg-slate-950 rounded-lg flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-slate-200 block">{doc.documentType}</span>
                          <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-400 hover:underline block truncate max-w-[250px]">{doc.fileName}</a>
                        </div>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                          doc.verificationStatus === 'VERIFIED' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40' : 'bg-slate-900 text-slate-500'
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
            <div className="text-center py-16 border-2 border-dashed border-slate-850 rounded-2xl bg-slate-900/10">
              <Flame className="h-10 w-10 text-slate-800 mx-auto" />
              <p className="text-xs text-slate-500 font-bold mt-2.5">No active internship proposals filed yet.</p>
            </div>
          )}

          {/* Internship listings */}
          <div className="border border-slate-800 bg-slate-900/40 p-5 rounded-xl space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
              Recommended Campus Internship Opportunities
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {INTERNSHIP_LISTINGS.map((listing) => (
                <div key={listing.id} className="p-4 border border-slate-800 bg-slate-950 rounded-xl hover:border-slate-700 transition-colors flex flex-col justify-between gap-3 text-left">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-white text-sm">{listing.company}</h4>
                      <span className="text-[9px] uppercase font-black text-indigo-400 bg-indigo-950/40 border border-indigo-800/40 px-2 py-0.5 rounded">{listing.duration}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-300">{listing.role}</p>
                    <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-slate-750" /> {listing.location} · {listing.stipend}</p>
                    <p className="text-[9px] text-slate-500 font-medium truncate">Skills: {listing.skills}</p>
                  </div>
                  <button
                    onClick={() => handleApplyListing(listing)}
                    disabled={isSubmitting}
                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-slate-950 text-xs font-black rounded-lg transition-all"
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
          <div className="border border-slate-800 bg-slate-900/40 p-5 rounded-xl space-y-4 text-left">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
              Propose Custom Internship
            </h3>
            <form onSubmit={handleRequestCustom} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-[8px] uppercase font-black text-slate-500 mb-1">Company Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corp..."
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-800 bg-slate-950 rounded-lg outline-none text-slate-200"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[8px] uppercase font-black text-slate-500 mb-1">Duration</label>
                  <select
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-800 bg-slate-950 rounded-lg outline-none text-slate-300"
                  >
                    <option value="3 Months">3 Months</option>
                    <option value="6 Months">6 Months</option>
                    <option value="1 Year">1 Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[8px] uppercase font-black text-slate-500 mb-1">Credits</label>
                  <select
                    value={credits}
                    onChange={e => setCredits(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-800 bg-slate-950 rounded-lg outline-none text-slate-300"
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
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-slate-950 text-xs font-black rounded-lg transition-all"
              >
                File Internship Proposal
              </button>
            </form>
          </div>

          {/* Daily Log Book */}
          <div className="border border-slate-800 bg-slate-900/40 p-5 rounded-xl space-y-4 text-left">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-indigo-400" /> Daily Work Logbook
              </h3>
              {logs.length > 0 && (
                <button onClick={handleClearLogs} className="text-[9px] text-rose-400 font-extrabold hover:underline">Clear</button>
              )}
            </div>

            <form onSubmit={handleAddLog} className="space-y-3.5 text-xs font-semibold border-b border-slate-800/60 pb-4">
              <div>
                <label className="block text-[8px] uppercase font-black text-slate-500 mb-1">Date</label>
                <input
                  type="date"
                  value={logDate}
                  onChange={e => setLogDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-800 bg-slate-950 rounded-lg outline-none text-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block text-[8px] uppercase font-black text-slate-500 mb-1">Tasks Completed</label>
                <textarea
                  placeholder="Describe your daily technical tasks..."
                  value={logTask}
                  onChange={e => setLogTask(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-800 bg-slate-950 rounded-lg outline-none text-slate-200 resize-none placeholder:text-slate-800"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-slate-950 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> Save Logbook Entry
              </button>
            </form>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {logs.length > 0 ? (
                logs.map((log, i) => (
                  <div key={i} className="p-2.5 border border-slate-850 bg-slate-950 rounded-xl text-[10.5px] leading-relaxed">
                    <span className="font-black text-indigo-400 block">{new Date(log.date).toLocaleDateString('en-IN')}</span>
                    <p className="text-slate-400 font-medium mt-0.5">{log.task}</p>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-slate-500 italic py-4 text-center">No logbook entries recorded for this internship.</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentInternship;
