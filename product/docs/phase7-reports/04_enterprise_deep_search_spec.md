# Phase 7 – Enterprise Deep Search Specification Report

## Overview
This document specifies the multi-entity deep search engine and filtering mechanics implemented in GEETORUS CAMPUSOS.

---

## Multi-Entity Search Scope

The search engine queries 9 core enterprise entities concurrently:
1. **Students**: Matches `firstName`, `lastName`, `admissionNo`, `email`, `phone`.
2. **Faculty**: Matches `firstName`, `lastName`, `employeeId`, `email`, `designation`.
3. **Departments**: Matches `name`, `code`.
4. **Programs**: Matches `name`, `code`.
5. **Subjects**: Matches `name`, `code`.
6. **Tasks**: Matches `title`, `taskNumber`.
7. **Circulars**: Matches `title`, `circularNumber`.
8. **Student Leaves**: Matches `requestNumber`, `reason`.
9. **Faculty Leaves**: Matches `requestNumber`, `reason`.

---

## Response Structure
```json
{
  "students": [...],
  "faculty": [...],
  "departments": [...],
  "programs": [...],
  "subjects": [...],
  "tasks": [...],
  "circulars": [...],
  "studentLeaves": [...],
  "facultyLeaves": [...]
}
```
