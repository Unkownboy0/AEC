# Phase 5 – Real-Time Notification & Socket Dispatch Specification Report

## Overview
This document specifies real-time notification dispatches triggered upon failover activation and deactivation in GEETORUS CAMPUSOS.

---

## Event Trigger Matrix

| Event Type | Trigger | Recipient | Notification Message |
|---|---|---|---|
| `ACTING_PRINCIPAL_ACTIVATED` | Failover Status set to `OFFLINE` / `DELEGATED` | Vice Principal Users | `⚡ Acting Principal Mode Activated: Full Level 2 sign-off & institutional sign-off authority delegated to you.` |
| `ACTING_PRINCIPAL_DEACTIVATED` | Failover Status restored to `ONLINE` | Vice Principal Users | `ℹ️ Principal Online Mode Restored: Delegated sign-off authority deactivated.` |
