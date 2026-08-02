# Phase 5 – Delegation Audit Trail Schema Report

## Overview
This document specifies the database table and data fields used to audit every delegated action taken by the Vice Principal as Acting Principal.

---

## `principal_delegation_logs` Table Schema

```sql
CREATE TABLE "principal_delegation_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "principalUserId" TEXT NOT NULL,
    "actingUserId" TEXT NOT NULL,
    "actingUserRole" TEXT NOT NULL DEFAULT 'Vice Principal',
    "actionType" TEXT NOT NULL,
    "targetEntityId" TEXT NOT NULL,
    "targetEntityType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "principal_delegation_logs_principalUserId_idx" ON "principal_delegation_logs"("principalUserId");
CREATE INDEX "principal_delegation_logs_actingUserId_idx" ON "principal_delegation_logs"("actingUserId");
CREATE INDEX "principal_delegation_logs_actionType_idx" ON "principal_delegation_logs"("actionType");
CREATE INDEX "principal_delegation_logs_createdAt_idx" ON "principal_delegation_logs"("createdAt");
```
