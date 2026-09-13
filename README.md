# MediCare Hub

An enterprise-grade, full-stack healthcare management and telemedicine platform engineered with Django REST Framework, Django Channels, PostgreSQL, React, TypeScript, and Tailwind CSS.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Repository Structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Backend Installation and Setup](#backend-installation-and-setup)
- [Frontend Installation and Setup](#frontend-installation-and-setup)
- [Environment Variables](#environment-variables)
- [Database Management and Seeding](#database-management-and-seeding)
- [API Documentation](#api-documentation)
- [Verification and Testing](#verification-and-testing)
- [Security Specifications](#security-specifications)
- [License](#license)

---

## Overview

MediCare Hub is a unified medical practice management and telehealth solution. The platform connects patients, verified physicians, and system administrators into a single secure ecosystem. It facilitates appointment scheduling, real-time encrypted video consultations, digital prescription tracking with medication refill workflows, electronic medical record management, and live WebSocket notifications.

---

## Key Features

### 1. Authentication and Access Control
- Role-Based Access Control (RBAC) supporting Administrator, Doctor, and Patient personas.
- Stateless JSON Web Token (JWT) authentication with sliding session refresh and token blacklisting.
- 6-digit email verification code delivery for password reset with time-bound expiration (15 minutes) and single-use invalidation.
- Session termination with confirmation dialogs across dashboard and top-level navigation.

### 2. Telemedicine and Video Consultations
- WebRTC-based video conferencing integration powered by Jitsi Meet.
- Automated generation of room identifiers bound to appointment records.
- Participant access control restricting video rooms strictly to the assigned patient and practitioner.

### 3. Appointment Scheduling and Lifecycle
- Real-time booking system with physician specialty indexing.
- Comprehensive lifecycle management: Pending, Confirmed, In Progress, Completed, and Cancelled.
- Accessible modal dialogs with safety confirmations for appointment cancellations and booking workflows.

### 4. Electronic Medical Records (EMR)
- Centralized patient medical history supporting diagnoses, prescriptions, lab results, immunizations, and surgical history.
- Granular confidentiality flags ensuring sensitive patient records remain restricted to authorized clinical staff.
- Attachment management for medical imagery and laboratory reports.

### 5. Prescriptions and Refill System
- Digital prescription generation with medication details, dosage instructions, and refill limits.
- Patient-initiated refill request workflows with real-time status transitions.
- Automatic audit trails linking prescriptions to patient records and issuing physicians.

### 6. Real-Time Event Engine
- Asynchronous notification bus powered by Django Channels over WebSockets.
- JWT-authenticated WebSocket handshake with automatic client-side reconnection.
- Instant toast notifications for appointment updates, status changes, and clinical events.

### 7. Administration and Audit Logging
- Dedicated administration dashboard with physician credential verification workflows.
- User account activation, deactivation, and role assignment.
- Immutable audit log subsystem capturing user identity, IP address, user agent, action type, and timestamps.

---

## System Architecture

```
                      +-----------------------------+
                      |     Client Web Browser      |
                      |  (React + TypeScript + Vite)|
                      +--------------+--------------+
                                     |
                 HTTP / REST API     |      WebSockets (WSS)
                 (Axios + JWT)       |      (Django Channels)
                                     v
                      +-----------------------------+
                      |         Reverse Proxy       |
                      |         (Nginx / ASGI)      |
                      +--------------+--------------+
                                     |
              +----------------------+----------------------+
              |                                             |
              v                                             v
+-----------------------------+               +-----------------------------+
|    Django REST Framework    |               |       Django Channels       |
|    (API Views & Endpoints)  |               |       (ASGI Consumers)      |
+--------------+--------------+               +--------------+--------------+
               |                                             |
               +----------------------+----------------------+
                                      |
                      +---------------+---------------+
                      |               |               |
                      v               v               v
               +------------+  +------------+  +------------+
               | PostgreSQL |  | Redis Bus  |  | SMTP Mail  |
               |  Database  |  |  & Celery  |  |  (Gmail)   |
               +------------+  +------------+  +------------+
```

---

## Technology Stack

### Backend

| Component | Technology | Version |
|---|---|---|
| Language | Python | 3.12+ |
| Framework | Django | 5.1.1 |
| API Engine | Django REST Framework | 3.15.2 |
| Asynchronous Engine | Django Channels | 4.1.0 |
| Database Adapter | Psycopg2-binary / dj-database-url | 2.9.12 / 2.2.0 |
| Authentication | djangorestframework-simplejwt | 5.3.1 |
| Caching and Message Broker | Redis / django-redis / Celery | 5.2.0 / 5.4.0 |
| Documentation | drf-yasg (Swagger / OpenAPI 2.0) | 1.21.8 |
| WSGI / ASGI Servers | Gunicorn / Uvicorn | 23.0.0 / 0.32.0 |

### Frontend

| Component | Technology | Version |
|---|---|---|
| Language | TypeScript | 5.2.2 |
| Library | React | 18.2.0 |
| Build Tool | Vite | 5.0.8 |
| Styling | Tailwind CSS | 3.4.17 |
| Routing | React Router DOM | 6.20.0 |
| Server State | TanStack React Query | 5.0.0 |
| Notifications | React Hot Toast | 2.6.0 |
| Icons | React Icons | 4.11.0 |

---

## Repository Structure

```
medicare/
├── backend/
│   ├── apps/
│   │   ├── accounts/             # User identity, roles, and profiles
│   │   ├── api/                  # DRF views, routers, and endpoints
│   │   ├── core/                 # Core permissions, pagination, base models
│   │   ├── models/               # Data models (Appointments, Prescriptions, Records, Audit)
│   │   ├── schemas/              # DRF serializers and validation schemas
│   │   └── utils/                # Audit logging, email delivery helpers
│   ├── healthcare_project/
│   │   ├── asgi.py               # ASGI configuration with Channels routing
│   │   ├── routing.py            # WebSocket URL patterns
│   │   ├── settings/             # Environment-aware settings (base, development, production)
│   │   ├── urls.py               # Primary URL routing table
│   │   └── wsgi.py               # WSGI entry point
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/                  # Axios HTTP client and API resource wrappers
│   │   ├── components/
│   │   │   ├── common/           # Navbar, Footer, Route Guards
│   │   │   ├── ui/               # Standard Modal, ConfirmModal, Button, Input components
│   │   │   └── video/            # Telemedicine Video Consultation Modal
│   │   ├── context/              # AuthContext and state providers
│   │   ├── hooks/                # Custom React hooks (useAuth, useApi, useWebSockets)
│   │   ├── layouts/              # DashboardLayout, AuthLayout
│   │   ├── pages/                # Application views (Dashboard, Appointments, Doctors, Records)
│   │   ├── routes/               # Centralized React Router configuration
│   │   ├── types/                # TypeScript interface and type declarations
│   │   └── utils/                # Helper functions, CSS merge utilities
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
└── README.md
```

---

## Prerequisites

Ensure the following tools are installed on your host system:
- Python 3.10 or higher
- Node.js 18.x or higher and npm 9.x or higher
- PostgreSQL (optional for local development; SQLite can be utilized as default fallback)
- Redis 6.x or higher (required for production WebSocket channel layer and Celery tasks)
- Git

---

## Backend Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/mashudhahmed/medicare-fullstack.git
cd medicare-fullstack/backend
```

### 2. Create and Activate a Virtual Environment

On Windows (PowerShell):
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

On macOS / Linux:
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Python Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Configure Backend Environment Variables

Create a `.env` file in the `backend/` root directory:

```ini
# Environment
DJANGO_ENV=development
SECRET_KEY=your-secure-django-secret-key-min-50-characters
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database Configuration (Leave empty to use SQLite in development)
DATABASE_URL=postgres://postgres:password@localhost:5432/medicare_db

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Email Delivery (Gmail SMTP Configuration)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-16-character-app-password
DEFAULT_FROM_EMAIL=MediCare Hub <noreply@medicare.local>

# Channels & Redis (Optional for local development; in-memory fallback enabled)
REDIS_URL=redis://127.0.0.1:6379/1
```

### 5. Execute Database Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 6. Seed Initial Administrator Account

```bash
python seed_admin.py
```

Default credentials created:
- Email: `admin@medicare.local`
- Password: `Admin@Medicare2026!`
- Role: `Administrator`

### 7. Start the Development Server

For standard HTTP development:
```bash
python manage.py runserver
```

For full ASGI / WebSocket support:
```bash
uvicorn healthcare_project.asgi:application --reload --port 8000
```

The backend service will be reachable at `http://127.0.0.1:8000/`.

---

## Frontend Installation and Setup

### 1. Navigate to the Frontend Directory

```bash
cd ../frontend
```

### 2. Install Node Dependencies

```bash
npm install
```

### 3. Configure Frontend Environment Variables

Create a `.env` file in the `frontend/` root directory:

```ini
VITE_API_URL=http://127.0.0.1:8000/api/v1
VITE_WS_URL=ws://127.0.0.1:8000/ws
```

### 4. Run Development Server

```bash
npm run dev
```

The application interface will be accessible at `http://localhost:5173/`.

### 5. Build for Production

```bash
npm run build
```

The bundled assets will be generated in the `frontend/dist/` directory.

---

## Environment Variables

### Backend Configuration Reference

| Variable | Description | Default / Example |
|---|---|---|
| `DJANGO_ENV` | Active environment (`development`, `production`, `testing`) | `development` |
| `SECRET_KEY` | Cryptographic secret for signing sessions and tokens | Random string |
| `DEBUG` | Toggle debug diagnostics | `True` |
| `DATABASE_URL` | PostgreSQL connection URI | `postgres://user:pass@host:5432/db` |
| `ALLOWED_HOSTS` | Comma-separated list of allowed host header domains | `localhost,127.0.0.1` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated list of allowed frontend origins | `http://localhost:5173` |
| `EMAIL_HOST` | Outgoing SMTP host address | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_HOST_USER` | SMTP username / authenticating email | `your-email@gmail.com` |
| `EMAIL_HOST_PASSWORD` | SMTP password / Application-specific password | 16-character token |
| `REDIS_URL` | Redis instance connection URI | `redis://127.0.0.1:6379/1` |

---

## Database Management and Seeding

### Available Management Scripts
- `seed_admin.py`: Seeds an active, staff-enabled Administrator profile with role-level privileges.
- `seed_data.py`: Seeds sample specialties, doctors, patients, and initial appointment records for evaluation purposes.

To run custom seeding:
```bash
cd backend
python seed_admin.py
python seed_data.py
```

---

## API Documentation

When the backend development server is running, interactive API documentation is available at:
- **Swagger UI**: `http://127.0.0.1:8000/swagger/`
- **ReDoc**: `http://127.0.0.1:8000/redoc/`

### Core REST Endpoints

| Resource | Method | Endpoint | Description |
|---|---|---|---|
| Authentication | POST | `/api/v1/auth/login/` | Obtain JWT access and refresh tokens |
| Authentication | POST | `/api/v1/auth/register/` | Register new patient or physician account |
| Authentication | POST | `/api/v1/auth/token/refresh/` | Refresh expired access token |
| Authentication | POST | `/api/v1/auth/password-reset/` | Request 6-digit email reset code |
| Authentication | POST | `/api/v1/auth/password-reset/verify/` | Verify 6-digit code validity |
| Authentication | POST | `/api/v1/auth/password-reset/confirm/` | Submit new account password |
| Appointments | GET, POST | `/api/v1/appointments/` | List user appointments or book consultation |
| Appointments | GET, PUT, PATCH | `/api/v1/appointments/{id}/` | Retrieve or modify appointment |
| Appointments | POST | `/api/v1/appointments/{id}/cancel/` | Cancel scheduled appointment |
| Telemedicine | GET | `/api/v1/appointments/{id}/video/` | Initialize secure video room session |
| Medical Records | GET, POST | `/api/v1/medical-records/` | List and create patient clinical records |
| Medical Records | GET | `/api/v1/medical-records/my/` | Retrieve current user's medical history |
| Prescriptions | GET, POST | `/api/v1/prescriptions/` | List and issue medical prescriptions |
| Prescriptions | POST | `/api/v1/prescriptions/{id}/refill/` | Submit prescription refill request |
| Administration | GET | `/api/v1/admin/users/` | List and filter all system users |
| Administration | PATCH | `/api/v1/admin/users/{id}/status/` | Modify user activation status |
| Administration | GET, POST | `/api/v1/admin/doctors/pending/` | Review and verify physician credentials |
| Audit Logs | GET | `/api/v1/admin/audit-logs/` | Query immutable audit logs |

---

## Verification and Testing

### Backend Test Suite
The backend contains automated unit and integration tests covering authentication, appointment creation, role permissions, and prescription lifecycle.

Execute tests using:
```bash
cd backend
python manage.py test
```

### Frontend Type Safety and Build Verification
Execute TypeScript compiler checks and production bundle builds:
```bash
cd frontend
npm run build
```

---

## Security Specifications

- **Password Hashing**: Implements Argon2 and PBKDF2 with SHA-256 password hashing.
- **CSRF & CORS**: Strict origin whitelisting configured across all communication channels.
- **Brute Force Protection**: Request rate limiting via `django-ratelimit` and account lockout defense with `django-axes`.
- **JWT Protection**: Short-lived access tokens (15-60 minutes) combined with rotatable refresh tokens.
- **HIPAA / Privacy Considerations**: Sensitive clinical notes and diagnostic attachments support explicit confidentiality flags restricting access to authorized medical providers.

---

## License

This project is licensed under the MIT License. Refer to the `LICENSE` file for full terms and conditions.
