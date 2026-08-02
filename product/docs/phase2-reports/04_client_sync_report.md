# Phase 2 – Client Synchronization Report

## Overview
This document explains how frontend components (Header, Sidebar, Navigation, Dashboard) synchronize state upon workspace context switching in GEETORUS CAMPUSOS.

---

## Client Synchronization Architecture

```mermaid
graph TD
    WS[WorkspaceSwitcher UI] -->|1. Click Workspace| AC[AuthContext.switchWorkspace]
    AC -->|2. POST /auth/switch-workspace| API[Express API]
    API -->|3. Return updated token & profile| AC
    AC -->|4. Update geetorus_access_token & geetorus_active_role| LS[localStorage]
    AC -->|5. Update User State| RC[RBACContext]
    RC -->|6. Trigger Re-render| SB[Sidebar Component]
    RC -->|6. Trigger Re-render| PG[PermissionGate Components]
    RC -->|6. Trigger Re-render| DB[Dashboard Widgets]
```

---

## Synchronized Elements

| Element | Triggered Action |
|---|---|
| **Header Badge** | Displays active workspace name (e.g., `Faculty Workspace` or `Mentor Workspace`) |
| **Sidebar Menu** | Dynamically filters navigation links based on active workspace permissions |
| **PermissionGate Components** | Re-evaluates visible buttons, actions, and tabs |
| **Dashboard Widgets** | Loads dashboard layout configured for the active role |
| **Socket Channels** | Subscribes real-time notifications to active role event room |
