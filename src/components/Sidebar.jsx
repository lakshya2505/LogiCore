import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Truck, Route, Wrench,
  DollarSign, Users, BarChart3, Layers,
  LogOut, RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const NAV_ITEMS = [
  {
    section: 'Overview',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    section: 'Operations',
    items: [
      { to: '/vehicles', icon: Truck, label: 'Fleet', roles: ['Manager', 'Dispatcher'] },
      { to: '/trips', icon: Route, label: 'Trips', roles: ['Manager', 'Dispatcher'] },
      { to: '/drivers', icon: Users, label: 'Drivers', roles: ['Manager', 'Dispatcher'] },
    ],
  },
  {
    section: 'Management',
    items: [
      { to: '/maintenance', icon: Wrench, label: 'Maintenance', roles: ['Manager'] },
      { to: '/expenses', icon: DollarSign, label: 'Expenses', roles: ['Manager', 'Dispatcher'] },
      { to: '/analytics', icon: BarChart3, label: 'Analytics', roles: ['Manager'] },
    ],
  },
];

export default function Sidebar() {
  const { user, vehicles, logout } = useApp();

  const maintenanceCount = vehicles.filter(v => v.status === 'In Shop').length;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Layers size={16} color="#fff" />
        </div>
        <div>
          <div className="sidebar-logo-text">LogiCore</div>
          <div className="sidebar-logo-sub">Fleet Hub</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(section => {
          const visible = section.items.filter(
            item => !item.roles || item.roles.includes(user?.role)
          );
          if (!visible.length) return null;
          return (
            <div key={section.section}>
              <div className="nav-section-label">{section.section}</div>
              {visible.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                >
                  <item.icon size={15} className="nav-item-icon" />
                  {item.label}
                  {item.label === 'Maintenance' && maintenanceCount > 0 && (
                    <span className="nav-badge">{maintenanceCount}</span>
                  )}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-user">
        <div className="sidebar-avatar">{user?.avatar || user?.name?.slice(0, 2) || '?'}</div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{user?.name || 'User'}</div>
          <div className="sidebar-user-role">{user?.role || 'Guest'}</div>
        </div>
        <button
          className="btn btn-ghost btn-icon"
          onClick={handleLogout}
          title="Logout"
          style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}
        >
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );
}
