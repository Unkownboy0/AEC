import { Request, Response, NextFunction } from 'express';
import { LibraryService } from './library.service';

const service = new LibraryService();

export class LibraryController {
  static async listBooks(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.listBooks({
        search: req.query.search as string,
        category: req.query.category as string,
        available: req.query.available === 'true',
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      });
      res.json({ status: 'success', data: result });
    } catch (err) { next(err); }
  }

  static async getBook(req: Request, res: Response, next: NextFunction) {
    try {
      const book = await service.getBook(req.params.id);
      res.json({ status: 'success', data: book });
    } catch (err) { next(err); }
  }

  static async createBook(req: Request, res: Response, next: NextFunction) {
    try {
      const book = await service.createBook(req.body);
      res.status(201).json({ status: 'success', data: book });
    } catch (err) { next(err); }
  }

  static async issueBook(req: Request, res: Response, next: NextFunction) {
    try {
      const issue = await service.issueBook({
        ...req.body,
        issuedById: (req as any).user?.id,
      });
      res.status(201).json({ status: 'success', data: issue });
    } catch (err) { next(err); }
  }

  static async returnBook(req: Request, res: Response, next: NextFunction) {
    try {
      const issue = await service.returnBook(req.params.issueId, (req as any).user?.id);
      res.json({ status: 'success', data: issue });
    } catch (err) { next(err); }
  }

  static async renewBook(req: Request, res: Response, next: NextFunction) {
    try {
      const issue = await service.renewBook(req.params.issueId, req.body.newDueDate);
      res.json({ status: 'success', data: issue });
    } catch (err) { next(err); }
  }

  static async reserveBook(req: Request, res: Response, next: NextFunction) {
    try {
      const reservation = await service.reserveBook({
        bookId: req.body.bookId,
        reservedById: (req as any).user?.id,
        reserverType: (req as any).user?.roleName?.includes('Student') ? 'STUDENT' : 'FACULTY',
      });
      res.status(201).json({ status: 'success', data: reservation });
    } catch (err) { next(err); }
  }

  static async listOverdue(req: Request, res: Response, next: NextFunction) {
    try {
      const issues = await service.listOverdueIssues();
      res.json({ status: 'success', data: issues });
    } catch (err) { next(err); }
  }

  static async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const analytics = await service.getAnalytics();
      res.json({ status: 'success', data: analytics });
    } catch (err) { next(err); }
  }
}
