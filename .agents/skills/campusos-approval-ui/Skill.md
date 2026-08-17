---
name: campusos-approval-ui
description: Use whenever creating, fixing, standardizing, reviewing, or extending any CampusOS request, approval, workflow-review, pending-action, notification-deep-link, or approval-detail UI. The existing Faculty Leave/OD Approval UI is the canonical visual and interaction reference. Reuse the same approval experience instead of creating module-specific designs.
---

# CampusOS Approval UI Standard

## Purpose

CampusOS must have ONE consistent approval/request experience.

The existing live Faculty Leave/OD Approval UI is the canonical design reference.

Whenever implementing or modifying:

- Student Leave/OD
- Faculty Leave/OD
- Mentor approvals
- Class Adviser approvals
- HOD approvals
- Dean approvals
- Principal/VP approvals
- Certificate requests
- Purchase approvals
- Appraisal
- Reports
- HR workflows
- Relieving
- Clearance
- Grievance
- Office requests
- IQAC reviews
- Accounts approvals
- COE workflows
- Hostel/Transport/Library requests
- Any future workflow-driven request

use this skill.

Do NOT design a new approval UI independently.

---

# 1. First Inspect Existing Faculty Leave/OD Approval

Before implementation:

1. Locate the LIVE Faculty Leave/OD approval route/component.
2. Inspect:
   - list/inbox
   - request card
   - requester details
   - metadata layout
   - request details
   - reason
   - attachments
   - context cards
   - workflow timeline
   - comments
   - status badges
   - action buttons
   - confirmation dialog
   - loading
   - empty state
   - errors
   - mobile behavior
3. Use it as the design reference.

Never assume an orphan/legacy component is canonical.

---

# 2. Shared Approval Architecture

Prefer reusable components such as:

- ApprovalInbox
- ApprovalList
- ApprovalCard
- ApprovalHeader
- ApprovalRequesterCard
- ApprovalMetadataGrid
- ApprovalDetailSection
- ApprovalContextSection
- ApprovalAttachments
- ApprovalWorkflowTimeline
- ApprovalComments
- ApprovalHistory
- ApprovalActionBar
- ApprovalActionDialog
- ApprovalStatusBadge
- ApprovalPriorityBadge
- ApprovalSLAIndicator
- ApprovalSkeleton
- ApprovalEmptyState
- ApprovalErrorState

Do NOT copy/paste the Faculty Leave UI into every module.

Extract and reuse.

---

# 3. Canonical Detail Layout

Every approval detail should follow:

REQUEST HEADER
→ Request type
→ Request ID
→ Status
→ Submitted time

REQUESTER / SUBJECT
→ Name
→ Role
→ Department
→ Programme/Class/Section where applicable
→ Avatar/photo

REQUEST DETAILS
→ Domain-specific data

CONTEXT
→ Relevant supporting information

ATTACHMENTS / EVIDENCE

WORKFLOW TIMELINE

COMMENTS / HISTORY

ACTION BAR
→ Approve / Forward
→ Return
→ Reject
→ Other allowed workflow actions

---

# 4. Same Shell, Domain-Specific Content

Keep the approval shell consistent.

Only inject module-specific sections.

## Faculty Leave/OD

Show:

- Leave/OD type
- From/to dates
- Duration
- Leave balance
- Reason
- Attachment
- Affected timetable sessions
- Substitute faculty
- Department context

## Student Leave/OD

Show:

- Student details
- Register number
- Class/section
- Leave type
- Dates
- Duration
- Reason
- Attachment
- Attendance context
- Mentor/Class Adviser context

## Purchase

Show:

- Item/service
- Quantity
- Purpose
- Estimated amount
- Quotations
- Vendor
- Budget availability

## Appraisal

Show:

- Category
- Submission
- Evidence
- Claimed score
- Reviewer score
- Comments

## Certificate

Show:

- Certificate type
- Purpose
- Student details
- Supporting documents

## Relieving

Show:

- Employee
- Department
- Relieving date
- Clearance stages
- Pending clearances
- Assets/dues where authorized

---

# 5. Universal Approval Inbox

Use the same approval inbox pattern.

Filters:

- Pending
- Returned
- Approved
- Rejected
- Completed
- All

Optional filters:

- Request Type
- Department
- Date
- Priority
- Workflow Stage
- Requester

Search:

- Name
- Register Number
- Employee ID
- Request ID

---

# 6. Approval Card

Every card should clearly show:

- Requester
- Role/context
- Request type
- Main summary
- Status
- Current workflow stage
- Submitted time
- Priority/SLA where applicable

Example:

Suresh Kumar
Student • II IT-A

Leave Request
18 Aug 2026 → 19 Aug 2026

Pending Mentor Review
Submitted 12 mins ago

---

# 7. Action Standards

Primary:
- Approve
- Approve & Forward

Secondary:
- Return

Destructive:
- Reject

Optional if workflow permits:
- Reassign
- Escalate
- Request More Information
- Hold

Only display actions allowed by:

- Permission Engine
- Workflow stage
- Resource scope
- Delegation
- Module configuration

Backend remains authoritative.

---

# 8. Confirmation Dialog

Before an important workflow action, show:

- Action
- Request summary
- Comment/reason field
- Next-stage preview
- Confirm
- Cancel

Example:

Approve Leave Request

Current Stage:
Mentor Review

Next Stage:
HOD Review

For Return/Reject, require reason according to workflow policy.

---

# 9. Workflow Timeline

Use the same timeline UI across modules.

Example:

✓ Student Submitted
16 Aug • 10:42 AM

✓ Mentor Approved
16 Aug • 11:05 AM

● HOD Review
Pending

○ Principal Review
Not Started

Display when allowed:

- actor
- role
- timestamp
- action
- comment
- delegation

---

# 10. Notification Deep Links

Every approval notification must open the exact request.

Never route to:

- generic dashboard
- dead route
- nonexistent page

Use centralized route builders.

Example:

STUDENT_LEAVE_SUBMITTED
→ exact Mentor Leave Approval Detail

FACULTY_LEAVE_SUBMITTED
→ exact HOD approval detail

PURCHASE_REQUESTED
→ exact purchase request detail

Old/processed requests should still open history/details rather than 404.

---

# 11. Route Rules

Avoid hardcoded route strings spread across modules.

Use one route resolver such as:

getApprovalRoute({
  requestType,
  requestId,
  workspace
})

Routes must support:

- direct browser load
- refresh
- notification click
- mobile deep link
- cold launch

---

# 12. Request Identity

Do not confuse:

- domain request ID
- workflow instance ID
- notification ID
- entity ID

Notification `entityId` should reference the canonical domain request unless architecture explicitly defines otherwise.

Keep workflow instance ID separately.

---

# 13. Realtime Updates

When a request arrives:

Business event
→ Notification
→ Approval inbox invalidation/refetch
→ New request appears

When an action is completed:

- Pending count updates
- Approval list updates
- Dashboard counters update
- Next reviewer receives notification
- Requester status updates

No logout/reload should be required.

---

# 14. Mobile Approval UX

Do NOT squeeze desktop layout into mobile.

Mobile detail order:

Header
→ Requester
→ Details
→ Context
→ Attachments
→ Timeline
→ Comments

Sticky bottom action bar:

Return | Reject | Approve

Requirements:

- safe-area aware
- thumb-friendly buttons
- no horizontal scrolling
- no header/status-bar overlap
- responsive cards

---

# 15. Processed Requests

If a reviewer opens an old notification after acting:

Do NOT show 404.

Open request detail and show:

"Approved by you. Currently Pending HOD Review."

If rejected/completed:
show final state + history.

---

# 16. Error States

Differentiate:

404:
Request genuinely does not exist.

403:
Request exists but current user has no access.

409 / stale state:
Request already processed or state changed.

Never use generic Page Not Found for every workflow error.

---

# 17. Security

Every action must validate server-side:

- authenticated user
- current workspace
- role/responsibility
- resource scope
- department/student/employee relationship
- workflow stage
- available action
- delegation where applicable

Frontend hiding is UX only.

---

# 18. Audit

Every:

- Approve
- Forward
- Return
- Reject
- Reassign
- Escalate

must create workflow history and centralized audit entry.

---

# 19. Notification Integration

Workflow transitions should automatically generate relevant notifications.

Example:

Student submits
→ Mentor notification

Mentor approves
→ HOD notification
→ Student status update

HOD approves
→ next reviewer or final completion notification

Do not create notification logic separately inside every page.

---

# 20. Super Admin Controls

Where appropriate Super Admin may configure:

- workflow stages
- stage labels
- reviewer roles
- SLA
- escalation
- required comment
- approval actions
- quick approval policy
- notification rules

The UI should consume effective configuration rather than hardcoded institutional rules.

---

# 21. Visual Consistency Rule

When uncertain about:

- typography
- spacing
- border radius
- status badge
- card hierarchy
- actions
- timeline
- comments
- responsive behavior

inspect and follow the current Faculty Leave/OD Approval UI.

Do not introduce a competing approval design language.

---

# 22. Migration Rule

When encountering an existing approval UI:

Classify:

- canonical
- live custom
- duplicate
- legacy
- dead

Preserve required domain features.

Move live functionality into the shared approval framework.

Remove duplicate/dead implementations only after references are migrated and tests pass.

---

# 23. Definition of Done

A workflow is not done merely because:

- page renders
- API returns 200
- notification exists

Done requires:

Request created
→ Correct workflow stage
→ Correct reviewer
→ Approval inbox shows request
→ Notification opens exact request
→ Detail renders
→ Actions work
→ Next stage routes correctly
→ Status updates
→ Notification sent
→ Audit recorded
→ History preserved

---

# 24. Final Product Principle

CampusOS approvals must be:

ONE WORKFLOW ENGINE
+
ONE APPROVAL UI SYSTEM
+
MULTIPLE DOMAIN REQUEST TYPES

The Faculty Leave/OD Approval experience is the canonical reference.