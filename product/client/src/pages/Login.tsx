import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { toast } from '../components/ui/Toast';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import api from '../lib/axios';
import { getRoleHome } from '../navigation/role-home';
import { useInstitution } from '../context/InstitutionContext';
import { consumePendingDeepLink } from '../platform/pending-deep-link';
import { useLanguage } from '../context/LanguageContext';
import { InstitutionLogo } from '../components/common/InstitutionLogo';

type LoginFormValues = { email: string; password: string; rememberMe: boolean };

const Login: React.FC = () => {
  const { login: authLogin, isAuthenticated, user: currentUser } = useAuth();
  const { resolved } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { collegeName } = useInstitution();
  const { t } = useLanguage();

  const loginSchema = useMemo(() => z.object({
    email: z.string().min(1, t('auth.login.identifierRequired')),
    password: z.string().min(1, t('auth.login.passwordRequired')),
    rememberMe: z.boolean().optional().default(false),
  }), [t]);

  const [loginError, setLoginError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  // Automatically clear error banner when user edits credentials
  useEffect(() => {
    const subscription = watch(() => {
      if (loginError) setLoginError(null);
    });
    return () => subscription.unsubscribe();
  }, [watch, loginError]);

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
      toast.warn(t('auth.login.sessionExpired'), t('auth.login.sessionExpiredTitle'));
    }
  }, [location, t]);

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setLoginError(null);
    try {
      const response = await api.post('/auth/login', {
        email: data.email.trim(),
        password: data.password,
        rememberMe: Boolean(data.rememberMe),
      });

      if (response.data?.status === 'success') {
        const { accessToken, refreshToken, user } = response.data.data;
        await authLogin(accessToken, refreshToken, user);
        toast.success(t('auth.login.loggedInAs', { role: user.role }), t('auth.login.welcome', { name: user.firstName }));

        // Priority: (1) cold-launch notification deep link, (2) router guard redirect, (3) role home
        const pendingDeepLink = consumePendingDeepLink();
        const requestedPath = (location.state as any)?.from?.pathname;
        const from = pendingDeepLink
          || (requestedPath && requestedPath !== '/404' ? requestedPath : null)
          || getRoleHome(user);
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      const status = err.response?.status;
      const serverMsg = err.response?.data?.message;

      let msg = serverMsg;
      if (!msg) {
        if (err.message === 'Network Error' || !err.response) {
          msg = 'Unable to reach CampusOS. Check your connection and try again.';
          toast.error(msg, 'Network Error');
        } else if (status === 401) {
          msg = 'Invalid email, username, ID, or password.';
        } else if (status === 403) {
          msg = 'Your account is currently unavailable. Contact the administrator.';
        } else if (status >= 500) {
          msg = 'CampusOS could not sign you in right now. Please try again.';
          toast.error(msg, 'Server Error');
        } else {
          msg = t('auth.login.failed');
        }
      } else {
        // If infrastructure error, show toast as well
        if (status >= 500 || err.message === 'Network Error') {
          toast.error(msg, 'Connection Error');
        }
      }

      setLoginError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-dvh flex flex-col justify-center items-center bg-surface-secondary dark:bg-[#07090E] px-4 py-6 sm:py-10 pt-safe pb-safe transition-colors duration-200 overflow-x-hidden overflow-y-auto">
      {/* Background Institutional Watermark (3% subtle opacity) */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden select-none">
        <InstitutionLogo
          variant="watermark"
          className="w-[75vw] max-w-[480px] h-auto"
        />
      </div>

      <div className="relative z-10 w-full max-w-md my-auto space-y-4">
        {/* Card Container */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{
            opacity: 1,
            y: 0,
            x: loginError ? [0, -6, 6, -4, 4, 0] : 0,
          }}
          transition={{
            duration: 0.25,
            x: { duration: 0.3, ease: 'easeInOut' },
          }}
          className="bg-surface dark:bg-[#0E131F] border border-border dark:border-slate-800/90 p-6 sm:p-8 rounded-3xl shadow-xl dark:shadow-2xl backdrop-blur-md"
        >
          {/* Institution Logo & Header */}
          <div className="flex flex-col items-center text-center">
            <InstitutionLogo variant="login" size="lg" className="mb-4 transition-transform hover:scale-105" />
            <h1 className="text-xl sm:text-2xl font-black text-text-primary dark:text-white tracking-tight">
              {collegeName}
            </h1>
            <p className="text-xs text-text-muted dark:text-slate-400 mt-1 font-medium">
              {t('auth.login.system')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4 text-left">
            {loginError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </motion.div>
            )}

            <div>
              <label htmlFor="login-identifier" className="block text-xs font-bold text-text-secondary dark:text-slate-300 mb-1.5">
                {t('auth.login.identifier')}
              </label>
              <Input
                id="login-identifier"
                {...register('email')}
                placeholder={t('auth.login.identifierPlaceholder')}
                type="text"
                autoComplete="username"
                disabled={isLoading}
                className="w-full h-11 text-xs rounded-xl bg-surface-secondary dark:bg-[#161D2F] border-border dark:border-slate-800 focus:ring-2 focus:ring-primary/20 dark:text-white placeholder:text-muted-foreground/60"
              />
              {errors.email && (
                <p className="text-xs text-red-500 font-semibold mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="login-password" className="block text-xs font-bold text-text-secondary dark:text-slate-300">
                  {t('auth.login.password')}
                </label>
              </div>
              <div className="relative">
                <Input
                  id="login-password"
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.login.passwordPlaceholder')}
                  autoComplete="current-password"
                  disabled={isLoading}
                  className="w-full h-11 text-xs rounded-xl pr-10 bg-surface-secondary dark:bg-[#161D2F] border-border dark:border-slate-800 focus:ring-2 focus:ring-primary/20 dark:text-white placeholder:text-muted-foreground/60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-text-primary p-1 focus:outline-hidden"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 font-semibold mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  {...register('rememberMe')}
                  disabled={isLoading}
                  className="rounded-md border-border dark:border-slate-700 bg-surface-secondary dark:bg-[#161D2F] text-primary focus:ring-primary/20 w-4 h-4"
                />
                <span className="text-xs font-semibold text-text-secondary dark:text-slate-300">
                  {t('auth.login.rememberMe')}
                </span>
              </label>

              <Link
                to="/forgot-password"
                className="text-xs font-bold text-primary dark:text-primary-soft hover:underline"
              >
                {t('auth.login.forgotPassword')}
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 mt-2 text-xs font-bold rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.99] text-white shadow-md shadow-primary/25 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t('auth.login.signingIn')}</span>
                </div>
              ) : (
                t('auth.login.submit')
              )}
            </Button>
          </form>
        </motion.div>

        {/* Footer & Compliance */}
        <div className="text-center text-xs text-text-muted dark:text-slate-500 space-y-1 select-none">
          <div className="flex items-center justify-center gap-3">
            <Link to="/privacy-policy" className="hover:underline">{t('auth.login.privacy')}</Link>
            <span>•</span>
            <Link to="/terms-of-service" className="hover:underline">{t('auth.login.terms')}</Link>
          </div>
          <p className="text-[11px]">{t('auth.login.credit')}</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
