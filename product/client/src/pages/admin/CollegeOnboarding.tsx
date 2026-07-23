import React, { useState } from 'react';
import {
  Building, ArrowRight, ArrowLeft,
  CheckCircle, Plus, Trash, FileText, Send
} from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export const CollegeOnboarding: React.FC = () => {
  const [wizardStep, setWizardStep] = useState(1);
  const [colleges, setColleges] = useState<any[]>([
    { id: 'col-1', name: 'Geetorus Engineering Institute', code: 'GEI', color: '#6366f1' }
  ]);

  // Wizard Step State Mappings
  const [collegeName, setCollegeName] = useState('');
  const [collegeCode, setCollegeCode] = useState('');
  const [collegeLogo, setCollegeLogo] = useState('');
  const [collegeColor, setCollegeColor] = useState('#6366f1');
  const [collegeDb, setCollegeDb] = useState('isolated_sqlite_gei.db');

  const [departments, setDepartments] = useState<string[]>(['Computer Science', 'Mechanical Engineering']);
  const [newDept, setNewDept] = useState('');

  const [programs, setPrograms] = useState<string[]>(['B.Tech Computer Science', 'M.Tech Software Engineering']);
  const [newProg, setNewProg] = useState('');

  const [workflowRoute, setWorkflowRoute] = useState('STUDENT_MENTOR_HOD');

  // Support Tickets State Mappings
  const [tickets, setTickets] = useState<any[]>([
    { id: 'TKT-9830', category: 'ACADEMIC', title: 'Algorithms syllabus out of sync', priority: 'HIGH', status: 'PENDING', owner: 'John Smith (Student)' }
  ]);
  const [ticketCategory, setTicketCategory] = useState('ACADEMIC');
  const [ticketTitle, setTicketTitle] = useState('');
  const ticketPriority = 'MEDIUM';
  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketAnonymous, setTicketAnonymous] = useState(false);

  const handleCreateCollege = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collegeName || !collegeCode) return;
    const newCol = {
      id: `col-${colleges.length + 1}`,
      name: collegeName,
      code: collegeCode,
      logo: collegeLogo,
      color: collegeColor,
      db: collegeDb
    };
    setColleges([...colleges, newCol]);
    toast.success(`College Tenant: ${collegeName} configured and database provisioned.`);
    setWizardStep(2);
  };

  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDept.trim()) return;
    setDepartments([...departments, newDept.trim()]);
    setNewDept('');
    toast.success('Department created in current config wizard.');
  };

  const handleAddProg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProg.trim()) return;
    setPrograms([...programs, newProg.trim()]);
    setNewProg('');
    toast.success('Program mapping cached.');
  };

  const handleFinishWizard = () => {
    toast.success('College Onboarding Wizard Completed! Tenant isolation structures successfully activated.');
    setWizardStep(1);
    setCollegeName('');
    setCollegeCode('');
    setCollegeLogo('');
  };

  // Submit Support Ticket
  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketTitle.trim() || !ticketDesc.trim()) return;
    const newTkt = {
      id: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
      category: ticketCategory,
      title: ticketTitle,
      priority: ticketPriority,
      status: 'PENDING',
      owner: ticketAnonymous ? 'Anonymous' : 'Faculty/Student User'
    };
    setTickets([...tickets, newTkt]);
    setTicketTitle('');
    setTicketDesc('');
    toast.success(`Complaint Ticket ${newTkt.id} registered and routed to appropriate Dean.`);
  };

  return (
    <div className="space-y-8 text-xs font-semibold">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Super Admin Tenant & College Onboarding</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Deploy isolated college database configurations, configure branding parameters, and route department support tickets.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Onboarding Wizard - Left Cols */}
        <div className="lg:col-span-2 border bg-card p-6 rounded-xl shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <h3 className="text-sm font-extrabold uppercase flex flex-wrap items-center gap-1.5">
              <Building className="h-4.5 w-4.5 text-primary" /> Setup College Wizard
            </h3>
            
            {/* Step Indicators */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${wizardStep === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>1</span>
              <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${wizardStep === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>2</span>
              <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${wizardStep === 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>3</span>
            </div>
          </div>

          {wizardStep === 1 && (
            <form onSubmit={handleCreateCollege} className="space-y-4 animate-in fade-in-50 duration-200">
              <h4 className="text-xs uppercase font-extrabold text-muted-foreground tracking-wider">Step 1: College Info & Branding</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="College Name"
                  required
                  placeholder="e.g. Geetorus Institute of Tech"
                  value={collegeName}
                  onChange={e => setCollegeName(e.target.value)}
                />
                <Input
                  label="College Code / Prefix"
                  required
                  placeholder="e.g. GIT"
                  value={collegeCode}
                  onChange={e => setCollegeCode(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Accent Color"
                  type="color"
                  value={collegeColor}
                  onChange={e => setCollegeColor(e.target.value)}
                />
                <Input
                  label="Logo Image URL"
                  placeholder="/assets/git-logo.png"
                  value={collegeLogo}
                  onChange={e => setCollegeLogo(e.target.value)}
                />
                <Input
                  label="Database Location / Config"
                  placeholder="isolated_sqlite_git.db"
                  value={collegeDb}
                  onChange={e => setCollegeDb(e.target.value)}
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" variant="primary">
                  Save College Info & Next <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </form>
          )}

          {wizardStep === 2 && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <h4 className="text-xs uppercase font-extrabold text-muted-foreground tracking-wider">Step 2: Onboard Academic Structures</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Dept Manager */}
                <div className="space-y-3">
                  <h5 className="font-bold text-foreground">Departments list</h5>
                  <form onSubmit={handleAddDept} className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Civil Engineering..."
                      value={newDept}
                      onChange={e => setNewDept(e.target.value)}
                      className="flex-1 h-9 border rounded bg-background px-3"
                    />
                    <Button type="submit" variant="secondary"><Plus className="h-4 w-4" /></Button>
                  </form>

                  <div className="space-y-1 max-h-36 overflow-y-auto border p-2 rounded">
                    {departments.map((d, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 border rounded bg-background">
                        <span>{d}</span>
                        <button onClick={() => setDepartments(departments.filter((_, i) => i !== idx))} className="text-rose-500"><Trash className="h-3.5 w-3.5" /></button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Programs Manager */}
                <div className="space-y-3">
                  <h5 className="font-bold text-foreground">Programs list</h5>
                  <form onSubmit={handleAddProg} className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      required
                      placeholder="e.g. MBA General..."
                      value={newProg}
                      onChange={e => setNewProg(e.target.value)}
                      className="flex-1 h-9 border rounded bg-background px-3"
                    />
                    <Button type="submit" variant="secondary"><Plus className="h-4 w-4" /></Button>
                  </form>

                  <div className="space-y-1 max-h-36 overflow-y-auto border p-2 rounded">
                    {programs.map((p, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 border rounded bg-background">
                        <span>{p}</span>
                        <button onClick={() => setPrograms(programs.filter((_, i) => i !== idx))} className="text-rose-500"><Trash className="h-3.5 w-3.5" /></button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              <div className="flex justify-between pt-4 border-t">
                <Button onClick={() => setWizardStep(1)} variant="secondary">
                  <ArrowLeft className="mr-1 h-4 w-4" /> Back
                </Button>
                <Button onClick={() => setWizardStep(3)} variant="primary">
                  Next step <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {wizardStep === 3 && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <h4 className="text-xs uppercase font-extrabold text-muted-foreground tracking-wider">Step 3: Workflow Rule Configurations</h4>
              
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Select Leave/OD Workflow routing path</label>
                  <select
                    value={workflowRoute}
                    onChange={e => setWorkflowRoute(e.target.value)}
                    className="h-9 border rounded bg-background px-3"
                  >
                    <option value="STUDENT_MENTOR_HOD">Student ➔ Mentor ➔ HOD Approval (Default)</option>
                    <option value="STUDENT_MENTOR_HOD_DEAN">Student ➔ Mentor ➔ HOD ➔ Academic Dean Approval</option>
                  </select>
                </div>

                <div className="p-4 border border-dashed rounded bg-slate-50 flex flex-wrap items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-emerald-500 shrink-0" />
                  <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                    This onboarding wizard maps database isolation filters to secure college schemas. Dynamic tenant routing will isolate API queries by matching credentials header tokens.
                  </p>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t">
                <Button onClick={() => setWizardStep(2)} variant="secondary">
                  <ArrowLeft className="mr-1 h-4 w-4" /> Back
                </Button>
                <Button onClick={handleFinishWizard} variant="primary">
                  Deploy College Tenant <CheckCircle className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

        </div>

        {/* Support ticket submission - Right Col */}
        <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4 h-fit">
          <h3 className="text-sm font-extrabold uppercase border-b pb-2 flex flex-wrap items-center gap-1">
            <FileText className="h-4 w-4 text-primary" /> Dean Grievance ticket
          </h3>

          <form onSubmit={handleSubmitTicket} className="space-y-3">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold text-muted-foreground">Complaint Category</label>
              <select
                value={ticketCategory}
                onChange={e => setTicketCategory(e.target.value)}
                className="h-9 border rounded bg-background px-3"
              >
                <option value="ACADEMIC">Academic / Timetable Issue (Dean Academics)</option>
                <option value="ADMISSION">Admission / Fee Issue (Dean Admissions)</option>
                <option value="INFRASTRUCTURE">Infrastructure & Hostel Issue</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold text-muted-foreground">Grievance Subject</label>
              <input
                type="text"
                required
                value={ticketTitle}
                onChange={e => setTicketTitle(e.target.value)}
                placeholder="e.g. Lab 3 Wi-Fi connection latency"
                className="h-9 border rounded bg-background px-3"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold text-muted-foreground">Complaint Details</label>
              <textarea
                required
                value={ticketDesc}
                onChange={e => setTicketDesc(e.target.value)}
                placeholder="Details of complaint..."
                className="h-16 border rounded bg-background p-2"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="checkbox"
                checked={ticketAnonymous}
                onChange={e => setTicketAnonymous(e.target.checked)}
                className="h-4 w-4 rounded"
              />
              <span className="text-[10px]">Submit as Anonymous Complaint</span>
            </div>

            <Button type="submit" variant="primary" className="w-full">
              File Support Ticket <Send className="ml-1 h-3.5 w-3.5" />
            </Button>
          </form>

          {/* Log list */}
          <div className="space-y-2 border-t pt-3">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Routed Tickets Ledger</span>
            {tickets.map((tkt, idx) => (
              <div key={idx} className="p-2.5 border rounded bg-background flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono text-primary font-bold">{tkt.id}</span>
                  <span className="text-[9px] bg-amber-50 text-amber-600 border px-1.5 py-0.5 rounded font-extrabold uppercase">{tkt.status}</span>
                </div>
                <h5 className="font-bold">{tkt.title}</h5>
                <span className="text-[9px] text-muted-foreground">Routed Target: {tkt.category === 'ACADEMIC' ? 'Academic Dean' : 'Admissions Dean'}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
export default CollegeOnboarding;
