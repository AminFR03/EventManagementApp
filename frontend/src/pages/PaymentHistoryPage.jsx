import { useState, useEffect } from 'react';
import { ticketsAPI } from '../api';

export default function PaymentHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      const res = await ticketsAPI.getPaymentHistory();
      setHistory(res.data.history);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="page-container"><p>Loading payment history...</p></div>;

  return (
    <div className="page-container" style={{ maxWidth: '1000px' }}>
      <div className="hero" style={{ padding: '2rem 0', textAlign: 'left', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem' }}>Payment History</h1>
        <p>Review your past transactions and ticket purchases</p>
      </div>

      <div className="card" style={{ padding: '2rem', overflowX: 'auto' }}>
        {history.length === 0 ? (
          <div className="empty-state">
            <p>No payment history found.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '1rem' }}>Date</th>
                <th style={{ padding: '1rem' }}>Transaction ID</th>
                <th style={{ padding: '1rem' }}>Event</th>
                <th style={{ padding: '1rem' }}>Qty</th>
                <th style={{ padding: '1rem' }}>Amount</th>
                <th style={{ padding: '1rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                    {new Date(item.purchased_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{item.payment_id}</td>
                  <td style={{ padding: '1rem' }}>
                    <strong>{item.event_title}</strong><br/>
                    <small style={{ color: 'var(--text-muted)' }}>{item.event_date}</small>
                  </td>
                  <td style={{ padding: '1rem' }}>{item.quantity}</td>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>${item.total_price.toFixed(2)}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
                      <span className={`badge ${item.status === 'CONFIRMED' ? 'badge-success' : 'badge-error'}`}>
                        {item.status}
                      </span>
                      {item.refund_status && (
                        <span className={`badge ${item.refund_status === 'APPROVED' ? 'badge-success' : item.refund_status === 'REJECTED' ? 'badge-error' : 'badge-primary'}`}>
                          Refund: {item.refund_status}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
