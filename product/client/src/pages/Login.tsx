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
      console.error(err);
      toast.error(err.message || 'Check email or password', 'Authentication Failed');
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

          {/* Seed accounts notice */}
          <div className="mt-6 border-t border-neutral-100 dark:border-neutral-800/60 pt-4">
            <div className="flex justify-center mb-2">
              <div className="inline-flex flex-wrap items-center gap-1.5 rounded-full bg-neutral-50 dark:bg-neutral-900/50 px-2.5 py-1 text-[10px] font-mono font-medium text-neutral-500 border border-neutral-200/50 dark:border-neutral-800/50">
                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                <span>Dev Seeded Accounts</span>
              </div>
            </div>
            <div className="space-y-0.5 text-[10px] font-mono text-neutral-400 leading-relaxed">
              {[
                { role: 'Super Admin',    email: 'admin@geetorus.com',          pwd: 'Admin@123'    },
                { role: 'College Admin',  email: 'college.admin@geetorus.com',  pwd: 'ColAdmin@123' },
                { role: 'Principal',      email: 'principal@geetorus.com',      pwd: 'Campus@123'   },
                { role: 'Vice Principal', email: 'vp@geetorus.com',             pwd: 'VP@123456'    },
                { role: 'Academic Dean',  email: 'academic.dean@geetorus.com',  pwd: 'AcaDean@123'  },
                { role: 'Admission Dean', email: 'admission.dean@geetorus.com', pwd: 'AdmDean@123'  },
                { role: 'HOD',            email: 'cse.head@geetorus.com',       pwd: 'Campus@123'   },
                { role: 'Faculty',        email: 'ada.lovelace@geetorus.com',   pwd: 'Campus@123'   },
                { role: 'Student',        email: 'john.smith@gmail.com',        pwd: 'Campus@123'   },
                { role: 'Parent',         email: 'parent@gmail.com',            pwd: 'Campus@123'   },
              ].map(a => (
                <div key={a.email} className="flex flex-wrap justify-between gap-2 px-1">
                  <span className="text-neutral-500 font-semibold w-24 shrink-0">{a.role}</span>
                  <span className="truncate">{a.email}</span>
                  <span className="text-emerald-600 font-bold shrink-0">{a.pwd}</span>
                </div>
              ))}
              <p className="text-center text-[9px] text-neutral-400 pt-1 border-t border-neutral-100 dark:border-neutral-800/40 mt-1">
                New users created via IAM: Username = Email · Password = Phone Number
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
