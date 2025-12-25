# Audiora – AI-Powered Music Player

**Tagline:** Your AI-powered music DJ — personalized or on-the-fly.

## High-Level Overview

Audiora is composed of a **Next.js frontend**, a **NestJS backend**, AI integration via **OpenAI API**, music streaming via **Audius API**, and an optional **database** for logged-in users’ play history. The app supports both guest users and optional Google OAuth login for personalized AI DJ playlists.

```
          +-----------------------+
          |      User Browser     |
          | (Next.js Frontend)   |
          +----------+------------+
                     |
        HTTP Requests | REST API
                     |
          +----------v------------+
          |    NestJS Backend     |
          | (API + AI DJ Logic)  |
          +----------+------------+
                     |
      +--------------+----------------+
      |                               |
+-----v-------+                 +-----v-------+
| Audius API  |                 | OpenAI API  |
| (Streaming) |                 | (AI DJ)     |
+-------------+                 +-------------+
                     |
          +----------v------------+
          |   Database (Optional) |
          | Users + Play History  |
          +----------------------+
```

## Components

### Frontend (Next.js + shadcn/ui)
- Displays music player UI, playlists, and AI DJ interface.
- Plays tracks using `<audio>` tags sourced from Audius API.
- Supports **optional Google OAuth login** for personalized playlists.
- Deployed on **Vercel** with CI/CD via GitHub Actions.

### Backend (NestJS)
- Handles REST API endpoints:
  - `/tracks?query=xyz` – fetch tracks from Audius.
  - `/playlist/ai` – generate AI DJ playlists (generic or personalized).
  - `/user/history` – log played tracks for logged-in users.
  - `/auth/google` – handle Google OAuth login.
- Issues **JWT tokens** for authenticated users.
- Optionally stores user play history in a database (Postgres, MongoDB).
- Deployed on **Railway** with CI/CD automation.

### AI DJ (OpenAI API)
- Generates playlist suggestions:
  - For guests: generic playlists.
  - For logged-in users: personalized playlists based on play history.
- Backend maps AI suggestions to Audius track IDs and stream URLs.

### Music Streaming (Audius API)
- Provides free, fully playable tracks.
- No Audius account required for playback.
- Backend fetches metadata and stream URLs for frontend use.

### Database (Optional)
- Stores users (Google OAuth ID, email) and play history.
- Enables personalized AI DJ features.
- Minimal schema for easy management and DevOps demonstration.

### CI/CD & DevOps
- **Frontend:** Lint, build, test, and deploy automatically to Vercel.
- **Backend:** Lint, build, test, and deploy automatically to Railway.
- **Secrets / Env Vars:** GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, JWT_SECRET, OPENAI_API_KEY, AUDIOUS_API_URL, DATABASE_URL.
- Optional caching, health endpoints, HTTPS, and JWT security.
- Environment separation (dev/prod) supported in deployments.

## User Flow

**Guest User:**  
`User → Frontend → Request AI DJ playlist → Backend → OpenAI → Backend maps to Audius tracks → Audio plays`

**Logged-in User (Google OAuth):**  
`User → Google OAuth → Backend issues JWT → User plays tracks → Backend logs history → AI DJ generates personalized playlist → Audio plays`

## Summary

Audiora allows users to enjoy music instantly as a guest, while logged-in users can access **personalized AI DJ playlists**. The infra is fully **CI/CD-ready**, secure, and scalable, demonstrating junior-level DevOps practices like automated deployment, secret management, environment separation, and optional database usage for user personalization.

