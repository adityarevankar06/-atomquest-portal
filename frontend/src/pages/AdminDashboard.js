import React, { useState, useEffect } from 'react';
import { getCompletionStatus, getAuditLog, triggerExport } from '../services/api';
import './AdminDashboard.css';

const METRIC_CONFIG = [
  { key: 'total',        label: 'Total Goals',    icon: '📋', color: '#6366f1' },
  { key: 'submitted',    label: 'Submitted',      icon: '📤', color: '#f59e0b' },
  { key: 'approved',     label: 'Approved',       icon: '✅', color: '#22c55e' },
  { key: 'rejected',     label: 'Rejected',       icon: '❌', color: '#ef4444' },
  { key: 'checkin_done', label: 'Check-in Done',  icon: '📊', color: '#8b5cf6' },
  { key: 'draft',        label: 'Draft',          icon: '📝', color: '#6b7280' },
];

export default function AdminDashboard() {
  const [metrics, setMetrics]         = useState(null);
  const [byEmployee, setByEmployee]   = useState({});
  const [auditLog, setAuditLog]       = useState([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingAudit, setLoadingAudit]     = useState(true);
  const [exporting, setExporting]     = useState(false);
  const [error, setError]             = useState('');
  const [auditPage, setAuditPage]     = useState(0);

  const AUDIT_PAGE_SIZE = 10;

  useEffect(() => {
    loadMetrics();
    loadAudit();
  }, []);

  async function loadMetrics() {
    setLoadingMetrics(true);
    try {
      const res = await getCompletionStatus();
      setMetrics(res.data.metrics);
      setByEmployee(res.data.by_employee || {});
    } catch {
      setError('Failed to load completion status.');
    }
    setLoadingMetrics(false);
  }

  async function loadAudit() {
    setLoadingAudit(true);
    try {
      const res = await getAuditLog();
      setAuditLog(res.data.data || []);
    } catch {
      // Audit log may be empty on first load — not a hard error
      setAuditLog([]);
    }
    setLoadingAudit(false);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const res = await triggerExport();
      // Create a temporary anchor and trigger a download
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = 'atomquest-achievements.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError('Export failed. Make sure the backend is running.');
    }
    setExporting(false);
  }

  // Paginated audit entries
  const totalPages    = Math.ceil(auditLog.length / AUDIT_PAGE_SIZE);
  const visibleAudit  = auditLog.slice(
    auditPage * AUDIT_PAGE_SIZE,
    (auditPage + 1) * AUDIT_PAGE_SIZE
  );

  function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString();
  }

  function actionBadge(action) {
    const map = {
      create:   { label: 'Created',   cls: 'badge-create'  },
      update:   { label: 'Updated',   cls: 'badge-update'  },
      submit:   { label: 'Submitted', cls: 'badge-submit'  },
      approve:  { label: 'Approved',  cls: 'badge-approve' },
      reject:   { label: 'Rejected',  cls: 'badge-reject'  },
      delete:   { label: 'Deleted',   cls: 'badge-delete'  },
    };
    const cfg = map[action] || { label: action, cls: 'badge-update' };
    return <span className={`action-badge ${cfg.cls}`}>{cfg.label}</span>;
  }

  return (
    <div className="admin-container">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="admin-header">
        <div>
          <h2>Admin Dashboard</h2>
          <p className="admin-subtitle">
            Monitor goal completion across the organisation.
          </p>
        </div>
        <button
          className="btn-export"
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? 'Exporting…' : '⬇ Export CSV'}
        </button>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {/* ── Metrics cards ──────────────────────────────────────────────── */}
      <section className="metrics-section">
        {loadingMetrics ? (
          <div className="admin-loading">Loading metrics…</div>
        ) : metrics ? (
          <div className="metrics-grid">
            {METRIC_CONFIG.map(m => (
              <div key={m.key} className="metric-card">
                <span className="metric-icon">{m.icon}</span>
                <span
                  className="metric-value"
                  style={{ color: m.color }}
                >
                  {metrics[m.key] ?? 0}
                </span>
                <span className="metric-label">{m.label}</span>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {/* ── Per-employee breakdown ──────────────────────────────────────── */}
      {Object.keys(byEmployee).length > 0 && (
        <section className="breakdown-section">
          <h3 className="section-title">By Employee</h3>
          <div className="breakdown-table-wrap">
            <table className="breakdown-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Total Goals</th>
                  <th>Approved</th>
                  <th>Check-in Done</th>
                  <th>Completion</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(byEmployee).map(([name, data]) => {
                  const pct = data.total > 0
                    ? Math.round((data.checkin_done / data.total) * 100)
                    : 0;
                  return (
                    <tr key={name}>
                      <td className="emp-name-cell">
                        <span className="emp-avatar">
                          {name.charAt(0).toUpperCase()}
                        </span>
                        {name}
                      </td>
                      <td>{data.total}</td>
                      <td>{data.approved}</td>
                      <td>{data.checkin_done}</td>
                      <td>
                        <div className="progress-bar-wrap">
                          <div
                            className="progress-bar-fill"
                            style={{
                              width: `${pct}%`,
                              background:
                                pct === 100
                                  ? '#22c55e'
                                  : pct >= 50
                                  ? '#f59e0b'
                                  : '#ef4444',
                            }}
                          />
                          <span className="progress-label">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Audit Trail ────────────────────────────────────────────────── */}
      <section className="audit-section">
        <div className="audit-header-row">
          <h3 className="section-title">Audit Trail</h3>
          <span className="audit-count">{auditLog.length} entries</span>
        </div>

        {loadingAudit ? (
          <div className="admin-loading">Loading audit log…</div>
        ) : auditLog.length === 0 ? (
          <div className="audit-empty">
            No audit entries yet. Changes to goals will appear here.
          </div>
        ) : (
          <>
            <div className="audit-table-wrap">
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Action</th>
                    <th>Field</th>
                    <th>Old Value</th>
                    <th>New Value</th>
                    <th>Changed By</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleAudit.map((entry, i) => (
                    <tr key={entry.id || i}>
                      <td className="audit-date">{formatDate(entry.changed_at)}</td>
                      <td>{actionBadge(entry.action)}</td>
                      <td className="audit-field">{entry.field || '—'}</td>
                      <td className="audit-old">
                        {entry.old_value !== null && entry.old_value !== undefined
                          ? String(entry.old_value)
                          : '—'}
                      </td>
                      <td className="audit-new">
                        {entry.new_value !== null && entry.new_value !== undefined
                          ? String(entry.new_value)
                          : '—'}
                      </td>
                      <td>{entry.changed_by_name || entry.changed_by || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="audit-pagination">
                <button
                  className="page-btn"
                  onClick={() => setAuditPage(p => Math.max(0, p - 1))}
                  disabled={auditPage === 0}
                >
                  ← Prev
                </button>
                <span className="page-info">
                  Page {auditPage + 1} of {totalPages}
                </span>
                <button
                  className="page-btn"
                  onClick={() => setAuditPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={auditPage === totalPages - 1}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
