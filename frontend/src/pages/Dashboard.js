import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('home');

    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="dashboard">
            <nav className="navbar">
                <div className="navbar-left">
                    <h1>🎯 AtomQuest Portal</h1>
                </div>
                <div className="navbar-right">
                    <span className="user-info">
                        {user.name} ({user.role})
                    </span>
                    <button onClick={handleLogout} className="btn-logout">
                        Logout
                    </button>
                </div>
            </nav>

            <div className="dashboard-container">
                <aside className="sidebar">
                    <nav className="nav-menu">
                        <button
                            className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
                            onClick={() => setActiveTab('home')}
                        >
                            📊 Dashboard
                        </button>

                        {user.role === 'Employee' && (
                            <>
                                <button
                                    className={`nav-item ${activeTab === 'goals' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('goals')}
                                >
                                    🎯 My Goals
                                </button>
                                <button
                                    className={`nav-item ${activeTab === 'checkin' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('checkin')}
                                >
                                    ✅ Check-in
                                </button>
                            </>
                        )}

                        {(user.role === 'Manager' || user.role === 'Admin') && (
                            <>
                                <button
                                    className={`nav-item ${activeTab === 'team-goals' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('team-goals')}
                                >
                                    👥 Team Goals
                                </button>
                                <button
                                    className={`nav-item ${activeTab === 'manager-checkin' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('manager-checkin')}
                                >
                                    📝 Conduct Check-in
                                </button>
                            </>
                        )}

                        {user.role === 'Admin' && (
                            <>
                                <button
                                    className={`nav-item ${activeTab === 'admin-dashboard' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('admin-dashboard')}
                                >
                                    ⚙️ Admin Dashboard
                                </button>
                                <button
                                    className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('reports')}
                                >
                                    📈 Reports
                                </button>
                            </>
                        )}
                    </nav>
                </aside>

                <main className="main-content">
                    {activeTab === 'home' && (
                        <div className="content-section">
                            <h2>Welcome, {user.name}!</h2>
                            <p>You are logged in as <strong>{user.role}</strong></p>
                            <div className="welcome-message">
                                {user.role === 'Employee' && (
                                    <p>📌 Start by creating your quarterly goals, then track your achievements.</p>
                                )}
                                {user.role === 'Manager' && (
                                    <p>📌 Approve team goals and conduct quarterly check-ins.</p>
                                )}
                                {user.role === 'Admin' && (
                                    <p>📌 Monitor overall completion status and audit logs.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'goals' && (
                        <div className="content-section">
                            <h2>My Goals</h2>
                            <p>Goal creation feature coming soon...</p>
                        </div>
                    )}

                    {activeTab === 'checkin' && (
                        <div className="content-section">
                            <h2>Quarterly Check-in</h2>
                            <p>Check-in feature coming soon...</p>
                        </div>
                    )}

                    {activeTab === 'team-goals' && (
                        <div className="content-section">
                            <h2>Team Goals</h2>
                            <p>Team goals management coming soon...</p>
                        </div>
                    )}

                    {activeTab === 'manager-checkin' && (
                        <div className="content-section">
                            <h2>Conduct Check-in</h2>
                            <p>Manager check-in feature coming soon...</p>
                        </div>
                    )}

                    {activeTab === 'admin-dashboard' && (
                        <div className="content-section">
                            <h2>Admin Dashboard</h2>
                            <p>Admin dashboard coming soon...</p>
                        </div>
                    )}

                    {activeTab === 'reports' && (
                        <div className="content-section">
                            <h2>Reports</h2>
                            <p>Reports feature coming soon...</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
