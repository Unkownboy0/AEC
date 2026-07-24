import React, { useState, useEffect } from 'react';
import { FileText, Search, Download, CheckCircle, Clock, AlertTriangle, GitBranch, ArrowRight, ChevronRight } from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';
import api from '../../lib/axios';

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxMarks: number;
  subject: { name: string; code: string };
  faculty: { firstName: string; lastName: string };
  mySubmission: {
    status: string;
    marksObtained: number | null;
    feedback: string | null;
    submittedAt: string;
    fileUrl: string | null;
  } | null;
}

export const StudentAssignments: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAsg, setSelectedAsg] = useState<Assignment | null>(null);
  const [gitUrl, setGitUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAssignments = async () => {
    try {
      const res = await api.get('/assignments');
      if (res.data?.status === 'success') {
        setAssignments(res.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load assignments.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsg) return;
    if (!gitUrl.trim()) {
      toast.error('Please provide a repository URL.');
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await api.post(`/assignments/${selectedAsg.id}/submit`, {
        fileUrl: gitUrl.trim(),
        fileName: 'GitHub Repository',
        fileSize: 0,
        fileType: 'repository'
      });
      if (res.data?.status === 'success') {
        toast.success('Assignment repository connected and submitted successfully.');
        setGitUrl('');
        setSelectedAsg(null);
        await fetchAssignments();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit assignment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <Loading text="Loading Assignments..." />;

  const pendingCount = assignments.filter(a => !a.mySubmission).length;
  const gradedCount = assignments.filter(a => a.mySubmission && a.mySubmission.marksObtained !== null).length;

  return (
    <div className="space-y-6 text-left pb-12 animate-in fade-in duration-200">
      
      {/* Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" /> Enterprise Assignment Registry
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Submit codebases, verify assignment weightages, and review scoring breakdowns</p>
        </div>
        <button
          onClick={() => toast.info('Assignment schedule download is simulated.')}
          className="px-3.5 py-2 border text-xs font-extrabold rounded-xl hover:bg-muted transition-all flex items-center gap-1.5 bg-card"
        >
          <Download className="h-4 w-4" /> Download Schedule
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Assignments', value: `${assignments.length} Coursework` },
          { label: 'Pending Submission', value: `${pendingCount} Assignments` },
          { label: 'Graded Assignments', value: `${gradedCount} Graded` },
          { label: 'Status Code', value: pendingCount > 0 ? 'Pending Tasks' : 'All Clear', colorClass: pendingCount > 0 ? 'text-amber-600 font-extrabold' : 'text-emerald-600' }
        ].map((card, idx) => (
          <div key={idx} className="border bg-card p-4 rounded-2xl shadow-sm">
            <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">{card.label}</p>
            <p className={`text-sm font-black mt-1 ${card.colorClass || 'text-slate-800 dark:text-white'}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Split layout: Assignments Table & Repository submitter */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Table Panel */}
        <div className="lg:col-span-8 space-y-4">
          <div className="border bg-card rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs font-semibold">
                <thead>
                  <tr className="border-b bg-muted/20 text-[9px] uppercase font-black text-slate-400 tracking-wider">
                    <th className="p-4 text-left">Assignment Details</th>
                    <th className="p-4 text-center">Max Marks</th>
                    <th className="p-4 text-center">Due Date</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {assignments.length > 0 ? (
                    assignments.map((asg) => {
                      const submissionStatus = asg.mySubmission 
                        ? (asg.mySubmission.marksObtained !== null ? 'GRADED' : 'SUBMITTED')
                        : 'PENDING';
                      return (
                        <tr key={asg.id} className="hover:bg-muted/10 transition-colors">
                          <td className="p-4 text-left">
                            <span className="font-extrabold text-slate-800 dark:text-white block">{asg.title}</span>
                            <span className="text-[9px] font-mono text-slate-400 block mt-0.5">{asg.subject?.name} · {asg.subject?.code}</span>
                          </td>
                          <td className="p-4 text-center font-bold text-slate-700">{asg.maxMarks}</td>
                          <td className="p-4 text-center font-bold text-slate-500">{new Date(asg.dueDate).toLocaleDateString('en-IN')}</td>
                          <td className="p-4 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase ${
                              submissionStatus === 'GRADED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                              submissionStatus === 'SUBMITTED' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                              'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                              {submissionStatus}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => setSelectedAsg(asg)}
                              className="px-2.5 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 font-extrabold text-[10px]"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        No assignments mapped in your section/semester.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Action / Detail Panel */}
        <div className="lg:col-span-4">
          <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
              Assignment Workspace
            </h3>

            {selectedAsg ? (
              <div className="space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-800 dark:text-white leading-tight">
                    {selectedAsg.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold">{selectedAsg.subject?.code}</p>
                </div>

                <div className="border-t border-slate-100 pt-3 leading-relaxed text-slate-500 font-medium">
                  <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Instructions & Description</p>
                  <p>{selectedAsg.description}</p>
                </div>

                {selectedAsg.mySubmission && selectedAsg.mySubmission.marksObtained !== null && (
                  <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-1">
                    <p className="text-[10px] text-emerald-700 font-black uppercase flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" /> Evaluated Score
                    </p>
                    <p className="font-extrabold text-slate-800 text-sm">
                      {selectedAsg.mySubmission.marksObtained} / {selectedAsg.maxMarks}
                    </p>
                    {selectedAsg.mySubmission.feedback && (
                      <p className="text-[9px] text-slate-500 font-bold">Feedback: {selectedAsg.mySubmission.feedback}</p>
                    )}
                  </div>
                )}

                {selectedAsg.mySubmission && selectedAsg.mySubmission.marksObtained === null && (
                  <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-1">
                    <p className="text-[10px] text-indigo-700 font-black uppercase flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 animate-spin" /> Submitted - Grading Pending
                    </p>
                    <p className="text-[9px] text-slate-500 font-bold">Submitted URL: {selectedAsg.mySubmission.fileUrl}</p>
                    <p className="text-[9px] text-slate-500 font-bold">Date: {new Date(selectedAsg.mySubmission.submittedAt).toLocaleDateString('en-IN')}</p>
                  </div>
                )}

                {!selectedAsg.mySubmission && (
                  <form onSubmit={handleSubmit} className="space-y-3 pt-3 border-t">
                    <h5 className="text-[9px] uppercase font-bold text-slate-400">Submit Repository Link</h5>
                    <div className="flex items-center gap-2 border px-3 py-1.5 rounded-lg bg-background">
                      <GitBranch className="h-4 w-4 text-slate-400" />
                      <input
                        type="url"
                        placeholder="https://github.com/username/repo..."
                        value={gitUrl}
                        onChange={e => setGitUrl(e.target.value)}
                        className="bg-transparent text-xs outline-none w-full font-semibold bg-card text-foreground"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-black shadow hover:bg-indigo-700 transition-all flex items-center justify-center gap-1"
                    >
                      {isSubmitting ? 'Submitting...' : <>Connect Repository <ArrowRight className="h-4 w-4" /></>}
                    </button>
                  </form>
                )}

              </div>
            ) : (
              <div className="text-center py-16 text-slate-400 text-xs font-semibold">
                Select any assignment in the table to view instructions, score cards, and connect repository.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentAssignments;
