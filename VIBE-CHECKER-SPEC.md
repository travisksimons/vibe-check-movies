# Vibe Checker - AI-Powered Group Preference Discovery

## What It Is
A collaborative web app for groups to discover shared preferences and get AI-generated recommendations. Think of it as a "group compatibility quiz" that synthesizes everyone's tastes into actionable suggestions.

## The Problem It Solves
- Groups struggle to decide on activities (what to watch, where to eat, what to play)
- Individual opinions don't capture the group's collective vibe
- Decision fatigue from endless back-and-forth

## The Solution
A structured quiz that:
1. Gathers individual preferences through "this or that" choices
2. Aggregates responses in real-time
3. Uses AI to synthesize group tastes
4. Delivers personalized recommendations for both the group and individuals

## Core Features

### 1. Session Management
- **Create Session**: Host creates a new session with:
  - Their name (to identify host)
  - Category (movies, games, food, drinks, activities, music, books, travel)
  - Optional location (for location-aware recommendations)
- **Share Link**: Unique session URL to share with friends
- **Participant Tracking**: See who joined in real-time

### 2. Collaborative Quiz
- **AI-Generated Questions**: For each category, the AI generates 10-15 "this or that" pairs that reveal different taste dimensions
  - e.g., for movies: "Alien vs Predator", "LotR vs Star Wars", "Inception vs Matrix"
  - Questions are unique per session
- **Individual Answering**: Each participant answers questions independently
- **Progress Tracking**: See who has completed the quiz
- **Real-time Updates**: Participants see when others join or complete

### 3. AI Synthesis
After everyone completes the quiz, the AI analyzes:
- All individual responses
- Category context
- Location (if provided)

And generates:
- **Group Summary**: 2-3 sentence synthesis of the group's overall taste
- **Ranked Recommendations**: Top 3-5 recommendations with explanations
- **Individual Write-ups**: For each participant:
  - Their taste profile ("You prefer X over Y, gravitating toward...")
  - Who they're most similar to ("You vibe most with [name]")
  - Personalized recommendations based on their choices

### 4. Results Display
- **Group Tab**: Shows collective results (summary, recommendations, everyone's write-ups)
- **Personal Tab**: Shows individual results (your taste profile, your recs, your people)
- **New Session**: Button to start a fresh session

## User Flow

### Host Flow
1. Opens app
2. Enters their name
3. Selects category (e.g., "movies")
4. Optionally adds location (e.g., "Chicago")
5. Clicks "start session"
6. Gets unique shareable link
7. Shares link with group
8. Once people join, clicks "generate questions"
9. Waits for everyone to complete quiz
10. Views AI-generated results

### Guest Flow
1. Opens shared session link
2. Enters their name
3. Clicks "join"
4. Sees who's already in the session
5. Waits for host to generate questions
6. Answers 10-15 "this or that" questions
7. Sees results when everyone is done

## Technical Requirements

### Backend
- **API**: RESTful endpoints for session CRUD, quiz operations
- **Real-time**: WebSocket (Socket.io) for live updates (joins, completions)
- **Database**: Persistent storage for sessions and participants (SQLite or similar)
- **AI Integration**: Call to external AI API for question generation and results synthesis

### Frontend
- **Single Page App**: React or similar framework
- **Mobile-First**: Works great on phones with touch-friendly UI
- **Minimal Design**: Clean, monochrome aesthetic (think Nothing Phone vibes)
- **No Emojis**: Clean, text-based UI throughout
- **Real-time Updates**: Instant feedback when others join/complete

### AI API
- Supports generating JSON-structured responses
- Two main calls:
  1. Question Generation: Given category, produce "this or that" pairs
  2. Results Synthesis: Given all responses, produce group + individual insights

## Example Session

**Host** "Travis" creates a "movies" session, adds location "Chicago", shares link.

**Guests** "Alex" and "Jordan" join.

**Host** clicks "generate questions". AI produces:
- Alien vs Predator
- LotR vs Star Wars
- Inception vs Matrix
- etc. (10-15 pairs)

**Everyone** answers independently:
- Travis: Alien, LotR, Inception...
- Alex: Predator, Star Wars, Matrix...
- Jordan: Alien, Star Wars, Inception...

**AI** analyzes and produces:
- "This group prefers practical effects and practical, grounded stories over CGI spectacles. They lean toward character-driven narratives with strong worldbuilding."
- Recommendations: "Dune", "Arrival", "Mad Max: Fury Road"
- Travis's writeup: "You prefer Alien over Predator, suggesting a taste for horror/sci-fi over pure action. Most similar to Jordan."
- Jordan's writeup: "You prefer Alien over Predator, suggesting a taste for horror/sci-Fi over pure action. Most similar to Travis."

## Design Guidelines
- **Minimal**: Black background, white text, gray accents
- **Monochrome**: No colors except for highlighting selected options
- **Clean Typography**: System fonts, generous whitespace
- **Subtle Animations**: Fade-ins, smooth transitions
- **Touch-Friendly**: Large tap targets for mobile
- **No Emojis**: Clean text-based UI throughout

## Success Metrics
- Groups can quickly reach consensus on decisions
- Recommendations feel personalized and relevant
- Session completion rate is high
- Results spark conversation and discovery

---

**Goal**: Build a tool that makes group decision-making fun, insightful, and effective through structured preference gathering and AI synthesis.