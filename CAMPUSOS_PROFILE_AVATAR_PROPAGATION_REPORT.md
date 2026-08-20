# CampusOS — Profile Avatar Propagation Report

**Date**: August 20, 2026  
**Scope**: User Profile Media Service, Authentication Service, Multi-Role Workspace Switcher, and Universal Avatar Resolution.

---

## 1. Architectural Principle: "One Person = One Avatar"

In an academic institution, a staff member may hold multiple active campus roles:
- **Faculty** (Teacher for assigned courses)
- **Class Adviser** (Class mentor for a specific batch)
- **Mentor** (Proctor for individual mentee students)
- **HOD** (Head of Department)

Regardless of which workspace or active role the user switches to, their **identity is singular**, and their profile photograph must remain consistent everywhere.

---

## 2. Root Cause Analysis of Previous Dropouts

1. **Raw Database Field vs Canonical Descriptor**:
   - The user's uploaded avatar image is stored in `MediaFile` with foreign key `profileImageFileId` on `User`.
   - The raw column `user.profilePhoto` may be `null` while `user.profileImageFileId` is populated.
   - When calling `authService.login()` or `authService.switchWorkspace()`, the server previously returned `profilePhoto: user.profilePhoto` instead of calling `profileImageDescriptor(user)`.
   - As a result, switching from Faculty to HOD caused the client-side user object to receive `profilePhoto: null`.

2. **Resolution Applied**:
   - In `product/server/src/modules/auth/auth.service.ts`:
     - Updated `login`, `switchWorkspace`, and `getMe` to execute:
       ```ts
       const canonicalProfileImage = profileImageDescriptor(user as any);
       return {
         ...payload,
         user: {
           ...user,
           profilePhoto: canonicalProfileImage.url,
           profileImage: canonicalProfileImage,
         }
       };
       ```
   - In `product/client/src/auth/AuthProvider.tsx`:
     - Ensured `formatUserWithCacheBust` prioritizes `userData.profileImage?.url || userData.profilePhoto`.
     - Standardized `refreshUser()` to sync updated image descriptors across all open tabs.

---

## 3. Propagation Matrix Across CampusOS Components

| Surface | Component | Avatar Resolver | Status |
| :--- | :--- | :--- | :--- |
| **Top App Header** | `Header.tsx` / `RoleHeader.tsx` | `<ProfileAvatar person={user} size="sm" shape="circle" />` | **VERIFIED** |
| **User Profile Page** | `Profile.tsx` / `UniversalProfileWorkspace.tsx` | `<ProfileAvatar person={user} size="2xl" shape="rounded" />` | **VERIFIED** |
| **Role Switcher Menu** | `ProfileMenu.tsx` | `<ProfileAvatar person={user} size="md" shape="circle" />` | **VERIFIED** |
| **Document Comments** | `CampusOfficeWorkspace.tsx` / `WorkspaceShareModal.tsx` | `<ProfileAvatar person={comment.author} size="xs" shape="circle" />` | **VERIFIED** |
| **Hall Tickets & IDs** | `CoeHallTicketsPage.tsx` / `StudentIdCard.tsx` | `<ProfileAvatar person={student} size="lg" shape="square" />` | **VERIFIED** |
| **Student-Advisor Chat**| `StudentAdvisorChat.tsx` | `<ProfileAvatar person={advisor} size="md" shape="circle" />` | **VERIFIED** |

---

## 4. Verification

- Automated test in `verify_ui_workspace_avatar.ts` verified that `getMe()` and role switches retain the valid canonical avatar URL with checksum.
