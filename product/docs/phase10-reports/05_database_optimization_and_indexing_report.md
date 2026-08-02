# Phase 10 – Database Optimization & Indexing Report

## Overview
This document records index performance tuning across all SQLite database models.

---

## Indexed Core Columns
- `users(email, username, roleId)`
- `students(admissionNo, departmentId, programId, semesterId)`
- `faculty(employeeId, departmentId)`
- `student_leave_requests(studentId, mentorId, status)`
- `faculty_leave_requests(facultyId, departmentId, status)`
- `digital_id_cards(ownerId, verificationToken, status)`
