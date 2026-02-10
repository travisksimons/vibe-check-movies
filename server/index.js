import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import Database from 'better-sqlite3';
import { nanoid } from 'nanoid';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (one level up from server/)
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Environment
const IS_PROD = process.env.NODE_ENV === 'production';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];

// API Keys
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

const AI_MODEL = process.env.AI_MODEL || 'hf:moonshotai/Kimi-K2-Instruct-0905';
const SYNTHETIC_API = 'https://api.synthetic.new/v1/chat/completions';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: IS_PROD ? ALLOWED_ORIGINS : "*",
    methods: ["GET", "POST"]
  }
});

// CORS - tightened for production
app.use(cors({
  origin: IS_PROD ? ALLOWED_ORIGINS : '*'
}));
app.use(express.json());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window per IP
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

const createSessionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 sessions per hour per IP
  message: { error: 'Too many sessions created, please try again later.' }
});

app.use('/api/', apiLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Sanitize input to prevent XSS
function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim()
    .slice(0, 50); // Max 50 chars for names
}

// SQLite setup
const db = new Database(path.join(__dirname, 'movies.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    status TEXT DEFAULT 'lobby',
    host_name TEXT,
    results TEXT,
    created_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS participants (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    name TEXT NOT NULL,
    answers TEXT,
    completed INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (session_id) REFERENCES sessions(id)
  );

  CREATE INDEX IF NOT EXISTS idx_session ON participants(session_id);
`);

// Session cleanup - delete sessions older than 24 hours
function cleanupOldSessions() {
  const cutoff = Math.floor(Date.now() / 1000) - (24 * 60 * 60); // 24 hours ago
  try {
    const deleted = db.prepare('DELETE FROM participants WHERE session_id IN (SELECT id FROM sessions WHERE created_at < ?)').run(cutoff);
    const deletedSessions = db.prepare('DELETE FROM sessions WHERE created_at < ?').run(cutoff);
    if (deletedSessions.changes > 0) {
      console.log(`Cleaned up ${deletedSessions.changes} old sessions`);
    }
  } catch (err) {
    console.error('Session cleanup failed:', err);
  }
}

// Run cleanup on startup and every hour
cleanupOldSessions();
setInterval(cleanupOldSessions, 60 * 60 * 1000);

// Curated movie list - TMDB IDs
const CURATED_MOVIES = [
  // Acclaimed crowd-pleasers
  { id: 496243, title: "Parasite" },
  { id: 545611, title: "Everything Everywhere All at Once" },
  { id: 27205, title: "Inception" },
  { id: 238, title: "The Godfather" },
  { id: 155, title: "The Dark Knight" },
  { id: 680, title: "Pulp Fiction" },
  { id: 13, title: "Forrest Gump" },
  { id: 550, title: "Fight Club" },
  { id: 157336, title: "Interstellar" },
  { id: 278, title: "The Shawshank Redemption" },

  // Notable indie/arthouse
  { id: 376867, title: "Moonlight" },
  { id: 313369, title: "La La Land" },
  { id: 398818, title: "Call Me by Your Name" },
  { id: 381288, title: "Lady Bird" },
  { id: 508442, title: "Soul" },
  { id: 38757, title: "Whiplash" },
  { id: 76203, title: "12 Years a Slave" },
  { id: 68718, title: "Django Unchained" },

  // Foreign cinema gems
  { id: 4935, title: "Howl's Moving Castle" },
  { id: 129, title: "Spirited Away" },
  { id: 664, title: "Amélie" },
  { id: 670, title: "Oldboy" },
  { id: 598, title: "City of God" },
  { id: 372058, title: "Your Name" },
  { id: 346, title: "Seven Samurai" },
  { id: 11360, title: "Life is Beautiful" },

  // Recent hits
  { id: 872585, title: "Oppenheimer" },
  { id: 569094, title: "Spider-Man: Across the Spider-Verse" },
  { id: 466420, title: "Killers of the Flower Moon" },
  { id: 346698, title: "Barbie" },

  // Cult classics & genre favorites
  { id: 603, title: "The Matrix" },
  { id: 120, title: "The Lord of the Rings: The Fellowship of the Ring" },
  { id: 769, title: "GoodFellas" },
  { id: 807, title: "Se7en" },
  { id: 297802, title: "Arrival" },
  { id: 264660, title: "Ex Machina" },
  { id: 293660, title: "Deadpool" },
  { id: 284053, title: "Thor: Ragnarok" },

  // Horror/thriller
  { id: 419430, title: "Get Out" },
  { id: 493922, title: "Hereditary" },
  { id: 310131, title: "The Witch" },
  { id: 458220, title: "A Quiet Place" },
  { id: 539681, title: "Midsommar" },

  // Comedy
  { id: 353486, title: "The Grand Budapest Hotel" },
  { id: 22538, title: "Scott Pilgrim vs. the World" },
  { id: 515001, title: "Jojo Rabbit" },
  { id: 466272, title: "Once Upon a Time in Hollywood" }
];

// Fetch movie details from TMDB
async function fetchMovieDetails(tmdbId) {
  if (!TMDB_API_KEY) {
    console.error('TMDB_API_KEY not set');
    return null;
  }
  try {
    const res = await fetch(`${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}`);
    const data = await res.json();
    return {
      id: data.id,
      title: data.title,
      year: data.release_date?.split('-')[0],
      poster: data.poster_path ? `${TMDB_IMAGE_BASE}${data.poster_path}` : null,
      overview: data.overview,
      genres: data.genres?.map(g => g.name) || [],
      rating: data.vote_average,
      runtime: data.runtime
    };
  } catch (err) {
    console.error('TMDB fetch error:', err);
    return null;
  }
}

// Get random movies for quiz
async function getMoviesForQuiz(count = 15) {
  const shuffled = [...CURATED_MOVIES].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);
  const movies = await Promise.all(selected.map(m => fetchMovieDetails(m.id)));
  return movies.filter(m => m !== null);
}

// Call AI API
async function callAI(messages, maxTokens = 1500) {
  const apiKey = process.env.SYNTHETIC_API_KEY;
  if (!apiKey) {
    console.error('SYNTHETIC_API_KEY not set');
    return null;
  }
  try {
    const res = await fetch(SYNTHETIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages,
        max_tokens: maxTokens,
        temperature: 0.8
      })
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (err) {
    console.error('AI API error:', err);
    return null;
  }
}

// Generate movie recommendations
async function generateResults(participants) {
  const participantData = participants.map(p => ({
    name: p.name,
    answers: JSON.parse(p.answers || '{}')
  }));

  const systemPrompt = `You analyze movie swipe data and recommend films for a group.

Each participant has swiped on movies with votes:
- "love" = must watch
- "like" = interested
- "pass" = not for me
- "havent_seen" = neutral

Participants: ${JSON.stringify(participantData)}

Based on patterns in what they loved vs passed, recommend 5 movies they should watch together.

GUIDELINES:
- Find patterns (genre, era, tone, director style)
- Recommend films that match the overlap in tastes
- DON'T just recommend movies they already loved
- Be adventurous - include indie, foreign, documentaries, cult classics
- Each recommendation needs a specific reason tied to their patterns

Output JSON:
{
  "group_summary": "1-2 sentences about the group's movie taste",
  "recommendations": [
    {"item": "Movie Title (Year)", "reason": "why it fits their taste", "rank": 1}
  ],
  "individual_writeups": [
    {
      "name": "Person's name",
      "taste_summary": "Their movie vibe in one sentence",
      "personal_recs": ["Movie 1", "Movie 2"]
    }
  ]
}`;

  const result = await callAI([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: 'Analyze the swipe data and recommend movies.' }
  ], 2000);

  if (!result) {
    return {
      group_summary: 'Could not generate recommendations. Check server configuration.',
      recommendations: [],
      individual_writeups: participantData.map(p => ({
        name: p.name,
        taste_summary: 'Analysis unavailable',
        personal_recs: []
      }))
    };
  }

  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { group_summary: 'Analysis pending', recommendations: [], individual_writeups: [] };
  } catch (err) {
    console.error('Failed to parse results:', err);
    return { group_summary: 'Analysis generated', recommendations: [], individual_writeups: [] };
  }
}

// API Routes

// Get movies for quiz
app.get('/api/movies/quiz', async (req, res) => {
  const count = parseInt(req.query.count) || 15;
  const movies = await getMoviesForQuiz(count);
  if (movies.length === 0) {
    return res.status(503).json({ error: 'Could not fetch movies. Check TMDB API key.' });
  }
  res.json({ movies });
});

// Create session (rate limited to prevent abuse)
app.post('/api/session', createSessionLimiter, (req, res) => {
  const hostName = sanitize(req.body.hostName);
  if (!hostName || hostName.length < 1) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const id = nanoid(8);
  db.prepare('INSERT INTO sessions (id, host_name) VALUES (?, ?)').run(id, hostName);

  const participantId = nanoid(8);
  db.prepare('INSERT INTO participants (id, session_id, name) VALUES (?, ?, ?)').run(participantId, id, hostName);

  res.json({ id, link: `/session/${id}`, participantId });
});

// Get session
app.get('/api/session/:id', (req, res) => {
  const { id } = req.params;
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  const participants = db.prepare('SELECT id, name, completed FROM participants WHERE session_id = ?').all(id);
  const completedCount = participants.filter(p => p.completed).length;
  res.json({ ...session, category: 'movies', mode: 'discover', participants, completedCount });
});

// Join session
app.post('/api/session/:id/join', (req, res) => {
  const { id } = req.params;
  const name = sanitize(req.body.name);
  if (!name || name.length < 1) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const participantId = nanoid(8);
  db.prepare('INSERT INTO participants (id, session_id, name) VALUES (?, ?, ?)').run(participantId, id, name);

  io.to(`session:${id}`).emit('participant_joined', { name });

  const participants = db.prepare('SELECT id, name, completed FROM participants WHERE session_id = ?').all(id);
  res.json({ id: participantId, session: { ...session, category: 'movies', mode: 'discover', participants } });
});

// Start quiz
app.post('/api/session/:id/generate', (req, res) => {
  const { id } = req.params;
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  db.prepare('UPDATE sessions SET status = ? WHERE id = ?').run('collecting', id);
  io.to(`session:${id}`).emit('questions_ready', { mode: 'movies' });
  res.json({ mode: 'movies' });
});

// Submit answers
app.post('/api/session/:id/submit', async (req, res) => {
  const { id } = req.params;
  const { participantId, answers } = req.body;

  const participant = db.prepare('SELECT * FROM participants WHERE id = ? AND session_id = ?').get(participantId, id);
  if (!participant) {
    return res.status(404).json({ error: 'Participant not found' });
  }

  db.prepare('UPDATE participants SET answers = ?, completed = 1 WHERE id = ?').run(JSON.stringify(answers), participantId);

  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id);
  const participants = db.prepare('SELECT * FROM participants WHERE session_id = ?').all(id);
  const allCompleted = participants.every(p => p.completed);

  if (allCompleted) {
    db.prepare('UPDATE sessions SET status = ? WHERE id = ?').run('complete', id);
  }

  io.to(`session:${id}`).emit('answer_submitted', { participantName: participant.name });

  // Generate results when all complete
  if (allCompleted && session.status !== 'complete') {
    const results = await generateResults(participants);
    db.prepare('UPDATE sessions SET results = ?, status = ? WHERE id = ?').run(JSON.stringify(results), 'complete', id);
    io.to(`session:${id}`).emit('results_ready', { results });
  }

  res.json({ success: true, allCompleted });
});

// Get results
app.get('/api/session/:id/results', (req, res) => {
  const { id } = req.params;
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  const participants = db.prepare('SELECT name, answers, completed FROM participants WHERE session_id = ?').all(id);
  const results = session.results ? JSON.parse(session.results) : null;
  res.json({ session, participants, results });
});

// Close voting early
app.post('/api/session/:id/close', async (req, res) => {
  const { id } = req.params;
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const participants = db.prepare('SELECT * FROM participants WHERE session_id = ? AND completed = 1').all(id);
  if (participants.length === 0) {
    return res.status(400).json({ error: 'No completed participants' });
  }

  const results = await generateResults(participants);
  db.prepare('UPDATE sessions SET results = ?, status = ? WHERE id = ?').run(JSON.stringify(results), 'complete', id);
  io.to(`session:${id}`).emit('results_ready', { results });
  res.json({ success: true, results });
});

// Socket.io
io.on('connection', (socket) => {
  socket.on('join_session', (sessionId) => {
    socket.join(`session:${sessionId}`);
  });
  socket.on('leave_session', (sessionId) => {
    socket.leave(`session:${sessionId}`);
  });
});

// Serve static files
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  }
});

const PORT = process.env.PORT || 3002;
httpServer.listen(PORT, () => {
  console.log(`Vibe Check Movies running on port ${PORT}`);
});
