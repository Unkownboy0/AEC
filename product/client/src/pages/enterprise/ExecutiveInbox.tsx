import React, { useState, useEffect } from 'react';
import { Inbox, Search, Filter, CheckCircle2, AlertCircle, Clock, FileText, Send, Paperclip } from 'lucide-react';
import api from '../../lib/axios';
import { toast } from '../../components/ui/Toast';

export interface InboxItem {
  id: string;
  type: 'TASK' | 'APPROVAL' | 'CIRCULAR' | 'DOCUMENT' | 'QUERY';
  title: string;
  subtitle: string;
  priority: string;
  date: string;
  status: string;
  category: string;
  sourceId: string;
}

export const ExecutiveInbox: React.FC = () => {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null);

  const fetchInbox = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/enterprise/executive/inbox?category=${activeCategory}&search=${encodeURIComponent(searchQuery)}`);
      if (res.data?.status === 'success') {
        setItems(res.data.data);
        if (res.data.data.length > 0 && !selectedItem) {
          setSelectedItem(res.data.data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInbox();
  }, [activeCategory]);

  const categories = ['ALL', 'Assigned Tasks', 'Pending Approvals', 'Circulars', 'Escalations'];

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
      case 'HIGH': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'NORMAL':
      case 'MEDIUM': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Search Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-950/60">
        <div className="flex items-center gap-2">
          <Inbox className="w-5 h-5 text-indigo-400" />
          <h2 className="text-sm font-bold text-slate-100">Central Executive Inbox</h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search inbox..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchInbox()}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Inbox Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Item List */}
        <div className="w-1/3 border-r border-slate-800 overflow-y-auto divide-y divide-slate-800/60">
          {loading ? (
            <div className="p-6 text-center text-xs text-slate-500">Loading central inbox...</div>
          ) : items.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">No messages in inbox.</div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`p-3.5 cursor-pointer transition-colors ${
                  selectedItem?.id === item.id ? 'bg-indigo-950/40 border-l-4 border-indigo-500' : 'hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded border ${getPriorityBadge(item.priority)}`}>
                    {item.priority}
                  </span>
                  <span className="text-[10px] text-slate-500">{new Date(item.date).toLocaleDateString()}</span>
                </div>
                <div className="text-xs font-semibold text-slate-200 truncate">{item.title}</div>
                <div className="text-[11px] text-slate-400 truncate">{item.subtitle}</div>
              </div>
            ))
          )}
        </div>

        {/* Item Reader Detail */}
        <div className="flex-1 p-6 bg-slate-950 overflow-y-auto flex flex-col justify-between">
          {selectedItem ? (
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold">{selectedItem.category}</span>
                  <h3 className="text-base font-bold text-slate-100 mt-1">{selectedItem.title}</h3>
                  <p className="text-xs text-slate-400">{selectedItem.subtitle}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getPriorityBadge(selectedItem.priority)}`}>
                  {selectedItem.priority}
                </span>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 space-y-3">
                <p><strong>Item Source ID:</strong> {selectedItem.sourceId}</p>
                <p><strong>Received Date:</strong> {new Date(selectedItem.date).toLocaleString()}</p>
                <p><strong>Status:</strong> {selectedItem.status}</p>
                <p className="pt-2 text-slate-400 border-t border-slate-800">
                  This item is synced live with the enterprise task & approval workflow engine.
                </p>
              </div>

              {/* Action reply bar */}
              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={() => toast.success('Marked as complete.')}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-500 transition-colors"
                >
                  Mark Completed
                </button>
                <button
                  onClick={() => toast.info('Delegate modal opened.')}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-700 transition-colors"
                >
                  Delegate Item
                </button>
              </div>
            </div>
          ) : (
            <div className="m-auto text-center text-xs text-slate-500">Select an item from the inbox to view details.</div>
          )}
        </div>
      </div>
    </div>
  );
};
