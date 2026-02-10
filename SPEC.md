# Vibe Checker v2 - Project Specification

## Overview
A collaborative preference discovery tool. Host creates a session, invites friends, everyone does a "this or that" quiz, and AI generates personalized recommendations for both the group and individuals.

## Core Flow
1. **Host** creates session: name + category + optional location
2. **Host** shares link with friends
3. **Participants** join: enter name, join session
4. **Host** generates AI-powered "this or that" quiz questions
5. **Everyone** completes quiz (10-15 questions)
6. **AI** analyzes results and generates:
   - Group synthesis: taste summary + ranked recommendations
   - Individual write-ups: personal preferences + closest match + personalized recs

## Tech Stack
- **Frontend**: React 18, Vite 5, Tailwind CSS 3.4
- **Backend**: Node.js, Express 4, Socket.io 4
- **Database**: SQLite (better-sqlite3)
- **Real-time**: Socket.io for live updates
- **AI**: synthetic.new API with `hf:moonshotai/Kimi-K2-Instruct-0905`

## Database Schema

### sessions table
```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  location TEXT,
  status TEXT DEFAULT 'lobby' | 'collecting' | 'complete',
  host_name TEXT NOT NULL,
  questions TEXT,           -- JSON array of questions
  results TEXT,             -- JSON object with AI results
  created_at INTEGER DEFAULT (unixepoch())
);
```

### participants table
```sql
CREATE TABLE participants (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  name TEXT NOT NULL,
  answers TEXT,             -- JSON object mapping question_id to choice
  completed INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);
```

## API Endpoints

### Create Session
`POST /api/session`
```json
// Request body
{
  "hostName": "Travis",
  "category": "movies",
  "location": "Chicago"
}

// Response
{ "id": "ABC12345", "link": "/session/ABC12345" }
```

### Get Session
`GET /api/session/:id`
```json
// Response
{
  "id": "ABC12345",
  "category": "movies",
  "location": "Chicago",
  "status": "lobby",
  "host_name": "Travis",
  "questions": [...],
  "participants": [
    {"id": "...", "name": "Alex", "completed": 1}
  ],
  "completedCount": 1,
  "waitingCount": 0
}
```

### Join Session
`POST /api/session/:id/join`
```json
// Request body
{ "name": "Alex" }

// Response
{ "id": "PARTICIPANT123", "name": "Alex", "session": {...} }
```

### Generate Questions
`POST /api/session/:id/generate`

Uses AI to generate 12 "this or that" questions for the category. Emits socket event `questions_ready` to all participants.

### Submit Quiz
`POST /api/session/:id/submit`
```json
// Request body
{
  "participantId": "PARTICIPANT123",
  "answers": {
    "1": "optionA",
    "2": "optionB",
    ...
  }
}

// Response
{ "success": true, "allCompleted": false }
```

### Get Results
`GET /api/session/:id/results`
```json
// Response
{
  "session": {...},
  "participants": [...],
  "results": {
    "group_summary": "The group prefers...",
    "recommendations": [
      {"item": "...", "reason": "...", "rank": 1}
    ],
    "individual_writeups": [
      {
        "name": "Travis",
        "taste_summary": "You prefer...",
        "most_similar_to": "Alex",
        "personal_recs": ["...", "..."]
      }
    ]
  }
}
```

## Socket.io Events

### Client → Server
- `join_session` - Join a session room
- `leave_session` - Leave a session room

### Server → Client
- `questions_ready` - New questions generated
- `participant_joined` - Someone joined
- `answer_submitted` - Someone completed quiz
- `results_ready` - All done, results ready

## Frontend Pages/Components

### Landing.jsx
- Step 1: Enter host name
- Step 2: Select category (movies, games, food, drinks, activities, music, books, travel)
- Step 3: Optional location
- Button: "start session"

### SessionLobby.jsx
- If host: show share link, participant list, "generate questions" button
- If guest: show participant list, waiting status or "start quiz" button

### Quiz.jsx
- Show progress bar
- Show "this or that" question (one at a time)
- Tap left or right option
- Navigate between questions
- Submit when done

### Results.jsx
- Tab navigation: "group" vs "yours"
- Group tab: summary, ranked recommendations, all writeups
- Personal tab: your taste summary, personal recs, closest match

## AI Prompts

### Question Generation
```
You are a preference discovery expert. Generate 12 "this or that" choice pairs for a {category} quiz.

Requirements:
- Each pair should reveal different taste dimensions
- Mix classics vs modern, mainstream vs niche
- Avoid overly similar options
- Return ONLY a JSON array:
[
  {"id": 1, "left": "option A", "right": "option B", "dimension": "what this reveals"}
]
```

### Results Generation
```
You are a preference analysis expert. Analyze group quiz results.

Context:
- Category: {category}
- Host location: {location}
- Participants: {participantData}

Output format (JSON):
{
  "group_summary": "2-3 sentence synthesis",
  "recommendations": [
    {"item": "...", "reason": "...", "rank": 1}
  ],
  "individual_writeups": [
    {
      "name": "...",
      "taste_summary": "...",
      "most_similar_to": "...",
      "personal_recs": ["...", "..."]
    }
  ]
}
```

## Known Issues / Fixes Applied

1. **Host workflow bug** (FIXED): Host was being asked to join their own session.
   - Solution: Added `isHost` state in App.jsx, track separately from participant flow
   - Host flow: create session → lobby (direct)
   - Guest flow: join session → lobby

2. **URL parsing bug** (FIXED in v1): Trailing slashes and query params not handled.
   - Solution: Strip trailing slashes and query params before extracting ID

3. **Copy link** (FIXED in v1): Used `window.location.href` which could be unreliable.
   - Solution: Explicitly construct URL: `${window.location.origin}/poll/${id}`

## Running the Project

```bash
# Install dependencies
cd vibe-checker-v2
npm install
cd server && npm install
cd ../client && npm install

# Build client
cd client && npm run build

# Start server (serves API + static files)
cd server && node index.js
# Or for development with hot reload:
cd client && npm run dev  # port 5174
cd server && node index.js  # port 3001
```

## Environment Variables
- `SYNTHETIC_API_KEY` - API key for synthetic.new (currently demo-key for testing)
- `PORT` - Server port (default: 3001)

## Key Files
- `/server/index.js` - Express server, API routes, Socket.io, AI integration
- `/client/src/App.jsx` - Main app, routing, state management
- `/client/src/components/Landing.jsx` - Session creation flow
- `/client/src/components/SessionLobby.jsx` - Lobby UI
- `/client/src/components/Quiz.jsx` - Quiz interface
- `/client/src/components/Results.jsx` - Results display

## Current Status
- API and basic UI working
- Host flow: create session → lobby (working)
- Guest flow: join session → lobby (working)
- Quiz generation: AI prompts configured, needs API key for full functionality
- Results generation: AI prompts configured, needs API key for full functionality

## Next Steps
1. Configure real synthetic.new API key for AI features
2. Deploy to live server for mobile testing
3. Add more category-specific AI question templates
4. Add session expiration/cleanup logic
5. Add rate limiting for API