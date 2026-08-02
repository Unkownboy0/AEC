# Phase 10 – Rate Limiting Policy Report

## Overview
This document specifies API rate-limiting policies to prevent DDoS attacks and brute-force token enumeration.

---

## Rate Limit Thresholds

| Endpoint Category | Window | Max Requests | Action on Exceed |
|---|---|---|---|
| **Public Auth (`/api/auth/login`)** | 1 minute | 5 requests | HTTP 429 Too Many Requests |
| **Public QR Verification (`/api/id-cards/verify/*`)** | 1 minute | 20 requests | HTTP 429 Too Many Requests |
| **General API Routes (`/api/*`)** | 15 minutes | 1000 requests | HTTP 429 Too Many Requests |
