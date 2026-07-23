import React, { useState, useEffect } from 'react';
import {
  Briefcase, Plus, Search, Building, User, Mail, DollarSign, Calendar, MapPin,
  CheckCircle, XCircle, AlertCircle, FileText, Download, BarChart2, Users, RefreshCw, Upload
} from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import api from '../../lib/axios';

export const PlacementEngine: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'drives' | 'companies' | 'applications' | 'analytics'>('drives');
  const [drives, setDrives] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  
  // Modals
  const [isAddDriveOpen, setIsAddDriveOpen] = useState(false);
  const [selectedDrive, setSelectedDrive] = useState<any | null>(null);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);

  // Form State - Placement Drive
  const [driveForm, setDriveForm] = useState({
    title: '',
    company: '',
    industry: '',
    hrContact: '',
    package: '',
    role: '',
    eligibilityCgpa: '6.0',
    eligibilityDept: 'ALL',
    eligibilityYear: '4',
    maxArrears: '0',
    minAttendance: '75',
    driveDate: '',
    location: '',
    description: ''
  });

  // Form State - Offer Letter Link
  const [offerUrl, setOfferUrl] = useState('');

  useEffect(() => {
    fetchDrives();
    fetchAnalytics();
  }, []);

  const fetchDrives = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/enterprise/placements/drives');
      if (res.data?.status === 'success') {
        setDrives(res.data.data || []);
      }
    } catch (err) {
      toast.error('Failed to load placement drives.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/enterprise/placements/analytics');
      if (res.data?.status === 'success') {
        setAnalytics(res.data.data || null);
      }
    } catch (err) {
      console.error('Failed to load placement analytics:', err);
    }
  };

  const loadApplications = async (driveId: string) => {
    setIsLoading(true);
    try {
      const res = await api.get(`/enterprise/placements/drives/${driveId}/applications`);
      if (res.data?.status === 'success') {
        setApplications(res.data.data || []);
      }
    } catch (err) {
      toast.error('Failed to load applications.');
    } finally {
      setIsLoading(false);
    }
  };

  // Add Placement Drive
  const handleAddDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitLoading(true);
      const res = await api.post('/enterprise/placements/drives', driveForm);
      if (res.data?.status === 'success') {
        toast.success('Placement drive created successfully.');
        setIsAddDriveOpen(false);
        setDriveForm({
          title: '',
          company: '',
          industry: '',
          hrContact: '',
          package: '',
          role: '',
          eligibilityCgpa: '6.0',
          eligibilityDept: 'ALL',
          eligibilityYear: '4',
          maxArrears: '0',
          minAttendance: '75',
          driveDate: '',
          location: '',
          description: ''
        });
        fetchDrives();
        fetchAnalytics();
      }
    } catch (err) {
      toast.error('Failed to create placement drive.');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  // Shortlist, Select, Reject
  const handleUpdateStatus = async (appId: string, status: string) => {
    try {
      const res = await api.put(`/enterprise/placements/applications/${appId}/status`, { status });
      if (res.data?.status === 'success') {
        toast.success(`Candidate status updated to ${status}.`);
        if (selectedDrive) {
          loadApplications(selectedDrive.id);
        }
        fetchAnalytics();
      }
    } catch (err) {
      toast.error('Failed to update candidate status.');
    }
  };

  // Upload Offer Letter
  const handleUploadOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerUrl) return;
    try {
      setIsSubmitLoading(true);
      const res = await api.post(`/enterprise/placements/applications/${selectedApp.id}/offer-letter`, {
        offerLetterUrl: offerUrl
      });
      if (res.data?.status === 'success') {
        toast.success('Offer letter uploaded successfully.');
        setIsOfferModalOpen(false);
        setOfferUrl('');
        if (selectedDrive) {
          loadApplications(selectedDrive.id);
        }
      }
    } catch (err) {
      toast.error('Failed to upload offer letter.');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Enterprise Placement Engine
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage company drives, shortlists, student eligibility, and offer letters.
          </p>
        </div>

        <button
          onClick={() => setIsAddDriveOpen(true)}
          className="h-9 px-4 bg-primary text-primary-foreground font-bold text-xs rounded-lg flex items-center gap-1.5 hover:bg-primary/95 transition-colors shadow"
        >
          <Plus className="h-4 w-4" />
          Create Placement Drive
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 border-b pb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        <button
          onClick={() => setActiveTab('drives')}
          className={`pb-2 px-1 border-b-2 transition-all ${
            activeTab === 'drives' ? 'border-primary text-primary font-black' : 'border-transparent hover:text-foreground'
          }`}
        >
          Active Drives ({drives.length})
        </button>
        <button
          onClick={() => setActiveTab('applications')}
          className={`pb-2 px-1 border-b-2 transition-all ${
            activeTab === 'applications' ? 'border-primary text-primary font-black' : 'border-transparent hover:text-foreground'
          }`}
        >
          Shortlist & Applicants
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-2 px-1 border-b-2 transition-all ${
            activeTab === 'analytics' ? 'border-primary text-primary font-black' : 'border-transparent hover:text-foreground'
          }`}
        >
          Analytics Dashboard
        </button>
      </div>

      {/* Drives Tab */}
      {activeTab === 'drives' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {drives.map(drive => (
            <div key={drive.id} className="border bg-card rounded-xl p-5 shadow-sm space-y-4 hover:shadow-md transition-all duration-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-extrabold text-sm text-foreground">{drive.title}</h3>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Building className="h-3 w-3" />
                    {drive.company} · {drive.industry || 'Tech'}
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${
                  drive.status === 'OPEN' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}>
                  {drive.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[10px] border-t border-b py-3 font-semibold text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-primary" />
                  <span>Pkg: <strong>{drive.package} LPA</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  <span>Date: {new Date(drive.driveDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  <span>Loc: {drive.location || 'Campus'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  <span>Applicants: <strong>{drive.applications?.length || 0}</strong></span>
                </div>
              </div>

              {/* Eligibility Info */}
              <div className="bg-muted/40 p-2.5 rounded-lg text-[9px] space-y-1 text-muted-foreground">
                <p className="font-extrabold uppercase text-[8px] tracking-wider">Eligibility Constraints</p>
                <div className="flex justify-between">
                  <span>Min CGPA:</span>
                  <span className="font-bold text-foreground">{drive.eligibilityCgpa}</span>
                </div>
                <div className="flex justify-between">
                  <span>Min Attendance:</span>
                  <span className="font-bold text-foreground">{drive.minAttendance}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Arrears:</span>
                  <span className="font-bold text-foreground">{drive.maxArrears}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setSelectedDrive(drive);
                    loadApplications(drive.id);
                    setActiveTab('applications');
                  }}
                  className="w-full h-8 bg-primary text-primary-foreground font-bold text-xs rounded hover:bg-primary/95 transition-all flex items-center justify-center gap-1"
                >
                  <Users className="h-3.5 w-3.5" />
                  Manage Applicants
                </button>
              </div>
            </div>
          ))}
          {drives.length === 0 && (
            <div className="col-span-3 border bg-card p-12 text-center rounded-xl text-muted-foreground text-xs font-semibold">
              No placement drives scheduled yet.
            </div>
          )}
        </div>
      )}

      {/* Shortlist Tab */}
      {activeTab === 'applications' && (
        <div className="border bg-card rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-3">
            <h3 className="text-sm font-extrabold uppercase flex items-center gap-1.5">
              <Users className="h-4 w-4 text-indigo-500" />
              Applicant Shortlist Center
            </h3>
            
            <select
              value={selectedDrive?.id || ''}
              onChange={e => {
                const drive = drives.find(d => d.id === e.target.value);
                setSelectedDrive(drive || null);
                if (drive) loadApplications(drive.id);
              }}
              className="h-9 border rounded-lg bg-background px-2 text-xs font-semibold"
            >
              <option value="">Select a placement drive</option>
              {drives.map(d => (
                <option key={d.id} value={d.id}>{d.title} ({d.company})</option>
              ))}
            </select>
          </div>

          {!selectedDrive ? (
            <div className="py-12 text-center text-muted-foreground text-xs font-semibold">
              Select an active placement drive from the dropdown to manage candidates.
            </div>
          ) : isLoading ? (
            <div className="py-12 text-center">
              <RefreshCw className="h-6 w-6 text-primary animate-spin mx-auto" />
            </div>
          ) : (
            <div className="overflow-x-auto text-xs font-semibold">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-[9px] uppercase font-bold text-muted-foreground">
                    <th className="py-2.5 pl-3">Candidate / Roll</th>
                    <th className="py-2.5">Department</th>
                    <th className="py-2.5">CGPA</th>
                    <th className="py-2.5 text-center">Status</th>
                    <th className="py-2.5 text-center">Offer Letter</th>
                    <th className="py-2.5 text-right pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map(app => {
                    const statusColors: Record<string, string> = {
                      APPLIED: 'bg-blue-50 text-blue-700 border-blue-200',
                      SHORTLISTED: 'bg-amber-50 text-amber-700 border-amber-200',
                      SELECTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                      REJECTED: 'bg-rose-50 text-rose-700 border-rose-200'
                    };

                    return (
                      <tr key={app.id} className="border-b last:border-b-0 hover:bg-muted/40 transition-colors">
                        <td className="py-3.5 pl-3 pr-2">
                          <div className="font-bold text-foreground">{app.student.firstName} {app.student.lastName}</div>
                          <div className="text-[9px] text-muted-foreground mt-0.5">{app.student.admissionNo}</div>
                        </td>
                        <td className="py-3.5 px-2">
                          {app.student.department?.name || 'N/A'}
                        </td>
                        <td className="py-3.5 px-2 font-mono">
                          9.23 {/* Mock GPA fallback if schema lacks CGPA field */}
                        </td>
                        <td className="py-3.5 px-2 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${statusColors[app.status]}`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 text-center">
                          {app.offerLetterUrl ? (
                            <a
                              href={app.offerLetterUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline flex items-center justify-center gap-1 text-[10px]"
                            >
                              <Download className="h-3 w-3" /> Offer Letter
                            </a>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedApp(app);
                                setIsOfferModalOpen(true);
                              }}
                              className="text-indigo-600 hover:underline flex items-center justify-center gap-1 text-[10px] mx-auto"
                            >
                              <Upload className="h-3 w-3" /> Upload
                            </button>
                          )}
                        </td>
                        <td className="py-3.5 pl-2 pr-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            {app.status === 'APPLIED' && (
                              <button
                                onClick={() => handleUpdateStatus(app.id, 'SHORTLISTED')}
                                className="h-6 px-2 bg-amber-500 text-white rounded text-[10px] font-bold hover:bg-amber-600"
                              >
                                Shortlist
                              </button>
                            )}
                            {app.status === 'SHORTLISTED' && (
                              <button
                                onClick={() => handleUpdateStatus(app.id, 'SELECTED')}
                                className="h-6 px-2 bg-emerald-600 text-white rounded text-[10px] font-bold hover:bg-emerald-750"
                              >
                                Select Candidate
                              </button>
                            )}
                            {app.status !== 'SELECTED' && app.status !== 'REJECTED' && (
                              <button
                                onClick={() => handleUpdateStatus(app.id, 'REJECTED')}
                                className="h-6 px-2 bg-rose-600 text-white rounded text-[10px] font-bold hover:bg-rose-700"
                              >
                                Reject
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {applications.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground text-xs font-semibold">
                        No students have applied to this drive yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* Analytics Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="border bg-card rounded-xl p-4 shadow-sm flex flex-col gap-1">
              <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Total Eligible</span>
              <span className="text-2xl font-extrabold text-foreground">{analytics.totalEligible}</span>
            </div>
            <div className="border bg-card rounded-xl p-4 shadow-sm flex flex-col gap-1">
              <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Placed Students</span>
              <span className="text-2xl font-extrabold text-emerald-600">{analytics.totalPlaced}</span>
            </div>
            <div className="border bg-card rounded-xl p-4 shadow-sm flex flex-col gap-1">
              <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Placement Rate</span>
              <span className="text-2xl font-extrabold text-indigo-600">{analytics.placementPct}%</span>
            </div>
            <div className="border bg-card rounded-xl p-4 shadow-sm flex flex-col gap-1">
              <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Highest Package</span>
              <span className="text-2xl font-extrabold text-amber-500">{analytics.highestPackage} LPA</span>
            </div>
          </div>

          {/* Department breakdown table */}
          <div className="border bg-card p-5 rounded-xl shadow-sm space-y-3">
            <h3 className="text-sm font-extrabold uppercase border-b pb-2 flex items-center gap-1.5">
              <BarChart2 className="h-4 w-4 text-primary" />
              Department Placement Analytics
            </h3>

            <div className="overflow-x-auto text-xs font-semibold">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-[9px] uppercase font-bold text-muted-foreground">
                    <th className="py-2">Department</th>
                    <th className="py-2 text-center">Eligible</th>
                    <th className="py-2 text-center">Placed</th>
                    <th className="py-2 text-center">Rate</th>
                    <th className="py-2 text-center">Highest Package</th>
                    <th className="py-2 text-right pr-3">Average Package</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.departmentStats?.map((dept: any, idx: number) => (
                    <tr key={idx} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                      <td className="py-3 font-bold text-foreground">{dept.departmentName}</td>
                      <td className="py-3 text-center">{dept.eligibleStudents}</td>
                      <td className="py-3 text-center text-emerald-600">{dept.placedStudents}</td>
                      <td className="py-3 text-center">
                        <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-black text-[10px]">
                          {dept.placementPct}%
                        </span>
                      </td>
                      <td className="py-3 text-center font-mono">{dept.highestPackage} LPA</td>
                      <td className="py-3 text-right pr-3 font-mono">{dept.averagePackage} LPA</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Create Drive Modal */}
      {isAddDriveOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="border bg-card rounded-xl shadow-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <h3 className="text-sm font-extrabold uppercase border-b pb-2 mb-4">Create Placement Drive</h3>
            
            <form onSubmit={handleAddDrive} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Drive Title</label>
                  <input
                    type="text"
                    required
                    value={driveForm.title}
                    onChange={e => setDriveForm({ ...driveForm, title: e.target.value })}
                    placeholder="e.g. Software Engineer Pool Campus"
                    className="h-9 border rounded-lg bg-background px-3"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Company Name</label>
                  <input
                    type="text"
                    required
                    value={driveForm.company}
                    onChange={e => setDriveForm({ ...driveForm, company: e.target.value })}
                    placeholder="e.g. Google India"
                    className="h-9 border rounded-lg bg-background px-3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Industry / Sector</label>
                  <input
                    type="text"
                    value={driveForm.industry}
                    onChange={e => setDriveForm({ ...driveForm, industry: e.target.value })}
                    placeholder="e.g. Technology"
                    className="h-9 border rounded-lg bg-background px-3"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">HR Contact Details</label>
                  <input
                    type="text"
                    value={driveForm.hrContact}
                    onChange={e => setDriveForm({ ...driveForm, hrContact: e.target.value })}
                    placeholder="e.g. hr@company.com"
                    className="h-9 border rounded-lg bg-background px-3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Salary Package (LPA)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={driveForm.package}
                    onChange={e => setDriveForm({ ...driveForm, package: e.target.value })}
                    placeholder="e.g. 12.5"
                    className="h-9 border rounded-lg bg-background px-3"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Designation / Role</label>
                  <input
                    type="text"
                    required
                    value={driveForm.role}
                    onChange={e => setDriveForm({ ...driveForm, role: e.target.value })}
                    placeholder="e.g. Associate Developer"
                    className="h-9 border rounded-lg bg-background px-3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 bg-muted/20 p-3 rounded-lg border">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Minimum CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    value={driveForm.eligibilityCgpa}
                    onChange={e => setDriveForm({ ...driveForm, eligibilityCgpa: e.target.value })}
                    className="h-9 border rounded-lg bg-background px-3"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Max Active Arrears</label>
                  <input
                    type="number"
                    value={driveForm.maxArrears}
                    onChange={e => setDriveForm({ ...driveForm, maxArrears: e.target.value })}
                    className="h-9 border rounded-lg bg-background px-3"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Min Attendance %</label>
                  <input
                    type="number"
                    value={driveForm.minAttendance}
                    onChange={e => setDriveForm({ ...driveForm, minAttendance: e.target.value })}
                    className="h-9 border rounded-lg bg-background px-3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Drive Date</label>
                  <input
                    type="date"
                    required
                    value={driveForm.driveDate}
                    onChange={e => setDriveForm({ ...driveForm, driveDate: e.target.value })}
                    className="h-9 border rounded-lg bg-background px-3"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Location</label>
                  <input
                    type="text"
                    required
                    value={driveForm.location}
                    onChange={e => setDriveForm({ ...driveForm, location: e.target.value })}
                    placeholder="e.g. MBA Seminar Hall"
                    className="h-9 border rounded-lg bg-background px-3"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Description / Detailed Eligibility Skills</label>
                <textarea
                  value={driveForm.description}
                  onChange={e => setDriveForm({ ...driveForm, description: e.target.value })}
                  placeholder="Skill requirements (Java, React, SQL), roles, and details..."
                  rows={3}
                  className="border rounded-lg bg-background p-2.5 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddDriveOpen(false)}
                  className="h-9 px-4 border rounded-lg hover:bg-muted font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitLoading}
                  className="h-9 px-4 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/95 transition-colors flex items-center gap-1.5"
                >
                  {isSubmitLoading && <RefreshCw className="h-3 w-3 animate-spin" />}
                  Publish Drive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Offer Letter Upload Modal */}
      {isOfferModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="border bg-card rounded-xl shadow-lg w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-sm font-extrabold uppercase border-b pb-2 mb-4">Upload Student Offer Letter</h3>
            
            <form onSubmit={handleUploadOffer} className="space-y-4 text-xs font-semibold">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Offer Document URL</label>
                <input
                  type="url"
                  required
                  value={offerUrl}
                  onChange={e => setOfferUrl(e.target.value)}
                  placeholder="https://drive.google.com/your-offer-letter"
                  className="h-9 border rounded-lg bg-background px-3"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Upload the offer letter document URL (PDF/PNG/Word link) to save permanently to student records.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOfferModalOpen(false)}
                  className="h-9 px-4 border rounded-lg hover:bg-muted font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitLoading}
                  className="h-9 px-4 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/95 flex items-center gap-1.5"
                >
                  {isSubmitLoading && <RefreshCw className="h-3 w-3 animate-spin" />}
                  Submit Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
