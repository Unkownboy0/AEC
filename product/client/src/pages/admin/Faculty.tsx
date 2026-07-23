import React, { useState, useEffect } from 'react';
import {
  UserCheck, Plus, Edit2, Trash2, Archive,
  Printer, Search, Eye
} from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import {  } from '../../components/ui/Loading';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { Pagination } from '../../components/ui/Pagination';
import api from '../../lib/axios';

export const Faculty: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [depts, setDepts] = useState<any[]>([]);
  const [deptFilter, setDeptFilter] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formRecord, setFormRecord] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState<any>(null);
  const [profileView, setProfileView] = useState<any>(null);

  const fetchDepts = async () => {
    try {
      const res = await api.get('/academics/departments?pageSize=100');
      setDepts(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFaculty = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        search,
        status: statusFilter,
        departmentId: deptFilter,
      });

      const res = await api.get(`/enterprise/faculty?${params}`);
      if (res.data?.status === 'success') {
        setRecords(res.data.data || []);
        setTotalCount(res.data.totalCount || 0);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to retrieve faculty');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepts();
  }, []);

  useEffect(() => {
    fetchFaculty();
  }, [page, search, statusFilter, deptFilter]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload: any = {};
    fd.forEach((value, key) => {
      payload[key] = value;
    });

    try {
      let res;
      if (formRecord) {
        res = await api.put(`/enterprise/faculty/${formRecord.id}`, payload);
      } else {
        res = await api.post('/enterprise/faculty', payload);
      }

      if (res.data?.status === 'success') {
        toast.success(formRecord ? 'Faculty details updated' : 'Faculty registered successfully');
        setIsFormOpen(false);
        setFormRecord(null);
        fetchFaculty();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed. Verify inputs.');
    }
  };

  const handleAction = (id: string, action: 'delete' | 'archive' | 'restore') => {
    setShowConfirm({
      title: `${action.toUpperCase()} Faculty Profile`,
      message: `Are you sure you want to perform this operation?`,
      onConfirm: async () => {
        try {
          if (action === 'delete') {
            await api.delete(`/enterprise/faculty/${id}`);
          } else {
            await api.post('/enterprise/bulk-action', {
              moduleKey: 'faculty',
              action,
              ids: [id],
            });
          }
          toast.success(`Faculty profile ${action}d`);
          fetchFaculty();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Action failed');
        } finally {
          setShowConfirm(null);
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Faculty Directory</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage lecturers profile details, designation hierarchies, workload allocations, and departments assignment.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-1 h-3.5 w-3.5" /> Print directory
          </Button>
          <Button variant="primary" size="sm" onClick={() => { setFormRecord(null); setIsFormOpen(true); }}>
            <Plus className="mr-1 h-4 w-4" /> Add Lecturer
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="border bg-card p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employee ID, lecturer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 border rounded-lg bg-background text-xs px-3"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="h-9 border rounded-lg bg-background text-xs px-3"
        >
          <option value="">All Departments</option>
          {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="border bg-card rounded-xl p-5 shadow-sm space-y-4">
        {isLoading ? (
          <div className="space-y-3 py-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-muted/30 rounded animate-pulse" />
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <UserCheck className="h-8 w-8 mx-auto mb-2 text-neutral-400" />
            <p className="text-xs font-semibold">No lecturers registered in this department</p>
          </div>
        ) : (
          <>
            <div className="w-full overflow-x-auto max-w-[90vw] md:max-w-full pb-2 scrollbar-thin"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Lecturer Name</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Experience (Yrs)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-xs">{row.employeeId}</TableCell>
                    <TableCell className="font-bold">{row.firstName} {row.lastName}</TableCell>
                    <TableCell>{row.designation}</TableCell>
                    <TableCell>{row.department?.name}</TableCell>
                    <TableCell>{row.experience} yrs</TableCell>
                    <TableCell>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        row.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-muted-foreground/10 text-muted-foreground'
                      }`}>
                        {row.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-1.5">
                      <button onClick={() => setProfileView(row)} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-primary">
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => { setFormRecord(row); setIsFormOpen(true); }} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-primary">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleAction(row.id, 'archive')} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-amber-500">
                        <Archive className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleAction(row.id, 'delete')} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-red-500">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
            <Pagination
              currentPage={page}
              totalPages={Math.ceil(totalCount / pageSize)}
              onPageChange={(p) => setPage(p)}
              pageSize={pageSize}
              totalCount={totalCount}
            />
          </>
        )}
      </div>

      {/* Form Drawer */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={formRecord ? 'Edit Faculty Details' : 'Register New Faculty'}>
        <form onSubmit={handleSubmit} className="space-y-4 p-4 text-xs font-semibold">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Employee ID" name="employeeId" defaultValue={formRecord?.employeeId} required />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Input label="First Name" name="firstName" defaultValue={formRecord?.firstName} required />
              <Input label="Last Name" name="lastName" defaultValue={formRecord?.lastName} required />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Email" name="email" type="email" defaultValue={formRecord?.email} required />
            <Input label="Phone" name="phone" defaultValue={formRecord?.phone} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Date of Birth" name="dob" type="date" defaultValue={formRecord?.dob?.split('T')[0]} required />
            <Input label="Date of Joining" name="dateOfJoining" type="date" defaultValue={formRecord?.dateOfJoining?.split('T')[0]} required />
            <Input label="Experience (Years)" name="experience" type="number" defaultValue={formRecord?.experience || 0} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Designation" name="designation" defaultValue={formRecord?.designation || 'Lecturer'} required />
            <Input label="Qualification" name="qualification" defaultValue={formRecord?.qualification} required />
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Department Mapping</label>
              <select name="departmentId" defaultValue={formRecord?.departmentId} required className="h-10 border rounded bg-background px-3">
                {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Faculty</Button>
          </div>
        </form>
      </Modal>

      {/* Profile Detail Drawer */}
      <Modal isOpen={!!profileView} onClose={() => setProfileView(null)} title="Lecturer profile card">
        {profileView && (
          <div className="p-4 space-y-4 text-xs leading-normal">
            <div className="flex flex-wrap items-center gap-3">
              <div className="h-12 w-12 bg-primary/10 text-primary flex items-center justify-center rounded-full font-bold text-lg">
                {profileView.firstName[0]}{profileView.lastName[0]}
              </div>
              <div>
                <h3 className="font-extrabold text-sm">{profileView.firstName} {profileView.lastName}</h3>
                <span className="font-mono text-muted-foreground">{profileView.employeeId}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t pt-3">
              <div>
                <p className="font-bold text-muted-foreground uppercase text-[9px]">Department</p>
                <p className="font-semibold">{profileView.department?.name}</p>
              </div>
              <div>
                <p className="font-bold text-muted-foreground uppercase text-[9px]">Designation</p>
                <p className="font-semibold">{profileView.designation} ({profileView.qualification})</p>
              </div>
              <div>
                <p className="font-bold text-muted-foreground uppercase text-[9px]">Email</p>
                <p className="font-semibold">{profileView.email}</p>
              </div>
              <div>
                <p className="font-bold text-muted-foreground uppercase text-[9px]">Phone</p>
                <p className="font-semibold">{profileView.phone}</p>
              </div>
              <div>
                <p className="font-bold text-muted-foreground uppercase text-[9px]">Joining Date</p>
                <p className="font-semibold">{new Date(profileView.dateOfJoining).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {showConfirm && (
        <ConfirmationDialog
          isOpen={!!showConfirm}
          onClose={() => setShowConfirm(null)}
          onConfirm={showConfirm.onConfirm}
          title={showConfirm.title}
          message={showConfirm.message}
        />
      )}
    </div>
  );
};
