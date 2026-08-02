# Phase 6 – Circular Engine Broadcast Levels Report

## Overview
This document specifies the 4 distinct broadcast levels supported by the Circular Management Engine in GEETORUS CAMPUSOS.

---

## Broadcast Levels Matrix

| Level Code | Target Audience | Publisher Eligibility | Visibility Rule |
|---|---|---|---|
| `ALL_CAMPUS` | All active users across the institution | Principal, VP, Deans, Super Admin | Visible to everyone |
| `FACULTY_ONLY` | All faculty members across all departments | Executive Staff & Deans | Visible to Faculty & HODs only |
| `STUDENT_ONLY` | All students across all programs | Executive Staff & Deans | Visible to Students only |
| `DEPARTMENT_SPECIFIC` | Users belonging to target `departmentId` | HODs (their dept) & Executives | Visible to users in target department only |
