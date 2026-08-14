import React, { useState, useEffect } from 'react';
import {
  FileText,
  Table,
  Presentation,
  CheckSquare,
  Folder,
  Plus,
  Search,
  Upload,
  Download,
  Share2,
  Clock,
  Send,
  Eye,
  Edit3,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Layout,
  MessageSquare,
  Sparkles,
  Layers,
  Printer
} from 'lucide-react';
import api from '../../../lib/axios';
import { useAuth } from '../../../context/AuthContext';
import { toast } from '../../../components/ui/Toast';

type OfficeTab = 'DOCS' | 'SHEETS' | 'SLIDES' | 'FORMS' | 'DRIVE';

export const CampusOfficeWorkspace: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<OfficeTab>('DOCS');
  const [documents, setDocuments] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [driveItems, setDriveItems] = useState<any[]>([]);
  const [driveScope, setDriveScope] = useState<'PERSONAL' | 'DEPARTMENT' | 'SHARED' | 'COLLEGE'>('PERSONAL');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Active Document Editor Modal State
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [editorContent, setEditorContent] = useState<any>({});
  const [editorTitle, setEditorTitle] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Template Picker Modal
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  useEffect(() => {
    loadTemplates();
    loadDocuments();
    loadDriveItems();
  }, [activeTab, driveScope]);

  const loadTemplates = async () => {
    try {
      const res = await api.get('/campus-office/templates');
      setTemplates(res.data?.data || []);
    } catch (e) {
      console.error('Failed to load templates', e);
    }
  };

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const typeFilter = activeTab === 'DOCS' ? 'DOC' : activeTab === 'SHEETS' ? 'SHEET' : activeTab === 'SLIDES' ? 'SLIDE' : activeTab === 'FORMS' ? 'FORM' : undefined;
      const res = await api.get('/campus-office/documents', {
        params: { type: typeFilter },
      });
      setDocuments(res.data?.data || []);
    } catch (e) {
      console.error('Failed to load office documents', e);
    } finally {
      setLoading(false);
    }
  };

  const loadDriveItems = async () => {
    try {
      const res = await api.get('/campus-office/drive/items', {
        params: { scope: driveScope },
      });
      setDriveItems(res.data?.data || []);
    } catch (e) {
      console.error('Failed to load drive items', e);
    }
  };

  const handleCreateNew = async (type: string, templateKey?: string) => {
    try {
      const defaultTitle = templateKey
        ? templates.find(t => t.key === templateKey)?.title || `New ${type}`
        : `Untitled ${type} - ${new Date().toLocaleDateString()}`;

      const res = await api.post('/campus-office/documents', {
        title: defaultTitle,
        type,
        templateKey,
        contentJson: type === 'SHEET' ? { sheets: [{ sheetName: 'Sheet 1', data: [['Column A', 'Column B', 'Column C'], [10, 20, 30]] }] }
          : type === 'SLIDE' ? { slides: [{ title: defaultTitle, content: 'Add presentation content...' }] }
          : type === 'FORM' ? { questions: [{ id: 'q1', type: 'SHORT_ANSWER', title: 'Question 1', required: true }] }
          : { sections: [{ heading: '1. Introduction', text: 'Start writing document content here...' }] },
      });

      toast.success(`${type} created successfully`);
      setShowTemplatePicker(false);
      loadDocuments();
      openEditor(res.data?.data);
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to create document');
    }
  };

  const openEditor = (doc: any) => {
    setSelectedDoc(doc);
    setEditorTitle(doc.title);
    try {
      setEditorContent(JSON.parse(doc.contentJson || '{}'));
    } catch {
      setEditorContent({});
    }
  };

  const handleSaveDocument = async () => {
    if (!selectedDoc) return;
    try {
      await api.put(`/campus-office/documents/${selectedDoc.id}`, {
        title: editorTitle,
        contentJson: editorContent,
      });
      toast.success('Document changes saved');
      loadDocuments();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to save document');
    }
  };

  const handleSubmitForReview = async (step: 'HOD' | 'DEAN' | 'PRINCIPAL') => {
    if (!selectedDoc) return;
    setIsSubmittingReview(true);
    try {
      await api.post(`/campus-office/documents/${selectedDoc.id}/submit-review`, {
        targetWorkflowStep: step,
        submissionRemarks: `Submitted for ${step} review`,
      });
      toast.success(`Document submitted to ${step} for review`);
      loadDocuments();
      setSelectedDoc(null);
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to submit document');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleReviewAction = async (action: 'APPROVE' | 'RETURN') => {
    if (!selectedDoc) return;
    try {
      await api.post(`/campus-office/documents/${selectedDoc.id}/review`, {
        action,
        commentText: commentText || (action === 'APPROVE' ? 'Approved' : 'Returned for revision'),
      });
      toast.success(`Document ${action === 'APPROVE' ? 'approved' : 'returned for correction'}`);
      setCommentText('');
      loadDocuments();
      setSelectedDoc(null);
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to process review');
    }
  };

  const filteredDocs = documents.filter(d =>
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    (d.templateKey && d.templateKey.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-sm tracking-wide uppercase">
            <Layers className="h-4 w-4" />
            CampusOS Productivity Suite
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight mt-1">Campus Office & Collaborative Workspace</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Native word documents, spreadsheets, presentations, forms & campus file drive with review workflows.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTemplatePicker(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-sm hover:opacity-95 transition"
          >
            <Plus className="h-4 w-4" />
            Create Document
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border gap-2 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('DOCS')}
          className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-sm rounded-xl transition ${
            activeTab === 'DOCS' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <FileText className="h-4 w-4" />
          Documents & Reports
        </button>
        <button
          onClick={() => setActiveTab('SHEETS')}
          className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-sm rounded-xl transition ${
            activeTab === 'SHEETS' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <Table className="h-4 w-4" />
          Spreadsheets
        </button>
        <button
          onClick={() => setActiveTab('SLIDES')}
          className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-sm rounded-xl transition ${
            activeTab === 'SLIDES' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <Presentation className="h-4 w-4" />
          Presentations
        </button>
        <button
          onClick={() => setActiveTab('FORMS')}
          className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-sm rounded-xl transition ${
            activeTab === 'FORMS' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <CheckSquare className="h-4 w-4" />
          Forms & Surveys
        </button>
        <button
          onClick={() => setActiveTab('DRIVE')}
          className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-sm rounded-xl transition ${
            activeTab === 'DRIVE' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <Folder className="h-4 w-4" />
          Campus Drive
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab !== 'DRIVE' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={`Search ${activeTab.toLowerCase()}...`}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-44 bg-muted/40 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-dashed border-border">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-bold">No documents created yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
                Start from a clean slate or pick a pre-formatted institutional template.
              </p>
              <button
                onClick={() => setShowTemplatePicker(true)}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl"
              >
                Choose Template
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocs.map(doc => (
                <div
                  key={doc.id}
                  onClick={() => openEditor(doc)}
                  className="bg-card border border-border hover:border-primary/50 transition p-5 rounded-2xl cursor-pointer flex flex-col justify-between group shadow-sm hover:shadow"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg ${
                        doc.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-600' :
                        doc.status === 'IN_REVIEW' ? 'bg-amber-500/10 text-amber-600' :
                        doc.status === 'RETURNED' ? 'bg-rose-500/10 text-rose-600' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {doc.status} (v{doc.currentVersion})
                      </span>
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase">{doc.type}</span>
                    </div>
                    <h3 className="font-bold text-base group-hover:text-primary transition line-clamp-2">{doc.title}</h3>
                    {doc.templateKey && (
                      <p className="text-xs font-semibold text-primary mt-1 flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> Template: {doc.templateKey}
                      </p>
                    )}
                  </div>
                  <div className="border-t border-border/70 pt-3 mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(doc.updatedAt).toLocaleDateString()}
                    </span>
                    <span>{doc.author?.firstName} {doc.author?.lastName}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Campus Drive View */
        <div className="space-y-4">
          <div className="flex gap-2">
            {(['PERSONAL', 'DEPARTMENT', 'SHARED', 'COLLEGE'] as const).map(scope => (
              <button
                key={scope}
                onClick={() => setDriveScope(scope)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition ${
                  driveScope === scope ? 'bg-foreground text-background' : 'bg-card border border-border text-muted-foreground'
                }`}
              >
                {scope === 'PERSONAL' ? 'My Files' : scope === 'DEPARTMENT' ? 'Department Drive' : scope === 'SHARED' ? 'Shared With Me' : 'College Drive'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {driveItems.map(item => (
              <div key={item.id} className="bg-card border border-border p-4 rounded-xl flex flex-col items-center text-center gap-2 hover:border-primary/40 cursor-pointer">
                {item.isFolder ? <Folder className="h-8 w-8 text-amber-500" /> : <FileText className="h-8 w-8 text-primary" />}
                <span className="text-xs font-semibold line-clamp-2">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Template Picker Modal */}
      {showTemplatePicker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Choose a Document Template</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Pick a pre-configured institutional layout or blank template.</p>
              </div>
              <button onClick={() => setShowTemplatePicker(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div
                  onClick={() => handleCreateNew('DOC')}
                  className="p-4 border border-border rounded-xl hover:border-primary cursor-pointer transition bg-background flex items-start gap-3"
                >
                  <FileText className="h-6 w-6 text-primary shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm">Blank Document</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Empty rich text document for memos, circulars or notes.</p>
                  </div>
                </div>

                <div
                  onClick={() => handleCreateNew('SHEET')}
                  className="p-4 border border-border rounded-xl hover:border-primary cursor-pointer transition bg-background flex items-start gap-3"
                >
                  <Table className="h-6 w-6 text-emerald-500 shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm">Blank Spreadsheet</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Multi-sheet grid for marks, calculations, and tables.</p>
                  </div>
                </div>

                {templates.map(tmpl => (
                  <div
                    key={tmpl.key}
                    onClick={() => handleCreateNew(tmpl.type, tmpl.key)}
                    className="p-4 border border-border rounded-xl hover:border-primary cursor-pointer transition bg-background flex items-start gap-3"
                  >
                    <Layout className="h-6 w-6 text-indigo-500 shrink-0" />
                    <div>
                      <h4 className="font-bold text-sm">{tmpl.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{tmpl.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Editor Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 md:p-6">
          <div className="bg-card border border-border rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Editor Header */}
            <div className="p-4 border-b border-border flex items-center justify-between gap-4 bg-muted/20">
              <div className="flex-1 max-w-lg">
                <input
                  type="text"
                  value={editorTitle}
                  onChange={e => setEditorTitle(e.target.value)}
                  className="w-full bg-transparent font-bold text-lg outline-none focus:border-b border-primary"
                />
                <span className="text-xs text-muted-foreground">Status: {selectedDoc.status} · Version {selectedDoc.currentVersion}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    const docEl = document.getElementById('campus-office-doc-body');
                    if (!docEl) return;
                    try {
                      const { exportElementToWatermarkedPdf } = await import('../../../services/pdfExportService');
                      await exportElementToWatermarkedPdf(docEl, `${editorTitle || 'Document'}.pdf`, {
                        orientation: selectedDoc.type === 'SHEET' ? 'landscape' : 'portrait',
                        watermarkOpacity: 0.045,
                      });
                      toast.success('Document exported as watermarked PDF.');
                    } catch (e) {
                      toast.error('Failed to export PDF');
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border text-foreground text-xs font-semibold rounded-lg hover:bg-muted"
                  title="Download Official Watermarked PDF"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export PDF
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border text-foreground text-xs font-semibold rounded-lg hover:bg-muted"
                  title="Official Browser Print"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print
                </button>
                <button
                  onClick={handleSaveDocument}
                  className="px-3.5 py-1.5 bg-muted text-foreground text-xs font-semibold rounded-lg hover:bg-muted/80"
                >
                  Save Draft
                </button>
                <button
                  onClick={() => handleSubmitForReview('HOD')}
                  disabled={isSubmittingReview}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90"
                >
                  <Send className="h-3.5 w-3.5" />
                  Submit to HOD
                </button>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="p-1.5 text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Editor Body */}
            <div id="campus-office-doc-body" className="relative flex-1 p-6 overflow-y-auto space-y-4 bg-background">
              {/* Institutional Watermark Layer for Office Docs */}
              <div aria-hidden="true" className="print-watermark-overlay pointer-events-none absolute inset-0 z-0 flex items-center justify-center select-none overflow-hidden">
                <img
                  src="/branding/al-ameen-logo.png"
                  alt=""
                  className="w-1/2 max-w-[380px] opacity-[0.04] object-contain filter grayscale contrast-125"
                />
              </div>
              {selectedDoc.type === 'REPORT' || selectedDoc.type === 'DOC' ? (
                <div className="max-w-3xl mx-auto space-y-4">
                  {(editorContent.sections || []).map((sec: any, idx: number) => (
                    <div key={idx} className="bg-card p-4 rounded-xl border border-border space-y-2">
                      <input
                        type="text"
                        value={sec.heading}
                        onChange={e => {
                          const updated = { ...editorContent };
                          updated.sections[idx].heading = e.target.value;
                          setEditorContent(updated);
                        }}
                        className="w-full font-bold text-base bg-transparent border-b border-border/50 pb-1 outline-none"
                      />
                      <textarea
                        rows={3}
                        value={sec.text || ''}
                        onChange={e => {
                          const updated = { ...editorContent };
                          updated.sections[idx].text = e.target.value;
                          setEditorContent(updated);
                        }}
                        className="w-full text-sm bg-transparent outline-none resize-none"
                      />
                    </div>
                  ))}
                </div>
              ) : selectedDoc.type === 'SHEET' ? (
                <div className="overflow-x-auto bg-card rounded-xl border border-border p-4">
                  <table className="w-full text-xs text-left border-collapse">
                    <tbody>
                      {((editorContent.sheets?.[0]?.data) || []).map((row: any[], rIdx: number) => (
                        <tr key={rIdx} className="border-b border-border/50">
                          {row.map((cell: any, cIdx: number) => (
                            <td key={cIdx} className="p-2 border-r border-border/50 font-mono">
                              <input
                                type="text"
                                value={cell}
                                onChange={e => {
                                  const updated = { ...editorContent };
                                  updated.sheets[0].data[rIdx][cIdx] = e.target.value;
                                  setEditorContent(updated);
                                }}
                                className="bg-transparent w-full outline-none"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  Structured editor active for {selectedDoc.type}.
                </div>
              )}
            </div>

            {/* Review Comments Bar */}
            {selectedDoc.status === 'IN_REVIEW' && (
              <div className="p-4 border-t border-border bg-card flex items-center justify-between gap-4">
                <input
                  type="text"
                  placeholder="Review comments / corrections..."
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  className="flex-1 bg-background px-3 py-1.5 text-xs rounded-lg border border-border outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReviewAction('RETURN')}
                    className="px-3 py-1.5 bg-rose-500/10 text-rose-600 font-semibold text-xs rounded-lg"
                  >
                    Return for Revision
                  </button>
                  <button
                    onClick={() => handleReviewAction('APPROVE')}
                    className="px-3 py-1.5 bg-emerald-500 text-white font-semibold text-xs rounded-lg"
                  >
                    Approve Document
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CampusOfficeWorkspace;
