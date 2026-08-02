# Phase 8 – QR Code Verification Report

## Overview
This document specifies the public QR verification token endpoint and non-sensitive payload disclosure rules.

---

## 1. QR Endpoint
- **URL**: `GET /api/id-cards/verify/:token`
- **Publicly Visible Data**: Institution Name, Masked Student/Faculty Name, Department, Card Status, Validity Dates.
- **Redacted Data**: Phone number, address, bank details, parent contacts, Aadhaar number.
