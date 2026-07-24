import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Download, Clock, CheckCircle, AlertTriangle, RefreshCw, Star, Filter, BookMarked, X } from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';
import api from '../../lib/axios';

const DEMO_ISSUED: any[] = [
  { id: '1', bookTitle: 'Introduction to Algorithms (CLRS)', author: 'Cormen, Leiserson, Rivest & Stein', isbn: '978-0262046305', issuedDate: '2026-07-01', dueDate: '2026-07-28', status: 'ISSUED', fine: 0 },
  { id: '2', bookTitle: 'Clean Code: A Handbook of Agile Software', author: 'Robert C. Martin', isbn: '978-0132350884', issuedDate: '2026-06-20', dueDate: '2026-07-10', status: 'OVERDUE', fine: 26 },
];

const DEMO_CATALOG: any[] = [
  { id: 'b1', title: 'Database System Concepts', author: 'Silberschatz, Korth & Sudarshan', genre: 'Computer Science', available: 3, rating: 4.8 },
  { id: 'b2', title: 'Operating System Concepts', author: 'Silberschatz & Galvin', genre: 'Computer Science', available: 2, rating: 4.7 },
  { id: 'b3', title: 'Computer Networks', author: 'Andrew S. Tanenbaum', genre: 'Networking', available: 5, rating: 4.6 },
  { id: 'b4', title: 'Artificial Intelligence: A Modern Approach', author: 'Russell & Norvig', genre: 'AI/ML', available: 1, rating: 4.9 },
  { id: 'b5', title: 'The Pragmatic Programmer', author: 'David Thomas & Andrew Hunt', genre: 'Engineering', available: 4, rating: 4.8 },
  { id: 'b6', title: 'Design Patterns: GoF', author: 'Gang of Four', genre: 'Software Design', available: 2, rating: 4.7 },
];

export const StudentLibrary: React.FC = () => {
  const [issuedBooks, setIssuedBooks] = useState<any[]>(DEMO_ISSUED);
  const [catalog, setCatalog] = useState<any[]>(DEMO_CATALOG);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genreFilter, setGenreFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'issued' | 'catalog' | 'ebooks'>('issued');

  useEffect(() => {
    const fetchLibrary = async () => {
      try {
        const res = await api.get('/enterprise/library/books');
        if (res.data?.status === 'success' && res.data.data?.length > 0) {
          setCatalog(res.data.data.map((b: any) => ({
            id: b.id,
            title: b.title,
            author: b.author,
            genre: b.genre || 'General',
            available: b.availableCopies ?? b.totalCopies ?? 1,
            rating: 4.5
          })));
        }
      } catch { /* use demo data */ }
      finally { setIsLoading(false); }
    };
    fetchLibrary();
  }, []);

  const overdueCount = issuedBooks.filter(b => b.status === 'OVERDUE').length;
  const totalFine = issuedBooks.reduce((acc, b) => acc + (b.fine || 0), 0);

  const filteredCatalog = catalog.filter(b => {
    const matchSearch = b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase());
    const matchGenre = genreFilter === 'ALL' || b.genre === genreFilter;
    return matchSearch && matchGenre;
  });

  const genres = ['ALL', ...Array.from(new Set(catalog.map(b => b.genre)))];

  if (isLoading) return <Loading text="Loading Library Records..." />;

  return (
    <div className="space-y-6 text-left pb-12 animate-in fade-in duration-200">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-600" /> Digital Library & Issue Ledger
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage book issues, renewals, fines, and e-book access</p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Books Issued', value: `${issuedBooks.length} Active`, icon: <BookMarked className="h-4 w-4 text-indigo-500" />, color: 'text-slate-800 dark:text-white' },
          { label: 'Overdue Books', value: `${overdueCount} Books`, icon: <AlertTriangle className="h-4 w-4 text-rose-500" />, color: overdueCount > 0 ? 'text-rose-600 font-extrabold' : 'text-slate-800 dark:text-white' },
          { label: 'Outstanding Fine', value: `₹${totalFine}`, icon: <Clock className="h-4 w-4 text-amber-500" />, color: totalFine > 0 ? 'text-amber-600 font-extrabold' : 'text-slate-800 dark:text-white' },
          { label: 'Books Available', value: `${catalog.reduce((a,b) => a + b.available, 0)} Copies`, icon: <CheckCircle className="h-4 w-4 text-emerald-500" />, color: 'text-slate-800 dark:text-white' },
        ].map((card, idx) => (
          <div key={idx} className="border bg-card p-4 rounded-2xl shadow-sm flex items-center gap-3">
            <div className="p-2 rounded-xl bg-muted/50">{card.icon}</div>
            <div>
              <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">{card.label}</p>
              <p className={`text-sm font-black mt-0.5 ${card.color}`}>{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b text-xs font-bold gap-1">
        {[{ id: 'issued', label: 'Issued Books' }, { id: 'catalog', label: 'Book Catalog' }, { id: 'ebooks', label: 'E-Resources' }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'issued' && (
        <div className="border bg-card rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-xs font-semibold border-collapse">
            <thead>
              <tr className="border-b bg-muted/20 text-[9px] uppercase font-black text-slate-400 tracking-wider">
                <th className="p-4 text-left">Book Details</th>
                <th className="p-4 text-center">ISBN</th>
                <th className="p-4 text-center">Issued On</th>
                <th className="p-4 text-center">Due Date</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Fine</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {issuedBooks.map((book) => (
                <tr key={book.id} className="hover:bg-muted/10 transition-colors">
                  <td className="p-4">
                    <span className="font-extrabold text-slate-800 dark:text-white block">{book.bookTitle}</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">{book.author}</span>
                  </td>
                  <td className="p-4 text-center text-slate-500 font-mono text-[10px]">{book.isbn}</td>
                  <td className="p-4 text-center">{new Date(book.issuedDate).toLocaleDateString('en-IN')}</td>
                  <td className="p-4 text-center">{new Date(book.dueDate).toLocaleDateString('en-IN')}</td>
                  <td className="p-4 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase ${
                      book.status === 'OVERDUE' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                      book.status === 'RETURNED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      'bg-indigo-50 text-indigo-700 border border-indigo-100'
                    }`}>{book.status}</span>
                  </td>
                  <td className="p-4 text-center font-bold text-rose-600">{book.fine > 0 ? `₹${book.fine}` : '—'}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => toast.success(`Renewal request submitted for "${book.bookTitle}".`)}
                      className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 font-extrabold text-[10px] flex items-center gap-1 mx-auto">
                      <RefreshCw className="h-3 w-3" /> Renew
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex flex-1 items-center gap-2 border px-3 py-1.5 rounded-xl bg-card">
              <Search className="h-4 w-4 text-slate-400" />
              <input type="text" placeholder="Search books or authors..." value={search} onChange={e => setSearch(e.target.value)}
                className="bg-transparent text-xs outline-none w-full font-semibold" />
            </div>
            <select value={genreFilter} onChange={e => setGenreFilter(e.target.value)}
              className="text-xs font-semibold px-3 py-2 border rounded-xl bg-card outline-none">
              {genres.map(g => <option key={g} value={g}>{g === 'ALL' ? 'All Genres' : g}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCatalog.map(book => (
              <div key={book.id} className="border bg-card p-4 rounded-2xl shadow-sm hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-white leading-tight">{book.title}</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">{book.author}</p>
                  </div>
                  <span className="text-[8px] uppercase font-black bg-muted px-1.5 py-0.5 rounded text-slate-500">{book.genre}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                    <span className="text-[10px] font-black text-slate-600">{book.rating}</span>
                  </div>
                  <span className={`text-[9px] font-black ${book.available > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {book.available > 0 ? `${book.available} Copies Available` : 'Checked Out'}
                  </span>
                  <button onClick={() => toast.success(`Reservation request placed for "${book.title}".`)}
                    disabled={book.available === 0}
                    className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-black hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    Reserve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'ebooks' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: 'IEEE Xplore Digital Library', desc: 'Access 5M+ engineering and science papers', url: 'https://ieeexplore.ieee.org', tag: 'Engineering' },
            { title: 'SpringerLink Research Portal', desc: 'Scientific, technical and medical research', url: 'https://link.springer.com', tag: 'Research' },
            { title: 'NPTEL Video Lectures', desc: 'IIT & IISc lecture courses across all disciplines', url: 'https://nptel.ac.in', tag: 'Courses' },
            { title: 'ACM Digital Library', desc: 'Computing and information technology literature', url: 'https://dl.acm.org', tag: 'Computing' },
            { title: 'Elsevier ScienceDirect', desc: 'Journals and books across STEM disciplines', url: 'https://sciencedirect.com', tag: 'Science' },
            { title: 'Project Gutenberg', desc: 'Free access to over 60,000 e-books', url: 'https://gutenberg.org', tag: 'Free' },
          ].map((res, idx) => (
            <a key={idx} href={res.url} target="_blank" rel="noreferrer"
              className="border bg-card p-4 rounded-2xl shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group block">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[8px] uppercase font-black bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 px-2 py-0.5 rounded">{res.tag}</span>
              </div>
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-white group-hover:text-indigo-600 transition-colors">{res.title}</h4>
              <p className="text-[10px] text-slate-400 font-medium mt-1">{res.desc}</p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentLibrary;
