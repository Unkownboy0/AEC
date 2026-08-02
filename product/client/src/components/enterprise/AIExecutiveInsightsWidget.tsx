import React, { useEffect, useState } from 'react';
import { Sparkles, AlertTriangle, ArrowUpRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import api from '../../lib/axios';

export interface AIInsight {
  id: string;
  title: string;
  category: string;
  description: string;
  recommendation: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  impactScore: number;
  timestamp: string;
}

export const AIExecutiveInsightsWidget: React.FC = () => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      try {
        const res = await api.get('/enterprise/executive/ai-insights');
        if (res.data?.status === 'success') {
          setInsights(res.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, []);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
      case 'HIGH': return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'MEDIUM': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/40';
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-500/20 rounded-xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg animate-pulse">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              AI Executive Insights
              <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
                Real-time
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Autonomous institutional pattern & risk analysis engine</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-6 text-center text-xs text-slate-500">Generating AI recommendations...</div>
      ) : insights.length === 0 ? (
        <div className="py-4 text-center text-xs text-slate-500">No active operational alerts.</div>
      ) : (
        <div className="space-y-3">
          {insights.map((ins) => (
            <div key={ins.id} className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 hover:border-indigo-500/40 transition-all">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded border ${getPriorityBadge(ins.priority)}`}>
                    {ins.priority}
                  </span>
                  <span className="text-xs font-semibold text-slate-200">{ins.title}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">{ins.category}</span>
              </div>

              <p className="text-xs text-slate-300 mb-2 leading-relaxed">{ins.description}</p>

              <div className="p-2 bg-indigo-950/30 border border-indigo-800/30 rounded-lg flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2 text-indigo-300">
                  <ArrowUpRight className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                  <span className="font-medium">{ins.recommendation}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
