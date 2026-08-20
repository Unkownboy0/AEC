# CampusOS Android UI responsive matrix

Date: 2026-08-18  
Scope: presentation-layer refinement of the existing Android client. No route, API, permission, workflow, payload, or business-rule changes are part of this matrix.

## Evidence labels

- **TEST VERIFIED** — exercised in the local browser at the stated viewport.
- **STATICALLY VERIFIED** — component structure and responsive classes were inspected; no authenticated runtime claim is made.
- **BUILD VERIFIED** — production web build and Android debug assembly completed.
- **BLOCKED / NOT VERIFIED** — an authenticated account, device, or environment was unavailable.

## Width coverage

| Width | Public login | Horizontal overflow | Primary input/action height | Shared protected shell | Authenticated role pages | Evidence |
| ---: | --- | --- | --- | --- | --- | --- |
| 320px | Two-line institution heading is readable | None (`scrollWidth = clientWidth = 320`) | 48px | 12px page gutter, compact header/nav labels | Not opened | Login: **TEST VERIFIED**; shell: **STATICALLY VERIFIED**; roles: **BLOCKED / NOT VERIFIED** |
| 360px | Readable | None (browser reported 361 CSS px for both values) | 48px | 16px page gutter; equal-width bottom tabs | Not opened | Login: **TEST VERIFIED**; shell: **STATICALLY VERIFIED**; roles: **BLOCKED / NOT VERIFIED** |
| 375px | Readable | None (`375 = 375`) | 48px | Standard phone layout | Not opened | Login: **TEST VERIFIED**; shell: **STATICALLY VERIFIED**; roles: **BLOCKED / NOT VERIFIED** |
| 390px | Institution heading fits one line | None (`390 = 390`) | 48px | Standard phone layout | Not opened | Login: **TEST VERIFIED**; shell: **STATICALLY VERIFIED**; roles: **BLOCKED / NOT VERIFIED** |
| 412px | Institution heading fits one line | None (`412 = 412`) | 48px | Standard phone layout | Not opened | Login: **TEST VERIFIED**; shell: **STATICALLY VERIFIED**; roles: **BLOCKED / NOT VERIFIED** |
| 430px | Institution heading fits one line | None (browser reported 431 CSS px for both values) | 48px | Standard phone layout | Not opened | Login: **TEST VERIFIED**; shell: **STATICALLY VERIFIED**; roles: **BLOCKED / NOT VERIFIED** |
| 768px tablet | Centered form remains capped and readable | None (`768 = 768`) | 48px | 24px page gutter; desktop transition preserved | Not opened | Login: **TEST VERIFIED**; shell: **STATICALLY VERIFIED**; roles: **BLOCKED / NOT VERIFIED** |

## Shared component matrix

| Surface | 320–359px behavior | 360–430px behavior | Tablet/desktop behavior | Theme check | Status |
| --- | --- | --- | --- | --- | --- |
| App content | 12px side gutter; bottom-nav and safe-area clearance | 16px side gutter; bottom-nav and safe-area clearance | 24px at tablet, 32px at desktop | Semantic background remains inherited | **STATICALLY VERIFIED** |
| Top header | Smaller gaps; title can wrap to two lines | Fluid 14–16px title | Existing desktop breadcrumbs/branding remain | Semantic surface/border tokens | **STATICALLY VERIFIED** |
| Bottom navigation | Equal-width items; 10px labels; 48px targets | 11px labels; stable active background | Hidden at `lg` as before | Semantic surface, border, primary state | **STATICALLY VERIFIED** |
| Page header | 18–22px fluid title; up to two lines; actions may fill width | Title/actions wrap without forced truncation | Existing row arrangement retained | Token-aware | **STATICALLY VERIFIED** |
| Buttons | 48px minimum control height; labels may wrap | Same mobile baseline | Compact sizes return at `lg` | Primary/surface/ring tokens | **STATICALLY VERIFIED** |
| Inputs | 48px minimum control height | Same mobile baseline | Compact sizes return at `lg` | Background/input/ring tokens | **STATICALLY VERIFIED** |
| KPI/section cards | Fluid metric type; restrained radius/padding | Stable grid content and wrapping | Existing grid behavior retained | Semantic card/surface/border tokens | **STATICALLY VERIFIED** |
| Responsive table | Mobile record cards; wrapping labels/values; 48px expand control | Same card pattern | Semantic desktop table at `sm+` | Forced dark mobile card removed | **STATICALLY VERIFIED** |

## Workspace verification boundary

The source inventory covers Student, Parent, Faculty, Mentor, Class Adviser, HOD, Dean variants, COE, VP/Principal, finance, library, hostel, transport, placement, office, HR, security, scholarship, research, purchase, inventory, maintenance, and alumni surfaces. Shared UI changes flow into those workspaces wherever they consume the refined primitives.

Authenticated visual verification is **BLOCKED / NOT VERIFIED** because no role test credentials were supplied and the local login reported its configured API as unreachable. Physical Android device/emulator testing, font-scale testing, and gesture-navigation testing are also **BLOCKED / NOT VERIFIED** in this run.

## Build evidence

- TypeScript: `tsc --noEmit` — **BUILD VERIFIED**.
- Production client: `vite build` — **BUILD VERIFIED**; existing large-chunk warnings remain non-fatal.
- Capacitor Android sync — **BUILD VERIFIED**.
- Gradle: `assembleDebug` — **BUILD VERIFIED**.

