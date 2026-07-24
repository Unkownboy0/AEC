import React, { useState } from 'react';
import { FolderOpen, Download, Upload, CheckCircle, Clock, AlertCircle, FileText, Shield, Eye } from 'lucide-react';
import { toast } from '../../components/ui/Toast';

interface Document {
  id: string;
  name: string;
  category: string;
  status: 'VERIFIED' | 'PENDING' | 'MISSING';
  uploadedOn?: string;
  size?: string;
  url?: string;
}

const DOCUMENTS: Document[] = [
  { id: '1', name: 'Bonafide Certificate.pdf', category: 'College Issued', status: 'VERIFIED', uploadedOn: '2026-06-01', size: '124 KB', url: '#' },
  { id: '2', name: 'Conduct Certificate.pdf', category: 'College Issued', status: 'VERIFIED', uploadedOn: '2026-06-01', size: '98 KB', url: '#' },
  { id: '3', name: 'Consolidated Marksheet.pdf', category: 'Academic', status: 'VERIFIED', uploadedOn: '2026-05-20', size: '345 KB', url: '#' },
  { id: '4', name: 'Semester Marksheets (1–6).pdf', category: 'Academic', status: 'VERIFIED', uploadedOn: '2026-05-20', size: '820 KB', url: '#' },
  { id: '5', name: 'Aadhar Card (Masked).pdf', category: 'Identity', status: 'VERIFIED', uploadedOn: '2026-04-15', size: '210 KB', url: '#' },
  { id: '6', name: 'PAN Card.pdf', category: 'Identity', status: 'VERIFIED', uploadedOn: '2026-04-15', size: '188 KB', url: '#' },
  { id: '7', name: 'Community Certificate.pdf', category: 'Identity', status: 'VERIFIED', uploadedOn: '2026-04-10', size: '156 KB', url: '#' },
  { id: '8', name: '10th Marksheet.pdf', category: 'Academic', status: 'VERIFIED', uploadedOn: '2026-03-01', size: '290 KB', url: '#' },
  { id: '9', name: '12th Marksheet.pdf', category: 'Academic', status: 'VERIFIED', uploadedOn: '2026-03-01', size: '315 KB', url: '#' },
  { id: '10', name: 'Passport.pdf', category: 'Identity', status: 'PENDING', uploadedOn: '2026-07-01', size: '440 KB', url: '#' },
  { id: '11', name: 'Driving License.pdf', category: 'Identity', status: 'MISSING' },
  { id: '12', name: 'Migration Certificate.pdf', category: 'Academic', status: 'MISSING' },
];

const CATEGORY_COLORS: Record<string, string> = {
  'College Issued': 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400',
  'Academic': 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Identity': 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400',
};

export const StudentDocuments: React.FC = () => {
  const [documents] = useState<Document[]>(DOCUMENTS);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const categories = ['ALL', ...Array.from(new Set(documents.map(d => d.category)))];
  const filtered = documents.filter(d => {
    const matchFilter = activeFilter === 'ALL' || d.category === activeFilter;
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const verifiedCount = documents.filter(d => d.status === 'VERIFIED').length;
  const pendingCount = documents.filter(d => d.status === 'PENDING').length;
  const missingCount = documents.filter(d => d.status === 'MISSING').length;

  return (
    <div className="space-y-6 text-left pb-12 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-indigo-600" /> Academic Documents Vault
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Securely store and access all your academic & identity documents</p>
        </div>
        <button onClick={() => toast.info('Document request form will be available soon.')}
          className="px-4 py-2 border text-xs font-extrabold rounded-xl hover:bg-muted flex items-center gap-1.5 bg-card">
          <FileText className="h-4 w-4" /> Request New Certificate
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Verified', value: verifiedCount, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: <CheckCircle className="h-4 w-4 text-emerald-500" /> },
          { label: 'Pending Verification', value: pendingCount, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', icon: <Clock className="h-4 w-4 text-amber-500" /> },
          { label: 'Not Uploaded', value: missingCount, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20', icon: <AlertCircle className="h-4 w-4 text-rose-500" /> },
        ].map((s, idx) => (
          <div key={idx} className={`border p-4 rounded-2xl shadow-sm flex items-center gap-3 ${s.bg}`}>
            {s.icon}
            <div>
              <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">{s.label}</p>
              <p className={`text-lg font-black ${s.color}`}>{s.value} docs</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col md:flex-row gap-3 items-center">
        <div className="flex flex-1 w-full items-center gap-2 border px-3 py-1.5 rounded-xl bg-card">
          <FileText className="h-4 w-4 text-slate-400" />
          <input type="text" placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-xs outline-none w-full font-semibold" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveFilter(cat)}
              className={`px-3 py-1.5 text-[10px] font-black rounded-xl border transition-colors ${activeFilter === cat ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-card hover:bg-muted'}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(doc => (
          <div key={doc.id} className={`border bg-card p-4 rounded-2xl shadow-sm space-y-3 hover:shadow-md transition-all ${doc.status === 'MISSING' ? 'border-dashed opacity-70' : ''}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-muted/50 shrink-0">
                  <FileText className="h-4 w-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-800 dark:text-white leading-tight line-clamp-2">{doc.name}</p>
                  {doc.size && <p className="text-[9px] text-slate-400 font-bold mt-0.5">{doc.size}</p>}
                </div>
              </div>
              <span className={`text-[8.5px] font-black uppercase px-1.5 py-0.5 rounded border shrink-0 ${
                doc.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                doc.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                'bg-slate-100 text-slate-500 border-slate-200'
              }`}>{doc.status}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded border ${CATEGORY_COLORS[doc.category] || 'bg-muted text-muted-foreground'}`}>
                {doc.category}
              </span>
              <div className="flex gap-1">
                {doc.status !== 'MISSING' ? (
                  <>
                    <button onClick={() => toast.info(`Previewing: ${doc.name}`)} title="Preview"
                      className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                      <Eye className="h-3.5 w-3.5 text-slate-500" />
                    </button>
                    <button onClick={() => toast.success(`Downloading: ${doc.name}`)} title="Download"
                      className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                      <Download className="h-3.5 w-3.5 text-indigo-500" />
                    </button>
                  </>
                ) : (
                  <button onClick={() => toast.info('Upload feature coming soon. Please visit the admin office.')}
                    className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                    <Upload className="h-3.5 w-3.5 text-rose-400" />
                  </button>
                )}
              </div>
            </div>
            {doc.uploadedOn && (
              <p className="text-[9px] text-slate-400 font-bold">Uploaded: {new Date(doc.uploadedOn).toLocaleDateString('en-IN')}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentDocuments;
