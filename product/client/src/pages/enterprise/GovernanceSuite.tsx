import React, { useEffect, useState } from 'react';
import {
  FileText,
  FileCheck,
  ShieldCheck,
  QrCode,
  BookOpen,
  Award,
  AlertTriangle,
  Plus,
  CheckCircle,
  Clock,
  Sparkles,
  Camera,
  PenTool,
} from 'lucide-react';
import api from '../../lib/axios';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';
import { QrScannerModal } from '../../components/ui/QrScannerModal';
import { SignaturePadModal } from '../../components/ui/SignaturePadModal';
import { HapticsService } from '../../platform/haptics';

export const GovernanceSuite: React.FC = () => {
  const [sopItems, setSopItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sop' | 'esign' | 'compliance' | 'ai'>('sop');
  const [docTitle, setDocTitle] = useState('');
  const [verifyToken, setVerifyToken] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [attachedSignature, setAttachedSignature] = useState<any>(null);

  const fetchSops = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/enterprise/governance/sop-library');
      if (res.data?.status === 'success') {
        setSopItems(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSops();
  }, []);

  const handleVerifyQr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyToken.trim()) return;
    try {
      const res = await api.get(`/enterprise/governance/verify/${verifyToken.trim()}`);
      if (res.data?.status === 'success') {
        setVerificationResult(res.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Signature verification failed.');
    }
  };

  const handleAiAssistantQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    // Simulate AI Executive Decision Assistant analysis
    const q = aiQuery.toLowerCase();
    let response = "All academic compliance parameters and department SLAs are operating within normal parameters.";

    if (q.includes('overdue') || q.includes('tasks')) {
      response = "Executive Alert: 3 department tasks in CSE and ECE are approaching SLA limits. Recommended Action: Reassign workload to Vice HOD.";
    } else if (q.includes('approval') || q.includes('pending')) {
      response = "Pending Approvals Summary: 2 Workflow Requests (CSE OD Approvals), 1 NAAC Criterion 4 Report, and 1 Budget Proposal awaiting Dean Signature.";
    } else if (q.includes('workload') || q.includes('faculty')) {
      response = "Faculty Workload Analysis: Average workload is 16.4 Hrs/Wk. CSE Faculty Member 3 currently exhibits high load (38 hours).";
    }

    setAiResponse(response);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200 p-2 md:p-4">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-foreground tracking-tight uppercase flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" /> Enterprise Governance & Digital Suite
          </h2>
          <p className="text-xs text-muted-foreground font-semibold">
            SharePoint & ServiceNow Grade Document Approval, Digital Signatures & Compliance Center
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('sop')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'sop' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-secondary text-secondary-foreground'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" /> SOP & Knowledge Base
          </button>
          <button
            onClick={() => setActiveTab('esign')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'esign' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-secondary text-secondary-foreground'
            }`}
          >
            <QrCode className="h-3.5 w-3.5" /> E-Sign & QR Verification
          </button>
          <button
            onClick={() => setActiveTab('compliance')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'compliance' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-secondary text-secondary-foreground'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" /> Risk & NAAC/NBA Readiness
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'ai' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-secondary text-secondary-foreground'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Executive AI Assistant
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-[60vh] items-center justify-center">
          <Loading text="Loading Governance Suite..." />
        </div>
      ) : (
        <>
          {/* TAB 1: SOP & KNOWLEDGE BASE */}
          {activeTab === 'sop' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-extrabold uppercase text-muted-foreground">Standard Operating Procedures & Policy Library</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sopItems.map((item: any) => (
                  <div key={item.id} className="border bg-card p-5 rounded-2xl space-y-3 shadow-xs">
                    <span className="text-[9px] font-extrabold text-primary tracking-wider uppercase px-2 py-0.5 rounded-full bg-primary/10 inline-block">
                      {item.category}
                    </span>
                    <h4 className="text-sm font-bold text-foreground">{item.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-3">{item.content}</p>
                    <div className="pt-2 border-t flex justify-between items-center text-[10px] text-muted-foreground font-semibold">
                      <span>Status: {item.status}</span>
                      <span className="text-primary font-bold hover:underline cursor-pointer">Read Policy →</span>
                    </div>
                  </div>
                ))}

                {sopItems.length === 0 && (
                  <div className="border bg-card p-5 rounded-2xl text-center space-y-2 md:col-span-3">
                    <BookOpen className="h-8 w-8 text-muted-foreground mx-auto" />
                    <p className="text-xs font-bold text-muted-foreground">No SOP items published yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: E-SIGN & QR VERIFICATION */}
          {activeTab === 'esign' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border bg-card p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase text-muted-foreground flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-primary" /> Verify Document QR Code Token
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsQrModalOpen(true)}
                    className="flex items-center gap-1 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary/20"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <span>Scan with Camera</span>
                  </button>
                </div>

                <form onSubmit={handleVerifyQr} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Enter QR Token (e.g. SIG-A1B2C3D4)"
                    value={verifyToken}
                    onChange={(e) => setVerifyToken(e.target.value)}
                    className="w-full text-xs border rounded-xl p-3 bg-background"
                  />
                  <button type="submit" className="w-full bg-primary text-primary-foreground font-bold text-xs p-2.5 rounded-xl">
                    Validate SHA-256 Digital Signature
                  </button>
                </form>

                {verificationResult && (
                  <div className="p-4 border rounded-xl bg-background space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span className="font-bold text-emerald-500">Signature Valid & Authenticated</span>
                    </div>
                    {verificationResult.signature && (
                      <div className="space-y-1 text-muted-foreground text-[11px]">
                        <p>Document: {verificationResult.signature.documentTitle}</p>
                        <p>Doc #: {verificationResult.signature.documentNumber}</p>
                        <p>Signer Role: {verificationResult.signature.signerRole}</p>
                        <p>Timestamp: {new Date(verificationResult.signature.signedAt).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="border bg-card p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase text-muted-foreground flex items-center gap-2">
                    <PenTool className="h-4 w-4 text-indigo-500" /> Digital Touch Signature Endorsement
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsSignModalOpen(true)}
                    className="flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-indigo-500"
                  >
                    <PenTool className="h-3.5 w-3.5" />
                    <span>Sign Document</span>
                  </button>
                </div>

                {attachedSignature ? (
                  <div className="space-y-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs">
                    <div className="flex items-center gap-2 text-emerald-500 font-bold">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Signature Attached & Cryptographically Stamped</span>
                    </div>
                    <img
                      src={attachedSignature.dataUrl}
                      alt="Digital Signature"
                      className="h-16 rounded border bg-white p-1"
                    />
                    <p className="font-mono text-[10px] text-muted-foreground">
                      SHA-256: {attachedSignature.sha256Hash}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                    <p>• Once signed by HOD, Dean, or Principal, the document hash is locked using SHA-256 encryption.</p>
                    <p>• Digital signatures append a unique QR token usable for external tamper verification.</p>
                    <p>• Any post-signature modification forces the document lifecycle state back to `DRAFT`.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: RISK & NAAC/NBA COMPLIANCE */}
          {activeTab === 'compliance' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="border bg-card p-4 rounded-2xl text-center border-l-4 border-l-emerald-500">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">NAAC Grade Target</span>
                  <span className="text-2xl font-black text-emerald-500 block">A++ Ready</span>
                </div>
                <div className="border bg-card p-4 rounded-2xl text-center border-l-4 border-l-indigo-500">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">NBA SAR Accreditation</span>
                  <span className="text-2xl font-black text-indigo-500 block">94.8% Complete</span>
                </div>
                <div className="border bg-card p-4 rounded-2xl text-center border-l-4 border-l-amber-500">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">NIRF Audit Readiness</span>
                  <span className="text-2xl font-black text-amber-500 block">Grade Tier 1</span>
                </div>
                <div className="border bg-card p-4 rounded-2xl text-center border-l-4 border-l-primary">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">IQAC Compliance Index</span>
                  <span className="text-2xl font-black text-primary block">98.2 / 100</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EXECUTIVE AI ASSISTANT */}
          {activeTab === 'ai' && (
            <div className="border bg-card p-6 rounded-2xl space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                <h4 className="text-sm font-black uppercase text-foreground">Executive AI Decision Support Assistant</h4>
              </div>

              <form onSubmit={handleAiAssistantQuery} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ask Executive AI (e.g. 'Show pending approvals', 'Which departments have overdue tasks?')..."
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  className="flex-1 text-xs border rounded-xl p-3 bg-background"
                />
                <button type="submit" className="bg-primary text-primary-foreground text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-1.5">
                  Analyze & Report
                </button>
              </form>

              {aiResponse && (
                <div className="p-4 border rounded-xl bg-background text-xs space-y-2 animate-in fade-in-50">
                  <span className="text-[10px] font-bold uppercase text-amber-400 block">AI Executive Analysis Result</span>
                  <p className="text-foreground leading-relaxed font-semibold">{aiResponse}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* QR Optical Scanner Modal */}
      <QrScannerModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        onScan={(result) => {
          setVerifyToken(result.token);
          toast.success(`QR Token Scanned: ${result.token}`);
        }}
        title="Scan Document QR Code"
        subtitle="Point camera at the cryptographic verification QR code on the certificate or circular."
      />

      {/* Touch Digital Signature Modal */}
      <SignaturePadModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        onConfirm={(result) => {
          setAttachedSignature(result);
          toast.success('Digital signature attached with SHA-256 verification hash.');
        }}
        title="Executive Document E-Sign"
        subtitle="Sign below to cryptographically endorse this institutional governance document."
      />
    </div>
  );
};

export default GovernanceSuite;
