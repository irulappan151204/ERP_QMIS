# E2E Test Infra: School ERP Responsive & Audit Suite

## Test Philosophy
- Opaque-box, requirement-driven verification across all responsive viewports (Mobile <640px, Tablet 768px-1024px, Desktop >1024px).
- Zero visual or functional regressions on desktop layouts.
- Methodology: Category-Partition + Boundary Value Analysis + Pairwise + Real-World Scenario Testing.

## Feature Inventory
| # | Feature | Source (requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---|---|:---:|:---:|:---:|
| 1 | Mobile Navigation & Drawer Access | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 2 | Global Search Trigger & Modal Prop Fix | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 3 | Notification Popover Viewport Adaptation | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 4 | Table Horizontal Scroll Wrappers | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 5 | Modal Viewport Boundary Protection | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 6 | Form & Multi-Column Grid Mobile Adaptability | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 7 | Broken Navigation Route Remediation | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 8 | Leftover Debug Code Cleanup | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 9 | Orphaned CSS Pruning | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 10 | Unused Dead Assets Cleanup | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 11 | React Compiler Memoization Optimization | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 12 | Category B Findings Documentation | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 13 | Full Regression & Build Validation | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |

## Test Architecture
- **Test Runner**: Node.js built-in test runner (`node --test`)
- **Unit Suite**: `npm test` (`node --test "src/**/__tests__/**/*.test.js"`)
- **UI Suite**: `npm run test:ui` (`node --test src/Common/ui/__tests__/*.test.js`)
- **E2E Suite**: `npm run test:e2e` (`node --test tests/e2e/run-all.js`)
- **Build Validation**: `npm run build` (Vite production bundle compiler)
- **Linter**: `npm run lint` (`eslint .`)

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|---|---|---|
| 1 | Mobile Viewport Navigation Flow (<640px) | F1, F2, F3 | High |
| 2 | Tablet Viewport Form & Table Interaction (768px-1024px) | F1, F4, F6 | Medium |
| 3 | Modal Workflow on Short/Landscape Viewport | F5, F6 | Medium |
| 4 | Profile Relieving & Role Navigation Routing | F7 | Low |
| 5 | Production Clean Build & Asset Integrity | F8, F9, F10, F11, F13 | High |
| 6 | Comprehensive Audit Deliverable Review | F12 | Medium |

## Coverage Thresholds
- Tier 1: ≥5 per feature
- Tier 2: ≥5 per feature (boundary and viewport constraints)
- Tier 3: Pairwise coverage of major feature interactions
- Tier 4: ≥6 realistic application scenarios
