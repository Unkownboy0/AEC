import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';
import { DataTable, Column } from '../../../design-system/components/DataTable';
import { StatusBadge } from '../../../design-system/components/StatusBadge';
import { ErrorState } from '../../../design-system/components/ErrorState';
import { pageVariants } from '../../../design-system/tokens/motion';
import api from '../../../lib/axios';

export const VpOperationsPage: React.FC = () => {
  const [operations, setOperations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOperations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setOperations([
        { id: '1', area: 'Main Gate & Security Telemetry', status: 'ACTIVE', lead: 'Chief Warden', lastAudit: 'Today, 08:00 AM' },
        { id: '2', area: 'Transport Fleet & Route Logistics', status: 'ACTIVE', lead: 'Transport Supervisor', lastAudit: 'Today, 07:30 AM' },
        { id: '3', area: 'Hostel Facilities & Mess Quality', status: 'ACTIVE', lead: 'Hostel Warden', lastAudit: 'Yesterday' },
        { id: '4', area: 'Examination Hall Prep & Surveillance', status: 'SCHEDULED', lead: 'COE Representative', lastAudit: '2 days ago' },
      ]);
    } catch (err: any) {
      setError('Failed to load campus operations telemetry');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOperations();
  }, []);

  const columns: Column<any>[] = [
    { key: 'area', header: 'Operation Area', sortable: true, render: (item) => <span className="font-bold text-foreground">{item.area}</span> },
    { key: 'lead', header: 'Operational Lead', render: (item) => item.lead },
    { key: 'lastAudit', header: 'Last Audit', render: (item) => <span className="text-muted-foreground font-mono text-[11px]">{item.lastAudit}</span> },
    { key: 'status', header: 'Status', render: (item) => <StatusBadge status={item.status} /> },
  ];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Campus Operations & Safety Audit
        </h1>
        <p className="text-xs text-muted-foreground">Vice Principal oversight of daily operations, fleet, and facilities.</p>
      </div>

      {error ? (
        <ErrorState title="Unable to load operations" message={error} onRetry={fetchOperations} />
      ) : (
        <DataTable
          columns={columns}
          data={operations}
          isLoading={isLoading}
          keyExtractor={(item) => item.id}
          emptyTitle="No operational logs"
        />
      )}
    </motion.div>
  );
};
