# Phase 8 – Profile Architecture Report

## Executive Summary
This document specifies the system architecture for **Deep Profile Drill-Down, Live Data Exports, Digital ID & Secure Document Generation Platform** in GEETORUS CAMPUSOS.

---

## 1. System Architecture Diagram

```mermaid
graph TD
    Client[Client App / Mobile / Web] --> Router[Express API Router]
    Router --> Auth[Auth & Workspace Scope Middleware]
    Auth --> Guard[RBAC & Field-Level Policy Guard]

    Guard --> ProfileSvc[ProfileFieldPolicyService]
    Guard --> IdSvc[DigitalIdService]
    Guard --> ExportSvc[LiveExportService]

    ProfileSvc --> DB[(Live SQLite Database)]
    IdSvc --> DB
    ExportSvc --> DB

    IdSvc --> PDFEngine[DocumentGeneratorService PDFKit]
    ExportSvc --> ExcelEngine[DocumentGeneratorService ExcelJS]

    PDFEngine --> StreamOut[Streamed PDF Output]
    ExcelEngine --> StreamOut[Streamed XLSX Output]
```

---

## 2. Dynamic Scope Resolution
- User authentication & role verification
- Active workspace context resolution (`X-Active-Role`)
- Department isolation scoping (`departmentId`)
- Live DB record query execution at generation time
- Redaction of sensitive fields prior to rendering
