const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { authenticate, generateToken } = require('../middleware/auth');
const { validateRegistration } = require('../middleware/validate');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user account
 */
router.post('/register', validateRegistration, (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if email already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const id = uuidv4();

    db.prepare('INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)')
      .run(id, name.trim(), email.toLowerCase().trim(), hashedPassword);

    const user = db.prepare('SELECT id, name, email, role, avatar, is_suspended, email_prefs, created_at FROM users WHERE id = ?').get(id);
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, error: 'Registration failed. Please try again.' });
  }
});

/**
 * POST /api/auth/login
 * Authenticate a user and return JWT
 */
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const token = generateToken(user);
    const { password: _, ...safeUser } = user;

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Login failed. Please try again.' });
  }
});

/**
 * GET /api/auth/profile
 * Get current user's profile
 */
router.get('/profile', authenticate, (req, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, role, avatar, is_suspended, email_prefs, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
});

/**
 * PUT /api/auth/profile
 * Update user's profile (name, password)
 */
router.put('/profile', authenticate, (req, res) => {
  try {
    const { name, currentPassword, newPassword, emailPrefs } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Update name if provided
    if (name && name.trim().length >= 2) {
      db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name.trim(), req.user.id);
    }

    // Update password if provided
    if (currentPassword && newPassword) {
      const isValid = bcrypt.compareSync(currentPassword, user.password);
      if (!isValid) {
        return res.status(400).json({ success: false, error: 'Current password is incorrect' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
      }
      const hashed = bcrypt.hashSync(newPassword, 10);
      db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, req.user.id);
    }

    // Update email preferences if provided
    if (emailPrefs) {
      db.prepare('UPDATE users SET email_prefs = ? WHERE id = ?').run(emailPrefs, req.user.id);
    }

    const updatedUser = db.prepare('SELECT id, name, email, role, avatar, is_suspended, email_prefs, created_at FROM users WHERE id = ?').get(req.user.id);

    res.json({ success: true, message: 'Profile updated!', user: updatedUser });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

module.exports = router;
