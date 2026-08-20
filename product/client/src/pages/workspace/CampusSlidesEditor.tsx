import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, Play, ChevronUp, ChevronDown, Type, Image as ImageIcon,
  Square, Minus, AlignLeft, Bold, Italic, Palette, Download, Share2,
  Loader2, CheckCircle2, AlertCircle, Monitor, Maximize2, X, ChevronRight, ChevronLeft
} from 'lucide-react';
import { workspaceApi, WorkspaceDocumentDetail, downloadBlob } from '../../services/workspace.api';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../components/ui/Toast';

// ─── Types ───────────────────────────────────────────────────────────────────

type ElementType = 'text' | 'image' | 'shape' | 'table';
type SlideLayout = 'TITLE' | 'TITLE_CONTENT' | 'TWO_COLUMN' | 'BLANK' | 'IMAGE' | 'SECTION';

interface SlideElement {
  id: string;
  type: ElementType;
  x: number; y: number; width: number; height: number; // percent of slide
  content?: string;
  src?: string;
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  color?: string;
  bg?: string;
  textAlign?: 'left' | 'center' | 'right';
  zIndex?: number;
}

interface Slide {
  id: string;
  layout: SlideLayout;
  elements: SlideElement[];
  bg?: string;
  notes?: string;
  transition?: 'NONE' | 'FADE' | 'SLIDE';
}

interface PresentationData {
  slides: Slide[];
  theme: {
    primaryColor: string;
    accentColor: string;
    font: string;
    bgColor: string;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function newSlide(layout: SlideLayout = 'TITLE_CONTENT'): Slide {
  const id = `slide_${Date.now()}`;
  const elements: SlideElement[] = [];

  if (layout === 'TITLE') {
    elements.push({ id: `el_${Date.now()}_1`, type: 'text', x: 10, y: 30, width: 80, height: 20, content: 'Slide Title', fontSize: 36, bold: true, color: '#1a1a1a', textAlign: 'center', zIndex: 1 });
    elements.push({ id: `el_${Date.now()}_2`, type: 'text', x: 15, y: 55, width: 70, height: 12, content: 'Subtitle text here', fontSize: 20, color: '#555', textAlign: 'center', zIndex: 1 });
  } else if (layout === 'TITLE_CONTENT') {
    elements.push({ id: `el_${Date.now()}_1`, type: 'text', x: 5, y: 5, width: 90, height: 15, content: 'Slide Title', fontSize: 28, bold: true, color: '#1a1a1a', zIndex: 1 });
    elements.push({ id: `el_${Date.now()}_2`, type: 'text', x: 5, y: 25, width: 90, height: 65, content: '• Point 1\n• Point 2\n• Point 3', fontSize: 18, color: '#333', zIndex: 1 });
  } else if (layout === 'SECTION') {
    elements.push({ id: `el_${Date.now()}_1`, type: 'text', x: 5, y: 35, width: 90, height: 30, content: 'Section Title', fontSize: 40, bold: true, color: '#fff', textAlign: 'center', bg: '#1a73e8', zIndex: 1 });
  }

  return { id, layout, elements, bg: '#ffffff', notes: '', transition: 'NONE' };
}

// ─── Slide Thumbnail ─────────────────────────────────────────────────────────

const SlideThumbnail: React.FC<{ slide: Slide; index: number; isActive: boolean; onClick: () => void; theme: PresentationData['theme'] }> =
  ({ slide, index, isActive, onClick, theme }) => (
    <button
      onClick={onClick}
      className={`relative w-full aspect-[16/9] rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
        isActive ? 'border-blue-500 shadow-md' : 'border-gray-200 hover:border-gray-400'
      }`}
      style={{ background: slide.bg || '#fff' }}
    >
      {/* Mini render */}
      {slide.elements.map((el) => (
        <div
          key={el.id}
          className="absolute overflow-hidden"
          style={{
            left: `${el.x}%`, top: `${el.y}%`, width: `${el.width}%`, height: `${el.height}%`,
            fontSize: `${(el.fontSize || 14) * 0.3}px`,
            fontWeight: el.bold ? 'bold' : 'normal',
            fontStyle: el.italic ? 'italic' : 'normal',
            color: el.color || '#000',
            background: el.bg || 'transparent',
            textAlign: el.textAlign || 'left',
            whiteSpace: 'pre-line',
          }}
        >
          {el.content}
        </div>
      ))}
      <span className="absolute bottom-1 left-1 text-[8px] text-gray-400">{index + 1}</span>
    </button>
  );

// ─── Campus Slides Editor ─────────────────────────────────────────────────────

const CampusSlidesEditor: React.FC = () => {
  const params = useParams<{ id?: string; documentId?: string }>();
  const id = params.id || params.documentId;
  const { user } = useAuth();
  const navigate = useNavigate();

  const [doc, setDoc] = useState<WorkspaceDocumentDetail | null>(null);
  const [title, setTitle] = useState('');
  const [presentation, setPresentation] = useState<PresentationData>({
    slides: [newSlide('TITLE')],
    theme: { primaryColor: '#1a73e8', accentColor: '#fbbc04', font: 'Inter', bgColor: '#ffffff' },
  });
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [presentMode, setPresentMode] = useState(false);
  const [presentSlide, setPresentSlide] = useState(0);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
  const [loading, setLoading] = useState(true);
  const [showNotes, setShowNotes] = useState(false);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasUnsaved = useRef(false);

  const activeSlide = presentation.slides[activeSlideIndex];

  // ─── Load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await workspaceApi.getDocument(id);
        setDoc(data);
        setTitle(data.title);
        const parsed = typeof data.contentJson === 'string' ? JSON.parse(data.contentJson) : data.contentJson;
        if (parsed?.slides) setPresentation(parsed);
        setSaveState('saved');
      } catch {
        toast.error('Failed to load presentation.');
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
      if (!id || !hasUnsaved.current) return;
      setSaveState('saving');
      try {
        await workspaceApi.updateDocument(id, { title, contentJson: presentation });
        setSaveState('saved');
        hasUnsaved.current = false;
      } catch { setSaveState('error'); }
    }, 2000);
  }, [id, title, presentation]);

  const markUnsaved = () => {
    hasUnsaved.current = true;
    setSaveState('unsaved');
    scheduleAutosave();
  };

  // ─── Slide Operations ─────────────────────────────────────────────────────

  const addSlide = (layout: SlideLayout = 'TITLE_CONTENT') => {
    setPresentation((prev) => {
      const slides = [...prev.slides];
      slides.splice(activeSlideIndex + 1, 0, newSlide(layout));
      return { ...prev, slides };
    });
    setActiveSlideIndex(activeSlideIndex + 1);
    markUnsaved();
  };

  const deleteSlide = () => {
    if (presentation.slides.length <= 1) return;
    setPresentation((prev) => {
      const slides = prev.slides.filter((_, i) => i !== activeSlideIndex);
      return { ...prev, slides };
    });
    setActiveSlideIndex(Math.max(0, activeSlideIndex - 1));
    markUnsaved();
  };

  const moveSlide = (direction: 'up' | 'down') => {
    const idx = activeSlideIndex;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= presentation.slides.length) return;
    setPresentation((prev) => {
      const slides = [...prev.slides];
      [slides[idx], slides[targetIdx]] = [slides[targetIdx], slides[idx]];
      return { ...prev, slides };
    });
    setActiveSlideIndex(targetIdx);
    markUnsaved();
  };

  const updateSlide = (updater: (slide: Slide) => Slide) => {
    setPresentation((prev) => {
      const slides = prev.slides.map((s, i) => i === activeSlideIndex ? updater(s) : s);
      return { ...prev, slides };
    });
    markUnsaved();
  };

  // ─── Element Operations ───────────────────────────────────────────────────

  const addElement = (type: ElementType) => {
    if (!doc?.permissions.canEdit) return;
    const el: SlideElement = {
      id: `el_${Date.now()}`,
      type,
      x: 20, y: 30, width: 60, height: 20,
      content: type === 'text' ? 'Text box' : undefined,
      fontSize: 18,
      color: '#333',
      zIndex: (activeSlide?.elements.length || 0) + 1,
    };
    updateSlide((s) => ({ ...s, elements: [...s.elements, el] }));
    setSelectedElement(el.id);
  };

  const updateElement = (elId: string, updates: Partial<SlideElement>) => {
    updateSlide((s) => ({
      ...s,
      elements: s.elements.map((el) => el.id === elId ? { ...el, ...updates } : el),
    }));
  };

  const deleteElement = (elId: string) => {
    updateSlide((s) => ({ ...s, elements: s.elements.filter((el) => el.id !== elId) }));
    setSelectedElement(null);
  };

  const selectedEl = activeSlide?.elements.find((el) => el.id === selectedElement);

  // ─── Export ─────────────────────────────────────────────────────────────────

  const handleExport = async (format: 'pdf' | 'pptx') => {
    if (!id) return;
    try {
      await workspaceApi.updateDocument(id, { title, contentJson: presentation });
      const blob = await workspaceApi.exportDocument(id, format);
      downloadBlob(blob, `${title || 'presentation'}.${format}`);
      toast.success(`Downloaded as ${format.toUpperCase()}`);
    } catch {
      toast.error('Export failed.');
    }
  };

  // ─── Present Mode ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!presentMode) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') setPresentSlide((p) => Math.min(p + 1, presentation.slides.length - 1));
      if (e.key === 'ArrowLeft') setPresentSlide((p) => Math.max(p - 1, 0));
      if (e.key === 'Escape') setPresentMode(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [presentMode, presentation.slides.length]);

  // ─── Loading ─────────────────────────────────────────────────────────────

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-900"><Loader2 size={32} className="animate-spin text-yellow-400" /></div>;
  }

  const canEdit = doc?.permissions.canEdit ?? false;

  // ─── Present Mode UI ─────────────────────────────────────────────────────

  if (presentMode) {
    const slide = presentation.slides[presentSlide];
    return (
      <div className="fixed inset-0 bg-black flex flex-col z-50">
        <div
          className="flex-1 relative flex items-center justify-center"
          style={{ background: slide?.bg || '#fff' }}
        >
          {slide?.elements.map((el) => (
            <div
              key={el.id}
              className="absolute"
              style={{
                left: `${el.x}%`, top: `${el.y}%`, width: `${el.width}%`, height: `${el.height}%`,
                fontSize: `${el.fontSize || 18}px`,
                fontWeight: el.bold ? 'bold' : 'normal',
                color: el.color || '#000',
                background: el.bg || 'transparent',
                textAlign: el.textAlign || 'left',
                whiteSpace: 'pre-line',
                display: 'flex', alignItems: 'center',
              }}
            >
              {el.content}
            </div>
          ))}
        </div>

        {/* Presenter controls */}
        <div className="bg-black/90 text-white flex items-center justify-between px-6 py-2 flex-shrink-0">
          <button onClick={() => setPresentSlide((p) => Math.max(p - 1, 0))} disabled={presentSlide === 0} className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-30">
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm">{presentSlide + 1} / {presentation.slides.length}</span>
          <button onClick={() => setPresentSlide((p) => Math.min(p + 1, presentation.slides.length - 1))} disabled={presentSlide === presentation.slides.length - 1} className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-30">
            <ChevronRight size={20} />
          </button>
          <button onClick={() => setPresentMode(false)} className="ml-4 p-2 hover:bg-white/10 rounded-lg"><X size={16} /></button>
        </div>
      </div>
    );
  }

  // ─── Editor UI ────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen bg-gray-800 overflow-hidden">

      {/* Top Bar */}
      <div className="bg-gray-900 flex items-center gap-3 px-4 py-2 flex-shrink-0">
        <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-gray-700 rounded-lg">
          <ArrowLeft size={16} className="text-gray-300" />
        </button>
        <input
          type="text"
          value={title}
          onChange={(e) => { setTitle(e.target.value); markUnsaved(); }}
          disabled={!canEdit}
          className="text-sm font-semibold text-white bg-transparent outline-none border-b border-transparent focus:border-yellow-400 max-w-xs"
        />
        <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
          {saveState === 'saving' && <Loader2 size={12} className="animate-spin" />}
          {saveState === 'saved' && <CheckCircle2 size={12} className="text-green-400" />}
          {saveState === 'unsaved' && <AlertCircle size={12} className="text-amber-400" />}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Toolbar buttons */}
          {canEdit && (
            <>
              <button onClick={() => addElement('text')} className="flex items-center gap-1 px-2 py-1 text-xs text-gray-300 hover:bg-gray-700 rounded-lg transition-colors">
                <Type size={13} /> Text
              </button>
              <button onClick={() => addElement('image')} className="flex items-center gap-1 px-2 py-1 text-xs text-gray-300 hover:bg-gray-700 rounded-lg transition-colors">
                <ImageIcon size={13} /> Image
              </button>
              <button onClick={() => addElement('shape')} className="flex items-center gap-1 px-2 py-1 text-xs text-gray-300 hover:bg-gray-700 rounded-lg transition-colors">
                <Square size={13} /> Shape
              </button>
            </>
          )}

          {/* Export */}
          <div className="relative group">
            <button className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors">
              <Download size={13} /> Export <ChevronDown size={10} />
            </button>
            <div className="absolute right-0 top-full mt-1 bg-white shadow-xl border border-gray-200 rounded-xl z-50 py-1 min-w-[130px] hidden group-hover:block">
              <button onClick={() => handleExport('pdf')} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 text-gray-800">Export as PDF</button>
              <button onClick={() => handleExport('pptx')} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 text-gray-800">Export as PPTX</button>
            </div>
          </div>

          <button
            onClick={() => { setPresentSlide(0); setPresentMode(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-gray-900 text-xs rounded-lg font-semibold transition-colors"
          >
            <Play size={13} /> Present
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ─── Slide Panel ──────────────────────────────────────────── */}
        <div className="w-48 bg-gray-900 border-r border-gray-700 flex flex-col overflow-hidden flex-shrink-0">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
            <span className="text-xs text-gray-400 font-medium">SLIDES</span>
            {canEdit && (
              <div className="flex gap-1">
                <button onClick={() => addSlide()} className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"><Plus size={13} /></button>
                <button onClick={deleteSlide} disabled={presentation.slides.length <= 1} className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-red-400 disabled:opacity-30"><Trash2 size={13} /></button>
                <button onClick={() => moveSlide('up')} disabled={activeSlideIndex === 0} className="p-1 hover:bg-gray-700 rounded text-gray-400 disabled:opacity-30"><ChevronUp size={13} /></button>
                <button onClick={() => moveSlide('down')} disabled={activeSlideIndex === presentation.slides.length - 1} className="p-1 hover:bg-gray-700 rounded text-gray-400 disabled:opacity-30"><ChevronDown size={13} /></button>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {presentation.slides.map((slide, i) => (
              <SlideThumbnail
                key={slide.id}
                slide={slide}
                index={i}
                isActive={i === activeSlideIndex}
                onClick={() => { setActiveSlideIndex(i); setSelectedElement(null); }}
                theme={presentation.theme}
              />
            ))}
          </div>
        </div>

        {/* ─── Canvas ───────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
            <div
              className="relative shadow-2xl"
              style={{
                width: 'min(900px, 100%)',
                aspectRatio: '16/9',
                background: activeSlide?.bg || '#fff',
                borderRadius: '4px',
              }}
              onClick={() => setSelectedElement(null)}
            >
              {activeSlide?.elements.map((el) => (
                <div
                  key={el.id}
                  className={`absolute cursor-pointer ${selectedElement === el.id ? 'outline outline-2 outline-blue-400' : 'hover:outline hover:outline-1 hover:outline-gray-300'}`}
                  style={{
                    left: `${el.x}%`, top: `${el.y}%`, width: `${el.width}%`, height: `${el.height}%`,
                    zIndex: el.zIndex || 1,
                    background: el.bg || 'transparent',
                  }}
                  onClick={(e) => { e.stopPropagation(); setSelectedElement(el.id); }}
                >
                  {el.type === 'text' && (
                    <div
                      contentEditable={canEdit}
                      suppressContentEditableWarning
                      className="w-full h-full outline-none p-1 overflow-hidden"
                      style={{
                        fontSize: `${el.fontSize || 18}px`,
                        fontWeight: el.bold ? 'bold' : 'normal',
                        fontStyle: el.italic ? 'italic' : 'normal',
                        color: el.color || '#000',
                        textAlign: el.textAlign || 'left',
                        whiteSpace: 'pre-line',
                      }}
                      onBlur={(e) => updateElement(el.id, { content: e.currentTarget.textContent || '' })}
                    >
                      {el.content}
                    </div>
                  )}
                  {el.type === 'shape' && (
                    <div className="w-full h-full rounded-lg" style={{ background: el.color || '#1a73e8', opacity: 0.8 }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Speaker Notes */}
          {showNotes && (
            <div className="h-32 border-t border-gray-700 bg-gray-900 flex flex-col">
              <p className="text-xs text-gray-400 px-3 py-1 border-b border-gray-700">Speaker Notes</p>
              <textarea
                className="flex-1 bg-transparent text-gray-300 text-xs px-3 py-2 resize-none outline-none"
                placeholder="Add speaker notes…"
                value={activeSlide?.notes || ''}
                onChange={(e) => updateSlide((s) => ({ ...s, notes: e.target.value }))}
              />
            </div>
          )}
        </div>

        {/* ─── Properties Panel ─────────────────────────────────────── */}
        {selectedEl && canEdit && (
          <div className="w-56 bg-gray-900 border-l border-gray-700 flex flex-col overflow-y-auto flex-shrink-0 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium">PROPERTIES</span>
              <button onClick={() => deleteElement(selectedEl.id)} className="p-1 hover:bg-gray-700 rounded text-red-400"><Trash2 size={13} /></button>
            </div>

            {selectedEl.type === 'text' && (
              <>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Font Size</label>
                  <input type="number" value={selectedEl.fontSize || 18} min={8} max={96} onChange={(e) => updateElement(selectedEl.id, { fontSize: parseInt(e.target.value) })} className="w-full text-xs bg-gray-800 text-white border border-gray-600 rounded-lg px-2 py-1 outline-none" />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => updateElement(selectedEl.id, { bold: !selectedEl.bold })} className={`flex-1 py-1.5 rounded text-xs ${selectedEl.bold ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300'}`}><Bold size={12} /></button>
                  <button onClick={() => updateElement(selectedEl.id, { italic: !selectedEl.italic })} className={`flex-1 py-1.5 rounded text-xs ${selectedEl.italic ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300'}`}><Italic size={12} /></button>
                </div>
                <div className="flex gap-1">
                  {(['left', 'center', 'right'] as const).map((a) => (
                    <button key={a} onClick={() => updateElement(selectedEl.id, { textAlign: a })} className={`flex-1 py-1.5 rounded text-[10px] ${selectedEl.textAlign === a ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300'}`}>{a[0].toUpperCase()}</button>
                  ))}
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Text Color</label>
                  <input type="color" value={selectedEl.color || '#000000'} onChange={(e) => updateElement(selectedEl.id, { color: e.target.value })} className="w-full h-8 rounded border border-gray-600 cursor-pointer bg-gray-800" />
                </div>
              </>
            )}

            <div>
              <label className="text-[10px] text-gray-400 block mb-1">Background</label>
              <input type="color" value={selectedEl.bg || '#ffffff'} onChange={(e) => updateElement(selectedEl.id, { bg: e.target.value })} className="w-full h-8 rounded border border-gray-600 cursor-pointer bg-gray-800" />
            </div>

            <div>
              <label className="text-[10px] text-gray-400 block mb-1">Position & Size</label>
              <div className="grid grid-cols-2 gap-1">
                {(['x', 'y', 'width', 'height'] as const).map((prop) => (
                  <div key={prop}>
                    <label className="text-[9px] text-gray-500">{prop}</label>
                    <input type="number" value={selectedEl[prop]} min={0} max={100} onChange={(e) => updateElement(selectedEl.id, { [prop]: parseInt(e.target.value) })} className="w-full text-[10px] bg-gray-800 text-white border border-gray-600 rounded px-1 py-0.5 outline-none" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom notes toggle */}
      <div className="bg-gray-900 border-t border-gray-700 flex items-center justify-between px-4 py-1.5 flex-shrink-0">
        <button onClick={() => setShowNotes(!showNotes)} className="text-xs text-gray-400 hover:text-white transition-colors">
          {showNotes ? 'Hide' : 'Show'} notes
        </button>
        <span className="text-xs text-gray-500">{activeSlideIndex + 1} / {presentation.slides.length}</span>
      </div>
    </div>
  );
};

export default CampusSlidesEditor;
