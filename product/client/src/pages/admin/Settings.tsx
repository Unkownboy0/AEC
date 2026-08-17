import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, ChevronRight, Loader2, RefreshCw, Save, Settings2 } from 'lucide-react';
import api from '../../lib/axios';
import { toast } from '../../components/ui/Toast';
import { ModuleControlPanel } from '../../components/platform/ModuleControlPanel';
import { MobileCapabilitiesSettings } from './MobileCapabilitiesSettings';
import { BrandingWatermarkControlCenter } from '../../components/platform/BrandingWatermarkControlCenter';

type Category = 'institution' | 'policy' | 'security' | 'files' | 'modules' | 'mobile';
type CatalogSetting = {
  key: string;
  label: string;
  description: string;
  category: Category;
  defaultValue: string;
  value: string;
  source: 'DATABASE' | 'DEFAULT';
  impact: string[];
  restartRequired: boolean;
};
type Impact = { key: string; label: string; proposedValue: string; impact: string[]; restartRequired: boolean };

const categories: Array<{ id: Category; label: string; description: string }> = [
  { id: 'institution', label: 'Institution', description: 'Identity and document branding' },
  { id: 'policy', label: 'Academic policy', description: 'Rules applied by operational modules' },
  { id: 'files', label: 'Files', description: 'Upload and document controls' },
  { id: 'modules', label: 'Modules', description: 'Feature availability gates' },
  { id: 'mobile', label: 'Mobile & Devices', description: 'Hardware sensors, push, & capabilities' },
  { id: 'security', label: 'Security', description: 'Privileged access policies' },
];

const isBooleanSetting = (setting: CatalogSetting) => ['true', 'false'].includes(setting.defaultValue);

export const Settings: React.FC = () => {
  const [catalog, setCatalog] = useState<CatalogSetting[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [activeCategory, setActiveCategory] = useState<Category>('institution');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [impact, setImpact] = useState<Impact[] | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/settings/catalog');
      const values: CatalogSetting[] = response.data?.data ?? [];
      setCatalog(values);
      setDraft(Object.fromEntries(values.map((setting) => [setting.key, setting.value])));
      setImpact(null);
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'Configuration catalog could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const changes = useMemo(() => Object.fromEntries(catalog
    .filter((setting) => draft[setting.key] !== setting.value)
    .map((setting) => [setting.key, draft[setting.key]])), [catalog, draft]);
  const changeCount = Object.keys(changes).length;
  const visibleSettings = catalog.filter((setting) => setting.category === activeCategory);

  const preview = async () => {
    if (!changeCount) return;
    try {
      const response = await api.post('/settings/impact-preview', { changes });
      setImpact(response.data?.data ?? []);
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || 'Review the highlighted configuration values.');
    }
  };

  const save = async () => {
    if (!impact?.length) return;
    setSaving(true);
    try {
      await api.post('/settings', { changes });
      toast.success('Configuration saved and audit history recorded.');
      await load();
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || 'Configuration could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-[1440px] space-y-5 pb-16">
      <header className="flex flex-col gap-5 rounded-3xl border border-border/70 bg-card px-6 py-7 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-primary"><Settings2 className="h-4 w-4" /> Governed configuration</div>
          <h1 className="text-3xl font-extrabold tracking-[-0.035em]">System policies and modules</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Change only approved institutional settings. CampusOS validates values, previews affected modules, and records every update.</p>
        </div>
        <button onClick={() => void load()} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold transition hover:border-primary/50 hover:text-primary disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh</button>
      </header>

      {error && <section role="alert" className="flex items-center justify-between gap-4 rounded-2xl border border-rose-500/25 bg-rose-500/5 p-5"><div className="flex gap-3"><AlertTriangle className="h-5 w-5 text-rose-500" /><div><p className="font-semibold">Configuration unavailable</p><p className="mt-1 text-sm text-muted-foreground">{error}</p></div></div><button onClick={() => void load()} className="min-h-11 rounded-xl bg-foreground px-4 text-sm font-semibold text-background">Retry</button></section>}

      <div className="grid gap-5 lg:grid-cols-[270px_minmax(0,1fr)]">
        <nav aria-label="Configuration categories" className="h-fit rounded-2xl border border-border/70 bg-card p-2">
          {categories.map((category) => <button key={category.id} onClick={() => { setActiveCategory(category.id); setImpact(null); }} className={`flex min-h-16 w-full items-center gap-3 rounded-xl px-3 text-left transition ${activeCategory === category.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}><span className="flex-1"><span className="block text-sm font-semibold">{category.label}</span><span className="mt-0.5 block text-xs text-muted-foreground">{category.description}</span></span><ChevronRight className="h-4 w-4" /></button>)}
        </nav>

        <section className="rounded-2xl border border-border/70 bg-card p-5 md:p-7">
          {loading ? <div className="grid min-h-72 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
            activeCategory === 'institution' ? (
              // Institution tab: Show rich Branding & Watermark Live Preview Control Center + underlying settings
              <div className="space-y-8">
                <BrandingWatermarkControlCenter />
                <div className="pt-6 border-t border-border space-y-5">
                  <h3 className="text-sm font-bold text-foreground">Underlying Catalog Key-Value Settings</h3>
                  {visibleSettings.map((setting) => (
                    <div key={setting.key} className="grid gap-3 border-b border-border/60 pb-5 last:border-0 md:grid-cols-[minmax(0,1fr)_minmax(220px,320px)] md:items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <label htmlFor={setting.key} className="font-semibold text-sm">{setting.label}</label>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{setting.source.toLowerCase()}</span>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{setting.description}</p>
                        <p className="mt-1.5 text-[11px] text-muted-foreground">Affects: {setting.impact.join(' · ')}</p>
                      </div>
                      {isBooleanSetting(setting) ? (
                        <select id={setting.key} value={draft[setting.key] ?? setting.value} onChange={(event) => { setDraft((current) => ({ ...current, [setting.key]: event.target.value })); setImpact(null); }} className="min-h-10 rounded-xl border border-border bg-background px-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/25">
                          <option value="false">Disabled</option>
                          <option value="true">Enabled</option>
                        </select>
                      ) : (
                        <input id={setting.key} value={draft[setting.key] ?? setting.value} onChange={(event) => { setDraft((current) => ({ ...current, [setting.key]: event.target.value })); setImpact(null); }} className="min-h-10 rounded-xl border border-border bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-primary/25" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : activeCategory === 'modules' ? (
              // Modules tab: show rich visual toggle UI instead of plain dropdowns
              <ModuleControlPanel />
            ) : activeCategory === 'mobile' ? (
              // Mobile & Device Capabilities tab
              <MobileCapabilitiesSettings />
            ) : (
            <div className="space-y-5">
              {visibleSettings.map((setting) => <div key={setting.key} className="grid gap-3 border-b border-border/60 pb-5 last:border-0 md:grid-cols-[minmax(0,1fr)_minmax(220px,320px)] md:items-center"><div><div className="flex items-center gap-2"><label htmlFor={setting.key} className="font-semibold">{setting.label}</label><span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{setting.source.toLowerCase()}</span></div><p className="mt-1 text-sm leading-6 text-muted-foreground">{setting.description}</p><p className="mt-2 text-xs text-muted-foreground">Affects: {setting.impact.join(' · ')}</p></div>{isBooleanSetting(setting) ? <select id={setting.key} value={draft[setting.key] ?? setting.value} onChange={(event) => { setDraft((current) => ({ ...current, [setting.key]: event.target.value })); setImpact(null); }} className="min-h-11 rounded-xl border border-border bg-background px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/25"><option value="false">Disabled</option><option value="true">Enabled</option></select> : <input id={setting.key} value={draft[setting.key] ?? setting.value} onChange={(event) => { setDraft((current) => ({ ...current, [setting.key]: event.target.value })); setImpact(null); }} className="min-h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/25" />}</div>)}
            </div>
            )
          )}
        </section>
      </div>

      <section className="sticky bottom-4 rounded-2xl border border-border bg-background/95 p-4 shadow-xl backdrop-blur-xl">
        {!impact ? <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold">{changeCount ? `${changeCount} unsaved configuration change${changeCount === 1 ? '' : 's'}` : 'No unsaved changes'}</p><p className="mt-1 text-xs text-muted-foreground">Review dependency impact before committing a governed change.</p></div><button onClick={() => void preview()} disabled={!changeCount} className="min-h-11 rounded-xl bg-foreground px-5 text-sm font-semibold text-background disabled:opacity-40">Review impact</button></div> : <div className="space-y-4"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 text-amber-500" /><div><p className="font-semibold">Confirm dependency impact</p>{impact.map((item) => <div key={item.key} className="mt-2 text-sm"><span className="font-semibold">{item.label}:</span> <span className="text-muted-foreground">{item.impact.join(', ')}</span></div>)}</div></div><div className="flex flex-col gap-2 sm:flex-row sm:justify-end"><button onClick={() => setImpact(null)} className="min-h-11 rounded-xl border border-border px-5 text-sm font-semibold">Back to editing</button><button onClick={() => void save()} disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save audited changes</button></div></div>}
      </section>
    </main>
  );
};

export default Settings;
