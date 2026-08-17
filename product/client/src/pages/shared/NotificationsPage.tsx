import React from 'react';
import { UnifiedNotificationInbox } from '../../components/notifications/UnifiedNotificationInbox';

export const NotificationsPage: React.FC = () => {
  return (
    <div className="text-left pb-12 animate-in fade-in duration-200">
      <UnifiedNotificationInbox />
    </div>
  );
};

export default NotificationsPage;
