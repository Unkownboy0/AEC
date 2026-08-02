# Phase 9 – Analytics Architecture Report

## Executive Summary
This document specifies the system architecture for **Enterprise Reports, Analytics Dashboards & Role-Based Report Builder Platform** in GEETORUS CAMPUSOS.

---

## 1. Reporting Architecture Diagram

```mermaid
graph TD
    Client[Client App / Executive Console] --> API[Express Analytics Router]
    API --> Auth[Auth & Workspace Scope Middleware]
    Auth --> ScopeSvc[ReportScopeResolver]

    ScopeSvc --> AnalyticsSvc[AnalyticsService]
    ScopeSvc --> BuilderSvc[ReportBuilderService]

    AnalyticsSvc --> DB[(Live SQLite DB)]
    BuilderSvc --> DB

    AnalyticsSvc --> KPI[KPI Formula Engine]
    BuilderSvc --> Whitelist[Whitelisted Datasets Engine]

    KPI --> Output[JSON Dashboard / Chart Payload]
    Whitelist --> Output
```

---

## 2. Security Principle
- All analytics metrics are computed strictly on the backend via live database queries.
- Raw records are never leaked to client apps for frontend calculation.
