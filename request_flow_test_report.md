# Request Flow Test Report — GEETORUS CAMPUSOS

## Executive Summary
This document logs the step-by-step verification of multi-tier workflow requests (Leave, OD, Tasks, Attendance, Complaints) across Web and Mobile clients.

---

## Workflow Verification Suite

### 1. Mandatory End-to-End Test — Student Leave Request Flow
- **Step 1**: Student submits leave application on Android client (`POST /student/leave`).
- **Step 2**: Backend persists record & emits `leave:created` realtime event.
- **Step 3**: Student mobile UI displays status `Submitted` (`✓ Submitted`).
- **Step 4**: Mentor web and mobile dashboards receive realtime cache invalidation & push notification.
- **Step 5**: Mentor reviews request detail timeline and clicks **Approve** (`POST /mentor/approvals/:id`).
- **Step 6**: Request progresses to status `Waiting for HOD Approval`. HOD approval queue updates instantly.
- **Step 7**: HOD opens approval queue on mobile, inspects student profile & reason, and approves request.
- **Step 8**: Student mobile and web clients transition status to `Completed` (`✓ Approved`).
- **Result**: **VERIFIED** (Zero duplicate requests created; double submit locked).

---

### 2. Mandatory End-to-End Test — Faculty Attendance Flow
- **Step 1**: Faculty opens mobile client, navigates to `/faculty/attendance`, selects assigned section.
- **Step 2**: Faculty marks attendance records and taps **Save Attendance** (`POST /faculty/attendance`).
- **Step 3**: Backend saves session and fires `attendance:marked` event.
- **Step 4**: Student mobile dashboard, Student web dashboard, HOD availability board, and Mentor views refetch and render updated attendance stats simultaneously.
- **Result**: **VERIFIED**

---

### 3. Mandatory End-to-End Test — Task Assignment & Response Flow
- **Step 1**: Academic Dean creates task on Web portal assigned to HOD (`POST /tasks`).
- **Step 2**: HOD receives mobile push notification & realtime socket update.
- **Step 3**: HOD taps notification on mobile, cold-boots app into exact task detail page `/hod/tasks/:id`.
- **Step 4**: HOD submits completion response.
- **Step 5**: Dean web portal updates progress in real-time.
- **Result**: **VERIFIED**

---

### 4. Mandatory End-to-End Test — Principal Delegation Flow
- **Step 1**: Principal updates status to `BUSY` on Web portal.
- **Step 2**: Delegation Context transitions VP into `Acting Principal Mode`.
- **Step 3**: VP mobile app mounts Acting Principal approval banner and displays delegated queue.
- **Step 4**: VP approves pending HOD leave request (`POST /vp/acting-principal/approve`).
- **Step 5**: Backend registers approval with VP actor ID.
- **Step 6**: Principal returns to `ONLINE`; VP acting mode banner gracefully unmounts.
- **Result**: **VERIFIED**
