import { prisma } from '../../lib/prisma';
import { BadRequestException, NotFoundException, ForbiddenException } from '../../utils/exceptions';

export class LibraryService {
  /**
   * List all books with pagination, search, and filters
   */
  async listBooks(filters: {
    search?: string;
    category?: string;
    available?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { search, category, available, page = 1, limit = 20 } = filters;
    const where: any = { deleted: false };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
        { isbn: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category) where.category = category;
    if (available) where.availableCopies = { gt: 0 };

    const [books, total] = await Promise.all([
      prisma.libraryBook.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { title: 'asc' },
      }),
      prisma.libraryBook.count({ where }),
    ]);

    return { books, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Get a single book with issue history
   */
  async getBook(bookId: string) {
    const book = await prisma.libraryBook.findUnique({
      where: { id: bookId },
      include: {
        libraryIssues: {
          orderBy: { issueDate: 'desc' },
          take: 20,
        },
        reservations: {
          where: { status: 'ACTIVE' },
          orderBy: { reservedAt: 'asc' },
        },
      },
    });
    if (!book || book.deleted) throw new NotFoundException('Book not found');
    return book;
  }

  /**
   * Create a new book entry
   */
  async createBook(data: {
    title: string;
    isbn: string;
    category: string;
    author: string;
    publisher: string;
    totalCopies?: number;
    location?: string;
  }) {
    const existing = await prisma.libraryBook.findUnique({ where: { isbn: data.isbn } });
    if (existing) throw new BadRequestException('A book with this ISBN already exists');

    return prisma.libraryBook.create({
      data: {
        ...data,
        totalCopies: data.totalCopies || 1,
        availableCopies: data.totalCopies || 1,
      },
    });
  }

  /**
   * Issue a book to a borrower
   */
  async issueBook(data: {
    bookId: string;
    borrowerId: string;
    borrowerType: string;
    dueDate: string;
    issuedById: string;
  }) {
    const book = await prisma.libraryBook.findUnique({ where: { id: data.bookId } });
    if (!book || book.deleted) throw new NotFoundException('Book not found');
    if (book.availableCopies <= 0) throw new BadRequestException('No copies available for issue');

    // Check if borrower already has this book issued
    const existingIssue = await prisma.libraryIssue.findFirst({
      where: {
        bookId: data.bookId,
        borrowerId: data.borrowerId,
        status: 'ISSUED',
      },
    });
    if (existingIssue) throw new BadRequestException('Borrower already has this book issued');

    const [issue] = await prisma.$transaction([
      prisma.libraryIssue.create({
        data: {
          bookId: data.bookId,
          borrowerId: data.borrowerId,
          borrowerType: data.borrowerType,
          dueDate: new Date(data.dueDate),
          issuedById: data.issuedById,
          status: 'ISSUED',
        },
      }),
      prisma.libraryBook.update({
        where: { id: data.bookId },
        data: { availableCopies: { decrement: 1 } },
      }),
    ]);

    return issue;
  }

  /**
   * Return a book
   */
  async returnBook(issueId: string, returnedById: string) {
    const issue = await prisma.libraryIssue.findUnique({
      where: { id: issueId },
      include: { book: true },
    });
    if (!issue) throw new NotFoundException('Issue record not found');
    if (issue.status === 'RETURNED') throw new BadRequestException('Book already returned');

    const now = new Date();
    let fineAmount = 0;
    if (now > issue.dueDate) {
      const overdueDays = Math.ceil((now.getTime() - issue.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      fineAmount = overdueDays * 1; // ₹1 per day — configurable from SystemSetting
    }

    const [updatedIssue] = await prisma.$transaction([
      prisma.libraryIssue.update({
        where: { id: issueId },
        data: {
          status: 'RETURNED',
          returnDate: now,
          returnedById,
          fineAmount,
          fineStatus: fineAmount > 0 ? 'PENDING' : null,
        },
      }),
      prisma.libraryBook.update({
        where: { id: issue.bookId },
        data: { availableCopies: { increment: 1 } },
      }),
      ...(fineAmount > 0
        ? [
            prisma.libraryFine.create({
              data: {
                issueId,
                borrowerId: issue.borrowerId,
                borrowerType: issue.borrowerType,
                amount: fineAmount,
                reason: 'OVERDUE',
                status: 'PENDING',
              },
            }),
          ]
        : []),
    ]);

    return updatedIssue;
  }

  /**
   * Renew a book (extend due date)
   */
  async renewBook(issueId: string, newDueDate: string) {
    const issue = await prisma.libraryIssue.findUnique({ where: { id: issueId } });
    if (!issue) throw new NotFoundException('Issue record not found');
    if (issue.status !== 'ISSUED') throw new BadRequestException('Only issued books can be renewed');
    if (issue.renewalCount >= issue.maxRenewals) throw new BadRequestException('Maximum renewals reached');

    // Check if there are pending reservations for this book
    const reservations = await prisma.libraryReservation.count({
      where: { bookId: issue.bookId, status: 'ACTIVE' },
    });
    if (reservations > 0) throw new BadRequestException('Book has pending reservations — cannot renew');

    return prisma.libraryIssue.update({
      where: { id: issueId },
      data: {
        dueDate: new Date(newDueDate),
        renewalCount: { increment: 1 },
      },
    });
  }

  /**
   * Reserve a book
   */
  async reserveBook(data: {
    bookId: string;
    reservedById: string;
    reserverType: string;
  }) {
    const book = await prisma.libraryBook.findUnique({ where: { id: data.bookId } });
    if (!book || book.deleted) throw new NotFoundException('Book not found');

    const existingReservation = await prisma.libraryReservation.findFirst({
      where: {
        bookId: data.bookId,
        reservedById: data.reservedById,
        status: 'ACTIVE',
      },
    });
    if (existingReservation) throw new BadRequestException('You already have an active reservation for this book');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7-day reservation window

    return prisma.libraryReservation.create({
      data: {
        bookId: data.bookId,
        reservedById: data.reservedById,
        reserverType: data.reserverType,
        expiresAt,
      },
    });
  }

  /**
   * List overdue issues
   */
  async listOverdueIssues() {
    return prisma.libraryIssue.findMany({
      where: {
        status: 'ISSUED',
        dueDate: { lt: new Date() },
      },
      include: { book: true },
      orderBy: { dueDate: 'asc' },
    });
  }

  /**
   * Get library analytics
   */
  async getAnalytics() {
    const [totalBooks, totalIssued, totalOverdue, totalReservations, totalFinesPending] = await Promise.all([
      prisma.libraryBook.count({ where: { deleted: false } }),
      prisma.libraryIssue.count({ where: { status: 'ISSUED' } }),
      prisma.libraryIssue.count({ where: { status: 'ISSUED', dueDate: { lt: new Date() } } }),
      prisma.libraryReservation.count({ where: { status: 'ACTIVE' } }),
      prisma.libraryFine.count({ where: { status: 'PENDING' } }),
    ]);

    return { totalBooks, totalIssued, totalOverdue, totalReservations, totalFinesPending };
  }
}
