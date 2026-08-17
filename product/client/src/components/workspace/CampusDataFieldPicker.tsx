import React, { useState, useEffect } from 'react';
import { Database, X, ChevronRight, Tag } from 'lucide-react';
import { workspaceApi, CampusDataContext } from '../../services/workspace.api';

interface Props {
  onInsert: (token: string) => void;
  onClose: () => void;
}

interface Dataset {
  id: string;
  label: string;
  fields: string[];
}

const FIELD_TOKENS: Record<string, Array<{ token: string; label: string }>> = {
  institution: [
    { token: 'institution.name', label: 'College Name' },
    { token: 'institution.code', label: 'College Code' },
    { token: 'institution.address', label: 'Address' },
    { token: 'institution.phone', label: 'Phone' },
    { token: 'institution.email', label: 'Email' },
  ],
  faculty: [
    { token: 'faculty.name', label: 'Faculty Name' },
    { token: 'faculty.employeeId', label: 'Employee ID' },
    { token: 'faculty.designation', label: 'Designation' },
    { token: 'faculty.email', label: 'Faculty Email' },
  ],
  department: [
    { token: 'department.name', label: 'Department Name' },
    { token: 'department.code', label: 'Dept Code' },
    { token: 'department.hod.name', label: 'HOD Name' },
  ],
  date: [
    { token: 'currentDate', label: 'Current Date' },
    { token: 'academicYear', label: 'Academic Year' },
    { token: 'semester', label: 'Current Semester' },
  ],
};

const CampusDataFieldPicker: React.FC<Props> = ({ onInsert, onClose }) => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [context, setContext] = useState<CampusDataContext | null>(null);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [ctx, ds] = await Promise.all([
          workspaceApi.getCampusDataContext(),
          workspaceApi.getAvailableDatasets(),
        ]);
        setContext(ctx);
        setDatasets(ds);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const categories = [
    { id: 'institution', label: '🏛️ Institution', tokens: FIELD_TOKENS.institution },
    { id: 'faculty', label: '👤 My Profile', tokens: FIELD_TOKENS.faculty },
    { id: 'department', label: '🏢 Department', tokens: FIELD_TOKENS.department },
    { id: 'date', label: '📅 Date & Year', tokens: FIELD_TOKENS.date },
  ];

  const resolvePreview = (token: string): string => {
    if (!context) return '';
    const map: Record<string, string> = {
      'institution.name': context.institution?.name || '',
      'institution.code': context.institution?.code || '',
      'institution.address': context.institution?.address || '',
      'institution.phone': context.institution?.phone || '',
      'institution.email': context.institution?.email || '',
      'faculty.name': context.faculty?.name || '',
      'faculty.employeeId': context.faculty?.employeeId || '',
      'faculty.designation': context.faculty?.designation || '',
      'faculty.email': context.faculty?.email || '',
      'department.name': context.department?.name || '',
      'department.code': context.department?.code || '',
      'department.hod.name': context.department?.hod?.name || '',
      'currentDate': context.currentDate || '',
      'academicYear': context.academicYear || '',
      'semester': context.semester || '',
    };
    return map[token] || '';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-2">
            <Database size={16} className="text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-800">Campus Data Fields</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white rounded-lg transition-colors">
            <X size={14} />
          </button>
        </div>

        <p className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100 bg-gray-50">
          Click a field to insert it as a dynamic token. It will be filled with real data on export.
        </p>

        {/* Categories */}
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse h-10 bg-gray-100 rounded-xl" />
              ))}
            </div>
          ) : (
            categories.map((cat) => (
              <div key={cat.id}>
                <button
                  onClick={() => setSelectedDataset(selectedDataset === cat.id ? null : cat.id)}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-xs font-semibold text-gray-700">{cat.label}</span>
                  <ChevronRight
                    size={13}
                    className={`text-gray-400 transition-transform ${selectedDataset === cat.id ? 'rotate-90' : ''}`}
                  />
                </button>

                {selectedDataset === cat.id && (
                  <div className="px-4 pb-3 space-y-1.5">
                    {cat.tokens.map(({ token, label }) => {
                      const preview = resolvePreview(token);
                      return (
                        <button
                          key={token}
                          onClick={() => onInsert(token)}
                          className="w-full flex items-center justify-between bg-blue-50 hover:bg-blue-100 rounded-xl px-3 py-2 transition-colors text-left group"
                        >
                          <div>
                            <p className="text-xs font-medium text-blue-800">{label}</p>
                            {preview && (
                              <p className="text-[10px] text-blue-600 mt-0.5">{preview}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Tag size={11} className="text-blue-400" />
                            <span className="text-[10px] font-mono text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                              {`{{${token}}}`}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CampusDataFieldPicker;
