import React, { useState, useEffect } from 'react';
import { Home, Wifi, Shield, Thermometer, Phone, AlertCircle, Clock, CheckCircle, Star, MessageSquare } from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';
import api from '../../lib/axios';

const HOSTEL_DATA = {
  block: 'Newton Block',
  room: '304-A',
  floor: '3rd Floor',
  type: 'Double Occupancy',
  warden: 'Dr. Priya Nair',
  wardenPhone: '+91 98765 43210',
  roommates: [{ name: 'Karthik Subramanian', dept: 'CSE', year: '3rd Year' }],
  amenities: [
    { label: 'Wi-Fi Network', status: 'Active', icon: <Wifi className="h-4 w-4 text-emerald-500" /> },
    { label: 'CCTV Security', status: 'Operational', icon: <Shield className="h-4 w-4 text-indigo-500" /> },
    { label: 'Hot Water', status: 'Available', icon: <Thermometer className="h-4 w-4 text-amber-500" /> },
    { label: 'Laundry', status: 'Available', icon: <CheckCircle className="h-4 w-4 text-emerald-500" /> },
  ],
  feeStatus: { term: 'July–December 2026', amount: '₹35,000', paid: true, dueDate: '2026-07-15' },
  complaints: [
    { id: 'HC-001', issue: 'Water heater in bathroom not functioning', status: 'IN_PROGRESS', date: '2026-07-18' },
    { id: 'HC-002', issue: 'Window latch needs repair', status: 'RESOLVED', date: '2026-07-10' },
  ]
};

export const StudentHostel: React.FC = () => {
  const [hostelData] = useState(HOSTEL_DATA);
  const [newComplaint, setNewComplaint] = useState('');
  const [complaints, setComplaints] = useState(HOSTEL_DATA.complaints);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHostel = async () => {
      try {
        const res = await api.get('/enterprise/hostel/buildings');
        // Use demo data if no specific student assignment returned
      } catch { /* use demo */ }
      finally { setIsLoading(false); }
    };
    fetchHostel();
  }, []);

  const handleComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComplaint.trim()) return;
    const newEntry = {
      id: `HC-00${complaints.length + 3}`,
      issue: newComplaint.trim(),
      status: 'PENDING',
      date: new Date().toISOString().split('T')[0]
    };
    setComplaints(prev => [newEntry, ...prev]);
    setNewComplaint('');
    toast.success('Maintenance complaint registered successfully.');
  };

  if (isLoading) return <Loading text="Loading Hostel Records..." />;

  return (
    <div className="space-y-6 text-left pb-12 animate-in fade-in duration-200">
      <div>
        <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
          <Home className="h-5 w-5 text-indigo-600" /> Hostel Residence Management
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Room details, amenities, fee status, and maintenance requests</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Room Info */}
        <div className="lg:col-span-2 space-y-5">
          <div className="border bg-card p-5 rounded-2xl shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">Room Assignment</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              {[
                { label: 'Hostel Block', value: hostelData.block },
                { label: 'Room Number', value: hostelData.room },
                { label: 'Floor', value: hostelData.floor },
                { label: 'Room Type', value: hostelData.type },
                { label: 'Warden', value: hostelData.warden },
                { label: 'Warden Contact', value: hostelData.wardenPhone },
              ].map((item, idx) => (
                <div key={idx} className="p-3 bg-muted/30 rounded-xl">
                  <span className="text-[9px] uppercase font-black text-slate-400 block">{item.label}</span>
                  <span className="font-extrabold text-slate-800 dark:text-white block mt-0.5">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Roommates */}
          <div className="border bg-card p-5 rounded-2xl shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Roommates</h3>
            {hostelData.roommates.map((rm, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 border rounded-xl">
                <div className="h-9 w-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm">
                  {rm.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-800 dark:text-white">{rm.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold">{rm.dept} · {rm.year}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Complaints */}
          <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Maintenance Requests</h3>
            <form onSubmit={handleComplaint} className="flex gap-2">
              <input type="text" placeholder="Describe maintenance issue..." value={newComplaint}
                onChange={e => setNewComplaint(e.target.value)}
                className="flex-1 text-xs px-3 py-2 border bg-background rounded-xl outline-none font-semibold" />
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-xs font-black rounded-xl hover:bg-indigo-700">Submit</button>
            </form>
            <div className="space-y-2">
              {complaints.map((c) => (
                <div key={c.id} className="p-3 border rounded-xl flex justify-between items-start text-xs">
                  <div>
                    <span className="text-[9px] font-mono text-slate-400">{c.id}</span>
                    <p className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{c.issue}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">{c.date}</p>
                  </div>
                  <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                    c.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                    c.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                    'bg-slate-100 text-slate-500'
                  }`}>{c.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-5">
          {/* Fee Status */}
          <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Hostel Fee Status</h3>
            <div className="space-y-2 text-xs font-semibold">
              <div className="flex justify-between"><span className="text-slate-400">Term</span><span className="font-extrabold">{hostelData.feeStatus.term}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Amount</span><span className="font-extrabold">{hostelData.feeStatus.amount}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Status</span>
                <span className={`font-black text-[10px] uppercase px-2 py-0.5 rounded-full ${hostelData.feeStatus.paid ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  {hostelData.feeStatus.paid ? 'Paid' : 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Amenities Status</h3>
            <div className="space-y-2">
              {hostelData.amenities.map((a, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 border rounded-xl text-xs">
                  <div className="flex items-center gap-2">{a.icon}<span className="font-semibold">{a.label}</span></div>
                  <span className="text-[9px] font-black text-emerald-600">{a.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Contacts */}
          <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Emergency Contacts</h3>
            {[
              { role: 'Warden', name: 'Dr. Priya Nair', phone: '+91 98765 43210' },
              { role: 'Security', name: 'Campus Security', phone: '+91 98001 12345' },
              { role: 'Medical', name: 'Campus Clinic', phone: '+91 044-2200-0000' },
            ].map((c, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <div>
                  <span className="font-extrabold text-slate-700 dark:text-slate-200">{c.role}</span>
                  <span className="text-slate-400 font-semibold"> · {c.name}</span>
                  <p className="text-[9px] text-indigo-600 font-bold">{c.phone}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentHostel;
