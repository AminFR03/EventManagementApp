import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { notificationsAPI } from '../api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function fetchNotifications() {
    try {
      const res = await notificationsAPI.getAll();
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (err) { /* silently fail */ }
  }

  async function markAsRead(id) {
    await notificationsAPI.markRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }

  async function markAllRead() {
    await notificationsAPI.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    setUnreadCount(0);
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function isActive(path) {
    return location.pathname === path ? 'nav-link active' : 'nav-link';
  }

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr + 'Z').getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">✦ Eventio</Link>
      <div className="nav-links">
        <Link to="/" className={isActive('/')}>Events</Link>
        {user && (
          <>
            <Link to="/create-event" className={isActive('/create-event')}>Create</Link>
            <Link to="/my-tickets" className={isActive('/my-tickets')}>Tickets</Link>
            <Link to="/profile" className={isActive('/profile')}>Profile</Link>

            {/* Notifications */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button className="nav-notification-btn" onClick={() => setShowNotifs(!showNotifs)}>
                🔔
                {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </button>

              {showNotifs && (
                <div className="notification-dropdown">
                  <div className="notification-dropdown-header">
                    <span className="notification-dropdown-title">Notifications</span>
                    {unreadCount > 0 && (
                      <button className="btn btn-sm btn-secondary" onClick={markAllRead}>Mark all read</button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="notification-empty">No notifications yet</div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        className={`notification-item ${n.is_read ? '' : 'unread'}`}
                        onClick={() => !n.is_read && markAsRead(n.id)}
                      >
                        <div className="notification-item-title">{n.title}</div>
                        <div className="notification-item-msg">{n.message}</div>
                        <div className="notification-item-time">{timeAgo(n.created_at)}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="nav-user" onClick={() => navigate('/profile')}>
              <div className="nav-avatar">{user.name?.charAt(0).toUpperCase()}</div>
              <span className="nav-user-name">{user.name}</span>
            </div>
            <button className="btn-logout" onClick={handleLogout}>Logout</button>
          </>
        )}
        {!user && (
          <>
            <Link to="/login" className={isActive('/login')}>Login</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
          </>
        )}
      </div>
    </nav>
  );
}
