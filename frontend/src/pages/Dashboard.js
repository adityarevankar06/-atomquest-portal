import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import GoalCreation    from './GoalCreation';
import ManagerDashboard from './ManagerDashboard';
import './Dashboard.css';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const navigate         = useNavigate();
    const [activeTab, setActiveTab] = useState('home');

    useEffect(() => {
        if (!user) navigate('/login');
    }, [user, navigate]);

    // Set sensible default tab per role
    useEffect(() => {
        if (!user) return;
        if (user.role === 'Employee') setActiveTab('goals');
        if (user.role === 'Manager')  setActiveTab('team-goals');
        if (user.role === 'Admin')    setActiveTab('home');
    }, [user]);

    const handleLogout = () => { logout(); navigate('/login'); };

    if (!user) return <div className="loading">Loading…</div>;

    return (
        <div className="dashboard">

            {/* ── Navbar ──────────────────────────────────────── */}
            <nav className="navbar">
                <div className="navbar-left">
                    <span className="navbar-logo">🎯</span>
                    <h1>AtomQuest Portal</h1>
                </div>
                <div className="navbar-right">
                    <div className="user-chip">
                        <div className="user-chip-avatar">{user.name.charAt(0)}</div>
                        <div className="user-chip-info">
                            <span className="user-chip-name">{user.name}</span>
                            <span className="user-chip-role">{user.role}</span>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="btn-logout">Logout</button>
                </div>
            </nav>

            <div className="dashboard-container">

                {/* ── Sidebar ─────────────────────────────────── */}
                <aside className="sidebar">
                    <nav className="nav-menu">

                        {/* Employee nav */}
                        {user.role === 'Employee' && (<>
                            <NavItem id="goals"   active={activeTab} label="🎯 My Goals"         onClick={setActiveTab} />
                            <NavItem id="checkin" active={activeTab} label="✅ Quarterly Check-in" onClick={setActiveTab} />
                        </>)}

                        {/* Manager nav */}
                        {user.role === 'Manager' && (<>
                            <NavItem id="team-goals"      active={activeTab} label="👥 Team Goals"      onClick={setActiveTab} />
                            <NavItem id="manager-checkin" active={activeTab} label="📝 Conduct Check-in" onClick={setActiveTab} />
                        </>)}

                        {/* Admin nav */}
                        {user.role === 'Admin' && (<>
                            <NavItem id="home"            active={activeTab} label="📊 Dashboard"        onClick={setActiveTab} />
                            <NavItem id="team-goals"      active={activeTab} label="👥 All Goals"         onClick={setActiveTab} />
                            <NavItem id="admin-dashboard" active={activeTab} label="⚙️ Admin Dashboard"  onClick={setActiveTab} />
                            <NavItem id="reports"         active={activeTab} label="📈 Reports"           onClick={setActiveTab} />
                        </>)}
                    </nav>
                </aside>

                {/* ── Main content ─────────────────────────────── */}
                <main className="main-content">

                    {/* ── My Goals (Employee) ───────────────────── */}
                    {activeTab === 'goals' && (
                        <div className="content-section">
                            <GoalCreation />
                        </div>
                    )}

                    {/* ── Team Goals (Manager / Admin) ──────────── */}
                    {activeTab === 'team-goals' && (
                        <div className="content-section">
                            <ManagerDashboard />
                        </div>
                    )}

                    {/* ── Home (Admin) ──────────────────────────── */}
                    {activeTab === 'home' && (
                        <div className="content-section">
                            <h2>Welcome, {user.name}!</h2>
                            <p>You are logged in as <strong>{user.role}</strong>.</p>
                            <div className="welcome-message">
                                <p>📌 Use the sidebar to navigate. Monitor overall completion status and audit logs.</p>
                            </div>
                        </div>
                    )}

                    {/* ── Placeholders for Phase 2 features ────── */}
                    {activeTab === 'checkin' && (
                        <div className="content-section coming-soon">
                            <div className="cs-icon">📅</div>
                            <h2>Quarterly Check-in</h2>
                            <p>This feature is coming in Phase 2.</p>
                        </div>
                    )}

                    {activeTab === 'manager-checkin' && (
                        <div className="content-section coming-soon">
                            <div className="cs-icon">📝</div>
                            <h2>Conduct Check-in</h2>
                            <p>This feature is coming in Phase 2.</p>
                        </div>
                    )}

                    {activeTab === 'admin-dashboard' && (
                        <div className="content-section coming-soon">
                            <div className="cs-icon">⚙️</div>
                            <h2>Admin Dashboard</h2>
                            <p>This feature is coming in Phase 2.</p>
                        </div>
                    )}

                    {activeTab === 'reports' && (
                        <div className="content-section coming-soon">
                            <div className="cs-icon">📈</div>
                            <h2>Reports</h2>
                            <p>This feature is coming in Phase 2.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

// Small helper to keep the sidebar DRY
function NavItem({ id, active, label, onClick }) {
    return (
        <button
            className={`nav-item ${active === id ? 'active' : ''}`}
            onClick={() => onClick(id)}>
            {label}
        </button>
    );
}
