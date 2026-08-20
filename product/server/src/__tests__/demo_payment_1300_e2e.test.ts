import assert from 'assert';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { StudentFeeService } from '../modules/fees/student-fee.service';
import { generateFeeReceiptBuffer } from '../modules/fees/fee-receipt';
import fs from 'fs';
import path from 'path';

const INVOICE = 'QA-DEMO-INR-1300';
const KEY = 'QA-DEMO-INR-1300-IDEMPOTENCY';

async function waitForNotification(userId: string, paymentId: string) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const row = await prisma.notification.findFirst({ where: { recipientId: userId, eventType: 'PAYMENT_SUCCESS', relatedEntityId: paymentId } });
    if (row) return row;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return null;
}

async function run() {
  assert.strictEqual(env.NODE_ENV, 'test');
  assert.strictEqual(env.PAYMENT_GATEWAY, 'DEMO_PAYMENT');
  const bill = await prisma.feeBill.findUnique({ where: { invoiceNumber: INVOICE }, include: { student: true } });
  assert(bill?.student.userId, 'Run seed_demo_payment_fixture first');
  assert.strictEqual(Number(bill.amount), 1300);
  assert.strictEqual(Number(bill.paidAmount), 0);
  const userId = bill.student.userId!;

  const firstOrder = await StudentFeeService.createOnlineOrder(userId, bill.id, 1300, KEY);
  const replayOrder = await StudentFeeService.createOnlineOrder(userId, bill.id, 1300, KEY);
  assert.strictEqual(firstOrder.paymentId, replayOrder.paymentId, 'Order replay must return the original transaction');
  assert.strictEqual(firstOrder.provider, 'DEMO_PAYMENT');
  const settled: any = await StudentFeeService.verifyOnlinePayment(userId, { orderId: firstOrder.orderId });
  const replay: any = await StudentFeeService.verifyOnlinePayment(userId, { orderId: firstOrder.orderId });
  assert.strictEqual(settled.id, replay.id);
  assert.strictEqual(settled.status, 'SUCCEEDED');
  assert(settled.receiptNumber);

  const [updatedBill, payments, ledger, receipt, audit, notification] = await Promise.all([
    prisma.feeBill.findUnique({ where: { id: bill.id } }),
    prisma.feePayment.findMany({ where: { billId: bill.id, idempotencyKey: KEY } }),
    prisma.financeLedgerEntry.findMany({ where: { sourceType: 'FEE_PAYMENT', sourceId: settled.id } }),
    StudentFeeService.receiptForUser(userId, settled.id),
    prisma.auditLog.findMany({ where: { entityType: 'FEE_PAYMENT', entityId: settled.id, action: 'PAY' } }),
    waitForNotification(userId, settled.id),
  ]);
  assert.strictEqual(updatedBill?.paidAmount, 1300);
  assert.strictEqual(updatedBill?.status, 'PAID');
  assert.strictEqual(payments.length, 1, 'Replay must not create a duplicate payment');
  assert.strictEqual(ledger.length, 1, 'Replay must not duplicate the ledger credit');
  assert.strictEqual(audit.length, 1, 'Replay must not duplicate the payment audit');
  assert.strictEqual((receipt as any).receiptNumber, settled.receiptNumber);
  const receiptPdf = await generateFeeReceiptBuffer(receipt as any);
  assert(receiptPdf.length > 2000 && receiptPdf.slice(0, 5).toString() === '%PDF-');
  if (process.env.PDF_QA_DIR) {
    fs.mkdirSync(process.env.PDF_QA_DIR, { recursive: true });
    fs.writeFileSync(path.join(process.env.PDF_QA_DIR, 'demo-payment-1300-receipt.pdf'), receiptPdf);
  }
  assert(notification, 'Student payment notification must be created');
  const accountantVisible = await prisma.feePayment.findFirst({ where: { id: settled.id, status: 'SUCCEEDED' }, include: { student: true, bill: { include: { category: true } } } });
  assert(accountantVisible?.student && accountantVisible.bill.category, 'Settled payment must be visible with accountant context');
  console.log('PASS isolated DEMO_PAYMENT INR 1300 domain E2E');
}

run().catch((error) => { console.error(error); process.exit(1); }).finally(() => prisma.$disconnect());
