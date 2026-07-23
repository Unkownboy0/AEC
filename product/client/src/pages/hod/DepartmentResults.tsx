import React, { useEffect, useState } from 'react';
import { Award, FileText, CheckCircle, XCircle, TrendingUp, Download, Eye, Layers } from 'lucide-react';
import api from '../../lib/axios';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';

export const DepartmentResults: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [resultsData] = useState<any[]>([
    { rank: 1, registerNo: '717822CS101', name: 'Abishek M', gpa: 9.85, status: 'PASS' },
    { rank: 2, registerNo: '717822CS105', name: 'Archana S', gpa: 9.78, status: 'PASS' },
    { rank: 3, registerNo: '717822CS120', name: 'Dharshini R', gpa: 9.65, status: 'PASS' },
    { rank: 4, registerNo: '717822CS155', name: 'Pranesh K', gpa: 9.54, status: 'PASS' },
    { rank: 5, registerNo: '717822CS180', name: 'Srinidhi T', gpa: 9.42, status: 'PASS' }
  ]);

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loading text="Loading Results Analytics..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Title Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-extrabold text-foreground tracking-tight uppercase">Department Results Analysis</h2>
          <p className="text-xs text-muted-foreground font-semibold">Semester Grades, Pass/Fail Metrics & Performance Distribution</p>
        </div>
        <button
          onClick={() => toast.success('Results export ledger generated successfully.')}
          className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl shadow-md hover:bg-primary/95 flex items-center gap-1.5"
        >
          <Download className="h-4 w-4" /> Export Ledger
        </button>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pass/Fail Analytics */}
        <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-4">
          <h4 className="text-xs uppercase font-extrabold text-muted-foreground tracking-wider flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" /> Pass / Fail Analysis
          </h4>
          <div className="flex justify-around items-center py-2 text-center font-bold">
            <div className="space-y-1">
              <span className="text-3xl font-black text-emerald-500">113</span>
              <span className="text-[9px] uppercase text-muted-foreground block">Passed Students</span>
            </div>
            <div className="w-[1px] bg-slate-100 h-10"></div>
            <div className="space-y-1">
              <span className="text-3xl font-black text-rose-500">7</span>
              <span className="text-[9px] uppercase text-muted-foreground block">Re-appearances</span>
            </div>
          </div>
        </div>

        {/* Subject-wise Pass Percentage */}
        <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-4 md:col-span-2">
          <h4 className="text-xs uppercase font-extrabold text-muted-foreground tracking-wider flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Subject-wise Pass Performance
          </h4>
          <div className="space-y-3.5 text-xs font-semibold">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Design and Analysis of Algorithms</span>
                <span className="text-primary font-bold">96.8% Pass</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: '96.8%' }}></div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Database Management Systems</span>
                <span className="text-indigo-500 font-bold">94.2% Pass</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: '94.2%' }}></div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Operating Systems Concepts</span>
                <span className="text-emerald-500 font-bold">98.5% Pass</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '98.5%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rank List / Top Performers */}
      <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-4">
        <h4 className="text-xs uppercase font-extrabold text-muted-foreground tracking-wider">Top Performers / Department Rank List</h4>
        <div className="overflow-x-auto text-xs font-semibold">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-[9px] uppercase font-bold text-muted-foreground">
                <th className="py-2.5 pl-3">Rank</th>
                <th className="py-2.5">Register No</th>
                <th className="py-2.5">Student Name</th>
                <th className="py-2.5 font-mono">GPA Score</th>
                <th className="py-2.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {resultsData.map((item) => (
                <tr key={item.rank} className="border-b last:border-b-0 hover:bg-muted/10 font-semibold">
                  <td className="py-3 pl-3 text-primary font-black"># {item.rank}</td>
                  <td className="py-3 font-mono font-bold text-muted-foreground">{item.registerNo}</td>
                  <td className="py-3 font-bold">{item.name}</td>
                  <td className="py-3 font-mono font-black">{item.gpa.toFixed(2)}</td>
                  <td className="py-3 text-center">
                    <span className="bg-emerald-50 border text-emerald-600 px-2 py-0.5 rounded text-[9px] font-extrabold">
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DepartmentResults;
