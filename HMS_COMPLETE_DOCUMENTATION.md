# Hospital Management System (HMS) - Complete Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [Database Schema](#database-schema)
5. [Authentication & Security](#authentication--security)
6. [API Documentation](#api-documentation)
7. [Features & Workflows](#features--workflows)
8. [Real-Time Features](#real-time-features)
9. [Frontend Architecture](#frontend-architecture)
10. [Setup & Configuration](#setup--configuration)
11. [Deployment Guide](#deployment-guide)
12. [Testing](#testing)

---

## 1. Project Overview

### What is HMS?
Hospital Management System (HMS) is a comprehensive full-stack web application designed to manage hospital operations including patient registration, appointments, consultations, billing, bed management, and more.

### Key Capabilities
- **Patient Management**: Registration, search, profile management with auto-generated UHID
- **Appointment Scheduling**: Book, reschedule, cancel appointments with status tracking
- **Encounter Management**: Patient check-in, visit tracking (OPD/IPD), priority levels
- **Consultation Workflow**: Doctor consultations with diagnosis, prescriptions, follow-ups
- **Episode/Care Plans**: Track chronic diseases, surgeries, injuries, and treatment plans
- **Billing System**: Create bills, add services, track payments
- **Bed Management**: Complete workflow from request to allocation to discharge
- **Nurse Operations**: Patient case monitoring, doctor patient lists
- **Role-Based Dashboards**: Customized views for Admin, Frontdesk, Doctor, Nurse, Bed Manager
- **Real-Time Notifications**: WebSocket STOMP + Email notifications
- **Audit Trail**: Complete tracking of who created/updated records and when

### User Roles
1. **ADMIN**: Full system access, user management, system configuration
2. **FRONTDESK**: Patient registration, appointment booking, billing
3. **DOCTOR**: Consultations, prescriptions, episode management
4. **NURSE**: Patient monitoring, bed requests, case management
5. **BED_MANAGER**: Bed allocation, ward management, occupancy tracking

---

## 2. Technology Stack

### Backend
- **Language**: Java 21
- **Framework**: Spring Boot 3.5.11
- **Security**: Spring Security 6 with JWT authentication
- **Database**: MySQL 8 with JPA/Hibernate ORM
- **Real-Time**: Spring WebSocket with STOMP protocol
- **Email**: Spring Mail with async support
- **Build Tool**: Maven
- **Libraries**: 
  - JJWT 0.11.5 (JWT tokens)
  - Lombok (boilerplate reduction)
  - BCrypt (password hashing)
  - SockJS (WebSocket fallback)

### Frontend
- **Language**: TypeScript 5.9
- **Framework**: Angular 21 (standalone components)
- **UI Library**: PrimeNG (tables, forms, dialogs)
- **Charts**: Chart.js 4.5.1 with ng2-charts 8.0.0
- **Calendar**: FullCalendar 6.x with Angular integration
- **State Management**: RxJS (reactive programming)
- **WebSocket Client**: @stomp/stompjs 7.3.0, sockjs-client 1.6.1
- **HTTP Client**: Angular HttpClient with JWT interceptor
- **Build Tool**: Angular CLI with Vite

**Chart.js Features**:
- Line charts for trends and time-series data
- Bar charts for comparisons and distributions
- Doughnut charts for proportions and percentages
- Mixed charts for multi-dataset visualizations
- Responsive design with professional styling
- Interactive tooltips and legends
- Smooth animations

**FullCalendar Features**:
- Month, week, and day views
- Drag-and-drop appointment scheduling
- Color-coded events by status
- Click events for appointment details
- Responsive design for mobile
- Time grid for detailed scheduling
- Event filtering and search

### Database
- **RDBMS**: MySQL 8
- **ORM**: Hibernate with Spring Data JPA
- **Connection Pool**: HikariCP (default in Spring Boot)
- **Migrations**: JPA auto-update (ddl-auto=update)

### Infrastructure
- **WebSocket**: STOMP over SockJS for real-time communication
- **Email**: SMTP (Gmail, SendGrid, AWS SES supported)
- **Authentication**: JWT tokens stored in HTTP-only cookies
- **CORS**: Configured for cross-origin requests

---

## 3. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Angular 21)                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Components (Patients, Appointments, Encounters, etc)  │ │
│  └────────────────────┬───────────────────────────────────┘ │
│                       │                                      │
│  ┌────────────────────▼───────────────────────────────────┐ │
│  │  Services (HTTP + WebSocket)                           │ │
│  │  - AuthService, PatientService, NotificationService    │ │
│  └────────────────────┬───────────────────────────────────┘ │
│                       │                                      │
│  ┌────────────────────▼───────────────────────────────────┐ │
│  │  Guards & Interceptors                                 │ │
│  │  - authGuard, roleGuard, jwtInterceptor                │ │
│  └────────────────────┬───────────────────────────────────┘ │
└───────────────────────┼──────────────────────────────────────┘
                        │
                        │ HTTP/HTTPS + WebSocket
                        │
┌───────────────────────▼──────────────────────────────────────┐
│                 BACKEND (Spring Boot 3.5.11)                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Controllers (REST APIs)                               │ │
│  │  - AuthController, PatientController, etc              │ │
│  └────────────────────┬───────────────────────────────────┘ │
│                       │                                      │
│  ┌────────────────────▼───────────────────────────────────┐ │
│  │  Security Layer                                        │ │
│  │  - JwtAuthenticationFilter, SecurityConfig             │ │
│  └────────────────────┬───────────────────────────────────┘ │
│                       │                                      │
│  ┌────────────────────▼───────────────────────────────────┐ │
│  │  Services (Business Logic)                             │ │
│  │  - PatientService, AppointmentService, etc             │ │
│  └────────────────────┬───────────────────────────────────┘ │
│                       │                                      │
│  ┌────────────────────▼───────────────────────────────────┐ │
│  │  Repositories (Data Access)                            │ │
│  │  - JPA Repositories with custom queries                │ │
│  └────────────────────┬───────────────────────────────────┘ │
└───────────────────────┼──────────────────────────────────────┘
                        │
                        │ JDBC
                        │
┌───────────────────────▼──────────────────────────────────────┐
│                      MySQL Database                          │
│  - users, patients, appointments, encounters, bills, etc     │
└──────────────────────────────────────────────────────────────┘
```


### Module Structure

**Backend Modules:**
```
HMS-backend/src/main/java/com/example/HMS_backend/
├── config/                    # Configuration classes
│   ├── JpaAuditingConfig     # Audit trail configuration
│   ├── WebSocketConfig       # WebSocket STOMP configuration
│   └── DataInitializer       # Initial data seeding
├── security/                  # Security & Authentication
│   ├── auth/                 # Login, logout, token refresh
│   ├── jwt/                  # JWT service, filter, entry point
│   ├── config/               # Security configuration
│   ├── token/                # Refresh token management
│   └── enums/                # Role enum
├── user/                      # User management
├── patient/                   # Patient management
├── appointment/               # Appointment scheduling
├── encounter/                 # Patient encounters/visits
├── consultation/              # Doctor consultations
├── episode/                   # Care plans/episodes
├── billing/                   # Billing & payments
├── servicecatalog/            # Medical services catalog
├── bedmanagement/             # Bed allocation workflow
├── nurse/                     # Nurse operations
├── dashboard/                 # Analytics & metrics
├── notification/              # Notifications (WebSocket + Email)
├── entity/                    # Base entities (User, BaseEntity)
├── repository/                # Common repositories
├── exception/                 # Global exception handling
└── util/                      # Utility classes (ID generators)
```

**Frontend Structure:**
```
Frontend/src/app/
├── core/                      # Core functionality
│   ├── guards/               # Route guards (auth, role, admin)
│   ├── interceptors/         # HTTP interceptors (JWT)
│   ├── services/             # Core services (auth, API services)
│   ├── models/               # TypeScript interfaces
│   └── enums/                # Enums (Role, Status, etc)
├── features/                  # Feature modules
│   ├── authentication/       # Login component
│   ├── patients/             # Patient management
│   ├── appointments/         # Appointment scheduling
│   ├── encounters/           # Encounter management
│   ├── consultations/        # Consultation forms
│   ├── episodes/             # Episode management
│   ├── billing/              # Billing interface
│   ├── service-catalog/      # Service management
│   ├── bed-management/       # Bed management
│   ├── nurse/                # Nurse operations
│   ├── users/                # User management
│   └── dashboard/            # Dashboards
├── layout/                    # Layout components
│   └── main-layout/          # Main shell with sidebar
└── shared/                    # Shared components
    └── components/           # Reusable components
```

---

## 4. Database Schema

### Entity Relationship Diagram

```
users (1) ──────────── (many) appointments
  │                              │
  │                              │
  │                              ▼
  │                         patients (1) ──── (many) encounters
  │                              │                    │
  │                              │                    │
  │                              │                    ├──── (1:1) consultations
  │                              │                    │
  │                              │                    ├──── (many:1) episodes
  │                              │                    │
  │                              │                    ├──── (1:1) bills
  │                              │                    │         │
  │                              │                    │         └──── (many) bill_items
  │                              │                    │
  │                              │                    └──── (many) bed_allocation_requests
  │                              │                              │
  │                              │                              └──── (1:1) bed_assignments
  │                              │                                          │
  │                              │                                          ▼
  │                              │                                      beds (many:1) wards
  │                              │
  └────────────────────────────  └──── (many) episodes
  
notifications (target_user FK to users.username OR target_role)
refresh_tokens (user_id FK to users.id)
service_catalog (referenced by bill_items)
bed_events (timeline for bed_allocation_requests)
```

### Table Definitions

#### users
```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,  -- BCrypt hashed
    role VARCHAR(50) NOT NULL,       -- ADMIN, DOCTOR, FRONTDESK, NURSE, BED_MANAGER
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);
```

#### patients
```sql
CREATE TABLE patients (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    uhid VARCHAR(20) UNIQUE NOT NULL,  -- Auto-generated: UHID-YYYYMMDD-XXXX
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    gender VARCHAR(10) NOT NULL,
    dob DATE,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    blood_group VARCHAR(5),
    emergency_contact VARCHAR(20),
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);
```

#### appointments
```sql
CREATE TABLE appointments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    appointment_time DATETIME NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',  -- SCHEDULED, CHECKED_IN, CANCELLED, COMPLETED
    reason_for_visit VARCHAR(20),
    notes TEXT,
    priority VARCHAR(100),
    department VARCHAR(100),
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (doctor_id) REFERENCES users(id)
);
```


#### encounters
```sql
CREATE TABLE encounters (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    encounter_number VARCHAR(50) UNIQUE NOT NULL,  -- Auto-generated: ENC-YYYYMMDD-XXXX
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    episode_id BIGINT,
    appointment_id BIGINT,
    visit_type VARCHAR(50) NOT NULL,  -- OPD, IPD, EMERGENCY
    status VARCHAR(50) NOT NULL DEFAULT 'WAITING',  -- WAITING, IN_CONSULTATION, COMPLETED, CANCELLED
    visit_date DATETIME,
    checkin_time DATETIME,
    priority VARCHAR(50) NOT NULL DEFAULT 'NORMAL',  -- URGENT, HIGH, NORMAL, LOW
    notes TEXT,
    room_number VARCHAR(20),
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (doctor_id) REFERENCES users(id),
    FOREIGN KEY (episode_id) REFERENCES episodes(id),
    FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);
```

#### consultations
```sql
CREATE TABLE consultations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    encounter_id BIGINT UNIQUE NOT NULL,  -- 1:1 relationship
    doctor_id BIGINT NOT NULL,
    patient_id BIGINT NOT NULL,
    consultation_date DATE NOT NULL,
    chief_complaint TEXT,
    diagnosis TEXT,
    prescription TEXT,
    follow_up_date DATE,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'IN_PROGRESS',  -- IN_PROGRESS, COMPLETED
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    FOREIGN KEY (encounter_id) REFERENCES encounters(id),
    FOREIGN KEY (doctor_id) REFERENCES users(id),
    FOREIGN KEY (patient_id) REFERENCES patients(id)
);
```

#### episodes
```sql
CREATE TABLE episodes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    episode_type VARCHAR(50) NOT NULL,  -- CHRONIC_DISEASE, SURGERY, INJURY, MATERNITY, MENTAL_HEALTH, etc.
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE, CLOSED
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (doctor_id) REFERENCES users(id)
);
```


#### bills
```sql
CREATE TABLE bills (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    bill_number VARCHAR(50) UNIQUE NOT NULL,  -- Auto-generated: BILL-YYYYMMDD-XXXX
    encounter_id BIGINT UNIQUE NOT NULL,  -- 1:1 relationship
    patient_id BIGINT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',  -- PENDING, PARTIAL, PAID
    payment_method VARCHAR(50),  -- CASH, CARD, UPI, INSURANCE
    bill_date DATE NOT NULL,
    due_date DATE,
    notes TEXT,
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    FOREIGN KEY (encounter_id) REFERENCES encounters(id),
    FOREIGN KEY (patient_id) REFERENCES patients(id)
);
```

#### bill_items
```sql
CREATE TABLE bill_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    bill_id BIGINT NOT NULL,
    service_id BIGINT NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES service_catalog(id)
);
```

#### service_catalog
```sql
CREATE TABLE service_catalog (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    service_code VARCHAR(50) UNIQUE NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),  -- CONSULTATION, LAB_TEST, IMAGING, PROCEDURE, MEDICATION
    price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);
```

#### wards
```sql
CREATE TABLE wards (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    ward_name VARCHAR(100) UNIQUE NOT NULL,
    ward_type VARCHAR(50) NOT NULL,  -- ICU, GENERAL, PRIVATE, SEMI_PRIVATE
    total_beds INT NOT NULL,
    available_beds INT NOT NULL,
    floor_number INT,
    created_at DATETIME NOT NULL,
    updated_at DATETIME
);
```

#### beds
```sql
CREATE TABLE beds (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    ward_id BIGINT NOT NULL,
    bed_number VARCHAR(20) NOT NULL,
    bed_type VARCHAR(50) NOT NULL,  -- ICU, GENERAL, PRIVATE, SEMI_PRIVATE
    status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',  -- AVAILABLE, OCCUPIED, MAINTENANCE, RESERVED
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    UNIQUE KEY unique_ward_bed (ward_id, bed_number),
    FOREIGN KEY (ward_id) REFERENCES wards(id)
);
```


#### bed_allocation_requests
```sql
CREATE TABLE bed_allocation_requests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    encounter_id BIGINT NOT NULL,
    patient_id BIGINT NOT NULL,
    requested_by VARCHAR(100) NOT NULL,  -- Nurse username
    bed_type VARCHAR(50) NOT NULL,
    priority VARCHAR(50) NOT NULL DEFAULT 'NORMAL',  -- URGENT, HIGH, NORMAL, LOW
    preferred_ward_id BIGINT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',  -- PENDING, UNDER_REVIEW, ALLOCATED, REJECTED, CANCELLED
    reason TEXT,
    notes TEXT,
    reviewed_by VARCHAR(100),
    reviewed_at DATETIME,
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    FOREIGN KEY (encounter_id) REFERENCES encounters(id),
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (preferred_ward_id) REFERENCES wards(id)
);
```

#### bed_assignments
```sql
CREATE TABLE bed_assignments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    request_id BIGINT UNIQUE NOT NULL,  -- 1:1 with allocation request
    encounter_id BIGINT NOT NULL,
    patient_id BIGINT NOT NULL,
    bed_id BIGINT NOT NULL,
    assigned_by VARCHAR(100) NOT NULL,  -- Bed manager username
    admission_time DATETIME,
    discharge_time DATETIME,
    status VARCHAR(50) NOT NULL DEFAULT 'ALLOCATED',  -- ALLOCATED, ADMITTED, DISCHARGED
    notes TEXT,
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    FOREIGN KEY (request_id) REFERENCES bed_allocation_requests(id),
    FOREIGN KEY (encounter_id) REFERENCES encounters(id),
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (bed_id) REFERENCES beds(id)
);
```

#### bed_events
```sql
CREATE TABLE bed_events (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    request_id BIGINT NOT NULL,
    event_type VARCHAR(50) NOT NULL,  -- REQUEST_CREATED, UNDER_REVIEW, REQUEST_REJECTED, BED_ALLOCATED, etc.
    performed_by VARCHAR(100) NOT NULL,
    notes TEXT,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (request_id) REFERENCES bed_allocation_requests(id)
);
```

#### notifications
```sql
CREATE TABLE notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    message VARCHAR(500) NOT NULL,
    type VARCHAR(50) NOT NULL,  -- GENERAL, APPOINTMENT, ENCOUNTER, CONSULTATION, EPISODE, BILLING, BED_ALLOCATION, NURSE_ALERT
    target_user VARCHAR(100),  -- Username (null if role-based)
    target_role VARCHAR(50),   -- Role (null if user-specific)
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL
);
```

#### refresh_tokens
```sql
CREATE TABLE refresh_tokens (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    token VARCHAR(255) UNIQUE NOT NULL,
    user_id BIGINT NOT NULL,
    expiry_date DATETIME NOT NULL,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Database Indexes

```sql
-- Performance indexes
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_time ON appointments(appointment_time);
CREATE INDEX idx_encounters_patient ON encounters(patient_id);
CREATE INDEX idx_encounters_doctor ON encounters(doctor_id);
CREATE INDEX idx_encounters_status ON encounters(status);
CREATE INDEX idx_bills_patient ON bills(patient_id);
CREATE INDEX idx_bills_status ON bills(payment_status);
CREATE INDEX idx_notifications_user ON notifications(target_user, is_read);
CREATE INDEX idx_notifications_role ON notifications(target_role, is_read);
CREATE INDEX idx_bed_requests_status ON bed_allocation_requests(status);
CREATE INDEX idx_bed_assignments_bed ON bed_assignments(bed_id);
```

---

## 5. Authentication & Security

### JWT Authentication Flow

```
1. USER LOGIN
   ├─→ POST /api/auth/login {username, password}
   ├─→ Backend validates credentials
   ├─→ Generate accessToken (24h) + refreshToken (7d)
   ├─→ Store tokens in HTTP-only cookies
   └─→ Return {username, role}

2. AUTHENTICATED REQUEST
   ├─→ Frontend reads accessToken from cookie
   ├─→ JwtInterceptor adds "Authorization: Bearer <token>" header
   ├─→ Backend JwtAuthenticationFilter validates token
   ├─→ Extract username and authorities
   ├─→ Set SecurityContext
   └─→ Process request

3. TOKEN REFRESH
   ├─→ POST /api/auth/refresh (refreshToken in cookie)
   ├─→ Validate refreshToken from database
   ├─→ Generate new accessToken
   ├─→ Update cookie
   └─→ Return success

4. LOGOUT
   ├─→ POST /api/auth/logout
   ├─→ Blacklist refreshToken in database
   ├─→ Clear cookies
   └─→ Redirect to login
```

### Security Configuration

**Backend (SecurityConfig.java):**
```java
// Public endpoints
/api/auth/login, /api/auth/refresh - permitAll()
/ws/** - permitAll() (WebSocket handshake)

// Role-based access
/api/patients/** - hasAnyRole("ADMIN", "FRONTDESK", "DOCTOR", "NURSE")
/api/appointments/** - hasAnyRole("ADMIN", "FRONTDESK", "DOCTOR", "NURSE")
/api/encounters/** - hasAnyRole("ADMIN", "FRONTDESK", "DOCTOR", "NURSE")
/api/consultations/** - hasAnyRole("ADMIN", "DOCTOR", "NURSE")
/api/episodes/** - hasAnyRole("ADMIN", "FRONTDESK", "DOCTOR")
/api/bills/** - hasAnyRole("ADMIN", "FRONTDESK")
/api/services/** - hasAnyRole("ADMIN", "FRONTDESK")
/api/bed-management/** - hasAnyRole("ADMIN", "NURSE", "BED_MANAGER")
/api/nurse/** - hasAnyRole("ADMIN", "NURSE")
/api/users/** - hasRole("ADMIN")
/api/dashboard/** - authenticated()
/api/notifications/** - authenticated()
```

### Password Security
- **Hashing**: BCrypt with strength 10
- **Storage**: Only hashed passwords stored in database
- **Transmission**: Plain password only in welcome email (sent once)
- **Validation**: Spring Security's DaoAuthenticationProvider

### CORS Configuration
```java
// Development
allowedOrigins: http://localhost:4200
allowedMethods: GET, POST, PUT, DELETE, OPTIONS
allowedHeaders: *
allowCredentials: true

// Production: Update to actual domain
```

### WebSocket Security
- JWT token sent in CONNECT frame headers
- Token validated before establishing connection
- User principal set for message routing
- User-specific channels: /user/{username}/queue/*
- Role-based channels: /topic/notifications/{role}

---

## 6. API Documentation

### Base URL
```
Development: http://localhost:8080/api
Production: https://your-domain.com/api
```

### Authentication APIs

#### POST /auth/login
**Description**: Authenticate user and receive JWT tokens  
**Access**: Public  
**Request Body**:
```json
{
  "username": "string",
  "password": "string"
}
```
**Response** (200 OK):
```json
{
  "username": "john.doe",
  "role": "DOCTOR"
}
```
**Cookies Set**:
- `accessToken`: JWT token (24h, JS-readable)
- `refreshToken`: Refresh token (7d, HttpOnly)

#### POST /auth/refresh
**Description**: Refresh access token  
**Access**: Public (requires refreshToken cookie)  
**Response** (200 OK):
```json
{
  "message": "Token refreshed successfully"
}
```

#### POST /auth/logout
**Description**: Logout and invalidate tokens  
**Access**: Authenticated  
**Response** (200 OK):
```json
{
  "message": "Logged out successfully"
}
```

---

### Patient APIs

#### POST /patients
**Description**: Register new patient  
**Access**: ADMIN, FRONTDESK, DOCTOR, NURSE  
**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "gender": "MALE",
  "dob": "1990-01-15",
  "phone": "9876543210",
  "email": "john.doe@example.com",
  "address": "123 Main St, City",
  "bloodGroup": "O+",
  "emergencyContact": "9876543211"
}
```
**Response** (201 Created):
```json
{
  "id": 1,
  "uhid": "UHID-20260323-0001",
  "firstName": "John",
  "lastName": "Doe",
  "gender": "MALE",
  "dob": "1990-01-15",
  "phone": "9876543210",
  "email": "john.doe@example.com",
  "address": "123 Main St, City",
  "bloodGroup": "O+",
  "emergencyContact": "9876543211",
  "createdAt": "2026-03-23T10:30:00"
}
```

#### GET /patients/{id}
**Description**: Get patient by ID  
**Access**: ADMIN, FRONTDESK, DOCTOR, NURSE  
**Response** (200 OK): Same as POST response

#### GET /patients/search?query={query}
**Description**: Search patients by name, UHID, or phone  
**Access**: ADMIN, FRONTDESK, DOCTOR, NURSE  
**Query Parameters**:
- `query`: Search term (name/UHID/phone)
**Response** (200 OK):
```json
[
  {
    "id": 1,
    "uhid": "UHID-20260323-0001",
    "firstName": "John",
    "lastName": "Doe",
    ...
  }
]
```

#### GET /patients/recent
**Description**: Get recently registered patients  
**Access**: ADMIN, FRONTDESK, DOCTOR, NURSE  
**Response** (200 OK): Array of patient objects

#### PUT /patients/{id}
**Description**: Update patient details  
**Access**: ADMIN, FRONTDESK  
**Request Body**: Same as POST (all fields optional)  
**Response** (200 OK): Updated patient object

#### DELETE /patients/{id}
**Description**: Delete patient  
**Access**: ADMIN only  
**Response** (204 No Content)

---

### Appointment APIs

#### POST /appointments
**Description**: Book new appointment  
**Access**: ADMIN, FRONTDESK, DOCTOR, NURSE  
**Request Body**:
```json
{
  "patientId": 1,
  "doctorId": 2,
  "appointmentTime": "2026-03-25T14:00:00",
  "reasonForVisit": "Checkup",
  "notes": "Follow-up visit",
  "priority": "NORMAL",
  "department": "Cardiology"
}
```
**Response** (201 Created):
```json
{
  "id": 1,
  "patientId": 1,
  "doctorId": 2,
  "appointmentTime": "2026-03-25T14:00:00",
  "status": "SCHEDULED",
  "reasonForVisit": "Checkup",
  "notes": "Follow-up visit",
  "priority": "NORMAL",
  "department": "Cardiology",
  "createdAt": "2026-03-23T10:30:00"
}
```

#### GET /appointments/{id}
**Description**: Get appointment by ID  
**Access**: ADMIN, FRONTDESK, DOCTOR, NURSE  
**Response** (200 OK): Appointment object

#### GET /appointments/patient/{patientId}
**Description**: Get all appointments for a patient  
**Access**: ADMIN, FRONTDESK, DOCTOR, NURSE  
**Response** (200 OK): Array of appointment objects

#### PUT /appointments/{id}/status?status={status}
**Description**: Update appointment status  
**Access**: ADMIN, FRONTDESK, DOCTOR, NURSE  
**Query Parameters**:
- `status`: SCHEDULED | CHECKED_IN | CANCELLED | COMPLETED
**Response** (200 OK): Updated appointment object

#### GET /appointments/today
**Description**: Get today's appointments  
**Access**: ADMIN, FRONTDESK  
**Response** (200 OK): Array of appointment objects

#### GET /appointments/by-date?date={date}
**Description**: Get appointments on specific date  
**Access**: ADMIN, FRONTDESK  
**Query Parameters**:
- `date`: Date in YYYY-MM-DD format
**Response** (200 OK): Array of appointment objects

#### GET /appointments/doctor/today
**Description**: Get logged-in doctor's today's appointments  
**Access**: DOCTOR  
**Response** (200 OK): Array of appointment objects

#### GET /appointments/doctor/all
**Description**: Get all appointments for logged-in doctor  
**Access**: DOCTOR  
**Response** (200 OK): Array of appointment objects

---

### Encounter APIs

#### POST /encounters/checkin
**Description**: Check in patient (creates encounter)  
**Access**: ADMIN, FRONTDESK, DOCTOR, NURSE  
**Request Body**:
```json
{
  "patientId": 1,
  "doctorId": 2,
  "appointmentId": 1,
  "visitType": "OPD",
  "priority": "NORMAL",
  "notes": "Regular checkup"
}
```
**Response** (201 Created):
```json
{
  "id": 1,
  "encounterNumber": "ENC-20260323-0001",
  "patientId": 1,
  "doctorId": 2,
  "appointmentId": 1,
  "visitType": "OPD",
  "status": "WAITING",
  "checkinTime": "2026-03-23T10:30:00",
  "priority": "NORMAL",
  "notes": "Regular checkup",
  "createdAt": "2026-03-23T10:30:00"
}
```

#### GET /encounters/{id}
**Description**: Get encounter by ID  
**Access**: ADMIN, FRONTDESK, DOCTOR, NURSE  
**Response** (200 OK): Encounter object

#### GET /encounters/patient/{patientId}
**Description**: Get all encounters for a patient  
**Access**: ADMIN, FRONTDESK, DOCTOR, NURSE  
**Response** (200 OK): Array of encounter objects

#### PUT /encounters/{id}/status?status={status}
**Description**: Update encounter status  
**Access**: ADMIN, DOCTOR, NURSE  
**Query Parameters**:
- `status`: WAITING | IN_CONSULTATION | COMPLETED | CANCELLED
**Response** (200 OK): Updated encounter object

#### PUT /encounters/{id}/link-episode/{episodeId}
**Description**: Link encounter to an episode  
**Access**: ADMIN, DOCTOR  
**Response** (200 OK): Updated encounter object

#### GET /encounters/today
**Description**: Get today's encounters  
**Access**: ADMIN, FRONTDESK  
**Response** (200 OK): Array of encounter objects

#### GET /encounters/doctor/today
**Description**: Get logged-in doctor's today's encounters (queue)  
**Access**: DOCTOR  
**Response** (200 OK): Array of encounter objects

---

### Consultation APIs

#### POST /consultations
**Description**: Create consultation for encounter  
**Access**: ADMIN, DOCTOR  
**Request Body**:
```json
{
  "encounterId": 1,
  "doctorId": 2,
  "patientId": 1,
  "consultationDate": "2026-03-23",
  "chiefComplaint": "Chest pain",
  "diagnosis": "Angina pectoris",
  "prescription": "Aspirin 75mg daily, Atorvastatin 20mg",
  "followUpDate": "2026-04-23",
  "notes": "Advised lifestyle changes"
}
```
**Response** (201 Created):
```json
{
  "id": 1,
  "encounterId": 1,
  "doctorId": 2,
  "patientId": 1,
  "consultationDate": "2026-03-23",
  "chiefComplaint": "Chest pain",
  "diagnosis": "Angina pectoris",
  "prescription": "Aspirin 75mg daily, Atorvastatin 20mg",
  "followUpDate": "2026-04-23",
  "notes": "Advised lifestyle changes",
  "status": "IN_PROGRESS",
  "createdAt": "2026-03-23T11:00:00"
}
```

#### GET /consultations/{id}
**Description**: Get consultation by ID  
**Access**: ADMIN, DOCTOR, NURSE  
**Response** (200 OK): Consultation object

#### GET /consultations/encounter/{encounterId}
**Description**: Get consultation for specific encounter  
**Access**: ADMIN, DOCTOR, NURSE  
**Response** (200 OK): Consultation object

#### PUT /consultations/{id}
**Description**: Update consultation  
**Access**: ADMIN, DOCTOR  
**Request Body**: Same as POST (all fields optional)  
**Response** (200 OK): Updated consultation object

#### PUT /consultations/{id}/complete
**Description**: Mark consultation as completed  
**Access**: ADMIN, DOCTOR  
**Response** (200 OK): Updated consultation object with status=COMPLETED

#### GET /consultations/doctor/{username}
**Description**: Get consultations by doctor username  
**Access**: ADMIN, DOCTOR  
**Response** (200 OK): Array of consultation objects

#### GET /consultations/today
**Description**: Get today's consultations  
**Access**: ADMIN, DOCTOR  
**Response** (200 OK): Array of consultation objects

---

### Episode APIs

#### POST /episodes
**Description**: Create care plan/episode  
**Access**: ADMIN, DOCTOR  
**Request Body**:
```json
{
  "patientId": 1,
  "doctorId": 2,
  "episodeType": "CHRONIC_DISEASE",
  "title": "Diabetes Management",
  "description": "Type 2 Diabetes Mellitus - ongoing management",
  "startDate": "2026-03-23"
}
```
**Response** (201 Created):
```json
{
  "id": 1,
  "patientId": 1,
  "doctorId": 2,
  "episodeType": "CHRONIC_DISEASE",
  "title": "Diabetes Management",
  "description": "Type 2 Diabetes Mellitus - ongoing management",
  "startDate": "2026-03-23",
  "endDate": null,
  "status": "ACTIVE",
  "createdAt": "2026-03-23T11:00:00"
}
```

#### GET /episodes?patientId={id}&status={status}&startDate={date}&endDate={date}
**Description**: List/filter episodes  
**Access**: ADMIN, FRONTDESK, DOCTOR  
**Query Parameters** (all optional):
- `patientId`: Filter by patient
- `status`: ACTIVE | CLOSED
- `startDate`: Filter by start date (from)
- `endDate`: Filter by start date (to)
**Response** (200 OK): Array of episode objects

#### GET /episodes/patient/{patientId}
**Description**: Get all episodes for a patient  
**Access**: ADMIN, FRONTDESK, DOCTOR  
**Response** (200 OK): Array of episode objects

#### GET /episodes/doctor
**Description**: Get episodes for logged-in doctor  
**Access**: DOCTOR  
**Response** (200 OK): Array of episode objects

#### PUT /episodes/{id}
**Description**: Update episode  
**Access**: ADMIN, DOCTOR  
**Request Body**: Same as POST (all fields optional)  
**Response** (200 OK): Updated episode object

#### PUT /episodes/{id}/close
**Description**: Close episode  
**Access**: ADMIN, DOCTOR  
**Response** (200 OK): Updated episode object with status=CLOSED and endDate set

#### DELETE /episodes/{id}
**Description**: Delete episode  
**Access**: ADMIN only  
**Response** (204 No Content)

---

### Billing APIs

#### POST /bills/create/{encounterId}
**Description**: Create bill for encounter  
**Access**: ADMIN, FRONTDESK  
**Response** (201 Created):
```json
{
  "id": 1,
  "billNumber": "BILL-20260323-0001",
  "encounterId": 1,
  "patientId": 1,
  "totalAmount": 0.00,
  "paidAmount": 0.00,
  "paymentStatus": "PENDING",
  "billDate": "2026-03-23",
  "dueDate": "2026-04-23",
  "items": [],
  "createdAt": "2026-03-23T12:00:00"
}
```

#### POST /bills/{billId}/items
**Description**: Add service item to bill  
**Access**: ADMIN, FRONTDESK  
**Request Body**:
```json
{
  "serviceId": 1,
  "quantity": 1
}
```
**Response** (200 OK): Updated bill object with new item

#### GET /bills/{billId}
**Description**: Get bill details with items  
**Access**: ADMIN, FRONTDESK  
**Response** (200 OK):
```json
{
  "id": 1,
  "billNumber": "BILL-20260323-0001",
  "encounterId": 1,
  "patientId": 1,
  "totalAmount": 1500.00,
  "paidAmount": 0.00,
  "paymentStatus": "PENDING",
  "billDate": "2026-03-23",
  "dueDate": "2026-04-23",
  "items": [
    {
      "id": 1,
      "serviceName": "Consultation - Cardiology",
      "quantity": 1,
      "unitPrice": 500.00,
      "totalPrice": 500.00
    },
    {
      "id": 2,
      "serviceName": "ECG",
      "quantity": 1,
      "unitPrice": 1000.00,
      "totalPrice": 1000.00
    }
  ],
  "createdAt": "2026-03-23T12:00:00"
}
```

#### POST /bills/{billId}/pay
**Description**: Record payment for bill  
**Access**: ADMIN, FRONTDESK  
**Request Body**:
```json
{
  "amount": 1500.00,
  "paymentMethod": "CARD"
}
```
**Response** (200 OK): Updated bill object with payment details

---

### Bed Management APIs

#### POST /bed-management/wards
**Description**: Create ward  
**Access**: ADMIN  
**Request Body**:
```json
{
  "wardName": "ICU-1",
  "wardType": "ICU",
  "totalBeds": 10,
  "floorNumber": 3
}
```
**Response** (201 Created): Ward object

#### GET /bed-management/wards
**Description**: Get all wards with occupancy  
**Access**: ADMIN, NURSE, BED_MANAGER  
**Response** (200 OK): Array of ward objects

#### POST /bed-management/beds
**Description**: Create bed  
**Access**: ADMIN  
**Request Body**:
```json
{
  "wardId": 1,
  "bedNumber": "ICU-101",
  "bedType": "ICU"
}
```
**Response** (201 Created): Bed object

#### GET /bed-management/wards/{wardId}/beds
**Description**: Get beds in a ward  
**Access**: ADMIN, NURSE, BED_MANAGER  
**Response** (200 OK): Array of bed objects

#### PUT /bed-management/beds/{bedId}/status
**Description**: Update bed status  
**Access**: ADMIN, BED_MANAGER  
**Request Body**:
```json
{
  "status": "MAINTENANCE"
}
```
**Response** (200 OK): Updated bed object

#### POST /bed-management/requests
**Description**: Create bed allocation request  
**Access**: NURSE  
**Request Body**:
```json
{
  "encounterId": 1,
  "patientId": 1,
  "bedType": "ICU",
  "priority": "URGENT",
  "preferredWardId": 1,
  "reason": "Post-surgery monitoring required"
}
```
**Response** (201 Created):
```json
{
  "id": 1,
  "encounterId": 1,
  "patientId": 1,
  "requestedBy": "nurse.jane",
  "bedType": "ICU",
  "priority": "URGENT",
  "preferredWardId": 1,
  "status": "PENDING",
  "reason": "Post-surgery monitoring required",
  "createdAt": "2026-03-23T13:00:00"
}
```

#### GET /bed-management/requests/{requestId}
**Description**: Get request details  
**Access**: ADMIN, NURSE, BED_MANAGER  
**Response** (200 OK): Request object with events timeline

#### GET /bed-management/requests/my
**Description**: Get my allocation requests (logged-in nurse)  
**Access**: NURSE  
**Response** (200 OK): Array of request objects

#### GET /bed-management/queue
**Description**: Get priority queue of pending requests  
**Access**: BED_MANAGER  
**Response** (200 OK): Array of request objects sorted by priority

#### PUT /bed-management/requests/{requestId}/review
**Description**: Mark request as under review  
**Access**: BED_MANAGER  
**Response** (200 OK): Updated request object

#### PUT /bed-management/requests/{requestId}/reject
**Description**: Reject allocation request  
**Access**: BED_MANAGER  
**Request Body**:
```json
{
  "notes": "No ICU beds available currently"
}
```
**Response** (200 OK): Updated request object with status=REJECTED

#### PUT /bed-management/requests/{requestId}/allocate
**Description**: Allocate bed to request  
**Access**: BED_MANAGER  
**Request Body**:
```json
{
  "bedId": 5,
  "notes": "Allocated ICU-105"
}
```
**Response** (200 OK): Assignment object

#### PUT /bed-management/assignments/{assignmentId}/admit
**Description**: Admit patient to allocated bed  
**Access**: NURSE  
**Response** (200 OK): Updated assignment object with status=ADMITTED

#### PUT /bed-management/assignments/{assignmentId}/discharge
**Description**: Discharge patient from bed  
**Access**: NURSE  
**Request Body**:
```json
{
  "notes": "Patient recovered, discharged"
}
```
**Response** (200 OK): Updated assignment object with status=DISCHARGED

#### PUT /bed-management/assignments/{assignmentId}/transfer
**Description**: Transfer patient to different bed  
**Access**: BED_MANAGER  
**Request Body**:
```json
{
  "newBedId": 8,
  "notes": "Transferred to general ward"
}
```
**Response** (200 OK): Updated assignment object

#### GET /bed-management/beds/available
**Description**: Get available beds  
**Access**: ADMIN, NURSE, BED_MANAGER  
**Response** (200 OK): Array of available bed objects

#### GET /bed-management/beds/assignable?bedType={type}
**Description**: Get assignable beds for allocation  
**Access**: BED_MANAGER  
**Query Parameters**:
- `bedType`: ICU | GENERAL | PRIVATE | SEMI_PRIVATE
**Response** (200 OK): Array of bed objects

#### GET /bed-management/calendar?year={year}&month={month}
**Description**: Get monthly bed calendar  
**Access**: BED_MANAGER  
**Query Parameters**:
- `year`: Year (e.g., 2026)
- `month`: Month (1-12)
**Response** (200 OK): Calendar data with daily occupancy

#### GET /bed-management/dashboard
**Description**: Get bed manager dashboard stats  
**Access**: BED_MANAGER  
**Response** (200 OK):
```json
{
  "totalBeds": 100,
  "occupiedBeds": 75,
  "availableBeds": 20,
  "maintenanceBeds": 5,
  "pendingRequests": 5,
  "occupancyRate": 75.0
}
```

---

### Notification APIs

#### GET /notifications
**Description**: Get all notifications for logged-in user  
**Access**: Authenticated  
**Response** (200 OK):
```json
[
  {
    "id": 1,
    "message": "New appointment scheduled for 2026-03-25",
    "type": "APPOINTMENT",
    "targetUser": "john.doe",
    "targetRole": null,
    "isRead": false,
    "createdAt": "2026-03-23T14:00:00"
  }
]
```

#### GET /notifications/unread-count
**Description**: Get unread notification count  
**Access**: Authenticated  
**Response** (200 OK):
```json
{
  "count": 5
}
```

#### PUT /notifications/{id}/read
**Description**: Mark notification as read  
**Access**: Authenticated  
**Response** (204 No Content)

#### PUT /notifications/read-all
**Description**: Mark all notifications as read  
**Access**: Authenticated  
**Response** (204 No Content)

---

### Service Catalog APIs

#### POST /services
**Description**: Create medical service  
**Access**: ADMIN  
**Request Body**:
```json
{
  "serviceCode": "CONS-CARD",
  "serviceName": "Consultation - Cardiology",
  "description": "Cardiology specialist consultation",
  "category": "CONSULTATION",
  "price": 500.00
}
```
**Response** (201 Created): Service object

#### GET /services
**Description**: List all active services  
**Access**: ADMIN, FRONTDESK  
**Response** (200 OK): Array of service objects

#### PUT /services/{id}
**Description**: Update service  
**Access**: ADMIN  
**Request Body**: Same as POST (all fields optional)  
**Response** (200 OK): Updated service object

#### DELETE /services/{id}
**Description**: Deactivate service  
**Access**: ADMIN  
**Response** (204 No Content)

---

### User Management APIs

#### POST /users
**Description**: Create new user (sends welcome email)  
**Access**: ADMIN  
**Request Body**:
```json
{
  "username": "dr.smith",
  "email": "dr.smith@hospital.com",
  "password": "TempPass123",
  "role": "DOCTOR"
}
```
**Response** (201 Created):
```json
{
  "id": 5,
  "username": "dr.smith",
  "email": "dr.smith@hospital.com",
  "role": "DOCTOR",
  "enabled": true,
  "createdAt": "2026-03-23T15:00:00"
}
```
**Side Effects**:
- Welcome email sent to user with credentials
- In-app notification created for user
- Real-time notification pushed via WebSocket

#### GET /users
**Description**: List all users  
**Access**: ADMIN  
**Response** (200 OK): Array of user objects

#### GET /users/{id}
**Description**: Get user by ID  
**Access**: ADMIN  
**Response** (200 OK): User object

#### PUT /users/{id}
**Description**: Update user  
**Access**: ADMIN  
**Request Body**:
```json
{
  "email": "new.email@hospital.com",
  "role": "DOCTOR",
  "enabled": true,
  "password": "NewPass123"
}
```
**Response** (200 OK): Updated user object

#### DELETE /users/{id}
**Description**: Disable user (soft delete)  
**Access**: ADMIN  
**Response** (204 No Content)

#### GET /users/doctors
**Description**: List all doctors  
**Access**: ADMIN, FRONTDESK, DOCTOR, NURSE  
**Response** (200 OK): Array of doctor user objects

---

### Dashboard APIs

#### GET /dashboard/stats
**Description**: Get dashboard statistics  
**Access**: Authenticated  
**Response** (200 OK):
```json
{
  "totalPatients": 1250,
  "todayAppointments": 45,
  "activeEncounters": 12,
  "pendingBills": 8,
  "occupiedBeds": 75,
  "totalRevenue": 125000.00
}
```

#### GET /dashboard/daily-trends?days={days}
**Description**: Get daily trends  
**Access**: Authenticated  
**Query Parameters**:
- `days`: Number of days (default: 7)
**Response** (200 OK):
```json
{
  "labels": ["2026-03-17", "2026-03-18", ...],
  "appointments": [42, 38, 45, ...],
  "encounters": [35, 32, 40, ...],
  "revenue": [12000, 11500, 13000, ...]
}
```

#### GET /dashboard/revenue-trends?days={days}
**Description**: Get revenue trends  
**Access**: ADMIN, FRONTDESK  
**Query Parameters**:
- `days`: Number of days (default: 30)
**Response** (200 OK):
```json
{
  "labels": ["2026-02-23", "2026-02-24", ...],
  "revenue": [12000, 11500, 13000, ...]
}
```

#### GET /dashboard/encounter-status-distribution
**Description**: Get encounter status distribution for charts  
**Access**: ADMIN, FRONTDESK, DOCTOR, NURSE  
**Response** (200 OK):
```json
{
  "labels": ["WAITING", "IN CONSULTATION", "COMPLETED", "CANCELLED"],
  "data": [15, 8, 42, 3],
  "colors": ["#FFA726", "#42A5F5", "#66BB6A", "#EF5350"]
}
```

#### GET /dashboard/appointment-calendar?from={date}&to={date}
**Description**: Get appointment calendar events  
**Access**: ADMIN, FRONTDESK, DOCTOR  
**Query Parameters**:
- `from`: Start date (YYYY-MM-DD)
- `to`: End date (YYYY-MM-DD)
**Response** (200 OK):
```json
[
  {
    "id": 1,
    "title": "John Doe - Dr. Smith",
    "start": "2026-03-25T14:00:00",
    "end": "2026-03-25T14:30:00",
    "patientName": "John Doe",
    "doctorName": "Dr. Smith",
    "status": "SCHEDULED",
    "backgroundColor": "#42A5F5",
    "borderColor": "#42A5F5"
  }
]
```

#### GET /dashboard/department-stats
**Description**: Get statistics by department  
**Access**: ADMIN, FRONTDESK  
**Response** (200 OK):
```json
{
  "departments": ["Cardiology", "Orthopedics", "Pediatrics"],
  "appointmentCounts": [45, 32, 28],
  "consultationCounts": [42, 30, 25]
}
```

---

### Nurse APIs

#### GET /nurse/doctor-patients?doctorId={id}
**Description**: Get patients assigned to a doctor  
**Access**: NURSE  
**Query Parameters**:
- `doctorId`: Doctor's user ID
**Response** (200 OK): Array of patient objects with encounter details

#### GET /nurse/case/{encounterId}
**Description**: Get patient case details for monitoring  
**Access**: NURSE  
**Response** (200 OK):
```json
{
  "encounter": {...},
  "patient": {...},
  "consultation": {...},
  "vitalSigns": [...],
  "medications": [...]
}
```

---

## 7. Features & Workflows

### 7.1 Patient Registration Workflow

```
1. FRONTDESK/ADMIN opens patient registration form
2. Enters patient details (name, DOB, contact, etc.)
3. System auto-generates UHID (format: UHID-YYYYMMDD-XXXX)
4. Validates phone/email uniqueness
5. Saves patient to database
6. Returns patient object with UHID
7. Patient can now be searched and used for appointments
```

**Key Points**:
- UHID is unique and auto-generated
- Phone number is required
- Email is optional
- Blood group and emergency contact are optional
- Audit trail tracks who created the patient

---

### 7.2 Appointment Scheduling Workflow

```
1. FRONTDESK/ADMIN searches for patient (by name/UHID/phone)
2. Selects patient from search results
3. Chooses doctor from dropdown (filtered by role=DOCTOR)
4. Selects date and time
5. Enters reason for visit and notes
6. Sets priority (URGENT/HIGH/NORMAL/LOW)
7. System validates:
   - Doctor availability
   - No conflicting appointments
8. Creates appointment with status=SCHEDULED
9. Notification sent to doctor
10. Appointment appears in doctor's schedule
```

**Status Transitions**:
- SCHEDULED → CHECKED_IN (when patient arrives)
- SCHEDULED → CANCELLED (if cancelled)
- CHECKED_IN → COMPLETED (after consultation)

---

### 7.3 Patient Check-In & Encounter Workflow

```
1. Patient arrives at hospital
2. FRONTDESK checks in patient:
   - Searches for patient
   - Selects appointment (if exists) or creates walk-in
   - Chooses visit type (OPD/IPD/EMERGENCY)
   - Sets priority
3. System creates encounter:
   - Auto-generates encounter number (ENC-YYYYMMDD-XXXX)
   - Sets status=WAITING
   - Records check-in time
4. Updates appointment status to CHECKED_IN
5. Encounter appears in doctor's queue
6. Notification sent to doctor
```

**Encounter Status Flow**:
```
WAITING → IN_CONSULTATION → COMPLETED
   ↓
CANCELLED
```

---

### 7.4 Doctor Consultation Workflow

```
1. DOCTOR views their queue (today's encounters)
2. Selects patient encounter
3. Reviews patient history:
   - Previous encounters
   - Previous consultations
   - Active episodes
4. Updates encounter status to IN_CONSULTATION
5. Creates consultation record:
   - Chief complaint
   - Diagnosis
   - Prescription
   - Follow-up date
   - Notes
6. Can link encounter to existing episode or create new episode
7. Completes consultation
8. Updates encounter status to COMPLETED
9. Notification sent to FRONTDESK for billing
```

**Key Features**:
- One consultation per encounter (1:1 relationship)
- Can view patient's complete medical history
- Can prescribe medications
- Can schedule follow-up
- Can create/link episodes for chronic conditions

---

### 7.5 Episode/Care Plan Workflow

```
1. DOCTOR identifies chronic condition or ongoing treatment
2. Creates episode:
   - Type: CHRONIC_DISEASE, SURGERY, INJURY, MATERNITY, etc.
   - Title: e.g., "Diabetes Management"
   - Description: Treatment plan details
   - Start date
3. Links future encounters to this episode
4. Tracks all consultations under this episode
5. Can view episode timeline with all encounters
6. Closes episode when treatment is complete
```

**Episode Types**:
- CHRONIC_DISEASE (Diabetes, Hypertension, etc.)
- SURGERY (Pre-op, surgery, post-op care)
- INJURY (Fracture, wound care)
- MATERNITY (Pregnancy care)
- MENTAL_HEALTH (Counseling, therapy)
- PREVENTIVE_CARE (Vaccinations, screenings)
- REHABILITATION (Physical therapy)
- OTHER

**Benefits**:
- Continuity of care
- Complete treatment history
- Better patient outcomes
- Easier follow-up tracking

---

### 7.6 Billing Workflow

```
1. After consultation, FRONTDESK creates bill for encounter
2. System creates bill with auto-generated number (BILL-YYYYMMDD-XXXX)
3. FRONTDESK adds service items:
   - Consultation fee
   - Lab tests
   - Imaging
   - Procedures
   - Medications
4. System calculates total amount
5. Patient makes payment:
   - Full payment → status=PAID
   - Partial payment → status=PARTIAL
   - No payment → status=PENDING
6. System records payment method (CASH/CARD/UPI/INSURANCE)
7. Generates bill receipt
8. Updates encounter billing status
```

**Bill Components**:
- Bill header (patient, encounter, dates)
- Line items (services with quantity and price)
- Total amount
- Paid amount
- Balance due
- Payment history

---

### 7.7 Bed Management Complete Workflow

```
STEP 1: BED REQUEST (by NURSE)
├─→ Nurse identifies patient needing bed
├─→ Creates allocation request:
│   - Encounter ID
│   - Patient ID
│   - Bed type (ICU/GENERAL/PRIVATE/SEMI_PRIVATE)
│   - Priority (URGENT/HIGH/NORMAL/LOW)
│   - Preferred ward (optional)
│   - Reason
├─→ System creates request with status=PENDING
├─→ Event logged: REQUEST_CREATED
└─→ Notification sent to BED_MANAGER

STEP 2: REVIEW (by BED_MANAGER)
├─→ Bed manager views priority queue
├─→ Reviews request details
├─→ Marks as UNDER_REVIEW
├─→ Event logged: UNDER_REVIEW
└─→ Notification sent to requesting nurse

STEP 3: DECISION (by BED_MANAGER)
├─→ Option A: REJECT
│   ├─→ Enters rejection reason
│   ├─→ Status changed to REJECTED
│   ├─→ Event logged: REQUEST_REJECTED
│   └─→ Notification sent to nurse
│
└─→ Option B: ALLOCATE
    ├─→ Selects available bed
    ├─→ System validates bed availability
    ├─→ Creates bed assignment
    ├─→ Updates bed status to RESERVED
    ├─→ Updates ward occupancy
    ├─→ Status changed to ALLOCATED
    ├─→ Event logged: BED_ALLOCATED
    └─→ Notification sent to nurse

STEP 4: ADMISSION (by NURSE)
├─→ Nurse admits patient to allocated bed
├─→ Records admission time
├─→ Updates assignment status to ADMITTED
├─→ Updates bed status to OCCUPIED
├─→ Event logged: PATIENT_ADMITTED
└─→ Notification sent to bed manager

STEP 5: DISCHARGE (by NURSE)
├─→ Patient ready for discharge
├─→ Nurse initiates discharge
├─→ Records discharge time
├─→ Updates assignment status to DISCHARGED
├─→ Updates bed status to AVAILABLE
├─→ Updates ward occupancy
├─→ Event logged: PATIENT_DISCHARGED
└─→ Notification sent to bed manager

OPTIONAL: TRANSFER (by BED_MANAGER)
├─→ Patient needs different bed type
├─→ Bed manager initiates transfer
├─→ Selects new bed
├─→ System validates new bed availability
├─→ Releases old bed (status=AVAILABLE)
├─→ Reserves new bed (status=OCCUPIED)
├─→ Updates assignment with new bed
├─→ Event logged: BED_TRANSFERRED
└─→ Notification sent to nurse
```

**Bed Statuses**:
- AVAILABLE: Ready for allocation
- RESERVED: Allocated but patient not admitted yet
- OCCUPIED: Patient currently admitted
- MAINTENANCE: Under maintenance, not available

**Request Priorities**:
- URGENT: Critical patients (ICU, emergency)
- HIGH: Serious conditions
- NORMAL: Regular admissions
- LOW: Planned admissions

**Event Timeline**:
Every action is logged in bed_events table with:
- Event type
- Performed by (username)
- Timestamp
- Notes

---

### 7.8 Nurse Operations Workflow

```
PATIENT MONITORING:
1. Nurse views assigned doctor's patients
2. Selects patient for monitoring
3. Views patient case details:
   - Current encounter
   - Consultation notes
   - Vital signs
   - Medications
   - Bed assignment (if admitted)
4. Records vital signs
5. Updates patient status
6. Alerts doctor if needed

BED REQUEST MANAGEMENT:
1. Identifies patient needing admission
2. Creates bed allocation request
3. Tracks request status
4. Receives notification when bed allocated
5. Admits patient to bed
6. Monitors patient during stay
7. Discharges patient when ready
```

---

### 7.9 Dashboard & Analytics

**Admin Dashboard**:
- Total patients registered
- Today's appointments
- Active encounters
- Pending bills
- Bed occupancy rate
- Revenue statistics
- Daily/weekly/monthly trends

**Doctor Dashboard**:
- Today's appointments
- Patient queue (waiting encounters)
- Completed consultations
- Active episodes
- Follow-up reminders

**Frontdesk Dashboard**:
- Today's appointments
- Check-in queue
- Pending bills
- Recent registrations

**Nurse Dashboard**:
- Assigned patients
- Bed requests status
- Critical alerts
- Medication schedules

**Bed Manager Dashboard**:
- Total beds by type
- Occupancy rate
- Pending requests
- Available beds
- Monthly calendar view

---

## 8. Real-Time Features

### 8.1 WebSocket STOMP Notification System

**Architecture Overview**:
```
Frontend (Angular)
    ↕ WebSocket STOMP (Native WebSocket + SockJS fallback)
Backend (Spring Boot)
    ↓
SimpMessagingTemplate
    ├─→ /user/{username}/queue/notifications (user-specific channel)
    └─→ /topic/notifications/{role} (role-based broadcast channel)
```

**Connection Flow**:
```
1. User logs in → JWT token stored in cookie
2. NotificationService initializes WebSocket connection
3. Connects to ws://localhost:8080/ws
4. Sends CONNECT frame with Authorization: Bearer <token>
5. Backend JwtAuthenticationFilter validates token
6. User principal set in WebSocket session
7. Connection established successfully
8. Frontend subscribes to notification channels:
   - /user/queue/notifications (personal messages)
   - /topic/notifications/{role} (role-based broadcasts)
9. Ready to receive real-time notifications
10. Auto-reconnection on connection loss (5s delay)
```

**Notification Channel Architecture**:

**1. User-Specific Channels** (`/user/{username}/queue/notifications`):
- Each user has a dedicated private channel
- Only the specific user receives these notifications
- Backend uses: `messagingTemplate.convertAndSendToUser(username, "/queue/notifications", notification)`
- Frontend subscribes: `stompClient.subscribe("/user/queue/notifications", handler)`

**Use Cases**:
- Welcome message on account creation
- Appointment confirmations (sent ONLY to the booked doctor)
- Consultation completed notifications
- Bill generated for specific patient
- Bed allocated to specific nurse's request
- Personal alerts and reminders

**2. Role-Based Channels** (`/topic/notifications/{role}`):
- Broadcast to all users with a specific role
- Multiple users can receive the same notification
- Backend uses: `messagingTemplate.convertAndSend("/topic/notifications/" + role, notification)`
- Frontend subscribes: `stompClient.subscribe("/topic/notifications/DOCTOR", handler)`

**Use Cases**:
- DOCTOR: System-wide announcements for all doctors
- NURSE: General nursing alerts
- FRONTDESK: New patient registrations, system updates
- BED_MANAGER: Ward capacity alerts
- ADMIN: System maintenance notifications

**Notification Flow Example - Appointment Booking**:
```
1. Frontdesk books appointment for Patient A with Doctor B
2. AppointmentService.createAppointment() called
3. Appointment saved to database
4. NotificationService.notifyUser() called with:
   - message: "New appointment booked for you at 2:00 PM with patient John Doe"
   - type: APPOINTMENT
   - username: "doctor.b" (ONLY the booked doctor)
5. Backend sends to: /user/doctor.b/queue/notifications
6. Doctor B's frontend receives notification (if connected)
7. Notification appears in Doctor B's notification panel
8. Browser notification shown (if permitted)
9. Notification stored in database for persistence
```

**Notification Types**:
- `GENERAL`: System messages, announcements
- `APPOINTMENT`: Appointment bookings, cancellations, reminders
- `ENCOUNTER`: Patient check-ins, status updates
- `CONSULTATION`: Consultation completed, follow-ups
- `EPISODE`: Episode created, updated, closed
- `BILLING`: Bill generated, payment received
- `BED_ALLOCATION`: Bed requests, allocations, discharges
- `NURSE_ALERT`: Critical patient alerts, vital signs

**Key Features**:

**1. Targeted Notifications**:
- Appointment notifications sent ONLY to the assigned doctor
- Bed allocation notifications sent to specific nurse who requested
- No unnecessary notifications to other users

**2. Persistent Storage**:
- All notifications stored in database
- Available even if user was offline
- Fetched on login via REST API

**3. Auto-Reconnection**:
- Detects WebSocket connection loss
- Waits 5 seconds before retry
- Automatically re-subscribes to channels
- Seamless recovery without user intervention

**4. Browser Notifications**:
- Requests permission on first load
- Shows desktop notification when tab not focused
- Includes notification message and HMS icon
- Clicking notification focuses the application tab

**5. Unread Count**:
- Real-time unread notification counter
- Updates on new notifications
- Decrements when marked as read
- Displayed in navigation bar

**WebSocket Configuration**:

**Backend (WebSocketConfig.java)**:
```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue", "/user");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }
    
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Native WebSocket
        registry.addEndpoint("/ws")
                .setAllowedOrigins("http://localhost:4200");
        
        // SockJS fallback for older browsers
        registry.addEndpoint("/ws")
                .setAllowedOrigins("http://localhost:4200")
                .withSockJS();
    }
}
```

**Frontend (notification.service.ts)**:
```typescript
private connect(): void {
  const token = this.readCookie('accessToken');
  const wsUrl = 'ws://localhost:8080/ws';

  this.stompClient = new Client({
    brokerURL: wsUrl,
    connectHeaders: {
      Authorization: `Bearer ${token}`
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
  });

  this.stompClient.onConnect = () => {
    this.subscribeToNotifications();
  };

  this.stompClient.activate();
}

private subscribeToNotifications(): void {
  const username = this.authService.getUsername();
  const role = this.authService.getUserRole();

  // User-specific channel
  this.stompClient.subscribe('/user/queue/notifications', handler);

  // Role-based channel
  this.stompClient.subscribe(`/topic/notifications/${role}`, handler);
}
```

**Security**:
- JWT token validated on WebSocket CONNECT
- User principal set for message routing
- Only authenticated users can connect
- User can only receive their own user-specific messages
- Role-based messages filtered by user's role

**Performance Optimizations**:
- Heartbeat mechanism prevents connection timeout
- Efficient message routing with Spring's SimpMessagingTemplate
- Minimal payload size (JSON)
- Connection pooling handled by Spring
- No polling - pure push notifications

---

### 8.2 Email Notifications

**Welcome Email** (on user creation):
- **Trigger**: Admin creates new user
- **Recipient**: New user's email
- **Content**: 
  - Professional HTML template
  - Username and password
  - Role information
  - Login link
  - Security reminder
- **Delivery**: Async (non-blocking)

**Email Template Features**:
- Modern gradient design (purple/blue)
- Responsive layout (mobile-friendly)
- Credentials table with clear formatting
- Call-to-action button
- Security notice box
- Professional footer

**SMTP Configuration**:
Supports multiple providers:
- Gmail (with App Password)
- SendGrid
- AWS SES
- Any SMTP server

**Email Service**:
- Async sending with @Async
- Error handling and logging
- Retry mechanism
- HTML template support
- Plain text fallback

---

### 8.3 Real-Time Updates

**Scenarios**:

1. **New Appointment**:
   - FRONTDESK books appointment
   - Real-time notification to DOCTOR
   - Appointment appears in doctor's schedule instantly

2. **Patient Check-In**:
   - FRONTDESK checks in patient
   - Real-time notification to DOCTOR
   - Patient appears in doctor's queue instantly

3. **Bed Request**:
   - NURSE creates bed request
   - Real-time notification to BED_MANAGER
   - Request appears in priority queue instantly

4. **Bed Allocation**:
   - BED_MANAGER allocates bed
   - Real-time notification to NURSE
   - Bed status updates instantly

5. **User Creation**:
   - ADMIN creates user
   - Email sent with credentials
   - Real-time notification to new user (when they login)

**Performance**:
- Notification delivery: <500ms
- WebSocket connection: <2 seconds
- Email delivery: <5 seconds
- No polling required
- Minimal network traffic

---

## 9. Frontend Architecture

### 9.1 Component Structure

```
app/
├── core/
│   ├── guards/
│   │   ├── auth.guard.ts          # Redirects to login if not authenticated
│   │   ├── role.guard.ts          # Checks user has required role
│   │   └── admin.guard.ts         # Restricts to ADMIN only
│   ├── interceptors/
│   │   └── jwt.interceptor.ts     # Adds JWT token to requests
│   ├── services/
│   │   ├── auth.service.ts        # Authentication state management
│   │   ├── patient.service.ts     # Patient API calls
│   │   ├── appointment.service.ts # Appointment API calls
│   │   ├── encounter.service.ts   # Encounter API calls
│   │   ├── consultation.service.ts# Consultation API calls
│   │   ├── episode.service.ts     # Episode API calls
│   │   ├── billing.service.ts     # Billing API calls
│   │   ├── notification.service.ts# WebSocket + HTTP notifications
│   │   ├── user.service.ts        # User management
│   │   ├── bed-management.service.ts # Bed management
│   │   ├── nurse.service.ts       # Nurse operations
│   │   └── dashboard.service.ts   # Dashboard data
│   ├── models/
│   │   ├── auth.model.ts          # Auth interfaces
│   │   └── hms.model.ts           # All entity interfaces
│   └── enums/
│       └── role.enum.ts           # Role enum
├── features/
│   ├── authentication/
│   │   └── login/                 # Login component
│   ├── patients/
│   │   ├── patient-list/          # Patient list with search
│   │   └── patient-form/          # Patient registration form
│   ├── appointments/
│   │   ├── appointment-list/      # Appointment list
│   │   └── appointment-form/      # Appointment booking form
│   ├── encounters/
│   │   ├── encounter-list/        # Encounter list
│   │   └── checkin-form/          # Patient check-in form
│   ├── consultations/
│   │   └── consultation-form/     # Consultation form
│   ├── episodes/
│   │   ├── episode-list/          # Episode list
│   │   └── episode-form/          # Episode creation form
│   ├── billing/
│   │   ├── bill-list/             # Bill list
│   │   └── bill-detail/           # Bill detail with items
│   ├── service-catalog/
│   │   └── service-list/          # Service management
│   ├── bed-management/
│   │   ├── ward-list/             # Ward management
│   │   ├── bed-list/              # Bed management
│   │   ├── request-form/          # Bed request form
│   │   ├── request-queue/         # Priority queue
│   │   └── bed-calendar/          # Monthly calendar
│   ├── nurse/
│   │   ├── doctor-patients/       # Doctor's patient list
│   │   └── patient-case/          # Patient case monitoring
│   ├── users/
│   │   ├── user-list/             # User management
│   │   └── user-form/             # User creation form
│   └── dashboard/
│       ├── admin-dashboard/       # Admin dashboard
│       ├── doctor-dashboard/      # Doctor dashboard
│       ├── frontdesk-dashboard/   # Frontdesk dashboard
│       ├── nurse-dashboard/       # Nurse dashboard
│       └── bed-manager-dashboard/ # Bed manager dashboard
├── layout/
│   └── main-layout/
│       ├── main-layout.component.ts   # Shell with sidebar
│       ├── sidebar.component.ts       # Navigation sidebar
│       └── header.component.ts        # Header with notifications
└── shared/
    └── components/
        └── notification-panel.component.ts # Notification dropdown
```

### 9.2 Routing

```typescript
const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: AdminDashboardComponent, canActivate: [adminGuard] },
      { path: 'doctor-dashboard', component: DoctorDashboardComponent, canActivate: [roleGuard(['DOCTOR'])] },
      { path: 'frontdesk-dashboard', component: FrontdeskDashboardComponent, canActivate: [roleGuard(['FRONTDESK'])] },
      { path: 'nurse-dashboard', component: NurseDashboardComponent, canActivate: [roleGuard(['NURSE'])] },
      { path: 'bed-manager-dashboard', component: BedManagerDashboardComponent, canActivate: [roleGuard(['BED_MANAGER'])] },
      { path: 'patients', component: PatientListComponent },
      { path: 'appointments', component: AppointmentListComponent },
      { path: 'encounters', component: EncounterListComponent },
      { path: 'billing', component: BillListComponent },
      { path: 'episodes', component: EpisodeListComponent },
      { path: 'consultation/:encounterId', component: ConsultationFormComponent },
      { path: 'service-catalog', component: ServiceListComponent },
      { path: 'users', component: UserListComponent, canActivate: [adminGuard] },
      { path: 'nurse/doctor-patients', component: DoctorPatientsComponent, canActivate: [roleGuard(['NURSE'])] },
      { path: 'nurse/case/:encounterId', component: PatientCaseComponent, canActivate: [roleGuard(['NURSE'])] },
      { path: 'nurse/bed-management', component: BedManagementComponent, canActivate: [roleGuard(['NURSE', 'BED_MANAGER'])] },
      { path: '', redirectTo: '/dashboard', pathMatch: 'full' }
    ]
  }
];
```

### 9.3 State Management

**AuthService** (RxJS BehaviorSubject):
```typescript
private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
readonly isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

private currentUsername: string;
private currentRole: Role | null;

// Methods
login(credentials): Observable<AuthResponse>
logout(): void
isLoggedIn(): boolean
getUserRole(): Role | null
getUsername(): string
hasAnyRole(roles: Role[]): boolean
getDashboardRoute(): string
```

**NotificationService** (RxJS BehaviorSubject + WebSocket):
```typescript
private notificationsSubject = new BehaviorSubject<Notification[]>([]);
private unreadCountSubject = new BehaviorSubject<number>(0);

public notifications$ = this.notificationsSubject.asObservable();
public unreadCount$ = this.unreadCountSubject.asObservable();

// WebSocket connection
private stompClient: Client | null;

// Methods
connect(): void
disconnect(): void
subscribeToNotifications(): void
handleIncomingNotification(message): void
requestNotificationPermission(): void
```

### 9.4 HTTP Interceptor

**JwtInterceptor**:
```typescript
intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
  // Read accessToken from cookie
  const token = this.readCookie('accessToken');
  
  if (token) {
    // Clone request and add Authorization header
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  return next.handle(req);
}
```

### 9.5 Guards

**authGuard**:
```typescript
// Checks if user is authenticated
// Redirects to /login if not
canActivate(): boolean {
  if (this.authService.isLoggedIn()) {
    return true;
  }
  this.router.navigate(['/login']);
  return false;
}
```

**roleGuard**:
```typescript
// Checks if user has required role
// Redirects to appropriate dashboard if not
canActivate(route: ActivatedRouteSnapshot): boolean {
  const requiredRoles = route.data['roles'] as Role[];
  if (this.authService.hasAnyRole(requiredRoles)) {
    return true;
  }
  this.router.navigate([this.authService.getDashboardRoute()]);
  return false;
}
```

### 9.6 Dashboard Visualizations

**Chart.js Integration**:
All dashboards use Chart.js 4.5.1 for professional data visualization:

**Chart Types Used**:
- **Line Charts**: Daily trends, revenue trends, patient flow
- **Bar Charts**: Department statistics, appointment counts
- **Doughnut Charts**: Encounter status distribution, bed occupancy
- **Mixed Charts**: Combined appointment and consultation trends

**FullCalendar Integration**:
- **Admin Dashboard**: Full appointment calendar with month/week/day views
- **Doctor Dashboard**: Personal appointment calendar
- **Frontdesk Dashboard**: Today's appointment timeline
- **Features**: Drag-and-drop, color-coded by status, click to view details

**Dashboard-Specific Charts**:

**Admin Dashboard**:
1. **Daily Trends Line Chart**: Patient registrations, appointments, consultations over 30 days
2. **Revenue Trend Line Chart**: Daily revenue over 30 days with area fill
3. **Department Bar Chart**: Appointments by department (Cardiology, Orthopedics, etc.)
4. **Encounter Status Doughnut**: Distribution of WAITING, IN_CONSULTATION, COMPLETED, CANCELLED
5. **Full Calendar**: All appointments with color coding by status
6. **KPI Cards**: Total patients, revenue, appointments, consultations

**Doctor Dashboard**:
1. **Today's Queue Bar Chart**: Patients by status (Waiting, In Consultation, Completed)
2. **Weekly Consultation Trend**: Line chart showing consultations over past 7 days
3. **Patient Priority Doughnut**: Distribution of URGENT, HIGH, NORMAL, LOW priority patients
4. **Personal Calendar**: Doctor's appointments with patient names
5. **KPI Cards**: Queue size, completed today, total consultations, active episodes

**Frontdesk Dashboard**:
1. **Today's Check-ins Line Chart**: Hourly check-in pattern
2. **Appointment Status Doughnut**: Today's appointments by status
3. **Revenue Bar Chart**: Today's revenue by payment method (Cash, Card, UPI, Insurance)
4. **Timeline View**: Today's appointments in chronological order
5. **KPI Cards**: Today's appointments, waiting patients, pending bills, today's revenue

**Nurse Dashboard**:
1. **Bed Occupancy Doughnut**: Occupied vs Available beds by type (ICU, General, Private)
2. **Patient Monitoring Bar Chart**: Patients by doctor
3. **Priority Requests Line Chart**: Bed requests by priority over time
4. **Ward Status Grid**: Visual grid showing bed status
5. **KPI Cards**: Assigned patients, pending requests, critical alerts

**Bed Manager Dashboard**:
1. **Occupancy Rate Line Chart**: Bed occupancy percentage over 30 days
2. **Ward Comparison Bar Chart**: Occupancy by ward
3. **Request Status Doughnut**: Pending, Under Review, Allocated, Rejected
4. **Monthly Calendar**: Bed allocation timeline
5. **KPI Cards**: Total beds, occupied, available, pending requests

**Chart Configuration**:
```typescript
// Professional chart styling
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        usePointStyle: true,
        padding: 15,
        font: { size: 12, family: 'Inter, sans-serif' }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      titleFont: { size: 14, weight: 'bold' },
      bodyFont: { size: 13 },
      borderColor: '#ddd',
      borderWidth: 1
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(0, 0, 0, 0.05)' },
      ticks: { font: { size: 11 } }
    },
    x: {
      grid: { display: false },
      ticks: { font: { size: 11 } }
    }
  }
};
```

**Color Palette**:
- Primary: #667eea (Purple)
- Success: #66BB6A (Green)
- Warning: #FFA726 (Orange)
- Danger: #EF5350 (Red)
- Info: #42A5F5 (Blue)
- Secondary: #9E9E9E (Gray)

### 9.7 Search and Filter Features

**Bed Management Search**

The bed management module includes comprehensive search functionality available to both Nurse and Admin roles:

**Search Capabilities**:
- Search by bed number (e.g., "B101", "ICU-05")
- Search by ward name (e.g., "ICU", "General Ward")
- Case-insensitive partial matching
- Real-time filtering as you type

**Filter Options**:
- Ward filter (dropdown of all wards)
- Bed type filter (GENERAL, ICU, PRIVATE)
- Status filter (AVAILABLE, OCCUPIED, MAINTENANCE)
- Combined filters work together for precise results

**UI Features**:
- Search input with icon and clear button
- Filter dropdowns with "All" option
- Results update instantly
- Pagination preserved during filtering
- Visual feedback for active filters

**Implementation Details**:
- Component: `bed-management-workspace.component.ts`
- Search query variable: `bedSearchQuery`
- Filter method: `applyBedFilters()`
- Clear method: `clearSearch()`
- Filters beds from `allBeds` array to `filteredBeds`
- Resets to page 1 when filters change

**Access**:
- Nurse role: Via `/nurse/bed-management` route
- Admin role: Via bed management workspace
- Both roles have identical search functionality

**Example Usage**:
```typescript
// Search for ICU beds
bedSearchQuery = 'ICU';
applyBedFilters(); // Returns all beds with 'ICU' in bed number or ward name

// Filter by status
selectedStatusFilter = 'AVAILABLE';
applyBedFilters(); // Returns only available beds

// Combined search and filter
bedSearchQuery = 'B1';
selectedWardFilter = '1'; // Ward ID
selectedTypeFilter = 'GENERAL';
applyBedFilters(); // Returns general beds in ward 1 with 'B1' in bed number
```

**Bed Allocation Requests Search**

The "My Bed Allocation Requests" page includes comprehensive search and filter functionality for nurses:

**Search Capabilities**:
- Search by patient name (e.g., "Het kachhiya", "mihir")
- Search by patient UHID (e.g., "UHID-00001")
- Search by encounter number (e.g., "ENC-2026-00001")
- Case-insensitive partial matching
- Real-time filtering as you type

**Filter Options**:
- Status filter: All Status, Requested, Under Review, Allocated, Rejected
- Priority filter: All Priority, Urgent, High, Normal, Low
- Bed Type filter: All Bed Types, General, ICU, Private
- Combined filters work together for precise results

**UI Features**:
- Search input with icon and clear button
- Three dropdown filters for status, priority, and bed type
- Results update instantly as you type or change filters
- Empty state with "Clear Filters" button when no results match
- Responsive design for mobile devices

**Implementation Details**:
- Component: `bed-request.component.ts`
- Search query variable: `searchQuery`
- Filter variables: `statusFilter`, `priorityFilter`, `bedTypeFilter`
- Filter method: `applyFilters()`
- Clear methods: `clearSearch()`, `clearAllFilters()`
- Filters requests from `requests` array to `filteredRequests`

**Access**:
- Nurse role: Via `/nurse/bed-request` route or "Bed Management" menu
- Displays only requests created by the logged-in nurse

**Example Usage**:
```typescript
// Search for patient by name
searchQuery = 'Het';
applyFilters(); // Returns all requests for patients with 'Het' in their name

// Filter by status
statusFilter = 'ALLOCATED';
applyFilters(); // Returns only allocated requests

// Combined search and filters
searchQuery = 'ENC-2026';
statusFilter = 'REQUESTED';
priorityFilter = 'URGENT';
bedTypeFilter = 'ICU';
applyFilters(); // Returns urgent ICU requests with 'ENC-2026' in encounter number
```

### 9.8 Appointment Calendar

**Doctor Dashboard Calendar**

Each doctor has a personal appointment calendar showing only their appointments:

**Features**:
- Displays all appointments for the logged-in doctor
- Three view modes: Month, Week (default), Day
- Time grid view from 8:00 AM to 8:00 PM
- Color-coded by appointment status
- Click event to view full appointment details
- Real-time "now" indicator
- No date range filter - shows all appointments

**Calendar Views**:
- **Month View**: Overview of all appointments in the month
- **Week View** (Default): Detailed time slots for the week
- **Day View**: Hour-by-hour schedule for a single day

**Event Display**:
- Title: Patient name
- Color: Status-based (Scheduled: Purple, Confirmed: Green, Completed: Blue, Cancelled: Red, No Show: Orange)
- Click: Shows patient name, UHID, department, status, and time

**API Endpoint**:
- `GET /api/appointments/doctor/all`
- Returns all appointments for authenticated doctor
- Uses JWT authentication to identify doctor

**Admin Dashboard Calendar**

Admin can view all appointments across all doctors:

**Features**:
- Displays all appointments from all doctors
- Same three view modes: Month, Week, Day
- Event title shows: "Patient Name - Dr. Doctor Name"
- Color-coded by appointment status
- Click event to view full details
- No date range filter - shows all appointments

**API Endpoint**:
- `GET /api/appointments`
- Returns all appointments in the system
- Admin-only access

**Status Color Coding**:
- SCHEDULED: #667eea (Purple)
- CONFIRMED: #66BB6A (Green)
- COMPLETED: #42A5F5 (Blue)
- CANCELLED: #EF5350 (Red)
- NO_SHOW: #FFA726 (Orange)

### 9.9 Real-Time Notifications

**WebSocket Configuration**

The HMS uses native WebSocket (not SockJS polling) for real-time notifications:

**Connection Details**:
- Protocol: Native WebSocket (ws://)
- Endpoint: `ws://localhost:8080/ws`
- Authentication: JWT token in connect headers
- Fallback: SockJS available at `/ws` with SockJS
- Reconnection: Automatic with 5-second delay
- Heartbeat: 4 seconds incoming/outgoing

**Notification Channels**:
- User-specific: `/user/queue/notifications` (personal notifications)
- Role-based: `/topic/notifications/{role}` (broadcast to role)

**Features**:
- Real-time push notifications
- Browser notifications (with permission)
- Unread count badge
- Mark as read functionality
- Notification panel with dropdown
- Auto-reconnect on connection loss

**Implementation**:
- Frontend: `@stomp/stompjs` client
- Backend: Spring WebSocket with STOMP
- Security: JWT authentication for WebSocket connections
- No polling - pure WebSocket connection

**Notification Types**:
- APPOINTMENT: Appointment-related notifications
- BED_ALLOCATION: Bed allocation updates
- GENERAL: General system notifications

---

## 10. Setup & Configuration

### 10.1 Prerequisites

**Backend**:
- Java 21 or higher
- Maven 3.8+
- MySQL 8.0+
- IDE (IntelliJ IDEA, Eclipse, VS Code)

**Frontend**:
- Node.js 18+ and npm 9+
- Angular CLI 21+
- Modern web browser

### 10.2 Backend Setup

**1. Clone Repository**:
```bash
git clone <repository-url>
cd HMS-backend
```

**2. Configure Database**:
```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE medicaldb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'hms_user'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON medicaldb.* TO 'hms_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**3. Configure application.properties**:
```properties
# Database
spring.datasource.url=jdbc:mysql://localhost:3306/medicaldb
spring.datasource.username=hms_user
spring.datasource.password=password

# JWT
jwt.secret=your-256-bit-secret-key-here
jwt.expiration=86400000
jwt.refresh-expiration=604800000

# Cookie
cookie.secure=false

# Email (Gmail example)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
app.mail.from=noreply@hospital.com
```

**4. Gmail App Password Setup**:
```
1. Go to Google Account Settings
2. Security → 2-Step Verification (enable)
3. App Passwords → Generate new
4. Select "Mail" and "Other"
5. Copy 16-character password
6. Use in spring.mail.password
```

**5. Build and Run**:
```bash
# Build
./mvnw clean install

# Run
./mvnw spring-boot:run

# Or run JAR
java -jar target/HMS-backend-0.0.1-SNAPSHOT.jar
```

**6. Verify**:
```bash
# Health check
curl http://localhost:8080/actuator/health

# Should return: {"status":"UP"}
```

### 10.3 Frontend Setup

**1. Navigate to Frontend**:
```bash
cd Frontend
```

**2. Install Dependencies**:
```bash
npm install
```

**3. Configure Environment**:
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};

// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://your-domain.com/api'
};
```

**4. Run Development Server**:
```bash
npm start
# or
ng serve

# Application runs on http://localhost:4200
```

**5. Build for Production**:
```bash
npm run build
# Output in dist/crud-prac/browser/
```

### 10.4 Initial Data Setup

**Default Admin User**:
The system should have a default admin user created via DataInitializer:
```
Username: admin
Password: admin
Role: ADMIN
```

**Create Additional Users**:
```bash
# Login as admin
# Navigate to Users → Create User
# Fill in details and submit
# User receives welcome email with credentials
```

### 10.5 Environment Variables (Production)

**Backend**:
```bash
export DB_URL=jdbc:mysql://prod-db:3306/medicaldb
export DB_USERNAME=prod_user
export DB_PASSWORD=secure_password
export JWT_SECRET=your-production-secret-256-bits
export MAIL_HOST=smtp.gmail.com
export MAIL_USERNAME=noreply@hospital.com
export MAIL_PASSWORD=app-password
export MAIL_FROM=noreply@hospital.com
export COOKIE_SECURE=true
```

**Frontend**:
Update `environment.prod.ts` with production API URL.

---

## 11. Deployment Guide

### 11.1 Backend Deployment

**Option A: JAR Deployment**:
```bash
# Build
./mvnw clean package -DskipTests

# Copy to server
scp target/HMS-backend-0.0.1-SNAPSHOT.jar user@server:/opt/hms/

# Run on server
java -jar /opt/hms/HMS-backend-0.0.1-SNAPSHOT.jar \
  --spring.datasource.url=jdbc:mysql://localhost:3306/medicaldb \
  --spring.datasource.username=user \
  --spring.datasource.password=pass
```

**Option B: Docker**:
```dockerfile
FROM openjdk:21-jdk-slim
WORKDIR /app
COPY target/HMS-backend-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

```bash
# Build image
docker build -t hms-backend .

# Run container
docker run -d -p 8080:8080 \
  -e DB_URL=jdbc:mysql://db:3306/medicaldb \
  -e DB_USERNAME=user \
  -e DB_PASSWORD=pass \
  -e MAIL_USERNAME=email@gmail.com \
  -e MAIL_PASSWORD=app-password \
  --name hms-backend \
  hms-backend
```

**Option C: Systemd Service**:
```ini
# /etc/systemd/system/hms-backend.service
[Unit]
Description=HMS Backend Service
After=network.target mysql.service

[Service]
Type=simple
User=hms
WorkingDirectory=/opt/hms
ExecStart=/usr/bin/java -jar /opt/hms/HMS-backend-0.0.1-SNAPSHOT.jar
EnvironmentFile=/opt/hms/.env
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable hms-backend
sudo systemctl start hms-backend
sudo systemctl status hms-backend
```

### 11.2 Frontend Deployment

**Option A: Nginx**:
```nginx
# /etc/nginx/sites-available/hms-frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    root /var/www/hms-frontend;
    index index.html;
    
    # Angular routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket proxy
    location /ws/ {
        proxy_pass http://localhost:8080/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

```bash
# Copy build files
sudo cp -r dist/crud-prac/browser/* /var/www/hms-frontend/

# Enable site
sudo ln -s /etc/nginx/sites-available/hms-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**Option B: Docker**:
```dockerfile
FROM nginx:alpine
COPY dist/crud-prac/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 11.3 SSL/TLS Setup

**Let's Encrypt (Free SSL)**:
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### 11.4 Production Checklist

**Backend**:
- [ ] Update CORS origins in WebSocketConfig
- [ ] Set cookie.secure=true
- [ ] Use strong JWT secret (256-bit)
- [ ] Configure production database
- [ ] Set up email service (Gmail/SendGrid/SES)
- [ ] Enable HTTPS
- [ ] Configure firewall rules
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy

**Frontend**:
- [ ] Update environment.prod.ts with production API URL
- [ ] Build with production flag
- [ ] Enable gzip compression
- [ ] Configure CDN (optional)
- [ ] Set up SSL certificate
- [ ] Configure caching headers

**Database**:
- [ ] Create production database
- [ ] Set up regular backups
- [ ] Configure replication (optional)
- [ ] Optimize indexes
- [ ] Set up monitoring

**Security**:
- [ ] Change default admin password
- [ ] Review user permissions
- [ ] Enable firewall
- [ ] Configure rate limiting
- [ ] Set up intrusion detection
- [ ] Regular security audits

---

## 12. Testing

### 12.1 Manual Testing

**Test Authentication**:
```bash
# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' \
  -c cookies.txt

# Should return: {"username":"admin","role":"ADMIN"}
# Cookies stored in cookies.txt
```

**Test Patient Registration**:
```bash
curl -X POST http://localhost:8080/api/patients \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "firstName":"John",
    "lastName":"Doe",
    "gender":"MALE",
    "dob":"1990-01-15",
    "phone":"9876543210",
    "email":"john.doe@example.com"
  }'
```

**Test WebSocket Connection**:
1. Login to frontend
2. Open browser console (F12)
3. Look for: "WebSocket connected"
4. Create a new user as admin
5. Verify notification appears instantly

**Test Email**:
1. Configure SMTP settings
2. Login as admin
3. Create new user with valid email
4. Check email inbox for welcome message

### 12.2 Testing Workflows

**Complete Patient Journey**:
```
1. Register patient → Verify UHID generated
2. Book appointment → Verify notification to doctor
3. Check in patient → Verify encounter created
4. Doctor consultation → Verify consultation saved
5. Create bill → Verify bill generated
6. Record payment → Verify payment status updated
```

**Bed Management Workflow**:
```
1. Nurse creates bed request → Verify notification to bed manager
2. Bed manager reviews → Verify status updated
3. Bed manager allocates → Verify notification to nurse
4. Nurse admits patient → Verify bed status changed
5. Nurse discharges → Verify bed available again
```

### 12.3 Performance Testing

**Load Testing with Apache Bench**:
```bash
# Install
sudo apt install apache2-utils

# Test API endpoint
ab -n 1000 -c 10 http://localhost:8080/api/patients

# Results show:
# - Requests per second
# - Time per request
# - Transfer rate
```

**WebSocket Load Testing**:
```bash
# Install artillery
npm install -g artillery

# Create test file: websocket-test.yml
config:
  target: "http://localhost:8080"
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - engine: ws
    flow:
      - connect:
          url: "/ws"
      - think: 30

# Run test
artillery run websocket-test.yml
```

### 12.4 Troubleshooting

**Backend Not Starting**:
```bash
# Check logs
tail -f logs/spring.log

# Common issues:
# - Database connection failed → Check MySQL running
# - Port 8080 already in use → Kill process or change port
# - JWT secret too short → Use 256-bit secret
```

**WebSocket Not Connecting**:
```bash
# Check browser console for errors
# Common issues:
# - CORS error → Update WebSocketConfig allowed origins
# - JWT token invalid → Check cookie exists
# - Backend not running → Start backend
# - Firewall blocking → Allow port 8080
```

**Email Not Sending**:
```bash
# Check backend logs for email errors
# Common issues:
# - Gmail blocking → Use App Password
# - SMTP credentials wrong → Verify username/password
# - Port blocked → Check firewall allows 587/465
# - 2FA not enabled → Enable 2-Step Verification
```

**Database Connection Issues**:
```bash
# Test MySQL connection
mysql -u hms_user -p medicaldb

# Common issues:
# - User doesn't exist → Create user
# - Password wrong → Reset password
# - Database doesn't exist → Create database
# - MySQL not running → Start MySQL service
```

**Frontend Build Errors**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Common issues:
# - Node version mismatch → Use Node 18+
# - Dependency conflicts → Update package.json
# - TypeScript errors → Check type imports
```

**CORS Errors**:
```bash
# Backend: Update SecurityConfig.java
config.setAllowedOrigins(List.of("http://localhost:4200"));

# Frontend: Check environment.ts
apiUrl: 'http://localhost:8080/api'
```

### 12.5 Monitoring

**Application Logs**:
```bash
# Backend logs
tail -f HMS-backend/logs/spring.log

# Filter for errors
grep -i error HMS-backend/logs/spring.log

# Filter for WebSocket
grep -i websocket HMS-backend/logs/spring.log
```

**Database Monitoring**:
```sql
-- Check active connections
SHOW PROCESSLIST;

-- Check table sizes
SELECT 
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
FROM information_schema.TABLES
WHERE table_schema = 'medicaldb'
ORDER BY size_mb DESC;

-- Check slow queries
SHOW VARIABLES LIKE 'slow_query_log';
```

**System Resources**:
```bash
# CPU and memory usage
top

# Disk usage
df -h

# Network connections
netstat -tulpn | grep 8080
```

---

## 13. Appendix

### 13.1 Common Error Codes

| Code | Message | Solution |
|------|---------|----------|
| 401 | Unauthorized | Login required or token expired |
| 403 | Forbidden | Insufficient permissions for this action |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource (e.g., username exists) |
| 500 | Internal Server Error | Check backend logs |

### 13.2 Database Backup

**Manual Backup**:
```bash
mysqldump -u hms_user -p medicaldb > backup_$(date +%Y%m%d).sql
```

**Automated Backup Script**:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
mysqldump -u hms_user -p'password' medicaldb > $BACKUP_DIR/medicaldb_$DATE.sql
find $BACKUP_DIR -name "medicaldb_*.sql" -mtime +7 -delete
```

**Restore Backup**:
```bash
mysql -u hms_user -p medicaldb < backup_20260323.sql
```

### 13.3 Performance Optimization

**Database Indexes**:
```sql
-- Already created indexes (see Database Schema section)
-- Add custom indexes based on query patterns
CREATE INDEX idx_custom ON table_name(column_name);
```

**Connection Pooling**:
```properties
# application.properties
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=30000
```

**Caching**:
```java
@EnableCaching
public class CacheConfig {
    @Bean
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager("users", "patients");
    }
}
```

### 13.4 Security Best Practices

1. **Password Policy**:
   - Minimum 8 characters
   - Mix of uppercase, lowercase, numbers, special characters
   - Change default admin password immediately

2. **JWT Security**:
   - Use strong secret (256-bit minimum)
   - Short expiration time (24h for access token)
   - Rotate refresh tokens

3. **Database Security**:
   - Use separate database user for application
   - Grant only necessary privileges
   - Regular security updates

4. **Network Security**:
   - Use HTTPS in production
   - Configure firewall rules
   - Limit database access to application server

5. **Application Security**:
   - Input validation on all endpoints
   - SQL injection prevention (JPA handles this)
   - XSS prevention (Angular handles this)
   - CSRF protection enabled

---

## 14. Smart Search System

### Overview

The HMS implements a production-ready smart search system that combines multiple search strategies to provide accurate and relevant results even when users make typos or search phonetically. The system is optimized for performance with database-level filtering and in-memory ranking.

### Search Strategies

The smart search system uses a multi-tier approach with the following strategies (in order of priority):

1. **Exact Match** (Score: 100)
   - Direct match of normalized input
   - Highest priority and score

2. **Prefix Match** (Score: 95)
   - Text starts with the search query
   - Example: "john" matches "John Doe"

3. **Contains Match** (Score: 90)
   - Text contains the search query anywhere
   - Example: "doe" matches "John Doe"

4. **Phonetic Match** (Score: 80-85)
   - Uses Double Metaphone algorithm
   - Handles pronunciation variations
   - Example: "jon" matches "John", "zil" matches "Zeel"

5. **Fuzzy Match** (Score: 70-84)
   - Uses Levenshtein distance algorithm
   - Handles typos and misspellings
   - Example: "jhon" matches "John"

### Architecture

#### Components

**1. PhoneticSearchUtil** (`util/PhoneticSearchUtil.java`)
- Generates phonetic keys using Double Metaphone algorithm
- Calculates phonetic similarity scores
- Provides Levenshtein distance calculation
- Normalizes text for consistent processing

**2. SmartSearchService** (`search/SmartSearchService.java`)
- Core search service combining all strategies
- Supports single-field and multi-field search
- Ranks results by relevance score
- Optimized with early termination

**3. SearchResult** (`search/SearchResult.java`)
- Generic wrapper for search results
- Contains data, score, match type, and matched field
- Implements Comparable for automatic sorting

**4. SearchConfig** (`config/SearchConfig.java`)
- Configurable search parameters
- Thresholds for fuzzy and phonetic matching
- Enable/disable individual strategies
- Maximum results limit

### Database Schema

#### Phonetic Fields

**patients table:**
```sql
ALTER TABLE patients
ADD COLUMN first_name_phonetic VARCHAR(10),
ADD COLUMN last_name_phonetic VARCHAR(10),
ADD COLUMN full_name_phonetic VARCHAR(20);

CREATE INDEX idx_patients_first_name_phonetic ON patients(first_name_phonetic);
CREATE INDEX idx_patients_last_name_phonetic ON patients(last_name_phonetic);
CREATE INDEX idx_patients_full_name_phonetic ON patients(full_name_phonetic);
```

**users table:**
```sql
ALTER TABLE users
ADD COLUMN username_phonetic VARCHAR(10);

CREATE INDEX idx_users_username_phonetic ON users(username_phonetic);
```

### Search Flow

```
1. USER ENTERS SEARCH QUERY
   ├─→ Query: "zil" (looking for patient "Zeel")
   │
2. DATABASE FILTERING (Prevents Full Table Scan)
   ├─→ LIKE search: firstName/lastName/UHID/phone LIKE '%zil%'
   ├─→ Phonetic search: Generate phonetic key for "zil" → "SL"
   ├─→ Find patients with phonetic keys matching "SL"
   ├─→ Multi-word search: Split query and search each word
   └─→ Result: Candidate list (e.g., 50 patients)
   │
3. IN-MEMORY RANKING (Smart Search Service)
   ├─→ For each candidate:
   │   ├─→ Check exact match → Score: 100
   │   ├─→ Check prefix match → Score: 95
   │   ├─→ Check contains match → Score: 90
   │   ├─→ Check phonetic match → Score: 80-85
   │   └─→ Check fuzzy match → Score: 70-84
   │
4. MULTI-FIELD SEARCH
   ├─→ Search across: UHID, phone, firstName, lastName, fullName
   ├─→ Keep best match per patient
   ├─→ Track which field matched
   │
5. SORT AND LIMIT
   ├─→ Sort by score (descending)
   ├─→ Sort by match type priority (exact > prefix > contains > phonetic > fuzzy)
   ├─→ Limit to configured max results (default: 50)
   │
6. RETURN RESULTS
   └─→ Patient list with relevance scores
```

### Configuration

**application.properties:**
```properties
# Smart Search Configuration
hms.search.max-results=50
hms.search.fuzzy-threshold=70
hms.search.phonetic-threshold=80
hms.search.max-levenshtein-distance=3
hms.search.phonetic-enabled=true
hms.search.fuzzy-enabled=true
```

### Usage Example

**PatientService.java:**
```java
public List<PatientResponse> searchPatients(String query) {
    // Step 1: Get candidates from database
    List<Patient> candidates = getCandidatesFromDatabase(query);
    
    // Step 2: Multi-field smart search
    Map<String, Function<Patient, String>> fieldExtractors = new LinkedHashMap<>();
    fieldExtractors.put("uhid", Patient::getUhid);
    fieldExtractors.put("phone", Patient::getPhone);
    fieldExtractors.put("firstName", Patient::getFirstName);
    fieldExtractors.put("lastName", Patient::getLastName);
    fieldExtractors.put("fullName", p -> p.getFirstName() + " " + p.getLastName());
    
    List<SearchResult<Patient>> results = smartSearchService.multiFieldSearch(
        query, candidates, fieldExtractors
    );
    
    // Step 3: Convert to DTOs
    return results.stream()
        .map(result -> patientMapper.toResponse(result.getData()))
        .collect(Collectors.toList());
}
```

### Performance Optimizations

1. **Database-Level Filtering**
   - LIKE queries with indexes
   - Phonetic key indexes
   - Prevents full table scans

2. **Early Termination**
   - Levenshtein distance calculation stops early if threshold exceeded
   - Reduces unnecessary computation

3. **Result Limiting**
   - Configurable max results (default: 50)
   - Prevents memory issues with large datasets

4. **Normalized Input**
   - Lowercase conversion
   - Special character removal
   - Multiple spaces to single space
   - Consistent comparison

5. **Phonetic Key Caching**
   - Phonetic keys stored in database
   - Generated once on create/update
   - No runtime computation

### Search Examples

| Query | Patient Name | Match Type | Score | Explanation |
|-------|-------------|------------|-------|-------------|
| "john" | "John Doe" | EXACT | 100 | Exact match on first name |
| "joh" | "John Doe" | PREFIX | 95 | First name starts with query |
| "doe" | "John Doe" | CONTAINS | 90 | Last name contains query |
| "jon" | "John Doe" | PHONETIC | 85 | Phonetically similar |
| "jhon" | "John Doe" | FUZZY | 80 | Typo with 1 character difference |
| "zil" | "Zeel Patel" | PHONETIC | 85 | Phonetic variation |
| "patel j" | "John Patel" | CONTAINS | 90 | Multi-word search |

### API Integration

**Patient Search Endpoint:** `GET /api/patients/search?query={query}`

**Request:**
```http
GET /api/patients/search?query=zil
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": 1,
    "uhid": "UHID-20260323-0001",
    "firstName": "Zeel",
    "lastName": "Patel",
    "phone": "9876543210",
    "email": "zeel.patel@example.com"
  }
]
```

**User Search Endpoint:** `GET /api/users/search?query={query}`

**Request:**
```http
GET /api/users/search?query=john
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": 1,
    "username": "john.doe",
    "email": "john.doe@hospital.com",
    "role": "DOCTOR",
    "enabled": true,
    "createdAt": "2026-03-20T10:30:00"
  }
]
```

**Service Catalog Search Endpoint:** `GET /api/services/search?query={query}`

**Request:**
```http
GET /api/services/search?query=consultation
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "General Consultation",
    "price": 500.00,
    "description": "General medical consultation",
    "category": "CONSULTATION",
    "active": true
  }
]
```

**Bill Search Endpoint:** `GET /api/bills/search?query={query}`

**Request:**
```http
GET /api/bills/search?query=BILL-001
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": 1,
    "billNumber": "BILL-20260323-0001",
    "patientName": "John Doe",
    "totalAmount": 1500.00,
    "status": "PAID"
  }
]
```

**Consultation Search Endpoint:** `GET /api/consultations/search?patientName={query}`

**Request:**
```http
GET /api/consultations/search?patientName=john
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": 1,
    "encounterId": 5,
    "patientName": "John Doe",
    "doctorName": "Dr. Smith",
    "diagnosis": "Common cold",
    "createdAt": "2026-03-23T14:30:00"
  }
]
```

### Entities with Smart Search

The smart search system is implemented across the following entities:

1. **Patients** ✅
   - Search fields: UHID, phone, firstName, lastName, fullName
   - Phonetic fields: first_name_phonetic, last_name_phonetic, full_name_phonetic
   - Endpoint: `GET /api/patients/search?query={query}`

2. **Users** ✅
   - Search fields: username, email, role
   - Phonetic fields: username_phonetic
   - Endpoint: `GET /api/users/search?query={query}`

3. **Service Catalog** ✅
   - Search fields: name, description, category
   - Endpoint: `GET /api/services/search?query={query}`

4. **Bills** ✅
   - Search fields: billNumber, patientName, patientUhid
   - Endpoint: `GET /api/bills/search?query={query}`

5. **Consultations** ✅
   - Search fields: patientName, patientUhid, doctorName
   - Endpoint: `GET /api/consultations/search?patientName={query}`

### Frontend Integration

All search bars across the application use the smart search system:

**User Management Component:**
```typescript
searchUsers(): void {
  if (!this.searchQuery.trim()) {
    this.users = this.allUsers;
    return;
  }
  
  this.userService.searchUsers(this.searchQuery).subscribe({
    next: (users) => {
      this.users = users;
    }
  });
}
```

**Service Catalog Component:**
```typescript
searchServices(): void {
  if (!this.searchQuery.trim()) {
    this.services = this.allServices;
    return;
  }
  
  this.serviceCatalogService.searchServices(this.searchQuery).subscribe({
    next: (services) => {
      this.services = services;
    }
  });
}
```

**Patient List Component:**
```typescript
searchPatients(): void {
  if (!this.searchQuery.trim()) {
    this.loadRecentPatients();
    return;
  }
  
  this.patientService.searchPatients(this.searchQuery).subscribe({
    next: (patients) => {
      this.patients = patients;
    }
  });
}
```

### Extensibility

The smart search system is designed to be extensible:

1. **Add New Entities**
   - Add phonetic fields to entity
   - Create migration for database columns
   - Update service to use SmartSearchService
   - Define field extractors

2. **Custom Search Strategies**
   - Extend SmartSearchService
   - Add new match types to SearchResult.SearchMatchType
   - Implement custom scoring logic

3. **Configuration**
   - Adjust thresholds in application.properties
   - Enable/disable strategies per environment
   - Tune performance parameters

### Dependencies

**Maven (pom.xml):**
```xml
<dependency>
    <groupId>commons-codec</groupId>
    <artifactId>commons-codec</artifactId>
    <version>1.16.0</version>
</dependency>
```

### Best Practices

1. **Always normalize input** before searching
2. **Use database filtering first** to reduce candidate set
3. **Apply ranking in-memory** for flexibility
4. **Limit results** to prevent performance issues
5. **Index phonetic fields** for fast lookups
6. **Update phonetic keys** on entity create/update
7. **Log search queries** for analytics and debugging
8. **Monitor performance** and adjust thresholds

### Future Enhancements

- Synonym support (e.g., "Dr." → "Doctor")
- Abbreviation handling (e.g., "BP" → "Blood Pressure")
- Multi-language phonetic support
- Machine learning-based ranking
- Search analytics and suggestions
- Autocomplete with smart search
- Search history and favorites

---

## 15. Conclusion

This Hospital Management System provides a comprehensive solution for managing hospital operations with:

✅ **Complete Patient Journey**: From registration to discharge  
✅ **Role-Based Access**: Secure access control for different user types  
✅ **Real-Time Updates**: WebSocket notifications for instant updates  
✅ **Email Notifications**: Professional email templates  
✅ **Bed Management**: Complete workflow from request to discharge  
✅ **Billing System**: Integrated billing with service catalog  
✅ **Audit Trail**: Complete tracking of all changes  
✅ **Modern Tech Stack**: Latest versions of Spring Boot and Angular  
✅ **Production Ready**: Comprehensive documentation and deployment guides  

### Key Achievements

- **10+ Major Features**: Patient, Appointment, Encounter, Consultation, Episode, Billing, Bed Management, etc.
- **50+ API Endpoints**: Complete REST API coverage
- **5 User Roles**: Admin, Doctor, Frontdesk, Nurse, Bed Manager
- **Real-Time Communication**: WebSocket STOMP with auto-reconnection
- **Professional Emails**: HTML templates with branding
- **Complete Workflows**: End-to-end patient care workflows
- **Security**: JWT authentication, role-based access, audit trail
- **Scalable Architecture**: Modular design, clean code, best practices

### Future Enhancements

- Mobile app (React Native/Flutter)
- Advanced analytics and reporting
- Integration with lab systems
- Pharmacy management
- Inventory management
- Telemedicine support
- Multi-language support
- Advanced scheduling algorithms

---

**Version**: 1.0.0  
**Last Updated**: March 23, 2026  
**Status**: Production Ready  

**For Support**: Contact development team  
**Documentation**: This file  
**Repository**: [Your Repository URL]  

---

**End of Documentation**
