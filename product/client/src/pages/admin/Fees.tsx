import React, { useState, useEffect } from 'react';
import {
  Plus
} from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import {  } from '../../components/ui/Loading';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import api from '../../lib/axios';

export const Fees: React.FC = () => {
  const [bills, setBills] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [activePaymentRecord, setActivePaymentRecord] = useState<any>(null);

  const fetchFees = async () => {
    try {
      const [bRes, cRes, sRes] = await Promise.all([
        api.get('/enterprise/fees/bills?pageSize=50'),
        api.get('/enterprise/fees/categories?pageSize=50'),
        api.get('/enterprise/students?pageSize=50'),
      ]);
      setBills(bRes.data?.data || []);
      setCategories(cRes.data?.data || []);
      setStudents(sRes.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
  }, []);

  const handleCreateCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      const res = await api.post('/enterprise/fees/categories', {
        name: fd.get('name'),
        description: fd.get('description'),
        amount: parseFloat(fd.get('amount') as string) || 0.0,
      });
      if (res.data?.status === 'success') {
        toast.success('Fee category configured successfully');
        setIsCategoryModalOpen(false);
        fetchFees();
      }
    } catch (err) {
      toast.error('Failed to create fee configuration');
    }
  };

  const handleCreateBill = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      const res = await api.post('/enterprise/fees/bills', {
        studentId: fd.get('studentId'),
        categoryId: fd.get('categoryId'),
        scholarshipDiscount: parseFloat(fd.get('scholarshipDiscount') as string) || 0.0,
        fine: parseFloat(fd.get('fine') as string) || 0.0,
        status: 'PENDING',
        billingDate: new Date(),
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      });
      if (res.data?.status === 'success') {
        toast.success('Fee invoice billed successfully');
        setIsBillModalOpen(false);
        fetchFees();
      }
    } catch (err) {
      toast.error('Failed to post fee invoice');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activePaymentRecord) return;
    const fd = new FormData(e.currentTarget);
    try {
      const res = await api.post(`/enterprise/fees/bills/${activePaymentRecord.id}/pay`, {
        payAmount: parseFloat(fd.get('payAmount') as string) || 0.0,
        paymentMode: fd.get('paymentMode'),
      });
      if (res.data?.status === 'success') {
        toast.success('Payment receipt printed successfully');
        setActivePaymentRecord(null);
        fetchFees();
      }
    } catch (err) {
      toast.error('Failed to commit transaction');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Fees Ledger & Billing</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Configure fee categories, post student tuition invoices, record fine adjustments, print receipts, and track overdue collections.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsCategoryModalOpen(true)}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Setup Category
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsBillModalOpen(true)}>
            <Plus className="mr-1 h-4 w-4" /> Billed Student
          </Button>
        </div>
      </div>

      {/* Invoice Ledger Table */}
      <div className="border bg-card rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-xs uppercase font-extrabold tracking-wider text-muted-foreground">Invoiced Bills</h3>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-muted/30 rounded animate-pulse" />)}
          </div>
        ) : bills.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">No fee invoices posted currently</p>
        ) : (
          <div className="w-full overflow-x-auto max-w-[90vw] md:max-w-full pb-2 scrollbar-thin"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Fee Type</TableHead>
                <TableHead>Total ($)</TableHead>
                <TableHead>Paid ($)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.map((row) => {
                const total = row.amount + row.fine - row.scholarshipDiscount;
                return (
                  <TableRow key={row.id}>
                    <TableCell className="font-bold">{row.student?.firstName} {row.student?.lastName}</TableCell>
                    <TableCell>{row.category?.name}</TableCell>
                    <TableCell>${total}</TableCell>
                    <TableCell className="text-emerald-600 font-bold">${row.paidAmount}</TableCell>
                    <TableCell>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        row.status === 'PAID'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : row.status === 'PARTIAL'
                          ? 'bg-amber-500/10 text-amber-500'
                          : 'bg-red-500/10 text-red-500'
                      }`}>
                        {row.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {row.status !== 'PAID' && (
                        <button
                          onClick={() => setActivePaymentRecord(row)}
                          className="px-2.5 py-1 text-[10px] font-bold bg-emerald-500/10 text-emerald-600 rounded hover:bg-emerald-500/20"
                        >
                          Collect Payment
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table></div>
        )}
      </div>

      {/* Setup Category Dialog */}
      <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} title="Setup Fee Category">
        <form onSubmit={handleCreateCategory} className="space-y-4 p-4 text-xs font-semibold">
          <Input label="Category Name" name="name" required />
          <Input label="Amount ($)" name="amount" type="number" required />
          <Input label="Description" name="description" />
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsCategoryModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Config</Button>
          </div>
        </form>
      </Modal>

      {/* Bill Student Invoice Dialog */}
      <Modal isOpen={isBillModalOpen} onClose={() => setIsBillModalOpen(false)} title="Billed Student Invoice">
        <form onSubmit={handleCreateBill} className="space-y-4 p-4 text-xs font-semibold">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">Select Student</label>
            <select name="studentId" required className="h-10 border rounded bg-background px-3">
              <option value="">Choose Student</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.admissionNo})</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">Fee Category</label>
            <select name="categoryId" required className="h-10 border rounded bg-background px-3">
              <option value="">Select Category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name} (${c.amount})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Scholarship / Discount ($)" name="scholarshipDiscount" type="number" defaultValue="0" />
            <Input label="Fine / Overdue Adjustments ($)" name="fine" type="number" defaultValue="0" />
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsBillModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Billed Invoice</Button>
          </div>
        </form>
      </Modal>

      {/* Collect Payment Dialog */}
      <Modal isOpen={!!activePaymentRecord} onClose={() => setActivePaymentRecord(null)} title="Collect Transaction Payment">
        {activePaymentRecord && (
          <form onSubmit={handleRecordPayment} className="space-y-4 p-4 text-xs font-semibold">
            <p className="text-muted-foreground">
              Total payable for {activePaymentRecord.student?.firstName}: ${activePaymentRecord.amount + activePaymentRecord.fine - activePaymentRecord.scholarshipDiscount} (Paid: ${activePaymentRecord.paidAmount})
            </p>
            <Input label="Payment Amount ($)" name="payAmount" type="number" required />
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Payment Method</label>
              <select name="paymentMode" className="h-10 border rounded bg-background px-3">
                <option value="Cash">Cash Handover</option>
                <option value="Card">Bank Debit/Credit Card</option>
                <option value="Online">UPI Transfer</option>
              </select>
            </div>
            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setActivePaymentRecord(null)}>Cancel</Button>
              <Button type="submit" variant="primary">Confirm Payment</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
