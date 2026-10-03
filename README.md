<p align="center">
  <img src="frontend/public/logo.png" alt="MediCare Logo" width="120" style="border-radius: 20px;" />
</p>

# MediCare

An enterprise-grade, full-stack healthcare management and telemedicine platform engineered with Django REST Framework, Django Channels, PostgreSQL (Neon), React 18, TypeScript, and Tailwind CSS. Deployed on Render (Backend) and Vercel (Frontend).

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Repository Structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Local Installation and Setup](#local-installation-and-setup)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Cloud Deployment Architecture](#cloud-deployment-architecture)
  - [Backend Deployment (Render)](#backend-deployment-render)
  - [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
  - [Database (Neon Serverless PostgreSQL)](#database-neon-serverless-postgresql)
  - [Media Storage (Cloudinary)](#media-storage-cloudinary)
- [Environment Variables Reference](#environment-variables-reference)
- [Database Management and Seeding](#database-management-and-seeding)
- [API Endpoints Reference](#api-endpoints-reference)
- [Transactional Email System](#transactional-email-system)
- [Verification and Testing](#verification-and-testing)
- [Security Specifications](#security-specifications)
- [License](#license)

---

## Overview

MediCare is a unified clinical practice management and telehealth software solution. The platform connects patients, licensed healthcare practitioners, and medical directors into a secure clinical ecosystem. It facilitates appointment scheduling with automated slot allocation, encrypted telemedicine video consultations, patient vitals telemetry with longitudinal trend analytics, doctor-patient direct messaging, digital prescription management with refill requests, electronic health record (EMR) management, cash/desk invoice billing with PDF generation, and automated Celery appointment reminders.

---

## Key Features

### 1. Authentication, Access Control and Two-Factor Security
- Role-Based Access Control (RBAC) supporting Administrator, Doctor, and Patient personas.
- Stateless JSON Web Token (JWT) authentication using SimpleJWT with sliding session refresh and blacklisting.
- Two-Factor Authentication (2FA) via Time-based One-Time Password (TOTP) compatible with Google Authenticator, Authy, and Apple Passwords, featuring dynamic QR code generation.
- Password reset recovery workflow using 6-digit cryptographic verification codes expiring in 15 minutes, with direct one-click email reset links.
- Session termination with accessible confirmation dialogs across all authenticated navigation surfaces.

### 2. Telemedicine and Encrypted Video Consultations
- WebRTC-based virtual consultation rooms integrated via sandboxed Jitsi Meet.
- Automated creation of unique room identifiers tied directly to appointment records.
- Strict participant authorization ensuring virtual rooms can only be accessed by the assigned patient, physician, or system administrator.
- Consultation status automatically transitions to In Progress when the practitioner joins.

### 3. Direct Telemedicine Messaging and Consultation Follow-ups
- Direct communication channel between patients and verified physicians for pre-visit and post-visit follow-up.
- High-frequency real-time polling (every 3.5 seconds) ensuring low-latency message delivery without persistent socket drops.
- Dedicated mobile drawer architecture (`showMobileChat`) allowing seamless switching between contact lists and active chat threads on small viewports.
- Unread message counters displayed in the navigation bar.

### 4. Appointment Scheduling and Practice Slot Management
- Dynamic doctor availability: practitioners configure active working days, daily operating hours, and consultation fees per session.
- Automated 30-minute consultation slot generation that excludes already-booked slots and historical times.
- Full appointment lifecycle tracking: `Pending`, `Confirmed`, `In Progress`, `Completed`, and `Cancelled`.
- Manual reminder dispatch option for physicians and administrators.

### 5. Patient Vitals Telemetry and Longitudinal Health Analytics
- Clinical recording of primary vital signs: Blood Pressure (Systolic and Diastolic), Blood Glucose (Fasting, Post-Meal, Random), Resting Heart Rate, Body Temperature, and Oxygen Saturation (SpO2).
- Automated Body Mass Index (BMI) calculation and classification (Underweight, Normal, Overweight, Obese).
- Interactive longitudinal trend visualizations powered by Recharts (Blood Pressure curves, Glucose thresholds, Heart Rate / SpO2 trends, Weight & BMI monitoring).
- 9-column historical vitals table with horizontal scroll protection for tablet and mobile screens.

### 6. Electronic Medical Records (EMR) and Cloudinary Storage
- Categorized clinical documentation supporting diagnoses, prescriptions, lab results, immunizations, and surgical history.
- Cloudinary cloud storage integration for patient avatars and medical record attachments (lab reports, radiology scans, PDFs) with automated fallback.
- Granular confidentiality flags restricting sensitive patient notes strictly to attending clinical personnel.

### 7. Prescriptions and Digital Refill System
- Digital medical prescriptions specifying drug name, dosage, frequency, duration, instructions, and allowed refills.
- Patient-initiated refill request workflows with real-time status transitions.
- Automated safety override indicators highlighting high-risk dosage or allergy concerns.
- Downloadable official prescription documents formatted for patient records.

### 8. Invoicing and Billing Operations
- Systematic invoice generation linked to appointments and treatments.
- Cash / Desk settlement recording for patient accounts without requiring third-party payment gateways.
- Official PDF invoice and receipt download capabilities for patients and hospital billing personnel.

### 9. Administration, Quality KPIs and Security Audit Logs
- Hospital administration dashboard with key performance indicators: consultation volumes, revenue analytics, clinical specialty breakdowns, and patient review ratings.
- Physician accreditation workflows: administrators review medical licenses, qualifications, and credentials before approving doctor visibility.
- Comprehensive user registry with search, role filtering, and activation/suspension toggles.
- Immutable security audit logs recording user email, role, action, target resource, IP address, and timestamps.

### 10. Screenwise Production-Grade Responsiveness
- All 24 frontend application pages fully optimized across mobile (< 640px), tablet (640px - 1024px), desktop (1024px - 1440px), and ultra-wide viewports.
- Touch-friendly 44px minimum target sizes for inputs, buttons, and dropdowns.
- Horizontal scroll preservation (`min-w` containers) on dense clinical tables to prevent column crushing on narrow devices.

---

## System Architecture

```
                      +-----------------------------+
                      |     Client Web Browser      |
                      |  (React 18 + TypeScript)    |
                      |   [Deployed on Vercel]      |
                      +--------------+--------------+
                                     |
                  HTTPS / REST API   |   WebSockets (WSS / ASGI)
                  (Axios + JWT)      |   (Django Channels)
                                     v
                      +-----------------------------+
                      |      Production Backend     |
                      |      (Gunicorn / Django)    |
                      |     [Deployed on Render]    |
                      +--------------+--------------+
                                     |
        +----------------------------+----------------------------+
        |                            |                            |
        v                            v                            v
 +--------------+             +--------------+             +--------------+
 | Neon Server- |             |  Cloudinary  |             | Celery Task  |
 | less Postgres|             | Cloud Media  |             | Queue & SMTP |
 |  (Database)  |             |  (Storage)   |             | (Mail Alerts)|
 +--------------+             +--------------+             +--------------+
```

---

## Technology Stack

### Backend

| Component | Technology | Version | Description |
|---|---|---|---|
| Language | Python | 3.11 / 3.12 | Core runtime environment |
| Framework | Django | 5.1.1 | Enterprise web application framework |
| API Engine | Django REST Framework | 3.15.2 | RESTful API serialization and viewsets |
| Real-Time Engine | Django Channels | 4.1.0 | Asynchronous protocol handling |
| Database Adapter | Psycopg2-binary / dj-database-url | 2.9.12 / 2.2.0 | PostgreSQL connectivity |
| Authentication | djangorestframework-simplejwt | 5.3.1 | JSON Web Token (JWT) management |
| Two-Factor Auth | PyOTP / qrcode | 2.9.0 / 8.0 | TOTP 2FA secret and QR code generator |
| Background Tasks | Celery | 5.4.0 | Asynchronous task scheduling |
| Media Storage | Cloudinary Python SDK | 1.41.0 | Cloud-hosted medical files and avatars |
| API Documentation | drf-yasg | 1.21.8 | OpenAPI 2.0 / Swagger documentation |
| Server | Gunicorn | 23.0.0 | WSGI production application server |

### Frontend

| Component | Technology | Version | Description |
|---|---|---|---|
| Language | TypeScript | 5.2.2 | Static typing and interfaces |
| UI Framework | React | 18.2.0 | Component-driven user interface |
| Build Tool | Vite | 5.4.21 | Frontend bundler and development server |
| Styling | Tailwind CSS | 3.4.17 | Utility-first responsive CSS framework |
| Routing | React Router DOM | 6.20.0 | Client-side routing with role guards |
| Charts & Trends | Recharts | 2.15.0 | Data visualizations for patient vitals |
| Notifications | React Hot Toast | 2.6.0 | Non-blocking toast alerts |
| Icons | React Icons | 4.11.0 | Standard icon library |

---

## Repository Structure

```
medicare/
├── backend/
│   ├── apps/
│   │   ├── api/                  # Views, serializers, routing, consumers
│   │   │   ├── consumers.py      # Notification and WebRTC signaling consumers
│   │   │   ├── routing.py        # WebSocket route patterns
│   │   │   ├── urls.py           # Primary REST API endpoint registry
│   │   │   └── views/            # Domain views (auth, doctors, appointments, vitals, billing)
│   │   ├── core/                 # Permissions, pagination, authentication middleware
│   │   ├── models/               # Relational models (User, Doctor, Patient, Vital, Appointment)
│   │   ├── schemas/              # Input validation serializers
│   │   ├── services/             # Notification service, Celery scheduled tasks
│   │   └── utils/                # Audit logger, security utilities
│   ├── healthcare_project/
│   │   ├── asgi.py               # Channels ASGI entry point
│   │   ├── settings/             # Environment configurations (base, development, production)
│   │   ├── urls.py               # Global routing dispatcher
│   │   └── wsgi.py               # Gunicorn WSGI entry point
│   ├── templates/
│   │   └── emails/               # Classy, professional HTML transactional email templates
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/                  # Axios HTTP client and domain API modules
│   │   ├── components/           # UI primitives, layout headers, video modal
│   │   ├── context/              # AuthContext and session state
│   │   ├── hooks/                # Custom React hooks (useAuth, useWebSocket)
│   │   ├── pages/                # All 24 responsive application views
│   │   ├── routes/               # PrivateRoute guards and route table
│   │   ├── types/                # TypeScript interfaces and contracts
│   │   └── utils/                # Helper utilities
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── render.yaml                   # Render deployment configuration
└── README.md
```

---

## Prerequisites

- **Python**: 3.11 or higher
- **Node.js**: 18.x or higher with npm 9.x or higher
- **PostgreSQL**: Local instance or Neon Serverless connection URL
- **Git**

---

## Local Installation and Setup

### Backend Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/mashudhahmed/medicare-fullstack.git
   cd medicare-fullstack/backend
   ```

2. **Create and activate a virtual environment**:
   ```bash
   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # Linux / macOS
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. **Configure environment variables**:
   Create a `.env` file in the `backend/` directory:
   ```ini
   DJANGO_ENV=development
   SECRET_KEY=local-dev-secret-key-min-50-characters-here
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1
   DATABASE_URL=postgres://postgres:password@localhost:5432/medicare_db
   CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
   DEFAULT_FROM_EMAIL=MediCare <noreply@medicare.local>
   ```

5. **Run database migrations**:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

6. **Seed demo accounts**:
   ```bash
   python manage.py seed_demo_users
   ```

7. **Start the backend server**:
   ```bash
   python manage.py runserver
   ```
   The backend API will run at `http://127.0.0.1:8000/`.

---

### Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd ../frontend
   ```

2. **Install Node dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file in `frontend/`:
   ```ini
   VITE_API_URL=http://127.0.0.1:8000/api/v1
   VITE_WS_BASE_URL=ws://127.0.0.1:8000/ws
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   The frontend will run at `http://localhost:5173/`.

---

## Cloud Deployment Architecture

The application is deployed across modern cloud platforms:

### Backend Deployment (Render)
- **Hosted At**: `https://medicare-backend-9am8.onrender.com`
- **Configuration** (`render.yaml`):
  - Root directory: `backend`
  - Build command: `./build.sh` (installs packages, runs migrations, and collects static files)
  - Start command:
    ```bash
    gunicorn healthcare_project.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120
    ```
- **Environment Variables configured on Render**:
  - `DJANGO_SETTINGS_MODULE`: `healthcare_project.settings.production`
  - `DATABASE_URL`: Connection string provided by Neon PostgreSQL
  - `SECRET_KEY`: Production cryptographic secret
  - `CORS_ALLOWED_ORIGINS`: Production Vercel domain URL
  - `FRONTEND_URL`: Production Vercel domain URL
  - `CLOUDINARY_URL`: Cloudinary connection credentials

### Frontend Deployment (Vercel)
- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables configured on Vercel**:
  - `VITE_API_URL`: `https://medicare-backend-9am8.onrender.com/api/v1`

### Database (Neon Serverless PostgreSQL)
- High-availability, serverless PostgreSQL with automated connection pooling and SSL encryption enabled (`sslmode=require`).

### Media Storage (Cloudinary)
- Cloud-hosted storage for doctor/patient profile pictures and medical document attachments (PDFs, lab reports, clinical scans).

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Description | Example |
|---|---|---|
| `DJANGO_ENV` | Mode (`development`, `production`) | `production` |
| `SECRET_KEY` | Cryptographic signing secret | `django-insecure-prod-key...` |
| `DEBUG` | Toggle diagnostic stack traces | `False` |
| `DATABASE_URL` | Neon PostgreSQL URI | `postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require` |
| `ALLOWED_HOSTS` | Authorized host domains | `medicare-backend-9am8.onrender.com,localhost` |
| `CORS_ALLOWED_ORIGINS` | Permitted frontend origins | `https://medicare.vercel.app,http://localhost:5173` |
| `FRONTEND_URL` | Base URL for password reset links | `https://medicare.vercel.app` |
| `CLOUDINARY_URL` | Cloudinary storage connection string | `cloudinary://api_key:secret@cloud_name` |
| `EMAIL_HOST` | Outgoing SMTP host address | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_HOST_USER` | Authenticating SMTP username | `notifications@medicare.local` |
| `EMAIL_HOST_PASSWORD` | App-specific SMTP password | `16-character-password` |

### Frontend (`frontend/.env`)

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Backend REST API root endpoint | `https://medicare-backend-9am8.onrender.com/api/v1` |
| `VITE_WS_BASE_URL` | WebSocket base URL | `wss://medicare-backend-9am8.onrender.com/ws` |

---

## Database Management and Seeding

Pre-configured demo credentials available via `python manage.py seed_demo_users`:

- **Administrator**:
  - Email: `admin@medicare.local`
  - Password: `Admin@Medicare2026!`
- **Physician (Cardiology)**:
  - Email: `doctor@medicare.local`
  - Password: `Doctor@Medicare2026!`
- **Patient**:
  - Email: `patient@medicare.local`
  - Password: `Patient@Medicare2026!`

---

## API Endpoints Reference

| Resource | Method | Endpoint | Description |
|---|---|---|---|
| **Auth** | POST | `/api/v1/auth/login/` | Authenticate and obtain JWT pair |
| **Auth** | POST | `/api/v1/auth/register/` | Create new patient or doctor account |
| **Auth** | POST | `/api/v1/auth/token/refresh/` | Refresh expired access token |
| **Auth** | POST | `/api/v1/auth/password-reset/` | Request 6-digit email reset code |
| **Auth** | POST | `/api/v1/auth/password-reset/confirm/` | Confirm code and set new password |
| **Auth** | POST | `/api/v1/auth/2fa/setup/` | Generate 2FA TOTP secret and QR code |
| **Auth** | POST | `/api/v1/auth/2fa/verify/` | Verify 6-digit code during 2FA login challenge |
| **Appointments** | GET, POST | `/api/v1/appointments/` | List user appointments or book new visit |
| **Appointments** | GET, PATCH | `/api/v1/appointments/{id}/` | View details or update appointment |
| **Appointments** | POST | `/api/v1/appointments/{id}/cancel/` | Cancel scheduled appointment |
| **Appointments** | POST | `/api/v1/appointments/{id}/send-reminder/` | Send on-demand email reminder |
| **Appointments** | GET | `/api/v1/appointments/available-slots/{doc_id}/` | Calculate available 30-min consultation slots |
| **Vitals** | GET, POST | `/api/v1/vitals/` | List historical vitals or record new clinical reading |
| **Vitals** | DELETE | `/api/v1/vitals/{id}/` | Delete vitals entry |
| **Messages** | GET | `/api/v1/messages/conversations/` | Retrieve active patient/doctor chat threads |
| **Messages** | GET | `/api/v1/messages/thread/{user_id}/` | Fetch full conversation message history |
| **Messages** | POST | `/api/v1/messages/` | Send direct message |
| **Messages** | GET | `/api/v1/messages/unread-count/` | Unread incoming messages counter |
| **Records** | GET, POST | `/api/v1/medical-records/` | Manage electronic health records and lab files |
| **Prescriptions** | GET, POST | `/api/v1/prescriptions/` | Issue or view medication prescriptions |
| **Prescriptions** | POST | `/api/v1/prescriptions/{id}/refill/` | Request medication refill |
| **Billing** | GET, POST | `/api/v1/billing/` | Retrieve invoices or record cash settlement |
| **Admin** | GET | `/api/v1/admin/users/` | List and search registered users |
| **Admin** | POST | `/api/v1/admin/doctors/{id}/verify/` | Approve or reject doctor credentials |
| **Admin** | GET | `/api/v1/admin/audit-logs/` | Query immutable system audit logs |

---

## Transactional Email System

The backend includes a professional, emoji-free HTML transactional email design system (`backend/templates/emails/`):

1. **Base Framework** (`base.html`): High-contrast clinical layout with clinical teal styling (`#0d9488`), responsive card sizing, and confidentiality disclaimers.
2. **Account Welcome** (`welcome.html`): Account credential confirmation and portal features overview.
3. **Appointment Confirmation** (`appointment_confirmation.html`): Practitioner name, scheduled date, and preparation instructions.
4. **24-Hour Reminder** (`appointment_reminder.html`): Scheduled consultation notice with video room link.
5. **Doctor Verification** (`doctor_verified.html`): Practitioner credential approval notice.
6. **Password Recovery** (`password_reset.html`): High-readability monospace 6-digit code box with one-click reset button.

---

## Verification and Testing

### Backend Test Suite
Automated tests covering authentication, appointment creation, role permissions, vitals logging, and prescription workflows:

```bash
cd backend
python manage.py test
```
Result: 23/23 tests pass.

### Frontend Production Build Verification
Execute TypeScript compiler validation and Rollup production asset bundling:

```bash
cd frontend
npm run build
```
Result: 0 errors.

---

## Security Specifications

- **Password Encryption**: Employs PBKDF2 with SHA-256 password hashing.
- **Brute Force Protection**: Rate limiting via `django-ratelimit` on sensitive endpoints (3-5 requests/minute).
- **Two-Factor Authentication**: Optional TOTP protection for all accounts with single-use session tokens.
- **Audit Logging**: Comprehensive, non-destructive audit log capturing actor ID, action type, IP address, and payload parameters.
- **CORS Protection**: Restricted strictly to authorized frontend origins.
- **Role Isolation**: Strict object-level permissions preventing cross-patient record inspection.

---

## License

This project is licensed under the MIT License. Refer to the `LICENSE` file for full terms and conditions.
