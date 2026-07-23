import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { toast } from '../components/ui/Toast';
import { Loading } from '../components/ui/Loading';
import { Mail, Settings as SettingsIcon, Database, Palette } from 'lucide-react';
import api from '../lib/axios';

const settingsFormSchema = z.object({
  COLLEGE_NAME: z.string().min(2, 'College Name is required'),
  COLLEGE_EMAIL: z.string().email('Enter a valid email address'),
  COLLEGE_PHONE: z.string().min(5, 'Phone number is required'),
  COLLEGE_WEBSITE: z.string().url('Enter a valid URL'),
  COLLEGE_GST: z.string().min(1, 'GST number is required'),
  COLLEGE_ADDRESS: z.string().min(10, 'Full address is required'),
  COLLEGE_UNIVERSITY: z.string().min(2, 'Affiliated University is required'),
  COLLEGE_AFFILIATION: z.string().min(2, 'Accreditation/Affiliation details required'),
  
  SMTP_HOST: z.string().min(2, 'SMTP Server is required'),
  SMTP_PORT: z.string().min(1, 'SMTP Port is required'),
  SMTP_USER: z.string().min(1, 'SMTP Username is required'),
  SMTP_PASS: z.string().min(1, 'SMTP Password is required'),
  
  SMS_GATEWAY_URL: z.string().url('Enter a valid gateway API URL'),
  SMS_API_KEY: z.string().min(1, 'SMS Gateway key is required'),
  
  BRAND_COLOR: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Enter a valid hex color code (e.g. #4f46e5)'),
  CURRENCY: z.string().min(1, 'Currency name is required'),
  TIMEZONE: z.string().min(1, 'System timezone is required'),
  APPROVAL_MODE: z.string().min(1, 'Approval Mode is required'),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

const Settings: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'college' | 'smtp' | 'sms' | 'brand'>('college');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
  });

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/settings');
      if (res.data?.status === 'success') {
        const settings = res.data.data;
        // Pre-populate fields
        Object.keys(settings).forEach((key) => {
          setValue(key as keyof SettingsFormValues, settings[key]);
        });
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load system settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const onSubmit = async (data: SettingsFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await api.post('/settings', data);
      if (res.data?.status === 'success') {
        toast.success('System configuration parameters saved', 'Settings Updated');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loading text="Retrieving system configuration..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <div>
        <h2 className="text-xl font-bold tracking-tight">System Settings</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Maintain system-wide parameters, SMTP credentials, layout styling, and institution info.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Navigation Tabs */}
        <div className="flex flex-col gap-1 md:col-span-1">
          {[
            { id: 'college', label: 'Institution Info', icon: SettingsIcon },
            { id: 'smtp', label: 'SMTP Config', icon: Mail },
            { id: 'sms', label: 'SMS Gateway', icon: Database },
            { id: 'brand', label: 'Localization & Branding', icon: Palette },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-left transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Form */}
        <div className="md:col-span-3 border bg-card rounded-xl shadow-sm p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Institution Info */}
            {activeTab === 'college' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold border-b pb-2">College Information</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="College / Institute Name"
                    error={errors.COLLEGE_NAME?.message}
                    {...register('COLLEGE_NAME')}
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    error={errors.COLLEGE_EMAIL?.message}
                    {...register('COLLEGE_EMAIL')}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Contact Phone"
                    error={errors.COLLEGE_PHONE?.message}
                    {...register('COLLEGE_PHONE')}
                  />
                  <Input
                    label="Website URL"
                    placeholder="https://geetorus.com"
                    error={errors.COLLEGE_WEBSITE?.message}
                    {...register('COLLEGE_WEBSITE')}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="GST Number"
                    error={errors.COLLEGE_GST?.message}
                    {...register('COLLEGE_GST')}
                  />
                  <Input
                    label="Affiliated University"
                    error={errors.COLLEGE_UNIVERSITY?.message}
                    {...register('COLLEGE_UNIVERSITY')}
                  />
                  <Input
                    label="Accreditation / Affiliation Code"
                    error={errors.COLLEGE_AFFILIATION?.message}
                    {...register('COLLEGE_AFFILIATION')}
                  />
                </div>

                <Input
                  label="Campus Physical Address"
                  error={errors.COLLEGE_ADDRESS?.message}
                  {...register('COLLEGE_ADDRESS')}
                />
              </div>
            )}

            {/* SMTP Settings */}
            {activeTab === 'smtp' && (
              <div className="space-y-4">
                <div className="border-b pb-2 flex items-center justify-between">
                  <h3 className="text-sm font-bold">Mail Gateway Setup (SMTP)</h3>
                  <span className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded font-medium">SSL/TLS Mode</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <Input
                      label="SMTP Server Host"
                      placeholder="smtp.mailtrap.io"
                      error={errors.SMTP_HOST?.message}
                      {...register('SMTP_HOST')}
                    />
                  </div>
                  <Input
                    label="SMTP Port"
                    placeholder="2525"
                    error={errors.SMTP_PORT?.message}
                    {...register('SMTP_PORT')}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="SMTP Username"
                    placeholder="mail-username"
                    error={errors.SMTP_USER?.message}
                    {...register('SMTP_USER')}
                  />
                  <Input
                    label="SMTP Password"
                    type="password"
                    placeholder="••••••••"
                    error={errors.SMTP_PASS?.message}
                    {...register('SMTP_PASS')}
                  />
                </div>
              </div>
            )}

            {/* SMS Gateway Settings */}
            {activeTab === 'sms' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold border-b pb-2">SMS API Gateway Settings</h3>

                <Input
                  label="HTTP Gateway Dispatch Endpoint"
                  placeholder="https://api.sms-gateway.com/send"
                  error={errors.SMS_GATEWAY_URL?.message}
                  {...register('SMS_GATEWAY_URL')}
                />
                <Input
                  label="SMS API Secrets Key"
                  type="password"
                  placeholder="sms-secret-token"
                  error={errors.SMS_API_KEY?.message}
                  {...register('SMS_API_KEY')}
                />
              </div>
            )}

            {/* Branding Settings */}
            {activeTab === 'brand' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold border-b pb-2">Localization & Layout Theme</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <Input
                      label="Brand Hex Primary Color"
                      placeholder="#4f46e5"
                      error={errors.BRAND_COLOR?.message}
                      {...register('BRAND_COLOR')}
                    />
                  </div>
                  <div className="flex flex-col justify-end pb-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Palette className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-semibold text-muted-foreground">Color Picker</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Campus Active Currency"
                    placeholder="USD"
                    error={errors.CURRENCY?.message}
                    {...register('CURRENCY')}
                  />
                  <Input
                    label="System Timezone"
                    placeholder="IST"
                    error={errors.TIMEZONE?.message}
                    {...register('TIMEZONE')}
                  />
                </div>

                <div className="border-t pt-4 space-y-3 text-left">
                  <h4 className="text-xs uppercase font-extrabold text-muted-foreground tracking-wider">Leave & OD Workflows</h4>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Workflow Approval Path Mode</label>
                    <select
                      {...register('APPROVAL_MODE')}
                      className="h-10 w-full border rounded-lg bg-background px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="MENTOR_ONLY">Option A: Mentor / Class Advisor Only Approval</option>
                      <option value="MENTOR_HOD">Option B: Multi-Stage Approval (Mentor Approval → HOD Approval)</option>
                    </select>
                    {errors.APPROVAL_MODE?.message && (
                      <span className="text-[10px] text-rose-500 font-semibold">{errors.APPROVAL_MODE.message}</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Submit Toolbar */}
            <div className="flex flex-wrap justify-end gap-3 pt-4 border-t">
              <Button type="submit" isLoading={isSubmitting}>
                Save System Parameters
              </Button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
};

export default Settings;
