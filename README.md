# GEETORUS CAMPUSOS — Complete Product Documentation

> **Product Name**: GEETORUS CAMPUSOS  
> **Product Type**: Enterprise College ERP & Management System  
> **Version**: 1.0.0  
> **Architecture**: Monorepo (Client + Server)  
> **Last Updated**: July 2026

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Tech Stack — Complete Breakdown](#2-tech-stack--complete-breakdown)
3. [System Architecture](#3-system-architecture)
4. [Directory Structure](#4-directory-structure)
5. [Database Architecture (71 Models)](#5-database-architecture-71-models)
6. [Backend Architecture (17 Modules)](#6-backend-architecture-17-modules)
7. [Frontend Architecture (70+ Pages)](#7-frontend-architecture-70-pages)
8. [Authentication & Security Infrastructure](#8-authentication--security-infrastructure)
9. [Role-Based Access Control (RBAC)](#9-role-based-access-control-rbac)
10. [UI/UX Design System](#10-uiux-design-system)
11. [API Endpoints Inventory](#11-api-endpoints-inventory)
12. [How to Convert to Mobile App](#12-how-to-convert-to-mobile-app)
13. [Production Deployment Guide](#13-production-deployment-guide)
14. [Environment Variables Reference](#14-environment-variables-reference)
15. [Development Setup Guide](#15-development-setup-guide)

---

## 1. Product Overview

**GEETORUS CAMPUSOS** is a full-stack, enterprise-grade College ERP (Enterprise Resource Planning) system designed for universities and colleges. It manages the complete lifecycle of academic administration — from student admissions to graduation, faculty management, examinations, placements, and beyond.

### Key Capabilities

| Domain | Features |
|---|---|
| **Student Management** | Admissions, Profiles, Attendance, Grades, ID Cards, Leave/OD, Portfolio |
| **Academic Engine** | Departments, Programs, Courses, Semesters, Sections, Subjects, Syllabus |
| **Faculty Management** | Profiles, Subject Assignments, Timetable, Performance, Mentoring |
| **Examination System** | Exam Scheduling, Marks Entry, Results, Grade Computation, Hall Tickets |
| **Placement Engine** | Campus Drives, Applications, Interview Tracking, Career Dashboard |
| **Finance Module** | Fee Categories, Bill Generation, Payment Tracking |
| **Infrastructure** | Library, Hostel, Transport, Classroom/Lab Allocation |
| **Communication** | Circulars, Notifications, Chat, AI Academic Advisor |
| **Governance** | RBAC, Audit Logs, Security Monitoring, Backup/Restore |
| **Centralized Timetable** | COE & Dean Academics controlled Master Timetable with conflict detection |

### Codebase Statistics

| Metric | Value |
|---|---|
| Total Source Files | 201 |
| Total Lines of Code | ~61,780 |
| Source Code Size | ~2.93 MB |
| Prisma Schema Lines | 1,703 |
| Database Models | 71 |
| Backend API Modules | 17 |
| Frontend Pages | 70+ |
| UI Components | 15 shared + 7 component groups |

---

## 2. Tech Stack — Complete Breakdown

### Frontend (Client)

| Technology | Version | Purpose |
|---|---|---|
| **React** | 19.0.0 | Core UI library (latest with concurrent features) |
| **TypeScript** | 5.4.5 | Static type-checking across all components |
| **Vite** | 5.2.11 | Lightning-fast HMR dev server & build tool |
| **React Router DOM** | 6.23.1 | Client-side SPA routing with nested layouts |
| **TailwindCSS** | 3.4.3 | Utility-first CSS framework with HSL design tokens |
| **Radix UI** | Latest | Accessible, unstyled headless UI primitives |
| — `@radix-ui/react-dialog` | 1.1.1 | Modal dialogs |
| — `@radix-ui/react-dropdown-menu` | 2.1.1 | Dropdown menus |
| — `@radix-ui/react-label` | 2.1.0 | Form labels |
| — `@radix-ui/react-popover` | 1.1.1 | Popovers |
| — `@radix-ui/react-select` | 2.1.1 | Custom select dropdowns |
| — `@radix-ui/react-slot` | 1.1.0 | Slot composition pattern |
| — `@radix-ui/react-toast` | 1.2.1 | Toast notifications |
| **TanStack React Query** | 5.45.0 | Server state management, caching, refetching |
| **Axios** | 1.7.2 | HTTP client with interceptors for JWT refresh |
| **React Hook Form** | 7.52.0 | Performant form management |
| **Zod** | 3.23.8 | Runtime schema validation (forms + API) |
| **@hookform/resolvers** | 3.9.0 | Zod-to-React-Hook-Form bridge |
| **Lucide React** | 0.395.0 | Modern SVG icon library (1000+ icons) |
| **html2canvas** | 1.4.1 | Client-side screenshot/export to image |
| **jsPDF** | 4.2.1 | Client-side PDF generation |
| **clsx** | 2.1.1 | Conditional className utility |
| **tailwind-merge** | 2.3.0 | Intelligent Tailwind class deduplication |
| **PostCSS** | 8.4.38 | CSS transformation pipeline |
| **Autoprefixer** | 10.4.19 | Vendor prefix automation |

### Backend (Server)

| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | 18+ | JavaScript runtime |
| **Express** | 4.19.2 | HTTP framework with middleware pipeline |
| **TypeScript** | 5.4.5 | Full type safety on server |
| **Prisma ORM** | 5.14.0 | Type-safe database ORM with auto-generated client |
| **SQLite** | (via Prisma) | Development database (file-based) |
| **bcryptjs** | 2.4.3 | Password hashing (salt rounds) |
| **jsonwebtoken** | 9.0.2 | JWT access & refresh token generation/verification |
| **Helmet** | 7.1.0 | HTTP security headers |
| **CORS** | 2.8.5 | Cross-Origin Resource Sharing middleware |
| **Zod** | 3.23.8 | Server-side request validation |
| **Winston** | 3.13.0 | Structured logging (file + console transports) |
| **PDFKit** | 0.19.1 | Server-side PDF generation (ID cards, reports) |
| **ExcelJS** | 4.4.0 | Excel spreadsheet generation & parsing |
| **QRCode** | 1.5.4 | QR code generation for ID card verification |
| **dotenv** | 16.4.5 | Environment variable loading |
| **ts-node-dev** | 2.0.0 | TypeScript hot-reload dev server |

### Database

| Property | Value |
|---|---|
| **ORM** | Prisma 5.14 |
| **Dev Database** | SQLite (`file:./dev.db`) |
| **Production Ready** | PostgreSQL, MySQL, SQL Server (Prisma multi-provider) |
| **Schema File** | `server/prisma/schema.prisma` (1,703 lines) |
| **Models** | 71 tables |
| **Migration Strategy** | `prisma migrate dev` / `prisma db push` |
| **Seed Script** | `prisma/seed.ts` |

---

## 3. System Architecture

### High-Level Architecture Diagram

```mermaid
graph TB
    subgraph Client["Frontend — React 19 + Vite"]
        A["Browser / PWA"] --> B["React Router v6"]
        B --> C["AuthContext + ThemeContext + DeviceContext"]
        C --> D["Protected Routes + RBAC Guards"]
        D --> E["Page Components"]
        E --> F["Shared UI Components"]
        E --> G["Axios HTTP Client"]
    end

    subgraph Server["Backend — Express + Node.js"]
        G -->|"REST API /api/*"| H["Express App"]
        H --> I["Security Middlewares"]
        I --> J["Rate Limiter + Sanitizer"]
        J --> K["Auth Middleware - JWT"]
        K --> L["Route Handlers"]
        L --> M["Controllers"]
        M --> N["Services"]
        N --> O["Repositories"]
        O --> P["Prisma ORM Client"]
    end

    subgraph Database["Database Layer"]
        P --> Q["SQLite Dev or PostgreSQL Prod"]
    end
```

### Request Lifecycle

```mermaid
sequenceDiagram
    participant Browser
    participant Vite Proxy
    participant Express
    participant Middleware
    participant Controller
    participant Prisma
    participant SQLite

    Browser->>Vite Proxy: GET /api/enterprise/students
    Vite Proxy->>Express: Proxy to localhost:5000
    Express->>Middleware: Helmet CORS Rate Limit Sanitize
    Middleware->>Middleware: Auth JWT Verify
    Middleware->>Controller: Route Handler
    Controller->>Prisma: Query Builder
    Prisma->>SQLite: SQL Execution
    SQLite-->>Prisma: Result Set
    Prisma-->>Controller: Typed Objects
    Controller-->>Express: JSON Response
    Express-->>Vite Proxy: HTTP 200
    Vite Proxy-->>Browser: JSON Data
```

### Context Provider Tree

```
QueryClientProvider              -- TanStack React Query cache
  ThemeProvider                  -- Light/Dark/System theme toggle
    DeviceProvider               -- Mobile/Tablet/Desktop detection
      AuthProvider               -- JWT auth state, user, permissions
        AppRouter                -- React Router v6 with guards
        Toaster                  -- Global toast notifications
```

---

## 4. Directory Structure

```
product/
├── README.md
├── docs/
│   ├── ARCHITECTURE.md              # Detailed architecture guide
│   ├── DEVELOPER.md                 # Developer onboarding guide
│   └── PRODUCT_DOCUMENTATION.md     # This document
│
├── client/                          # FRONTEND
│   ├── index.html                   # SPA entry point
│   ├── package.json                 # Frontend dependencies
│   ├── vite.config.ts               # Vite build & dev server config
│   ├── tailwind.config.js           # TailwindCSS design tokens
│   ├── postcss.config.js            # PostCSS pipeline
│   ├── tsconfig.json                # TypeScript config
│   ├── public/                      # Static assets
│   ├── dist/                        # Production build output
│   └── src/
│       ├── App.tsx                   # Root app with provider tree
│       ├── main.tsx                  # ReactDOM render entry
│       ├── index.css                # Global CSS + design tokens
│       ├── registerServiceWorker.ts  # PWA service worker
│       ├── context/
│       │   ├── AuthContext.tsx       # JWT auth state manager
│       │   ├── ThemeContext.tsx      # Light/Dark/System theme
│       │   └── DeviceContext.tsx     # Responsive breakpoint detection
│       ├── lib/
│       │   ├── axios.ts             # Axios instance + JWT interceptor
│       │   └── utils.ts             # Shared utility functions
│       ├── hooks/                   # Custom React hooks
│       ├── routes/
│       │   ├── Router.tsx           # App router + COMPONENT_MAP registry
│       │   ├── ProtectedRoute.tsx   # Auth guard HOC
│       │   └── StudentRouteGuard.tsx # Student-specific route guard
│       ├── components/
│       │   ├── ui/                  # 15 reusable UI primitives
│       │   │   ├── Button.tsx
│       │   │   ├── Input.tsx
│       │   │   ├── Modal.tsx
│       │   │   ├── Table.tsx
│       │   │   ├── Select.tsx
│       │   │   ├── Search.tsx
│       │   │   ├── Filter.tsx
│       │   │   ├── Pagination.tsx
│       │   │   ├── Toast.tsx
│       │   │   ├── Loading.tsx
│       │   │   ├── Skeleton.tsx
│       │   │   ├── DatePicker.tsx
│       │   │   ├── FileUpload.tsx
│       │   │   ├── EmptyState.tsx
│       │   │   └── ConfirmationDialog.tsx
│       │   ├── shared/              # Layout components
│       │   │   ├── MainLayout.tsx   # Sidebar + Header + Content
│       │   │   ├── Header.tsx       # Top navigation bar
│       │   │   ├── Sidebar.tsx      # Collapsible sidebar menu
│       │   │   ├── BottomNav.tsx    # Mobile bottom navigation
│       │   │   ├── CommandPalette.tsx # Cmd+K search palette
│       │   │   └── PermissionGuard.tsx
│       │   ├── admin/               # Admin-specific components
│       │   ├── activity/            # Activity feed components
│       │   ├── complaint/           # Complaint management
│       │   ├── placement/           # Placement components
│       │   └── vp/                  # Vice Principal components
│       └── pages/
│           ├── Login.tsx
│           ├── ForgotPassword.tsx
│           ├── ResetPassword.tsx
│           ├── Dashboard.tsx        # Main admin dashboard
│           ├── Profile.tsx
│           ├── Settings.tsx
│           ├── StudentPortal.tsx     # Mega portal (~297KB)
│           ├── FacultyPortal.tsx     # Faculty mega portal (~285KB)
│           ├── HODPortal.tsx         # HOD portal (~47KB)
│           ├── RolePortals.tsx       # Dynamic role portals (~166KB)
│           ├── DigitalIdCard.tsx
│           ├── TimetableView.tsx
│           ├── admin/               # 25 admin pages
│           ├── hod/                 # 10 HOD pages
│           └── student/             # 30 student pages + hooks + services
│
├── server/                          # BACKEND
│   ├── package.json                 # Backend dependencies
│   ├── tsconfig.json                # TypeScript config
│   ├── .env                         # Environment variables
│   ├── .env.example                 # Template
│   ├── prisma/
│   │   ├── schema.prisma            # Database schema (1,703 lines, 71 models)
│   │   ├── seed.ts                  # Database seed script
│   │   └── dev.db                   # SQLite database file
│   ├── uploads/                     # File upload storage
│   ├── backups/                     # Database backup storage
│   ├── logs/                        # Winston log files
│   └── src/
│       ├── server.ts                # HTTP server bootstrap + graceful shutdown
│       ├── app.ts                   # Express app setup + route mounting
│       ├── config/
│       │   └── env.ts               # Zod-validated env configuration
│       ├── lib/
│       │   └── prisma.ts            # Prisma client singleton
│       ├── core/
│       │   └── middlewares/
│       │       ├── auth.middleware.ts     # JWT verification + RBAC
│       │       ├── error.middleware.ts    # Global error handler
│       │       ├── rateLimit.middleware.ts # API & auth rate limiters
│       │       └── sanitize.middleware.ts  # XSS input sanitization
│       ├── utils/
│       │   ├── exceptions.ts        # Custom exception classes
│       │   ├── logger.ts            # Winston logger config
│       │   ├── security.ts          # Permission matrix + menu config
│       │   ├── uaParser.ts          # User agent parser
│       │   ├── attendance.pdf.ts    # PDF attendance report generator
│       │   └── idcard.pdf.ts        # PDF ID card generator
│       └── modules/                 # 17 feature modules
│           ├── auth/
│           ├── users/
│           ├── roles/
│           ├── academics/
│           ├── masters/
│           ├── dashboard/
│           ├── enterprise/          # Core enterprise module (17 controllers)
│           ├── timetable/
│           ├── ai/
│           ├── chat/
│           ├── files/
│           ├── notifications/
│           ├── reports/
│           ├── security/
│           ├── settings/
│           ├── backup/
│           └── workflow/
```

---

## 5. Database Architecture (71 Models)

### Model Classification

| Category | Models | Count |
|---|---|---|
| **Identity & Auth** | User, Role, Permission, RolePermission, UserSession, PasswordResetToken, LoginHistory | 7 |
| **System Config** | SystemSetting, MenuItem, PermissionTemplate, PermissionTemplateMapping | 4 |
| **Academic Structure** | AcademicYear, Department, Program, Course, Semester, Section, Subject | 7 |
| **Student Data** | Student, Attendance, Mark, Exam | 4 |
| **Faculty Data** | Faculty, SubjectAssignment, MentorAssignment, CounselingRecord | 4 |
| **Finance** | FeeCategory, FeeBill | 2 |
| **Infrastructure** | LibraryBook, TransportRoute, HostelBuilding | 3 |
| **Assessments** | Assignment, AssignmentSubmission, Quiz, QuizQuestion, QuizAttempt | 5 |
| **Timetable** | TimetableSlot, MasterTimetable, MasterTimetableSlot, TimetableVersion, TimetableAuditLog, TimetablePublish | 6 |
| **Placements** | PlacementRecord, PlacementDrive, PlacementApplication | 3 |
| **Internships** | Internship, InternshipDocument | 2 |
| **Communication** | ChatMessage, HodCircular, HodCircularReadTracker, AiMessage | 4 |
| **Admissions** | AdmissionApplication, ScholarshipApplication, StudentEnquiry, CounsellingSession, DepartmentIntake | 5 |
| **Gamification** | GamificationProfile, RewardStoreItem, RewardRedemption | 3 |
| **Certificates** | CertificateRequest, DigitalIdCard | 2 |
| **Governance** | UserActivityLog, SecurityAuditLog, BackupLog, Ticket, WorkflowRequest, WorkflowHistory | 6 |
| **Media** | MediaFile, MasterRecord | 2 |
| **Advisor** | AdvisorSession | 1 |
| **Notifications** | SystemNotification | 1 |
| **Total** | | **71** |

### Entity Relationship Overview

```mermaid
erDiagram
    User ||--o{ UserSession : "has sessions"
    User ||--o| Student : "is student"
    User ||--o| Faculty : "is faculty"
    User }o--|| Role : "has role"
    Role ||--o{ RolePermission : "has permissions"

    AcademicYear ||--o{ Department : contains
    Department ||--o{ Program : contains
    Program ||--o{ Course : contains
    Course ||--o{ Semester : contains
    Semester ||--o{ Section : contains
    Semester ||--o{ Subject : contains

    Student }o--|| Department : "belongs to"
    Student }o--|| Semester : "enrolled in"
    Student ||--o{ Attendance : "has records"
    Student ||--o{ Mark : "has marks"
    Student ||--o{ AssignmentSubmission : "submits"

    Faculty }o--|| Department : "belongs to"
    Faculty ||--o{ SubjectAssignment : "teaches"
    Faculty ||--o{ Assignment : "creates"

    MasterTimetable ||--o{ MasterTimetableSlot : "has slots"
    MasterTimetable ||--o{ TimetableVersion : "has versions"
    MasterTimetable ||--o{ TimetableAuditLog : "has audit trail"
```

---

## 6. Backend Architecture (17 Modules)

### Module Inventory

| Module | Path | Purpose |
|---|---|---|
| **auth** | `modules/auth/` | Login, Register, JWT refresh, Logout, Password Reset, Force Change |
| **users** | `modules/users/` | User CRUD, Profile update, Photo upload |
| **roles** | `modules/roles/` | Role CRUD, Permission assignment, Templates |
| **academics** | `modules/academics/` | Academic years, Departments, Programs, Courses, Semesters, Sections, Subjects |
| **masters** | `modules/masters/` | Master data records management |
| **dashboard** | `modules/dashboard/` | Statistics, KPIs, Charts data |
| **enterprise** | `modules/enterprise/` | Core business logic - Students, Faculty, Admissions, Placements, Assignments, Circulars, Complaints, Certificates, Gamification, Quiz, Timetable (17 controllers) |
| **timetable** | `modules/timetable/` | Timetable slot CRUD |
| **ai** | `modules/ai/` | AI Academic Advisor chatbot |
| **chat** | `modules/chat/` | Inter-user messaging |
| **files** | `modules/files/` | File upload/download, Media management |
| **notifications** | `modules/notifications/` | System notifications, Push alerts |
| **reports** | `modules/reports/` | Analytics, PDF/Excel report generation |
| **security** | `modules/security/` | Audit logs, Login history, Device management |
| **settings** | `modules/settings/` | System configuration (SMTP, branding, etc.) |
| **backup** | `modules/backup/` | Database backup, Restore, Scheduled backups |
| **workflow** | `modules/workflow/` | Approval chains, Leave/OD requests |

### Middleware Pipeline

```
Request --> Helmet --> CORS --> Body Parser --> Request Logger --> Input Sanitizer --> Rate Limiter --> JWT Auth --> Permission Check --> Route Handler --> Error Handler --> Response
```

| Middleware | File | Purpose |
|---|---|---|
| **Helmet** | Built-in | Secure HTTP headers (X-Frame-Options, CSP, HSTS, etc.) |
| **CORS** | `app.ts` | Whitelist allowed origins, credentials support |
| **Body Parser** | `app.ts` | JSON parsing with 10MB limit for base64 uploads |
| **Request Logger** | `app.ts` | Winston HTTP-level logging |
| **Input Sanitizer** | `sanitize.middleware.ts` | XSS prevention, HTML entity encoding |
| **Rate Limiter** | `rateLimit.middleware.ts` | API: general limiter; Auth: strict limiter |
| **Auth** | `auth.middleware.ts` | JWT verification, user payload extraction |
| **Permission** | `auth.middleware.ts` | requirePermission(), requireRole() guards |
| **Error Handler** | `error.middleware.ts` | Centralized error boundary with status codes |

---

## 7. Frontend Architecture (70+ Pages)

### Admin Pages (25)

| Page | File | Description |
|---|---|---|
| Dashboard | `Dashboard.tsx` | KPI cards, charts, analytics overview |
| Students | `Students.tsx` | Student CRUD, bulk import, enrollment |
| Faculty | `Faculty.tsx` | Faculty management, subject mapping |
| Roles | `Roles.tsx` | Role and permission management console |
| Academic Portal | `AcademicPortal.tsx` | Years, Departments, Programs, Courses config |
| Academic Config | `AcademicConfig.tsx` | Academic structure configuration |
| Attendance | `Attendance.tsx` | Attendance marking and reports |
| Examinations | `Examinations.tsx` | Exam scheduling, marks entry |
| Fees | `Fees.tsx` | Fee categories, billing, payment tracking |
| Library | `Library.tsx` | Book management, issue/return |
| Transport | `Transport.tsx` | Route management, vehicle allocation |
| Hostel | `Hostel.tsx` | Building, room, allotment management |
| Placement Engine | `PlacementEngine.tsx` | Campus recruitment management |
| Master Timetable | `MasterTimetableManagement.tsx` | Centralized COE/Dean timetable control |
| Notification Center | `NotificationCenter.tsx` | Push notification broadcasting |
| Security Logs | `SecurityLogs.tsx` | Audit trail, login history |
| Backup Center | `BackupCenter.tsx` | Database backup/restore console |
| Reports Panel | `ReportsPanel.tsx` | Analytics and report generation |
| Media Library | `MediaLibrary.tsx` | File/media asset management |
| Master Lists | `MasterLists.tsx` | Master data configuration |
| College Onboarding | `CollegeOnboarding.tsx` | First-time institution setup wizard |
| Settings | `Settings.tsx` | System settings panel |
| Help/Support | `Support.tsx` | Ticket system, knowledge base |
| Admission Dean | `AdmissionDeanPortal.tsx` | Admissions workflow management |

### Student Pages (30)

| Page | File | Description |
|---|---|---|
| Dashboard | `StudentDashboard.tsx` | Welcome, CGPA, Attendance, Today's Schedule |
| Profile | `StudentProfile.tsx` | Personal info, academic details |
| ID Card | `StudentIdCard.tsx` | Digital ID with QR verification |
| Syllabus | `StudentSyllabus.tsx` | Unit-wise engineering syllabus (Units I-V) |
| Timetable | `StudentTimetable.tsx` | Master timetable view (COE published) |
| Attendance | `StudentAttendance.tsx` | Subject-wise attendance tracking |
| Homework | `StudentHomework.tsx` | Multi-format upload (PDF, DOCX, Video, ZIP) |
| Assignments | `StudentAssignments.tsx` | Assignment submission and grading |
| Quiz | `StudentQuiz.tsx` | Online assessment with timer and auto-grading |
| Examinations | `StudentExaminations.tsx` | Exam schedule, seating, hall tickets |
| Results | `StudentResults.tsx` | Semester results and CGPA calculator |
| Leave/OD | `StudentLeaveOd.tsx` | Leave and On-Duty application |
| AI Assistant | `StudentAiAssistant.tsx` | AI academic chatbot |
| Placements | `StudentPlacements.tsx` | Campus drive dashboard and applications |
| Internship | `StudentInternship.tsx` | Internship tracking and documents |
| Resume Builder | `StudentResumeBuilder.tsx` | In-app resume generator |
| Career Dashboard | `StudentCareerDashboard.tsx` | Career analytics and skill mapping |
| Library | `StudentLibrary.tsx` | Book catalog, issue/return history |
| Hostel | `StudentHostel.tsx` | Room allocation, complaints |
| Transport | `StudentTransport.tsx` | Bus route and pass management |
| Portfolio | `StudentPortfolio.tsx` | Professional portfolio builder |
| Skills | `StudentSkills.tsx` | Skill tracking and certifications |
| Clubs | `StudentClubs.tsx` | Student organization management |
| Documents | `StudentDocuments.tsx` | Document repository and downloads |
| Circulars | `StudentCirculars.tsx` | Department circular reader |
| Advisor Chat | `StudentAdvisorChat.tsx` | Mentor communication |
| Notifications | `StudentNotifications.tsx` | Alert center |
| Calendar | `StudentCalendar.tsx` | Academic calendar |
| Gamification | `StudentGamification.tsx` | XP, streaks, leaderboard, reward store |
| Certificates | `StudentCertificates.tsx` | Online certificate application |

### HOD Pages (10)

| Page | File | Description |
|---|---|---|
| Department Overview | `DepartmentOverview.tsx` | Department KPIs and summary |
| Department Subjects | `DepartmentSubjects.tsx` | Subject allocation management |
| Department Attendance | `DepartmentAttendance.tsx` | Department attendance analytics |
| Department Results | `DepartmentResults.tsx` | Result analysis by subject |
| Department Reports | `DepartmentReports.tsx` | Custom report generation |
| Academic Performance | `AcademicPerformance.tsx` | Student performance analysis |
| Faculty Performance | `FacultyPerformance.tsx` | Faculty evaluation metrics |
| Circular Management | `CircularManagement.tsx` | Create and distribute circulars |
| Timetable Engine | `TimetableEngine.tsx` | Department timetable management |
| HOD Profile | `HODProfile.tsx` | HOD profile and department settings |

### Mega Portal Pages

| Portal | File | Size | Description |
|---|---|---|---|
| Student Portal | `StudentPortal.tsx` | ~297 KB | Complete student experience mega-component |
| Faculty Portal | `FacultyPortal.tsx` | ~285 KB | Faculty management mega-component |
| Role Portals | `RolePortals.tsx` | ~166 KB | Dynamic portals for all other roles |
| HOD Portal | `HODPortal.tsx` | ~47 KB | Head of Department portal |

---

## 8. Authentication & Security Infrastructure

### Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Client
    participant Server
    participant DB

    User->>Client: Enter email + password
    Client->>Server: POST /api/auth/login
    Server->>DB: Find user by email
    DB-->>Server: User record
    Server->>Server: bcrypt.compare password hash
    Server->>Server: Generate JWT Access Token 1d
    Server->>Server: Generate Refresh Token
    Server->>DB: Store UserSession
    Server-->>Client: accessToken refreshToken user
    Client->>Client: Store tokens in localStorage
    Client->>Client: Set AuthContext user state
```

### Security Features Matrix

| Feature | Implementation | File |
|---|---|---|
| Password Hashing | bcrypt with salt rounds | `auth.controller.ts` |
| JWT Access Tokens | jsonwebtoken with configurable expiry | `auth.middleware.ts` |
| JWT Refresh Tokens | Stored in user_sessions table | `auth.controller.ts` |
| Session Management | Multi-device sessions with IP/UA tracking | `UserSession` model |
| Login History | Full login audit trail | `LoginHistory` model |
| Failed Login Lockout | Auto-lock after N failed attempts | `User.failedLoginAttempts` |
| Force Password Change | Admin-triggered password reset | `User.forcePasswordChange` |
| Rate Limiting | Auth: strict; API: general | `rateLimit.middleware.ts` |
| Input Sanitization | XSS prevention on all inputs | `sanitize.middleware.ts` |
| HTTP Security Headers | Helmet.js (CSP, HSTS, X-Frame, etc.) | `app.ts` |
| CORS Whitelist | Origin-based with credential support | `app.ts` |
| Activity Logging | All user actions tracked | `UserActivityLog` model |
| Security Audit Log | Critical action auditing | `SecurityAuditLog` model |

---

## 9. Role-Based Access Control (RBAC)

### Role Hierarchy

```mermaid
graph TD
    SA["Super Admin"] --> P["Principal"]
    SA --> VP["Vice Principal"]
    SA --> COE["Controller of Examinations"]
    SA --> DA["Dean Academics"]
    SA --> AD["Admission Dean"]
    P --> HOD["Head of Department"]
    HOD --> F["Faculty"]
    HOD --> M["Mentor"]
    F --> S["Student"]
    M --> S
    S --> PA["Parent"]
    SA --> IQAC["IQAC Coordinator"]
```

### Permission Model

```
Permission Format: "module:action"
Examples: "students:read", "students:write", "timetable:manage", "*:*"

Wildcards:
  - "*:*"            Full system access (Super Admin)
  - "module:*"       All actions on a module
  - "module:manage"  Full CRUD on a module
```

### Role-Permission Matrix

| Role | Dashboard | Students | Faculty | Academics | Exams | Timetable | Placements | Settings |
|---|---|---|---|---|---|---|---|---|
| **Super Admin** | Full | Full | Full | Full | Full | Full | Full | Full |
| **Principal** | View | View | View | View | View | View | View | View |
| **COE** | View | -- | -- | View | Full | Full | -- | -- |
| **Dean Academics** | View | -- | -- | Full | View | Full | -- | -- |
| **HOD** | Dept | Dept | Dept | Dept | Dept | Read | Dept | -- |
| **Faculty** | Own | Own | Own | View | Entry | Read | -- | -- |
| **Student** | Own | Self | -- | View | View | Read | Apply | -- |
| **Parent** | Ward | Ward | -- | -- | Ward | Read | -- | -- |

---

## 10. UI/UX Design System

### Design Token Architecture

```css
/* Light Theme (HSL-based) */
--background: 220 33% 98%;        /* Warm premium white */
--foreground: 224 71.4% 4.1%;     /* Near-black text */
--primary: 263.4 70% 50.4%;       /* Premium Purple/Indigo */
--card: 0 0% 100%;                /* Pure white cards */
--muted: 220 14.3% 95.9%;         /* Subtle gray backgrounds */
--border: 220 13% 91%;            /* Light borders */
--radius: 0.75rem;                /* Rounded corners */

/* Dark Theme */
--background: 224 71.4% 4.1%;     /* Sleek dark slate */
--card: 224 71.4% 4.1%;           /* Dark cards */
--secondary: 215 27.9% 16.9%;     /* Elevated dark surfaces */
```

### Component Library (15 Primitives)

| Component | Description |
|---|---|
| `Button` | Multi-variant button with loading states |
| `Input` | Form input with validation display |
| `Modal` | Radix-based dialog modal |
| `Table` | Data table with sorting |
| `Select` | Radix-based custom select |
| `Search` | Debounced search input |
| `Filter` | Filter dropdown panel |
| `Pagination` | Page navigator |
| `Toast` | Notification toast |
| `Loading` | Spinner with text |
| `Skeleton` | Loading placeholder |
| `DatePicker` | Date selection input |
| `FileUpload` | Drag-and-drop file uploader |
| `EmptyState` | Empty data placeholder |
| `ConfirmationDialog` | Destructive action confirmation |

### Responsive Breakpoints

| Breakpoint | Width | Layout |
|---|---|---|
| Mobile | < 640px | Single column, Bottom Nav, collapsed sidebar |
| Tablet | 640px - 1024px | Two column, collapsible sidebar |
| Desktop | > 1024px | Full sidebar + content + detail panels |

---

## 11. API Endpoints Inventory

### Route Mounting Map

| Base Path | Module | Auth Required |
|---|---|---|
| `GET /api/health` | Health Check | No |
| `/api/auth/*` | Authentication | No (rate limited) |
| `/api/dashboard/*` | Dashboard | Yes |
| `/api/users/*` | Users | Yes |
| `/api/roles/*` | Roles | Yes |
| `/api/settings/*` | Settings | Yes |
| `/api/academics/*` | Academics | Yes |
| `/api/masters/*` | Masters | Yes |
| `/api/security/*` | Security | Yes |
| `/api/backups/*` | Backups | Yes |
| `/api/files/*` | Files | Yes |
| `/api/notifications/*` | Notifications | Yes |
| `/api/reports/*` | Reports | Yes |
| `/api/enterprise/*` | Enterprise | Yes |
| `/api/workflows/*` | Workflows | Yes |
| `/api/timetables/*` | Timetables | Yes |
| `/api/ai/*` | AI Advisor | Yes |
| `/api/assignments/*` | Assignments | Yes |
| `/api/chat/*` | Chat | Yes |
| `/api/circulars/*` | Circulars | Yes |

### Key Enterprise Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/enterprise/students` | List students (filtered by role scope) |
| `POST` | `/api/enterprise/students` | Create student |
| `GET` | `/api/enterprise/faculty` | List faculty |
| `POST` | `/api/enterprise/faculty` | Create faculty |
| `GET` | `/api/enterprise/attendance/*` | Attendance records |
| `POST` | `/api/enterprise/marks` | Marks entry |
| `GET` | `/api/enterprise/master-timetable/view` | Centralized timetable (Single Source of Truth) |
| `POST` | `/api/enterprise/master-timetable/publish` | Publish timetable (COE/Dean only) |
| `POST` | `/api/enterprise/master-timetable/conflict-check` | 12-point conflict detection |
| `GET` | `/api/enterprise/master-timetable/audit-logs` | Timetable audit trail |
| `POST` | `/api/enterprise/certificates/apply` | Apply for certificate |
| `GET` | `/api/enterprise/gamification/profile` | Gamification profile |
| `GET` | `/api/enterprise/gamification/leaderboard` | XP leaderboard |
| `GET` | `/api/enterprise/quizzes` | List quizzes |
| `POST` | `/api/enterprise/quizzes/:id/submit` | Submit quiz attempt |

---

## 12. How to Convert to Mobile App

There are **3 proven approaches** to convert this web application into native Android and iOS apps.

---

### Approach 1: Capacitor.js (RECOMMENDED - Fastest)

**Best for**: Shipping to Play Store and App Store quickly while reusing 100% of existing code.

**What is Capacitor?**
Capacitor (by Ionic) wraps your web app in a native WebView container, giving it access to native device APIs (Camera, GPS, Push Notifications, Biometrics, etc.) while running your exact React code.

#### Step-by-Step Guide

```bash
# 1. Install Capacitor in the client project
cd client
npm install @capacitor/core @capacitor/cli

# 2. Initialize Capacitor
npx cap init "GEETORUS CAMPUSOS" "com.geetorus.campusos" --web-dir dist

# 3. Build the production frontend
npm run build

# 4. Add Android and iOS platforms
npx cap add android
npx cap add ios

# 5. Sync web assets to native projects
npx cap sync

# 6. Open in Android Studio / Xcode
npx cap open android    # Opens Android Studio
npx cap open ios        # Opens Xcode (macOS only)
```

#### Required Configuration Changes

**capacitor.config.ts:**
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.geetorus.campusos',
  appName: 'GEETORUS CAMPUSOS',
  webDir: 'dist',
  server: {
    // For development - point to your local API
    url: 'http://YOUR_LOCAL_IP:5173',
    cleartext: true,
    // For production - use your hosted API URL
    // url: 'https://api.geetorus.com'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1e1b4b',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
```

**Update vite.config.ts for mobile:**
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // Allow network access for mobile testing
    port: 5173,
  },
  build: {
    outDir: 'dist',
  },
});
```

**Update API base URL in lib/axios.ts:**
```typescript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://api.geetorus.com/api',
});
```

#### Native Features to Add

```bash
# Camera (for profile photo upload)
npm install @capacitor/camera

# Push Notifications
npm install @capacitor/push-notifications

# Biometric Auth (fingerprint/face)
npm install @capacitor/biometric-auth

# File System (for downloads)
npm install @capacitor/filesystem

# Local Notifications
npm install @capacitor/local-notifications

# Network Status
npm install @capacitor/network

# Geolocation (for transport tracking)
npm install @capacitor/geolocation

# Share (for sharing ID cards, documents)
npm install @capacitor/share

# Haptics (for gamification feedback)
npm install @capacitor/haptics
```

#### Build for Release

```bash
# Android APK/AAB
cd android
./gradlew assembleRelease     # APK
./gradlew bundleRelease       # AAB (Play Store)

# iOS
# Open Xcode then Product then Archive then Distribute to App Store
```

#### Pros and Cons

| Pros | Cons |
|---|---|
| 100% code reuse | WebView performance (not truly native) |
| Ship in 1-2 days | Large bundle size (~30-50MB) |
| One codebase for Web + Android + iOS | Complex animations may lag |
| Full native API access | Requires Android Studio and Xcode |
| Hot reload during development | |

---

### Approach 2: React Native (Full Native - Best Performance)

**Best for**: Premium native experience with smooth 60fps animations.

#### What Can Be Shared (Effort Savings)

| Layer | Reusable | Effort |
|---|---|---|
| API Client (axios.ts) | 100% | Copy directly |
| Types and Interfaces | 100% | Copy directly |
| Zod Schemas | 100% | Copy directly |
| Auth Logic | 90% | Replace localStorage with AsyncStorage |
| React Query Hooks | 90% | Copy with minor changes |
| UI Components | 0% | Full rewrite to RN components |
| Pages | 10% | Rewrite layout, keep logic |
| Navigation | 0% | React Navigation replaces React Router |
| CSS/Styling | 0% | StyleSheet or NativeWind |

#### Setup

```bash
# Create React Native project
npx react-native@latest init GeetorusCampusOS --template react-native-template-typescript

# OR with Expo (easier)
npx create-expo-app@latest GeetorusCampusOS --template expo-template-blank-typescript

# Key dependencies
npm install @react-navigation/native @react-navigation/stack
npm install react-native-paper
npm install nativewind
npm install @tanstack/react-query axios zod
npm install react-native-vector-icons
npm install react-native-reanimated
npm install @react-native-async-storage/async-storage
```

#### Estimated Effort: 4-8 weeks for 2 developers

| Pros | Cons |
|---|---|
| True native performance | 60-70% code rewrite needed |
| Native animations (Reanimated) | Longer development time |
| Smaller app size (~15-25MB) | Maintain 2 codebases (web + mobile) |
| Better user experience | Need native dev knowledge |
| OTA updates (with Expo/CodePush) | |

---

### Approach 3: Progressive Web App (PWA - Zero App Store)

**Best for**: Instant deployment without Play Store/App Store, works offline.

The project already has a `registerServiceWorker.ts` file, indicating PWA readiness.

#### Steps to Enable Full PWA

**1. Create public/manifest.json:**
```json
{
  "name": "GEETORUS CAMPUSOS",
  "short_name": "CampusOS",
  "description": "Enterprise College ERP System",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#1e1b4b",
  "theme_color": "#6366f1",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**2. Create public/sw.js (Service Worker):**
```javascript
const CACHE_NAME = 'campusos-v1';
const urlsToCache = ['/', '/index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

**3. Add to index.html:**
```html
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#6366f1" />
<meta name="apple-mobile-web-app-capable" content="yes" />
```

| Pros | Cons |
|---|---|
| Zero code changes needed | No Play Store/App Store presence |
| Instant deployment | Limited native API access |
| No app review process | iOS PWA has limitations |
| Auto-updates | No push notifications on iOS |
| Works offline (cached assets) | Cannot access Bluetooth, NFC, etc. |

---

### Recommendation Matrix

| Criteria | Capacitor | React Native | PWA |
|---|---|---|---|
| **Development Time** | 1-2 days | 4-8 weeks | 1 day |
| **Code Reuse** | 100% | 30-40% | 100% |
| **Performance** | Good | Excellent | Good |
| **App Store Presence** | Yes | Yes | No |
| **Native Features** | Yes (via plugins) | Yes (full) | Limited |
| **Maintenance** | Low | High | Very Low |
| **Best For** | Quick launch | Premium experience | Internal use |

**Recommended Strategy**: Start with **Capacitor** for immediate Play Store/App Store launch (1-2 days). If user feedback demands smoother native performance, plan a **React Native** rewrite of critical screens (Dashboard, Timetable, Attendance) in Phase 2.

---

## 13. Production Deployment Guide

### Architecture for Production

```mermaid
graph LR
    subgraph CDN["CDN - Cloudflare / AWS CloudFront"]
        A["Static Assets dist/"]
    end

    subgraph LB["Load Balancer - Nginx / AWS ALB"]
        B["SSL Termination + Reverse Proxy"]
    end

    subgraph App["App Servers - 2+ instances"]
        C1["Node.js Express Instance 1"]
        C2["Node.js Express Instance 2"]
    end

    subgraph DB["Database"]
        D["PostgreSQL Primary"]
        E["PostgreSQL Replica Read"]
    end

    A --> B
    B --> C1
    B --> C2
    C1 --> D
    C2 --> E
```

### Database Migration (SQLite to PostgreSQL)

**1. Update schema.prisma:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**2. Update .env:**
```bash
DATABASE_URL="postgresql://user:password@host:5432/geetorus_campusos?schema=public"
```

**3. Run migration:**
```bash
npx prisma migrate dev --name init_postgres
npx prisma db seed
```

### Docker Deployment

**Dockerfile (Server):**
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./
EXPOSE 5000
CMD ["node", "dist/server.js"]
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: geetorus_campusos
      POSTGRES_USER: geetorus
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  server:
    build: ./server
    depends_on:
      - db
    environment:
      DATABASE_URL: postgresql://geetorus:${DB_PASSWORD}@db:5432/geetorus_campusos
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
    ports:
      - "5000:5000"

  client:
    build: ./client
    ports:
      - "80:80"

volumes:
  pgdata:
```

### Hosting Options

| Provider | Cost (Est.) | Best For |
|---|---|---|
| **AWS (EC2 + RDS + S3)** | $50-200/mo | Enterprise scale |
| **DigitalOcean (Droplet + Managed DB)** | $20-60/mo | Startups |
| **Railway** | $10-40/mo | Quick deploy |
| **Render** | $15-50/mo | Auto-deploy from Git |
| **Vercel (Client) + Railway (Server)** | $20-40/mo | Split hosting |
| **Self-Hosted (College Server)** | Hardware cost | Full control |

---

## 14. Environment Variables Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | Yes | `5000` | Server port |
| `NODE_ENV` | Yes | `development` | Environment (development / production / test) |
| `DATABASE_URL` | Yes | `file:./dev.db` | Database connection string |
| `JWT_SECRET` | Yes | -- | JWT signing key (min 8 chars, use 64+ in prod) |
| `JWT_EXPIRES_IN` | No | `1d` | Access token expiry |
| `LOG_LEVEL` | No | `info` | Winston log level (error/warn/info/http/debug) |
| `ALLOWED_ORIGINS` | No | `http://localhost:5173,http://localhost:3000` | CORS whitelist (comma-separated) |

---

## 15. Development Setup Guide

### Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- **Git**
- **VS Code** (recommended with Prisma and Tailwind extensions)

### Quick Start

```bash
# Clone and setup
git clone <repository-url>
cd product

# --- Backend ---
cd server
cp .env.example .env        # Configure environment
npm install                  # Install dependencies (auto-generates Prisma client)
npx prisma db push           # Create database tables
npx prisma db seed           # Seed initial data
npm run dev                  # Start API server on port 5000

# --- Frontend (in new terminal) ---
cd ../client
npm install                  # Install dependencies
npm run dev                  # Start Vite dev server on port 5173
```

### Useful Commands

```bash
# Database
npx prisma studio            # Visual database browser (port 5555)
npx prisma migrate dev       # Create and apply migrations
npx prisma db push           # Push schema without migration history
npx prisma generate          # Regenerate Prisma Client

# Build
cd client && npm run build   # Production frontend build
cd server && npm run build   # Compile TypeScript

# Type Check
cd client && npx tsc --noEmit  # Frontend type verification
```

---

> **Document Generated**: July 2026
> **Product**: GEETORUS CAMPUSOS v1.0.0
> **Total Database Models**: 71
> **Total Source Files**: 201
> **Total Lines of Code**: ~61,780
