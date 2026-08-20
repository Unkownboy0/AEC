import React, { useMemo, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { toast } from '../components/ui/Toast';
import { GraduationCap, ArrowLeft, Check, X, ShieldAlert } from 'lucide-react';
import api from '../lib/axios';
import { useLanguage } from '../context/LanguageContext';

const passwordStrengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

type ResetFormValues = { newPassword: string; confirmPassword: string };

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useLanguage();
  const resetPasswordSchema = useMemo(() => z.object({
    newPassword: z.string().min(8, t('auth.new.minimumError')).regex(passwordStrengthRegex, t('auth.new.strengthError')),
    confirmPassword: z.string().min(1, t('auth.new.confirmError')),
  }).refine((data) => data.newPassword === data.confirmPassword, { message: t('auth.new.matchError'), path: ['confirmPassword'] }), [t]);
  
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
    { label: t('auth.new.minimum'), checked: newPasswordValue.length >= 8 },
    { label: t('auth.new.uppercase'), checked: /[A-Z]/.test(newPasswordValue) },
    { label: t('auth.new.lowercase'), checked: /[a-z]/.test(newPasswordValue) },
    { label: t('auth.new.number'), checked: /\d/.test(newPasswordValue) },
    { label: t('auth.new.special'), checked: /[@$!%*?&]/.test(newPasswordValue) },
  ];

  const onSubmit = async (data: ResetFormValues) => {
    if (!token) {
      toast.error(t('auth.new.missingToken'), t('auth.new.missingTokenTitle'));
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
          t('auth.new.success'),
          t('auth.new.successTitle')
        );
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2000);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(t('auth.new.failure'), t('auth.new.failureTitle'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-dvh flex flex-col justify-center items-center bg-surface-secondary dark:bg-[#07090E] px-4 py-6 sm:py-10 pt-safe pb-safe transition-colors duration-200 overflow-x-hidden overflow-y-auto">
      <div className="relative z-10 w-full max-w-md my-auto space-y-4">
        {/* Card */}
        <div className="bg-surface dark:bg-[#0E131F] border border-border dark:border-slate-800/90 p-6 sm:p-8 rounded-3xl shadow-xl dark:shadow-2xl backdrop-blur-md animate-in fade-in-50 duration-200">
          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3.5 shadow-sm border border-primary/20">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary dark:text-slate-50">
              {t('auth.new.title')}
            </h2>
            <p className="mt-1 text-xs text-text-muted dark:text-slate-400 max-w-xs leading-relaxed">
              {t('auth.new.description')}
            </p>
          </div>

          {!token ? (
            <div className="mt-6 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-center">
              <ShieldAlert className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-red-500 mb-1">{t('auth.new.invalidTitle')}</h4>
              <p className="text-xs text-text-muted dark:text-slate-400 leading-normal">
                {t('auth.new.invalidBody')}
              </p>
              <Link
                to="/forgot-password"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                {t('auth.new.goRecovery')}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
              <div className="relative">
                <Input
                  label={t('auth.newPassword')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  error={errors.newPassword?.message}
                  {...register('newPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[34px] p-1.5 rounded-lg text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                >
                  {showPassword ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                </button>
              </div>

              <Input
                label={t('auth.confirmPassword')}
                type="password"
                placeholder="••••••••"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />

              {/* Password Strength Guidelines */}
              <div className="rounded-2xl bg-surface-secondary dark:bg-slate-900/60 border border-border dark:border-slate-800 p-4 space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">
                  {t('auth.new.requirements')}
                </h4>
                {rules.map((rule) => (
                  <div key={rule.label} className="flex items-center gap-2 text-xs">
                    {rule.checked ? (
                      <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 shrink-0">
                        <Check className="h-3 w-3" />
                      </div>
                    ) : (
                      <div className="flex h-4 w-4 items-center justify-center rounded-full bg-neutral-200/50 dark:bg-neutral-800 text-text-muted shrink-0">
                        <X className="h-3 w-3" />
                      </div>
                    )}
                    <span className={rule.checked ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-text-muted'}>
                      {rule.label}
                    </span>
                  </div>
                ))}
              </div>

              <Button type="submit" className="w-full h-11 text-xs font-bold shadow-md" isLoading={isLoading}>
                {t('auth.new.update')}
              </Button>
            </form>
          )}

          {/* Back to Login */}
          <div className="mt-6 border-t border-border/50 dark:border-slate-800/80 pt-4 flex justify-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              <ArrowLeft className="rtl-mirror h-4 w-4" />
              {t('auth.backToSignIn')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
