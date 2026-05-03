import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { eventsAPI } from '../api';

export default function ReportsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || (user.role !== 'ORGANIZER' && user.role !== 'ADMIN')) {
      navigate('/');
      return;
    }
    fetchData();
  }, [user]);

  async function fetchData() {
    try {
      const res = await eventsAPI.getAll();
      const myEvents = res.data.events.filter(e => e.creator_id === user.id);
      setEvents(myEvents);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function downloadCSV(event) {
    // In a real app, this would fetch from backend. Here we create a mock CSV download
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Date,Ticket ID,User,Quantity,Total Price\n"
      + `2026-05-01,TICKET-1,user@example.com,2,$${(event.price * 2).toFixed(2)}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendees-${event.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (loading) return <div className="page-container"><p>Loading reports...</p></div>;

  const totalRevenue = events.reduce((sum, e) => sum + (e.price * e.tickets_sold), 0);
  const totalTickets = events.reduce((sum, e) => sum + e.tickets_sold, 0);

  return (
    <div className="page-container" style={{ maxWidth: '1000px' }}>
      <div className="hero" style={{ padding: '2rem 0', textAlign: 'left', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem' }}>Event Reports</h1>
        <p>Analytics and financial summaries for your events</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.5rem', textAlign: 'center', borderTop: '4px solid #3b82f6' }}>
          <h3 style={{ color: 'var(--text-secondary)' }}>My Events</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{events.length}</p>
        </div>
        <div className="card" style={{ padding: '1.5rem', textAlign: 'center', borderTop: '4px solid #10b981' }}>
          <h3 style={{ color: 'var(--text-secondary)' }}>Tickets Sold</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{totalTickets}</p>
        </div>
        <div className="card" style={{ padding: '1.5rem', textAlign: 'center', borderTop: '4px solid #8b5cf6' }}>
          <h3 style={{ color: 'var(--text-secondary)' }}>Total Revenue</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>${totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <h2>Event Analytics</h2>
        {events.length === 0 ? (
          <p className="empty-state">You haven't created any events yet.</p>
        ) : (
          <table style={{ width: '100%', marginTop: '1.5rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '1rem' }}>Event Name</th>
                <th style={{ padding: '1rem' }}>Date</th>
                <th style={{ padding: '1rem' }}>Tickets Sold</th>
                <th style={{ padding: '1rem' }}>Revenue</th>
                <th style={{ padding: '1rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map(event => (
                <tr key={event.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem' }}><strong>{event.title}</strong></td>
                  <td style={{ padding: '1rem' }}>{event.date}</td>
                  <td style={{ padding: '1rem' }}>
                    {event.tickets_sold} / {event.total_tickets}
                    <div style={{ width: '100%', backgroundColor: 'var(--border)', height: '6px', borderRadius: '3px', marginTop: '4px' }}>
                      <div style={{ width: `${(event.tickets_sold / event.total_tickets) * 100}%`, backgroundColor: 'var(--primary)', height: '100%', borderRadius: '3px' }}></div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>${(event.price * event.tickets_sold).toFixed(2)}</td>
                  <td style={{ padding: '1rem' }}>
                    <button className="btn btn-sm btn-secondary" onClick={() => downloadCSV(event)}>
                      Export CSV
                    </button>
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
