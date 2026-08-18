import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { toast } from '../components/ui/Toast';
import { GraduationCap, Eye, EyeOff, Wifi, Server, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../lib/axios';
import { API_BASE_URL } from '../config/api-config';
import { Capacitor } from '@capacitor/core';
import { getRoleHome } from '../navigation/role-home';
import { useInstitution } from '../context/InstitutionContext';
import { consumePendingDeepLink } from '../platform/pending-deep-link';

const loginSchema = z.object({
  email: z.string().min(1, 'Email, Username, or ID is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const { login: authLogin, isAuthenticated, user: currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { collegeName } = useInstitution();

  const [loginError, setLoginError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<'checking' | 'connected' | 'error' | 'idle'>('idle');
  const [serverPingLatency, setServerPingLatency] = useState<number | null>(null);
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [customServerIp, setCustomServerIp] = useState(() => {
    return typeof window !== 'undefined' ? (localStorage.getItem('campusos_api_lan_ip') || '') : '';
  });

  // Check server health on mount for mobile
  useEffect(() => {
    let isMounted = true;
    const testHealth = async () => {
      setServerStatus('checking');
      const start = Date.now();
      try {
        const res = await api.get('/health', { timeout: 4000 });
        if (isMounted) {
          if (res.status === 200 || res.data?.status === 'success' || res.data?.status === 'healthy') {
            setServerStatus('connected');
            setServerPingLatency(Date.now() - start);
          } else {
            setServerStatus('error');
          }
        }
      } catch (e) {
        if (isMounted) setServerStatus('error');
      }
    };
    testHealth();
    return () => { isMounted = false; };
  }, []);

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
      const pendingDeepLink = consumePendingDeepLink();
      const target = pendingDeepLink || getRoleHome(currentUser);
      navigate(target, { replace: true });
    }
  }, [isAuthenticated, navigate, currentUser]);

  // Display expiration warnings if any
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('expired') === 'true') {
      toast.warn('Your session has expired. Please sign in again.', 'Session Expired');
    }
  }, [location]);

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setLoginError(null);
    try {
      const response = await api.post('/auth/login', data);

      if (response.data?.status === 'success') {
        const { accessToken, refreshToken, user } = response.data.data;
        await authLogin(accessToken, refreshToken, user);
        toast.success(`Logged in as ${user.role}`, `Welcome, ${user.firstName}!`);

        // Priority: (1) cold-launch notification deep link, (2) router guard redirect, (3) role home
        const pendingDeepLink = consumePendingDeepLink();
        const requestedPath = (location.state as any)?.from?.pathname;
        const from = pendingDeepLink
          || (requestedPath && requestedPath !== '/404' ? requestedPath : null)
          || getRoleHome(user);
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Check email or password';
      console.error('[Login] Authentication error:', err);
      setLoginError(msg);
      toast.error(msg, 'Authentication Failed');
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
              {collegeName}
            </h2>
            <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
              Enter your credentials to access the portal
            </p>
          </div>

          {loginError && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-medium">
              {loginError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
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

          {/* Legal links — required for App Store */}
          <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-center gap-4">
            <Link to="/privacy-policy" className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <span className="text-muted-foreground/30 text-[10px]">·</span>
            <Link to="/terms" className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </Link>
          </div>

        </div>

        {/* Mobile Server Connection Diagnostics */}
        <div className="bg-white/60 dark:bg-[#0c0c0e]/60 backdrop-blur border border-neutral-200/60 dark:border-neutral-800/60 rounded-xl p-3 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${
                serverStatus === 'connected' ? 'bg-emerald-500 animate-pulse' :
                serverStatus === 'checking' ? 'bg-amber-500 animate-ping' :
                serverStatus === 'error' ? 'bg-rose-500' : 'bg-neutral-400'
              }`} />
              <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-300">
                Server: {serverStatus === 'connected' ? `Connected (${serverPingLatency}ms)` : serverStatus === 'checking' ? 'Checking connection...' : 'Offline / Unreachable'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowServerConfig(!showServerConfig)}
              className="text-[10px] text-primary font-semibold hover:underline"
            >
              {showServerConfig ? 'Hide Settings' : 'Configure IP'}
            </button>
          </div>

          <div className="mt-1 text-[10px] text-neutral-400 font-mono truncate">
            {API_BASE_URL || 'http://192.168.2.160:5000/api'}
          </div>

          {showServerConfig && (
            <div className="mt-3 pt-3 border-t border-neutral-200/50 dark:border-neutral-800/50 space-y-2">
              <p className="text-[10px] text-neutral-500">
                If connecting to PC over Wi-Fi, enter your PC's IP (e.g. <code>192.168.2.160</code> or <code>localhost</code> for USB reverse):
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="192.168.2.160 or localhost"
                  value={customServerIp}
                  onChange={(e) => setCustomServerIp(e.target.value)}
                  className="flex-1 px-2.5 py-1 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200"
                />
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('campusos_api_lan_ip', customServerIp.trim());
                    window.location.reload();
                  }}
                  className="px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded hover:opacity-90"
                >
                  Save & Reload
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('campusos_api_lan_ip', '192.168.2.160');
                    window.location.reload();
                  }}
                  className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded text-[10px]"
                >
                  Wi-Fi (192.168.2.160)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('campusos_api_lan_ip', 'localhost');
                    window.location.reload();
                  }}
                  className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded text-[10px]"
                >
                  USB Cable (localhost)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
