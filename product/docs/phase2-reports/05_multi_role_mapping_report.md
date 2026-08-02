# Phase 2 – Multi-Role Mapping Report

## Overview
This document documents all supported multi-role workspace combinations and permission scope rules in GEETORUS CAMPUSOS.

---

## Authorized Multi-Role Mapping Matrix

| Primary Role | Authorized Workspaces | Description |
|---|---|---|
| **Faculty** | `Faculty`, `Mentor` | Teaches classes and mentors assigned students |
| **HOD** | `HOD`, `Faculty`, `Mentor` | Departmental head, active teacher, and student mentor |
| **Academic Dean** | `Academic Dean`, `Faculty`, `Mentor` | Academic executive, senior faculty member |
| **Vice Principal** | `Vice Principal`, `Acting Principal`, `Faculty`, `Mentor` | Operational executive, failover acting principal |
| **Principal** | `Principal`, `Faculty` | Institutional head, senior professor |
| **Super Admin** | `Super Admin` + All Roles | Global system administrative control |

---

## Context Isolation Rules
1. **Scope Isolation**: When switched to `Faculty Workspace`, the user only sees assigned courses and student attendance. When switched to `Mentor Workspace`, the user only sees assigned mentee leave/OD requests and performance tracking.
2. **Permission Boundary**: An HOD operating in `Faculty Workspace` context cannot issue HOD-level department sign-offs until swapping back to `HOD Workspace`.
