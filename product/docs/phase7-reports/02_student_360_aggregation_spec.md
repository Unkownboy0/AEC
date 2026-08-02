# Phase 7 – Student 360 Aggregation Specification Report

## Overview
This document specifies the metric aggregation formulas and data fields included in the 360° Student Profile.

---

## Metric Formulas & Calculations

### 1. Attendance Summary Metric
$$\text{Effective Present} = \text{Present Count} + \text{On-Duty Count} + \text{Excused Count}$$
$$\text{Attendance Percentage} = \left( \frac{\text{Effective Present}}{\text{Total Classes}} \right) \times 100$$

### 2. CGPA Score Metric
$$\text{Percentage Score} = \left( \frac{\text{Total Marks Obtained}}{\text{Total Max Marks}} \right) \times 100$$
$$\text{CGPA} = \frac{\text{Percentage Score}}{10}$$

### 3. Financial Balance Summary Metric
$$\text{Pending Balance} = \text{Total Fee Amount} - \text{Paid Fee Amount}$$

---

## Response JSON Schema (`metrics` Object)
```json
{
  "attendance": {
    "totalClasses": 48,
    "presentCount": 42,
    "onDutyCount": 4,
    "excusedCount": 1,
    "absentCount": 1,
    "attendancePercentage": 98
  },
  "academics": {
    "totalSubjects": 6,
    "percentageScore": 88,
    "cgpa": "8.80"
  },
  "finance": {
    "totalFee": 125000,
    "paidFee": 125000,
    "pendingFee": 0
  }
}
```
