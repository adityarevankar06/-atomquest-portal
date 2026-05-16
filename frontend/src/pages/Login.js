import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { login } from '../services/api';
import './Login.css';

const USERS = [
  { label: 'Alice Johnson — Employee', email: 'alice@acme.com', role: 'Employee' },
  { label: 'Bob Manager — Manager',   email: 'bob@acme.com',   role: 'Manager'  },
  { label: 'Charlie Admin — Admin',   email: 'charlie@acme.com', role: 'Admin'  },
];

const Login = () => {
  const [selectedIndex, setSelectedIndex] = useState('');
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');

  const { login: setAuth } = useContext(AuthContext);
  const navigate     = useNavigate();
  const location     = useLocation();

  // ── FIX 2 (frontend): Show session-expired banner when redirected back ──────
  const params  = new URLSearchParams(location.search);
  const reason  = params.get('reason');
  const returnTo = params.get('returnTo') || '/dashboard';

  const handleLogin = async () => {
    if (selectedIndex === '') {
      setError('Please select a user.');
      return;
    }
    setLoading(true);
    setError('');

    const { email, role } = USERS[selectedIndex];

    try {
      const res = await login(email, role);
      const { token, user } = res.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setAuth(user, token);

      // Return to the page the user was on before the token expired
      navigate(decodeURIComponent(returnTo), { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h1 className="login-title">⚛ AtomQuest Portal</h1>
        <p className="login-subtitle">Goal Setting & Tracking</p>

        {/* ── FIX 2: session-expired notice ── */}
        {reason === 'expired' && (
          <div className="login-banner login-banner--warn" role="alert">
            Your session has expired. Please log in again.
          </div>
        )}

        {error && (
          <div className="login-banner login-banner--error" role="alert">
            {error}
          </div>
        )}

        <label className="login-label" htmlFor="user-select">
          Select user
        </label>
        <select
          id="user-select"
          className="login-select"
          value={selectedIndex}
          onChange={(e) => setSelectedIndex(e.target.value)}
        >
          <option value="">— Choose a demo account —</option>
          {USERS.map((u, i) => (
            <option key={u.email} value={i}>
              {u.label}
            </option>
          ))}
        </select>

        <button
          className="login-btn"
          onClick={handleLogin}
          disabled={loading}
          type="button"
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </div>
    </div>
  );
};

export default Login;
