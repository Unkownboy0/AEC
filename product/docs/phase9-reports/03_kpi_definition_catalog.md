# Phase 9 – KPI Definition Catalog Report

## Overview
This document specifies the central catalog of Key Performance Indicators (KPIs) stored in `AnalyticsKpiDefinition`.

---

## Centralized KPI Catalog

| KPI Code | KPI Name | Module | Unit | Formula Description |
|---|---|---|---|---|
| `KPI_ATTENDANCE_RATE` | Student Attendance Rate | Attendance | PERCENTAGE | $\frac{\text{Effective Present}}{\text{Conducted Sessions}} \times 100$ |
| `KPI_PASS_RATE` | Exam Pass Rate | Academics | PERCENTAGE | $\frac{\text{Passed Students}}{\text{Appeared Students}} \times 100$ |
| `KPI_FACULTY_WORKLOAD` | Faculty Weekly Lectures | Faculty | COUNT | Total scheduled timetable lecture slots per week |
| `KPI_APPROVAL_TURNAROUND` | SLA Turnaround Time | Workflow | HOURS | Average decision timestamp minus submission timestamp |
