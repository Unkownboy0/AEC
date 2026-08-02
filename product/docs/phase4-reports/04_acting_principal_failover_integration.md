# Phase 4 – Acting Principal Failover Integration Report

## Overview
This document specifies how the Principal Failover / Delegation Engine integrates with Faculty Leave approvals when the Principal is offline or on leave.

---

## Failover Trigger & Action Delegation

1. **System State Resolution**:
   - `FacultyLeaveService` queries `PRINCIPAL_OFFLINE_MODE` from `systemSetting`.
2. **Dynamic Recipient Routing**:
   - If `PRINCIPAL_OFFLINE_MODE` is `true`:
     - Level 2 sign-off notifications are dispatched to active `Vice Principal` users.
     - Vice Principal receives Level 2 approval authority.
     - On approval, sets `isActingPrincipal = true` and `principalRemarks = "Approved by Vice Principal (Acting Principal)"`.
   - If `PRINCIPAL_OFFLINE_MODE` is `false`:
     - Level 2 notifications route normally to the `Principal`.
