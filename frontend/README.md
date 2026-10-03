<p align="center">
  <img src="public/logo.png" alt="MediCare Logo" width="120" style="border-radius: 20px;" />
</p>

# MediCare - Frontend Application

Modern, type-safe single page application (SPA) for the MediCare enterprise healthcare management and telemedicine platform. Engineered with React 18, TypeScript, Vite, Recharts, and Tailwind CSS. Deployed on Vercel.

---

## Table of Contents

- [Overview](#overview)
- [Architecture and Core Technologies](#architecture-and-core-technologies)
- [Key Features](#key-features)
- [Screenwise Production Responsiveness](#screenwise-production-responsiveness)
- [Application Pages Reference](#application-pages-reference)
- [Directory Structure](#directory-structure)
- [Component Architecture](#component-architecture)
- [Prerequisites](#prerequisites)
- [Installation and Setup](#installation-and-setup)
- [Environment Configuration](#environment-configuration)
- [Available Scripts](#available-scripts)
- [Routing and Access Guards](#routing-and-access-guards)
- [State Management and Network Layer](#state-management-and-network-layer)
- [Production Deployment (Vercel)](#production-deployment-vercel)
- [License](#license)

---

## Overview

The MediCare frontend provides a responsive, accessible, and high-performance interface for patients, healthcare providers, and hospital administrators. Built on a modular component-driven architecture, it features telemedicine video consultations, doctor-patient direct messaging, longitudinal patient vitals analytics, digital prescription refills, electronic health records with Cloudinary attachments, and cash/desk invoice billing with PDF export.

---

## Architecture and Core Technologies

- **UI Framework**: React 18.2.0 with functional components and hooks.
- **Language**: TypeScript 5.2.2 providing static typing and compile-time contract safety.
- **Build Tool**: Vite 5.4.21 for fast Hot Module Replacement (HMR) and optimized Rollup bundling.
- **Styling**: Tailwind CSS 3.4.17 with custom healthcare tokens (`medicare-teal`, `medicare-dark`, semantic badges, form controls).
- **Data Visualizations**: Recharts 2.15.0 for clinical health telemetry trends (Blood Pressure, Glucose, Heart Rate, BMI).
- **Client Routing**: React Router DOM 6.20.0 supporting nested layouts, dynamic routes, and role-based route guards.
- **Network Client**: Axios 1.19.0 configured with request/response interceptors for automatic JWT authorization and sliding token refresh.
- **Notifications & Feedback**: React Hot Toast 2.6.0.
- **Two-Factor Authentication UI**: `qrcode.react` for TOTP authenticator setup.
- **Icons**: React Icons 4.11.0.

---

## Key Features

### 1. Role-Aware Dashboard & Navigation
- Personalized hero greeting displaying actor role (`Admin`, `Doctor`, `Patient`), current date, and role-specific quick action buttons.
- Responsive KPI status cards adapting seamlessly from 1 column on mobile to 3 columns on desktop.
- Recent appointments feed with clinical status badges and direct navigation links.

### 2. Telemedicine Video Consultations
- Embedded WebRTC video consultation room powered by Jitsi Meet (`VideoConsultationModal.tsx`).
- Automatic room identifier binding and participant identity pass-through.
- Encrypted audio, video, and screen-sharing controls.

### 3. Direct Telemedicine Messaging
- Real-time chat interface connecting patients with their verified practitioners.
- High-frequency polling (every 3.5 seconds) ensuring real-time message exchange without dropped connections.
- Responsive mobile drawer (`showMobileChat`) allowing one-touch switching between the contacts list and active conversation thread.

### 4. Patient Vitals Telemetry & Longitudinal Health Analytics
- Clinical recording interface for Blood Pressure, Blood Glucose, Resting Pulse, SpO2, Body Temperature, Weight, and Height.
- Real-time automated Body Mass Index (BMI) computation and clinical categorization.
- Interactive Recharts visualization with tabbed viewports: Blood Pressure curves, Glucose thresholds, Pulse & SpO2 trends, and Weight & BMI tracking.
- 9-column historical vitals log table with horizontal scroll protection for tablet and mobile screens.

### 5. Appointments & Availability Engine
- Physician directory with specialty search, fee badges, and consultation booking modals.
- Dynamic doctor availability calendar: practitioners configure working days, daily hours, and fees.
- Automated 30-minute consultation slot generation that accounts for booked slots.

### 6. Electronic Medical Records (EMR) & Media
- Comprehensive medical history displays covering diagnoses, lab tests, prescriptions, and surgical history.
- Cloudinary cloud image upload integration for doctor/patient profile pictures and clinical lab attachments with fallback support.
- Granular confidentiality flags restricting sensitive patient records.

### 7. Prescriptions and Refill System
- Digital prescription directory with dosage, frequency, duration, and safety override alerts.
- One-click refill request submission for eligible active prescriptions.
- Downloadable official prescription documents.

### 8. Two-Factor Authentication (2FA)
- Integrated 2FA management via Time-based One-Time Password (TOTP) in the Profile page.
- Instant QR code generation for scanning in Google Authenticator, Authy, or Apple Passwords.
- 6-digit challenge code verification modal during login.

---

## Screenwise Production Responsiveness

All 24 pages in the application adhere to strict production-grade responsiveness standards:

| Viewport Range | Breakpoint | Responsive Adaptation Behavior |
|---|---|---|
| **Mobile** | `< 640px` | Single-column stacks, full-width inputs, touch-friendly 44px minimum targets, and collapsible mobile chat drawer. |
| **Tablet** | `640px - 1024px` | 2-column KPI grids, side-by-side action buttons, and horizontal scroll preservation for dense clinical tables. |
| **Desktop** | `1024px - 1440px` | Standard multi-column layouts, expanded sidebar navigation, split-pane chat interface, and Recharts trend charts. |
| **Ultra-Wide** | `> 1440px` | Centered maximum width bounds (`max-w-7xl`) preventing content distortion on ultra-wide monitors. |

### Horizontal Scroll Preservation
Dense clinical tables are wrapped in `overflow-x-auto` with strict minimum widths to prevent column squishing on narrow devices:
- Historical Vitals Table: `min-w-[960px]`
- Audit Logs Registry: `min-w-[820px]`
- Doctor Credential Review: `min-w-[800px]`
- User Management Table: `min-w-[760px]`
- Recent Users Table: `min-w-[640px]`

---

## Application Pages Reference

| Route | Component | Access Level | Description |
|---|---|---|---|
| `/` | `LandingPage.tsx` | Public | Marketing landing page and platform features overview |
| `/login` | `LoginPage.tsx` | Public | Authentication with 2FA TOTP verification support |
| `/register` | `RegisterPage.tsx` | Public | Account registration with role selection |
| `/forgot-password` | `ForgotPasswordPage.tsx` | Public | Step 1: 6-digit email verification code dispatch |
| `/reset-password` | `ResetPasswordPage.tsx` | Public | Step 2: Code confirmation and new password entry |
| `/dashboard` | `Dashboard.tsx` | Authenticated | Role-aware dashboard with KPIs and recent appointments |
| `/appointments` | `AppointmentsPage.tsx` | Authenticated | Appointment listing, booking, and cancellation modals |
| `/appointments/:id` | `AppointmentDetailPage.tsx` | Authenticated | Appointment overview with video consultation trigger |
| `/doctors` | `DoctorsPage.tsx` | Authenticated | Physician directory with specialty filters and fee cards |
| `/doctors/:id` | `DoctorDetailPage.tsx` | Authenticated | Doctor profile, ratings, reviews, and booking modal |
| `/schedule` | `DoctorSchedulePage.tsx` | Doctor Only | Physician practice hours, days of week, and fee settings |
| `/vitals` | `VitalsPage.tsx` | Authenticated | Longitudinal telemetry charts and historical vitals log |
| `/messages` | `MessagesPage.tsx` | Authenticated | Real-time telemedicine chat with responsive mobile drawer |
| `/medical-records` | `MedicalRecordsPage.tsx` | Authenticated | Patient EMR records with Cloudinary attachment inspector |
| `/prescriptions` | `PrescriptionsPage.tsx` | Authenticated | Prescription cards, refill workflows, and safety alerts |
| `/billing` | `BillingPage.tsx` | Patient, Admin | Invoices, cash/desk settlement, and official PDF download |
| `/patients` | `PatientsPage.tsx` | Doctor, Admin | Patient registry with blood groups and contact details |
| `/notifications` | `NotificationsPage.tsx` | Authenticated | Category-filtered notification feed and unread counter |
| `/profile` | `ProfilePage.tsx` | Authenticated | Profile avatar manager, 2FA setup, and password change |
| `/admin` | `AdminDashboard.tsx` | Admin Only | Hospital analytics, specialty breakdown, and doctor approval |
| `/admin/users` | `AdminUsersPage.tsx` | Admin Only | User registry with search, role filters, and status toggles |
| `/admin/doctors` | `AdminDoctorsPage.tsx` | Admin Only | Physician credential review table with verify/reject actions |
| `/admin/audit-logs` | `AdminAuditLogsPage.tsx` | Admin Only | Immutable security audit trail with JSON details modal |
| `*` | `NotFoundPage.tsx` | Public | 404 error handler |

---

## Directory Structure

```
frontend/
├── src/
│   ├── api/                      # Axios HTTP client and domain API modules
│   │   ├── admin.ts              # Administrative API functions
│   │   ├── appointments.ts       # Appointment scheduling & slots
│   │   ├── auth.ts               # Login, register, 2FA, password reset
│   │   ├── axios.ts              # Axios interceptors (JWT injection & refresh)
│   │   ├── doctors.ts            # Doctor profiles and schedule settings
│   │   ├── medical-records.ts    # Electronic health records
│   │   ├── messages.ts           # Direct messaging and conversation threads
│   │   ├── notifications.ts      # Notifications and unread counts
│   │   ├── patients.ts           # Patient profile management
│   │   ├── prescriptions.ts      # Prescription and refill operations
│   │   ├── reviews.ts            # Doctor reviews and ratings
│   │   ├── upload.ts             # Cloudinary upload handlers
│   │   └── vitals.ts             # Patient vitals telemetry
│   ├── components/
│   │   ├── common/               # Layout components (Navbar, Footer)
│   │   ├── ui/                   # Reusable UI primitives (Modal, ConfirmModal, Button, Input)
│   │   └── video/                # Telemedicine VideoConsultationModal
│   ├── context/
│   │   └── AuthContext.tsx       # Authentication state, login, logout, and token rehydration
│   ├── hooks/
│   │   ├── useAuth.ts            # Authentication hook consumer
│   │   └── useWebSocketNotifications.tsx # Real-time notification subscriber
│   ├── layouts/
│   │   ├── AuthLayout.tsx        # Centered layout for login/register pages
│   │   └── DashboardLayout.tsx   # Sidebar, header, and content layout for authenticated users
│   ├── pages/                    # All 24 application page components
│   ├── routes/
│   │   ├── index.tsx             # Central route table declarations
│   │   └── PrivateRoute.tsx      # RBAC and authentication route guard
│   ├── types/
│   │   └── index.ts              # TypeScript domain types and API contract interfaces
│   ├── utils/
│   │   ├── constants.ts          # Static labels, statuses, and options
│   │   └── helpers.ts            # Tailwind class merger (cn), date formatters, error parsers
│   ├── App.tsx                   # Top-level application bootstrap and toast provider
│   ├── index.css                 # Base Tailwind layers and component utilities
│   └── main.tsx                  # Application entry point
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

---

## Component Architecture

### Reusable UI Primitives (`src/components/ui/`)

| Component | File | Description |
|---|---|---|
| `Modal` | `Modal.tsx` | Accessible dialog with backdrop blur, scroll locking, Escape key support, and responsive sizing. |
| `ConfirmModal` | `ConfirmModal.tsx` | Semantic confirmation dialog with danger, warning, and primary styles, plus async loading indicator. |
| `Button` | `Button.tsx` | Standardized button with loading state, size variants, and color variants. |
| `Input` | `Input.tsx` | Reusable form input with validation label and error messaging. |
| `SearchableSelect` | `SearchableSelect.tsx` | Accessible searchable dropdown with keyboard navigation and avatar support. |
| `LoadingSpinner` | `LoadingSpinner.tsx` | Accessible SVG loading spinner for asynchronous views. |
| `Skeleton` | `Skeleton.tsx` | Skeleton placeholder primitive for loading states. |
| `SkeletonCard` | `SkeletonCard.tsx` | Pre-composed card skeleton for grid loading states. |

---

## Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher (or pnpm / yarn)

---

## Installation and Setup

### 1. Install Node Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `frontend/` directory:

```ini
VITE_API_URL=http://127.0.0.1:8000/api/v1
VITE_WS_BASE_URL=ws://127.0.0.1:8000/ws
```

For connecting to the live production backend:
```ini
VITE_API_URL=https://medicare-backend-9am8.onrender.com/api/v1
VITE_WS_BASE_URL=wss://medicare-backend-9am8.onrender.com/ws
```

### 3. Start Development Server

```bash
npm run dev
```
The application will be accessible at `http://localhost:5173/`.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the Vite development server with Hot Module Replacement. |
| `npm run build` | Compiles TypeScript (`tsc`) and generates optimized production bundles in `dist/`. |
| `npm run preview` | Serves the local production build from `dist/` for verification. |
| `npm run lint` | Runs ESLint across all TypeScript source files. |

---

## Routing and Access Guards

Route protection is implemented through the `<PrivateRoute>` wrapper (`src/routes/PrivateRoute.tsx`):

- **Unauthenticated Users**: Automatically redirected to `/login` with the current location saved in state for post-login redirection.
- **Role Validation**: If the `roles` prop is specified (e.g. `roles={['admin']}`), users lacking the required role are redirected to `/dashboard`.

---

## State Management and Network Layer

### Authentication Context (`AuthContext.tsx`)
- Stores current authenticated `user`, JWT `tokens`, and loading state.
- Automatically initializes tokens from `localStorage`.
- Dispatches periodic token refresh requests to keep sessions active without requiring re-authentication.

### Axios Interceptor Architecture (`src/api/axios.ts`)
- **Request Interceptor**: Injects the Bearer JWT token into the `Authorization` header on all outgoing requests.
- **Response Interceptor**: Automatically intercepts `401 Unauthorized` responses, attempts to exchange the stored refresh token for a new access token via `/auth/token/refresh/`, and replays the failed request seamlessly. If the refresh token is expired, the session is cleared and the user is redirected to `/login`.

---

## Production Deployment (Vercel)

The frontend is deployed to Vercel:

1. **Framework Preset**: Vite
2. **Root Directory**: `frontend`
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Environment Variables**:
   - `VITE_API_URL`: `https://medicare-backend-9am8.onrender.com/api/v1`

---

## License

This project is distributed under the MIT License. Refer to the `LICENSE` file for full terms and conditions.
