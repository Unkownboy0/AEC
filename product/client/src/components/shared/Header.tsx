import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sun, Moon, ChevronDown, Lock, KeyRound, MonitorSmartphone, Bell, Search, AlertCircle, User, Sparkles } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { toast } from '../ui/Toast';
import api from '../../lib/axios';

const passwordStrengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .regex(
        passwordStrengthRegex,
        'Password must contain uppercase, lowercase, numbers, and special characters'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;

interface HeaderProps {
  onOpenPalette: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenPalette }) => {
  const { user, logoutAll } = useAuth();
  const { theme, setTheme } = useTheme();
  const { simulation, stopRoleSimulation } = usePermissions();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', phone: '' });
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const location = useLocation();
  const navigate = useNavigate();

  // Load and poll notifications
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // 10s auto-refresh
    
    // Request HTML5 Web Notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data?.status === 'success') {
        const list = res.data.data;
        setNotifications(list);
        
        // Count unread system announcements
        const unread = list.length; 
        setUnreadCount(unread);
        
        // Show real-time browser/toast alerts and native OS notifications
        const newest = list[0];
        if (newest && newest.createdAt) {
          const createdTime = new Date(newest.createdAt).getTime();
          const lastSeenStr = localStorage.getItem('last_seen_notification');
          const lastSeen = lastSeenStr ? parseInt(lastSeenStr, 10) : 0;
          if (createdTime > lastSeen) {
            localStorage.setItem('last_seen_notification', String(createdTime));
            // Trigger in-app toast
            toast.info(newest.content, newest.title);

            // Trigger OS native notification popup
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(newest.title, {
                body: newest.content,
              });
            }
          }
        }
      }
    } catch (err) {
      console.error('[Header notifications fetch] error:', err);
    }
  };

  const openEditProfile = () => {
    setIsDropdownOpen(false);
    if (user?.role === 'Student') {
      navigate('/student/profile');
    } else if (user?.role === 'HOD') {
      navigate('/hod/profile');
    } else if (user?.role === 'Faculty') {
      navigate('/?tab=profile');
    } else {
      setProfileForm({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        phone: '',
      });
      setIsEditProfileOpen(true);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const res = await api.put('/users/profile', profileForm);
      if (res.data?.status === 'success') {
        toast.success('Your profile information has been updated successfully.', 'Profile Saved');
        setIsEditProfileOpen(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Profile update failed.');
    } finally {
      setIsSavingProfile(false);
    }
  };


  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/users')) return 'User Management';
    if (path.startsWith('/settings')) return 'System Settings';
    if (path.startsWith('/academics')) return 'Academic Configuration';
    if (path.startsWith('/masters')) return 'Master Data Lists';
    if (path.startsWith('/backups')) return 'Database Backups';
    if (path.startsWith('/media')) return 'Media Library';
    if (path.startsWith('/security')) return 'Security & Audits';
    if (path.startsWith('/notifications')) return 'Notifications Console';
    if (path.startsWith('/reports')) return 'Reports Panel';
    return 'GEETORUS CAMPUSOS';
  };

  const handlePasswordSubmit = async (data: ChangePasswordFormValues) => {
    setIsSavingPassword(true);
    try {
      const response = await api.post('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      if (response.data?.status === 'success') {
        toast.success(
          'Your password has been changed. All other device sessions were terminated.',
          'Password Changed'
        );
        setIsChangePasswordOpen(false);
        reset();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Incorrect current password', 'Change Failed');
    } finally {
      setIsSavingPassword(false);
    }
  };



  return (
    <header className="flex h-16 w-full items-center justify-between border-b bg-card px-6 text-card-foreground">
      {/* Title */}
      <div className="flex items-center gap-4">
        <h1 className="text-sm font-bold tracking-tight hidden sm:block">{getPageTitle()}</h1>
        
        {simulation.isSimulating && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold text-amber-700 animate-in fade-in duration-200">
            <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
            <span>Simulating Role: <strong>{simulation.simulatedRole}</strong></span>
            <button
              onClick={stopRoleSimulation}
              className="ml-1 text-[10px] underline hover:text-amber-900"
            >
              Exit
            </button>
          </div>
        )}

        {/* Vercel Search bar trigger */}
        <button
          onClick={onOpenPalette}
          className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/60 transition-all duration-150 w-44 md:w-56"
        >
          <span className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5" />
            <span>Search...</span>
          </span>
          <kbd className="hidden md:inline-flex h-4.5 select-none items-center gap-0.5 rounded border bg-card px-1 font-mono text-[9px] font-bold text-muted-foreground opacity-100">
            <span>Ctrl</span>K
          </kbd>
        </button>
      </div>

      {/* Action Utilities */}
      <div className="flex items-center gap-4">
        {/* User Role Tag */}
        {user && (
          <div className="hidden items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary uppercase tracking-wider md:flex">
            <span>{user.role}</span>
          </div>
        )}

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              setUnreadCount(0);
            }}
            className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150"
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-destructive animate-pulse" />
            )}
          </button>

          {isNotificationsOpen && (
            <>
              <div onClick={() => setIsNotificationsOpen(false)} className="fixed inset-0 z-30" />
              <div className="absolute right-0 mt-2.5 w-72 origin-top-right rounded-xl border bg-card p-2 shadow-xl ring-1 ring-black/5 z-40 animate-in fade-in-50 slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b mb-1 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-foreground">Recent Notifications</h3>
                  <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="space-y-1 max-h-60 overflow-y-auto divide-y">
                  {notifications.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground text-center py-4">No recent notifications</p>
                  ) : (
                    notifications.map((alert: any) => (
                      <div
                        key={alert.id}
                        onClick={() => {
                          setIsNotificationsOpen(false);
                          if (alert.title?.includes('Circular') || alert.content?.includes('circular')) {
                            navigate('/faculty/circulars');
                          } else if (alert.title?.includes('Request') || alert.content?.includes('request') || alert.content?.includes('Leave / OD Requests') || alert.title?.includes('Approved') || alert.title?.includes('Rejected') || alert.title?.includes('Status')) {
                            if (user?.role === 'Faculty') {
                              navigate('/?tab=leave_requests');
                            } else if (user?.role === 'Student') {
                              navigate('/?tab=requests');
                            } else if (user?.role === 'HOD') {
                              navigate('/?tab=workflows');
                            }
                          }
                        }}
                        className="p-2 hover:bg-muted rounded-lg transition-colors cursor-pointer pt-2 first:pt-1 text-left"
                      >
                        <h4 className="text-xs font-bold text-foreground">{alert.title}</h4>
                        <p className="text-[10px] text-muted-foreground leading-normal mt-0.5">{alert.content}</p>
                        <span className="text-[9px] text-neutral-400 font-medium block mt-1">{new Date(alert.createdAt).toLocaleDateString('en-IN')}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Theme Switcher */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150"
        >
          {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
        </button>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xs overflow-hidden">
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} className="h-full w-full object-cover" alt="Avatar" />
              ) : (
                user ? `${user.firstName[0]}${user.lastName[0]}` : 'U'
              )}
            </div>
            <ChevronDown className="h-4 w-4" />
          </button>

          {isDropdownOpen && (
            <>
              <div onClick={() => setIsDropdownOpen(false)} className="fixed inset-0 z-30" />
              <div className="absolute right-0 mt-2.5 w-60 origin-top-right rounded-xl border bg-card p-1.5 shadow-xl ring-1 ring-black/5 z-40 animate-in fade-in-50 slide-in-from-top-2 duration-150">
                
                {/* User Info */}
                <div className="px-3 py-2 border-b">
                  <p className="text-sm font-bold text-foreground">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate leading-normal font-mono">
                    {user?.email}
                  </p>
                </div>
                
                {/* Actions */}
                <div className="py-1">
                  <button
                    onClick={openEditProfile}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <User className="h-3.5 w-3.5" />
                    Edit Profile
                  </button>

                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsChangePasswordOpen(true);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    Change Password
                  </button>
                  
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      logoutAll();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <MonitorSmartphone className="h-3.5 w-3.5" />
                    Logout from All Devices
                  </button>
                </div>

              </div>
            </>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        title="Edit Profile Information"
        size="sm"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl border">
            <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-extrabold shrink-0">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-extrabold">{user?.firstName} {user?.lastName}</p>
              <p className="text-[10px] text-muted-foreground">{user?.email}</p>
              <p className="text-[10px] text-primary font-bold uppercase tracking-wider">{user?.role}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">First Name</label>
              <input
                type="text"
                value={profileForm.firstName}
                onChange={e => setProfileForm({...profileForm, firstName: e.target.value})}
                className="h-9 border rounded-lg bg-background px-3 text-xs font-semibold"
                placeholder="First name"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Last Name</label>
              <input
                type="text"
                value={profileForm.lastName}
                onChange={e => setProfileForm({...profileForm, lastName: e.target.value})}
                className="h-9 border rounded-lg bg-background px-3 text-xs font-semibold"
                placeholder="Last name"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">Phone / Contact Number</label>
            <input
              type="tel"
              value={profileForm.phone}
              onChange={e => setProfileForm({...profileForm, phone: e.target.value})}
              className="h-9 border rounded-lg bg-background px-3 text-xs font-semibold"
              placeholder="+91 XXXXX XXXXX"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => setIsEditProfileOpen(false)} disabled={isSavingProfile}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSavingProfile}>
              Save Profile
            </Button>
          </div>
        </form>
      </Modal>

      {/* Change Password Portal Modal */}
      <Modal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        title="Update Account Password"
        size="sm"
      >
        <form onSubmit={handleSubmit(handlePasswordSubmit)} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            placeholder="••••••••"
            error={errors.currentPassword?.message}
            {...register('currentPassword')}
          />
          <Input
            label="New Password"
            type="password"
            placeholder="••••••••"
            error={errors.newPassword?.message}
            {...register('newPassword')}
          />
          <Input
            label="Confirm New Password"
            type="password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <div className="rounded-lg bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-150 p-3 flex gap-2">
            <KeyRound className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <p className="text-[10px] text-muted-foreground leading-normal">
              Changing your password will immediately revoke all active sessions on other browser devices for security.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsChangePasswordOpen(false)}
              disabled={isSavingPassword}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSavingPassword}>
              Save Password
            </Button>
          </div>
        </form>
      </Modal>
    </header>
  );
};

export default Header;
