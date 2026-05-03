import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { eventsAPI, ticketsAPI } from '../api';

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Purchase state
  const [quantity, setQuantity] = useState(1);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  useEffect(() => {
    fetchEventDetails();
    fetchComments();
  }, [id]);

  async function fetchEventDetails() {
    try {
      const res = await eventsAPI.getOne(id);
      setEvent(res.data.event);
    } catch (err) {
      console.error(err);
      navigate('/');
    } finally {
      setLoading(false);
    }
  }

  async function fetchComments() {
    try {
      const res = await eventsAPI.getComments(id);
      setComments(res.data.comments);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleShare() {
    try {
      await eventsAPI.share(id);
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      alert('Event link copied to clipboard!');
      fetchEventDetails(); // refresh share count
    } catch (err) {
      console.error(err);
    }
  }

  async function submitComment(e) {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    setSubmitting(true);
    try {
      await eventsAPI.addComment(id, { content: newComment, rating: rating > 0 ? rating : undefined });
      setNewComment('');
      setRating(0);
      fetchComments();
      fetchEventDetails(); // update avg rating
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePurchase() {
    if (!user) {
      navigate('/login');
      return;
    }
    setPurchasing(true);
    try {
      await ticketsAPI.purchase({ eventId: id, quantity });
      setPurchaseSuccess(true);
      fetchEventDetails();
    } catch (err) {
      alert(err.response?.data?.error || 'Purchase failed');
    } finally {
      setPurchasing(false);
    }
  }

  if (loading) return <div className="page-container"><p>Loading event...</p></div>;
  if (!event) return <div className="page-container"><p>Event not found.</p></div>;

  return (
    <div className="page-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              {event.category_name && (
                <span className="badge" style={{ backgroundColor: event.category_color, color: 'white' }}>
                  {event.category_icon} {event.category_name}
                </span>
              )}
              {event.tags && JSON.parse(event.tags).map(tag => (
                <span key={tag} className="badge badge-secondary">#{tag}</span>
              ))}
            </div>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{event.title}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>By {event.creator_name}</p>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <div className="event-card-price" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
              {event.price === 0 ? 'Free' : `$${event.price.toFixed(2)}`}
            </div>
            <button className="btn btn-secondary btn-sm" onClick={handleShare}>
              🔗 Share ({event.share_count})
            </button>
          </div>
        </div>

        <div className="event-meta" style={{ display: 'flex', gap: '2rem', margin: '2rem 0', padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius)' }}>
          <div>
            <strong>📅 Date & Time</strong>
            <p>{event.date} at {event.time}</p>
          </div>
          <div>
            <strong>📍 Location</strong>
            <p>{event.location}</p>
          </div>
          <div>
            <strong>⭐ Rating</strong>
            <p>{event.avg_rating.toFixed(1)}/5 ({event.review_count} reviews)</p>
          </div>
        </div>

        <div style={{ marginBottom: '2rem', lineHeight: '1.6' }}>
          <h3>About this event</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{event.description}</p>
        </div>

        <div style={{ padding: '1.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <h3>Get Tickets</h3>
          {purchaseSuccess ? (
            <div className="alert alert-success">Purchase successful! Check your tickets.</div>
          ) : event.available_tickets > 0 ? (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginTop: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Quantity</label>
                <div className="quantity-selector">
                  <button className="quantity-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                  <span className="quantity-display">{quantity}</span>
                  <button className="quantity-btn" onClick={() => setQuantity(Math.min(10, quantity + 1))}>+</button>
                </div>
              </div>
              <button className="btn btn-primary" onClick={handlePurchase} disabled={purchasing} style={{ flex: 1 }}>
                {purchasing ? 'Processing...' : `Buy Tickets ($${(event.price * quantity).toFixed(2)})`}
              </button>
            </div>
          ) : (
            <div className="alert alert-error">Sold Out</div>
          )}
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            {event.available_tickets} tickets remaining
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <h2>Comments & Reviews</h2>
        
        {user ? (
          <form onSubmit={submitComment} style={{ margin: '1.5rem 0', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <span 
                    key={star} 
                    onClick={() => setRating(star)}
                    style={{ cursor: 'pointer', fontSize: '1.5rem', color: star <= rating ? '#fbbf24' : '#e5e7eb', lineHeight: 1 }}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span style={{ marginLeft: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {rating > 0 ? `${rating} Stars` : 'Rate this event (optional)'}
              </span>
            </div>
            <textarea 
              className="form-input" 
              rows="3" 
              placeholder="Leave a comment or review..." 
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              required
            ></textarea>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={submitting}>
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </form>
        ) : (
          <p style={{ margin: '1.5rem 0' }}>Please <a href="/login">login</a> to leave a comment.</p>
        )}

        <div className="comments-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {comments.length === 0 ? (
            <p className="empty-state">No comments yet. Be the first!</p>
          ) : (
            comments.map(comment => (
              <div key={comment.id} style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong>{comment.user_name}</strong>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                {comment.rating > 0 && (
                  <div style={{ color: '#fbbf24', marginBottom: '0.5rem' }}>
                    {'★'.repeat(comment.rating)}{'☆'.repeat(5 - comment.rating)}
                  </div>
                )}
                <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{comment.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
