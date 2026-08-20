import React, { useState, useEffect, useRef } from 'react';
import {
  User, Mail, Phone, Calendar, Briefcase, Award, Camera, Lock,
  Eye, EyeOff, MapPin, Building2, CheckCircle
} from 'lucide-react';
import api from '../../lib/axios';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
  <div className="flex items-center gap-2 border-b pb-3 mb-4">
    <span className="text-primary">{icon}</span>
    <h4 className="text-xs font-extrabold uppercase tracking-wider text-foreground">{title}</h4>
  </div>
);

// ─── Field ────────────────────────────────────────────────────────────────────
const Field: React.FC<{
  label: string;
  value?: string | number | null;
  span?: boolean;
}> = ({ label, value, span }) => (
  <div className={span ? 'md:col-span-2' : ''}>
    <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">{label}</span>
    <p className="text-sm font-bold mt-0.5 text-foreground">{value || <span className="text-muted-foreground font-normal">Not provided</span>}</p>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export const HODProfile: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const photoInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch profile on mount ──────────────────────────────────────────────────
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/auth/me');
      if (res.data?.status === 'success') {
        setProfile(res.data.data.user);
      } else {
        toast.error('Failed to load profile. Please refresh the page.');
      }
    } catch (err: any) {
      console.error('[HODProfile] fetchProfile error:', err);
      toast.error(err.response?.data?.message || 'Could not load profile.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Change password ─────────────────────────────────────────────────────────
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwdForm.currentPassword) { toast.error('Current password is required.'); return; }
    if (pwdForm.newPassword.length < 6) { toast.error('New password must be at least 6 characters.'); return; }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) { toast.error('New passwords do not match.'); return; }

    try {
      const res = await api.post('/auth/change-password', {
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword,
      });
      if (res.data?.status === 'success') {
        toast.success('✅ Password changed successfully.');
        setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Password change failed.';
      console.error('[HODProfile] changePassword error:', err.response?.data || err);
      toast.error(`❌ ${msg}`);
    }
  };

  // ── Profile photo upload ────────────────────────────────────────────────────
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!ALLOWED.includes(file.type)) {
      toast.error('Only JPG, PNG or WEBP images are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Profile photo must be under 5MB.');
      return;
    }

    setPhotoUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const rawBase64 = reader.result as string;
          const base64Data = rawBase64.includes(';base64,') ? rawBase64.split(';base64,')[1] : rawBase64;
          const uploadPayload = {
            name: file.name,
            mimeType: file.type,
            base64: base64Data,
          };

          const res = await api.put('/users/profile/avatar', uploadPayload);
          if (res.data?.status === 'success' || res.data?.success) {
            toast.success('✅ Profile photo updated successfully.');
            await fetchProfile();
          } else {
            toast.error(res.data?.message || 'File upload failed.');
          }
        } catch (err: any) {
          const msg = err.response?.data?.message || err.message || 'Photo upload failed.';
          toast.error(`❌ ${msg}`);
        } finally {
          setPhotoUploading(false);
          if (photoInputRef.current) photoInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast.error('Failed to initiate file upload.');
      setPhotoUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loading text="Loading HOD Profile..." />
      </div>
    );
  }

  const fac  = profile?.faculty;
  const dept = fac?.department;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight uppercase text-foreground">My Profile</h2>
          <p className="text-xs text-muted-foreground font-semibold mt-0.5">
            HOD Account · Identity, Role & Academic Assignment
          </p>
        </div>
      </div>

      {/* Profile Banner Card */}
      <div className="border bg-card rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="h-24 w-24 rounded-2xl bg-primary/10 border-2 border-primary/30 overflow-hidden flex items-center justify-center shadow-md">
                {profile?.profilePhoto ? (
                  <img
                    src={profile.profilePhoto}
                    className="h-full w-full object-cover"
                    alt="Profile"
                    onError={e => (e.currentTarget.style.display = 'none')}
                  />
                ) : (
                  <span className="text-3xl font-black text-primary select-none">
                    {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                  </span>
                )}
              </div>
              <label
                className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-1.5 cursor-pointer hover:bg-primary/80 transition-colors shadow-md"
                title="Upload profile photo"
              >
                {photoUploading ? (
                  <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
                )}
                <input
                  ref={photoInputRef}
                  type="file"
                  className="hidden"
                  accept="image/jpg,image/jpeg,image/png,image/webp"
                  onChange={handlePhotoUpload}
                />
              </label>
            </div>

            {/* Identity */}
            <div className="flex-1 space-y-2 text-center md:text-left">
              <h3 className="text-2xl font-black text-foreground">
                {profile?.firstName} {profile?.lastName}
              </h3>
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {fac?.designation || 'HOD'}
                </span>
                <span className="bg-slate-100 border text-slate-600 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                  {dept?.name || 'Department'}
                </span>
                <span className={`border text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                  profile?.status === 'ACTIVE'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}>
                  {profile?.status || 'ACTIVE'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs font-semibold text-muted-foreground mt-3">
                <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-primary shrink-0" /> EMP ID: <b className="text-foreground">{fac?.employeeId || '—'}</b></span>
                <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-primary shrink-0" /> {profile?.email}</span>
                <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-primary shrink-0" /> {profile?.phone || fac?.phone || 'Not provided'}</span>
                <span className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5 text-primary shrink-0" /> {fac?.qualification || '—'}</span>
                <span className="flex items-center gap-1.5"><Award className="h-3.5 w-3.5 text-primary shrink-0" /> {fac?.experience != null ? `${fac.experience} years experience` : '—'}</span>
                <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-primary shrink-0" /> Joined: {fac?.dateOfJoining ? new Date(fac.dateOfJoining).toLocaleDateString('en-IN') : '—'}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
              <div className="border bg-card/80 rounded-xl px-5 py-3 text-center shadow-sm">
                <span className="text-2xl font-black text-primary block">{fac?.experience ?? '—'}</span>
                <span className="text-[9px] uppercase font-bold text-muted-foreground">Yrs Exp.</span>
              </div>
              <div className="border bg-card/80 rounded-xl px-5 py-3 text-center shadow-sm">
                <span className="text-2xl font-black text-emerald-600 block">2026–27</span>
                <span className="text-[9px] uppercase font-bold text-muted-foreground">Acad. Year</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── READ-ONLY VIEW ── */}
      <div className="space-y-5">
        {/* Professional */}
        <div className="border bg-card p-6 rounded-2xl shadow-sm">
          <SectionHeader icon={<Briefcase className="h-4 w-4" />} title="Professional Information" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <Field label="Designation"           value={fac?.designation} />
            <Field label="Qualification"         value={fac?.qualification} />
            <Field label="Experience"            value={fac?.experience != null ? `${fac.experience} years` : null} />
            <Field label="Highest Qualification" value={fac?.highestQualification} />
            <Field label="Specialization"        value={fac?.specialization} />
            <Field label="Research Area"         value={fac?.researchArea} />
          </div>
        </div>

        {/* Department */}
        <div className="border bg-card p-6 rounded-2xl shadow-sm">
          <SectionHeader icon={<Building2 className="h-4 w-4" />} title="Department Assignment" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <Field label="Department"    value={dept?.name} />
            <Field label="Department ID" value={dept?.code || dept?.id?.slice(0, 8)} />
            <Field label="Employee ID"   value={fac?.employeeId} />
            <Field label="Date of Joining" value={fac?.dateOfJoining ? new Date(fac.dateOfJoining).toLocaleDateString('en-IN') : null} />
            <Field label="Employment Type" value={fac?.employmentType} />
            <Field label="Faculty Type"    value={fac?.facultyType} />
          </div>
        </div>

        {/* Contact */}
        <div className="border bg-card p-6 rounded-2xl shadow-sm">
          <SectionHeader icon={<Phone className="h-4 w-4" />} title="Contact Details" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <Field label="Primary Phone"   value={profile?.phone || fac?.phone} />
            <Field label="Personal Phone"  value={fac?.personalPhone} />
            <Field label="Alternate Phone" value={fac?.alternatePhone} />
            <Field label="Emergency Name"  value={fac?.emergencyName} />
            <Field label="Emergency Phone" value={fac?.emergencyPhone} />
            <Field label="Personal Email"  value={fac?.personalEmail} />
          </div>
        </div>

        {/* Address */}
        <div className="border bg-card p-6 rounded-2xl shadow-sm">
          <SectionHeader icon={<MapPin className="h-4 w-4" />} title="Address" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <Field label="Address Line 1" value={fac?.addressLine1} span />
            <Field label="Address Line 2" value={fac?.addressLine2} span />
            <Field label="City"    value={fac?.city} />
            <Field label="State"   value={fac?.state} />
            <Field label="Pincode" value={fac?.pincode} />
          </div>
        </div>
      </div>

      {/* ── CHANGE PASSWORD ── */}
      <div className="border bg-card p-6 rounded-2xl shadow-sm space-y-4">
        <SectionHeader icon={<Lock className="h-4 w-4" />} title="Change Password" />
        <form onSubmit={handleChangePassword} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Current Password */}
          <div className="flex flex-col gap-1 relative">
            <label className="text-[9px] uppercase font-bold text-muted-foreground">Current Password *</label>
            <input
              type={showCurrentPwd ? 'text' : 'password'}
              value={pwdForm.currentPassword}
              onChange={e => setPwdForm(p => ({ ...p, currentPassword: e.target.value }))}
              className="h-9 border rounded-lg bg-background px-3 pr-9 text-xs font-semibold"
              required
            />
            <button type="button" onClick={() => setShowCurrentPwd(v => !v)} className="absolute right-2.5 top-7 text-muted-foreground">
              {showCurrentPwd ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* New Password */}
          <div className="flex flex-col gap-1 relative">
            <label className="text-[9px] uppercase font-bold text-muted-foreground">New Password *</label>
            <input
              type={showNewPwd ? 'text' : 'password'}
              value={pwdForm.newPassword}
              onChange={e => setPwdForm(p => ({ ...p, newPassword: e.target.value }))}
              className="h-9 border rounded-lg bg-background px-3 pr-9 text-xs font-semibold"
              required
            />
            <button type="button" onClick={() => setShowNewPwd(v => !v)} className="absolute right-2.5 top-7 text-muted-foreground">
              {showNewPwd ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
            {pwdForm.newPassword && pwdForm.newPassword.length < 6 && (
              <p className="text-[9px] text-rose-500 font-semibold">At least 6 characters required</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1 relative">
            <label className="text-[9px] uppercase font-bold text-muted-foreground">Confirm New Password *</label>
            <input
              type={showConfirmPwd ? 'text' : 'password'}
              value={pwdForm.confirmPassword}
              onChange={e => setPwdForm(p => ({ ...p, confirmPassword: e.target.value }))}
              className="h-9 border rounded-lg bg-background px-3 pr-9 text-xs font-semibold"
              required
            />
            <button type="button" onClick={() => setShowConfirmPwd(v => !v)} className="absolute right-2.5 top-7 text-muted-foreground">
              {showConfirmPwd ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
            {pwdForm.confirmPassword && pwdForm.newPassword !== pwdForm.confirmPassword && (
              <p className="text-[9px] text-rose-500 font-semibold">Passwords do not match</p>
            )}
            {pwdForm.confirmPassword && pwdForm.newPassword === pwdForm.confirmPassword && pwdForm.newPassword.length >= 6 && (
              <p className="text-[9px] text-emerald-500 font-semibold flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Passwords match</p>
            )}
          </div>

          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Lock className="h-3.5 w-3.5" /> Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HODProfile;
