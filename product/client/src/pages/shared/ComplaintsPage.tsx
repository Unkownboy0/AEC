import React, { useState } from "react";
import { ComplaintMonitoringCenter } from "../../components/complaint/ComplaintMonitoringCenter";
import { MyComplaintsList } from "../../components/complaint/MyComplaintsList";
import { PageHeader } from "../../design-system/components/PageHeader";
import { Plus, CheckCircle2, AlertTriangle, Lock } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { toast } from "../../components/ui/Toast";
import api from "../../lib/axios";
import { useAuth } from "../../context/AuthContext";

const CATEGORY_ROUTING: Record<string, { label: string; destination: string; isConfidential?: boolean }> = {
  ACADEMIC:           { label: "Academic / Coursework",        destination: "Operating Department HOD" },
  ATTENDANCE_ISSUE:   { label: "Attendance Discrepancy",       destination: "Department HOD / Class Adviser" },
  FACULTY_BEHAVIOR:   { label: "Faculty Conduct",              destination: "Department HOD (confidential)" },
  HOSTEL:             { label: "Hostel & Residential",         destination: "Hostel Warden + A&A Dean" },
  INFRASTRUCTURE:     { label: "Infrastructure & IT",          destination: "Administration Office (A&A Dean)" },
  TRANSPORT:          { label: "Transport / Bus",              destination: "Transport Manager + A&A Dean" },
  FEES:               { label: "Fees & Finance",               destination: "Accounts Department (AO/Accountant)" },
  DISCIPLINARY:       { label: "Disciplinary Concern",         destination: "A&A Dean + Principal Visibility" },
  ANTI_RAGGING:       { label: "Anti-Ragging / Harassment",    destination: "Anti-Ragging Cell (Confidential)", isConfidential: true },
  GENERAL:            { label: "General Grievance",            destination: "Administration & A&A Dean" },
};

export const ComplaintsPage: React.FC = () => {
  const { user } = useAuth();
  const isStudent = (user?.role || "").toUpperCase() === "STUDENT";
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("ACADEMIC");
  const [isConfidential, setIsConfidential] = useState(false);

  const categoryInfo = CATEGORY_ROUTING[selectedCategory] || CATEGORY_ROUTING.GENERAL;

  const handleLogComplaint = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const priority = formData.get("priority") as string;
    const description = formData.get("description") as string;

    if (!title || !description) {
      toast.error("Please enter a title and description for the complaint");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post("/enterprise/complaints", {
        title,
        category: selectedCategory,
        priority,
        description,
        isConfidential: isConfidential || categoryInfo.isConfidential,
      });

      if (res.data?.status === "success" || res.status === 201 || res.status === 200) {
        toast.success("Complaint filed. Routed to: " + categoryInfo.destination);
        setIsLogModalOpen(false);
        setRefreshKey((prev) => prev + 1);
        setSelectedCategory("ACADEMIC");
        setIsConfidential(false);
      } else {
        toast.success("Complaint logged");
        setIsLogModalOpen(false);
        setRefreshKey((prev) => prev + 1);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to file complaint");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-16">
      <PageHeader
        title={isStudent ? "My Complaints & Grievances" : "Grievance & Complaint Management Center"}
        subtitle={isStudent
          ? "File a grievance and track its status through resolution"
          : "Institutional complaint tracking, resolution timelines, escalations, and grievance control"}
        primaryAction={{
          label: "File New Complaint",
          onClick: () => setIsLogModalOpen(true),
          icon: <Plus className="w-4 h-4" />,
        }}
      />

      <div key={refreshKey}>
        {isStudent ? <MyComplaintsList refreshKey={refreshKey} /> : <ComplaintMonitoringCenter />}
      </div>

      <Modal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title="Log Institutional Grievance / Complaint"
      >
        <form onSubmit={handleLogComplaint} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-bold text-text-primary block mb-1">
              Complaint Subject / Title <span className="text-rose-500">*</span>
            </label>
            <Input
              name="title"
              placeholder="e.g. Lab 3 Air Conditioning Malfunction, Attendance Discrepancy"
              required
              className="h-10 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-text-primary block mb-1">Category</label>
              <select
                name="category"
                value={selectedCategory}
                onChange={e => {
                  setSelectedCategory(e.target.value);
                  if (e.target.value === "ANTI_RAGGING") setIsConfidential(true);
                }}
                className="w-full h-10 px-3 bg-surface border border-border rounded-xl text-xs font-semibold focus:outline-none"
              >
                {Object.entries(CATEGORY_ROUTING).map(([value, { label }]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-text-primary block mb-1">Priority Level</label>
              <select
                name="priority"
                className="w-full h-10 px-3 bg-surface border border-border rounded-xl text-xs font-semibold focus:outline-none"
              >
                <option value="NORMAL">Normal Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="CRITICAL">Critical Emergency</option>
              </select>
            </div>
          </div>

          <div className={`flex items-start gap-2.5 p-3 rounded-xl text-xs border ${
            categoryInfo.isConfidential || isConfidential
              ? "bg-amber-500/5 border-amber-500/30 text-amber-700 dark:text-amber-300"
              : "bg-primary/5 border-primary/20 text-primary"
          }`}>
            {categoryInfo.isConfidential || isConfidential
              ? <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              : <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            }
            <div>
              <span className="font-semibold">This complaint will go to: </span>
              <span>{categoryInfo.destination}</span>
              {(categoryInfo.isConfidential || isConfidential) && (
                <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 font-bold">CONFIDENTIAL</span>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-text-primary block mb-1">
              Detailed Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              name="description"
              rows={4}
              placeholder="Provide specific details, location, dates, or individuals involved..."
              required
              className="w-full p-3 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none font-medium"
            />
          </div>

          {!categoryInfo.isConfidential && (
            <label className="flex items-center gap-2 text-xs font-medium text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={isConfidential}
                onChange={e => setIsConfidential(e.target.checked)}
                className="rounded border-border"
              />
              Mark as confidential (only visible to designated authority)
            </label>
          )}

          <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsLogModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-surface-soft hover:bg-surface border border-border text-text-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-extrabold bg-primary text-primary-foreground hover:bg-primary-hover shadow-xs transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? "Submitting..." : "File Complaint"}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ComplaintsPage;
