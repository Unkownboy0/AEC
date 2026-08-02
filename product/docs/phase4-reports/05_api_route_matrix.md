# Phase 4 – API Route Matrix Report

## Overview
This document lists all REST API endpoints created for the Faculty Leave & OD workflow engine.

---

## Endpoint Specifications

| Endpoint | Method | Guard | Description |
|---|---|---|---|
| `/api/enterprise/faculty-leave` | `POST` | `leave:create` | Submit new Faculty Leave or OD request with substitutions |
| `/api/enterprise/faculty-leave/my-requests` | `GET` | `leave:view` | Retrieve applicant faculty's request history |
| `/api/enterprise/faculty-leave/hod-pending` | `GET` | `leave:approve` | Retrieve departmental faculty leave requests pending Level 1 HOD review |
| `/api/enterprise/faculty-leave/:id/hod-review` | `POST` | `leave:approve` | Submit Level 1 HOD endorsement/rejection |
| `/api/enterprise/faculty-leave/principal-pending` | `GET` | `leave:approve` | Retrieve HOD-endorsed requests pending Level 2 Principal/VP final sign-off |
| `/api/enterprise/faculty-leave/:id/principal-review` | `POST` | `leave:approve` | Submit Level 2 Principal or Acting Principal final approval/rejection |
