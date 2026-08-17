import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../ui/Toast';
import api from '../../lib/axios';

/**
 * Blocks the app until a user flagged forcePasswordChange=true (freshly
 * provisioned admission/staff accounts, whose initial password is a known
 * value like their phone number) sets a real password of their own.
 */
export const ForcePasswordChangeGate: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setIsSaving(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      toast.success('Password updated. Welcome to CampusOS.');
      await refreshUser();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Password update failed');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafafa] dark:bg-[#09090b] px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="bg-white dark:bg-[#0c0c0e] border border-neutral-200/80 dark:border-neutral-800/80 p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
          <h1 className="text-lg font-bold text-center">Set a new password</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {user?.firstName ? `Welcome, ${user.firstName}. ` : ''}
            For your account&apos;s security, you must set your own password before continuing.
          </p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">
                Current password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm"
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">
                New password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">
                Confirm new password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm"
                autoComplete="new-password"
              />
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
            >
              {isSaving ? 'Updating…' : 'Set password and continue'}
            </button>
            <button
              type="button"
              onClick={() => logout()}
              className="w-full text-center text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Sign out instead
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForcePasswordChangeGate;
