# Phase 8 – Native Notification Architecture Report

## Executive Summary
This document specifies the system architecture for **Native Push Notifications & Deep-Link Routing** in GEETORUS CAMPUSOS.

---

## 1. Native Push Notification Architecture

```mermaid
sequenceDiagram
    participant Event as Triggering System Event
    participant Engine as NotificationEngineService
    participant DB as SQLite DB
    participant Socket as Socket.IO Bus
    participant Push as FCM / APNs Push Adapter
    participant Mobile as Mobile App / Web Client

    Event->>Engine: dispatchNativeNotification(params)
    Engine->>DB: Persist Notification record & DeepLink URI
    Engine->>Socket: Emit real-time socket event to user room
    Engine->>DB: Query active device tokens (DeviceToken table)
    Engine->>Push: Send push payload with deepLink URL
    Push-->>Mobile: Deliver native push alert with deepLink
    Mobile->>Mobile: Open target screen via deepLink (campusos://...)
```

---

## 2. Notification Delivery Tiers

| Delivery Channel | Protocol | Delivery Target | Latency |
|---|---|---|---|
| **IN_APP** | Persistence DB Query | React Web ERP Portal | Instant |
| **SOCKET_EVENT** | Socket.IO Event Bus | Web & Mobile Sockets | < 100ms |
| **PUSH** | FCM / APNs Provider | iOS & Android Apps | Real-time |
