import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { RefreshCw, Ban, MonitorSmartphone } from 'lucide-react';
import api from '../../lib/axios';

interface AuditLog {
  id: string;
  action: string;
  module: string;
  description: string;
  ipAddress: string | null;
  createdAt: string;
  user: {
    email: string;
  };
}

interface LoginLog {
  id: string;
  loginTime: string;
  ipAddress: string | null;
  browser: string | null;
  device: string | null;
  status: 'SUCCESS' | 'FAILED';
  user: {
    email: string;
  };
}

interface UserSession {
  id: string;
  ipAddress: string | null;
  browser: string | null;
  device: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: { name: string };
  };
}

const SecurityLogs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'audits' | 'logins' | 'sessions'>('audits');
  const [isLoading, setIsLoading] = useState(true);
  const [audits, setAudits] = useState<AuditLog[]>([]);
  const [logins, setLogins] = useState<LoginLog[]>([]);
  const [sessions, setSessions] = useState<UserSession[]>([]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      if (activeTab === 'audits') {
        const res = await api.get('/security/audits');
        setAudits(res.data?.data || []);
      } else if (activeTab === 'logins') {
        const res = await api.get('/security/logins');
        setLogins(res.data?.data || []);
      } else if (activeTab === 'sessions') {
        const res = await api.get('/security/sessions');
        setSessions(res.data?.data || []);
      }
    } catch (error) {
      toast.error('Failed to load security audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [activeTab]);

  // Terminate & Block Action
  const handleBlockUserSession = async (sessionId: string, email: string) => {
    if (!confirm(`Are you sure you want to block user ${email}? This will immediately terminate all active device connections and lock the account.`)) return;
    try {
      const res = await api.patch(`/security/sessions/${sessionId}/block`);
      if (res.data?.status === 'success') {
        toast.success(res.data.message, 'User Blocked');
        fetchLogs();
      }
    } catch (err: any) {
      toast.error(err.message || 'Block action failed');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Security & Audit Logs</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Audit system operations logs, track login histories, and manage active concurrent device sessions.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={fetchLogs} className="gap-1.5 bg-background">
          <RefreshCw className="h-3.5 w-3.5" />
          Sync Trails
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b gap-4">
        {[
          { id: 'audits', label: 'Activity Audits' },
          { id: 'logins', label: 'Login History' },
          { id: 'sessions', label: 'Concurrent Sessions' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`border-b-2 pb-2 text-xs font-semibold px-1.5 transition-all ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Lists display */}
      <div className="border bg-card rounded-xl p-5 shadow-sm min-h-[45vh]">
        {isLoading ? (
          <div className="flex h-[35vh] items-center justify-center"><Loading text="Retrieving security records..." /></div>
        ) : activeTab === 'audits' && audits.length === 0 ? (
          <p className="py-12 text-center text-xs text-muted-foreground">No operations logged yet.</p>
        ) : activeTab === 'logins' && logins.length === 0 ? (
          <p className="py-12 text-center text-xs text-muted-foreground">No logins tracked yet.</p>
        ) : activeTab === 'sessions' && sessions.length === 0 ? (
          <p className="py-12 text-center text-xs text-muted-foreground">No active concurrent sessions found.</p>
        ) : (
          <>
            {/* Audits Table */}
            {activeTab === 'audits' && (
              <div className="w-full overflow-x-auto max-w-[90vw] md:max-w-full pb-2 scrollbar-thin"><Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admin User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead className="text-right">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {audits.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-semibold text-xs">{log.user?.email}</TableCell>
                      <TableCell>
                        <span className={`text-[9px] font-bold border px-1 rounded uppercase ${log.action === 'CREATE' ? 'bg-blue-50 text-blue-600' : log.action === 'UPDATE' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
                          {log.action}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-mono font-bold">{log.module}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={log.description}>{log.description}</TableCell>
                      <TableCell className="text-xs font-mono text-neutral-400">{log.ipAddress || 'unknown'}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></div>
            )}

            {/* Logins Table */}
            {activeTab === 'logins' && (
              <div className="w-full overflow-x-auto max-w-[90vw] md:max-w-full pb-2 scrollbar-thin"><Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User Account</TableHead>
                    <TableHead>Browser / Device</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Access Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logins.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-semibold text-xs">{log.user?.email}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {log.browser || 'unknown'} / {log.device || 'unknown'}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-neutral-400">{log.ipAddress || 'unknown'}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold ${log.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                          {log.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {new Date(log.loginTime).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></div>
            )}

            {/* Sessions Table */}
            {activeTab === 'sessions' && (
              <div className="w-full overflow-x-auto max-w-[90vw] md:max-w-full pb-2 scrollbar-thin"><Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Device Client</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Connected At</TableHead>
                    <TableHead className="text-right">Security action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((ses) => (
                    <TableRow key={ses.id}>
                      <TableCell className="font-bold text-xs">
                        {ses.user?.firstName} {ses.user?.lastName}
                        <span className="text-[10px] text-muted-foreground block font-mono mt-0.5">{ses.user?.email}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-[9px] font-bold border px-1 rounded uppercase bg-muted/65 text-muted-foreground">
                          {ses.user?.role.name}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <MonitorSmartphone className="h-3.5 w-3.5" />
                          {ses.browser || 'unknown'} / {ses.device || 'unknown'}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-neutral-400">{ses.ipAddress || 'unknown'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(ses.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleBlockUserSession(ses.id, ses.user.email)}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700 h-8 gap-1 font-semibold text-xs"
                          title="Block & Terminate Sessions"
                        >
                          <Ban className="h-3.5 w-3.5" />
                          Block User
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SecurityLogs;
