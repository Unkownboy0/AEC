# Phase 3 – API Route Matrix Report

## Overview
This document specifies all REST API endpoints created to support the Student Leave & OD workflow engine.

---

## Endpoint Specifications

| Endpoint | Method | Guard | Description |
|---|---|---|---|
| `/api/enterprise/student-leave` | `POST` | `leave:create` | Submit new Student Leave or OD request |
| `/api/enterprise/student-leave/my-requests` | `GET` | `leave:view` | Retrieve applicant's request history |
| `/api/enterprise/student-leave/mentor-pending` | `GET` | `leave:approve` | Retrieve assigned mentee requests pending Level 1 review |
| `/api/enterprise/student-leave/:id/mentor-review` | `POST` | `leave:approve` | Submit Level 1 Mentor endorsement/rejection |
| `/api/enterprise/student-leave/hod-pending` | `GET` | `leave:approve` | Retrieve Level 1 endorsed requests pending HOD final sign-off |
| `/api/enterprise/student-leave/:id/hod-review` | `POST` | `leave:approve` | Submit Level 2 HOD final approval/rejection |
