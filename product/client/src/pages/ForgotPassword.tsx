import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { toast } from '../components/ui/Toast';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowLeft } from 'lucide-react';
import api from '../lib/axios';
import { useLanguage } from '../context/LanguageContext';

type ForgotFormValues = { email: string };

const ForgotPassword: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();
  const forgotPasswordSchema = useMemo(() => z.object({ email: z.string().email(t('auth.emailInvalid')) }), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotFormValues) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', data);
      
      if (response.data?.status === 'success') {
        toast.success(
          t('auth.reset.sent'),
          t('auth.reset.sentTitle')
        );
      }
    } catch (err: any) {
      console.error(err);
      toast.error(t('auth.reset.sendError'), t('common.error'));
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
              {t('auth.reset.title')}
            </h2>
            <p className="mt-1 text-xs text-text-muted dark:text-slate-400 max-w-xs leading-relaxed">
              {t('auth.reset.description')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
            <Input
              label={t('auth.email')}
              type="email"
              placeholder="your.email@institution.ac.in"
              error={errors.email?.message}
              {...register('email')}
            />

            <Button type="submit" className="w-full h-11 text-xs font-bold shadow-md" isLoading={isLoading}>
              {t('auth.reset.send')}
            </Button>
          </form>

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

export default ForgotPassword;
