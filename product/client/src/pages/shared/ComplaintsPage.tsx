import React, { useState } from 'react';
import { ComplaintMonitoringCenter } from '../../components/complaint/ComplaintMonitoringCenter';
import { MyComplaintsList } from '../../components/complaint/MyComplaintsList';
import { PageHeader } from '../../design-system/components/PageHeader';
import { Plus, CheckCircle2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { toast } from '../../components/ui/Toast';
import api from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';

export const ComplaintsPage: React.FC = () => {
  const { user } = useAuth();
  const isStudent = (user?.role || '').toUpperCase() === 'STUDENT';
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleLogComplaint = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const category = formData.get('category') as string;
    const priority = formData.get('priority') as string;
    const description = formData.get('description') as string;

    if (!title || !description) {
      toast.error('Please enter a title and description for the complaint');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post('/enterprise/complaints', {
        title,
        category,
        priority,
        description,
      });

      if (res.data?.status === 'success' || res.status === 201 || res.status === 200) {
        toast.success('Complaint filed and assigned to the grievance desk');
        setIsLogModalOpen(false);
        setRefreshKey((prev) => prev + 1);
      } else {
        toast.success('Complaint logged');
        setIsLogModalOpen(false);
        setRefreshKey((prev) => prev + 1);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to file complaint');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-16">
      {/* Dedicated Workspace Page Header */}
      <PageHeader
        title={isStudent ? 'My Complaints & Grievances' : 'Grievance & Complaint Management Center'}
        subtitle={isStudent
          ? 'File a grievance and track its status through resolution'
          : 'Institutional complaint tracking, resolution timelines, escalations, and grievance control'}
        primaryAction={{
          label: 'File New Complaint',
          onClick: () => setIsLogModalOpen(true),
          icon: <Plus className="w-4 h-4" />,
        }}
      />

      {/* Main Dedicated Complaint Workspace Body */}
      <div key={refreshKey}>
        {isStudent ? <MyComplaintsList refreshKey={refreshKey} /> : <ComplaintMonitoringCenter />}
      </div>

      {/* Log New Complaint Modal */}
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
                className="w-full h-10 px-3 bg-surface border border-border rounded-xl text-xs font-semibold focus:outline-none"
              >
                <option value="ACADEMIC">Academic / Coursework</option>
                <option value="HOSTEL">Hostel & Residential</option>
                <option value="INFRASTRUCTURE">Infrastructure & IT</option>
                <option value="TRANSPORT">Transport / Bus</option>
                <option value="DISCIPLINARY">Disciplinary Concern</option>
                <option value="GENERAL">General Grievance</option>
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
              <span>{isSubmitting ? 'Submitting...' : 'File Complaint'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ComplaintsPage;
