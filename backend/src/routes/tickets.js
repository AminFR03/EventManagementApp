const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { authenticate } = require('../middleware/auth');
const { validateTicketPurchase } = require('../middleware/validate');
const { notifyUser } = require('../services/notificationService');

const router = express.Router();

/**
 * POST /api/tickets/purchase
 * Purchase tickets for an event (mock payment)
 */
router.post('/purchase', authenticate, validateTicketPurchase, (req, res) => {
  try {
    const { eventId, quantity, cardLast4 } = req.body;

    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    if (event.available_tickets < quantity) {
      return res.status(400).json({ success: false, error: `Only ${event.available_tickets} tickets remaining` });
    }

    // Mock payment processing
    const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const totalPrice = event.price * quantity;
    const ticketId = uuidv4();

    // Create ticket record
    db.prepare(`
      INSERT INTO tickets (id, event_id, user_id, quantity, total_price, payment_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(ticketId, eventId, req.user.id, quantity, totalPrice, paymentId);

    // Decrease available tickets
    db.prepare('UPDATE events SET available_tickets = available_tickets - ? WHERE id = ?')
      .run(quantity, eventId);

    const ticket = db.prepare(`
      SELECT t.*, e.title as event_title, e.date as event_date, e.time as event_time, e.location as event_location
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      WHERE t.id = ?
    `).get(ticketId);

    // Send purchase confirmation notification
    notifyUser(
      req.user.id,
      'Ticket Purchase Confirmed! 🎫',
      `You purchased ${quantity} ticket(s) for "${event.title}" on ${event.date}. Payment ID: ${paymentId}`,
      'PURCHASE'
    );

    res.status(201).json({
      success: true,
      message: 'Tickets purchased successfully!',
      ticket,
      payment: {
        id: paymentId,
        amount: totalPrice,
        status: 'COMPLETED',
        cardLast4: cardLast4 || '4242'
      }
    });
  } catch (err) {
    console.error('Ticket purchase error:', err);
    res.status(500).json({ success: false, error: 'Failed to purchase tickets' });
  }
});

/**
 * GET /api/tickets/my-tickets
 * Get current user's tickets
 */
router.get('/my-tickets', authenticate, (req, res) => {
  try {
    const tickets = db.prepare(`
      SELECT t.*, e.title as event_title, e.date as event_date, e.time as event_time,
             e.location as event_location, e.description as event_description
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      WHERE t.user_id = ?
      ORDER BY t.purchased_at DESC
    `).all(req.user.id);

    res.json({ success: true, tickets });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch tickets' });
  }
});

module.exports = router;
