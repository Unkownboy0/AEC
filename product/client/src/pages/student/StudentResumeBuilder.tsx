import React, { useState, useEffect } from "react";
import {
  FilePlus,
  Star,
  Info,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  User,
  Shield,
  ChevronRight,
  TrendingUp,
  Award,
  MapPin,
  Building2,
  Calendar,
  Sparkles,
  Download,
  Eye,
  FileDown,
  Plus,
  Trash2,
  GitBranch,
  Globe,
} from "lucide-react";
import { toast } from "../../components/ui/Toast";
import { Loading } from "../../components/ui/Loading";
import api from "../../lib/axios";

export const StudentResumeBuilder: React.FC = () => {
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [activeTemplate, setActiveTemplate] = useState<
    "ats" | "harvard" | "modern"
  >("ats");
  const [isLoading, setIsLoading] = useState(true);

  // Resume State
  const [personal, setPersonal] = useState({
    name: "JOHN SMITH",
    email: "john.smith@gmail.com",
    phone: "+91 90000 00000",
    address: "Campus, Block C, Room 301",
    linkedin: "linkedin.com/in/johnsmith",
    github: "github.com/johnsmith",
    portfolio: "johnsmith.dev",
  });

  const [education, setEducation] = useState([
    {
      inst: "Geetorus Institute of Technology",
      degree: "B.Tech in Computer Science & Engineering",
      duration: "2023 - 2027",
      grade: "9.5 CGPA",
    },
  ]);

  const [projects, setProjects] = useState([
    {
      title: "Enterprise Recruitment ERP",
      tech: "React, Node.js, Prisma, PostgreSQL",
      desc: "Designed a database-mapped student recruitment dashboard with real-time analytics.",
    },
  ]);

  const [skills, setSkills] = useState({
    tech: "React, Node.js, TypeScript, SQL, Git, Python, Java",
    soft: "Leadership, Effective Communication, Team Collaboration, Analytical Thinking",
  });

  const [experience, setExperience] = useState([
    {
      comp: "Google India",
      role: "Software Engineering Intern",
      duration: "Jun 2026 - Aug 2026",
      desc: "Optimized search index queries and contributed to backend microservices deployment.",
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
        if (
          studentRes.data?.status === "success" &&
          studentRes.data.data?.length > 0
        ) {
          const student = studentRes.data.data[0];
          setStudentInfo(student);
          setPersonal({
            name: `${student.firstName} ${student.lastName}`.toUpperCase(),
            email: student.email,
            phone: student.phone || "+91 90000 00000",
            address: student.currentAddress || "Campus",
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
    toast.success("Project added to CV.");
  };

  const handleRemoveProject = (idx: number) => {
    setProjects((prev) => prev.filter((_, i) => i !== idx));
    toast.success("Project removed from CV.");
  };

  if (isLoading) return <Loading text="Initializing AI Resume Builder..." />;

  return (
    <div className="dark bg-slate-950 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-6 text-left pb-12 animate-in fade-in duration-200">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-black tracking-wider text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded flex items-center gap-1">
              <Sparkles className="h-3 w-3 animate-pulse" /> AI Assistant Active
            </span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1.5 flex items-center gap-2">
            <FilePlus className="h-6 w-6 text-indigo-500" /> AI Resume Optimizer
          </h1>
          <p className="text-xs text-slate-400">
            Design high-scoring, ATS-friendly resumes verified by campus
            criteria
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-slate-950 text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            <Download className="h-4 w-4" /> Download PDF / Print
          </button>
        </div>
      </div>

      {/* Grid: Form Panel Left, Resume Mock Sheet Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form Inputs */}
        <div className="lg:col-span-5 space-y-6">
          {/* AI Score */}
          <div className="border border-indigo-900/50 bg-indigo-950/20 p-4 rounded-xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-white flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-cyan-400" /> ATS Compatibility
                Score
              </span>
              <span className="text-base font-black text-cyan-400">92/100</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                style={{ width: "92%" }}
              ></div>
            </div>
            <p className="text-[9px] text-slate-500 font-bold leading-normal">
              ✓ Good keyword density. Suggestion: Add more action verbs like
              "Coordinated", "Refactored" in experience description.
            </p>
          </div>

          {/* Personal Info */}
          <div className="border border-slate-800 bg-slate-900/40 p-5 rounded-xl space-y-3.5">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
              Contact Credentials
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs font-bold text-slate-400">
              <div className="col-span-2">
                <label className="block text-[8px] uppercase text-slate-500 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={personal.name}
                  onChange={(e) =>
                    setPersonal((prev) => ({
                      ...prev,
                      name: e.target.value.toUpperCase(),
                    }))
                  }
                  className="w-full px-3 py-1.5 border border-slate-800 bg-slate-950 rounded-lg outline-none text-slate-200"
                />
              </div>
              <div>
                <label className="block text-[8px] uppercase text-slate-500 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={personal.phone}
                  onChange={(e) =>
                    setPersonal((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="w-full px-3 py-1.5 border border-slate-800 bg-slate-950 rounded-lg outline-none text-slate-200"
                />
              </div>
              <div>
                <label className="block text-[8px] uppercase text-slate-500 mb-1">
                  Portfolio link
                </label>
                <input
                  type="text"
                  value={personal.portfolio}
                  onChange={(e) =>
                    setPersonal((prev) => ({
                      ...prev,
                      portfolio: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-1.5 border border-slate-800 bg-slate-950 rounded-lg outline-none text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Skill Blocks */}
          <div className="border border-slate-800 bg-slate-900/40 p-5 rounded-xl space-y-3.5">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
              Technical skillsets
            </h3>
            <div className="space-y-3 text-xs font-bold text-slate-400">
              <div>
                <label className="block text-[8px] uppercase text-slate-500 mb-1">
                  Languages & Frameworks
                </label>
                <input
                  type="text"
                  value={skills.tech}
                  onChange={(e) =>
                    setSkills((prev) => ({ ...prev, tech: e.target.value }))
                  }
                  className="w-full px-3 py-1.5 border border-slate-800 bg-slate-950 rounded-lg outline-none text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Add Projects */}
          <div className="border border-slate-800 bg-slate-900/40 p-5 rounded-xl space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
              Add Technical Project
            </h3>
            <form
              onSubmit={handleAddProject}
              className="space-y-3 text-xs font-semibold"
            >
              <div>
                <label className="block text-[8px] uppercase font-black text-slate-500 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Portfolio Website..."
                  value={projTitle}
                  onChange={(e) => setProjTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-800 bg-slate-950 rounded-lg outline-none text-slate-200"
                />
              </div>
              <div>
                <label className="block text-[8px] uppercase font-black text-slate-500 mb-1">
                  Tech Stack
                </label>
                <input
                  type="text"
                  placeholder="React, CSS, Node.js..."
                  value={projTech}
                  onChange={(e) => setProjTech(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-800 bg-slate-950 rounded-lg outline-none text-slate-200"
                />
              </div>
              <div>
                <label className="block text-[8px] uppercase font-black text-slate-500 mb-1">
                  Details
                </label>
                <textarea
                  placeholder="Explain project goals and technical highlights..."
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-800 bg-slate-950 rounded-lg outline-none text-slate-200 resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-slate-950 text-xs font-black rounded-lg transition-all"
              >
                Append Project
              </button>
            </form>
          </div>
        </div>

        {/* Right Live Sheet Preview */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex border border-slate-800 rounded-xl overflow-hidden text-xs font-bold w-fit bg-slate-900/60 p-1">
            {[
              { id: "ats", name: "ATS Standard" },
              { id: "harvard", name: "Harvard Style" },
              { id: "modern", name: "Modern Creative" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTemplate(t.id as any)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTemplate === t.id
                    ? "bg-indigo-600 text-slate-950"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>

          {/* Actual Mockup Sheet */}
          <div className="w-full min-h-[750px] bg-white text-slate-900 p-8 rounded-xl shadow-2xl border border-slate-200 font-sans text-left text-xs leading-normal select-none overflow-x-auto">
            <div className="max-w-2xl mx-auto space-y-5">
              {/* Header */}
              <div className="text-center space-y-1">
                <h2 className="text-xl font-extrabold tracking-wide">
                  {personal.name}
                </h2>
                <p className="text-[10px] text-slate-500 font-semibold">
                  {personal.address} · {personal.phone} · {personal.email}
                </p>
                <p className="text-[9px] text-indigo-700 font-bold">
                  {personal.linkedin} · {personal.github} · {personal.portfolio}
                </p>
              </div>

              {/* Education */}
              <div className="space-y-1.5">
                <h3 className="font-extrabold text-[11px] uppercase border-b-2 border-slate-800 pb-0.5 tracking-wider">
                  Education
                </h3>
                {education.map((edu, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-start text-[10px]"
                  >
                    <div>
                      <h4 className="font-extrabold text-slate-800">
                        {edu.inst}
                      </h4>
                      <p className="italic text-slate-500 font-semibold">
                        {edu.degree}
                      </p>
                    </div>
                    <div className="text-right font-semibold">
                      <span className="block text-slate-700">
                        {edu.duration}
                      </span>
                      <span className="block text-indigo-700 font-bold">
                        {edu.grade}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Internship */}
              <div className="space-y-1.5">
                <h3 className="font-extrabold text-[11px] uppercase border-b-2 border-slate-800 pb-0.5 tracking-wider">
                  Professional Experience
                </h3>
                {experience.map((exp, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-start text-[10px]">
                      <div>
                        <h4 className="font-extrabold text-slate-850">
                          {exp.comp}
                        </h4>
                        <p className="italic text-slate-500 font-semibold">
                          {exp.role}
                        </p>
                      </div>
                      <span className="text-slate-750 font-semibold">
                        {exp.duration}
                      </span>
                    </div>
                    <p className="text-[9.5px] text-slate-600 leading-relaxed font-semibold pl-1">
                      • {exp.desc}
                    </p>
                  </div>
                ))}
              </div>

              {/* Projects */}
              <div className="space-y-1.5">
                <h3 className="font-extrabold text-[11px] uppercase border-b-2 border-slate-800 pb-0.5 tracking-wider">
                  Projects
                </h3>
                {projects.map((proj, idx) => (
                  <div key={idx} className="space-y-1 relative group">
                    <div className="flex justify-between items-center text-[10px]">
                      <h4 className="font-extrabold text-slate-850">
                        {proj.title}
                      </h4>
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
                <h3 className="font-extrabold text-[11px] uppercase border-b-2 border-slate-800 pb-0.5 tracking-wider">
                  Skills
                </h3>
                <div className="text-[10px] space-y-1 font-semibold text-slate-700">
                  <p>
                    <span className="font-extrabold text-slate-850">
                      Technical Skills:
                    </span>{" "}
                    {skills.tech}
                  </p>
                  <p>
                    <span className="font-extrabold text-slate-850">
                      Soft Skills:
                    </span>{" "}
                    {skills.soft}
                  </p>
                </div>
              </div>

              {/* Declaration */}
              <div className="space-y-1 pt-2 border-t border-slate-200 text-[8.5px] text-slate-400 font-bold">
                <p>
                  I hereby declare that all the information provided above is
                  true and authentic to the best of my knowledge.
                </p>
                <p className="mt-4 text-right italic text-slate-700">
                  Signature / Mapped from John Smith Profile
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
