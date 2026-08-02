# Phase 6 – API Route Matrix Report

## Overview
This document specifies all REST API endpoints created for the Circular Management Engine.

---

## Endpoint Specifications

| Endpoint | Method | Guard | Description |
|---|---|---|---|
| `/api/enterprise/circulars` | `POST` | `circulars:create` | Publish a new institutional or departmental circular |
| `/api/enterprise/circulars` | `GET` | `circulars:view` | Retrieve applicable circulars for the logged-in user |
| `/api/enterprise/circulars/:id/read` | `POST` | `circulars:view` | Mark circular as read |
| `/api/enterprise/circulars/:id/analytics` | `GET` | `circulars:view` | Fetch read analytics and audience reach statistics |
