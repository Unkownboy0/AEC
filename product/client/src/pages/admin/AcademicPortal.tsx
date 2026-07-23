import React, { useState, useEffect } from 'react';
import {
  Building, Layers, GraduationCap, Calendar, Clock,
  Plus, Edit2, Trash2, Archive, RotateCcw, Download, Upload, Printer,
  ChevronDown, Activity, AlertCircle, Search
} from 'lucide-react';

const SearchIcon = Search;
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { Pagination } from '../../components/ui/Pagination';
import api from '../../lib/axios';

type ModuleKey = 'departments' | 'programs' | 'courses' | 'years' | 'semesters' | 'sections' | 'subjects';

interface TabConfig {
  id: ModuleKey | 'dashboard';
  label: string;
  icon: React.ComponentType<any>;
}

const TABS: TabConfig[] = [
  { id: 'dashboard', label: 'Master Dashboard', icon: Layers },
  { id: 'departments', label: 'Departments', icon: Building },
  { id: 'courses', label: 'Programs', icon: GraduationCap },
  { id: 'years', label: 'Academic Years', icon: Calendar },
  { id: 'semesters', label: 'Semesters', icon: Clock },
  { id: 'sections', label: 'Sections', icon: GraduationCap },
  { id: 'subjects', label: 'Subjects', icon: Layers },
];

export const AcademicPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ModuleKey | 'dashboard'>('dashboard');
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // General Listing States
  const [records, setRecords] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState<any>({});
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Dropdowns for relational fields (cached once at mount or tab change)
  const [departmentsList, setDepartmentsList] = useState<any[]>([]);
  const [programsList, setProgramsList] = useState<any[]>([]);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [yearsList, setYearsList] = useState<any[]>([]);
  const [semestersList, setSemestersList] = useState<any[]>([]);

  // Modals / Drawers
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formRecord, setFormRecord] = useState<any>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState<any>(null);
  
  // Column Visibility
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    code: true,
    name: true,
    type: true,
    status: true,
    establishedYear: true,
    duration: true,
    level: true,
    credits: true,
    regulation: true,
    semester: true,
    course: true,
    capacity: true,
    room: true,
    hasLab: true,
  });

  const [showColMenu, setShowColMenu] = useState(false);

  // Fetch Dashboard Statistics
  const fetchDashboardStats = async () => {
    try {
      const res = await api.get('/academics/dashboard/stats');
      if (res.data?.status === 'success') {
        setDashboardStats(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load academic dashboard statistics');
    }
  };

  // Load supporting relational lists for selection dropdowns
  const loadRelationDropdowns = async () => {
    try {
      const [dRes, pRes, cRes, yRes, semRes] = await Promise.all([
        api.get('/academics/departments?pageSize=100'),
        api.get('/academics/programs?pageSize=100'),
        api.get('/academics/courses?pageSize=100'),
        api.get('/academics/years?pageSize=100'),
        api.get('/academics/semesters?pageSize=100'),
      ]);
      setDepartmentsList(dRes.data?.data || []);
      setProgramsList(pRes.data?.data || []);
      setCoursesList(cRes.data?.data || []);
      setYearsList(yRes.data?.data || []);
      setSemestersList(semRes.data?.data || []);
    } catch (err) {
      console.error('Failed to load related listing dropdowns', err);
    }
  };

  // Load records for active table tab
  const fetchRecords = async () => {
    if (activeTab === 'dashboard') {
      setIsLoading(true);
      await fetchDashboardStats();
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        search,
        sortBy,
        sortOrder,
        status: statusFilter,
        ...advancedFilters,
      });

      const res = await api.get(`/academics/${activeTab}?${queryParams}`);
      if (res.data?.status === 'success') {
        setRecords(res.data.data || []);
        setTotalCount(res.data.totalCount || 0);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRelationDropdowns();
  }, []);

  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
    setAdvancedFilters({});
    setSearch('');
    fetchRecords();
  }, [activeTab, statusFilter]);

  useEffect(() => {
    fetchRecords();
  }, [page, sortBy, sortOrder, advancedFilters]);

  // General CRUD Submit
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload: any = {};
    fd.forEach((value, key) => {
      payload[key] = value;
    });

    // Checkbox mapping
    if (activeTab === 'subjects') {
      payload.isLab = fd.get('isLab') === 'true';
      payload.isCore = fd.get('isCore') === 'true';
      payload.isElective = fd.get('isElective') === 'true';
      payload.isSkillBased = fd.get('isSkillBased') === 'true';
      payload.isOpenElective = fd.get('isOpenElective') === 'true';
      payload.isProfessionalElective = fd.get('isProfessionalElective') === 'true';
    }
    if (activeTab === 'years' || activeTab === 'semesters') {
      payload.isCurrent = fd.get('isCurrent') === 'true';
    }

    try {
      let res;
      if (formRecord) {
        res = await api.put(`/academics/${activeTab}/${formRecord.id}`, payload);
      } else {
        res = await api.post(`/academics/${activeTab}`, payload);
      }

      if (res.data?.status === 'success') {
        toast.success(formRecord ? 'Record updated successfully' : 'Record created successfully');
        setIsFormOpen(false);
        setFormRecord(null);
        fetchRecords();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed. Verify inputs.');
    }
  };

  // Bulk Actions Trigger
  const handleBulkAction = async (action: 'delete' | 'archive' | 'restore') => {
    if (selectedIds.length === 0) return;
    setShowConfirm({
      title: `Bulk ${action.toUpperCase()}`,
      message: `Are you sure you want to execute bulk ${action} on ${selectedIds.length} selected record(s)?`,
      onConfirm: async () => {
        try {
          const res = await api.post('/academics/bulk-action', {
            moduleKey: activeTab,
            action,
            ids: selectedIds,
          });
          if (res.data?.status === 'success') {
            toast.success(`Successfully executed bulk ${action}`);
            setSelectedIds([]);
            fetchRecords();
          }
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Bulk operation failed');
        } finally {
          setShowConfirm(null);
        }
      }
    });
  };

  // Single Actions Delete / Archive / Restore
  const handleSingleAction = (id: string, action: 'delete' | 'archive' | 'restore') => {
    setShowConfirm({
      title: `${action.toUpperCase()} record`,
      message: `Are you sure you want to execute ${action} on this record?`,
      onConfirm: async () => {
        try {
          if (action === 'delete') {
            await api.delete(`/academics/${activeTab}/${id}`);
          } else {
            await api.post('/academics/bulk-action', {
              moduleKey: activeTab,
              action,
              ids: [id],
            });
          }
          toast.success(`Successfully executed ${action}`);
          fetchRecords();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Action failed');
        } finally {
          setShowConfirm(null);
        }
      }
    });
  };

  // Import flow
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
      if (lines.length <= 1) {
        toast.error('File is empty or contains no headers');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const parsedRows = lines.slice(1).map(line => {
        const columns = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        const obj: any = {};
        headers.forEach((h, i) => {
          obj[h] = columns[i] || '';
        });
        return obj;
      });

      try {
        const res = await api.post('/academics/import-preview', {
          moduleKey: activeTab,
          rows: parsedRows,
        });
        if (res.data?.status === 'success') {
          setImportPreview(res.data.data);
        }
      } catch (err) {
        toast.error('Failed to parse validation report');
      }
    };
    reader.readAsText(file);
  };

  const handleCommitImport = async () => {
    if (!importPreview || importPreview.valid.length === 0) {
      toast.error('No valid records to import');
      return;
    }

    try {
      const res = await api.post('/academics/import', {
        moduleKey: activeTab,
        rows: importPreview.valid,
      });
      if (res.data?.status === 'success') {
        toast.success(`Imported ${res.data.data.importedCount} records successfully`);
        setIsImportOpen(false);
        setImportPreview(null);
        fetchRecords();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Import commit failed');
    }
  };

  // Export Flow
  const handleExport = (format: 'csv' | 'print') => {
    if (format === 'csv') {
      if (records.length === 0) {
        toast.error('No records available to export');
        return;
      }
      const headers = Object.keys(records[0]).filter(k => typeof records[0][k] !== 'object');
      const csvRows = [
        headers.join(','),
        ...records.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
      ];
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('href', url);
      a.setAttribute('download', `${activeTab}_export.csv`);
      a.click();
      toast.success('CSV Download triggered!');
    } else if (format === 'print') {
      window.print();
    }
  };

  // Toggle selection checkmarks
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === records.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(records.map(r => r.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section with page title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Academic Master Data Portal</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Build, structure, and configure foundational academic settings and curricula parameters.
          </p>
        </div>
        
        {/* Main tabs bar */}
        <div className="flex flex-wrap gap-1 bg-muted p-1 rounded-lg">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                  isActive
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* RENDER MASTER DASHBOARD VIEW */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex h-[30vh] items-center justify-center">
              <Loading text="Loading metrics dashboard..." />
            </div>
          ) : (
            <>
              {/* Stats Counters Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {[
                  { label: 'Departments', count: dashboardStats?.totals?.depts, color: 'bg-indigo-500/10 text-indigo-500', icon: Building },
                  { label: 'Programs', count: dashboardStats?.totals?.progs, color: 'bg-emerald-500/10 text-emerald-500', icon: Layers },
                  { label: 'Courses', count: dashboardStats?.totals?.courses, color: 'bg-pink-500/10 text-pink-500', icon: GraduationCap },
                  { label: 'Academic Years', count: dashboardStats?.totals?.years, color: 'bg-amber-500/10 text-amber-500', icon: Calendar },
                  { label: 'Semesters', count: dashboardStats?.totals?.sems, color: 'bg-sky-500/10 text-sky-500', icon: Clock },
                  { label: 'Sections', count: dashboardStats?.totals?.secs, color: 'bg-purple-500/10 text-purple-500', icon: GraduationCap },
                  { label: 'Subjects', count: dashboardStats?.totals?.subs, color: 'bg-rose-500/10 text-rose-500', icon: Layers },
                ].map((stat, idx) => (
                  <div key={idx} className="border bg-card p-4 rounded-xl shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{stat.label}</span>
                      <div className={`p-1.5 rounded-lg ${stat.color}`}>
                        <stat.icon className="h-3.5 w-3.5" />
                      </div>
                    </div>
                    <span className="text-2xl font-extrabold tracking-tight mt-3 block">{stat.count ?? 0}</span>
                  </div>
                ))}
              </div>

              {/* Diagrams and recent activity grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Department Type Distribution Chart */}
                <div className="border bg-card rounded-xl p-5 shadow-sm space-y-4">
                  <h3 className="text-xs uppercase font-extrabold tracking-wider text-muted-foreground">Department Types</h3>
                  <div className="space-y-3">
                    {dashboardStats?.deptsDistribution?.length > 0 ? (
                      dashboardStats.deptsDistribution.map((d: any, idx: number) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span>{d.name || 'General'}</span>
                            <span>{d.value}</span>
                          </div>
                          <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                            <div className="bg-primary h-full" style={{ width: `${(d.value / Math.max(...dashboardStats.deptsDistribution.map((x: any) => x.value))) * 100}%` }} />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-6">No data registered</p>
                    )}
                  </div>
                </div>

                {/* Program Level distribution */}
                <div className="border bg-card rounded-xl p-5 shadow-sm space-y-4">
                  <h3 className="text-xs uppercase font-extrabold tracking-wider text-muted-foreground">Program Levels</h3>
                  <div className="space-y-3">
                    {dashboardStats?.levelDistribution?.length > 0 ? (
                      dashboardStats.levelDistribution.map((l: any, idx: number) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span>{l.name || 'UG'}</span>
                            <span>{l.value}</span>
                          </div>
                          <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full" style={{ width: `${(l.value / Math.max(...dashboardStats.levelDistribution.map((x: any) => x.value))) * 100}%` }} />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-6">No data registered</p>
                    )}
                  </div>
                </div>

                {/* Recent Activities feed */}
                <div className="border bg-card rounded-xl p-5 shadow-sm space-y-4">
                  <h3 className="text-xs uppercase font-extrabold tracking-wider text-muted-foreground">Activity Timeline</h3>
                  <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1">
                    {dashboardStats?.recentLogs?.length > 0 ? (
                      dashboardStats.recentLogs.map((log: any) => (
                        <div key={log.id} className="flex flex-wrap gap-3 border-b pb-2 last:border-0 last:pb-0">
                          <div className="p-1 bg-muted rounded-full h-fit text-primary mt-0.5">
                            <Activity className="h-3.5 w-3.5" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-semibold leading-tight">{log.description}</p>
                            <div className="flex flex-wrap items-center gap-2 text-[9px] text-muted-foreground font-semibold">
                              <span>{log.user}</span>
                              <span>•</span>
                              <span>{new Date(log.timestamp).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-6">No recent actions</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* RENDER INDIVIDUAL CRUD/TABLE MODULE VIEW */}
      {activeTab !== 'dashboard' && (
        <div className="border bg-card rounded-xl shadow-sm overflow-hidden space-y-4 p-5">
          {/* Controls Bar: Search, Filters, Visibility, Export/Import, Add button */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap flex-1 items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={`Search ${activeTab}...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>

              {/* Status quick select using standard select */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                >
                  <option value="">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Column visibility menu toggle */}
              <div className="relative">
                <Button variant="outline" size="sm" className="text-xs h-9" onClick={() => setShowColMenu(!showColMenu)}>
                  Columns <ChevronDown className="ml-1 h-3.5 w-3.5" />
                </Button>
                {showColMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-card border rounded-lg shadow-lg p-2 z-30">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase px-2 mb-1">Toggle Columns</p>
                    {Object.keys(visibleColumns).map((col) => (
                      <label key={col} className="flex flex-wrap items-center gap-2 px-2 py-1 hover:bg-muted rounded text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={visibleColumns[col]}
                          onChange={() => setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }))}
                          className="rounded text-primary focus:ring-primary"
                        />
                        <span className="capitalize">{col.replace(/([A-Z])/g, ' $1')}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <Button variant="outline" size="sm" className="text-xs h-9" onClick={() => setIsImportOpen(true)}>
                <Upload className="mr-1 h-3.5 w-3.5" /> Import
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-9" onClick={() => handleExport('csv')}>
                <Download className="mr-1 h-3.5 w-3.5" /> CSV
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-9" onClick={() => handleExport('print')}>
                <Printer className="mr-1 h-3.5 w-3.5" /> Print
              </Button>
              <Button variant="primary" size="sm" className="text-xs h-9" onClick={() => { setFormRecord(null); setIsFormOpen(true); }}>
                <Plus className="mr-1 h-4 w-4" /> Add Record
              </Button>
            </div>
          </div>

          {/* Bulk Selection Bar */}
          {selectedIds.length > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center justify-between animate-in slide-in-from-top-2">
              <span className="text-xs font-semibold text-primary">{selectedIds.length} item(s) selected</span>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="text-xs h-8 hover:bg-amber-500/10 hover:text-amber-600" onClick={() => handleBulkAction('archive')}>
                  <Archive className="mr-1 h-3.5 w-3.5" /> Bulk Archive
                </Button>
                <Button variant="outline" size="sm" className="text-xs h-8 hover:bg-emerald-500/10 hover:text-emerald-600" onClick={() => handleBulkAction('restore')}>
                  <RotateCcw className="mr-1 h-3.5 w-3.5" /> Bulk Restore
                </Button>
                <Button variant="outline" size="sm" className="text-xs h-8 hover:bg-red-500/10 hover:text-red-600" onClick={() => handleBulkAction('delete')}>
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Bulk Delete
                </Button>
              </div>
            </div>
          )}

          {/* Table of Records */}
          {isLoading ? (
            <div className="space-y-3 py-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-muted/30 rounded-md animate-pulse" />
              ))}
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-xs font-semibold text-muted-foreground">No records registered matching this filter query</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto max-w-[90vw] md:max-w-full pb-2 scrollbar-thin"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px] pl-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === records.length}
                      onChange={toggleSelectAll}
                      className="rounded"
                    />
                  </TableHead>
                  {activeTab === 'departments' && (
                    <>
                      {visibleColumns.code && <TableHead onClick={() => { setSortBy('code'); setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer">Code</TableHead>}
                      {visibleColumns.name && <TableHead onClick={() => { setSortBy('name'); setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer">Name</TableHead>}
                      {visibleColumns.type && <TableHead>Type</TableHead>}
                      {visibleColumns.establishedYear && <TableHead>Established</TableHead>}
                    </>
                  )}
                  {activeTab === 'programs' && (
                    <>
                      {visibleColumns.code && <TableHead>Code</TableHead>}
                      {visibleColumns.name && <TableHead>Name</TableHead>}
                      {visibleColumns.duration && <TableHead>Duration</TableHead>}
                      {visibleColumns.level && <TableHead>Level</TableHead>}
                      {visibleColumns.credits && <TableHead>Credits</TableHead>}
                    </>
                  )}
                  {activeTab === 'courses' && (
                    <>
                      {visibleColumns.code && <TableHead>Code</TableHead>}
                      {visibleColumns.name && <TableHead>Name</TableHead>}
                      {visibleColumns.duration && <TableHead>Duration (Yrs)</TableHead>}
                      {visibleColumns.regulation && <TableHead>Regulation</TableHead>}
                    </>
                  )}
                  {activeTab === 'years' && (
                    <>
                      <TableHead>Academic Year</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Current Year</TableHead>
                    </>
                  )}
                  {activeTab === 'semesters' && (
                    <>
                      <TableHead>Semester Name</TableHead>
                      <TableHead>Number</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Term Credits</TableHead>
                    </>
                  )}
                  {activeTab === 'sections' && (
                    <>
                      <TableHead>Section Name</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Class Advisor</TableHead>
                    </>
                  )}
                  {activeTab === 'subjects' && (
                    <>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>L-T-P</TableHead>
                      <TableHead>Coordinator</TableHead>
                    </>
                  )}
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px] text-right pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="pl-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(row.id)}
                        onChange={() => toggleSelect(row.id)}
                        className="rounded"
                      />
                    </TableCell>

                    {activeTab === 'departments' && (
                      <>
                        {visibleColumns.code && <TableCell>{row.code}</TableCell>}
                        {visibleColumns.name && <TableCell>{row.name}</TableCell>}
                        {visibleColumns.type && <TableCell>{row.type}</TableCell>}
                        {visibleColumns.establishedYear && <TableCell>{row.establishedYear || 'N/A'}</TableCell>}
                      </>
                    )}

                    {activeTab === 'programs' && (
                      <>
                        {visibleColumns.code && <TableCell>{row.code}</TableCell>}
                        {visibleColumns.name && <TableCell>{row.name}</TableCell>}
                        {visibleColumns.duration && <TableCell>{row.duration} yrs</TableCell>}
                        {visibleColumns.level && <TableCell>{row.level}</TableCell>}
                        {visibleColumns.credits && <TableCell>{row.credits}</TableCell>}
                      </>
                    )}

                    {activeTab === 'courses' && (
                      <>
                        {visibleColumns.code && <TableCell>{row.code}</TableCell>}
                        {visibleColumns.name && <TableCell>{row.name}</TableCell>}
                        {visibleColumns.duration && <TableCell>{row.duration} yrs</TableCell>}
                        {visibleColumns.regulation && <TableCell>{row.regulation}</TableCell>}
                      </>
                    )}

                    {activeTab === 'years' && (
                      <>
                        <TableCell className="font-bold">{row.name}</TableCell>
                        <TableCell>{new Date(row.startDate).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(row.endDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {row.isCurrent ? (
                            <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-1.5 py-0.5 rounded">Active Year</span>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                      </>
                    )}

                    {activeTab === 'semesters' && (
                      <>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.number}</TableCell>
                        <TableCell>{row.course?.name}</TableCell>
                        <TableCell>{row.credits} Credits</TableCell>
                      </>
                    )}

                    {activeTab === 'sections' && (
                      <>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.capacity} students</TableCell>
                        <TableCell>{row.room || 'TBD'}</TableCell>
                        <TableCell>{row.classAdvisor || 'Not Assigned'}</TableCell>
                      </>
                    )}

                    {activeTab === 'subjects' && (
                      <>
                        <TableCell>{row.code}</TableCell>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.credits}</TableCell>
                        <TableCell>{row.theoryHours}-{row.tutorialHours}-{row.practicalHours}</TableCell>
                        <TableCell>{row.subjectCoordinator || 'N/A'}</TableCell>
                      </>
                    )}

                    <TableCell>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        row.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : row.status === 'ARCHIVED'
                          ? 'bg-amber-500/10 text-amber-500'
                          : 'bg-muted-foreground/10 text-muted-foreground'
                      }`}>
                        {row.status}
                      </span>
                    </TableCell>

                    <TableCell className="text-right pr-4 space-x-1.5">
                      <button
                        onClick={() => { setFormRecord(row); setIsFormOpen(true); }}
                        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleSingleAction(row.id, 'archive')}
                        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-amber-500 transition-colors"
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleSingleAction(row.id, 'delete')}
                        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          )}

          {/* Pagination Controls */}
          {records.length > 0 && (
            <Pagination
              currentPage={page}
              totalPages={Math.ceil(totalCount / pageSize)}
              onPageChange={(p) => setPage(p)}
              pageSize={pageSize}
              totalCount={totalCount}
            />
          )}
        </div>
      )}

      {/* 1. DRAWER FORM MODAL (ADD / EDIT OPERATIONS) */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setFormRecord(null); }}
        title={formRecord ? `Edit ${activeTab.substring(0, activeTab.length - 1)}` : `Add New ${activeTab.substring(0, activeTab.length - 1)}`}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 p-4 text-xs font-semibold">
          {activeTab === 'departments' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Code" name="code" defaultValue={formRecord?.code} required />
                <Input label="Name" name="name" defaultValue={formRecord?.name} required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Short Name" name="shortName" defaultValue={formRecord?.shortName} />
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Type</label>
                  <select name="type" defaultValue={formRecord?.type || 'Engineering'} className="h-10 border rounded px-3 bg-background">
                    <option value="Engineering">Engineering</option>
                    <option value="Arts">Arts</option>
                    <option value="Science">Science</option>
                    <option value="Medical">Medical</option>
                    <option value="Management">Management</option>
                    <option value="Commerce">Commerce</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Color (HEX)" name="color" defaultValue={formRecord?.color || '#6366f1'} />
                <Input label="Email" name="email" type="email" defaultValue={formRecord?.email} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Phone" name="phone" defaultValue={formRecord?.phone} />
                <Input label="Website" name="website" defaultValue={formRecord?.website} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Office Location" name="officeLocation" defaultValue={formRecord?.officeLocation} />
                <Input label="Established Year" name="establishedYear" type="number" defaultValue={formRecord?.establishedYear} />
              </div>
              <Input label="Head of Department (HOD)" name="hodName" defaultValue={formRecord?.hodName} />
            </>
          )}

          {activeTab === 'programs' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Program Code" name="code" defaultValue={formRecord?.code} required />
                <Input label="Program Name" name="name" defaultValue={formRecord?.name} required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="Duration (Years)" name="duration" type="number" defaultValue={formRecord?.duration || 4} required />
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Level</label>
                  <select name="level" defaultValue={formRecord?.level || 'UG'} className="h-10 border rounded px-3 bg-background">
                    <option value="UG">Undergraduate (UG)</option>
                    <option value="PG">Postgraduate (PG)</option>
                    <option value="Diploma">Diploma</option>
                    <option value="PhD">Doctorate (PhD)</option>
                  </select>
                </div>
                <Input label="Credits" name="credits" type="number" defaultValue={formRecord?.credits || 160} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Department Mapping</label>
                <select name="departmentId" defaultValue={formRecord?.departmentId} required className="h-10 border rounded px-3 bg-background">
                  <option value="">Select Department</option>
                  {departmentsList.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
                </select>
              </div>
              <Input label="Coordinator" name="coordinator" defaultValue={formRecord?.coordinator} />
            </>
          )}

          {activeTab === 'courses' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Program Code" name="code" defaultValue={formRecord?.code} required />
                <Input label="Program Name" name="name" defaultValue={formRecord?.name} required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Duration (Years)" name="duration" type="number" defaultValue={formRecord?.duration || 4} required />
                <Input label="Total Semesters" name="credits" type="number" defaultValue={formRecord?.credits || 8} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Degree Type</label>
                  <select name="regulation" defaultValue={formRecord?.regulation || 'B.Tech'} required className="h-10 border rounded px-3 bg-background">
                    {['BE', 'B.Tech', 'B.Sc', 'BCA', 'B.Com', 'BA', 'BBA', 'ME', 'M.Tech', 'MBA', 'MCA', 'M.Sc', 'M.Com', 'PhD'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Department Mapping</label>
                  <select name="departmentId" defaultValue={formRecord?.departmentId} required className="h-10 border rounded px-3 bg-background">
                    <option value="">Select Department</option>
                    {departmentsList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Coordinator" name="coordinator" defaultValue={formRecord?.coordinator} />
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Status</label>
                  <select name="status" defaultValue={formRecord?.status || 'ACTIVE'} className="h-10 border rounded px-3 bg-background">
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
              <Input label="Description" name="description" defaultValue={formRecord?.description} />
              <input type="hidden" name="programId" value={formRecord?.programId || 'none'} />
            </>
          )}

          {activeTab === 'years' && (
            <>
              <Input label="Academic Year Name (e.g. 2026-2027)" name="name" defaultValue={formRecord?.name} required />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Start Date" name="startDate" type="date" defaultValue={formRecord?.startDate ? new Date(formRecord.startDate).toISOString().split('T')[0] : ''} required />
                <Input label="End Date" name="endDate" type="date" defaultValue={formRecord?.endDate ? new Date(formRecord.endDate).toISOString().split('T')[0] : ''} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Current Active Year</label>
                <select name="isCurrent" defaultValue={formRecord?.isCurrent ? 'true' : 'false'} className="h-10 border rounded px-3 bg-background">
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            </>
          )}

          {activeTab === 'semesters' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Semester Number" name="number" type="number" defaultValue={formRecord?.number} required />
                <Input label="Semester Name (e.g. Semester 1)" name="name" defaultValue={formRecord?.name} required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Start Date" name="startDate" type="date" defaultValue={formRecord?.startDate ? new Date(formRecord.startDate).toISOString().split('T')[0] : ''} required />
                <Input label="End Date" name="endDate" type="date" defaultValue={formRecord?.endDate ? new Date(formRecord.endDate).toISOString().split('T')[0] : ''} required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Course</label>
                  <select name="courseId" defaultValue={formRecord?.courseId} required className="h-10 border rounded px-3 bg-background">
                    <option value="">Select Course</option>
                    {coursesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Program</label>
                  <select name="programId" defaultValue={formRecord?.programId} required className="h-10 border rounded px-3 bg-background">
                    <option value="">Select Program</option>
                    {programsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Academic Year</label>
                <select name="academicYearId" defaultValue={formRecord?.academicYearId} required className="h-10 border rounded px-3 bg-background">
                  <option value="">Select Academic Year</option>
                  {yearsList.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                </select>
              </div>
            </>
          )}

          {activeTab === 'sections' && (
            <>
              <Input label="Section Name" name="name" defaultValue={formRecord?.name} required />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Capacity" name="capacity" type="number" defaultValue={formRecord?.capacity || 60} required />
                <Input label="Room / Classroom" name="room" defaultValue={formRecord?.room} />
              </div>
              <Input label="Class Advisor" name="classAdvisor" defaultValue={formRecord?.classAdvisor} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Semester</label>
                  <select name="semesterId" defaultValue={formRecord?.semesterId} required className="h-10 border rounded px-3 bg-background">
                    <option value="">Select Semester</option>
                    {semestersList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Program</label>
                  <select name="programId" defaultValue={formRecord?.programId} required className="h-10 border rounded px-3 bg-background">
                    <option value="">Select Program</option>
                    {programsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Department</label>
                  <select name="departmentId" defaultValue={formRecord?.departmentId} required className="h-10 border rounded px-3 bg-background">
                    <option value="">Select Department</option>
                    {departmentsList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          {activeTab === 'subjects' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Subject Code" name="code" defaultValue={formRecord?.code} required />
                <Input label="Subject Name" name="name" defaultValue={formRecord?.name} required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Input label="Credits" name="credits" type="number" defaultValue={formRecord?.credits || 3} required />
                <Input label="Theory Hours" name="theoryHours" type="number" defaultValue={formRecord?.theoryHours || 3} />
                <Input label="Practical Hours" name="practicalHours" type="number" defaultValue={formRecord?.practicalHours || 0} />
                <Input label="Tutorial Hours" name="tutorialHours" type="number" defaultValue={formRecord?.tutorialHours || 0} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="Internal Marks" name="internalMarks" type="number" defaultValue={formRecord?.internalMarks || 40} />
                <Input label="External Marks" name="externalMarks" type="number" defaultValue={formRecord?.externalMarks || 60} />
                <Input label="Passing Marks" name="passingMarks" type="number" defaultValue={formRecord?.passingMarks || 40} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Is Core</label>
                  <select name="isCore" defaultValue={formRecord?.isCore ? 'true' : 'false'} className="h-10 border rounded px-3 bg-background">
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Is Lab</label>
                  <select name="isLab" defaultValue={formRecord?.isLab ? 'true' : 'false'} className="h-10 border rounded px-3 bg-background">
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Is Elective</label>
                  <select name="isElective" defaultValue={formRecord?.isElective ? 'true' : 'false'} className="h-10 border rounded px-3 bg-background">
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Semester</label>
                  <select name="semesterId" defaultValue={formRecord?.semesterId} required className="h-10 border rounded px-3 bg-background">
                    <option value="">Select Semester</option>
                    {semestersList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Department</label>
                  <select name="departmentId" defaultValue={formRecord?.departmentId} required className="h-10 border rounded px-3 bg-background">
                    <option value="">Select Department</option>
                    {departmentsList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Program</label>
                  <select name="programId" defaultValue={formRecord?.programId} required className="h-10 border rounded px-3 bg-background">
                    <option value="">Select Program</option>
                    {programsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <Input label="Subject Coordinator" name="subjectCoordinator" defaultValue={formRecord?.subjectCoordinator} />
            </>
          )}

          {/* Status field */}
          {formRecord && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Status</label>
              <select name="status" defaultValue={formRecord.status} className="h-10 border rounded px-3 bg-background">
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => { setIsFormOpen(false); setFormRecord(null); }}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Record
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. IMPORT DIALOG */}
      <Modal
        isOpen={isImportOpen}
        onClose={() => { setIsImportOpen(false); setImportPreview(null); }}
        title={`Import ${activeTab} via CSV`}
      >
        <div className="p-4 space-y-4 text-xs">
          <p className="text-muted-foreground font-medium">
            Upload a CSV file containing headers that correspond to the fields of the `{activeTab}` table.
          </p>

          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="w-full border p-2 rounded cursor-pointer bg-background"
          />

          {importPreview && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-4">
                <span className="text-emerald-500 font-bold">Valid rows: {importPreview.valid.length}</span>
                <span className="text-amber-500 font-bold">Duplicates: {importPreview.duplicates.length}</span>
                <span className="text-red-500 font-bold">Errors: {importPreview.errors.length}</span>
              </div>

              {importPreview.errors.length > 0 && (
                <div className="border border-red-200 bg-red-500/5 rounded-lg p-3 max-h-[150px] overflow-y-auto">
                  <p className="font-extrabold text-red-500 mb-1">Errors Report:</p>
                  {importPreview.errors.map((e: any, idx: number) => (
                    <div key={idx} className="text-[10px] text-red-600">
                      Line {e.line}: {e.message}
                    </div>
                  ))}
                </div>
              )}

              {importPreview.duplicates.length > 0 && (
                <div className="border border-amber-200 bg-amber-500/5 rounded-lg p-3 max-h-[150px] overflow-y-auto">
                  <p className="font-extrabold text-amber-500 mb-1">Duplicate Rows (Will not import):</p>
                  {importPreview.duplicates.map((d: any, idx: number) => (
                    <div key={idx} className="text-[10px] text-amber-600">
                      Line {d.line}: {d.message}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="outline" onClick={() => { setIsImportOpen(false); setImportPreview(null); }}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleCommitImport} disabled={importPreview.valid.length === 0}>
                  Confirm and Import {importPreview.valid.length} Rows
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* 3. CONFIRMATION DIALOG */}
      {showConfirm && (
        <ConfirmationDialog
          isOpen={!!showConfirm}
          onClose={() => setShowConfirm(null)}
          onConfirm={showConfirm.onConfirm}
          title={showConfirm.title}
          message={showConfirm.message}
        />
      )}
    </div>
  );
};
