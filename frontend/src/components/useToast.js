import { useState, useCallback } from 'react';

let _id = 0;

/**
 * useToast()
 * Returns { toasts, showToast, removeToast }
 *
 * showToast(message, type?)  — type: 'success' | 'error' | 'warn' | 'info'
 */
export default function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = ++_id;
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, showToast, removeToast };
}
