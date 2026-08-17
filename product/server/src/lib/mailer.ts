import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (env.EMAIL_PROVIDER !== 'SMTP' || !env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
  }
  return transporter;
}

/**
 * Sends a transactional email. Returns whether the message was actually
 * dispatched. When EMAIL_PROVIDER is not configured, this logs loudly
 * instead of pretending delivery succeeded, so misconfiguration is visible
 * in server logs rather than a silent, undeliverable no-op.
 */
export async function sendMail(input: SendMailInput): Promise<{ delivered: boolean }> {
  const client = getTransporter();
  if (!client) {
    logger.warn(`EMAIL_PROVIDER is not configured (SMTP) — email to ${input.to} ("${input.subject}") was not sent. Set EMAIL_PROVIDER=SMTP and SMTP_* env vars to enable delivery.`);
    return { delivered: false };
  }

  try {
    await client.sendMail({
      from: env.SMTP_FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    return { delivered: true };
  } catch (error) {
    logger.error(`Failed to send email to ${input.to}: ${(error as Error).message}`);
    return { delivered: false };
  }
}
