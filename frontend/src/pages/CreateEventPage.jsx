import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsAPI } from '../api';

export default function CreateEventPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', location: '',
    date: '', time: '', price: 0, totalTickets: 100
  });
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  function onChange(e) {
    const val = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    setForm({ ...form, [e.target.name]: val });
    setErrors([]);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErrors([]);
    try {
      await eventsAPI.create(form);
      setSuccess('Event created successfully! Redirecting...');
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      const data = err.response?.data;
      setErrors(data?.errors || [data?.error || 'Failed to create event']);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container">
      <div className="form-card wide card" style={{ padding: '2rem' }}>
        <div className="page-header" style={{ textAlign: 'center' }}>
          <h1 className="page-title">Create New Event</h1>
          <p className="page-subtitle">Fill in the details to publish your event</p>
        </div>

        {success && <div className="alert alert-success">✓ {success}</div>}
        {errors.map((e, i) => <div key={i} className="alert alert-error">✕ {e}</div>)}

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label className="form-label">Event Title</label>
            <input className="form-input" name="title" placeholder="e.g. Tech Conference 2026" value={form.title} onChange={onChange} required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Date</label>
              <input className="form-input" name="date" type="date" value={form.date} onChange={onChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Time</label>
              <input className="form-input" name="time" type="time" value={form.time} onChange={onChange} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Location</label>
            <input className="form-input" name="location" placeholder="e.g. Convention Center, New York" value={form.location} onChange={onChange} required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Price per Ticket ($)</label>
              <input className="form-input" name="price" type="number" min="0" step="0.01" value={form.price} onChange={onChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Total Tickets Available</label>
              <input className="form-input" name="totalTickets" type="number" min="1" value={form.totalTickets} onChange={onChange} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" name="description" placeholder="Describe your event in detail..." rows={5} value={form.description} onChange={onChange} required />
          </div>

          <div className="form-footer" style={{ display: 'flex', gap: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/')}>Cancel</button>
            <button className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Publishing...' : 'Publish Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
