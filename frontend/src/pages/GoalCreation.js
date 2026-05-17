import React, { useState, useEffect } from 'react';
import { getGoals, createGoal, submitGoals, deleteGoal } from "../services/api";
import './GoalCreation.css';
import Toast from '../components/Toast';
import useToast from '../components/useToast';

const THRUST_AREAS = [
    'Revenue Growth',
    'Customer Retention',
    'Operational Excellence',
    'Team Development',
    'Product Innovation',
    'Cost Optimisation',
    'Compliance & Risk',
    'Other'
];

const UOM_TYPES = ['Numeric', 'Percentage', 'Timeline', 'Zero'];

const EMPTY_ROW = {
    title: '', thrust_area: '', uom_type: 'Numeric',
    uom_direction: 'Min', target: '', weightage: '', description: ''
};

export default function GoalCreation() {
    const [goals, setGoals]           = useState([]);           // saved goals from API
    const [rows, setRows]             = useState([{ ...EMPTY_ROW, _id: Date.now() }]); // form rows
    const [loading, setLoading]       = useState(false);
    const [fetching, setFetching]     = useState(true);
  const { toasts, showToast, removeToast } = useToast();
    const [submitting, setSubmitting] = useState(false);

    // Load existing goals on mount
    useEffect(() => {
        fetchGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchGoals = async () => {
        setFetching(true);
        try {
            const res = await getGoals();
            setGoals(res.data.data || []);
        } catch (err) {
            showToast('Could not load existing goals.', 'error');
        } finally {
            setFetching(false);
        }
    };

    // ── Row helpers ─────────────────────────────────────────────
    const addRow = () => {
        if (rows.length + goals.length >= 8) {
            showToast('Maximum 8 goals allowed.', 'warn');
            return;
        }
        setRows(prev => [...prev, { ...EMPTY_ROW, _id: Date.now() }]);
    };

    const removeRow = (id) => setRows(prev => prev.filter(r => r._id !== id));

    const updateRow = (id, field, value) => {
        
        setRows(prev => prev.map(r => r._id === id ? { ...r, [field]: value } : r));
    };

    // ── Live weightage totals ────────────────────────────────────
    const savedWeight  = goals
        .filter(g => g.status === 'Draft')
        .reduce((s, g) => s + parseFloat(g.weightage || 0), 0);

    const formWeight   = rows.reduce((s, r) => s + parseFloat(r.weightage || 0), 0);
    const totalWeight  = Math.round((savedWeight + formWeight) * 100) / 100;
    const weightOk     = totalWeight === 100;

    // ── Save (create) goals ──────────────────────────────────────
    const handleSave = async () => {
        
        

        // Front-end validation
        for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            if (!r.title.trim())      { showToast(`Row ${i+1}: Title is required.`, 'warn');       return; }
            if (!r.thrust_area)       { showToast(`Row ${i+1}: Thrust Area is required.`, 'warn');  return; }
            if (!r.uom_type)          { showToast(`Row ${i+1}: UoM Type is required.`, 'warn');     return; }
            if (r.target === '')      { showToast(`Row ${i+1}: Target is required.`, 'warn');       return; }
            if (!r.weightage || parseFloat(r.weightage) < 10) {
                showToast(`Row ${i+1}: Minimum weightage is 10%.`, 'warn'); return;
            }
        }

        if (!weightOk) {
            showToast(`Total weightage is ${totalWeight}%. Must be exactly 100% before saving.`, 'warn');
            return;
        }

        setLoading(true);
        try {
            const payload = rows.map(r => ({
                title:         r.title.trim(),
                description:   r.description.trim(),
                thrust_area:   r.thrust_area,
                uom_type:      r.uom_type,
                uom_direction: r.uom_direction,
                target:        r.target,
                weightage:     parseFloat(r.weightage)
            }));
            await createGoal(payload);
            showToast(`${rows.length} goal(s) saved as Draft.`, 'success');
            setRows([{ ...EMPTY_ROW, _id: Date.now() }]);
            fetchGoals();
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to save goals.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // ── Submit for approval ──────────────────────────────────────
    const handleSubmit = async () => {
        if (!weightOk) {
            showToast(`Total weightage is ${totalWeight}%. Must be exactly 100% to submit.`, 'warn');
            return;
        }
        if (goals.filter(g => g.status === 'Draft').length === 0) {
            showToast('No Draft goals to submit. Save your goals first.', 'warn');
            return;
        }
        setSubmitting(true);
        
        try {
            await submitGoals();
            showToast("All Draft goals submitted for manager approval!", 'success');
            fetchGoals();
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to submit goals.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Delete a saved draft ─────────────────────────────────────
    const handleDelete = async (goalId) => {
        if (!window.confirm('Delete this goal?')) return;
        try {
            await deleteGoal(goalId);
            fetchGoals();
        } catch (err) {
            showToast(err.response?.data?.error || 'Could not delete goal.', 'error');
        }
    };

    const statusColor = { Draft: '#f0ad4e', Submitted: '#5bc0de', Approved: '#5cb85c', Rejected: '#d9534f' };

    if (fetching) return <div className="gc-loading">Loading your goals…</div>;

    return (
        <div className="gc-wrapper">
            <div className="gc-header">
                <div>
                    <h2>My Goals</h2>
                    <p className="gc-subtitle">Create quarterly goals. Total weightage must equal 100%.</p>
                </div>
                <div className="gc-header-actions">
                    <button className="btn-add-row" onClick={addRow}
                        disabled={rows.length + goals.length >= 8}>
                        + Add Row
                    </button>
                </div>
            </div>

            <Toast toasts={toasts} onRemove={removeToast} />

            {/* ── Saved Goals Table ─────────────────────────────── */}
            {goals.length > 0 && (
                <div className="gc-section">
                    <h3 className="gc-section-title">Saved Goals</h3>
                    <div className="gc-table-wrap">
                        <table className="gc-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Title</th>
                                    <th>Thrust Area</th>
                                    <th>UoM</th>
                                    <th>Direction</th>
                                    <th>Target</th>
                                    <th>Weight %</th>
                                    <th>Status</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {goals.map((g, i) => (
                                    <React.Fragment key={g.id}>
                                    <tr>
                                        <td className="td-num">{i + 1}</td>
                                        <td className="td-title">{g.title}</td>
                                        <td>{g.thrust_area}</td>
                                        <td>{g.uom_type}</td>
                                        <td>{g.uom_direction}</td>
                                        <td>{g.target}</td>
                                        <td className="td-weight">{g.weightage}%</td>
                                        <td>
                                            <span className="status-pill"
                                                style={{ backgroundColor: statusColor[g.status] || '#aaa' }}>
                                                {g.status}
                                            </span>
                                        </td>
                                        <td>
                                            {g.status === 'Draft' && (
                                                <button className="btn-icon-del"
                                                    onClick={() => handleDelete(g.id)}
                                                    title="Delete">🗑</button>
                                            )}
                                            {g.status === 'Rejected' && (
                                                <button className="btn-resubmit" onClick={() => handleDelete(g.id)} title="Delete to resubmit">🗑 Remove</button>
                                            )}
                                        </td>
                                    </tr>
                                    {g.status === 'Rejected' && g.rejection_reason && (
                                        <tr className="rejection-reason-row">
                                            <td colSpan="9">
                                                <div className="rejection-reason-banner">
                                                    <span className="rejection-reason-icon">❌</span>
                                                    <div>
                                                        <div className="rejection-reason-label">Rejected by manager</div>
                                                        <div className="rejection-reason-text">{g.rejection_reason}</div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── New Goals Form ────────────────────────────────── */}
            <div className="gc-section">
                <h3 className="gc-section-title">
                    {goals.length > 0 ? 'Add More Goals' : 'Create Goals'}
                </h3>
                <div className="gc-table-wrap">
                    <table className="gc-table gc-table-form">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Title <span className="req">*</span></th>
                                <th>Thrust Area <span className="req">*</span></th>
                                <th>UoM Type <span className="req">*</span></th>
                                <th>Direction</th>
                                <th>Target <span className="req">*</span></th>
                                <th>Weight % <span className="req">*</span></th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, i) => (
                                <tr key={row._id}>
                                    <td className="td-num">{goals.length + i + 1}</td>
                                    <td>
                                        <input
                                            className="cell-input"
                                            placeholder="e.g. Increase Revenue"
                                            value={row.title}
                                            onChange={e => updateRow(row._id, 'title', e.target.value)}
                                        />
                                    </td>
                                    <td>
                                        <select className="cell-select"
                                            value={row.thrust_area}
                                            onChange={e => updateRow(row._id, 'thrust_area', e.target.value)}>
                                            <option value="">-- Select --</option>
                                            {THRUST_AREAS.map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>
                                        <select className="cell-select"
                                            value={row.uom_type}
                                            onChange={e => updateRow(row._id, 'uom_type', e.target.value)}>
                                            {UOM_TYPES.map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>
                                        <select className="cell-select"
                                            value={row.uom_direction}
                                            onChange={e => updateRow(row._id, 'uom_direction', e.target.value)}
                                            disabled={row.uom_type === 'Zero' || row.uom_type === 'Timeline'}>
                                            <option value="Min">Min ↑</option>
                                            <option value="Max">Max ↓</option>
                                        </select>
                                    </td>
                                    <td>
                                        <input
                                            className="cell-input cell-target"
                                            placeholder={row.uom_type === 'Timeline' ? 'YYYY-MM-DD' : '0'}
                                            type={row.uom_type === 'Timeline' ? 'date' : 'number'}
                                            value={row.target}
                                            onChange={e => updateRow(row._id, 'target', e.target.value)}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            className={`cell-input cell-weight ${parseFloat(row.weightage) < 10 && row.weightage !== '' ? 'invalid' : ''}`}
                                            placeholder="10–100"
                                            type="number"
                                            min="10" max="100"
                                            value={row.weightage}
                                            onChange={e => updateRow(row._id, 'weightage', e.target.value)}
                                        />
                                    </td>
                                    <td>
                                        {rows.length > 1 && (
                                            <button className="btn-icon-del"
                                                onClick={() => removeRow(row._id)}
                                                title="Remove row">✕</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Weightage Summary ─────────────────────────────── */}
            <div className="gc-weight-bar">
                <div className="gc-weight-info">
                    <span>Total Weightage:</span>
                    <span className={`gc-weight-total ${weightOk ? 'ok' : 'bad'}`}>
                        {totalWeight}%
                        {weightOk ? ' ✓' : ` (need ${100 - totalWeight > 0 ? '+' : ''}${Math.round((100 - totalWeight)*100)/100}% more)`}
                    </span>
                </div>
                <div className="gc-weight-track">
                    <div className="gc-weight-fill"
                        style={{
                            width: `${Math.min(totalWeight, 100)}%`,
                            backgroundColor: weightOk ? '#5cb85c' : totalWeight > 100 ? '#d9534f' : '#f0ad4e'
                        }} />
                </div>
            </div>

            {/* ── Action Buttons ────────────────────────────────── */}
            <div className="gc-actions">
                <button className="btn-save" onClick={handleSave} disabled={loading}>
                    {loading ? 'Saving…' : '💾 Save as Draft'}
                </button>
                <button className="btn-submit-approval"
                    onClick={handleSubmit}
                    disabled={submitting || !weightOk || goals.filter(g => g.status === 'Draft').length === 0}>
                    {submitting ? 'Submitting…' : '🚀 Submit for Approval'}
                </button>
            </div>

            {/* ── Rules reminder ────────────────────────────────── */}
            <div className="gc-rules">
                <strong>Rules:</strong> Max 8 goals &nbsp;•&nbsp; Min 10% per goal &nbsp;•&nbsp; Total must equal 100% &nbsp;•&nbsp; Goals lock after approval
            </div>
        </div>
    );
}
