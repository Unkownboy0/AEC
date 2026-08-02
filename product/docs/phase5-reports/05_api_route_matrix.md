# Phase 5 – API Route Matrix Report

## Overview
This document specifies all REST API endpoints created for the Principal Failover & VP Delegation Service.

---

## Endpoint Specifications

| Endpoint | Method | Guard | Description |
|---|---|---|---|
| `/api/enterprise/principal-failover/status` | `GET` | `settings:view` | Retrieve current failover state & acting principal info |
| `/api/enterprise/principal-failover/toggle` | `POST` | `settings:update` | Toggle failover status (`ONLINE`, `OFFLINE`, `ON_LEAVE`, `DELEGATED`) |
| `/api/enterprise/principal-failover/logs` | `GET` | `audit:view` | Retrieve delegation audit trail logs |
