import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUnreadCount } from '../services/api';

export default function Layout() {
  const { user, logout, isAdmin, isManager } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (isManager()) {
      getUnreadCount().then(r => setUnread(r.data.count)).catch(() => {});
      const t = setInterval(() => {
        getUnreadCount().then(r => setUnread(r.data.count)).catch(() => {});
      }, 30000);
      return () => clearInterval(t);
    }
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: '▦', always: true },
    { to: '/products', label: 'Products', icon: '☰', always: true },
    { to: '/inventory', label: 'Inventory', icon: '⊞', always: true },
    { to: '/orders', label: 'Orders', icon: '◫', manager: true },
    { to: '/suppliers', label: 'Suppliers', icon: '⊙', manager: true },
    { to: '/ai', label: 'AI Assistant', icon: '✦', manager: true, badge: unread },
    { to: '/reports', label: 'Reports', icon: '◫', manager: true },
    { to: '/users', label: 'Users', icon: '◉', admin: true },
  ];

  const roleLabel = { ROLE_ADMIN: 'Admin', ROLE_MANAGER: 'Manager', ROLE_EMPLOYEE: 'Employee' };
  const roleColor = { ROLE_ADMIN: '#ef4444', ROLE_MANAGER: '#f59e0b', ROLE_EMPLOYEE: '#3b82f6' };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, background: '#0f172a', color: '#e2e8f0',
        display: 'flex', flexDirection: 'column', flexShrink: 0
      }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #1e293b' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
            ⚡ StockIQ
          </div>
          <div style={{ fontSize: 11, color: '#64748b' }}>Inventory Management</div>
        </div>

        <nav style={{ flex: 1, padding: '12px 8px' }}>
          {navItems.map(item => {
            if (item.admin && !isAdmin()) return null;
            if (item.manager && !isManager()) return null;
            return (
              <NavLink key={item.to} to={item.to} end={item.to === '/'}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 8, marginBottom: 2,
                  textDecoration: 'none', fontSize: 13, fontWeight: 500,
                  background: isActive ? '#1e40af' : 'transparent',
                  color: isActive ? '#fff' : '#94a3b8',
                  transition: 'all 0.15s'
                })}>
                <span style={{ fontSize: 15 }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge > 0 && (
                  <span style={{
                    background: '#ef4444', color: '#fff', borderRadius: 10,
                    fontSize: 10, padding: '1px 6px', fontWeight: 700
                  }}>{item.badge}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div style={{ padding: 12, borderTop: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: roleColor[user?.role] || '#3b82f6',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#fff'
            }}>
              {user?.fullName?.charAt(0) || user?.username?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>
                {user?.fullName || user?.username}
              </div>
              <div style={{
                fontSize: 10, color: roleColor[user?.role],
                fontWeight: 600, textTransform: 'uppercase'
              }}>
                {roleLabel[user?.role]}
              </div>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            width: '100%', padding: '7px 0', background: '#1e293b',
            color: '#94a3b8', border: 'none', borderRadius: 6,
            cursor: 'pointer', fontSize: 12
          }}>Sign out</button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, background: '#f8fafc', overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
