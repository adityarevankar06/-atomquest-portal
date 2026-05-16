# AtomQuest — Final Testing Checklist
## Critical Path Testing (Run before submission)

---

## Priority 1: Core Workflows

| # | Step | How to test | Expected result | Pass? |
|---|------|-------------|-----------------|-------|
| 1.1 | Employee creates a goal | Login as alice → Create Goal → fill all fields → Save | Goal appears in list with status `Draft` | |
| 1.2 | Employee submits goals | Goals total 100% → click Submit for Approval | All goals flip to status `Pending` | |
| 1.3 | Manager approves goals | Login as bob → Team Goals → click Approve on each | Goals show `Approved` + lock icon | |
| 1.4 | Manager rejects a goal | Team Goals → click Reject on one goal | Goal returns to `Draft`; employee can edit again | |
| 1.5 | Employee enters achievements | Login as alice → My Check-in → enter actual values → Submit | Scores calculated and saved; overall weighted score shown | |
| 1.6 | Progress score — Numeric Min | Target=100, Actual=85 | Score = **85.00** | |
| 1.7 | Progress score — Numeric Min capped | Target=100, Actual=120 | Score = **100.00** (not 120) | |
| 1.8 | Progress score — Numeric Max | Target=10, Actual=15 | Score = **66.67** | |
| 1.9 | Progress score — Timeline on time | Deadline=2026-12-31, Completed=2026-11-30 | Score = **100** | |
| 1.10 | Progress score — Timeline late | Completed after deadline | Score = **0** | |
| 1.11 | Progress score — Zero, actual=0 | Enter 0 incidents | Score = **100** | |
| 1.12 | Progress score — Zero, actual>0 | Enter 2 incidents | Score = **0** | |
| 1.13 | CSV export works | Login as charlie → Admin Dashboard → Export CSV | File downloads; opens cleanly in Excel with correct columns | |

---

## Priority 2: Validation

| # | Step | How to test | Expected result | Pass? |
|---|------|-------------|-----------------|-------|
| 2.1 | Weightage must equal 100% | Submit goals totalling 90% | Error: "Total weightage must equal 100%" | |
| 2.2 | Weightage must equal 100% | Submit goals totalling 110% | Error: "Total weightage must equal 100%" | |
| 2.3 | Min weightage 10% per goal | Create a goal with weight = 5% | Error: "Minimum weightage is 10%" | |
| 2.4 | Max 8 goals | Already have 8 goals → try adding a 9th | Error: "Maximum 8 goals allowed" | |
| 2.5 | No editing after approval | Login as alice → open an Approved goal | Fields are read-only; no Save/Edit button visible | |
| 2.6 | Quarterly window enforced | Submit achievement for same goal + quarter twice | Error or second entry blocked | |

---

## Priority 3: UI Polish

| # | Check | How to verify | Expected result | Pass? |
|---|-------|---------------|-----------------|-------|
| 3.1 | No console errors | Open browser DevTools (F12) → Console tab → navigate all pages | Zero red errors; warnings acceptable | |
| 3.2 | Mobile responsive | DevTools → Toggle device toolbar → iPhone 12 (390px) → navigate all pages | No horizontal scroll; all buttons tappable | |
| 3.3 | All buttons clickable | Click every button across all pages | No dead buttons; every click produces a visible response | |
| 3.4 | Loading states | Slow the network (DevTools → Network → Slow 3G) → load any page | Spinner or "Loading…" shown; page doesn't flash blank | |
| 3.5 | Empty state — no goals | Login as a fresh user with no goals | "No goals yet" empty state shown with Create button | |
| 3.6 | Session expiry | Manually set an expired token in localStorage → reload | Redirected to `/login?reason=expired` with expiry banner | |
| 3.7 | Role separation | Login as alice → try navigating to `/manager` or `/admin` route | Redirected away or access denied | |

---

## How to run

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm start

# Browser
open http://localhost:3000
```

Work through every row above top to bottom.
Mark each row **Pass** or note the failure.
Fix all Priority 1 and Priority 2 failures before deploying.
Priority 3 failures are acceptable only if time is critically short.
