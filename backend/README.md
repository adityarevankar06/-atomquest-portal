# AtomQuest Portal - Backend

## Quick Start

### Installation
```bash
npm install
```

### Environment Variables
Create a `.env` file:
```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://postgres:admin@localhost:5432/atomquest
JWT_SECRET=test-secret-key
CORS_ORIGIN=http://localhost:3000
```

### Running the Server
```bash
npm start
# Server runs on http://localhost:5000
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Goals
- `GET /api/goals` - List employee's goals
- `POST /api/goals` - Create goals
- `PUT /api/goals/:goalId` - Update goal
- `DELETE /api/goals/:goalId` - Delete goal
- `POST /api/goals/approve/:goalId` - Manager approves goal
- `GET /api/goals/team` - Get team goals (Manager only)

### Achievements
- `POST /api/achievements/submit` - Submit quarterly achievement
- `GET /api/achievements/:goalId` - Get achievements for a goal
- `POST /api/achievements/checkin/:achievementId` - Manager check-in
- `GET /api/achievements/checkin/:achievementId` - Get check-ins

### Reports
- `GET /api/reports/achievements-export` - Export as CSV
- `GET /api/reports/completion-status` - Dashboard metrics
- `POST /api/reports/audit-log` - Create audit log
- `GET /api/reports/audit-log/:goalId` - Get audit logs
- `GET /api/reports/admin-summary` - Admin dashboard

## Demo Users

```
alice@acme.com (Employee)
bob@acme.com (Manager)
charlie@acme.com (Admin)
```

No password required for demo.

## Architecture

- Express.js for REST API
- JWT for authentication
- In-memory database for demo
- UUID for unique IDs
