# Appointly

## 🚀 What is Appointly?

Appointly is a multi-tenant WhatsApp-based Appointment Management SaaS that enables small and medium businesses (clinics, salons, gyms, tutors, etc.) to automate booking, confirmations, and reminders directly through WhatsApp.

Customers book appointments via chat. Businesses manage availability and track appointments through a clean dashboard.

---

## 🎯 Goal

The goal of Appointly is to simplify appointment scheduling for SMBs by:

- Reducing manual coordination
- Eliminating double bookings
- Minimizing no-shows with automated reminders
- Providing a simple, scalable scheduling backend

We aim to deliver a lightweight, reliable, and production-grade SaaS that businesses can depend on daily.

---

## ✨ Core Features

- WhatsApp-based appointment booking
- Availability slot management
- Automatic booking confirmations
- Automated reminders
- Multi-tenant architecture (business-level isolation)
- Subscription-based access control
- Appointment analytics dashboard
- Secure webhook handling
- Scalable PostgreSQL-backed storage

---

## 🏗 Technical Architecture (High-Level)

Appointly follows a clean, scalable backend architecture:

**Frontend:**  
Next.js (TypeScript) dashboard for business management

**Backend:**  
Fastify (async)

- REST APIs for dashboard
- Webhook endpoints for WhatsApp and payment events
- Service layer for booking logic
- Repository layer for database access

**Database:**  
PostgreSQL (UUID-based schema, indexed for scale)

**Integrations:**

- WhatsApp Business Cloud API (booking & messaging)
- Razorpay (subscription billing)

**Infrastructure:**

- Dockerized services
- Postgres containerized via Docker Compose
- Designed for horizontal scaling

---

## 🔐 Design Principles

- Strict tenant isolation (business-level data separation)
- Atomic appointment booking (no double-booking)
- Secure webhook verification
- Index-optimized queries for scale
- Clean separation of API, service, and data layers

---

Appointly is built as a production-ready SaaS, designed to scale from a handful of businesses to thousands with reliable performance and clean architecture.
