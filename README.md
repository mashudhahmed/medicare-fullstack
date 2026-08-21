# Medicare Healthcare Management Platform

A comprehensive healthcare management platform built with Django REST Framework, PostgreSQL, and Redis. Designed for modern healthcare facilities with role-based access control for patients, doctors, and administrators.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Security Features](#security-features)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Medicare is a production-ready healthcare management system that streamlines patient management, appointment scheduling, medical records, and billing operations. The platform implements a multi-tenant architecture with granular role-based permissions ensuring data security and compliance with healthcare regulations.

---

## Features

### Authentication & Authorization
- JWT-based authentication with refresh token rotation
- Role-based access control (Patient, Doctor, Administrator)
- Secure password hashing with bcrypt
- Account lockout protection (Axes)
- Session management and logout

### Patient Management
- Patient registration and profile management
- Medical history tracking
- Emergency contact information
- Allergies and chronic conditions recording

### Doctor Management
- Doctor profiles with specialization
- Qualification and experience tracking
- License verification system
- Availability scheduling
- Consultation fee management

### Appointment Scheduling
- Online appointment booking
- Real-time availability checking
- Appointment status tracking (pending, confirmed, completed, cancelled)
- Automated reminders
- Rescheduling and cancellation

### Medical Records
- Digital health records management
- Diagnosis, prescription, test results
- Document attachments
- Confidentiality controls
- Audit trail

### Billing & Insurance
- Invoice generation
- Payment tracking (pending, paid, overdue)
- Insurance claim support
- Discount and tax management
- Payment history

### Security
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- SQL injection protection (ORM)
- Cross-site scripting (XSS) protection
- Cross-site request forgery (CSRF) protection
- Rate limiting
- Audit logging

---

## Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Backend | Django | 5.1.1 |
| API Framework | Django REST Framework | 3.15.2 |
| Database | PostgreSQL | 16.0+ |
| Cache | Redis | 7.0+ |
| Task Queue | Celery | 5.4.0 |
| WebSocket | Django Channels | 4.1.0 |
| Authentication | JWT (SimpleJWT) | 5.3.1 |
| Rate Limiting | Django Axes | 6.5.1 |
| API Documentation | drf-yasg (Swagger) | 1.21.8 |
| Security | django-csp | 3.8 |
| Monitoring | Sentry SDK | 2.18.0 |
| Server | Gunicorn | 23.0.0 |
| Static Files | WhiteNoise | 6.8.2 |

---

## Prerequisites

### Required Software

| Software | Minimum Version |
|----------|-----------------|
| Python | 3.11.0 |
| PostgreSQL | 16.0 |
| Redis | 7.0 |
| Node.js (for frontend) | 18.0 |

### Optional Software

- Docker (recommended for production)
- Docker Compose
- Sentry (error tracking)
- Celery Beat (scheduled tasks)

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/mashudhahmed/medicare-fullstack.git
cd medicare-fullstack/backend