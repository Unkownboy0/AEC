import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Download, Star, Info, FileText, BarChart2, Layers, Cpu, Code2, Database, Network, ExternalLink, HelpCircle, CheckCircle, FileCheck, Layers3 } from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';
import api from '../../lib/axios';

export const StudentSyllabus: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [curriculumData, setCurriculumData] = useState<any>(null);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'UNITS' | 'OUTCOMES' | 'MATERIALS' | 'QUESTIONS' | 'LABS'>('UNITS');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchStudentCurriculum();
  }, []);

  const fetchStudentCurriculum = async () => {
    setLoading(true);
    try {
      const res = await api.get('/curriculum/student-view');
      if (res.data?.success && res.data.data) {
        setCurriculumData(res.data.data);
        if (res.data.data.subjects && res.data.data.subjects.length > 0) {
          setSelectedSubject(res.data.data.subjects[0]);
        }
      }
    } catch (err: any) {
      console.error('Failed to load curriculum from database:', err);
      toast.error('Unable to fetch curriculum data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  const subjects = curriculumData?.subjects || [];
  const filteredSubjects = subjects.filter((s: any) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-blue-800/40">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-1">
              <BookOpen className="w-4 h-4" /> Academic Curriculum & Dynamic Syllabus
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {curriculumData?.department?.name || 'Academic Syllabus'}
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              {curriculumData?.program?.code ? `${curriculumData.program.code} - ` : ''}
              {curriculumData?.semester?.name ? `${curriculumData.semester.name} ` : 'Enrolled Semester'}
              (Database Synchronized)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-medium border border-white/10">
              Total Enrolled Subjects: <span className="font-bold text-blue-300">{subjects.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Subjects List + Detailed Content Viewer */}
      {subjects.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No Curriculum Available</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
            No active curriculum or published syllabus has been assigned to your department & semester yet by the Super Admin.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Subjects List */}
          <div className="lg:col-span-4 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search subject code or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white text-slate-800 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
              />
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredSubjects.map((sub: any) => {
                const isSelected = selectedSubject?.id === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubject(sub)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-600/30'
                        : 'bg-white text-slate-800 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                        {sub.code}
                      </span>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        sub.isLab ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {sub.credits} Credits
                      </span>
                    </div>
                    <h4 className="font-bold text-sm mt-2 line-clamp-1">{sub.name}</h4>
                    <div className="flex items-center gap-3 mt-2 text-[11px] opacity-80">
                      <span>L-T-P: {sub.theoryHours}-{sub.tutorialHours}-{sub.practicalHours}</span>
                      <span>•</span>
                      <span>CIA: {sub.internalMarks} / ESE: {sub.externalMarks}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Detailed Subject Details */}
          {selectedSubject && (
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-md">
                        {selectedSubject.code}
                      </span>
                      <span className="bg-slate-200 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-md">
                        {selectedSubject.regulation?.code || 'Current Regulation'}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mt-2">{selectedSubject.name}</h2>
                    <p className="text-slate-500 text-sm mt-1">{selectedSubject.description || 'Comprehensive syllabus modules, course outcomes, learning materials and question banks.'}</p>
                  </div>
                </div>

                {/* Subject Tabs */}
                <div className="flex items-center gap-2 mt-6 overflow-x-auto border-b border-slate-200 pb-px">
                  {[
                    { id: 'UNITS', label: `Units & Topics (${selectedSubject.curriculumUnits?.length || 0})`, icon: Layers },
                    { id: 'OUTCOMES', label: `Course Outcomes (${selectedSubject.courseOutcomes?.length || 0})`, icon: FileCheck },
                    { id: 'MATERIALS', label: `Study Materials (${selectedSubject.materials?.length || 0})`, icon: FileText },
                    { id: 'QUESTIONS', label: `Question Bank (${selectedSubject.questionBankItems?.length || 0})`, icon: HelpCircle },
                    { id: 'LABS', label: `Lab Experiments (${selectedSubject.labExperiments?.length || 0})`, icon: Cpu }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                          isActive
                            ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
                            : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Body Content */}
              <div className="p-6 space-y-4 flex-1">
                {activeTab === 'UNITS' && (
                  <div className="space-y-4">
                    {(!selectedSubject.curriculumUnits || selectedSubject.curriculumUnits.length === 0) ? (
                      <p className="text-sm text-slate-400 italic text-center py-8">No Units Found for this subject.</p>
                    ) : (
                      selectedSubject.curriculumUnits.map((unit: any, idx: number) => (
                        <div key={unit.id || idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                              {unit.unitNumber}
                            </span>
                            <span className="text-xs font-medium text-slate-500">{unit.totalHours} Hours</span>
                          </div>
                          <h4 className="font-bold text-slate-800 text-base">{unit.name}</h4>
                          {unit.description && <p className="text-xs text-slate-600 mt-1">{unit.description}</p>}

                          {unit.topics && unit.topics.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-200/60">
                              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Syllabus Topics</span>
                              <div className="space-y-1.5">
                                {unit.topics.map((t: any, i: number) => (
                                  <div key={t.id || i} className="text-xs text-slate-700 flex items-start gap-2">
                                    <span className="text-blue-500 font-bold">•</span>
                                    <div>
                                      <span className="font-semibold text-slate-800">{t.title}</span>
                                      {t.subTopics && <p className="text-[11px] text-slate-500 mt-0.5">{t.subTopics}</p>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'OUTCOMES' && (
                  <div className="space-y-3">
                    {(!selectedSubject.courseOutcomes || selectedSubject.courseOutcomes.length === 0) ? (
                      <p className="text-sm text-slate-400 italic text-center py-8">No Course Outcomes Defined.</p>
                    ) : (
                      selectedSubject.courseOutcomes.map((co: any, idx: number) => (
                        <div key={co.id || idx} className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                                {co.code}
                              </span>
                              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
                                Bloom: {co.bloomLevel}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-slate-800 mt-1">{co.description}</p>
                          </div>

                          {co.mappings && co.mappings.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {co.mappings.map((m: any, i: number) => (
                                <span key={i} className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-1 rounded">
                                  {m.targetCode}: Level {m.correlationLevel}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'MATERIALS' && (
                  <div className="space-y-3">
                    {(!selectedSubject.materials || selectedSubject.materials.length === 0) ? (
                      <p className="text-sm text-slate-400 italic text-center py-8">No Study Materials</p>
                    ) : (
                      selectedSubject.materials.map((mat: any, idx: number) => (
                        <div key={mat.id || idx} className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                              {mat.type.substring(0, 3)}
                            </div>
                            <div>
                              <h5 className="font-bold text-slate-800 text-sm">{mat.title}</h5>
                              <span className="text-xs text-slate-400">{mat.type} • Published by {mat.authorName || 'Faculty'}</span>
                            </div>
                          </div>

                          <a
                            href={mat.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" /> Download
                          </a>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'QUESTIONS' && (
                  <div className="space-y-3">
                    {(!selectedSubject.questionBankItems || selectedSubject.questionBankItems.length === 0) ? (
                      <p className="text-sm text-slate-400 italic text-center py-8">No Question Bank Available.</p>
                    ) : (
                      selectedSubject.questionBankItems.map((q: any, idx: number) => (
                        <div key={q.id || idx} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-100">
                              {q.category}
                            </span>
                            <span className="text-[10px] font-medium text-slate-400">Difficulty: {q.difficulty}</span>
                          </div>
                          <p className="text-sm font-semibold text-slate-800">{q.question}</p>
                          {q.answer && <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100"><strong>Ans:</strong> {q.answer}</p>}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'LABS' && (
                  <div className="space-y-3">
                    {(!selectedSubject.labExperiments || selectedSubject.labExperiments.length === 0) ? (
                      <p className="text-sm text-slate-400 italic text-center py-8">No Lab Experiments Documented.</p>
                    ) : (
                      selectedSubject.labExperiments.map((exp: any, idx: number) => (
                        <div key={exp.id || idx} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
                              Exp #{exp.expNumber}
                            </span>
                            <h5 className="font-bold text-slate-800 text-sm">{exp.title}</h5>
                          </div>
                          {exp.objective && <p className="text-xs text-slate-600"><strong>Objective:</strong> {exp.objective}</p>}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentSyllabus;
