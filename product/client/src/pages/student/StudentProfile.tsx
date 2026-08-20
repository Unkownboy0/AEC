import React, { useState, useEffect } from 'react';
import { User, Shield, Key, Sparkles, Upload } from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';
import api from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';
import { resolveAssetUrl } from '../../utils/assets';

export const StudentProfile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const [formData, setFormData] = useState<any>({
    firstName: '', lastName: '', preferredName: '', phone: '', altPhone: '', email: '',
    currentAddress: '', permanentAddress: '', city: '', district: '', state: '', country: '', pinCode: '',
    emergencyContactName: '', emergencyContactPhone: '', emergencyContactRelation: '',
    parentPhone: '', parentEmail: '', linkedin: '', github: '', portfolio: '',
    technicalSkills: '', softSkills: '', languagesKnown: '', certifications: '',
    careerObjective: '', areasOfInterest: ''
  });

  const [photoBase64, setPhotoBase64] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        // Canonical user profile fetch
        const res = await api.get('/auth/me');
        const userData = res.data?.data?.user || res.data?.user || user;
        const student = userData?.student;
        
        if (student || userData) {
          setStudentInfo(student || userData);
          setFormData({
            firstName: student?.firstName || userData?.firstName || '',
            lastName: student?.lastName || userData?.lastName || '',
            preferredName: student?.preferredName || '',
            phone: student?.phone || userData?.phone || '',
            altPhone: student?.altPhone || '',
            email: student?.email || userData?.email || '',
            currentAddress: student?.currentAddress || '',
            permanentAddress: student?.permanentAddress || '',
            city: student?.city || '',
            district: student?.district || '',
            state: student?.state || '',
            country: student?.country || '',
            pinCode: student?.pinCode || '',
            emergencyContactName: student?.emergencyContactName || '',
            emergencyContactPhone: student?.emergencyContactPhone || '',
            emergencyContactRelation: student?.emergencyContactRelation || '',
            parentPhone: student?.parentPhone || '',
            parentEmail: student?.parentEmail || '',
            linkedin: student?.linkedin || '',
            github: student?.github || '',
            portfolio: student?.portfolio || '',
            technicalSkills: student?.technicalSkills || '',
            softSkills: student?.softSkills || '',
            languagesKnown: student?.languagesKnown || '',
            certifications: student?.certifications || '',
            careerObjective: student?.careerObjective || '',
            areasOfInterest: student?.areasOfInterest || ''
          });
        }
      } catch (err) {
        toast.error('Failed to load profile details.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Url = event.target?.result as string;
      setPhotoBase64(base64Url);
      const base64Data = base64Url.split(';base64,').pop() || '';
      try {
        await api.put('/users/profile/avatar', {
          name: file.name || 'avatar.jpg',
          mimeType: file.type || 'image/jpeg',
          base64: base64Data,
        });
        toast.success('Profile photo updated successfully.');
        await refreshUser();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to update profile photo.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const payload = { ...formData };
      delete (payload as any).profilePhoto;
      const res = await api.put('/users/profile', payload);
      if (res.data?.status === 'success' || res.data?.success) {
        toast.success('Profile saved permanently.');
        setIsEditing(false);
        await refreshUser();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save profile changes.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setChangingPassword(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      toast.success('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error('Password change failed.');
    } finally {
      setChangingPassword(false);
    }
  };

  if (isLoading) return <Loading text="Loading profile..." />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-in fade-in duration-200">
      
      {studentInfo && (
        <div className="border bg-card p-5 rounded-2xl shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
          <div>
            <p className="text-[9px] uppercase font-black tracking-wider text-slate-400">Permanent Branch</p>
            <p className="text-xs font-black text-slate-850 dark:text-white mt-1">
              {studentInfo.programDepartment?.name || studentInfo.department?.name || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-[9px] uppercase font-black tracking-wider text-slate-400">Academic Department</p>
            <p className="text-xs font-black text-slate-850 dark:text-white mt-1">
              {studentInfo.department?.name || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-[9px] uppercase font-black tracking-wider text-slate-400">Current Semester</p>
            <p className="text-xs font-black text-indigo-600 mt-1">
              {studentInfo.semester?.name || `Semester ${studentInfo.semester?.number || 'N/A'}`}
            </p>
          </div>
          <div>
            <p className="text-[9px] uppercase font-black tracking-wider text-slate-400">Current Year</p>
            <p className="text-xs font-black text-slate-850 dark:text-white mt-1">
              {studentInfo.semester?.number <= 2 ? 'First Year' : 
               studentInfo.semester?.number <= 4 ? 'Second Year' : 
               studentInfo.semester?.number <= 6 ? 'Third Year' : 'Final Year'}
            </p>
          </div>
        </div>
      )}

      <div className="border bg-card p-6 rounded-xl shadow-sm space-y-4">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
          <User className="h-5 w-5 text-primary" /> Profile Management
        </h2>
        
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex flex-col md:flex-row items-center gap-6 pb-6 border-b">
            <div className="h-24 w-24 rounded-full bg-primary/10 border relative overflow-hidden flex items-center justify-center shrink-0">
              {photoBase64 || user?.profilePhoto ? (
                <img
                  src={photoBase64 ? photoBase64 : resolveAssetUrl(user?.profilePhoto)}
                  className="h-full w-full object-cover"
                  alt="Student Profile"
                />
              ) : (
                <User className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            {isEditing && (
              <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-background text-xs font-bold cursor-pointer hover:bg-muted transition-colors">
                <Upload className="h-4 w-4" /> Upload New Photo
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.keys(formData).map((key) => (
              <div key={key} className="space-y-1 text-left">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">{key.replace(/([A-Z])/g, ' $1')}</label>
                <input
                  type="text"
                  value={formData[key]}
                  disabled={!isEditing}
                  onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border bg-background disabled:opacity-60"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            {isEditing ? (
              <>
                <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 border text-xs font-bold rounded-lg hover:bg-muted transition-all">Cancel</button>
                <button type="submit" disabled={savingProfile} className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg shadow hover:bg-primary/95 transition-all">Save Changes</button>
              </>
            ) : (
              <button type="button" onClick={() => setIsEditing(true)} className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg shadow hover:bg-primary/95 transition-all">Edit Profile</button>
            )}
          </div>
        </form>
      </div>

      {/* Password and 2FA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border bg-card p-6 rounded-xl shadow-sm space-y-4 text-left">
          <h3 className="text-xs uppercase font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5">
            <Key className="h-4 w-4 text-primary" /> Update Password
          </h3>
          <form onSubmit={handlePasswordUpdate} className="space-y-3">
            <input type="password" placeholder="Current Password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full text-xs p-2.5 rounded-lg border bg-background" />
            <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full text-xs p-2.5 rounded-lg border bg-background" />
            <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full text-xs p-2.5 rounded-lg border bg-background" />
            <button type="submit" disabled={changingPassword} className="w-full py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/95 transition-all">Update Credentials</button>
          </form>
        </div>

        <div className="border bg-card p-6 rounded-xl shadow-sm space-y-4 text-left flex flex-col justify-between">
          <div>
            <h3 className="text-xs uppercase font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-primary" /> Two-Factor Authentication
            </h3>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Secure your account with an extra layer of protection. Once enabled, you'll need to enter a verification code from your authenticator app during login.
            </p>
          </div>
          <button className="w-full py-2 border text-xs font-bold rounded-lg hover:bg-muted transition-all">
            Configure 2FA Security
          </button>
        </div>
      </div>
    </div>
  );
};
export default StudentProfile;
