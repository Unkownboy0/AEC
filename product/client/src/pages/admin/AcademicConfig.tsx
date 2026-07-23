import React, { useState, useEffect } from 'react';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Trash2, Calendar, Building, BookOpen, Layers } from 'lucide-react';
import api from '../../lib/axios';

const AcademicConfig: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'years' | 'depts' | 'courses' | 'subjects'>('years');
  const [isLoading, setIsLoading] = useState(true);

  // States
  const [years, setYears] = useState<any[]>([]);
  const [depts, setDepts] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  const fetchAcademics = async () => {
    try {
      setIsLoading(true);
      const [yRes, dRes, pRes, cRes, semRes, subRes] = await Promise.all([
        api.get('/academics/years'),
        api.get('/academics/departments'),
        api.get('/academics/programs'),
        api.get('/academics/courses'),
        api.get('/academics/semesters'),
        api.get('/academics/subjects'),
      ]);

      setYears(yRes.data?.data || []);
      setDepts(dRes.data?.data || []);
      setPrograms(pRes.data?.data || []);
      setCourses(cRes.data?.data || []);
      setSemesters(semRes.data?.data || []);
      setSubjects(subRes.data?.data || []);
    } catch (error: any) {
      toast.error('Failed to load academic records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAcademics();
  }, []);

  // Creation Action Handlers
  const handleAddYear = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: fd.get('name'),
      status: fd.get('status'),
      startDate: fd.get('startDate'),
      endDate: fd.get('endDate'),
    };

    try {
      const res = await api.post('/academics/years', payload);
      if (res.data?.status === 'success') {
        toast.success('Academic Year registered');
        fetchAcademics();
        (e.target as HTMLFormElement).reset();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create year');
    }
  };

  const handleAddDept = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: fd.get('name'),
      code: fd.get('code'),
      description: fd.get('description'),
    };

    try {
      const res = await api.post('/academics/departments', payload);
      if (res.data?.status === 'success') {
        toast.success('Department created successfully');
        fetchAcademics();
        (e.target as HTMLFormElement).reset();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create department');
    }
  };

  const handleAddCourse = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    
    // Auto-create program first if necessary for demo, or assume preseeded B.Tech
    let programId = fd.get('programId') as string;
    
    if (!programId && programs.length > 0) {
      programId = programs[0].id;
    }

    const payload = {
      name: fd.get('name'),
      code: fd.get('code'),
      duration: fd.get('duration'),
      programId,
    };

    try {
      const res = await api.post('/academics/courses', payload);
      if (res.data?.status === 'success') {
        toast.success('Course mapped under program');
        fetchAcademics();
        (e.target as HTMLFormElement).reset();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to map course');
    }
  };

  const handleAddSubject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    
    let semesterId = fd.get('semesterId') as string;
    if (!semesterId && semesters.length > 0) {
      semesterId = semesters[0].id;
    }

    const payload = {
      name: fd.get('name'),
      code: fd.get('code'),
      credits: fd.get('credits'),
      type: fd.get('type') || 'CORE',
      hasLab: fd.get('hasLab') === 'true',
      semesterId,
    };

    try {
      const res = await api.post('/academics/subjects', payload);
      if (res.data?.status === 'success') {
        toast.success('Subject registered');
        fetchAcademics();
        (e.target as HTMLFormElement).reset();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to add subject');
    }
  };

  // Deletion helper
  const handleDelete = async (url: string) => {
    if (!confirm('Are you sure you want to delete this academic config record?')) return;
    try {
      const res = await api.delete(url);
      if (res.data?.status === 'success') {
        toast.success('Configuration removed');
        fetchAcademics();
      }
    } catch (err: any) {
      toast.error(err.message || 'Deletion failed');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loading text="Loading academic schedules..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Academic Config</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Define university parameters, academic calendar terms, departmental structures, courses, and syllabus logs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Navigation Tabs */}
        <div className="flex flex-col gap-1 lg:col-span-1">
          {[
            { id: 'years', label: 'Academic Years', icon: Calendar },
            { id: 'depts', label: 'Departments', icon: Building },
            { id: 'courses', label: 'Programs & Courses', icon: Layers },
            { id: 'subjects', label: 'Subjects Directory', icon: BookOpen },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-left transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Configurations workspace */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Tab 1: YEARS */}
          {activeTab === 'years' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 border bg-card rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-2">Academic Terms</h3>
                <div className="w-full overflow-x-auto max-w-[90vw] md:max-w-full pb-2 scrollbar-thin"><Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Year Code</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {years.map((y) => (
                      <TableRow key={y.id}>
                        <TableCell className="font-semibold">{y.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(y.startDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold ${y.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-neutral-500/10 text-neutral-500'}`}>
                            {y.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="text-destructive h-7 w-7" onClick={() => handleDelete(`/academics/years/${y.id}`)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
              </div>

              <div className="border bg-card rounded-xl p-5 shadow-sm h-fit">
                <h3 className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-4">Register Year</h3>
                <form onSubmit={handleAddYear} className="space-y-4">
                  <Input label="Name (e.g. 2026-2027)" name="name" required />
                  <Select label="Status" name="status" options={[{ label: 'Active', value: 'ACTIVE' }, { label: 'Inactive', value: 'INACTIVE' }]} />
                  <Input label="Start Date" type="date" name="startDate" required />
                  <Input label="End Date" type="date" name="endDate" required />
                  <Button type="submit" size="sm" className="w-full mt-2">Create Year</Button>
                </form>
              </div>
            </div>
          )}

          {/* Tab 2: DEPARTMENTS */}
          {activeTab === 'depts' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 border bg-card rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-2">Campus Departments</h3>
                <div className="w-full overflow-x-auto max-w-[90vw] md:max-w-full pb-2 scrollbar-thin"><Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dept Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {depts.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-semibold">{d.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono font-bold uppercase">{d.code}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="text-destructive h-7 w-7" onClick={() => handleDelete(`/academics/departments/${d.id}`)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
              </div>

              <div className="border bg-card rounded-xl p-5 shadow-sm h-fit">
                <h3 className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-4">Create Department</h3>
                <form onSubmit={handleAddDept} className="space-y-4">
                  <Input label="Department Name" name="name" required />
                  <Input label="Code (e.g. CSE)" name="code" required />
                  <Input label="Description" name="description" />
                  <Button type="submit" size="sm" className="w-full mt-2">Create Dept</Button>
                </form>
              </div>
            </div>
          )}

          {/* Tab 3: PROGRAMS & COURSES */}
          {activeTab === 'courses' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 border bg-card rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-2">Degrees & Courses</h3>
                <div className="w-full overflow-x-auto max-w-[90vw] md:max-w-full pb-2 scrollbar-thin"><Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course Title</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-semibold">{c.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono font-bold">{c.code}</TableCell>
                        <TableCell className="text-xs font-semibold">{c.duration} Years</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="text-destructive h-7 w-7" onClick={() => handleDelete(`/academics/courses/${c.id}`)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
              </div>

              <div className="border bg-card rounded-xl p-5 shadow-sm h-fit">
                <h3 className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-4">Register Course</h3>
                <form onSubmit={handleAddCourse} className="space-y-4">
                  <Input label="Course Name" name="name" required />
                  <Input label="Course Code" name="code" required />
                  <Input label="Duration (Years)" type="number" name="duration" required />
                  <Select
                    label="Associated Program"
                    name="programId"
                    options={programs.map((p) => ({ label: `${p.name} (${p.code})`, value: p.id }))}
                  />
                  <Button type="submit" size="sm" className="w-full mt-2">Map Course</Button>
                </form>
              </div>
            </div>
          )}

          {/* Tab 4: SUBJECTS */}
          {activeTab === 'subjects' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 border bg-card rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-2">Subjects Directory</h3>
                <div className="w-full overflow-x-auto max-w-[90vw] md:max-w-full pb-2 scrollbar-thin"><Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject Title</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjects.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-semibold">{sub.name} {sub.hasLab && <span className="text-[9px] bg-indigo-50 border px-1 rounded ml-1 text-indigo-500 font-bold uppercase">Lab</span>}</TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono font-bold">{sub.code}</TableCell>
                        <TableCell className="text-xs font-semibold">{sub.credits} Credits</TableCell>
                        <TableCell>
                          <span className={`text-[9px] font-bold border px-1.5 py-0.5 rounded uppercase ${sub.type === 'CORE' ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                            {sub.type}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="text-destructive h-7 w-7" onClick={() => handleDelete(`/academics/subjects/${sub.id}`)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
              </div>

              <div className="border bg-card rounded-xl p-5 shadow-sm h-fit">
                <h3 className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-4">Add Subject</h3>
                <form onSubmit={handleAddSubject} className="space-y-4">
                  <Input label="Subject Title" name="name" required />
                  <Input label="Subject Code" name="code" required />
                  <Input label="Credits" type="number" name="credits" required />
                  <Select label="Type" name="type" options={[{ label: 'Core Class', value: 'CORE' }, { label: 'Elective Class', value: 'ELECTIVE' }]} />
                  <Select label="Includes Lab?" name="hasLab" options={[{ label: 'No', value: 'false' }, { label: 'Yes', value: 'true' }]} />
                  <Select
                    label="Assign Semester"
                    name="semesterId"
                    options={semesters.map((s) => ({ label: `Sem ${s.number} (${s.course.code})`, value: s.id }))}
                  />
                  <Button type="submit" size="sm" className="w-full mt-2">Add Subject</Button>
                </form>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default AcademicConfig;
