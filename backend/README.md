# MediCare - Backend Service

Production-ready, asynchronous REST API and healthcare event service for the MediCare telemedicine platform. Engineered with Django 5.1.1, Django REST Framework (DRF), and Django Channels. Deployed on Render with Neon Serverless PostgreSQL.

---

## Table of Contents

- [Overview](#overview)
- [Architecture and Technologies](#architecture-and-technologies)
- [Domain Models and Applications](#domain-models-and-applications)
- [Real-Time and WebSocket Architecture](#real-time-and-websocket-architecture)
- [Background Tasks and Scheduled Jobs](#background-tasks-and-scheduled-jobs)
- [Transactional Email System](#transactional-email-system)
- [Security and Authorization](#security-and-authorization)
- [Directory Structure](#directory-structure)
- [Prerequisites](#prerequisites)
- [Installation and Environment Configuration](#installation-and-environment-configuration)
- [Database Migrations and Seeding](#database-migrations-and-seeding)
- [Running the Application](#running-the-application)
- [API Endpoints Reference](#api-endpoints-reference)
- [Automated Testing](#automated-testing)
- [Production Cloud Deployment (Render & Neon)](#production-cloud-deployment-render--neon)
- [License](#license)

---

## Overview

The MediCare backend serves as the core data engine and business logic layer for the healthcare platform. It provides high-performance RESTful APIs, patient health telemetry tracking, clinical appointment slot generation, direct physician messaging, digital prescription management, cash/desk invoice billing with PDF export, transactional email delivery, and persistent electronic medical records (EMR).

---

## Architecture and Technologies

- **Runtime & Framework**: Python 3.11 / 3.12, Django 5.1.1, Django REST Framework 3.15.2.
- **Asynchronous Protocol Engine**: Django Channels 4.1.0 supporting WebSocket connections over ASGI.
- **Database & ORM**: PostgreSQL via `psycopg2-binary` and `dj-database-url` (configured for Neon Serverless PostgreSQL with SSL pooling). Automatic fallback to SQLite for local development.
- **Media & File Storage**: Cloudinary Python SDK for cloud-hosted clinical documents, radiology scans, lab PDFs, and profile pictures.
- **Background Tasks & Broker**: Celery 5.4.0 with Redis broker for asynchronous email delivery and scheduled 24-hour appointment reminders.
- **Authentication & Security**: SimpleJWT 5.3.1 (JSON Web Tokens), PyOTP 2.9.0 (TOTP 2FA), `django-ratelimit` for rate limiting, and `django-axes` for brute-force mitigation.
- **API Documentation**: OpenAPI 2.0 / Swagger and ReDoc generated via `drf-yasg`.
- **Application Server**: Gunicorn 23.0.0 (WSGI on Render) and Uvicorn 0.32.0 (ASGI for local WebSockets).

---

## Domain Models and Applications

The domain layer is organized under `backend/apps/`:

### 1. Identity, Roles and 2FA (`apps/models/user.py`)
- Extends `AbstractBaseUser` and `PermissionsMixin`.
- Personas: `patient`, `doctor`, `admin`.
- Features Two-Factor Authentication fields (`two_factor_enabled`, `totp_secret`) with QR code generation.
- Account status tracking: `pending`, `approved`, `suspended`.

### 2. Clinical Staff Profiles (`apps/models/doctor.py`)
- One-to-one relation with `User`.
- Captures specialty, medical license number, qualifications, years of experience, and administrative verification flag (`is_verified`).
- Scheduling fields: `available_days` (JSON list of active weekdays), `available_time_start`, `available_time_end`, and `consultation_fee`.

### 3. Patient Profiles (`apps/models/patient.py`)
- One-to-one relation with `User`.
- Captures date of birth, blood group, address, known allergies, and emergency contact details.

### 4. Patient Vitals Telemetry (`apps/models/vitals.py`)
- Clinical telemetry records: Systolic BP, Diastolic BP, Resting Heart Rate, Blood Glucose (with context: Fasting, Post-Meal, Random), Body Temperature, Oxygen Saturation (SpO2), Height (cm), and Weight (kg).
- Automatic calculation of Body Mass Index (BMI) and categorization (Underweight, Normal, Overweight, Obese).

### 5. Telemedicine Messaging (`apps/models/message.py`)
- Direct communication channel between patients and verified practitioners.
- Tracks conversation participants, message content, attachments, read timestamps, and unread counters.

### 6. Appointment Engine (`apps/models/appointment.py`)
- Manages consultations between patients and doctors.
- Statuses: `pending`, `confirmed`, `in_progress`, `completed`, `cancelled`, `no_show`.
- Automated 30-minute slot generator (`AvailableSlotsView`) based on doctor availability hours and existing bookings.
- Unique `video_room_id` for sandboxed WebRTC telemedicine video consultations.
- Reminder tracking fields: `reminder_sent`, `reminder_sent_at`.

### 7. Electronic Medical Records (`apps/models/medical_record.py`)
- Classifications: `diagnosis`, `prescription`, `test_result`, `vaccination`, `surgery`, `other`.
- Cloudinary attachment storage with fallback support.
- Granular `is_confidential` privacy flag for restricted access.

### 8. Prescriptions and Refills (`apps/models/prescription.py`)
- Physician-issued medication instructions: drug name, dosage, frequency, duration, instructions, and authorized refills.
- Patient-initiated refill requests with status tracking (`pending`, `approved`, `rejected`).
- Safety override tracking for clinical risk warnings.

### 9. Billing and Invoices (`apps/models/billing.py`)
- Invoicing linked to consultations.
- Cash / Desk settlement tracking (`pending`, `paid`, `cancelled`, `refunded`) without third-party payment gateways.
- Official PDF invoice download support.

### 10. Audit Logging Subsystem (`apps/models/audit_log.py`)
- Immutable compliance trail capturing user ID, user email, action type, target resource, IP address, and payload parameters.

### 11. Password Recovery Codes (`apps/models/password_reset.py`)
- Cryptographic 6-digit verification codes expiring in 15 minutes with single-use invalidation.

---

## Real-Time and WebSocket Architecture

The platform supports both high-frequency polling and WebSocket connections via Django Channels:

1. **Protocol Routing** (`healthcare_project/asgi.py` & `apps/api/routing.py`):
   - `/ws/notifications/`: `NotificationConsumer` for user-scoped push alerts.
   - `/ws/video/<room_id>/`: `VideoCallConsumer` for WebRTC peer signaling.
2. **Production vs Local**:
   - In production on Render, the service runs on Gunicorn WSGI for maximum stability across sleep cycles.
   - Messaging uses high-frequency real-time polling (every 3.5 seconds) over standard HTTPS endpoints, guaranteeing zero dropped connections.

---

## Background Tasks and Scheduled Jobs

Configured in `apps/services/celery_tasks.py`:

- `send_appointment_reminders`: Automated task scanning for confirmed appointments occurring in the 23 to 25 hour window that have not received a reminder.
- `send_same_day_reminders`: Automated task alerting patients 15 minutes to 2 hours before scheduled consultations with direct video room links.
- `send_async_email_task`: Asynchronous transactional email dispatch with automatic 3-retry backoff.

---

## Transactional Email System

Professional, classy HTML email templates located in `backend/templates/emails/`:

1. `base.html`: Common layout with clinical teal styling (`#0d9488`), responsive card sizing, and confidentiality disclaimers.
2. `welcome.html`: Account registration confirmation with credentials summary.
3. `appointment_confirmation.html`: Structured consultation details card and pre-visit guidelines.
4. `appointment_reminder.html`: 24-hour advance alert with telemedicine room link.
5. `doctor_verified.html`: Physician accreditation approval notice.
6. `password_reset.html`: Monospace 6-digit code box with one-click reset button.

---

## Security and Authorization

- **Role-Based Access Control**: `IsAdmin`, `IsDoctor`, `IsPatient`, `IsOwnerOrAdmin`.
- **Rate Limiting**: Rate limited via `django-ratelimit` on authentication endpoints (3-5 per minute per IP).
- **Two-Factor Authentication**: Optional TOTP protection with 15-minute challenge tokens.
- **Audit Logging**: Comprehensive, non-destructive audit log capturing actor, action, IP, and timestamps.
- **CORS Protection**: Restricted strictly to authorized frontend domains.

---

## Directory Structure

```
backend/
├── apps/
│   ├── api/                      # Views, consumers, URL routing
│   │   ├── consumers.py          # WebSocket Notification & Video consumers
│   │   ├── routing.py            # WebSocket URL patterns
│   │   ├── urls.py               # REST API URL table
│   │   └── views/                # Domain views (auth, doctors, vitals, billing)
│   ├── core/                     # Permissions, pagination, JWT middleware
│   ├── models/                   # Relational database models
│   ├── schemas/                  # DRF serializers and input validators
│   ├── services/                 # Notification service and Celery tasks
│   └── utils/                    # Audit logger, security utilities
├── healthcare_project/
│   ├── asgi.py                   # Channels ASGI entry point
│   ├── settings/
│   │   ├── base.py               # Base settings
│   │   ├── development.py        # Local development settings
│   │   └── production.py         # Production settings (Render / Neon)
│   ├── urls.py                   # Primary URL routing
│   └── wsgi.py                   # Gunicorn WSGI entry point
├── templates/
│   └── emails/                   # Transactional email templates
├── build.sh                      # Render build script
├── manage.py                     # Django CLI
├── requirements.txt              # Python dependencies
└── seed_demo_users.py            # Demo accounts seeder
```

---

## Prerequisites

- Python 3.11 or higher
- PostgreSQL (or SQLite for local development)
- Redis (optional for local, used by Celery)
- Virtualenv package manager

---

## Installation and Environment Configuration

### 1. Setup Virtual Environment

```bash
# Windows (PowerShell)
python -m venv venv
.\venv\Scripts\Activate.ps1

# Linux / macOS
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Configure `.env` File

Create a `.env` file inside the `backend/` directory:

```ini
DJANGO_ENV=development
SECRET_KEY=your-secure-django-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=postgres://postgres:password@localhost:5432/medicare_db
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
DEFAULT_FROM_EMAIL=MediCare <noreply@medicare.local>
```

---

## Database Migrations and Seeding

Run migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

Seed demo users:
```bash
python manage.py seed_demo_users
```

Pre-seeded credentials:
- **Admin**: `admin@medicare.local` / `Admin@Medicare2026!`
- **Doctor**: `doctor@medicare.local` / `Doctor@Medicare2026!`
- **Patient**: `patient@medicare.local` / `Patient@Medicare2026!`

---

## Running the Application

### Development Server (HTTP)
```bash
python manage.py runserver
```

### Development Server (ASGI / WebSockets)
```bash
uvicorn healthcare_project.asgi:application --reload --port 8000
```

---

## API Endpoints Reference

| Resource | Method | Endpoint | Description |
|---|---|---|---|
| **Auth** | POST | `/api/v1/auth/login/` | Obtain JWT token pair |
| **Auth** | POST | `/api/v1/auth/register/` | Register user account |
| **Auth** | POST | `/api/v1/auth/token/refresh/` | Refresh JWT access token |
| **Auth** | POST | `/api/v1/auth/password-reset/` | Request 6-digit reset code |
| **Auth** | POST | `/api/v1/auth/password-reset/confirm/` | Confirm code and set password |
| **Auth** | POST | `/api/v1/auth/2fa/setup/` | Generate 2FA TOTP secret |
| **Auth** | POST | `/api/v1/auth/2fa/verify/` | Verify 2FA challenge code |
| **Doctors** | GET | `/api/v1/doctors/` | List verified doctors |
| **Doctors** | GET | `/api/v1/doctors/{id}/` | Retrieve doctor details |
| **Doctors** | PATCH | `/api/v1/doctors/me/` | Update doctor schedule & fee |
| **Appointments** | GET, POST | `/api/v1/appointments/` | List or book appointments |
| **Appointments** | GET, PATCH | `/api/v1/appointments/{id}/` | Retrieve or update appointment |
| **Appointments** | POST | `/api/v1/appointments/{id}/cancel/` | Cancel appointment |
| **Appointments** | POST | `/api/v1/appointments/{id}/send-reminder/` | Manual reminder dispatch |
| **Appointments** | GET | `/api/v1/appointments/available-slots/{doc_id}/` | Generate 30-min available slots |
| **Vitals** | GET, POST | `/api/v1/vitals/` | List or record patient vitals |
| **Vitals** | DELETE | `/api/v1/vitals/{id}/` | Delete vitals entry |
| **Messages** | GET | `/api/v1/messages/conversations/` | List active conversations |
| **Messages** | GET | `/api/v1/messages/thread/{user_id}/` | Fetch conversation thread |
| **Messages** | POST | `/api/v1/messages/` | Send direct message |
| **Messages** | GET | `/api/v1/messages/unread-count/` | Unread message counter |
| **Records** | GET, POST | `/api/v1/medical-records/` | Manage medical records & files |
| **Prescriptions** | GET, POST | `/api/v1/prescriptions/` | Manage medical prescriptions |
| **Billing** | GET, POST | `/api/v1/billing/` | Retrieve invoices or record cash settlement |
| **Admin** | GET | `/api/v1/admin/users/` | List and search users |
| **Admin** | POST | `/api/v1/admin/doctors/{id}/verify/` | Verify doctor credentials |
| **Admin** | GET | `/api/v1/admin/audit-logs/` | Query immutable audit logs |

---

## Automated Testing

Run the automated test suite:

```bash
python manage.py test
```

Verification status: All 23 tests pass cleanly.

---

## Production Cloud Deployment (Render & Neon)

### Render Backend Service Configuration
- **Root Directory**: `backend`
- **Build Command**: `./build.sh`
- **Start Command**:
  ```bash
  gunicorn healthcare_project.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120
  ```
- **Required Render Environment Variables**:
  - `DJANGO_SETTINGS_MODULE`: `healthcare_project.settings.production`
  - `DATABASE_URL`: Connection string from Neon PostgreSQL (`sslmode=require`)
  - `SECRET_KEY`: Production secret key
  - `CORS_ALLOWED_ORIGINS`: Vercel frontend URL
  - `FRONTEND_URL`: Vercel frontend URL
  - `CLOUDINARY_URL`: Cloudinary storage URI

---

## License

This project is licensed under the MIT License. Refer to the `LICENSE` file for details.
