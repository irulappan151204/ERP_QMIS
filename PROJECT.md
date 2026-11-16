# Project: School ERP Frontend Optimization & Role-Based Navigation Audit

## Architecture
- **Framework & Bundler**: React 19.2.4, Vite 8.0.1, Tailwind CSS 4.2.2, react-router-dom 7.13.2
- **Language**: Pure JavaScript/JSX (`.js`, `.jsx`)
- **State Management**: React Context (`AuthContext`, `FinanceContext`, `ParentChildContext`), localStorage caches (`schoolerp_mock_db_v1_*`, `school_erp_finance_state_v1`), domain data services
- **Testing Infrastructure**: Node built-in test runner (`node --test`), 414 baseline unit tests, 277 baseline E2E tests

## Code Layout
- `src/Pages/Authentication/`: Sign-in views, demo credential directory, 29-role enterprise user directory
- `src/constants/roles.js`: Authoritative 29-role constants, default home paths, route prefixes
- `src/Common/CommonSidebar/`: 29-role sidebar navigation menus and route links
- `src/Common/StoresProcurement/`: Central stores and procurement workspace, inventory catalog, requisition engine
- `src/Pages/AccountHead/FeesManagement/`: Student fee collection console, payment history, student-wise & parent-wise profiles
- `src/Pages/HR/` & `src/Common/Relieving/`: HR workspaces, full 10-stage sequential employee lifecycle, exit clearances
- `src/Pages/SuperAdmin/Dashboard/`: Super Admin executive dashboard, operational department overviews
- `src/Common/EmployeeActivityMonitoring/`: Department activity monitoring, multi-facet filtering, hierarchical scoping
- `src/Common/Recognition/`: Star of the Month & Star of the Year evaluation forms and scoring workflows
- `src/Pages/CCTV/` & `src/Pages/Operations/CCTV/`: Camera hardware inventory, maintenance logs, footage request workflows
- `docs/ROLE_WISE_ARCHITECTURE.md`: Complete 29-role architecture reference documentation

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---|---|---|---|
| 1 | 29-Role Enterprise Login Display | Display all 29 roles with existing demo credentials (`School@123`) in an organized layout on sign-in page | M1 | Survey (R2) |
| 2 | Role-Based Navigation Audit | Audit and verify navigation links across all 29 roles; ensure 0 broken links and 0 duplicate routes | M1 | Survey (R2) |
| 3 | CCTV Video & Stream UI Removal | Remove live stream video players, RTSP preview modals, and stream buttons while preserving camera inventory and request workflows | M1 | Survey (R1) |
| 4 | UI/UX Content Cleanup | Remove unnecessary explanatory text, demo banners (`IntegrationNotice`), and placeholder warnings across views | M1 | Survey (R1) |
| 5 | Multi-Product Procurement Cart | Select multiple catalog products with individual quantities into a consolidated list with item count and summary totals | M2 | Survey (R3) |
| 6 | Stores Interface Consolidation | Consolidate duplicate buttons and remove redundant guidance banners in Stores & Procurement workspace | M2 | Survey (R3) |
| 7 | Hierarchical Activity Monitoring | Fix role-scoping bug in activity engine; enforce strict role hierarchy visibility | M2 | Survey (R3) |
| 8 | Multi-Facet Activity Filters | Implement Department, User, Role, Date/Time, and Activity-Type filters on activity streams | M2 | Survey (R3) |
| 9 | Student-Wise & Parent-Wise Fee Status | Unified collection UI displaying Paid, Pending, Partially Paid, and Overdue statuses across students and parent groups | M3 | Survey (R3) |
| 10 | Payment History & Sync Consistency | Clean payment history table and sync status indicators without broken/disabled "unavailable" buttons | M3 | Survey (R3) |
| 11 | Sequential HR Employee Lifecycle | Align full 10-stage lifecycle UI (onboarding to relieving/settlement) with consistent status tracking | M3 | Survey (R3) |
| 12 | HR Connection & Cleanup | Remove obsolete biometric demo sync and disconnected notices from HR views | M3 | Survey (R3) |
| 13 | Super Admin Dashboard Redesign | Modernized ERP layout with operational department overviews, role/user management navigation, and clutter removal | M3 | Survey (R3) |
| 14 | Star Awards Rubric & Layout | Preserve 12 criteria and marks allocation while improving SOM & SOY evaluation form layouts | M3 | Survey (R3) |
| 15 | Role-Wise Architecture Documentation | Comprehensive documentation covering all 29 roles, module mappings, hierarchy diagrams, and access controls | M4 | Survey (R4) |
| 16 | Final E2E Test Suite Pass & Adversarial Hardening | Verify 100% pass across all unit, E2E, and adversarial test tiers | M5 | Survey (Dual Track) |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| M1 | Auth, Navigation & CCTV Cleanup | `SignIn.jsx`, `enterpriseUserDirectory.js`, CCTV views, common UI cleanup | None | DONE (`npm test`: 414/414, `npm run test:e2e`: 277/277, lint: 0 errors, build: exit code 0) |
| M2 | Operations: Stores & Activity Monitoring | `StoresProcurementWorkspace.jsx`, `DepartmentActivityMonitoringWorkspace.jsx`, `employeeActivityMonitoringData.js` | None | DONE (`npm test`: 414/414, `npm run test:e2e`: 277/277, lint: 0 errors, build: exit code 0) |
| M3 | Governance: Finance, HR, Super Admin, Star Awards | `FeeCollectionTab.jsx`, `FeesManagement.jsx`, `HRRoutes.jsx`, `ExitFormalities.jsx`, `Attendance.jsx`, `Dashboard.jsx`, `EnterpriseRecognitionPage.jsx` | None | IN_PROGRESS |
| M4 | Role-Wise Architecture Documentation | `docs/ROLE_WISE_ARCHITECTURE.md` | M1, M2, M3 | PLANNED |
| M5 | Final Verification & Adversarial Audit | All modified files, test suites, forensic integrity audit | M1, M2, M3, M4 | PLANNED |

## Interface Contracts
### Auth / Navigation ↔ Module Views
- All 29 roles access only their assigned URL prefixes as governed by `App.jsx` layout guards.
- Default demo credentials are standardized to `School@123` across all 29 roles.
- `ROLE_HOME_PATHS` in `src/constants/roles.js` defines authoritative entry routes.

### Stores & Procurement Multi-Product Cart
- `reqFormData.selectedItems`: Array of `{ itemCode, itemName, category, requestedQty, unit, unitPrice, estimatedTotal }`.
- Consolidated summary values: `totalItemsCount = sum(requestedQty)`, `totalEstimatedValuation = sum(requestedQty * unitPrice)`.

### Finance Fees Collection
- Student record interface includes: `{ admissionNumber, studentName, gradeSection, fatherName, motherName, familyId, feeStatus: 'Paid' | 'Pending' | 'Partially Paid' | 'Overdue', totalBilled, totalPaid, balanceAmount, paymentHistory: [...] }`.
- Parent record interface aggregates by `familyId`: `{ familyId, parentName, phone, children: [...], aggregateStatus, totalBilled, totalPaid, totalBalance }`.

### Activity Monitoring Engine
- Filter interface: `{ department: string, user: string, role: string, dateRange: { from, to }, activityType: string }`.
- Visibility scoping: `viewerRole` normalized correctly via `effectiveRole`; Super Admin/MD see all; Dept Heads see own department; Staff see self.

### HR Lifecycle Pipeline
- 10-stage sequential tracking: `Onboarding` → `Documentation` → `Policy Management` → `Leave/Attendance` → `Performance` → `Resignation` → `Notice Period` → `Handover/Clearance` → `NOC Clearance` → `Relieving/Settlement`.

### Star Awards Scoring Rubric
- SOM 5-criteria rubric: Punctuality (5), Classroom Hygiene (5), Peer Mentoring (5), Homework Completion (5), Values & Ethics (5) totaling 25 marks.
- SOY Eligibility: $\ge 2$ SOM wins, GPA $\ge 8.5$ / $85\%$, attendance $\ge 95\%$, 0 infractions.
