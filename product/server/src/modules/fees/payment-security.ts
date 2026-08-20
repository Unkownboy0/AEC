import crypto from 'crypto';
import { BadRequestException, ForbiddenException, UnauthorizedException } from '../../utils/exceptions';

export type PersistedPaymentProvider = 'RAZORPAY' | 'DEMO_PAYMENT';

export function requirePersistedPaymentProvider(provider: unknown): PersistedPaymentProvider {
  if (provider === 'RAZORPAY' || provider === 'DEMO_PAYMENT') return provider;
  throw new BadRequestException('Payment provider is invalid or missing');
}

function constantTimeHexEqual(expectedHex: string, suppliedHex: unknown): boolean {
  const supplied = String(suppliedHex || '').trim().toLowerCase();
  if (!/^[a-f0-9]+$/.test(supplied) || supplied.length !== expectedHex.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expectedHex, 'hex'), Buffer.from(supplied, 'hex'));
}

export function verifyRazorpayPaymentSignature(input: {
  orderId: string;
  paymentId: unknown;
  signature: unknown;
  keySecret: string | undefined;
}): string {
  if (!input.keySecret) throw new BadRequestException('Razorpay payment verification is not configured');
  const paymentId = String(input.paymentId || '').trim();
  if (!paymentId || !input.signature) throw new BadRequestException('Razorpay payment ID and signature are required');
  const expected = crypto.createHmac('sha256', input.keySecret)
    .update(`${input.orderId}|${paymentId}`)
    .digest('hex');
  if (!constantTimeHexEqual(expected, input.signature)) {
    throw new ForbiddenException('Payment signature verification failed');
  }
  return paymentId;
}

export function verifyRazorpayWebhookSignature(rawBody: Buffer, signature: unknown, webhookSecret: string | undefined): void {
  if (!webhookSecret) throw new BadRequestException('Razorpay webhook verification is not configured');
  if (!signature) throw new UnauthorizedException('Razorpay webhook signature is required');
  const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
  if (!constantTimeHexEqual(expected, signature)) {
    throw new UnauthorizedException('Razorpay webhook signature verification failed');
  }
}
