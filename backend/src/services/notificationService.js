const db = require('../database');
const { v4: uuidv4 } = require('uuid');

/**
 * Send a notification to a single user
 */
function notifyUser(userId, title, message, type = 'INFO') {
  const id = uuidv4();
  db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, userId, title, message, type);
}

/**
 * Send a notification to ALL users except the sender
 */
function notifyAllExcept(senderId, title, message, type = 'INFO') {
  const users = db.prepare('SELECT id FROM users WHERE id != ?').all(senderId);
  const insert = db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertMany = db.transaction((users) => {
    for (const user of users) {
      insert.run(uuidv4(), user.id, title, message, type);
    }
  });
  insertMany(users);
}

module.exports = { notifyUser, notifyAllExcept };
