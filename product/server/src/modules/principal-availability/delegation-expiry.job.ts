import { PrincipalAvailabilityResolver } from './availability.resolver';
import { logger } from '../../utils/logger';

export class DelegationExpiryJob {
  /**
   * Periodically check and auto-expire delegations past their validity period
   */
  static async checkExpiry() {
    try {
      const context = await PrincipalAvailabilityResolver.resolveContext();
      logger.info(`[Job] Delegation expiry check executed. Current principal status: ${context.principalStatus}`);
      return context;
    } catch (err) {
      logger.error('[Job] Delegation expiry check error:', err);
    }
  }

  static startCron(intervalMs = 60000) {
    logger.info('Starting Delegation Expiry Background Job (interval: 60s)');
    setInterval(() => {
      this.checkExpiry();
    }, intervalMs);
  }
}
