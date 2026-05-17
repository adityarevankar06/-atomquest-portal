import React, { useState, useEffect, useCallback } from 'react';
import { getTeamGoals, approveGoal } from "../services/api";
import './ManagerDashboard.css';
import Toast from '../components/Toast';
import useToast from '../components/useToast';

const STATUS_COLOR = {
    Draft:     '#f0ad4e',
    Submitted: '#5bc0de',
    Approved:  '#5cb85c',
    Rejected:  '#d9534f'
};

export default function ManagerDashboard() {
    const [goals, setGoals]         = useState([]);
    const [loading, setLoading]     = useState(true);
  const { toasts, showToast, removeToast } = useToast();

    // Reject modal state
    const [rejectModal, setRejectModal] = useState(null); // goalId or null
    const [rejectReason, setRejectReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // Filter / group
    const [filter, setFilter] = useState('All');

    const fetchTeamGoals = useCallback(async () => {
        setLoading(true);
        
        try {
            const res = await getTeamGoals();
            setGoals(res.data.data || []);
        } catch (err) {
            showToast('Could not load team goals.', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchTeamGoals(); }, [fetchTeamGoals]);

    // ── Approve ──────────────────────────────────────────────────
    const handleApprove = async (goalId, goalTitle) => {
        if (!window.confirm(`Approve "${goalTitle}"?`)) return;
        setActionLoading(true);
        
        
        try {
            await approveGoal(goalId, true);
            showToast(`"${goalTitle}" approved and locked.`, 'success');
            fetchTeamGoals();
        } catch (err) {
            showToast(err.response?.data?.error || 'Could not approve goal.', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // ── Reject (open modal) ──────────────────────────────────────
    const openRejectModal = (goalId) => {
        setRejectReason('');
        setRejectModal(goalId);
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            showToast('Please enter a rejection reason.', 'warn');
            return;
        }
        setActionLoading(true);
        
        
        try {
            await approveGoal(rejectModal, false, rejectReason.trim());
            const goal = goals.find(g => g.id === rejectModal);
            showToast(`"${goal?.title}" rejected and returned to employee.`, 'success');
            setRejectModal(null);
            fetchTeamGoals();
        } catch (err) {
            showToast(err.response?.data?.error || 'Could not reject goal.', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // ── Computed ─────────────────────────────────────────────────
    const statusCounts = goals.reduce((acc, g) => {
        acc[g.status] = (acc[g.status] || 0) + 1;
        return acc;
    }, {});

    const filtered = filter === 'All'
        ? goals
        : goals.filter(g => g.status === filter);

    // Group by employee
    const byEmployee = filtered.reduce((acc, g) => {
        const key = g.employee_name || g.employee_email;
        if (!acc[key]) acc[key] = [];
        acc[key].push(g);
        return acc;
    }, {});

    if (loading) return <div className="md-loading">Loading team goals…</div>;

    return (
        <div className="md-wrapper">

            {/* ── Header ──────────────────────────────────────── */}
            <div className="md-header">
                <div>
                    <h2>Team Goals</h2>
                    <p className="md-subtitle">Review and approve your team's quarterly goals.</p>
                </div>
                <button className="btn-refresh" onClick={fetchTeamGoals}>↻ Refresh</button>
            </div>

            <Toast toasts={toasts} onRemove={removeToast} />

            {/* ── Summary cards ───────────────────────────────── */}
            <div className="md-summary-cards">
                {['All', 'Submitted', 'Approved', 'Rejected', 'Draft'].map(s => (
                    <div
                        key={s}
                        className={`md-card ${filter === s ? 'active' : ''}`}
                        style={filter === s ? { borderColor: STATUS_COLOR[s] || '#667eea' } : {}}
                        onClick={() => setFilter(s)}>
                        <div className="md-card-count"
                            style={{ color: STATUS_COLOR[s] || '#667eea' }}>
                            {s === 'All' ? goals.length : (statusCounts[s] || 0)}
                        </div>
                        <div className="md-card-label">{s}</div>
                    </div>
                ))}
            </div>

            {/* ── Goals grouped by employee ────────────────────── */}
            {Object.keys(byEmployee).length === 0 ? (
                <div className="md-empty">
                    {filter === 'All'
                        ? 'No goals found for your team yet.'
                        : `No goals with status "${filter}".`}
                </div>
            ) : (
                Object.entries(byEmployee).map(([empName, empGoals]) => (
                    <div key={empName} className="md-employee-block">
                        <div className="md-employee-header">
                            <div className="md-employee-avatar">
                                {empName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="md-employee-name">{empName}</div>
                                <div className="md-employee-meta">
                                    {empGoals.length} goal(s) &nbsp;·&nbsp;
                                    Total weight: {empGoals.reduce((s,g) => s + parseFloat(g.weightage||0), 0)}%
                                </div>
                            </div>
                        </div>

                        <div className="md-table-wrap">
                            <table className="md-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Goal Title</th>
                                        <th>Thrust Area</th>
                                        <th>UoM</th>
                                        <th>Target</th>
                                        <th>Weight %</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {empGoals.map((g, i) => (
                                        <tr key={g.id}>
                                            <td className="td-num">{i + 1}</td>
                                            <td className="td-title">
                                                {g.title}
                                                {g.rejection_reason && (
                                                    <div className="td-rejection-note">
                                                        Reason: {g.rejection_reason}
                                                    </div>
                                                )}
                                            </td>
                                            <td>{g.thrust_area}</td>
                                            <td>
                                                <span className="uom-tag">
                                                    {g.uom_type} / {g.uom_direction}
                                                </span>
                                            </td>
                                            <td>{g.target}</td>
                                            <td className="td-weight">{g.weightage}%</td>
                                            <td>
                                                <span className="status-pill"
                                                    style={{ backgroundColor: STATUS_COLOR[g.status] || '#aaa' }}>
                                                    {g.status}
                                                </span>
                                            </td>
                                            <td>
                                                {g.status === 'Submitted' && (
                                                    <div className="td-actions">
                                                        <button
                                                            className="btn-approve"
                                                            onClick={() => handleApprove(g.id, g.title)}
                                                            disabled={actionLoading}>
                                                            ✓ Approve
                                                        </button>
                                                        <button
                                                            className="btn-reject"
                                                            onClick={() => openRejectModal(g.id)}
                                                            disabled={actionLoading}>
                                                            ✕ Reject
                                                        </button>
                                                    </div>
                                                )}
                                                {g.status === 'Approved' && (
                                                    <span className="locked-label">🔒 Locked</span>
                                                )}
                                                {g.status === 'Rejected' && (
                                                    <span className="rejected-label">↩ Returned</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))
            )}

            {/* ── Reject Modal ─────────────────────────────────── */}
            {rejectModal && (
                <div className="modal-overlay" onClick={() => setRejectModal(null)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <h3>Reject Goal</h3>
                        <p>Provide a reason so the employee knows what to fix.</p>
                        <textarea
                            className="modal-textarea"
                            rows={4}
                            placeholder="e.g. Target value is too low. Please revise to at least $120K."
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            autoFocus
                        />
                        <div className="modal-actions">
                            <button className="btn-modal-cancel"
                                onClick={() => setRejectModal(null)}>
                                Cancel
                            </button>
                            <button className="btn-modal-reject"
                                onClick={handleReject}
                                disabled={actionLoading || !rejectReason.trim()}>
                                {actionLoading ? 'Rejecting…' : 'Confirm Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
