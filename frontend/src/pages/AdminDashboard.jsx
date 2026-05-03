import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { adminAPI } from '../api';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [users, setUsers] = useState([]);
  const [refunds, setRefunds] = useState([]);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      navigate('/');
      return;
    }
    fetchData();
  }, [user]);

  async function fetchData() {
    try {
      const statsRes = await adminAPI.getStats();
      setStats(statsRes.data.stats);
      setRecentActivity(statsRes.data.recentActivity);

      const usersRes = await adminAPI.getUsers();
      setUsers(usersRes.data.users);

      const refundsRes = await adminAPI.getRefunds();
      setRefunds(refundsRes.data.refunds);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleSuspension(userId, currentStatus) {
    try {
      await adminAPI.toggleUserSuspension(userId, !currentStatus);
      fetchData();
    } catch (err) {
      alert('Failed to update user');
    }
  }

  async function updateRole(userId, role) {
    try {
      await adminAPI.updateUserRole(userId, role);
      fetchData();
    } catch (err) {
      alert('Failed to update role');
    }
  }

  async function resolveRefund(id, status) {
    const note = prompt(`Enter optional note for ${status} refund:`);
    if (note === null && status === 'REJECTED') return; // Cancelled
    try {
      await adminAPI.resolveRefund(id, { status, adminNote: note });
      fetchData();
    } catch (err) {
      alert('Failed to resolve refund');
    }
  }

  if (loading) return <div className="page-container"><p>Loading dashboard...</p></div>;

  return (
    <div className="page-container" style={{ maxWidth: '1200px' }}>
      <div className="hero" style={{ padding: '2rem 0', textAlign: 'left', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem' }}>Admin Dashboard</h1>
        <p>Platform overview and management</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
        <button className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('users')}>Users Management</button>
        <button className={`btn ${activeTab === 'refunds' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('refunds')}>Refund Requests {refunds.filter(r => r.status === 'PENDING').length > 0 && <span className="badge badge-error">{refunds.filter(r => r.status === 'PENDING').length}</span>}</button>
      </div>

      {activeTab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="card" style={{ padding: '1.5rem', textAlign: 'center', borderTop: '4px solid #3b82f6' }}>
              <h3 style={{ color: 'var(--text-secondary)' }}>Total Users</h3>
              <p style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.totalUsers}</p>
            </div>
            <div className="card" style={{ padding: '1.5rem', textAlign: 'center', borderTop: '4px solid #10b981' }}>
              <h3 style={{ color: 'var(--text-secondary)' }}>Active Events</h3>
              <p style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.totalEvents}</p>
            </div>
            <div className="card" style={{ padding: '1.5rem', textAlign: 'center', borderTop: '4px solid #f59e0b' }}>
              <h3 style={{ color: 'var(--text-secondary)' }}>Tickets Sold</h3>
              <p style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.ticketsSold}</p>
            </div>
            <div className="card" style={{ padding: '1.5rem', textAlign: 'center', borderTop: '4px solid #8b5cf6' }}>
              <h3 style={{ color: 'var(--text-secondary)' }}>Total Revenue</h3>
              <p style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>${stats.revenue.toFixed(2)}</p>
            </div>
          </div>

          <div className="card" style={{ padding: '2rem' }}>
            <h2>Recent Activity Feed</h2>
            <div style={{ marginTop: '1.5rem' }}>
              {recentActivity.map((activity, i) => (
                <div key={i} style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span className="badge" style={{ width: '80px', textAlign: 'center' }}>{activity.type}</span>
                  <div style={{ flex: 1 }}>{activity.title}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {new Date(activity.date).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="card" style={{ padding: '2rem', overflowX: 'auto' }}>
          <h2>User Management</h2>
          <table style={{ width: '100%', marginTop: '1.5rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '1rem' }}>Name</th>
                <th style={{ padding: '1rem' }}>Email</th>
                <th style={{ padding: '1rem' }}>Role</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem' }}>{u.name}</td>
                  <td style={{ padding: '1rem' }}>{u.email}</td>
                  <td style={{ padding: '1rem' }}>
                    <select 
                      value={u.role} 
                      onChange={(e) => updateRole(u.id, e.target.value)}
                      disabled={u.id === user.id}
                      style={{ padding: '0.25rem' }}
                    >
                      <option value="ATTENDEE">ATTENDEE</option>
                      <option value="ORGANIZER">ORGANIZER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span className={`badge ${u.is_suspended ? 'badge-error' : 'badge-success'}`}>
                      {u.is_suspended ? 'Suspended' : 'Active'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <button 
                      className={`btn btn-sm ${u.is_suspended ? 'btn-success' : 'btn-danger'}`}
                      onClick={() => toggleSuspension(u.id, u.is_suspended)}
                      disabled={u.id === user.id}
                    >
                      {u.is_suspended ? 'Unsuspend' : 'Suspend'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'refunds' && (
        <div className="card" style={{ padding: '2rem', overflowX: 'auto' }}>
          <h2>Refund Requests</h2>
          <table style={{ width: '100%', marginTop: '1.5rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '1rem' }}>Date</th>
                <th style={{ padding: '1rem' }}>User</th>
                <th style={{ padding: '1rem' }}>Event</th>
                <th style={{ padding: '1rem' }}>Amount</th>
                <th style={{ padding: '1rem' }}>Reason</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {refunds.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>{new Date(r.requested_at).toLocaleDateString()}</td>
                  <td style={{ padding: '1rem' }}>{r.user_name}<br/><small>{r.user_email}</small></td>
                  <td style={{ padding: '1rem' }}>{r.event_title}</td>
                  <td style={{ padding: '1rem' }}>${r.total_price.toFixed(2)}<br/><small>Qty: {r.quantity}</small></td>
                  <td style={{ padding: '1rem', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.reason}>
                    {r.reason}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span className={`badge ${r.status === 'APPROVED' ? 'badge-success' : r.status === 'REJECTED' ? 'badge-error' : 'badge-primary'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {r.status === 'PENDING' && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-sm btn-success" onClick={() => resolveRefund(r.id, 'APPROVED')}>Approve</button>
                        <button className="btn btn-sm btn-danger" onClick={() => resolveRefund(r.id, 'REJECTED')}>Reject</button>
                      </div>
                    )}
                    {r.admin_note && <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Note: {r.admin_note}</div>}
                  </td>
                </tr>
              ))}
              {refunds.length === 0 && (
                <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center' }}>No refund requests found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
