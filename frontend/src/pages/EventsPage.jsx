import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { eventsAPI, categoriesAPI } from '../api';

export default function EventsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const queryParams = new URLSearchParams(location.search);
  const initialCategory = queryParams.get('category') || '';
  
  const [filters, setFilters] = useState({
    search: '',
    category: initialCategory,
    dateRange: 'all',
    minPrice: '',
    maxPrice: '',
    sortBy: 'date',
    tags: ''
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  async function fetchData() {
    try {
      if (categories.length === 0) {
        const catRes = await categoriesAPI.getAll();
        setCategories(catRes.data.categories);
      }
      
      const res = await eventsAPI.getAll(filters);
      setEvents(res.data.events);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleFilterChange(e) {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  }

  return (
    <div className="page-container">
      <div className="hero">
        <h1>Discover Events</h1>
        <p>Find and attend incredible events happening around you.</p>
        {(user?.role === 'ORGANIZER' || user?.role === 'ADMIN') && (
          <button className="btn btn-primary" onClick={() => navigate('/create-event')}>
            + Create New Event
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem', alignItems: 'flex-start' }}>
        {/* Filters Sidebar */}
        <div className="card" style={{ width: '300px', padding: '1.5rem', flexShrink: 0, position: 'sticky', top: '100px' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🔍 Search & Filter
          </h3>
          
          <div className="form-group">
            <label className="form-label">Keyword Search</label>
            <input 
              type="text" 
              className="form-input" 
              name="search" 
              placeholder="Title, description, location..." 
              value={filters.search}
              onChange={handleFilterChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-input" name="category" value={filters.category} onChange={handleFilterChange}>
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Date Range</label>
            <select className="form-input" name="dateRange" value={filters.dateRange} onChange={handleFilterChange}>
              <option value="all">All Dates</option>
              <option value="upcoming">Upcoming (from today)</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Price Range ($)</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="number" className="form-input" name="minPrice" placeholder="Min" min="0" value={filters.minPrice} onChange={handleFilterChange} />
              <input type="number" className="form-input" name="maxPrice" placeholder="Max" min="0" value={filters.maxPrice} onChange={handleFilterChange} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Tags (comma separated)</label>
            <input 
              type="text" 
              className="form-input" 
              name="tags" 
              placeholder="music, tech, outdoors..." 
              value={filters.tags}
              onChange={handleFilterChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Sort By</label>
            <select className="form-input" name="sortBy" value={filters.sortBy} onChange={handleFilterChange}>
              <option value="date">Date (Earliest First)</option>
              <option value="price_asc">Price (Low to High)</option>
              <option value="price_desc">Price (High to Low)</option>
              <option value="popularity">Most Popular (Tickets Sold)</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
          
          <button 
            className="btn btn-secondary btn-block" 
            onClick={() => setFilters({ search: '', category: '', dateRange: 'all', minPrice: '', maxPrice: '', sortBy: 'date', tags: '' })}
          >
            Reset Filters
          </button>
        </div>

        {/* Results */}
        <div style={{ flex: 1 }}>
          {loading ? (
            <div className="empty-state"><p>Loading events...</p></div>
          ) : events.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <h3>No events found</h3>
              <p>Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {events.map(event => (
                <div 
                  key={event.id} 
                  className="card event-card" 
                  onClick={() => navigate(`/event/${event.id}`)}
                  style={{ cursor: 'pointer', transition: 'transform 0.2s', borderTop: event.category_color ? `4px solid ${event.category_color}` : 'none' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div className="event-card-header">
                    <div className="event-card-title">{event.title}</div>
                    <div className={`event-card-price ${event.price === 0 ? 'free' : ''}`}>
                      {event.price === 0 ? 'Free' : `$${event.price.toFixed(2)}`}
                    </div>
                  </div>
                  
                  {event.category_name && (
                    <div style={{ marginBottom: '1rem' }}>
                      <span className="badge" style={{ backgroundColor: event.category_color + '22', color: event.category_color, border: `1px solid ${event.category_color}` }}>
                        {event.category_icon} {event.category_name}
                      </span>
                    </div>
                  )}

                  <div className="event-card-meta">
                    <div className="event-meta-item"><span className="event-meta-icon">📅</span> {event.date}</div>
                    <div className="event-meta-item"><span className="event-meta-icon">📍</span> {event.location}</div>
                    <div className="event-meta-item">
                      <span className="event-meta-icon">⭐</span> {event.avg_rating.toFixed(1)} ({event.review_count})
                    </div>
                  </div>
                  
                  <div className="event-card-desc" style={{ WebkitLineClamp: 2 }}>{event.description}</div>
                  
                  <div className="event-card-footer" style={{ marginTop: 'auto' }}>
                    <span className="event-card-creator">By {event.creator_name}</span>
                    <span className={`tickets-remaining ${event.available_tickets < 10 ? 'low' : ''}`}>
                      {event.available_tickets === 0 ? 'Sold Out' : `${event.available_tickets} left`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
