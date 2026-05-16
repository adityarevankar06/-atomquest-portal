import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const DEMO_USERS = [
    { email: 'alice@acme.com', role: 'Employee', name: 'Alice Johnson',  avatar: 'AJ' },
    { email: 'bob@acme.com',   role: 'Manager',  name: 'Bob Manager',    avatar: 'BM' },
    { email: 'charlie@acme.com', role: 'Admin',  name: 'Charlie Admin',  avatar: 'CA' }
];

const ROLE_COLORS = {
    Employee: { bg: '#e8f5e9', border: '#4caf50', badge: '#4caf50' },
    Manager:  { bg: '#e3f2fd', border: '#2196f3', badge: '#2196f3' },
    Admin:    { bg: '#fce4ec', border: '#e91e63', badge: '#e91e63' }
};

export default function Login() {
    const { user, login } = useAuth();
    const navigate        = useNavigate();

    // If already logged in, redirect immediately
    if (user) {
        navigate('/dashboard', { replace: true });
        return null;
    }

    const [selectedEmail, setSelectedEmail] = useState('alice@acme.com');
    const [error, setError]   = useState('');
    const [loading, setLoading] = useState(false);

    const selectedUser = DEMO_USERS.find(u => u.email === selectedEmail);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await authAPI.login(selectedUser.email, selectedUser.role);
            login(res.data.user, res.data.token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">

                {/* Header */}
                <div className="login-header">
                    <div className="login-logo">🎯</div>
                    <h1>AtomQuest Portal</h1>
                    <p className="subtitle">Goal Setting &amp; Tracking System</p>
                </div>

                <form onSubmit={handleLogin}>
                    {/* User selection cards */}
                    <div className="form-group">
                        <label>Select User</label>
                        <div className="user-cards">
                            {DEMO_USERS.map(u => {
                                const colors  = ROLE_COLORS[u.role];
                                const active  = selectedEmail === u.email;
                                return (
                                    <div
                                        key={u.email}
                                        className={`user-card ${active ? 'selected' : ''}`}
                                        style={active ? { borderColor: colors.border, backgroundColor: colors.bg } : {}}
                                        onClick={() => setSelectedEmail(u.email)}
                                    >
                                        <div className="user-avatar" style={{ backgroundColor: colors.badge }}>
                                            {u.avatar}
                                        </div>
                                        <div className="user-card-info">
                                            <div className="user-card-name">{u.name}</div>
                                            <div className="user-card-email">{u.email}</div>
                                        </div>
                                        <span className="role-badge" style={{ backgroundColor: colors.badge }}>
                                            {u.role}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {error && <div className="error-message">⚠️ {error}</div>}

                    <button type="submit" disabled={loading} className="btn-login">
                        {loading
                            ? <span className="btn-loading"><span className="spinner" /> Logging in...</span>
                            : `Login as ${selectedUser?.name}`}
                    </button>
                </form>

                <p className="no-password-note">No password required — demo mode</p>
            </div>
        </div>
    );
}
