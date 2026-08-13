# Permission scope matrix

| Boundary | Backend source | Status |
| --- | --- | --- |
| Authentication | JWT signature plus current active user record | VERIFIED |
| Active workspace | Explicit database assignments | VERIFIED |
| Workspace permissions | Active role-permission joins reloaded per request | VERIFIED |
| Department membership | `DepartmentMembership` plus legacy primary department | IMPLEMENTED, multi-department enforcement audit PLANNED |
| Acting Principal | Delegation records | IMPLEMENTED, identity audit PLANNED |
| Student self/peer access | Student and relationship records | PLANNED |
| Parent access | `ParentStudentRelation` | PLANNED |
| Mentor access | `MentorAssignment` | PLANNED |
| Cross-workspace Dean privacy | Active workspace plus route guards | Workspace boundary VERIFIED; module-level tests PLANNED |

`requireRole` now keeps Dean roles distinct and requires an active delegation before VP can satisfy a Principal/Acting Principal route. Route-by-route entity-scope checks remain PLANNED because a role guard must not replace entity or workspace scope checks.
