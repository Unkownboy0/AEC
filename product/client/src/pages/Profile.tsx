import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  User, Mail, Phone, Building, GraduationCap, Shield, 
  KeyRound, Settings as SettingsIcon, LogOut, Edit3, X,
  Clock, Briefcase, Camera, Trash2
} from 'lucide-react';
import { toast } from '../components/ui/Toast';
import api from '../lib/axios';
import { ProfileAvatar } from '../components/profile/ProfileAvatar';
import { uploadProfileImage, removeProfileImage } from '../services/profile-media.api';

export const Profile: React.FC = () => {
  const { user, logout, updateUser, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoState, setPhotoState] = useState<'IDLE' | 'SELECTED' | 'UPLOADING' | 'UPDATED' | 'ERROR'>('IDLE');
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [editForm, setEditForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: '',
    gender: user?.gender || 'UNSPECIFIED',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [extendedData, setExtendedData] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    setEditForm({ firstName: user.firstName || '', lastName: user.lastName || '', phone: user.phone || '', gender: user.gender || 'UNSPECIFIED' });
  }, [user?.id, user?.firstName, user?.lastName, user?.phone, user?.gender]);

  useEffect(() => {
    // Fetch extended role details if available from canonical profile
    const fetchExtendedDetails = async () => {
      if (!user) return;
      try {
        const res = await api.get('/auth/me');
        const userData = res.data?.data?.user || res.data?.user;
        if (userData?.student) {
          setExtendedData(userData.student);
        } else if (userData?.faculty) {
          setExtendedData(userData.faculty);
        } else if (userData?.employee) {
          setExtendedData(userData.employee);
        }
      } catch (err) {
        // Fallback gracefully to user in auth state
        if (user.student) setExtendedData(user.student);
        else if (user.faculty) setExtendedData(user.faculty);
      }
    };
    fetchExtendedDetails();
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api.put('/auth/profile', editForm);
      if (res.data?.status === 'success') {
        updateUser({
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          phone: editForm.phone,
        });
        toast.success('Profile updated successfully!');
        setIsEditing(false);
        await refreshUser();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    try {
      const res = await api.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      if (res.data?.status === 'success' || res.status === 200) {
        toast.success('Password changed successfully');
        setIsPasswordModalOpen(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Password update failed');
    }
  };

  const handleUploadPhoto = async () => {
    if (!selectedPhoto) return;
    setPhotoState('UPLOADING');
    try {
      await uploadProfileImage(selectedPhoto);
      await refreshUser();
      setSelectedPhoto(null);
      setPhotoState('UPDATED');
      toast.success('Profile photo updated everywhere.');
    } catch (error: any) {
      setPhotoState('ERROR');
      toast.error(error?.response?.data?.message || error?.message || 'Profile photo upload failed.');
    }
  };

  const handleRemovePhoto = async () => {
    setPhotoState('UPLOADING');
    try {
      await removeProfileImage();
      await refreshUser();
      setSelectedPhoto(null);
      setPhotoState('UPDATED');
      toast.success('Profile photo removed.');
    } catch (error: any) {
      setPhotoState('ERROR');
      toast.error(error?.response?.data?.message || 'Unable to remove profile photo.');
    }
  };

  if (!user) return null;

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Super Admin': return 'bg-rose-50 text-rose-600 border-rose-200';
      case 'College Admin': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'Principal':
      case 'Vice Principal': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'HOD': return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'Faculty':
      case 'Mentor': return 'bg-indigo-50 text-indigo-600 border-indigo-200';
      case 'Student': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-in fade-in-50 duration-200">
      
      {/* 1. HERO PROFILE CARD */}
      <div className="relative rounded-3xl border bg-card p-6 md:p-8 shadow-sm overflow-hidden space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          
          {/* Avatar */}
          <div className="relative">
            <ProfileAvatar
              person={user}
              size="2xl"
              shape="rounded"
              className="border-4 border-background"
            />
            <span className="absolute bottom-1 right-1 h-5 w-5 bg-emerald-500 border-2 border-background rounded-full" title="Active Account" />
          </div>

          {/* User Basic Info */}
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-extrabold uppercase tracking-wider ${getRoleBadgeColor(user.role)}`}>
                {user.role}
              </span>
              <span className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                Verified Profile
              </span>
            </div>

            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
              {user.firstName} {user.lastName}
            </h1>

            <p className="text-xs text-muted-foreground font-mono">
              {user.email}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <button 
                onClick={() => setIsEditing(true)}
                className="px-3.5 py-1.5 rounded-xl border bg-background text-xs font-bold flex items-center gap-1.5 hover:bg-muted transition-colors"
              >
                <Edit3 className="h-3.5 w-3.5" /> Edit Profile
              </button>
              <button 
                onClick={() => setIsPasswordModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl border bg-background text-xs font-bold flex items-center gap-1.5 hover:bg-muted transition-colors"
              >
                <KeyRound className="h-3.5 w-3.5" /> Change Password
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;
                  setSelectedPhoto(file);
                  setPhotoState(file ? 'SELECTED' : 'IDLE');
                }}
              />
              <button type="button" onClick={() => photoInputRef.current?.click()} className="px-3.5 py-1.5 rounded-xl border bg-background text-xs font-bold flex items-center gap-1.5 hover:bg-muted transition-colors">
                <Camera className="h-3.5 w-3.5" /> Select photo
              </button>
              {selectedPhoto && (
                <button type="button" onClick={handleUploadPhoto} disabled={photoState === 'UPLOADING'} className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold disabled:opacity-60">
                  {photoState === 'UPLOADING' ? 'Uploading…' : 'Save photo'}
                </button>
              )}
              {user.profileImage?.fileId && !selectedPhoto && (
                <button type="button" onClick={handleRemovePhoto} disabled={photoState === 'UPLOADING'} className="px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 text-xs font-bold flex items-center gap-1.5 disabled:opacity-60">
                  <Trash2 className="h-3.5 w-3.5" /> Remove photo
                </button>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {photoState === 'SELECTED' && selectedPhoto ? `Selected: ${selectedPhoto.name}. Choose Save photo to upload.` : photoState === 'UPDATED' ? 'Updated across authorized CampusOS views.' : photoState === 'ERROR' ? 'Upload was not saved. Correct the file and retry.' : 'JPEG, PNG, or WebP · maximum 5 MB'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. ROLE-SPECIFIC DETAILS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Account Details */}
        <div className="border bg-card rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs uppercase font-extrabold tracking-wider text-muted-foreground flex items-center gap-2">
            <User className="h-4 w-4 text-primary" /> Personal & Account Information
          </h3>

          <div className="space-y-3 text-xs font-semibold">
            <div className="flex justify-between items-center p-2.5 border rounded-xl bg-background">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Email Address
              </span>
              <span className="font-mono text-[11px] truncate max-w-[180px]">{user.email}</span>
            </div>

            <div className="flex justify-between items-center p-2.5 border rounded-xl bg-background">
              <span className="text-muted-foreground">Gender</span>
              <span className="font-semibold">{String(user.gender || 'UNSPECIFIED').replaceAll('_', ' ')}</span>
            </div>

            <div className="flex justify-between items-center p-2.5 border rounded-xl bg-background">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> Phone Number
              </span>
              <span className="font-mono">{extendedData?.phone || user.phone || 'Not provided'}</span>
            </div>

            <div className="flex justify-between items-center p-2.5 border rounded-xl bg-background">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5" /> Department
              </span>
              <span className="font-bold text-primary">{extendedData?.department?.name || user.student?.department?.name || user.faculty?.department?.name || 'Not assigned'}</span>
            </div>

            {user.role === 'Student' && (
              <>
                <div className="flex justify-between items-center p-2.5 border rounded-xl bg-background">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5" /> Admission / Roll No
                  </span>
                  <span className="font-mono font-bold">{extendedData?.admissionNo || user.student?.admissionNo || 'Not assigned'}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 border rounded-xl bg-background">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Academic Term
                  </span>
                  <span className="font-bold">{extendedData?.academicYear?.name || extendedData?.academicYear || extendedData?.semester?.name || 'Not assigned'}</span>
                </div>
              </>
            )}

            {user.role !== 'Student' && (
              <div className="flex justify-between items-center p-2.5 border rounded-xl bg-background">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5" /> Employee ID
                </span>
                <span className="font-mono font-bold">{extendedData?.employeeId || user.faculty?.employeeId || user.employee?.employeeId || 'Not assigned'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Management & Actions */}
        <div className="border bg-card rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-muted-foreground flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" /> System Controls & Preferences
            </h3>

            <div className="space-y-2">
              <button 
                onClick={() => navigate('/settings')}
                className="w-full flex items-center justify-between p-3 border rounded-xl bg-background hover:bg-muted/40 transition-colors text-xs font-bold"
              >
                <div className="flex items-center gap-2">
                  <SettingsIcon className="h-4 w-4 text-muted-foreground" />
                  <span>System Preferences & Theme</span>
                </div>
                <span className="text-muted-foreground">→</span>
              </button>

              <button 
                onClick={() => setIsPasswordModalOpen(true)}
                className="w-full flex items-center justify-between p-3 border rounded-xl bg-background hover:bg-muted/40 transition-colors text-xs font-bold"
              >
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-muted-foreground" />
                  <span>Security & Password Settings</span>
                </div>
                <span className="text-muted-foreground">→</span>
              </button>
            </div>
          </div>

          {/* Logout Trigger Card */}
          <div className="pt-4 border-t space-y-3">
            <button
              onClick={() => setIsLogoutModalOpen(true)}
              className="w-full py-3 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <LogOut className="h-4 w-4" /> Sign Out of Account
            </button>
            <p className="text-center text-[10px] text-muted-foreground/80 font-medium">
              CampusOS • Developed by Geetorus
            </p>
          </div>
        </div>

      </div>

      {/* 3. EDIT PROFILE MODAL */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in-50 duration-200">
          <div className="bg-card border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-base">Edit Profile Information</h3>
              <button onClick={() => setIsEditing(false)} className="p-1 hover:bg-muted rounded"><X className="h-4 w-4" /></button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-muted-foreground block mb-1">First Name</label>
                <input 
                  type="text" 
                  value={editForm.firstName} 
                  onChange={e => setEditForm({ ...editForm, firstName: e.target.value })}
                  className="w-full p-2.5 border rounded-xl bg-background font-semibold"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-muted-foreground block mb-1">Gender</label>
                <select value={editForm.gender} onChange={e => setEditForm({ ...editForm, gender: e.target.value })} className="w-full p-2.5 border rounded-xl bg-background font-semibold">
                  <option value="UNSPECIFIED">Unspecified</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                  <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-muted-foreground block mb-1">Last Name</label>
                <input 
                  type="text" 
                  value={editForm.lastName} 
                  onChange={e => setEditForm({ ...editForm, lastName: e.target.value })}
                  className="w-full p-2.5 border rounded-xl bg-background font-semibold"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 border rounded-xl font-bold">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90">
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. CHANGE PASSWORD MODAL */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in-50 duration-200">
          <div className="bg-card border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-base">Change Account Password</h3>
              <button onClick={() => setIsPasswordModalOpen(false)} className="p-1 hover:bg-muted rounded"><X className="h-4 w-4" /></button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-muted-foreground block mb-1">Current Password</label>
                <input 
                  type="password" 
                  value={passwordForm.currentPassword} 
                  onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full p-2.5 border rounded-xl bg-background font-semibold"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-muted-foreground block mb-1">New Password</label>
                <input 
                  type="password" 
                  value={passwordForm.newPassword} 
                  onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full p-2.5 border rounded-xl bg-background font-semibold"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-muted-foreground block mb-1">Confirm New Password</label>
                <input 
                  type="password" 
                  value={passwordForm.confirmPassword} 
                  onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full p-2.5 border rounded-xl bg-background font-semibold"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="px-4 py-2 border rounded-xl font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90">
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. LOGOUT CONFIRMATION MODAL */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in-50 duration-200">
          <div className="bg-card border rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-full text-rose-600">
                <LogOut className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-foreground">Confirm Logout</h3>
                <p className="text-xs text-muted-foreground">Are you sure you want to logout?</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-xl">
              Logging out will terminate your current session. You will be redirected to the login page.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="px-4 py-2 rounded-xl border text-xs font-bold hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setIsLogoutModalOpen(false);
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

    </div>
  );
};

export default Profile;
