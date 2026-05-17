import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import GoalCreation     from './GoalCreation';
import ManagerDashboard from './ManagerDashboard';
import CheckIn          from './CheckIn';
import ManagerCheckIn   from './ManagerCheckIn';
import AdminDashboard   from './AdminDashboard';
import './Dashboard.css';
import Home           from './Home';

const TABS = {
  employee: [
    { key: 'home',  label: 'Home',            icon: '🏠' },
    { key: 'goals',   label: 'My Goals',        icon: '📋' },
    { key: 'checkin', label: 'Check-in',         icon: '✏️' },
  ],
  manager: [
    { key: 'home',        label: 'Home',            icon: '🏠' },
    { key: 'team',        label: 'Team Goals',      icon: '👥' },
    { key: 'teamcheckin', label: 'Check-in Review',  icon: '📊' },
  ],
  admin: [
    { key: 'home',        label: 'Home',            icon: '🏠' },
    { key: 'goals',       label: 'All Goals',        icon: '📋' },
    { key: 'team',        label: 'Team Goals',        icon: '👥' },
    { key: 'checkin',     label: 'Check-in',          icon: '✏️' },
    { key: 'teamcheckin', label: 'Check-in Review',   icon: '📊' },
    { key: 'admin',       label: 'Admin Dashboard',   icon: '🛡️' },
  ],
};

function getDefaultTab(role) {
  return 'home';
}

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const role = (user?.role || 'employee').toLowerCase();
  const tabs = TABS[role] || TABS.employee;
  const [activeTab, setActiveTab] = useState(getDefaultTab(role));

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function renderTab() {
    switch (activeTab) {
      case 'home':        return <Home user={user} onNavigate={setActiveTab} />;
      case 'goals':       return <GoalCreation />;
      case 'team':        return <ManagerDashboard />;
      case 'checkin':     return <CheckIn />;
      case 'teamcheckin': return <ManagerCheckIn />;
      case 'admin':       return <AdminDashboard />;
      default:            return <div className="coming-soon">Coming soon…</div>;
    }
  }

  const initial = user?.name?.charAt(0).toUpperCase() || '?';

  return (
    <div className="dashboard-wrapper">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">⚡</div>
          <div>
            <div className="sidebar-brand-name">AtomQuest</div>
            <div className="sidebar-brand-sub">Goal Tracking</div>
          </div>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">{initial}</div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <span className={`user-role-badge role-${role}`}>{role}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {tabs.map(tab => (
            <button
              key={tab.key}
              className={`nav-tab ${activeTab === tab.key ? 'nav-tab-active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span className="nav-tab-icon">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="btn-logout" onClick={handleLogout}>
            ⬅ Logout
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="dashboard-content">
        {renderTab()}
      </main>
    </div>
  );
}
