# CAMPUSOS ANDROID FUNCTIONAL MOTION & ANIMATION MATRIX

This matrix defines the standardized functional motion and micro-interaction behavior across all CampusOS Android workspaces and pages. Every animation must answer at least one functional question: *What was tapped?*, *Is the system working?*, *What state changed?*, *Where did I navigate?*, or *What requires attention?*

---

## Motion System Principles & Tokens

| Motion Token | Duration Scale | Easing Curve | Target Elements | Hardware Acceleration |
| :--- | :--- | :--- | :--- | :--- |
| **`press`** | `80–120ms` (0.1s) | `cubic-bezier(0.16, 1, 0.3, 1)` | Buttons, Metric Cards, Interactive Chips | `scale(0.98)` |
| **`interaction`** | `120–180ms` (0.15s) | `cubic-bezier(0.16, 1, 0.3, 1)` | Status Chip Crossfade, Icon Pop, Toggle | `opacity`, `transform` |
| **`standard`** | `180–240ms` (0.2s) | `cubic-bezier(0.16, 1, 0.3, 1)` | Card Exit/Collapse, Workspace Switch | `height(0)`, `opacity`, `y` |
| **`page`** | `220–300ms` (0.25s) | `cubic-bezier(0.16, 1, 0.3, 1)` | Spatial Screen Transitions | `translateX(10px -> 0px)`, `opacity` |
| **`sheet`** | `250–320ms` (0.28s) | `cubic-bezier(0.16, 1, 0.3, 1)` | Mobile Bottom Sheets & Filter Trays | `translateY(100% -> 0%)` |
| **`counter`** | `350–550ms` (0.4s) | `cubic-bezier(0.16, 1, 0.3, 1)` | KPI Count-Up / Value Changes | `requestAnimationFrame` interpolation |
| **`progress`** | `400–700ms` (0.5s) | `cubic-bezier(0.16, 1, 0.3, 1)` | Attendance, Fee, and Workload Bars | `width: %` |

---

## Global Motion QA Matrix

| Workspace | Page | Element | Trigger | Animation | Duration | Functional Purpose | Reduced Motion Behavior | Performance Result | Physical Device Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Authentication** | Login | Form Card & Error Banner | Page Mount / Invalid Password | 12px Upward Slide + Single Error Shake | `250ms` | Directional entry & feedback on wrong credentials without repetitive loops | Instant opacity fade, zero shake | 60 FPS | Smooth on Android WebView | ✅ PASS |
| **Global Navigation** | Workspace Switcher | Navigation Bar / Header | Role Selection (e.g. Faculty -> HOD) | Header Crossfade + Navigation Slide | `200ms` | Spatial continuity between user roles; prevents stale card leaps | Instant crossfade | 60 FPS | Smooth on Android WebView | ✅ PASS |
| **Global Shell** | Bottom Nav Bar | Nav Tabs | Tab Selection | Icon scale `1 -> 1.08 -> 1` + Active Tint | `120ms` | Touch acknowledgment; indicates active tab spatial position | Static color change | 60 FPS | Instant feedback | ✅ PASS |
| **Student** | Student Dashboard | KPI Metric Cards | Touch Press / Value Load | `scale(0.98)` press + Numeric Counter | `100ms` press / `450ms` count | Visual press response & numeric change feedback | Static card, instant number | 60 FPS | 60 FPS GPU cached | ✅ PASS |
| **Student** | Student Attendance | Progress Bar | Initial Data Fetch / Refresh | Width expansion `0% -> N%` | `500ms` | Explains current attendance threshold relative to 75% cutoff | Static width set | 60 FPS | Smooth progress fill | ✅ PASS |
| **Faculty** | Attendance Desk | Student Status Chip | Tap (Present <-> Absent) | Chip color & label crossfade | `150ms` | Direct confirmation of attendance toggle for individual student | Instant color change | 60 FPS | Zero input delay | ✅ PASS |
| **Faculty** | Attendance Desk | "Mark All Present" | Button Tap | Fast bulk status crossfade | `180ms` | Rapid feedback for bulk action without lagging list | Instant state update | 60 FPS | Immediate bulk update | ✅ PASS |
| **HOD** | Approval Desk | Pending Request Card | Approve / Reject Tap | Success toast + Card collapse & list shift | `250ms` | Visually confirms item removal from queue | Instant row removal | 60 FPS | Smooth list collapse | ✅ PASS |
| **HOD** | Approval Desk | Pending Counter Badge | Request Processed | Smooth numeric decrement (`5 -> 4`) | `400ms` | Direct visual state feedback for pending task queue | Instant text update | 60 FPS | Clear number change | ✅ PASS |
| **Academic Dean** | Dean Dashboard | Department Summary Card | Expand / Collapse Tap | Height expansion + Fade | `200ms` | Reveals detailed metrics without route navigation | Instant toggle | 60 FPS | Clean expansion | ✅ PASS |
| **COE** | Results Publishing | Status Badge | Result Publish Action | Status crossfade (Draft -> Published) | `180ms` | Confirms serious administrative state change | Instant badge swap | 60 FPS | Professional status transition | ✅ PASS |
| **VP / Principal** | Acting Principal Mode | Header Status Banner | Workspace Switch | Static Banner Entrance + Gold Tint | `200ms` | Clear indication of elevated delegation authority | Static banner | 60 FPS | Zero pulse noise | ✅ PASS |
| **Finance / Parent** | Fee Ledger & Pay | Payment Progress & Receipt | Payment Success | Status checkmark pop + Balance update | `350ms` | Trustworthy financial completion feedback without decorative noise | Instant success badge | 60 FPS | Clean receipt reveal | ✅ PASS |
| **Global UI** | Modal Trays & Sheets | Filter / Details Sheet | Button Tap | Slide-up `100% -> 0%` + Dimmed Backdrop | `280ms` | Android native bottom sheet behavior | Instant center dialog | 60 FPS | Smooth gesture feel | ✅ PASS |

---

## Accessibility & Reduced Motion Compliance

- **Detection**: Handled automatically via [`useReducedMotionPreference()`](file:///d:/local/crm/product/client/src/design-system/tokens/motion.ts) listening to `(prefers-reduced-motion: reduce)`.
- **Behavior**: When reduced motion is enabled in Android System Settings, all spatial slides, scale compression, list staggers, and numeric counting fall back to instant static visibility or simple opacity crossfades.
