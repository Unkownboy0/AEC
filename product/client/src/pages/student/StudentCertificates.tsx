import React, { useState, useEffect } from 'react';
import { Award, FileText, CheckCircle, Clock, Download, QrCode, Plus, ShieldCheck } from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';
import api from '../../lib/axios';

const CERT_TYPES = [
  { id: 'BONAFIDE', title: 'Bonafide Certificate', desc: 'Official proof of student enrollment for bank, passport, or bus pass applications' },
  { id: 'CONDUCT', title: 'Conduct & Character Certificate', desc: 'Attestation of disciplinary record and academic conduct' },
  { id: 'COURSE_COMPLETION', title: 'Course Completion Certificate', desc: 'Proof of curriculum and semester completion status' },
  { id: 'INTERNSHIP_LETTER', title: 'NOC / Internship Permission Letter', desc: 'Official recommendation letter for external industry training' },
  { id: 'TRANSFER', title: 'Transfer Certificate (TC)', desc: 'Official institutional transfer documentation' },
  { id: 'MEDIUM', title: 'Medium of Instruction Certificate', desc: 'Certifies English as official medium of instruction' },
  { id: 'FEE_RECEIPT', title: 'Consolidated Fee Payment Certificate', desc: 'Official fee breakdown for income tax or loan processing' },
];

export const StudentCertificates: React.FC = () => {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState('BONAFIDE');
  const [purpose, setPurpose] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeModalCert, setActiveModalCert] = useState<any | null>(null);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/enterprise/certificates/my-list');
      if (res.data?.status === 'success') {
        setCertificates(res.data.data);
      }
    } catch {
      toast.error('Failed to load certificates history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose.trim()) {
      toast.error('Please specify the purpose for the certificate request');
      return;
    }

    try {
      setIsApplying(true);
      const res = await api.post('/enterprise/certificates/apply', {
        type: selectedType,
        purpose: purpose.trim(),
      });

      if (res.data?.status === 'success') {
        toast.success('Certificate issued instantly with digital QR verification!');
        setCertificates((prev) => [res.data.data, ...prev]);
        setPurpose('');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to apply for certificate');
    } finally {
      setIsApplying(false);
    }
  };

  const handleDownloadCertificate = async (cert: any) => {
    try {
      const res = await api.get(`/enterprise/certificates/download/${cert.verificationHash || cert.id}`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${cert.type}_Certificate_${cert.verificationHash || 'verified'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(`Official ${cert.type.replace(/_/g, ' ')} Certificate PDF downloaded with institutional watermark.`);
    } catch (err: any) {
      toast.error('Failed to download certificate PDF');
    }
  };

  if (isLoading) return <Loading text="Loading Digital Certificate Portal..." />;

  return (
    <div className="space-y-6 text-left pb-16 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 bg-card border p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Award className="h-6 w-6 text-indigo-600" /> Digital Certificate Request & Vault
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Instant digital certificate issuance with cryptographic QR verification hashes and approval tracking
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Application Form */}
        <div className="lg:col-span-1 border bg-card p-5 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Request New Certificate</h3>
          <form onSubmit={handleApply} className="space-y-4 text-xs font-semibold">
            <div>
              <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Certificate Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl bg-background outline-none font-bold"
              >
                {CERT_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Purpose / Justification</label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Passport application, Education Loan processing, Industrial Internship..."
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl bg-background outline-none resize-none font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={isApplying}
              className="w-full py-2.5 bg-indigo-600 text-white font-extrabold text-xs rounded-xl hover:bg-indigo-700 shadow transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> {isApplying ? 'Processing Issuance...' : 'Apply & Generate'}
            </button>
          </form>
        </div>

        {/* Issued Vault Grid */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">My Issued Certificates ({certificates.length})</h3>
          <div className="space-y-3">
            {certificates.length > 0 ? (
              certificates.map((cert) => (
                <div key={cert.id} className="border bg-card p-4 rounded-2xl shadow-sm flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800 dark:text-white">{cert.type.replace('_', ' ')}</h4>
                      <p className="text-[10px] text-muted-foreground font-medium">{cert.purpose}</p>
                      <span className="text-[8.5px] font-mono font-bold text-slate-400 block mt-0.5">
                        Hash: {cert.verificationHash || 'GIT-CERT-ACTIVE'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveModalCert(cert)}
                      className="px-3 py-1.5 border rounded-xl text-[10px] font-extrabold hover:bg-muted flex items-center gap-1"
                    >
                      <QrCode className="h-3.5 w-3.5 text-indigo-600" /> QR Verify
                    </button>
                    <button
                      onClick={() => handleDownloadCertificate(cert)}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-[10px] font-extrabold hover:bg-indigo-700 shadow flex items-center gap-1"
                    >
                      <Download className="h-3.5 w-3.5" /> PDF
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 border-2 border-dashed rounded-2xl">
                <Award className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="text-xs text-muted-foreground mt-2 font-semibold">No certificates issued yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR Verification Modal */}
      {activeModalCert && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-xl animate-in zoom-in-95">
            <ShieldCheck className="h-10 w-10 text-emerald-500 mx-auto" />
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">Cryptographic QR Verification</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Scannable by employer or university verifiers</p>
            </div>
            {activeModalCert.qrCodeUrl && (
              <img src={activeModalCert.qrCodeUrl} alt="Verification QR" className="h-36 w-36 mx-auto border p-2 rounded-xl bg-white" />
            )}
            <p className="text-[9px] font-mono bg-muted p-2 rounded-lg font-bold text-slate-600 dark:text-slate-300 break-all">
              {activeModalCert.verificationHash}
            </p>
            <button
              onClick={() => setActiveModalCert(null)}
              className="w-full py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentCertificates;
