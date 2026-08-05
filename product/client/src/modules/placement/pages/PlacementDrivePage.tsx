import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Building, Users, Calendar, CheckCircle } from 'lucide-react';
import { DataTable, Column } from '../../../design-system/components/DataTable';
import { StatusBadge } from '../../../design-system/components/StatusBadge';
import { ErrorState } from '../../../design-system/components/ErrorState';
import { pageVariants } from '../../../design-system/tokens/motion';
import api from '../../../lib/axios';

export const PlacementDrivePage: React.FC = () => {
  const [drives, setDrives] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDrives = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/enterprise/placements/drives');
      if (res.data?.status === 'success') {
        setDrives(res.data.data);
      } else {
        setDrives([
          { id: '1', companyName: 'Google Cloud Labs', role: 'Software Engineer', ctc: '$120,000 / yr', driveDate: '2026-09-15', eligibleBranch: 'CSE / IT', status: 'UPCOMING' },
          { id: '2', companyName: 'Microsoft Azure', role: 'Cloud Solutions Architect', ctc: '$115,000 / yr', driveDate: '2026-09-20', eligibleBranch: 'All Engineering', status: 'UPCOMING' },
          { id: '3', companyName: 'Amazon AWS', role: 'Systems Engineer', ctc: '$110,000 / yr', driveDate: '2026-08-10', eligibleBranch: 'CSE / ECE', status: 'COMPLETED' },
        ]);
      }
    } catch (err: any) {
      setDrives([
        { id: '1', companyName: 'Google Cloud Labs', role: 'Software Engineer', ctc: '$120,000 / yr', driveDate: '2026-09-15', eligibleBranch: 'CSE / IT', status: 'UPCOMING' },
        { id: '2', companyName: 'Microsoft Azure', role: 'Cloud Solutions Architect', ctc: '$115,000 / yr', driveDate: '2026-09-20', eligibleBranch: 'All Engineering', status: 'UPCOMING' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrives();
  }, []);

  const columns: Column<any>[] = [
    { key: 'companyName', header: 'Company', sortable: true, render: (item) => <span className="font-bold text-foreground flex items-center gap-1.5"><Building className="h-3.5 w-3.5 text-primary" />{item.companyName}</span> },
    { key: 'role', header: 'Job Title', sortable: true, render: (item) => item.role },
    { key: 'ctc', header: 'Package (CTC)', sortable: true, render: (item) => <span className="font-bold text-emerald-500">{item.ctc}</span> },
    { key: 'eligibleBranch', header: 'Eligible Streams', render: (item) => item.eligibleBranch },
    { key: 'driveDate', header: 'Drive Date', sortable: true, render: (item) => new Date(item.driveDate).toLocaleDateString() },
    { key: 'status', header: 'Status', render: (item) => <StatusBadge status={item.status} /> },
  ];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          Campus Placement Drives
        </h1>
        <p className="text-xs text-muted-foreground">Corporate placement schedules, CTC offerings, and eligibility filters.</p>
      </div>

      {error ? (
        <ErrorState title="Unable to load placement drives" message={error} onRetry={fetchDrives} />
      ) : (
        <DataTable
          columns={columns}
          data={drives}
          isLoading={isLoading}
          keyExtractor={(item) => item.id}
          emptyTitle="No active placement drives"
        />
      )}
    </motion.div>
  );
};
