# ExpenseFlow

ExpenseFlow is a full-stack expense reimbursement system with a polished Next.js frontend and a Node.js/Express API. It supports employees submitting claims, managers reviewing them, senior managers giving final approval, admins managing users, dashboards by role, receipt uploads, and real-time claim status notifications.

## Frontend

The frontend is built as a role-aware workspace for employees, managers, senior managers, and admins.

### Frontend Tech Stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- Redux Toolkit for auth session state
- TanStack Query for API data and cache invalidation
- React Hook Form + Zod validation
- Framer Motion animations
- Sonner toast notifications
- Lucide React icons

### Frontend Structure

```txt
client/
└── src/
    ├── app/                  # Next.js routes and layouts
    ├── components/           # Shared UI, layout, and common components
    ├── features/             # Auth, claims, dashboard, and users screens
    ├── hooks/                # Reusable client hooks
    ├── lib/                  # API client and auth storage helpers
    ├── store/                # Redux store and auth slice
    └── types/                # Shared frontend domain types
```

### Frontend Features

- Public landing page at `https://expenseflow-five-inky.vercel.app/`
- Login and signup screens
- Authenticated workspace shell
- Automatic redirect from `/login` and `/signup` to `/dashboard` when already logged in
- Role-based navigation and actions
- Claims table with filters, pagination, timeline, edit, delete, submit, and receipt upload actions
- Claim creation and editing form with schema validation
- Manager and senior manager approval actions
- Dashboard data refreshed through TanStack Query
- Real-time notification bell for claim status updates using SSE
- Recent claim status notification history loaded on login

### Frontend Environment

Create `client/.env.local` if the API is not running on the default port:

```env
NEXT_PUBLIC_API_URL=https://expenseflow-5hqe.onrender.com
```

### Frontend Setup

```bash
cd client
npm install
npm run dev
```

Open:

```txt
https://expenseflow-five-inky.vercel.app
```

### Frontend Scripts

```bash
npm run dev    # Start the Next.js development server
npm run build  # Build the production frontend
npm run start  # Start the production frontend
npm run lint   # Run ESLint
```

## Backend

The backend is a two-step expense reimbursement API built with Node.js, Express, TypeScript, Prisma, PostgreSQL, and JWT authentication.

### Backend Tech Stack

- Node.js + Express
- TypeScript
- PostgreSQL
- Prisma ORM
- JWT access and refresh tokens
- bcrypt password hashing
- Zod validation
- Multer receipt uploads
- Server-Sent Events for live notifications

### Backend Structure

```txt
server/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
└── src/
    ├── config/
    ├── constants/
    ├── controllers/
    ├── lib/
    ├── middleware/
    ├── repositories/
    ├── routes/
    ├── services/
    ├── types/
    ├── utils/
    └── validators/
```

The backend follows a layered pattern:

- `routes`: API route definitions and middleware wiring
- `controllers`: request/response handling
- `services`: business logic and workflow rules
- `repositories`: Prisma database access
- `validators`: Zod request validation
- `middleware`: auth, role authorization, validation, and error handling

### Backend Environment Variables

Create `server/.env`:

```env
PORT=5000
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/expenseflow"

ACCESS_TOKEN_SECRET="replace-with-access-secret"
REFRESH_TOKEN_SECRET="replace-with-refresh-secret"
ACCESS_TOKEN_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"
```

### Backend Setup

```bash
cd server
npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run dev
```

Health check:

```txt
GET /
```

### Backend Scripts

```bash
npm run dev              # Start development server
npm run build            # Compile TypeScript
npm run start            # Run compiled server
npm run seed             # Seed demo users
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run Prisma migrations
npm run prisma:studio    # Open Prisma Studio
```

## Seed Users

The seed script creates default users with this password:

```txt
Password@123
```

Example accounts:

```txt
admin@expenseflow.com
senior@expenseflow.com
manager@expenseflow.com
employee@expenseflow.com
```

## API Modules

### Auth

```txt
POST /api/auth/signup
POST /api/auth/login
GET  /api/auth/profile
POST /api/auth/refresh
POST /api/auth/logout
```

Login and signup are rate limited.

### Users / Admin

Admin-only APIs:

```txt
GET   /api/users
GET   /api/users/hierarchy
POST  /api/users
PATCH /api/users/:id
```

Admins can create employees, managers, senior managers, and admins by setting the `role` field.

Reporting rules:

- Employees report to managers.
- Managers report to senior managers.
- Senior managers and admins do not require a reporting manager.

### Claims

```txt
GET    /api/claims
POST   /api/claims
PATCH  /api/claims/:id
DELETE /api/claims/:id
POST   /api/claims/:id/submit
POST   /api/claims/:id/receipt
GET    /api/claims/:id/timeline
```

Claims list supports pagination and filters:

```txt
?page=1&limit=10&status=PENDING_MANAGER&category=TRAVEL&fromDate=2026-01-01&toDate=2026-01-31
```

Employees can edit or delete claims only while the claim is in an editable state:

```txt
DRAFT
REVERTED_TO_EMPLOYEE
```

### Approval Workflow

```txt
POST /api/approvals/:claimId/approve
POST /api/approvals/:claimId/reject
POST /api/approvals/:claimId/revert
```

Workflow:

```txt
Employee submits claim
→ Manager approves
→ Senior Manager approves
→ Claim approved
```

Reject requires a note and marks the claim as final rejected.

Senior manager revert sends the claim back to the manager.

Manager revert sends the claim back to the employee.

Backend authorization checks both:

- The user has the correct role.
- The claim is currently pending with that exact user.

### Dashboard

```txt
GET /api/dashboard/employee
GET /api/dashboard/manager
GET /api/dashboard/admin
```

Dashboard APIs return claim summaries for the current role. Admin dashboard also includes monthly claimed vs approved totals and active user counts by role.

### Notifications

```txt
GET /api/notifications
GET /api/notifications/stream?token=<access-token>
```

The frontend uses the notification history endpoint on login and the SSE stream for live updates while the user is connected.

## Roles

```txt
EMPLOYEE
MANAGER
SENIOR_MANAGER
ADMIN
```

## Claim Statuses

```txt
DRAFT
PENDING_MANAGER
PENDING_SENIOR_MANAGER
REVERTED_TO_MANAGER
REVERTED_TO_EMPLOYEE
APPROVED
REJECTED
```

## Receipt Uploads

Receipt files are uploaded with `multipart/form-data`:

```txt
POST /api/claims/:id/receipt
field name: receipt
```

Uploaded files are served from:

```txt
/uploads/receipts/:filename
```

## Error Format

Errors use a consistent JSON response:

```json
{
  "success": false,
  "message": "Error message"
}
```

Successful responses use:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

## Database Design

Main tables:

- `User`: user accounts, roles, active status, reporting hierarchy
- `Claim`: expense claims, current status, pending reviewer
- `ClaimActivity`: audit trail for submit, approve, reject, revert, and update actions

Indexes are added for common query patterns:

- users by role
- users by reporting manager
- claims by employee
- claims by pending reviewer
- claims by status
- claim activity by claim and actor

## Tradeoffs

- Receipt uploads use local filesystem storage instead of S3 to keep the assignment easy to run locally.
- Claim numbers are generated from the current claim count, which is fine for a take-home project but should be replaced with a stronger sequence strategy for high-concurrency production use.
- The approval timeline records the action, actor, note, and timestamp. The current workflow step is reflected through the claim status and pending reviewer.

## Verification

The backend currently builds successfully:

```bash
cd server
npm run build
```
