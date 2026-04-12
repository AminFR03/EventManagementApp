import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { authAPI } from '../api';

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  function onChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors([]);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErrors([]);
    try {
      const res = await authAPI.register(form);
      setSuccess(res.data.message);
      login(res.data.token, res.data.user);
      setTimeout(() => navigate('/'), 1000);
    } catch (err) {
      const data = err.response?.data;
      setErrors(data?.errors || [data?.error || 'Registration failed']);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card card">
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join Eventio and discover amazing events</p>

        {success && <div className="alert alert-success">✓ {success}</div>}
        {errors.map((e, i) => <div key={i} className="alert alert-error">✕ {e}</div>)}

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              className="form-input"
              name="name"
              placeholder="John Doe"
              value={form.name}
              onChange={onChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              className="form-input"
              name="email"
              type="email"
              placeholder="john@example.com"
              value={form.email}
              onChange={onChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              name="password"
              type="password"
              placeholder="Min 6 chars, 1 upper, 1 lower, 1 number"
              value={form.password}
              onChange={onChange}
              required
            />
          </div>
          <div className="form-footer">
            <button className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </form>
        <div className="form-alt">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
