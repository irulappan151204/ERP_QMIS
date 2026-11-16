# Enterprise School ERP — Backend API Integration Specification
**Document Version:** 1.0.0 (Production Hardened)  
**Target Milestone:** M-AUDIT-4 / Feature 17  
**Base URL:** `/api/v1`  
**Protocol:** HTTPS / JSON REST  
**Target Architecture:** Multi-tenant Campus Cluster with Role-Based Access Control (29 Roles)

---

## 1. Executive Summary & Architecture Overview

This specification establishes the official API integration standard for the Enterprise School ERP frontend application. The frontend operates with an abstraction layer (`src/services/api/apiClient.js` backed by `mockAdapter.js`) adhering to a strict separation of concerns:
- **UI Presentation Layer:** React 19 functional components and custom hooks.
- **Service Abstraction Layer:** Domain services (`src/services/modules/*`) providing type-safe methods.
- **Central API Client:** Uniform HTTP request dispatcher handling standard response envelopes, JWT token injection, campus header propagation, and file upload/download abstractions.
- **Mock Engine & Persistence:** Dual-mode client operating offline/in mock mode via seed-initialized local stores or against live RESTful microservices.

The system encompasses **29 distinct user roles** spanning Executive, Academic, Administrative, Operations, Audit, and Institutional Custodian perimeters. All endpoints specified herein are designed for high-concurrency production deployments with zero frontend modifications when switching from mock to live backend microservices.

---

## 2. Global Protocol & Client Conventions

### 2.1 Base URLs & Versioning
- **Production Base URL:** `https://api.schoolerp.internal/api/v1`
- **Staging Base URL:** `https://staging-api.schoolerp.internal/api/v1`
- **Local Development / Mock Gateway:** `/api/v1` (controlled via `VITE_API_BASE_URL` in `.env`)
- **API Versioning Strategy:** URI versioning (`/api/v1/...`). Breaking schema changes require incrementing the version segment (`/api/v2`).

### 2.2 Global Mandatory Headers
Every request emitted by the frontend client injects the following HTTP headers:

| Header Name | Type | Required | Description | Example |
|-------------|------|----------|-------------|---------|
| `Authorization` | String | Yes (except login) | Standard Bearer token containing cryptographically signed JWT | `Bearer eyJhbGciOiJIUzI1Ni...` |
| `Content-Type` | String | Yes (for JSON) | MIME type of request payload | `application/json` |
| `Accept` | String | Yes | Client accepted MIME response format | `application/json` |
| `X-Campus-Id` | String | Yes | Multi-tenant tenant identifier for campus isolation | `CAMPUS-MAIN-001` |
| `X-Role` | String | Yes | Active caller role key matching RBAC perimeter | `teacher`, `director`, `cctv` |
| `X-Request-Id` | String | Optional | UUID for distributed request tracing | `7f8c9b2e-0a56-4c31-9f2d-8e7a6b5c4d3e` |
| `Idempotency-Key`| String | Conditional | UUID required on financial transactions and mutations | `c9b8a7e6-1234-5678-abcd-ef0123456789` |

### 2.3 Idempotency Protocol (`Idempotency-Key`)
To prevent duplicate processing of financial receipts, refund approvals, hostel bed allocations, and purchase orders during network retransmissions:
1. Client generates a RFC 4122 v4 UUID in the `Idempotency-Key` header for `POST` / `PUT` requests mutating state.
2. The backend cache layer (Redis) stores the request payload hash and resulting response envelope keyed by `idempotency:<tenant_id>:<key>` with a 24-hour TTL.
3. Subsequent requests with identical idempotency keys yield the cached response without re-executing backend database transactions.

### 2.4 Standard Success Response Envelope
All successful API responses (HTTP `200 OK`, `201 Created`) are wrapped in a uniform envelope matching `src/services/api/responseEnvelope.js`:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "total": 128,
    "page": 1,
    "pageSize": 20,
    "totalPages": 7,
    "timestamp": "2026-11-13T14:30:00.000Z"
  },
  "error": null
}
```

- `success` (Boolean): Always `true` on 2xx responses.
- `data` (Object | Array | null): Domain payload. Singular object for entity lookups/mutations; Array for collections.
- `meta` (Object | null): Pagination and execution metadata. Null for non-paginated scalar responses.
- `error` (null): Explicitly `null` on success.

### 2.5 Standard Error Response Envelope
All non-2xx responses (HTTP `400`, `401`, `403`, `404`, `409`, `422`, `500`) are wrapped in a uniform error envelope:

```json
{
  "success": false,
  "data": null,
  "meta": {
    "timestamp": "2026-11-13T14:30:00.000Z",
    "requestId": "7f8c9b2e-0a56-4c31-9f2d-8e7a6b5c4d3e"
  },
  "error": {
    "code": "ERR_VALIDATION_FAILED",
    "message": "The submitted payload failed validation checks.",
    "details": [
      {
        "field": "theoryMarks",
        "message": "theoryMarks cannot exceed subject maxMarks (80)."
      }
    ]
  }
}
```

Standard Error Codes:
- `ERR_UNAUTHORIZED` (401): Missing, expired, or cryptographically invalid JWT token.
- `ERR_FORBIDDEN` (403): Caller role lacks permission for the requested resource perimeter.
- `ERR_NOT_FOUND` (404): Target entity identifier does not exist.
- `ERR_CONFLICT` (409): Duplicate unique key (e.g., bed already occupied, PO already approved).
- `ERR_VALIDATION_FAILED` (422): Schema or business rule validation error.
- `ERR_RATE_LIMIT_EXCEEDED` (429): Caller exceeded request rate window.
- `ERR_INTERNAL_SERVER` (500): Unhandled exception in backend processing.

### 2.6 Standard Pagination, Sorting, Search & Filtering Conventions
Collection query endpoints support standard query parameters:
- `page` (Integer, default `1`): 1-based page index.
- `pageSize` (Integer, default `20`, max `100`): Maximum records per page.
- `sortBy` (String, default `createdAt`): Entity field key to sort against.
- `sortOrder` (String, `asc` | `desc`, default `desc`): Sort direction.
- `search` / `q` (String, optional): Free-text case-insensitive substring search across indexed fields.
- `filters` (Query params): Field-specific equality filters (e.g., `status=Active&department=Academics`).

---

## 3. Role-Based Access Control (RBAC) Matrix (All 29 Roles)

The ERP enforces granular perimeter permissions across 29 enumerable roles:

| # | Role Key (`X-Role`) | Role Display Name | Division | Primary Perimeters |
|---|----------------------|-------------------|----------|--------------------|
| 1 | `superadmin` | Super Administrator | Executive | Global system configuration, master audit, security policies |
| 2 | `director` | Managing Director (MD) | Executive | Final financial approvals, CCTV tier 3, SOY final sanction, high-value POs |
| 3 | `jointdirector` | Joint Director (JD) | Executive | Operational approvals, CCTV tier 2, leave policies, fee concessions |
| 4 | `jointdirectorassistant` | Assistant to Joint Director | Executive | Executive secretarial dispatch, agenda coordination, briefing dossiers |
| 5 | `jointdirectoraudit` | Joint Director Audit & Compliance | Executive / Audit | Statutory compliance audits, SOP enforcement, academic & financial audit review, regulatory filings |
| 6 | `principal` | Principal | Academic Leadership | School-wide academics, teacher evaluations, disciplinary actions |
| 7 | `coordinator` | Academic Coordinator | Academic Leadership | Grade 9-12 curriculum, syllabus progression, exam moderation |
| 8 | `teacher` | Class / Subject Teacher | Academic | Class attendance, marks entry, student dossier, homework grading |
| 9 | `student` | Student | Learner | Attendance view, homework submission, exam marks, fee receipts |
| 10 | `parent` | Parent / Guardian | Guardian | Multi-child attendance, fee online payment, transport live tracking |
| 11 | `admin` | School Administrator | Administration | General administrative workflows, student enrollment, duty rosters |
| 12 | `accounthead` | Chief Accounts Officer | Finance | Fee heads, ledger audits, concession approvals, refund sanctions |
| 13 | `hr` | Human Resources Manager | Human Resources | Staff attendance, biometrics, leave balances, payroll inputs |
| 14 | `transportmanager` | Transport Manager | Logistics | Fleet routes, vehicle maintenance, live GPS, student manifests |
| 15 | `driver` | School Bus Driver | Logistics | Route stops, trip logbook, student boarding status, vehicle checklists |
| 16 | `librarian` | Chief Librarian | Learning Resources | Book catalog, circulation, fine calculations, digital repositories |
| 17 | `prm` | Parent Relationship Manager / Front Office | Admissions & Front Desk | Enrollment leads, parent counseling, open-house events, visitor logs, grievance tracking |
| 18 | `gatekeeper` | Security Gate Officer | Security | Visitor gate passes, material inward/outward gate passes, student exit logs, transport boarding gate checks |
| 19 | `gatekeepermanager` | Gatekeeper Manager / Security Supervisor | Security | Guard shift rosters, gate duty allocation, security incident escalation, perimeter CCTV & device oversight |
| 20 | `housekeepingmanager` | Housekeeping & Sanitation Manager | Operations / Facilities | Campus sanitation, cleanliness audits, consumable requisitions, waste disposal, hostel hygiene |
| 21 | `maintenancemanager` | Facilities Manager | Operations | Campus work orders, electrical/HVAC assets, preventive maintenance |
| 22 | `stationerystoremanager` | Stationery & Stores Manager | Procurement / Stores | Central catalog stock movements, stock issues, physical audits, asset tags |
| 23 | `canteenmanager` | Campus Canteen Manager | Operations | Meal plans, student dietary subscriptions, canteen inventory, billing |
| 24 | `itsupportmanager` | IT Support & Infrastructure Manager | Operations / IT | Hardware assets, network uptime, printer diagnostics, software licenses |
| 25 | `qualityauditor` | Academic Quality Auditor | Quality & Audit | Classroom audits, teacher evaluations, pedagogical compliance scoring |
| 26 | `processauditor` | Process & Compliance Auditor | Quality & Audit | SOP compliance audits, statutory regulatory filings, inventory audit checks |
| 27 | `pro` | Public Relations Officer | Institutional Custody | Government correspondence, CBSE affiliations, regulatory permits, NOCs |
| 28 | `fileroom` | Central Archival Custodian | Institutional Custody | Physical file repository, 4-tier rack coordinates, confidential checkout |
| 29 | `cctv` | CCTV Surveillance Officer | Institutional Custody | Camera health monitoring, footage requisitions, tamper audits, GPS halts |

---

## 4. Domain 1: Authentication, Sessions & RBAC Perimeters

### 4.1 `POST /api/v1/auth/login`
- **Description:** Authenticates credentials and returns user identity, assigned roles, permissions, and JWT access/refresh tokens.
- **Authorized Roles:** Public / Unauthenticated.
- **Request Headers:** `Content-Type: application/json`
- **Request Body Schema:**
  - `username` (string, required): Registered employee ID, student admission number, or email.
  - `password` (string, required): User password.
  - `rememberMe` (boolean, optional, default: `false`): Extends refresh token expiry from 24 hours to 30 days.
  ```json
  {
    "username": "teacher.sharma@schoolerp.org",
    "password": "SecurePassword123!",
    "rememberMe": true
  }
  ```
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600,
      "user": {
        "id": "USR-TCH-001",
        "username": "teacher.sharma",
        "fullName": "Meenakshi Sharma",
        "email": "teacher.sharma@schoolerp.org",
        "primaryRole": "teacher",
        "availableRoles": ["teacher", "coordinator"],
        "campusId": "CAMPUS-MAIN-001",
        "campusName": "Central Campus Coimbatore",
        "department": "Academics & Teaching",
        "designation": "Senior PGT Mathematics"
      }
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_VALIDATION_FAILED`: Missing username or password fields or malformed JSON.
  - `401 ERR_INVALID_CREDENTIALS`: Username or password incorrect.
  - `403 ERR_ACCOUNT_SUSPENDED`: User account has been deactivated or locked due to excessive failed attempts.
  - `422 ERR_UNPROCESSABLE_ENTITY`: Request payload contains invalid data types.
  - `500 ERR_INTERNAL_SERVER`: Identity provider or database authentication service failure.
- **Backend Implementation Notes:**
  - **Tables:** `auth_users` (PK: `id`), `auth_user_roles` (PK: `id`, FK: `user_id -> auth_users.id`), `campus_master` (PK: `id`).
  - **Transaction & Concurrency:** Authentication reads utilize `READ COMMITTED` isolation. Failed login attempts increment atomic counter with row-level locking (`SELECT ... FOR UPDATE`) in `auth_users`.
  - **Indexing:** `CREATE INDEX idx_auth_users_username ON auth_users(username);`, `CREATE INDEX idx_auth_user_roles_user ON auth_user_roles(user_id);`

---

### 4.2 `POST /api/v1/auth/refresh`
- **Description:** Exchanges a valid refresh token for a refreshed JWT access token without requiring re-authentication.
- **Authorized Roles:** Any authenticated user with active refresh token.
- **Request Body Schema:**
  - `refreshToken` (string, required): Active cryptographically valid refresh token.
  ```json
  {
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.rotated...",
      "expiresIn": 3600
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_BAD_REQUEST`: Missing refresh token parameter.
  - `401 ERR_REFRESH_TOKEN_EXPIRED`: The refresh token has passed its validity window.
  - `401 ERR_REFRESH_TOKEN_REVOKED`: The refresh token has been revoked by logout or security rotation.
  - `403 ERR_TOKEN_REUSE_DETECTED`: Token reuse anomaly detected; immediately revokes entire session chain.
  - `500 ERR_INTERNAL_SERVER`: Token signing or Redis revocation lookup error.
- **Backend Implementation Notes:**
  - **Tables:** `auth_refresh_tokens` (PK: `token_hash`, FK: `user_id -> auth_users.id`), `auth_sessions` (PK: `session_id`).
  - **Transaction & Concurrency:** Enforces single-use refresh token rotation in an atomic `SERIALIZABLE` transaction: invalidates previous token and inserts new hash.
  - **Indexing:** `CREATE UNIQUE INDEX idx_refresh_token_hash ON auth_refresh_tokens(token_hash);`, `CREATE INDEX idx_refresh_user_id ON auth_refresh_tokens(user_id);`

---

### 4.3 `POST /api/v1/auth/logout`
- **Description:** Invalidates current access token and revokes associated refresh tokens across user sessions.
- **Authorized Roles:** All 29 roles.
- **Request Body Schema:**
  - `refreshToken` (string, optional): Specific refresh token to revoke.
  - `allDevices` (boolean, optional, default: `false`): If true, revokes all sessions across all devices for this user.
  ```json
  {
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "allDevices": false
  }
  ```
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "message": "Successfully logged out.",
      "loggedOutAt": "2026-11-13T14:35:00.000Z"
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_BAD_REQUEST`: Malformed logout payload.
  - `401 ERR_UNAUTHORIZED`: Missing or invalid Bearer authentication token.
  - `403 ERR_FORBIDDEN`: Caller lacks authorization to invalidate target session.
  - `404 ERR_SESSION_NOT_FOUND`: Specified session token already deleted or expired.
  - `500 ERR_INTERNAL_SERVER`: Redis session cache or token revocation list failure.
- **Backend Implementation Notes:**
  - **Tables:** `auth_sessions` (PK: `session_id`, FK: `user_id -> auth_users.id`), `auth_refresh_tokens` (PK: `token_hash`).
  - **Transaction & Concurrency:** Add JTI (JWT ID) to distributed Redis token revocation blocklist with TTL matching remaining token lifetime; mark `auth_sessions.is_active = FALSE`.
  - **Indexing:** `CREATE INDEX idx_sessions_user_active ON auth_sessions(user_id, is_active);`

---

### 4.4 `GET /api/v1/auth/me`
- **Description:** Returns the authenticated caller's full profile, campus affiliations, active role, and permission grants.
- **Authorized Roles:** All 29 roles.
- **Query Parameters:** None.
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "USR-TCH-001",
      "fullName": "Meenakshi Sharma",
      "email": "teacher.sharma@schoolerp.org",
      "phone": "+91 98401 23456",
      "role": "teacher",
      "campus": {
        "id": "CAMPUS-MAIN-001",
        "name": "Central Campus",
        "academicYear": "2025-2026"
      },
      "permissions": [
        "academics:marks:read",
        "academics:marks:write",
        "attendance:class:write",
        "homework:assign:write"
      ],
      "avatarUrl": "https://cdn.schoolerp.internal/avatars/usr-tch-001.png"
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `401 ERR_UNAUTHORIZED`: Authentication credentials missing or Bearer token expired.
  - `403 ERR_FORBIDDEN`: User account disabled or campus scope inactive.
  - `404 ERR_USER_NOT_FOUND`: Authenticated principal ID not found in database.
  - `500 ERR_INTERNAL_SERVER`: Database connection timeout or profile resolution error.
- **Backend Implementation Notes:**
  - **Tables:** `auth_users` (PK: `id`), `auth_user_roles` (PK: `id`, FK: `user_id -> auth_users.id`), `campus_master` (PK: `id`).
  - **Transaction & Concurrency:** Read-only query executing at `READ COMMITTED` isolation level. Profile and permission grants cached in Redis with 15-minute TTL.
  - **Indexing:** `CREATE INDEX idx_auth_users_email ON auth_users(email);`, `CREATE INDEX idx_auth_users_campus ON auth_users(campus_id);`

---

### 4.5 `GET /api/v1/auth/roles-permissions`
- **Description:** Returns the complete system-wide role-permission matrix for UI route guards and action button entitlement evaluation.
- **Authorized Roles:** `superadmin`, `director`, `jointdirector`, `jointdirectorassistant`, `admin`, `processauditor`.
- **Query Parameters:**
  - `role` (string, optional): Specific role key filter.
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "teacher": {
        "label": "Teacher",
        "homePath": "/teacher/dashboard",
        "permissions": ["marks:create", "attendance:mark", "homework:grade"],
        "accessibleRoutes": ["/teacher/*", "/common/attendance-leave"]
      },
      "fileroom": {
        "label": "File Room Custodian",
        "homePath": "/fileroom/dashboard",
        "permissions": ["fileroom:checkout", "fileroom:register", "fileroom:dispose"],
        "accessibleRoutes": ["/fileroom/*"]
      }
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_INVALID_ROLE`: Specified role filter key does not exist in canonical role registry.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Caller role lacks privilege to view global system permissions.
  - `500 ERR_INTERNAL_SERVER`: Failure retrieving role-permission mapping configuration.
- **Backend Implementation Notes:**
  - **Tables:** `auth_roles_permissions` (PK: `id`, FK: `role_key`, `permission_key`), `auth_permissions_catalog` (PK: `permission_key`).
  - **Transaction & Concurrency:** Read-only static dictionary lookup with 1-hour Redis in-memory cache.
  - **Indexing:** `CREATE INDEX idx_roles_permissions_role ON auth_roles_permissions(role_key);`

---

### 4.6 `POST /api/v1/auth/switch-role`
- **Description:** Switches caller's active role context among their assigned secondary roles without requiring full re-login.
- **Authorized Roles:** Any user with multiple assigned roles in `availableRoles`.
- **Request Body Schema:**
  - `targetRole` (string, required): One of user's authorized role keys.
  ```json
  {
    "targetRole": "coordinator"
  }
  ```
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.switched...",
      "activeRole": "coordinator",
      "homePath": "/coordinator/dashboard"
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_MISSING_TARGET_ROLE`: `targetRole` attribute omitted in request body.
  - `401 ERR_UNAUTHORIZED`: Authentication token missing or expired.
  - `403 ERR_ROLE_NOT_ASSIGNED`: The user does not hold the requested target role in `auth_user_roles`.
  - `422 ERR_INVALID_ROLE_ENUM`: Target role is not one of the 29 canonical roles in `ROLES`.
  - `500 ERR_INTERNAL_SERVER`: Token re-signing or session update failure.
- **Backend Implementation Notes:**
  - **Tables:** `auth_users` (PK: `id`), `auth_user_roles` (PK: `id`, FK: `user_id -> auth_users.id`), `auth_sessions` (PK: `session_id`).
  - **Transaction & Concurrency:** Validates role assignment against `auth_user_roles` inside `READ COMMITTED` transaction; issues updated JWT token with new `activeRole` claim.
  - **Indexing:** `CREATE UNIQUE INDEX idx_user_role_composite ON auth_user_roles(user_id, role_key);`

---

### 4.7 `POST /api/v1/auth/reset-password`
- **Description:** Initiates or completes a password reset with temporary reset token or current password.
- **Authorized Roles:** Authenticated user (self-service) or unauthenticated with OTP reset token.
- **Request Body Schema:**
  - `resetToken` (string, optional): One-time cryptographic token from reset email/SMS.
  - `oldPassword` (string, optional): Required if caller is authenticated and changing own password.
  - `newPassword` (string, required): Minimum 10 characters with mixed-case, digit, and symbol.
  ```json
  {
    "oldPassword": "CurrentPassword123!",
    "newPassword": "NewStrongerPassword456@"
  }
  ```
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "message": "Password updated successfully. All active sessions invalidated.",
      "updatedAt": "2026-11-13T14:40:00.000Z"
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_WEAK_PASSWORD`: New password does not meet institutional entropy standards (min 10 chars, upper, lower, numeric, symbol).
  - `401 ERR_INVALID_OLD_PASSWORD`: Current password provided does not match existing hash.
  - `403 ERR_TOKEN_EXPIRED`: Password reset token expired or already consumed.
  - `422 ERR_VALIDATION_FAILED`: Password confirmation mismatch or missing required attributes.
  - `500 ERR_INTERNAL_SERVER`: Password hashing or database write error.
- **Backend Implementation Notes:**
  - **Tables:** `auth_users` (PK: `id`), `auth_password_reset_tokens` (PK: `token_hash`, FK: `user_id -> auth_users.id`), `auth_sessions` (PK: `session_id`).
  - **Transaction & Concurrency:** Atomic transaction updating password hash (Argon2id), deleting used reset token, and terminating all active sessions in `auth_sessions` except caller if requested.
  - **Indexing:** `CREATE INDEX idx_reset_token_hash ON auth_password_reset_tokens(token_hash, expires_at);`

---

### 4.8 `GET /api/v1/auth/sessions`
- **Description:** Lists all active sessions, IP addresses, user agents, and login timestamps for the current user.
- **Authorized Roles:** All 29 roles.
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "sessionId": "SESS-2026-9921",
        "ipAddress": "192.168.1.104",
        "device": "Chrome 131 on Windows 11",
        "createdAt": "2026-11-13T08:30:00Z",
        "lastActivityAt": "2026-11-13T14:40:00Z",
        "isCurrent": true
      }
    ],
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `401 ERR_UNAUTHORIZED`: Missing or invalid Bearer access token.
  - `403 ERR_FORBIDDEN`: Accessing session listings outside caller identity.
  - `500 ERR_INTERNAL_SERVER`: Failed to query active session registry.
- **Backend Implementation Notes:**
  - **Tables:** `auth_sessions` (PK: `session_id`, FK: `user_id -> auth_users.id`).
  - **Transaction & Concurrency:** Read-only query filtering by `user_id` and `is_active = TRUE` with order by `last_activity_at DESC`.
  - **Indexing:** `CREATE INDEX idx_auth_sessions_user_active ON auth_sessions(user_id, is_active, last_activity_at DESC);`

---

## 5. Domain 2: Academics, Classes, Timetables & Examinations

### 5.1 `GET /api/v1/academics/exams`
- **Description:** Retrieves list of scheduled, ongoing, or concluded examination sessions with academic year filtering.
- **Authorized Roles:** `superadmin`, `director`, `jointdirector`, `jointdirectorassistant`, `principal`, `coordinator`, `teacher`, `student`, `parent`, `qualityauditor`.
- **Query Parameters:** `academicYear`, `term`, `status` (`Scheduled` | `Ongoing` | `Completed`), `page`, `pageSize`.
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "EXAM-2025-T1",
        "title": "Term 1 Mid-Term Summative Assessment",
        "academicYear": "2025-2026",
        "term": "Term 1",
        "startDate": "2025-09-15",
        "endDate": "2025-09-26",
        "status": "Completed",
        "applicableGrades": ["Grade 9", "Grade 10", "Grade 11", "Grade 12"]
      }
    ],
    "meta": { "total": 4, "page": 1, "pageSize": 20 },
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_INVALID_ACADEMIC_YEAR`: Malformed academic year format (expected YYYY-YYYY).
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: User role not permitted to inspect examination schedules.
  - `422 ERR_VALIDATION_FAILED`: Invalid pagination or query parameter syntax.
  - `500 ERR_INTERNAL_SERVER`: Database query failure fetching exam schedules.
- **Backend Implementation Notes:**
  - **Tables:** `academic_exams` (PK: `id`, FK: `academic_year_id`, `campus_id`).
  - **Transaction & Concurrency:** `READ COMMITTED` read-only collection query with keyset pagination.
  - **Indexing:** `CREATE INDEX idx_academic_exams_year_term ON academic_exams(academic_year, term, status);`, `CREATE INDEX idx_academic_exams_campus ON academic_exams(campus_id);`

---

### 5.2 `POST /api/v1/academics/exams`
- **Description:** Creates a new institutional examination schedule with syllabus blueprints and grade boundaries.
- **Authorized Roles:** `superadmin`, `principal`, `coordinator`.
- **Request Body Schema:**
  - `title` (string, required): Title of the exam.
  - `academicYear` (string, required): E.g., `"2025-2026"`.
  - `term` (string, required): E.g., `"Term 2"`.
  - `startDate` (string YYYY-MM-DD, required).
  - `endDate` (string YYYY-MM-DD, required).
  - `applicableGrades` (array of strings, required).
  ```json
  {
    "title": "Annual Final Board Mock Examinations 2026",
    "academicYear": "2025-2026",
    "term": "Term 2",
    "startDate": "2026-02-10",
    "endDate": "2026-02-24",
    "applicableGrades": ["Grade 10", "Grade 12"]
  }
  ```
- **Success Response (HTTP 201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "id": "EXAM-2026-MOCK",
      "title": "Annual Final Board Mock Examinations 2026",
      "status": "Scheduled",
      "createdAt": "2026-11-13T14:45:00.000Z"
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_INVALID_DATE_RANGE`: `startDate` must be chronologically prior to `endDate`.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Caller lacks administrative academic scheduling privilege.
  - `409 ERR_DUPLICATE_EXAM_SCHEDULE`: An examination schedule with this title and academic term already exists.
  - `422 ERR_VALIDATION_FAILED`: Missing mandatory exam title, grades, or date attributes.
  - `500 ERR_INTERNAL_SERVER`: Transaction error inserting exam blueprint.
- **Backend Implementation Notes:**
  - **Tables:** `academic_exams` (PK: `id`, FK: `campus_id`).
  - **Transaction & Concurrency:** Atomic transaction ensuring unique exam title within academic year; writes audit log entry on creation.
  - **Indexing:** `CREATE UNIQUE INDEX idx_exam_title_year_uniq ON academic_exams(title, academic_year, campus_id);`

---

### 5.3 `GET /api/v1/academics/exams/:id`
- **Description:** Retrieves detailed examination schedule including subject date sheets, maximum marks, and passing thresholds.
- **Authorized Roles:** All academic roles, students, parents.
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "EXAM-2025-T1",
      "title": "Term 1 Summative Assessment",
      "dateSheet": [
        { "subjectCode": "MATH101", "subjectName": "Mathematics", "examDate": "2025-09-15", "maxMarks": 100, "passMarks": 33 }
      ]
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `401 ERR_UNAUTHORIZED`: Authentication token missing or invalid.
  - `403 ERR_FORBIDDEN`: Student or parent not enrolled in grades covered by this exam.
  - `404 ERR_EXAM_NOT_FOUND`: Examination ID does not exist.
  - `500 ERR_INTERNAL_SERVER`: Internal server error loading exam date sheet.
- **Backend Implementation Notes:**
  - **Tables:** `academic_exams` (PK: `id`), `academic_exam_subjects` (PK: `id`, FK: `exam_id -> academic_exams.id`).
  - **Transaction & Concurrency:** Read-only join query between `academic_exams` and child subjects with 5-minute Redis caching for published exams.
  - **Indexing:** `CREATE INDEX idx_exam_subjects_exam_id ON academic_exam_subjects(exam_id);`

---

### 5.4 `GET /api/v1/academics/marks`
- **Description:** Retrieves entered marks records filtered by student, class, section, or exam session.
- **Authorized Roles:** `superadmin`, `director`, `jointdirector`, `principal`, `coordinator`, `teacher`, `student`, `parent`, `qualityauditor`.
- **Query Parameters:** `examId`, `studentId`, `grade`, `section`, `subjectId`, `page`, `pageSize`.
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "MRK-STU-001-MATH",
        "examId": "EXAM-2025-T1",
        "studentId": "STU-2026-001",
        "studentName": "Aarav Sharma",
        "grade": "Grade 10",
        "section": "A",
        "subjectId": "MATH101",
        "subjectName": "Mathematics",
        "maxMarks": 100,
        "theoryMarks": 68,
        "practicalMarks": 20,
        "totalMarks": 88,
        "percentage": 88.0,
        "gradeAwarded": "A1",
        "gradePoint": 10.0
      }
    ],
    "meta": { "total": 1, "page": 1, "pageSize": 20 },
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_INVALID_FILTERS`: Invalid grade or section filter combination.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Teacher unauthorized for this section, or student/parent attempting cross-student inspection.
  - `422 ERR_VALIDATION_FAILED`: Query parameters failed validation.
  - `500 ERR_INTERNAL_SERVER`: Database query timeout retrieving marks roster.
- **Backend Implementation Notes:**
  - **Tables:** `academic_marks` (PK: `id`, FK: `exam_id -> academic_exams.id`, `student_id -> auth_users.id`, `subject_id`).
  - **Transaction & Concurrency:** Evaluated at `READ COMMITTED`. Teachers strictly scoped to sections where assigned as primary or subject instructor.
  - **Indexing:** `CREATE INDEX idx_academic_marks_lookup ON academic_marks(exam_id, grade, section, subject_id);`, `CREATE INDEX idx_academic_marks_student ON academic_marks(student_id);`

---

### 5.5 `POST /api/v1/academics/marks`
- **Description:** Enters or updates marks for a single student with automated calculation of total, percentage, CBSE letter grade, and grade points.
- **Authorized Roles:** `teacher`, `coordinator`, `principal`, `superadmin`.
- **Request Body Schema:**
  - `examId` (string, required): Examination session ID.
  - `studentId` (string, required): Student identifier.
  - `grade` (string, required): E.g., `"Grade 10"`.
  - `section` (string, required): E.g., `"A"`.
  - `subjectId` (string, required): Subject code.
  - `subjectName` (string, required).
  - `maxMarks` (number, required): E.g., `100`.
  - `theoryMarks` (number, required): Cannot exceed subject theoretical ceiling.
  - `practicalMarks` (number, optional, default `0`).
  ```json
  {
    "examId": "EXAM-2025-T1",
    "studentId": "STU-2026-001",
    "grade": "Grade 10",
    "section": "A",
    "subjectId": "MATH101",
    "subjectName": "Mathematics",
    "maxMarks": 100,
    "theoryMarks": 72,
    "practicalMarks": 19
  }
  ```
- **Success Response (HTTP 201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "id": "MRK-STU-2026-001-MATH101",
      "examId": "EXAM-2025-T1",
      "studentId": "STU-2026-001",
      "totalMarks": 91,
      "percentage": 91.0,
      "gradeAwarded": "A1",
      "gradePoint": 10.0
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_MARKS_OVERFLOW`: `theoryMarks + practicalMarks` exceeds `maxMarks`.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Teacher is not assigned to teach target subject in this grade/section.
  - `404 ERR_STUDENT_NOT_FOUND`: Student ID not registered in target examination roster.
  - `409 ERR_MARKS_LOCKED`: Exam marks have already been officially finalized and locked by Principal.
  - `422 ERR_VALIDATION_FAILED`: Negative marks or invalid grading schema payload.
  - `500 ERR_INTERNAL_SERVER`: Database failure executing marks upsert.
- **Backend Implementation Notes:**
  - **Tables:** `academic_marks` (PK: `id`, FK: `exam_id -> academic_exams.id`, `student_id -> auth_users.id`), `academic_student_dossiers` (PK: `id`, FK: `student_id -> auth_users.id`).
  - **Transaction & Concurrency:** Upsert with row-level lock (`INSERT ... ON CONFLICT (exam_id, student_id, subject_id) DO UPDATE`). Atomically recalculates CBSE letter grade and recalculates cumulative GPA in student dossier.
  - **Indexing:** `CREATE UNIQUE INDEX idx_marks_exam_student_subj ON academic_marks(exam_id, student_id, subject_id);`

---

### 5.6 `POST /api/v1/academics/marks/batch`
- **Description:** Performs bulk marks entry for an entire class roster in a single atomic database transaction.
- **Authorized Roles:** `teacher`, `coordinator`, `principal`, `superadmin`.
- **Request Body Schema:**
  - `examId` (string, required)
  - `subjectId` (string, required)
  - `grade` (string, required)
  - `section` (string, required)
  - `entries` (array of objects with `studentId`, `theoryMarks`, `practicalMarks`, `maxMarks`)
  ```json
  {
    "examId": "EXAM-2025-T1",
    "subjectId": "SCI101",
    "grade": "Grade 10",
    "section": "A",
    "entries": [
      { "studentId": "STU-2026-001", "theoryMarks": 65, "practicalMarks": 25, "maxMarks": 100 },
      { "studentId": "STU-2026-002", "theoryMarks": 58, "practicalMarks": 22, "maxMarks": 100 }
    ]
  }
  ```
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "processedCount": 2,
      "updatedAt": "2026-11-13T14:48:00.000Z"
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_EMPTY_BATCH`: Marks entry array is empty.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Caller lacks authorization to grade one or more students in payload.
  - `409 ERR_EXAM_FINALIZED`: Target examination marks submission window has expired.
  - `422 ERR_BATCH_VALIDATION_FAILED`: One or more records contain invalid marks or invalid student IDs.
  - `500 ERR_INTERNAL_SERVER`: Atomic batch transaction failed; entire batch rolled back.
- **Backend Implementation Notes:**
  - **Tables:** `academic_marks` (PK: `id`, FK: `exam_id -> academic_exams.id`, `student_id -> auth_users.id`), `academic_student_dossiers` (PK: `id`).
  - **Transaction & Concurrency:** Executes within single `READ COMMITTED` transaction. Any single record validation failure causes complete transaction rollback.
  - **Indexing:** `CREATE INDEX idx_marks_batch_insert ON academic_marks(exam_id, student_id);`

---

### 5.7 `GET /api/v1/academics/dossiers`
- **Description:** Lists cumulative student academic dossiers including attendance, disciplinary status, and co-scholastic ratings.
- **Authorized Roles:** `superadmin`, `director`, `jointdirector`, `jointdirectorassistant`, `jointdirectoraudit`, `principal`, `coordinator`, `qualityauditor`.
- **Query Parameters:** `grade`, `section`, `search`, `page`, `pageSize`.
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "studentId": "STU-2026-001",
        "admissionNumber": "ADM-2025-0891",
        "fullName": "Aarav Sharma",
        "grade": "Grade 10",
        "section": "A",
        "attendancePercentage": 96.5,
        "cumulativeGpa": 9.4,
        "coScholasticRatings": [
          { "domain": "Work Education", "grade": "A" },
          { "domain": "Discipline & Conduct", "grade": "A" }
        ]
      }
    ],
    "meta": { "total": 1, "page": 1, "pageSize": 20 },
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_BAD_REQUEST`: Missing grade or academic year filter.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: User role not permitted to inspect longitudinal student dossiers.
  - `422 ERR_VALIDATION_FAILED`: Invalid pagination parameter format.
  - `500 ERR_INTERNAL_SERVER`: Failed to aggregate academic dossier analytics.
- **Backend Implementation Notes:**
  - **Tables:** `academic_student_dossiers` (PK: `id`, FK: `student_id -> auth_users.id`), `academic_marks` (PK: `id`), `attendance_ledger` (PK: `id`).
  - **Transaction & Concurrency:** Read-only materialized view or aggregated CTE query executed at `READ COMMITTED`.
  - **Indexing:** `CREATE INDEX idx_dossiers_grade_section ON academic_student_dossiers(grade, section);`, `CREATE INDEX idx_dossiers_student_id ON academic_student_dossiers(student_id);`

---

### 5.8 `GET /api/v1/academics/dossiers/:studentId`
- **Description:** Retrieves comprehensive single-student dossier with parent contact details, emergency information, and historical grades.
- **Authorized Roles:** `superadmin`, `director`, `jointdirector`, `jointdirectorassistant`, `jointdirectoraudit`, `principal`, `coordinator`, `teacher`, `parent`, `student`, `qualityauditor`.
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "studentId": "STU-2026-001",
      "admissionNumber": "ADM-2025-0891",
      "fullName": "Aarav Sharma",
      "gender": "Male",
      "dob": "2010-05-14",
      "bloodGroup": "O+",
      "grade": "Grade 10",
      "section": "A",
      "rollNo": 1,
      "parentDetails": {
        "fatherName": "Ramesh Sharma",
        "fatherPhone": "+91 98401 23456",
        "motherName": "Priya Sharma",
        "email": "sharma.family@example.com"
      },
      "attendancePercentage": 96.5,
      "scholasticRank": 2
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Student or parent attempting to access dossier belonging to another student.
  - `404 ERR_DOSSIER_NOT_FOUND`: Student dossier record not found for supplied ID.
  - `500 ERR_INTERNAL_SERVER`: Error compiling student dossier transcript.
- **Backend Implementation Notes:**
  - **Tables:** `academic_student_dossiers` (PK: `id`, FK: `student_id -> auth_users.id`), `academic_marks` (PK: `id`), `awards_som_nominations` (PK: `id`).
  - **Transaction & Concurrency:** Read-only single row lookup with joins across historical examination marks and extracurricular awards.
  - **Indexing:** `CREATE UNIQUE INDEX idx_student_dossier_uniq ON academic_student_dossiers(student_id);`

---

### 5.9 `GET /api/v1/academics/report-card/:studentId`
- **Description:** Generates formatted CBSE report card summary aggregating scholastic marks, co-scholastic grades, attendance percentage, and class teacher remarks.
- **Authorized Roles:** `teacher`, `coordinator`, `principal`, `student`, `parent`, `superadmin`.
- **Query Parameters:** `examId` (optional, default latest exam), `academicYear`.
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "studentId": "STU-2026-001",
      "studentName": "Aarav Sharma",
      "admissionNumber": "ADM-2025-0891",
      "grade": "Grade 10",
      "section": "A",
      "academicYear": "2025-2026",
      "examId": "EXAM-2025-T1",
      "scholasticMarks": [
        { "subjectName": "Mathematics", "totalMarks": 91, "maxMarks": 100, "gradeAwarded": "A1", "gradePoint": 10.0 }
      ],
      "summary": {
        "totalMarks": 465,
        "maxMarks": 500,
        "percentage": 93.0,
        "overallGrade": "A1",
        "pass": true
      },
      "coScholastics": [
        { "domain": "Work Education", "grade": "A" }
      ],
      "attendancePercentage": 96.5,
      "teacherRemarks": "Consistently diligent, exhibits sterling academic and peer leadership.",
      "generatedDate": "2026-11-13"
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_EXAM_TERM_REQUIRED`: Query parameter `term` or `examId` is required.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Parent or student unauthorized for requested student report card.
  - `404 ERR_MARKS_NOT_FOUND`: Marks have not yet been published for the requested student and term.
  - `500 ERR_INTERNAL_SERVER`: PDF report card generation service error.
- **Backend Implementation Notes:**
  - **Tables:** `academic_marks` (PK: `id`), `academic_exams` (PK: `id`), `academic_student_dossiers` (PK: `id`), `auth_users` (PK: `id`).
  - **Transaction & Concurrency:** Read-only query compiling multi-subject mark sheet, attendance percentages, and teacher remarks. Returns digitally signed payload.
  - **Indexing:** `CREATE INDEX idx_report_card_lookup ON academic_marks(student_id, exam_id);`

---

### 5.10 `GET /api/v1/academics/classes`
- **Description:** Returns all grades, sections, assigned class teachers, and student headcounts.
- **Authorized Roles:** `superadmin`, `director`, `jointdirector`, `principal`, `coordinator`, `teacher`, `admin`.
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "CLS-G10-A",
        "grade": "Grade 10",
        "section": "A",
        "roomNumber": "Academic Block A - Room 204",
        "classTeacherId": "USR-TCH-001",
        "classTeacherName": "Meenakshi Sharma",
        "studentCount": 38,
        "capacity": 40
      }
    ],
    "meta": { "total": 18, "page": 1, "pageSize": 50 },
    "error": null
  }
  ```
- **Error Codes:**
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Caller lacks privilege to inspect master class structures.
  - `500 ERR_INTERNAL_SERVER`: Error querying institutional class repository.
- **Backend Implementation Notes:**
  - **Tables:** `academic_classes` (PK: `id`, FK: `campus_id`, `class_teacher_id -> auth_users.id`).
  - **Transaction & Concurrency:** Read-only reference table query with 30-minute Redis caching per campus.
  - **Indexing:** `CREATE INDEX idx_academic_classes_campus ON academic_classes(campus_id, academic_year);`

---

### 5.11 `GET /api/v1/academics/timetables`
- **Description:** Retrieves weekly schedule grids per class or per teacher.
- **Authorized Roles:** `superadmin`, `principal`, `coordinator`, `teacher`, `student`, `parent`, `admin`.
- **Query Parameters:** `grade`, `section`, `teacherId`, `dayOfWeek`.
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "grade": "Grade 10",
      "section": "A",
      "schedule": [
        {
          "period": 1,
          "startTime": "08:45 AM",
          "endTime": "09:30 AM",
          "subject": "Mathematics",
          "teacherName": "Meenakshi Sharma",
          "room": "Room 204"
        }
      ]
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_CLASS_IDENTIFIER_REQUIRED`: Either `classId` or (`grade` and `section`) must be provided.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Student/parent unauthorized to view timetable for other classes.
  - `404 ERR_TIMETABLE_NOT_FOUND`: No active timetable schedule found for specified class.
  - `500 ERR_INTERNAL_SERVER`: Error retrieving period schedule.
- **Backend Implementation Notes:**
  - **Tables:** `academic_timetables` (PK: `id`, FK: `class_id -> academic_classes.id`, `teacher_id -> auth_users.id`).
  - **Transaction & Concurrency:** Read-only query fetching 8-period weekly schedule blocks with day-of-week indexing.
  - **Indexing:** `CREATE INDEX idx_timetables_class_day ON academic_timetables(class_id, day_of_week);`, `CREATE INDEX idx_timetables_teacher ON academic_timetables(teacher_id, day_of_week);`

---

## 6. Domain 3: Attendance, Biometrics & Leave Requests

### 6.1 `GET /api/v1/attendance/ledger`
- **Description:** Queries daily staff and student attendance records across departments, shifts, and classes.
- **Authorized Roles:** `superadmin`, `director`, `jointdirector`, `principal`, `coordinator`, `teacher`, `hr`, `admin`.
- **Query Parameters:** `date` (YYYY-MM-DD), `department`, `grade`, `section`, `status` (`Present`, `Absent`, `Late`, `Half Day`, `On Leave`), `page`, `pageSize`.
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "ATT-2026-0312-001",
        "date": "2026-03-12",
        "entityType": "EMPLOYEE",
        "userId": "USR-TCH-001",
        "userName": "Meenakshi Sharma",
        "department": "Academics & Teaching",
        "shiftName": "Academic Morning Shift",
        "firstInTime": "08:24 AM",
        "lastOutTime": "03:48 PM",
        "lateMinutes": 0,
        "earlyDepartureMinutes": 0,
        "status": "Present",
        "biometricDeviceId": "ESSL-GATE1-MAIN",
        "isManualOverride": false
      }
    ],
    "meta": { "total": 1, "page": 1, "pageSize": 20 },
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_INVALID_DATE`: Query parameter `date` must be formatted as YYYY-MM-DD.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Teacher unauthorized for classes outside assigned department/roster.
  - `422 ERR_VALIDATION_FAILED`: Invalid status filter parameter.
  - `500 ERR_INTERNAL_SERVER`: Database query timeout querying daily attendance ledger.
- **Backend Implementation Notes:**
  - **Tables:** `attendance_ledger` (PK: `id`, FK: `user_id -> auth_users.id`, `campus_id`).
  - **Transaction & Concurrency:** Read-only query executed at `READ COMMITTED`. Partitioned by `date` for high-performance temporal querying across multi-thousand student campuses.
  - **Indexing:** `CREATE INDEX idx_attendance_ledger_date_dept ON attendance_ledger(date, department, status);`, `CREATE INDEX idx_attendance_ledger_user ON attendance_ledger(user_id, date);`

---

### 6.2 `POST /api/v1/attendance/mark`
- **Description:** Marks or overrides an individual student or employee daily attendance status with audit notes.
- **Authorized Roles:** `teacher`, `hr`, `admin`, `superadmin`.
- **Request Body Schema:**
  - `date` (string YYYY-MM-DD, required).
  - `userId` (string, required): Student or employee ID.
  - `status` (string, required): `"Present" | "Absent" | "Late" | "Half Day" | "On Leave"`.
  - `remarks` (string, optional): Mandatory if manual override.
  ```json
  {
    "date": "2026-03-12",
    "userId": "STU-2026-001",
    "status": "Present",
    "remarks": "Marked present during morning roll call."
  }
  ```
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "ATT-2026-0312-STU-001",
      "date": "2026-03-12",
      "userId": "STU-2026-001",
      "status": "Present",
      "updatedAt": "2026-11-13T14:55:00.000Z"
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_FUTURE_DATE_DISALLOWED`: Cannot mark attendance for a future calendar date.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Caller not authorized as class teacher or HR attendance officer.
  - `404 ERR_USER_NOT_FOUND`: Employee or student ID not found.
  - `409 ERR_ATTENDANCE_LOCKED`: Attendance for this calendar date has been locked by HR.
  - `422 ERR_VALIDATION_FAILED`: Invalid attendance status enum (`Present`, `Absent`, `Late`, `Half Day`, `On Leave`).
  - `500 ERR_INTERNAL_SERVER`: Attendance record upsert failure.
- **Backend Implementation Notes:**
  - **Tables:** `attendance_ledger` (PK: `id`, FK: `user_id -> auth_users.id`, `campus_id`).
  - **Transaction & Concurrency:** Atomic upsert with row-level lock (`INSERT ... ON CONFLICT (user_id, date) DO UPDATE`). Automatically synchronizes approved leave flag from `attendance_leave_requests`.
  - **Indexing:** `CREATE UNIQUE INDEX idx_attendance_user_date ON attendance_ledger(user_id, date);`

---

### 6.3 `POST /api/v1/attendance/bulk-mark`
- **Description:** Bulk marks daily attendance for an entire class roster or department roster in a single atomic transaction.
- **Authorized Roles:** `teacher`, `hr`, `admin`, `superadmin`.
- **Request Body Schema:**
  - `date` (string YYYY-MM-DD, required).
  - `classId` (string, optional).
  - `records` (array of objects with `userId`, `status`, `remarks`).
  ```json
  {
    "date": "2026-03-12",
    "classId": "CLS-G10-A",
    "records": [
      { "userId": "STU-2026-001", "status": "Present" },
      { "userId": "STU-2026-002", "status": "Absent", "remarks": "Unexcused absence" }
    ]
  }
  ```
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "markedDate": "2026-03-12",
      "totalRecordsProcessed": 2,
      "updatedAt": "2026-11-13T14:56:00.000Z"
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_EMPTY_ROSTER`: Records array cannot be empty.
  - `400 ERR_FUTURE_DATE_DISALLOWED`: Cannot submit bulk attendance for future dates.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Caller is not assigned class teacher for target grade and section.
  - `409 ERR_DATE_FINALIZED`: Daily attendance ledger already signed off by Principal.
  - `422 ERR_VALIDATION_FAILED`: One or more records contain invalid attendance codes.
  - `500 ERR_INTERNAL_SERVER`: Bulk ledger transaction aborted.
- **Backend Implementation Notes:**
  - **Tables:** `attendance_ledger` (PK: `id`, FK: `user_id -> auth_users.id`, `campus_id`).
  - **Transaction & Concurrency:** Batch `READ COMMITTED` transaction executing multi-row `INSERT ... ON CONFLICT` with batch size limit of 100 entries per transaction.
  - **Indexing:** `CREATE INDEX idx_attendance_batch_lookup ON attendance_ledger(campus_id, date, grade, section);`

---

### 6.4 `GET /api/v1/attendance/student-summary/:studentId`
- **Description:** Returns monthly attendance summary, present days, absent days, leave days, and computed attendance percentage for a student.
- **Authorized Roles:** `teacher`, `coordinator`, `principal`, `student`, `parent`, `hr`, `superadmin`.
- **Query Parameters:** `academicYear`, `month` (1-12).
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "studentId": "STU-2026-001",
      "academicYear": "2025-2026",
      "workingDays": 180,
      "presentDays": 172,
      "absentDays": 5,
      "approvedLeaveDays": 3,
      "attendancePercentage": 95.55,
      "punctualityRate": 98.2,
      "meetsBoardEligibilityThreshold": true
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Student or parent not authorized to access records of other students.
  - `404 ERR_STUDENT_NOT_FOUND`: Target student ID does not exist in student registry.
  - `500 ERR_INTERNAL_SERVER`: Error calculating aggregated attendance metrics.
- **Backend Implementation Notes:**
  - **Tables:** `attendance_ledger` (PK: `id`, FK: `user_id -> auth_users.id`).
  - **Transaction & Concurrency:** Read-only aggregation query utilizing SQL `FILTER (WHERE status = ...)` clauses to compute working days, present count, absent count, and percentage.
  - **Indexing:** `CREATE INDEX idx_attendance_student_summary ON attendance_ledger(user_id, status, date);`

---

### 6.5 `GET /api/v1/attendance/devices`
- **Description:** Lists all registered eSSL biometric hardware devices, IP addresses, connection health, and last sync timestamps.
- **Authorized Roles:** `superadmin`, `hr`, `admin`, `itsupportmanager`, `gatekeepermanager`.
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "DEV-ESSL-01",
        "deviceName": "Main Administrative Building Biometric Gate 1",
        "deviceModel": "eSSL SilkBio-101TC",
        "ipAddress": "192.168.10.51",
        "port": 4370,
        "location": "Admin Portico Entry",
        "status": "Online",
        "lastHeartbeat": "2026-11-13T14:50:00Z",
        "enrolledUserCount": 420
      }
    ],
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Caller role lacks permission to monitor biometric turnstiles and scanners.
  - `500 ERR_INTERNAL_SERVER`: Biometric device gateway service communication failure.
- **Backend Implementation Notes:**
  - **Tables:** `biometric_devices` (PK: `id`, FK: `campus_id`).
  - **Transaction & Concurrency:** Read-only query fetching device connectivity status, IP addresses, serial numbers, and heartbeat timestamps.
  - **Indexing:** `CREATE INDEX idx_biometric_devices_campus ON biometric_devices(campus_id, is_active);`

---

### 6.6 `POST /api/v1/attendance/devices/sync`
- **Description:** Triggers on-demand biometric pull from registered eSSL hardware devices, fetching unprocessed punch logs.
- **Authorized Roles:** `superadmin`, `hr`, `itsupportmanager`, `gatekeepermanager`.
- **Request Body Schema:**
  - `deviceId` (string, optional; syncs all if omitted).
  ```json
  {
    "deviceId": "DEV-ESSL-01"
  }
  ```
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "syncedDevices": 1,
      "newPunchesFetched": 84,
      "deduplicatedPunches": 12,
      "processedAt": "2026-11-13T14:57:00.000Z"
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_DEVICE_OFFLINE`: Specified biometric device is unreachable over network.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Caller lacks device administration rights.
  - `404 ERR_DEVICE_NOT_FOUND`: Biometric device ID does not exist.
  - `500 ERR_INTERNAL_SERVER`: Network timeout communicating with eSSL/ZKTeco push SDK.
- **Backend Implementation Notes:**
  - **Tables:** `biometric_devices` (PK: `id`), `biometric_raw_punches` (PK: `id`, FK: `device_id -> biometric_devices.id`).
  - **Transaction & Concurrency:** Dispatches asynchronous background sync job; updates `last_sync_time` on device record using optimistic locking.
  - **Indexing:** `CREATE INDEX idx_device_sync_time ON biometric_devices(id, last_sync_time);`

---

### 6.7 `POST /api/v1/attendance/punches/ingest`
- **Description:** Ingests raw biometric punch events, applying 60-second punch deduplication windows and calculating shift First-In/Last-Out boundaries.
- **Authorized Roles:** `superadmin`, `hr`, `itsupportmanager`, Service Account / Device Gateway.
- **Request Body Schema:**
  - `punches` (array of objects with `biometricUserId`, `punchDateTime`, `deviceId`, `verifyMode`).
  ```json
  {
    "punches": [
      {
        "biometricUserId": "BIO-EMP-001",
        "punchDateTime": "2026-03-12T08:24:15Z",
        "deviceId": "DEV-ESSL-01",
        "verifyMode": "Fingerprint"
      }
    ]
  }
  ```
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "ingested": 1,
      "matchedEmployees": 1,
      "unmappedBiometricUsers": 0
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_EMPTY_PUNCH_BATCH`: Ingestion payload contains zero punch events.
  - `401 ERR_UNAUTHORIZED`: Missing or invalid device gateway API key.
  - `403 ERR_FORBIDDEN`: Service account not permitted to ingest raw punch logs.
  - `422 ERR_VALIDATION_FAILED`: Punch timestamps malformed or invalid biometric user IDs.
  - `500 ERR_INTERNAL_SERVER`: Error inserting raw punches into biometric ingestion buffer.
- **Backend Implementation Notes:**
  - **Tables:** `biometric_raw_punches` (PK: `id`, FK: `device_id -> biometric_devices.id`, `user_id -> auth_users.id`), `biometric_user_mappings` (PK: `id`), `attendance_ledger` (PK: `id`).
  - **Transaction & Concurrency:** Ingests raw punch logs into append-only raw buffer; idempotently de-duplicates punches within 60-second window before calculating daily in/out ledger entries.
  - **Indexing:** `CREATE UNIQUE INDEX idx_punches_dedup ON biometric_raw_punches(device_id, biometric_user_id, punch_timestamp);`

---

### 6.8 `GET /api/v1/attendance/leaves`
- **Description:** Lists submitted leave requests scoped by user role hierarchy (Teachers view own & class student requests; Dept Heads view department; Principal/HR view campus).
- **Authorized Roles:** `superadmin`, `director`, `jointdirector`, `principal`, `coordinator`, `hr`, `admin`, `teacher`, `driver`.
- **Query Parameters:** `status` (`Pending`, `Approved`, `Rejected`), `department`, `applicantRole`, `fromDate`, `toDate`, `page`, `pageSize`.
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "LR-2026-081",
        "applicantId": "STU-2026-001",
        "applicantName": "Aarav Sharma",
        "applicantRole": "student",
        "grade": "Grade 10",
        "section": "A",
        "leaveType": "Medical Leave",
        "startDate": "2026-03-15",
        "endDate": "2026-03-17",
        "totalDays": 3,
        "reason": "Viral fever and doctor recommended bed rest.",
        "attachmentUrl": "/uploads/medical_cert_081.pdf",
        "status": "Pending",
        "appliedDate": "2026-03-13"
      }
    ],
    "meta": { "total": 1, "page": 1, "pageSize": 20 },
    "error": null
  }
  ```
- **Error Codes:**
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Non-administrative users can only query their own leave applications.
  - `422 ERR_VALIDATION_FAILED`: Invalid status query filter.
  - `500 ERR_INTERNAL_SERVER`: Database query failure fetching leave requests.
- **Backend Implementation Notes:**
  - **Tables:** `attendance_leave_requests` (PK: `id`, FK: `applicant_id -> auth_users.id`, `approver_id -> auth_users.id`).
  - **Transaction & Concurrency:** Read-only query at `READ COMMITTED` isolation. Non-privileged roles automatically have `applicant_id = caller.id` enforced in SQL WHERE clause.
  - **Indexing:** `CREATE INDEX idx_leaves_applicant ON attendance_leave_requests(applicant_id, status);`, `CREATE INDEX idx_leaves_status ON attendance_leave_requests(status, created_at DESC);`

---

### 6.9 `POST /api/v1/attendance/leaves/apply`
- **Description:** Submits a new leave application for students or staff. Automatically checks leave entitlement balances and prevents duplicate date overlaps.
- **Authorized Roles:** All 29 roles (self-service leave application).
- **Request Body Schema:**
  - `leaveType` (string, required): `"Casual Leave" | "Sick Leave" | "Earned Leave" | "Medical Leave"`.
  - `startDate` (string YYYY-MM-DD, required).
  - `endDate` (string YYYY-MM-DD, required).
  - `reason` (string, required).
  - `attachmentUrl` (string, optional).
  ```json
  {
    "leaveType": "Medical Leave",
    "startDate": "2026-03-15",
    "endDate": "2026-03-17",
    "reason": "Viral fever with medical prescription attached.",
    "attachmentUrl": "/uploads/medical_cert_081.pdf"
  }
  ```
- **Success Response (HTTP 201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "id": "LR-2026-081",
      "status": "Pending",
      "appliedAt": "2026-11-13T14:58:00.000Z"
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_INVALID_DATE_RANGE`: `startDate` must be prior to or equal to `endDate`.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `409 ERR_OVERLAPPING_LEAVE`: Caller already has an approved or pending leave covering requested dates.
  - `422 ERR_INSUFFICIENT_LEAVE_BALANCE`: Requested days exceed available balance for target leave type.
  - `500 ERR_INTERNAL_SERVER`: Error persisting leave application.
- **Backend Implementation Notes:**
  - **Tables:** `attendance_leave_requests` (PK: `id`, FK: `applicant_id -> auth_users.id`), `attendance_leave_ledger` (PK: `id`, FK: `user_id -> auth_users.id`).
  - **Transaction & Concurrency:** Atomic transaction with `SERIALIZABLE` or pessimistic locking on applicant leave balance ledger; verifies zero date overlap before inserting record.
  - **Indexing:** `CREATE INDEX idx_leave_overlap_check ON attendance_leave_requests(applicant_id, start_date, end_date) WHERE status IN ('Pending', 'Approved');`

---

### 6.10 `POST /api/v1/attendance/leaves/:id/decision`
- **Description:** Approves or rejects a leave request. On approval, automatically synchronizes daily attendance ledger marking target dates with 'On Leave' (`L` status).
- **Authorized Roles:** `superadmin`, `director`, `jointdirector`, `principal`, `coordinator`, `hr`, `admin`.
- **Request Body Schema:**
  - `action` (string, required): `"APPROVE" | "REJECT"`.
  - `remarks` (string, required if rejected, optional if approved).
  ```json
  {
    "action": "APPROVE",
    "remarks": "Approved with recommendation for rest."
  }
  ```
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "LR-2026-081",
      "status": "Approved",
      "decisionBy": "USR-TCH-001",
      "decisionTimestamp": "2026-11-13T14:59:00.000Z",
      "attendanceSynchronized": true,
      "synchronizedDates": ["2026-03-15", "2026-03-16", "2026-03-17"]
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_ALREADY_DECIDED`: Leave request has already been Approved or Rejected.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Caller lacks administrative approval perimeter over applicant department.
  - `404 ERR_LEAVE_NOT_FOUND`: Leave request ID does not exist.
  - `422 ERR_REJECTION_REASON_REQUIRED`: Remarks are mandatory when rejecting a leave request.
  - `500 ERR_INTERNAL_SERVER`: Error executing atomic leave approval and attendance ledger synchronization.
- **Backend Implementation Notes:**
  - **Tables:** `attendance_leave_requests` (PK: `id`, FK: `applicant_id -> auth_users.id`), `attendance_ledger` (PK: `id`, FK: `user_id -> auth_users.id`), `attendance_leave_ledger` (PK: `id`).
  - **Transaction & Concurrency:** Atomic transaction executing Section 13.5 state machine: updates request status to `Approved`, deducts leave balance in `attendance_leave_ledger`, and updates `attendance_ledger` across all leave dates to `status = 'On Leave'`.
  - **Indexing:** `CREATE INDEX idx_leave_decision_sync ON attendance_ledger(user_id, date);`

---

### 6.11 `GET /api/v1/attendance/leave-balance/:employeeOrStudentId`
- **Description:** Returns annual allocated, availed, and remaining leave quotas by leave head.
- **Authorized Roles:** `hr`, `principal`, `admin`, `superadmin`, Self-User.
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "userId": "USR-TCH-001",
      "academicYear": "2025-2026",
      "balances": [
        { "leaveType": "Casual Leave (CL)", "allocated": 12, "availed": 3, "balance": 9 },
        { "leaveType": "Medical Leave (ML)", "allocated": 10, "availed": 2, "balance": 8 },
        { "leaveType": "Earned Leave (EL)", "allocated": 15, "availed": 0, "balance": 15 }
      ]
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Caller unauthorized to view leave balances of specified employee or student.
  - `404 ERR_USER_NOT_FOUND`: Target user ID not found.
  - `500 ERR_INTERNAL_SERVER`: Error compiling leave entitlement summary.
- **Backend Implementation Notes:**
  - **Tables:** `attendance_leave_ledger` (PK: `id`, FK: `user_id -> auth_users.id`), `attendance_hr_policies` (PK: `id`).
  - **Transaction & Concurrency:** Read-only query joining policy entitlements with year-to-date utilized days per leave category (Casual, Sick, Earned, Duty).
  - **Indexing:** `CREATE UNIQUE INDEX idx_leave_balance_user_policy ON attendance_leave_ledger(user_id, leave_type, academic_year);`

---

## 7. Domain 4: Student Homework, Assignments & Gradebook

### 7.1 `GET /api/v1/homework/assignments`
- **Description:** Lists homework and project assignments filtered by class, subject, status, or teacher.
- **Authorized Roles:** `superadmin`, `director`, `jointdirector`, `principal`, `coordinator`, `teacher`, `student`, `parent`.
- **Query Parameters:** `grade`, `section`, `subjectId`, `teacherId`, `status` (`Draft`, `Published`, `Closed`), `page`, `pageSize`.
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "HW-2026-042",
        "title": "Quadratic Equations Problem Set 4.2",
        "description": "Complete textbook exercises 4.2 questions 1 through 15 in homework notebook.",
        "grade": "Grade 10",
        "section": "A",
        "subjectId": "MATH101",
        "subjectName": "Mathematics",
        "teacherId": "USR-TCH-001",
        "teacherName": "Meenakshi Sharma",
        "dueDate": "2026-03-18T17:00:00Z",
        "maxScore": 25,
        "status": "Published",
        "submissionCount": 34,
        "totalStudents": 38
      }
    ],
    "meta": { "total": 1, "page": 1, "pageSize": 20 },
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_INVALID_CLASS_FILTER`: Class or subject query parameter contains invalid format.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: User role unauthorized to view homework assignments for this grade.
  - `422 ERR_VALIDATION_FAILED`: Invalid pagination or status filter syntax.
  - `500 ERR_INTERNAL_SERVER`: Error retrieving homework assignment listings.
- **Backend Implementation Notes:**
  - **Tables:** `homework_assignments` (PK: `id`, FK: `teacher_id -> auth_users.id`, `class_id -> academic_classes.id`, `subject_id`).
  - **Transaction & Concurrency:** Read-only query at `READ COMMITTED` isolation. Filtered by `status = 'Published'` for student/parent roles unless teacher/coordinator.
  - **Indexing:** `CREATE INDEX idx_hw_assignments_class ON homework_assignments(class_id, subject_id, status);`, `CREATE INDEX idx_hw_assignments_due ON homework_assignments(due_date DESC);`

---

### 7.2 `POST /api/v1/homework/assignments`
- **Description:** Creates a new homework assignment with attachment uploads and scheduled due dates.
- **Authorized Roles:** `teacher`, `coordinator`, `principal`, `superadmin`.
- **Request Body Schema:**
  - `title` (string, required).
  - `description` (string, required).
  - `grade` (string, required).
  - `section` (string, required).
  - `subjectId` (string, required).
  - `dueDate` (string ISO-8601, required).
  - `maxScore` (number, required).
  - `attachments` (array of strings / file URLs, optional).
  ```json
  {
    "title": "Trigonometric Identities Worksheet",
    "description": "Solve all 10 proofs on the attached PDF sheet.",
    "grade": "Grade 10",
    "section": "A",
    "subjectId": "MATH101",
    "dueDate": "2026-03-20T17:00:00Z",
    "maxScore": 20,
    "attachments": ["https://cdn.schoolerp.internal/homework/trig_ws_10a.pdf"]
  }
  ```
- **Success Response (HTTP 201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "id": "HW-2026-043",
      "status": "Published",
      "createdAt": "2026-11-13T15:02:00.000Z"
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_PAST_DUE_DATE`: Assignment `dueDate` cannot be set in the past.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Teacher is not assigned to teach target class or subject.
  - `422 ERR_VALIDATION_FAILED`: Missing required attributes (`title`, `dueDate`, `maxMarks`, `applicableClass`).
  - `500 ERR_INTERNAL_SERVER`: Database failure persisting draft assignment.
- **Backend Implementation Notes:**
  - **Tables:** `homework_assignments` (PK: `id`, FK: `teacher_id -> auth_users.id`, `class_id -> academic_classes.id`).
  - **Transaction & Concurrency:** Insert executed within standard transaction; assigns initial status 'Draft'. Generates unique `id` with prefix `HW-YYYY-` sequence.
  - **Indexing:** `CREATE INDEX idx_hw_teacher_status ON homework_assignments(teacher_id, status);`

---

### 7.3 `GET /api/v1/homework/assignments/:id`
- **Description:** Retrieves detailed assignment specifications with submission breakdown.
- **Authorized Roles:** `teacher`, `coordinator`, `principal`, `student`, `parent`, `superadmin`.
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "HW-2026-042",
      "title": "Quadratic Equations Problem Set 4.2",
      "description": "Complete textbook exercises...",
      "attachments": ["https://cdn.schoolerp.internal/homework/quad_prob_set.pdf"],
      "maxScore": 25,
      "dueDate": "2026-03-18T17:00:00Z"
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Student not enrolled in class assigned to this homework.
  - `404 ERR_ASSIGNMENT_NOT_FOUND`: Assignment ID does not exist in repository.
  - `500 ERR_INTERNAL_SERVER`: Error loading assignment details.
- **Backend Implementation Notes:**
  - **Tables:** `homework_assignments` (PK: `id`, FK: `teacher_id -> auth_users.id`), `homework_attachments` (PK: `id`, FK: `assignment_id -> homework_assignments.id`).
  - **Transaction & Concurrency:** Read-only query joining assignment header with attachment assets and submission counts.
  - **Indexing:** `CREATE INDEX idx_hw_attachments_assign_id ON homework_attachments(assignment_id);`

---

### 7.4 `GET /api/v1/homework/submissions`
- **Description:** Lists student submissions for a given assignment with grading statuses and marks.
- **Authorized Roles:** `teacher`, `coordinator`, `principal`, `superadmin`.
- **Query Parameters:** `assignmentId` (required), `status` (`Submitted`, `Graded`, `Late`), `page`, `pageSize`.
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "SUB-2026-001-42",
        "assignmentId": "HW-2026-042",
        "studentId": "STU-2026-001",
        "studentName": "Aarav Sharma",
        "submittedAt": "2026-03-17T14:20:00Z",
        "submissionFileUrl": "/uploads/submissions/aarav_quad_hw.pdf",
        "score": 24,
        "maxScore": 25,
        "feedback": "Flawless working on quadratic formula derivations.",
        "status": "Graded"
      }
    ],
    "meta": { "total": 1, "page": 1, "pageSize": 50 },
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_MISSING_ASSIGNMENT_ID`: Query parameter `assignmentId` is required.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Teacher unauthorized for this assignment's section.
  - `404 ERR_ASSIGNMENT_NOT_FOUND`: Specified assignment not found.
  - `500 ERR_INTERNAL_SERVER`: Error fetching student homework submissions.
- **Backend Implementation Notes:**
  - **Tables:** `homework_submissions` (PK: `id`, FK: `assignment_id -> homework_assignments.id`, `student_id -> auth_users.id`).
  - **Transaction & Concurrency:** Read-only query fetching all student submissions for an assignment with submission status (`Submitted`, `Late`, `Graded`, `Pending`).
  - **Indexing:** `CREATE INDEX idx_hw_sub_assign ON homework_submissions(assignment_id, status);`, `CREATE INDEX idx_hw_sub_student ON homework_submissions(student_id);`

---

### 7.5 `POST /api/v1/homework/submissions`
- **Description:** Submits student homework response with optional PDF/image work attachments.
- **Authorized Roles:** `student`.
- **Request Body Schema:**
  - `assignmentId` (string, required).
  - `studentId` (string, required).
  - `notes` (string, optional).
  - `fileUrl` (string, required).
  ```json
  {
    "assignmentId": "HW-2026-042",
    "studentId": "STU-2026-001",
    "notes": "Attached scanned solution notebook.",
    "fileUrl": "https://cdn.schoolerp.internal/uploads/submissions/aarav_hw42.pdf"
  }
  ```
- **Success Response (HTTP 201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "id": "SUB-2026-001-42",
      "submittedAt": "2026-11-13T15:05:00.000Z",
      "status": "Submitted"
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_PAST_DUE_SUBMISSION`: Assignment due date has elapsed and late submissions are disallowed.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Caller is not a student enrolled in the target assignment class.
  - `404 ERR_ASSIGNMENT_NOT_FOUND`: Target homework assignment does not exist.
  - `409 ERR_ALREADY_GRADED`: Submission cannot be resubmitted after teacher has already assigned a grade.
  - `422 ERR_MISSING_ATTACHMENTS`: Submission must contain text response or uploaded document URL.
  - `500 ERR_INTERNAL_SERVER`: Database failure persisting student submission.
- **Backend Implementation Notes:**
  - **Tables:** `homework_submissions` (PK: `id`, FK: `assignment_id -> homework_assignments.id`, `student_id -> auth_users.id`).
  - **Transaction & Concurrency:** Upsert with row-level locking (`SELECT ... FOR UPDATE`). Compares `submitted_at` against `homework_assignments.due_date` to set `status = 'Submitted'` or `'Late'`.
  - **Indexing:** `CREATE UNIQUE INDEX idx_hw_sub_assign_student ON homework_submissions(assignment_id, student_id);`

---

### 7.6 `POST /api/v1/homework/submissions/:id/grade`
- **Description:** Grades a student homework submission, assigns numerical score, and provides qualitative feedback.
- **Authorized Roles:** `teacher`, `coordinator`, `principal`, `superadmin`.
- **Request Body Schema:**
  - `score` (number, required): Cannot exceed assignment `maxScore`.
  - `feedback` (string, optional).
  ```json
  {
    "score": 24,
    "feedback": "Sterling problem solving; minor calculation lapse in question 8."
  }
  ```
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "SUB-2026-001-42",
      "score": 24,
      "status": "Graded",
      "gradedBy": "USR-TCH-001",
      "gradedAt": "2026-11-13T15:06:00.000Z"
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_SCORE_EXCEEDS_MAX`: Awarded score exceeds assignment maximum possible marks.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Caller is not the designated grading teacher for this subject.
  - `404 ERR_SUBMISSION_NOT_FOUND`: Target submission ID not found.
  - `422 ERR_VALIDATION_FAILED`: Negative score or invalid grading remarks format.
  - `500 ERR_INTERNAL_SERVER`: Error recording submission grade and student notification.
- **Backend Implementation Notes:**
  - **Tables:** `homework_submissions` (PK: `id`, FK: `assignment_id -> homework_assignments.id`), `system_notifications` (PK: `id`).
  - **Transaction & Concurrency:** Atomic transaction updating submission score, status to 'Graded', and inserting notification for student and parent.
  - **Indexing:** `CREATE INDEX idx_hw_submissions_grading ON homework_submissions(id, status);`

---

### 7.7 `GET /api/v1/homework/submissions/student/:studentId`
- **Description:** Returns all homework deliverables assigned to and submitted by a specific student with grading status.
- **Authorized Roles:** `teacher`, `coordinator`, `principal`, `student`, `parent`, `superadmin`.
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "assignmentId": "HW-2026-042",
        "title": "Quadratic Equations Problem Set 4.2",
        "subjectName": "Mathematics",
        "dueDate": "2026-03-18T17:00:00Z",
        "submissionStatus": "Graded",
        "score": 24,
        "maxScore": 25
      }
    ],
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Student or parent unauthorized to inspect submissions belonging to another student.
  - `404 ERR_STUDENT_NOT_FOUND`: Target student ID does not exist.
  - `500 ERR_INTERNAL_SERVER`: Error compiling student homework portfolio.
- **Backend Implementation Notes:**
  - **Tables:** `homework_submissions` (PK: `id`, FK: `student_id -> auth_users.id`), `homework_assignments` (PK: `id`).
  - **Transaction & Concurrency:** Read-only join query aggregating all homework assignments and corresponding submission records for specified student.
  - **Indexing:** `CREATE INDEX idx_hw_sub_student_date ON homework_submissions(student_id, submitted_at DESC);`

---

### 7.8 `POST /api/v1/homework/assignments/:id/publish`
- **Description:** Changes assignment status from Draft to Published, dispatching instant push notifications to students and parents.
- **Authorized Roles:** `teacher`, `coordinator`.
- **Request Body:**
  - `notifyImmediately` (boolean, optional, default: `true`): Whether to broadcast push notifications immediately to enrolled students and parents.
  ```json
  {
    "notifyImmediately": true
  }
  ```
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "HW-2026-042",
      "status": "Published",
      "publishedAt": "2026-11-13T15:07:00.000Z"
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_INVALID_STATUS_TRANSITION`: Assignment is already Published or Archived.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Only author teacher or coordinator can publish this assignment.
  - `404 ERR_ASSIGNMENT_NOT_FOUND`: Assignment ID does not exist.
  - `500 ERR_INTERNAL_SERVER`: Notification dispatch or database update failure.
- **Backend Implementation Notes:**
  - **Tables:** `homework_assignments` (PK: `id`), `system_notifications` (PK: `id`, FK: `user_id -> auth_users.id`).
  - **Transaction & Concurrency:** Atomic transaction verifying `status = 'Draft'`, transitioning `status = 'Published'`, setting `published_at = NOW()`, and queuing asynchronous push notifications.
  - **Indexing:** `CREATE INDEX idx_hw_assignments_publish ON homework_assignments(id, status);`

---

### 7.9 `GET /api/v1/homework/analytics`
- **Description:** Class-wide and subject-wide homework completion rate analytics for coordinator dashboards.
- **Authorized Roles:** `coordinator`, `principal`, `director`, `jointdirector`, `jointdirectorassistant`, `qualityauditor`.
- **Query Parameters:** `academicYear`, `grade`, `subjectId`.
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "totalAssignmentsGiven": 48,
      "averageCompletionRate": 92.4,
      "onTimeSubmissionRate": 88.1,
      "pendingGradingCount": 4
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_ACADEMIC_YEAR_REQUIRED`: Query parameter `academicYear` is required.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Caller lacks administrative academic oversight privilege.
  - `422 ERR_VALIDATION_FAILED`: Invalid grade or section filter syntax.
  - `500 ERR_INTERNAL_SERVER`: Analytics aggregation calculation error.
- **Backend Implementation Notes:**
  - **Tables:** `homework_assignments` (PK: `id`), `homework_submissions` (PK: `id`).
  - **Transaction & Concurrency:** Read-only aggregation query grouping by class and subject to compute completion percentages and on-time submission ratios.
  - **Indexing:** `CREATE INDEX idx_hw_grade_subj ON homework_assignments(grade, section, subject_id);`

---

## 8. Domain 5: Finance, Fees, Invoices & Payment Gateway Integration

### 8.1 `GET /api/v1/fees/heads`
- **Description:** Retrieves the standard catalog of fee heads (Tuition, Boarding, Transport, Laboratory, Annual Development, Admission) and statutory tax slabs.
- **Authorized Roles:** `superadmin`, `director`, `jointdirector`, `accounthead`, `admin`.
- **Query Parameters:** `category`, `isActive`, `academicYear`.
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "FH-TUIT",
        "code": "TUITION_FEE",
        "name": "Annual Academic Tuition Fee",
        "category": "Academic",
        "defaultAmount": 95000,
        "isTaxable": false,
        "taxRatePercentage": 0,
        "frequency": "Term-wise",
        "refundable": false
      },
      {
        "id": "FH-HSTL",
        "code": "HOSTEL_BOARDING",
        "name": "Hostel Boarding & Mess Facility",
        "category": "Boarding",
        "defaultAmount": 75000,
        "isTaxable": false,
        "taxRatePercentage": 0,
        "frequency": "Annual",
        "refundable": true
      }
    ],
    "meta": { "total": 6, "page": 1, "pageSize": 20 },
    "error": null
  }
  ```
- **Error Codes:**
  - `401 ERR_UNAUTHORIZED`: Authentication credentials missing or invalid.
  - `403 ERR_FORBIDDEN`: User role lacks permission to view master fee heads catalog.
  - `500 ERR_INTERNAL_SERVER`: Database connection timeout retrieving fee heads.
- **Backend Implementation Notes:**
  - **Tables:** `fee_heads` (PK: `id`, FK: `gl_account_id`).
  - **Transaction & Concurrency:** Read-only query fetching active fee schedule heads with 1-hour Redis cache.
  - **Indexing:** `CREATE INDEX idx_fee_heads_active ON fee_heads(is_active, code);`

---

### 8.2 `POST /api/v1/fees/heads`
- **Description:** Configures a new institutionally sanctioned fee head with general ledger accounting code.
- **Authorized Roles:** `superadmin`, `accounthead`.
- **Request Body Schema:**
  - `code` (string, required): Unique GL code.
  - `name` (string, required).
  - `defaultAmount` (number, required).
  - `category` (string, required): `"Academic" | "Boarding" | "Transport" | "Activity" | "Statutory"`.
  ```json
  {
    "code": "ROBOTICS_LAB",
    "name": "STEM & Robotics Innovation Lab Fee",
    "defaultAmount": 8500,
    "category": "Activity",
    "isTaxable": true,
    "taxRatePercentage": 18
  }
  ```
- **Success Response (HTTP 201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "id": "FH-ROBOT",
      "code": "ROBOTICS_LAB",
      "name": "STEM & Robotics Innovation Lab Fee",
      "createdAt": "2026-11-13T15:10:00.000Z"
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_INVALID_AMOUNT`: Amount must be a positive numeric value.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Caller lacks chief financial authority to create fee structures.
  - `409 ERR_DUPLICATE_FEE_CODE`: Fee code already exists for target academic year.
  - `422 ERR_VALIDATION_FAILED`: Missing mandatory fee code, name, or applicable grades.
  - `500 ERR_INTERNAL_SERVER`: Transaction failure inserting new fee head.
- **Backend Implementation Notes:**
  - **Tables:** `fee_heads` (PK: `id`, FK: `gl_account_id`).
  - **Transaction & Concurrency:** Atomic transaction ensuring unique fee code per academic year; writes audit log in `system_audit_logs`.
  - **Indexing:** `CREATE UNIQUE INDEX idx_fee_heads_code_year ON fee_heads(code, academic_year);`

---

### 8.3 `GET /api/v1/fees/invoices`
- **Description:** Retrieves student fee invoices with partial payment breakdown, balance dues, and overdue indicators.
- **Authorized Roles:** `superadmin`, `director`, `jointdirector`, `jointdirectoraudit`, `accounthead`, `admin`, `parent`, `student`.
- **Query Parameters:** `status` (`Pending`, `Partially Paid`, `Paid`, `Overdue`), `studentId`, `academicYear`, `grade`, `dueDateBefore`, `page`, `pageSize`.
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "INV-2025-001",
        "invoiceNumber": "INV/2025/1042",
        "studentId": "STU-2026-001",
        "studentName": "Aarav Sharma",
        "grade": "Grade 10",
        "section": "A",
        "academicYear": "2025-2026",
        "issueDate": "2025-06-01",
        "dueDate": "2025-07-15",
        "totalAmount": 125000,
        "concessionAmount": 10000,
        "paidAmount": 65000,
        "balanceAmount": 50000,
        "status": "Partially Paid",
        "receipts": ["REC-2025-5012"]
      }
    ],
    "meta": { "total": 1, "page": 1, "pageSize": 20 },
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_INVALID_STATUS`: Status filter must be one of `Pending`, `Partial`, `Paid`, `Overdue`, `Cancelled`.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Student or parent unauthorized to query invoices belonging to other accounts.
  - `422 ERR_VALIDATION_FAILED`: Invalid pagination or query filter parameters.
  - `500 ERR_INTERNAL_SERVER`: Error querying fee invoices.
- **Backend Implementation Notes:**
  - **Tables:** `fee_invoices` (PK: `id`, FK: `student_id -> auth_users.id`, `campus_id`).
  - **Transaction & Concurrency:** Read-only query at `READ COMMITTED`. For parent/student callers, `student_id` is automatically forced in the WHERE clause.
  - **Indexing:** `CREATE INDEX idx_fee_invoices_student ON fee_invoices(student_id, status);`, `CREATE INDEX idx_fee_invoices_due ON fee_invoices(due_date, status);`

---

### 8.4 `POST /api/v1/fees/invoices`
- **Description:** Generates a new fee invoice for an enrolled student or batch of students.
- **Authorized Roles:** `superadmin`, `accounthead`, `admin`.
- **Request Body Schema:**
  - `studentId` (string, required).
  - `studentName` (string, optional).
  - `grade` (string, required).
  - `section` (string, required).
  - `academicYear` (string, required).
  - `dueDate` (string YYYY-MM-DD, required).
  - `items` (array of objects with `feeHeadId`, `name`, `amount`, required).
  - `totalAmount` (number, required).
  ```json
  {
    "studentId": "STU-2026-001",
    "studentName": "Aarav Sharma",
    "grade": "Grade 10",
    "section": "A",
    "academicYear": "2025-2026",
    "dueDate": "2026-04-15",
    "items": [
      { "feeHeadId": "FH-TUIT", "name": "Term 2 Tuition Fee", "amount": 47500 },
      { "feeHeadId": "FH-LAB", "name": "Science Lab Consumables", "amount": 5000 }
    ],
    "totalAmount": 52500
  }
  ```
- **Success Response (HTTP 201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "id": "INV-2026-902",
      "invoiceNumber": "INV/2026/4102",
      "totalAmount": 52500,
      "balanceAmount": 52500,
      "status": "Pending",
      "createdAt": "2026-11-13T15:12:00.000Z"
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_INVALID_INVOICE_TOTAL`: Sum of line items does not equal total amount.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Caller lacks permission to issue financial billing invoices.
  - `404 ERR_STUDENT_NOT_FOUND`: Target student ID does not exist in student registry.
  - `409 ERR_INVOICE_ALREADY_EXISTS`: An invoice with this invoice number already exists.
  - `422 ERR_VALIDATION_FAILED`: Missing line items or due date is prior to issue date.
  - `500 ERR_INTERNAL_SERVER`: Database failure generating fee invoice and line items.
- **Backend Implementation Notes:**
  - **Tables:** `fee_invoices` (PK: `id`, FK: `student_id -> auth_users.id`), `fee_invoice_items` (PK: `id`, FK: `invoice_id -> fee_invoices.id`, `fee_head_id -> fee_heads.id`).
  - **Transaction & Concurrency:** Atomic multi-table transaction creating invoice master record and child line items with sequence generation for invoice numbers (`INV-YYYY-XXXX`).
  - **Indexing:** `CREATE UNIQUE INDEX idx_invoices_number_uniq ON fee_invoices(invoice_number);`

---

### 8.5 `GET /api/v1/fees/invoices/:id`
- **Description:** Retrieves comprehensive invoice details including line item fee heads, discount vouchers, payment receipts, and settlement history.
- **Authorized Roles:** `superadmin`, `director`, `jointdirector`, `jointdirectoraudit`, `accounthead`, `admin`, `parent`, `student`.
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "INV-2025-001",
      "invoiceNumber": "INV/2025/1042",
      "studentId": "STU-2026-001",
      "items": [
        { "feeHeadId": "FH-TUIT", "name": "Annual Tuition Fee", "amount": 95000 },
        { "feeHeadId": "FH-TRANS", "name": "Bus Transport Fee Route 04", "amount": 30000 }
      ],
      "totalAmount": 125000,
      "concessionAmount": 10000,
      "concessionDetails": {
        "type": "Merit Scholarship",
        "approvedBy": "Principal",
        "voucherNo": "CONC-2025-081"
      },
      "paidAmount": 65000,
      "balanceAmount": 50000,
      "status": "Partially Paid",
      "receipts": [
        {
          "receiptNumber": "REC/2025/5012",
          "paymentDate": "2025-06-14",
          "amount": 65000,
          "paymentMethod": "Razorpay NetBanking",
          "transactionRef": "pay_Oih87123jhd"
        }
      ]
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Caller not authorized to view target invoice.
  - `404 ERR_INVOICE_NOT_FOUND`: Fee invoice ID does not exist.
  - `500 ERR_INTERNAL_SERVER`: Error retrieving invoice details.
- **Backend Implementation Notes:**
  - **Tables:** `fee_invoices` (PK: `id`), `fee_invoice_items` (PK: `id`), `fee_payments` (PK: `id`).
  - **Transaction & Concurrency:** Read-only join query pulling invoice details, item breakdown, and historical payment transactions.
  - **Indexing:** `CREATE INDEX idx_fee_invoice_items_inv ON fee_invoice_items(invoice_id);`

---

### 8.6 `GET /api/v1/fees/ledger/:studentId`
- **Description:** Retrieves real-time cumulative student financial ledger containing total billed, total paid, active concession credits, and outstanding net balance.
- **Authorized Roles:** `accounthead`, `jointdirectoraudit`, `principal`, `parent`, `student`, `superadmin`.
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "studentId": "STU-2026-001",
      "totalInvoiced": 125000,
      "totalConcessions": 10000,
      "totalPaid": 65000,
      "totalBalance": 50000,
      "invoices": [
        { "id": "INV-2025-001", "invoiceNumber": "INV/2025/1042", "balanceAmount": 50000, "status": "Partially Paid" }
      ]
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Caller unauthorized to access financial ledger of target student.
  - `404 ERR_STUDENT_NOT_FOUND`: Specified student ID not found.
  - `500 ERR_INTERNAL_SERVER`: Database query error compiling financial running ledger.
- **Backend Implementation Notes:**
  - **Tables:** `fee_invoices` (PK: `id`, FK: `student_id -> auth_users.id`), `fee_payments` (PK: `id`), `fee_concessions` (PK: `id`), `fee_refunds` (PK: `id`).
  - **Transaction & Concurrency:** Aggregation query compiling chronological debits (invoices), credits (payments, concessions), and adjustments (refunds) to calculate real-time net balance.
  - **Indexing:** `CREATE INDEX idx_payments_student_ledger ON fee_payments(student_id, payment_date);`

---

### 8.7 `GET /api/v1/fees/payments`
- **Description:** Lists all verified payment transactions, payment modes (Cash, Cheque, Demand Draft, UPI, Net Banking, Razorpay Gateway), and cashier settlements.
- **Authorized Roles:** `superadmin`, `director`, `jointdirector`, `jointdirectoraudit`, `accounthead`, `admin`.
- **Query Parameters:** `studentId`, `invoiceId`, `fromDate`, `toDate`, `paymentMethod`, `page`, `pageSize`.
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "REC-2025-5012",
        "receiptNumber": "REC/2025/5012",
        "invoiceId": "INV-2025-001",
        "studentId": "STU-2026-001",
        "paymentDate": "2025-06-14",
        "amount": 65000,
        "paymentMethod": "Razorpay UPI",
        "transactionRef": "pay_Oih87123jhd",
        "collectedBy": "Online Payment Gateway",
        "status": "Cleared"
      }
    ],
    "meta": { "total": 1, "page": 1, "pageSize": 20 },
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_INVALID_DATE_RANGE`: Query `startDate` must be prior to `endDate`.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Caller lacks financial audit and payment reconciliation privileges.
  - `422 ERR_VALIDATION_FAILED`: Invalid payment method or status filter syntax.
  - `500 ERR_INTERNAL_SERVER`: Failed to retrieve payment ledger records.
- **Backend Implementation Notes:**
  - **Tables:** `fee_payments` (PK: `id`, FK: `invoice_id -> fee_invoices.id`, `student_id -> auth_users.id`).
  - **Transaction & Concurrency:** Read-only query at `READ COMMITTED` with cursor pagination for high-volume fee transaction histories.
  - **Indexing:** `CREATE INDEX idx_payments_date_method ON fee_payments(payment_date, payment_method, status);`

---

### 8.8 `POST /api/v1/fees/payments`
- **Description:** Records an offline fee collection or logs an authorized online settlement. Automatically recalculates invoice balance and transitions status to 'Partially Paid' or 'Paid'.
- **Authorized Roles:** `parent`, `accounthead`, `admin`, `superadmin`.
- **Request Body Schema:**
  - `invoiceId` (string, required).
  - `studentId` (string, required).
  - `amount` (number, required): Cannot exceed invoice balance.
  - `paymentMethod` (string, required): `"Cash" | "Cheque" | "Demand Draft" | "NEFT/RTGS" | "UPI" | "Online Gateway"`.
  - `transactionRef` (string, required for non-cash).
  - `collectedBy` (string, optional).
  ```json
  {
    "invoiceId": "INV-2025-001",
    "studentId": "STU-2026-001",
    "amount": 50000,
    "paymentMethod": "NEFT/RTGS",
    "transactionRef": "SBIN00291039821",
    "collectedBy": "S. Sundari (Accounts Assistant)"
  }
  ```
- **Success Response (HTTP 201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "receipt": {
        "id": "REC-2026-8910",
        "receiptNumber": "REC/2026/8910",
        "amount": 50000,
        "status": "Cleared",
        "createdAt": "2026-11-13T15:15:00.000Z"
      },
      "updatedInvoice": {
        "id": "INV-2025-001",
        "paidAmount": 115000,
        "balanceAmount": 0,
        "status": "Paid"
      }
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_EXCESS_PAYMENT`: Payment amount exceeds invoice outstanding unpaid balance.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Caller not authorized to submit payment for target invoice.
  - `404 ERR_INVOICE_NOT_FOUND`: Invoice ID does not exist.
  - `409 ERR_DUPLICATE_PAYMENT`: A transaction with this gateway reference ID has already been recorded.
  - `422 ERR_VALIDATION_FAILED`: Amount must be greater than zero; payment method required.
  - `500 ERR_INTERNAL_SERVER`: Error recording payment and updating invoice balance.
- **Backend Implementation Notes:**
  - **Tables:** `fee_payments` (PK: `id`, FK: `invoice_id -> fee_invoices.id`), `fee_invoices` (PK: `id`), `finance_general_ledger` (PK: `id`).
  - **Transaction & Concurrency:** Atomic transaction with row-level lock (`SELECT ... FOR UPDATE` on `fee_invoices`). Deducts balance, updates invoice status (`Partial` or `Paid`), and inserts general ledger credit entry.
  - **Indexing:** `CREATE UNIQUE INDEX idx_payment_gateway_ref ON fee_payments(transaction_reference);`

---

### 8.9 `POST /api/v1/fees/concessions`
- **Description:** Grants institutional fee concession or scholarship discount on an active invoice, decreasing balance dues.
- **Authorized Roles:** `accounthead`, `jointdirector`, `director`, `superadmin`.
- **Request Body Schema:**
  - `invoiceId` (string, required).
  - `concessionAmount` (number, required).
  - `concessionType` (string, required): `"Merit Scholarship" | "Staff Child Concession" | "Sibling Discount" | "Financial Hardship"`.
  - `approvedBy` (string, required).
  - `remarks` (string, required).
  ```json
  {
    "invoiceId": "INV-2026-902",
    "concessionAmount": 7500,
    "concessionType": "Sibling Discount",
    "approvedBy": "Dr. K. S. Sundaram (Joint Director)",
    "remarks": "Second sibling enrolled in Grade 6 (Student ID: STU-2026-088)."
  }
  ```
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "invoiceId": "INV-2026-902",
      "concessionAmount": 7500,
      "newBalanceAmount": 45000,
      "updatedAt": "2026-11-13T15:16:00.000Z"
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_CONCESSION_EXCEEDS_BALANCE`: Concession amount cannot exceed invoice outstanding balance.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Concession amount exceeds role sanction ceiling (JD approval required for > 15%).
  - `404 ERR_INVOICE_NOT_FOUND`: Specified invoice not found.
  - `422 ERR_VALIDATION_FAILED`: Concession category, amount, and approval remarks required.
  - `500 ERR_INTERNAL_SERVER`: Error applying fee concession voucher.
- **Backend Implementation Notes:**
  - **Tables:** `fee_concessions` (PK: `id`, FK: `invoice_id -> fee_invoices.id`, `student_id -> auth_users.id`), `fee_invoices` (PK: `id`).
  - **Transaction & Concurrency:** Executes in atomic `READ COMMITTED` transaction; recalculates `fee_invoices.concession_amount` and adjusts `net_amount_due`.
  - **Indexing:** `CREATE INDEX idx_concessions_invoice ON fee_concessions(invoice_id);`

---

### 8.10 `GET /api/v1/fees/refunds`
- **Description:** Lists student fee refund applications across the 4-stage sanction workflow (`Requested` -> `Pending Accounts Verification` -> `Pending JD Approval` -> `Approved` -> `Disbursed`).
- **Authorized Roles:** `superadmin`, `director`, `jointdirector`, `jointdirectoraudit`, `accounthead`, `admin`.
- **Query Parameters:** `status`, `studentId`, `page`, `pageSize`.
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "REF-2026-004",
        "refundVoucherNumber": "REF-VOUCH-2026-44",
        "studentId": "STU-2026-012",
        "studentName": "K. Rohith",
        "refundCategory": "Hostel Caution Deposit Refund",
        "refundAmount": 15000,
        "reason": "Student vacated hostel post Grade 12 completion.",
        "status": "Pending JD Approval",
        "beneficiaryBankDetails": {
          "accountHolder": "K. Srinivasan",
          "accountNumber": "918029301928",
          "ifscCode": "HDFC0001829",
          "bankName": "HDFC Bank"
        }
      }
    ],
    "meta": { "total": 1, "page": 1, "pageSize": 20 },
    "error": null
  }
  ```
- **Error Codes:**
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: User role lacks permission to review financial refund queue.
  - `422 ERR_VALIDATION_FAILED`: Invalid status filter syntax.
  - `500 ERR_INTERNAL_SERVER`: Database query timeout retrieving fee refund claims.
- **Backend Implementation Notes:**
  - **Tables:** `fee_refunds` (PK: `id`, FK: `student_id -> auth_users.id`, `invoice_id -> fee_invoices.id`).
  - **Transaction & Concurrency:** Read-only query querying multi-stage refund workflow queue (Section 13.2).
  - **Indexing:** `CREATE INDEX idx_fee_refunds_status ON fee_refunds(status, created_at DESC);`

---

### 8.11 `POST /api/v1/fees/refunds/request`
- **Description:** Submits a fee refund claim initiated by parents or front office due to student withdrawal, overpayment, or caution deposit return.
- **Authorized Roles:** `parent`, `prm`, `accounthead`, `admin`.
- **Request Body Schema:**
  - `studentId` (string, required).
  - `invoiceId` (string, optional).
  - `paymentReceiptId` (string, optional).
  - `refundCategory` (string, required): E.g., `"Caution Deposit" | "Tuition Concession Refund" | "Overpayment"`.
  - `refundAmount` (number, required).
  - `reason` (string, required).
  - `beneficiaryBankDetails` (object with `accountHolder`, `accountNumber`, `ifscCode`, `bankName`, required).
  ```json
  {
    "studentId": "STU-2026-012",
    "refundCategory": "Caution Deposit",
    "refundAmount": 15000,
    "reason": "Completed senior secondary school and vacated campus hostel.",
    "beneficiaryBankDetails": {
      "accountHolder": "K. Srinivasan",
      "accountNumber": "918029301928",
      "ifscCode": "HDFC0001829",
      "bankName": "HDFC Bank"
    }
  }
  ```
- **Success Response (HTTP 201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "id": "REF-2026-005",
      "status": "Pending Accounts Verification",
      "refundVoucherNumber": "REF-VOUCH-2026-52",
      "createdAt": "2026-11-13T15:18:00.000Z"
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_REFUND_EXCEEDS_PAID`: Refund request amount exceeds total paid amount on target invoice.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Parent unauthorized for student, or caller lacks refund initiation rights.
  - `404 ERR_INVOICE_NOT_FOUND`: Target invoice not found.
  - `409 ERR_PENDING_REFUND_EXISTS`: An active pending refund request already exists for this invoice.
  - `422 ERR_VALIDATION_FAILED`: Mandatory refund reason, bank account details, or amount missing.
  - `500 ERR_INTERNAL_SERVER`: Error registering refund application.
- **Backend Implementation Notes:**
  - **Tables:** `fee_refunds` (PK: `id`, FK: `student_id -> auth_users.id`, `invoice_id -> fee_invoices.id`).
  - **Transaction & Concurrency:** Atomic transaction initiating Stage 1 of Section 13.2 workflow: inserts record with `status = 'Requested'` and generates `refund_application_number`.
  - **Indexing:** `CREATE INDEX idx_refunds_active_check ON fee_refunds(invoice_id, status) WHERE status NOT IN ('Rejected', 'Disbursed');`

---

### 8.12 `POST /api/v1/fees/refunds/:id/approve`
- **Description:** Transitions refund status through sequential financial sanction stages. Enforces role-based tier signing (`Pending Accounts Verification` -> `Pending JD Approval` -> `Approved` -> `Disbursed`).
- **Authorized Roles:** `accounthead`, `jointdirector`, `director`, `superadmin`.
- **Request Body Schema:**
  - `nextStatus` (string, required): `"Pending JD Approval" | "Approved" | "Disbursed" | "Rejected"`.
  - `approverRole` (string, required).
  - `approverName` (string, required).
  - `remarks` (string, optional).
  - `disbursementMode` (string, conditional for Disbursed): `"NEFT/RTGS" | "Account Payee Cheque"`.
  - `transactionRef` (string, conditional for Disbursed).
  ```json
  {
    "nextStatus": "Approved",
    "approverRole": "Joint Director",
    "approverName": "Dr. K. S. Sundaram",
    "remarks": "Verified caution deposit deposit receipt; sanctioned for online NEFT remittance."
  }
  ```
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "REF-2026-004",
      "status": "Approved",
      "updatedAt": "2026-11-13T15:19:00.000Z"
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_INVALID_STATUS_TRANSITION`: Attempting out-of-order transition (violates Section 13.2 state invariant).
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Caller role unauthorized for current workflow stage (e.g. Disbursed requires Account Head, Stage 3 requires JD).
  - `404 ERR_REFUND_NOT_FOUND`: Refund ID does not exist.
  - `409 ERR_REFUND_TERMINAL`: Refund is already marked Disbursed or Rejected.
  - `422 ERR_DISBURSEMENT_DETAILS_MISSING`: Remittance transaction reference or cheque number required when marking Disbursed.
  - `500 ERR_INTERNAL_SERVER`: Error updating refund status and finance ledger vouchers.
- **Backend Implementation Notes:**
  - **Tables:** `fee_refunds` (PK: `id`), `finance_general_ledger` (PK: `id`).
  - **Transaction & Concurrency:** Atomic transaction with row-level lock (`SELECT ... FOR UPDATE`). Enforces Section 13.2 state transitions; on disbursement, atomically creates general ledger debit voucher.
  - **Indexing:** `CREATE INDEX idx_fee_refunds_workflow ON fee_refunds(id, status);`

---

### 8.13 `POST /api/v1/fees/payments/webhook`
- **Description:** Server-to-server webhook endpoint receiving cryptographically signed payment events from Razorpay / Stripe gateway providers.
- **Authorized Roles:** External Payment Gateway Webhook Engine (Razorpay / PayU / Stripe).
- **Request Body Schema:** Raw gateway webhook JSON payload.
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "eventProcessed": "payment.captured",
      "invoiceUpdated": "INV-2025-001",
      "receiptGenerated": "REC-2026-9041"
    },
    "meta": null,
    "error": null
  }
  ```
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "eventProcessed": "payment.captured",
      "invoiceUpdated": "INV-2025-001",
      "receiptGenerated": "REC-2026-9041"
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_INVALID_SIGNATURE`: Cryptographic HMAC mismatch on webhook header (`X-Razorpay-Signature`).
  - `400 ERR_MALFORMED_PAYLOAD`: Missing payment ID, order ID, or amount in webhook event payload.
  - `404 ERR_ORDER_NOT_FOUND`: Gateway order ID does not match any pending invoice checkout in ERP.
  - `500 ERR_INTERNAL_SERVER`: Webhook ingestion processing failure.
- **Backend Implementation Notes:**
  - **Tables:** `fee_payments` (PK: `id`), `fee_invoices` (PK: `id`), `payment_webhook_logs` (PK: `id`).
  - **Transaction & Concurrency:** Verifies cryptographic signature before transaction initiation; implements idempotent handling using `gateway_payment_id` as unique lock to prevent double payment capture.
  - **Indexing:** `CREATE UNIQUE INDEX idx_webhook_payment_id ON fee_payments(gateway_payment_id);`

---

## 9. Domain 6: Transport, Routes, Vehicles & Live Telemetry

### 9.1 `GET /api/v1/transport/vehicles`
- **Description:** Lists all campus fleet buses, vans, passenger capacity, fitness certificates (FC), insurance, and GPS tracker hardware status.
- **Authorized Roles:** `superadmin`, `director`, `jointdirector`, `transportmanager`, `admin`, `parent`.
- **Query Parameters:** `status` (`Active`, `Maintenance`, `Decommissioned`), `fitnessExpiringDays`, `page`, `pageSize`.
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "VEH-BUS-04",
        "vehicleNumber": "TN 38 BX 4412",
        "vehicleType": "54-Seater Heavy Bus",
        "seatingCapacity": 54,
        "assignedRouteId": "RT-04",
        "driverName": "M. Parthiban",
        "conductorName": "S. Murugan",
        "fuelType": "Diesel",
        "fcExpiryDate": "2026-08-30",
        "insuranceExpiryDate": "2026-10-15",
        "gpsDeviceId": "GPS-TEL-04",
        "status": "Active"
      }
    ],
    "meta": { "total": 1, "page": 1, "pageSize": 20 },
    "error": null
  }
  ```
- **Error Codes:**
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Role unauthorized to inspect fleet vehicle registry.
  - `422 ERR_VALIDATION_FAILED`: Invalid status filter syntax (`Active`, `Maintenance`, `Decommissioned`).
  - `500 ERR_INTERNAL_SERVER`: Error querying transport vehicle listings.
- **Backend Implementation Notes:**
  - **Tables:** `transport_vehicles` (PK: `id`, FK: `driver_id -> auth_users.id`, `assigned_route_id`).
  - **Transaction & Concurrency:** Read-only query fetching vehicle registry, capacity, fitness certificates, and live telemetry coordinates.
  - **Indexing:** `CREATE INDEX idx_transport_vehicles_status ON transport_vehicles(status, campus_id);`

---

### 9.2 `POST /api/v1/transport/vehicles`
- **Description:** Enrolls a new transport vehicle with statutory registration and telematics configuration.
- **Authorized Roles:** `superadmin`, `transportmanager`.
- **Request Body Schema:**
  - `vehicleNumber` (string, required).
  - `vehicleType` (string, required).
  - `seatingCapacity` (number, required).
  - `fcExpiryDate` (string YYYY-MM-DD, required).
  - `insuranceExpiryDate` (string YYYY-MM-DD, required).
  - `gpsDeviceId` (string, required).
  ```json
  {
    "vehicleNumber": "TN 38 CY 8820",
    "vehicleType": "32-Seater Mini Bus",
    "seatingCapacity": 32,
    "fcExpiryDate": "2027-01-15",
    "insuranceExpiryDate": "2027-02-28",
    "gpsDeviceId": "GPS-TEL-12"
  }
  ```
- **Success Response (HTTP 201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "id": "VEH-BUS-12",
      "vehicleNumber": "TN 38 CY 8820",
      "status": "Active",
      "createdAt": "2026-11-13T15:22:00.000Z"
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_INVALID_REGISTRATION_NUMBER`: Vehicle registration number contains invalid format.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Caller lacks fleet administration privileges.
  - `409 ERR_DUPLICATE_VEHICLE`: Vehicle with this registration number or chassis number already registered.
  - `422 ERR_VALIDATION_FAILED`: Missing mandatory vehicle registration, seating capacity, or fuel type.
  - `500 ERR_INTERNAL_SERVER`: Error registering transport vehicle.
- **Backend Implementation Notes:**
  - **Tables:** `transport_vehicles` (PK: `id`, FK: `campus_id`).
  - **Transaction & Concurrency:** Standard insert inside atomic transaction ensuring unique registration number; logs creation in fleet audit register.
  - **Indexing:** `CREATE UNIQUE INDEX idx_vehicle_reg_uniq ON transport_vehicles(registration_number);`

---

### 9.3 `GET /api/v1/transport/vehicles/:id`
- **Description:** Retrieves single vehicle telematics record with current live GPS coordinates, speed, and ignition status.
- **Authorized Roles:** `superadmin`, `director`, `jointdirector`, `transportmanager`, `driver`, `admin`.
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "VEH-BUS-04",
      "vehicleNumber": "TN 38 BX 4412",
      "liveTelemetry": {
        "latitude": 11.016844,
        "longitude": 76.955832,
        "speedKmph": 34.2,
        "ignition": "ON",
        "lastPingAt": "2026-11-13T15:23:10Z",
        "haltStatus": "In Transit"
      }
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Driver unauthorized to view telemetry for buses assigned to other drivers.
  - `404 ERR_VEHICLE_NOT_FOUND`: Transport vehicle ID does not exist.
  - `500 ERR_INTERNAL_SERVER`: Error retrieving vehicle details.
- **Backend Implementation Notes:**
  - **Tables:** `transport_vehicles` (PK: `id`, FK: `driver_id -> auth_users.id`), `transport_routes` (PK: `id`).
  - **Transaction & Concurrency:** Read-only query joining vehicle record with driver profile and assigned active route coordinates.
  - **Indexing:** `CREATE INDEX idx_transport_vehicles_driver ON transport_vehicles(driver_id);`

---

### 9.4 `GET /api/v1/transport/routes`
- **Description:** Lists all designated transport routes, pickup/drop stage points, scheduled pickup timings, and allocated annual transport fees.
- **Authorized Roles:** `superadmin`, `director`, `jointdirector`, `transportmanager`, `driver`, `parent`, `student`, `admin`.
- **Query Parameters:** `search`, `page`, `pageSize`.
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "RT-04",
        "routeNumber": "Route 04 - Gandhipuram Express",
        "startPoint": "Gandhipuram Central Bus Stand",
        "endPoint": "Main Campus School Portico",
        "totalDistanceKm": 22.4,
        "annualTransportFee": 30000,
        "stops": [
          { "stopName": "Gandhipuram Cross Cut Road", "morningPickupTime": "07:15 AM", "eveningDropTime": "04:45 PM" },
          { "stopName": "Lakshmi Mills Junction", "morningPickupTime": "07:30 AM", "eveningDropTime": "04:30 PM" }
        ],
        "assignedVehicleId": "VEH-BUS-04",
        "enrolledStudentsCount": 46
      }
    ],
    "meta": { "total": 1, "page": 1, "pageSize": 20 },
    "error": null
  }
  ```
- **Error Codes:**
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: User role not permitted to view transport route catalogs.
  - `500 ERR_INTERNAL_SERVER`: Database query timeout retrieving transport routes.
- **Backend Implementation Notes:**
  - **Tables:** `transport_routes` (PK: `id`, FK: `assigned_vehicle_id -> transport_vehicles.id`).
  - **Transaction & Concurrency:** Read-only query fetching route list, start/end locations, and assigned vehicle numbers with 10-minute Redis caching.
  - **Indexing:** `CREATE INDEX idx_transport_routes_campus ON transport_routes(campus_id, is_active);`

---

### 9.5 `POST /api/v1/transport/routes`
- **Description:** Creates a new transport route with geographic stop sequences and scheduled times.
- **Authorized Roles:** `superadmin`, `transportmanager`.
- **Request Body Schema:**
  - `routeNumber` (string, required).
  - `startPoint` (string, required).
  - `endPoint` (string, required).
  - `annualTransportFee` (number, required).
  - `stops` (array of objects with `stopName`, `morningPickupTime`, `eveningDropTime`, required).
  ```json
  {
    "routeNumber": "Route 09 - Saravanampatti Express",
    "startPoint": "Saravanampatti Checkpost",
    "endPoint": "Main Campus",
    "annualTransportFee": 32000,
    "stops": [
      { "stopName": "Saravanampatti Checkpost", "morningPickupTime": "07:10 AM", "eveningDropTime": "04:50 PM" }
    ]
  }
  ```
- **Success Response (HTTP 201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "id": "RT-09",
      "routeNumber": "Route 09 - Saravanampatti Express",
      "createdAt": "2026-11-13T15:25:00.000Z"
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_EMPTY_STOPS_LIST`: A transport route must have at least two ordered stops.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Caller lacks transport operations management permissions.
  - `409 ERR_ROUTE_CODE_EXISTS`: Route code already in use.
  - `422 ERR_VALIDATION_FAILED`: Missing route code, route name, or invalid stop coordinate format.
  - `500 ERR_INTERNAL_SERVER`: Transaction failure inserting route and waypoints.
- **Backend Implementation Notes:**
  - **Tables:** `transport_routes` (PK: `id`), `transport_route_stops` (PK: `id`, FK: `route_id -> transport_routes.id`).
  - **Transaction & Concurrency:** Atomic multi-table transaction creating route header and batch-inserting sequential waypoint stops with ordering index.
  - **Indexing:** `CREATE INDEX idx_transport_stops_route_seq ON transport_route_stops(route_id, stop_order);`

---

### 9.6 `GET /api/v1/transport/manifest`
- **Description:** Retrieves real-time student passenger manifest for a specific route with boarding and drop status.
- **Authorized Roles:** `transportmanager`, `driver`, `gatekeeper`, `gatekeepermanager`, `admin`, `superadmin`.
- **Query Parameters:** `routeId` (required), `tripType` (`Morning Pickup` | `Evening Drop`).
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "MAN-RT04-001",
        "studentId": "STU-2026-001",
        "studentName": "Aarav Sharma",
        "grade": "Grade 10",
        "section": "A",
        "stopName": "Lakshmi Mills Junction",
        "boardingStatus": "Boarded",
        "boardedTimestamp": "2026-11-13T07:31:15Z",
        "emergencyContact": "+91 98401 23456"
      }
    ],
    "meta": { "total": 1, "page": 1, "pageSize": 50 },
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_ROUTE_OR_VEHICLE_REQUIRED`: Either `routeId` or `vehicleId` query parameter must be provided.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Role unauthorized to inspect student transport passenger rosters.
  - `404 ERR_ROUTE_NOT_FOUND`: Target transport route not found.
  - `500 ERR_INTERNAL_SERVER`: Error retrieving student passenger manifest.
- **Backend Implementation Notes:**
  - **Tables:** `transport_passenger_manifest` (PK: `id`, FK: `route_id -> transport_routes.id`, `student_id -> auth_users.id`).
  - **Transaction & Concurrency:** Read-only query at `READ COMMITTED` joining passenger allocations with emergency parent contacts and pickup/drop stop details.
  - **Indexing:** `CREATE INDEX idx_manifest_route_student ON transport_passenger_manifest(route_id, student_id);`

---

### 9.7 `POST /api/v1/transport/manifest/boarding`
- **Description:** Updates a student's real-time boarding or de-boarding status from bus RFID scanner or driver mobile tablet.
- **Authorized Roles:** `driver`, `gatekeeper`, `gatekeepermanager`, `transportmanager`, `superadmin`.
- **Request Body Schema:**
  - `studentId` (string, required).
  - `routeId` (string, required).
  - `boardingStatus` (string, required): `"Boarded" | "De-boarded" | "Absent" | "Not Boarded"`.
  - `tripType` (string, required): `"Morning Pickup" | "Evening Drop"`.
  ```json
  {
    "studentId": "STU-2026-001",
    "routeId": "RT-04",
    "boardingStatus": "Boarded",
    "tripType": "Morning Pickup"
  }
  ```
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "studentId": "STU-2026-001",
      "boardingStatus": "Boarded",
      "recordedAt": "2026-11-13T15:26:00.000Z"
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_INVALID_BOARDING_STATUS`: Status must be `Boarded`, `Alighted`, or `Absent`.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Caller not assigned to bus route or security gate duty.
  - `404 ERR_STUDENT_NOT_IN_MANIFEST`: Student ID not assigned to this transport route.
  - `422 ERR_VALIDATION_FAILED`: Missing trip type (`Morning_Pickup` or `Evening_Drop`) or timestamp.
  - `500 ERR_INTERNAL_SERVER`: Error logging boarding event.
- **Backend Implementation Notes:**
  - **Tables:** `transport_boarding_logs` (PK: `id`, FK: `student_id -> auth_users.id`, `route_id -> transport_routes.id`, `recorded_by_id -> auth_users.id`), `system_notifications` (PK: `id`).
  - **Transaction & Concurrency:** Atomic insert with real-time push notification dispatch to parents ("Student boarded Bus #14 at Gate 2").
  - **Indexing:** `CREATE INDEX idx_boarding_logs_student_date ON transport_boarding_logs(student_id, trip_date, trip_type);`

---

### 9.8 `GET /api/v1/transport/noc-clearances`
- **Description:** Lists driver and conductor annual statutory NOC clearances (Police Verification, Medical Fitness, Driving License Audit, Alcohol Screenings).
- **Authorized Roles:** `superadmin`, `director`, `jointdirector`, `transportmanager`, `hr`, `admin`.
- **Query Parameters:** `status` (`Cleared / NOC Issued`, `Pending Review`, `Rejected`), `page`, `pageSize`.
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "NOC-DRV-001",
        "employeeId": "EMP-DRV-04",
        "employeeName": "M. Parthiban",
        "designation": "Heavy Vehicle Bus Driver",
        "policeVerificationStatus": true,
        "medicalFitnessStatus": true,
        "heavyLicenseValidityStatus": true,
        "substanceAbuseScreeningStatus": true,
        "nocStatus": "Cleared / NOC Issued",
        "certificateNo": "CERT-NOC-2026-004",
        "issuedDate": "2026-01-10",
        "validUntil": "2027-01-09"
      }
    ],
    "meta": { "total": 1, "page": 1, "pageSize": 20 },
    "error": null
  }
  ```
- **Error Codes:**
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Caller role lacks permission to review driver/conductor regulatory compliance clearances.
  - `422 ERR_VALIDATION_FAILED`: Invalid clearance status filter.
  - `500 ERR_INTERNAL_SERVER`: Error querying transport NOC registry.
- **Backend Implementation Notes:**
  - **Tables:** `transport_noc_clearances` (PK: `id`, FK: `employee_id -> auth_users.id`, `approver_id -> auth_users.id`).
  - **Transaction & Concurrency:** Read-only query checking police verification, RTO driving badge validity, eye-test clearance, and alcohol breathalyzer logs.
  - **Indexing:** `CREATE INDEX idx_transport_noc_emp ON transport_noc_clearances(employee_id, status);`

---

### 9.9 `POST /api/v1/transport/noc-clearances/:id/issue`
- **Description:** Formally issues transport statutory safety clearance certificate. Preserves idempotency and validates all 4 safety criteria or explicit management waiver.
- **Authorized Roles:** `transportmanager`, `jointdirector`, `director`, `superadmin`.
- **Request Body Schema:**
  - `allowWaiver` (boolean, optional, default: `false`).
  - `remarks` (string, optional).
  ```json
  {
    "allowWaiver": false,
    "remarks": "All four statutory clearances verified and attested by Transport Directorate."
  }
  ```
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "NOC-DRV-001",
      "nocStatus": "Cleared / NOC Issued",
      "certificateNo": "CERT-NOC-2026-004",
      "issuedAt": "2026-11-13T15:28:00.000Z"
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_ALREADY_ISSUED`: Clearance certificate has already been issued for current term.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Role unauthorized to issue statutory regulatory NOC clearances.
  - `404 ERR_NOC_RECORD_NOT_FOUND`: Target NOC clearance application not found.
  - `422 ERR_STATUTORY_CRITERIA_UNMET`: One or more mandatory safety criteria (e.g. valid license, police verification) are false without authorized waiver.
  - `500 ERR_INTERNAL_SERVER`: Error finalizing NOC certificate issuance.
- **Backend Implementation Notes:**
  - **Tables:** `transport_noc_clearances` (PK: `id`, FK: `employee_id -> auth_users.id`), `system_audit_logs` (PK: `id`).
  - **Transaction & Concurrency:** Atomic transaction verifying all mandatory compliance flags, transitioning `status = 'Approved'`, generating digital clearance certificate number, and logging audit trail.
  - **Indexing:** `CREATE INDEX idx_transport_noc_status_issue ON transport_noc_clearances(id, status);`

---

## 10. Domain 7: Institutional Modules: Public Relations (PRO), File Room Repository, CCTV Security

### 10.1 `GET /api/v1/pro/correspondence`
- **Description:** Lists government, regulatory, CBSE, and external liaison communications with statutory response deadlines.
- **Authorized Roles:** `superadmin`, `director`, `jointdirector`, `jointdirectorassistant`, `pro`, `admin`.
- **Query Parameters:** `category`, `status` (`Pending Action`, `In Progress`, `Dispatched / Closed`), `priority`, `page`, `pageSize`.
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "CORR-2026-001",
        "fileRefNo": "CBSE/AFF/RENEW/2026/04",
        "recipientSender": "Central Board of Secondary Education (CBSE), New Delhi",
        "direction": "Inward",
        "subject": "Affiliation Extension Inspection Compliance Response",
        "statutoryDeadline": "2026-04-15",
        "status": "Pending Action",
        "assignedOfficer": "S. Rangarajan (PRO)"
      }
    ],
    "meta": { "total": 1, "page": 1, "pageSize": 20 },
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_INVALID_STATUS_FILTER`: Status filter must be one of `Received`, `In_Review`, `Drafted`, `Dispatched`, `Archived`.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Role unauthorized to inspect confidential government and regulatory correspondence.
  - `422 ERR_VALIDATION_FAILED`: Invalid pagination or date range parameter format.
  - `500 ERR_INTERNAL_SERVER`: Error querying institutional correspondence register.
- **Backend Implementation Notes:**
  - **Tables:** `pro_correspondence` (PK: `id`, FK: `assigned_officer_id -> auth_users.id`, `campus_id`).
  - **Transaction & Concurrency:** Read-only query executed at `READ COMMITTED`. Supports full-text search across subject and sender organization using PostgreSQL `tsvector`.
  - **Indexing:** `CREATE INDEX idx_pro_corr_status_date ON pro_correspondence(status, correspondence_date DESC);`, `CREATE INDEX idx_pro_corr_search ON pro_correspondence USING gin(to_tsvector('english', subject || ' ' || organization));`

---

### 10.2 `POST /api/v1/pro/correspondence`
- **Description:** Registers new inward or outward official government correspondence with PDF attachments and target deadlines.
- **Authorized Roles:** `pro`, `admin`, `superadmin`.
- **Request Body Schema:**
  - `fileRefNo` (string, required).
  - `recipientSender` (string, required).
  - `direction` (string, required): `"Inward" | "Outward"`.
  - `subject` (string, required).
  - `statutoryDeadline` (string YYYY-MM-DD, optional).
  - `assignedOfficer` (string, required).
  - `attachmentUrl` (string, optional).
  ```json
  {
    "fileRefNo": "DOTE/LAND/2026/09",
    "recipientSender": "Directorate of Town and Country Planning (DTCP)",
    "direction": "Outward",
    "subject": "Campus Expansion Blueprint Approval Submission",
    "statutoryDeadline": "2026-05-01",
    "assignedOfficer": "S. Rangarajan (PRO)",
    "attachmentUrl": "https://cdn.schoolerp.internal/pro/dtcp_sub_09.pdf"
  }
  ```
- **Success Response (HTTP 201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "id": "CORR-2026-002",
      "status": "In Progress",
      "createdAt": "2026-11-13T15:35:00.000Z"
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_INVALID_CORRESPONDENCE_TYPE`: Type must be `Inbound` or `Outbound`.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Caller lacks PRO custody permissions to register official communications.
  - `409 ERR_DUPLICATE_REFERENCE_NUMBER`: Official government reference number already registered.
  - `422 ERR_VALIDATION_FAILED`: Missing mandatory subject, sender organization, or correspondence date.
  - `500 ERR_INTERNAL_SERVER`: Database failure persisting correspondence entry.
- **Backend Implementation Notes:**
  - **Tables:** `pro_correspondence` (PK: `id`, FK: `assigned_officer_id -> auth_users.id`, `campus_id`).
  - **Transaction & Concurrency:** Standard insert within atomic transaction; auto-assigns internal tracking sequence (`PRO-YYYY-XXXX`) and creates audit log.
  - **Indexing:** `CREATE UNIQUE INDEX idx_pro_ref_no_uniq ON pro_correspondence(external_reference_number);`

---

### 10.3 `GET /api/v1/pro/affiliations`
- **Description:** Lists CBSE board affiliations, state recognition certificates, RTE renewals, and compliance statuses.
- **Authorized Roles:** `superadmin`, `director`, `jointdirector`, `jointdirectorassistant`, `jointdirectoraudit`, `pro`, `admin`.
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "AFF-CBSE-001",
        "board": "CBSE",
        "affiliationCode": "1930482",
        "category": "Senior Secondary (Class 1 to 12)",
        "validFrom": "2021-04-01",
        "validTo": "2026-03-31",
        "renewalStatus": "Renewal Application Submitted",
        "latestInspectionDate": "2026-01-18"
      }
    ],
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Role unauthorized to view institutional affiliation compliance dossiers.
  - `500 ERR_INTERNAL_SERVER`: Error fetching CBSE and state board affiliations.
- **Backend Implementation Notes:**
  - **Tables:** `pro_affiliations` (PK: `id`, FK: `campus_id`).
  - **Transaction & Concurrency:** Read-only query fetching affiliation certificates, accreditation cycles, inspection history, and renewal due dates.
  - **Indexing:** `CREATE INDEX idx_pro_affiliations_validity ON pro_affiliations(campus_id, valid_upto);`

---

### 10.4 `GET /api/v1/pro/permits`
- **Description:** Tracks statutory campus operational licenses (Fire Safety NOC, Structural Stability, Sanitary Certificate, Pollution Control Board).
- **Authorized Roles:** `superadmin`, `director`, `jointdirector`, `jointdirectorassistant`, `jointdirectoraudit`, `pro`, `gatekeeper`, `gatekeepermanager`, `admin`.
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "PERMIT-FIRE-01",
        "permitName": "Tamil Nadu Fire & Rescue Services Safety NOC",
        "issuingAuthority": "Fire & Rescue Services Department, Coimbatore",
        "certificateNumber": "NOC/FIRE/CBE/2025/112",
        "issuedDate": "2025-05-10",
        "expiryDate": "2026-05-09",
        "status": "Active / Valid"
      }
    ],
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: User role lacks permission to query statutory campus permits and licenses.
  - `422 ERR_VALIDATION_FAILED`: Invalid permit category filter.
  - `500 ERR_INTERNAL_SERVER`: Error querying municipal and regulatory permit status.
- **Backend Implementation Notes:**
  - **Tables:** `pro_permits` (PK: `id`, FK: `campus_id`).
  - **Transaction & Concurrency:** Read-only query monitoring statutory permits (Fire Safety, Building Stability, Health & Sanitation, Pollution Control).
  - **Indexing:** `CREATE INDEX idx_pro_permits_expiry ON pro_permits(campus_id, expiry_date ASC);`

---

### 10.5 `POST /api/v1/pro/erp-handovers`
- **Description:** Records an official ERP administrative data handover with cryptographic checksum and multi-officer sign-off.
- **Authorized Roles:** `pro`, `jointdirectorassistant`, `admin`, `superadmin`.
- **Request Body Schema:**
  - `dataCategory` (string, required).
  - `handoverToRole` (string, required).
  - `handedOverByName` (string, required).
  - `receivingOfficerName` (string, required).
  - `digitalManifestRef` (string, required).
  ```json
  {
    "dataCategory": "CBSE Board Candidate Enrolment Data",
    "handoverToRole": "coordinator",
    "handedOverByName": "S. Rangarajan (PRO)",
    "receivingOfficerName": "P. Ramachandran (Academic Coordinator)",
    "digitalManifestRef": "MANIFEST-2026-CBSE-X"
  }
  ```
- **Success Response (HTTP 201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "id": "HND-2026-004",
      "status": "Completed / Acknowledged",
      "timestamp": "2026-11-13T15:38:00.000Z"
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_EMPTY_DOCUMENT_LIST`: Handover dossier must contain at least one cataloged file ID.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Caller lacks authorization to initiate official custody handovers.
  - `404 ERR_RECIPIENT_NOT_FOUND`: Target recipient officer ID not registered.
  - `422 ERR_VALIDATION_FAILED`: Mandatory handover purpose, department, or date missing.
  - `500 ERR_INTERNAL_SERVER`: Transaction error logging institutional handover.
- **Backend Implementation Notes:**
  - **Tables:** `pro_erp_handovers` (PK: `id`, FK: `handed_over_by -> auth_users.id`, `recipient_id -> auth_users.id`), `system_notifications` (PK: `id`).
  - **Transaction & Concurrency:** Atomic transaction recording custody transfer; notifies recipient and generates cryptographic acknowledgement receipt token.
  - **Indexing:** `CREATE INDEX idx_handovers_parties ON pro_erp_handovers(handed_over_by, recipient_id, created_at DESC);`

---

### 10.6 `GET /api/v1/fileroom/files`
- **Description:** Searches physical archival files using 4-tier storage coordinates (Rack, Shelf, Box, File Ref No) and confidentiality filtering.
- **Authorized Roles:** `fileroom`, `superadmin`, `admin`, `director`, `jointdirector`.
- **Query Parameters:** `rack`, `shelf`, `box`, `confidentiality`, `currentLocationStatus`, `search`, `page`, `pageSize`.
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "FILE-2026-005",
        "fileRefNo": "LEGAL/CAMPUS/2026/DEED-01",
        "fileName": "Institutional Land Ownership Title Deeds, Patta & DTCP Approvals",
        "category": "Institutional Legal Deeds",
        "confidentiality": "Strictly Confidential / MD Approval Only",
        "storageLocation": {
          "rack": "Rack D",
          "shelf": "Shelf 04",
          "box": "Box 01",
          "coordinate": "D-04-01"
        },
        "currentLocationStatus": "In File Room",
        "retentionRule": "Permanent Archival",
        "accessionDate": "2015-06-01"
      }
    ],
    "meta": { "total": 1, "page": 1, "pageSize": 20 },
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_INVALID_STATUS`: File status must be `Available`, `Checked_Out`, `In_Transit`, or `Disposed`.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Non-custodial roles unauthorized to browse physical file repository coordinates.
  - `422 ERR_VALIDATION_FAILED`: Invalid rack, shelf, or department query parameters.
  - `500 ERR_INTERNAL_SERVER`: Database query failure fetching archival file listings.
- **Backend Implementation Notes:**
  - **Tables:** `fileroom_files` (PK: `id`, FK: `held_by_user_id -> auth_users.id`, `campus_id`).
  - **Transaction & Concurrency:** Read-only query at `READ COMMITTED`. Indexes 4-tier physical location hierarchy (`rack_number`, `shelf_number`, `box_number`, `file_barcode`).
  - **Indexing:** `CREATE INDEX idx_fileroom_location ON fileroom_files(rack_number, shelf_number, box_number);`, `CREATE UNIQUE INDEX idx_fileroom_barcode ON fileroom_files(file_barcode);`

---

### 10.7 `POST /api/v1/fileroom/files`
- **Description:** Accessions a new physical physical dossier into the central file room with mandatory 4-tier storage coordinates.
- **Authorized Roles:** `fileroom`, `superadmin`.
- **Request Body Schema:**
  - `fileRefNo` (string, required).
  - `fileName` (string, required).
  - `category` (string, required).
  - `confidentiality` (string, required): `"Public" | "Internal" | "Confidential" | "Strictly Confidential / MD Approval Only"`.
  - `storageLocation` (object with `rack`, `shelf`, `box`, required).
  - `retentionRule` (string, required): E.g., `"Permanent Archival" | "5 Years Post-Graduation"`.
  ```json
  {
    "fileRefNo": "EXAM/CBSE/XII/2026/TAB-01",
    "fileName": "Grade 12 CBSE Board Examination Tabulation Dossier",
    "category": "Academic Dossier",
    "confidentiality": "Confidential",
    "storageLocation": { "rack": "Rack B", "shelf": "Shelf 02", "box": "Box 04" },
    "retentionRule": "10 Years Board Clearance"
  }
  ```
- **Success Response (HTTP 201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "id": "FILE-2026-089",
      "fileRefNo": "EXAM/CBSE/XII/2026/TAB-01",
      "currentLocationStatus": "In File Room",
      "createdAt": "2026-11-13T15:40:00.000Z"
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_INVALID_PHYSICAL_COORDINATES`: Rack number, shelf number, and box coordinates must be provided.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Caller is not a certified file room custodian.
  - `409 ERR_BARCODE_ALREADY_EXISTS`: An archival file with this barcode is already registered.
  - `422 ERR_VALIDATION_FAILED`: Missing file title, classification tier, or department.
  - `500 ERR_INTERNAL_SERVER`: Database error cataloging archival record.
- **Backend Implementation Notes:**
  - **Tables:** `fileroom_files` (PK: `id`, FK: `campus_id`).
  - **Transaction & Concurrency:** Standard insert inside atomic transaction ensuring unique barcode and physical slot allocation; initial status set to `'Available'`.
  - **Indexing:** `CREATE INDEX idx_fileroom_dept_class ON fileroom_files(department, classification);`

---

### 10.8 `POST /api/v1/fileroom/checkout`
- **Description:** Checks out a physical archival file to an authorized staff officer. For 'Strictly Confidential' files, validates mandatory Managing Director (MD) sign-off.
- **Authorized Roles:** `fileroom`, `admin`, `superadmin`.
- **Request Body Schema:**
  - `fileId` (string, required).
  - `requestedById` (string, required).
  - `requestedByName` (string, required).
  - `department` (string, required).
  - `purpose` (string, required).
  - `expectedReturnDate` (string YYYY-MM-DD, required).
  - `approvalRole` (string, required for confidential files).
  ```json
  {
    "fileId": "FILE-2026-005",
    "requestedById": "EMP-ADM-004",
    "requestedByName": "R. Vijayaraghavan",
    "department": "Administration",
    "purpose": "CBSE Statutory Land Ceiling Verification",
    "expectedReturnDate": "2026-03-25",
    "approvalRole": "director"
  }
  ```
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "issueRecord": {
        "id": "ISS-FILE-901",
        "fileId": "FILE-2026-005",
        "status": "Issued",
        "issuedDateTime": "2026-11-13T15:42:00.000Z"
      },
      "file": {
        "id": "FILE-2026-005",
        "currentLocationStatus": "Checked Out / Issued",
        "heldByUserName": "R. Vijayaraghavan"
      }
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_PAST_EXPECTED_RETURN`: Expected return date cannot be prior to current date.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Caller lacks file check-out authorization authority.
  - `404 ERR_FILE_NOT_FOUND`: Target archival file ID not found.
  - `409 ERR_FILE_ALREADY_CHECKED_OUT`: File is currently in possession of another borrower and not Available.
  - `422 ERR_BORROWER_REQUIRED`: Borrower user ID and expected return date are required.
  - `500 ERR_INTERNAL_SERVER`: Error executing file check-out transaction.
- **Backend Implementation Notes:**
  - **Tables:** `fileroom_files` (PK: `id`), `fileroom_outward_register` (PK: `id`, FK: `file_id -> fileroom_files.id`, `requested_by_id -> auth_users.id`, `authorized_by_id -> auth_users.id`).
  - **Transaction & Concurrency:** Atomic transaction with pessimistic row lock (`SELECT ... FOR UPDATE` on `fileroom_files`). Updates `status = 'Checked_Out'`, records borrower in `held_by_user_id`, and writes outward register entry.
  - **Indexing:** `CREATE INDEX idx_fileroom_outward_file ON fileroom_outward_register(file_id, checkout_date);`

---

### 10.9 `POST /api/v1/fileroom/return/:id`
- **Description:** Records the physical return of a checked-out file, inspecting condition and returning it to assigned rack/shelf coordinates.
- **Authorized Roles:** `fileroom`, `admin`, `superadmin`.
- **Request Body Schema:**
  - `returnCondition` (string, required): `"Good" | "Damaged" | "Pages Missing"`.
  - `notes` (string, optional).
  ```json
  {
    "returnCondition": "Good",
    "notes": "Verified all 48 annexures intact. Restored to Rack D, Shelf 04."
  }
  ```
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "issueRecord": {
        "id": "ISS-FILE-901",
        "status": "Returned",
        "actualReturnDate": "2026-11-13T15:43:00.000Z"
      },
      "file": {
        "id": "FILE-2026-005",
        "currentLocationStatus": "In File Room",
        "heldByUserName": null
      }
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_FILE_NOT_CHECKED_OUT`: Target file is already marked Available or Disposed.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Caller is not an authorized file room custodian.
  - `404 ERR_FILE_NOT_FOUND`: Specified file ID does not exist.
  - `422 ERR_VALIDATION_FAILED`: Condition status (`Intact`, `Damaged`) required upon return.
  - `500 ERR_INTERNAL_SERVER`: Error updating file return status.
- **Backend Implementation Notes:**
  - **Tables:** `fileroom_files` (PK: `id`), `fileroom_inward_register` (PK: `id`, FK: `file_id -> fileroom_files.id`, `custodian_id -> auth_users.id`).
  - **Transaction & Concurrency:** Atomic transaction updating file `status = 'Available'`, clearing `held_by_user_id`, and recording return timestamp and physical condition in inward register.
  - **Indexing:** `CREATE INDEX idx_fileroom_inward_file ON fileroom_inward_register(file_id, return_date);`

---

### 10.10 `POST /api/v1/fileroom/disposals`
- **Description:** Schedules or executes authorized physical document disposal (shredding/incineration) under board resolution and issuance of destruction certificates.
- **Authorized Roles:** `fileroom`, `director`, `jointdirector`, `superadmin`.
- **Request Body Schema:**
  - `fileId` (string, required).
  - `disposalMethod` (string, required): `"Shredding" | "Incineration" | "Digital Archival"`.
  - `boardResolutionNo` (string, required).
  - `authorizedBy` (string, required).
  - `witnesses` (string, required).
  ```json
  {
    "fileId": "FILE-2026-OLD-04",
    "disposalMethod": "Shredding",
    "boardResolutionNo": "BOM-RES-2026/89",
    "authorizedBy": "Dr. V. Thirunavukkarasu (Managing Director)",
    "witnesses": "K. Rajendran (Custodian), S. Meenakshi (Internal Auditor)"
  }
  ```
- **Success Response (HTTP 201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "disposalId": "DISP-2026-014",
      "certificateNumber": "CERT-DISP-2026-014",
      "fileStatus": "Disposed / Destroyed",
      "completedDate": "2026-11-13"
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_FILE_NOT_AVAILABLE`: Cannot dispose a file that is currently Checked Out.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_PERMANENT_ARCHIVAL_DISPOSAL_BLOCKED`: Records designated 'Permanent Archival' or statutory regulatory records cannot be disposed without executive Managing Director override.
  - `404 ERR_FILE_NOT_FOUND`: Target archival file ID not found.
  - `409 ERR_ALREADY_DISPOSED`: File has already been formally decommissioned and disposed.
  - `422 ERR_DISPOSAL_METHOD_REQUIRED`: Mandatory disposal method (`Shredded`, `Incinerated`, `Transferred`) and certificate number required.
  - `500 ERR_INTERNAL_SERVER`: Error executing permanent file disposal protocol.
- **Backend Implementation Notes:**
  - **Tables:** `fileroom_files` (PK: `id`), `fileroom_disposals` (PK: `id`, FK: `file_id -> fileroom_files.id`, `authorized_by_id -> auth_users.id`), `system_audit_logs` (PK: `id`).
  - **Transaction & Concurrency:** Two-phase commit protocol ensuring executive authorization check, physical barcode de-allocation, and immutable disposal certificate recording.
  - **Indexing:** `CREATE UNIQUE INDEX idx_fileroom_disposal_file ON fileroom_disposals(file_id);`

---

### 10.11 `GET /api/v1/cctv/cameras`
- **Description:** Lists all campus CCTV security cameras, zone mapping, IP addresses, NVR channel assignments, and retention days.
- **Authorized Roles:** `cctv`, `director`, `jointdirector`, `gatekeeper`, `gatekeepermanager`, `superadmin`.
- **Query Parameters:** `zone`, `currentStatus` (`Online`, `Offline`, `Degraded`), `page`, `pageSize`.
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "CAM-01",
        "name": "Main Entrance Gate 1 ANPR Camera",
        "zone": "Perimeter & Gates",
        "ipAddress": "192.168.20.11",
        "nvrChannel": 1,
        "currentStatus": "Online",
        "storageRetentionDays": 45,
        "lastDailyCheck": "2026-11-13T06:30:00Z"
      }
    ],
    "meta": { "total": 1, "page": 1, "pageSize": 50 },
    "error": null
  }
  ```
- **Error Codes:**
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Role lacks permission to inspect institutional CCTV surveillance camera inventory.
  - `422 ERR_VALIDATION_FAILED`: Invalid zone or status filter parameter.
  - `500 ERR_INTERNAL_SERVER`: Error connecting to CCTV NVR/VMS gateway.
- **Backend Implementation Notes:**
  - **Tables:** `cctv_cameras` (PK: `id`, FK: `campus_id`).
  - **Transaction & Concurrency:** Read-only query fetching camera positions, IP channels, resolution, retention days, and RTSP stream health.
  - **Indexing:** `CREATE INDEX idx_cctv_cameras_zone ON cctv_cameras(campus_id, zone, status);`

---

### 10.12 `POST /api/v1/cctv/checks`
- **Description:** Logs shift-wise daily camera status checks, identifying recording anomalies, blurry feeds, or offline hardware.
- **Authorized Roles:** `cctv`, `gatekeepermanager`, `superadmin`.
- **Request Body Schema:**
  - `checkDate` (string YYYY-MM-DD, required).
  - `shift` (string, required): `"Morning Shift" | "Evening Shift" | "Night Shift"`.
  - `inspectorId` (string, required).
  - `inspectorName` (string, required).
  - `findingsAndAnomalies` (array of objects with `cameraId`, `anomaly`, `severity`, `isRectified`).
  ```json
  {
    "checkDate": "2026-11-13",
    "shift": "Morning Shift",
    "inspectorId": "EMP-CCTV-01",
    "inspectorName": "S. Selvakumar",
    "findingsAndAnomalies": [
      { "cameraId": "CAM-09", "anomaly": "Lens dust occlusion", "severity": "Minor", "isRectified": false }
    ]
  }
  ```
- **Success Response (HTTP 201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "id": "CHK-CCTV-891",
      "status": "Requires Immediate Attention",
      "createdAt": "2026-11-13T15:45:00.000Z"
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_INCOMPLETE_CHECKLIST`: Daily check must record status for all assigned cameras in zone.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Caller is not certified CCTV operator or security manager.
  - `422 ERR_VALIDATION_FAILED`: Missing inspector ID or date format invalid.
  - `500 ERR_INTERNAL_SERVER`: Error recording daily surveillance checklist.
- **Backend Implementation Notes:**
  - **Tables:** `cctv_daily_checks` (PK: `id`, FK: `inspector_id -> auth_users.id`, `campus_id`), `cctv_issue_register` (PK: `id`).
  - **Transaction & Concurrency:** Atomic transaction recording daily inspection pass/fail flags; automatically creates tickets in `cctv_issue_register` for cameras flagged offline or blurred.
  - **Indexing:** `CREATE INDEX idx_cctv_checks_date ON cctv_daily_checks(check_date, campus_id);`

---

### 10.13 `GET /api/v1/cctv/requests`
- **Description:** Lists CCTV footage extraction requests with approval chains and audit watermarking delivery logs.
- **Authorized Roles:** `cctv`, `director`, `jointdirector`, `jointdirectoraudit`, `gatekeepermanager`, `principal`, `superadmin`.
- **Query Parameters:** `status` (`Dept Head`, `Joint Director`, `Managing Director`, `Approved`, `Rejected`), `page`, `pageSize`.
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "REQ-CCTV-2026-003",
        "incidentDate": "2026-03-10",
        "timeWindowStart": "13:30",
        "timeWindowEnd": "14:15",
        "cameraIds": ["CAM-04", "CAM-05"],
        "requesterId": "USR-PRN-001",
        "requesterName": "Dr. R. Nandakumar (Principal)",
        "justificationText": "Student bicycle vandalism report investigation.",
        "isSensitive": false,
        "currentApprovalTier": "Approved",
        "clipDelivery": {
          "streamingUrl": "https://cctv.school.internal/stream/REQ-CCTV-2026-003.mp4",
          "watermarkText": "USR-PRN-001 / REQ-CCTV-2026-003 / CONFIDENTIAL",
          "downloadExpiryDate": "2026-03-15T18:00:00Z"
        }
      }
    ],
    "meta": { "total": 1, "page": 1, "pageSize": 20 },
    "error": null
  }
  ```
- **Error Codes:**
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Role unauthorized to inspect confidential CCTV footage requisition logs.
  - `422 ERR_VALIDATION_FAILED`: Invalid status or tier filter syntax.
  - `500 ERR_INTERNAL_SERVER`: Database query timeout retrieving footage requests.
- **Backend Implementation Notes:**
  - **Tables:** `cctv_footage_requests` (PK: `id`, FK: `requester_id -> auth_users.id`, `reviewer_id -> auth_users.id`).
  - **Transaction & Concurrency:** Read-only query fetching multi-tier CCTV approval queue (Section 13.1 state machine).
  - **Indexing:** `CREATE INDEX idx_cctv_req_status_tier ON cctv_footage_requests(status, current_approval_tier);`

---

### 10.14 `POST /api/v1/cctv/requests`
- **Description:** Submits a new formal footage requisition. Automatically flags sensitive incidents requiring 3-tier Managing Director approval.
- **Authorized Roles:** `principal`, `coordinator`, `transportmanager`, `gatekeepermanager`, `admin`, `hr`, `superadmin`.
- **Request Body Schema:**
  - `incidentDate` (string YYYY-MM-DD, required).
  - `timeWindowStart` (string HH:MM, required).
  - `timeWindowEnd` (string HH:MM, required).
  - `cameraIds` (array of strings, required).
  - `requesterId` (string, required).
  - `requesterName` (string, required).
  - `justificationText` (string, required).
  - `isSensitive` (boolean, required).
  ```json
  {
    "incidentDate": "2026-03-12",
    "timeWindowStart": "15:45",
    "timeWindowEnd": "16:30",
    "cameraIds": ["CAM-01"],
    "requesterId": "EMP-SEC-01",
    "requesterName": "K. Murugan (Security Supervisor)",
    "justificationText": "Minor bus gate boundary scratch incident review.",
    "isSensitive": false
  }
  ```
- **Success Response (HTTP 201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "id": "REQ-CCTV-2026-004",
      "currentApprovalTier": "Dept Head",
      "createdAt": "2026-11-13T15:47:00.000Z"
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_INVALID_INCIDENT_TIMEFRAME`: `timeFrom` must be chronologically prior to `timeTo`, and span max 4 hours.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: User role unauthorized to request security footage extracts.
  - `404 ERR_CAMERA_NOT_FOUND`: Specified camera ID does not exist in surveillance catalog.
  - `422 ERR_REASON_TOO_BRIEF`: Incident description must contain at least 20 characters explaining justification.
  - `500 ERR_INTERNAL_SERVER`: Error initiating footage requisition.
- **Backend Implementation Notes:**
  - **Tables:** `cctv_footage_requests` (PK: `id`, FK: `requester_id -> auth_users.id`, `camera_id -> cctv_cameras.id`).
  - **Transaction & Concurrency:** Atomic insert initializing Tier 1 of Section 13.1 workflow: sets `status = 'Pending'`, `current_approval_tier = 'Principal'`.
  - **Indexing:** `CREATE INDEX idx_cctv_req_requester ON cctv_footage_requests(requester_id, created_at DESC);`

---

### 10.15 `POST /api/v1/cctv/requests/:id/approve-tier`
- **Description:** Approves or rejects a CCTV footage request at the caller's authorized tier (`HOD` -> `JD` -> `MD`). Enforces strict sequential order and blocks out-of-order attempts.
- **Authorized Roles:** `principal`, `jointdirector`, `director`, `superadmin`.
- **Request Body Schema:**
  - `role` (string, required): `"HOD" | "JD" | "MD"`.
  - `approved` (boolean, required).
  - `remarks` (string, optional).
  - `reviewerName` (string, required).
  ```json
  {
    "role": "JD",
    "approved": true,
    "remarks": "Reviewed and sanctioned for security audit.",
    "reviewerName": "Dr. K. S. Sundaram"
  }
  ```
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "REQ-CCTV-2026-004",
      "currentApprovalTier": "Approved",
      "approvalChain": {
        "deptHead": { "status": "Approved", "approvedBy": "Department Head" },
        "jointDirector": { "status": "Approved", "approvedBy": "Dr. K. S. Sundaram" },
        "managingDirector": { "status": "Not Required" }
      }
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_OUT_OF_ORDER_APPROVAL`: Attempted JD or MD approval before preceding tier approval (violates Section 13.1).
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Caller role does not match current required approval tier authority.
  - `404 ERR_REQUEST_NOT_FOUND`: Target footage request ID not found.
  - `409 ERR_REQUEST_TERMINAL`: Request is already fully Approved or formally Rejected.
  - `422 ERR_REJECTION_REASON_REQUIRED`: Rejection remarks mandatory when rejecting footage release.
  - `500 ERR_INTERNAL_SERVER`: Error processing footage approval decision.
- **Backend Implementation Notes:**
  - **Tables:** `cctv_footage_requests` (PK: `id`), `cctv_audit_logs` (PK: `id`).
  - **Transaction & Concurrency:** Atomic transaction with row-level lock (`SELECT ... FOR UPDATE`). Evaluates Section 13.1 multi-tier state machine; upon Tier 3 approval, triggers automated video clip watermarking and export job.
  - **Indexing:** `CREATE INDEX idx_cctv_approval_eval ON cctv_footage_requests(id, current_approval_tier, status);`

---

## 11. Domain 8: Administration, Inventory, Procurement & Hostel Operations

### 11.1 `GET /api/v1/inventory/catalog`
- **Description:** Lists all campus inventory items (Laboratory glassware/chemicals, sports equipment, stationery, IT hardware, maintenance spares) with stock levels and reorder thresholds.
- **Authorized Roles:** `stationerystoremanager`, `maintenancemanager`, `housekeepingmanager`, `librarian`, `canteenmanager`, `admin`, `superadmin`.
- **Query Parameters:** `category`, `lowStockOnly` (boolean), `page`, `pageSize`.
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "ITEM-CAT-042",
        "itemCode": "LAB-CHEM-012",
        "name": "Hydrochloric Acid 35% AR Grade (500ml)",
        "category": "Science Laboratory Consumables",
        "unitOfMeasure": "Bottles",
        "currentStock": 4,
        "minimumStockThreshold": 8,
        "isLowStock": true,
        "storageLocation": "Chemistry Chemical Locker C-2",
        "unitPrice": 450
      }
    ],
    "meta": { "total": 1, "page": 1, "pageSize": 20 },
    "error": null
  }
  ```
- **Error Codes:**
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Role lacks permission to query institutional inventory stores.
  - `422 ERR_VALIDATION_FAILED`: Invalid category or low-stock filter parameter.
  - `500 ERR_INTERNAL_SERVER`: Database query timeout retrieving stock catalog.
- **Backend Implementation Notes:**
  - **Tables:** `inventory_catalog` (PK: `id`, FK: `campus_id`).
  - **Transaction & Concurrency:** Read-only query at `READ COMMITTED` returning item master, unit of measure, minimum reorder thresholds, and current in-hand stock.
  - **Indexing:** `CREATE INDEX idx_inventory_catalog_cat ON inventory_catalog(category, is_active);`, `CREATE INDEX idx_inventory_reorder ON inventory_catalog(quantity_on_hand, reorder_level);`

---

### 11.2 `POST /api/v1/inventory/movements`
- **Description:** Records an inventory stock movement (`IN` receipt or `OUT` adjustment) with reference documentation and cashier/custodian audit trail.
- **Authorized Roles:** `stationerystoremanager`, `superadmin`.
- **Request Body Schema:**
  - `itemId` (string, required).
  - `transactionType` (string, required): `"IN" | "OUT"`.
  - `quantity` (number, required).
  - `referenceNo` (string, required): E.g., PO number or disposal voucher.
  - `performedBy` (string, required).
  - `notes` (string, optional).
  ```json
  {
    "itemId": "ITEM-CAT-042",
    "transactionType": "IN",
    "quantity": 10,
    "referenceNo": "PO/2026/088",
    "performedBy": "R. Selvam (Stores In-charge)",
    "notes": "Received fresh batch from ChemTech Lab Supplies."
  }
  ```
- **Success Response (HTTP 201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "transactionId": "TX-INV-8910",
      "itemId": "ITEM-CAT-042",
      "previousStock": 4,
      "newStock": 14,
      "createdAt": "2026-11-13T15:52:00.000Z"
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_INSUFFICIENT_STOCK`: Cannot issue or transfer more quantity than current in-hand stock.
  - `400 ERR_INVALID_QUANTITY`: Movement quantity must be a positive integer.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Caller lacks stores inventory management permissions.
  - `404 ERR_ITEM_NOT_FOUND`: Target catalog item ID does not exist.
  - `422 ERR_VALIDATION_FAILED`: Movement type must be `Receipt`, `Issue`, `Adjustment`, or `Transfer`.
  - `500 ERR_INTERNAL_SERVER`: Error executing inventory movement transaction.
- **Backend Implementation Notes:**
  - **Tables:** `inventory_catalog` (PK: `id`), `inventory_transactions` (PK: `id`, FK: `item_id -> inventory_catalog.id`, `performed_by_id -> auth_users.id`).
  - **Transaction & Concurrency:** Atomic transaction with row-level lock (`SELECT ... FOR UPDATE` on `inventory_catalog`). Adjusts `quantity_on_hand` and inserts immutable audit record in `inventory_transactions`.
  - **Indexing:** `CREATE INDEX idx_inventory_trans_item ON inventory_transactions(item_id, created_at DESC);`

---

### 11.3 `POST /api/v1/inventory/issue`
- **Description:** Issues campus equipment or consumable supplies to an authorized employee, linking to department custody.
- **Authorized Roles:** `stationerystoremanager`, `housekeepingmanager`, `superadmin`.
- **Request Body Schema:**
  - `itemId` (string, required).
  - `quantity` (number, required).
  - `issuedToEmployeeId` (string, required).
  - `department` (string, required).
  - `purpose` (string, required).
  - `isReturnable` (boolean, required).
  - `expectedReturnDate` (string YYYY-MM-DD, optional).
  ```json
  {
    "itemId": "ITEM-CAT-015",
    "quantity": 1,
    "issuedToEmployeeId": "USR-TCH-001",
    "department": "Academics & Teaching",
    "purpose": "Physics practical demonstration of optical refraction",
    "isReturnable": true,
    "expectedReturnDate": "2026-03-20"
  }
  ```
- **Success Response (HTTP 201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "issueId": "ISS-INV-902",
      "status": "Issued",
      "createdAt": "2026-11-13T15:53:00.000Z"
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_INSUFFICIENT_AVAILABLE_STOCK`: Requested quantity exceeds available unreserved stock.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Caller unauthorized to execute inventory stock issues.
  - `404 ERR_RECEIVER_NOT_FOUND`: Department employee receiving materials not found.
  - `422 ERR_VALIDATION_FAILED`: Missing item ID, issued quantity, or receiving department.
  - `500 ERR_INTERNAL_SERVER`: Error logging stock issue register.
- **Backend Implementation Notes:**
  - **Tables:** `inventory_catalog` (PK: `id`), `inventory_issue_register` (PK: `id`, FK: `item_id -> inventory_catalog.id`, `issued_to_user_id -> auth_users.id`).
  - **Transaction & Concurrency:** Atomic transaction deducting catalog balance and creating signed issue voucher with department reference code.
  - **Indexing:** `CREATE INDEX idx_inventory_issues_dept ON inventory_issue_register(department, issue_date);`

---

### 11.4 `GET /api/v1/purchase/requisitions`
- **Description:** Lists department purchase requisitions through the procurement approval pipeline.
- **Authorized Roles:** `stationerystoremanager`, `housekeepingmanager`, `maintenancemanager`, `canteenmanager`, `jointdirectoraudit`, `admin`, `jointdirector`, `director`, `accounthead`, `superadmin`.
- **Query Parameters:** `status` (`Draft`, `Submitted`, `Approved`, `PO Generated`, `Rejected`), `department`, `page`, `pageSize`.
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "REQ-PUR-2026-012",
        "requisitionNumber": "REQ/2026/042",
        "department": "Science & Physics Laboratory",
        "requestedBy": "Dr. S. Sundari (HOD Physics)",
        "justification": "Annual senior secondary CBSE practical examination lab consumables",
        "estimatedCost": 78000,
        "status": "Approved",
        "approvedBy": "Dr. K. S. Sundaram (Joint Director)"
      }
    ],
    "meta": { "total": 1, "page": 1, "pageSize": 20 },
    "error": null
  }
  ```
- **Error Codes:**
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: User role not permitted to inspect procurement requisitions.
  - `422 ERR_VALIDATION_FAILED`: Invalid requisition status filter.
  - `500 ERR_INTERNAL_SERVER`: Database failure fetching purchase requisitions.
- **Backend Implementation Notes:**
  - **Tables:** `purchase_requisitions` (PK: `id`, FK: `requested_by_id -> auth_users.id`, `department_id`).
  - **Transaction & Concurrency:** Read-only query fetching procurement pipeline according to Section 13.3 workflow.
  - **Indexing:** `CREATE INDEX idx_purchase_req_status ON purchase_requisitions(status, urgency, created_at DESC);`

---

### 11.5 `POST /api/v1/purchase/requisitions`
- **Description:** Submits a department procurement demand with itemized lines and estimated costs.
- **Authorized Roles:** Department Heads, `stationerystoremanager`, `housekeepingmanager`, `maintenancemanager`, `canteenmanager`, `transportmanager`, `admin`, `superadmin`.
- **Request Body Schema:**
  - `department` (string, required).
  - `requestedBy` (string, required).
  - `justification` (string, required).
  - `items` (array of objects with `itemName`, `quantity`, `estimatedUnitPrice`).
  ```json
  {
    "department": "IT & Systems",
    "requestedBy": "K. Ramesh (IT Support Manager)",
    "justification": "Replacement of damaged optical switch in Server Room Rack 2",
    "items": [
      { "itemName": "Cisco Catalyst 24-Port Gigabit Switch", "quantity": 1, "estimatedUnitPrice": 42000 }
    ]
  }
  ```
- **Success Response (HTTP 201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "id": "REQ-PUR-2026-013",
      "status": "Submitted",
      "createdAt": "2026-11-13T15:55:00.000Z"
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_EMPTY_REQUISITION_ITEMS`: Requisition must contain at least one item.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Caller lacks department requisition creation authority.
  - `422 ERR_VALIDATION_FAILED`: Missing department, item specifications, estimated costs, or urgency level.
  - `500 ERR_INTERNAL_SERVER`: Error submitting purchase requisition.
- **Backend Implementation Notes:**
  - **Tables:** `purchase_requisitions` (PK: `id`, FK: `requested_by_id -> auth_users.id`), `purchase_requisition_items` (PK: `id`, FK: `requisition_id -> purchase_requisitions.id`).
  - **Transaction & Concurrency:** Multi-row atomic transaction inserting requisition header and item requirements; generates tracking number (`REQ-YYYY-XXXX`).
  - **Indexing:** `CREATE INDEX idx_purchase_req_dept ON purchase_requisitions(department_id, created_at);`

---

### 11.6 `POST /api/v1/purchase/quotes`
- **Description:** Submits comparative quotation analysis. Enforces institutional policy of minimum 3 competing vendor quotes and selection justification.
- **Authorized Roles:** `stationerystoremanager`, `admin`, `superadmin`.
- **Request Body Schema:**
  - `requisitionId` (string, required).
  - `quotes` (array of minimum 3 objects with `vendorId`, `vendorName`, `quoteAmount`, `warrantyMonths`, `deliveryDays`).
  - `selectedVendorId` (string, required).
  - `selectionJustification` (string, required): E.g., L1 lowest bidder or superior technical specifications.
  ```json
  {
    "requisitionId": "REQ-PUR-2026-012",
    "quotes": [
      { "vendorId": "VND-01", "vendorName": "Scientific Lab Instruments", "quoteAmount": 74500, "deliveryDays": 5 },
      { "vendorId": "VND-02", "vendorName": "Apex Educational Suppliers", "quoteAmount": 79000, "deliveryDays": 7 },
      { "vendorId": "VND-03", "vendorName": "Modern Chem Glassware", "quoteAmount": 82000, "deliveryDays": 4 }
    ],
    "selectedVendorId": "VND-01",
    "selectionJustification": "L1 lowest evaluated bidder with 12 months comprehensive warranty."
  }
  ```
- **Success Response (HTTP 201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "id": "QUOTE-COMP-2026-09",
      "selectedVendorId": "VND-01",
      "status": "Comparative Analysis Approved",
      "createdAt": "2026-11-13T15:57:00.000Z"
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_INCOMPLETE_VENDOR_PROPOSALS`: Comparative quote must contain full vendor coordinates and price breakdown.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Caller unauthorized to submit comparative procurement bids.
  - `404 ERR_REQUISITION_NOT_FOUND`: Target purchase requisition ID does not exist.
  - `422 ERR_MINIMUM_QUOTES_REQUIRED`: Rejection if fewer than 3 vendor bids submitted (violates Section 13.3 governance rule).
  - `500 ERR_INTERNAL_SERVER`: Error recording comparative quote analysis.
- **Backend Implementation Notes:**
  - **Tables:** `purchase_comparative_quotes` (PK: `id`, FK: `requisition_id -> purchase_requisitions.id`, `selected_vendor_id`), `purchase_requisitions` (PK: `id`).
  - **Transaction & Concurrency:** Atomic transaction verifying >= 3 vendor proposals, selecting L1/recommended bidder, and updating requisition `status = 'Quotes_Attached'`.
  - **Indexing:** `CREATE INDEX idx_comparative_quotes_req ON purchase_comparative_quotes(requisition_id);`

---

### 11.7 `POST /api/v1/purchase/pos/:id/approve`
- **Description:** Approves a formal Purchase Order and automatically triggers creation of an Accounts Payable Liability Voucher in Finance ledger. Preserves idempotency.
- **Authorized Roles:** `jointdirector`, `director`, `accounthead`, `superadmin`.
- **Request Body Schema:**
  - `approvedBy` (string, required).
  - `approvalRemarks` (string, optional).
  ```json
  {
    "approvedBy": "Dr. K. S. Sundaram (Joint Director)",
    "approvalRemarks": "Sanctioned per campus procurement policy."
  }
  ```
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "purchaseOrder": {
        "id": "PO-2026-044",
        "status": "Approved",
        "approvedBy": "Dr. K. S. Sundaram",
        "linkedFinanceLiabilityVoucherId": "VOUCH-LIAB-901"
      },
      "liabilityVoucher": {
        "id": "VOUCH-LIAB-901",
        "voucherNumber": "AP/2026/892",
        "payeeName": "Scientific Lab Instruments",
        "amountDue": 74500,
        "liabilityAccount": "Accounts Payable - Laboratory & Campus Stores",
        "status": "Pending Payment"
      }
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_QUOTES_MISSING`: Cannot approve PO without attached 3-vendor comparative quote analysis (Section 13.3 invariant).
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Purchase value exceeds caller approval delegation limit (POs > 50,000 require MD).
  - `404 ERR_PO_NOT_FOUND`: Target Purchase Order ID not found.
  - `409 ERR_PO_ALREADY_APPROVED`: This purchase order has already been approved; duplicate approval prevented.
  - `500 ERR_INTERNAL_SERVER`: Atomic PO approval and finance voucher creation failure.
- **Backend Implementation Notes:**
  - **Tables:** `purchase_orders` (PK: `id`, FK: `requisition_id -> purchase_requisitions.id`, `vendor_id`), `finance_ap_vouchers` (PK: `id`, FK: `po_id -> purchase_orders.id`), `finance_general_ledger` (PK: `id`).
  - **Transaction & Concurrency:** Atomic transaction with row lock (`SELECT ... FOR UPDATE` on `purchase_orders`). Enforces Section 13.3: marks PO `status = 'Approved'` and atomically creates accounts payable voucher in `finance_ap_vouchers`.
  - **Indexing:** `CREATE UNIQUE INDEX idx_po_ap_voucher ON finance_ap_vouchers(po_id);`

---

### 11.8 `GET /api/v1/hostel/blocks`
- **Description:** Lists residential hostel blocks, total room inventory, bed capacity, and real-time occupancy counts.
- **Authorized Roles:** `admin`, `maintenancemanager`, `housekeepingmanager`, `director`, `jointdirector`, `superadmin`.
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "HSTL-BLK-A",
        "blockName": "Kaveri Senior Boys Hostel Block A",
        "gender": "Boys",
        "wardenName": "Major K. Shanmugam",
        "totalRooms": 40,
        "totalBeds": 120,
        "occupiedBeds": 114,
        "availableBeds": 6,
        "occupancyPercentage": 95.0
      }
    ],
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Role lacks permission to query hostel residential blocks.
  - `500 ERR_INTERNAL_SERVER`: Error retrieving hostel block structures.
- **Backend Implementation Notes:**
  - **Tables:** `hostel_blocks` (PK: `id`, FK: `campus_id`), `hostel_rooms` (PK: `id`, FK: `block_id -> hostel_blocks.id`).
  - **Transaction & Concurrency:** Read-only query calculating real-time capacity, occupied beds, and vacant rooms per residential block.
  - **Indexing:** `CREATE INDEX idx_hostel_blocks_campus ON hostel_blocks(campus_id, is_active);`

---

### 11.9 `GET /api/v1/hostel/enrolments`
- **Description:** Lists actively boarding students, allocated bed coordinates, check-in dates, and linked fee invoice payment status.
- **Authorized Roles:** `admin`, `housekeepingmanager`, `accounthead`, `superadmin`.
- **Query Parameters:** `hostelBlockId`, `status` (`Active`, `Vacated`), `page`, `pageSize`.
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "HSTL-ENR-012",
        "studentId": "STU-2026-012",
        "studentName": "K. Rohith",
        "hostelBlockId": "HSTL-BLK-A",
        "roomNumber": "104",
        "bedNumber": "B1",
        "checkInDate": "2025-06-05",
        "status": "Active",
        "linkedFeeInvoiceId": "INV-HSTL-012",
        "annualHostelFee": 75000,
        "feePaymentStatus": "Paid"
      }
    ],
    "meta": { "total": 1, "page": 1, "pageSize": 50 },
    "error": null
  }
  ```
- **Error Codes:**
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: User unauthorized to inspect student hostel boarding allocations.
  - `422 ERR_VALIDATION_FAILED`: Invalid block or room query filter.
  - `500 ERR_INTERNAL_SERVER`: Error querying hostel enrolment roster.
- **Backend Implementation Notes:**
  - **Tables:** `hostel_enrolments` (PK: `id`, FK: `student_id -> auth_users.id`, `room_id -> hostel_rooms.id`, `linked_invoice_id -> fee_invoices.id`).
  - **Transaction & Concurrency:** Read-only query at `READ COMMITTED` fetching active boarders, room coordinates, bed labels, and linked fee invoice status.
  - **Indexing:** `CREATE INDEX idx_hostel_enrol_active ON hostel_enrolments(student_id, is_active);`

---

### 11.10 `POST /api/v1/hostel/enrol`
- **Description:** Allocates a hostel bed to an enrolled student. Automatically creates an active Boarding Fee invoice in Central Fee Management. Enforces active bed conflict check and re-enrollment idempotency.
- **Authorized Roles:** `admin`, `superadmin`.
- **Request Body Schema:**
  - `studentId` (string, required).
  - `studentName` (string, required).
  - `gender` (string, required).
  - `grade` (string, required).
  - `section` (string, required).
  - `hostelBlockId` (string, required).
  - `roomNumber` (string, required).
  - `bedNumber` (string, required).
  - `feeAmount` (number, optional, default `75000`).
  ```json
  {
    "studentId": "STU-2026-044",
    "studentName": "N. Vignesh",
    "gender": "Boys",
    "grade": "Grade 11",
    "section": "B",
    "hostelBlockId": "HSTL-BLK-A",
    "roomNumber": "108",
    "bedNumber": "B2",
    "feeAmount": 75000
  }
  ```
- **Success Response (HTTP 201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "id": "HSTL-ENR-089",
      "studentId": "STU-2026-044",
      "roomNumber": "108",
      "bedNumber": "B2",
      "status": "Active",
      "linkedFeeInvoiceId": "INV-HSTL-891",
      "annualHostelFee": 75000,
      "createdAt": "2026-11-13T16:00:00.000Z"
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_BED_SPECIFICATION_MISSING`: Room ID and bed label must be specified.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Caller lacks hostel administration allocation privileges.
  - `404 ERR_STUDENT_NOT_FOUND`: Student ID not found in enrolled student database.
  - `409 ERR_BED_ALREADY_OCCUPIED`: The requested bed in that room is already occupied (Section 13.4 invariant).
  - `409 ERR_STUDENT_ALREADY_BOARDING`: Student is already actively enrolled in another hostel bed.
  - `422 ERR_VALIDATION_FAILED`: Missing check-in date or meal plan selection.
  - `500 ERR_INTERNAL_SERVER`: Error executing atomic bed allocation and boarding fee invoicing.
- **Backend Implementation Notes:**
  - **Tables:** `hostel_enrolments` (PK: `id`, FK: `student_id -> auth_users.id`, `room_id -> hostel_rooms.id`), `hostel_rooms` (PK: `id`), `fee_invoices` (PK: `id`).
  - **Transaction & Concurrency:** Atomic `SERIALIZABLE` transaction executing Section 13.4: checks bed vacancy with row-level lock, marks bed occupied, creates enrolment, and automatically generates central boarding fee invoice in `fee_invoices`.
  - **Indexing:** `CREATE UNIQUE INDEX idx_hostel_bed_occupied ON hostel_enrolments(room_id, bed_label) WHERE is_active = TRUE;`

---

### 11.11 `GET /api/v1/lostfound/items`
- **Description:** Searches registered campus lost and found items with photos, discovery locations, and claim statuses.
- **Authorized Roles:** `gatekeeper`, `gatekeepermanager`, `housekeepingmanager`, `admin`, `prm`, `student`, `parent`, `superadmin`.
- **Query Parameters:** `status` (`Unclaimed`, `Claimed`, `Handed Over`), `category`, `search`, `page`, `pageSize`.
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "LF-2026-019",
        "title": "Casio FX-991CW Scientific Calculator",
        "category": "Electronics & Calculators",
        "foundLocation": "Senior Physics Lab Room 302",
        "foundDate": "2026-03-11",
        "reportedBy": "Dr. S. Sundari",
        "custodyLocation": "Front Office Custody Locker B",
        "status": "Unclaimed"
      }
    ],
    "meta": { "total": 1, "page": 1, "pageSize": 20 },
    "error": null
  }
  ```
- **Error Codes:**
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: User role lacks permission to query lost and found property register.
  - `422 ERR_VALIDATION_FAILED`: Invalid status parameter (`Unclaimed`, `Claimed`, `Disposed`).
  - `500 ERR_INTERNAL_SERVER`: Error querying lost and found catalog.
- **Backend Implementation Notes:**
  - **Tables:** `lost_and_found_items` (PK: `id`, FK: `custodian_id -> auth_users.id`, `claimant_id -> auth_users.id`, `campus_id`).
  - **Transaction & Concurrency:** Read-only query fetching recovered property items, surrender location (gate, classroom, playground), and custody status.
  - **Indexing:** `CREATE INDEX idx_lostfound_status ON lost_and_found_items(status, found_date DESC);`

---

### 11.12 `POST /api/v1/lostfound/items/:id/claim`
- **Description:** Submits a verification claim on a found item with ownership proof and identifying serial numbers.
- **Authorized Roles:** `gatekeeper`, `gatekeepermanager`, `admin`, `superadmin`.
- **Request Body Schema:**
  - `claimantId` (string, required).
  - `claimantName` (string, required).
  - `claimantContact` (string, required).
  - `identifyingDetails` (string, required).
  ```json
  {
    "claimantId": "STU-2026-001",
    "claimantName": "Aarav Sharma",
    "claimantContact": "+91 98401 23456",
    "identifyingDetails": "Name label 'Aarav G10A' scratched faintly onto battery compartment lid."
  }
  ```
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "LF-2026-019",
      "status": "Claim Under Verification",
      "claimantDetails": {
        "claimantName": "Aarav Sharma",
        "claimedAt": "2026-11-13T16:02:00.000Z"
      }
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_ITEM_ALREADY_CLAIMED`: Item has already been formally returned and claimed.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Caller lacks authorization to verify and discharge lost property.
  - `404 ERR_ITEM_NOT_FOUND`: Target lost and found item ID not found.
  - `422 ERR_CLAIMANT_DETAILS_MISSING`: Claimant verification details and proof of ownership remarks required.
  - `500 ERR_INTERNAL_SERVER`: Error finalizing lost item claim.
- **Backend Implementation Notes:**
  - **Tables:** `lost_and_found_items` (PK: `id`, FK: `claimant_id -> auth_users.id`), `system_audit_logs` (PK: `id`).
  - **Transaction & Concurrency:** Atomic transaction with row lock (`SELECT ... FOR UPDATE`). Updates item status to `'Claimed'`, logs claimant identity and verification remarks, and creates audit log.
  - **Indexing:** `CREATE INDEX idx_lostfound_claim ON lost_and_found_items(id, status);`

---

## 12. Domain 9: Institutional Recognition, Audits & Notifications

### 12.1 `GET /api/v1/awards/som`
- **Description:** Lists monthly Star of the Month (SOM) nominations across Academic and Non-Academic categories.
- **Authorized Roles:** `superadmin`, `director`, `jointdirector`, `jointdirectorassistant`, `principal`, `coordinator`, `teacher`, `student`, `parent`.
- **Query Parameters:** `month`, `category` (`ACADEMIC`, `NON_ACADEMIC`), `status` (`Submitted`, `Reviewed`, `Announced Winner`).
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "SOM-2025-09-001",
        "month": "September 2025",
        "category": "ACADEMIC",
        "nomineeId": "STU-2026-001",
        "nomineeName": "Aarav Sharma",
        "grade": "Grade 10",
        "section": "A",
        "nominatedByName": "Meenakshi Sharma",
        "totalScore": 96,
        "status": "Announced Winner",
        "announcedDate": "2025-10-01"
      }
    ],
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_INVALID_MONTH_YEAR`: Query parameters `month` (1-12) and `year` (YYYY) must be valid.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: User role lacks permission to query Star of the Month nomination records.
  - `500 ERR_INTERNAL_SERVER`: Error retrieving SOM nominations.
- **Backend Implementation Notes:**
  - **Tables:** `awards_som_nominations` (PK: `id`, FK: `nominee_id -> auth_users.id`, `nominator_id -> auth_users.id`).
  - **Transaction & Concurrency:** Read-only query fetching monthly student nominations, citation paragraphs, committee vote tallies, and declared winners.
  - **Indexing:** `CREATE INDEX idx_som_month_year ON awards_som_nominations(nomination_year, nomination_month, status);`

---

### 12.2 `POST /api/v1/awards/som`
- **Description:** Submits a Star of the Month nomination with checklist scoring against academic rigor, peer mentorship, and discipline.
- **Authorized Roles:** `teacher`, `coordinator`, `principal`, `superadmin`.
- **Request Body Schema:**
  - `month` (string, required).
  - `category` (string, required): `"ACADEMIC" | "NON_ACADEMIC"`.
  - `nomineeId` (string, required).
  - `nomineeName` (string, required).
  - `checklistScores` (object with numerical ratings, required).
  - `citationReason` (string, required).
  ```json
  {
    "month": "March 2026",
    "category": "ACADEMIC",
    "nomineeId": "STU-2026-001",
    "nomineeName": "Aarav Sharma",
    "checklistScores": { "academicRigor": 25, "peerLeadership": 24, "discipline": 25, "attendance": 25 },
    "citationReason": "Exemplary score of 98% in Pre-Board Mock exams and stellar peer math tutoring."
  }
  ```
- **Success Response (HTTP 201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "id": "SOM-2026-03-08",
      "totalScore": 99,
      "status": "Submitted for Review",
      "createdAt": "2026-11-13T16:05:00.000Z"
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_NOMINEE_INELIGIBLE`: Nominee must be an enrolled student with >= 85% attendance.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Caller not authorized as teacher or committee nominator.
  - `404 ERR_STUDENT_NOT_FOUND`: Nominee student ID not found.
  - `409 ERR_DUPLICATE_SOM_NOMINATION`: A nomination for this student has already been submitted for this month.
  - `422 ERR_VALIDATION_FAILED`: Mandatory nomination category, citation remarks, or student ID missing.
  - `500 ERR_INTERNAL_SERVER`: Error recording SOM nomination.
- **Backend Implementation Notes:**
  - **Tables:** `awards_som_nominations` (PK: `id`, FK: `nominee_id -> auth_users.id`, `nominator_id -> auth_users.id`).
  - **Transaction & Concurrency:** Atomic transaction ensuring unique student nomination per calendar month; writes nomination citation to awards repository.
  - **Indexing:** `CREATE UNIQUE INDEX idx_som_nominee_month ON awards_som_nominations(nominee_id, nomination_year, nomination_month);`

---

### 12.3 `GET /api/v1/awards/soy`
- **Description:** Lists annual Star of the Year (SOY) nominations, verifying four annual institutional eligibility rules.
- **Authorized Roles:** `superadmin`, `director`, `jointdirector`, `jointdirectorassistant`, `principal`, `coordinator`, `teacher`, `student`, `parent`.
- **Query Parameters:** `academicYear`, `status`.
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "SOY-2025-26-01",
        "academicYear": "2025-2026",
        "nomineeId": "STU-2026-001",
        "nomineeName": "Aarav Sharma",
        "eligibilityVerification": {
          "somWinsCount": 2,
          "minimumSomWinsMet": true,
          "cumulativeGpa": 9.4,
          "gpaMet": true,
          "attendancePercentage": 96.5,
          "attendanceMet": true,
          "zeroDisciplinaryInfractions": true,
          "isEligible": true
        },
        "status": "Pending MD Final Sign-Off"
      }
    ],
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_ACADEMIC_YEAR_REQUIRED`: Query parameter `academicYear` is required.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: User role unauthorized to view Star of the Year executive candidates.
  - `500 ERR_INTERNAL_SERVER`: Error fetching SOY candidate roster.
- **Backend Implementation Notes:**
  - **Tables:** `awards_soy_nominations` (PK: `id`, FK: `nominee_id -> auth_users.id`, `md_approver_id -> auth_users.id`).
  - **Transaction & Concurrency:** Read-only query fetching annual SOY nominees with Section 13.6 4-rule audit scorecard metrics.
  - **Indexing:** `CREATE INDEX idx_soy_academic_year ON awards_soy_nominations(academic_year, status);`

---

### 12.4 `POST /api/v1/awards/soy`
- **Description:** Submits annual Star of the Year candidate. Performs automated validation requiring >= 2 monthly SOM wins, GPA >= 8.5, attendance >= 95%, and 0 disciplinary infractions.
- **Authorized Roles:** `principal`, `coordinator`, `superadmin`.
- **Request Body Schema:**
  - `academicYear` (string, required).
  - `nomineeId` (string, required).
  - `nomineeName` (string, required).
  - `cumulativeGpa` (number, required).
  - `attendancePercentage` (number, required).
  ```json
  {
    "academicYear": "2025-2026",
    "nomineeId": "STU-2026-001",
    "nomineeName": "Aarav Sharma",
    "cumulativeGpa": 9.4,
    "attendancePercentage": 96.5
  }
  ```
- **Success Response (HTTP 201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "id": "SOY-2026-001",
      "status": "Nominated for Committee Review",
      "createdAt": "2026-11-13T16:07:00.000Z"
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_DISCIPLINARY_RECORD_EXISTS`: Nominee has recorded disciplinary infractions in academic year (violates Rule 4 of Section 13.6).
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Only Principal or Academic Coordinator can nominate SOY candidates.
  - `404 ERR_STUDENT_NOT_FOUND`: Target student ID does not exist.
  - `409 ERR_ALREADY_NOMINATED_SOY`: Student has already been nominated for SOY in this academic year.
  - `422 ERR_SOY_INELIGIBLE`: Nominee does not meet mandatory Section 13.6 criteria (requires >= 2 SOM monthly wins, cumulative GPA >= 8.5, and attendance >= 95%).
  - `500 ERR_INTERNAL_SERVER`: Database error submitting SOY nomination.
- **Backend Implementation Notes:**
  - **Tables:** `awards_soy_nominations` (PK: `id`, FK: `nominee_id -> auth_users.id`), `awards_som_nominations` (PK: `id`), `academic_student_dossiers` (PK: `id`), `attendance_ledger` (PK: `id`).
  - **Transaction & Concurrency:** Atomic transaction executing Section 13.6 4-rule verification query: counts monthly SOM wins, queries GPA from student dossier, and aggregates attendance before accepting nomination.
  - **Indexing:** `CREATE UNIQUE INDEX idx_soy_student_year ON awards_soy_nominations(nominee_id, academic_year);`

---

### 12.5 `POST /api/v1/awards/soy/:id/md-approve`
- **Description:** Executive Managing Director (MD) final sanction for annual Star of the Year rolling trophy and gold citation award.
- **Authorized Roles:** `director`, `superadmin`.
- **Request Body Schema:**
  - `approved` (boolean, required).
  - `mdRemarks` (string, required).
  - `citationText` (string, required if approved).
  ```json
  {
    "approved": true,
    "mdRemarks": "Unanimously sanctioned for annual rolling trophy and gold medal.",
    "citationText": "Outstanding academic diligence, peer leadership, and sterling institutional ambassadorship."
  }
  ```
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "SOY-2026-001",
      "status": "Approved & Selected",
      "citation": "Outstanding academic diligence...",
      "sanctionedAt": "2026-11-13T16:09:00.000Z"
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_CRITERIA_UNVERIFIED`: SOY candidate audit checks have not been satisfied.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Solely the Managing Director (`director`) holds authority for final SOY executive sanction.
  - `404 ERR_NOMINATION_NOT_FOUND`: Target SOY nomination record not found.
  - `409 ERR_ALREADY_SANCTIONED`: SOY award has already been sanctioned for this category.
  - `422 ERR_VALIDATION_FAILED`: Decision must be `Approved` or `Rejected` with executive citation text.
  - `500 ERR_INTERNAL_SERVER`: Error recording Managing Director award sanction.
- **Backend Implementation Notes:**
  - **Tables:** `awards_soy_nominations` (PK: `id`), `system_notifications` (PK: `id`), `system_audit_logs` (PK: `id`).
  - **Transaction & Concurrency:** Atomic transaction recording executive MD digital signature, setting status to `'Approved'`, dispatching campus-wide broadcast notification, and logging immutable audit entry.
  - **Indexing:** `CREATE INDEX idx_soy_md_sanction ON awards_soy_nominations(id, status);`

---

### 12.6 `GET /api/v1/audit/logs`
- **Description:** Master immutable audit trail log querying system actions, user mutations, IP addresses, and state diffs.
- **Authorized Roles:** `superadmin`, `director`, `jointdirector`, `jointdirectoraudit`, `processauditor`.
- **Query Parameters:** `actorId`, `action`, `module`, `fromDate`, `toDate`, `page`, `pageSize`.
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "AUD-2026-1113-094",
        "timestamp": "2026-11-13T15:15:00.000Z",
        "actorId": "USR-ACC-001",
        "actorRole": "account_head",
        "action": "PAYMENT_RECORDED",
        "entityType": "FEE_RECEIPT",
        "entityId": "REC-2026-8910",
        "ipAddress": "192.168.1.108",
        "changes": {
          "invoiceId": "INV-2025-001",
          "amount": 50000,
          "balanceBefore": 50000,
          "balanceAfter": 0
        }
      }
    ],
    "meta": { "total": 1, "page": 1, "pageSize": 50 },
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_INVALID_TIMESTAMP_RANGE`: `from` timestamp must be prior to `to` timestamp.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Role lacks executive audit clearance to inspect system-wide audit logs.
  - `422 ERR_VALIDATION_FAILED`: Invalid module or severity level filter parameter.
  - `500 ERR_INTERNAL_SERVER`: Database query timeout querying immutable audit trail.
- **Backend Implementation Notes:**
  - **Tables:** `system_audit_logs` (PK: `id`, FK: `actor_id -> auth_users.id`, `campus_id`).
  - **Transaction & Concurrency:** Append-only table with strict database-level write-only permissions (`REVOKE UPDATE, DELETE ON system_audit_logs`). Queries execute at `READ COMMITTED` with cursor pagination.
  - **Indexing:** `CREATE INDEX idx_audit_logs_actor_date ON system_audit_logs(actor_id, created_at DESC);`, `CREATE INDEX idx_audit_logs_module ON system_audit_logs(module, action, created_at DESC);`

---

### 12.7 `POST /api/v1/notifications/dispatch`
- **Description:** Dispatches multi-channel institutional alerts (In-App Push, SMS, WhatsApp, Email) to designated target roles or specific users.
- **Authorized Roles:** `superadmin`, `director`, `principal`, `admin`.
- **Request Body Schema:**
  - `title` (string, required).
  - `message` (string, required).
  - `targetRoles` (array of strings, optional).
  - `targetUserIds` (array of strings, optional).
  - `channels` (array of strings: `"IN_APP" | "SMS" | "EMAIL" | "WHATSAPP"`, required).
  ```json
  {
    "title": "Severe Weather Advisory & Early Dispersal Notice",
    "message": "Due to heavy rains, school buses will depart at 02:00 PM today.",
    "targetRoles": ["parent", "student", "teacher", "driver"],
    "channels": ["IN_APP", "SMS", "WHATSAPP"]
  }
  ```
- **Success Response (HTTP 201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "dispatchId": "NOTIF-2026-081",
      "recipientCount": 1840,
      "dispatchedAt": "2026-11-13T16:11:00.000Z"
    },
    "meta": null,
    "error": null
  }
  ```
- **Error Codes:**
  - `400 ERR_EMPTY_RECIPIENT_LIST`: Recipients array cannot be empty.
  - `400 ERR_MESSAGE_BODY_REQUIRED`: Notification title and body text are mandatory.
  - `401 ERR_UNAUTHORIZED`: Authentication required.
  - `403 ERR_FORBIDDEN`: Caller lacks administrative broadcast notification privileges.
  - `422 ERR_VALIDATION_FAILED`: Channel must be one or more of `IN_APP`, `PUSH`, `SMS`, `EMAIL`.
  - `500 ERR_INTERNAL_SERVER`: Push notification delivery gateway service failure.
- **Backend Implementation Notes:**
  - **Tables:** `system_notifications` (PK: `id`, FK: `user_id -> auth_users.id`, `sender_id -> auth_users.id`).
  - **Transaction & Concurrency:** High-throughput batch insert writing individual in-app notification records in a single transaction; publishes event to Redis pub/sub queue for asynchronous multi-channel push/SMS dispatch.
  - **Indexing:** `CREATE INDEX idx_notifications_user_read ON system_notifications(user_id, is_read, created_at DESC);`

---

## 13. Cross-Role Workflow State Machines & Lifecycle Transitions

### 13.1 CCTV Footage Multi-Tier Approval Chain

The surveillance footage requisition workflow guarantees that security footage cannot be released without multi-tier institutional authorization and tamper-evident watermarking.

```
                    ┌────────────────────────┐
                    │      Requisition       │
                    │       Submitted        │
                    └───────────┬────────────┘
                                │
                                ▼
                     [CurrentTier = 'Dept Head']
                     ┌────────────────────────┐
          ┌─────────►│  HOD / Dept Head Review │
          │          └──────────┬─────────────┘
          │                     │
          │         ┌───────────┴───────────┐
          │     Approve                     Reject
          │         │                           │
          │         ▼                           ▼
          │  [CurrentTier = 'Joint Director'] ┌──────────────┐
          │  ┌────────────────────────┐       │   Rejected   │
          │  │ Joint Director Review  │       └──────┬───────┘
          │  └──────────┬─────────────┘              │
          │             │                            │
          │     ┌───────┴───────┐                    │
          │ Approve          Reject                  │
          │     │               │                    │
          │     ▼               └────────────────────┤
          │  (Sensitive?)                            │
          │   /         \                            │
          │ Yes          No                          │
          │  │            │                          │
          │  ▼            ▼                          │
[Reopened]│ [Tier='MD'] [Tier='Approved']            │
          │ ┌─────────┐   │                          │
          │ │MD Review│   │                          │
          │ └────┬────┘   │                          │
          │   Approve     │                          │
          │      │        │                          │
          │      ▼        ▼                          │
          │   ┌───────────────┐                      │
          │   │ Final Approved│                      │
          │   └───────┬───────┘                      │
          │           │                              │
          │           ▼                              │
          │   ┌───────────────┐                      │
          │   │ Watermarked   │                      │
          │   │ Clip Delivered│                      │
          │   └───────────────┘                      │
          │                                          │
          └──────────────────────────────────────────┘
```

**State Transition Invariants:**
1. **Sequential Hierarchy:** HOD approval must precede Joint Director review. Managing Director review is conditionally required only for sensitive incidents.
2. **Rejection Terminal State:** If any tier rejects the requisition, `currentApprovalTier` transitions to `Rejected`. No further approvals can be executed unless explicitly reopened with `reopen: true`.
3. **Clip Delivery Gate:** Watermarked video streaming packages cannot be generated or downloaded until all required tiers have completed `Approved` status.

---

### 13.2 Fee Refund Multi-Stage Financial Sanction Workflow

```
   Parent / Front Office
            │
            ▼ [POST /api/v1/fees/refunds/request]
 ┌──────────────────────────────────────┐
 │ Stage 1: Requested                   │
 └──────────────────┬───────────────────┘
                    │
                    ▼
 ┌──────────────────────────────────────┐
 │ Stage 2: Pending Accounts            │
 │          Verification (Auditor)      │
 └──────────────────┬───────────────────┘
                    │
                    ▼ [POST /api/v1/fees/refunds/:id/approve (Account Head)]
 ┌──────────────────────────────────────┐
 │ Stage 3: Pending JD Approval         │
 └──────────────────┬───────────────────┘
                    │
                    ▼ [POST /api/v1/fees/refunds/:id/approve (Joint Director)]
 ┌──────────────────────────────────────┐
 │ Stage 4: Approved (Sanctioned)       │
 └──────────────────┬───────────────────┘
                    │
                    ▼ [POST /api/v1/fees/refunds/:id/approve (Disbursed)]
 ┌──────────────────────────────────────┐
 │ Stage 5: Disbursed (Remitted)        │
 │          Voucher Generated & Cleared │
 └──────────────────────────────────────┘
```

**State Transition Invariants:**
1. A refund request in `Requested` cannot jump directly to `Approved` or `Disbursed`. It must pass `Pending Accounts Verification` and `Pending JD Approval`.
2. A refund request in `Rejected` or `Disbursed` is immutable and cannot be re-approved.
3. Upon transition to `Disbursed`, the system mandates bank remittance coordinates (`transactionRef` or `chequeNumber`) and assigns an institutional `refundVoucherNumber`.

---

### 13.3 Purchase Requisition -> 3-Vendor Comparative Quote -> PO -> Finance Liability

```
 ┌───────────────────────────┐
 │   Department Requisition   │ [POST /api/v1/purchase/requisitions]
 └─────────────┬─────────────┘
               │
               ▼
 ┌───────────────────────────┐
 │   3-Vendor Comparative    │ [POST /api/v1/purchase/quotes]
 │       Analysis (L1)       │ Enforces >= 3 competing quotes
 └─────────────┬─────────────┘
               │
               ▼
 ┌───────────────────────────┐
 │   Purchase Order Issued   │ [POST /api/v1/purchase/pos]
 └─────────────┬─────────────┘
               │
               ▼
 ┌───────────────────────────┐
 │   Joint Director Approval │ [POST /api/v1/purchase/pos/:id/approve]
 └─────────────┬─────────────┘
               │ (Atomic Transaction)
               ├─────────────────────────────────────────────┐
               ▼                                             ▼
 ┌───────────────────────────┐                 ┌───────────────────────────┐
 │    PO Status = Approved   │                 │ Auto-Generated Finance    │
 │                           │                 │ Accounts Payable Voucher  │
 └───────────────────────────┘                 └───────────────────────────┘
```

**State Transition Invariants:**
1. A Purchase Order cannot be approved without an attached 3-vendor comparative quotation analysis.
2. Approving a PO atomically generates an Accounts Payable liability voucher in the finance ledger with `amountDue = po.grandTotal` and payee vendor coordinates.
3. Duplicate calls to approve an already approved PO are idempotent and return the existing liability voucher without creating duplicate liabilities.

---

### 13.4 Hostel Bed Allocation -> Automated Boarding Fee Invoice Generation

```
 ┌───────────────────────────┐
 │  Admin / Manager Allocates Bed │ [POST /api/v1/hostel/enrol]
 └─────────────┬─────────────┘
               │
               ▼
 ┌───────────────────────────┐
 │ Conflict & Idempotency    │ Checks if bed is already occupied or
 │ Check                     │ student actively enrolled in another bed
 └─────────────┬─────────────┘
               │ (Atomic Transaction)
               ├─────────────────────────────────────────────┐
               ▼                                             ▼
 ┌───────────────────────────┐                 ┌───────────────────────────┐
 │ Hostel Enrolment Created  │                 │ Central Fee Invoice       │
 │ Bed Marked Occupied       │                 │ Generated (Fee Head:      │
 │                           │                 │ FH-HSTL, Status: Pending) │
 └───────────────────────────┘                 └───────────────────────────┘
```

**State Transition Invariants:**
1. A bed already marked `occupied: true` cannot be allocated to another student.
2. A student already actively boarding in another bed cannot be enrolled without vacating their prior allocation.
3. Allocation triggers automatic generation of a linked fee invoice (`linkedFeeInvoiceId`) in `fees_invoices`.

---

### 13.5 Leave Application -> Approval -> Bi-directional Attendance Ledger Sync

```
 ┌───────────────────────────┐
 │ Leave Request Submitted   │ [POST /api/v1/attendance/leaves/apply]
 └─────────────┬─────────────┘
               │
               ▼
 ┌───────────────────────────┐
 │ Scoped Role Approver      │ [POST /api/v1/attendance/leaves/:id/decision]
 │ Evaluates Request         │ Action: "APPROVE"
 └─────────────┬─────────────┘
               │ (Atomic Transaction)
               ├─────────────────────────────────────────────┐
               ▼                                             ▼
 ┌───────────────────────────┐                 ┌───────────────────────────┐
 │ Leave Request Status =    │                 │ Daily Attendance Ledger   │
 │ 'Approved'                │                 │ Target Dates Synchronized │
 │                           │                 │ Status: 'On Leave' ('L')  │
 └───────────────────────────┘                 └───────────────────────────┘
```

**State Transition Invariants:**
1. On approval, the system iterates from `startDate` to `endDate` across the target user's calendar, updating daily ledger entries to status `'On Leave'` with badge `'L'`.
2. Student rosters in class attendance tables automatically reflect the approved leave indicator, preventing class teachers from marking the student as an unexcused absent.
3. Rejection leaves existing attendance untouched and mandates a justification note.

---

### 13.6 Star of the Month (SOM) & Star of the Year (SOY) Evaluation & MD Sign-Off

```
 ┌───────────────────────────┐
 │ Monthly SOM Nominations   │ [POST /api/v1/awards/som]
 │ (Sept, Oct, Nov, Dec...)  │ Monthly Committee Review
 └─────────────┬─────────────┘
               │
               ▼
 ┌───────────────────────────┐
 │  Announced SOM Winners    │ Candidates accumulate monthly wins
 └─────────────┬─────────────┘
               │
               ▼
 ┌───────────────────────────┐
 │ Annual SOY Candidate      │ [POST /api/v1/awards/soy]
 │ Nomination                │ 4-Rule Governance Audit:
 └─────────────┬─────────────┘ 1. >= 2 Monthly SOM Wins
               │               2. Cumulative GPA >= 8.5
               │               3. Attendance >= 95%
               │               4. Zero Disciplinary Infractions
               ▼
 ┌───────────────────────────┐
 │ Executive MD Final        │ [POST /api/v1/awards/soy/:id/md-approve]
 │ Sanction                  │ Executive Managing Director Sign-off
 └─────────────┬─────────────┘
               │
               ▼
 ┌───────────────────────────┐
 │ Rolling Trophy & Gold     │
 │ Citation Awarded          │
 └───────────────────────────┘
```

---

## 14. Mock-to-Backend Migration Guide

### 14.1 Complete Mapping: Frontend `localStorage` / `sessionStorage` Keys to Relational Database Tables

The table below provides a comprehensive map of all frontend mock storage keys to their corresponding production relational database schemas, tables, and primary keys:

| # | Client Storage Key | Category | Target Backend Schema | Target PostgreSQL Table | Primary Key | Foreign Keys |
|---|--------------------|----------|-----------------------|-------------------------|-------------|--------------|
| 1 | `schoolerp_auth` | Auth | `auth` | `auth_sessions` | `session_id` | `user_id -> auth_users.id` |
| 2 | `schoolerp_auth_persistent` | Auth | `auth` | `auth_refresh_tokens` | `token_hash` | `user_id -> auth_users.id` |
| 3 | `schoolerp_parent_active_child_*` | Context | `auth` | `user_context_preferences`| `id` | `parent_id, student_id` |
| 4 | `schoolerp-attendance-ledger-v1` | Attendance | `attendance` | `attendance_ledger` | `id` | `user_id, campus_id` |
| 5 | `schoolerp-leave-requests` | Attendance | `attendance` | `attendance_leave_requests` | `id` | `applicant_id, approver_id`|
| 6 | `schoolerp-hr-leave-policies-v1` | Attendance | `attendance` | `attendance_hr_policies` | `id` | `department_id` |
| 7 | `schoolerp-shift-timings-v1` | Attendance | `attendance` | `attendance_department_shifts` | `id` | `department_id` |
| 8 | `schoolerp-leave-ledger-v1` | Attendance | `attendance` | `attendance_leave_ledger` | `id` | `user_id, leave_request_id` |
| 9 | `schoolerp-essl-devices` | Biometrics | `biometrics` | `biometric_devices` | `id` | `campus_id` |
| 10| `schoolerp-essl-user-mappings`| Biometrics | `biometrics` | `biometric_user_mappings` | `id` | `user_id, biometric_user_id`|
| 11| `schoolerp-essl-raw-punches` | Biometrics | `biometrics` | `biometric_raw_punches` | `id` | `device_id, user_id` |
| 12| `schoolerp-audit-logs-v1` | Audit | `audit` | `system_audit_logs` | `id` | `actor_id, campus_id` |
| 13| `schoolerp-notifications-v1` | Notifications| `notification`| `system_notifications` | `id` | `user_id, sender_id` |
| 14| `schoolerp-tickets-v1` | Helpdesk | `helpdesk` | `helpdesk_tickets` | `id` | `requester_id, assignee_id`|
| 15| `schoolerp_mock_db_v1_pro_correspondence`| PRO | `custody` | `pro_correspondence` | `id` | `assigned_officer_id` |
| 16| `schoolerp_mock_db_v1_pro_affiliations` | PRO | `custody` | `pro_affiliations` | `id` | `campus_id` |
| 17| `schoolerp_mock_db_v1_pro_permits` | PRO | `custody` | `pro_permits` | `id` | `campus_id` |
| 18| `schoolerp_mock_db_v1_pro_inspections` | PRO | `custody` | `pro_inspections` | `id` | `affiliation_id` |
| 19| `schoolerp_mock_db_v1_pro_erp_handovers`| PRO | `custody` | `pro_erp_handovers` | `id` | `handed_over_by, recipient_id`|
| 20| `schoolerp_mock_db_v1_pro_daily_updates`| PRO | `custody` | `pro_daily_work_updates` | `id` | `officer_id` |
| 21| `schoolerp_mock_db_v1_fileroom_files` | File Room | `custody` | `fileroom_files` | `id` | `held_by_user_id` |
| 22| `schoolerp_mock_db_v1_fileroom_inward`| File Room | `custody` | `fileroom_inward_register` | `id` | `custodian_id` |
| 23| `schoolerp_mock_db_v1_fileroom_outward`| File Room| `custody` | `fileroom_outward_register`| `id` | `file_id, requested_by_id` |
| 24| `schoolerp_mock_db_v1_fileroom_disposals`| File Room| `custody` | `fileroom_disposals` | `id` | `file_id, authorized_by_id`|
| 25| `schoolerp_mock_db_v1_cctv_cameras` | CCTV | `security` | `cctv_cameras` | `id` | `campus_id` |
| 26| `schoolerp_mock_db_v1_cctv_checks` | CCTV | `security` | `cctv_daily_checks` | `id` | `inspector_id` |
| 27| `schoolerp_mock_db_v1_cctv_requests` | CCTV | `security` | `cctv_footage_requests` | `id` | `requester_id` |
| 28| `schoolerp_mock_db_v1_cctv_teachers_late`| CCTV | `security` | `cctv_teachers_late_logs` | `id` | `teacher_id, camera_id` |
| 29| `schoolerp_mock_db_v1_cctv_issues` | CCTV | `security` | `cctv_issue_register` | `id` | `camera_id, technician_id` |
| 30| `schoolerp_mock_db_v1_cctv_pa_announcements`| CCTV | `security` | `cctv_pa_announcements`| `id` | `authorized_by_id` |
| 31| `schoolerp_mock_db_v1_cctv_gps_halts` | CCTV | `security` | `transport_gps_halts` | `id` | `bus_id` |
| 32| `schoolerp_mock_db_v1_cctv_bus_last_drops`| CCTV | `security` | `transport_bus_last_drops` | `id` | `bus_id, route_id, driver_id`|
| 33| `schoolerp_mock_db_v1_cctv_bus_cameras`| CCTV | `security` | `transport_bus_camera_audits`| `id` | `bus_id, inspector_id` |
| 34| `schoolerp_mock_db_v1_hostel_blocks` | Hostel | `hostel` | `hostel_blocks` | `id` | `supervisor_id, campus_id` |
| 35| `schoolerp_mock_db_v1_hostel_rooms` | Hostel | `hostel` | `hostel_rooms` | `id` | `block_id` |
| 36| `schoolerp_mock_db_v1_hostel_enrolments`| Hostel | `hostel` | `hostel_enrolments` | `id` | `student_id, room_id, linked_invoice_id`|
| 37| `schoolerp_mock_db_v1_fees_heads` | Finance | `finance` | `fee_heads` | `id` | `gl_account_id` |
| 38| `schoolerp_mock_db_v1_fees_invoices` | Finance | `finance` | `fee_invoices` | `id` | `student_id, campus_id` |
| 39| `schoolerp_mock_db_v1_fees_payments` | Finance | `finance` | `fee_payments` | `id` | `invoice_id, student_id` |
| 40| `schoolerp_mock_db_v1_fees_refunds` | Finance | `finance` | `fee_refunds` | `id` | `student_id, invoice_id` |
| 41| `school_erp_finance_state_v1` | Finance | `finance` | `finance_general_ledger` | `id` | `voucher_id, account_id` |
| 42| `schoolerp_mock_db_v1_academics_exams`| Academics | `academics` | `academic_exams` | `id` | `academic_year_id` |
| 43| `schoolerp_mock_db_v1_academics_marks`| Academics | `academics` | `academic_marks` | `id` | `exam_id, student_id, subject_id`|
| 44| `schoolerp_mock_db_v1_academics_dossiers`| Academics| `academics` | `academic_student_dossiers`| `id` | `student_id` |
| 45| `schoolerp_mock_db_v1_purchase_requisitions`| Procurement| `procurement`| `purchase_requisitions`| `id` | `requested_by_id, department_id`|
| 46| `schoolerp_mock_db_v1_purchase_quotes`| Procurement| `procurement`| `purchase_comparative_quotes`| `id` | `requisition_id, selected_vendor_id`|
| 47| `schoolerp_mock_db_v1_purchase_pos` | Procurement| `procurement`| `purchase_orders` | `id` | `requisition_id, vendor_id, linked_liability_id`|
| 48| `schoolerp_mock_db_v1_purchase_liabilities`| Finance| `finance` | `finance_ap_vouchers` | `id` | `po_id, vendor_id` |
| 49| `schoolerp_mock_db_v1_inventory_catalog`| Inventory | `inventory` | `inventory_catalog` | `id` | `campus_id` |
| 50| `schoolerp_mock_db_v1_inventory_transactions`| Inventory| `inventory` | `inventory_transactions` | `id` | `item_id, performed_by_id` |
| 51| `schoolerp_mock_db_v1_inventory_issues`| Inventory | `inventory` | `inventory_issue_register` | `id` | `item_id, issued_to_user_id`|
| 52| `schoolerp_mock_db_v1_lostfound_items`| Security | `operations` | `lost_and_found_items` | `id` | `claimant_id, custodian_id`|
| 53| `schoolerp_mock_db_v1_awards_som` | Awards | `recognition` | `awards_som_nominations` | `id` | `nominee_id, nominator_id` |
| 54| `schoolerp_mock_db_v1_awards_soy` | Awards | `recognition` | `awards_soy_nominations` | `id` | `nominee_id, md_approver_id`|
| 55| `schoolerp_mock_db_v1_transport_vehicles`| Transport| `transport` | `transport_vehicles` | `id` | `assigned_route_id, driver_id`|
| 56| `schoolerp_mock_db_v1_transport_routes`| Transport | `transport` | `transport_routes` | `id` | `assigned_vehicle_id` |
| 57| `schoolerp_mock_db_v1_transport_manifest`| Transport | `transport` | `transport_passenger_manifest`| `id` | `route_id, student_id` |
| 58| `schoolerp_mock_db_v1_transport_driver_conductor_noc`| Transport| `transport`| `transport_noc_clearances`| `id` | `employee_id, approver_id` |

---

### 14.2 Transitioning from `mockAdapter` to Live API via Environment Variables

The frontend architecture in `src/services/api/apiClient.js` is built with native toggle switches that enable instant live HTTP backend integration with zero code changes:

1. **Environment Configuration (`.env.production` / `.env.staging`):**
   ```env
   # Set the live microservices gateway base URL
   VITE_API_BASE_URL=https://api.schoolerp.internal

   # Toggle mock adapter OFF to route requests via native browser fetch()
   VITE_USE_MOCK=false

   # Network timeout threshold in milliseconds
   VITE_API_TIMEOUT_MS=15000
   ```

2. **Client Dispatcher Behavior (`apiClient.js` lines 123-160):**
   - When `VITE_USE_MOCK=false` and `VITE_API_BASE_URL` is set, `apiClient.request()` automatically bypasses `mockAdapter` and executes live network `fetch()` calls.
   - All outgoing requests inject `Authorization: Bearer <token>`, `X-Campus-Id`, and `X-Role` headers automatically.
   - Responses are validated against the standard `{ success, data, meta, error }` envelope, ensuring identical consumption in all UI components and custom hooks.

3. **Fallback & Graceful Degradation:**
   - If `VITE_USE_MOCK` is omitted or set to `true`, the client transparently routes all calls to `mockAdapter.js`, persisting state in browser `localStorage`.
   - In hybrid development, specific routes can be toggled via `apiClient.configure({ useMock: false, baseUrl: 'http://localhost:8080' })`.

---

### 14.3 Database Schema DDL Recommendations (PostgreSQL)

To support the 80+ endpoints and high-concurrency cross-role workflows, the backend database should be provisioned with standard PostgreSQL schemas:

```sql
-- Create Core Domain Schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS academics;
CREATE SCHEMA IF NOT EXISTS attendance;
CREATE SCHEMA IF NOT EXISTS finance;
CREATE SCHEMA IF NOT EXISTS transport;
CREATE SCHEMA IF NOT EXISTS custody;
CREATE SCHEMA IF NOT EXISTS security;
CREATE SCHEMA IF NOT EXISTS procurement;
CREATE SCHEMA IF NOT EXISTS inventory;
CREATE SCHEMA IF NOT EXISTS recognition;
CREATE SCHEMA IF NOT EXISTS audit;

-- Example: Fee Invoices Table
CREATE TABLE finance.fee_invoices (
    id VARCHAR(64) PRIMARY KEY,
    invoice_number VARCHAR(64) NOT NULL UNIQUE,
    student_id VARCHAR(64) NOT NULL,
    academic_year VARCHAR(16) NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    concession_amount NUMERIC(12, 2) DEFAULT 0.00,
    paid_amount NUMERIC(12, 2) DEFAULT 0.00,
    balance_amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoices_student ON finance.fee_invoices(student_id);
CREATE INDEX idx_invoices_status ON finance.fee_invoices(status);
CREATE INDEX idx_invoices_due_date ON finance.fee_invoices(due_date);

-- Example: CCTV Footage Requisitions Table
CREATE TABLE security.cctv_footage_requests (
    id VARCHAR(64) PRIMARY KEY,
    incident_date DATE NOT NULL,
    time_window_start TIME NOT NULL,
    time_window_end TIME NOT NULL,
    camera_ids JSONB NOT NULL,
    requester_id VARCHAR(64) NOT NULL,
    requester_name VARCHAR(128) NOT NULL,
    justification_text TEXT NOT NULL,
    is_sensitive BOOLEAN DEFAULT FALSE,
    current_approval_tier VARCHAR(32) NOT NULL DEFAULT 'Dept Head',
    approval_chain JSONB NOT NULL,
    clip_delivery JSONB,
    audit_log JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cctv_tier ON security.cctv_footage_requests(current_approval_tier);
CREATE INDEX idx_cctv_requester ON security.cctv_footage_requests(requester_id);
```

---

### 14.4 Transaction Boundary & Concurrency Guidelines

1. **Hostel Bed Allocations:**
   - Execute `SELECT bed_number, occupied FROM hostel_rooms WHERE block_id = $1 AND room_number = $2 FOR UPDATE;`
   - If `occupied = true`, immediately abort transaction with `409 ERR_BED_ALREADY_OCCUPIED`.
   - Insert enrolment record and insert pending fee invoice within the same transaction.

2. **Fee Payments & Partial Settlements:**
   - Execute `SELECT balance_amount, total_amount, paid_amount FROM finance.fee_invoices WHERE id = $1 FOR UPDATE;`
   - Validate `payment_amount <= balance_amount`.
   - Update `paid_amount`, recalculate `balance_amount`, insert into `finance.fee_payments`, and commit.

3. **Purchase Order Approval:**
   - Use row-level lock on `purchase_orders`.
   - Check if status is already `'Approved'`. If so, return existing liability voucher without re-inserting.
   - Atomically create entry in `finance_ap_vouchers` and transition PO status to `'Approved'`.

4. **Bi-directional Leave Synchronization:**
   - On leave approval decision (`APPROVE`), open transaction.
   - Transition `attendance_leave_requests.status = 'Approved'`.
   - Upsert entries in `attendance_ledger` for every date in `[start_date, end_date]` setting `status = 'On Leave'` and `badge = 'L'`.
   - Commit transaction.

---
**End of Specification.**  
*Document finalized for Milestone M-AUDIT-4 / Feature 17 production sign-off.*
