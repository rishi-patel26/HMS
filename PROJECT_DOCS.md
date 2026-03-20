# HMS — Hospital Management System: Complete Project Documentation

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture Overview](#3-architecture-overview)
4. [Directory Structure](#4-directory-structure)
5. [Authentication & Security](#5-authentication--security)
6. [Database Schema](#6-database-schema)
7. [API Reference](#7-api-reference)
8. [Role-Based Access Control](#8-role-based-access-control)
9. [Frontend Architecture](#9-frontend-architecture)
10. [Module Breakdown](#10-module-breakdown)
11. [Business Workflows](#11-business-workflows)
12. [Frontend Services](#12-frontend-services)
13. [Data Models](#13-data-models)
14. [Configuration](#14-configuration)

---

## 1. Project Overview

HMS is a full-stack Hospital Management System that digitises core hospital workflows: patient registration, appointment scheduling, patient check-in (encounter), clinical consultation, episode/care-plan management, workflow-driven bed management, billing, and role-specific dashboards.

### User Roles

| Role | Description |
|------|-------------|
| `ADMIN` | Full system access; user management, reports, all modules |
| `FRONTDESK` | Patient registration, appointments, check-in, billing |
| `DOCTOR` | Consultation workspace, episodes, patient queue |
| `NURSE` | Patient case monitoring, doctor patient lists, bed allocation requests |
| `BED_MANAGER` | Bed queue review, bed allocation workflow, ward occupancy oversight |

### Bed Management Refactor Status (2026-03-18)

Progress: **11/11 tasks completed**

- [x] Removed legacy `bedrequest` module
- [x] Added `Ward` entity and repository
- [x] Added `Bed` entity and repository
- [x] Added `BedAllocationRequest` entity and repository
- [x] Added `BedAssignment` entity and repository
- [x] Added `BedEvent` entity and repository
- [x] Implemented DTO layer + mapper for new module
- [x] Implemented workflow service (request -> review -> allocate -> admit -> discharge -> complete)
- [x] Added event tracking for key transitions
- [x] Added role-aware controller APIs for nurse/bed-manager/admin
- [x] Updated security route mapping and nurse dashboard bed-request stats integration

### Angular Frontend Bed Management Migration (2026-03-18)

Progress: **9/9 tasks completed**

- [x] Replaced legacy bed-request models with bed-management workflow models
- [x] Added dedicated `BedManagementService` for `/api/bed-management/**`
- [x] Updated nurse request list UI to new request fields and status timeline
- [x] Updated patient case workflow form (bed type, ward selection, priority, notes)
- [x] Added request timeline viewing in nurse screens
- [x] Added Bed Manager dashboard page (queue, wards, beds, active assignments)
- [x] Added Bed Manager route and role-aware navigation
- [x] Updated auth role landing route for `BED_MANAGER`
- [x] Verified frontend and backend builds after migration

### Bed Manager Module Split + Admin Access Update (2026-03-18)

Progress: **7/7 tasks completed**

- [x] Split Bed Manager into separate modules: calendar dashboard + bed management workspace
- [x] Updated Bed Manager dashboard to show only full monthly calendar
- [x] Added calendar legend and daily metrics: `availableBeds`, `occupiedBeds`, `maintenanceBeds`
- [x] Added backend calendar API: `GET /api/bed-management/calendar?year=&month=`
- [x] Added backend all-beds API: `GET /api/bed-management/beds`
- [x] Added `Bed Management` and `Doctor Patients` navigation access to `ADMIN`
- [x] Removed `Doctor Patients` feature access from `BED_MANAGER` role

### Bed Workflow Hardening + UI Cleanup (2026-03-18)

Progress: **6/6 tasks completed**

- [x] Added explicit assignable-bed query endpoint for allocation/transfer candidate filtering
- [x] Added transfer workflow endpoint: `PUT /api/bed-management/assignments/{assignmentId}/transfer`
- [x] Added transfer payload DTO: `TransferBedRequest`
- [x] Corrected timeline event semantics for rejected requests (`REQUEST_REJECTED`)
- [x] Added transfer timeline event (`BED_TRANSFERRED`) and assignment response `bedType`
- [x] Rebuilt Bed Manager workspace UI with PrimeNG + Angular control flow (`@if`, `@for`) and removed duplicated logic

### Project Verification Snapshot (2026-03-18)

- Backend: `./mvnw -q clean verify` passed
- Frontend: `npm run build` passed
- Notes: Angular build still reports existing bundle budget warnings (`initial` bundle size and `consultation.component.scss` budget)

---

## 2. Technology Stack

### Backend

| Component | Technology |
|-----------|-----------|
| Language | Java 21 |
| Framework | Spring Boot 3.x |
| Security | Spring Security 6, JWT (JJWT), BCrypt |
| ORM | Spring Data JPA / Hibernate |
| Database | MySQL 8 |
| Token Storage | Redis (token blacklist for logout) |
| Build tool | Maven (Maven Wrapper `mvnw`) |
| Utilities | Lombok, MapStruct-style manual mappers |
| Auditing | Spring Data JPA Auditing (`@CreatedBy`, `@CreatedDate`) |

### Frontend

| Component | Technology |
|-----------|-----------|
| Language | TypeScript 5.9 |
| Framework | Angular 21 (standalone components) |
| Charts | Chart.js 4 |
| UI Components | PrimeNG (Toast), PrimeIcons |
| HTTP | Angular `HttpClient` with JWT interceptor |
| Auth state | RxJS `BehaviorSubject` |
| Build | Angular CLI / esbuild |

---

## 3. Architecture Overview

```
┌─────────────────────────────────┐           ┌──────────────────────────────────┐
│           Angular SPA            │           │         Spring Boot API           │
│         localhost:4200           │◄─────────►│          localhost:8080            │
│                                  │  REST/JSON│                                  │
│  ┌──────────────────────────┐   │           │  ┌───────────────────────────┐   │
│  │  Auth Guard (JWT cookie) │   │           │  │  JwtAuthenticationFilter  │   │
│  └──────────────────────────┘   │           │  └───────────────────────────┘   │
│  ┌──────────────────────────┐   │           │  ┌───────────────────────────┐   │
│  │  JWT Interceptor          │   │           │  │  SecurityConfig (RBAC)     │   │
│  │  (reads accessToken cookie│   │           │  │  @PreAuthorize on methods │   │
│  │   → Bearer header)        │   │           │  └───────────────────────────┘   │
│  └──────────────────────────┘   │           │  ┌───────────────────────────┐   │
│  ┌──────────────────────────┐   │           │  │  REST Controllers          │   │
│  │  Role Guard / Auth Guard  │   │           │  │  → Services → Repositories│   │
│  └──────────────────────────┘   │           │  └───────────────────────────┘   │
└─────────────────────────────────┘           └──────────────────────────────────┘
                                                              │
                                               ┌──────────────┴───────────┐
                                               │          MySQL             │
                                               │  Database: medicaldb       │
                                               └────────────────────────────┘
```

### Request Lifecycle

1. User logs in via `POST /api/auth/login` — server validates credentials, issues `accessToken` (JS-readable cookie, 24 h) and `refreshToken` (HttpOnly cookie, 7 days).
2. Angular `AuthService` reads `accessToken` cookie on startup, decodes JWT payload, restores session state.
3. `jwtInterceptor` attaches `Authorization: Bearer <token>` to every outgoing API request.
4. Spring `JwtAuthenticationFilter` validates the token on every request, loads `UserDetails`, populates `SecurityContext`.
5. `SecurityConfig` URL-pattern checks + `@PreAuthorize` method-level checks enforce RBAC.
6. On logout, `POST /api/auth/logout` blacklists the token in Redis and clears both cookies.

---

## 4. Directory Structure

### Backend

```
HMS-backend/
└── src/main/java/com/example/HMS_backend/
    ├── HmsBackendApplication.java
    ├── config/
    │   ├── AuditorAwareImpl.java        # JPA auditing – sets createdBy/updatedBy from SecurityContext
   │   ├── DataInitializer.java          # Seeds default users + wards/beds (ICU, GENERAL, PRIVATE)
    │   └── JpaAuditingConfig.java
    ├── entity/
    │   ├── BaseEntity.java              # @MappedSuperclass: id, createdAt, updatedAt, createdBy, updatedBy
    │   └── User.java                    # UserDetails implementation, table: users
    ├── exception/
    │   ├── GlobalExceptionHandler.java
    │   ├── ErrorResponse.java
    │   ├── ResourceNotFoundException.java
    │   ├── InvalidTokenException.java
    │   └── DuplicateResourceException.java
    ├── security/
    │   ├── auth/                        # AuthController, AuthService, AuthRequest/Response, RefreshTokenRequest
    │   ├── config/SecurityConfig.java
    │   ├── enums/Role.java
    │   ├── jwt/                         # JwtService, JwtAuthenticationFilter, JwtAuthenticationEntryPoint
    │   ├── redis/TokenBlacklistService.java
    │   ├── token/                       # RefreshToken entity, RefreshTokenService, RefreshTokenRepository
    │   └── user/CustomUserDetailsService.java
    ├── repository/UserRepository.java
    ├── user/                            # UserController, UserManagementService, DTOs (UserCreateRequest, UserUpdateRequest, UserResponse)
    ├── util/
    │   ├── BillNumberGenerator.java     # Generates unique bill numbers
    │   ├── EncounterNumberGenerator.java
    │   └── UhidGenerator.java           # Auto-generates UHID on patient creation
    ├── patient/                         # Patient entity, PatientController, PatientService, PatientRepository
    ├── appointment/                     # Appointment entity, AppointmentController, AppointmentService, AppointmentRepository
    ├── encounter/                       # Encounter entity, EncounterController, EncounterService, EncounterRepository
    ├── consultation/                    # Consultation entity, ConsultationController, ConsultationService, ConsultationRepository
    ├── episode/                         # Episode entity, EpisodeController, EpisodeService, EpisodeRepository
    ├── billing/                         # Bill + BillItem entities, BillingController, BillingService, BillRepository, BillItemRepository
    ├── servicecatalog/                  # ServiceCatalog entity, ServiceCatalogController, ServiceCatalogService, ServiceCatalogRepository
   ├── bedmanagement/                   # Ward, Bed, BedAllocationRequest, BedAssignment, BedEvent + workflow APIs
    ├── nurse/                           # NurseController, NurseService, DTOs, NurseMapper
    └── dashboard/                       # DashboardController, DashboardService, DTOs (DashboardStats, DailyTrendResponse, RevenueTrendResponse)
```

### Frontend

```
Frontend/src/app/
├── app.component.ts                     # Root: <p-toast> + <router-outlet>
├── app.config.ts                        # provideHttpClient(jwtInterceptor), provideRouter
├── app.routes.ts                        # All routes with guards
├── core/
│   ├── enums/role.enum.ts
│   ├── guards/
│   │   ├── auth.guard.ts               # Redirects to /login if unauthenticated
│   │   ├── admin.guard.ts              # roleGuard([Role.ADMIN])
│   │   └── role.guard.ts               # roleGuard(roles[]) – functional guard factory
│   ├── interceptors/
│   │   └── jwt.interceptor.ts          # Reads accessToken cookie → Bearer header
│   ├── models/
│   │   ├── auth.model.ts               # AuthRequest, AuthResponse, User, UserRequest
│   │   └── hms.model.ts                # All domain models and DTOs
│   └── services/
│       ├── auth.service.ts
│       ├── patient.service.ts
│       ├── appointment.service.ts
│       ├── encounter.service.ts
│       ├── consultation.service.ts
│       ├── episode.service.ts
│       ├── billing.service.ts
│       ├── service-catalog.service.ts
│       ├── user.service.ts
│       ├── nurse.service.ts
│       ├── dashboard.service.ts
│       └── data-refresh.service.ts     # Cross-component refresh events via Subject
├── layout/components/main-layout/      # Sidebar + header shell, wraps all authenticated routes
└── features/
    ├── authentication/login/
    ├── dashboards/
    │   ├── admin/
    │   ├── frontdesk/
    │   ├── doctor/
    │   └── nurse-dashboard/
    ├── patients/
    │   ├── patient-list/
    │   ├── patient-form/
    │   └── patient-profile/
    ├── appointments/
    │   ├── appointment-list/
    │   └── appointment-form/
    ├── encounters/
    │   ├── encounter-queue/
    │   └── encounter-details/
    ├── consultation/
    ├── episodes/
    ├── billing/
    │   ├── bill-list/
    │   ├── create-bill/
    │   └── bill-details/
    ├── service-catalog/
    ├── users/
    └── nurse/
        ├── doctor-patients/
        ├── patient-case/
        └── bed-request/
```

---

## 5. Authentication & Security

### Token Strategy

| Token | Cookie | HttpOnly | Max-Age | Path | Purpose |
|-------|--------|----------|---------|------|---------|
| `accessToken` | `accessToken` | false | 24 h (86400 s) | `/` | API auth; JS-readable so interceptor can send as Bearer header |
| `refreshToken` | `refreshToken` | true | 7 days (604800 s) | `/api/auth` | Silent refresh; inaccessible to JS |

Both cookies have `SameSite=Strict`. `cookie.secure` defaults to `false`; set to `true` in production (HTTPS).

### JWT Payload

```json
{
  "sub": "username",
  "role": "ROLE_ADMIN",
  "iat": 1700000000,
  "exp": 1700086400
}
```

### Spring Security URL Rules (SecurityConfig)

| Pattern | Allowed Roles |
|---------|--------------|
| `/api/auth/login`, `/api/auth/refresh` | Public (no auth) |
| `/api/patients/**` | ADMIN, FRONTDESK, DOCTOR, NURSE |
| `/api/appointments/**` | ADMIN, FRONTDESK, DOCTOR, NURSE |
| `/api/encounters/**` | ADMIN, FRONTDESK, DOCTOR, NURSE |
| `/api/bills/**` | ADMIN, FRONTDESK |
| `/api/services/**` | ADMIN, FRONTDESK |
| `/api/episodes/**` | ADMIN, FRONTDESK, DOCTOR |
| `/api/consultations/**` | ADMIN, DOCTOR, NURSE |
| `/api/nurse/**` | ADMIN, NURSE |
| `/api/bed-management/**` | ADMIN, NURSE, BED_MANAGER |
| `/api/beds`, `/api/wards`, `/api/bed-requests`, `/api/bed-assignments/**` | ADMIN, NURSE, BED_MANAGER |
| `/api/dashboard/**` | Any authenticated user |
| `/api/users/doctors` | ADMIN, FRONTDESK, DOCTOR, NURSE |
| `/api/users/**` | ADMIN |
| `**` | Any authenticated |

Additional `@PreAuthorize` annotations on individual controller methods provide fine-grained control (e.g., only `DOCTOR` or `ADMIN` can call `PUT /api/consultations/{id}` and `PUT /api/consultations/{id}/complete`).

### Token Logout / Blacklisting

On `POST /api/auth/logout`:
1. Token is extracted from Authorization header or `accessToken` cookie.
2. `TokenBlacklistService` stores it in Redis until its natural expiry.
3. `JwtAuthenticationFilter` checks Redis before accepting any token.
4. Both cookies are cleared (MaxAge = 0).

### Frontend Guards

| Guard | When used | Behaviour |
|-------|-----------|-----------|
| `authGuard` | All routes under `MainLayout` | Redirects to `/login` if not authenticated |
| `adminGuard` | `dashboard`, `service-catalog`, `users` | Shorthand for `roleGuard([Role.ADMIN])` |
| `roleGuard(roles[])` | Route-specific | Returns `false` + redirects to dashboard if role not in list |

---

## 6. Database Schema

All tables inherit from `BaseEntity`: `id BIGINT PK AUTO_INCREMENT`, `created_at DATETIME`, `updated_at DATETIME`, `created_by VARCHAR`, `updated_by VARCHAR`.

### Table: `users`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | BIGINT | PK, auto-increment |
| `username` | VARCHAR | NOT NULL, UNIQUE |
| `email` | VARCHAR | NOT NULL, UNIQUE |
| `password` | VARCHAR | NOT NULL (BCrypt hash) |
| `role` | VARCHAR(50) | NOT NULL, enum: ADMIN, FRONTDESK, DOCTOR, NURSE, BED_MANAGER |
| `enabled` | BOOLEAN | NOT NULL, default true |
| `created_at` | DATETIME | auto |
| `updated_at` | DATETIME | auto |
| `created_by` | VARCHAR | auto (auditing) |
| `updated_by` | VARCHAR | auto (auditing) |

### Table: `patients`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | BIGINT | PK |
| `uhid` | VARCHAR | NOT NULL, UNIQUE (e.g. `HMS-00001`) |
| `first_name` | VARCHAR | NOT NULL |
| `last_name` | VARCHAR | NOT NULL |
| `gender` | VARCHAR | NOT NULL |
| `dob` | DATE | nullable |
| `phone` | VARCHAR | NOT NULL |
| `email` | VARCHAR | nullable |
| `address` | VARCHAR | nullable |
| `blood_group` | VARCHAR(5) | nullable |
| `emergency_contact` | VARCHAR(20) | nullable |
| *(BaseEntity columns)* | | |

### Table: `appointments`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | BIGINT | PK |
| `patient_id` | BIGINT | NOT NULL, FK → patients.id (logical) |
| `doctor_id` | BIGINT | NOT NULL, FK → users.id (logical) |
| `appointment_time` | DATETIME | NOT NULL |
| `status` | VARCHAR | NOT NULL, enum: SCHEDULED, CHECKED_IN, CANCELLED, NO_SHOW, COMPLETED |
| `reason_for_visit` | VARCHAR(20) | nullable |
| `notes` | VARCHAR(1000) | nullable |
| `priority` | VARCHAR(100) | nullable |
| `department` | VARCHAR(100) | nullable |
| *(BaseEntity columns)* | | |

### Table: `encounters`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | BIGINT | PK |
| `encounter_number` | VARCHAR | NOT NULL, UNIQUE (e.g. `ENC-20240117-0001`) |
| `patient_id` | BIGINT | NOT NULL |
| `doctor_id` | BIGINT | NOT NULL |
| `episode_id` | BIGINT | nullable, FK → episodes.id |
| `appointment_id` | BIGINT | nullable |
| `visit_type` | VARCHAR | NOT NULL, enum: OPD, IPD |
| `status` | VARCHAR | NOT NULL, enum: WAITING, IN_CONSULTATION, COMPLETED, CANCELLED (default WAITING) |
| `visit_date` | DATETIME | nullable |
| `checkin_time` | DATETIME | nullable |
| `priority` | VARCHAR | NOT NULL, enum: NORMAL, URGENT, EMERGENCY (default NORMAL) |
| `notes` | VARCHAR(1000) | nullable |
| `room_number` | VARCHAR(20) | nullable |
| *(BaseEntity columns)* | | |

### Table: `consultations`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | BIGINT | PK |
| `encounter_id` | BIGINT | NOT NULL, unique per encounter |
| `symptoms` | VARCHAR(1000) | nullable |
| `diagnosis` | VARCHAR(2000) | NOT NULL |
| `prescription` | VARCHAR(2000) | NOT NULL |
| `doctor_notes` | VARCHAR(2000) | nullable |
| `followup_date` | DATE | nullable |
| `tests_requested` | VARCHAR(1000) | nullable |
| *(BaseEntity columns)* | | |

### Table: `episodes`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | BIGINT | PK |
| `patient_id` | BIGINT | NOT NULL |
| `episode_type` | VARCHAR | NOT NULL, enum: CHRONIC_DISEASE, SURGERY, INJURY, INFECTION, MENTAL_HEALTH, OTHER |
| `description` | VARCHAR | nullable |
| `start_date` | DATE | NOT NULL |
| `end_date` | DATE | nullable |
| `start_time` | VARCHAR | nullable |
| `end_time` | VARCHAR | nullable |
| `status` | VARCHAR | NOT NULL, default ACTIVE (ACTIVE / CLOSED) |
| `severity` | VARCHAR(50) | nullable (MILD, MODERATE, SEVERE, CRITICAL) |
| `notes` | VARCHAR(1000) | nullable |
| `diagnosis_summary` | VARCHAR(2000) | nullable |
| *(BaseEntity columns)* | | |

**Relationship:** `Episode` has `@OneToMany(encounters)` — one episode can span multiple encounters.

### Table: `bills`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | BIGINT | PK |
| `bill_number` | VARCHAR | NOT NULL, UNIQUE (e.g. `BILL-20240117-0001`) |
| `encounter_id` | BIGINT | NOT NULL |
| `total_amount` | DECIMAL(12,2) | NOT NULL, default 0 |
| `paid_amount` | DECIMAL(12,2) | NOT NULL, default 0 |
| `payment_status` | VARCHAR | NOT NULL, enum: PENDING, PARTIAL, PAID (default PENDING) |
| `payment_method` | VARCHAR | nullable (CASH, CARD, UPI, INSURANCE) |
| *(BaseEntity columns)* | | |

**Relationship:** `Bill` has `@OneToMany(cascade=ALL, orphanRemoval=true)` → `BillItem`.

### Table: `bill_items`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | BIGINT | PK |
| `bill_id` | BIGINT | NOT NULL, FK → bills.id |
| `service_id` | BIGINT | NOT NULL, FK → service_catalog.id |
| `quantity` | INT | NOT NULL |
| `unit_price` | DECIMAL(12,2) | NOT NULL (snapshot at time of billing) |
| `subtotal` | DECIMAL(12,2) | NOT NULL |
| *(BaseEntity columns)* | | |

### Table: `service_catalog`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | BIGINT | PK |
| `name` | VARCHAR | NOT NULL |
| `price` | DECIMAL(12,2) | NOT NULL |
| `description` | VARCHAR | nullable |
| `category` | VARCHAR | nullable |
| `active` | BOOLEAN | NOT NULL, default true |
| *(BaseEntity columns)* | | |

### Table: `wards`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | BIGINT | PK |
| `name` | VARCHAR(100) | NOT NULL, UNIQUE |
| `type` | VARCHAR(20) | NOT NULL, enum: ICU, GENERAL, PRIVATE |
| `capacity` | INT | NOT NULL |
| `occupied_beds` | INT | NOT NULL, default 0 |
| `active` | BOOLEAN | NOT NULL, default true |
| *(BaseEntity columns)* | | |

### Table: `beds`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | BIGINT | PK |
| `bed_number` | VARCHAR(50) | NOT NULL |
| `ward_id` | BIGINT | NOT NULL, FK -> wards.id |
| `bed_type` | VARCHAR(20) | NOT NULL, enum: ICU, GENERAL, PRIVATE |
| `status` | VARCHAR(20) | NOT NULL, enum: AVAILABLE, OCCUPIED, MAINTENANCE |
| *(BaseEntity columns)* | | |

Unique constraint: `(ward_id, bed_number)`.

### Table: `bed_allocation_requests`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | BIGINT | PK |
| `encounter_id` | BIGINT | NOT NULL |
| `patient_id` | BIGINT | NOT NULL |
| `requested_by` | BIGINT | NOT NULL |
| `required_bed_type` | VARCHAR(20) | NOT NULL |
| `preferred_ward_id` | BIGINT | nullable |
| `priority` | VARCHAR(20) | NOT NULL, enum: NORMAL, URGENT, EMERGENCY |
| `status` | VARCHAR(20) | NOT NULL, enum: REQUESTED, UNDER_REVIEW, ALLOCATED, REJECTED |
| `notes` | VARCHAR(1000) | nullable |
| *(BaseEntity columns)* | | |

### Table: `bed_assignments`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | BIGINT | PK |
| `encounter_id` | BIGINT | NOT NULL |
| `bed_id` | BIGINT | NOT NULL |
| `assigned_by` | BIGINT | NOT NULL |
| `assigned_at` | DATETIME | NOT NULL |
| `admitted_at` | DATETIME | nullable |
| `discharged_at` | DATETIME | nullable |
| `status` | VARCHAR(20) | NOT NULL, enum: ALLOCATED, ADMITTED, DISCHARGED, COMPLETED |
| *(BaseEntity columns)* | | |

### Table: `bed_events`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | BIGINT | PK |
| `encounter_id` | BIGINT | NOT NULL |
| `event_type` | VARCHAR(30) | NOT NULL |
| `performed_by` | BIGINT | NOT NULL |
| `timestamp` | DATETIME | NOT NULL |
| `notes` | VARCHAR(1000) | nullable |
| *(BaseEntity columns)* | | |

### Table: `refresh_tokens` (Security)

| Column | Type | Purpose |
|--------|------|---------|
| `id` | BIGINT | PK |
| `token` | VARCHAR | Opaque refresh token value |
| `user_id` | BIGINT | FK → users.id |
| `expiry_date` | DATETIME | Expiry timestamp |

### Entity Relationship Summary

```
users ──< appointments >── patients
users ──< encounters   >── patients
encounters ──< consultations (1:1)
episodes   ──< encounters (1:many)
encounters ──< bills (1:1)
bills      ──< bill_items >── service_catalog
wards      ──< beds
encounters ──< bed_allocation_requests
encounters ──< bed_assignments
encounters ──< bed_events
users ──< refresh_tokens
```

---

## 7. API Reference

Base URL: `http://localhost:8080`

All endpoints (except `/api/auth/login` and `/api/auth/refresh`) require `Authorization: Bearer <accessToken>` header, which is automatically set by the Angular JWT interceptor.

### Auth — `/api/auth`

| Method | Path | Auth | Request Body | Response | Description |
|--------|------|------|--------------|----------|-------------|
| POST | `/api/auth/login` | Public | `{ username, password }` | `{ username, role }` + cookies | Login, sets JWT cookies |
| POST | `/api/auth/refresh` | Public | — (uses refreshToken cookie) | `{ username, role }` + new cookies | Rotate access token |
| POST | `/api/auth/logout` | Any | — | 200 | Blacklists token, clears cookies |

### Patients — `/api/patients`

| Method | Path | Roles | Request | Response | Description |
|--------|------|-------|---------|----------|-------------|
| POST | `/api/patients` | ALL* | `PatientRequest` | `PatientResponse` 201 | Register new patient (UHID auto-generated) |
| GET | `/api/patients/{id}` | ALL* | — | `PatientResponse` | Fetch by ID |
| GET | `/api/patients/search?query=` | ALL* | — | `PatientResponse[]` | Search by name, UHID, phone |
| GET | `/api/patients/recent` | ALL* | — | `PatientResponse[]` (top 50) | Most recently registered |
| PUT | `/api/patients/{id}` | ALL* | `PatientRequest` | `PatientResponse` | Update patient details |
| DELETE | `/api/patients/{id}` | ADMIN | — | 204 | Delete patient |

*ALL = ADMIN, FRONTDESK, DOCTOR, NURSE

### Appointments — `/api/appointments`

| Method | Path | Roles | Request | Response | Description |
|--------|------|-------|---------|----------|-------------|
| POST | `/api/appointments` | ALL* | `AppointmentRequest` | `AppointmentResponse` 201 | Book appointment |
| GET | `/api/appointments/{id}` | ALL* | — | `AppointmentResponse` | Get by ID |
| GET | `/api/appointments/patient/{patientId}` | ALL* | — | `AppointmentResponse[]` | Patient's appointments |
| PUT | `/api/appointments/{id}/status?status=` | ALL* | — | `AppointmentResponse` | Update status |
| GET | `/api/appointments/today` | ALL* | — | `AppointmentResponse[]` | All today's appointments |
| GET | `/api/appointments/by-date?date=` | ALL* | — | `AppointmentResponse[]` | Appointments on date |
| GET | `/api/appointments/doctor/today` | ALL* | — | `AppointmentResponse[]` | Authenticated doctor's today |
| GET | `/api/appointments/doctor/all` | ALL* | — | `AppointmentResponse[]` | Doctor's all appointments |
| GET | `/api/appointments/doctor/by-date?date=` | ALL* | — | `AppointmentResponse[]` | Doctor's appointments on date |
| DELETE | `/api/appointments/{id}` | ADMIN | — | 204 | Delete appointment |

### Encounters — `/api/encounters`

| Method | Path | Roles | Request | Response | Description |
|--------|------|-------|---------|----------|-------------|
| POST | `/api/encounters/checkin` | ALL* | `EncounterRequest` | `EncounterResponse` 201 | Check in patient (creates encounter) |
| GET | `/api/encounters/{id}` | ALL* | — | `EncounterResponse` | Get encounter by ID |
| GET | `/api/encounters/patient/{patientId}` | ALL* | — | `EncounterResponse[]` | All encounters for patient |
| PUT | `/api/encounters/{id}/status?status=` | ALL* | — | `EncounterResponse` | Update status (WAITING→IN_CONSULTATION→COMPLETED) |
| PUT | `/api/encounters/{id}/link-episode/{episodeId}` | ALL* | — | `EncounterResponse` | Link an episode to encounter |
| GET | `/api/encounters/today` | ALL* | — | `EncounterResponse[]` | All today's encounters |
| GET | `/api/encounters/by-date?date=` | ALL* | — | `EncounterResponse[]` | Encounters on date |
| GET | `/api/encounters/doctor/today` | ALL* | — | `EncounterResponse[]` | Doctor's today's queue |
| GET | `/api/encounters/doctor/all` | ALL* | — | `EncounterResponse[]` | Doctor's all encounters |
| GET | `/api/encounters/doctor/by-date?date=` | ALL* | — | `EncounterResponse[]` | Doctor's encounters on date |

### Consultations — `/api/consultations`

| Method | Path | Roles | Request | Response | Description |
|--------|------|-------|---------|----------|-------------|
| POST | `/api/consultations` | DOCTOR, ADMIN | `ConsultationRequest` | `ConsultationResponse` 201 | Create consultation |
| GET | `/api/consultations/{id}` | DOCTOR, ADMIN, FRONTDESK, NURSE | — | `ConsultationResponse` | Get by ID |
| GET | `/api/consultations/encounter/{encounterId}` | DOCTOR, ADMIN, FRONTDESK, NURSE | — | `ConsultationResponse` | Get consultation for encounter |
| PUT | `/api/consultations/{id}` | DOCTOR, ADMIN | `ConsultationRequest` | `ConsultationResponse` | Update consultation |
| PUT | `/api/consultations/{id}/complete` | DOCTOR, ADMIN | — | `ConsultationResponse` | Mark consultation complete (sets encounter to COMPLETED) |
| GET | `/api/consultations/doctor/{username}` | DOCTOR, ADMIN | — | `ConsultationResponse[]` | All consultations by doctor |
| GET | `/api/consultations/today` | DOCTOR, ADMIN | — | `ConsultationResponse[]` | Today's consultations |
| GET | `/api/consultations/search?patientName=&patientId=` | DOCTOR, ADMIN | — | `ConsultationResponse[]` | Search consultations |

### Episodes — `/api/episodes`

| Method | Path | Roles | Request | Response | Description |
|--------|------|-------|---------|----------|-------------|
| POST | `/api/episodes` | DOCTOR, ADMIN | `EpisodeRequest` | `EpisodeResponse` 201 | Create episode |
| GET | `/api/episodes?patientId=&status=&startDate=&endDate=` | DOCTOR, ADMIN | — | `EpisodeResponse[]` | List/filter episodes |
| GET | `/api/episodes/patient/{patientId}` | DOCTOR, ADMIN, FRONTDESK | — | `EpisodeResponse[]` | Patient's episodes |
| GET | `/api/episodes/doctor` | DOCTOR, ADMIN | — | `EpisodeResponse[]` | Authenticated doctor's episodes |
| PUT | `/api/episodes/{id}` | DOCTOR, ADMIN | `EpisodeRequest` | `EpisodeResponse` | Update episode |
| PUT | `/api/episodes/{id}/close` | DOCTOR, ADMIN | — | `EpisodeResponse` | Close episode (status → CLOSED) |
| DELETE | `/api/episodes/{id}` | ADMIN | — | 204 | Delete episode |

### Billing — `/api/bills`

| Method | Path | Roles | Request | Response | Description |
|--------|------|-------|---------|----------|-------------|
| POST | `/api/bills/create/{encounterId}` | ADMIN, FRONTDESK | — | `BillResponse` 201 | Create blank bill for encounter |
| POST | `/api/bills/{billId}/items` | ADMIN, FRONTDESK | `BillItemRequest` | `BillResponse` | Add service item to bill |
| GET | `/api/bills/{billId}` | ADMIN, FRONTDESK | — | `BillResponse` | Get bill |
| POST | `/api/bills/{billId}/pay` | ADMIN, FRONTDESK | `PaymentRequest` | `BillResponse` | Record payment (partial or full) |
| GET | `/api/bills/encounter/{encounterId}` | ADMIN, FRONTDESK | — | `BillResponse` | Get bill by encounter |
| GET | `/api/bills/today` | ADMIN, FRONTDESK | — | `BillResponse[]` | Today's bills |
| GET | `/api/bills/pending` | ADMIN, FRONTDESK | — | `BillResponse[]` | Bills with PENDING/PARTIAL status |
| GET | `/api/bills/all` | ADMIN, FRONTDESK | — | `BillResponse[]` | All bills |
| GET | `/api/bills/by-date?date=` | ADMIN, FRONTDESK | — | `BillResponse[]` | Bills on date |
| GET | `/api/bills/search?billNumber=&status=` | ADMIN, FRONTDESK | — | `BillResponse[]` | Search bills |
| DELETE | `/api/bills/{billId}` | ADMIN | — | 204 | Delete bill |

### Service Catalog — `/api/services`

| Method | Path | Roles | Request | Response | Description |
|--------|------|-------|---------|----------|-------------|
| GET | `/api/services` | ADMIN, FRONTDESK | — | `ServiceResponse[]` | All services (incl. inactive) |
| POST | `/api/services` | ADMIN, FRONTDESK | `ServiceRequest` | `ServiceResponse` 201 | Create service |
| PUT | `/api/services/{id}` | ADMIN, FRONTDESK | `ServiceRequest` | `ServiceResponse` | Update service |
| DELETE | `/api/services/{id}` | ADMIN, FRONTDESK | — | 204 | Soft-delete (sets active=false) |

### Users — `/api/users`

| Method | Path | Roles | Request | Response | Description |
|--------|------|-------|---------|----------|-------------|
| GET | `/api/users` | ADMIN | — | `UserResponse[]` | All users |
| GET | `/api/users/{id}` | ADMIN | — | `UserResponse` | Get user |
| GET | `/api/users/doctors` | ALL* | — | `UserResponse[]` | Active doctors list |
| POST | `/api/users` | ADMIN | `UserCreateRequest` | `UserResponse` 201 | Create user |
| PUT | `/api/users/{id}` | ADMIN | `UserUpdateRequest` | `UserResponse` | Update user |
| DELETE | `/api/users/{id}` | ADMIN | — | 204 | Delete user |

### Nurse — `/api/nurse`

| Method | Path | Roles | Response | Description |
|--------|------|-------|----------|-------------|
| GET | `/api/nurse/doctors` | NURSE, ADMIN | `DoctorOption[]` | Active doctors list |
| GET | `/api/nurse/doctor/{doctorId}/patients` | NURSE, ADMIN | `DoctorPatientItem[]` | Non-cancelled encounters for doctor |
| GET | `/api/nurse/case/{encounterId}` | NURSE, ADMIN | `PatientCaseTimeline` | Full case view (encounter + patient + doctor + consultation) |
| GET | `/api/nurse/dashboard-stats` | NURSE, ADMIN | `NurseDashboardStats` | Nurse dashboard statistics |

### Bed Management — `/api/bed-management`

| Method | Path | Roles | Request | Response | Description |
|--------|------|-------|---------|----------|-------------|
| POST | `/api/bed-management/requests` | NURSE, ADMIN | `CreateBedAllocationRequestRequest` | `BedAllocationRequestResponse` | Nurse creates bed allocation request |
| GET | `/api/bed-management/requests/my` | NURSE, ADMIN | — | `BedAllocationRequestResponse[]` | Current user's requests |
| GET | `/api/bed-management/requests/{requestId}` | NURSE, ADMIN, BED_MANAGER | — | `BedAllocationRequestResponse` | Request details |
| GET | `/api/bed-management/requests/encounter/{encounterId}` | NURSE, ADMIN, BED_MANAGER | — | `BedAllocationRequestResponse[]` | Encounter request history |
| GET | `/api/bed-management/requests/{requestId}/timeline` | NURSE, ADMIN, BED_MANAGER | — | `BedEventResponse[]` | Event timeline |
| GET | `/api/bed-management/wards` | NURSE, ADMIN, BED_MANAGER | — | `WardResponse[]` | Ward occupancy / ward options |
| GET | `/api/bed-management/queue` | ADMIN, BED_MANAGER | — | `BedAllocationRequestResponse[]` | Priority queue (REQUESTED + UNDER_REVIEW) |
| GET | `/api/bed-management/beds` | ADMIN, BED_MANAGER | — | `BedResponse[]` | All beds with current statuses |
| GET | `/api/bed-management/calendar?year=&month=` | ADMIN, BED_MANAGER | — | `BedCalendarDayResponse[]` | Monthly bed status calendar |
| GET | `/api/bed-management/beds/assignable?bedType=&preferredWardId=&excludeBedId=` | ADMIN, BED_MANAGER | — | `BedResponse[]` | Candidate beds for assignment/transfer |
| PUT | `/api/bed-management/requests/{requestId}/review` | ADMIN, BED_MANAGER | `MarkUnderReviewRequest` | `BedAllocationRequestResponse` | Move request to `UNDER_REVIEW` |
| PUT | `/api/bed-management/requests/{requestId}/reject` | ADMIN, BED_MANAGER | `RejectBedAllocationRequest` | `BedAllocationRequestResponse` | Reject request with note |
| PUT | `/api/bed-management/requests/{requestId}/allocate` | ADMIN, BED_MANAGER | `AllocateBedRequest` | `BedAssignmentResponse` | Allocate available bed |
| PUT | `/api/bed-management/assignments/{assignmentId}/admit` | ADMIN, BED_MANAGER | — | `BedAssignmentResponse` | Mark patient admitted |
| PUT | `/api/bed-management/assignments/{assignmentId}/transfer` | ADMIN, BED_MANAGER | `TransferBedRequest` | `BedAssignmentResponse` | Transfer admitted patient to another bed |
| PUT | `/api/bed-management/assignments/{assignmentId}/discharge` | ADMIN, BED_MANAGER | — | `BedAssignmentResponse` | Discharge + release bed |
| GET | `/api/bed-management/dashboard` | ADMIN, BED_MANAGER | — | `BedManagerDashboardResponse` | Queue + occupancy + available beds + active assignments |

### Bed Workflow Query APIs — `/api`

| Method | Path | Roles | Request | Response | Description |
|--------|------|-------|---------|----------|-------------|
| GET | `/api/beds?status=AVAILABLE|OCCUPIED|MAINTENANCE` | ADMIN, NURSE, BED_MANAGER | — | `BedResponse[]` | Status-filtered bed inventory |
| GET | `/api/wards` | ADMIN, NURSE, BED_MANAGER | — | `WardResponse[]` | Ward occupancy snapshot |
| GET | `/api/bed-requests?status=REQUESTED|UNDER_REVIEW|ALLOCATED|REJECTED` | ADMIN, NURSE, BED_MANAGER | — | `BedAllocationRequestResponse[]` | Request list by lifecycle status |
| GET | `/api/bed-assignments?status=ACTIVE|ALLOCATED|ADMITTED|DISCHARGED|COMPLETED` | ADMIN, NURSE, BED_MANAGER | — | `BedAssignmentResponse[]` | Assignment list by status |
| POST | `/api/bed-assignments/{assignmentId}/discharge` | ADMIN, BED_MANAGER | — | `BedAssignmentResponse` | Discharge alias endpoint |

Bed timeline event types used by nurse and bed-manager views:

- `REQUEST_CREATED`, `UNDER_REVIEW`, `REQUEST_REJECTED`
- `BED_ALLOCATED`, `BED_TRANSFERRED`, `PATIENT_ADMITTED`, `PATIENT_DISCHARGED`, `BED_RELEASED`

### Dashboard — `/api/dashboard`

| Method | Path | Roles | Response | Description |
|--------|------|-------|----------|-------------|
| GET | `/api/dashboard/admin` | ADMIN | `DashboardStats` | Admin KPI stats |
| GET | `/api/dashboard/frontdesk` | ADMIN, FRONTDESK | `DashboardStats` | Frontdesk KPI stats |
| GET | `/api/dashboard/doctor` | ADMIN, DOCTOR | `DashboardStats` | Doctor's personal stats |
| GET | `/api/dashboard/admin/daily-trends?from=&to=` | ADMIN | `DailyTrendResponse` | Patient registrations / appointments / consultations per day |
| GET | `/api/dashboard/admin/revenue-trends?from=&to=` | ADMIN | `RevenueTrendResponse` | Daily revenue |

---

## 8. Role-Based Access Control

Feature matrix — what each role can see and do in the frontend:

| Feature | ADMIN | FRONTDESK | DOCTOR | NURSE |
|---------|:-----:|:---------:|:------:|:-----:|
| Admin Dashboard | ✓ | — | — | — |
| Frontdesk Dashboard | ✓ | ✓ | — | — |
| Doctor Dashboard | ✓ | — | ✓ | — |
| Nurse Dashboard | ✓ | — | — | ✓ |
| Patient List | ✓ | ✓ | ✓ | ✓ |
| Register Patient | ✓ | ✓ | — | — |
| Patient Profile | ✓ | ✓ | ✓ | ✓ |
| Appointments | ✓ | ✓ | ✓ (own) | ✓ (view) |
| Book Appointment | ✓ | ✓ | — | — |
| Encounter Queue | ✓ | ✓ | ✓ (own) | ✓ |
| Check-in Patient | ✓ | ✓ | — | — |
| Consultation | ✓ (edit) | — | ✓ (edit) | ✓ (read) |
| Episodes | ✓ | — | ✓ | — |
| Billing | ✓ | ✓ | — | — |
| Service Catalog | ✓ | — | — | — |
| User Management | ✓ | — | — | — |
| Doctor's Patients | ✓ | — | — | ✓ |
| Patient Case View | ✓ | — | — | ✓ |
| Bed Requests | ✓ | — | — | ✓ |

---

## 9. Frontend Architecture

### Routing (`app.routes.ts`)

```
/login                            → LoginComponent (public)
/                                 → redirects to role-specific dashboard
/dashboard                        → AdminDashboardComponent       [adminGuard]
/frontdesk-dashboard              → FrontdeskDashboardComponent   [FRONTDESK, ADMIN]
/doctor-dashboard                 → DoctorDashboardComponent      [DOCTOR, ADMIN]
/nurse-dashboard                  → NurseDashboardComponent       [NURSE, ADMIN]
/patients                         → PatientListComponent          [authGuard]
/patients/new                     → PatientFormComponent          [FRONTDESK, ADMIN]
/patients/:id                     → PatientProfileComponent       [authGuard]
/appointments                     → AppointmentListComponent      [authGuard]
/appointments/new                 → AppointmentFormComponent      [FRONTDESK, ADMIN]
/encounters                       → EncounterQueueComponent       [authGuard]
/encounters/checkin               → EncounterDetailsComponent     [FRONTDESK, ADMIN]
/encounters/:id                   → EncounterDetailsComponent     [authGuard]
/billing                          → BillListComponent             [FRONTDESK, ADMIN]
/billing/create                   → CreateBillComponent          [FRONTDESK, ADMIN]
/billing/:id                      → BillDetailsComponent          [FRONTDESK, ADMIN]
/episodes                         → EpisodeListComponent          [authGuard]
/consultation                     → ConsultationComponent         [authGuard]
/consultation/:encounterId        → ConsultationComponent         [authGuard]
/service-catalog                  → ServiceCatalogComponent       [adminGuard]
/users                            → UserManagementComponent       [adminGuard]
/nurse/doctor-patients            → DoctorPatientsComponent       [NURSE, ADMIN]
/nurse/case/:encounterId          → PatientCaseComponent          [NURSE, ADMIN]
/nurse/bed-requests               → BedRequestComponent           [NURSE, ADMIN]
/bed-manager-dashboard            → BedManagerDashboardComponent  [BED_MANAGER, ADMIN]
/bed-manager/management           → BedManagementWorkspaceComponent [BED_MANAGER, ADMIN]
**                                → /login
```

### MainLayout (Shell)

All authenticated routes render inside `MainLayoutComponent` which provides:
- Collapsible sidebar with role-filtered navigation links
- User info display (username, role badge)
- Logout button
- Subscribes to `authReady$` before rendering to avoid flash of unauthenticated content

### JWT Interceptor

`jwt.interceptor.ts` — functional interceptor registered in `app.config.ts`:
- Reads `accessToken` from `document.cookie`
- Clones each request with `Authorization: Bearer <token>` header
- Does not run on requests to `/api/auth/login` or `/api/auth/refresh`

### DataRefreshService

`data-refresh.service.ts` — a lightweight pub/sub service using `Subject<string>`. Used to notify list components to reload when a related mutation happens in another component (e.g., after booking an appointment, the appointment list and dashboard refresh).

---

## 10. Module Breakdown

### Authentication Module

**Login flow:**
1. User submits `{ username, password }`.
2. `POST /api/auth/login` returns `{ username, role }` + sets cookies.
3. Angular `AuthService.login()` updates `isAuthenticated$` and `currentRole`.
4. `getDashboardRoute()` maps role → appropriate dashboard path.
5. Router navigates to the dashboard.

### Patient Module

Components: `PatientListComponent`, `PatientFormComponent`, `PatientProfileComponent`

- **List**: Loads last 50 patients on init; live search by UHID / name / phone via `GET /api/patients/search`. Subscribes to `dataRefresh('patients')`.
- **Form**: Create only (edit is on profile). Frontdesk/Admin only.
- **Profile**: Tabbed view — Patient Info, Appointments, Encounters, Episodes. Shows "Book Appointment" and "Check In" quick-action buttons. Subscribes to refresh events.

### Appointment Module

Components: `AppointmentListComponent`, `AppointmentFormComponent`

- **List**: Doctors see their own appointments; Frontdesk/Admin see all. Supports Today / All / By Date filter modes. Can update status. Admin can delete.
- **Form**: Doctor dropdown (live from `GET /api/users/doctors`). Patient search by name/UHID/phone. Past-date validation before submit.

### Encounter Module

Components: `EncounterQueueComponent`, `EncounterDetailsComponent`

- **Queue**: Doctors see their own today's queue; others see all. Filter by date. Status badge updates live.
- **Details** (reused for check-in): Loads encounter + patient + linked appointment. Frontdesk: status update + create bill. Doctor: navigate to consultation. Links to bill if created.

### Consultation Module

Component: `ConsultationComponent` (handles both queue view and consultation form)

- Two views: **Queue** (today's encounters list) and **Consultation** (detailed form for selected encounter).
- Loads encounter, patient, episodes, service catalog, and consultation history via `forkJoin`.
- Saves/updates symptoms, diagnosis, prescription, notes, followup date, tests.
- Doctor and Admin can add services to encounter (marks which catalog items are being used).
- Doctor or Admin can create a new episode or link an existing one directly from within the consultation.
- **Change Episode**: If an episode is already linked, a "Change Episode" button allows the doctor/admin to switch to a different existing episode or create a new one. A "Keep Current Episode" cancel button reverts to the current selection.
- **Admin parity**: Admin users see the same left-panel details (patient info, episode panel) and have full edit access to the consultation form — identical to the doctor role.
- Completing a consultation marks the encounter as COMPLETED.
- History search: search past consultations by patient name.

### Episode Module

Component: `EpisodeListComponent`

- Doctors see their own episodes; Admin sees all.
- Filter by status (ACTIVE/CLOSED).
- Create, edit, close episodes. Admin can delete.
- Episodes are referenced from consultation and patient profile tabs.

### Billing Module

Components: `BillListComponent`, `CreateBillComponent`, `BillDetailsComponent`

- **List**: Today / All / By Date / Search (bill number, status) view modes.
- **Create**: Select encounter → creates blank bill → add service items from catalog → save.
- **Details**: View bill items, record payments (CASH, CARD, UPI, INSURANCE), see payment history. Status auto-updates (PENDING → PARTIAL → PAID).

### Service Catalog Module

Component: `ServiceCatalogComponent`

- Admin only. List all services (active + inactive).
- Create, update, soft-delete (set `active=false`) services.
- Price, category, description fields.

### User Management Module

Component: `UserManagementComponent`

- Admin only. List all users with role filter.
- Create user (username, email, password, role).
- Edit user (password optional on edit — validator cleared for updates).
- Toggle enabled/disabled. Delete user.

### Nurse Module

Components: `NurseDashboardComponent`, `DoctorPatientsComponent`, `PatientCaseComponent`, `BedRequestComponent`

- **Dashboard**: Stats — active doctors/encounters, waiting/in-consultation counts, bed request summary. Charts — encounter status doughnut, today vs total bar chart.
- **Doctor's Patients**: Select a doctor from dropdown → load all non-cancelled encounters. Client-side search by name/UHID/phone. Client-side date range filter (from/to) on `visitDate`.
- **Patient Case**: Full case timeline — patient demographics, doctor info, encounter details, consultation notes, bed requests for this encounter. Can raise new bed request from within the case view.
- **Bed Requests**: List all bed requests raised by the current nurse. Status badges (`REQUESTED`, `UNDER_REVIEW`, `ALLOCATED`, `REJECTED`) and full timeline events, including rejection and transfer events.

### Dashboard Module

Four role-specific dashboards, each with:

| Dashboard | Key Stats | Charts |
|-----------|-----------|--------|
| **Admin** | Total patients, encounters today, revenue today, active episodes, total users, etc. | Daily Trends (line: patients / appointments / consultations), Revenue Trend (line) |
| **Frontdesk** | Today's appointments, waiting patients, checked-in, pending bills, today's revenue | Appointment status bar, Visit type distribution pie |
| **Doctor** | Encounter queue size, patients waiting, consultations today/total, follow-up patients, active episodes | Consultation trend bar, Episode type distribution doughnut |
| **Nurse** | Active doctors, active encounters, waiting/in-consultation/completed today, bed request stats | Encounter status doughnut, Today vs total bar |

All dashboards use `ChangeDetectorRef.detectChanges()` before `setTimeout(() => renderCharts(), 100)` to ensure `*ngIf`-controlled canvas elements are in the DOM before Chart.js renders.

---

## 11. Business Workflows

### 1. Patient Registration → Appointment → Check-in → Consultation → Billing

```
Frontdesk                     Doctor                        Nurse
────────                      ──────                        ─────
1. Register patient
   POST /api/patients
   (UHID auto-assigned)

2. Book appointment
   POST /api/appointments
   (status: SCHEDULED)

3. Patient arrives:
   Check in
   POST /api/encounters/checkin
   (status: WAITING)
   (links appointmentId)
   PUT /api/appointments/{id}/status
     → CHECKED_IN

                              4. Queue appears on
                                 /encounters/doctor/today

                              5. Start consultation
                                 (status: IN_CONSULTATION)
                                 PUT /api/encounters/{id}/status

                              6. Save consultation
                                 POST /api/consultations
                                 (diagnosis, prescription, etc.)

                              7. Complete
                                 PUT /api/consultations/{id}/complete
                                 → encounter status: COMPLETED

4. Create bill
   POST /api/bills/create/{encounterId}

5. Add services
   POST /api/bills/{billId}/items (repeat)

6. Collect payment
   POST /api/bills/{billId}/pay
   → paymentStatus: PAID
```

### 2. Nurse Workflow — Patient Case Monitoring

```
Nurse
─────
1. Open /nurse/doctor-patients
   → Select doctor from dropdown
   → GET /api/nurse/doctor/{doctorId}/patients
   → Search/filter encounters

2. Open patient case
   → GET /api/nurse/case/{encounterId}
   → View: patient demographics, doctor, encounter, consultation notes

3. Raise bed request if IPD
   → POST /api/bed-management/requests
   → status: REQUESTED

4. Admin/BedManager reviews
   → GET /api/bed-management/queue
   → PUT /api/bed-management/requests/{id}/review
   → PUT /api/bed-management/requests/{id}/allocate
   → status: ALLOCATED (bed number assigned)

5. Discharge lifecycle
   → PUT /api/bed-management/assignments/{id}/discharge
   → assignment status: COMPLETED
   → bed status: AVAILABLE
```

### 3. Episode (Care Plan) Management

```
Doctor / Admin
──────────────
1. During consultation: create episode
   POST /api/episodes
   (type: CHRONIC_DISEASE / SURGERY / etc.)

2. Link to current encounter
   PUT /api/encounters/{id}/link-episode/{episodeId}

3. Future visits: link existing episode to new encounter
   (same PUT endpoint)

4. Change linked episode:
   Click "Change Episode" → select different episode or create new
   (replaces the current episode link on the encounter)

5. When condition resolved:
   PUT /api/episodes/{id}/close
   → status: CLOSED
```

### 4. Logout / Session Expiry

```
User clicks Logout
  → AuthService.logout()
  → POST /api/auth/logout
  → Backend: blacklists token in Redis, clears cookies
  → Frontend: clearSession() → navigate to /login

Token expired (no logout)
  → jwtInterceptor sends expired token
  → Server returns 401
  → JwtAuthenticationEntryPoint returns 401
  → Angular (optionally) calls POST /api/auth/refresh using httpOnly refreshToken cookie
```

---

## 12. Frontend Services

### `AuthService` (`/api/auth`)

| Method | HTTP | Endpoint | Description |
|--------|------|----------|-------------|
| `login(request)` | POST | `/auth/login` | Authenticate, set cookies |
| `logout()` | POST | `/auth/logout` | Blacklist + clear cookies |
| `isLoggedIn()` | — | — | Returns `!!currentUsername` |
| `getUserRole()` | — | — | Returns current `Role` |
| `getUsername()` | — | — | Returns current username |
| `hasAnyRole(roles[])` | — | — | Role check |
| `getDashboardRoute()` | — | — | Returns `/dashboard` / `/doctor-dashboard` / etc. |

### `PatientService` (`/api/patients`)

| Method | HTTP | Endpoint |
|--------|------|----------|
| `createPatient(request)` | POST | `/patients` |
| `getPatientById(id)` | GET | `/patients/{id}` |
| `searchPatients(query)` | GET | `/patients/search?query=` |
| `getRecentPatients()` | GET | `/patients/recent` |
| `updatePatient(id, request)` | PUT | `/patients/{id}` |
| `deletePatient(id)` | DELETE | `/patients/{id}` |

### `AppointmentService` (`/api/appointments`)

| Method | HTTP | Endpoint |
|--------|------|----------|
| `createAppointment(request)` | POST | `/appointments` |
| `getAppointmentById(id)` | GET | `/appointments/{id}` |
| `getAppointmentsByPatient(patientId)` | GET | `/appointments/patient/{patientId}` |
| `updateAppointmentStatus(id, status)` | PUT | `/appointments/{id}/status?status=` |
| `getTodayAppointments()` | GET | `/appointments/today` |
| `getDoctorTodayAppointments()` | GET | `/appointments/doctor/today` |
| `getAppointmentsByDate(date)` | GET | `/appointments/by-date?date=` |
| `getDoctorAllAppointments()` | GET | `/appointments/doctor/all` |
| `getDoctorAppointmentsByDate(date)` | GET | `/appointments/doctor/by-date?date=` |
| `deleteAppointment(id)` | DELETE | `/appointments/{id}` |

### `EncounterService` (`/api/encounters`)

| Method | HTTP | Endpoint |
|--------|------|----------|
| `checkInPatient(request)` | POST | `/encounters/checkin` |
| `getEncounterById(id)` | GET | `/encounters/{id}` |
| `getEncountersByPatient(patientId)` | GET | `/encounters/patient/{patientId}` |
| `updateEncounterStatus(id, status)` | PUT | `/encounters/{id}/status?status=` |
| `linkEpisodeToEncounter(encounterId, episodeId)` | PUT | `/encounters/{encounterId}/link-episode/{episodeId}` |
| `getTodayEncounters()` | GET | `/encounters/today` |
| `getDoctorTodayEncounters()` | GET | `/encounters/doctor/today` |
| `getEncountersByDate(date)` | GET | `/encounters/by-date?date=` |
| `getDoctorAllEncounters()` | GET | `/encounters/doctor/all` |
| `getDoctorEncountersByDate(date)` | GET | `/encounters/doctor/by-date?date=` |

### `ConsultationService` (`/api/consultations`)

| Method | HTTP | Endpoint |
|--------|------|----------|
| `createConsultation(request)` | POST | `/consultations` |
| `getConsultationById(id)` | GET | `/consultations/{id}` |
| `getConsultationByEncounter(encounterId)` | GET | `/consultations/encounter/{encounterId}` |
| `updateConsultation(id, request)` | PUT | `/consultations/{id}` |
| `completeConsultation(id)` | PUT | `/consultations/{id}/complete` |
| `getConsultationsByDoctor(username)` | GET | `/consultations/doctor/{username}` |
| `searchConsultations({ patientName, patientId })` | GET | `/consultations/search` |
| `getTodayConsultations()` | GET | `/consultations/today` |

### `EpisodeService` (`/api/episodes`)

| Method | HTTP | Endpoint |
|--------|------|----------|
| `createEpisode(request)` | POST | `/episodes` |
| `getEpisodes(filters?)` | GET | `/episodes?patientId=&status=` |
| `getEpisodesByPatient(patientId)` | GET | `/episodes/patient/{patientId}` |
| `getDoctorEpisodes()` | GET | `/episodes/doctor` |
| `updateEpisode(id, request)` | PUT | `/episodes/{id}` |
| `closeEpisode(id)` | PUT | `/episodes/{id}/close` |
| `deleteEpisode(id)` | DELETE | `/episodes/{id}` |

### `BillingService` (`/api/bills`)

| Method | HTTP | Endpoint |
|--------|------|----------|
| `createBill(encounterId)` | POST | `/bills/create/{encounterId}` |
| `addBillItem(billId, request)` | POST | `/bills/{billId}/items` |
| `getBill(billId)` | GET | `/bills/{billId}` |
| `payBill(billId, request)` | POST | `/bills/{billId}/pay` |
| `getBillByEncounter(encounterId)` | GET | `/bills/encounter/{encounterId}` |
| `getTodayBills()` | GET | `/bills/today` |
| `getPendingBills()` | GET | `/bills/pending` |
| `getAllBills()` | GET | `/bills/all` |
| `getBillsByDate(date)` | GET | `/bills/by-date?date=` |
| `searchBills({ billNumber, status })` | GET | `/bills/search` |
| `deleteBill(id)` | DELETE | `/bills/{id}` |

### `ServiceCatalogService` (`/api/services`)

| Method | HTTP | Endpoint |
|--------|------|----------|
| `getAllServices()` | GET | `/services` |
| `createService(request)` | POST | `/services` |
| `updateService(id, request)` | PUT | `/services/{id}` |
| `deleteService(id)` | DELETE | `/services/{id}` |

### `NurseService` (`/api/nurse`)

| Method | HTTP | Endpoint |
|--------|------|----------|
| `getDoctors()` | GET | `/nurse/doctors` |
| `getDoctorPatients(doctorId)` | GET | `/nurse/doctor/{doctorId}/patients` |
| `getPatientCase(encounterId)` | GET | `/nurse/case/{encounterId}` |
| `getDashboardStats()` | GET | `/nurse/dashboard-stats` |

### `BedManagementService` (`/api/bed-management` + `/api`)

| Method | HTTP | Endpoint |
|--------|------|----------|
| `getPriorityQueue()` | GET | `/bed-management/queue` |
| `markUnderReview(requestId, notes?)` | PUT | `/bed-management/requests/{requestId}/review` |
| `allocateBed(requestId, bedId, notes?)` | PUT | `/bed-management/requests/{requestId}/allocate` |
| `rejectRequest(requestId, notes)` | PUT | `/bed-management/requests/{requestId}/reject` |
| `createAllocationRequest(payload)` | POST | `/bed-management/requests` |
| `getRequestsByEncounter(encounterId)` | GET | `/bed-management/requests/encounter/{encounterId}` |
| `getRequestTimeline(requestId)` | GET | `/bed-management/requests/{requestId}/timeline` |
| `getAssignableBeds(bedType, preferredWardId?, excludeBedId?)` | GET | `/bed-management/beds/assignable` |
| `admitPatient(assignmentId)` | PUT | `/bed-management/assignments/{assignmentId}/admit` |
| `dischargePatient(assignmentId)` | PUT | `/bed-management/assignments/{assignmentId}/discharge` |
| `getWardOccupancy()` | GET | `/wards` |
| `getBeds(status?)` | GET | `/beds?status=` |
| `getAssignmentsByStatus(status?)` | GET | `/bed-assignments?status=` |

### `DashboardService` (`/api/dashboard`)

| Method | HTTP | Endpoint |
|--------|------|----------|
| `getAdminStats()` | GET | `/dashboard/admin` |
| `getFrontdeskStats()` | GET | `/dashboard/frontdesk` |
| `getDoctorStats()` | GET | `/dashboard/doctor` |
| `getDailyTrends(from, to)` | GET | `/dashboard/admin/daily-trends?from=&to=` |
| `getRevenueTrends(from, to)` | GET | `/dashboard/admin/revenue-trends?from=&to=` |

### `UserService` (`/api/users`)

| Method | HTTP | Endpoint |
|--------|------|----------|
| `getAllUsers()` | GET | `/users` |
| `getUserById(id)` | GET | `/users/{id}` |
| `getDoctors()` | GET | `/users/doctors` |
| `createUser(request)` | POST | `/users` |
| `updateUser(id, request)` | PUT | `/users/{id}` |
| `deleteUser(id)` | DELETE | `/users/{id}` |

---

## 13. Data Models

### TypeScript Models (`hms.model.ts`)

```typescript
// Auth models (auth.model.ts)
AuthRequest       { username, password }
AuthResponse      { username, role }
User              { id?, username, email, role, enabled? }
UserRequest       { username, email, password, role }

// Patient
Patient           { id, uhid, firstName, lastName, gender, dob, phone, email, address,
                    bloodGroup, emergencyContact, allergies, insuranceProvider, createdAt, updatedAt }
PatientRequest    { firstName, lastName, gender, dob, phone, email, address,
                    bloodGroup?, emergencyContact?, allergies?, insuranceProvider? }

// Appointment
Appointment       { id, patientId, patientName, patientUhid, doctorId, doctorName,
                    appointmentTime, status, reasonForVisit, notes, priority, department, createdBy, createdAt }
AppointmentRequest { patientId, doctorId, appointmentTime, reasonForVisit?, notes?, priority?, department? }
AppointmentStatus  = 'SCHEDULED'|'CHECKED_IN'|'CANCELLED'|'NO_SHOW'|'COMPLETED'

// Encounter
Encounter         { id, encounterNumber, patientId, patientName, patientUhid, doctorId, doctorName,
                    episodeId, appointmentId, visitType, status, visitDate, checkinTime,
                    priority, notes, roomNumber, createdBy, createdAt, updatedAt }
EncounterRequest  { patientId, doctorId, appointmentId?, episodeId?, visitType, priority?, notes?, roomNumber? }
VisitType          = 'OPD'|'IPD'
EncounterStatus    = 'WAITING'|'IN_CONSULTATION'|'COMPLETED'|'CANCELLED'

// Consultation
Consultation      { id, encounterId, patientName, patientUhid, doctorName, patientId, doctorId,
                    symptoms, diagnosis, prescription, doctorNotes, followupDate, testsRequested,
                    createdBy, createdAt, updatedAt }
ConsultationRequest { encounterId, symptoms?, diagnosis, prescription, doctorNotes?, followupDate?, testsRequested? }

// Episode
Episode           { id, patientId, patientName, patientUhid, episodeType, description, startDate,
                    endDate, startTime, endTime, status, severity, notes, diagnosisSummary, createdBy, createdAt }
EpisodeRequest    { patientId, episodeType, description, startDate?, startTime?, endDate?, endTime?,
                    severity?, notes?, diagnosisSummary? }

// Billing
Bill              { id, billNumber, encounterId, patientName, patientUhid, patientId,
                    totalAmount, paidAmount, paymentStatus, paymentMethod, items[], createdAt }
BillItem          { id, billId, serviceId, serviceName, price, quantity, subtotal }
BillItemRequest   { serviceId, quantity }
PaymentRequest    { amount, paymentMethod }
PaymentStatus      = 'PENDING'|'PARTIAL'|'PAID'

// Service Catalog
ServiceCatalogItem  { id, name, price, description, category, active, createdAt }
ServiceCatalogRequest { name, price, description?, category? }

// Nurse-specific
DoctorOption      { id, username, email }
DoctorPatientItem { encounterId, encounterNumber, patientId, patientName, patientUhid, gender, phone,
                    encounterStatus, visitType, priority, visitDate, checkinTime, notes, roomNumber }
PatientCaseTimeline { encounterId, encounterNumber, encounterStatus, visitType, priority, visitDate,
                      checkinTime, encounterNotes, roomNumber, patientId, patientName, patientUhid,
                      gender, dob, phone, bloodGroup, allergies, doctorId, doctorName,
                      consultationId, symptoms, diagnosis, prescription, doctorNotes,
                      followupDate, testsRequested, consultationCreatedAt }
NurseDashboardStats { totalActiveDoctors, totalActiveEncounters, waitingPatients, inConsultationPatients,
                      completedToday, todayEncounters, todayConsultations, totalEncounters, totalPatients,
                      totalConsultations, totalDoctors, myPendingBedRequests, myTotalBedRequests,
                      totalPendingBedRequests, totalBedRequests }

// Bed Requests
BedRequestStatus   = 'PENDING'|'APPROVED'|'ALLOCATED'|'REJECTED'|'CANCELLED'
BedRequestItem    { id, encounterId, encounterNumber, patientId, patientName, patientUhid,
                    requestedBy, requestedByName, status, reason, preferredWard,
                    allocatedBedNumber, allocatedWard, rejectionReason, createdAt, updatedAt }
BedRequestCreate  { encounterId, patientId, reason, preferredWard? }

// Dashboard
DashboardStats    { ...admin fields, ...frontdesk fields, ...doctor fields }
DailyTrendResponse  { labels[], patientRegistrations[], appointments[], consultations[] }
RevenueTrendResponse { labels[], revenueData[] }
```

### Enums

```typescript
// Frontend (role.enum.ts)
enum Role { ADMIN, FRONTDESK, DOCTOR, NURSE, BED_MANAGER }

// Backend (Java)
enum Role           { ADMIN, FRONTDESK, DOCTOR, NURSE, BED_MANAGER }
enum AppointmentStatus { SCHEDULED, CHECKED_IN, CANCELLED, NO_SHOW, COMPLETED }
enum EncounterStatus   { WAITING, IN_CONSULTATION, COMPLETED, CANCELLED }
enum VisitType         { OPD, IPD }
enum Priority          { NORMAL, URGENT, EMERGENCY }
enum PaymentStatus     { PENDING, PARTIAL, PAID }
enum BedRequestStatus  { PENDING, APPROVED, ALLOCATED, REJECTED, CANCELLED }
enum EpisodeType       { CHRONIC_DISEASE, SURGERY, INJURY, INFECTION, MENTAL_HEALTH, OTHER }
```

---

## 14. Configuration

### Backend (`application.properties`)

```properties
spring.datasource.url=${DB_URL:jdbc:mysql://localhost:3306/medicaldb}
spring.datasource.username=${DB_USERNAME:root}
spring.datasource.password=${DB_PASSWORD:Artem@123}
spring.jpa.hibernate.ddl-auto=update
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect
server.port=8080

jwt.secret=${JWT_SECRET:404E635266...}
jwt.expiration=${JWT_EXPIRATION:86400000}         # 24 hours
jwt.refresh-expiration=${JWT_REFRESH_EXPIRATION:604800000}  # 7 days

cookie.secure=${COOKIE_SECURE:false}              # true in production (HTTPS)
```

### Frontend (`environment.ts`)

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};
```

### CORS

The backend allows requests only from `http://localhost:4200` (`GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`) with credentials. For production, update `corsConfigurationSource()` in `SecurityConfig.java` with the deployed frontend URL.

### Default Admin Account

`DataInitializer.java` seeds default users and bed infrastructure on first run (idempotent):
- Users: `admin`, `frontdesk`, `doctor`, `nurse`, `bedmanager`
- Wards: `ICU` (10), `GENERAL` (30), `PRIVATE` (10)
- Beds: `ICU-1..ICU-10`, `GENERAL-1..GENERAL-30`, `PRIVATE-1..PRIVATE-10` (all `AVAILABLE`)

Change this immediately in production.

---

*Generated from source: `/home/artemht/Desktop/HMS`*


---

## 📝 Recent Updates (2026-03-19)

### Feature Enhancements

#### 1. ✅ Bed Management Search Functionality
- **Added**: Search bar in Bed Management Workspace
- **Location**: `Frontend/src/app/features/dashboards/bed-manager/bed-management-workspace.component.ts`
- **Features**:
  - Search beds by bed number, ward name, bed type, or status
  - Real-time filtering as user types
  - Clear search button
  - Filters across all beds (not just available)
- **Usage**: Type in search box to filter beds instantly

#### 2. ✅ Consultation Module Cleanup
- **Removed**: "Available Services" section from consultation page
- **Reason**: Services should only be managed in billing module
- **Impact**: Cleaner consultation interface focused on medical care
- **Files Modified**:
  - `Frontend/src/app/features/consultation/consultation.component.html`
  - `Frontend/src/app/features/consultation/consultation.component.ts`
- **Removed Code**:
  - Service catalog service injection
  - Service selection logic (`toggleService` method)
  - `services` and `selectedServices` properties
  - Service panel UI

#### 3. ✅ Bed Maintenance Status
- **Status**: Already implemented
- **Enum**: `BedStatus.MAINTENANCE` exists in backend
- **API**: `PUT /api/bed-management/beds/{bedId}/status` endpoint available
- **Usage**: Bed Manager and Admin can mark beds as MAINTENANCE
- **Effect**: Beds marked as MAINTENANCE are excluded from allocation

### Verified Features

#### 1. ✅ Dashboard Charts Update Properly
- **Admin Dashboard**: Daily trends and revenue charts refresh on date range change
- **Doctor Dashboard**: Encounter and episode charts load on component init
- **Nurse Dashboard**: Encounter status and today vs total charts render correctly
- **Implementation**: Charts use Chart.js 4 with proper lifecycle management

#### 2. ✅ Patient Timeline Updates
- **Verified**: All patient-related operations update timeline
- **Operations Tracked**:
  - Patient registration
  - Appointment creation/updates
  - Encounter check-in
  - Consultation creation/updates
  - Episode creation/linking
  - Bed allocation requests
  - Bill creation
- **Audit Trail**: All entities extend `BaseEntity` with JPA auditing

### Code Quality Improvements

#### Removed Unused Code
- Service catalog integration from consultation component
- Duplicate service selection logic
- Unused imports and dependencies

#### Performance Optimizations
- Bed search uses client-side filtering (no API calls)
- Chart instances properly destroyed on component cleanup
- RxJS subscriptions properly unsubscribed using `takeUntil`

### Testing Checklist

- [x] Bed search filters correctly by all fields
- [x] Consultation saves without service selection
- [x] Admin can access consultation module
- [x] Doctor can access consultation module
- [x] Charts render and update properly
- [x] No TypeScript compilation errors
- [x] No console errors in browser

---

