import React, { useState, useEffect } from 'react';
import {
  BookOpen, Plus
} from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import {  } from '../../components/ui/Loading';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import api from '../../lib/axios';

export const Library: React.FC = () => {
  const [books, setBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formRecord, setFormRecord] = useState<any>(null);

  const fetchBooks = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/enterprise/library/books?pageSize=50');
      setBooks(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      title: fd.get('title'),
      isbn: fd.get('isbn'),
      category: fd.get('category'),
      author: fd.get('author'),
      publisher: fd.get('publisher'),
      totalCopies: parseInt(fd.get('totalCopies') as string) || 1,
      location: fd.get('location'),
    };

    try {
      let res;
      if (formRecord) {
        res = await api.put(`/enterprise/library/books/${formRecord.id}`, payload);
      } else {
        res = await api.post('/enterprise/library/books', payload);
      }

      if (res.data?.status === 'success') {
        toast.success(formRecord ? 'Book updated' : 'Book added to catalog');
        setIsFormOpen(false);
        setFormRecord(null);
        fetchBooks();
      }
    } catch (err) {
      toast.error('Failed to catalog book');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Library Catalog</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Browse books inventory, catalog new publications, assign stack row positions, track available copies, and log loans.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => { setFormRecord(null); setIsFormOpen(true); }}>
          <Plus className="mr-1 h-4 w-4" /> Catalog Book
        </Button>
      </div>

      <div className="border bg-card rounded-xl p-5 shadow-sm space-y-4">
        {isLoading ? (
          <div className="space-y-3 py-6">
            {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-muted/30 rounded animate-pulse" />)}
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="h-8 w-8 mx-auto mb-2 text-neutral-400" />
            <p className="text-xs font-semibold">No books cataloged in this section</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto max-w-[90vw] md:max-w-full pb-2 scrollbar-thin"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>ISBN</TableHead>
                <TableHead>Book Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Copies (Avail / Total)</TableHead>
                <TableHead>Stack Location</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {books.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs">{row.isbn}</TableCell>
                  <TableCell className="font-bold">{row.title}</TableCell>
                  <TableCell>{row.author}</TableCell>
                  <TableCell>{row.category}</TableCell>
                  <TableCell>{row.availableCopies} / {row.totalCopies}</TableCell>
                  <TableCell>{row.location || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => { setFormRecord(row); setIsFormOpen(true); }}
                      className="px-2.5 py-1 text-[10px] font-bold bg-primary/10 text-primary rounded hover:bg-primary/20"
                    >
                      Edit Book
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        )}
      </div>

      {/* Catalog Dialog */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={formRecord ? 'Edit Book Details' : 'Catalog New Book'}>
        <form onSubmit={handleSubmit} className="space-y-4 p-4 text-xs font-semibold">
          <Input label="Book Title" name="title" defaultValue={formRecord?.title} required />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="ISBN Code" name="isbn" defaultValue={formRecord?.isbn} required />
            <Input label="Category / Genre" name="category" defaultValue={formRecord?.category} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Author" name="author" defaultValue={formRecord?.author} required />
            <Input label="Publisher" name="publisher" defaultValue={formRecord?.publisher} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Total Copies" name="totalCopies" type="number" defaultValue={formRecord?.totalCopies || 1} required />
            <Input label="Stack Location / Row" name="location" defaultValue={formRecord?.location} placeholder="e.g. Block C, Row 3" />
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Catalog Book</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
