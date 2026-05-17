import React, { useEffect, useRef } from 'react';
import './Toast.css';

/**
 * Toast — slide-in notification
 * Props:
 *   toasts  : [{ id, type, message }]   type = 'success' | 'error' | 'info' | 'warn'
 *   onRemove: (id) => void
 */
export default function Toast({ toasts, onRemove }) {
  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }) {
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => onRemove(toast.id), 4000);
    return () => clearTimeout(timerRef.current);
  }, [toast.id, onRemove]);

  const icons = { success: '✓', error: '✕', warn: '⚠', info: 'ℹ' };

  return (
    <div className={`toast toast--${toast.type}`} role="alert">
      <span className="toast-icon">{icons[toast.type] || 'ℹ'}</span>
      <span className="toast-message">{toast.message}</span>
      <button className="toast-close" onClick={() => onRemove(toast.id)}>×</button>
    </div>
  );
}
