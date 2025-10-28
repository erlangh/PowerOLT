import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import './Layout.css';

export function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const [showProfile, setShowProfile] = useState(false);
  const [oltOpen, setOltOpen] = useState(true);

  return (
    <div className="layout light">
      <aside className="sidebar light">
        <div className="brand"><span className="logo">◎</span> PowerOLT</div>
        <nav>
          <Link className={pathname === '/dashboard' ? 'active' : ''} to="/dashboard">
            <span className="nav-icon" aria-hidden>📊</span>
            Dashboard
          </Link>

          <div className="nav-group">
            <button className="nav-group-toggle" onClick={()=>setOltOpen(!oltOpen)} aria-expanded={oltOpen}>
              <span className="nav-icon" aria-hidden>🗄️</span>
              OLT
              <span className={`nav-chevron ${oltOpen ? 'open' : ''}`}>▾</span>
            </button>
            {oltOpen && (
              <div className="subnav">
                <Link className={pathname === '/olts' ? 'active' : ''} to="/olts">
                  <span className="nav-icon" aria-hidden>📡</span>
                  Daftar OLT
                </Link>
                <Link className={pathname === '/ip-olt' ? 'active' : ''} to="/ip-olt">
                  <span className="nav-icon" aria-hidden>🌐</span>
                  IP OLT
                </Link>
                <Link className={pathname === '/vlan' ? 'active' : ''} to="/vlan">
                  <span className="nav-icon" aria-hidden>🧩</span>
                  VLAN
                </Link>
                <Link className={pathname === '/onu-type' ? 'active' : ''} to="/onu-type">
                  <span className="nav-icon" aria-hidden>🔖</span>
                  Onu Type
                </Link>
                <Link className={pathname === '/speed-profiles' ? 'active' : ''} to="/speed-profiles">
                  <span className="nav-icon" aria-hidden>⚡</span>
                  Speed Profiles
                </Link>
              </div>
            )}
          </div>

          <Link className={pathname === '/all-onus' ? 'active' : ''} to="/all-onus">
            <span className="nav-icon" aria-hidden>📋</span>
            All ONUs
          </Link>
          <Link className={pathname === '/add-onu' ? 'active' : ''} to="/add-onu">
            <span className="nav-icon" aria-hidden>➕</span>
            Register ONU
          </Link>
          <Link className={pathname === '/odp-map' ? 'active' : ''} to="/odp-map">
            <span className="nav-icon" aria-hidden>🗺️</span>
            Network Mapping
          </Link>
          <Link className={pathname === '/odp-management' ? 'active' : ''} to="/odp-management">
            <span className="nav-icon" aria-hidden>🧩</span>
            ODP Management
          </Link>
          <Link className={pathname === '/cable-routes' ? 'active' : ''} to="/cable-routes">
            <span className="nav-icon" aria-hidden>🧵</span>
            Cable Routes
          </Link>
          {/* Settings menu removed as requested */}
        </nav>
      </aside>
      <div className="main">
        <header className="header">
          <div className="breadcrumb">Home / Monitoring</div>
          <div className="header-actions">
            <div className="icon-badge"><button className="icon-btn" title="Search">🔍</button></div>
            <div className="icon-badge"><button className="icon-btn" title="Notifications">🔔</button><span className="badge-count">10</span></div>
            <div className="icon-badge"><button className="icon-btn" title="Alerts">📣</button><span className="badge-dot">1</span></div>
            <div className="avatar" onClick={()=>setShowProfile(s=>!s)} title="Profile">👤
              {showProfile && (
                <div className="dropdown">
                  <div className="dropdown-item">My Profile</div>
                  <div className="dropdown-item">Settings</div>
                  <div className="dropdown-item">Logout</div>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="content">
          {children}
        </div>
      </div>
    </div>
  );
}