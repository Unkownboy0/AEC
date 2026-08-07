import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { toast } from '../components/ui/Toast';
import { GraduationCap, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import api from '../lib/axios';

const loginSchema = z.object({
  email: z.string().min(1, 'Email, Username, or ID is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const { login: authLogin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Display expiration warnings if any
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('expired') === 'true') {
      toast.warn('Your session has expired. Please sign in again.', 'Session Expired');
    }
  }, [location]);

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', data);

      if (response.data?.status === 'success') {
        const { accessToken, refreshToken, user } = response.data.data;
        authLogin(accessToken, refreshToken, user);
        toast.success(`Logged in as ${user.role}`, `Welcome, ${user.firstName}!`);

        const from = (location.state as any)?.from?.pathname || '/';
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      console.warn('[Login] Authentication error:', err);

      const enableDemo = import.meta.env.VITE_ENABLE_DEMO_MODE === 'true';
      if (enableDemo) {
        // Explicit opt-in development demo user fallback mapping
        const emailLower = data.email.toLowerCase();
        let fallbackUser: any = null;

        if (emailLower.includes('john') || emailLower.includes('student')) {
          fallbackUser = { id: 'usr-student-01', email: 'john.smith@gmail.com', firstName: 'John', lastName: 'Smith', role: 'STUDENT', permissions: ['student:read'] };
        } else if (emailLower.includes('cse.head') || emailLower.includes('hod')) {
          fallbackUser = { id: 'usr-hod-01', email: 'cse.head@geetorus.com', firstName: 'Dr. Rahul', lastName: 'Sharma', role: 'HOD', permissions: ['hod:all'] };
        } else if (emailLower.includes('principal')) {
          fallbackUser = { id: 'usr-principal-01', email: 'principal@geetorus.com', firstName: 'Dr. V.K.', lastName: 'Verma', role: 'PRINCIPAL', permissions: ['principal:all'] };
        } else if (emailLower.includes('vp')) {
          fallbackUser = { id: 'usr-vp-01', email: 'vp@geetorus.com', firstName: 'Dr. Anita', lastName: 'Deshmukh', role: 'VICE_PRINCIPAL', permissions: ['vp:all'] };
        } else if (emailLower.includes('ada') || emailLower.includes('faculty')) {
          fallbackUser = { id: 'usr-faculty-01', email: 'ada.lovelace@geetorus.com', firstName: 'Ada', lastName: 'Lovelace', role: 'FACULTY', permissions: ['faculty:all'] };
        } else if (emailLower.includes('parent')) {
          fallbackUser = { id: 'usr-parent-01', email: 'parent@gmail.com', firstName: 'Ramesh', lastName: 'Smith', role: 'PARENT', permissions: ['parent:all'] };
        } else if (emailLower.includes('admin')) {
          fallbackUser = { id: 'usr-admin-01', email: 'admin@geetorus.com', firstName: 'System', lastName: 'Administrator', role: 'SUPER_ADMIN', permissions: ['admin:all'] };
        }

        if (fallbackUser) {
          authLogin('demo-access-token', 'demo-refresh-token', fallbackUser);
          toast.success(`Logged in as ${fallbackUser.role} (Demo Mode)`, `Welcome, ${fallbackUser.firstName}!`);
          const from = (location.state as any)?.from?.pathname || '/';
          navigate(from, { replace: true });
          return;
        }
      }

      toast.error(err.response?.data?.message || err.message || 'Check email or password', 'Authentication Failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafafa] dark:bg-[#09090b] px-4 py-12 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="w-full max-w-md space-y-6">
        {/* Card Container */}
        <div className="bg-white dark:bg-[#0c0c0e] border border-neutral-200/80 dark:border-neutral-800/80 p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] animate-in fade-in-50 duration-200">
          
          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground mb-4 shadow-[0_4px_12px_rgba(var(--primary),0.2)]">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
              GEETORUS CAMPUSOS
            </h2>
            <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
              Enter your credentials to access the portal
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <Input
              label="Email, Username, or ID"
              type="text"
              placeholder="Enter email, username, or registration ID"
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="relative w-full">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[34px] p-1.5 rounded text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex flex-wrap items-center gap-2 cursor-pointer font-medium text-neutral-600 dark:text-neutral-400">
                <input
                  type="checkbox"
                  className="rounded border-neutral-300 dark:border-neutral-700 text-primary focus:ring-primary h-4 w-4"
                  {...register('rememberMe')}
                />
                Remember Me
              </label>

              <Link
                to="/forgot-password"
                className="font-semibold text-primary hover:text-primary/95 transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            <Button type="submit" className="w-full h-11 text-xs" isLoading={isLoading}>
              Sign In
            </Button>
          </form>

          {/* 1-Tap Quick Demo Role Logins */}
          <div className="mt-6 border-t border-neutral-100 dark:border-neutral-800/60 pt-4">
            <div className="flex justify-center mb-3">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-bold border border-primary/20">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>1-Tap Quick Demo Logins</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { role: 'Student', email: 'john.smith@gmail.com', pwd: 'Campus@123', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
                { role: 'Faculty', email: 'ada.lovelace@geetorus.com', pwd: 'Campus@123', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
                { role: 'HOD', email: 'cse.head@geetorus.com', pwd: 'Campus@123', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
                { role: 'Principal', email: 'principal@geetorus.com', pwd: 'Campus@123', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
                { role: 'Vice Principal', email: 'vp@geetorus.com', pwd: 'VP@123456', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
                { role: 'Academic Dean', email: 'academic.dean@geetorus.com', pwd: 'AcaDean@123', color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20' },
                { role: 'Parent', email: 'parent@gmail.com', pwd: 'Campus@123', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
                { role: 'Super Admin', email: 'admin@geetorus.com', pwd: 'Admin@123', color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' },
              ].map((account) => (
                <button
                  key={account.role}
                  type="button"
                  onClick={() => {
                    onSubmit({ email: account.email, password: account.pwd, rememberMe: true });
                  }}
                  className={`flex flex-col items-start p-2 rounded-xl border transition-all text-left hover:scale-102 active:scale-98 cursor-pointer ${account.color}`}
                >
                  <span className="text-[11px] font-extrabold">{account.role}</span>
                  <span className="text-[9px] opacity-80 truncate w-full">{account.email}</span>
                </button>
              ))}
            </div>

            <p className="text-center text-[10px] text-neutral-400 pt-3 border-t border-neutral-100 dark:border-neutral-800/40 mt-3 font-medium">
              Tap any role above for instant demo login with real data & workflows.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
