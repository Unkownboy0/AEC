import React, { useState } from 'react';
import { ClipboardList, Filter, Search, Download, Clock, AlertCircle, FileText, CheckCircle2, ChevronRight, UploadCloud, File, RefreshCw, Eye, Sparkles } from 'lucide-react';
import { toast } from '../../components/ui/Toast';

interface HomeworkItem {
  id: string;
  title: string;
  subjectCode: string;
  subjectName: string;
  faculty: string;
  dueDate: string;
  description: string;
  status: 'PENDING' | 'SUBMITTED' | 'EVALUATED' | 'LATE';
  score?: string;
  similarityScore?: number;
  rubric?: string[];
  submittedFile?: { name: string; size: string; type: string; date: string };
  remarks?: string;
}

const HOMEWORK_ITEMS: HomeworkItem[] = [
  {
    id: 'HW-01',
    title: 'Dynamic Programming Complexity & Recurrence Exercises',
    subjectCode: 'CS6101',
    subjectName: 'Design and Analysis of Algorithms',
    faculty: 'Dr. Ramesh Kumar',
    dueDate: '2026-07-28',
    description: 'Solve the recurrences and dynamic programming optimization exercises listed in the PDF. Show step-by-step state equations and asymptotic proofs.',
    status: 'PENDING',
    rubric: ['Recurrence formulations (40%)', 'Complexity analysis (30%)', 'Code correctness (30%)']
  },
  {
    id: 'HW-02',
    title: 'SQL Normalization and Schema Decomposition Project',
    subjectCode: 'CS6102',
    subjectName: 'Database Management Systems',
    faculty: 'Prof. Sangeetha S',
    dueDate: '2026-07-20',
    description: 'Decompose the given universal relation database to 3NF/BCNF schemas. Provide full functional dependency listings and query execution plans.',
    status: 'EVALUATED',
    score: '9.5 / 10',
    similarityScore: 4,
    submittedFile: { name: 'CS6102_DBMS_Normalization_Submission.pdf', size: '2.4 MB', type: 'PDF', date: '2026-07-19 14:30' },
    remarks: 'Excellent normalization steps and clear dependency preservation proof.',
    rubric: ['Lossless join verification (50%)', 'Dependency preservation (50%)']
  },
  {
    id: 'HW-03',
    title: 'Virtual Memory Paging & Replacement Simulator',
    subjectCode: 'CS6103',
    subjectName: 'Operating Systems',
    faculty: 'Dr. Amit Patel',
    dueDate: '2026-07-25',
    description: 'Develop a C/C++ or Python-based simulator tracking FIFO, LRU, and Optimal page replacement hit rates on virtual memory trace logs.',
    status: 'SUBMITTED',
    similarityScore: 8,
    submittedFile: { name: 'OS_VirtualMemory_Simulator.zip', size: '4.8 MB', type: 'ZIP', date: '2026-07-23 18:15' },
    rubric: ['Algorithm implementation (50%)', 'Trace analysis (30%)', 'Documentation (20%)']
  },
  {
    id: 'HW-04',
    title: 'Distributed System Consensus Protocol (Raft) Presentation',
    subjectCode: 'CS6104',
    subjectName: 'Distributed Systems',
    faculty: 'Dr. Evelyn Boyd',
    dueDate: '2026-08-02',
    description: 'Prepare a slide deck and recorded walkthrough analyzing Raft leader election and log replication guarantees.',
    status: 'PENDING',
    rubric: ['Protocol analysis (40%)', 'Slide design (30%)', 'Presentation video (30%)']
  }
];

export const StudentHomework: React.FC = () => {
  const [items, setItems] = useState<HomeworkItem[]>(HOMEWORK_ITEMS);
  const [selectedItem, setSelectedItem] = useState<HomeworkItem | null>(HOMEWORK_ITEMS[0]);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const filteredItems = items.filter(item => {
    if (activeFilter === 'ALL') return true;
    return item.status === activeFilter;
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ['pdf', 'docx', 'zip', 'ppt', 'pptx', 'mp4', 'png', 'jpg'];
      const ext = file.name.split('.').pop()?.toLowerCase() || '';

      if (file.size > 50 * 1024 * 1024) {
        toast.error('File size exceeds 50MB limit.');
        return;
      }

      setSelectedFile(file);
      toast.success(`Attached file: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
    }
  };

  const handleUploadSubmit = () => {
    if (!selectedItem) return;
    if (!selectedFile) {
      toast.error('Please select or drop a solution file to upload.');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(20);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          
          const submittedFileData = {
            name: selectedFile.name,
            size: `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`,
            type: selectedFile.name.split('.').pop()?.toUpperCase() || 'FILE',
            date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          };

          setItems((prevItems) =>
            prevItems.map((item) =>
              item.id === selectedItem.id
                ? {
                    ...item,
                    status: 'SUBMITTED',
                    submittedFile: submittedFileData,
                    similarityScore: Math.floor(Math.random() * 12) + 2,
                  }
                : item
            )
          );

          setSelectedItem((prev) =>
            prev
              ? {
                  ...prev,
                  status: 'SUBMITTED',
                  submittedFile: submittedFileData,
                  similarityScore: Math.floor(Math.random() * 12) + 2,
                }
              : null
          );

          toast.success(`Solution for "${selectedItem.title}" uploaded & submitted successfully!`);
          setIsSubmitting(false);
          setSelectedFile(null);
          setUploadProgress(0);
          return 100;
        }
        return prev + 25;
      });
    }, 250);
  };

  return (
    <div className="space-y-6 text-left pb-16 animate-in fade-in duration-200">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 bg-card border p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-indigo-600" /> Homework & Assignment Submission Portal
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Submit multi-format solutions (PDF, DOCX, ZIP, PPT, Video), track status, and view AI similarity scans
          </p>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Pending Homework', value: `${items.filter(i => i.status === 'PENDING').length} Tasks`, color: 'text-amber-600' },
          { label: 'Submitted & Pending Grading', value: `${items.filter(i => i.status === 'SUBMITTED').length} Tasks`, color: 'text-indigo-600' },
          { label: 'Evaluated & Graded', value: `${items.filter(i => i.status === 'EVALUATED').length} Tasks`, color: 'text-emerald-600' },
          { label: 'Average Score', value: '95.0%', color: 'text-emerald-600' }
        ].map((card, idx) => (
          <div key={idx} className="border bg-card p-4 rounded-2xl shadow-sm">
            <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">{card.label}</p>
            <p className={`text-base font-black mt-1 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Homework List */}
        <div className="lg:col-span-6 space-y-4">
          <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-4">
            
            {/* Filters */}
            <div className="flex border rounded-xl overflow-hidden text-xs font-extrabold bg-card">
              {['ALL', 'PENDING', 'SUBMITTED', 'EVALUATED'].map(status => (
                <button
                  key={status}
                  onClick={() => setActiveFilter(status)}
                  className={`flex-1 py-2.5 transition-all text-center ${
                    activeFilter === status
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Items List */}
            <div className="space-y-3">
              {filteredItems.map(item => {
                const isSelected = selectedItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`p-4 border rounded-2xl bg-background flex justify-between items-center transition-all cursor-pointer hover:border-indigo-300 ${
                      isSelected ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-900/10' : ''
                    }`}
                  >
                    <div className="space-y-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded border ${
                          item.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          item.status === 'SUBMITTED' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                          'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {item.status}
                        </span>
                        <h4 className="font-extrabold text-xs text-slate-800 dark:text-white truncate">{item.title}</h4>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold">{item.subjectName} · Due {item.dueDate}</p>
                    </div>
                    <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${isSelected ? 'text-indigo-600 translate-x-1' : 'text-slate-400'}`} />
                  </div>
                );
              })}
            </div>

          </div>
        </div>

        {/* Right Submission & Dropzone Console */}
        <div className="lg:col-span-6">
          <div className="border bg-card p-6 rounded-2xl shadow-sm space-y-5">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
              Homework details & file upload engine
            </h3>

            {selectedItem ? (
              <div className="space-y-5 text-xs font-semibold">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono font-bold text-indigo-600">{selectedItem.subjectCode}</span>
                  <h4 className="text-base font-extrabold text-slate-800 dark:text-white leading-tight">
                    {selectedItem.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold">{selectedItem.subjectName} · Faculty: {selectedItem.faculty}</p>
                </div>

                <div className="p-4 border rounded-xl bg-muted/20 text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  {selectedItem.description}
                </div>

                {selectedItem.rubric && (
                  <div className="space-y-2">
                    <h5 className="text-[10px] uppercase font-black text-slate-400">Evaluation Rubrics</h5>
                    <div className="space-y-1">
                      {selectedItem.rubric.map((r, i) => (
                        <div key={i} className="p-2 border rounded-lg bg-background text-[10px] font-bold text-slate-700 dark:text-slate-300">
                          ✓ {r}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submitted File View */}
                {selectedItem.submittedFile && (
                  <div className="p-4 border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/40 dark:bg-indigo-900/20 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-black text-indigo-600 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Submitted File Details
                      </span>
                      <span className="text-[9px] font-mono text-slate-400">{selectedItem.submittedFile.date}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-card border rounded-xl">
                      <div className="flex items-center gap-2">
                        <File className="h-5 w-5 text-indigo-600 shrink-0" />
                        <div>
                          <p className="font-extrabold text-slate-800 dark:text-white">{selectedItem.submittedFile.name}</p>
                          <p className="text-[9px] text-slate-400">{selectedItem.submittedFile.size} · {selectedItem.submittedFile.type}</p>
                        </div>
                      </div>
                      <button onClick={() => toast.info('Previewing file...')} className="p-1.5 hover:bg-muted rounded-lg text-indigo-600">
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>

                    {selectedItem.similarityScore !== undefined && (
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 dark:text-slate-300">
                        <span>AI Similarity Scan: <span className="text-emerald-600 font-extrabold">{selectedItem.similarityScore}%</span> (Original Work)</span>
                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      </div>
                    )}

                    {selectedItem.score && (
                      <div className="pt-2 border-t flex justify-between items-center">
                        <span className="text-xs font-black text-slate-800 dark:text-white">Grade Achieved: {selectedItem.score}</span>
                        <span className="text-[10px] text-emerald-600 font-bold">{selectedItem.remarks}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Upload Engine Dropzone */}
                {selectedItem.status !== 'EVALUATED' && (
                  <div className="space-y-3 border-t pt-4">
                    <h5 className="text-[10px] uppercase font-black text-slate-400">
                      {selectedItem.status === 'SUBMITTED' ? 'Resubmit Solution File' : 'Upload Solution File'}
                    </h5>

                    <label className="border-2 border-dashed border-indigo-200 dark:border-indigo-800/80 rounded-2xl p-6 text-center block cursor-pointer hover:bg-indigo-50/30 transition-all bg-card">
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.docx,.zip,.ppt,.pptx,.mp4,.png,.jpg"
                        onChange={handleFileSelect}
                      />
                      <UploadCloud className="h-8 w-8 text-indigo-600 mx-auto" />
                      <p className="text-xs font-extrabold text-slate-800 dark:text-white mt-2">
                        {selectedFile ? selectedFile.name : 'Click to select or drop solution file'}
                      </p>
                      <p className="text-[9px] text-muted-foreground font-bold mt-1">
                        Supports PDF, DOCX, ZIP, PPT, Video (MP4), Images up to 50MB
                      </p>
                    </label>

                    {isSubmitting && (
                      <div className="space-y-1">
                        <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                          <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                        </div>
                        <p className="text-[9px] text-slate-400 font-bold text-center">Uploading & scanning for plagiarism... {uploadProgress}%</p>
                      </div>
                    )}

                    <button
                      onClick={handleUploadSubmit}
                      disabled={isSubmitting || !selectedFile}
                      className="w-full py-2.5 bg-indigo-600 text-white font-extrabold text-xs rounded-xl shadow hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                    >
                      <UploadCloud className="h-4 w-4" />
                      {isSubmitting ? 'Uploading...' : selectedItem.status === 'SUBMITTED' ? 'Resubmit Solution' : 'Upload & Submit Solution'}
                    </button>
                  </div>
                )}

              </div>
            ) : (
              <div className="text-center py-16 text-slate-400 text-xs font-semibold">
                Select any homework task from the left list to view rubrics and upload solutions.
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentHomework;
