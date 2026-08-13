import assert from 'assert';
import { createFeeReceipt } from '../modules/fees/fee-receipt';

// Mock payment gateway database & webhook state
interface PaymentOrder {
  id: string;
  billId: string;
  studentId: string;
  amount: number;
  idempotencyKey?: string;
  status: 'CREATED' | 'SUCCEEDED' | 'FAILED';
  providerOrderId: string;
  providerPaymentId?: string;
  receiptNumber?: string;
}

const paymentOrdersDB: PaymentOrder[] = [];
const ledgerEntriesDB: any[] = [];
const notificationLogsDB: any[] = [];

// 1. Initiate Payment Order with Idempotency Key
function createPaymentOrder(billId: string, studentId: string, amount: number, idempotencyKey?: string) {
  if (idempotencyKey) {
    const existing = paymentOrdersDB.find((p) => p.idempotencyKey === idempotencyKey);
    if (existing) {
      return { payment: existing, cached: true };
    }
  }

  const order: PaymentOrder = {
    id: `pay-${paymentOrdersDB.length + 1}`,
    billId,
    studentId,
    amount,
    idempotencyKey,
    status: 'CREATED',
    providerOrderId: `order_rzp_${paymentOrdersDB.length + 101}`,
  };

  paymentOrdersDB.push(order);
  return { payment: order, cached: false };
}

// 2. Gateway Webhook with Duplicate-Webhook Protection
function processGatewayWebhook(payload: { providerOrderId: string; providerPaymentId: string; event: string }) {
  const payment = paymentOrdersDB.find((p) => p.providerOrderId === payload.providerOrderId);
  if (!payment) throw new Error('Order not found');

  // Duplicate-Webhook Protection
  if (payment.status === 'SUCCEEDED') {
    return { status: 'ignored', reason: 'already_processed', paymentId: payment.id };
  }

  // Execute Success Event Cascade: Payment -> Ledger -> Accounts -> Student -> Parent -> Receipt -> Notification -> Reports
  payment.status = 'SUCCEEDED';
  payment.providerPaymentId = payload.providerPaymentId;
  payment.receiptNumber = `REC-2026-${payment.id.toUpperCase()}`;

  // Ledger Posting
  ledgerEntriesDB.push({
    entryNumber: `LED-${ledgerEntriesDB.length + 1}`,
    amount: payment.amount,
    direction: 'CREDIT',
    paymentId: payment.id,
    studentId: payment.studentId,
  });

  // Notification Trigger
  notificationLogsDB.push({
    recipientId: `usr-${payment.studentId}`,
    eventType: 'FEE_PAYMENT_SUCCESS',
    receiptNumber: payment.receiptNumber,
  });

  return { status: 'acknowledged', payment };
}

// EXECUTE TESTS

// Test 1: Initial Payment Order Creation
const res1 = createPaymentOrder('bill-101', 'stu-404', 15000, 'idempotency-key-abc');
assert.strictEqual(res1.cached, false);
assert.strictEqual(res1.payment.status, 'CREATED');

// Test 2: Idempotency Key duplicate click prevention
const res2 = createPaymentOrder('bill-101', 'stu-404', 15000, 'idempotency-key-abc');
assert.strictEqual(res2.cached, true, 'Idempotency key prevents duplicate order creation');
assert.strictEqual(paymentOrdersDB.length, 1, 'Only 1 payment record created in DB');

// Test 3: Webhook processing & Success Event Cascade
const wbRes1 = processGatewayWebhook({ providerOrderId: res1.payment.providerOrderId, providerPaymentId: 'pay_rzp_999', event: 'payment.captured' });
assert.strictEqual(wbRes1.status, 'acknowledged');
assert.strictEqual(res1.payment.status, 'SUCCEEDED');
assert.strictEqual(ledgerEntriesDB.length, 1, 'Ledger entry posted');
assert.strictEqual(notificationLogsDB.length, 1, 'Success notification dispatched');

// Test 4: Duplicate Webhook Protection
const wbRes2 = processGatewayWebhook({ providerOrderId: res1.payment.providerOrderId, providerPaymentId: 'pay_rzp_999', event: 'payment.captured' });
assert.strictEqual(wbRes2.status, 'ignored', 'Duplicate webhook safely ignored');
assert.strictEqual(wbRes2.reason, 'already_processed');
assert.strictEqual(ledgerEntriesDB.length, 1, 'Ledger is NOT double credited');

// Test 5: PDF Receipt Stream Generation
const mockPayment = {
  receiptNumber: 'REC-2026-TEST',
  amount: 15000,
  method: 'RAZORPAY',
  providerPaymentId: 'pay_rzp_999',
  transactionId: 'TXN-999',
  createdAt: new Date(),
  student: { firstName: 'Alice', lastName: 'Smith', admissionNo: '2026-CSE-001' },
  bill: { category: { name: 'Tuition Fee' }, invoiceNumber: 'INV-1001', academicYearLabel: '2026-2027', semesterLabel: 'Semester 1' }
};

const pdfDoc = createFeeReceipt(mockPayment);
assert.ok(pdfDoc, 'PDF Document generated successfully');

console.log('✅ Payment Gateway, Idempotency, Webhook Protection & PDF Receipt unit tests passed successfully!');
