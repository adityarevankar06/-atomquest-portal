# AtomQuest Portal — Demo Script
## Total time: ~10 minutes

---

## EMPLOYEE JOURNEY — alice@acme.com (5 min)

**Login**
1. Open the app → Login page loads
2. Select **Alice Johnson — Employee** from the dropdown
3. Click **Sign In** → lands on Employee Dashboard

**Create Goals**
4. Click **"+ Create Goal"**
5. Add Goal 1:
   - Title: `Increase Revenue`
   - Thrust Area: `Financial`
   - UoM Type: `Numeric` | Direction: `Min`
   - Target: `100000`
   - Weightage: `25`
   - Click **Save**
6. Add Goal 2:
   - Title: `Customer Satisfaction`
   - Thrust Area: `Customer`
   - UoM Type: `Percentage` | Direction: `Min`
   - Target: `85`
   - Weightage: `25`
   - Click **Save**
7. Add Goal 3:
   - Title: `Process Efficiency`
   - Thrust Area: `Operations`
   - UoM Type: `Timeline`
   - Target: `2026-12-31`
   - Weightage: `25`
   - Click **Save**
8. Add Goal 4:
   - Title: `Safety Incidents`
   - Thrust Area: `Safety`
   - UoM Type: `Zero`
   - Target: `0`
   - Weightage: `25`
   - Click **Save**
9. Point out: **Total Weight = 100% ✓** (shown in the goal list header)
10. Click **"Submit for Approval"** → goals status changes to `Pending`

**Quarterly Check-in**
11. Click the **"My Check-in"** tab
12. Enter actuals:
    - Revenue: `85000` → live score shows **85.00%**
    - Customer Satisfaction: `88` → live score shows **100.00%** (capped)
    - Process Efficiency: `2026-11-30` → score shows **100%** (on time)
    - Safety Incidents: `2` → score shows **0%** (not zero)
13. Set status: `On Track`
14. Click **Submit** → overall weighted score shown at top

---

## MANAGER JOURNEY — bob@acme.com (3 min)

**Login**
1. Select **Bob Manager — Manager** → Sign In → Manager Dashboard

**Approve Goals**
2. Click **"Team Goals"** tab → see Alice's 4 pending goals listed
3. Click **Approve** on each goal (×4)
4. Goals now show **Approved** badge with a lock icon — read-only for Alice

**Conduct Check-in**
5. Click **"Check-in Review"** tab
6. Alice's goals are grouped under her name with her weighted score in the header
7. Expand **"Increase Revenue"** → see actual = 85,000, score = 85.00%
8. Type comment: `Great progress on revenue — keep the momentum going!`
9. Click **Save Comment**
10. Expand **"Safety Incidents"** → score = 0%
11. Type comment: `Safety needs immediate attention next quarter.`
12. Click **Save Comment**

---

## ADMIN JOURNEY — charlie@acme.com (2 min)

**Login**
1. Select **Charlie Admin — Admin** → Sign In → lands directly on Admin Dashboard

**View Metrics**
2. Point out the 6 metric cards:
   - Total Goals | Submitted | Approved | Check-ins Done | Avg Score | Completion %
3. Scroll to **Per-Employee Breakdown** table → Alice's row shows progress bar

**Audit Trail**
4. Scroll to **Audit Trail** table
5. Show rows: goal created → submitted → approved → comment added (with timestamps)

**Export**
6. Click **"Export CSV"** → file downloads instantly
7. Open in Excel → columns: Employee, Goal, Target, Actual, Score, Status — all clean

---

## Key Talking Points

- All 4 UoM scoring formulas work correctly (Numeric, Percentage, Timeline, Zero)
- Weightage validation enforced: 100% total, min 10% per goal, max 8 goals
- Approved goals are locked — no edits after manager approves
- Audit trail captures every state change with timestamp and actor
- CSV export handles commas in goal titles without breaking Excel columns
