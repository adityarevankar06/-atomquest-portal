import React, { useState, useEffect } from 'react';
import { getGoals, getTeamGoals, getCompletionStatus, getAchievements } from '../services/api';
import './Home.css';

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className={`home-stat-card home-stat-card--${color}`}>
      <div className="home-stat-icon">{icon}</div>
      <div className="home-stat-body">
        <div className="home-stat-value">{value}</div>
        <div className="home-stat-label">{label}</div>
        {sub && <div className="home-stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

function ProgressBar({ value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="home-progress-wrap">
      <div className="home-progress-track">
        <div
          className={`home-progress-fill home-progress-fill--${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="home-progress-pct">{pct}%</span>
    </div>
  );
}

// ── Employee home ────────────────────────────────────────────────────────────
function EmployeeHome({ user }) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGoals()
      .then(res => setGoals(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const draft     = goals.filter(g => g.status === 'Draft').length;
  const submitted = goals.filter(g => g.status === 'Submitted').length;
  const approved  = goals.filter(g => g.status === 'Approved').length;
  const rejected  = goals.filter(g => g.status === 'Rejected').length;
  const total     = goals.length;

  const totalWeight = goals
    .filter(g => g.status === 'Draft')
    .reduce((s, g) => s + Number(g.weightage || 0), 0);

  return (
    <div className="home-root">
      <div className="home-greeting">
        <div className="home-greeting-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
        <div>
          <div className="home-greeting-name">Welcome back, {user?.name?.split(' ')[0]}!</div>
          <div className="home-greeting-role">Employee · Q2 2026</div>
        </div>
      </div>

      {loading ? (
        <div className="home-loading">Loading your dashboard…</div>
      ) : (
        <>
          <div className="home-stats-grid">
            <StatCard icon="📋" label="Total Goals"     value={total}     color="blue"   sub="this quarter" />
            <StatCard icon="✏️" label="Draft"           value={draft}     color="amber"  sub={draft > 0 ? `${totalWeight}% weightage` : 'none pending'} />
            <StatCard icon="⏳" label="Pending Approval" value={submitted} color="purple" sub="awaiting manager" />
            <StatCard icon="✅" label="Approved"         value={approved}  color="green"  sub="locked in" />
          </div>

          {rejected > 0 && (
            <div className="home-alert home-alert--warn">
              ⚠️ <strong>{rejected} goal{rejected > 1 ? 's' : ''} rejected</strong> — go to My Goals to review and resubmit.
            </div>
          )}

          {total === 0 && (
            <div className="home-empty">
              <div className="home-empty-icon">🎯</div>
              <div className="home-empty-title">No goals yet this quarter</div>
              <div className="home-empty-sub">Head to <strong>My Goals</strong> to set your objectives and submit them for approval.</div>
            </div>
          )}

          {total > 0 && (
            <div className="home-section">
              <div className="home-section-title">Goal Status Breakdown</div>
              <div className="home-breakdown">
                <div className="home-breakdown-row">
                  <span>Draft</span>
                  <ProgressBar value={draft} max={total} color="amber" />
                  <span className="home-breakdown-count">{draft}</span>
                </div>
                <div className="home-breakdown-row">
                  <span>Submitted</span>
                  <ProgressBar value={submitted} max={total} color="purple" />
                  <span className="home-breakdown-count">{submitted}</span>
                </div>
                <div className="home-breakdown-row">
                  <span>Approved</span>
                  <ProgressBar value={approved} max={total} color="green" />
                  <span className="home-breakdown-count">{approved}</span>
                </div>
                <div className="home-breakdown-row">
                  <span>Rejected</span>
                  <ProgressBar value={rejected} max={total} color="red" />
                  <span className="home-breakdown-count">{rejected}</span>
                </div>
              </div>
            </div>
          )}

          <div className="home-section">
            <div className="home-section-title">Quick Actions</div>
            <div className="home-actions">
              <div className="home-action-card">
                <span className="home-action-icon">📋</span>
                <span>Set or update your goals in <strong>My Goals</strong></span>
              </div>
              <div className="home-action-card">
                <span className="home-action-icon">✏️</span>
                <span>Submit check-in actuals in <strong>Check-in</strong></span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Manager home ─────────────────────────────────────────────────────────────
function ManagerHome({ user }) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTeamGoals()
      .then(res => setGoals(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const pending  = goals.filter(g => g.status === 'Submitted').length;
  const approved = goals.filter(g => g.status === 'Approved').length;
  const rejected = goals.filter(g => g.status === 'Rejected').length;
  const total    = goals.length;

  const employees = [...new Set(goals.map(g => g.employee_name))];

  return (
    <div className="home-root">
      <div className="home-greeting">
        <div className="home-greeting-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
        <div>
          <div className="home-greeting-name">Welcome back, {user?.name?.split(' ')[0]}!</div>
          <div className="home-greeting-role">Manager · Q2 2026</div>
        </div>
      </div>

      {loading ? (
        <div className="home-loading">Loading your dashboard…</div>
      ) : (
        <>
          <div className="home-stats-grid">
            <StatCard icon="👥" label="Team Members"      value={employees.length} color="blue"   sub="reporting to you" />
            <StatCard icon="⏳" label="Pending Approval"  value={pending}          color="amber"  sub={pending > 0 ? 'needs your review' : 'all clear'} />
            <StatCard icon="✅" label="Approved Goals"    value={approved}         color="green"  sub="this quarter" />
            <StatCard icon="📊" label="Total Team Goals"  value={total}            color="purple" sub="across all members" />
          </div>

          {pending > 0 && (
            <div className="home-alert home-alert--action">
              🔔 <strong>{pending} goal{pending > 1 ? 's' : ''} waiting for your approval</strong> — visit <strong>Team Goals</strong> to review.
            </div>
          )}

          {employees.length > 0 && (
            <div className="home-section">
              <div className="home-section-title">Team Overview</div>
              <div className="home-team-list">
                {employees.map(emp => {
                  const empGoals   = goals.filter(g => g.employee_name === emp);
                  const empPending = empGoals.filter(g => g.status === 'Submitted').length;
                  const empApproved = empGoals.filter(g => g.status === 'Approved').length;
                  return (
                    <div key={emp} className="home-team-row">
                      <div className="home-team-avatar">{emp.charAt(0)}</div>
                      <div className="home-team-info">
                        <div className="home-team-name">{emp}</div>
                        <div className="home-team-meta">{empGoals.length} goals · {empApproved} approved</div>
                      </div>
                      {empPending > 0 && (
                        <span className="home-team-badge">{empPending} pending</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Admin home ───────────────────────────────────────────────────────────────
function AdminHome({ user }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCompletionStatus()
      .then(res => setMetrics(res.data.metrics))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="home-root">
      <div className="home-greeting">
        <div className="home-greeting-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
        <div>
          <div className="home-greeting-name">Welcome back, {user?.name?.split(' ')[0]}!</div>
          <div className="home-greeting-role">Admin · Q2 2026</div>
        </div>
      </div>

      {loading ? (
        <div className="home-loading">Loading your dashboard…</div>
      ) : metrics ? (
        <>
          <div className="home-stats-grid">
            <StatCard icon="📋" label="Total Goals"    value={metrics.total}       color="blue"   sub="org-wide" />
            <StatCard icon="⏳" label="Submitted"      value={metrics.submitted}   color="amber"  sub="awaiting review" />
            <StatCard icon="✅" label="Approved"       value={metrics.approved}    color="green"  sub="locked in" />
            <StatCard icon="✏️" label="Check-ins Done" value={metrics.checkin_done} color="purple" sub="actuals submitted" />
          </div>

          <div className="home-section">
            <div className="home-section-title">Organisation Progress</div>
            <div className="home-breakdown">
              <div className="home-breakdown-row">
                <span>Submitted</span>
                <ProgressBar value={metrics.submitted}    max={metrics.total} color="amber" />
                <span className="home-breakdown-count">{metrics.submitted}</span>
              </div>
              <div className="home-breakdown-row">
                <span>Approved</span>
                <ProgressBar value={metrics.approved}     max={metrics.total} color="green" />
                <span className="home-breakdown-count">{metrics.approved}</span>
              </div>
              <div className="home-breakdown-row">
                <span>Rejected</span>
                <ProgressBar value={metrics.rejected}     max={metrics.total} color="red" />
                <span className="home-breakdown-count">{metrics.rejected}</span>
              </div>
              <div className="home-breakdown-row">
                <span>Check-ins</span>
                <ProgressBar value={metrics.checkin_done} max={metrics.total} color="purple" />
                <span className="home-breakdown-count">{metrics.checkin_done}</span>
              </div>
            </div>
          </div>

          <div className="home-section">
            <div className="home-section-title">Quick Actions</div>
            <div className="home-actions">
              <div className="home-action-card">
                <span className="home-action-icon">🛡️</span>
                <span>View full metrics in <strong>Admin Dashboard</strong></span>
              </div>
              <div className="home-action-card">
                <span className="home-action-icon">📊</span>
                <span>Review check-ins in <strong>Check-in Review</strong></span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="home-empty">
          <div className="home-empty-icon">📊</div>
          <div className="home-empty-title">No data yet</div>
          <div className="home-empty-sub">Metrics will appear once employees start submitting goals.</div>
        </div>
      )}
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────
export default function Home({ user }) {
  const role = (user?.role || 'employee').toLowerCase();
  if (role === 'manager') return <ManagerHome user={user} />;
  if (role === 'admin')   return <AdminHome   user={user} />;
  return <EmployeeHome user={user} />;
}
