# sciinov CRM System

Production-grade CRM system built with MERN stack, integrated with sciinov DBMS for authentication and conference data.

## Architecture

```
React Frontend (Vite + Tailwind CSS)
  → Node.js/Express Backend (CRM Layer)
    → MongoDB (CRM Database)
    → sciinov DBMS API (External Auth + Conferences)
```

## Features

- **Authentication**: sciinov DBMS JWT integration (no custom auth)
- **Client Management**: CRUD with soft delete, roles (Speaker/Attendee/Sponsor)
- **Status Tracking**: REGISTERED → PAID → DECLINED → NEXT_EDITION_INTEREST
- **Payment Module**: Multi-payment support, partial payments, payment modes
- **Follow-up Module**: Scheduling, overdue tracking, completion workflow
- **Dashboard**: KPIs, revenue, conversion rate, status breakdown
- **Activity Logs**: Full audit trail of all CRM operations
- **Search & Filter**: By name, email, status, role, conference, date
- **File Upload**: Profile image uploads
- **sciinov Integration**: Conferences, export (Excel/PDF)

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB running locally (or Atlas URI)
- sciinov DBMS account

### Backend

```bash
cd server
npm install
npm run dev           # Runs on http://localhost:5000
```

### Frontend

```bash
cd client
npm install
npm run dev           # Runs on http://localhost:5173
```

## Environment Variables (server/.env)

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sciinovcrms
sciinov_BASE_URL=https://sciinovdbms-64307221061.asia-south1.run.app
JWT_SECRET=your-jwt-secret
UPLOAD_DIR=uploads
NODE_ENV=development
```

## API Endpoints

### Auth (proxy to sciinov)
- `POST /api/auth/signin` - Login
- `POST /api/auth/refresh-token` - Refresh JWT
- `POST /api/auth/logout` - Logout

### Clients
- `GET /api/clients` - List (with search, filter, pagination)
- `POST /api/clients` - Create (multipart for image)
- `GET /api/clients/:id` - Get details
- `PUT /api/clients/:id` - Update
- `DELETE /api/clients/:id` - Soft delete

### Payments
- `GET /api/payments` - List all
- `POST /api/payments` - Add payment
- `GET /api/payments/client/:clientId` - By client
- `PUT /api/payments/:id` - Update

### Follow-ups
- `GET /api/follow-ups` - List all
- `POST /api/follow-ups` - Create
- `GET /api/follow-ups/client/:clientId` - By client
- `PUT /api/follow-ups/:id` - Update
- `DELETE /api/follow-ups/:id` - Delete

### Dashboard & Logs
- `GET /api/dashboard` - Dashboard metrics
- `GET /api/activity-logs` - Activity logs

### sciinov Proxy
- `GET /api/sciinov/conferences` - Conference list
- `GET /api/sciinov/export/excel` - Excel export
- `GET /api/sciinov/export/pdf` - PDF export