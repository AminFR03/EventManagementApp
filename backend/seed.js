const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const db = new Database(path.join(__dirname, 'data/eventio.db'));

// Create user Donia Bahloul (ORGANIZER)
const doniaId = uuidv4();
const hashedPassword = bcrypt.hashSync('password123', 10);
db.prepare(`
  INSERT INTO users (id, name, email, password, role) 
  VALUES (?, ?, ?, ?, ?)
`).run(doniaId, 'Donia Bahloul', 'donia@example.com', hashedPassword, 'ORGANIZER');

const categories = db.prepare('SELECT * FROM categories').all();

const eventsToSeed = [
  { title: 'Global Tech Summit 2026', desc: 'Join industry leaders for the biggest tech conference of the year.', loc: 'San Francisco, CA', date: '2026-06-15', time: '09:00', price: 299, t: 500, cat: 'Conference', tags: 'tech,summit,ai' },
  { title: 'Summer Jazz Festival', desc: 'A weekend of smooth jazz and great vibes outdoors.', loc: 'Central Park, NY', date: '2026-07-10', time: '16:00', price: 45, t: 1000, cat: 'Concert', tags: 'music,jazz,festival' },
  { title: 'Web Development Bootcamp', desc: 'Learn modern web dev with React and Node.js in this intensive workshop.', loc: 'Austin, TX', date: '2026-05-20', time: '10:00', price: 150, t: 50, cat: 'Workshop', tags: 'coding,web,react' },
  { title: 'City Marathon 2026', desc: 'Annual city marathon. Runners of all levels welcome!', loc: 'Chicago, IL', date: '2026-08-05', time: '07:00', price: 0, t: 5000, cat: 'Sports', tags: 'running,fitness' },
  { title: 'Founders Networking Night', desc: 'Connect with local startup founders and investors.', loc: 'London, UK', date: '2026-05-25', time: '19:00', price: 20, t: 150, cat: 'Networking', tags: 'startup,business' },
  { title: 'Modern Art Expo', desc: 'Featuring contemporary artists from around the world.', loc: 'Paris, France', date: '2026-06-01', time: '10:00', price: 15, t: 300, cat: 'Exhibition', tags: 'art,gallery' },
  { title: 'Standup Comedy Special', desc: 'An evening of non-stop laughs with top comedians.', loc: 'Los Angeles, CA', date: '2026-05-30', time: '20:30', price: 35, t: 200, cat: 'Comedy', tags: 'comedy,standup' },
  { title: 'International Food Fest', desc: 'Taste dishes from over 50 countries in one place!', loc: 'Toronto, Canada', date: '2026-07-22', time: '12:00', price: 10, t: 2000, cat: 'Food & Drink', tags: 'food,festival' },
  { title: 'AI in Healthcare', desc: 'Exploring the future of medicine with artificial intelligence.', loc: 'Boston, MA', date: '2026-09-10', time: '09:00', price: 199, t: 400, cat: 'Conference', tags: 'ai,health' },
  { title: 'Indie Rock Concert', desc: 'Local bands playing original music all night long.', loc: 'Seattle, WA', date: '2026-06-12', time: '21:00', price: 25, t: 300, cat: 'Concert', tags: 'music,indie' }
];

const insertEvent = db.prepare(`
  INSERT INTO events (id, title, description, location, date, time, price, total_tickets, available_tickets, creator_id, category_id, tags)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

eventsToSeed.forEach(e => {
  const cat = categories.find(c => c.name === e.cat);
  insertEvent.run(
    uuidv4(), e.title, e.desc, e.loc, e.date, e.time, e.price, e.t, e.t, doniaId, cat ? cat.id : null, JSON.stringify(e.tags.split(','))
  );
});

console.log('Seeded database successfully with user Donia Bahloul and ' + eventsToSeed.length + ' events.');
