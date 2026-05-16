import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Login() {
    const [email, setEmail] = useState('alice@acme.com');
    const [role, setRole] = useState('Employee');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const demoUsers = [
        { email: 'alice@acme.com', role: 'Employee', name: 'Alice Johnson' },
        { email: 'bob@acme.com', role: 'Manager', name: 'Bob Manager' },
        { email: 'charlie@acme.com', role: 'Admin', name: 'Charlie Admin' }
    ];

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await authAPI.login(email, role);
            const { token, user } = response.data;
            login(user, token);
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
                <h1>🎯 AtomQuest Portal</h1>
                <p className="subtitle">Goal Setting & Tracking System</p>

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label htmlFor="email">Select User</label>
                        <select
                            id="email"
                            value={email}
                            onChange={(e) => {
                                const selected = demoUsers.find(u => u.email === e.target.value);
                                setEmail(e.target.value);
                                setRole(selected.role);
                            }}
                            className="input"
                        >
                            {demoUsers.map(user => (
                                <option key={user.email} value={user.email}>
                                    {user.name} ({user.role})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="role">Role</label>
                        <input
                            id="role"
                            type="text"
                            value={role}
                            disabled
                            className="input"
                            style={{ backgroundColor: '#f0f0f0' }}
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" disabled={loading} className="btn-primary">
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div className="demo-info">
                    <h3>Demo Credentials</h3>
                    <ul>
                        <li><strong>Employee:</strong> alice@acme.com</li>
                        <li><strong>Manager:</strong> bob@acme.com</li>
                        <li><strong>Admin:</strong> charlie@acme.com</li>
                    </ul>
                    <p>No password required for demo</p>
                </div>
            </div>
        </div>
    );
}
