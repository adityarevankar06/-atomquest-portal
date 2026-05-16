import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import GoalCreation    from './GoalCreation';
import ManagerDashboard from './ManagerDashboard';
import CheckIn         from './CheckIn';
import ManagerCheckIn  from './ManagerCheckIn';
import AdminDashboard  from './AdminDashboard';
import './Dashboard.css';

const TABS = {
  employee: [
    { key: 'goals',   label: '📋 My Goals'  },
    { key: 'checkin', label: '✏️ Check-in'   },
  ],
  manager: [
    { key: 'team',        label: '👥 Team Goals'       },
    { key: 'teamcheckin', label: '📊 Check-in Review'  },
  ],
  admin: [
    { key: 'goals',       label: '📋 All Goals'         },
    { key: 'team',        label: '👥 Team Goals'         },
    { key: 'checkin',     label: '✏️ Check-in'           },
    { key: 'teamcheckin', label: '📊 Check-in Review'   },
    { key: 'admin',       label: '🛡 Admin Dashboard'   },
  ],
};

function getDefaultTab(role) {
  if (role === 'manager') return 'team';
  if (role === 'admin')   return 'admin';
  return 'goals';
}

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const role = user?.role || 'employee';
  const tabs = TABS[role] || TABS.employee;
  const [activeTab, setActiveTab] = useState(getDefaultTab(role));

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function renderTab() {
    switch (activeTab) {
      case 'goals':       return <GoalCreation />;
      case 'team':        return <ManagerDashboard />;
      case 'checkin':     return <CheckIn />;
      case 'teamcheckin': return <ManagerCheckIn />;
      case 'admin':       return <AdminDashboard />;
      default:            return <div className="coming-soon">Coming soon…</div>;
    }
  }

  return (
    <div className="dashboard-wrapper">
      {/* ── Top nav ── */}
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <span className="nav-logo">⚡</span>
          <span className="nav-title">AtomQuest</span>
        </div>

        <div className="nav-tabs">
          {tabs.map(tab => (
            <button
              key={tab.key}
              className={`nav-tab ${activeTab === tab.key ? 'nav-tab-active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="nav-user">
          <div className="user-chip">
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="user-info">
              <span className="user-name">{user?.name}</span>
              <span className={`user-role-badge role-${role}`}>{role}</span>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      {/* ── Content ── */}
      <main className="dashboard-content">
        {renderTab()}
      </main>
    </div>
  );
}
