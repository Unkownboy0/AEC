import React, { useState } from 'react';
import { ShieldAlert, CheckCircle, XCircle, Send, UserPlus, Calendar, FileDown, Radio } from 'lucide-react';
import api from '../../lib/axios';
import { toast } from '../ui/Toast';

export interface CommandProps {
  role: string;
  onActionComplete?: () => void;
}

export const ExecutiveCommandCenter: React.FC<CommandProps> = ({ role, onActionComplete }) => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [circularTitle, setCircularTitle] = useState('');
  const [circularContent, setCircularContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBroadcastNotice = async () => {
    if (!circularTitle.trim()) {
      toast.error('Notice title is required.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/enterprise/executive/command-action', {
        action: 'BROADCAST_CIRCULAR',
        payload: {
          title: circularTitle,
          content: circularContent,
          targetAudience: 'ALL'
        }
      });
      toast.success('Executive notice broadcasted successfully across CampusOS.');
      setActiveModal(null);
      setCircularTitle('');
      setCircularContent('');
      if (onActionComplete) onActionComplete();
    } catch (err) {
      console.error(err);
      toast.error('Failed to broadcast notice.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            Executive Command Center
          </h3>
          <p className="text-[11px] text-slate-400">Institutional action triggers & governance controls</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setActiveModal('BROADCAST')}
          className="p-3 bg-indigo-600/10 border border-indigo-500/30 hover:bg-indigo-600/20 text-indigo-300 rounded-xl text-xs font-semibold flex flex-col items-center gap-2 transition-all"
        >
          <Send className="w-5 h-5 text-indigo-400" />
          <span>Broadcast Notice</span>
        </button>

        <button
          onClick={() => toast.info('Task Engine: Open Task modal in Workspace tab.')}
          className="p-3 bg-emerald-600/10 border border-emerald-500/30 hover:bg-emerald-600/20 text-emerald-300 rounded-xl text-xs font-semibold flex flex-col items-center gap-2 transition-all"
        >
          <UserPlus className="w-5 h-5 text-emerald-400" />
          <span>Assign Task</span>
        </button>

        <button
          onClick={() => toast.info('Exporting Institution Analytics PDF...')}
          className="p-3 bg-blue-600/10 border border-blue-500/30 hover:bg-blue-600/20 text-blue-300 rounded-xl text-xs font-semibold flex flex-col items-center gap-2 transition-all"
        >
          <FileDown className="w-5 h-5 text-blue-400" />
          <span>Export Analytics</span>
        </button>

        <button
          onClick={() => toast.info('Meeting Scheduler opened.')}
          className="p-3 bg-purple-600/10 border border-purple-500/30 hover:bg-purple-600/20 text-purple-300 rounded-xl text-xs font-semibold flex flex-col items-center gap-2 transition-all"
        >
          <Calendar className="w-5 h-5 text-purple-400" />
          <span>Schedule Meeting</span>
        </button>
      </div>

      {/* Broadcast Modal */}
      {activeModal === 'BROADCAST' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h4 className="text-sm font-bold text-slate-100 mb-1">Broadcast Executive Notice</h4>
            <p className="text-xs text-slate-400 mb-4">Send a real-time notice to all users or selected departments.</p>

            <div className="space-y-3 text-xs mb-4">
              <div>
                <label className="block text-slate-400 mb-1">Notice Title</label>
                <input
                  type="text"
                  placeholder="e.g., Campus Academic Review Meeting"
                  value={circularTitle}
                  onChange={(e) => setCircularTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Notice Content</label>
                <textarea
                  rows={3}
                  placeholder="Enter detailed notice message..."
                  value={circularContent}
                  onChange={(e) => setCircularContent(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBroadcastNotice}
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors font-medium"
              >
                {loading ? 'Broadcasting...' : 'Broadcast Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
