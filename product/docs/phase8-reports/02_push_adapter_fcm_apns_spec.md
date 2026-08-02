# Phase 8 – Push Adapter (FCM / APNs) Specification Report

## Overview
This document defines the push notification payload schemas and provider integration for Firebase Cloud Messaging (FCM) and Apple Push Notification service (APNs).

---

## 1. FCM Payload Schema (Android)

```json
{
  "to": "eX_token_android_890123",
  "notification": {
    "title": "📢 Circular Released: Mid-Term Schedule",
    "body": "Mid-term examination timetable has been published for all departments.",
    "sound": "default"
  },
  "data": {
    "deepLink": "campusos://circulars/details/CIR-2026-0001",
    "eventType": "CIRCULAR_PUBLISHED",
    "entityId": "CIR-2026-0001"
  }
}
```

---

## 2. APNs Payload Schema (iOS)

```json
{
  "aps": {
    "alert": {
      "title": "⚡ Acting Principal Mode Activated",
      "body": "Full Level 2 sign-off authority has been delegated to you."
    },
    "badge": 1,
    "sound": "default"
  },
  "deepLink": "campusos://executive/leave-approvals",
  "eventType": "ACTING_PRINCIPAL_ACTIVATED"
}
```
