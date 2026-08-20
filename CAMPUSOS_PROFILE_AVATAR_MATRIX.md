# CampusOS Profile Avatar Matrix

Date: 2026-08-19

| Surface/API | Canonical source | Gender fallback | Authenticated bytes | Status |
|---|---|---|---|---|
| Login response | `User.profileImageFileId` descriptor | Client shared component | Yes | IMPLEMENTED |
| `/auth/me` | Same User descriptor | Included gender | Yes | IMPLEMENTED |
| Workspace switch response | Same User descriptor | Preserved current profile | Yes | IMPLEMENTED |
| Top-header profile menu | Shared `ProfileAvatar` | Yes | Yes | BUILD VERIFIED |
| Main profile page | Shared `ProfileAvatar` | Yes | Yes | BUILD VERIFIED |
| Self-service photo edit | Canonical MediaFile transaction | After remove/failure | Yes | BUILD VERIFIED |
| Universal 360 profile | Same User descriptor | Yes | Yes | BUILD VERIFIED |
| User directory | Same User descriptor | Yes | Yes | BUILD VERIFIED |
| Student directory | Same linked User descriptor | Yes | Yes | BUILD VERIFIED |
| Faculty directory | Same linked User descriptor | Yes | Yes | BUILD VERIFIED |
| Student 360 API | Same linked User descriptor | Included gender | Yes | BUILD VERIFIED |
| Staff 360 API | Same linked User descriptor | Included gender | Yes | BUILD VERIFIED |
| Student/faculty chat search | Same linked User descriptor | Included gender | Yes | BUILD VERIFIED |
| Chat conversation participant | Same linked User descriptor | Included gender | Yes | BUILD VERIFIED |
| Complaint monitoring feed | Same linked User descriptor | Client fallback | Yes | BUILD VERIFIED |
| Placement records | Same linked User descriptor | Client fallback | Yes | BUILD VERIFIED |
| Student/Faculty digital ID data | Same linked User descriptor | Client fallback | Yes | BUILD VERIFIED |
| ID-card PDF | Canonical file resolved internally | PDF placeholder | Internal only | BUILD VERIFIED |
| Attendance PDF | Canonical file resolved internally | Initials placeholder | Internal only | BUILD VERIFIED |
| Parent linked-child views | Child User descriptor through student APIs | Included student gender | Yes | STATICALLY VERIFIED |
| Super Admin/College Admin user edit | Canonical User gender and audit | Yes | Yes | STATICALLY VERIFIED |
| Web physical interaction | Same design | Expected | Expected | NOT VERIFIED |
| Android physical interaction | Same Capacitor bundle | Expected | Expected | NOT VERIFIED |
| iOS physical interaction | Same Capacitor bundle | Expected | Expected | NOT VERIFIED |

## Build artifacts

| Artifact | Evidence | Status |
|---|---|---|
| Web production bundle | `product/client/dist` | BUILD VERIFIED |
| Android sync | Capacitor 13-plugin sync | BUILD VERIFIED |
| Android debug APK | `product/client/android/app/build/outputs/apk/debug/app-debug.apk` | BUILD VERIFIED |
| APK SHA-256 | `AAD9802A2C328E1BCA6F9811F0599CE39B3780568AC3819E262865CF56BD5A71` | STATICALLY VERIFIED |
| APK size | 21,556,007 bytes | STATICALLY VERIFIED |
