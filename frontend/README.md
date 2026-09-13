# MediCare Hub - Frontend Application

Modern, type-safe single page application (SPA) for the MediCare Hub enterprise healthcare management and telemedicine platform. Engineered with React 18, TypeScript, Vite, and Tailwind CSS.

---

## Table of Contents

- [Overview](#overview)
- [Architecture and Core Technologies](#architecture-and-core-technologies)
- [Key Features](#key-features)
- [Directory Structure](#directory-structure)
- [Component Architecture](#component-architecture)
- [Prerequisites](#prerequisites)
- [Installation and Setup](#installation-and-setup)
- [Environment Configuration](#environment-configuration)
- [Available Scripts](#available-scripts)
- [Routing and Access Guards](#routing-and-access-guards)
- [State Management and Network Layer](#state-management-and-network-layer)
- [Real-Time WebSocket Integration](#real-time-websocket-integration)
- [Building and Production Deployment](#building-and-production-deployment)
- [License](#license)

---

## Overview

The MediCare Hub frontend provides a clean, responsive, and accessible interface for patients, healthcare providers, and platform administrators. Built on a component-driven architecture, it delivers real-time notifications, telemedicine consultations, electronic medical record management, and appointment scheduling with enterprise-grade security and input validation.

---

## Architecture and Core Technologies

- **UI Library**: React 18.2.0 with functional components and React hooks.
- **Language**: TypeScript 5.2.2 for end-to-end type safety and compile-time verification.
- **Build Tool**: Vite 5.0.8 providing fast Hot Module Replacement (HMR) and optimized Rollup production bundling.
- **Styling**: Tailwind CSS 3.4.17 with custom healthcare design tokens (`medicare-teal`, `medicare-dark`, custom badges, buttons, and form controls).
- **Client Routing**: React Router DOM 6.20.0 supporting nested layouts, dynamic segment parsing, and role-based route protection.
- **Network Client**: Axios 1.19.0 configured with request/response interceptors for automatic JWT attachment and sliding token refresh.
- **Server State Caching**: TanStack React Query 5.0.0.
- **Feedback & Notifications**: React Hot Toast 2.6.0.
- **Icons**: React Icons 4.11.0 (FontAwesome v5).

---

## Key Features

### 1. Role-Aware Dashboard & Navigation
- Contextual navigation tailored to actor roles (`patient`, `doctor`, `admin`).
- Collapsible sidebar on mobile devices and responsive desktop viewports.
- Integrated logout confirmation dialogs on all navigation surfaces.

### 2. Standard Modal and Dialog System
- Accessible dialog overlay (`Modal.tsx`) featuring backdrop blur, automatic body scroll locking, and Escape key dismissal.
- Semantic confirmation dialog (`ConfirmModal.tsx`) with warning, danger, primary, and info variants for destructive operations (e.g. appointment cancellations, session logout).

### 3. Telemedicine Video Consultations
- Embedded WebRTC video consultation room powered by Jitsi Meet (`VideoConsultationModal.tsx`).
- Automatic room identifier binding and participant identity pass-through.
- Camera, microphone, and screen-sharing support in a sandboxed, encrypted iframe.

### 4. Authentication Workflows
- JWT login and user registration with role selection.
- Two-step password reset workflow: requests a 6-digit verification code sent via email, validates the code, and applies the new password.
- Persistent session rehydration from browser storage with automatic token refresh on `401 Unauthorized` responses.

### 5. Appointments & Clinical Workflows
- Doctor discovery directory with specialty and keyword filtering.
- Appointment scheduling modal with validation for date, practitioner, and reason.
- Real-time status badges (`pending`, `confirmed`, `in_progress`, `completed`, `cancelled`).
- Appointment cancellation modal with safety checks.

### 6. Electronic Medical Records (EMR)
- Categorized medical history displays (diagnoses, lab results, prescriptions, surgeries, immunizations).
- Modal dialog for logging new clinical records with confidentiality toggling and file attachment inspection.

### 7. Real-Time Push Notifications
- Native WebSocket connection directly to the Django Channels ASGI server (`useWebSocketNotifications.tsx`).
- Instant toast popups on inbound events with navigation shortcuts to related records.

---

## Directory Structure

```
frontend/
├── src/
│   ├── api/                      # Axios HTTP client and resource APIs
│   │   ├── admin.ts              # Administrative operations
│   │   ├── appointments.ts       # Appointment scheduling
│   │   ├── auth.ts               # Login, register, token refresh
│   │   ├── axios.ts              # Central Axios instance and interceptors
│   │   ├── client.ts             # Default API client wrapper
│   │   ├── doctors.ts            # Practitioner queries
│   │   ├── endpoints.ts          # Centralized API URI registry
│   │   ├── medical-records.ts    # EMR operations
│   │   ├── notifications.ts      # Notifications fetch and read markers
│   │   └── patients.ts           # Patient profile management
│   ├── components/
│   │   ├── common/               # Layout components (Navbar, Footer, Route Guards)
│   │   ├── ui/                   # Reusable UI primitives (Modal, ConfirmModal, Button, Input)
│   │   └── video/                # Telemedicine VideoConsultationModal
│   ├── context/
│   │   └── AuthContext.tsx       # Authentication state, login, logout, and token rehydration
│   ├── hooks/
│   │   ├── useApi.ts             # Generic API query and mutation hook
│   │   ├── useAuth.ts            # Authentication hook consumer
│   │   └── useWebSocketNotifications.tsx # Real-time notification subscriber
│   ├── layouts/
│   │   ├── AuthLayout.tsx        # Centered layout for login/register pages
│   │   └── DashboardLayout.tsx   # Sidebar, header, and content layout for authenticated users
│   ├── pages/
│   │   ├── AdminDashboard.tsx    # Administrative metric dashboard
│   │   ├── AdminDoctorsPage.tsx  # Practitioner credential review
│   │   ├── AdminUsersPage.tsx    # User activation and role management
│   │   ├── AppointmentDetailPage.tsx # Single appointment overview with action controls
│   │   ├── AppointmentsPage.tsx  # Appointment list with booking and cancellation modals
│   │   ├── BillingPage.tsx       # Invoices and payment history
│   │   ├── DoctorDetailPage.tsx  # Physician profile and direct booking
│   │   ├── DoctorsPage.tsx       # Directory of available doctors
│   │   ├── ForgotPasswordPage.tsx# Step 1: 6-digit email reset code dispatch
│   │   ├── LandingPage.tsx       # Public marketing page
│   │   ├── LoginPage.tsx         # User authentication form
│   │   ├── MedicalRecordsPage.tsx# Patient EMR records with Add Record modal
│   │   ├── NotFoundPage.tsx      # 404 handler
│   │   ├── NotificationsPage.tsx # Notification feed
│   │   ├── PatientsPage.tsx      # Patient directory (doctors and admins)
│   │   ├── ProfilePage.tsx       # Current user profile manager
│   │   ├── RegisterPage.tsx      # Account creation form
│   │   └── ResetPasswordPage.tsx # Step 2: 6-digit code verification and password reset
│   ├── routes/
│   │   ├── index.tsx             # Central Route declarations
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

### UI Primitives (`src/components/ui/`)

| Component | File | Description |
|---|---|---|
| `Modal` | `Modal.tsx` | Accessible dialog with backdrop blur, scroll locking, Escape key support, and responsive sizing. |
| `ConfirmModal` | `ConfirmModal.tsx` | Semantic confirmation dialog with danger, warning, and primary styles, plus async loading spinner. |
| `Button` | `Button.tsx` | Standardized button with loading state, size variants, and color variants. |
| `Input` | `Input.tsx` | Reusable form input with validation label and error messaging. |
| `LoadingSpinner` | `LoadingSpinner.tsx` | Accessible SVG loading spinner for asynchronous views. |
| `Skeleton` | `Skeleton.tsx` | Skeleton placeholder primitive for loading states. |
| `SkeletonCard` | `SkeletonCard.tsx` | Pre-composed card skeleton for grid loading states. |

---

## Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher (or Yarn / pnpm)

---

## Installation and Setup

### 1. Navigate to the Frontend Directory

```bash
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Development Server

```bash
npm run dev
```

The Vite development server will start at `http://localhost:5173/`.

---

## Environment Configuration

Create a `.env` file in the `frontend/` root directory:

```ini
# Backend REST API Base URL
VITE_API_URL=http://127.0.0.1:8000/api/v1

# Backend Real-Time WebSocket Base URL
VITE_WS_URL=ws://127.0.0.1:8000/ws
```

For production deployments, update these values to match your production domain:

```ini
VITE_API_URL=https://api.medicare.example.com/api/v1
VITE_WS_URL=wss://api.medicare.example.com/ws
```

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the Vite development server with Hot Module Replacement. |
| `npm run build` | Compiles TypeScript (`tsc`) and generates optimized production bundles in `dist/`. |
| `npm run preview` | Serves the local production build from `dist/` for verification. |
| `npm run lint` | Runs ESLint across all TypeScript and TSX source files. |

---

## Routing and Access Guards

Route protection is implemented through the `<PrivateRoute>` wrapper component (`src/routes/PrivateRoute.tsx`):

- **Unauthenticated Users**: Automatically redirected to `/login` with the current location saved in state for post-login return.
- **Role Validation**: If the `roles` prop is specified (e.g. `roles={['admin']}`), users lacking the required role are redirected to `/dashboard` with access denied.
- **Route Table**:

| Path | Access Level | Description |
|---|---|---|
| `/` | Public | Landing page (redirects to `/dashboard` if authenticated) |
| `/login` | Public | Account authentication |
| `/register` | Public | New user registration |
| `/forgot-password` | Public | Password recovery code dispatch |
| `/reset-password` | Public | Code confirmation and new password entry |
| `/dashboard` | Authenticated | Main user dashboard |
| `/appointments` | Authenticated | Appointment listing, booking, and cancellation |
| `/appointments/:id` | Authenticated | Detailed appointment view with video session trigger |
| `/doctors` | Authenticated | Physician directory |
| `/medical-records` | Authenticated | Clinical records and EMR management |
| `/billing` | Patient, Admin | Invoices and payment status |
| `/patients` | Doctor, Admin | Patient registry |
| `/admin/*` | Admin Only | System metrics, user management, doctor credential verification |

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

## Real-Time WebSocket Integration

Real-time push notifications are handled via `useWebSocketNotifications.tsx`:

- Connects to `${VITE_WS_URL}/notifications/?token=${accessToken}`.
- Re-authenticates and reconnects automatically upon connection loss or token renewal.
- Catches inbound JSON payloads and renders interactive toast notifications with `react-hot-toast`.

---

## Building and Production Deployment

### 1. Build Production Assets

```bash
npm run build
```

This generates production-optimized HTML, CSS, and JavaScript bundles in the `frontend/dist/` directory.

### 2. Nginx Configuration for Single Page Applications (SPA)

When deploying to a static web server like Nginx, ensure all routes fall back to `index.html`:

```nginx
server {
    listen 80;
    server_name medicare.example.com;
    root /var/www/medicare/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /ws/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

---

## License

This project is distributed under the MIT License. See the root `LICENSE` file for full licensing terms.
