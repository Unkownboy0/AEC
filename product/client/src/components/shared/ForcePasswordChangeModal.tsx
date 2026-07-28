import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { KeyRound, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from '../ui/Toast';
import api from '../../lib/axios';

interface ForcePasswordChangeModalProps {
  isOpen: boolean;
  onSuccess: () => void;
}

export const ForcePasswordChangeModal: React.FC<ForcePasswordChangeModalProps> = ({
  isOpen,
  onSuccess,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Policy Checks
  const checks = {
    length: newPassword.length >= 10,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[@#$%^&*!_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword),
    matches: newPassword.length > 0 && newPassword === confirmPassword,
  };

  const isFormValid = checks.length && checks.uppercase && checks.lowercase && checks.number && checks.special && checks.matches;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setError(null);

    try {
      await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      toast.success('Password changed successfully! Welcome to Geetorus CampusOS.');
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update password. Please verify current password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => {}} title="Change Password Required" size="lg" closeOnOverlayClick={false}>
      <form onSubmit={handleSubmit} className="space-y-4 py-1 text-xs font-semibold">
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>First login detected. Security policy requires changing your temporary password before proceeding.</span>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Temporary Password</label>
          <Input
            type="password"
            placeholder="Enter current temporary password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">New Password</label>
            <Input
              type="password"
              placeholder="New strong password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Confirm Password</label>
            <Input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Real-time Password Strength Matrix */}
        <div className="bg-muted/40 p-3 rounded-lg border space-y-1.5 text-xs">
          <div className="text-muted-foreground font-medium mb-1 text-[11px] uppercase tracking-wider">Password Requirements:</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-foreground">
            <div className="flex items-center gap-1.5">
              {checks.length ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-muted-foreground" />}
              <span className={checks.length ? 'text-emerald-500' : 'text-muted-foreground'}>Min 10 characters</span>
            </div>
            <div className="flex items-center gap-1.5">
              {checks.uppercase ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-muted-foreground" />}
              <span className={checks.uppercase ? 'text-emerald-500' : 'text-muted-foreground'}>Uppercase letter (A-Z)</span>
            </div>
            <div className="flex items-center gap-1.5">
              {checks.lowercase ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-muted-foreground" />}
              <span className={checks.lowercase ? 'text-emerald-500' : 'text-muted-foreground'}>Lowercase letter (a-z)</span>
            </div>
            <div className="flex items-center gap-1.5">
              {checks.number ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-muted-foreground" />}
              <span className={checks.number ? 'text-emerald-500' : 'text-muted-foreground'}>Number (0-9)</span>
            </div>
            <div className="flex items-center gap-1.5">
              {checks.special ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-muted-foreground" />}
              <span className={checks.special ? 'text-emerald-500' : 'text-muted-foreground'}>Special char (@#$%*)</span>
            </div>
            <div className="flex items-center gap-1.5">
              {checks.matches ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-muted-foreground" />}
              <span className={checks.matches ? 'text-emerald-500' : 'text-muted-foreground'}>Passwords match</span>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={!isFormValid || loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 rounded-lg text-sm flex items-center justify-center gap-2"
        >
          <KeyRound className="w-4 h-4" />
          {loading ? 'Updating Password...' : 'Update Password & Access System'}
        </Button>
      </form>
    </Modal>
  );
};
