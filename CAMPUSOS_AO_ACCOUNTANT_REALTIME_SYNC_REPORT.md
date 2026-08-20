# GEETORUS CampusOS — AO & Accountant Realtime Synchronization Report

## 1. Distinct Role Separation & Workflow Boundaries

| Capability / Responsibility | Accountant (`ACCOUNTANT`) | Accounts Officer (`AO` / `ACCOUNTS_OFFICER`) |
|---|---|---|
| **Primary Focus** | Daily Operations, Collections & Transactions | Financial Governance, Approvals & Audits |
| **Fee Collection** | Records Cash, Cheque, DD, UPI & POS Offline Payments | Views Aggregated Inflow & Reconciliation |
| **Receipt Generation** | Issues Official Receipts & Transaction IDs | Audits Generated Receipts & Vouchers |
| **Daily Closings** | Prepares, tallies cash count & Submits Day Closing | Reviews, Approves, Queries, or Returns Day Closings |
| **Maker-Checker Requests** | Submits Refund, Waiver, Concession, Reversal Requests | Sole Approver / Checker for Financial Adjustments |
| **Self-Approval** | **STRICTLY BLOCKED** by Server | **STRICTLY BLOCKED** if AO originated the request |
| **Budget Allocations** | Views department expense caps | Reviews & sanctions department budget proposals |

---

## 2. Single Canonical Ledger Mechanics

The single source of truth for every student's financial standing is governed by the invariant mathematical equation:

$$\text{Outstanding Balance} = \text{Opening} + \text{Charges} - \text{Scholarship} - \text{Concession} - \text{Waiver} - \text{Payments} + \text{Fine} \pm \text{Adjustments}$$

* **Immutable Reversals**: Mistakes are never solved with `DELETE` queries. Compensating `REVERSAL` journal entries (`direction: DEBIT/CREDIT`, `sourceType: REVERSAL_ENTRY`) are inserted to preserve complete GAAP-compliant audit trails.

---

## 3. Realtime Invalidation Pipeline & SSE Event Channel

```mermaid
sequenceDiagram
    autonumber
    actor Accountant
    participant Server as CampusOS Backend
    participant DB as PostgreSQL Database
    participant SSE as Realtime Event Stream
    actor AO as Accounts Officer
    actor Student as Student / Parent

    Accountant->>Server: POST /finance/collect (Cash / DD)
    Server->>DB: Serializable Tx (FeePayment + FeeBill + LedgerEntry)
    Server->>SSE: broadcastRBACUpdate(FINANCE_TRANSACTION_CHANGED)
    SSE-->>AO: Invalidate Dashboard & Collection Cache
    SSE-->>Student: Update Fee Outstanding & Receipt Available

    Accountant->>Server: POST /finance/closings (submit=true)
    Server->>DB: Update DailyClosing(SUBMITTED_TO_AO)
    Server->>SSE: broadcastRBACUpdate(FINANCE_CLOSING_SUBMITTED)
    SSE-->>AO: Push Notification: New Daily Closing for Review

    AO->>Server: POST /finance/closings/:id/review (APPROVE)
    Note over Server: Check Maker != Checker
    Server->>DB: Update DailyClosing(AO_APPROVED)
    Server->>SSE: broadcastRBACUpdate(FINANCE_CLOSING_REVIEWED)
    SSE-->>Accountant: Instant Status Badge Update (Approved)
```
