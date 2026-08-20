# CampusOS Transport V2 — Role & Eligibility Matrix

## 1. Role-Based Access Control Specification

Every authenticated session is evaluated through `TransportService.getMyAllocation(userId, targetStudentId)` to enforce strict role isolation, appropriate feature presentation, and correct UX state.

---

## 2. Comprehensive Eligibility Matrix

| User Role | Residential Type | Transport Mode | Active Allocation | Result Payload | UI Presentation & Action |
|---|---|---|---|---|---|
| **Student** | `DAY_SCHOLAR` | `COLLEGE_BUS` | **YES** | `{ isEligible: true, route, assignedStop, vehicle, liveLocation, etaMinutes }` | **Full Live Tracking**: Interactive vector map, bus marker with real heading angle, dynamic ETA card, driver contact, ordered stops timeline. |
| **Student** | `DAY_SCHOLAR` | `COLLEGE_BUS` | **NO** | `{ isEligible: false, reason: 'ALLOCATION_PENDING' }` | **Allocation Pending Banner**: Deep-link to apply for college bus pass or choose pickup stop. |
| **Student** | `DAY_SCHOLAR` | `SELF_COMMUTE` / `WALK` / `PUBLIC_BUS` | **NO** | `{ isEligible: false, reason: 'NON_COLLEGE_BUS', transportMode }` | **Commute Profile View**: Displays registered self-commute preferences with quick action "Apply for College Bus Pass". |
| **Student** | `HOSTELLER` | `NONE` | N/A | `{ isEligible: false, reason: 'HOSTELLER', studentType: 'HOSTELLER' }` | **Hostel Resident Status**: Clean notice that daily bus tracking is not applicable, with 1-click deep-link to the **Hostel Resident Portal**. |
| **Faculty / Staff** | Any | Any | **YES** | `{ isEligible: true, passengerType: 'FACULTY', route, assignedStop, vehicle, liveLocation, etaMinutes }` | **Faculty Bus Tracking**: Full interactive live tracking map, pickup stop alerts, driver details, replacement bus notifications. **Independent of academic department**. |
| **Faculty / Staff** | Any | Any | **NO** | `{ isEligible: false, reason: 'NO_EMPLOYEE_ALLOCATION' }` | **Employee Transit Pass Desk**: Information card with instructions to register for institutional faculty transport. |
| **Parent** | N/A | N/A | **YES** (Ward) | `{ isEligible: true, passengerType: 'STUDENT_WARD', route, assignedStop, vehicle, liveLocation, etaMinutes }` | **Ward Safety Tracking**: Real-time live bus tracking for linked children with approaching stop push notifications. |
| **Parent** | N/A | N/A | **NO** | `{ isEligible: false, reason: 'ALLOCATION_PENDING' / 'HOSTELLER' }` | **Parent Transit Notice**: Status of ward (Hosteller / Non-bus day scholar). |
| **Transport Manager** / **Admin** | N/A | N/A | N/A | Full Fleet API Access (`/fleet-live`, `/routes/:id/passengers`, `/trips/replace-vehicle`) | **Fleet Live Control Centre**: Fleet overview grid, active GPS pings, vehicle replacement modal, breakdown dispatcher, passenger directories. |

---

## 3. Hosteller Exclusion Integrity

Hosteller students living on campus do not commute via college bus. Transport V2 explicitly prevents confusion:

```typescript
if (student.residentialType === 'HOSTELLER') {
  return {
    isEligible: false,
    passengerType: 'STUDENT',
    studentType: 'HOSTELLER',
    reason: 'HOSTELLER',
    message: 'You are registered as an On-Campus Hosteller Resident. Daily College Bus tracking is not applicable.',
  };
}
```

The client UI renders a dedicated card explaining their resident status with a button linking to `/student/hostel`.

---

## 4. Cross-Department Faculty Independence

Faculty members from any academic department (CSE, Mechanical, Civil, Electrical, Humanities) can be assigned to transit corridors without altering their department affiliations or permissions.

```typescript
// Verified Test Scenario 5:
// Prof. Venkatesh (Mechanical Dept) assigned to Route 06 (Vadavalli Metro)
const tracking = await transportService.getMyAllocation(mechFacultyUser.id);
// Returns: isEligible: true, routeName: "Route 06 — Vadavalli Metro", Stop: "Vadavalli Bus Stand"
```
