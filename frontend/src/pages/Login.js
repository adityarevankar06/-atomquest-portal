import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { login } from '../services/api';
import './Login.css';

const USERS = [
  { label: 'Alice Johnson', email: 'alice@acme.com', role: 'Employee', avatarClass: 'av-employee', badgeClass: 'badge-employee' },
  { label: 'Bob Manager',   email: 'bob@acme.com',   role: 'Manager',  avatarClass: 'av-manager',  badgeClass: 'badge-manager'  },
  { label: 'Charlie Admin', email: 'charlie@acme.com', role: 'Admin',  avatarClass: 'av-admin',    badgeClass: 'badge-admin'    },
];

const Login = () => {
  const [selectedIndex, setSelectedIndex] = useState('');
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');

  const { login: setAuth } = useContext(AuthContext);
  const navigate           = useNavigate();
  const location           = useLocation();

  const params   = new URLSearchParams(location.search);
  const reason   = params.get('reason');
  const returnTo = params.get('returnTo') || '/dashboard';

  const handleLogin = async () => {
    if (selectedIndex === '') { setError('Please select a user.'); return; }
    setLoading(true); setError('');
    const { email, role } = USERS[selectedIndex];
    try {
      const res = await login(email, role);
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setAuth(user, token);
      navigate(decodeURIComponent(returnTo), { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      {/* ── Left brand panel ── */}
      <div className="login-brand">
        <div className="login-brand-logo">
          <div className="login-brand-icon">⚡</div>
          <div className="login-brand-name">AtomQuest</div>
        </div>
        <h1>Track goals.<br /><span>Drive results.</span></h1>
        <p>A unified platform for goal setting, approval workflows, and performance check-ins across your organisation.</p>
        <div className="login-features">
          <div className="login-feature"><div className="login-feature-dot" />Quarterly goal setting with weightage tracking</div>
          <div className="login-feature"><div className="login-feature-dot" />Manager approval and rejection workflows</div>
          <div className="login-feature"><div className="login-feature-dot" />Real-time progress check-ins and scoring</div>
          <div className="login-feature"><div className="login-feature-dot" />Admin dashboard with CSV export</div>
        </div>
      </div>

      {/* ── Right login card ── */}
      <div className="login-card">
        <div className="login-card-title">Sign in to continue</div>
        <div className="login-card-sub">Select your demo account below</div>

        {reason === 'expired' && (
          <div className="login-banner login-banner--warn">
            Your session has expired. Please log in again.
          </div>
        )}

        {error && (
          <div className="login-banner login-banner--error">{error}</div>
        )}

        <div className="user-cards">
          {USERS.map((u, i) => (
            <div
              key={u.email}
              className={`user-card ${selectedIndex === i ? 'selected' : ''}`}
              onClick={() => setSelectedIndex(i)}
            >
              <div className={`user-avatar ${u.avatarClass}`}>
                {u.label.charAt(0)}
              </div>
              <div className="user-card-info">
                <div className="user-card-name">{u.label}</div>
                <div className="user-card-email">{u.email}</div>
              </div>
              <span className={`role-badge ${u.badgeClass}`}>{u.role}</span>
            </div>
          ))}
        </div>

        <button
          className="login-btn"
          onClick={handleLogin}
          disabled={loading || selectedIndex === ''}
        >
          {loading ? 'Signing in…' : 'Sign In →'}
        </button>

        <p className="login-note">No password required for demo accounts</p>
      </div>
    </div>
  );
};

export default Login;
