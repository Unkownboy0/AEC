# Phase 8 – Profile Update and Approval Report

## Overview
This document specifies the multi-tier approval workflow engine for self-service profile edits.

---

## Approval Workflow Modes

1. **`DIRECT_UPDATE`**:
   - Applies immediately for non-sensitive fields (preferred name, personal email, social links, bio).
2. **`ADMIN_REVIEW`**:
   - Requires College Admin sign-off for critical identity fields (official name correction, date of birth).
3. **`HOD_REVIEW`**:
   - Requires HOD review for departmental assignments or mentor updates.
4. **`DOCUMENT_VERIFICATION`**:
   - Requires supporting proof upload (e.g. government ID copy) for blood group or address modifications.
