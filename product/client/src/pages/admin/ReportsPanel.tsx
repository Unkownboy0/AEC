import React, { useState, useEffect } from 'react';
import {
  Download
} from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import api from '../../lib/axios';

export const ReportsPanel: React.FC = () => {
  const [stats, setStats] = useState<any>({
    studentsCount: 0,
    facultiesCount: 0,
    booksCount: 0,
    outstandingFees: 0,
  });
  const [, setIsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const [sRes, fRes, bRes, billRes] = await Promise.all([
        api.get('/enterprise/students?pageSize=1'),
        api.get('/enterprise/faculty?pageSize=1'),
        api.get('/enterprise/library/books?pageSize=1'),
        api.get('/enterprise/fees/bills?pageSize=100'),
      ]);

      const unpaid = (billRes.data?.data || []).reduce((acc: number, val: any) => {
        if (val.status !== 'PAID') {
          acc += (val.amount + val.fine - val.scholarshipDiscount - val.paidAmount);
        }
        return acc;
      }, 0);

      setStats({
        studentsCount: sRes.data?.totalCount || 0,
        facultiesCount: fRes.data?.totalCount || 0,
        booksCount: bRes.data?.totalCount || 0,
        outstandingFees: unpaid,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const downloadCSV = async (moduleKey: string) => {
    try {
      let endpoint = `/enterprise/${moduleKey}`;
      if (moduleKey === 'library') endpoint = '/enterprise/library/books';
      if (moduleKey === 'fees') endpoint = '/enterprise/fees/bills';
      const res = await api.get(`${endpoint}?pageSize=100`);
      const items = res.data?.data || [];
      if (items.length === 0) {
        toast.error('No records available to export');
        return;
      }

      // Convert items to CSV string
      const headers = Object.keys(items[0]).filter(k => typeof items[0][k] !== 'object');
      const csvLines = [
        headers.join(','),
        ...items.map((item: any) => headers.map(h => `"${item[h] || ''}"`).join(','))
      ];

      const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${moduleKey}_report_${Date.now()}.csv`);
      link.click();
      toast.success('Report downloaded successfully');
    } catch (err) {
      toast.error('Failed to export CSV report');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Enterprise Reports Panel</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Compile operational stats, review fee collection summaries, evaluate grade score aggregates, and export CSV ledger sheets.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border bg-card p-5 rounded-xl shadow-sm space-y-2">
          <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Cohort Count</p>
          <h2 className="text-3xl font-extrabold">{stats.studentsCount}</h2>
        </div>
        <div className="border bg-card p-5 rounded-xl shadow-sm space-y-2">
          <p className="text-[10px] uppercase font-bold text-muted-foreground">Active Faculty Members</p>
          <h2 className="text-3xl font-extrabold text-indigo-600">{stats.facultiesCount}</h2>
        </div>
        <div className="border bg-card p-5 rounded-xl shadow-sm space-y-2">
          <p className="text-[10px] uppercase font-bold text-muted-foreground">Library Titles</p>
          <h2 className="text-3xl font-extrabold text-emerald-600">{stats.booksCount}</h2>
        </div>
        <div className="border bg-card p-5 rounded-xl shadow-sm space-y-2">
          <p className="text-[10px] uppercase font-bold text-muted-foreground">Outstanding Fee Bills</p>
          <h2 className="text-3xl font-extrabold text-red-500">${stats.outstandingFees.toFixed(2)}</h2>
        </div>
      </div>

      {/* Export Ledger Section */}
      <div className="border bg-card rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-xs uppercase font-extrabold tracking-wider text-muted-foreground">Report Downloads</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border p-4 rounded-lg flex items-center justify-between">
            <div>
              <p className="font-bold text-xs">Students Ledger</p>
              <p className="text-[10px] text-muted-foreground">Export registration dates, mappings, and parent info.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => downloadCSV('students')}>
              <Download className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="border p-4 rounded-lg flex items-center justify-between">
            <div>
              <p className="font-bold text-xs">Faculty Workload</p>
              <p className="text-[10px] text-muted-foreground">Export employee files, qualifications, and department keys.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => downloadCSV('faculty')}>
              <Download className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="border p-4 rounded-lg flex items-center justify-between">
            <div>
              <p className="font-bold text-xs">Library Catalog</p>
              <p className="text-[10px] text-muted-foreground">Export ISBN numbers, publishers, and stack positions.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => downloadCSV('library')}>
              <Download className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="border p-4 rounded-lg flex items-center justify-between">
            <div>
              <p className="font-bold text-xs">Fee Billing Transactions</p>
              <p className="text-[10px] text-muted-foreground">Export payment invoice records, outstanding balances, and methods.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => downloadCSV('fees')}>
              <Download className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ReportsPanel;
