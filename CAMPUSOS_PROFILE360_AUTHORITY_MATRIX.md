# GEETORUS CAMPUSOS — PROFILE360 AUTHORITY MATRIX REPORT
**Module Focus**: Student360 & Staff360 Role-Authority Visibility Matrix  
**Date**: August 19, 2026  
**Status**: BUILD VERIFIED  

---

## 1. Overview & Architecture

CampusOS implements `UniversalProfileWorkspace.tsx` as a single unified 360-degree view for Students, Faculty, and Staff. Sensitive fields and sections are strictly gated according to the viewer's active role and authority domain. No duplicate profile schemas or shadow tables are created.

---

## 2. Profile360 Authority Access Matrix

| Authority / Role | Target Profile | Overview & Identity | Academic / Workload | Attendance & Leaves | Grievance / Complaints | Disciplinary & Sensitive Notes | Administrative Control |
|---|---|---|---|---|---|---|---|
| **Student** | Self | Full | Own enrolled courses & GPA | Own verified log | Own filed grievances | Denied | Personal prefs only |
| **Student** | Other Student | Directory only (Name/Dept) | Denied | Denied | Denied | Denied | Denied |
| **Faculty** | Self | Full | Assigned courses & schedule | Own attendance & leave | Denied | Denied | Personal prefs only |
| **Faculty** | Other Faculty | Directory only | Timetable view | Denied | Denied | Denied | Denied |
| **Mentor** | Assigned Mentee | Full | Semester marks & risk score | Full attendance & leave queue | Scoped mentee complaints | Mentoring notes allowed | Denied |
| **Class Adviser** | Section Student | Full | Section marks & attendance | Section leaves/OD | Scoped section grievances | Class advisory log | Denied |
| **HOD** | Dept Student / Faculty | Full | Full dept academics & workload | Full dept leave management | Full department complaints | Disciplinary recommendations | Scoped timetable/delegations |
| **Academic Dean** | Institutional Students/Staff | Full | Institutional CGPA / Workload | Cross-dept attendance & OD | Cross-dept grievances | Executive escalation review | Academic approvals |
| **VP** | Institution-wide | Full | Institution analytics | Operational tracking | All operational grievances | Operational review | Delegation / Acting Principal |
| **Principal** | Institution-wide | Full | Institutional strategic view | Executive audit | All escalated grievances | Final disciplinary authority | Governance delegation |
| **Accountant** | Student | Fee identity only | Fee summary only | Denied | Fee disputes only | Denied | Denied |
| **Hostel Warden**| Hosteller Student | Resident identity | Room/Hostel details | Mess & hostel leave | Hostel grievances only | Residential infractions | Denied |
| **Transport Mgr**| Transport Student | Route & stop identity | Transport badge | Bus attendance log | Bus grievances only | Fleet incidents | Denied |
| **Super Admin** | Any User | Full Identity & IAM | Full system domain links | Full operational logs | Full audit logs | Full institutional audit | Full User Lifecycle Control |

---

## 3. Profile Features & Mobile Responsiveness

- **Mobile Viewport**: Segmented horizontal tabs with icon identifiers prevent horizontal clutter.
- **Achievements & Honors**: Shows official credentials (Dean's list, SIH hackathons, AWS cloud certifications, IEEE research publications, Patents granted, AICTE FDPs).
- **Grievance History**: Displays count breakdown (`Open`, `In Progress`, `Resolved`, `Escalated`) + recent 3–4 items with status chips for authorized leadership roles.

---

## 4. Verification Status
- **Viewer Role Authority Gating**: TEST VERIFIED
- **Student Privacy & Non-Leakage**: TEST VERIFIED
- **UI Architecture**: BUILD VERIFIED
