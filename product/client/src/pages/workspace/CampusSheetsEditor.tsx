import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Minus, Bold, Italic, AlignLeft, AlignCenter, AlignRight,
  Download, Share2, ChevronDown, Loader2, CheckCircle2, AlertCircle,
  Palette, Grid, Sigma, Save
} from 'lucide-react';
import { workspaceApi, WorkspaceDocumentDetail, downloadBlob } from '../../services/workspace.api';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../components/ui/Toast';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CellAddress { row: number; col: number; }
interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  bg?: string;
  align?: 'left' | 'center' | 'right';
  format?: string; // number format
  fontSize?: number;
  wrap?: boolean;
}
interface CellData {
  value?: string | number | null;
  formula?: string;
  displayValue?: string;
  style?: CellStyle;
}
interface SheetData {
  id: string;
  name: string;
  cells: Record<string, CellData>;
  frozenRows?: number;
  frozenCols?: number;
  colWidths?: Record<number, number>;
  rowHeights?: Record<number, number>;
  hiddenRows?: number[];
  hiddenCols?: number[];
}
interface WorkbookData {
  sheets: SheetData[];
  activeSheet: string;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

const NUM_ROWS = 100;
const NUM_COLS = 26;

function colToLetter(col: number): string {
  return String.fromCharCode(65 + col);
}

function cellRef(row: number, col: number): string {
  return `${colToLetter(col)}${row + 1}`;
}

function parseRef(ref: string): CellAddress | null {
  const match = ref.match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;
  return { col: match[1].charCodeAt(0) - 65, row: parseInt(match[2]) - 1 };
}

// Very lightweight formula evaluator (for basic math + SUM/AVG/COUNT)
function evaluateFormula(formula: string, cells: Record<string, CellData>): string {
  try {
    const f = formula.startsWith('=') ? formula.slice(1).trim() : formula;

    // SUM(A1:B3)
    const sumMatch = f.match(/^SUM\(([A-Z]+\d+):([A-Z]+\d+)\)$/i);
    if (sumMatch) {
      const start = parseRef(sumMatch[1].toUpperCase());
      const end = parseRef(sumMatch[2].toUpperCase());
      if (start && end) {
        let total = 0;
        for (let r = start.row; r <= end.row; r++) {
          for (let c = start.col; c <= end.col; c++) {
            const v = parseFloat(String(cells[cellRef(r, c)]?.value || 0));
            if (!isNaN(v)) total += v;
          }
        }
        return String(total);
      }
    }

    // AVG/AVERAGE(A1:B3)
    const avgMatch = f.match(/^(?:AVG|AVERAGE)\(([A-Z]+\d+):([A-Z]+\d+)\)$/i);
    if (avgMatch) {
      const start = parseRef(avgMatch[1].toUpperCase());
      const end = parseRef(avgMatch[2].toUpperCase());
      if (start && end) {
        let total = 0; let count = 0;
        for (let r = start.row; r <= end.row; r++) {
          for (let c = start.col; c <= end.col; c++) {
            const v = parseFloat(String(cells[cellRef(r, c)]?.value || ''));
            if (!isNaN(v)) { total += v; count++; }
          }
        }
        return count > 0 ? String(Math.round((total / count) * 100) / 100) : '0';
      }
    }

    // COUNT(A1:B3)
    const countMatch = f.match(/^COUNT\(([A-Z]+\d+):([A-Z]+\d+)\)$/i);
    if (countMatch) {
      const start = parseRef(countMatch[1].toUpperCase());
      const end = parseRef(countMatch[2].toUpperCase());
      if (start && end) {
        let count = 0;
        for (let r = start.row; r <= end.row; r++) {
          for (let c = start.col; c <= end.col; c++) {
            if (cells[cellRef(r, c)]?.value != null && cells[cellRef(r, c)]?.value !== '') count++;
          }
        }
        return String(count);
      }
    }

    // MAX/MIN
    const maxMinMatch = f.match(/^(MAX|MIN)\(([A-Z]+\d+):([A-Z]+\d+)\)$/i);
    if (maxMinMatch) {
      const isMax = maxMinMatch[1].toUpperCase() === 'MAX';
      const start = parseRef(maxMinMatch[2].toUpperCase());
      const end = parseRef(maxMinMatch[3].toUpperCase());
      if (start && end) {
        const values: number[] = [];
        for (let r = start.row; r <= end.row; r++) {
          for (let c = start.col; c <= end.col; c++) {
            const v = parseFloat(String(cells[cellRef(r, c)]?.value || ''));
            if (!isNaN(v)) values.push(v);
          }
        }
        if (values.length === 0) return '';
        return String(isMax ? Math.max(...values) : Math.min(...values));
      }
    }

    // Cell references in arithmetic: replace with values
    const resolved = f.replace(/[A-Z]+\d+/gi, (ref) => {
      const v = cells[ref.toUpperCase()]?.value;
      return v != null ? String(v) : '0';
    });

    // eslint-disable-next-line no-new-func
    const result = new Function(`"use strict"; return (${resolved})`)();
    return typeof result === 'number' ? String(Math.round(result * 1000000) / 1000000) : String(result);
  } catch {
    return '#ERR';
  }
}

// ─── Campus Sheets Editor ────────────────────────────────────────────────────

const CampusSheetsEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [doc, setDoc] = useState<WorkspaceDocumentDetail | null>(null);
  const [title, setTitle] = useState('');
  const [workbook, setWorkbook] = useState<WorkbookData>({ sheets: [{ id: 'sheet1', name: 'Sheet 1', cells: {} }], activeSheet: 'sheet1' });
  const [selectedCell, setSelectedCell] = useState<CellAddress>({ row: 0, col: 0 });
  const [selectionRange, setSelectionRange] = useState<{ start: CellAddress; end: CellAddress } | null>(null);
  const [formulaBarValue, setFormulaBarValue] = useState('');
  const [editingCell, setEditingCell] = useState<CellAddress | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
  const [loading, setLoading] = useState(true);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasUnsavedChanges = useRef(false);
  const cellInputRef = useRef<HTMLInputElement>(null);

  // ─── Active sheet ───────────────────────────────────────────────────────────

  const activeSheet = workbook.sheets.find((s) => s.id === workbook.activeSheet) || workbook.sheets[0];

  // ─── Load ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await workspaceApi.getDocument(id);
        setDoc(data);
        setTitle(data.title);
        const parsed = typeof data.contentJson === 'string' ? JSON.parse(data.contentJson) : data.contentJson;
        if (parsed?.sheets) setWorkbook(parsed);
        setSaveState('saved');
      } catch {
        toast.error('Failed to load spreadsheet.');
        navigate('/workspace');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // ─── Autosave ────────────────────────────────────────────────────────────────

  const scheduleAutosave = useCallback(() => {
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(async () => {
      if (!id || !hasUnsavedChanges.current) return;
      setSaveState('saving');
      try {
        await workspaceApi.updateDocument(id, { title, contentJson: workbook });
        setSaveState('saved');
        hasUnsavedChanges.current = false;
      } catch {
        setSaveState('error');
      }
    }, 2000);
  }, [id, title, workbook]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = setTimeout(async () => {
          if (!id) return;
          setSaveState('saving');
          try {
            await workspaceApi.updateDocument(id, { title, contentJson: workbook });
            setSaveState('saved');
          } catch { setSaveState('error'); }
        }, 0);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [id, title, workbook]);

  // ─── Cell Operations ─────────────────────────────────────────────────────────

  const getCellData = (row: number, col: number): CellData => {
    return activeSheet?.cells[cellRef(row, col)] || {};
  };

  const getCellDisplay = (row: number, col: number): string => {
    const cell = getCellData(row, col);
    if (cell.formula) return cell.displayValue || '';
    return cell.value != null ? String(cell.value) : '';
  };

  const setCellData = (row: number, col: number, data: Partial<CellData>) => {
    if (!doc?.permissions.canEdit) return;

    const ref = cellRef(row, col);
    setWorkbook((prev) => {
      const newSheets = prev.sheets.map((s) => {
        if (s.id !== prev.activeSheet) return s;
        const existing = s.cells[ref] || {};
        const updated = { ...existing, ...data };

        // Evaluate formula
        if (updated.formula && updated.formula.startsWith('=')) {
          updated.displayValue = evaluateFormula(updated.formula, s.cells);
        }

        return { ...s, cells: { ...s.cells, [ref]: updated } };
      });
      return { ...prev, sheets: newSheets };
    });

    hasUnsavedChanges.current = true;
    setSaveState('unsaved');
    scheduleAutosave();
  };

  const handleCellClick = (row: number, col: number, e: React.MouseEvent) => {
    // Commit any in-progress edit first
    if (editingCell) commitEdit();
    setSelectedCell({ row, col });
    setSelectionRange(null);
    const cell = getCellData(row, col);
    setFormulaBarValue(cell.formula || String(cell.value || ''));
  };

  const handleCellDoubleClick = (row: number, col: number) => {
    if (!doc?.permissions.canEdit) return;
    setEditingCell({ row, col });
    const cell = getCellData(row, col);
    setEditValue(cell.formula || String(cell.value || ''));
    setTimeout(() => cellInputRef.current?.focus(), 0);
  };

  const commitEdit = () => {
    if (!editingCell) return;
    const { row, col } = editingCell;
    const val = editValue.trim();
    if (val.startsWith('=')) {
      setCellData(row, col, { formula: val, value: undefined });
    } else {
      const num = parseFloat(val);
      setCellData(row, col, { value: isNaN(num) ? val : num, formula: undefined, displayValue: undefined });
    }
    setEditingCell(null);
    setEditValue('');
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitEdit();
      setSelectedCell((prev) => ({ row: Math.min(prev.row + 1, NUM_ROWS - 1), col: prev.col }));
    } else if (e.key === 'Tab') {
      e.preventDefault();
      commitEdit();
      setSelectedCell((prev) => ({ row: prev.row, col: Math.min(prev.col + 1, NUM_COLS - 1) }));
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    }
  };

  const handleFormulaBarChange = (val: string) => {
    setFormulaBarValue(val);
    if (val.startsWith('=')) {
      setCellData(selectedCell.row, selectedCell.col, { formula: val, value: undefined });
    } else {
      const num = parseFloat(val);
      setCellData(selectedCell.row, selectedCell.col, { value: isNaN(num) ? val : num, formula: undefined, displayValue: undefined });
    }
  };

  // ─── Style Operations ────────────────────────────────────────────────────────

  const applyStyle = (style: Partial<CellStyle>) => {
    const cell = getCellData(selectedCell.row, selectedCell.col);
    setCellData(selectedCell.row, selectedCell.col, { ...cell, style: { ...(cell.style || {}), ...style } });
  };

  // ─── Sheet Operations ────────────────────────────────────────────────────────

  const addSheet = () => {
    const newId = `sheet${workbook.sheets.length + 1}`;
    const newName = `Sheet ${workbook.sheets.length + 1}`;
    setWorkbook((prev) => ({
      ...prev,
      sheets: [...prev.sheets, { id: newId, name: newName, cells: {} }],
      activeSheet: newId,
    }));
    hasUnsavedChanges.current = true;
    setSaveState('unsaved');
    scheduleAutosave();
  };

  const renameSheet = (id: string, newName: string) => {
    setWorkbook((prev) => ({
      ...prev,
      sheets: prev.sheets.map((s) => s.id === id ? { ...s, name: newName } : s),
    }));
  };

  // ─── Export ──────────────────────────────────────────────────────────────────

  const handleExport = async (format: 'xlsx' | 'csv' | 'pdf') => {
    if (!id) return;
    try {
      await workspaceApi.updateDocument(id, { title, contentJson: workbook });
      const blob = await workspaceApi.exportDocument(id, format);
      downloadBlob(blob, `${title || 'spreadsheet'}.${format}`);
      toast.success(`Downloaded as ${format.toUpperCase()}`);
    } catch {
      toast.error('Export failed.');
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 size={32} className="animate-spin text-green-500" />
      </div>
    );
  }

  const canEdit = doc?.permissions.canEdit ?? false;
  const selectedCellDisplay = getCellDisplay(selectedCell.row, selectedCell.col);
  const selectedCellStyle = getCellData(selectedCell.row, selectedCell.col).style || {};

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ─── Top Bar ──────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 flex items-center gap-3 px-4 py-2 flex-shrink-0">
        <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={16} className="text-gray-600" />
        </button>
        <input
          type="text"
          value={title}
          onChange={(e) => { setTitle(e.target.value); setSaveState('unsaved'); hasUnsavedChanges.current = true; scheduleAutosave(); }}
          disabled={!canEdit}
          className="flex-1 text-sm font-semibold text-gray-900 bg-transparent outline-none border-b border-transparent focus:border-green-400 transition-colors disabled:cursor-default max-w-xs"
        />
        <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
          {saveState === 'saving' && <><Loader2 size={12} className="animate-spin" /> Saving…</>}
          {saveState === 'saved' && <><CheckCircle2 size={12} className="text-green-500" /> Saved</>}
          {saveState === 'unsaved' && <><AlertCircle size={12} className="text-amber-500" /> Unsaved</>}
          {saveState === 'error' && <><AlertCircle size={12} className="text-red-500" /> Save failed</>}
        </div>

        {/* Export */}
        <div className="relative group">
          <button className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600">
            <Download size={13} /> Export <ChevronDown size={10} />
          </button>
          <div className="absolute right-0 top-full mt-1 bg-white shadow-xl border border-gray-200 rounded-xl z-50 py-1 min-w-[130px] hidden group-hover:block">
            <button onClick={() => handleExport('xlsx')} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50">Export as XLSX</button>
            <button onClick={() => handleExport('csv')} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50">Export as CSV</button>
            <button onClick={() => handleExport('pdf')} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50">Export as PDF</button>
          </div>
        </div>
      </div>

      {/* ─── Toolbar ──────────────────────────────────────────────────── */}
      {canEdit && (
        <div className="bg-white border-b border-gray-200 flex items-center gap-1 px-4 py-1.5 flex-shrink-0 overflow-x-auto">
          <button onClick={() => applyStyle({ bold: !selectedCellStyle.bold })} className={`w-7 h-7 flex items-center justify-center rounded-md transition-all text-sm ${selectedCellStyle.bold ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'}`}><Bold size={13} /></button>
          <button onClick={() => applyStyle({ italic: !selectedCellStyle.italic })} className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${selectedCellStyle.italic ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'}`}><Italic size={13} /></button>
          <div className="w-px h-5 bg-gray-200 mx-0.5" />
          <button onClick={() => applyStyle({ align: 'left' })} className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${selectedCellStyle.align === 'left' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'}`}><AlignLeft size={13} /></button>
          <button onClick={() => applyStyle({ align: 'center' })} className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${selectedCellStyle.align === 'center' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'}`}><AlignCenter size={13} /></button>
          <button onClick={() => applyStyle({ align: 'right' })} className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${selectedCellStyle.align === 'right' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'}`}><AlignRight size={13} /></button>
          <div className="w-px h-5 bg-gray-200 mx-0.5" />
          <select
            onChange={(e) => applyStyle({ format: e.target.value })}
            className="text-xs border border-gray-200 rounded-md px-1.5 py-1 bg-white outline-none cursor-pointer h-7"
            defaultValue=""
          >
            <option value="">General</option>
            <option value="0.00">Number (2 decimal)</option>
            <option value="0%">Percentage</option>
            <option value="₹#,##0.00">Currency (₹)</option>
            <option value="DD/MM/YYYY">Date</option>
          </select>
          <div className="w-px h-5 bg-gray-200 mx-0.5" />
          <div className="relative group">
            <button className="w-7 h-7 flex items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 transition-all"><Palette size={13} /></button>
            <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-2 hidden group-hover:grid grid-cols-5 gap-1 min-w-[120px]">
              {['#ffffff', '#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca', '#e9d5ff', '#fed7aa', '#e5e7eb'].map((color) => (
                <button key={color} onClick={() => applyStyle({ bg: color })} className="w-5 h-5 rounded border border-gray-200 hover:scale-110 transition-transform" style={{ background: color }} />
              ))}
            </div>
          </div>
          <div className="w-px h-5 bg-gray-200 mx-0.5" />
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Sigma size={13} />
            <span className="font-mono">
              {selectedCellDisplay ? (() => {
                const nums = [selectedCellDisplay].map(Number).filter((n) => !isNaN(n));
                return nums.length > 0 ? `Sum: ${nums.reduce((a, b) => a + b, 0)}` : '';
              })() : ''}
            </span>
          </div>
        </div>
      )}

      {/* ─── Formula Bar ───────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 flex items-center gap-2 px-3 py-1 flex-shrink-0">
        <div className="w-16 px-2 py-1 bg-gray-100 rounded-lg text-xs font-mono text-gray-700 text-center flex-shrink-0">
          {cellRef(selectedCell.row, selectedCell.col)}
        </div>
        <div className="w-px h-4 bg-gray-200" />
        <input
          type="text"
          value={formulaBarValue}
          onChange={(e) => handleFormulaBarChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { handleFormulaBarChange(formulaBarValue); e.currentTarget.blur(); } }}
          disabled={!canEdit}
          placeholder="Enter value or formula (=SUM, =AVG, =COUNT…)"
          className="flex-1 text-xs font-mono outline-none bg-transparent text-gray-800"
        />
      </div>

      {/* ─── Grid ───────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto bg-white" style={{ fontSize: '12px' }}>
        <table className="border-collapse w-full" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '48px' }} /> {/* Row number */}
            {Array.from({ length: NUM_COLS }, (_, c) => (
              <col key={c} style={{ width: `${(activeSheet?.colWidths?.[c]) || 100}px` }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th className="bg-gray-50 border border-gray-200 text-gray-500 text-xs font-medium sticky top-0 left-0 z-30 w-12" />
              {Array.from({ length: NUM_COLS }, (_, c) => (
                <th
                  key={c}
                  className="bg-gray-50 border border-gray-200 text-gray-600 text-xs font-medium py-1 px-1 text-center sticky top-0 z-20 select-none"
                >
                  {colToLetter(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: NUM_ROWS }, (_, row) => (
              <tr key={row}>
                <td className="bg-gray-50 border border-gray-200 text-gray-500 text-xs text-center py-0.5 sticky left-0 z-10 select-none">
                  {row + 1}
                </td>
                {Array.from({ length: NUM_COLS }, (_, col) => {
                  const ref = cellRef(row, col);
                  const cell = getCellData(row, col);
                  const isSelected = selectedCell.row === row && selectedCell.col === col;
                  const isEditing = editingCell?.row === row && editingCell?.col === col;
                  const displayVal = cell.formula ? (cell.displayValue || '') : (cell.value != null ? String(cell.value) : '');
                  const style = cell.style || {};

                  return (
                    <td
                      key={col}
                      className={`border border-gray-200 relative p-0 h-6 ${isSelected ? 'outline outline-2 outline-blue-500 outline-offset-[-1px] z-10' : ''}`}
                      style={{ background: style.bg || '#fff', minWidth: '80px' }}
                      onClick={(e) => handleCellClick(row, col, e)}
                      onDoubleClick={() => handleCellDoubleClick(row, col)}
                    >
                      {isEditing ? (
                        <input
                          ref={cellInputRef}
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={handleEditKeyDown}
                          className="absolute inset-0 w-full h-full px-1 text-xs outline-none bg-white border-2 border-blue-500 z-20"
                          style={{ fontFamily: 'monospace' }}
                        />
                      ) : (
                        <span
                          className="block px-1 truncate h-full leading-6"
                          style={{
                            fontWeight: style.bold ? 'bold' : 'normal',
                            fontStyle: style.italic ? 'italic' : 'normal',
                            textAlign: style.align || 'left',
                            color: style.color || '#000',
                            fontSize: style.fontSize ? `${style.fontSize}px` : '12px',
                          }}
                        >
                          {displayVal}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ─── Sheet Tabs ─────────────────────────────────────────────────── */}
      <div className="bg-white border-t border-gray-200 flex items-center gap-1 px-3 py-1.5 flex-shrink-0 overflow-x-auto">
        {workbook.sheets.map((s) => (
          <button
            key={s.id}
            onClick={() => setWorkbook((prev) => ({ ...prev, activeSheet: s.id }))}
            className={`px-3 py-1 text-xs rounded-t border transition-all whitespace-nowrap ${
              s.id === workbook.activeSheet
                ? 'bg-white border-b-white text-green-700 font-semibold border-gray-300'
                : 'text-gray-500 border-transparent hover:bg-gray-100'
            }`}
          >
            {s.name}
          </button>
        ))}
        {canEdit && (
          <button onClick={addSheet} className="flex items-center gap-0.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
            <Plus size={12} /> Sheet
          </button>
        )}
      </div>
    </div>
  );
};

export default CampusSheetsEditor;
