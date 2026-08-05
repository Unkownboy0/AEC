import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
  priority?: 'default' | 'normal' | 'high';
}

/**
 * PushDispatchService — sends native push notifications via Expo Push API.
 * Supports chunked batch delivery, invalid-token cleanup, and retry logging.
 *
 * For production builds (APK/IPA), device tokens must be registered via
 * POST /api/notifications/device-token with the Expo push token.
 */
export class PushDispatchService {
  private static readonly EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
  private static readonly CHUNK_SIZE = 100;

  /**
   * Send push notifications to a list of user IDs.
   * Fetches active device tokens, chunks them, and dispatches.
   */
  static async sendToUsers(userIds: string[], payload: PushPayload): Promise<void> {
    if (userIds.length === 0) return;

    try {
      const tokens = await prisma.deviceToken.findMany({
        where: { userId: { in: userIds }, active: true },
        select: { id: true, token: true, platform: true, userId: true },
      });

      if (tokens.length === 0) {
        logger.info(`[PushDispatch] No active device tokens for ${userIds.length} users`);
        return;
      }

      logger.info(`[PushDispatch] Sending to ${tokens.length} devices for ${userIds.length} users`);
      await this.sendBatch(tokens, payload);
    } catch (err) {
      logger.error('[PushDispatch] Failed to send push notifications:', err);
    }
  }

  /**
   * Send push in chunks of 100 (Expo limit).
   */
  static async sendBatch(
    tokens: Array<{ id: string; token: string; platform: string; userId: string }>,
    payload: PushPayload
  ): Promise<void> {
    const chunks = this.chunk(tokens, this.CHUNK_SIZE);

    for (const chunk of chunks) {
      const messages = chunk.map(t => ({
        to: t.token,
        title: payload.title,
        body: payload.body,
        data: payload.data ?? {},
        sound: payload.sound ?? 'default',
        badge: payload.badge ?? 1,
        channelId: payload.channelId ?? 'circulars',
        priority: payload.priority ?? 'high',
        _tokenId: t.id,
        _userId: t.userId,
      }));

      try {
        const response = await fetch(this.EXPO_PUSH_URL, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(messages),
        });

        if (!response.ok) {
          logger.warn(`[PushDispatch] Expo API responded with ${response.status}`);
          continue;
        }

        const result = await response.json() as any;
        await this.handleExpoResponse(result?.data ?? [], chunk);
      } catch (err) {
        logger.error('[PushDispatch] Chunk send failed:', err);
      }
    }
  }

  /**
   * Handle Expo push response — deactivate invalid tokens.
   */
  private static async handleExpoResponse(
    tickets: Array<{ status: string; message?: string; details?: any }>,
    tokens: Array<{ id: string; token: string }>
  ): Promise<void> {
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      const token = tokens[i];

      if (ticket?.status === 'error') {
        const errorCode = ticket?.details?.error;

        if (errorCode === 'DeviceNotRegistered' || errorCode === 'InvalidCredentials') {
          logger.warn(`[PushDispatch] Deactivating invalid token: ${token?.token?.slice(0, 30)}...`);
          await prisma.deviceToken.update({
            where: { id: token.id },
            data: { active: false },
          }).catch(() => {});
        } else {
          logger.warn(`[PushDispatch] Push error for token ${i}: ${ticket?.message}`);
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
