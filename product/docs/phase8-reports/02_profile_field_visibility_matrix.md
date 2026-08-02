# Phase 8 – Profile Field Visibility Matrix Report

## Overview
This document specifies the field-level security policy matrix enforced across all viewer roles in GEETORUS CAMPUSOS.

---

## Field Visibility Policy Matrix

| Profile Field | Super Admin | Principal / Dean | HOD (Own Dept) | Faculty (Assigned) | Mentor (Assigned) | Student (Self) | Parent (Child) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Basic Info & Bio** | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| **Academic Marks** | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| **Attendance %** | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| **Parent Contacts** | ✅ Allowed | ✅ Allowed | ✅ Allowed | ❌ Hidden | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| **Aadhaar / ID** | ✅ Allowed | 🔒 Masked | 🔒 Masked | ❌ Hidden | ❌ Hidden | ✅ Allowed | 🔒 Masked |
| **Bank Account** | ✅ Allowed | ❌ Hidden | ❌ Hidden | ❌ Hidden | ❌ Hidden | 🔒 Restricted | ❌ Hidden |
| **Parent Income** | ✅ Allowed | ❌ Hidden | ❌ Hidden | ❌ Hidden | ❌ Hidden | 🔒 Restricted | ✅ Allowed |
