import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { toast } from '../components/ui/Toast';
import { GraduationCap, ArrowLeft, Check, X, ShieldAlert } from 'lucide-react';
import api from '../lib/axios';

const passwordStrengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(
        passwordStrengthRegex,
        'Password must satisfy all strength rules below'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetFormValues = z.infer<typeof resetPasswordSchema>;

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const newPasswordValue = watch('newPassword') || '';

  // Password strength checks for UI feedback
  const rules = [
    { label: 'Minimum 8 characters', checked: newPasswordValue.length >= 8 },
    { label: 'At least one uppercase letter (A-Z)', checked: /[A-Z]/.test(newPasswordValue) },
    { label: 'At least one lowercase letter (a-z)', checked: /[a-z]/.test(newPasswordValue) },
    { label: 'At least one number (0-9)', checked: /\d/.test(newPasswordValue) },
    { label: 'At least one special character (@$!%*?&)', checked: /[@$!%*?&]/.test(newPasswordValue) },
  ];

  const onSubmit = async (data: ResetFormValues) => {
    if (!token) {
      toast.error('Recovery token is missing from the page URL.', 'Missing Token');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/reset-password', {
        token,
        newPassword: data.newPassword,
      });

      if (response.data?.status === 'success') {
        toast.success(
          'Your password has been reset successfully. Redirecting to login...',
          'Password Reset'
        );
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2000);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Verification token is invalid or expired', 'Reset Failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafafa] dark:bg-[#09090b] px-4 py-12 transition-colors duration-200">
      <div className="w-full max-w-md space-y-6">
        
        {/* Card */}
        <div className="bg-white dark:bg-[#0c0c0e] border border-neutral-200/80 dark:border-neutral-800/80 p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] animate-in fade-in-50 duration-200">
          
          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground mb-4 shadow-[0_4px_12px_rgba(var(--primary),0.2)]">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
              Set New Password
            </h2>
            <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400 max-w-xs leading-relaxed">
              Create a secure, strong password for your campus account
            </p>
          </div>

          {!token ? (
            <div className="mt-8 rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-center">
              <ShieldAlert className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-red-500 mb-1">Invalid Link</h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-normal">
                This link lacks a valid password recovery token. Please request another reset link.
              </p>
              <Link
                to="/forgot-password"
                className="mt-4 inline-flex flex-wrap items-center gap-1.5 text-xs font-semibold text-primary"
              >
                Go to Recovery
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
              <div className="relative">
                <Input
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  error={errors.newPassword?.message}
                  {...register('newPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[34px] p-1.5 rounded text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                >
                  {showPassword ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                </button>
              </div>

              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />

              {/* Password Strength Guidelines */}
              <div className="rounded-lg bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-150 dark:border-neutral-850 p-4 space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                  Password Strength Requirements
                </h4>
                {rules.map((rule) => (
                  <div key={rule.label} className="flex flex-wrap items-center gap-2 text-xs">
                    {rule.checked ? (
                      <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                        <Check className="h-3 w-3" />
                      </div>
                    ) : (
                      <div className="flex h-4 w-4 items-center justify-center rounded-full bg-neutral-200/50 dark:bg-neutral-800 text-neutral-300 dark:text-neutral-600">
                        <X className="h-3 w-3" />
                      </div>
                    )}
                    <span className={rule.checked ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-neutral-500 dark:text-neutral-400'}>
                      {rule.label}
                    </span>
                  </div>
                ))}
              </div>

              <Button type="submit" className="w-full h-11 text-xs" isLoading={isLoading}>
                Update Password
              </Button>
            </form>
          )}

          {/* Back to Login */}
          <div className="mt-6 border-t border-neutral-100 dark:border-neutral-800/60 pt-4 flex justify-center">
            <Link
              to="/login"
              className="inline-flex flex-wrap items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
