import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getMyAchievements, submitAchievement } from '../services/api';
import './CheckIn.css';

const UOM_LABELS = {
  Numeric: { actual: 'Actual Value', target: 'Target Value', placeholder: 'e.g. 85' },
  Percentage: { actual: 'Actual %', target: 'Target %', placeholder: 'e.g. 78' },
  Timeline: { actual: 'Completion Date', target: 'Target Date', placeholder: 'YYYY-MM-DD' },
  Zero: { actual: 'Occurrences (must be 0)', target: 'Target: 0', placeholder: '0' },
};

function computeScoreLocally(goal, actual) {
  const a = parseFloat(actual);
  if (isNaN(a)) return null;

  const target = parseFloat(goal.uom_target);
  const min = parseFloat(goal.uom_min);
  const max = parseFloat(goal.uom_max);

  switch (goal.uom_type) {
    case 'Numeric':
    case 'Percentage': {
      if (goal.uom_direction === 'Increase') {
        if (a <= min) return 0;
        if (a >= target) return 100;
        return Math.round(((a - min) / (target - min)) * 100);
      } else {
        if (a >= max) return 0;
        if (a <= target) return 100;
        return Math.round(((max - a) / (max - target)) * 100);
      }
    }
    case 'Timeline': {
      const targetDate = new Date(goal.uom_target).getTime();
      const actualDate = new Date(actual).getTime();
      if (isNaN(actualDate)) return null;
      const diff = targetDate - actualDate;
      if (diff < 0) return Math.max(0, 100 + Math.round(diff / (1000 * 60 * 60 * 24)));
      return 100;
    }
    case 'Zero':
      return a === 0 ? 100 : 0;
    default:
      return null;
  }
}

function ScoreBadge({ score }) {
  if (score === null) return null;
  const color = score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <span className="score-badge" style={{ background: color }}>
      {score}%
    </span>
  );
}

export default function CheckIn() {
  const { user } = useContext(AuthContext);
  const [goals, setGoals] = useState([]);
  const [actuals, setActuals] = useState({});
  const [remarks, setRemarks] = useState({});
  const [saving, setSaving] = useState({});
  const [saved, setSaved] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGoals();
  }, []);

  async function loadGoals() {
    setLoading(true);
    try {
      const res = await getMyAchievements();
      const approvedGoals = res.data.filter(g => g.status === 'Approved');
      setGoals(approvedGoals);

      // Pre-fill actuals from existing achievement data
      const prefill = {};
      const prefillRemarks = {};
      approvedGoals.forEach(g => {
        if (g.actual_value !== undefined && g.actual_value !== null) {
          prefill[g.id] = String(g.actual_value);
        }
        if (g.employee_remarks) {
          prefillRemarks[g.id] = g.employee_remarks;
        }
      });
      setActuals(prefill);
      setRemarks(prefillRemarks);
    } catch {
      setError('Failed to load goals. Make sure the backend is running.');
    }
    setLoading(false);
  }

  function handleActualChange(goalId, value) {
    setActuals(prev => ({ ...prev, [goalId]: value }));
    setSaved(prev => ({ ...prev, [goalId]: false }));
  }

  function handleRemarkChange(goalId, value) {
    setRemarks(prev => ({ ...prev, [goalId]: value }));
    setSaved(prev => ({ ...prev, [goalId]: false }));
  }

  async function handleSave(goal) {
    const actual = actuals[goal.id];
    if (actual === undefined || actual === '') {
      setError(`Please enter actual value for: ${goal.title}`);
      return;
    }
    setError('');
    setSaving(prev => ({ ...prev, [goal.id]: true }));
    try {
      await submitAchievement(goal.id, {
        actual_value: actual,
        employee_remarks: remarks[goal.id] || '',
      });
      setSaved(prev => ({ ...prev, [goal.id]: true }));
      await loadGoals(); // refresh to get server-computed score
    } catch (e) {
      setError(e.response?.data?.error || 'Save failed. Try again.');
    }
    setSaving(prev => ({ ...prev, [goal.id]: false }));
  }

  const overallScore = goals.length
    ? Math.round(
        goals.reduce((sum, g) => {
          const score = g.progress_score ?? computeScoreLocally(g, actuals[g.id]);
          const weight = parseFloat(g.weightage) || 0;
          return sum + (score ?? 0) * (weight / 100);
        }, 0)
      )
    : null;

  if (loading) return <div className="checkin-loading">Loading your goals…</div>;

  return (
    <div className="checkin-container">
      <div className="checkin-header">
        <div>
          <h2>Quarterly Check-in</h2>
          <p className="checkin-subtitle">
            Enter your actual values for each approved goal. Save each row individually.
          </p>
        </div>
        {overallScore !== null && (
          <div className="overall-score-card">
            <span className="overall-score-label">Weighted Score</span>
            <span
              className="overall-score-value"
              style={{
                color:
                  overallScore >= 80
                    ? '#22c55e'
                    : overallScore >= 50
                    ? '#f59e0b'
                    : '#ef4444',
              }}
            >
              {overallScore}%
            </span>
          </div>
        )}
      </div>

      {error && <div className="checkin-error">{error}</div>}

      {goals.length === 0 ? (
        <div className="checkin-empty">
          <span>📋</span>
          <p>No approved goals found. Goals must be approved by your manager before you can check in.</p>
        </div>
      ) : (
        <div className="checkin-goals">
          {goals.map(goal => {
            const label = UOM_LABELS[goal.uom_type] || UOM_LABELS.Numeric;
            const liveScore = computeScoreLocally(goal, actuals[goal.id]);
            const serverScore = goal.progress_score;
            const displayScore = serverScore ?? liveScore;
            const isTimeline = goal.uom_type === 'Timeline';
            const isZero = goal.uom_type === 'Zero';

            return (
              <div key={goal.id} className="checkin-card">
                <div className="checkin-card-header">
                  <div className="checkin-goal-meta">
                    <span className="checkin-thrust">{goal.thrust_area}</span>
                    <h3 className="checkin-goal-title">{goal.title}</h3>
                    <div className="checkin-goal-tags">
                      <span className="tag">{goal.uom_type}</span>
                      {goal.uom_direction && (
                        <span className="tag tag-dir">{goal.uom_direction}</span>
                      )}
                      <span className="tag tag-weight">{goal.weightage}% weight</span>
                    </div>
                  </div>
                  <ScoreBadge score={displayScore} />
                </div>

                <div className="checkin-target-row">
                  <span className="checkin-target-label">{label.target}:</span>
                  <strong>{goal.uom_target}</strong>
                  {goal.uom_min && (
                    <span className="checkin-minmax">
                      Min: {goal.uom_min} / Max: {goal.uom_max}
                    </span>
                  )}
                </div>

                <div className="checkin-inputs">
                  <div className="checkin-field">
                    <label>{label.actual}</label>
                    <input
                      type={isTimeline ? 'date' : 'number'}
                      placeholder={label.placeholder}
                      value={actuals[goal.id] || ''}
                      onChange={e => handleActualChange(goal.id, e.target.value)}
                      disabled={isZero}
                      min={isZero ? 0 : undefined}
                      step={goal.uom_type === 'Percentage' ? '0.1' : '1'}
                    />
                    {isZero && (
                      <span className="checkin-zero-note">Zero-tolerance: actual must be 0</span>
                    )}
                  </div>

                  <div className="checkin-field checkin-field-remarks">
                    <label>Your Remarks (optional)</label>
                    <textarea
                      rows={2}
                      placeholder="Add context about your actual value…"
                      value={remarks[goal.id] || ''}
                      onChange={e => handleRemarkChange(goal.id, e.target.value)}
                    />
                  </div>
                </div>

                {liveScore !== null && serverScore === null && (
                  <div className="checkin-preview">
                    Preview score: <strong>{liveScore}%</strong>
                  </div>
                )}

                <div className="checkin-card-footer">
                  {saved[goal.id] && (
                    <span className="checkin-saved-msg">✓ Saved successfully</span>
                  )}
                  <button
                    className="btn-save"
                    onClick={() => handleSave(goal)}
                    disabled={saving[goal.id]}
                  >
                    {saving[goal.id] ? 'Saving…' : 'Save Actual'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
