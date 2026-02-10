# Vibe Check Movies

Find movies your group will love. Swipe on films, get AI-powered recommendations.

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/vibe-check-movies?referralCode=travis)

## Quick Deploy

Click the button above, then add these environment variables:
- `TMDB_API_KEY` - Get one free at [themoviedb.org](https://www.themoviedb.org/settings/api)
- `SYNTHETIC_API_KEY` - Your Synthetic.new API key
- `NODE_ENV` - Set to `production`

## Local Development

```bash
# Install dependencies
cd client && npm install && cd ../server && npm install && cd ..

# Create .env file
cp .env.example .env
# Add your API keys to .env

# Run dev server
npm run dev
```

## How It Works

1. Create a session and share the link
2. Everyone swipes through ~15 curated movies (love/like/pass/haven't seen)
3. AI analyzes group taste patterns and recommends films everyone will enjoy
