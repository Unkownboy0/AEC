import assert from 'assert';
import crypto from 'crypto';
import {
  requirePersistedPaymentProvider,
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
} from '../modules/fees/payment-security';

const keySecret = 'razorpay-payment-secret';
const orderId = 'order_real_123';
const paymentId = 'pay_real_456';
const validPaymentSignature = crypto.createHmac('sha256', keySecret)
  .update(`${orderId}|${paymentId}`)
  .digest('hex');

// A client-supplied demo/provider flag is intentionally absent from this API:
// provider selection must come exclusively from the persisted payment record.
assert.strictEqual(requirePersistedPaymentProvider('RAZORPAY'), 'RAZORPAY');
assert.throws(() => requirePersistedPaymentProvider('CLIENT_DEMO'), /provider is invalid/i);

assert.throws(
  () => verifyRazorpayPaymentSignature({ orderId, paymentId, signature: undefined, keySecret }),
  /signature are required/i,
  'A persisted Razorpay payment cannot be verified without a signature',
);
assert.throws(
  () => verifyRazorpayPaymentSignature({ orderId, paymentId, signature: '00'.repeat(32), keySecret }),
  /signature verification failed/i,
  'A fabricated mode/provider cannot make an invalid Razorpay signature valid',
);
assert.strictEqual(
  verifyRazorpayPaymentSignature({ orderId, paymentId, signature: validPaymentSignature, keySecret }),
  paymentId,
);

const rawBody = Buffer.from(JSON.stringify({ id: 'evt_1', event: 'payment.captured' }));
const webhookSecret = 'razorpay-webhook-secret';
const validWebhookSignature = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
verifyRazorpayWebhookSignature(rawBody, validWebhookSignature, webhookSecret);
assert.throws(
  () => verifyRazorpayWebhookSignature(rawBody, undefined, webhookSecret),
  /signature is required/i,
);
assert.throws(
  () => verifyRazorpayWebhookSignature(Buffer.from(`${rawBody.toString()} `), validWebhookSignature, webhookSecret),
  /verification failed/i,
  'Verification must cover the exact raw bytes, not parsed/re-serialized JSON',
);

console.log('✅ Payment provider-trust and Razorpay raw-webhook signature regressions passed');
