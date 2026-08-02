# Phase 7 – API Route Matrix Report

## Overview
This document specifies all REST API endpoints created for the 360° Profile Aggregation & Deep Search Engine.

---

## Endpoint Specifications

| Endpoint | Method | Guard | Description |
|---|---|---|---|
| `/api/enterprise/profile/student/:id` | `GET` | `students:view` | Fetch 360° aggregated student profile & calculated metrics |
| `/api/enterprise/profile/faculty/:id` | `GET` | `faculty:view` | Fetch 360° aggregated faculty profile & research metrics |
| `/api/enterprise/profile/search` | `GET` | `students:view` | Universal multi-entity deep search engine |
