# Phase 6 – Real-Time Notification & Socket Broadcast Specification Report

## Overview
This document specifies notification dispatches and real-time Socket events triggered on circular publication in GEETORUS CAMPUSOS.

---

## Event Trigger Matrix

| Broadcast Level | Trigger Event | Target Recipients | Notification Message | Deep-Link Route |
|---|---|---|---|---|
| `ALL_CAMPUS` | Circular Published | All active campus users | `📢 Circular: [Title]` | `/circulars?id=:id` |
| `FACULTY_ONLY` | Circular Published | All active faculty users | `📢 Faculty Circular: [Title]` | `/circulars?id=:id` |
| `STUDENT_ONLY` | Circular Published | All active student users | `📢 Student Circular: [Title]` | `/circulars?id=:id` |
| `DEPARTMENT_SPECIFIC` | Circular Published | Members of target department | `📢 Department Circular: [Title]` | `/circulars?id=:id` |
