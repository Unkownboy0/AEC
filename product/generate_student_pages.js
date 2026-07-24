const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'client', 'src', 'pages', 'student');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// 1. PROFILE
const StudentProfile = `import React, { useState, useEffect } from 'react';
import { User, Shield, Key, Sparkles, Upload } from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';
import api from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';

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
        const res = await api.get('/enterprise/students');
        if (res.data?.status === 'success' && res.data.data?.length > 0) {
          const info = res.data.data[0];
          setStudentInfo(info);
          setFormData({
            firstName: info.firstName || '',
            lastName: info.lastName || '',
            preferredName: info.preferredName || '',
            phone: info.phone || '',
            altPhone: info.altPhone || '',
            email: info.email || '',
            currentAddress: info.currentAddress || '',
            permanentAddress: info.permanentAddress || '',
            city: info.city || '',
            district: info.district || '',
            state: info.state || '',
            country: info.country || '',
            pinCode: info.pinCode || '',
            emergencyContactName: info.emergencyContactName || '',
            emergencyContactPhone: info.emergencyContactPhone || '',
            emergencyContactRelation: info.emergencyContactRelation || '',
            parentPhone: info.parentPhone || '',
            parentEmail: info.parentEmail || '',
            linkedin: info.linkedin || '',
            github: info.github || '',
            portfolio: info.portfolio || '',
            technicalSkills: info.technicalSkills || '',
            softSkills: info.softSkills || '',
            languagesKnown: info.languagesKnown || '',
            certifications: info.certifications || '',
            careerObjective: info.careerObjective || '',
            areasOfInterest: info.areasOfInterest || ''
          });
        }
      } catch (err) {
        toast.error('Failed to load profile details.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoBase64(event.target?.result as string);
      toast.success('Selected profile photo ready for upload.');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const payload = { ...formData };
      if (photoBase64) {
        payload.profilePhoto = photoBase64;
      }
      const res = await api.put('/users/profile', payload);
      if (res.data?.status === 'success') {
        toast.success('Profile saved permanently.');
        setIsEditing(false);
        await refreshUser();
      }
    } catch (err) {
      toast.error('Failed to save profile changes.');
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
      <div className="border bg-card p-6 rounded-xl shadow-sm space-y-4">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
          <User className="h-5 w-5 text-primary" /> Profile Management
        </h2>
        
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex flex-col md:flex-row items-center gap-6 pb-6 border-b">
            <div className="h-24 w-24 rounded-full bg-primary/10 border relative overflow-hidden flex items-center justify-center shrink-0">
              {photoBase64 || user?.profilePhoto ? (
                <img src={photoBase64 || user?.profilePhoto} className="h-full w-full object-cover" alt="Student Profile" />
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
`;

// 2. ID CARD
const StudentIdCard = `import React, { useState, useEffect } from 'react';
import { CreditCard, Download, Printer } from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';
import api from '../../lib/axios';

export const StudentIdCard: React.FC = () => {
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await api.get('/enterprise/students');
        if (res.data?.status === 'success' && res.data.data?.length > 0) {
          setStudentInfo(res.data.data[0]);
        }
      } catch (err) {
        toast.error('Failed to load ID card details.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchInfo();
  }, []);

  const handleDownload = async () => {
    if (!studentInfo) return;
    try {
      const res = await api.get('/enterprise/students/' + studentInfo.id + '/id-card/pdf', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', studentInfo.firstName + '_IDCard.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success('ID Card downloaded successfully.');
    } catch {
      toast.error('Download failed.');
    }
  };

  if (isLoading) return <Loading text="Loading ID Card..." />;

  const yr = studentInfo?.dateOfAdmission ? new Date(studentInfo.dateOfAdmission).getFullYear() : 2026;
  const qrPayload = JSON.stringify({ studentId: studentInfo?.id, admissionNo: studentInfo?.admissionNo, collegeId: 'GEETORUS-CAMPUS' });
  const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + encodeURIComponent(qrPayload);

  return (
    <div className="space-y-6 max-w-md mx-auto pb-12 animate-in fade-in duration-200">
      <div className="border bg-card p-6 rounded-xl shadow-sm text-center space-y-4">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white flex items-center justify-center gap-1.5">
          <CreditCard className="h-5 w-5 text-primary" /> Digital ID Card
        </h2>

        {/* Card visualization */}
        <div id="printable-id-card-area" className="w-[85.6mm] h-[53.98mm] mx-auto border rounded-xl shadow-lg bg-gradient-to-br from-primary/10 via-card to-card p-3 relative overflow-hidden flex flex-col justify-between text-left">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-[10px] font-black text-primary tracking-wider">CAMPUSOS COLLEGE</h4>
              <p className="text-[7px] text-muted-foreground mt-0.5">Enterprise Portal</p>
            </div>
            <div className="text-[7px] bg-primary/20 text-primary font-black px-1.5 py-0.5 rounded uppercase">STUDENT</div>
          </div>

          <div className="flex gap-2.5 items-center mt-2.5">
            <div className="h-14 w-14 rounded-full bg-slate-100 overflow-hidden shrink-0 border">
              {studentInfo?.user?.profilePhoto ? (
                <img src={studentInfo.user.profilePhoto} className="h-full w-full object-cover" alt="Student" />
              ) : (
                <div className="h-full w-full bg-primary/5 flex items-center justify-center font-bold text-xs">{studentInfo?.firstName?.[0]}</div>
              )}
            </div>
            <div className="min-w-0 text-[8px] font-bold text-slate-700 space-y-0.5">
              <h5 className="font-extrabold text-[9px] text-slate-800">{studentInfo?.firstName} {studentInfo?.lastName}</h5>
              <p><span className="text-slate-400">Reg No:</span> {studentInfo?.admissionNo}</p>
              <p><span className="text-slate-400">Dept:</span> {studentInfo?.department?.code}</p>
              <p><span className="text-slate-400">Blood:</span> {studentInfo?.bloodGroup || 'O+'}</p>
            </div>
            <div className="ml-auto h-12 w-12 shrink-0 border p-0.5 bg-white">
              <img src={qrUrl} className="h-full w-full" alt="Verification QR" />
            </div>
          </div>

          <div className="flex justify-between items-center text-[6px] text-muted-foreground border-t pt-1.5 mt-2.5">
            <span>Validity: {yr} - {yr + 4}</span>
            <span>Emergency: {studentInfo?.emergencyContactPhone || studentInfo?.parentPhone}</span>
          </div>
        </div>

        <div className="flex justify-center gap-2 pt-4">
          <button onClick={handleDownload} className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg shadow hover:bg-primary/95 transition-all flex items-center gap-1.5">
            <Download className="h-4 w-4" /> Download PDF
          </button>
          <button onClick={() => window.print()} className="px-4 py-2 border text-xs font-bold rounded-lg hover:bg-muted transition-all flex items-center gap-1.5">
            <Printer className="h-4 w-4" /> Print
          </button>
        </div>
      </div>
    </div>
  );
};
export default StudentIdCard;
`;

// Define a list of generic modular files
const genericPages = [
  { file: 'StudentSyllabus.tsx', name: 'Syllabus', icon: 'BookOpen', content: `
    const [studentInfo, setStudentInfo] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
      api.get('/enterprise/students').then(res => {
        if(res.data?.data?.length > 0) setStudentInfo(res.data.data[0]);
        setIsLoading(false);
      }).catch(() => setIsLoading(false));
    }, []);
    if (isLoading) return <Loading text="Loading Syllabus..." />;
    return (
      <div className="space-y-6 text-left pb-12 animate-in fade-in duration-200">
        <div className="border bg-card p-6 rounded-xl shadow-sm space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
            <BookOpen className="h-5 w-5 text-primary" /> Curriculum Syllabus
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border p-4 rounded-lg bg-background space-y-2">
              <h4 className="text-xs font-extrabold text-primary">Department Course: {studentInfo?.program?.name}</h4>
              <p className="text-xs text-muted-foreground">Credits Required: 160 · Regulation: R26</p>
              <p className="text-xs text-slate-600">Course Outcome (CO): Apply computational models to address complex industrial automation challenges.</p>
            </div>
            <div className="border p-4 rounded-lg bg-background space-y-2">
              <h4 className="text-xs font-extrabold text-primary">Reference Books</h4>
              <ul className="text-xs list-disc pl-4 space-y-1 text-muted-foreground">
                <li>Introduction to Algorithms - CLRS</li>
                <li>Database System Concepts - Silberschatz</li>
              </ul>
            </div>
          </div>
          <button className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg shadow hover:bg-primary/95 transition-all">Download Syllabus PDF</button>
        </div>
      </div>
    );
  `},
  { file: 'StudentTimetable.tsx', name: 'Timetable', icon: 'Clock', content: `
    const [timetable, setTimetable] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
      api.get('/timetables/slots').then(res => {
        if(res.data?.status === 'success') setTimetable(res.data.data);
        setIsLoading(false);
      }).catch(() => setIsLoading(false));
    }, []);
    if (isLoading) return <Loading text="Loading Timetable..." />;
    return (
      <div className="space-y-6 text-left pb-12 animate-in fade-in duration-200">
        <div className="border bg-card p-6 rounded-xl shadow-sm space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
            <Clock className="h-5 w-5 text-primary" /> Timetable Schedule
          </h2>
          <div className="space-y-3">
            {timetable.map((slot, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 border rounded-xl bg-background">
                <div>
                  <span className="text-[9px] font-bold text-primary tracking-wider uppercase">{slot.dayOfWeek} · Period {slot.slotIndex}</span>
                  <h5 className="text-xs font-bold">{slot.subject?.name}</h5>
                  <p className="text-[10px] text-muted-foreground">{slot.faculty?.firstName} {slot.faculty?.lastName} · Room {slot.roomNo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  `},
  { file: 'StudentAttendance.tsx', name: 'Attendance', icon: 'CheckCircle', content: `
    const [studentInfo, setStudentInfo] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
      api.get('/enterprise/students').then(res => {
        if(res.data?.data?.length > 0) setStudentInfo(res.data.data[0]);
        setIsLoading(false);
      }).catch(() => setIsLoading(false));
    }, []);

    const handleDownloadReport = async () => {
      if (!studentInfo) return;
      try {
        const res = await api.get('/enterprise/students/' + studentInfo.id + '/attendance/pdf', { responseType: 'blob' });
        const blob = new Blob([res.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', studentInfo.firstName + '_AttendanceReport.pdf');
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        toast.success('Attendance report downloaded.');
      } catch {
        toast.error('Download failed.');
      }
    };

    if (isLoading) return <Loading text="Loading Attendance..." />;
    return (
      <div className="space-y-6 text-left pb-12 animate-in fade-in duration-200">
        <div className="border bg-card p-6 rounded-xl shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
              <CheckCircle className="h-5 w-5 text-primary" /> Attendance Records
            </h2>
            <button onClick={handleDownloadReport} className="px-3.5 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg shadow hover:bg-primary/95 transition-all">Download Report</button>
          </div>
          <div className="border p-6 rounded-xl bg-background text-center space-y-2">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Overall Attendance Rate</span>
            <h3 className="text-3xl font-extrabold text-emerald-500">92.8%</h3>
            <p className="text-xs text-muted-foreground">167 Classes Present out of 180 periods</p>
          </div>
        </div>
      </div>
    );
  `},
  { file: 'StudentHomework.tsx', name: 'Homework', icon: 'FileText', content: `
    return (
      <div className="space-y-6 text-left pb-12 animate-in fade-in duration-200">
        <div className="border bg-card p-6 rounded-xl shadow-sm space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
            <FileText className="h-5 w-5 text-primary" /> Homework Exercises
          </h2>
          <div className="border p-4 rounded-lg bg-background text-xs space-y-2">
            <div className="flex justify-between">
              <span className="font-bold">Dynamic Programming Exercises</span>
              <span className="text-amber-500 font-bold">DUE TODAY</span>
            </div>
            <p className="text-muted-foreground">Implement Knapsack & LCS solutions. Upload code in .zip format.</p>
          </div>
        </div>
      </div>
    );
  `},
  { file: 'StudentAssignments.tsx', name: 'Assignments', icon: 'ClipboardList', content: `
    const [assignments, setAssignments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
      api.get('/assignments').then(res => {
        if(res.data?.status === 'success') setAssignments(res.data.data);
        setIsLoading(false);
      }).catch(() => setIsLoading(false));
    }, []);
    if (isLoading) return <Loading text="Loading Assignments..." />;
    return (
      <div className="space-y-6 text-left pb-12 animate-in fade-in duration-200">
        <div className="border bg-card p-6 rounded-xl shadow-sm space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
            <ClipboardList className="h-5 w-5 text-primary" /> Course Assignments
          </h2>
          <div className="space-y-3">
            {assignments.map((item, idx) => (
              <div key={idx} className="p-3 border rounded-xl bg-background space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <h5 className="font-bold">{item.title}</h5>
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded">{item.status}</span>
                </div>
                <p className="text-muted-foreground">{item.description || 'No description provided.'}</p>
                <p className="text-[10px] text-slate-400">Due: {new Date(item.dueDate).toLocaleDateString('en-IN')}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  `},
  { file: 'StudentQuiz.tsx', name: 'Quiz', icon: 'HelpCircle', content: `
    return (
      <div className="space-y-6 text-left pb-12 animate-in fade-in duration-200">
        <div className="border bg-card p-6 rounded-xl shadow-sm space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
            <HelpCircle className="h-5 w-5 text-primary" /> Active Online Quizzes
          </h2>
          <p className="text-xs text-muted-foreground">No active quizzes are scheduled for your section at this time.</p>
        </div>
      </div>
    );
  `},
  { file: 'StudentExaminations.tsx', name: 'Examinations', icon: 'FileSpreadsheet', content: `
    return (
      <div className="space-y-6 text-left pb-12 animate-in fade-in duration-200">
        <div className="border bg-card p-6 rounded-xl shadow-sm space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
            <FileSpreadsheet className="h-5 w-5 text-primary" /> Examinations Schedule
          </h2>
          <div className="p-4 border rounded-lg bg-background text-xs space-y-2">
            <div className="flex justify-between font-bold">
              <span>Database Systems Terminal Exam</span>
              <span className="text-primary">Scheduled</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Date: 2026-08-07 · Hall: Exam Block A - Room 104 · Seat: B-12</p>
          </div>
        </div>
      </div>
    );
  `},
  { file: 'StudentResults.tsx', name: 'Results', icon: 'Award', content: `
    const [marks, setMarks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
      api.get('/enterprise/marks?pageSize=100').then(res => {
        if(res.data?.status === 'success') setMarks(res.data.data);
        setIsLoading(false);
      }).catch(() => setIsLoading(false));
    }, []);
    if (isLoading) return <Loading text="Loading Results..." />;
    return (
      <div className="space-y-6 text-left pb-12 animate-in fade-in duration-200">
        <div className="border bg-card p-6 rounded-xl shadow-sm space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
            <Award className="h-5 w-5 text-primary" /> Academic Term Results
          </h2>
          <div className="space-y-3">
            {marks.map((m, idx) => (
              <div key={idx} className="p-3 border rounded-xl bg-background flex justify-between items-center text-xs">
                <div>
                  <h5 className="font-bold">{m.subject?.name}</h5>
                  <p className="text-[10px] text-muted-foreground">Internal: {m.internalMarks} · External: {m.externalMarks}</p>
                </div>
                <span className="text-sm font-extrabold text-primary">{m.grade}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  `},
  { file: 'StudentLeaveOd.tsx', name: 'LeaveOd', icon: 'CalendarDays', content: `
    const [requests, setRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
      api.get('/workflows/requests').then(res => {
        if(res.data?.status === 'success') setRequests(res.data.data);
        setIsLoading(false);
      }).catch(() => setIsLoading(false));
    }, []);
    if (isLoading) return <Loading text="Loading Leave & OD Requests..." />;
    return (
      <div className="space-y-6 text-left pb-12 animate-in fade-in duration-200">
        <div className="border bg-card p-6 rounded-xl shadow-sm space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
            <CalendarDays className="h-5 w-5 text-primary" /> Leave & OD Workspace
          </h2>
          <div className="space-y-3">
            {requests.map((r, idx) => (
              <div key={idx} className="p-3 border rounded-xl bg-background flex justify-between items-center text-xs">
                <div>
                  <h5 className="font-bold">{r.title}</h5>
                  <p className="text-[10px] text-muted-foreground">{r.reason}</p>
                </div>
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">{r.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  `},
  { file: 'StudentAiAssistant.tsx', name: 'AiAssistant', icon: 'Cpu', content: `
    const [messages, setMessages] = useState<any[]>([{ role: 'assistant', content: 'Hello! I am your AI Counselor. Ask me about attendance forecasts, predicted CGPA, or exam preps.' }]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim()) return;
      const userMsg = input;
      setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
      setInput('');
      setLoading(true);
      try {
        const res = await api.post('/ai/chat', { message: userMsg });
        if (res.data?.status === 'success') {
          setMessages(prev => [...prev, { role: 'assistant', content: res.data.data.reply }]);
        }
      } catch {
        toast.error('AI chat connection error.');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4 h-[600px] flex flex-col text-left animate-in fade-in duration-200">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5 pb-3 border-b shrink-0">
          <Cpu className="h-5 w-5 text-primary animate-pulse" /> AI Academic Assistant
        </h2>
        <div className="flex-1 overflow-y-auto space-y-3 text-xs">
          {messages.map((m, idx) => (
            <div key={idx} className={\`flex \${m.role === 'user' ? 'justify-end' : 'justify-start'}\`}>
              <div className={\`p-3 rounded-2xl max-w-[80%] \${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}\`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && <div className="text-xs text-muted-foreground animate-pulse">Assistant is typing...</div>}
        </div>
        <form onSubmit={handleSend} className="flex gap-2 border-t pt-3 shrink-0">
          <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Ask anything..." className="flex-1 text-xs p-2.5 rounded-lg border bg-background" />
          <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg shadow">Send</button>
        </form>
      </div>
    );
  `},
  { file: 'StudentPlacements.tsx', name: 'Placements', icon: 'Briefcase', content: `
    const [drives, setDrives] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
      api.get('/placements/drives').then(res => {
        if(res.data?.status === 'success') setDrives(res.data.data);
        setIsLoading(false);
      }).catch(() => setIsLoading(false));
    }, []);
    if (isLoading) return <Loading text="Loading Drives..." />;
    return (
      <div className="space-y-6 text-left pb-12 animate-in fade-in duration-200">
        <div className="border bg-card p-6 rounded-xl shadow-sm space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
            <Briefcase className="h-5 w-5 text-primary" /> Placement Drives
          </h2>
          <div className="space-y-3">
            {drives.map((d, idx) => (
              <div key={idx} className="p-3 border rounded-xl bg-background flex justify-between items-center text-xs">
                <div>
                  <h5 className="font-bold">{d.company} - {d.role}</h5>
                  <p className="text-[10px] text-muted-foreground">CTC Package: {d.package} LPA · Date: {new Date(d.driveDate).toLocaleDateString('en-IN')}</p>
                </div>
                <button className="px-3.5 py-1.5 bg-primary text-primary-foreground text-[10px] font-black rounded-lg">Apply Now</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  `},
  { file: 'StudentInternship.tsx', name: 'Internship', icon: 'FileCode', content: `
    const [internships, setInternships] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
      api.get('/enterprise/internships').then(res => {
        if(res.data?.status === 'success') setInternships(res.data.data);
        setIsLoading(false);
      }).catch(() => setIsLoading(false));
    }, []);
    if (isLoading) return <Loading text="Loading Internships..." />;
    return (
      <div className="space-y-6 text-left pb-12 animate-in fade-in duration-200">
        <div className="border bg-card p-6 rounded-xl shadow-sm space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
            <FileCode className="h-5 w-5 text-primary" /> Industry Internships
          </h2>
          <div className="space-y-3">
            {internships.map((intern, idx) => (
              <div key={idx} className="p-3 border rounded-xl bg-background flex justify-between items-center text-xs">
                <div>
                  <h5 className="font-bold">{intern.company}</h5>
                  <p className="text-[10px] text-muted-foreground">Duration: {intern.duration} · Credits: {intern.credits}</p>
                </div>
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">{intern.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  `},
  { file: 'StudentResumeBuilder.tsx', name: 'ResumeBuilder', icon: 'FilePlus', content: `
    return (
      <div className="space-y-6 text-left pb-12 animate-in fade-in duration-200">
        <div className="border bg-card p-6 rounded-xl shadow-sm space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
            <FilePlus className="h-5 w-5 text-primary" /> Resume Builder Workspace
          </h2>
          <p className="text-xs text-muted-foreground">Build, edit, and compile your career resume dynamically. Syncs directly to placement drive submissions.</p>
          <button className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg shadow hover:bg-primary/95 transition-all">Initialize Builder</button>
        </div>
      </div>
    );
  `},
  { file: 'StudentCareerDashboard.tsx', name: 'CareerDashboard', icon: 'TrendingUp', content: `
    return (
      <div className="space-y-6 text-left pb-12 animate-in fade-in duration-200">
        <div className="border bg-card p-6 rounded-xl shadow-sm space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
            <TrendingUp className="h-5 w-5 text-primary" /> Career Intelligence Dashboard
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border p-4 rounded-xl bg-background space-y-2 text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200">AI Resume Score</span>
              <div className="text-2xl font-black text-emerald-500">88/100</div>
              <p className="text-[10px] text-muted-foreground">Strong matching on system engineering and cloud technologies.</p>
            </div>
            <div className="border p-4 rounded-xl bg-background space-y-2 text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200">Salary Prediction (LPA)</span>
              <div className="text-2xl font-black text-indigo-500">12.5 - 18.0</div>
              <p className="text-[10px] text-muted-foreground">Based on your portfolio score, hackathons count, and CGPA metrics.</p>
            </div>
          </div>
        </div>
      </div>
    );
  `},
  { file: 'StudentLibrary.tsx', name: 'Library', icon: 'Book', content: `
    return (
      <div className="space-y-6 text-left pb-12 animate-in fade-in duration-200">
        <div className="border bg-card p-6 rounded-xl shadow-sm space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
            <Book className="h-5 w-5 text-primary" /> Library Issue Ledger
          </h2>
          <div className="space-y-3">
            <div className="p-3 border rounded-xl bg-background flex justify-between items-center text-xs">
              <div>
                <h5 className="font-bold">Introduction to Algorithms (CLRS)</h5>
                <p className="text-[10px] text-muted-foreground">Return Due: 2026-07-28</p>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-black">Renewable</span>
            </div>
          </div>
        </div>
      </div>
    );
  `},
  { file: 'StudentHostel.tsx', name: 'Hostel', icon: 'Home', content: `
    return (
      <div className="space-y-6 text-left pb-12 animate-in fade-in duration-200">
        <div className="border bg-card p-6 rounded-xl shadow-sm space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
            <Home className="h-5 w-5 text-primary" /> Hostel Residence
          </h2>
          <div className="border p-4 rounded-xl bg-background text-xs space-y-1.5">
            <p><span className="font-bold text-slate-400">Hostel Block:</span> Curie Block (Girls)</p>
            <p><span className="font-bold text-slate-400">Room Number:</span> 304-B</p>
            <p><span className="font-bold text-slate-400">Roommates:</span> Alex Rivera, David Miller</p>
          </div>
        </div>
      </div>
    );
  `},
  { file: 'StudentTransport.tsx', name: 'Transport', icon: 'Truck', content: `
    return (
      <div className="space-y-6 text-left pb-12 animate-in fade-in duration-200">
        <div className="border bg-card p-6 rounded-xl shadow-sm space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
            <Truck className="h-5 w-5 text-primary" /> Transport Vehicle & Routes
          </h2>
          <div className="border p-4 rounded-xl bg-background text-xs space-y-1.5">
            <p><span className="font-bold text-slate-400">Bus Number:</span> Bus-12 (Route A)</p>
            <p><span className="font-bold text-slate-400">Driver Name:</span> Robert Downing (+91 99887 76655)</p>
            <p><span className="font-bold text-slate-400">Pickup Stop:</span> Central Terminus (07:45 AM)</p>
          </div>
        </div>
      </div>
    );
  `},
  { file: 'StudentPortfolio.tsx', name: 'Portfolio', icon: 'FolderGit', content: `
    return (
      <div className="space-y-6 text-left pb-12 animate-in fade-in duration-200">
        <div className="border bg-card p-6 rounded-xl shadow-sm space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
            <FolderGit className="h-5 w-5 text-primary" /> Engineering Portfolio
          </h2>
          <div className="p-3 border rounded-xl bg-background text-xs space-y-1">
            <h5 className="font-bold">CampusOS Secure Database Engine</h5>
            <p className="text-[10px] text-muted-foreground">Rust, Prisma · Major Project · Guide: Dr. Evelyn Boyd</p>
          </div>
        </div>
      </div>
    );
  `},
  { file: 'StudentSkills.tsx', name: 'Skills', icon: 'BadgeCheck', content: `
    return (
      <div className="space-y-6 text-left pb-12 animate-in fade-in duration-200">
        <div className="border bg-card p-6 rounded-xl shadow-sm space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
            <BadgeCheck className="h-5 w-5 text-primary" /> Skills & Badges
          </h2>
          <div className="flex flex-wrap gap-2">
            <span className="bg-primary/10 text-primary text-[10px] font-bold px-3 py-1 rounded-full border">TypeScript (ADVANCED)</span>
            <span className="bg-primary/10 text-primary text-[10px] font-bold px-3 py-1 rounded-full border">React (INTERMEDIATE)</span>
          </div>
        </div>
      </div>
    );
  `},
  { file: 'StudentClubs.tsx', name: 'Clubs', icon: 'Compass', content: `
    return (
      <div className="space-y-6 text-left pb-12 animate-in fade-in duration-200">
        <div className="border bg-card p-6 rounded-xl shadow-sm space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
            <Compass className="h-5 w-5 text-primary" /> Clubs memberships
          </h2>
          <div className="p-3 border rounded-xl bg-background text-xs font-bold text-slate-700">
            ✓ IEEE Student Chapter (Active Member)
          </div>
        </div>
      </div>
    );
  `},
  { file: 'StudentDocuments.tsx', name: 'Documents', icon: 'FolderOpen', content: `
    return (
      <div className="space-y-6 text-left pb-12 animate-in fade-in duration-200">
        <div className="border bg-card p-6 rounded-xl shadow-sm space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
            <FolderOpen className="h-5 w-5 text-primary" /> Academic Documents Vault
          </h2>
          <ul className="text-xs space-y-2 text-primary font-bold">
            <li className="hover:underline cursor-pointer">✓ Bonafide Certificate.pdf</li>
            <li className="hover:underline cursor-pointer">✓ Conduct Certificate.pdf</li>
          </ul>
        </div>
      </div>
    );
  `},
  { file: 'StudentCirculars.tsx', name: 'Circulars', icon: 'Bell', content: `
    const [circulars, setCirculars] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
      api.get('/circulars').then(res => {
        if(res.data?.status === 'success') setCirculars(res.data.data);
        setIsLoading(false);
      }).catch(() => setIsLoading(false));
    }, []);
    if (isLoading) return <Loading text="Loading Circulars..." />;
    return (
      <div className="space-y-6 text-left pb-12 animate-in fade-in duration-200">
        <div className="border bg-card p-6 rounded-xl shadow-sm space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
            <Bell className="h-5 w-5 text-primary" /> Circulars Board
          </h2>
          <div className="space-y-3">
            {circulars.map((item, idx) => (
              <div key={idx} className="p-3 border rounded-xl bg-background text-xs">
                <div className="flex justify-between font-bold">
                  <span>{item.title}</span>
                  <span className="text-slate-400">{new Date(item.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
                <p className="text-muted-foreground mt-1">{item.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  `},
  { file: 'StudentAdvisorChat.tsx', name: 'AdvisorChat', icon: 'MessageSquare', content: `
    const [replyInput, setReplyInput] = useState('');
    const [messages, setMessages] = useState<any[]>([{ senderRole: 'Faculty', message: 'Hello, let me know if you need assistance on subjects.' }]);

    const handleSend = (e: React.FormEvent) => {
      e.preventDefault();
      if(!replyInput.trim()) return;
      setMessages(prev => [...prev, { senderRole: 'Student', message: replyInput }]);
      setReplyInput('');
    };

    return (
      <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4 h-[600px] flex flex-col text-left animate-in fade-in duration-200">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5 pb-3 border-b shrink-0">
          <MessageSquare className="h-5 w-5 text-primary" /> Advisor Chat Workspace
        </h2>
        <div className="flex-1 overflow-y-auto space-y-3 text-xs">
          {messages.map((m, idx) => (
            <div key={idx} className={\`flex \${m.senderRole === 'Student' ? 'justify-end' : 'justify-start'}\`}>
              <div className={\`p-3 rounded-2xl max-w-[80%] \${m.senderRole === 'Student' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}\`}>
                {m.message}
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={handleSend} className="flex gap-2 border-t pt-3 shrink-0">
          <input type="text" value={replyInput} onChange={e => setReplyInput(e.target.value)} placeholder="Type a message..." className="flex-1 text-xs p-2.5 rounded-lg border bg-background" />
          <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg shadow">Send</button>
        </form>
      </div>
    );
  `},
  { file: 'StudentNotifications.tsx', name: 'Notifications', icon: 'Inbox', content: `
    return (
      <div className="space-y-6 text-left pb-12 animate-in fade-in duration-200">
        <div className="border bg-card p-6 rounded-xl shadow-sm space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
            <Inbox className="h-5 w-5 text-primary" /> Notifications Center
          </h2>
          <p className="text-xs text-muted-foreground">No unread alerts found.</p>
        </div>
      </div>
    );
  `},
  { file: 'StudentCalendar.tsx', name: 'Calendar', icon: 'Calendar', content: `
    return (
      <div className="space-y-6 text-left pb-12 animate-in fade-in duration-200">
        <div className="border bg-card p-6 rounded-xl shadow-sm space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
            <Calendar className="h-5 w-5 text-primary" /> Academic Calendar
          </h2>
          <div className="p-4 border rounded-xl bg-background text-xs space-y-1">
            <p className="font-bold text-slate-800 dark:text-white">Summer Break Commences</p>
            <p className="text-muted-foreground text-[10px]">Start Date: 2026-06-01 · End Date: 2026-07-01</p>
          </div>
        </div>
      </div>
    );
  `}
];

// Write profile page
fs.writeFileSync(path.join(targetDir, 'StudentProfile.tsx'), StudentProfile);
console.log('Written StudentProfile.tsx');

// Write id card page
fs.writeFileSync(path.join(targetDir, 'StudentIdCard.tsx'), StudentIdCard);
console.log('Written StudentIdCard.tsx');

// Write generic pages
genericPages.forEach((page) => {
  const code = 'import React, { useState, useEffect } from "react";\n' +
    'import {\n' +
    '  Layers, User, CreditCard, Cpu, Briefcase, Compass, Trophy, Send,\n' +
    '  MessageSquare, BookOpen, Clock, CheckCircle, AlertTriangle, FileText,\n' +
    '  ClipboardList, HelpCircle, FileSpreadsheet, Award, CalendarDays,\n' +
    '  FileCode, FilePlus, TrendingUp, Book, Home, Truck, FolderGit, BadgeCheck,\n' +
    '  FolderOpen, Bell, Inbox, Calendar, Settings\n' +
    '} from "lucide-react";\n' +
    'import { toast } from "../../components/ui/Toast";\n' +
    'import { Loading } from "../../components/ui/Loading";\n' +
    'import api from "../../lib/axios";\n\n' +
    'export const ' + page.file.replace('.tsx', '') + ': React.FC = () => {\n' +
    page.content + '\n};\n\n' +
    'export default ' + page.file.replace('.tsx', '') + ';\n';
  fs.writeFileSync(path.join(targetDir, page.file), code);
  console.log('Written ' + page.file);
});
