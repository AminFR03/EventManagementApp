import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { authAPI } from '../api';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  
  const [emailPrefs, setEmailPrefs] = useState({
    purchase: true,
    reminder: true,
    updates: true,
    newsletter: true
  });
  const [prefsMsg, setPrefsMsg] = useState({ type: '', text: '' });
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    if (user?.email_prefs) {
      try {
        setEmailPrefs(JSON.parse(user.email_prefs));
      } catch (e) {}
    }
  }, [user]);

  async function handleUpdateProfile(e) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg({ type: '', text: '' });
    try {
      const res = await authAPI.updateProfile({ name });
      updateUser(res.data.user);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.error || 'Update failed' });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    setSavingPassword(true);
    setPasswordMsg({ type: '', text: '' });
    try {
      await authAPI.updateProfile({ currentPassword, newPassword });
      setPasswordMsg({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.response?.data?.error || 'Password change failed' });
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleSavePrefs(e) {
    e.preventDefault();
    setSavingPrefs(true);
    setPrefsMsg({ type: '', text: '' });
    try {
      const res = await authAPI.updateProfile({ emailPrefs: JSON.stringify(emailPrefs) });
      updateUser(res.data.user);
      setPrefsMsg({ type: 'success', text: 'Email preferences saved!' });
    } catch (err) {
      setPrefsMsg({ type: 'error', text: 'Failed to save preferences' });
    } finally {
      setSavingPrefs(false);
    }
  }

  function togglePref(key) {
    setEmailPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  }

  if (!user) return null;

  return (
    <div className="page-container" style={{ maxWidth: '640px' }}>
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar-large">
          {user.name?.charAt(0).toUpperCase()}
        </div>
        <div className="profile-info">
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Member since {new Date(user.created_at + 'Z').toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Update Profile Section */}
      <div className="profile-section">
        <h3 className="profile-section-title">👤 Personal Information</h3>
        <div className="card" style={{ padding: '1.5rem' }}>
          {profileMsg.text && (
            <div className={`alert alert-${profileMsg.type}`}>
              {profileMsg.type === 'success' ? '✓' : '✕'} {profileMsg.text}
            </div>
          )}
          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" value={user.email} disabled style={{ opacity: 0.5 }} />
            </div>
            <button className="btn btn-primary" disabled={savingProfile}>
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>

      {/* Change Password Section */}
      <div className="profile-section">
        <h3 className="profile-section-title">🔒 Change Password</h3>
        <div className="card" style={{ padding: '1.5rem' }}>
          {passwordMsg.text && (
            <div className={`alert alert-${passwordMsg.type}`}>
              {passwordMsg.type === 'success' ? '✓' : '✕'} {passwordMsg.text}
            </div>
          )}
          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary" disabled={savingPassword}>
              {savingPassword ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>

      {/* Email Preferences Section */}
      <div className="profile-section">
        <h3 className="profile-section-title">📧 Email Preferences</h3>
        <div className="card" style={{ padding: '1.5rem' }}>
          {prefsMsg.text && (
            <div className={`alert alert-${prefsMsg.type}`}>
              {prefsMsg.type === 'success' ? '✓' : '✕'} {prefsMsg.text}
            </div>
          )}
          <form onSubmit={handleSavePrefs}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={emailPrefs.purchase} onChange={() => togglePref('purchase')} style={{ width: '1.2rem', height: '1.2rem' }} />
                <span><strong>Purchase Receipts</strong> - Emails when you buy tickets</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={emailPrefs.reminder} onChange={() => togglePref('reminder')} style={{ width: '1.2rem', height: '1.2rem' }} />
                <span><strong>Event Reminders</strong> - 24h and 1h before your events</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={emailPrefs.updates} onChange={() => togglePref('updates')} style={{ width: '1.2rem', height: '1.2rem' }} />
                <span><strong>Event Updates</strong> - When an event you have tickets for is updated/cancelled</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={emailPrefs.newsletter} onChange={() => togglePref('newsletter')} style={{ width: '1.2rem', height: '1.2rem' }} />
                <span><strong>Newsletter</strong> - Occasional news and platform updates</span>
              </label>
            </div>
            <button className="btn btn-primary" disabled={savingPrefs}>
              {savingPrefs ? 'Saving...' : 'Save Preferences'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
