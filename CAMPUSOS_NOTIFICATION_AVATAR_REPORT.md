# CampusOS — Notification Actor Avatar Report

**Date**: August 20, 2026  
**Scope**: Unified Notification Inbox (`UnifiedNotificationInbox.tsx`), Notification Provider (`NotificationProvider.tsx`), and Backend Notification Service (`notification.service.ts`).

---

## 1. Requirement & Design Principle

Notifications in CampusOS fall into two distinct categories:

1. **Human-Triggered Events** (e.g., Leave Approval from HOD, Grade Feedback from Faculty, Document Share from Colleague):
   - Must prominently feature the **sender/actor's profile avatar**.
   - Must feature a small category badge icon (Leave, Task, Message) anchored to the bottom-right corner of the avatar.
2. **System-Generated Events** (e.g., Bus Approaching Stop, Automated Fee Due Reminder, Examination Hall Allocation Published):
   - Must display a crisp **system category icon** (Shield, Bus, CreditCard, Calendar) inside a themed badge container.
   - Must **never** show random or fake human avatars for machine events.

---

## 2. Implementation Details

In `product/client/src/components/notifications/UnifiedNotificationInbox.tsx`:
```tsx
const hasHumanActor = item.actorType === 'HUMAN' || 
  (item.actorType !== 'SYSTEM' && Boolean(item.actorDisplayName || item.senderName || item.actorProfileImage || item.senderAvatar));

const actorName = item.actorDisplayName || item.actorName || item.senderName || (hasHumanActor ? 'Campus User' : 'CampusOS System');
const actorAvatar = item.actorProfileImage || item.actorAvatar || item.senderAvatar;
const actorGender = item.actorGender || item.senderGender;

return (
  <div className="flex items-start gap-3 sm:gap-4 ...">
    {/* Profile Avatar (Human) or System Module Icon (System) */}
    <div className="relative shrink-0 mt-0.5">
      {hasHumanActor ? (
        <ProfileAvatar
          gender={actorGender}
          name={actorName}
          src={actorAvatar}
          size="md"
          shape="circle"
          className="w-10 h-10 ring-2 ring-border/60 shadow-xs"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 shadow-xs flex items-center justify-center text-primary">
          {getEventIcon(item.eventType)}
        </div>
      )}
      {hasHumanActor && (
        <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-surface border border-border shadow-xs text-primary">
          {getEventIcon(item.eventType)}
        </span>
      )}
    </div>
    ...
  </div>
);
```

---

## 3. Verification

1. Verified human sender notifications correctly resolve actor avatar and fallback initials.
2. Verified system notifications (Transport GPS approaching, Fee Reminders) render high-contrast category icons.
3. Verified zero regressions across unread filtering, instant deep links, and optimistic read mark updates.
