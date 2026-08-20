import { NextFunction, Request, Response } from 'express';
import { BadRequestException } from '../../utils/exceptions';
import { createFeeReceipt, generateFeeReceiptBuffer } from './fee-receipt';
import { StudentFeeService } from './student-fee.service';

const userId = (req: Request) => (req as any).user.id as string;

export class StudentFeeController {
  static portal = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ status: 'success', data: await StudentFeeService.getPortal(userId(req)) }); } catch (error) { next(error); }
  };
  static parentPortal = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ status: 'success', data: await StudentFeeService.getPortalForParent(userId(req), req.params.studentId) }); } catch (error) { next(error); }
  };
  static webhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sig = req.headers['x-razorpay-signature'] as string;
      if (!Buffer.isBuffer(req.body)) throw new BadRequestException('Razorpay webhook raw body is unavailable');
      res.json({ status: 'success', data: await StudentFeeService.handleWebhook(req.body, sig) });
    } catch (error) { next(error); }
  };
  static createOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = String(req.headers['x-idempotency-key'] || req.body?.idempotencyKey || '');
      res.status(201).json({ status: 'success', data: await StudentFeeService.createOnlineOrder(userId(req), req.params.id, req.body?.amount, key || undefined) });
    } catch (error) { next(error); }
  };
  static verifyOnline = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ status: 'success', data: await StudentFeeService.verifyOnlinePayment(userId(req), req.body) }); } catch (error) { next(error); }
  };
  static submitExternal = async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(201).json({ status: 'success', data: await StudentFeeService.submitExternal(userId(req), req.params.id, req.body) }); } catch (error) { next(error); }
  };
  static listExternal = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ status: 'success', data: await StudentFeeService.listExternalPayments(req.query.status as string) }); } catch (error) { next(error); }
  };
  static reviewExternal = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const decision = String(req.body?.decision || '').toUpperCase();
      if (decision !== 'VERIFY' && decision !== 'REJECT') throw new BadRequestException('Decision must be VERIFY or REJECT');
      res.json({ status: 'success', data: await StudentFeeService.reviewExternal(req.params.id, userId(req), decision, req.body?.reason) });
    } catch (error) { next(error); }
  };
  static receipt = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payment: any = await StudentFeeService.receiptForUser(userId(req), req.params.id);
      const buffer = await generateFeeReceiptBuffer(payment);
      const filename = `Fee_Receipt_${payment.receiptNumber || payment.id}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', buffer.length.toString());
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
      res.status(200).send(buffer);
    } catch (error) { next(error); }
  };
}
