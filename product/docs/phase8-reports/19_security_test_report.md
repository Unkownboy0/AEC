# Phase 8 – Security Test Report

## Overview
This document records security tests performed on download endpoints, QR token verification, and field redaction policies.

---

## Test Results
- [x] Unauthorized user downloading another student's ID PDF: **DENIED (403 Forbidden)**
- [x] Exporting student spreadsheet without `reports:view` permission: **DENIED (403 Forbidden)**
- [x] Field redaction verification (bank details/parent income hidden for Faculty): **PASSED**
- [x] Public QR verification endpoint token validation: **PASSED**
