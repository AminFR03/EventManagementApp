import { useState, useEffect } from 'react';
import { ticketsAPI } from '../api';

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ticketsAPI.getMyTickets()
      .then(res => setTickets(res.data.tickets))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">My Tickets</h1>
        <p className="page-subtitle">All your purchased event tickets in one place</p>
      </div>

      {loading ? (
        <div className="empty-state"><p>Loading tickets...</p></div>
      ) : tickets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎫</div>
          <h3>No tickets yet</h3>
          <p>Purchase tickets for events to see them here</p>
        </div>
      ) : (
        <div className="card-grid">
          {tickets.map(ticket => (
            <div key={ticket.id} className="card ticket-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{ticket.event_title}</h3>
                <span className="ticket-status confirmed">✓ {ticket.status}</span>
              </div>

              <div className="event-card-meta">
                <div className="event-meta-item">
                  <span className="event-meta-icon">📅</span> {ticket.event_date}
                </div>
                <div className="event-meta-item">
                  <span className="event-meta-icon">⏰</span> {ticket.event_time}
                </div>
                <div className="event-meta-item">
                  <span className="event-meta-icon">📍</span> {ticket.event_location}
                </div>
              </div>

              <div className="ticket-receipt">
                <div className="ticket-receipt-row">
                  <span>Tickets</span>
                  <strong>{ticket.quantity}×</strong>
                </div>
                <div className="ticket-receipt-row">
                  <span>Total Paid</span>
                  <strong style={{ color: 'var(--success)' }}>${ticket.total_price.toFixed(2)}</strong>
                </div>
                <div className="ticket-receipt-row">
                  <span>Payment ID</span>
                  <strong style={{ fontSize: '0.75rem' }}>{ticket.payment_id}</strong>
                </div>
                <div className="ticket-receipt-row">
                  <span>Purchased</span>
                  <strong>{new Date(ticket.purchased_at + 'Z').toLocaleDateString()}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
