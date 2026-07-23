import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from '../ui/Toast';
import { FileText, Save, Trash2, ArrowUpRight, Loader2 } from 'lucide-react';
import api from '../../lib/axios';

interface TemplateRecord {
  id: string;
  name: string;
  description: string | null;
  permissions: { permissionId: string }[];
}

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPermissionIds: string[];
  onApplyTemplate: (permissionIds: string[]) => void;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({
  isOpen,
  onClose,
  selectedPermissionIds,
  onApplyTemplate
}) => {
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/roles/templates');
      if (response.data?.status === 'success') {
        setTemplates(response.data.data);
      }
    } catch (error: any) {
      toast.error('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Template name is required');
      return;
    }

    try {
      setIsSaving(true);
      const response = await api.post('/roles/templates', {
        name: name.trim(),
        description: description.trim() || undefined,
        permissionIds: selectedPermissionIds
      });
      if (response.data?.status === 'success') {
        toast.success('Permission template saved successfully!');
        setName('');
        setDescription('');
        fetchTemplates();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      const response = await api.delete(`/roles/templates/${id}`);
      if (response.data?.status === 'success') {
        toast.success('Template deleted');
        fetchTemplates();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Delete failed');
    }
  };

  const handleApply = (template: TemplateRecord) => {
    const ids = template.permissions.map(p => p.permissionId);
    onApplyTemplate(ids);
    toast.success(`Applied template '${template.name}' (${ids.length} permissions)`);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Permission Templates"
      size="md"
    >
      <div className="space-y-6">
        {/* Save Current Selection section */}
        <form onSubmit={handleSaveTemplate} className="space-y-4 border-b pb-6">
          <h4 className="font-bold text-sm text-foreground flex flex-wrap items-center gap-2">
            <Save className="h-4.5 w-4.5 text-primary" />
            Save Current Matrix Configuration
          </h4>
          <p className="text-xs text-muted-foreground">
            Save the current selection of {selectedPermissionIds.length} permissions as a template to easily apply it to other roles later.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Template Name"
              placeholder="e.g. Administrative Officer Template"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Description"
              placeholder="e.g. Baseline permissions for admin staff"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSaving || selectedPermissionIds.length === 0}
              size="sm"
            >
              {isSaving ? 'Saving Template...' : 'Save Template'}
            </Button>
          </div>
        </form>

        {/* Existing Templates list */}
        <div className="space-y-3">
          <h4 className="font-bold text-sm text-foreground flex flex-wrap items-center gap-2">
            <FileText className="h-4.5 w-4.5 text-primary" />
            Apply Saved Templates
          </h4>

          {isLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>
          ) : templates.length === 0 ? (
            <p className="text-xs text-muted-foreground/80 text-center py-4 border border-dashed rounded-xl">
              No saved templates found. Create one above!
            </p>
          ) : (
            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-3 border rounded-xl hover:bg-muted/10 transition-colors"
                >
                  <div className="space-y-1 min-w-0 flex-1 mr-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-xs text-foreground truncate">{template.name}</span>
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold">
                        {template.permissions.length} perms
                      </span>
                    </div>
                    {template.description && (
                      <p className="text-[11px] text-muted-foreground truncate">{template.description}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 flex-shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleApply(template)}
                      className="flex flex-wrap items-center gap-1"
                    >
                      Apply
                      <ArrowUpRight className="h-3 w-3" />
                    </Button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                      title="Delete Template"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
