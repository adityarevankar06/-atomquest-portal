import React, { useEffect, useState } from 'react';
import { getGoals } from '../services/api';
import EmptyState from './EmptyState';
import './GoalList.css';

const STATUS_BADGE = {
  Draft:     { label: 'Draft',    cls: 'badge--draft'    },
  Submitted: { label: 'Pending',  cls: 'badge--pending'  },
  Approved:  { label: 'Approved', cls: 'badge--approved' },
  Rejected:  { label: 'Rejected', cls: 'badge--rejected' },
};

const GoalList = ({ onCreateGoal }) => {
  const [goals,   setGoals]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    getGoals()
      .then((res) => setGoals(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load goals.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="goal-list__loading">Loading goals…</p>;
  }

  if (error) {
    return (
      <EmptyState
        icon="⚠️"
        title="Could not load goals"
        message={error}
      />
    );
  }

  // ── FIX 3: empty goal list — friendly prompt instead of blank table ──────────
  if (goals.length === 0) {
    return (
      <EmptyState
        icon="🎯"
        title="No goals yet"
        message="Create your quarterly goals and submit them for manager approval."
        action={{ label: '+ Create Goal', onClick: onCreateGoal }}
      />
    );
  }

  const totalWeight = goals.reduce((s, g) => s + parseFloat(g.weightage || 0), 0);

  return (
    <div className="goal-list">
      <div className="goal-list__header">
        <h2>My Goals</h2>
        <span className={`weight-total ${Math.round(totalWeight) === 100 ? 'weight-total--ok' : 'weight-total--warn'}`}>
          Total weight: {totalWeight.toFixed(1)}%
          {Math.round(totalWeight) !== 100 && ' ⚠ Must equal 100%'}
        </span>
      </div>

      <table className="goal-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Thrust Area</th>
            <th>UoM</th>
            <th>Target</th>
            <th>Weight</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {goals.map((g) => {
            const badge = STATUS_BADGE[g.status] || { label: g.status, cls: '' };
            return (
              <tr key={g.id}>
                <td>{g.title}</td>
                <td>{g.thrust_area || '—'}</td>
                <td>{g.uom_type}{g.uom_direction ? ` (${g.uom_direction})` : ''}</td>
                <td>{g.target}</td>
                <td>{parseFloat(g.weightage).toFixed(1)}%</td>
                <td><span className={`badge ${badge.cls}`}>{badge.label}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default GoalList;
