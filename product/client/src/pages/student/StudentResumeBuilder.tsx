import React, { useState, useEffect } from "react";
import {
  FilePlus, Star, Info, FileText, CheckCircle, Clock, AlertTriangle,
  ArrowRight, User, Shield, ChevronRight, TrendingUp, Award, MapPin,
  Building2, Calendar, Sparkles, Download, Eye, FileDown, Plus, Trash2,
  GitBranch, Globe, Check
} from "lucide-react";
import { toast } from "../../components/ui/Toast";
import { Loading } from "../../components/ui/Loading";
import api from "../../lib/axios";

export const StudentResumeBuilder: React.FC = () => {
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [activeTemplate, setActiveTemplate] = useState<"ats" | "harvard" | "modern">("ats");
  const [isLoading, setIsLoading] = useState(true);

  // Resume State
  const [personal, setPersonal] = useState({
    name: "JOHN SMITH",
    email: "john.smith@campus.edu",
    phone: "+91 98765 43210",
    address: "Campus Residential Hall",
    linkedin: "linkedin.com/in/student",
    github: "github.com/student",
    portfolio: "student.dev",
  });

  const [education, setEducation] = useState([
    {
      inst: "Department of Information Technology",
      degree: "B.Tech in Information Technology",
      duration: "2023 - 2027",
      grade: "8.9 CGPA",
    },
  ]);

  const [projects, setProjects] = useState([
    {
      title: "Enterprise Campus Automation Portal",
      tech: "React, Node.js, Prisma, PostgreSQL",
      desc: "Architected a multi-role campus management ERP supporting real-time workflow approvals and analytics.",
    },
  ]);

  const [skills, setSkills] = useState({
    tech: "React, TypeScript, Node.js, PostgreSQL, Tailwind CSS, Python, Git",
    soft: "Problem Solving, Technical Communication, Cross-functional Collaboration",
  });

  const [experience, setExperience] = useState([
    {
      comp: "Google India",
      role: "Software Engineering Intern",
      duration: "Jun 2026 - Aug 2026",
      desc: "Optimized distributed service query latency and contributed to cloud telemetry pipelines.",
    },
  ]);

  // Form input builders
  const [projTitle, setProjTitle] = useState("");
  const [projTech, setProjTech] = useState("");
  const [projDesc, setProjDesc] = useState("");

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const studentRes = await api.get("/enterprise/students");
        if (studentRes.data?.status === "success" && studentRes.data.data?.length > 0) {
          const student = studentRes.data.data[0];
          setStudentInfo(student);
          setPersonal({
            name: `${student.firstName} ${student.lastName}`.toUpperCase(),
            email: student.email,
            phone: student.phone || "+91 98765 43210",
            address: student.currentAddress || "Campus Residential Hall",
            linkedin: student.linkedin || "linkedin.com/in/student",
            github: student.github || "github.com/student",
            portfolio: student.portfolio || "student.dev",
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudent();
  }, []);

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projTitle.trim()) return;
    setProjects((prev) => [
      ...prev,
      {
        title: projTitle.trim(),
        tech: projTech.trim(),
        desc: projDesc.trim(),
      },
    ]);
    setProjTitle("");
    setProjTech("");
    setProjDesc("");
    toast.success("Project added to resume.");
  };

  const handleRemoveProject = (idx: number) => {
    setProjects((prev) => prev.filter((_, i) => i !== idx));
    toast.success("Project removed from resume.");
  };

  if (isLoading) return <Loading text="Initializing AI Resume Builder..." />;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto text-left pb-28 animate-in fade-in duration-200">
      
      {/* Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-5 sm:p-7 shadow-xs">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Career Documentation Tools</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2.5">
              <FilePlus className="h-7 w-7 text-primary" /> AI Resume Optimizer
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Design high-scoring, ATS-friendly resumes tailored for campus placement criteria.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download className="h-4 w-4" /> Download PDF / Print
            </button>
          </div>
        </div>
      </section>

      {/* Grid: Form Panel Left, Resume Mock Sheet Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Form Inputs (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* AI Score */}
          <div className="border border-primary/20 bg-primary/5 p-4 rounded-2xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary" /> ATS Compatibility Score
              </span>
              <span className="text-base font-black text-primary">94/100</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full"
                style={{ width: "94%" }}
              />
            </div>
            <p className="text-[10.5px] text-muted-foreground font-medium leading-normal">
              ✓ Excellent structure and keyword balance. Recommended action: Highlight measurable project outcomes.
            </p>
          </div>

          {/* Personal Info */}
          <div className="bg-card border border-border p-5 rounded-2xl shadow-xs space-y-3.5">
            <h3 className="text-xs font-black uppercase text-foreground tracking-wider flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> Contact Credentials
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs font-bold">
              <div className="col-span-2">
                <label className="block text-[9px] uppercase text-muted-foreground mb-1">Full Name</label>
                <input
                  type="text"
                  value={personal.name}
                  onChange={(e) => setPersonal((prev) => ({ ...prev, name: e.target.value.toUpperCase() }))}
                  className="w-full px-3 py-2 border border-border bg-background rounded-xl outline-none text-foreground focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase text-muted-foreground mb-1">Phone</label>
                <input
                  type="text"
                  value={personal.phone}
                  onChange={(e) => setPersonal((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-border bg-background rounded-xl outline-none text-foreground focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase text-muted-foreground mb-1">Portfolio Link</label>
                <input
                  type="text"
                  value={personal.portfolio}
                  onChange={(e) => setPersonal((prev) => ({ ...prev, portfolio: e.target.value }))}
                  className="w-full px-3 py-2 border border-border bg-background rounded-xl outline-none text-foreground focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Skill Blocks */}
          <div className="bg-card border border-border p-5 rounded-2xl shadow-xs space-y-3.5">
            <h3 className="text-xs font-black uppercase text-foreground tracking-wider flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Technical Skillsets
            </h3>
            <div className="space-y-3 text-xs font-bold">
              <div>
                <label className="block text-[9px] uppercase text-muted-foreground mb-1">Languages & Frameworks</label>
                <input
                  type="text"
                  value={skills.tech}
                  onChange={(e) => setSkills((prev) => ({ ...prev, tech: e.target.value }))}
                  className="w-full px-3 py-2 border border-border bg-background rounded-xl outline-none text-foreground focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Add Projects */}
          <div className="bg-card border border-border p-5 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase text-foreground tracking-wider flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" /> Add Technical Project
            </h3>
            <form onSubmit={handleAddProject} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-[9px] uppercase font-black text-muted-foreground mb-1">Project Name</label>
                <input
                  type="text"
                  placeholder="e.g. Portfolio Website..."
                  value={projTitle}
                  onChange={(e) => setProjTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-border bg-background rounded-xl outline-none text-foreground focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase font-black text-muted-foreground mb-1">Tech Stack</label>
                <input
                  type="text"
                  placeholder="React, CSS, Node.js..."
                  value={projTech}
                  onChange={(e) => setProjTech(e.target.value)}
                  className="w-full px-3 py-2 border border-border bg-background rounded-xl outline-none text-foreground focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase font-black text-muted-foreground mb-1">Details</label>
                <textarea
                  placeholder="Explain project goals and technical highlights..."
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-border bg-background rounded-xl outline-none text-foreground resize-none focus:border-primary"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Add Project
              </button>
            </form>
          </div>
        </div>

        {/* Right Live Sheet Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex border border-border rounded-2xl overflow-hidden text-xs font-bold w-fit bg-card p-1 shadow-xs">
            {[
              { id: "ats", name: "ATS Standard" },
              { id: "harvard", name: "Harvard Style" },
              { id: "modern", name: "Modern Creative" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTemplate(t.id as any)}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  activeTemplate === t.id
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>

          {/* Actual Mockup Sheet */}
          <div className="w-full min-h-[750px] bg-white text-slate-900 p-8 rounded-2xl shadow-xl border border-slate-200 font-sans text-left text-xs leading-normal select-none overflow-x-auto">
            <div className="max-w-2xl mx-auto space-y-5">
              {/* Header */}
              <div className="text-center space-y-1">
                <h2 className="text-xl font-extrabold tracking-wide text-slate-900">
                  {personal.name}
                </h2>
                <p className="text-[10px] text-slate-500 font-semibold">
                  {personal.address} • {personal.phone} • {personal.email}
                </p>
                <p className="text-[9px] text-indigo-700 font-bold">
                  {personal.linkedin} • {personal.github} • {personal.portfolio}
                </p>
              </div>

              {/* Education */}
              <div className="space-y-1.5">
                <h3 className="font-extrabold text-[11px] uppercase border-b-2 border-slate-800 pb-0.5 tracking-wider text-slate-900">
                  Education
                </h3>
                {education.map((edu, idx) => (
                  <div key={idx} className="flex justify-between items-start text-[10px]">
                    <div>
                      <h4 className="font-extrabold text-slate-800">{edu.inst}</h4>
                      <p className="italic text-slate-500 font-semibold">{edu.degree}</p>
                    </div>
                    <div className="text-right font-semibold">
                      <span className="block text-slate-700">{edu.duration}</span>
                      <span className="block text-indigo-700 font-bold">{edu.grade}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Internship */}
              <div className="space-y-1.5">
                <h3 className="font-extrabold text-[11px] uppercase border-b-2 border-slate-800 pb-0.5 tracking-wider text-slate-900">
                  Professional Experience
                </h3>
                {experience.map((exp, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-start text-[10px]">
                      <div>
                        <h4 className="font-extrabold text-slate-800">{exp.comp}</h4>
                        <p className="italic text-slate-500 font-semibold">{exp.role}</p>
                      </div>
                      <span className="text-slate-700 font-semibold">{exp.duration}</span>
                    </div>
                    <p className="text-[9.5px] text-slate-600 leading-relaxed font-semibold pl-1">
                      • {exp.desc}
                    </p>
                  </div>
                ))}
              </div>

              {/* Projects */}
              <div className="space-y-1.5">
                <h3 className="font-extrabold text-[11px] uppercase border-b-2 border-slate-800 pb-0.5 tracking-wider text-slate-900">
                  Projects
                </h3>
                {projects.map((proj, idx) => (
                  <div key={idx} className="space-y-1 relative group">
                    <div className="flex justify-between items-center text-[10px]">
                      <h4 className="font-extrabold text-slate-800">{proj.title}</h4>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[8px] bg-slate-100 text-slate-600 border px-1.5 py-0.5 rounded font-mono">
                          {proj.tech}
                        </span>
                        <button
                          onClick={() => handleRemoveProject(idx)}
                          className="text-rose-600 hover:text-rose-800 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          [Delete]
                        </button>
                      </div>
                    </div>
                    <p className="text-[9.5px] text-slate-600 leading-relaxed font-semibold pl-1">
                      • {proj.desc}
                    </p>
                  </div>
                ))}
              </div>

              {/* Skills */}
              <div className="space-y-1.5">
                <h3 className="font-extrabold text-[11px] uppercase border-b-2 border-slate-800 pb-0.5 tracking-wider text-slate-900">
                  Skills
                </h3>
                <div className="text-[10px] space-y-1 font-semibold text-slate-700">
                  <p>
                    <span className="font-extrabold text-slate-800">Technical Skills:</span> {skills.tech}
                  </p>
                  <p>
                    <span className="font-extrabold text-slate-800">Soft Skills:</span> {skills.soft}
                  </p>
                </div>
              </div>

              {/* Declaration */}
              <div className="space-y-1 pt-2 border-t border-slate-200 text-[8.5px] text-slate-400 font-bold">
                <p>
                  I hereby declare that all the information provided above is authentic and verifiable.
                </p>
                <p className="mt-4 text-right italic text-slate-700">
                  Signature / {personal.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentResumeBuilder;
