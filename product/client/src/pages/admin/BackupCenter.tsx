import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Database, Download, RefreshCw, Play, ShieldAlert } from 'lucide-react';
import api from '../../lib/axios';

interface BackupLog {
  id: string;
  fileName: string;
  backupType: 'MANUAL' | 'AUTOMATIC';
  fileSize: number;
  triggeredBy: string;
  status: 'SUCCESS' | 'FAILED';
  createdAt: string;
}

const BackupCenter: React.FC = () => {
  const [logs, setLogs] = useState<BackupLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackupRunning, setIsBackupRunning] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const fetchBackups = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/backups');
      if (res.data?.status === 'success') {
        setLogs(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to load backup logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleTriggerBackup = async () => {
    setIsBackupRunning(true);
    try {
      const res = await api.post('/backups/trigger');
      if (res.data?.status === 'success') {
        toast.success(`Backup archive generated: ${res.data.data.fileName}`, 'Backup Success');
        fetchBackups();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to trigger backup');
    } finally {
      setIsBackupRunning(false);
    }
  };

  const handleSimulateRestore = async (id: string) => {
    setRestoringId(id);
    try {
      const res = await api.post(`/backups/${id}/restore`);
      if (res.data?.status === 'success') {
        toast.success(res.data.message, 'Integrity Verified');
      }
    } catch (err: any) {
      toast.error(err.message || 'Verification failed');
    } finally {
      setRestoringId(null);
    }
  };

  const getFormatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Database Backups</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Generate SQLite backup archives, view chronological logs, and restore configurations.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={fetchBackups} className="gap-1.5 bg-background">
            <RefreshCw className="h-3.5 w-3.5" />
            Sync Logs
          </Button>
          <Button size="sm" onClick={handleTriggerBackup} isLoading={isBackupRunning} className="gap-1.5">
            <Database className="h-3.5 w-3.5" />
            Generate Backup
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left column info */}
        <div className="lg:col-span-1 border bg-card rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-primary">
            <Database className="h-5 w-5" />
            <h3 className="text-xs uppercase font-extrabold tracking-wider">Storage Stats</h3>
          </div>
          <div className="space-y-3 text-xs leading-normal">
            <div>
              <span className="text-muted-foreground font-semibold block">Database Type</span>
              <span className="font-bold text-foreground">SQLite (development)</span>
            </div>
            <div>
              <span className="text-muted-foreground font-semibold block">Backup Storage Directory</span>
              <span className="font-mono text-[10px] text-muted-foreground font-semibold bg-muted px-1 py-0.5 rounded break-all">server/backups/</span>
            </div>
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3.5 text-[10px] text-amber-800 dark:text-amber-300">
              <ShieldAlert className="h-4 w-4 mb-1.5 flex-shrink-0" />
              Restoring live database updates in development watch modes is protected under system integrity checks.
            </div>
          </div>
        </div>

        {/* Right column logs */}
        <div className="lg:col-span-3 border bg-card rounded-xl p-5 shadow-sm">
          <h3 className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-4">Backup Timelines Log</h3>
          
          {isLoading ? (
            <div className="py-12 text-center"><Loading text="Syncing logs..." /></div>
          ) : logs.length === 0 ? (
            <p className="py-12 text-center text-xs text-muted-foreground">No database backups generated yet.</p>
          ) : (
            <div className="w-full overflow-x-auto max-w-[90vw] md:max-w-full pb-2 scrollbar-thin"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filename</TableHead>
                  <TableHead>Date Created</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-semibold text-xs font-mono">{log.fileName}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs font-mono font-bold">{getFormatSize(log.fileSize)}</TableCell>
                    <TableCell>
                      <span className={`text-[9px] font-bold border px-1.5 rounded uppercase ${log.backupType === 'MANUAL' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                        {log.backupType}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold ${log.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                        {log.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSimulateRestore(log.id)}
                        className="text-muted-foreground hover:text-foreground h-8 w-8"
                        disabled={restoringId === log.id || log.status === 'FAILED'}
                        title="Integrity Restore Check"
                      >
                        <Play className="h-4 w-4 text-emerald-500" />
                      </Button>
                      <a
                        href={`http://localhost:5000/api/backups/${log.id}/download`}
                        download
                        className={`inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground ${log.status === 'FAILED' ? 'pointer-events-none opacity-40' : ''}`}
                        title="Download Archive"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          )}
        </div>

      </div>
    </div>
  );
};

export default BackupCenter;
