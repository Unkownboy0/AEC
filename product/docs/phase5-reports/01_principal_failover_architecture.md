# Phase 5 – Principal Failover Architecture Report

## Executive Summary
This document specifies the system architecture for **Principal Online/Offline Failover & VP Delegation Service** in GEETORUS CAMPUSOS.

---

## 1. Failover State Architecture

```mermaid
stateDiagram-v2
    [*] --> ONLINE: Principal Logged In & Active
    ONLINE --> OFFLINE: Principal Status = OFFLINE / ON_LEAVE
    ONLINE --> DELEGATED: Manual Delegation Toggle

    state OFFLINE {
        [*] --> VP_Acting_Principal
        VP_Acting_Principal --> Level2_Leaves_Approval: Full Approval Sign-off
        VP_Acting_Principal --> Circular_Publishing: Campus-wide Circulars
        VP_Acting_Principal --> Delegation_Audit: Audit Log Created
    }

    OFFLINE --> ONLINE: Principal Restores Online Status
    DELEGATED --> ONLINE: Principal Deactivates Delegation
```

---

## 2. Status Matrix & Authority Routing

| Status | Active Sign-Off Authority | Target Role | Audit Flag |
|---|---|---|---|
| `ONLINE` | Principal | `Principal` | Standard Sign-off |
| `OFFLINE` | Vice Principal (Acting Principal) | `Vice Principal` | `isActingPrincipal = true` |
| `ON_LEAVE` | Vice Principal (Acting Principal) | `Vice Principal` | `isActingPrincipal = true` |
| `DELEGATED` | Vice Principal (Acting Principal) | `Vice Principal` | `isActingPrincipal = true` |
