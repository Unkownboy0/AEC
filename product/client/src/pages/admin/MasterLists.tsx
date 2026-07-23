import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Trash2, Settings } from 'lucide-react';
import api from '../../lib/axios';

const MasterLists: React.FC = () => {
  const [activeType, setActiveType] = useState<string>('GENDER');
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newValue, setNewValue] = useState('');

  const types = [
    { label: 'Genders', value: 'GENDER' },
    { label: 'Blood Groups', value: 'BLOOD_GROUP' },
    { label: 'Religions', value: 'RELIGION' },
    { label: 'Caste Categories', value: 'CATEGORY' },
    { label: 'Hostel Blocks', value: 'HOSTEL_BLOCK' },
  ];

  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/masters', { params: { type: activeType } });
      if (res.data?.status === 'success') {
        setRecords(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to load master list records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [activeType]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim()) return;

    try {
      const res = await api.post('/masters', { type: activeType, value: newValue });
      if (res.data?.status === 'success') {
        toast.success(`Registered new master value: ${newValue}`);
        setNewValue('');
        fetchRecords();
      }
    } catch (err: any) {
      toast.error(err.message || 'Create failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this master listing?')) return;
    try {
      const res = await api.delete(`/masters/${id}`);
      if (res.data?.status === 'success') {
        toast.success('Record removed');
        fetchRecords();
      }
    } catch (err: any) {
      toast.error(err.message || 'Remove failed');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Master Data Lists</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Maintain system-wide drop-down properties, dorm locations, transport routes, and metadata keys.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Navigation Panel */}
        <div className="flex flex-col gap-1 lg:col-span-1">
          {types.map((type) => (
            <button
              key={type.value}
              onClick={() => setActiveType(type.value)}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-left transition-all ${
                activeType === type.value
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>{type.label}</span>
            </button>
          ))}
        </div>

        {/* Dynamic List Workspace */}
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* List */}
            <div className="md:col-span-2 border bg-card rounded-xl p-5 shadow-sm">
              <h3 className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-4">Values Dictionary</h3>
              {isLoading ? (
                <div className="py-8 text-center"><Loading text="Syncing master parameters..." /></div>
              ) : records.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground">No entries found for this type.</p>
              ) : (
                <div className="w-full overflow-x-auto max-w-[90vw] md:max-w-full pb-2 scrollbar-thin"><Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Value / Label</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-semibold text-sm">{r.value}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="text-destructive h-7 w-7" onClick={() => handleDelete(r.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
              )}
            </div>

            {/* Create */}
            <div className="border bg-card rounded-xl p-5 shadow-sm h-fit">
              <h3 className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-4">Add Value</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <Input
                  label="Name / Label"
                  placeholder="e.g. O- Negative"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  required
                />
                <Button type="submit" size="sm" className="w-full mt-2">Add Entry</Button>
              </form>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default MasterLists;
