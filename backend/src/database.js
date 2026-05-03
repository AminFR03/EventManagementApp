const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'eventio.db');

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'ATTENDEE',
    avatar TEXT DEFAULT NULL,
    is_suspended INTEGER DEFAULT 0,
    email_prefs TEXT DEFAULT '{"purchase":true,"reminder":true,"updates":true,"newsletter":true}',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    description TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    price REAL DEFAULT 0,
    total_tickets INTEGER DEFAULT 100,
    available_tickets INTEGER DEFAULT 100,
    image TEXT DEFAULT NULL,
    creator_id TEXT NOT NULL,
    category_id TEXT DEFAULT NULL,
    tags TEXT DEFAULT '[]',
    share_count INTEGER DEFAULT 0,
    is_featured INTEGER DEFAULT 0,
    status TEXT DEFAULT 'ACTIVE',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (creator_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    total_price REAL NOT NULL,
    payment_id TEXT NOT NULL,
    status TEXT DEFAULT 'CONFIRMED',
    purchased_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'INFO',
    is_read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    rating INTEGER DEFAULT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS refund_requests (
    id TEXT PRIMARY KEY,
    ticket_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    event_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    admin_note TEXT DEFAULT NULL,
    requested_at TEXT DEFAULT (datetime('now')),
    resolved_at TEXT DEFAULT NULL,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (event_id) REFERENCES events(id)
  );
`);

// Migrate existing users: update role column values
try {
  db.prepare("UPDATE users SET role='ATTENDEE' WHERE role='USER'").run();
} catch (e) { /* ignore */ }

// Add new columns if they don't exist
try {
  db.exec("ALTER TABLE users ADD COLUMN is_suspended INTEGER DEFAULT 0;");
} catch (e) { /* ignore if column already exists */ }

try {
  db.exec("ALTER TABLE users ADD COLUMN email_prefs TEXT DEFAULT '{\"purchase\":true,\"reminder\":true,\"updates\":true,\"newsletter\":true}';");
} catch (e) { /* ignore if column already exists */ }

// Seed default categories if empty
const catCount = db.prepare('SELECT COUNT(*) as c FROM categories').get();
if (catCount.c === 0) {
  const cats = [
    { id: 'cat-1', name: 'Conference',  icon: '🎤', color: '#6366f1', description: 'Professional conferences and summits' },
    { id: 'cat-2', name: 'Concert',     icon: '🎵', color: '#ec4899', description: 'Live music concerts and shows' },
    { id: 'cat-3', name: 'Workshop',    icon: '🛠️', color: '#f59e0b', description: 'Hands-on workshops and training sessions' },
    { id: 'cat-4', name: 'Sports',      icon: '⚽', color: '#10b981', description: 'Sporting events and competitions' },
    { id: 'cat-5', name: 'Networking',  icon: '🤝', color: '#3b82f6', description: 'Networking events and meetups' },
    { id: 'cat-6', name: 'Exhibition',  icon: '🖼️', color: '#8b5cf6', description: 'Art exhibitions and expos' },
    { id: 'cat-7', name: 'Comedy',      icon: '😂', color: '#f97316', description: 'Stand-up comedy and improv shows' },
    { id: 'cat-8', name: 'Food & Drink',icon: '🍷', color: '#ef4444', description: 'Food festivals, tastings, and culinary events' },
  ];
  const insertCat = db.prepare('INSERT INTO categories (id, name, icon, color, description) VALUES (?, ?, ?, ?, ?)');
  const insertMany = db.transaction((cats) => { for (const c of cats) insertCat.run(c.id, c.name, c.icon, c.color, c.description); });
  insertMany(cats);
}

module.exports = db;
