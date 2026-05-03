import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { notificationsAPI } from '../api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [user]);

  async function fetchNotifications() {
    try {
      const res = await notificationsAPI.getAll();
      setNotifications(res.data.notifications);
    } catch (err) {
      console.error('Failed to fetch notifications');
    }
  }

  async function markAsRead(id) {
    try {
      await notificationsAPI.markRead(id);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/" style={{ color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🎟️</span> Eventio
        </Link>
      </div>

      <div className="nav-links">
        <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Events</Link>
        <Link to="/categories" className={`nav-link ${location.pathname === '/categories' ? 'active' : ''}`}>Categories</Link>
        <Link to="/calendar" className={`nav-link ${location.pathname === '/calendar' ? 'active' : ''}`}>Calendar</Link>
        
        {user ? (
          <>
            <div className="dropdown">
              <button className="nav-link dropdown-toggle">Tickets</button>
              <div className="dropdown-menu">
                <Link to="/my-tickets" className="dropdown-item">My Tickets</Link>
                <Link to="/payment-history" className="dropdown-item">Payment History</Link>
              </div>
            </div>

            {(user.role === 'ORGANIZER' || user.role === 'ADMIN') && (
              <div className="dropdown">
                <button className="nav-link dropdown-toggle">Manage</button>
                <div className="dropdown-menu">
                  <Link to="/create-event" className="dropdown-item">Create Event</Link>
                  <Link to="/reports" className="dropdown-item">Event Reports</Link>
                  {user.role === 'ADMIN' && (
                    <Link to="/admin" className="dropdown-item">Admin Dashboard</Link>
                  )}
                </div>
              </div>
            )}

            <div style={{ position: 'relative' }}>
              <button 
                className="nav-link" 
                onClick={() => setShowNotifications(!showNotifications)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}
              >
                🔔
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
              </button>
              
              {showNotifications && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <h4>Notifications</h4>
                    {unreadCount > 0 && (
                      <button 
                        className="btn btn-sm btn-secondary"
                        onClick={async () => {
                          await notificationsAPI.markAllRead();
                          fetchNotifications();
                        }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="notification-list">
                    {notifications.length === 0 ? (
                      <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No notifications
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          className={`notification-item ${n.is_read ? 'read' : ''}`}
                          onClick={() => !n.is_read && markAsRead(n.id)}
                        >
                          <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.25rem' }}>{n.title}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{n.message}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                            {new Date(n.created_at).toLocaleString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="dropdown">
              <button className="nav-link dropdown-toggle" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className="avatar" style={{ width: '30px', height: '30px', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontWeight: 'bold' }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                {user.name}
              </button>
              <div className="dropdown-menu">
                <Link to="/profile" className="dropdown-item">Profile Settings</Link>
                <div className="dropdown-divider"></div>
                <button onClick={handleLogout} className="dropdown-item text-danger" style={{ textAlign: 'left', width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Logout
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/login" className="btn btn-secondary">Login</Link>
            <Link to="/register" className="btn btn-primary">Sign Up</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
