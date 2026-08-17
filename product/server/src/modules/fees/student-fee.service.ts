import crypto from 'crypto';
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';
import { BadRequestException, ForbiddenException, NotFoundException } from '../../utils/exceptions';
import { NotificationService } from '../notifications/notification.service';

const EXTERNAL_METHODS = new Set(['BANK_TRANSFER', 'UPI_EXTERNAL', 'CASH_AT_COLLEGE', 'DD', 'NEFT_RTGS', 'CHEQUE', 'OTHER']);

function token(prefix: string): string {
  return `${prefix}-${new Date().getFullYear()}-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
}

function payable(bill: any): number {
  return Math.max(0, Number(bill.amount) + Number(bill.fine || 0) - Number(bill.scholarshipDiscount || 0));
}

export class StudentFeeService {
  private static async studentForUser(userId: string) {
    const student = await prisma.student.findFirst({
      where: { userId, status: 'ACTIVE', deleted: false },
      include: { academicYear: true, semester: true },
    });
    if (!student) throw new ForbiddenException('An active student profile is required');
    return student;
  }

  private static async ownedBill(userId: string, billId: string) {
    const student = await this.studentForUser(userId);
    const bill = await prisma.feeBill.findFirst({
      where: { id: billId, studentId: student.id, deleted: false, archived: false },
      include: { category: true, student: { include: { academicYear: true, semester: true } }, payments: { orderBy: { createdAt: 'desc' } } },
    });
    if (!bill) throw new NotFoundException('Fee invoice not found');
    return { student, bill };
  }

  static async getPortal(userId: string) {
    const student = await this.studentForUser(userId);
    return this.buildPortalResponse(student);
  }

  /**
   * Parent Fee Dashboard Portal
   */
  static async getPortalForParent(parentUserId: string, studentId: string) {
    const parentProfile = await (prisma as any).parentProfile?.findFirst?.({ where: { userId: parentUserId } });
    if (parentProfile) {
      const relation = await (prisma as any).parentStudentRelation?.findFirst?.({
        where: { parentId: parentProfile.id, studentId }
      });
      if (!relation) throw new ForbiddenException('Parent is not authorized to access this child fee account');
    }

    const student = await prisma.student.findFirst({
      where: { id: studentId, status: 'ACTIVE', deleted: false },
      include: { academicYear: true, semester: true }
    });
    if (!student) throw new NotFoundException('Student profile not found');

    return this.buildPortalResponse(student);
  }

  private static async buildPortalResponse(student: any) {
    const bills = await prisma.feeBill.findMany({
      where: { studentId: student.id, deleted: false, archived: false },
      include: { category: true, payments: { orderBy: { createdAt: 'desc' } } },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    });
    const now = new Date();
    const invoices = bills.map((bill: any) => {
      const total = payable(bill);
      const balance = Math.max(0, total - Number(bill.paidAmount || 0));
      const verificationPending = bill.payments.some((p: any) => p.status === 'PENDING_VERIFICATION');
      const status = balance <= 0 ? 'PAID' : verificationPending ? 'VERIFICATION_PENDING'
        : Number(bill.paidAmount) > 0 ? 'PARTIAL' : bill.dueDate < now ? 'OVERDUE' : 'PENDING';
      return {
        id: bill.id,
        invoiceNumber: bill.invoiceNumber || `INV-${bill.id.slice(0, 8).toUpperCase()}`,
        feeName: bill.category.name,
        category: bill.category.name,
        academicYear: bill.academicYearLabel || student.academicYear?.name || null,
        semester: bill.semesterLabel || student.semester?.name || null,
        amount: total,
        baseAmount: bill.amount,
        paidAmount: bill.paidAmount,
        balance,
        scholarshipDiscount: bill.scholarshipDiscount,
        fine: bill.fine,
        dueDate: bill.dueDate,
        status,
        allowPartialPayment: bill.allowPartialPayment,
      };
    });
    const payments = await prisma.feePayment.findMany({
      where: { studentId: student.id, status: { not: 'CREATED' } },
      include: { bill: { include: { category: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const totalFee = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
    const paid = invoices.reduce((sum, invoice) => sum + Number(invoice.paidAmount), 0);
    const pending = invoices.reduce((sum, invoice) => sum + invoice.balance, 0);
    const nextDue = invoices.filter(i => i.balance > 0).map(i => new Date(i.dueDate)).sort((a, b) => a.getTime() - b.getTime())[0] || null;
    return {
      student: { id: student.id, name: `${student.firstName} ${student.lastName}`.trim(), registerNumber: student.admissionNo },
      summary: { totalFee, paid, pending, nextDue, status: pending <= 0 ? 'PAID' : invoices.some(i => i.status === 'VERIFICATION_PENDING') ? 'VERIFICATION_PENDING' : invoices.some(i => i.status === 'OVERDUE') ? 'OVERDUE' : paid > 0 ? 'PARTIAL' : 'PENDING' },
      invoices,
      payments: payments.map((p: any) => ({
        id: p.id, receiptNumber: p.receiptNumber, date: p.paymentDate || p.verifiedAt || p.createdAt,
        feeType: p.bill.category.name, amount: p.amount, method: p.method,
        transactionId: p.providerPaymentId || p.externalReference || p.transactionId,
        status: p.status, rejectionReason: p.rejectionReason, proofUrl: p.proofUrl,
      })),
      gateway: { provider: env.PAYMENT_GATEWAY, enabled: env.PAYMENT_GATEWAY === 'RAZORPAY' && Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) },
    };
  }

  static async createOnlineOrder(userId: string, billId: string, requestedAmount: unknown, idempotencyKey?: string) {
    if (env.PAYMENT_GATEWAY !== 'RAZORPAY' || !env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
      throw new BadRequestException('Online payment gateway is not configured. Use external payment or contact Accounts.');
    }
    const { student, bill } = await this.ownedBill(userId, billId);
    const balance = payable(bill) - Number(bill.paidAmount || 0);
    if (balance <= 0) throw new BadRequestException('This invoice is already paid');
    const amount = Number(requestedAmount ?? balance);
    if (!Number.isFinite(amount) || amount <= 0 || amount > balance) throw new BadRequestException('Payment amount is invalid');
    if (!bill.allowPartialPayment && amount !== balance) throw new BadRequestException('Partial payment is not allowed for this invoice');
    if (idempotencyKey) {
      const existing = await prisma.feePayment.findUnique({ where: { idempotencyKey } });
      if (existing) {
        if (existing.studentId !== student.id || existing.billId !== bill.id) throw new ForbiddenException('Idempotency key does not belong to this invoice');
        return { paymentId: existing.id, orderId: existing.providerOrderId, amount: existing.amount, currency: existing.currency, keyId: env.RAZORPAY_KEY_ID };
      }
    }
    const auth = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST', headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Math.round(amount * 100), currency: 'INR', receipt: token('ORDER'), notes: { billId: bill.id, studentId: student.id } }),
    });
    if (!response.ok) throw new BadRequestException('The payment gateway could not create an order');
    const order: any = await response.json();
    const payment = await prisma.feePayment.create({ data: {
      billId: bill.id, studentId: student.id, transactionId: token('TXN'), source: 'ONLINE', method: 'RAZORPAY',
      status: 'CREATED', amount, provider: 'RAZORPAY', providerOrderId: order.id, idempotencyKey: idempotencyKey || null,
    }});
    return { paymentId: payment.id, orderId: order.id, amount, currency: 'INR', keyId: env.RAZORPAY_KEY_ID };
  }

  static async verifyOnlinePayment(userId: string, input: any) {
    if (!env.RAZORPAY_KEY_SECRET) throw new BadRequestException('Payment gateway is not configured');
    const { orderId, paymentId, signature } = input || {};
    if (!orderId || !paymentId || !signature) throw new BadRequestException('Payment verification details are incomplete');
    const expected = crypto.createHmac('sha256', env.RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');
    const valid = expected.length === String(signature).length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(signature)));
    if (!valid) throw new ForbiddenException('Payment signature verification failed');
    const student = await this.studentForUser(userId);
    const result: any = await prisma.$transaction(async (tx) => {
      // ── Re-fetch inside Serializable transaction (SELECT…FOR UPDATE equivalent) ────
      // Without this re-check, two concurrent /verify requests for the same orderId
      // would both pass the outer signature check and both enter the transaction,
      // resulting in double-credit on the bill and two ledger entries.
      const payment: any = await (tx as any).feePayment.findFirst({
        where: { providerOrderId: orderId, studentId: student.id },
        include: { bill: true }
      });
      if (!payment) throw new NotFoundException('Payment order not found');

      // ── Idempotency guard: already SUCCEEDED → return early, do NOT re-post ────────
      if (payment.status === 'SUCCEEDED') return payment;
      if (payment.status !== 'CREATED') throw new BadRequestException('Payment order is no longer valid');

      // ── providerPaymentId uniqueness guard ────────────────────────────────────────
      // Razorpay sends the same providerPaymentId on retried webhooks. If we already
      // have this ID stored (on a DIFFERENT order), it means a replay attack or cross-
      // order confusion — reject immediately.
      if (paymentId) {
        const providerIdConflict = await (tx as any).feePayment.findFirst({
          where: { providerPaymentId: paymentId, id: { not: payment.id } }
        });
        if (providerIdConflict) {
          throw new BadRequestException('Payment ID already associated with another transaction');
        }
      }

      const balance = payable(payment.bill) - Number(payment.bill.paidAmount || 0);
      if (payment.amount > balance || balance <= 0) throw new BadRequestException('Invoice balance changed; payment requires Accounts review');
      const newPaid = Number(payment.bill.paidAmount || 0) + payment.amount;
      const receiptNumber = token('REC');
      const history = JSON.parse(payment.bill.paymentHistory || '[]');
      history.push({ paymentId: payment.id, receiptNumber, date: new Date(), amount: payment.amount, mode: 'RAZORPAY', transactionId: paymentId });
      await (tx as any).feeBill.update({ where: { id: payment.billId }, data: { paidAmount: newPaid, status: newPaid >= payable(payment.bill) ? 'PAID' : 'PARTIAL', paymentHistory: JSON.stringify(history) } });
      await (tx as any).financeLedgerEntry.create({ data: { entryNumber: token('LED'), entryType: 'PAYMENT', direction: 'CREDIT', amount: payment.amount, description: 'Verified Razorpay fee payment', paymentId: payment.id, billId: payment.billId, studentId: student.id, createdById: userId, sourceType: 'FEE_PAYMENT', sourceId: payment.id, metadataJson: JSON.stringify({ provider: 'RAZORPAY', providerPaymentId: paymentId }) } });
      const updated = await (tx as any).feePayment.update({ where: { id: payment.id }, data: { status: 'SUCCEEDED', providerPaymentId: paymentId, receiptNumber, paymentDate: new Date(), verifiedAt: new Date() } });

      return updated;
    }, { isolationLevel: 'Serializable' });

    // Post-Commit Success Event Dispatch
    if (student.userId && result?.status === 'SUCCEEDED') {
      NotificationService.dispatchDomainEvent({
        eventType: 'PAYMENT_SUCCESS',
        actorUserId: userId,
        entityType: 'FEE_PAYMENT',
        entityId: result.id,
        title: 'Fee Payment Received',
        body: `Your payment of INR ${Number(result.amount || 0).toLocaleString('en-IN')} was verified. Receipt #${result.receiptNumber}`,
        priority: 'HIGH',
        category: 'FEES',
        deepLinkRoute: '/student/fees',
        targetUserIds: [student.userId as string],
        metadata: {
          studentUserId: student.userId || undefined,
          amount: result.amount,
          receiptNumber: result.receiptNumber,
          billId: result.billId,
        },
      }).catch((err) => console.error('[StudentFeeService] Payment notification error:', err));
    }

    return result;
  }

  /**
   * Gateway Webhook Handling with Duplicate-Webhook Protection
   */
  static async handleWebhook(payload: any, signatureHeader?: string) {
    // 1. Duplicate-Webhook Protection: Check if providerPaymentId already processed
    const providerPaymentId = payload?.payload?.payment?.entity?.id || payload?.paymentId;
    const providerOrderId = payload?.payload?.payment?.entity?.order_id || payload?.orderId;

    if (providerOrderId) {
      const existing = await prisma.feePayment.findFirst({ where: { providerOrderId } });
      if (existing && existing.status === 'SUCCEEDED') {
        return { status: 'ignored', reason: 'already_processed', paymentId: existing.id };
      }
    }

    return { status: 'acknowledged', event: payload?.event || 'payment.captured' };
  }

  static async submitExternal(userId: string, billId: string, input: any) {
    const { student, bill } = await this.ownedBill(userId, billId);
    const method = String(input?.method || '').toUpperCase();
    if (!EXTERNAL_METHODS.has(method)) throw new BadRequestException('External payment method is invalid');
    const balance = payable(bill) - Number(bill.paidAmount || 0);
    const amount = Number(input?.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > balance) throw new BadRequestException('Payment amount is invalid');
    if (!bill.allowPartialPayment && amount !== balance) throw new BadRequestException('Partial payment is not allowed for this invoice');
    const reference = String(input?.reference || '').trim();
    if (!reference) throw new BadRequestException('Transaction or reference number is required');
    // Broad dedup: block resubmission of same reference regardless of prior status
    // (prevents: submit → reject → resubmit with same reference to force-credit)
    const duplicate = await prisma.feePayment.findFirst({
      where: { studentId: student.id, externalReference: reference }
    });
    if (duplicate) throw new BadRequestException('This reference number has already been used for a payment on this account');
    const proofUrl = input?.proofUrl ? String(input.proofUrl) : null;
    if (proofUrl && !proofUrl.startsWith('/uploads/')) throw new BadRequestException('Payment proof URL is invalid');
    const paymentDate = input?.paymentDate ? new Date(input.paymentDate) : new Date();
    if (Number.isNaN(paymentDate.getTime()) || paymentDate.getTime() > Date.now() + 5 * 60 * 1000) throw new BadRequestException('Payment date is invalid');
    return prisma.feePayment.create({ data: {
      billId: bill.id, studentId: student.id, transactionId: token('EXT'), source: 'EXTERNAL', method,
      status: 'PENDING_VERIFICATION', amount, externalReference: reference, proofUrl,
      paymentDate, remarks: input?.remarks ? String(input.remarks).slice(0, 2000) : null,
    }});
  }

  static async reviewExternal(paymentId: string, reviewerUserId: string, decision: 'VERIFY' | 'REJECT', reason?: string) {
    const result = await prisma.$transaction(async (tx) => {
      // Re-fetch inside Serializable transaction to prevent concurrent double-approval
      // Two admins approving simultaneously: first commit wins, second finds status != PENDING_VERIFICATION
      const payment: any = await (tx as any).feePayment.findFirst({
        where: { id: paymentId, source: 'EXTERNAL', status: 'PENDING_VERIFICATION' },
        include: { bill: true, student: true }
      });
      if (!payment) throw new NotFoundException('Pending external payment not found (already approved, rejected, or does not exist)');
      if (decision === 'REJECT') {
        const rej = await (tx as any).feePayment.update({
          where: { id: payment.id },
          data: { status: 'REJECTED', rejectionReason: reason || 'Payment proof could not be verified', verifiedByUserId: reviewerUserId, verifiedAt: new Date() },
          include: { student: true }
        });
        return rej;
      }
      const balance = payable(payment.bill) - Number(payment.bill.paidAmount || 0);
      if (payment.amount > balance || balance <= 0) throw new BadRequestException('Payment exceeds the current invoice balance');
      const newPaid = Number(payment.bill.paidAmount || 0) + payment.amount;
      const receiptNumber = token('REC');
      const history = JSON.parse(payment.bill.paymentHistory || '[]');
      history.push({ paymentId: payment.id, receiptNumber, date: new Date(), amount: payment.amount, mode: payment.method, transactionId: payment.externalReference });
      await (tx as any).feeBill.update({ where: { id: payment.billId }, data: { paidAmount: newPaid, status: newPaid >= payable(payment.bill) ? 'PAID' : 'PARTIAL', paymentHistory: JSON.stringify(history) } });
      await (tx as any).financeLedgerEntry.create({ data: { entryNumber: token('LED'), entryType: 'PAYMENT', direction: 'CREDIT', amount: payment.amount, description: `Verified ${payment.method} fee payment`, paymentId: payment.id, billId: payment.billId, studentId: payment.studentId, createdById: reviewerUserId, sourceType: 'FEE_PAYMENT', sourceId: payment.id, metadataJson: JSON.stringify({ externalReference: payment.externalReference }) } });
      return (tx as any).feePayment.update({
        where: { id: payment.id },
        data: { status: 'SUCCEEDED', receiptNumber, verifiedByUserId: reviewerUserId, verifiedAt: new Date() },
        include: { student: true }
      });
    }, { isolationLevel: 'Serializable' });

    // Post-Commit Notification
    if (result.student?.userId) {
      if (decision === 'VERIFY') {
        NotificationService.dispatchDomainEvent({
          eventType: 'PAYMENT_SUCCESS',
          actorUserId: reviewerUserId,
          entityType: 'FEE_PAYMENT',
          entityId: result.id,
          title: 'External Fee Payment Verified',
          body: `Your payment of INR ${result.amount.toLocaleString('en-IN')} has been verified. Receipt #${result.receiptNumber}`,
          priority: 'HIGH',
          category: 'FEES',
          deepLinkRoute: '/student/fees',
          targetUserIds: [result.student.userId],
        }).catch((err) => console.error('[StudentFeeService] External verify notification error:', err));
      } else {
        NotificationService.dispatchDomainEvent({
          eventType: 'PAYMENT_FAILED',
          actorUserId: reviewerUserId,
          entityType: 'FEE_PAYMENT',
          entityId: result.id,
          title: 'Fee Payment Proof Rejected',
          body: `Your submitted fee payment proof was rejected. Reason: ${reason || 'Invalid proof'}`,
          priority: 'HIGH',
          category: 'FEES',
          deepLinkRoute: '/student/fees',
          targetUserIds: [result.student.userId],
        }).catch((err) => console.error('[StudentFeeService] External reject notification error:', err));
      }
    }

    return result;
  }

  static async listExternalPayments(status?: string) {
    const normalized = status ? String(status).toUpperCase() : 'PENDING_VERIFICATION';
    return prisma.feePayment.findMany({
      where: { source: 'EXTERNAL', ...(normalized === 'ALL' ? {} : { status: normalized }) },
      include: { student: true, bill: { include: { category: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  static async receiptForUser(userId: string, paymentId: string) {
    const payment = await prisma.feePayment.findFirst({
      where: { id: paymentId, status: 'SUCCEEDED' },
      include: { student: { include: { user: { select: { id: true } } } }, bill: { include: { category: true } } },
    });
    if (!payment) throw new NotFoundException('Verified receipt not found');
    // Authorization: students can only download their own receipts
    const requestor = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
    const roleName: string = (requestor?.role as any)?.name ?? requestor?.role ?? '';
    const isAdmin = ['Super Admin', 'College Admin', 'Finance Officer', 'Accounts Officer'].includes(roleName);

    if (!isAdmin && (payment as any).student?.user?.id !== userId) {
      throw new ForbiddenException('You are not authorized to download this receipt');
    }
    return payment;
  }
}
