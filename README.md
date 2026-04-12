# ✦ Eventio — Event Management Application

A full-stack Event Management platform built with **React + Express + SQLite**. Complete Sprint 1 implementation covering all 5 user stories: User Registration, Event Creation, Ticket Purchase, Notifications, and Profile Management.

---

## 🚀 Features (Sprint 1 — Complete)

### US-40 — User Registration
- Registration form with full name, email, password
- Input validation (strong password: 6+ chars, uppercase, lowercase, number)
- Duplicate email detection
- JWT authentication with secure password hashing (bcrypt)
- Success/error messages displayed in real-time

### US-41 — Event Creation
- Event creation form (title, date, time, location, price, total tickets, description)
- Server-side validation for all fields
- Events saved to SQLite database
- Event list displayed on home page with creator info
- Edit and delete events (only by creator)

### US-42 — Ticket Purchase
- Browse available events with ticket counts
- Ticket quantity selector (1–10)
- Mock payment gateway with card visualization
- Purchase confirmation receipt with Payment ID
- Available ticket stock decremented on purchase
- "Sold Out" state when tickets are gone

### US-43 — Event Notifications
- In-app notification system with bell badge in navbar
- Notifications triggered when:
  - A new event is created (notifies all other users)
  - An event is updated (notifies all other users)
  - A ticket is purchased (notifies the buyer)
- Mark individual or all notifications as read
- Auto-polling every 15 seconds
- Unread count badge

### US-44 — User Profile Management
- Profile page with avatar, name, email, join date
- Update name
- Change password (requires current password confirmation)
- Form validation and success/error feedback

---

## 🛠 Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 19 (Vite)                     |
| Styling    | Vanilla CSS (glassmorphism, dark mode) |
| Backend    | Node.js + Express.js                |
| Database   | SQLite via better-sqlite3           |
| Auth       | JWT + bcrypt                        |
| HTTP       | Axios                               |
| Routing    | React Router v7                     |

---

## 📁 Project Structure

```
EventManagementApp/
├── backend/
│   ├── src/
│   │   ├── server.js              # Express server entry point
│   │   ├── database.js            # SQLite setup & table creation
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT authentication middleware
│   │   │   └── validate.js        # Input validation middleware
│   │   ├── routes/
│   │   │   ├── auth.js            # POST /register, /login, GET/PUT /profile
│   │   │   ├── events.js          # GET/POST/PUT/DELETE /events
│   │   │   ├── tickets.js         # POST /purchase, GET /my-tickets
│   │   │   └── notifications.js   # GET /, PUT /:id/read, PUT /read-all
│   │   └── services/
│   │       └── notificationService.js  # Notification creation helpers
│   ├── data/
│   │   └── eventio.db             # SQLite database (auto-created)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── main.jsx               # React entry point
│   │   ├── App.jsx                # Router & protected routes
│   │   ├── api.js                 # Axios API service
│   │   ├── AuthContext.jsx         # Auth state management
│   │   ├── index.css              # Premium CSS design system
│   │   ├── components/
│   │   │   └── Navbar.jsx         # Navigation + notifications dropdown
│   │   └── pages/
│   │       ├── EventsPage.jsx     # Event list + purchase modal
│   │       ├── CreateEventPage.jsx # Event creation form
│   │       ├── MyTicketsPage.jsx   # User's purchased tickets
│   │       ├── ProfilePage.jsx    # Profile & password management
│   │       ├── LoginPage.jsx      # Login form
│   │       └── RegisterPage.jsx   # Registration form
│   ├── index.html
│   └── package.json
└── README.md
```

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint            | Auth | Description                  |
|--------|---------------------|------|------------------------------|
| POST   | `/api/auth/register`| No   | Register a new user          |
| POST   | `/api/auth/login`   | No   | Login and get JWT token      |
| GET    | `/api/auth/profile` | Yes  | Get current user's profile   |
| PUT    | `/api/auth/profile` | Yes  | Update name or password      |

### Events
| Method | Endpoint            | Auth | Description                  |
|--------|---------------------|------|------------------------------|
| GET    | `/api/events`       | No   | List all events              |
| GET    | `/api/events/:id`   | No   | Get single event             |
| POST   | `/api/events`       | Yes  | Create a new event           |
| PUT    | `/api/events/:id`   | Yes  | Update event (creator only)  |
| DELETE | `/api/events/:id`   | Yes  | Delete event (creator only)  |

### Tickets
| Method | Endpoint                 | Auth | Description                  |
|--------|--------------------------|------|------------------------------|
| POST   | `/api/tickets/purchase`  | Yes  | Purchase tickets for an event|
| GET    | `/api/tickets/my-tickets`| Yes  | Get user's purchased tickets |

### Notifications
| Method | Endpoint                       | Auth | Description              |
|--------|--------------------------------|------|--------------------------|
| GET    | `/api/notifications`           | Yes  | Get user's notifications |
| PUT    | `/api/notifications/:id/read`  | Yes  | Mark one as read         |
| PUT    | `/api/notifications/read-all`  | Yes  | Mark all as read         |

---

## ⚡ How to Run

### Prerequisites
- **Node.js** v18 or higher ([download](https://nodejs.org))
- No database installation required — SQLite is embedded

### 1. Start the Backend

Open a terminal window:

```bash
cd "C:\Users\aminf\Desktop\EventManagementApp\backend"
npm install
npm run dev
```

You should see:
```
✅ Eventio API running at http://localhost:5000
📦 Database: SQLite (data/eventio.db)
```

### 2. Start the Frontend

Open a **second** terminal window:

```bash
cd "C:\Users\aminf\Desktop\EventManagementApp\frontend"
npm install
npm run dev
```

You should see:
```
VITE ready
➜ Local: http://localhost:5173/
```

### 3. Use the Application

Open your browser to **http://localhost:5173** and:

1. **Register** — Click "Get Started" and create an account
2. **Create Event** — Fill in the event form
3. **Buy Tickets** — Click "Buy Ticket" on any event card
4. **View Tickets** — Go to "Tickets" in the navbar
5. **Check Notifications** — Click the 🔔 bell icon
6. **Edit Profile** — Go to "Profile" to update your info

---

## 🗃 Database Schema

```sql
-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'USER',
  avatar TEXT DEFAULT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Events table
CREATE TABLE events (
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
  creator_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Tickets table
CREATE TABLE tickets (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  quantity INTEGER DEFAULT 1,
  total_price REAL NOT NULL,
  payment_id TEXT NOT NULL,
  status TEXT DEFAULT 'CONFIRMED',
  purchased_at TEXT DEFAULT (datetime('now'))
);

-- Notifications table
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'INFO',
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
```
