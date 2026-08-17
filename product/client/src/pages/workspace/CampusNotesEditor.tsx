import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
  ArrowLeft, Plus, Trash2, Search, ChevronDown, ChevronRight,
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Highlighter,
  CheckCircle2 as ChecklistIcon, Link as LinkIcon, Save,
  Loader2, CheckCircle2, AlertCircle, NotebookPen, FolderOpen,
  Star, StarOff, Pin, Share2, FileText, Download
} from 'lucide-react';
import { workspaceApi, WorkspaceDocumentDetail, downloadBlob } from '../../services/workspace.api';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../components/ui/Toast';

// ─── Types ───────────────────────────────────────────────────────────────────

interface NoteSection {
  id: string;
  name: string;
  color: string;
  pages: NotePage[];
}

interface NotePage {
  id: string;
  title: string;
  contentJson: any;
  pinned?: boolean;
  starred?: boolean;
  tags?: string[];
  color?: string;
  updatedAt?: string;
}

interface NotebookData {
  sections: NoteSection[];
}

const SECTION_COLORS = ['#1a73e8', '#0f9d58', '#f4b400', '#db4437', '#8e24aa', '#00897b', '#e53935', '#fb8c00'];

// ─── Campus Notes Editor ──────────────────────────────────────────────────────

const CampusNotesEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [doc, setDoc] = useState<WorkspaceDocumentDetail | null>(null);
  const [title, setTitle] = useState('');
  const [notebook, setNotebook] = useState<NotebookData>({
    sections: [{ id: 'default', name: 'Quick Notes', color: '#1a73e8', pages: [] }],
  });
  const [activeSectionId, setActiveSectionId] = useState<string>('default');
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
  const [loading, setLoading] = useState(true);
  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasUnsaved = useRef(false);

  const activeSection = notebook.sections.find((s) => s.id === activeSectionId) || notebook.sections[0];
  const activePage = activeSection?.pages.find((p) => p.id === activePageId);

  // ─── TipTap Editor ────────────────────────────────────────────────────────

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Start writing your note…' }),
    ],
    content: { type: 'doc', content: [{ type: 'paragraph' }] },
    onUpdate: () => {
      if (activePageId) {
        hasUnsaved.current = true;
        setSaveState('unsaved');
        scheduleAutosave();
      }
    },
  });

  // ─── Load ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await workspaceApi.getDocument(id);
        setDoc(data);
        setTitle(data.title);
        const parsed = typeof data.contentJson === 'string' ? JSON.parse(data.contentJson) : data.contentJson;
        if (parsed?.sections) {
          setNotebook(parsed);
          const firstSection = parsed.sections[0];
          if (firstSection) {
            setActiveSectionId(firstSection.id);
            if (firstSection.pages.length > 0) {
              setActivePageId(firstSection.pages[0].id);
              if (editor && firstSection.pages[0].contentJson) {
                editor.commands.setContent(firstSection.pages[0].contentJson);
              }
            }
          }
        }
        setSaveState('saved');
      } catch {
        toast.error('Failed to load notebook.');
        navigate('/workspace');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, editor]);

  // ─── Update editor when page changes ─────────────────────────────────────

  useEffect(() => {
    if (!editor || !activePage) return;
    const content = activePage.contentJson;
    if (content) editor.commands.setContent(content);
    else editor.commands.setContent({ type: 'doc', content: [{ type: 'paragraph' }] });
  }, [activePageId, activeSectionId]);

  // ─── Autosave ─────────────────────────────────────────────────────────────

  const scheduleAutosave = useCallback(() => {
    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    autosaveRef.current = setTimeout(async () => {
      if (!id || !hasUnsaved.current) return;
      setSaveState('saving');
      try {
        // Save editor content into the active page first
        const updatedNotebook = { ...notebook };
        const section = updatedNotebook.sections.find((s) => s.id === activeSectionId);
        if (section && activePageId && editor) {
          const page = section.pages.find((p) => p.id === activePageId);
          if (page) {
            page.contentJson = editor.getJSON();
            page.updatedAt = new Date().toISOString();
          }
        }
        await workspaceApi.updateDocument(id, { title, contentJson: updatedNotebook });
        setSaveState('saved');
        hasUnsaved.current = false;
      } catch { setSaveState('error'); }
    }, 500); // Notes autosave faster (500ms)
  }, [id, title, notebook, activeSectionId, activePageId, editor]);

  // ─── Notebook Operations ───────────────────────────────────────────────────

  const addSection = () => {
    const newSection: NoteSection = {
      id: `sec_${Date.now()}`,
      name: 'New Section',
      color: SECTION_COLORS[notebook.sections.length % SECTION_COLORS.length],
      pages: [],
    };
    setNotebook((prev) => ({ sections: [...prev.sections, newSection] }));
    setActiveSectionId(newSection.id);
    setActivePageId(null);
    hasUnsaved.current = true;
    setSaveState('unsaved');
    scheduleAutosave();
  };

  const addPage = () => {
    const newPage: NotePage = {
      id: `page_${Date.now()}`,
      title: 'Untitled Page',
      contentJson: { type: 'doc', content: [{ type: 'paragraph' }] },
      updatedAt: new Date().toISOString(),
    };
    setNotebook((prev) => ({
      sections: prev.sections.map((s) =>
        s.id === activeSectionId ? { ...s, pages: [...s.pages, newPage] } : s
      ),
    }));
    setActivePageId(newPage.id);
    editor?.commands.setContent({ type: 'doc', content: [{ type: 'paragraph' }] });
    hasUnsaved.current = true;
    setSaveState('unsaved');
    scheduleAutosave();
  };

  const updatePageTitle = (pageId: string, newTitle: string) => {
    setNotebook((prev) => ({
      sections: prev.sections.map((s) => ({
        ...s,
        pages: s.pages.map((p) => p.id === pageId ? { ...p, title: newTitle } : p),
      })),
    }));
    hasUnsaved.current = true;
    setSaveState('unsaved');
    scheduleAutosave();
  };

  const togglePageStar = (pageId: string) => {
    setNotebook((prev) => ({
      sections: prev.sections.map((s) => ({
        ...s,
        pages: s.pages.map((p) => p.id === pageId ? { ...p, starred: !p.starred } : p),
      })),
    }));
    hasUnsaved.current = true;
    scheduleAutosave();
  };

  const deletePage = (pageId: string) => {
    setNotebook((prev) => ({
      sections: prev.sections.map((s) => ({
        ...s,
        pages: s.pages.filter((p) => p.id !== pageId),
      })),
    }));
    if (activePageId === pageId) setActivePageId(null);
    hasUnsaved.current = true;
    scheduleAutosave();
  };

  const canEdit = doc?.permissions.canEdit ?? false;

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-amber-50"><Loader2 size={32} className="animate-spin text-amber-500" /></div>;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ─── Section Panel ──────────────────────────────────────── */}
      <div className="w-44 bg-white border-r border-gray-200 flex flex-col overflow-hidden flex-shrink-0">
        {/* Notebook header */}
        <div className="px-3 py-3 border-b border-gray-200">
          <div className="flex items-center gap-1.5">
            <NotebookPen size={16} className="text-amber-500" />
            <span className="text-xs font-bold text-gray-800 truncate">Notebook</span>
          </div>
        </div>

        {/* Sections */}
        <div className="flex-1 overflow-y-auto py-1">
          {notebook.sections.map((section) => (
            <div key={section.id}>
              <button
                onClick={() => setActiveSectionId(section.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${activeSectionId === section.id ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
              >
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: section.color }} />
                <span className="text-xs text-gray-700 truncate flex-1">{section.name}</span>
              </button>
            </div>
          ))}
        </div>

        {canEdit && (
          <div className="p-2 border-t border-gray-200">
            <button
              onClick={addSection}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Plus size={12} /> Add section
            </button>
          </div>
        )}
      </div>

      {/* ─── Pages Panel ─────────────────────────────────────────── */}
      <div className="w-52 bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden flex-shrink-0">
        {/* Section title + search */}
        <div className="px-3 py-3 border-b border-gray-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700">{activeSection?.name}</span>
            {canEdit && (
              <button onClick={addPage} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
                <Plus size={12} className="text-gray-500" />
              </button>
            )}
          </div>
          <div className="relative">
            <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search pages…"
              className="w-full pl-6 pr-2 py-1.5 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-amber-400 transition-colors"
            />
          </div>
        </div>

        {/* Pages list */}
        <div className="flex-1 overflow-y-auto py-1">
          {(activeSection?.pages || [])
            .filter((p) => !search || p.title.toLowerCase().includes(search.toLowerCase()))
            .map((page) => (
              <div
                key={page.id}
                className={`group flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
                  activePageId === page.id ? 'bg-amber-50 border-r-2 border-amber-400' : 'hover:bg-gray-100'
                }`}
                onClick={() => setActivePageId(page.id)}
              >
                <FileText size={12} className={activePageId === page.id ? 'text-amber-500' : 'text-gray-400'} />
                <span className="flex-1 text-xs text-gray-700 truncate">{page.title}</span>
                {page.starred && <Star size={10} className="text-yellow-500 fill-yellow-500 flex-shrink-0" />}
                <div className="opacity-0 group-hover:opacity-100 flex gap-0.5">
                  <button onClick={(e) => { e.stopPropagation(); togglePageStar(page.id); }} className="p-0.5 hover:text-yellow-500 text-gray-400">
                    <Star size={10} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); deletePage(page.id); }} className="p-0.5 hover:text-red-500 text-gray-400">
                    <Trash2 size={10} />
                  </button>
                </div>
              </div>
            ))}
          {(activeSection?.pages || []).length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-xs">No pages yet.</p>
              {canEdit && (
                <button onClick={addPage} className="text-xs text-amber-600 hover:text-amber-700 mt-1">+ Add a page</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Editor ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <div className="bg-white border-b border-gray-200 flex items-center gap-3 px-4 py-2 flex-shrink-0">
          <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={15} className="text-gray-600" />
          </button>
          {activePage ? (
            <input
              type="text"
              value={activePage.title}
              onChange={(e) => updatePageTitle(activePage.id, e.target.value)}
              disabled={!canEdit}
              className="flex-1 text-base font-semibold text-gray-900 bg-transparent outline-none border-b border-transparent focus:border-amber-400 max-w-sm"
            />
          ) : (
            <span className="flex-1 text-sm text-gray-400">{title}</span>
          )}
          <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
            {saveState === 'saving' && <Loader2 size={12} className="animate-spin" />}
            {saveState === 'saved' && <CheckCircle2 size={12} className="text-green-500" />}
            {saveState === 'unsaved' && <AlertCircle size={12} className="text-amber-500" />}
          </div>
          {activePage && (
            <button
              onClick={() => { hasUnsaved.current = true; scheduleAutosave(); }}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Save size={12} /> Save
            </button>
          )}
        </div>

        {/* Toolbar */}
        {canEdit && editor && activePage && (
          <div className="bg-white border-b border-gray-200 flex items-center gap-0.5 px-4 py-1 flex-shrink-0 overflow-x-auto">
            <button onClick={() => editor.chain().focus().toggleBold().run()} className={`w-7 h-7 flex items-center justify-center rounded-md ${editor.isActive('bold') ? 'bg-amber-100 text-amber-700' : 'text-gray-600 hover:bg-gray-100'}`}><Bold size={13} /></button>
            <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`w-7 h-7 flex items-center justify-center rounded-md ${editor.isActive('italic') ? 'bg-amber-100 text-amber-700' : 'text-gray-600 hover:bg-gray-100'}`}><Italic size={13} /></button>
            <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={`w-7 h-7 flex items-center justify-center rounded-md ${editor.isActive('underline') ? 'bg-amber-100 text-amber-700' : 'text-gray-600 hover:bg-gray-100'}`}><UnderlineIcon size={13} /></button>
            <div className="w-px h-5 bg-gray-200 mx-0.5" />
            <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`w-7 h-7 flex items-center justify-center rounded-md ${editor.isActive('bulletList') ? 'bg-amber-100 text-amber-700' : 'text-gray-600 hover:bg-gray-100'}`}><List size={13} /></button>
            <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`w-7 h-7 flex items-center justify-center rounded-md ${editor.isActive('orderedList') ? 'bg-amber-100 text-amber-700' : 'text-gray-600 hover:bg-gray-100'}`}><ListOrdered size={13} /></button>
            <button onClick={() => editor.chain().focus().toggleTaskList().run()} className={`w-7 h-7 flex items-center justify-center rounded-md ${editor.isActive('taskList') ? 'bg-amber-100 text-amber-700' : 'text-gray-600 hover:bg-gray-100'}`}><ChecklistIcon size={13} /></button>
            <div className="w-px h-5 bg-gray-200 mx-0.5" />
            <div className="relative group">
              <button className={`w-7 h-7 flex items-center justify-center rounded-md text-gray-600 hover:bg-gray-100`}><Highlighter size={13} /></button>
              <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-2 hidden group-hover:flex gap-1">
                {['#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca', '#e9d5ff'].map((color) => (
                  <button key={color} onClick={() => editor.chain().focus().toggleHighlight({ color }).run()} className="w-5 h-5 rounded-md border border-gray-200 hover:scale-110 transition-transform" style={{ background: color }} />
                ))}
              </div>
            </div>
            <button
              onClick={() => { const url = window.prompt('URL:'); if (url) editor.chain().focus().setLink({ href: url }).run(); }}
              className={`w-7 h-7 flex items-center justify-center rounded-md ${editor.isActive('link') ? 'bg-amber-100 text-amber-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <LinkIcon size={13} />
            </button>
          </div>
        )}

        {/* Editor content */}
        {activePage ? (
          <div className="flex-1 overflow-y-auto bg-white p-6">
            <div className="max-w-2xl mx-auto">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{activePage.title}</h1>
              <EditorContent
                editor={editor}
                className="prose prose-sm max-w-none focus:outline-none min-h-[400px] note-editor"
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white">
            <div className="text-center text-gray-400">
              <NotebookPen size={40} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">Select a page or create a new one</p>
              {canEdit && (
                <button onClick={addPage} className="mt-3 text-sm text-amber-600 hover:text-amber-700 font-medium">
                  + New Page
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampusNotesEditor;
