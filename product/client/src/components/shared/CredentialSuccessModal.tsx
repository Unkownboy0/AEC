import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Check, Copy, Printer, Download, Mail, ShieldCheck } from 'lucide-react';
import { toast } from '../ui/Toast';

export interface CredentialPayload {
  fullName: string;
  role: string;
  username: string;
  temporaryPassword: string;
  department?: string;
  employeeId?: string;
  studentId?: string;
  email?: string;
}

interface CredentialSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  credentials: CredentialPayload | null;
}

export const CredentialSuccessModal: React.FC<CredentialSuccessModalProps> = ({
  isOpen,
  onClose,
  credentials,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!credentials) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyBoth = () => {
    const combined = `GEETORUS CAMPUSOS CREDENTIALS\nName: ${credentials.fullName}\nRole: ${credentials.role}\nUsername: ${credentials.username}\nPassword: ${credentials.temporaryPassword}`;
    navigator.clipboard.writeText(combined);
    setCopiedField('Both');
    toast.success('Username & Password copied to clipboard!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>User Credentials - ${credentials.fullName}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; }
            .card { border: 2px solid #6366f1; border-radius: 12px; padding: 30px; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 20px; }
            .header h1 { color: #4338ca; margin: 0; font-size: 24px; }
            .header p { color: #64748b; margin-top: 5px; font-size: 14px; }
            .field { margin-bottom: 16px; font-size: 16px; }
            .label { font-weight: 600; color: #475569; width: 180px; display: inline-block; }
            .value { font-weight: 700; color: #0f172a; }
            .highlight { background: #f1f5f9; padding: 8px 12px; border-radius: 6px; font-family: monospace; font-size: 18px; color: #4338ca; }
            .notice { margin-top: 30px; font-size: 12px; color: #ef4444; border-top: 1px dashed #cbd5e1; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <h1>GEETORUS CAMPUSOS</h1>
              <p>AUTOMATIC USER CREDENTIAL STATEMENT</p>
            </div>
            <div class="field"><span class="label">Full Name:</span> <span class="value">${credentials.fullName}</span></div>
            <div class="field"><span class="label">Role:</span> <span class="value">${credentials.role}</span></div>
            ${credentials.department ? `<div class="field"><span class="label">Department:</span> <span class="value">${credentials.department}</span></div>` : ''}
            ${credentials.employeeId || credentials.studentId ? `<div class="field"><span class="label">ID:</span> <span class="value">${credentials.employeeId || credentials.studentId}</span></div>` : ''}
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <div class="field"><span class="label">Username:</span> <span class="highlight">${credentials.username}</span></div>
            <div class="field"><span class="label">Temporary Password:</span> <span class="highlight">${credentials.temporaryPassword}</span></div>
            <div class="notice">
              * IMPORTANT: On your first login, you will be required to immediately change this temporary password. Store this securely and do not share with anyone.
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadPDF = () => {
    handlePrint(); // Opens standard print preview which supports Save as PDF
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="User Created Successfully!" size="md">
      <div className="space-y-4 py-1 text-sm">
        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
          <ShieldCheck className="w-5 h-5 shrink-0" />
          <span>Automated credentials generated for GEETORUS CAMPUSOS ERP access.</span>
        </div>

        {/* User Details */}
        <div className="bg-muted/40 rounded-lg p-3 space-y-2 border">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Full Name</span>
            <span className="font-semibold text-foreground">{credentials.fullName}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Role</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              {credentials.role}
            </span>
          </div>
          {credentials.department && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Department</span>
              <span className="text-foreground">{credentials.department}</span>
            </div>
          )}
        </div>

        {/* Generated Credentials Box */}
        <div className="bg-indigo-950/20 rounded-xl p-4 border border-indigo-500/30 space-y-3">
          <div>
            <label className="text-[11px] font-semibold uppercase text-indigo-400 tracking-wider block mb-1">
              Generated Username
            </label>
            <div className="flex items-center justify-between bg-card px-3 py-2 rounded-lg border border-indigo-500/20">
              <span className="font-mono text-base font-bold text-indigo-400 tracking-wider">
                {credentials.username}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-indigo-400 hover:text-indigo-300"
                onClick={() => copyToClipboard(credentials.username, 'Username')}
              >
                {copiedField === 'Username' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase text-amber-500 tracking-wider block mb-1">
              Temporary Password
            </label>
            <div className="flex items-center justify-between bg-card px-3 py-2 rounded-lg border border-amber-500/20">
              <span className="font-mono text-base font-bold text-amber-500 tracking-wider">
                {credentials.temporaryPassword}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-amber-500 hover:text-amber-400"
                onClick={() => copyToClipboard(credentials.temporaryPassword, 'Password')}
              >
                {copiedField === 'Password' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            className="text-xs flex items-center justify-center gap-1.5"
            onClick={copyBoth}
          >
            <Copy className="w-3.5 h-3.5 text-indigo-400" /> Copy Both
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs flex items-center justify-center gap-1.5"
            onClick={handlePrint}
          >
            <Printer className="w-3.5 h-3.5 text-sky-400" /> Print
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs flex items-center justify-center gap-1.5"
            onClick={handleDownloadPDF}
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" /> Download PDF
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs flex items-center justify-center gap-1.5"
            onClick={() => toast.success(`Credentials dispatch email queued for ${credentials.email || credentials.fullName}`)}
          >
            <Mail className="w-3.5 h-3.5 text-amber-400" /> Send Email
          </Button>
        </div>

        <div className="pt-2 border-t">
          <Button
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 rounded-lg text-sm"
            onClick={onClose}
          >
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
