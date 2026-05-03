import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { eventsAPI, ticketsAPI } from '../api';

export default function CalendarPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await eventsAPI.getAll();
      setEvents(res.data.events);

      if (user) {
        const ticketRes = await ticketsAPI.getMyTickets();
        setMyTickets(ticketRes.data.tickets.map(t => t.event_id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
  }

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  return (
    <div className="page-container">
      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1>Event Calendar</h1>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button className="btn btn-secondary" onClick={prevMonth}>&lt; Prev</button>
            <h2 style={{ minWidth: '200px', textAlign: 'center' }}>{monthName} {year}</h2>
            <button className="btn btn-secondary" onClick={nextMonth}>Next &gt;</button>
          </div>
        </div>

        {loading ? (
          <p>Loading calendar...</p>
        ) : (
          <div className="calendar-grid">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} style={{ fontWeight: 'bold', textAlign: 'center', padding: '1rem', borderBottom: '2px solid var(--border)' }}>
                {day}
              </div>
            ))}
            
            {days.map((day, index) => {
              if (day === null) return <div key={`empty-${index}`} style={{ padding: '1rem', border: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)', opacity: 0.5 }}></div>;
              
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayEvents = events.filter(e => e.date === dateStr);
              const isToday = new Date().toISOString().split('T')[0] === dateStr;

              return (
                <div key={day} style={{ 
                  padding: '0.5rem', 
                  border: '1px solid var(--border)', 
                  minHeight: '120px',
                  backgroundColor: isToday ? 'var(--primary-light, #e0e7ff)' : 'transparent'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: isToday ? 'var(--primary)' : 'inherit' }}>{day}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {dayEvents.map(e => {
                      const hasTicket = myTickets.includes(e.id);
                      return (
                        <div 
                          key={e.id}
                          onClick={() => navigate(`/event/${e.id}`)}
                          style={{
                            fontSize: '0.8rem',
                            padding: '0.25rem 0.5rem',
                            backgroundColor: hasTicket ? 'var(--success)' : (e.category_color || 'var(--primary)'),
                            color: 'white',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                          title={e.title}
                        >
                          {e.time} {e.title} {hasTicket && '🎟️'}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <style>{`
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          border-left: 1px solid var(--border);
          border-top: 1px solid var(--border);
        }
        .calendar-grid > div {
          border-right: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }
      `}</style>
    </div>
  );
}
