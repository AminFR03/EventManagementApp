const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { authenticate, requireRole } = require('../middleware/auth');
const { validateEvent } = require('../middleware/validate');
const { notifyAllExcept } = require('../services/notificationService');

const router = express.Router();

/**
 * GET /api/events
 * Fetch all events with optional search/filter/sort
 * Query params: search, category, dateRange, minPrice, maxPrice, sortBy, tags
 */
router.get('/', (req, res) => {
  try {
    const { search, category, dateRange, minPrice, maxPrice, sortBy, tags } = req.query;

    let query = `
      SELECT e.*, u.name as creator_name, u.email as creator_email,
             c.name as category_name, c.icon as category_icon, c.color as category_color,
             COALESCE(AVG(cm.rating), 0) as avg_rating,
             COUNT(DISTINCT cm.id) as review_count,
             COALESCE(SUM(t.quantity), 0) as tickets_sold
      FROM events e
      JOIN users u ON e.creator_id = u.id
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN comments cm ON cm.event_id = e.id AND cm.rating IS NOT NULL
      LEFT JOIN tickets t ON t.event_id = e.id AND t.status = 'CONFIRMED'
      WHERE e.status = 'ACTIVE'
    `;
    const params = [];

    // Keyword search
    if (search) {
      query += ` AND (e.title LIKE ? OR e.description LIKE ? OR e.location LIKE ?)`;
      const kw = `%${search}%`;
      params.push(kw, kw, kw);
    }

    // Category filter
    if (category) {
      query += ` AND e.category_id = ?`;
      params.push(category);
    }

    // Date range filter
    const today = new Date().toISOString().split('T')[0];
    if (dateRange === 'upcoming') {
      query += ` AND e.date >= ?`;
      params.push(today);
    } else if (dateRange === 'this_week') {
      const weekEnd = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
      query += ` AND e.date >= ? AND e.date <= ?`;
      params.push(today, weekEnd);
    } else if (dateRange === 'this_month') {
      const monthEnd = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
      query += ` AND e.date >= ? AND e.date <= ?`;
      params.push(today, monthEnd);
    }

    // Price filter
    if (minPrice !== undefined && minPrice !== '') {
      query += ` AND e.price >= ?`;
      params.push(Number(minPrice));
    }
    if (maxPrice !== undefined && maxPrice !== '') {
      query += ` AND e.price <= ?`;
      params.push(Number(maxPrice));
    }

    query += ` GROUP BY e.id`;

    // Tag filter (post-group)
    // Sort
    if (sortBy === 'price_asc') query += ` ORDER BY e.price ASC, e.date ASC`;
    else if (sortBy === 'price_desc') query += ` ORDER BY e.price DESC, e.date ASC`;
    else if (sortBy === 'popularity') query += ` ORDER BY tickets_sold DESC, e.date ASC`;
    else if (sortBy === 'rating') query += ` ORDER BY avg_rating DESC, e.date ASC`;
    else query += ` ORDER BY e.date ASC`; // default: by date

    let events = db.prepare(query).all(...params);

    // Tag filter (in-memory, tags stored as JSON array)
    if (tags) {
      const filterTags = tags.split(',').map(t => t.trim().toLowerCase());
      events = events.filter(ev => {
        try {
          const evTags = JSON.parse(ev.tags || '[]').map(t => t.toLowerCase());
          return filterTags.some(ft => evTags.includes(ft));
        } catch { return false; }
      });
    }

    res.json({ success: true, events });
  } catch (err) {
    console.error('Fetch events error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch events' });
  }
});

/**
 * GET /api/events/:id
 * Fetch a single event by ID with full details
 */
router.get('/:id', (req, res) => {
  try {
    const event = db.prepare(`
      SELECT e.*, u.name as creator_name, u.email as creator_email,
             c.name as category_name, c.icon as category_icon, c.color as category_color,
             COALESCE(AVG(cm.rating), 0) as avg_rating,
             COUNT(DISTINCT cm.id) as review_count,
             COALESCE(SUM(t.quantity), 0) as tickets_sold
      FROM events e
      JOIN users u ON e.creator_id = u.id
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN comments cm ON cm.event_id = e.id AND cm.rating IS NOT NULL
      LEFT JOIN tickets t ON t.event_id = e.id AND t.status = 'CONFIRMED'
      WHERE e.id = ?
      GROUP BY e.id
    `).get(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    res.json({ success: true, event });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch event' });
  }
});

/**
 * POST /api/events
 * Create a new event (requires authentication)
 */
router.post('/', authenticate, validateEvent, (req, res) => {
  try {
    const { title, description, location, date, time, price, totalTickets, categoryId, tags } = req.body;
    const id = uuidv4();
    const tickets = totalTickets || 100;
    const tagsJson = JSON.stringify(Array.isArray(tags) ? tags : []);

    db.prepare(`
      INSERT INTO events (id, title, description, location, date, time, price, total_tickets, available_tickets, creator_id, category_id, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, title.trim(), description.trim(), location.trim(), date, time, price || 0, tickets, tickets, req.user.id, categoryId || null, tagsJson);

    const event = db.prepare(`
      SELECT e.*, u.name as creator_name, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM events e JOIN users u ON e.creator_id = u.id
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE e.id = ?
    `).get(id);

    // Notify all other users about the new event
    notifyAllExcept(
      req.user.id,
      'New Event Created!',
      `"${title}" on ${date} at ${location}. Don't miss it!`,
      'EVENT'
    );

    res.status(201).json({ success: true, message: 'Event created successfully!', event });
  } catch (err) {
    console.error('Create event error:', err);
    res.status(500).json({ success: false, error: 'Failed to create event' });
  }
});

/**
 * PUT /api/events/:id
 * Update an event (by creator or admin)
 */
router.put('/:id', authenticate, (req, res) => {
  try {
    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
    if (!event) return res.status(404).json({ success: false, error: 'Event not found' });
    if (event.creator_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'You can only edit your own events' });
    }

    const { title, description, location, date, time, price, totalTickets, categoryId, tags, status } = req.body;
    const tagsJson = tags !== undefined ? JSON.stringify(Array.isArray(tags) ? tags : []) : event.tags;

    db.prepare(`
      UPDATE events SET title=?, description=?, location=?, date=?, time=?, price=?, total_tickets=?,
        category_id=?, tags=?, status=?, updated_at=datetime('now')
      WHERE id=?
    `).run(
      title || event.title,
      description || event.description,
      location || event.location,
      date || event.date,
      time || event.time,
      price !== undefined ? price : event.price,
      totalTickets || event.total_tickets,
      categoryId !== undefined ? categoryId : event.category_id,
      tagsJson,
      status || event.status,
      req.params.id
    );

    const updated = db.prepare(`
      SELECT e.*, u.name as creator_name, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM events e JOIN users u ON e.creator_id = u.id
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE e.id = ?
    `).get(req.params.id);

    // Notify ticket holders about event update
    notifyAllExcept(req.user.id, 'Event Updated', `"${updated.title}" has been updated. Check the new details!`, 'UPDATE');

    res.json({ success: true, message: 'Event updated!', event: updated });
  } catch (err) {
    console.error('Update event error:', err);
    res.status(500).json({ success: false, error: 'Failed to update event' });
  }
});

/**
 * DELETE /api/events/:id
 * Delete an event (by creator or admin)
 */
router.delete('/:id', authenticate, (req, res) => {
  try {
    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
    if (!event) return res.status(404).json({ success: false, error: 'Event not found' });
    if (event.creator_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'You can only delete your own events' });
    }

    db.prepare('DELETE FROM comments WHERE event_id = ?').run(req.params.id);
    db.prepare('DELETE FROM tickets WHERE event_id = ?').run(req.params.id);
    db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);

    res.json({ success: true, message: 'Event deleted!' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete event' });
  }
});

/**
 * POST /api/events/:id/share
 * Increment share count for an event
 */
router.post('/:id/share', (req, res) => {
  try {
    db.prepare('UPDATE events SET share_count = share_count + 1 WHERE id = ?').run(req.params.id);
    const event = db.prepare('SELECT share_count FROM events WHERE id = ?').get(req.params.id);
    res.json({ success: true, shareCount: event ? event.share_count : 0 });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to track share' });
  }
});

/**
 * GET /api/events/:id/comments
 * Get all comments/ratings for an event
 */
router.get('/:id/comments', (req, res) => {
  try {
    const comments = db.prepare(`
      SELECT cm.*, u.name as user_name, u.avatar as user_avatar
      FROM comments cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.event_id = ?
      ORDER BY cm.created_at DESC
    `).all(req.params.id);
    res.json({ success: true, comments });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch comments' });
  }
});

/**
 * POST /api/events/:id/comments
 * Add a comment/rating to an event (requires auth)
 */
router.post('/:id/comments', authenticate, (req, res) => {
  try {
    const { content, rating } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Comment content is required' });
    }
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5' });
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO comments (id, event_id, user_id, content, rating)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, req.params.id, req.user.id, content.trim(), rating || null);

    const comment = db.prepare(`
      SELECT cm.*, u.name as user_name, u.avatar as user_avatar
      FROM comments cm JOIN users u ON cm.user_id = u.id WHERE cm.id = ?
    `).get(id);

    res.status(201).json({ success: true, comment });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to add comment' });
  }
});

/**
 * PUT /api/events/:id/comments/:commentId
 * Edit own comment
 */
router.put('/:id/comments/:commentId', authenticate, (req, res) => {
  try {
    const comment = db.prepare('SELECT * FROM comments WHERE id = ? AND event_id = ?').get(req.params.commentId, req.params.id);
    if (!comment) return res.status(404).json({ success: false, error: 'Comment not found' });
    if (comment.user_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'You can only edit your own comments' });
    }

    const { content, rating } = req.body;
    db.prepare(`UPDATE comments SET content=?, rating=?, updated_at=datetime('now') WHERE id=?`)
      .run(content || comment.content, rating !== undefined ? rating : comment.rating, req.params.commentId);

    const updated = db.prepare(`
      SELECT cm.*, u.name as user_name, u.avatar as user_avatar
      FROM comments cm JOIN users u ON cm.user_id = u.id WHERE cm.id = ?
    `).get(req.params.commentId);

    res.json({ success: true, comment: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update comment' });
  }
});

/**
 * DELETE /api/events/:id/comments/:commentId
 * Delete own comment
 */
router.delete('/:id/comments/:commentId', authenticate, (req, res) => {
  try {
    const comment = db.prepare('SELECT * FROM comments WHERE id = ? AND event_id = ?').get(req.params.commentId, req.params.id);
    if (!comment) return res.status(404).json({ success: false, error: 'Comment not found' });
    if (comment.user_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'You can only delete your own comments' });
    }
    db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.commentId);
    res.json({ success: true, message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete comment' });
  }
});

module.exports = router;
