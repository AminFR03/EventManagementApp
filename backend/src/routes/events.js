const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { authenticate } = require('../middleware/auth');
const { validateEvent } = require('../middleware/validate');
const { notifyAllExcept } = require('../services/notificationService');

const router = express.Router();

/**
 * GET /api/events
 * Fetch all events with creator details
 */
router.get('/', (req, res) => {
  try {
    const events = db.prepare(`
      SELECT e.*, u.name as creator_name, u.email as creator_email
      FROM events e
      JOIN users u ON e.creator_id = u.id
      ORDER BY e.date ASC
    `).all();

    res.json({ success: true, events });
  } catch (err) {
    console.error('Fetch events error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch events' });
  }
});

/**
 * GET /api/events/:id
 * Fetch a single event by ID
 */
router.get('/:id', (req, res) => {
  try {
    const event = db.prepare(`
      SELECT e.*, u.name as creator_name, u.email as creator_email
      FROM events e
      JOIN users u ON e.creator_id = u.id
      WHERE e.id = ?
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
    const { title, description, location, date, time, price, totalTickets } = req.body;
    const id = uuidv4();
    const tickets = totalTickets || 100;

    db.prepare(`
      INSERT INTO events (id, title, description, location, date, time, price, total_tickets, available_tickets, creator_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, title.trim(), description.trim(), location.trim(), date, time, price || 0, tickets, tickets, req.user.id);

    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(id);

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
 * Update an event (only by creator)
 */
router.put('/:id', authenticate, (req, res) => {
  try {
    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    if (event.creator_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'You can only edit your own events' });
    }

    const { title, description, location, date, time, price, totalTickets } = req.body;
    db.prepare(`
      UPDATE events SET title=?, description=?, location=?, date=?, time=?, price=?, total_tickets=?, updated_at=datetime('now')
      WHERE id=?
    `).run(
      title || event.title,
      description || event.description,
      location || event.location,
      date || event.date,
      time || event.time,
      price !== undefined ? price : event.price,
      totalTickets || event.total_tickets,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);

    // Notify users about event update
    notifyAllExcept(
      req.user.id,
      'Event Updated',
      `"${updated.title}" has been updated. Check the new details!`,
      'UPDATE'
    );

    res.json({ success: true, message: 'Event updated!', event: updated });
  } catch (err) {
    console.error('Update event error:', err);
    res.status(500).json({ success: false, error: 'Failed to update event' });
  }
});

/**
 * DELETE /api/events/:id
 * Delete an event (only by creator)
 */
router.delete('/:id', authenticate, (req, res) => {
  try {
    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    if (event.creator_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'You can only delete your own events' });
    }

    db.prepare('DELETE FROM tickets WHERE event_id = ?').run(req.params.id);
    db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);

    res.json({ success: true, message: 'Event deleted!' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete event' });
  }
});

module.exports = router;
