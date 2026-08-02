# Phase 3 – Notification Dispatch Specification Report

## Overview
This document defines the real-time notification events, recipient routing, and deep-link routes triggered throughout the Student Leave & OD workflow in GEETORUS CAMPUSOS.

---

## Event Trigger Matrix

| Event Type | Trigger Stage | Recipient | Notification Message | Deep-Link Route |
|---|---|---|---|---|
| `STUDENT_LEAVE_SUBMITTED` | Student submits request | Assigned Mentor | `Student Sarah Jenkins submitted a ON_DUTY request (2 day(s)) for Level 1 review.` | `/faculty/mentor-approvals` |
| `LEAVE_MENTOR_APPROVED` | Mentor Level 1 Endorsed | Student | `Your ON_DUTY request (SL-2026-0001) was endorsed by your Mentor.` | `/student/leave-portal` |
| `LEAVE_MENTOR_REJECTED` | Mentor Level 1 Rejected | Student | `Your LEAVE request (SL-2026-0001) was rejected by your Mentor.` | `/student/leave-portal` |
| `STUDENT_LEAVE_HOD_PENDING` | Mentor Level 1 Endorsed | Department HOD | `ON_DUTY request (SL-2026-0001) endorsed by Mentor. Awaiting HOD sign-off.` | `/hod/leave-approvals` |
| `LEAVE_FINAL_APPROVED` | HOD Level 2 Approved | Student | `Final Decision: Your ON_DUTY request (SL-2026-0001) has received final HOD approval!` | `/student/leave-portal` |
| `LEAVE_FINAL_REJECTED` | HOD Level 2 Rejected | Student | `Final Decision: Your LEAVE request (SL-2026-0001) was rejected by HOD.` | `/student/leave-portal` |
