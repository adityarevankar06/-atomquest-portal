# AtomQuest Goal Setting & Tracking Portal

A full-stack web application for quarterly goal setting, manager approval, achievement tracking, and reporting across three user roles: Employee, Manager, and Admin.

---

## Demo Credentials

| Role     | Email              |
|----------|--------------------|
| Employee | alice@acme.com     |
| Manager  | bob@acme.com       |
| Admin    | charlie@acme.com   |

No password required — select from the dropdown on the login page.

---

## Quick Start

### Backend

```bash
cd backend
npm install
cp .env.example .env        # fill in DATABASE_URL and JWT_SECRET
npm run dev                  # runs on http://localhost:5000
```

### Database

```bash
# Requires PostgreSQL 14+
# Option A — local
psql -U postgres -c "CREATE DATABASE atomquest;"
psql -U postgres -d atomquest -f schema.sql

# Option B — Railway.app (recommended for deployment)
# Add a PostgreSQL service in Railway; it sets DATABASE_URL automatically.
```

Seed the three demo users:

```sql
INSERT INTO employees (name, email, role) VALUES
  ('Alice Johnson', 'alice@acme.com', 'Employee'),
  ('Bob Manager',   'bob@acme.com',   'Manager'),
  ('Charlie Admin', 'charlie@acme.com', 'Admin');

-- Set Alice's manager to Bob
UPDATE employees
SET manager_id = (SELECT id FROM employees WHERE email = 'bob@acme.com')
WHERE email = 'alice@acme.com';
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env        # set REACT_APP_API_URL for production
npm start                    # runs on http://localhost:3000
```

---

## Environment Variables

### Backend — `backend/.env`

```
DATABASE_URL=postgresql://postgres:admin@localhost:5432/atomquest
JWT_SECRET=change-this-to-a-long-random-string
JWT_EXPIRES_IN=8h
FRONTEND_URL=https://your-app.vercel.app   # leave blank for local dev
PORT=5000
```

### Frontend — `frontend/.env`

```
REACT_APP_API_URL=https://your-backend.railway.app   # leave blank for local dev
```

---

## Deployment

### Backend → Railway.app

1. Push code to GitHub
2. Create a new project on [Railway.app](https://railway.app)
3. Connect your GitHub repo — Railway auto-detects Node.js
4. Add a **PostgreSQL** service in the same project
5. Railway injects `DATABASE_URL` automatically
6. Set `JWT_SECRET` and `FRONTEND_URL` in Railway's Variables tab
7. Backend deploys to `https://atomquest-backend.up.railway.app`

### Frontend → Vercel

```bash
cd frontend
npm run build
# Then either:
# A) Push to GitHub — Vercel auto-deploys on every push
# B) vercel --prod   (Vercel CLI)
```

Set `REACT_APP_API_URL` in Vercel's Environment Variables to the Railway backend URL.

### Verify deployment

```bash
curl https://atomquest-backend.up.railway.app/api/health
# Expected: {"status":"UP"}
```

---

## API Endpoints

### Auth
```
POST   /api/auth/login                  Body: { email, role }
```

### Goals
```
GET    /api/goals                       List current user's goals
POST   /api/goals                       Create a goal (Draft)
PUT    /api/goals/:id                   Update a Draft goal
DELETE /api/goals/:id                   Delete a Draft goal
POST   /api/goals/submit                Submit all Draft goals for approval
GET    /api/goals/team                  Manager: list team's goals
POST   /api/goals/approve/:id           Manager: approve or reject a goal
```

### Achievements
```
POST   /api/achievements/submit         Submit quarterly actual values
GET    /api/achievements                Employee: view own achievements
GET    /api/achievements/team           Manager: view team achievements
POST   /api/achievements/checkin/:id    Manager: add comment to a goal check-in
```

### Reports
```
GET    /api/reports/completion-status   Admin: metric counts + per-employee breakdown
GET    /api/reports/achievements-export Admin: download CSV file
```

### Audit Log
```
GET    /api/audit-log                   Admin: full audit trail
GET    /api/audit-log/:goalId           Per-goal audit trail
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (React)                          │
│                                                                 │
│  ┌──────────┐  ┌───────────────┐  ┌──────────────────────────┐  │
│  │  Login   │  │ Employee      │  │ Manager Dashboard        │  │
│  │  Page    │  │ Dashboard     │  │ - Team Goals             │  │
│  │          │  │ - My Goals    │  │ - Approve / Reject       │  │
│  │  (Role   │  │ - Create Goal │  │ - Check-in Review        │  │
│  │  select) │  │ - Check-in    │  │                          │  │
│  └──────────┘  └───────────────┘  └──────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Admin Dashboard — Metrics · Audit Trail · CSV Export    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│               axios (JWT in Authorization header)               │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS
┌───────────────────────────▼─────────────────────────────────────┐
│                    NODE.JS BACKEND (Express)                    │
│                                                                 │
│  Middleware:  CORS · JWT Auth · JSON body parser                │
│                                                                 │
│  Routes:                                                        │
│  /api/auth        → auth.js        (login, token issue)         │
│  /api/goals       → goals.js       (CRUD, approve, team)        │
│  /api/achievements→ achievements.js(submit, check-in, scoring)  │
│  /api/reports     → reports.js     (CSV export, metrics)        │
│  /api/audit-log   → auditLog.js    (trail read/write)           │
│                                                                 │
│  Utils:  scoringEngine.js · goalValidator.js                    │
└───────────────────────────┬─────────────────────────────────────┘
                            │ pg (node-postgres)
┌───────────────────────────▼─────────────────────────────────────┐
│                     POSTGRESQL DATABASE                         │
│                                                                 │
│  employees          goals              quarterly_achievements   │
│  ─────────          ─────              ──────────────────────   │
│  id (PK)            id (PK)            id (PK)                  │
│  name               employee_id (FK)   goal_id (FK)             │
│  email              title              quarter                  │
│  role               thrust_area        actual_achievement       │
│  manager_id (FK)    uom_type           progress_score           │
│                     uom_direction      status                   │
│                     target                                      │
│  check_ins          weightage          audit_logs               │
│  ──────────         status             ──────────               │
│  id (PK)            approved_by (FK)   id (PK)                  │
│  achievement_id(FK)                    goal_id (FK)             │
│  manager_id (FK)                       field_changed            │
│  comment                               old_value                │
│                                        new_value                │
│                                        changed_by (FK)          │
│                                        changed_at               │
└─────────────────────────────────────────────────────────────────┘

HOSTING
  Frontend  → Vercel       (https://atomquest.vercel.app)
  Backend   → Railway.app  (https://atomquest-backend.up.railway.app)
  Database  → Railway PostgreSQL (same project, auto-linked)
```

---

## Known Limitations

- No real authentication — demo uses email + role selection with no password
- Token expiry set to 8 hours; page redirects to login automatically when expired
- CSV export is generated in-process; for large datasets a streaming approach would be needed
- No email notifications on goal approval/rejection

---

## Project Structure

```
atomquest-portal/
├── backend/
│   ├── src/
│   │   ├── middleware/   auth.js
│   │   ├── routes/       auth.js · goals.js · achievements.js · reports.js · auditLog.js
│   │   ├── utils/        scoringEngine.js · goalValidator.js
│   │   └── server.js
│   ├── schema.sql
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── context/      AuthContext.js
    │   ├── pages/        Login · Dashboard · GoalList · GoalCreation
    │   │                 ManagerDashboard · CheckIn · ManagerCheckIn
    │   │                 AdminDashboard · EmptyState
    │   └── services/     api.js
    └── .env.example
```
