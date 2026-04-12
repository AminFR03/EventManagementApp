import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { eventsAPI, ticketsAPI } from '../api';

export default function EventsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchaseModal, setPurchaseModal] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseResult, setPurchaseResult] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      const res = await eventsAPI.getAll();
      setEvents(res.data.events);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openPurchaseModal(event) {
    if (!user) {
      navigate('/login');
      return;
    }
    setPurchaseModal(event);
    setQuantity(1);
    setPurchaseResult(null);
  }

  async function handlePurchase() {
    setPurchasing(true);
    try {
      const res = await ticketsAPI.purchase({
        eventId: purchaseModal.id,
        quantity
      });
      setPurchaseResult(res.data);
      fetchEvents(); // refresh available tickets
    } catch (err) {
      alert(err.response?.data?.error || 'Purchase failed');
    } finally {
      setPurchasing(false);
    }
  }

  function closeModal() {
    setPurchaseModal(null);
    setPurchaseResult(null);
  }

  return (
    <div className="page-container">
      <div className="hero">
        <h1>Discover Events</h1>
        <p>Find and attend incredible events happening around you. Buy tickets securely and never miss out.</p>
        {user && (
          <button className="btn btn-primary" onClick={() => navigate('/create-event')}>
            + Create New Event
          </button>
        )}
      </div>

      {loading ? (
        <div className="empty-state"><p>Loading events...</p></div>
      ) : events.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <h3>No events yet</h3>
          <p>Be the first to create an amazing event!</p>
        </div>
      ) : (
        <div className="card-grid">
          {events.map(event => (
            <div key={event.id} className="card">
              <div className="event-card-header">
                <div className="event-card-title">{event.title}</div>
                <div className={`event-card-price ${event.price === 0 ? 'free' : ''}`}>
                  {event.price === 0 ? 'Free' : `$${event.price.toFixed(2)}`}
                </div>
              </div>
              <div className="event-card-meta">
                <div className="event-meta-item">
                  <span className="event-meta-icon">📅</span> {event.date}
                </div>
                <div className="event-meta-item">
                  <span className="event-meta-icon">⏰</span> {event.time}
                </div>
                <div className="event-meta-item">
                  <span className="event-meta-icon">📍</span> {event.location}
                </div>
              </div>
              <div className="event-card-desc">{event.description}</div>
              <div className="event-card-footer">
                <span className="event-card-creator">By {event.creator_name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className={`tickets-remaining ${event.available_tickets < 10 ? 'low' : ''}`}>
                    {event.available_tickets} left
                  </span>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => openPurchaseModal(event)}
                    disabled={event.available_tickets === 0}
                  >
                    {event.available_tickets === 0 ? 'Sold Out' : 'Buy Ticket'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Purchase Modal */}
      {purchaseModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {!purchaseResult ? (
              <>
                <div className="modal-header">
                  <h2 className="modal-title">Purchase Tickets</h2>
                  <button className="modal-close" onClick={closeModal}>×</button>
                </div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  {purchaseModal.title}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {purchaseModal.date} · {purchaseModal.time} · {purchaseModal.location}
                </p>

                <div style={{ margin: '1.5rem 0' }}>
                  <label className="form-label">Quantity</label>
                  <div className="quantity-selector">
                    <button className="quantity-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                    <span className="quantity-display">{quantity}</span>
                    <button className="quantity-btn" onClick={() => setQuantity(Math.min(10, quantity + 1))}>+</button>
                  </div>
                </div>

                <div className="purchase-summary">
                  <div className="purchase-summary-row">
                    <span>Price per ticket</span>
                    <span>${purchaseModal.price.toFixed(2)}</span>
                  </div>
                  <div className="purchase-summary-row">
                    <span>Quantity</span>
                    <span>× {quantity}</span>
                  </div>
                  <div className="purchase-summary-row total">
                    <span>Total</span>
                    <span>${(purchaseModal.price * quantity).toFixed(2)}</span>
                  </div>
                </div>

                <div className="mock-card">
                  <div className="mock-card-label">💳 Mock Payment Card</div>
                  <div className="mock-card-number">•••• •••• •••• 4242</div>
                </div>

                <button
                  className="btn btn-success btn-block"
                  onClick={handlePurchase}
                  disabled={purchasing}
                >
                  {purchasing ? 'Processing Payment...' : `Pay $${(purchaseModal.price * quantity).toFixed(2)}`}
                </button>
              </>
            ) : (
              <>
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                  <h2 className="modal-title" style={{ marginBottom: '0.5rem' }}>Purchase Confirmed!</h2>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                    Your tickets are ready
                  </p>
                </div>
                <div className="ticket-receipt">
                  <div className="ticket-receipt-row">
                    <span>Event</span>
                    <strong>{purchaseResult.ticket.event_title}</strong>
                  </div>
                  <div className="ticket-receipt-row">
                    <span>Date</span>
                    <strong>{purchaseResult.ticket.event_date}</strong>
                  </div>
                  <div className="ticket-receipt-row">
                    <span>Quantity</span>
                    <strong>{purchaseResult.ticket.quantity}</strong>
                  </div>
                  <div className="ticket-receipt-row">
                    <span>Payment ID</span>
                    <strong>{purchaseResult.payment.id}</strong>
                  </div>
                  <div className="ticket-receipt-row">
                    <span>Total Paid</span>
                    <strong style={{ color: 'var(--success)' }}>${purchaseResult.payment.amount.toFixed(2)}</strong>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={closeModal}>Close</button>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { closeModal(); navigate('/my-tickets'); }}>
                    View My Tickets
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
