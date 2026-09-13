# MediCare Hub - Backend Service

Production-ready, asynchronous REST API and real-time event service for the MediCare Hub enterprise healthcare management platform. Engineered with Django, Django REST Framework (DRF), and Django Channels.

---

## Table of Contents

- [Overview](#overview)
- [Architecture and Technologies](#architecture-and-technologies)
- [Domain Models and Applications](#domain-models-and-applications)
- [Real-Time WebSockets Engine](#real-time-websockets-engine)
- [Security and Authorization](#security-and-authorization)
- [Directory Structure](#directory-structure)
- [Prerequisites](#prerequisites)
- [Installation and Environment Configuration](#installation-and-environment-configuration)
- [Database Migrations and Seeding](#database-migrations-and-seeding)
- [Running the Application](#running-the-application)
- [API Endpoints Reference](#api-endpoints-reference)
- [Automated Testing](#automated-testing)
- [Production Deployment](#production-deployment)
- [License](#license)

---

## Overview

The MediCare Hub backend serves as the central data access and business logic layer for the platform. It provides high-performance RESTful APIs, real-time push events over WebSockets, role-based access management, transactional email delivery, and persistent clinical record tracking.

---

## Architecture and Technologies

- **Runtime & Core Framework**: Python 3.12+, Django 5.1.1, Django REST Framework 3.15.2.
- **Asynchronous & Real-Time**: Django Channels 4.1.0 running on an ASGI event loop (Uvicorn), supporting persistent WebSocket connections.
- **Persistence & ORM**: PostgreSQL via `psycopg2-binary` and `dj-database-url`, with automatic fallback to SQLite for local development.
- **Message Broker & Caching**: Redis 5.2.0 via `django-redis` and `channels-redis` for channel layers and Celery 5.4.0 task scheduling.
- **API Documentation**: OpenAPI 2.0 / Swagger and ReDoc generated dynamically via `drf-yasg`.
- **Security & Authentication**: SimpleJWT 5.3.1 (JSON Web Tokens), `django-axes` for brute-force mitigation, and `django-ratelimit` for endpoint rate limiting.

---

## Domain Models and Applications

The project is structured under the `apps/` package with modular separation of concerns:

### 1. Identity and Roles (`apps/models/user.py`)
- Extends `AbstractBaseUser` and `PermissionsMixin`.
- Identity types: `patient`, `doctor`, `admin`.
- Tracks account verification, activity status, contact details, and authentication metadata.

### 2. Practitioner Profiles (`apps/models/doctor.py`)
- Links one-to-one with `User`.
- Captures specialty, medical license number, years of experience, consultation fee, bio, and administrative verification flag (`is_verified`).

### 3. Patient Profiles (`apps/models/patient.py`)
- Links one-to-one with `User`.
- Captures date of birth, blood group, address, medical allergies, and emergency contact details.

### 4. Appointment Engine (`apps/models/appointment.py`)
- Manages scheduled interactions between patients and verified physicians.
- Statuses: `pending`, `confirmed`, `in_progress`, `completed`, `cancelled`, `no_show`.
- Tracks meeting reason, clinical notes, and unique `video_room_id` for encrypted WebRTC consultations.

### 5. Electronic Medical Records (`apps/models/medical_record.py`)
- Immutable clinical documentation supporting multiple classifications: `diagnosis`, `prescription`, `test_result`, `vaccination`, `surgery`, `other`.
- Supports encrypted or restricted visibility via the `is_confidential` boolean flag and binary attachment storage.

### 6. Digital Prescriptions (`apps/models/prescription.py`)
- Direct physician-issued treatment instructions.
- Tracks diagnosed condition, medication array with dosage instructions, duration, validity end-date, authorized refills, and refills consumed.
- Refill workflow tracks status transitions: `pending`, `approved`, `rejected`.

### 7. Invoicing and Payments (`apps/models/billing.py`)
- Billing invoices linked to appointments or treatments.
- Payment tracking supporting offline, manual, and online settlement statuses: `pending`, `paid`, `cancelled`, `refunded`.

### 8. Authentication Codes (`apps/models/password_reset.py`)
- Temporary 6-digit cryptographic verification codes for password recovery.
- Enforces a 15-minute sliding window expiration, single-use invalidation, and rate limiting.

### 9. Audit Logging Subsystem (`apps/models/audit_log.py`)
- Compliance log recording actor identity, action type, IP address, user-agent string, and JSON payload modifications.

---

## Real-Time WebSockets Engine

The real-time notification engine utilizes Django Channels over ASGI:

- **Protocol Routing**: Handled in `healthcare_project/asgi.py` using `ProtocolTypeRouter`.
- **Authentication**: `JWTAuthMiddlewareStack` (`apps/core/jwt_auth_middleware.py`) validates JWT access tokens supplied in query parameters (`?token=<jwt>`) during the initial WebSocket handshake.
- **Consumer**: `NotificationConsumer` (`apps/api/consumers.py`) establishes user-scoped channel groups (`user_<user_id>`) for real-time unicast push delivery.
- **Fallback Layer**: In local development where Redis is absent, Channels automatically defaults to `channels.layers.InMemoryChannelLayer`.

---

## Security and Authorization

### Role-Based Access Control (RBAC)
Custom permission classes located in `apps/core/permissions.py`:
- `IsAdmin`: Restricts endpoints strictly to users with the `admin` role, staff status, or superuser permissions.
- `IsDoctor`: Restricts access to authenticated practitioners whose profiles are active.
- `IsPatient`: Restricts access to registered patients.
- `IsOwnerOrAdmin`: Object-level check ensuring resource modification is restricted to the resource owner or an administrator.
- `IsOwnerOrDoctorOrAdmin`: Dual-party clinical permission allowing full write access to the assigned physician and administrator, while granting read-only access to the patient.

### Rate Limiting and Attack Prevention
- Password reset endpoints are throttled via `django-ratelimit` to mitigate denial-of-service and credential stuffing attacks.
- Failed authentication attempts trigger account locking policies via `django-axes`.
- Cross-Origin Resource Sharing (CORS) origins are strictly validated against `CORS_ALLOWED_ORIGINS`.

---

## Directory Structure

```
backend/
├── apps/
│   ├── api/                      # Views, consumers, URL routing
│   │   ├── consumers.py          # WebSocket NotificationConsumer
│   │   ├── routing.py            # WebSocket URL patterns
│   │   ├── urls.py               # REST API URL table
│   │   └── views/                # ViewSets and APIView controllers
│   ├── core/                     # Foundational utilities
│   │   ├── jwt_auth_middleware.py# Channels JWT handshake validator
│   │   ├── permissions.py        # RBAC and object-level permission classes
│   │   └── pagination.py         # Standardized page-number pagination
│   ├── models/                   # Relational database models
│   │   ├── appointment.py
│   │   ├── audit_log.py
│   │   ├── billing.py
│   │   ├── doctor.py
│   │   ├── medical_record.py
│   │   ├── notification.py
│   │   ├── password_reset.py
│   │   ├── patient.py
│   │   ├── prescription.py
│   │   └── user.py
│   ├── schemas/                  # DRF serializers and input validators
│   └── utils/                    # Email helpers, audit log utility functions
├── healthcare_project/
│   ├── asgi.py                   # ASGI application entry point (Channels)
│   ├── settings/
│   │   ├── base.py               # Shared project settings
│   │   ├── development.py        # Development configuration
│   │   └── production.py         # Hardened production configuration
│   ├── urls.py                   # Global routing dispatcher
│   └── wsgi.py                   # Standard WSGI entry point
├── manage.py                     # Django management script
├── seed_admin.py                 # Initial administrator seeding script
├── seed_data.py                  # Demo clinical data seeding script
└── requirements.txt              # Production Python package manifest
```

---

## Prerequisites

- Python 3.10, 3.11, or 3.12
- PostgreSQL 14+ (or SQLite for local development)
- Redis 6.0+ (optional for local development, required for production WebSockets)
- Virtualenv or Conda package manager

---

## Installation and Environment Configuration

### 1. Prepare Virtual Environment

```bash
# Windows (PowerShell)
python -m venv venv
.\venv\Scripts\Activate.ps1

# Linux / macOS
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Package Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Configure `.env` File

Create a `.env` file inside the `backend/` directory:

```ini
# Application Mode
DJANGO_ENV=development
SECRET_KEY=change-this-to-a-cryptographically-secure-key-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (Leave unset to use SQLite)
DATABASE_URL=postgres://postgres:password@localhost:5432/medicare_db

# CORS Allowed Origins
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Email SMTP Delivery (Gmail Example)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-account@gmail.com
EMAIL_HOST_PASSWORD=your-16-char-app-password
DEFAULT_FROM_EMAIL=MediCare Hub <noreply@medicare.local>

# Redis Cache and WebSocket Channel Layer (Optional for development)
REDIS_URL=redis://127.0.0.1:6379/1
```

---

## Database Migrations and Seeding

### 1. Apply Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 2. Seed Default Administrator

Run the dedicated administrator seeding utility:

```bash
python seed_admin.py
```

Generated Account:
- **Email**: `admin@medicare.local`
- **Password**: `Admin@Medicare2026!`
- **Role**: `admin` (Active, Staff, Superuser)

### 3. Seed Clinical Sample Data (Optional)

Populate doctors, specialties, and initial appointment records:

```bash
python seed_data.py
```

---

## Running the Application

### Option A: Standard HTTP Development Server

```bash
python manage.py runserver 8000
```

### Option B: Asynchronous ASGI Server (WebSockets Enabled)

```bash
uvicorn healthcare_project.asgi:application --host 127.0.0.1 --port 8000 --reload
```

---

## API Endpoints Reference

All endpoints are namespaced under `/api/v1/`.

### Authentication & Account

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register/` | AllowAny | Register patient or physician account |
| POST | `/api/v1/auth/login/` | AllowAny | Authenticate credentials, return JWT pair |
| POST | `/api/v1/auth/logout/` | IsAuthenticated | Invalidate refresh token |
| GET, PUT | `/api/v1/auth/profile/` | IsAuthenticated | Retrieve or update profile |
| POST | `/api/v1/auth/change-password/` | IsAuthenticated | Update authenticated user password |
| POST | `/api/v1/auth/token/refresh/` | AllowAny | Exchange refresh token for access token |
| POST | `/api/v1/auth/password-reset/` | AllowAny | Generate and dispatch 6-digit reset code |
| POST | `/api/v1/auth/password-reset/confirm/` | AllowAny | Validate code and apply new password |

### Administration Panel

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| GET | `/api/v1/admin/dashboard/` | IsAdmin | Aggregate platform usage metrics |
| GET | `/api/v1/admin/users/` | IsAdmin | Query and filter all system users |
| GET | `/api/v1/admin/users/{id}/` | IsAdmin | Detailed user inspection |
| PATCH | `/api/v1/admin/users/{id}/status/` | IsAdmin | Activate, suspend, or deactivate user |
| GET | `/api/v1/admin/doctors/pending/` | IsAdmin | Retrieve unverified physician applications |
| POST | `/api/v1/admin/doctors/{id}/verify/` | IsAdmin | Approve or revoke physician credentials |
| GET | `/api/v1/admin/audit-logs/` | IsAdmin | Search and filter immutable audit logs |

### Appointments & Telemedicine

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| GET, POST | `/api/v1/appointments/` | IsAuthenticated | List appointments or book consultation |
| GET, PUT | `/api/v1/appointments/{id}/` | IsOwnerOrDoctorOrAdmin | Retrieve or update appointment details |
| POST | `/api/v1/appointments/{id}/cancel/` | IsOwnerOrDoctorOrAdmin | Cancel scheduled appointment |
| POST | `/api/v1/appointments/{id}/reschedule/` | IsOwnerOrDoctorOrAdmin | Adjust consultation time slot |
| GET | `/api/v1/appointments/{id}/video/` | IsOwnerOrDoctorOrAdmin | Obtain WebRTC session credentials |
| GET | `/api/v1/appointments/my/` | IsAuthenticated | Filter appointments for current actor |

### Medical Records (EMR)

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| GET, POST | `/api/v1/medical-records/` | IsAuthenticated | List or document new medical entry |
| GET, PUT | `/api/v1/medical-records/{id}/` | IsOwnerOrDoctorOrAdmin | Retrieve or revise medical entry |
| GET | `/api/v1/medical-records/my/` | IsAuthenticated | Retrieve records owned by current actor |
| GET | `/api/v1/patients/{id}/records/` | IsDoctor / IsAdmin | Retrieve clinical records for a patient |

### Prescriptions & Refills

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| GET, POST | `/api/v1/prescriptions/` | IsAuthenticated | List or issue new digital prescription |
| GET | `/api/v1/prescriptions/{id}/` | IsOwnerOrDoctorOrAdmin | Detailed prescription view |
| GET | `/api/v1/prescriptions/my/` | IsAuthenticated | Active prescriptions for authenticated patient |
| POST | `/api/v1/prescriptions/{id}/refill/` | IsPatient | Submit medication refill request |

### Real-Time Notifications

| Method | Endpoint | Protocol | Description |
|---|---|---|---|
| WS | `/ws/notifications/?token=<jwt>` | WebSocket | Real-time notification channel stream |
| GET | `/api/v1/notifications/` | HTTP | Retrieve notification history |
| PATCH | `/api/v1/notifications/{id}/read/` | HTTP | Mark single notification as read |
| POST | `/api/v1/notifications/read-all/` | HTTP | Mark all user notifications as read |

---

## Automated Testing

Execute the automated test suite covering authentication, permissions, appointment workflows, and medical record logic:

```bash
# Run complete test suite
python manage.py test

# Run tests for specific module
python manage.py test apps.api.tests
```

---

## Production Deployment

### Process Management Architecture

For scalable production environments, run distinct workers for HTTP, ASGI, and background tasks:

1. **ASGI Web Server (Uvicorn / Gunicorn)**:
   ```bash
   gunicorn healthcare_project.asgi:application \
       -w 4 \
       -k uvicorn.workers.UvicornWorker \
       --bind 0.0.0.0:8000
   ```

2. **Celery Worker**:
   ```bash
   celery -A healthcare_project worker -l info
   ```

3. **Celery Beat Scheduler**:
   ```bash
   celery -A healthcare_project beat -l info
   ```

4. **Static Assets**:
   ```bash
   python manage.py collectstatic --noinput
   ```

---

## License

This project is distributed under the MIT License. See the root `LICENSE` file for full licensing terms.
