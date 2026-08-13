# Role and workspace matrix

Source of truth: active primary `Role`, active `UserWorkspace.roleName`, and active secondary `UserRole` records.

| Role/responsibility | Required workspace policy | Current verification |
| --- | --- | --- |
| Student | Student only | Assignment enforcement VERIFIED; data fixtures PLANNED |
| Parent | Parent only, linked-child scope | Assignment enforcement VERIFIED; linked-child E2E PLANNED |
| Faculty | Faculty; Mentor only when explicitly assigned | VERIFIED in authorization logic |
| HOD | HOD; Faculty only when explicitly assigned | VERIFIED in authorization logic |
| Academic Dean | Academic Dean and COE when assigned | Enforcement VERIFIED; COE assignment migration PLANNED |
| IQAC Dean | IQAC Dean and Faculty when assigned | Enforcement VERIFIED; institutional assignment data PLANNED |
| Admission Dean | Admission Dean and Faculty when assigned | Enforcement VERIFIED; EEE assignment data PLANNED |
| Vice Principal | Vice Principal; Acting Principal only through valid delegation | Workspace enforcement VERIFIED; delegation E2E PLANNED |
| Principal | Principal | Assignment enforcement VERIFIED |
| Super Admin | Super Admin | Assignment enforcement VERIFIED |

No client fallback may create Faculty, Mentor, Dean, or executive access.

