import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ToggleLeft, ToggleRight, BookOpen, Home, Bus, Briefcase,
  FlaskConical, BarChart3, Shield, Brain, Users, Bell,
  FileText, GraduationCap, CalendarCheck, Settings, Check,
  AlertTriangle, Info, ChevronRight, Zap, Database
} from 'lucide-react';
import api from '../../lib/axios';
import { toast } from '../ui/Toast';

/* ─── Types ──────────────────────────────────────────────────── */
interface ModuleFlag {
  key: string;
  label: string;
  description: string;
  category: string;
  defaultValue: string;
  impact: string[];
  value?: boolean;
  isLoading?: boolean;
}

/* ─── Module Icon Map ────────────────────────────────────────── */
const MODULE_ICONS: Record<string, React.ElementType> = {
  MODULE_IQAC_ENABLED: FlaskConical,
  MODULE_TIMETABLE_ENABLED: CalendarCheck,
  MODULE_PLACEMENT_ENABLED: Briefcase,
  MODULE_LIBRARY_ENABLED: BookOpen,
  MODULE_HOSTEL_ENABLED: Home,
  MODULE_TRANSPORT_ENABLED: Bus,
  MODULE_SPORTS_ENABLED: Zap,
  MODULE_FEES_ENABLED: Database,
  MODULE_GOVERNANCE_ENABLED: BarChart3,
  MODULE_CAMPUS_WORKSPACE_ENABLED: FileText,
  MODULE_COE_ENABLED: GraduationCap,
  MODULE_AI_ASSISTANT_ENABLED: Brain,
  MODULE_PARENT_PORTAL_ENABLED: Users,
  MODULE_CIRCULARS_ENABLED: Bell,
  MODULE_MENTOR_ENABLED: Users,
  MODULE_CERTIFICATES_ENABLED: Shield,
  MODULE_LEAVE_OD_ENABLED: CalendarCheck,
};

/* ─── Toggle Component ────────────────────────────────────────── */
function ModuleToggleCard({
  module,
  currentValue,
  onToggle,
  isMutating,
}: {
  module: ModuleFlag;
  currentValue: boolean;
  onToggle: (key: string, newVal: boolean) => void;
  isMutating: boolean;
}) {
  const Icon = MODULE_ICONS[module.key] || Settings;
  const isAIModule = module.key === 'MODULE_AI_ASSISTANT_ENABLED';
  const [showImpact, setShowImpact] = useState(false);

  return (
    <div
      className={`relative p-4 rounded-xl border transition-all duration-200 ${
        currentValue
          ? 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/5'
          : 'border-border bg-card hover:bg-muted/30'
      }`}
    >
      {/* Badge for AI (defaults off) */}
      {isAIModule && (
        <span className="absolute top-3 right-3 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
          Requires API Key
        </span>
      )}

      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg flex-shrink-0 ${
          currentValue
            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
            : 'bg-muted text-muted-foreground'
        }`}>
          <Icon className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0 pr-12">
          <p className="text-sm font-semibold text-foreground">{module.label}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{module.description}</p>

          {module.impact.length > 0 && (
            <button
              onClick={() => setShowImpact((s) => !s)}
              className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <Info className="h-3 w-3" />
              {showImpact ? 'Hide' : 'View'} impact ({module.impact.length})
            </button>
          )}

          {showImpact && (
            <ul className="mt-2 space-y-1">
              {module.impact.map((item, i) => (
                <li key={i} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <ChevronRight className="h-2.5 w-2.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Toggle */}
        <button
          onClick={() => !isMutating && onToggle(module.key, !currentValue)}
          disabled={isMutating}
          className={`absolute top-4 right-4 transition-all ${isMutating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          aria-label={`Toggle ${module.label}`}
          title={currentValue ? 'Click to disable' : 'Click to enable'}
        >
          {currentValue ? (
            <ToggleRight className="h-7 w-7 text-emerald-500" />
          ) : (
            <ToggleLeft className="h-7 w-7 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Enabled indicator */}
      {currentValue && (
        <div className="mt-3 flex items-center gap-1.5">
          <Check className="h-3 w-3 text-emerald-500" />
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Module active</span>
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */
export function ModuleControlPanel() {
  const queryClient = useQueryClient();

  // Fetch all settings
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['settings-all'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data?.data as Record<string, string>;
    },
    staleTime: 10_000,
  });

  // Fetch catalog to get module metadata
  const { data: catalogData } = useQuery({
    queryKey: ['settings-catalog'],
    queryFn: async () => {
      const res = await api.get('/settings/catalog');
      return res.data?.data as ModuleFlag[];
    },
    staleTime: 300_000,
  });

  const [localValues, setLocalValues] = useState<Record<string, boolean>>({});
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  useEffect(() => {
    if (settingsData) {
      const initial: Record<string, boolean> = {};
      Object.entries(settingsData).forEach(([k, v]) => {
        if (k.startsWith('MODULE_')) initial[k] = v === 'true';
      });
      setLocalValues(initial);
    }
  }, [settingsData]);

  const mutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: boolean }) => {
      await api.post('/settings', { changes: { [key]: value ? 'true' : 'false' } });
    },
    onSuccess: (_, { key, value }) => {
      toast.success(`${value ? 'Enabled' : 'Disabled'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['settings-all'] });
      setPendingKey(null);
    },
    onError: (_, { key }) => {
      // Revert optimistic update
      setLocalValues((prev) => ({ ...prev, [key]: !prev[key] }));
      toast.error('Failed to update module. Please try again.');
      setPendingKey(null);
    },
  });

  const handleToggle = (key: string, newVal: boolean) => {
    // Optimistic update
    setLocalValues((prev) => ({ ...prev, [key]: newVal }));
    setPendingKey(key);
    mutation.mutate({ key, value: newVal });
  };

  const moduleFlags = (catalogData || []).filter((d) => d.key.startsWith('MODULE_'));

  const enabledCount = Object.values(localValues).filter(Boolean).length;
  const totalCount = moduleFlags.length;

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map((i) => <div key={i} className="h-32 bg-muted rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-foreground">Module Control</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Enable or disable individual CampusOS modules for this institution.
            Changes propagate within 60 seconds.
          </p>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-2xl font-black text-foreground">{enabledCount}<span className="text-sm font-normal text-muted-foreground">/{totalCount}</span></p>
          <p className="text-[10px] text-muted-foreground">modules active</p>
        </div>
      </div>

      {/* Status bar */}
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${totalCount ? (enabledCount / totalCount) * 100 : 0}%` }}
        />
      </div>

      {/* Warning */}
      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-300">
          Disabling a module immediately blocks its API routes and hides navigation for all users.
          Existing data is preserved and the module can be re-enabled at any time.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {moduleFlags.map((mod) => (
          <ModuleToggleCard
            key={mod.key}
            module={mod}
            currentValue={localValues[mod.key] ?? (mod.defaultValue !== 'false')}
            onToggle={handleToggle}
            isMutating={pendingKey === mod.key && mutation.isPending}
          />
        ))}
      </div>
    </div>
  );
}
