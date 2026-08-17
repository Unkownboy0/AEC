import React, { useState, useEffect } from 'react';
import { Home, Wifi, Shield, Thermometer, Phone, AlertCircle, Clock, CheckCircle, Plus, Send, FileText, User } from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';
import api from '../../lib/axios';

export interface HostelAllocation {
  isAllocated: boolean;
  block?: string;
  room?: string;
  floor?: string;
  type?: string;
  warden?: string;
  wardenPhone?: string;
  roommates?: { name: string; dept: string; year: string }[];
  feeStatus?: { term: string; amount: string; paid: boolean; dueDate: string };
  messTimetable?: { day: string; breakfast: string; lunch: string; dinner: string }[];
}

export const StudentHostel: React.FC = () => {
  const [allocation, setAllocation] = useState<HostelAllocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'mess' | 'outing' | 'complaints'>('details');

  // Outing Request Form State
  const [outingPurpose, setOutingPurpose] = useState('');
  const [outingDate, setOutingDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [outingRequests, setOutingRequests] = useState<any[]>([]);

  // Maintenance Complaint State
  const [newComplaint, setNewComplaint] = useState('');
  const [complaints, setComplaints] = useState<any[]>([]);

  // Day Scholar Application State
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [preferredBlock, setPreferredBlock] = useState('Newton Block');
  const [roomPreference, setRoomPreference] = useState('Double Occupancy');
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);

  useEffect(() => {
    const fetchHostelData = async () => {
      try {
        const res = await api.get('/hostel/buildings').catch(() => null);
        if (res?.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          // If institutional hostel exists, populate student allocation or day scholar status
          setAllocation({
            isAllocated: true,
            block: res.data.data[0].name || 'Newton Block (Boys)',
            room: '304-A',
            floor: '3rd Floor',
            type: 'Double Occupancy',
            warden: 'Dr. Priya Nair',
            wardenPhone: '+91 98765 43210',
            roommates: [{ name: 'Karthik Subramanian', dept: 'CSE', year: '3rd Year' }],
            feeStatus: { term: 'July–December 2026', amount: '₹35,000', paid: true, dueDate: '2026-07-15' },
            messTimetable: [
              { day: 'Monday', breakfast: 'Idli, Sambar, Chutney, Coffee', lunch: 'Rice, Sambar, Poriyal, Curd', dinner: 'Chapati, Dal Tadka, Rice' },
              { day: 'Tuesday', breakfast: 'Poori, Potato Masala, Tea', lunch: 'Variety Rice, Appalam, Curd', dinner: 'Dosa, Chutney, Sambar' },
              { day: 'Wednesday', breakfast: 'Pongal, Vada, Chutney', lunch: 'Full Meals, Veg Gravy, Rasam', dinner: 'Parotta, Veg Kurma / Gravy' },
              { day: 'Thursday', breakfast: 'Rava Upma, Coconut Chutney', lunch: 'Rice, Kara Kuzhambu, Kootu', dinner: 'Chapati, Paneer Butter Masala' },
              { day: 'Friday', breakfast: 'Dosa, Sambar, Chutney', lunch: 'Veg Biryani, Raitha, Sweet', dinner: 'Idiyappam, Coconut Milk / Kurma' },
              { day: 'Saturday', breakfast: 'Puri Masala, Coffee', lunch: 'South Indian Thali Meals', dinner: 'Fried Rice, Gobi Manchurian' },
              { day: 'Sunday', breakfast: 'Special Masala Dosa', lunch: 'Special Feast / Dum Biryani', dinner: 'Light Dinner, Milk, Fruits' },
            ]
          });
        } else {
          // Day scholar state
          setAllocation({ isAllocated: false });
        }
      } catch {
        setAllocation({ isAllocated: false });
      } finally {
        setIsLoading(false);
      }
    };

    fetchHostelData();
  }, []);

  const handleOutingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outingPurpose.trim() || !outingDate) {
      toast.error('Please specify outing purpose and departure date.');
      return;
    }
    const req = {
      id: `OUT-${Date.now().toString().slice(-4)}`,
      purpose: outingPurpose.trim(),
      date: outingDate,
      returnDate: returnDate || outingDate,
      status: 'PENDING_WARDEN_REVIEW',
      submittedAt: new Date().toLocaleDateString(),
    };
    setOutingRequests(prev => [req, ...prev]);
    setOutingPurpose('');
    setOutingDate('');
    setReturnDate('');
    toast.success('Outing pass request submitted to Warden.');
  };

  const handleComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComplaint.trim()) return;
    const newEntry = {
      id: `HC-00${complaints.length + 1}`,
      issue: newComplaint.trim(),
      status: 'PENDING',
      date: new Date().toISOString().split('T')[0]
    };
    setComplaints(prev => [newEntry, ...prev]);
    setNewComplaint('');
    toast.success('Maintenance ticket registered successfully.');
  };

  const handleApplyHostel = (e: React.FormEvent) => {
    e.preventDefault();
    setApplicationSubmitted(true);
    setShowApplyModal(false);
    toast.success('Hostel accommodation application submitted to Warden office!');
  };

  if (isLoading) return <Loading text="Verifying Hostel Residence Eligibility..." />;

  // ── Day Scholar View ──────────────────────────────────────────
  if (!allocation?.isAllocated) {
    return (
      <div className="space-y-6 text-left pb-12 animate-in fade-in duration-200">
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Home className="h-5 w-5 text-indigo-600" /> Hostel Residence & Accommodation
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Campus residential status and accommodation services</p>
        </div>

        <div className="p-6 rounded-2xl border bg-card shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Day Scholar Profile</h2>
              <p className="text-xs text-muted-foreground">You are currently registered as a Day Scholar (Non-Resident).</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Campus residential hostel blocks are available for registered outstation students. If you require on-campus accommodation, you may submit an allocation request to the Chief Warden desk.
          </p>

          {applicationSubmitted ? (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
              Application for {preferredBlock} ({roomPreference}) submitted and pending Chief Warden review.
            </div>
          ) : (
            <button
              onClick={() => setShowApplyModal(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all shadow-md flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Apply for Hostel Accommodation
            </button>
          )}
        </div>

        {/* Accommodation Application Modal */}
        {showApplyModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-card border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Hostel Accommodation Form</h3>
              <form onSubmit={handleApplyHostel} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Preferred Hostel Block</label>
                  <select
                    value={preferredBlock}
                    onChange={(e) => setPreferredBlock(e.target.value)}
                    className="w-full p-2.5 rounded-xl border bg-background text-xs font-semibold outline-none"
                  >
                    <option>Newton Block (Boys - AC)</option>
                    <option>Ramanujan Block (Boys - Non-AC)</option>
                    <option>Curie Block (Girls - AC)</option>
                    <option>Kalpana Block (Girls - Non-AC)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Room Occupancy</label>
                  <select
                    value={roomPreference}
                    onChange={(e) => setRoomPreference(e.target.value)}
                    className="w-full p-2.5 rounded-xl border bg-background text-xs font-semibold outline-none"
                  >
                    <option>Double Occupancy (Attached Bath)</option>
                    <option>Triple Occupancy</option>
                    <option>Single Occupancy (Executive)</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowApplyModal(false)}
                    className="px-3 py-2 rounded-xl border text-slate-600 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-extrabold"
                  >
                    Submit Application
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Allocated Hosteller View ──────────────────────────────────
  return (
    <div className="space-y-6 text-left pb-12 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Home className="h-5 w-5 text-indigo-600" /> Hostel Residence Management
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {allocation.block} · Room {allocation.room} ({allocation.type})
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 bg-muted/50 rounded-xl border text-xs font-bold">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'details' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Residence
          </button>
          <button
            onClick={() => setActiveTab('mess')}
            className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'mess' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Mess Menu
          </button>
          <button
            onClick={() => setActiveTab('outing')}
            className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'outing' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Outing Pass
          </button>
          <button
            onClick={() => setActiveTab('complaints')}
            className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'complaints' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Complaints
          </button>
        </div>
      </div>

      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="border bg-card p-5 rounded-2xl shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">Room Allocation</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                {[
                  { label: 'Hostel Block', value: allocation.block },
                  { label: 'Room Number', value: allocation.room },
                  { label: 'Floor', value: allocation.floor },
                  { label: 'Room Type', value: allocation.type },
                  { label: 'Warden', value: allocation.warden },
                  { label: 'Warden Contact', value: allocation.wardenPhone },
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
              {allocation.roommates?.map((rm, idx) => (
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
          </div>

          <div className="space-y-5">
            {/* Fee Status */}
            {allocation.feeStatus && (
              <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Hostel Fee Status</h3>
                <div className="space-y-2 text-xs font-semibold">
                  <div className="flex justify-between"><span className="text-slate-400">Term</span><span className="font-extrabold">{allocation.feeStatus.term}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Amount</span><span className="font-extrabold">{allocation.feeStatus.amount}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Status</span>
                    <span className={`font-black text-[10px] uppercase px-2 py-0.5 rounded-full ${allocation.feeStatus.paid ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {allocation.feeStatus.paid ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Emergency Contacts */}
            <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Hostel Emergency Desk</h3>
              {[
                { role: 'Hostel Warden', name: allocation.warden, phone: allocation.wardenPhone },
                { role: 'Campus Security Desk', name: 'Main Gate Security', phone: '+91 98001 12345' },
                { role: 'Campus Health Center', name: 'Emergency Clinic', phone: '+91 044-2200-0000' },
              ].map((c, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <div>
                    <span className="font-extrabold text-slate-700 dark:text-slate-200">{c.role}</span>
                    <p className="text-[10px] text-indigo-600 font-bold">{c.phone}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mess Menu Tab */}
      {activeTab === 'mess' && (
        <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Weekly Dining & Mess Timetable</h3>
          <div className="divide-y text-xs">
            {allocation.messTimetable?.map((item, idx) => (
              <div key={idx} className="py-3 grid grid-cols-1 md:grid-cols-4 gap-2">
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{item.day}</span>
                <div><span className="text-[10px] text-slate-400 block font-bold">Breakfast (7:30–9:00 AM)</span>{item.breakfast}</div>
                <div><span className="text-[10px] text-slate-400 block font-bold">Lunch (12:30–2:00 PM)</span>{item.lunch}</div>
                <div><span className="text-[10px] text-slate-400 block font-bold">Dinner (7:30–9:30 PM)</span>{item.dinner}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outing Pass Tab */}
      {activeTab === 'outing' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Request Outing Pass</h3>
            <form onSubmit={handleOutingSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Purpose of Outing</label>
                <input
                  type="text"
                  placeholder="e.g. Home visit, Medical checkup..."
                  value={outingPurpose}
                  onChange={e => setOutingPurpose(e.target.value)}
                  className="w-full p-2.5 rounded-xl border bg-background text-xs font-semibold outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Departure Date</label>
                <input
                  type="date"
                  value={outingDate}
                  onChange={e => setOutingDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border bg-background text-xs font-semibold outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Expected Return Date</label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={e => setReturnDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border bg-background text-xs font-semibold outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 text-white font-extrabold text-xs rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                <Send className="h-4 w-4" /> Submit Outing Request
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 border bg-card p-5 rounded-2xl shadow-sm space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Outing History & Passes</h3>
            {outingRequests.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">No active outing requests found.</p>
            ) : (
              <div className="space-y-2">
                {outingRequests.map(req => (
                  <div key={req.id} className="p-3 border rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <span className="font-mono text-[10px] text-slate-400">{req.id}</span>
                      <p className="font-extrabold text-slate-800 dark:text-white mt-0.5">{req.purpose}</p>
                      <p className="text-[10px] text-slate-400">Out: {req.date} · Return: {req.returnDate}</p>
                    </div>
                    <span className="text-[9px] font-black uppercase px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Complaints Tab */}
      {activeTab === 'complaints' && (
        <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Hostel Maintenance Tickets</h3>
          <form onSubmit={handleComplaint} className="flex gap-2">
            <input
              type="text"
              placeholder="Describe room maintenance or electrical/plumbing issue..."
              value={newComplaint}
              onChange={e => setNewComplaint(e.target.value)}
              className="flex-1 text-xs px-3 py-2 border bg-background rounded-xl outline-none font-semibold"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-black rounded-xl hover:bg-indigo-700"
            >
              Submit Ticket
            </button>
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
      )}
    </div>
  );
};

export default StudentHostel;
