# Project: School ERP Responsive Design Implementation & Full Project Audit

## Architecture
- **Framework & Bundler**: React 19.2.4, Vite 8.3.5, Tailwind CSS 4.2.2, react-router-dom 7.13.2
- **Compiler**: Babel React Compiler (`babel-plugin-react-compiler`)
- **Language**: Pure JavaScript/JSX (`.js`, `.jsx`)
- **Styling**: Tailwind CSS 4 native engine (`@import "tailwindcss";` with `@theme` tokens)
- **Layout Shell**: `AppShell.jsx` wrapping 29 institutional role layouts (`createPortalLayout.jsx`), `AuthLayout.jsx` for auth
- **Testing Infrastructure**: Node built-in test runner (`node --test`), 414 unit tests, 143 UI tests, 277 E2E tests

## Code Layout
- `src/Layout/`: `AppShell.jsx`, `createPortalLayout.jsx`, `shellState.js`, role layouts
- `src/Common/CommonHeader/`: `CommonHeader.jsx`, `Components/UserNotifications.jsx`, `Components/GlobalSearchModal.jsx`
- `src/Common/CommonSidebar/`: `CommonSidebar.jsx`, navigation group renderers, role sidebar links
- `src/Common/ui/`: `DataTable.jsx`, `ResponsiveRecordList.jsx`, `Dialog.jsx`, `Drawer.jsx`, `PageHeader.jsx`, `tokens.js`
- `src/Common/`: Shared domain workspaces (`StoresProcurement/`, `AttendanceAndLeave/`, `Academic/`, `GatePassSecurity/`, etc.)
- `src/Pages/`: 29 role-specific page directories (`Admin/`, `Teacher/`, `Student/`, `AccountHead/`, `HR/`, `Librarian/`, etc.)
- `src/Routes/`: 31 role-based route definitions
- `src/App.css` & `src/index.css`: Global application styles and Tailwind theme configuration
- `docs/AUDIT_FINDINGS_FOR_USER_REVIEW.md`: Comprehensive catalog of Category B findings for user review

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---|---|---|---|
| 1 | Mobile Navigation & Drawer Access | Add hamburger menu toggle in `CommonHeader.jsx`, wire `toggleSidebar` and `menuButtonRef`, add mobile close button in `CommonSidebar.jsx` | M1 | Survey (R1) |
| 2 | Global Search Trigger & Modal Prop Fix | Add mobile search icon button, fix `open={searchModalOpen}` prop on `GlobalSearchModal` | M1 | Survey (R1) |
| 3 | Notification Popover Viewport Adaptation | Make `UserNotifications.jsx` popover width responsive on small screens (<360px) | M1 | Survey (R1) |
| 4 | Table Horizontal Scroll Wrappers | Ensure all 8 identified unconstrained tables have `overflow-x-auto` wrappers | M2 | Survey (R1) |
| 5 | Modal Viewport Boundary Protection | Apply `max-h-[90vh]` and `overflow-y-auto` to custom modal containers to prevent button clipping on mobile | M2 | Survey (R1) |
| 6 | Form & Multi-Column Grid Mobile Adaptability | Apply mobile-first responsive classes (`grid-cols-1 sm:grid-cols-2`) to multi-column grids in forms/modals | M2 | Survey (R1) |
| 7 | Broken Navigation Route Remediation | Fix `MyProfilePage.jsx:662` staff relieving navigation link using correct role route prefix | M3 | Survey (R2) |
| 8 | Leftover Debug Code Cleanup | Remove leftover development `console.log` in `AddIssueBook.jsx:381` | M3 | Survey (R2) |
| 9 | Orphaned CSS Pruning | Remove unused `.checkbox-wrapper-46` rules from `App.css` (retaining `.ui-*` and `.erp-overlay*` in `src/index.css` as active design system dependencies) | M3 | Survey (R2) |
| 10 | Unused Dead Assets Cleanup | Safely remove the 8 verified zero-reference dead assets in `public/` and `src/assets/images/` | M3 | Survey (R2) |
| 11 | React Compiler Memoization Optimization | Fix manual memoization mismatches flagged by React Compiler in `ReportCardGenerator.jsx` and `EnterpriseTrendChart.jsx` | M3 | Survey (R2) |
| 12 | Category B Findings Documentation | Compile a structured document `docs/AUDIT_FINDINGS_FOR_USER_REVIEW.md` cataloging remaining items for user review | M3 | Survey (R2) |
| 13 | Full Regression & Build Validation | Validate `npm run build`, `npm test`, `npm run test:ui`, `npm run test:e2e`, and `npm run lint` with 0 errors | M4 | Survey (Dual Track) |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| M1 | Navigation, Header & Shell Responsiveness | `CommonHeader.jsx`, `CommonSidebar.jsx`, `UserNotifications.jsx`, `GlobalSearchModal.jsx` | None | DONE (`npm test`: 414/414, `npm run test:ui`: 143/143, `npm run test:e2e`: 277/277, build: exit code 0, lint: 0 errors) |
| M2 | Tables, Modals & Form Grids Responsiveness | Domain tables in Stores, Attendance, Approvals, Fees; custom modal vertical constraints; form grids | M1 | DONE (`npm test`: 414/414, `npm run test:ui`: 143/143, `npm run test:e2e`: 277/277, build: exit code 0, lint: 0 errors) |
| M3 | Project Code Audit & Remediation (Cat A + B) | `MyProfilePage.jsx`, `AddIssueBook.jsx`, `App.css`, `index.css`, dead assets, compiler memoization, `AUDIT_FINDINGS_FOR_USER_REVIEW.md` | None | DONE (`npm test`: 414/414, `npm run test:ui`: 143/143, `npm run test:e2e`: 277/277, build: exit code 0, lint: 0 errors) |
| M4 | Final Verification & Dual Track E2E/Adversarial Hardening | Full build, unit tests, UI tests, E2E tests, linting, responsive layout verification across viewports | M1, M2, M3 | DONE (`npm test`: 414/414, `npm run test:ui`: 143/143, `npm run test:e2e`: 277/277, build: exit code 0, lint: 0 errors) |

## Interface Contracts
### Shell Navigation ↔ Header Controls
- `AppShell.jsx` passes `toggleSidebar`, `sidebarHidden`, `menuButtonRef`, `rightDrawerOpen`, `toggleRightDrawer` to `CommonHeader.jsx`.
- `CommonHeader.jsx` must render:
  - Mobile hamburger button (`lg:hidden`) receiving `menuButtonRef`, calling `toggleSidebar()`.
  - Mobile search button (`md:hidden`) triggering `setSearchModalOpen(true)`.
  - `GlobalSearchModal` with `open={searchModalOpen}` and `onClose={() => setSearchModalOpen(false)}`.
- `CommonSidebar.jsx` must render:
  - Mobile close button (`lg:hidden`) calling `toggleSidebar()`.
  - Desktop collapse/expand button (`hidden lg:flex`).
- All existing desktop navigation layouts ($\ge 1024\text{px}$) remain identical (`lg:ml-[280px]` or `lg:ml-[90px]`).

### Table Responsiveness Contract
- Every `<table>` element must either reside inside a container with `overflow-x-auto` (horizontal touch scroll with rounded borders preserved) or use `DataTable.jsx` / `ResponsiveRecordList.jsx` card transformations.
- Desktop display properties (`table`, `w-full`, column headers, data cells) must not be clipped, hidden, or wrapped unnaturally.

### Modal Bounds Contract
- Custom modal cards inside `fixed inset-0` must specify `max-h-[90vh]` and `overflow-y-auto` on the scrollable container.
- Modal header, close icon, and action footer (buttons) must remain accessible on viewports with height $\le 600\text{px}$ or mobile landscape.

### Audit Remediation Contracts
- Category A fixes must strictly preserve all runtime contracts and pass all 414 unit tests and 277 E2E tests without modifications to test assertions.
- Category B findings must be thoroughly documented in `docs/AUDIT_FINDINGS_FOR_USER_REVIEW.md` with clear categorization, file references, rationale, and recommended next steps for human stakeholders.
