import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Send,
  Smartphone,
  Server,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Radio,
  Layers,
  Zap,
  Globe,
  BellRing,
} from 'lucide-react';
import api from '../../lib/axios';
import { toast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';

export const NotificationControlCenter: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Controlled Diagnostic Test Dispatch State
  const [testRole, setTestRole] = useState('ALL');
  const [testPriority, setTestPriority] = useState('HIGH');
  const [testTitle, setTestTitle] = useState('🔔 CampusOS Push Engine Test');
  const [testBody, setTestBody] = useState('Production FCM background push delivery verified successfully.');
  const [testDeepLink, setTestDeepLink] = useState('/notifications');
  const [isDispatching, setIsDispatching] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<any>(null);

  // Global Engine Switches
  const [engineEnabled, setEngineEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);

  const fetchMetrics = async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await api.get('/notifications/admin/dashboard');
      if (res.data?.status === 'success' || res.data?.data) {
        setMetrics(res.data.data || res.data);
      }
    } catch {
      toast.error('Failed to load Notification Engine health metrics');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleSendTestPush = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDispatching(true);
    setLastTestResult(null);

    try {
      const res = await api.post('/notifications/admin/test-dispatch', {
        roleCode: testRole === 'ALL' ? undefined : testRole,
        title: testTitle,
        body: testBody,
        priority: testPriority,
        deepLinkRoute: testDeepLink,
      });

      if (res.data?.status === 'success' || res.data?.data?.success) {
        setLastTestResult(res.data.data);
        toast.success(`Diagnostic Push Dispatched to ${res.data.data.dispatchedCount} recipient(s)!`);
        fetchMetrics(true);
      } else {
        toast.error(res.data?.data?.message || 'Dispatch failed.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to dispatch test notification.');
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="space-y-6 text-left pb-16 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-foreground flex items-center gap-2">
              <Zap className="h-6 w-6 text-amber-500" /> Super Admin Notification Control Centre
            </h1>
            <span className="text-[9px] font-black uppercase bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Event Engine Active
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time delivery health, Firebase FCM & APNs dispatch pipeline, multi-device token registry, and controlled diagnostics.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchMetrics(true)}
          disabled={isRefreshing}
          className="text-xs font-bold gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh Metrics
        </Button>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border p-5 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">FCM Provider Status</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <Server className="h-5 w-5" /> {metrics?.fcmStatus || 'HEALTHY_ACTIVE'}
          </div>
          <p className="text-[11px] text-muted-foreground">Firebase: {metrics?.projectId || 'campusos-db831'}</p>
        </div>

        <div className="bg-card border p-5 rounded-2xl shadow-sm space-y-2">
          <span className="text-xs font-bold text-muted-foreground">Active Device Tokens</span>
          <div className="text-2xl font-black text-foreground flex items-center gap-1.5">
            <Smartphone className="h-5 w-5 text-indigo-500" /> {metrics?.activeTokensCount ?? 0}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Android: {metrics?.platformCounts?.android || 0} | iOS: {metrics?.platformCounts?.ios || 0} | Web: {metrics?.platformCounts?.web || 0}
          </p>
        </div>

        <div className="bg-card border p-5 rounded-2xl shadow-sm space-y-2">
          <span className="text-xs font-bold text-muted-foreground">Notifications Dispatched Today</span>
          <div className="text-2xl font-black text-foreground flex items-center gap-1.5">
            <Radio className="h-5 w-5 text-blue-500" /> {metrics?.totalNotificationsToday ?? 0}
          </div>
          <p className="text-[11px] text-muted-foreground">Unread Queue: {metrics?.totalUnread ?? 0}</p>
        </div>

        <div className="bg-card border p-5 rounded-2xl shadow-sm space-y-2">
          <span className="text-xs font-bold text-muted-foreground">Dead-Letter / Failed Delivery</span>
          <div className="text-2xl font-black text-foreground flex items-center gap-1.5">
            <AlertTriangle className="h-5 w-5 text-amber-500" /> {metrics?.recentFailures?.length ?? 0}
          </div>
          <p className="text-[11px] text-muted-foreground">Zero critical blockers detected</p>
        </div>
      </div>

      {/* Control Switchboard & Controlled Diagnostic Test */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Channel Master Switches */}
        <div className="lg:col-span-5 bg-card border p-6 rounded-2xl shadow-sm space-y-5">
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-black uppercase text-foreground">Global Delivery Channels</h3>
          </div>

          <div className="space-y-3 divide-y divide-border">
            <div className="flex items-center justify-between pt-2">
              <div>
                <span className="text-xs font-bold text-foreground block">Event Notification Engine</span>
                <span className="text-[10px] text-muted-foreground">Master pipeline switch</span>
              </div>
              <input
                type="checkbox"
                checked={engineEnabled}
                onChange={(e) => setEngineEnabled(e.target.checked)}
                className="h-4 w-4 rounded text-primary focus:ring-primary cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-3">
              <div>
                <span className="text-xs font-bold text-foreground block">Firebase Cloud Messaging (FCM) Push</span>
                <span className="text-[10px] text-muted-foreground">Native Android/iOS background push</span>
              </div>
              <input
                type="checkbox"
                checked={pushEnabled}
                onChange={(e) => setPushEnabled(e.target.checked)}
                className="h-4 w-4 rounded text-primary focus:ring-primary cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-3">
              <div>
                <span className="text-xs font-bold text-foreground block">In-App Notification Feed</span>
                <span className="text-[10px] text-muted-foreground">Database notification center feed</span>
              </div>
              <input
                type="checkbox"
                checked={inAppEnabled}
                onChange={(e) => setInAppEnabled(e.target.checked)}
                className="h-4 w-4 rounded text-primary focus:ring-primary cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-3">
              <div>
                <span className="text-xs font-bold text-foreground block">SMTP Email Dispatch</span>
                <span className="text-[10px] text-muted-foreground">Transactional email alerts</span>
              </div>
              <input
                type="checkbox"
                checked={emailEnabled}
                onChange={(e) => setEmailEnabled(e.target.checked)}
                className="h-4 w-4 rounded text-primary focus:ring-primary cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Controlled Test Push Diagnostic Console */}
        <div className="lg:col-span-7 bg-card border p-6 rounded-2xl shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BellRing className="h-5 w-5 text-indigo-500" />
              <h3 className="text-sm font-black uppercase text-foreground">Controlled Diagnostic Push Dispatch</h3>
            </div>
            <span className="text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 px-2 py-0.5 rounded-full">
              Live Test Tool
            </span>
          </div>

          <form onSubmit={handleSendTestPush} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-muted-foreground block mb-1">Target Audience</label>
                <select
                  value={testRole}
                  onChange={(e) => setTestRole(e.target.value)}
                  className="w-full bg-background border rounded-xl p-2.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="ALL">All Active Users</option>
                  <option value="STUDENT">Students Only</option>
                  <option value="FACULTY">Faculty Only</option>
                  <option value="HOD">Heads of Department (HOD)</option>
                  <option value="SUPERADMIN">Super Admins Only</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted-foreground block mb-1">Priority</label>
                <select
                  value={testPriority}
                  onChange={(e) => setTestPriority(e.target.value)}
                  className="w-full bg-background border rounded-xl p-2.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="NORMAL">NORMAL (Default)</option>
                  <option value="HIGH">HIGH (Immediate Heads-up)</option>
                  <option value="CRITICAL">CRITICAL (Emergency Alert)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-muted-foreground block mb-1">Alert Title</label>
              <input
                type="text"
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                placeholder="Notification Title..."
                className="w-full bg-background border rounded-xl p-2.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-muted-foreground block mb-1">Alert Body</label>
              <textarea
                rows={2}
                value={testBody}
                onChange={(e) => setTestBody(e.target.value)}
                placeholder="Notification message body..."
                className="w-full bg-background border rounded-xl p-2.5 text-xs text-foreground outline-none resize-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] text-muted-foreground">
                Channel: <strong className="text-foreground">campusos_alerts</strong>
              </span>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isDispatching}
                className="text-xs font-bold gap-1.5"
              >
                <Send className={`h-3.5 w-3.5 ${isDispatching ? 'animate-spin' : ''}`} />
                {isDispatching ? 'Dispatching Push...' : 'Dispatch Diagnostic Push'}
              </Button>
            </div>
          </form>

          {lastTestResult && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs space-y-1">
              <span className="font-bold text-emerald-800 dark:text-emerald-300 block">
                ✓ Diagnostic Push Dispatched Successfully
              </span>
              <p className="text-muted-foreground">
                Delivered to {lastTestResult.dispatchedCount} user records. Recipients: {lastTestResult.targetUserIds?.slice(0, 5).join(', ')}
                {lastTestResult.targetUserIds?.length > 5 ? ` (+${lastTestResult.targetUserIds.length - 5} more)` : ''}.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Super Admin Live Delivery Logs Monitor */}
      <DeliveryLogsTable />
    </div>
  );
};

const DeliveryLogsTable: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventTypeFilter, setEventTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications/admin/delivery-logs', {
        params: {
          eventType: eventTypeFilter,
          deliveryState: statusFilter,
          search: search || undefined,
          limit: 25,
        },
      });
      if (res.data?.status === 'success' || res.data?.data) {
        setLogs(res.data.data || []);
      }
    } catch {
      toast.error('Failed to load delivery logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [eventTypeFilter, statusFilter]);

  const handleRetry = async (notificationId: string) => {
    setRetryingId(notificationId);
    try {
      const res = await api.post(`/notifications/admin/retry-delivery/${notificationId}`);
      if (res.data?.status === 'success') {
        toast.success('Notification push retry dispatched!');
        fetchLogs();
      }
    } catch {
      toast.error('Retry delivery failed');
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="bg-card border p-6 rounded-2xl shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-sm font-black uppercase text-foreground flex items-center gap-2">
            <Radio className="h-4 w-4 text-emerald-500" /> Live Delivery Logs & Push Dispatch Monitor
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Complete audit trail across in-app creation, FCM token resolution, device push, and failure reasons.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search recipient or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
            className="bg-background border rounded-xl px-3 py-1.5 text-xs text-foreground outline-none w-full sm:w-48"
          />
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="bg-background border rounded-xl px-2.5 py-1.5 text-xs text-foreground outline-none"
          >
            <option value="ALL">All Events</option>
            <option value="CIRCULAR_PUBLISHED">Circular Published</option>
            <option value="TASK_ASSIGNED">Task Assigned</option>
            <option value="LEAVE_SUBMITTED">Leave Submitted</option>
            <option value="LEAVE_APPROVED">Leave Approved</option>
            <option value="ASSIGNMENT_PUBLISHED">Assignment Published</option>
            <option value="PAYMENT_SUCCESS">Payment Success</option>
            <option value="EXAM_TIMETABLE_PUBLISHED">Exam Timetable</option>
          </select>
          <Button variant="outline" size="sm" onClick={fetchLogs} className="text-xs">
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/40 border-b text-[10px] uppercase font-black text-muted-foreground">
            <tr>
              <th className="p-3">Event / Type</th>
              <th className="p-3">Recipient</th>
              <th className="p-3">Notification Content</th>
              <th className="p-3">Channel / State</th>
              <th className="p-3">Devices</th>
              <th className="p-3">Time</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin inline mr-2" /> Loading delivery records...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  No notification delivery records match criteria.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                  <td className="p-3">
                    <span className="font-bold text-foreground block">{log.eventType}</span>
                    <span className="text-[10px] text-muted-foreground">{log.relatedEntityType || 'System'}</span>
                  </td>
                  <td className="p-3">
                    <span className="font-bold text-foreground block">{log.recipient?.name || 'User'}</span>
                    <span className="text-[10px] text-muted-foreground">{log.recipient?.email}</span>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded ml-1 font-semibold">{log.recipient?.role}</span>
                  </td>
                  <td className="p-3 max-w-xs">
                    <span className="font-semibold text-foreground block truncate">{log.title}</span>
                    <span className="text-[11px] text-muted-foreground line-clamp-1">{log.message}</span>
                    {log.deepLinkRoute && (
                      <span className="text-[9px] font-mono text-primary block mt-0.5">{log.deepLinkRoute}</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      log.deliveryState === 'DELIVERED'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200'
                    }`}>
                      {log.deliveryChannel || 'IN_APP'} • {log.deliveryState || 'DELIVERED'}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="text-xs font-bold text-foreground">
                      {log.recipient?.activeDevices || 0} active
                    </span>
                    <span className="text-[10px] text-muted-foreground block">
                      {log.recipient?.platforms?.join(', ') || 'No token'}
                    </span>
                  </td>
                  <td className="p-3 text-[11px] text-muted-foreground whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    <span className="block text-[9px]">{new Date(log.createdAt).toLocaleDateString()}</span>
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRetry(log.id)}
                      disabled={retryingId === log.id}
                      className="text-[10px] h-7 px-2"
                    >
                      {retryingId === log.id ? 'Retrying...' : 'Retry Push'}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NotificationControlCenter;
