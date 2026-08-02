# Phase 8 – Profile Photo Persistence Report

## Overview
This document specifies the profile photo upload, validation, persistence, and cache invalidation lifecycle in GEETORUS CAMPUSOS.

---

## Profile Photo Lifecycle
1. User selects image file (JPG, PNG, WEBP, max 5MB).
2. Server validates MIME type & file signature.
3. Photo is persisted to permanent storage path and URL stored in `User.profilePhoto`.
4. Cache is invalidated across all client dashboards.
5. Consistent rendering across Digital ID, PDF exports, Web Portal, and Mobile App.
