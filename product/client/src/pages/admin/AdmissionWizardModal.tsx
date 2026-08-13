import React, { useState, useEffect } from 'react';
import {
  X, Check, AlertCircle, FileText, Upload, ShieldCheck, DollarSign, UserCheck,
  Save, ArrowRight, ArrowLeft, Sparkles, CheckCircle2, Copy, RefreshCw
} from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import api from '../../lib/axios';

interface AdmissionWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  departments: any[];
  programs: any[];
}

export const AdmissionWizardModal: React.FC<AdmissionWizardModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  departments,
  programs
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  // Step 1: Personal Details & Duplicate Check
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [parentName, setParentName] = useState('');
  const [gender, setGender] = useState('Male');
  const [category, setCategory] = useState('General');
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

  // Step 2: Academic Choice
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [academicMarks, setAcademicMarks] = useState('88.5');

  // Step 3: Document Uploads
  const [documents, setDocuments] = useState<any[]>([
    { name: '10th Marksheet', url: 'https://storage.campusos.internal/docs/10th_marksheet.pdf', status: 'APPROVED' },
    { name: '12th Marksheet', url: 'https://storage.campusos.internal/docs/12th_marksheet.pdf', status: 'APPROVED' },
    { name: 'Transfer Certificate (TC)', url: 'https://storage.campusos.internal/docs/tc_certificate.pdf', status: 'APPROVED' },
    { name: 'Aadhar / ID Proof', url: 'https://storage.campusos.internal/docs/aadhar_proof.pdf', status: 'APPROVED' }
  ]);

  // Step 4: Verification & Merit Ranking
  const [quotaType, setQuotaType] = useState<'GOVERNMENT' | 'MANAGEMENT' | 'SPORTS'>('GOVERNMENT');
  const [verificationStatus, setVerificationStatus] = useState('VERIFIED');

  // Step 5: Offer & Scholarship
  const [scholarshipType, setScholarshipType] = useState('Merit Scholarship');
  const [scholarshipAmount, setScholarshipAmount] = useState('15000');

  // Step 6: Fee Payment
  const [paymentMode, setPaymentMode] = useState('ONLINE');
  const [paymentTxnId, setPaymentTxnId] = useState('TXN2026' + Math.floor(100000 + Math.random() * 900000));
  const [isPaying, setIsPaying] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);

  // Step 7: Final Provisioning Output
  const [provisionResult, setProvisionResult] = useState<any>(null);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  useEffect(() => {
    if (departments.length > 0 && !selectedDeptId) {
      setSelectedDeptId(departments[0].id);
    }
    if (programs.length > 0 && !selectedProgramId) {
      setSelectedProgramId(programs[0].id);
    }
  }, [departments, programs]);

  if (!isOpen) return null;

  const handleDuplicateCheck = async () => {
    if (!email && !phone) return;
    try {
      setCheckingDuplicate(true);
      const res = await api.post('/admission-dean/wizard/check-duplicate', { email, phone });
      if (res.data?.isDuplicate) {
        setDuplicateWarning(`Applicant already exists (Reg/App #${res.data.existingApplicationNo}).`);
      } else {
        setDuplicateWarning(null);
      }
    } catch (_) {
    } finally {
      setCheckingDuplicate(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setIsSavingDraft(true);
      const res = await api.post('/admission-dean/wizard/save-draft', {
        id: applicationId,
        currentStep,
        firstName,
        lastName,
        email,
        phone,
        parentName,
        gender,
        category,
        academicMarks,
        departmentId: selectedDeptId,
        programId: selectedProgramId,
        documents
      });

      if (res.data?.status === 'success') {
        if (res.data.data?.id) setApplicationId(res.data.data.id);
        toast.success(`Progress saved at Step ${currentStep}!`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save draft');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSimulatePayment = () => {
    setIsPaying(true);
    setTimeout(() => {
      setIsPaying(false);
      setPaymentDone(true);
      toast.success('Admission Fee Payment of ₹60,000 received successfully!');
    }, 1000);
  };

  const handleConfirmAndProvision = async () => {
    try {
      setIsProvisioning(true);
      // Ensure application draft is saved first
      const draftRes = await api.post('/admission-dean/wizard/save-draft', {
        id: applicationId,
        currentStep: 7,
        firstName,
        lastName,
        email,
        phone,
        parentName,
        gender,
        category,
        academicMarks,
        departmentId: selectedDeptId,
        programId: selectedProgramId,
        documents
      });

      const targetAppId = draftRes.data?.data?.id || applicationId;
      if (!targetAppId) {
        toast.error('Application draft creation failed');
        return;
      }

      // Trigger automatic enrollment & account provisioning
      const confirmRes = await api.post(`/admission-dean/applications/${targetAppId}/confirm-admission`);
      if (confirmRes.data?.status === 'success') {
        setProvisionResult(confirmRes.data.data?.provisioned);
        setCurrentStep(7);
        toast.success('Admission Confirmed & Provisioned Successfully!');
        onSuccess();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to complete admission provisioning');
    } finally {
      setIsProvisioning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 text-left animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-0.5 rounded-full border border-indigo-200">
              Paperless Admission Pipeline Wizard
            </span>
            <h2 className="text-lg font-black text-slate-800 dark:text-white mt-1 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-600" /> Step {currentStep} of 7 — {
                currentStep === 1 ? 'Enquiry & Applicant Verification' :
                currentStep === 2 ? 'Program & Academic Selection' :
                currentStep === 3 ? 'Document Verification' :
                currentStep === 4 ? 'Merit Ranking & Quota Allocation' :
                currentStep === 5 ? 'Provisional Offer & Scholarship' :
                currentStep === 6 ? 'Admission Fee Payment' :
                'Automatic Account & Ledger Provisioning'
              }
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {currentStep < 7 && (
              <button
                onClick={handleSaveDraft}
                disabled={isSavingDraft}
                className="px-3 py-1.5 border text-xs font-bold rounded-xl hover:bg-muted flex items-center gap-1.5 transition-all"
              >
                <Save className="h-3.5 w-3.5" /> {isSavingDraft ? 'Saving...' : 'Save Progress'}
              </button>
            )}
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Wizard Progress Bar */}
        <div className="grid grid-cols-7 gap-1">
          {[1, 2, 3, 4, 5, 6, 7].map((step) => (
            <div
              key={step}
              className={`h-2 rounded-full transition-all ${
                step === currentStep ? 'bg-indigo-600' :
                step < currentStep ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* STEP 1: PERSONAL DETAILS & DUPLICATE CHECK */}
        {currentStep === 1 && (
          <div className="space-y-4 text-xs font-semibold">
            {duplicateWarning && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl flex items-center gap-2">
                <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
                <span>{duplicateWarning}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">First Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-background outline-none text-xs font-bold"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Last Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Sharma"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-background outline-none text-xs font-bold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Email Address *</label>
                <input
                  type="email"
                  placeholder="rahul.sharma@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleDuplicateCheck}
                  className="w-full px-3 py-2 border rounded-xl bg-background outline-none text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Mobile Phone *</label>
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={handleDuplicateCheck}
                  className="w-full px-3 py-2 border rounded-xl bg-background outline-none text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Parent / Guardian Name</label>
                <input
                  type="text"
                  placeholder="Suresh Sharma"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-background outline-none text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-background outline-none text-xs font-bold"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Quota Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-background outline-none text-xs font-bold"
                >
                  <option value="General">General</option>
                  <option value="OBC">OBC</option>
                  <option value="SC/ST">SC/ST</option>
                  <option value="Sports">Sports</option>
                  <option value="Management">Management</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: PROGRAM & ACADEMIC CHOICE */}
        {currentStep === 2 && (
          <div className="space-y-4 text-xs font-semibold">
            <div>
              <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Target Academic Department *</label>
              <select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="w-full px-3 py-2.5 border rounded-xl bg-background outline-none font-bold text-xs"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Degree Program *</label>
              <select
                value={selectedProgramId}
                onChange={(e) => setSelectedProgramId(e.target.value)}
                className="w-full px-3 py-2.5 border rounded-xl bg-background outline-none font-bold text-xs"
              >
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">12th Grade / Qualifying Exam Percentage (%)</label>
              <input
                type="number"
                step="0.1"
                value={academicMarks}
                onChange={(e) => setAcademicMarks(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl bg-background outline-none text-xs font-mono font-bold"
              />
            </div>
          </div>
        )}

        {/* STEP 3: DOCUMENT UPLOADS */}
        {currentStep === 3 && (
          <div className="space-y-3 text-xs">
            <p className="text-slate-500 font-medium">Uploaded verification documents stored in centralized secure vault:</p>
            <div className="space-y-2">
              {documents.map((doc, idx) => (
                <div key={idx} className="p-3 border rounded-xl bg-muted/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-600" />
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white">{doc.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{doc.url}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: MERIT RANKING & QUOTA SELECTION */}
        {currentStep === 4 && (
          <div className="space-y-4 text-xs font-semibold">
            <div className="p-4 border rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-200 space-y-1">
              <p className="font-black text-sm">Merit Score: {academicMarks}%</p>
              <p className="text-[11px]">Ranked #14 in Department Merit List. Eligible for Merit Seat Allocation.</p>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Select Seat Allocation Quota</label>
              <div className="grid grid-cols-3 gap-3">
                {['GOVERNMENT', 'MANAGEMENT', 'SPORTS'].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuotaType(q as any)}
                    className={`p-3 border rounded-xl text-xs font-bold transition-all ${
                      quotaType === q ? 'bg-indigo-600 text-white shadow' : 'bg-card text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {q} QUOTA
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: PROVISIONAL OFFER & SCHOLARSHIP */}
        {currentStep === 5 && (
          <div className="space-y-4 text-xs font-semibold">
            <div className="p-4 border rounded-2xl bg-card space-y-2">
              <h4 className="font-black text-sm text-slate-800 dark:text-white">Provisional Offer Letter Breakdown</h4>
              <div className="divide-y text-xs">
                <div className="py-1.5 flex justify-between"><span>Standard Tuition Fee</span><span className="font-mono font-bold">₹75,000</span></div>
                <div className="py-1.5 flex justify-between text-emerald-600"><span>Merit Scholarship Discount</span><span className="font-mono font-bold">- ₹15,000</span></div>
                <div className="py-1.5 flex justify-between text-indigo-600 font-extrabold"><span>Net Payable Fee</span><span className="font-mono">₹60,000</span></div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: ADMISSION FEE PAYMENT */}
        {currentStep === 6 && (
          <div className="space-y-4 text-xs font-semibold">
            <div className="p-4 border rounded-2xl bg-muted/10 text-center space-y-3">
              <DollarSign className="h-8 w-8 text-emerald-600 mx-auto" />
              <div>
                <p className="text-sm font-black text-slate-800 dark:text-white">Collect Admission Fee: ₹60,000</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Txn Reference: {paymentTxnId}</p>
              </div>

              {!paymentDone ? (
                <button
                  onClick={handleSimulatePayment}
                  disabled={isPaying}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl shadow transition-all"
                >
                  {isPaying ? 'Processing Payment...' : 'Record Payment Confirmation'}
                </button>
              ) : (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-bold flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" /> Admission Fee Payment Confirmed
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 7: AUTO PROVISIONING RESULT */}
        {currentStep === 7 && provisionResult && (
          <div className="space-y-4 text-xs text-left">
            <div className="p-5 border rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 text-emerald-900 dark:text-emerald-200 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                <div>
                  <h3 className="text-sm font-black">Admission Confirmed & Records Provisioned!</h3>
                  <p className="text-[11px] opacity-90">Student, parent, fee ledger, and digital ID accounts created automatically.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-semibold">
              <div className="p-3.5 border rounded-xl bg-card">
                <span className="text-[10px] uppercase font-bold text-slate-400">Assigned Roll / Register No</span>
                <p className="text-sm font-black font-mono text-indigo-600">{provisionResult.admissionNo}</p>
              </div>

              <div className="p-3.5 border rounded-xl bg-card">
                <span className="text-[10px] uppercase font-bold text-slate-400">Student User Account</span>
                <p className="text-xs font-bold text-slate-800 dark:text-white">{provisionResult.userEmail}</p>
              </div>

              <div className="p-3.5 border rounded-xl bg-card">
                <span className="text-[10px] uppercase font-bold text-slate-400">Parent / Guardian Account</span>
                <p className="text-xs font-bold text-slate-800 dark:text-white">{provisionResult.parentEmail}</p>
              </div>

              <div className="p-3.5 border rounded-xl bg-card">
                <span className="text-[10px] uppercase font-bold text-slate-400">Digital ID Card Eligibility</span>
                <p className="text-xs font-bold text-emerald-600">Eligible (Auto-Enabled)</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between border-t pt-4">
          <button
            type="button"
            disabled={currentStep === 1 || currentStep === 7}
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            className="px-4 py-2 border rounded-xl text-xs font-bold hover:bg-muted disabled:opacity-40 flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          {currentStep < 6 && (
            <button
              type="button"
              onClick={() => {
                if (currentStep === 1 && (!firstName || !lastName || !email)) {
                  toast.error('Please fill in First Name, Last Name, and Email.');
                  return;
                }
                setCurrentStep(prev => Math.min(6, prev + 1));
              }}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5 transition-all"
            >
              <span>Next Step</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}

          {currentStep === 6 && (
            <button
              type="button"
              disabled={isProvisioning}
              onClick={handleConfirmAndProvision}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow flex items-center gap-1.5 transition-all disabled:opacity-60"
            >
              {isProvisioning ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Confirm Admission & Provision Accounts</span>
                </>
              )}
            </button>
          )}

          {currentStep === 7 && (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow"
            >
              Close Wizard
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
