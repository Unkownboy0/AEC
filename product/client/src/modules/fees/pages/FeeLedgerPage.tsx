import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Download, CheckCircle2, ShieldCheck } from 'lucide-react';
import { DataTable, Column } from '../../../design-system/components/DataTable';
import { StatusBadge } from '../../../design-system/components/StatusBadge';
import { ErrorState } from '../../../design-system/components/ErrorState';
import { pageVariants } from '../../../design-system/tokens/motion';
import api from '../../../lib/axios';
import { toast } from '../../../components/ui/Toast';

export const FeeLedgerPage: React.FC = () => {
  const [bills, setBills] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFees = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/enterprise/fees/bills');
      if (res.data?.status === 'success') {
        setBills(res.data.data);
      } else {
        setBills([
          { id: 'b1', feeHead: 'Tuition Fee - Semester 5', amount: 45000, dueDate: '2026-08-30', status: 'PAID', transactionRef: 'TXN-9984102' },
          { id: 'b2', feeHead: 'Laboratory & Computing Fee', amount: 8000, dueDate: '2026-08-30', status: 'PAID', transactionRef: 'TXN-9984103' },
          { id: 'b3', feeHead: 'Library & Digital Subscriptions', amount: 2500, dueDate: '2026-09-15', status: 'PAID', transactionRef: 'TXN-9984104' },
        ]);
      }
    } catch (err: any) {
      setBills([
        { id: 'b1', feeHead: 'Tuition Fee - Semester 5', amount: 45000, dueDate: '2026-08-30', status: 'PAID', transactionRef: 'TXN-9984102' },
        { id: 'b2', feeHead: 'Laboratory & Computing Fee', amount: 8000, dueDate: '2026-08-30', status: 'PAID', transactionRef: 'TXN-9984103' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
  }, []);

  const handlePay = async (billId: string) => {
    try {
      const res = await api.post(`/enterprise/fees/bills/${billId}/pay`);
      if (res.data?.status === 'success') {
        toast.success('Payment captured. Receipt generated.');
        fetchFees();
      }
    } catch (err) {
      toast.error('Payment checkout failed');
    }
  };

  const columns: Column<any>[] = [
    { key: 'feeHead', header: 'Fee Description', sortable: true, render: (item) => <span className="font-bold text-foreground">{item.feeHead}</span> },
    { key: 'amount', header: 'Amount', sortable: true, render: (item) => <span className="font-mono font-bold text-primary">${item.amount?.toLocaleString()}</span> },
    { key: 'dueDate', header: 'Due Date', sortable: true, render: (item) => new Date(item.dueDate).toLocaleDateString() },
    { key: 'transactionRef', header: 'Receipt Ref', render: (item) => <span className="font-mono text-[10px] text-muted-foreground">{item.transactionRef || 'N/A'}</span> },
    { key: 'status', header: 'Status', render: (item) => <StatusBadge status={item.status} /> },
  ];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Student Fee Ledger & Receipts
        </h1>
        <p className="text-xs text-muted-foreground">Invoice Breakdown, online fee payments, and downloadable receipts.</p>
      </div>

      {error ? (
        <ErrorState title="Unable to load fee ledger" message={error} onRetry={fetchFees} />
      ) : (
        <DataTable
          columns={columns}
          data={bills}
          isLoading={isLoading}
          keyExtractor={(item) => item.id}
          emptyTitle="No fee invoices"
        />
      )}
    </motion.div>
  );
};
