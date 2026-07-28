import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { toast } from '../components/ui/Toast';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowLeft, Mail, ExternalLink } from 'lucide-react';
import api from '../lib/axios';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotFormValues = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [resetLink, setResetLink] = useState<string | null>(null);

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
    setResetLink(null);
    try {
      const response = await api.post('/auth/forgot-password', data);
      
      if (response.data?.status === 'success') {
        const token = response.data.data?.resetToken;
        
        if (import.meta.env.DEV && token && token !== 'mock-token-dispatched') {
          // Expose the mock reset link in development UI for easy sandbox testing
          const localLink = `/reset-password?token=${token}`;
          setResetLink(localLink);
        }
        
        toast.success(
          import.meta.env.DEV 
            ? 'Password reset link generated. Check the development server console logs.'
            : 'Password reset instructions have been sent to your email address.',
          'Reset Link Sent'
        );
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Could not send reset link', 'Error');
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
              Reset Password
            </h2>
            <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400 max-w-xs leading-relaxed">
              Enter your registered email address and we will generate a password recovery link
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <Input
              label="Email Address"
              type="email"
              placeholder="admin@geetorus.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <Button type="submit" className="w-full h-11 text-xs" isLoading={isLoading}>
              Send Recovery Link
            </Button>
          </form>

          {/* Development Sandbox Link Box */}
          {resetLink && (
            <div className="mt-6 rounded-lg bg-primary/5 border border-primary/20 p-4 animate-in zoom-in-95 duration-200">
              <h4 className="text-xs font-bold text-primary flex flex-wrap items-center gap-1.5 mb-1.5">
                <Mail className="h-3.5 w-3.5" />
                <span>Sandbox Mode Link</span>
              </h4>
              <p className="text-[11px] text-muted-foreground leading-normal mb-3">
                Since we are in development mode, you can click this generated reset token directly:
              </p>
              <Link
                to={resetLink}
                className="inline-flex flex-wrap items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground hover:bg-primary/95 transition-colors"
              >
                Go to Password Reset
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
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

export default ForgotPassword;
