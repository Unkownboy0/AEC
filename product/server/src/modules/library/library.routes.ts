import { Router } from 'express';
import { LibraryController } from './library.controller';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

// Public (any authenticated user) — browse catalogue
router.get('/books', LibraryController.listBooks);
router.get('/books/:id', LibraryController.getBook);

// Reserve a book (students + faculty)
router.post('/books/reserve', LibraryController.reserveBook);

// Librarian operations
const librarianGuard = requireRole(['Librarian', 'Library Staff', 'Super Admin', 'College Admin']);
router.post('/books', librarianGuard, LibraryController.createBook);
router.post('/issues', librarianGuard, LibraryController.issueBook);
router.post('/issues/:issueId/return', librarianGuard, LibraryController.returnBook);
router.post('/issues/:issueId/renew', librarianGuard, LibraryController.renewBook);
router.get('/overdue', librarianGuard, LibraryController.listOverdue);
router.get('/analytics', librarianGuard, LibraryController.getAnalytics);

export default router;
