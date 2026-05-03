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
    if (!event) return res.status(404).json({ success: false, error: 'Event not found' });
    if (event.status === 'CANCELLED') return res.status(400).json({ success: false, error: 'This event has been cancelled' });
    if (event.available_tickets < quantity) {
      return res.status(400).json({ success: false, error: `Only ${event.available_tickets} tickets remaining` });
    }

    // Check for overlapping events (conflict detection)
    const userTickets = db.prepare(`
      SELECT e.date, e.time, e.title FROM tickets t
      JOIN events e ON t.event_id = e.id
      WHERE t.user_id = ? AND t.status = 'CONFIRMED' AND e.date = ?
    `).all(req.user.id, event.date);

    const conflicts = userTickets.filter(t => t.time === event.time);
    if (conflicts.length > 0) {
      return res.status(409).json({
        success: false,
        error: `Schedule conflict! You already have a ticket for "${conflicts[0].title}" at the same time.`,
        conflict: true
      });
    }

    const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const totalPrice = event.price * quantity;
    const ticketId = uuidv4();

    db.prepare(`
      INSERT INTO tickets (id, event_id, user_id, quantity, total_price, payment_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(ticketId, eventId, req.user.id, quantity, totalPrice, paymentId);

    db.prepare('UPDATE events SET available_tickets = available_tickets - ? WHERE id = ?')
      .run(quantity, eventId);

    const ticket = db.prepare(`
      SELECT t.*, e.title as event_title, e.date as event_date, e.time as event_time,
             e.location as event_location, e.description as event_description
      FROM tickets t JOIN events e ON t.event_id = e.id WHERE t.id = ?
    `).get(ticketId);

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
      payment: { id: paymentId, amount: totalPrice, status: 'COMPLETED', cardLast4: cardLast4 || '4242' }
    });
  } catch (err) {
    console.error('Ticket purchase error:', err);
    res.status(500).json({ success: false, error: 'Failed to purchase tickets' });
  }
});

/**
 * GET /api/tickets/my-tickets
 * Get current user's tickets with full event details
 */
router.get('/my-tickets', authenticate, (req, res) => {
  try {
    const tickets = db.prepare(`
      SELECT t.*, e.title as event_title, e.date as event_date, e.time as event_time,
             e.location as event_location, e.description as event_description,
             e.status as event_status,
             r.id as refund_request_id, r.status as refund_status
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      LEFT JOIN refund_requests r ON r.ticket_id = t.id
      WHERE t.user_id = ?
      ORDER BY t.purchased_at DESC
    `).all(req.user.id);
    res.json({ success: true, tickets });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch tickets' });
  }
});

/**
 * GET /api/tickets/payment-history
 * Full payment history for a user
 */
router.get('/payment-history', authenticate, (req, res) => {
  try {
    const history = db.prepare(`
      SELECT t.id, t.payment_id, t.quantity, t.total_price, t.status, t.purchased_at,
             e.id as event_id, e.title as event_title, e.date as event_date,
             e.location as event_location, e.price as price_per_ticket,
             r.id as refund_request_id, r.status as refund_status, r.reason as refund_reason,
             r.requested_at as refund_requested_at
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      LEFT JOIN refund_requests r ON r.ticket_id = t.id
      WHERE t.user_id = ?
      ORDER BY t.purchased_at DESC
    `).all(req.user.id);
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch payment history' });
  }
});

/**
 * POST /api/tickets/:id/refund
 * Request a refund for a ticket
 */
router.post('/:id/refund', authenticate, (req, res) => {
  try {
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });
    if (ticket.status !== 'CONFIRMED') return res.status(400).json({ success: false, error: 'Ticket is not eligible for refund' });

    const existing = db.prepare('SELECT * FROM refund_requests WHERE ticket_id = ?').get(req.params.id);
    if (existing) return res.status(409).json({ success: false, error: 'A refund request already exists for this ticket' });

    const { reason } = req.body;
    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({ success: false, error: 'Please provide a reason (at least 10 characters)' });
    }

    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(ticket.event_id);
    const id = uuidv4();
    db.prepare(`
      INSERT INTO refund_requests (id, ticket_id, user_id, event_id, reason)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, req.params.id, req.user.id, ticket.event_id, reason.trim());

    notifyUser(req.user.id, 'Refund Request Submitted', `Your refund request for "${event?.title}" has been submitted and is pending review.`, 'REFUND');

    const refund = db.prepare('SELECT * FROM refund_requests WHERE id = ?').get(id);
    res.status(201).json({ success: true, message: 'Refund request submitted!', refund });
  } catch (err) {
    console.error('Refund request error:', err);
    res.status(500).json({ success: false, error: 'Failed to submit refund request' });
  }
});

module.exports = router;
