import React, { useState, useEffect } from 'react';
import {
  Bus, Plus
} from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import {  } from '../../components/ui/Loading';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import api from '../../lib/axios';

export const Transport: React.FC = () => {
  const [routes, setRoutes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formRecord, setFormRecord] = useState<any>(null);

  const fetchRoutes = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/enterprise/transport/routes?pageSize=50');
      setRoutes(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      routeName: fd.get('routeName'),
      vehicleNo: fd.get('vehicleNo'),
      driverName: fd.get('driverName'),
      driverPhone: fd.get('driverPhone'),
      monthlyFee: parseFloat(fd.get('monthlyFee') as string) || 0.0,
      stops: JSON.stringify([{ stopName: 'Central Station', fee: 100 }]), // Basic JSON stop stub
    };

    try {
      let res;
      if (formRecord) {
        res = await api.put(`/enterprise/transport/routes/${formRecord.id}`, payload);
      } else {
        res = await api.post('/enterprise/transport/routes', payload);
      }

      if (res.data?.status === 'success') {
        toast.success(formRecord ? 'Route updated' : 'Transport route mapped');
        setIsFormOpen(false);
        setFormRecord(null);
        fetchRoutes();
      }
    } catch (err) {
      toast.error('Failed to save transport route');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Transport Routes & Fleet</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Map vehicle fleets, register bus routes, document driver contacts, list boarding stops, and record monthly route charges.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => { setFormRecord(null); setIsFormOpen(true); }}>
          <Plus className="mr-1 h-4 w-4" /> Map Route
        </Button>
      </div>

      <div className="border bg-card rounded-xl p-5 shadow-sm space-y-4">
        {isLoading ? (
          <div className="space-y-3 py-6">
            {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-muted/30 rounded animate-pulse" />)}
          </div>
        ) : routes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Bus className="h-8 w-8 mx-auto mb-2 text-neutral-400" />
            <p className="text-xs font-semibold">No transport routes mapped</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto max-w-[90vw] md:max-w-full pb-2 scrollbar-thin"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route Name</TableHead>
                <TableHead>Vehicle No</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Driver Phone</TableHead>
                <TableHead>Monthly Fee ($)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routes.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-bold">{row.routeName}</TableCell>
                  <TableCell className="font-mono">{row.vehicleNo}</TableCell>
                  <TableCell>{row.driverName}</TableCell>
                  <TableCell>{row.driverPhone}</TableCell>
                  <TableCell>${row.monthlyFee}</TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => { setFormRecord(row); setIsFormOpen(true); }}
                      className="px-2.5 py-1 text-[10px] font-bold bg-primary/10 text-primary rounded hover:bg-primary/20"
                    >
                      Edit Route
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        )}
      </div>

      {/* Form Dialog */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={formRecord ? 'Edit Route Details' : 'Map New Transport Route'}>
        <form onSubmit={handleSubmit} className="space-y-4 p-4 text-xs font-semibold">
          <Input label="Route Name / Identifier" name="routeName" defaultValue={formRecord?.routeName} required />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Vehicle Registration No" name="vehicleNo" defaultValue={formRecord?.vehicleNo} required />
            <Input label="Monthly Fee ($)" name="monthlyFee" type="number" defaultValue={formRecord?.monthlyFee} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Driver Full Name" name="driverName" defaultValue={formRecord?.driverName} required />
            <Input label="Driver Phone Contact" name="driverPhone" defaultValue={formRecord?.driverPhone} required />
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Route</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
