import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { toast } from '../components/ui/Toast';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowLeft } from 'lucide-react';
import api from '../lib/axios';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotFormValues = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

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
          'If the account exists, reset instructions will be sent.',
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
              placeholder="your.email@institution.ac.in"
              error={errors.email?.message}
              {...register('email')}
            />

            <Button type="submit" className="w-full h-11 text-xs" isLoading={isLoading}>
              Send Recovery Link
            </Button>
          </form>

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
