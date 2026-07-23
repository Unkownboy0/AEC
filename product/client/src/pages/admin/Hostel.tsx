import React, { useState, useEffect } from 'react';
import {
  Home, Plus
} from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import {  } from '../../components/ui/Loading';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import api from '../../lib/axios';

export const Hostel: React.FC = () => {
  const [hostels, setHostels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formRecord, setFormRecord] = useState<any>(null);

  const fetchHostels = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/enterprise/hostel/buildings?pageSize=50');
      setHostels(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHostels();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: fd.get('name'),
      type: fd.get('type'),
      description: fd.get('description'),
      rooms: JSON.stringify([{ roomNo: '101', capacity: 4 }]), // Default stub
    };

    try {
      let res;
      if (formRecord) {
        res = await api.put(`/enterprise/hostel/buildings/${formRecord.id}`, payload);
      } else {
        res = await api.post('/enterprise/hostel/buildings', payload);
      }

      if (res.data?.status === 'success') {
        toast.success(formRecord ? 'Building updated' : 'Hostel block registered');
        setIsFormOpen(false);
        setFormRecord(null);
        fetchHostels();
      }
    } catch (err) {
      toast.error('Failed to save hostel details');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Hostel & Room Allocations</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage residential blocks, catalog room types (AC/Non-AC), calculate occupied beds, allocate check-ins, and track maintenance complaints.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => { setFormRecord(null); setIsFormOpen(true); }}>
          <Plus className="mr-1 h-4 w-4" /> Register Hostel Block
        </Button>
      </div>

      <div className="border bg-card rounded-xl p-5 shadow-sm space-y-4">
        {isLoading ? (
          <div className="space-y-3 py-6">
            {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-muted/30 rounded animate-pulse" />)}
          </div>
        ) : hostels.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Home className="h-8 w-8 mx-auto mb-2 text-neutral-400" />
            <p className="text-xs font-semibold">No residential blocks registered</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto max-w-[90vw] md:max-w-full pb-2 scrollbar-thin"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hostel Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hostels.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-bold">{row.name}</TableCell>
                  <TableCell>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      row.type === 'BOYS'
                        ? 'bg-blue-500/10 text-blue-500'
                        : 'bg-pink-500/10 text-pink-500'
                    }`}>
                      {row.type}
                    </span>
                  </TableCell>
                  <TableCell>{row.description || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => { setFormRecord(row); setIsFormOpen(true); }}
                      className="px-2.5 py-1 text-[10px] font-bold bg-primary/10 text-primary rounded hover:bg-primary/20"
                    >
                      Edit Block
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        )}
      </div>

      {/* Form Dialog */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={formRecord ? 'Edit Hostel details' : 'Register Hostel Block'}>
        <form onSubmit={handleSubmit} className="space-y-4 p-4 text-xs font-semibold">
          <Input label="Hostel Block Name" name="name" defaultValue={formRecord?.name} required />
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">Block Type</label>
            <select name="type" defaultValue={formRecord?.type || 'BOYS'} className="h-10 border rounded bg-background px-3">
              <option value="BOYS">Boys Residential Block</option>
              <option value="GIRLS">Girls Residential Block</option>
            </select>
          </div>
          <Input label="Short Description" name="description" defaultValue={formRecord?.description} />
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Block</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
