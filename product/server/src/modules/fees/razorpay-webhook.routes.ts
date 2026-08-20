import express, { Router } from 'express';
import { StudentFeeController } from './student-fee.controller';

const router = Router();

// This server-to-server endpoint is deliberately outside CampusOS JWT auth.
// Its security boundary is the HMAC over the exact raw request bytes.
router.post('/razorpay/webhook', express.raw({ type: 'application/json', limit: '1mb' }), StudentFeeController.webhook);

export default router;
