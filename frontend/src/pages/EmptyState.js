import React from 'react';
import './EmptyState.css';

/**
 * EmptyState
 * Renders a friendly placeholder instead of a blank table or silent nothing.
 *
 * Props:
 *   icon     — emoji or small image string  (default: '📋')
 *   title    — bold heading                 (required)
 *   message  — supporting sentence          (optional)
 *   action   — { label, onClick }           (optional) — renders a CTA button
 */
const EmptyState = ({ icon = '📋', title, message, action }) => (
  <div className="empty-state" role="status" aria-live="polite">
    <span className="empty-state__icon" aria-hidden="true">{icon}</span>
    <h3 className="empty-state__title">{title}</h3>
    {message && <p className="empty-state__message">{message}</p>}
    {action && (
      <button
        className="empty-state__btn"
        onClick={action.onClick}
        type="button"
      >
        {action.label}
      </button>
    )}
  </div>
);

export default EmptyState;
