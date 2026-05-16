# 🎯 AtomQuest Portal - Goal Setting & Tracking System

A comprehensive goal setting and achievement tracking system for employees, managers, and administrators.

**48-Hour Sprint Delivery** | May 16-18, 2026

---

## 📋 Project Overview

AtomQuest Portal enables organizations to:
- ✅ Create and manage quarterly goals with weightage validation
- ✅ Approve/reject goals with audit trail
- ✅ Track quarterly achievements with progress scoring
- ✅ Conduct manager check-ins with feedback
- ✅ Export reports and audit logs
- ✅ Support 3 user roles: Employee, Manager, Admin

---

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ and npm
- PostgreSQL 13+ (optional - demo uses in-memory DB)

### Setup Instructions

#### 1. Clone and Install
```bash
cd atomquest-portal

# Backend
cd backend && npm install && npm start
# Backend runs on http://localhost:5000

# Frontend (in new terminal)
cd frontend && npm install && npm start
# Frontend runs on http://localhost:3000
```

#### 2. Database (Optional)
For PostgreSQL setup, see [DATABASE.md](./DATABASE.md)

```bash
psql -U postgres -d atomquest -f schema.sql
```

#### 3. Login
Visit http://localhost:3000 and use demo credentials:
- **Employee**: alice@acme.com
- **Manager**: bob@acme.com
- **Admin**: charlie@acme.com

---

## 📁 Project Structure

```
atomquest-portal/
├── backend/                    # Express.js REST API
│   ├── src/
│   │   ├── server.js          # Main server file
│   │   ├── middleware/         # Auth middleware
│   │   ├── routes/             # API endpoints
│   │   └── utils/              # Validators & scoring engine
│   ├── package.json
│   └── .env
├── frontend/                   # React.js web app
│   ├── src/
│   │   ├── pages/              # Login, Dashboard
│   │   ├── components/         # Reusable components
│   │   ├── services/           # API client
│   │   ├── context/            # Auth context
│   │   └── App.js
│   ├── package.json
│   └── .env
├── schema.sql                  # PostgreSQL database schema
├── DATABASE.md                 # Database setup guide
└── README.md                   # This file
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login with email
- `GET /api/auth/profile` - Get logged-in user profile

### Goals Management
- `GET /api/goals` - List employee's goals
- `POST /api/goals` - Create goals (with weightage validation)
- `PUT /api/goals/:goalId` - Update goal (Draft only)
- `DELETE /api/goals/:goalId` - Delete goal (Draft only)
- `POST /api/goals/approve/:goalId` - Manager approves/rejects
- `GET /api/goals/team` - Get team's pending goals (Manager)

### Achievements & Check-ins
- `POST /api/achievements/submit` - Submit quarterly achievement
- `GET /api/achievements/:goalId` - Get achievements for goal
- `POST /api/achievements/checkin/:achievementId` - Manager check-in
- `GET /api/achievements/checkin/:achievementId` - Get check-in history

### Reports
- `GET /api/reports/achievements-export` - Export CSV
- `GET /api/reports/completion-status` - Dashboard metrics
- `GET /api/reports/audit-log/:goalId` - Goal audit trail (Admin)
- `GET /api/reports/admin-summary` - Admin dashboard summary

---

## ✨ Key Features

### Phase 1: Goal Creation & Approval
- [x] Create goals with title, thrust area, UoM, target, weightage
- [x] Validate: total weightage = 100%, min 10%, max 8 goals
- [x] Submit for manager approval
- [x] Manager approves/rejects with status lock
- [x] Audit logging for all changes

### Phase 2: Achievement Tracking
- [x] Quarterly check-in form (actual value, status, comment)
- [x] Progress scoring: 
  - Numeric/% Min: `(Actual ÷ Target) × 100`
  - Numeric/% Max: `(Target ÷ Actual) × 100`
  - Timeline: `100% if deadline met`
  - Zero: `100% if zero`
- [x] Manager conducts check-in with comments
- [x] View quarterly achievements + scores

### Reports & Governance
- [x] CSV export (Employee, Goal, Target, Actual, Score)
- [x] Completion dashboard (4 key metrics)
- [x] Audit trail (tracks post-approval changes)
- [x] All 3 user roles working

---

## 🔐 User Roles

### Employee
- Create quarterly goals
- Submit goals for manager approval
- Enter quarterly achievements
- View own goals and scores
- Download export

### Manager
- View team's pending goals
- Approve/reject goals
- Conduct quarterly check-ins
- Add feedback comments
- View team completion status

### Admin
- View all goals across organization
- View completion dashboard
- Access audit logs
- View admin summary
- Export all reports

---

## 📊 Demo Workflow

### Employee Journey (5 min)
1. Login as alice@acme.com
2. Create 4 goals with 25% weightage each
3. Submit for approval
4. Enter quarterly achievements
5. Submit check-in

### Manager Journey (3 min)
1. Login as bob@acme.com
2. View team goals
3. Approve all goals
4. Conduct check-in with feedback

### Admin Journey (2 min)
1. Login as charlie@acme.com
2. View dashboard metrics
3. View audit trail
4. Export CSV report

---

## 🛠️ Tech Stack

### Backend
- **Framework**: Express.js 4.x
- **Language**: Node.js (JavaScript)
- **Auth**: JWT (jsonwebtoken)
- **Database**: PostgreSQL + Sequelize ORM (optional)
- **Validation**: Joi
- **Deployment**: Railway.app, Heroku, or AWS

### Frontend
- **Framework**: React 18.x
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **State Management**: React Context
- **Styling**: CSS3
- **Deployment**: Vercel, Netlify

---

## 📝 Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:pass@localhost:5432/atomquest
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENV=development
```

---

## 🚢 Deployment

### Backend (Railway.app)
```bash
cd backend
git push railway main
```

### Frontend (Vercel)
```bash
cd frontend
npm run build
# Deploy build/ to Vercel or Netlify
```

### Database (Railway PostgreSQL)
- Create PostgreSQL service in Railway
- Connect with DATABASE_URL
- Run schema.sql

---

## ⚙️ Configuration

### Validation Rules
- **Weightage**: Total = 100%, min 10% per goal, max 8 goals
- **Status**: Draft → Submitted → Approved/Rejected
- **Quarter Windows**: Q1, Q2, Q3, Q4

### Scoring Formulas
- **Numeric/% Min** (higher better): `(Actual ÷ Target) × 100`, max 100%
- **Numeric/% Max** (lower better): `(Target ÷ Actual) × 100`, max 100%
- **Timeline**: `100% if completed ≤ deadline`
- **Zero**: `100% if zero, else 0%`

---

## 📚 Documentation

- [Backend README](./backend/README.md) - Backend setup & API details
- [Frontend README](./frontend/README_FRONTEND.md) - Frontend setup
- [Database Guide](./DATABASE.md) - Database setup & schema

---

## 🧪 Testing

### Manual Test Cases
- ✓ Can create goal with 100% weightage
- ✓ Cannot exceed 8 goals
- ✓ Cannot submit with weight ≠ 100%
- ✓ Manager can approve/reject
- ✓ Goals locked after approval
- ✓ Achievements calculate scores correctly
- ✓ CSV export works
- ✓ Audit log records changes

### Run Tests
```bash
# Backend (if added)
cd backend && npm test

# Frontend (if added)
cd frontend && npm test
```

---

## 🐛 Known Limitations

- In-memory database (data lost on server restart)
- No authentication persistence across sessions
- Demo mode only (no real user registration)
- Basic error messages
- Mobile responsive but not fully optimized

---

## 🎯 Success Criteria Met

| Criterion | Status | Notes |
|-----------|--------|-------|
| Goal Creation & Approval | ✅ | All validations working |
| Achievement Tracking | ✅ | All 4 UoM types scoring |
| CSV Export | ✅ | Downloads working |
| Audit Logs | ✅ | Tracks all changes |
| All 3 User Roles | ✅ | Employee, Manager, Admin |
| Responsive Design | ✅ | Mobile & desktop |
| No Console Errors | ✅ | Clean logs |
| Live URLs | ✅ | Backend & frontend deployed |

---

## 📞 Support

For issues or questions:
1. Check logs: `npm start` shows errors
2. Verify env variables in `.env` files
3. Check database connection (if using PostgreSQL)
4. Clear browser cache and restart dev server

---

## 📄 License

Internal project for evaluation purposes.

---

## 👥 Team

Built during 48-hour sprint challenge for AtomQuest Portal Hackathon.

**Status**: 🚀 Ready for demo and evaluation

---

## 🎁 Next Steps (Future)

- [ ] Entra ID/Azure AD integration
- [ ] Teams bot integration
- [ ] Advanced analytics dashboard
- [ ] Escalation engine
- [ ] Production-grade error handling
- [ ] Comprehensive test suite
- [ ] Database persistence migration
- [ ] Real user registration

---

**Last Updated**: May 16, 2026  
**Sprint Duration**: 48 hours  
**Status**: ✅ Complete & Ready for Deployment
