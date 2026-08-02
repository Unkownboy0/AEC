# Phase 8 – API Route Matrix Report

## Overview
This document specifies all REST API endpoints created for Native Notifications Engine & Interactive Audit Timeline.

---

## Endpoint Specifications

| Endpoint | Method | Guard | Description |
|---|---|---|---|
| `/api/enterprise/timeline` | `GET` | `reports:view` | Retrieve unified chronological interactive activity feed |
| `/api/notifications` | `GET` | `requireAuth` | Retrieve paginated user notifications |
| `/api/notifications/:id/read` | `POST` | `requireAuth` | Mark single notification as read |
| `/api/notifications/read-all` | `POST` | `requireAuth` | Mark all notifications as read |
| `/api/notifications/device-token` | `POST` | `requireAuth` | Register or update FCM/APNs mobile device token |
