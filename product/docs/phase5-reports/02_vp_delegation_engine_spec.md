# Phase 5 – Vice Principal Delegation Engine Specification Report

## Overview
This document specifies the authority delegation, review rules, and UI indicators active during Principal failover in GEETORUS CAMPUSOS.

---

## Delegated Capabilities for Vice Principal

When `PRINCIPAL_OFFLINE_MODE` is active:
1. **Level 2 Faculty Leave Sign-Off**: Full approval and rejection authority for HOD-endorsed faculty leave requests.
2. **Institutional Circulars**: Authority to publish `ALL_CAMPUS` and institution-wide circulars.
3. **Workflow Approvals**: Level 2 sign-off on institutional workflow requests.

---

## UI Indicators
- **Header Badge**: Displays `Acting Principal Mode` badge for Vice Principal users when failover is active.
- **Toggle Control**: Principal or Super Admin can toggle failover status directly from the Header controls.
