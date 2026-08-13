import assert from 'assert';

// Mock finance immutability & maker/checker engine
interface LedgerEntry {
  id: string;
  entryType: 'PAYMENT' | 'REVERSAL' | 'CONCESSION' | 'VOUCHER';
  direction: 'DEBIT' | 'CREDIT';
  amount: number;
  description: string;
  postedAt: Date;
}

interface Voucher {
  id: string;
  amount: number;
  status: 'DRAFT' | 'SUBMITTED_TO_AO' | 'APPROVED' | 'REJECTED';
  createdById: string;
  reviewedById?: string;
}

interface AuditLog {
  action: string;
  actorId: string;
  resourceId: string;
  timestamp: Date;
}

const ledgerStore: LedgerEntry[] = [];
const voucherStore: Voucher[] = [];
const auditStore: AuditLog[] = [];

// 1. Maker creates voucher (> ₹50,000 threshold requires AO review)
function createVoucher(actorId: string, amount: number) {
  const requiresAO = amount >= 50000;
  const voucher: Voucher = {
    id: `vouch-${voucherStore.length + 1}`,
    amount,
    status: requiresAO ? 'SUBMITTED_TO_AO' : 'APPROVED',
    createdById: actorId,
  };
  voucherStore.push(voucher);
  auditStore.push({ action: 'VOUCHER_CREATED', actorId, resourceId: voucher.id, timestamp: new Date() });
  return voucher;
}

// 2. Checker (AO) reviews voucher
function reviewVoucher(aoActorId: string, voucherId: string, decision: 'APPROVE' | 'REJECT') {
  const v = voucherStore.find((x) => x.id === voucherId);
  if (!v) throw new Error('Voucher not found');
  if (v.status !== 'SUBMITTED_TO_AO') throw new Error('Voucher is not pending AO review');

  v.status = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
  v.reviewedById = aoActorId;
  auditStore.push({ action: `VOUCHER_${decision}`, actorId: aoActorId, resourceId: v.id, timestamp: new Date() });
  return v;
}

// 3. Post Compensating Reversal Entry (Immutable Ledger Principle)
function createReversalEntry(actorId: string, originalPaymentId: string, amount: number, reason: string) {
  const reversalLedger: LedgerEntry = {
    id: `led-rev-${ledgerStore.length + 1}`,
    entryType: 'REVERSAL',
    direction: 'DEBIT',
    amount,
    description: `COMPENSATING REVERSAL: ${reason} (Original: ${originalPaymentId})`,
    postedAt: new Date(),
  };

  ledgerStore.push(reversalLedger);
  auditStore.push({ action: 'IMMUTABLE_REVERSAL_CREATED', actorId, resourceId: reversalLedger.id, timestamp: new Date() });
  return reversalLedger;
}

// EXECUTE TESTS

// Test 1: Maker/Checker threshold enforcement
const v1 = createVoucher('acc-1', 25000);
assert.strictEqual(v1.status, 'APPROVED', 'Small voucher below ₹50k auto-approved');

const v2 = createVoucher('acc-1', 75000);
assert.strictEqual(v2.status, 'SUBMITTED_TO_AO', 'Large voucher >= ₹50k requires AO approval');

// Test 2: Checker approval
const v2Approved = reviewVoucher('ao-user', v2.id, 'APPROVE');
assert.strictEqual(v2Approved.status, 'APPROVED');
assert.strictEqual(v2Approved.reviewedById, 'ao-user');

// Test 3: Immutable Reversal Posting
const rev = createReversalEntry('ao-user', 'txn-101', 5000, 'Duplicate entry correction');
assert.strictEqual(rev.entryType, 'REVERSAL');
assert.strictEqual(rev.direction, 'DEBIT');
assert.strictEqual(ledgerStore.length, 1);

// Test 4: Financial Audit Logging
assert.strictEqual(auditStore.length, 4);
assert.strictEqual(auditStore[3].action, 'IMMUTABLE_REVERSAL_CREATED');

console.log('✅ Finance immutability, Maker/Checker, and Audit logging unit tests passed successfully!');
