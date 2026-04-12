/**
 * Validation helpers for input sanitization
 */

function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function isStrongPassword(password) {
  // Minimum 6 chars, at least 1 uppercase, 1 lowercase, 1 number
  return password.length >= 6 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password);
}

function validateRegistration(req, res, next) {
  const { name, email, password } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push('Full name must be at least 2 characters');
  }
  if (!email || !isValidEmail(email)) {
    errors.push('A valid email address is required');
  }
  if (!password || !isStrongPassword(password)) {
    errors.push('Password must be at least 6 characters with 1 uppercase, 1 lowercase, and 1 number');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }
  next();
}

function validateEvent(req, res, next) {
  const { title, description, location, date, time } = req.body;
  const errors = [];

  if (!title || title.trim().length < 3) errors.push('Event title must be at least 3 characters');
  if (!description || description.trim().length < 10) errors.push('Description must be at least 10 characters');
  if (!location || location.trim().length < 2) errors.push('Location is required');
  if (!date) errors.push('Event date is required');
  if (!time) errors.push('Event time is required');

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }
  next();
}

function validateTicketPurchase(req, res, next) {
  const { eventId, quantity } = req.body;
  const errors = [];

  if (!eventId) errors.push('Event ID is required');
  if (!quantity || quantity < 1 || quantity > 10) errors.push('Quantity must be between 1 and 10');

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }
  next();
}

module.exports = { validateRegistration, validateEvent, validateTicketPurchase };
