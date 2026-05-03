import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketsAPI } from '../api';

export default function MyTicketsPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [refundModal, setRefundModal] = useState(null);
  const [refundReason, setRefundReason] = useState('');
  const [submittingRefund, setSubmittingRefund] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  async function fetchTickets() {
    try {
      const res = await ticketsAPI.getMyTickets();
      setTickets(res.data.tickets);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function submitRefund(e) {
    e.preventDefault();
    if (refundReason.trim().length < 10) {
      alert("Please provide a reason with at least 10 characters.");
      return;
    }

    setSubmittingRefund(true);
    try {
      await ticketsAPI.requestRefund(refundModal.id, { reason: refundReason });
      alert("Refund request submitted successfully.");
      setRefundModal(null);
      setRefundReason('');
      fetchTickets();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to submit refund request");
    } finally {
      setSubmittingRefund(false);
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">My Tickets</h1>
        <p className="page-subtitle">Manage your purchased event tickets</p>
      </div>

      {loading ? (
        <div className="empty-state"><p>Loading tickets...</p></div>
      ) : tickets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎟️</div>
          <h3>No tickets found</h3>
          <p>You haven't purchased any tickets yet.</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/')}>
            Browse Events
          </button>
        </div>
      ) : (
        <div className="ticket-list" style={{ display: 'grid', gap: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
          {tickets.map(ticket => {
            const eventPassed = new Date(`${ticket.event_date}T${ticket.event_time}`) < new Date();
            return (
              <div key={ticket.id} className="card ticket-card" style={{ display: 'flex', overflow: 'hidden' }}>
                <div style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minWidth: '150px' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                    {new Date(ticket.event_date).getDate()}
                  </div>
                  <div style={{ textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.9rem' }}>
                    {new Date(ticket.event_date).toLocaleString('default', { month: 'short' })}
                  </div>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', opacity: 0.8 }}>
                    {ticket.event_time}
                  </div>
                </div>
                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', cursor: 'pointer' }} onClick={() => navigate(`/event/${ticket.event_id}`)}>
                        {ticket.event_title}
                      </h3>
                      <span className={`badge ${ticket.status === 'CONFIRMED' ? 'badge-success' : 'badge-error'}`}>
                        {ticket.status}
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                      📍 {ticket.event_location}
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius)' }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ticket ID</div>
                        <div style={{ fontFamily: 'monospace' }}>{ticket.id.split('-')[0]}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Quantity</div>
                        <div>{ticket.quantity} Pass{ticket.quantity > 1 ? 'es' : ''}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem', alignItems: 'center' }}>
                    {ticket.refund_status ? (
                      <span className={`badge ${ticket.refund_status === 'APPROVED' ? 'badge-success' : ticket.refund_status === 'REJECTED' ? 'badge-error' : 'badge-primary'}`}>
                        Refund: {ticket.refund_status}
                      </span>
                    ) : ticket.status === 'CONFIRMED' && !eventPassed ? (
                      <button className="btn btn-sm btn-secondary text-danger" onClick={() => setRefundModal(ticket)}>
                        Request Refund
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Refund Modal */}
      {refundModal && (
        <div className="modal-overlay" onClick={() => setRefundModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Request Refund</h2>
              <button className="modal-close" onClick={() => setRefundModal(null)}>×</button>
            </div>
            <p style={{ marginBottom: '1rem' }}>You are requesting a refund for <strong>{refundModal.event_title}</strong>.</p>
            <form onSubmit={submitRefund}>
              <div className="form-group">
                <label className="form-label">Reason for Refund</label>
                <textarea 
                  className="form-input" 
                  rows="4" 
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Please explain why you need a refund (min 10 characters)..."
                  required
                ></textarea>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setRefundModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-danger" disabled={submittingRefund}>
                  {submittingRefund ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
