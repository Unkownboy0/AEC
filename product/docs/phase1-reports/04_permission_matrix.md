# Phase 1 – Permission Matrix Report

## Overview
This report contains the master matrix mapping the 11 core enterprise roles against the 21 permission groups and 10 permission types (210 total permissions).

---

## Role Hierarchy Index

| Priority | Role Name | Scope | Description |
|---|---|---|---|
| **1** | Super Admin | `GLOBAL` | Full Access to Everything |
| **2** | Principal | `CAMPUS` | Full Campus Access except System Settings & DB Write |
| **3** | Vice Principal | `OPERATIONS` | Placement, Training, Internships, Career |
| **4** | Academic Dean | `ACADEMICS` | Academic Modules only |
| **5** | Administration & Admission Dean | `ADMINISTRATION` | Administration & Onboarding Modules |
| **6** | IQAC Dean | `QUALITY` | Quality & Accreditation Modules |
| **7** | HOD | `OWN_DEPARTMENT` | Departmental Scope |
| **8** | Faculty | `ASSIGNED_CLASSES` | Assigned Classes, Students & Subjects |
| **9** | Mentor | `ASSIGNED_MENTEES` | Assigned Mentees only |
| **10** | Student | `SELF` | Own Data only |
| **11** | Parent | `LINKED_CHILD` | Linked Child Data only |

---

## Permission Matrix by Role & Group

| Permission Group | Super Admin | Principal | Vice Principal | Academic Dean | Admin Dean | IQAC Dean | HOD | Faculty | Mentor | Student | Parent |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Dashboard** | ALL | ALL | VIEW | ALL | ALL | ALL | ALL | VIEW | VIEW | VIEW | VIEW |
| **Users** | ALL | ALL | — | — | ALL | — | VIEW | — | — | — | — |
| **Students** | ALL | ALL | — | ALL | ALL | — | ALL | VIEW | VIEW | SELF | CHILD |
| **Faculty** | ALL | ALL | — | ALL | ALL | — | ALL | — | — | — | — |
| **Parents** | ALL | ALL | — | — | ALL | — | VIEW | — | — | — | — |
| **Departments** | ALL | ALL | — | ALL | ALL | — | DEPT | — | — | — | — |
| **Attendance** | ALL | ALL | — | ALL | — | — | ALL | ENTRY | VIEW | SELF | CHILD |
| **Marks** | ALL | ALL | — | ALL | — | — | ALL | ENTRY | VIEW | SELF | CHILD |
| **Timetable** | ALL | ALL | — | ALL | — | — | ALL | VIEW | — | SELF | — |
| **Leave** | ALL | ALL | — | ALL | ALL | — | APPROVE | APPLY | APPROVE| APPLY | STATUS |
| **OD** | ALL | ALL | — | ALL | ALL | — | APPROVE | APPLY | APPROVE| APPLY | STATUS |
| **Fees** | ALL | ALL | — | — | ALL | — | VIEW | — | — | VIEW | VIEW |
| **Reports** | ALL | ALL | VIEW | ALL | ALL | ALL | DEPT | VIEW | — | — | — |
| **Tasks** | ALL | ALL | VIEW | ALL | ALL | ALL | DEPT | OWN | MENTEE | — | — |
| **Notifications** | ALL | ALL | VIEW | ALL | ALL | ALL | DEPT | VIEW | VIEW | VIEW | VIEW |
| **Circulars** | ALL | ALL | VIEW | ALL | ALL | ALL | DEPT | VIEW | VIEW | VIEW | VIEW |
| **Downloads** | ALL | ALL | VIEW | ALL | ALL | ALL | DEPT | VIEW | — | VIEW | VIEW |
| **Exports** | ALL | ALL | VIEW | ALL | ALL | ALL | DEPT | — | — | — | — |
| **Analytics** | ALL | ALL | VIEW | ALL | — | ALL | DEPT | — | — | — | — |
| **Settings** | ALL | VIEW | — | — | ALL | — | — | — | — | — | — |
| **Approvals** | ALL | ALL | ALL | ALL | ALL | ALL | DEPT | — | MENTEE | — | — |
