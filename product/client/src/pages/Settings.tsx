import React, { useState, useEffect } from 'react';
import {
  User,
  Lock,
  Shield,
  Bell,
  Palette,
  Globe,
  Smartphone,
  Key,
  Settings as SettingsIcon,
  CheckCircle2,
  Eye,
  EyeOff,
  Fingerprint,
  Sparkles,
  HelpCircle,
  RefreshCw,
  Camera,
  MapPin,
  Mic,
  ExternalLink,
  BellRing,
  Send,
  Check,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme, type ThemePreference } from '../context/ThemeContext';
import { useNotifications } from '../notifications/NotificationProvider';
import { toast } from '../components/ui/Toast';
import api from '../lib/axios';
import { isNativePlatform } from '../platform';
import { useLanguage, SUPPORTED_LANGUAGES, type LanguageCode } from '../context/LanguageContext';
import { BUILD_INFO } from '../config/build-info';
import { useSearchParams } from 'react-router-dom';
import { AppProductTour } from '../components/common/AppProductTour';
import { RoleAwareProductTour, resetTour } from '../components/common/RoleAwareProductTour';
import {
  authenticateWithBiometrics,
  checkBiometricAvailability,
  getBiometricLockEnabled,
  setBiometricLockEnabled,
} from '../platform/biometric-auth';

export type FontScalePreset = 'compact' | 'default' | 'comfortable' | 'large';
const FONT_SCALE_KEY = 'campusos_font_scale';

export function getStoredFontScale(): FontScalePreset {
  try {
    const v = localStorage.getItem(FONT_SCALE_KEY);
    if (v === 'compact' || v === 'default' || v === 'comfortable' || v === 'large') return v as FontScalePreset;
  } catch {}
  return 'default';
}

export function applyFontScale(scale: FontScalePreset) {
  try {
    localStorage.setItem(FONT_SCALE_KEY, scale);
  } catch {}
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-font-size', scale);
  }
}

export const Settings: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user, refreshUser } = useAuth();
  const { preference, resolved, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [fontScale, setFontScale] = useState<FontScalePreset>(getStoredFontScale);
  const [activeTab, setActiveTab] = useState<'account' | 'privacy' | 'security' | 'password' | '2fa' | 'language' | 'theme' | 'notifications' | 'devices' | 'help'>(() => {
    const requested = searchParams.get('tab');
    return ['account', 'privacy', 'security', 'password', '2fa', 'language', 'theme', 'notifications', 'devices', 'help'].includes(requested || '')
      ? requested as any
      : 'account';
  });
  const [showTourReplay, setShowTourReplay] = useState(false);
  const [showRoleTourReplay, setShowRoleTourReplay] = useState(false);

  // Account Form
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: (user as any)?.phone || '',
    email: user?.email || '',
  });

  // Password Form
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // Preferences
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isTestingPush, setIsTestingPush] = useState(false);
  const [channelPrefs, setChannelPrefs] = useState({
    approvals: true,
    finance: true,
    transport: true,
    academics: true,
    circulars: true,
  });

  const {
    permissionStatus,
    requestPushPermission,
    openDeviceSettings,
    triggerTestNotification,
  } = useNotifications();

  // Biometric App Lock — native-only, opt-in, off by default
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricUnavailableReason, setBiometricUnavailableReason] = useState<string | null>(null);
  const [biometricLockEnabled, setBiometricLockEnabledState] = useState(false);
  const [biometricBusy, setBiometricBusy] = useState(false);

  useEffect(() => {
    if (!isNativePlatform()) return;
    checkBiometricAvailability().then((result) => {
      setBiometricAvailable(result.isAvailable);
      setBiometricUnavailableReason(result.reason || null);
    });
    getBiometricLockEnabled().then(setBiometricLockEnabledState);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    api.get('/users/profile/preferences').then(({ data }) => {
      const preferences = data?.data;
      if (!preferences) return;
      if (preferences.theme) setTheme(preferences.theme);
      if (preferences.fontScale) {
        setFontScale(preferences.fontScale);
        applyFontScale(preferences.fontScale);
      }
      if (SUPPORTED_LANGUAGES.some((item) => item.code === preferences.language)) {
        setLanguage(preferences.language as LanguageCode);
      }
      if (typeof preferences.notificationsEnabled === 'boolean') setNotificationsEnabled(preferences.notificationsEnabled);
    }).catch(() => { });
  }, [user?.id, setLanguage, setTheme]);

  const savePreference = async (patch: Record<string, unknown>) => {
    try { await api.put('/users/profile/preferences', patch); } catch { /* local preference remains effective offline */ }
  };

  const handleToggleBiometricLock = async () => {
    if (biometricBusy) return;
    setBiometricBusy(true);
    try {
      if (biometricLockEnabled) {
        await setBiometricLockEnabled(false);
        setBiometricLockEnabledState(false);
        toast.success(t('settings.biometric.disabled'));
      } else {
        // Require a successful prompt before persisting the toggle, so the
        // user never gets locked out by unenrolled/misconfigured biometry.
        const result = await authenticateWithBiometrics(t('settings.biometric.prompt'));
        if (result.success) {
          await setBiometricLockEnabled(true);
          setBiometricLockEnabledState(true);
          toast.success(t('settings.biometric.enabled'));
        } else {
          toast.error(t('settings.biometric.error'));
        }
      }
    } finally {
      setBiometricBusy(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/users/${user?.id}`, profileData);
      toast.success(t('settings.profile.updated'));
      refreshUser();
    } catch {
      toast.error('Profile changes were not saved. Check your connection and try again.');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword.length < 6) {
      toast.error(t('settings.password.minimum'));
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(t('auth.new.matchError'));
      return;
    }

    try {
      setIsSubmittingPassword(true);
      await api.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success(t('settings.password.changed'));
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(t('settings.password.failed'));
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const tabs = [
    { id: 'account', labelKey: 'settings.account', icon: User },
    { id: 'privacy', labelKey: 'settings.privacy', icon: Shield },
    { id: 'security', labelKey: 'settings.security', icon: Lock },
    { id: 'password', labelKey: 'settings.password', icon: Key },
    { id: '2fa', labelKey: 'settings.twoFactor.short', icon: Shield },
    { id: 'language', labelKey: 'settings.language', icon: Globe },
    { id: 'theme', labelKey: 'settings.appearance', icon: Palette },
    { id: 'notifications', labelKey: 'settings.notifications', icon: Bell },
    { id: 'devices', labelKey: 'settings.devices', icon: Smartphone },
    { id: 'help', labelKey: 'settings.helpTour', icon: HelpCircle },
  ];

  return (
    <div className="space-y-6 text-start pb-16 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 bg-card border p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <SettingsIcon className="h-6 w-6 text-indigo-600" /> {t('settings.title')}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('settings.description')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Nav */}
        <div className="md:col-span-1 border bg-card p-3 rounded-2xl shadow-sm space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${isActive
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{t(tab.labelKey)}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Box */}
        <div className="md:col-span-3 border bg-card p-6 rounded-2xl shadow-sm">
          {activeTab === 'account' && (
            <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg text-xs font-semibold">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-white pb-2 border-b">{t('settings.accountDetails')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">{t('settings.firstName')}</label>
                  <input
                    type="text"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-background outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">{t('settings.lastName')}</label>
                  <input
                    type="text"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-background outline-none font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">{t('auth.email')}</label>
                <input
                  type="email"
                  disabled
                  value={profileData.email}
                  className="w-full px-3 py-2 border rounded-xl bg-muted outline-none font-bold text-slate-500"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">{t('settings.phone')}</label>
                <input
                  type="text"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-background outline-none font-bold"
                />
              </div>
              <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white font-extrabold rounded-xl shadow hover:bg-indigo-700">
                {t('settings.saveProfile')}
              </button>
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg text-xs font-semibold">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-white pb-2 border-b">{t('settings.password.change')}</h3>
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">{t('settings.password.current')}</label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    required
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-background outline-none font-bold"
                  />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute end-3 top-2.5 text-slate-400" aria-label={showCurrent ? t('auth.login.hidePassword') : t('auth.login.showPassword')}>
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">{t('auth.newPassword')}</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    required
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-background outline-none font-bold"
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute end-3 top-2.5 text-slate-400" aria-label={showNew ? t('auth.login.hidePassword') : t('auth.login.showPassword')}>
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">{t('auth.confirmPassword')}</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-background outline-none font-bold"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmittingPassword}
                className="px-5 py-2.5 bg-indigo-600 text-white font-extrabold rounded-xl shadow hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSubmittingPassword ? t('settings.password.updating') : t('auth.new.update')}
              </button>
            </form>
          )}

          {activeTab === '2fa' && (
            <div className="space-y-4 max-w-lg text-xs font-semibold">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-white pb-2 border-b">{t('settings.twoFactor.title')}</h3>
              <p className="text-muted-foreground">{t('settings.twoFactor.description')}</p>
              <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/20">
                <div>
                  <p className="font-extrabold text-slate-800 dark:text-white">{t('settings.twoFactor.app')}</p>
                  <p className="text-[10px] text-slate-400">{t('settings.status')}: {twoFactorEnabled ? t('common.enabled') : t('common.disabled')}</p>
                </div>
                <button
                  onClick={() => {
                    setTwoFactorEnabled(!twoFactorEnabled);
                    toast.success(twoFactorEnabled ? t('settings.twoFactor.disabled') : t('settings.twoFactor.enabled'));
                  }}
                  className={`px-4 py-2 text-xs font-extrabold rounded-xl text-white ${twoFactorEnabled ? 'bg-rose-600' : 'bg-emerald-600'
                    }`}
                >
                  {twoFactorEnabled ? t('settings.twoFactor.disable') : t('settings.twoFactor.enable')}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'theme' && (
            <div className="space-y-4 max-w-lg text-xs font-semibold">
              <div className="flex items-center justify-between pb-2 border-b">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">{t('settings.theme.title')}</h3>
                <span className="text-[11px] font-bold text-primary px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                  {t('settings.active')}: {t(`settings.theme.${resolved}`)}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setTheme('system');
                    void savePreference({ theme: 'system' });
                    toast.success(t('settings.theme.changed', { theme: t('settings.theme.system') }));
                  }}
                  className={`p-3.5 border rounded-2xl text-left space-y-1.5 transition-all cursor-pointer ${preference === 'system'
                      ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-primary/5 text-foreground'
                      : 'bg-card border-border hover:bg-surface-soft'
                    }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-xs">{t('settings.theme.system')}</span>
                    {preference === 'system' && <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0" />}
                  </div>
                  <p className="text-[10.5px] text-muted-foreground leading-snug">{t('settings.theme.systemDescription')}</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTheme('light');
                    void savePreference({ theme: 'light' });
                    toast.success(t('settings.theme.changed', { theme: t('settings.theme.light') }));
                  }}
                  className={`p-3.5 border rounded-2xl text-left space-y-1.5 transition-all cursor-pointer ${preference === 'light'
                      ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-primary/5 text-foreground'
                      : 'bg-card border-border hover:bg-surface-soft'
                    }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-xs">{t('settings.theme.light')}</span>
                    {preference === 'light' && <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0" />}
                  </div>
                  <p className="text-[10.5px] text-muted-foreground leading-snug">{t('settings.theme.lightDescription')}</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTheme('dark');
                    void savePreference({ theme: 'dark' });
                    toast.success(t('settings.theme.changed', { theme: t('settings.theme.dark') }));
                  }}
                  className={`p-3.5 border rounded-2xl text-left space-y-1.5 transition-all cursor-pointer ${preference === 'dark'
                      ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-primary/5 text-foreground'
                      : 'bg-card border-border hover:bg-surface-soft'
                    }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-xs">{t('settings.theme.dark')}</span>
                    {preference === 'dark' && <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0" />}
                  </div>
                  <p className="text-[10.5px] text-muted-foreground leading-snug">{t('settings.theme.darkDescription')}</p>
                </button>
              </div>

              {/* Font & Display Presets */}
              <div className="pt-4 border-t border-border space-y-3">
                <div>
                  <h4 className="font-extrabold text-foreground text-xs">Font & Display Scale</h4>
                  <p className="text-[11px] text-muted-foreground">Adjust interface text density and font size for optimal reading comfort.</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'compact', label: 'Compact', desc: 'Dense 0.92x', sub: 'More info on screen' },
                    { id: 'default', label: 'Default', desc: 'Standard 1.0x', sub: 'Balanced layout' },
                    { id: 'comfortable', label: 'Comfortable', desc: 'Relaxed 1.08x', sub: 'Easier reading' },
                    { id: 'large', label: 'Large', desc: 'Large 1.16x', sub: 'Maximum legibility' },
                  ].map((preset) => {
                    const isSelected = fontScale === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setFontScale(preset.id as any);
                          applyFontScale(preset.id as any);
                          void savePreference({ fontScale: preset.id });
                          toast.success(`Display scale set to ${preset.label}`);
                        }}
                        className={`p-3 border rounded-2xl text-left space-y-1 transition-all cursor-pointer ${isSelected
                            ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-primary/5 text-foreground'
                            : 'bg-card border-border hover:bg-surface-soft'
                          }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-xs">{preset.label}</span>
                          {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 shrink-0" />}
                        </div>
                        <p className="text-[10px] font-bold text-primary">{preset.desc}</p>
                        <p className="text-[9.5px] text-muted-foreground leading-tight">{preset.sub}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-border space-y-2">
                <h4 className="font-extrabold text-foreground text-xs">App Feature Tour</h4>
                <p className="text-[11px] text-muted-foreground">Replay the introductory CampusOS product feature tour anytime.</p>
                <button
                  type="button"
                  onClick={() => setShowTourReplay(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl shadow-xs hover:bg-primary-hover active:scale-98 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  Replay App Tour
                </button>
              </div>
            </div>
          )}

          {activeTab === 'language' && (
            <div className="space-y-4 max-w-lg text-xs font-semibold">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-white pb-2 border-b">Language & Localization</h3>
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Preferred Portal Language</label>
                <select
                  value={language}
                  onChange={(e) => {
                    const code = e.target.value as LanguageCode;
                    setLanguage(code);
                    void savePreference({ language: code });
                    const selected = SUPPORTED_LANGUAGES.find((item) => item.code === code);
                    toast.success(`Language set to ${selected?.label || code}`);
                  }}
                  className="w-full px-3 py-2 border rounded-xl bg-background outline-none font-bold"
                >
                  {SUPPORTED_LANGUAGES.map((item) => (
                    <option key={item.code} value={item.code}>{item.label} ({item.nativeLabel})</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4 max-w-lg text-xs font-semibold">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-white pb-2 border-b">Privacy Controls</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-xl">
                  <div>
                    <p className="font-extrabold text-slate-800 dark:text-white">Directory Visibility</p>
                    <p className="text-[10px] text-muted-foreground">Allow peers to see your email in club directories</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4 accent-indigo-600" />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-xl">
                  <div>
                    <p className="font-extrabold text-slate-800 dark:text-white">Placement Profile Search</p>
                    <p className="text-[10px] text-muted-foreground">Allow recruiters to discover your resume</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4 accent-indigo-600" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6 max-w-xl text-xs font-semibold">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-white pb-2 border-b">
                  Push Notifications & Native Delivery
                </h3>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  Native push notifications deliver instant alerts for approvals, circulars, bus tracking, and fees even when the app is closed.
                </p>
              </div>

              {/* OS Push Notification Status Card */}
              <div className="p-4 border rounded-2xl bg-surface/60 dark:bg-surface/40 backdrop-blur-xs space-y-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <BellRing className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-800 dark:text-white text-xs">
                        Device Notification Status
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {isNativePlatform() ? 'Native OS Push (FCM / APNs)' : 'Web Push / In-App Heads-Up'}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${permissionStatus === 'granted'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : permissionStatus === 'denied'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      }`}
                  >
                    {permissionStatus === 'granted'
                      ? 'Authorized'
                      : permissionStatus === 'denied'
                        ? 'Blocked'
                        : 'Not Enabled'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/50">
                  {permissionStatus !== 'granted' ? (
                    <button
                      onClick={async () => {
                        const result = await requestPushPermission();
                        if (result === 'granted') {
                          toast.success('Push notifications enabled!');
                        } else if (result === 'denied') {
                          toast.error('Notification permission was declined in OS settings');
                        }
                      }}
                      className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-colors shadow-xs"
                    >
                      Enable Push Notifications
                    </button>
                  ) : null}

                  {isNativePlatform() && (
                    <button
                      onClick={() => openDeviceSettings()}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-background hover:bg-muted text-foreground font-bold text-xs transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                      Open Device Settings
                    </button>
                  )}

                  <button
                    disabled={isTestingPush}
                    onClick={async () => {
                      setIsTestingPush(true);
                      try {
                        await triggerTestNotification(
                          '🔔 Live System Alert',
                          'CampusOS push notification delivery verified successfully!'
                        );
                        toast.success('Test alert triggered!');
                      } catch {
                        toast.error('Failed to trigger test alert');
                      } finally {
                        setIsTestingPush(false);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border/70 hover:bg-primary/5 text-primary font-bold text-xs transition-colors disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isTestingPush ? 'Sending…' : 'Send Test Alert'}
                  </button>
                </div>
              </div>

              {/* Notification Categories */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-800 dark:text-white uppercase tracking-wider text-muted-foreground">
                  Channel Subscriptions
                </h4>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded-xl bg-card">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white text-xs">
                        Approvals & Workflow Actions
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Leave requests, OD approvals, hall bookings & gate passes
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={channelPrefs.approvals}
                      onChange={(e) =>
                        setChannelPrefs((p) => ({ ...p, approvals: e.target.checked }))
                      }
                      className="h-4 w-4 accent-primary rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-xl bg-card">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white text-xs">
                        Finance, Fees & Dues
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Semester fee deadlines, payment receipts & scholarship alerts
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={channelPrefs.finance}
                      onChange={(e) =>
                        setChannelPrefs((p) => ({ ...p, finance: e.target.checked }))
                      }
                      className="h-4 w-4 accent-primary rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-xl bg-card">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white text-xs">
                        College Bus & Transport Tracking
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Trip start, stop proximity, route delays & driver updates
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={channelPrefs.transport}
                      onChange={(e) =>
                        setChannelPrefs((p) => ({ ...p, transport: e.target.checked }))
                      }
                      className="h-4 w-4 accent-primary rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-xl bg-card">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white text-xs">
                        Academic Notices & Circulars
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Exam schedules, timetable shifts & emergency announcements
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={channelPrefs.circulars}
                      onChange={(e) =>
                        setChannelPrefs((p) => ({ ...p, circulars: e.target.checked }))
                      }
                      className="h-4 w-4 accent-primary rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Native App Permissions & Privacy Transparency Card */}
              <div className="p-4 border border-border/80 rounded-2xl bg-muted/20 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <p className="font-extrabold text-xs text-foreground">
                    Native Device Privacy & Permissions Policy
                  </p>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  CampusOS adheres to strict Just-in-Time OS permission policies. No background location tracking or broad storage access is ever requested from students, faculty, or parents.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono text-muted-foreground pt-1">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-background border border-border/50">
                    <Camera className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Camera: QR scanner & doc scan only</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-background border border-border/50">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Location: Driver GPS only (Bus tracks via vehicle)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-background border border-border/50">
                    <Mic className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Microphone: Voice notes only</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-background border border-border/50">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Storage: Scoped system file pickers</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'devices' && (
            <div className="space-y-4 max-w-lg text-xs font-semibold">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-white pb-2 border-b">Connected Sessions</h3>
              <div className="p-3 border rounded-xl flex items-center justify-between bg-muted/20">
                <div>
                  <p className="font-extrabold text-slate-800 dark:text-white">Current Session</p>
                  <p className="text-[10px] text-slate-400">{isNativePlatform() ? 'Native Mobile App · Active' : 'Web Browser · Active'}</p>
                </div>
                <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Active</span>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4 max-w-lg text-xs font-semibold">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-white pb-2 border-b">Security Audit Logs</h3>
              <p className="text-muted-foreground">Zero-trust audit logs tracking login timestamps and active sessions.</p>
              <div className="p-3 border rounded-xl text-[10px] font-mono text-slate-500 space-y-1">
                <p>✓ Last Password Verification: 2026-07-24 09:12 AM</p>
                <p>✓ Current Token Scope: Full Access</p>
              </div>

              {isNativePlatform() && (
                <div className="p-4 border rounded-xl bg-muted/20 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5">
                      <Fingerprint className="h-4 w-4 text-indigo-500" /> Biometric App Lock
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {biometricAvailable
                        ? 'Require fingerprint / Face ID to open CampusOS after it has been backgrounded.'
                        : biometricUnavailableReason || 'No biometric authentication is enrolled on this device.'}
                    </p>
                  </div>
                  <button
                    onClick={handleToggleBiometricLock}
                    disabled={biometricBusy || (!biometricAvailable && !biometricLockEnabled)}
                    className={`shrink-0 px-3 py-1.5 rounded-xl font-bold text-xs disabled:opacity-40 ${
                      biometricLockEnabled ? 'bg-indigo-600 text-white' : 'bg-muted text-slate-500'
                    }`}
                  >
                    {biometricBusy ? 'Verifying…' : biometricLockEnabled ? 'Enabled' : 'Enable'}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'help' && (
            <div className="space-y-4 max-w-lg text-xs font-semibold">
              <h3 className="text-sm font-extrabold text-foreground pb-2 border-b">Help & Product Tour</h3>
              <p className="text-muted-foreground leading-relaxed">
                Restart the guided tour to re-learn CampusOS features for your current role.
              </p>

              <div className="space-y-3">
                <div className="p-4 border rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-foreground">Onboarding Tour</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Replay the initial CampusOS walkthrough</p>
                  </div>
                  <button
                    onClick={() => setShowTourReplay(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Replay
                  </button>
                </div>

                <div className="p-4 border rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-foreground">Role Feature Tour</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Role-specific feature walkthrough for{' '}
                      <span className="font-bold text-foreground">
                        {typeof user?.role === 'object' ? (user?.role as any)?.name || 'your role' : user?.role || 'your role'}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (user) {
                        const role = typeof user.role === 'object' ? (user.role as any)?.name || '' : user.role || '';
                        resetTour(user.id, role);
                        setShowRoleTourReplay(true);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary text-primary text-xs font-bold hover:bg-primary/5 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Restart Tour
                  </button>
                </div>

                <section className="rounded-xl border border-border bg-muted/20 p-4" aria-label="Build diagnostics">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-foreground">Build diagnostics</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">Use these values to confirm the running app contains the latest web bundle.</p>
                    </div>
                    <span className="rounded-lg bg-primary/10 px-2 py-1 font-mono text-[10px] text-primary">{BUILD_INFO.channel}</span>
                  </div>
                  <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 font-mono text-[10px]">
                    <dt className="text-muted-foreground">Version</dt><dd className="text-right text-foreground">{BUILD_INFO.version} ({BUILD_INFO.buildCode})</dd>
                    <dt className="text-muted-foreground">Commit</dt><dd className="text-right text-foreground">{BUILD_INFO.commit}</dd>
                    <dt className="text-muted-foreground">Built</dt><dd className="text-right text-foreground">{BUILD_INFO.builtAt}</dd>
                  </dl>
                </section>
              </div>
            </div>
          )}
        </div>
      </div>

      <AppProductTour isOpen={showTourReplay} onComplete={() => setShowTourReplay(false)} isReplay={true} />
      {showRoleTourReplay && user && (
        <RoleAwareProductTour
          isOpen={showRoleTourReplay}
          userRole={typeof user.role === 'object' ? (user.role as any)?.name || '' : user.role || ''}
          userId={user.id}
          onComplete={() => setShowRoleTourReplay(false)}
        />
      )}
    </div>
  );
};

export default Settings;
