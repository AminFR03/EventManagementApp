const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/categories
 * Get all categories with event counts
 */
router.get('/', (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT c.*, COUNT(e.id) as event_count
      FROM categories c
      LEFT JOIN events e ON e.category_id = c.id AND e.status = 'ACTIVE'
      GROUP BY c.id
      ORDER BY c.name ASC
    `).all();
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
});

/**
 * POST /api/categories
 * Create a new category (admin only)
 */
router.post('/', authenticate, requireRole('ADMIN'), (req, res) => {
  try {
    const { name, icon, color, description } = req.body;
    if (!name || !icon || !color) {
      return res.status(400).json({ success: false, error: 'Name, icon, and color are required' });
    }
    const id = uuidv4();
    db.prepare('INSERT INTO categories (id, name, icon, color, description) VALUES (?, ?, ?, ?, ?)')
      .run(id, name.trim(), icon, color, description || '');
    const cat = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    res.status(201).json({ success: true, category: cat });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create category' });
  }
});

module.exports = router;
