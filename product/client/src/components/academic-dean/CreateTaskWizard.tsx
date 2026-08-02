import React, { useState, useEffect } from 'react';
import {
  CheckCircle, ChevronRight, ChevronLeft, Upload, Plus, Trash2,
  FileText, Calendar, AlertCircle, Users, Building, Shield, Sparkles, X
} from 'lucide-react';
import { toast } from '../ui/Toast';
import api from '../../lib/axios';

interface CreateTaskWizardProps {
  onClose: () => void;
  onTaskCreated: () => void;
}

export const CreateTaskWizard: React.FC<CreateTaskWizardProps> = ({ onClose, onTaskCreated }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'ACADEMIC_REPORT',
    description: '',
    expectedOutput: '',
    instructions: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    confidentialityLevel: 'INTERNAL' as 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED',
    assignmentMode: 'ALL_HODS' as 'ALL_HODS' | 'ALL_DEPARTMENTS' | 'SINGLE_DEPARTMENT' | 'MULTIPLE_DEPARTMENTS' | 'SINGLE_HOD' | 'MULTIPLE_HODS',
    selectedDeptIds: [] as string[],
    selectedHodIds: [] as string[],
    startAt: new Date().toISOString().slice(0, 10),
    dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    reminderConfig: {
      reminder7Days: true,
      reminder3Days: true,
      reminder1Day: true,
      reminderDueDay: true,
      overdueReminder: true,
    },
    submissionRequirements: {
      requiredFileTypes: ['.xlsx', '.pdf'],
      textResponseRequired: true,
      excelRequired: true,
      pdfRequired: false,
      checklistItems: [
        'Upload completed data file',
        'Enter total count and summary remarks',
        'Confirm data has been verified by department HOD',
      ],
    },
    publishImmediately: true,
  });

  const [newChecklistItem, setNewChecklistItem] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/academic-dean/departments');
      setDepartments(res.data.data || []);
    } catch (_) {}
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    setFormData({
      ...formData,
      submissionRequirements: {
        ...formData.submissionRequirements,
        checklistItems: [...formData.submissionRequirements.checklistItems, newChecklistItem.trim()],
      },
    });
    setNewChecklistItem('');
  };

  const handleRemoveChecklistItem = (index: number) => {
    const updated = [...formData.submissionRequirements.checklistItems];
    updated.splice(index, 1);
    setFormData({
      ...formData,
      submissionRequirements: {
        ...formData.submissionRequirements,
        checklistItems: updated,
      },
    });
  };

  const handleSubmitTask = async (publish: boolean) => {
    if (!formData.title.trim()) {
      toast.error('Task title is required');
      setCurrentStep(1);
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/academic-dean/tasks', {
        ...formData,
        departmentIds: formData.selectedDeptIds,
        hodUserIds: formData.selectedHodIds,
        publishImmediately: publish,
      });

      toast.success(publish ? 'Task published successfully to assigned HODs!' : 'Task saved as draft');
      onTaskCreated();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create academic task');
    } fontally: {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { num: 1, name: 'Basic Details' },
    { num: 2, name: 'Assignment Scope' },
    { num: 3, name: 'Reference Files' },
    { num: 4, name: 'Requirements' },
    { num: 5, name: 'Timeline & Reminders' },
    { num: 6, name: 'Review & Publish' },
  ];

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-muted/30">
          <div>
            <h3 className="text-base font-extrabold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Create Academic Dean Task
            </h3>
            <p className="text-xs text-muted-foreground">Assign structured tasks to HODs with automated tracking</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b px-6 py-3 bg-muted/10">
          {steps.map((s) => (
            <div
              key={s.num}
              onClick={() => setCurrentStep(s.num)}
              className={`flex items-center gap-2 text-xs font-semibold cursor-pointer ${
                currentStep === s.num
                  ? 'text-primary font-bold'
                  : currentStep > s.num
                  ? 'text-foreground'
                  : 'text-muted-foreground/60'
              }`}
            >
              <span
                className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  currentStep === s.num
                    ? 'bg-primary text-primary-foreground'
                    : currentStep > s.num
                    ? 'bg-green-500/20 text-green-600'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {currentStep > s.num ? '✓' : s.num}
              </span>
              <span className="hidden md:inline">{s.name}</span>
            </div>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* STEP 1: Basic Details */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Task Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Submit Semester Student Attendance & Result Analysis Report"
                  className="w-full text-xs bg-background border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Task Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full text-xs bg-background border rounded-lg p-2.5 outline-none"
                  >
                    <option value="ACADEMIC_REPORT">Academic Report</option>
                    <option value="STUDENT_DETAILS">Student Details</option>
                    <option value="FACULTY_DETAILS">Faculty Details</option>
                    <option value="ATTENDANCE_REPORT">Attendance Report</option>
                    <option value="RESULT_ANALYSIS">Result Analysis</option>
                    <option value="CURRICULUM_REVIEW">Curriculum Review</option>
                    <option value="TIMETABLE_REVIEW">Timetable Review</option>
                    <option value="ACCREDITATION_DATA">Accreditation Data (NAAC/NBA)</option>
                    <option value="COMPLIANCE_REPORT">Compliance Report</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Priority Level</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full text-xs bg-background border rounded-lg p-2.5 outline-none font-semibold"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Task Description & Instructions</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide detailed instructions for HODs regarding data collection, formulas, and format expectations..."
                  className="w-full text-xs bg-background border rounded-lg p-3 min-h-[100px] outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Expected Output Format</label>
                <input
                  type="text"
                  value={formData.expectedOutput}
                  onChange={(e) => setFormData({ ...formData, expectedOutput: e.target.value })}
                  placeholder="e.g. Filled Excel file matching reference template + HOD signed summary PDF"
                  className="w-full text-xs bg-background border rounded-lg p-2.5 outline-none"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Assignment Scope */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <label className="text-xs font-bold text-foreground">Select Recipient Scope *</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { mode: 'ALL_HODS', title: 'All HODs', desc: 'Assign to active HOD of every active department' },
                  { mode: 'MULTIPLE_DEPARTMENTS', title: 'Selected Departments', desc: 'Select specific departments to resolve HODs' },
                  { mode: 'SINGLE_DEPARTMENT', title: 'Single Department', desc: 'Assign to HOD of one specific department' },
                ].map((item) => (
                  <div
                    key={item.mode}
                    onClick={() => setFormData({ ...formData, assignmentMode: item.mode as any })}
                    className={`p-3.5 border rounded-xl cursor-pointer transition-all ${
                      formData.assignmentMode === item.mode
                        ? 'border-primary bg-primary/5 shadow-xs'
                        : 'bg-card hover:bg-muted/40'
                    }`}
                  >
                    <h4 className="text-xs font-bold text-foreground flex items-center justify-between">
                      {item.title}
                      {formData.assignmentMode === item.mode && <CheckCircle className="h-4 w-4 text-primary" />}
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>

              {(formData.assignmentMode === 'MULTIPLE_DEPARTMENTS' || formData.assignmentMode === 'SINGLE_DEPARTMENT') && (
                <div className="space-y-2 pt-2 border-t">
                  <label className="text-xs font-bold text-foreground">Select Department(s)</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {departments.map((dept) => (
                      <label
                        key={dept.id}
                        className={`flex items-center gap-2 p-2 border rounded-lg text-xs font-semibold cursor-pointer ${
                          formData.selectedDeptIds.includes(dept.id) ? 'bg-primary/10 border-primary' : 'bg-card'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.selectedDeptIds.includes(dept.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, selectedDeptIds: [...formData.selectedDeptIds, dept.id] });
                            } else {
                              setFormData({
                                ...formData,
                                selectedDeptIds: formData.selectedDeptIds.filter((id) => id !== dept.id),
                              });
                            }
                          }}
                        />
                        <span>{dept.code} - {dept.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Reference Files */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center space-y-2 bg-primary/5">
                <Upload className="h-8 w-8 text-primary mx-auto" />
                <h4 className="text-xs font-bold">Upload Reference Documents / Formats</h4>
                <p className="text-[11px] text-muted-foreground">
                  Attach Excel format template (.xlsx), Guidelines (.pdf), or DOCX reference files for HOD download.
                </p>
                <button
                  type="button"
                  onClick={() => toast.info('Reference file upload simulated (integrated with task backend)')}
                  className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold cursor-pointer hover:bg-primary/90"
                >
                  Browse Files
                </button>
              </div>

              <div className="bg-card border rounded-xl p-3 text-xs space-y-2">
                <h5 className="font-bold text-muted-foreground uppercase text-[10px]">Reference File Checklist</h5>
                <div className="flex items-center justify-between p-2 bg-muted/40 rounded-lg">
                  <span className="font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-emerald-600" /> Reference_Student_Academic_Format_2026.xlsx
                  </span>
                  <span className="text-[10px] text-muted-foreground">Standard Template</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Submission Requirements */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">HOD Submission Checklist Requirements</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    placeholder="e.g. Upload department head approved Excel sheet"
                    className="flex-1 text-xs bg-background border rounded-lg p-2 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddChecklistItem}
                    className="px-3 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg"
                  >
                    Add Requirement
                  </button>
                </div>

                <div className="space-y-1.5 pt-2">
                  {formData.submissionRequirements.checklistItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-muted/40 p-2.5 rounded-lg text-xs">
                      <span className="font-semibold text-foreground">☐ {item}</span>
                      <button onClick={() => handleRemoveChecklistItem(idx)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Timeline & Reminders */}
          {currentStep === 5 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Start Date *</label>
                  <input
                    type="date"
                    value={formData.startAt}
                    onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                    className="w-full text-xs bg-background border rounded-lg p-2.5 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Due Date *</label>
                  <input
                    type="date"
                    value={formData.dueAt}
                    onChange={(e) => setFormData({ ...formData, dueAt: e.target.value })}
                    className="w-full text-xs bg-background border rounded-lg p-2.5 outline-none font-bold text-primary"
                  />
                </div>
              </div>

              <div className="space-y-2 border-t pt-3">
                <label className="text-xs font-bold text-foreground">Automated Notification Reminders</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(formData.reminderConfig).map(([key, val]) => (
                    <label key={key} className="flex items-center gap-2 p-2 border rounded-lg bg-card cursor-pointer">
                      <input
                        type="checkbox"
                        checked={val}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            reminderConfig: { ...formData.reminderConfig, [key]: e.target.checked },
                          })
                        }
                      />
                      <span className="font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Review & Publish */}
          {currentStep === 6 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-card border rounded-xl p-4 space-y-3">
                <h4 className="text-sm font-bold text-primary flex items-center justify-between border-b pb-2">
                  <span>Task Preview: {formData.title || 'Untitled Task'}</span>
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs uppercase font-bold">
                    {formData.priority} Priority
                  </span>
                </h4>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Category:</span>
                    <span className="font-semibold">{formData.category}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Scope:</span>
                    <span className="font-semibold">{formData.assignmentMode}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Due Date:</span>
                    <span className="font-bold text-red-600">{formData.dueAt}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Reminders:</span>
                    <span className="font-semibold">Enabled</span>
                  </div>
                </div>

                {formData.description && (
                  <div className="text-xs border-t pt-2">
                    <span className="text-muted-foreground block text-[10px]">Instructions:</span>
                    <p className="text-foreground pt-1 leading-relaxed">{formData.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="p-4 border-t bg-muted/20 flex items-center justify-between">
          <button
            type="button"
            disabled={currentStep === 1}
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            className="px-4 py-2 rounded-lg border text-xs font-bold hover:bg-muted disabled:opacity-40 flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>

          <div className="flex items-center gap-2">
            {currentStep === 6 ? (
              <>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmitTask(false)}
                  className="px-4 py-2 rounded-lg border bg-card text-xs font-bold hover:bg-muted cursor-pointer"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmitTask(true)}
                  className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-extrabold hover:bg-primary/90 cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Sparkles className="h-4 w-4" /> {isSubmitting ? 'Publishing...' : 'Publish Task Now'}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.min(6, prev + 1))}
                className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 flex items-center gap-1 cursor-pointer"
              >
                Next Step <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
