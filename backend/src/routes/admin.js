const express = require('express');
const db = require('../database');
const { authenticate, requireRole } = require('../middleware/auth');
const { notifyUser } = require('../services/notificationService');

const router = express.Router();

/**
 * GET /api/admin/stats
 * Dashboard overview statistics
 */
router.get('/stats', authenticate, requireRole('ADMIN'), (req, res) => {
  try {
    const users = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const events = db.prepare("SELECT COUNT(*) as count FROM events WHERE status = 'ACTIVE'").get().count;
    
    const ticketStats = db.prepare(`
      SELECT COALESCE(SUM(quantity), 0) as total_tickets, COALESCE(SUM(total_price), 0) as total_revenue 
      FROM tickets WHERE status = 'CONFIRMED'
    `).get();

    const recentActivity = db.prepare(`
      SELECT 'USER' as type, name as title, created_at as date FROM users
      UNION ALL
      SELECT 'EVENT' as type, title, created_at as date FROM events
      UNION ALL
      SELECT 'TICKET' as type, 'Purchase: ' || payment_id as title, purchased_at as date FROM tickets
      ORDER BY date DESC LIMIT 10
    `).all();

    res.json({
      success: true,
      stats: {
        totalUsers: users,
        totalEvents: events,
        ticketsSold: ticketStats.total_tickets,
        revenue: ticketStats.total_revenue,
      },
      recentActivity
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/admin/users
 * List all users with filtering/sorting
 */
router.get('/users', authenticate, requireRole('ADMIN'), (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, name, email, role, is_suspended, created_at
      FROM users ORDER BY created_at DESC
    `).all();
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

/**
 * PUT /api/admin/users/:id/role
 * Change user role
 */
router.put('/users/:id/role', authenticate, requireRole('ADMIN'), (req, res) => {
  try {
    const { role } = req.body;
    if (!['ADMIN', 'ORGANIZER', 'ATTENDEE'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' });
    }
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
    res.json({ success: true, message: 'User role updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update user role' });
  }
});

/**
 * PUT /api/admin/users/:id/suspend
 * Toggle user suspension
 */
router.put('/users/:id/suspend', authenticate, requireRole('ADMIN'), (req, res) => {
  try {
    const { suspend } = req.body;
    db.prepare('UPDATE users SET is_suspended = ? WHERE id = ?').run(suspend ? 1 : 0, req.params.id);
    res.json({ success: true, message: `User ${suspend ? 'suspended' : 'unsuspended'}` });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update user status' });
  }
});

/**
 * GET /api/admin/refunds
 * List all refund requests
 */
router.get('/refunds', authenticate, requireRole('ADMIN'), (req, res) => {
  try {
    const refunds = db.prepare(`
      SELECT r.*, t.payment_id, t.total_price, t.quantity,
             u.name as user_name, u.email as user_email,
             e.title as event_title
      FROM refund_requests r
      JOIN tickets t ON r.ticket_id = t.id
      JOIN users u ON r.user_id = u.id
      JOIN events e ON r.event_id = e.id
      ORDER BY r.requested_at DESC
    `).all();
    res.json({ success: true, refunds });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch refunds' });
  }
});

/**
 * PUT /api/admin/refunds/:id/resolve
 * Approve or reject a refund request
 */
router.put('/refunds/:id/resolve', authenticate, requireRole('ADMIN'), (req, res) => {
  try {
    const { status, adminNote } = req.body; // status: 'APPROVED' or 'REJECTED'
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const refund = db.prepare('SELECT * FROM refund_requests WHERE id = ?').get(req.params.id);
    if (!refund) return res.status(404).json({ success: false, error: 'Refund request not found' });
    if (refund.status !== 'PENDING') return res.status(400).json({ success: false, error: 'Refund request already resolved' });

    db.transaction(() => {
      // Update refund request status
      db.prepare(`
        UPDATE refund_requests 
        SET status = ?, admin_note = ?, resolved_at = datetime('now')
        WHERE id = ?
      `).run(status, adminNote || null, req.params.id);

      if (status === 'APPROVED') {
        const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(refund.ticket_id);
        
        // Mark ticket as REFUNDED
        db.prepare("UPDATE tickets SET status = 'REFUNDED' WHERE id = ?").run(ticket.id);
        
        // Restock available tickets
        db.prepare('UPDATE events SET available_tickets = available_tickets + ? WHERE id = ?')
          .run(ticket.quantity, ticket.event_id);
      }
    })();

    const event = db.prepare('SELECT title FROM events WHERE id = ?').get(refund.event_id);

    // Notify user
    notifyUser(
      refund.user_id,
      `Refund ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
      `Your refund request for "${event.title}" has been ${status.toLowerCase()}.${adminNote ? ' Note: ' + adminNote : ''}`,
      'REFUND'
    );

    res.json({ success: true, message: `Refund request ${status.toLowerCase()}` });
  } catch (err) {
    console.error('Resolve refund error:', err);
    res.status(500).json({ success: false, error: 'Failed to resolve refund request' });
  }
});

module.exports = router;
