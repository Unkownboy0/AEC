import React, { useState } from 'react';
import { X, ShieldAlert, Clock, UserCheck, CheckCircle2, Lock } from 'lucide-react';
import { useDelegationContext } from './context/DelegationContext';

interface DelegationModalProps {
  isOpen?: boolean;
  onClose: () => void;
  targetStatus: 'BUSY' | 'OFFLINE';
  onSuccess?: () => void;
  onConfirm?: (data: any) => Promise<void>;
}

const DEFAULT_PERMISSIONS = [
  { id: 'principal.approvals.view', label: 'View Approval Queue' },
  { id: 'principal.approvals.approve', label: 'Approve Institutional Requests' },
  { id: 'principal.approvals.reject', label: 'Reject / Return Requests' },
  { id: 'principal.circulars.publish', label: 'Publish Campus Circulars' }
];

export const DelegationModal: React.FC<DelegationModalProps> = ({
  onClose,
  targetStatus,
  onSuccess
}) => {
  const { updateStatus } = useDelegationContext();
  const todayStr = new Date().toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(todayStr);
  const [startTime, setStartTime] = useState('08:30');
  const [endDate, setEndDate] = useState(todayStr);
  const [endTime, setEndTime] = useState('18:00');
  const [reason, setReason] = useState('Off-campus Official Visit / Academic Conference');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    DEFAULT_PERMISSIONS.map((p) => p.id)
  );
  const [emergencyNote, setEmergencyNote] = useState('Contact Office Executive at Ext 104');
  const [messageToVp, setMessageToVp] = useState('Please oversee today\'s urgent approval queues.');
  const [loading, setLoading] = useState(false);

  const togglePermission = (id: string) => {
    if (selectedPermissions.includes(id)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== id));
    } else {
      setSelectedPermissions([...selectedPermissions, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const startIso = new Date(`${startDate}T${startTime}:00`).toISOString();
      const endIso = new Date(`${endDate}T${endTime}:00`).toISOString();

      await updateStatus({
        status: targetStatus,
        startsAt: startIso,
        endsAt: endIso,
        reason,
        permissions: selectedPermissions,
        emergencyContactNote: emergencyNote,
        messageToVp
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to confirm delegation:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-violet-500/30 rounded-2xl max-w-xl w-full p-6 text-slate-100 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Enable Principal {targetStatus} & Delegation Mode</h2>
              <p className="text-xs text-slate-400">Authorize Vice Principal as Acting Principal during your absence</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
          
          {/* Status & Authority */}
          <div className="grid grid-cols-2 gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">New Principal Status</span>
              <span className="text-sm font-extrabold text-amber-400 flex items-center gap-1.5 mt-0.5">
                <Clock className="w-4 h-4" /> {targetStatus} MODE
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Default Acting Authority</span>
              <span className="text-sm font-extrabold text-violet-300 flex items-center gap-1.5 mt-0.5">
                <UserCheck className="w-4 h-4" /> Vice Principal (Acting Principal)
              </span>
            </div>
          </div>

          {/* Date & Time Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 block mb-1 font-bold">Delegation Start</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 w-full font-semibold focus:border-violet-500 focus:outline-none"
                  required
                />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-slate-200 w-28 font-semibold focus:border-violet-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-bold">Delegation End</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 w-full font-semibold focus:border-violet-500 focus:outline-none"
                  required
                />
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-slate-200 w-28 font-semibold focus:border-violet-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="text-slate-300 block mb-1 font-bold">Reason for Offline Mode / Delegation</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Off-campus Academic Meeting, NAAC Review, Emergency"
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 w-full font-semibold focus:border-violet-500 focus:outline-none"
              required
            />
          </div>

          {/* Delegated Permissions Checklist */}
          <div>
            <label className="text-slate-300 block mb-1.5 font-bold flex items-center justify-between">
              <span>Delegated Principal Permissions</span>
              <span className="text-[10px] text-violet-400 font-extrabold">{selectedPermissions.length} Authorized</span>
            </label>
            <div className="space-y-1.5 bg-slate-800/40 p-3 rounded-xl border border-slate-800 max-h-36 overflow-y-auto">
              {DEFAULT_PERMISSIONS.map((perm) => {
                const isSelected = selectedPermissions.includes(perm.id);
                return (
                  <label
                    key={perm.id}
                    onClick={() => togglePermission(perm.id)}
                    className={`flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer transition-all ${
                      isSelected ? 'bg-violet-950/40 border-violet-500/50 text-white' : 'border-slate-800 text-slate-400 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                      isSelected ? 'bg-violet-600 border-violet-500 text-white' : 'border-slate-600'
                    }`}>
                      {isSelected && <CheckCircle2 className="w-3 h-3" />}
                    </div>
                    <span className="font-semibold">{perm.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Note to VP & Emergency Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 block mb-1 font-bold">Emergency Contact Note</label>
              <input
                type="text"
                value={emergencyNote}
                onChange={(e) => setEmergencyNote(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 w-full font-semibold focus:border-violet-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-300 block mb-1 font-bold">Message for Vice Principal</label>
              <input
                type="text"
                value={messageToVp}
                onChange={(e) => setMessageToVp(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 w-full font-semibold focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Warning Banner */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 flex items-start gap-2 leading-relaxed">
            <Lock className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Activating delegation will instantly send a native push notification & in-app alert to Vice Principal, update VP Dashboard with the Acting Principal banner, and record audit logs. All actions performed by VP will be attributed as <strong>Vice Principal — Acting Principal</strong>.
            </span>
          </div>

          {/* Submit Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-600 hover:to-violet-700 text-white font-extrabold rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              {loading ? 'Activating Delegation...' : `Confirm & Enable ${targetStatus}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
