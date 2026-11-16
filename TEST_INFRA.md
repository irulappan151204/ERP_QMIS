# E2E Test Infra: School ERP Frontend Optimization

## Test Philosophy
- Opaque-box, requirement-driven testing based on `ORIGINAL_REQUEST.md` (R1-R5).
- Methodology: 4-Tier Test Suite (Feature Coverage, Boundary & Corner Cases, Pairwise Combinations, Real-World Application Workloads).

## Feature Inventory
| # | Feature | Source (Requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---|---|:---:|:---:|:---:|
| 1 | 29-Role Enterprise Login Display | ORIGINAL_REQUEST § R2 | 5 | 5 | ✓ |
| 2 | Role-Based Navigation & Valid Routes | ORIGINAL_REQUEST § R2 | 5 | 5 | ✓ |
| 3 | CCTV Stream & Video UI Removal | ORIGINAL_REQUEST § R1 | 5 | 5 | ✓ |
| 4 | UI/UX Content & Clutter Cleanup | ORIGINAL_REQUEST § R1 | 5 | 5 | ✓ |
| 5 | Multi-Product Stores & Procurement Cart | ORIGINAL_REQUEST § R3 | 5 | 5 | ✓ |
| 6 | Finance Student Fees Collection Console | ORIGINAL_REQUEST § R3 | 5 | 5 | ✓ |
| 7 | HR Sequential Employee Lifecycle | ORIGINAL_REQUEST § R3 | 5 | 5 | ✓ |
| 8 | Super Admin Dashboard Modernization | ORIGINAL_REQUEST § R3 | 5 | 5 | ✓ |
| 9 | Activity Monitoring Multi-Facet Filters | ORIGINAL_REQUEST § R3 | 5 | 5 | ✓ |
| 10 | Star Awards (SOM & SOY) Evaluation | ORIGINAL_REQUEST § R3 | 5 | 5 | ✓ |
| 11 | Role-Wise Architecture Documentation | ORIGINAL_REQUEST § R4 | 5 | 5 | ✓ |

## Test Architecture
- **Test Runner**: Node.js built-in test runner (`node --test`)
- **Execution Command**: `npm test` (unit tests) and `npm run test:e2e` (E2E tests)
- **Static Analysis**: `npm run lint` (ESLint 9, 0 errors required)
- **Production Build**: `npm run build` (Vite 8 production compilation)
- **Directory Layout**:
  - `src/**/__tests__/**/*.test.js`: Unit & integration tests
  - `tests/e2e/`: End-to-end multi-tier tests
  - `tests/e2e/run-all.js`: E2E suite orchestrator

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|---|---|---|
| 1 | Super Admin Multi-Department Health Audit | F1, F2, F8, F9 | High |
| 2 | End-to-End Staff Procurement Requisition | F2, F5 | Medium |
| 3 | Student & Parent Fee Collection with History | F2, F6 | High |
| 4 | Staff Complete Lifecycle & No-Dues Clearance | F2, F7 | High |
| 5 | Teacher Star of the Month Classroom Scoring | F2, F10 | Medium |
| 6 | CCTV Maintenance & Footage Access Request Audit | F2, F3 | Medium |

## Coverage Thresholds
- Tier 1: $\ge 5$ tests per feature (happy-path equivalence class)
- Tier 2: $\ge 5$ boundary/corner cases per feature
- Tier 3: Pairwise combinations across major feature interactions
- Tier 4: $\ge 6$ realistic end-to-end multi-feature workflows
- Acceptance Gate: 100% pass on `npm test` and `npm run test:e2e`, 0 lint errors, clean build
