import React, { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import CommandPalette from './CommandPalette';
import * as LucideIcons from 'lucide-react';
import { LayoutDashboard, Bell, Menu, X, Lock, KeyRound, Eye, EyeOff, ShieldAlert, Home, MessageSquare, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDevice } from '../../context/DeviceContext';
import { toast } from '../ui/Toast';
import api from '../../lib/axios';

const MainLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileLogoutConfirmOpen, setIsMobileLogoutConfirmOpen] = useState(false);
  const { user, refreshUser, logout } = useAuth();
  const { isMobile, isTablet } = useDevice();

  // Force Password Change Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!passwordForm.currentPassword) {
      setPasswordError('Current Password is required.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New Password must be at least 6 characters long.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    try {
      setIsSubmittingPassword(true);
      const res = await api.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (res.data?.status === 'success' || res.status === 200) {
        toast.success('Password updated successfully. Session activated!');
        setPasswordSuccess(true);
        setTimeout(async () => {
          await refreshUser();
        }, 1000);
      }
    } catch (err: any) {
      console.error(err);
      setPasswordError(err.response?.data?.message || 'Failed to update password. Check current password.');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground relative">
      
      {/* Mobile Drawer Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-in fade-in-50 duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar navigation (Desktop & Tablet collapsible) */}
      {!isMobile && (
        <div className="flex-shrink-0">
          <Sidebar isCollapsed={isCollapsed || isTablet} setIsCollapsed={setIsCollapsed} />
        </div>
      )}

      {/* Mobile Navigation Drawer */}
      {isMobile && (
        <div className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-card border-r shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex h-16 items-center justify-between border-b px-4 bg-muted/10 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <span className="font-extrabold tracking-tight text-sm">CAMPUSOS</span>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="h-8 w-8 rounded-full border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
          
          <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
            {user?.menus?.map((item: any) => {
              const Icon = (LucideIcons as any)[item.icon] || LucideIcons.Layers;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3.5 py-3 text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-primary/10 text-primary shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`
                  }
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}

            <div className="border-t pt-3 mt-3 space-y-1">
              <NavLink
                to="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
              >
                <LucideIcons.User className="h-4.5 w-4.5 shrink-0" />
                <span>My Profile</span>
              </NavLink>

              <NavLink
                to="/settings"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
              >
                <LucideIcons.Settings className="h-4.5 w-4.5 shrink-0" />
                <span>Settings</span>
              </NavLink>

              <div className="border-t my-2" />

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsMobileLogoutConfirmOpen(true);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all"
              >
                <LucideIcons.LogOut className="h-4.5 w-4.5 shrink-0 text-rose-600" />
                <span>Logout</span>
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Mobile Logout Confirmation Modal */}
      {isMobileLogoutConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in-50 duration-200">
          <div className="bg-card border rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-full text-rose-600">
                <LucideIcons.LogOut className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-foreground">Confirm Logout</h3>
                <p className="text-xs text-muted-foreground">Are you sure you want to logout?</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-xl">
              Logging out will end your current session. You will need to log back in to access your dashboard.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsMobileLogoutConfirmOpen(false)}
                className="px-4 py-2 rounded-xl border text-xs font-bold hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setIsMobileLogoutConfirmOpen(false);
                  await logout();
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-md transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Right viewport */}
      <div className={`flex flex-col flex-1 min-w-0 overflow-hidden ${isMobile ? 'pb-16' : ''}`}>
        
        {/* Header toolbar */}
        <header className="flex h-16 items-center justify-between border-b px-4 bg-card shrink-0">
          <div className="flex items-center gap-2">
            {isMobile && (
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="h-9 w-9 border rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
            <span className="font-extrabold tracking-tight text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded uppercase">
              {isMobile ? 'CampusOS' : 'Geetorus CampusOS'}
            </span>
          </div>
          <Header onOpenPalette={() => setIsPaletteOpen(true)} />
        </header>

        {/* Content canvas */}
        <main className="flex-1 overflow-y-auto bg-background/50 p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      {isMobile && user && (
        <nav className="fixed bottom-0 inset-x-0 h-16 bg-card border-t z-30 flex items-center justify-around shadow-lg animate-in slide-in-from-bottom-5">
          <NavLink to="/" className={({ isActive }) => `flex flex-col items-center gap-0.5 text-[9px] font-bold ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
            <Home className="h-4.5 w-4.5" /> Home
          </NavLink>
          <NavLink to="/notifications" className={({ isActive }) => `flex flex-col items-center gap-0.5 text-[9px] font-bold ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
            <Bell className="h-4.5 w-4.5" /> Notifications
          </NavLink>
          <NavLink to="/support" className={({ isActive }) => `flex flex-col items-center gap-0.5 text-[9px] font-bold ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
            <MessageSquare className="h-4.5 w-4.5" /> Messages
          </NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => `flex flex-col items-center gap-0.5 text-[9px] font-bold ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
            <LayoutDashboard className="h-4.5 w-4.5" /> Dashboard
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => `flex flex-col items-center gap-0.5 text-[9px] font-bold ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
            <User className="h-4.5 w-4.5" /> Profile
          </NavLink>
        </nav>
      )}

      {/* Global Command Palette */}
      <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />

      {/* Force Password Change Overlay */}
      {user?.forcePasswordChange && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in-50 duration-200">
          <div className="bg-card border border-border/80 w-full max-w-md rounded-2xl shadow-2xl p-6 md:p-8 space-y-6 relative overflow-hidden text-xs font-semibold">
            {/* Background design elements */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col items-center text-center space-y-2">
              <div className="p-3 bg-primary/10 text-primary rounded-2xl border border-primary/20">
                <Lock className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-black tracking-tight mt-2">Security Activation Required</h2>
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                For security compliance, you must change your temporary/default password before you can access Geetorus CampusOS.
              </p>
            </div>

            {passwordError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl flex items-start gap-2.5">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="text-[11px] leading-relaxed font-bold">{passwordError}</span>
              </div>
            )}

            {passwordSuccess ? (
              <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-center space-y-2 font-bold">
                <p className="text-sm">✓ Password Updated Successfully!</p>
                <p className="text-[11px] text-muted-foreground">Activating your secure portal session...</p>
              </div>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                    <KeyRound className="h-3 w-3" /> Current Password (Mobile Number)
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      placeholder="Enter registered mobile number"
                      className="w-full h-10 px-3 pr-10 border bg-background rounded-xl focus:outline-none focus:ring-1 focus:ring-primary font-bold text-xs"
                      disabled={isSubmittingPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                    <Lock className="h-3 w-3" /> New Password (min. 6 characters)
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full h-10 px-3 pr-10 border bg-background rounded-xl focus:outline-none focus:ring-1 focus:ring-primary font-bold text-xs"
                      disabled={isSubmittingPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full h-10 px-3 pr-10 border bg-background rounded-xl focus:outline-none focus:ring-1 focus:ring-primary font-bold text-xs"
                      disabled={isSubmittingPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingPassword}
                  className="w-full h-10 bg-primary hover:bg-primary/95 text-primary-foreground font-extrabold uppercase tracking-wider rounded-xl transition-all duration-200 shadow-md flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                >
                  {isSubmittingPassword ? 'Updating Security...' : 'Activate Portal Access'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MainLayout;
