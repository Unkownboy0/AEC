/*
  CAMPUSOS NOTIFICATIONS — Barrel Export
*/

export { NotificationProvider, useNotifications, useBadges } from './NotificationProvider';
export type { BadgeSummary } from './NotificationProvider';
export { resolveNotificationRoute } from './notification-router';
export { NOTIFICATION_ROUTE_MAP } from './notification-router';
export type {
  AppNotification,
  NotificationEventType,
  NotificationMeta,
  DeviceTokenRegistration,
} from './notification.types';
