import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getTeamAchievements, addCheckInComment } from '../services/api';
import './ManagerCheckIn.css';

function ScorePill({ score }) {
  if (score === null || score === undefined) return <span className="pill-na">No data</span>;
  const color =
    score >= 80 ? 'pill-green' : score >= 50 ? 'pill-amber' : 'pill-red';
  return <span className={`score-pill ${color}`}>{score}%</span>;
}

export default function ManagerCheckIn() {
  const { user } = useContext(AuthContext);
  const [employees, setEmployees] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openEmployee, setOpenEmployee] = useState(null);
  const [commentGoalId, setCommentGoalId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadTeam();
  }, []);

  async function loadTeam() {
    setLoading(true);
    try {
      const res = await getTeamAchievements();
      // Group goals by employee
      const grouped = {};
      res.data.forEach(goal => {
        const key = goal.employee_id;
        if (!grouped[key]) {
          grouped[key] = {
            employee_id: goal.employee_id,
            employee_name: goal.employee_name || `Employee ${goal.employee_id}`,
            employee_email: goal.employee_email || '',
            goals: [],
          };
        }
        grouped[key].goals.push(goal);
      });
      setEmployees(grouped);
      // Auto-open first employee
      const keys = Object.keys(grouped);
      if (keys.length > 0) setOpenEmployee(keys[0]);
    } catch {
      setError('Failed to load team data. Make sure the backend is running.');
    }
    setLoading(false);
  }

  function toggleEmployee(empId) {
    setOpenEmployee(prev => (prev === empId ? null : empId));
    setCommentGoalId(null);
    setSuccessMsg('');
  }

  function openComment(goalId) {
    setCommentGoalId(prev => (prev === goalId ? null : goalId));
    setCommentText('');
    setSuccessMsg('');
  }

  async function handleSubmitComment(goalId) {
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      await addCheckInComment(goalId, { comment: commentText.trim() });
      setSuccessMsg(`Comment saved for goal ${goalId}`);
      setCommentGoalId(null);
      setCommentText('');
      await loadTeam();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to save comment.');
    }
    setSubmitting(false);
  }

  function weightedScore(goals) {
    const scored = goals.filter(
      g => g.progress_score !== null && g.progress_score !== undefined
    );
    if (scored.length === 0) return null;
    const total = scored.reduce(
      (sum, g) => sum + (g.progress_score * (parseFloat(g.weightage) || 0)) / 100,
      0
    );
    return Math.round(total);
  }

  if (loading) return <div className="mci-loading">Loading team check-ins…</div>;

  const empList = Object.values(employees);

  return (
    <div className="mci-container">
      <div className="mci-header">
        <h2>Team Check-in Review</h2>
        <p className="mci-subtitle">
          View your team's progress actuals and add your comments.
        </p>
      </div>

      {error && <div className="mci-error">{error}</div>}
      {successMsg && <div className="mci-success">{successMsg}</div>}

      {empList.length === 0 ? (
        <div className="mci-empty">
          <span>👥</span>
          <p>No team check-in data yet. Employees need to submit their actuals first.</p>
        </div>
      ) : (
        <div className="mci-employees">
          {empList.map(emp => {
            const ws = weightedScore(emp.goals);
            const isOpen = openEmployee === String(emp.employee_id);
            const hasActuals = emp.goals.some(
              g => g.actual_value !== null && g.actual_value !== undefined
            );

            return (
              <div key={emp.employee_id} className="mci-emp-block">
                <div
                  className={`mci-emp-header ${isOpen ? 'mci-emp-open' : ''}`}
                  onClick={() => toggleEmployee(String(emp.employee_id))}
                >
                  <div className="mci-emp-left">
                    <div className="mci-avatar">
                      {emp.employee_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="mci-emp-name">{emp.employee_name}</p>
                      <p className="mci-emp-email">{emp.employee_email}</p>
                    </div>
                  </div>
                  <div className="mci-emp-right">
                    <span className="mci-goal-count">
                      {emp.goals.length} goal{emp.goals.length !== 1 ? 's' : ''}
                    </span>
                    {!hasActuals && (
                      <span className="mci-no-actuals">Awaiting actuals</span>
                    )}
                    {ws !== null && <ScorePill score={ws} />}
                    <span className="mci-chevron">{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isOpen && (
                  <div className="mci-goals-list">
                    {emp.goals.map(goal => (
                      <div key={goal.id} className="mci-goal-row">
                        <div className="mci-goal-top">
                          <div className="mci-goal-info">
                            <span className="mci-thrust">{goal.thrust_area}</span>
                            <p className="mci-goal-title">{goal.title}</p>
                            <div className="mci-tags">
                              <span className="tag">{goal.uom_type}</span>
                              {goal.uom_direction && (
                                <span className="tag tag-dir">{goal.uom_direction}</span>
                              )}
                              <span className="tag tag-weight">
                                {goal.weightage}% weight
                              </span>
                            </div>
                          </div>
                          <ScorePill score={goal.progress_score} />
                        </div>

                        <div className="mci-values">
                          <div className="mci-val-box">
                            <span className="mci-val-label">Target</span>
                            <span className="mci-val">{goal.uom_target ?? '—'}</span>
                          </div>
                          <div className="mci-val-box">
                            <span className="mci-val-label">Actual</span>
                            <span
                              className={`mci-val ${
                                goal.actual_value === null || goal.actual_value === undefined
                                  ? 'mci-val-missing'
                                  : ''
                              }`}
                            >
                              {goal.actual_value !== null && goal.actual_value !== undefined
                                ? String(goal.actual_value)
                                : 'Not submitted'}
                            </span>
                          </div>
                          {goal.employee_remarks && (
                            <div className="mci-val-box mci-val-remarks">
                              <span className="mci-val-label">Employee note</span>
                              <span className="mci-val">{goal.employee_remarks}</span>
                            </div>
                          )}
                        </div>

                        {/* Existing manager comments */}
                        {goal.manager_comments && goal.manager_comments.length > 0 && (
                          <div className="mci-comments">
                            <p className="mci-comments-heading">Manager comments</p>
                            {goal.manager_comments.map((c, i) => (
                              <div key={i} className="mci-comment-item">
                                <span className="mci-comment-date">
                                  {new Date(c.created_at).toLocaleDateString()}
                                </span>
                                <p className="mci-comment-text">{c.comment}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add comment section */}
                        <div className="mci-comment-action">
                          {commentGoalId === goal.id ? (
                            <div className="mci-comment-form">
                              <textarea
                                rows={3}
                                placeholder="Add your check-in comment…"
                                value={commentText}
                                onChange={e => setCommentText(e.target.value)}
                              />
                              <div className="mci-comment-btns">
                                <button
                                  className="btn-cancel"
                                  onClick={() => setCommentGoalId(null)}
                                >
                                  Cancel
                                </button>
                                <button
                                  className="btn-comment"
                                  onClick={() => handleSubmitComment(goal.id)}
                                  disabled={submitting || !commentText.trim()}
                                >
                                  {submitting ? 'Saving…' : 'Save Comment'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              className="btn-add-comment"
                              onClick={() => openComment(goal.id)}
                            >
                              + Add Comment
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
