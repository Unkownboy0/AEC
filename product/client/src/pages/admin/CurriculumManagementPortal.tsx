import React, { useState, useEffect } from 'react';
import {
  BookOpen, Plus, FileSpreadsheet, Upload, Download, Copy, Shield,
  CheckCircle, AlertCircle, Layers, RefreshCw, Eye, Check, X, FileText,
  HelpCircle, Cpu, ArrowRight, Trash2, Edit3, Sparkles
} from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';
import api from '../../lib/axios';

export const CurriculumManagementPortal: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [regulations, setRegulations] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);

  // Selection filters
  const [selectedRegulationId, setSelectedRegulationId] = useState<string>('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'HIERARCHY' | 'SUBJECTS' | 'PDF_PARSER' | 'BULK_IMPORT' | 'VERSIONS'>('HIERARCHY');

  // Modal forms
  const [showRegModal, setShowRegModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);

  // Form states
  const [regForm, setRegForm] = useState({ code: '', title: '', effectiveYear: '', description: '' });
  const [dupForm, setDupForm] = useState({ sourceId: '', newCode: '', newTitle: '', newEffectiveYear: '' });
  const [subjectForm, setSubjectForm] = useState({
    name: '', code: '', credits: 3, theoryHours: 3, practicalHours: 0, tutorialHours: 0,
    internalMarks: 40, externalMarks: 60, passingMarks: 40, isElective: false, isLab: false,
    departmentId: '', programId: '', semesterId: '', regulationId: '', description: ''
  });

  // PDF Parser state
  const [pdfText, setPdfText] = useState('');
  const [parsedResult, setParsedResult] = useState<any>(null);

  useEffect(() => {
    loadMasterData();
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [selectedRegulationId, selectedDeptId, selectedProgramId, selectedSemesterId]);

  const loadMasterData = async () => {
    setLoading(true);
    try {
      const [regRes, deptRes, progRes, semRes] = await Promise.all([
        api.get('/curriculum/regulations'),
        api.get('/masters/departments'),
        api.get('/masters/programs'),
        api.get('/masters/semesters')
      ]);

      if (regRes.data?.success) setRegulations(regRes.data.data);
      if (deptRes.data?.success) setDepartments(deptRes.data.data);
      if (progRes.data?.success) setPrograms(progRes.data.data);
      if (semRes.data?.success) setSemesters(semRes.data.data);
    } catch (err) {
      console.error('Failed loading masters:', err);
      toast.error('Error loading curriculum master data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (selectedRegulationId) queryParams.append('regulationId', selectedRegulationId);
      if (selectedDeptId) queryParams.append('departmentId', selectedDeptId);
      if (selectedProgramId) queryParams.append('programId', selectedProgramId);
      if (selectedSemesterId) queryParams.append('semesterId', selectedSemesterId);

      const res = await api.get(`/curriculum/subjects?${queryParams.toString()}`);
      if (res.data?.success) {
        setSubjects(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  };

  const handleCreateRegulation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/curriculum/regulations', regForm);
      if (res.data?.success) {
        toast.success('Regulation created successfully');
        setShowRegModal(false);
        setRegForm({ code: '', title: '', effectiveYear: '', description: '' });
        loadMasterData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create regulation');
    }
  };

  const handleDuplicateRegulation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post(`/curriculum/regulations/${dupForm.sourceId}/duplicate`, {
        newCode: dupForm.newCode,
        newTitle: dupForm.newTitle,
        newEffectiveYear: dupForm.newEffectiveYear
      });
      if (res.data?.success) {
        toast.success('Regulation duplicated successfully with complete syllabus');
        setShowDuplicateModal(false);
        loadMasterData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to duplicate regulation');
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/curriculum/subjects', subjectForm);
      if (res.data?.success) {
        toast.success('Subject created and mapped into curriculum hierarchy');
        setShowSubjectModal(false);
        fetchSubjects();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create subject');
    }
  };

  const handleParsePdf = async () => {
    if (!pdfText.trim()) {
      toast.error('Please paste syllabus text extracted from PDF first');
      return;
    }
    try {
      const res = await api.post('/curriculum/parse-pdf', { text: pdfText });
      if (res.data?.success) {
        setParsedResult(res.data.data);
        toast.success('PDF syllabus parsed and structured automatically');
      }
    } catch (err: any) {
      toast.error('Failed parsing PDF text');
    }
  };

  const handlePublishCurriculum = async (regId: string) => {
    try {
      const res = await api.post(`/curriculum/regulations/${regId}/publish`);
      if (res.data?.success) {
        toast.success('Curriculum published and synchronized to Mobile App & Website');
        loadMasterData();
        fetchSubjects();
      }
    } catch (err) {
      toast.error('Failed publishing curriculum');
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-800/40">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1">
              <Shield className="w-4 h-4 text-amber-400" /> Super Admin Control Portal
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Enterprise Curriculum & Syllabus Management
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              Centralized academic hierarchy, dynamic syllabus configuration, PDF parser & multi-channel publishing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowRegModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md transition-all"
            >
              <Plus className="w-4 h-4" /> Create Regulation
            </button>
            <button
              onClick={() => setShowDuplicateModal(true)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl flex items-center gap-2 border border-white/20 backdrop-blur-md transition-all"
            >
              <Copy className="w-4 h-4" /> Duplicate Regulation
            </button>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        {[
          { id: 'HIERARCHY', label: 'Master Hierarchy Builder', icon: Layers },
          { id: 'SUBJECTS', label: `Subject Master (${subjects.length})`, icon: BookOpen },
          { id: 'PDF_PARSER', label: 'Intelligent PDF Parser', icon: Sparkles },
          { id: 'BULK_IMPORT', label: 'Bulk Upload & Excel Engine', icon: FileSpreadsheet },
          { id: 'VERSIONS', label: 'Version Control & Audit Logs', icon: RefreshCw }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/60 rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'HIERARCHY' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {regulations.map((reg) => (
              <div key={reg.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-extrabold rounded-lg border border-indigo-100">
                      {reg.code}
                    </span>
                    <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                      reg.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {reg.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">{reg.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">Effective Year: {reg.effectiveYear}</p>
                  <p className="text-xs text-slate-600 mt-2">{reg.description || 'Standard institution regulation rules and syllabus hierarchy.'}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">
                    Subjects: <strong className="text-slate-800">{reg._count?.subjects || 0}</strong>
                  </span>
                  {reg.status !== 'PUBLISHED' && (
                    <button
                      onClick={() => handlePublishCurriculum(reg.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" /> Publish
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'SUBJECTS' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedRegulationId}
                onChange={(e) => setSelectedRegulationId(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="">All Regulations</option>
                {regulations.map((r) => (
                  <option key={r.id} value={r.id}>{r.code} - {r.title}</option>
                ))}
              </select>

              <select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setSubjectForm({
                  ...subjectForm,
                  regulationId: selectedRegulationId || (regulations[0]?.id || ''),
                  departmentId: selectedDeptId || (departments[0]?.id || '')
                });
                setShowSubjectModal(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Create Subject
            </button>
          </div>

          {/* Subjects Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {subjects.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-700">No Subjects Found</p>
                <p className="text-xs mt-1">Configure new subjects or import syllabus via Excel/PDF Parser.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="p-4">Code</th>
                      <th className="p-4">Subject Name</th>
                      <th className="p-4">Dept / Program</th>
                      <th className="p-4">L-T-P</th>
                      <th className="p-4">Credits</th>
                      <th className="p-4">Approval Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {subjects.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 font-bold text-indigo-600">{sub.code}</td>
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{sub.name}</div>
                          <div className="text-[11px] text-slate-400">{sub.regulation?.code}</div>
                        </td>
                        <td className="p-4">
                          <div>{sub.department?.name || 'N/A'}</div>
                          <div className="text-[11px] text-slate-400">{sub.program?.code}</div>
                        </td>
                        <td className="p-4">{sub.theoryHours}-{sub.tutorialHours}-{sub.practicalHours}</td>
                        <td className="p-4 font-bold text-slate-900">{sub.credits}</td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800">
                            {sub.approvalStatus}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg">
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'PDF_PARSER' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Automated PDF Syllabus Extractor & Parser</h3>
              <p className="text-xs text-slate-500">Paste raw text from institution syllabus PDF document to extract Course Code, Credits, Units, and Topics.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700">Raw PDF Text Content</label>
              <textarea
                rows={12}
                value={pdfText}
                onChange={(e) => setPdfText(e.target.value)}
                placeholder="Paste PDF contents here... e.g. Course Code: CS6101 Course Title: Design and Analysis of Algorithms Credits: 4 UNIT I - Algorithm Analysis..."
                className="w-full p-4 border border-slate-200 rounded-xl text-xs font-mono bg-slate-50 text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <button
                onClick={handleParsePdf}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <Sparkles className="w-4 h-4" /> Analyze & Parse Syllabus PDF
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">Extraction Output Preview</h4>
              {!parsedResult ? (
                <p className="text-xs text-slate-400 italic py-12 text-center">Parsed JSON structure will appear here after analysis.</p>
              ) : (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-800">Detected Subject:</span> {parsedResult.detectedCode} - {parsedResult.detectedName} ({parsedResult.detectedCredits} Credits)
                  </div>
                  <div className="space-y-2">
                    <span className="font-bold text-slate-700">Detected Units ({parsedResult.unitsDetected?.length}):</span>
                    {parsedResult.unitsDetected?.map((u: any, idx: number) => (
                      <div key={idx} className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                        <div className="font-bold text-indigo-600">{u.unitNumber}: {u.name}</div>
                        <div className="text-[11px] text-slate-500">Topics count: {u.topics?.length}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Regulation */}
      {showRegModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Create Academic Regulation</h3>
            <form onSubmit={handleCreateRegulation} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Regulation Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. R2026"
                  value={regForm.code}
                  onChange={(e) => setRegForm({ ...regForm, code: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Regulations 2026 CBCS"
                  value={regForm.title}
                  onChange={(e) => setRegForm({ ...regForm, title: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Effective Year</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026-27"
                  value={regForm.effectiveYear}
                  onChange={(e) => setRegForm({ ...regForm, effectiveYear: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRegModal(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-md"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Duplicate Regulation */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Duplicate Previous Regulation</h3>
            <form onSubmit={handleDuplicateRegulation} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Source Regulation</label>
                <select
                  required
                  value={dupForm.sourceId}
                  onChange={(e) => setDupForm({ ...dupForm, sourceId: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="">Select source regulation...</option>
                  {regulations.map((r) => (
                    <option key={r.id} value={r.id}>{r.code} - {r.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">New Regulation Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. R2027"
                  value={dupForm.newCode}
                  onChange={(e) => setDupForm({ ...dupForm, newCode: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">New Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Regulations 2027 Choice Based System"
                  value={dupForm.newTitle}
                  onChange={(e) => setDupForm({ ...dupForm, newTitle: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">New Effective Year</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2027-28"
                  value={dupForm.newEffectiveYear}
                  onChange={(e) => setDupForm({ ...dupForm, newEffectiveYear: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowDuplicateModal(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-md"
                >
                  Duplicate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
