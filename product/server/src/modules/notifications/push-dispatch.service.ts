import * as admin from 'firebase-admin';
import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';
import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Firebase Admin SDK — lazy singleton, credential-optional
// ---------------------------------------------------------------------------

let _app: admin.app.App | null = null;
let _attempted = false;

function getFirebaseApp(): admin.app.App | null {
  if (_attempted) return _app;
  _attempted = true;

  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const jsonPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  try {
    let serviceAccount: admin.ServiceAccount;

    if (rawJson) {
      serviceAccount = JSON.parse(rawJson.replace(/^\uFEFF/, '')) as admin.ServiceAccount;
    } else if (jsonPath) {
      const candidates = [
        jsonPath,
        path.resolve(process.cwd(), jsonPath),
        path.resolve(__dirname, '../../..', jsonPath),
      ];
      let loadedJson: string | null = null;
      for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
          loadedJson = fs.readFileSync(candidate, 'utf-8');
          break;
        }
      }
      if (!loadedJson) {
        throw new Error(`Service account file not found at: ${jsonPath}`);
      }
      serviceAccount = JSON.parse(loadedJson.replace(/^\uFEFF/, '')) as admin.ServiceAccount;
    } else {
      logger.warn(
        '[FCM] Neither FIREBASE_SERVICE_ACCOUNT_JSON nor FIREBASE_SERVICE_ACCOUNT_PATH is set. ' +
        'FCM background push is disabled. In-app notifications continue to work via polling. ' +
        'To enable true background/killed-state push delivery, set one of these env vars.'
      );
      return null;
    }

    _app = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) }, 'campusos-fcm');
    logger.info('[FCM] Firebase Admin SDK initialised — FCM push dispatch is active.');
    return _app;
  } catch (err) {
    logger.error('[FCM] Failed to initialise Firebase Admin SDK — push disabled:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Payload interface
// ---------------------------------------------------------------------------

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
  priority?: 'default' | 'normal' | 'high';
}

// ---------------------------------------------------------------------------
// PushDispatchService
// ---------------------------------------------------------------------------

/**
 * PushDispatchService — sends native push notifications via Firebase Cloud Messaging (FCM).
 *
 * Uses firebase-admin messaging().sendEach() for batch delivery (up to 500 tokens per call).
 * Automatically deactivates invalid/expired tokens.
 *
 * Device tokens are registered via POST /api/notifications/device-tokens using the FCM
 * registration token obtained by @capacitor/push-notifications on the device.
 *
 * Backend dispatch requires FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH.
 * Without these, the method returns silently (in-app polling still works).
 *
 * NOTE: This replaces the previous Expo Push API implementation. The Expo endpoint
 * (exp.host/--/api/v2/push/send) only works with Expo Go managed builds and silently
 * rejects raw FCM tokens from bare Capacitor apps — which is why push never arrived
 * in background/killed state before this fix.
 */
export interface DispatchResult {
  totalUsers: number;
  totalDevices: number;
  deliveredCount: number;
  failedCount: number;
  skipReason?: string;
}

export class PushDispatchService {
  private static readonly FCM_BATCH_SIZE = 500;

  /**
   * Send push notifications to a list of user IDs.
   * Fetches active device tokens and dispatches via FCM.
   */
  static async sendToUsers(userIds: string[], payload: PushPayload): Promise<DispatchResult> {
    if (userIds.length === 0) {
      return { totalUsers: 0, totalDevices: 0, deliveredCount: 0, failedCount: 0, skipReason: 'NO_RECIPIENT_USER_IDS' };
    }

    const app = getFirebaseApp();
    if (!app) {
      logger.warn('[FCM] Push skipped: Firebase Admin SDK not configured (credentials missing)');
      return { totalUsers: userIds.length, totalDevices: 0, deliveredCount: 0, failedCount: 0, skipReason: 'FCM_NOT_CONFIGURED' };
    }

    try {
      const tokens = await prisma.deviceToken.findMany({
        where: { userId: { in: userIds }, active: true },
        select: { id: true, token: true, platform: true, userId: true },
      });

      if (tokens.length === 0) {
        logger.info(`[FCM] [PUSH_SKIPPED: NO_DEVICE] No active device tokens found for ${userIds.length} user(s)`);
        return { totalUsers: userIds.length, totalDevices: 0, deliveredCount: 0, failedCount: 0, skipReason: 'NO_ACTIVE_DEVICE_TOKENS' };
      }

      logger.info(
        `[FCM] [DISPATCH_START] eventType=${payload.data?.eventType || 'GENERAL'} ` +
        `recipientUserCount=${userIds.length} activeDeviceCount=${tokens.length} pushQueued=true`
      );

      const batchResult = await this.sendBatch(app, tokens, payload);
      logger.info(
        `[FCM] [DISPATCH_COMPLETE] eventType=${payload.data?.eventType || 'GENERAL'} ` +
        `delivered=${batchResult.deliveredCount} failed=${batchResult.failedCount}`
      );
      return {
        totalUsers: userIds.length,
        totalDevices: tokens.length,
        deliveredCount: batchResult.deliveredCount,
        failedCount: batchResult.failedCount,
      };
    } catch (err) {
      logger.error('[FCM] sendToUsers fatal error:', err);
      return { totalUsers: userIds.length, totalDevices: 0, deliveredCount: 0, failedCount: userIds.length, skipReason: 'DISPATCH_ERROR' };
    }
  }

  /**
   * Dispatch FCM messages in batches of 500.
   */
  static async sendBatch(
    app: admin.app.App,
    tokens: Array<{ id: string; token: string; platform: string; userId: string }>,
    payload: PushPayload
  ): Promise<{ deliveredCount: number; failedCount: number }> {
    const chunks = this.chunk(tokens, this.FCM_BATCH_SIZE);
    let totalDelivered = 0;
    let totalFailed = 0;

    const dataPayload: Record<string, string> = {};
    if (payload.data) {
      for (const [k, v] of Object.entries(payload.data)) {
        if (v !== undefined && v !== null) {
          dataPayload[k] = String(v);
        }
      }
    }
    // Ensure default tracking fields exist
    if (!dataPayload.timestamp) dataPayload.timestamp = new Date().toISOString();
    if (!dataPayload.deepLinkRoute && dataPayload.deepLink) dataPayload.deepLinkRoute = dataPayload.deepLink;

    for (const chunk of chunks) {
      const messages: admin.messaging.Message[] = chunk.map((t) => {
        const msg: admin.messaging.Message = {
          token: t.token,
          data: dataPayload,
          notification: {
            title: payload.title,
            body: payload.body,
          },
        };

        const plat = (t.platform || 'android').toLowerCase();

        if (plat === 'android') {
          msg.android = {
            priority: 'high',
            ttl: 2419200 * 1000, // 28 days TTL
            notification: {
              title: payload.title,
              body: payload.body,
              channelId: payload.channelId ?? 'campusos_alerts',
              sound: payload.sound !== null ? (payload.sound ?? 'default') : undefined,
              defaultSound: true,
              defaultVibrateTimings: true,
              visibility: 'public',
              priority: 'high',
            },
          };
        } else if (plat === 'ios') {
          msg.apns = {
            headers: {
              'apns-priority': '10',
              'apns-push-type': 'alert',
            },
            payload: {
              aps: {
                alert: {
                  title: payload.title,
                  body: payload.body,
                },
                badge: payload.badge ?? 1,
                sound: payload.sound !== null ? (payload.sound ?? 'default') : undefined,
                'mutable-content': 1,
              },
            },
          };
        } else if (plat === 'web') {
          msg.webpush = {
            headers: {
              Urgency: 'high',
            },
            notification: {
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              requireInteraction: payload.priority === 'high' || payload.priority === 'default',
            },
            fcmOptions: {
              link: dataPayload.deepLinkRoute || '/',
            },
          };
        }

        return msg;
      });

      try {
        const response = await app.messaging().sendEach(messages);
        totalDelivered += response.successCount;
        totalFailed += response.failureCount;
        await this.handleFcmResponse(response, chunk);
      } catch (err) {
        logger.error('[FCM] Batch sendEach error:', err);
        totalFailed += chunk.length;
      }
    }

    return { deliveredCount: totalDelivered, failedCount: totalFailed };
  }

  /**
   * Handle FCM sendEach response — deactivate invalid/expired tokens.
   */
  private static async handleFcmResponse(
    response: admin.messaging.BatchResponse,
    tokens: Array<{ id: string; token: string }>
  ): Promise<void> {
    const invalidCodes = new Set([
      'messaging/registration-token-not-registered',
      'messaging/invalid-registration-token',
      'messaging/invalid-recipient',
      'messaging/mismatched-credential',
    ]);

    for (let i = 0; i < response.responses.length; i++) {
      const resp = response.responses[i];
      if (!resp.success && resp.error) {
        const code = resp.error.code;
        const token = tokens[i];
        if (invalidCodes.has(code)) {
          logger.warn(`[FCM] Deactivating invalid token (${code}): ${token?.token?.slice(0, 20)}...`);
          await prisma.deviceToken
            .update({ where: { id: token.id }, data: { active: false } })
            .catch(() => {});
        } else {
          logger.warn(`[FCM] Delivery failure for token ${i} (${code}): ${resp.error.message}`);
        }
      }
    }
  }

  private static chunk<T>(arr: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  }
}
