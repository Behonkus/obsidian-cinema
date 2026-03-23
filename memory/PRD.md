# Obsidian Cinema — Product Requirements Document

## Original Problem Statement
Build "Obsidian Cinema" — an installable Windows desktop app (Electron) that scans local/network drives for movie files, fetches metadata and posters from TMDB, and allows playback. A companion web app serves as an account portal for Google auth, Stripe payments ($20 one-time Pro tier), and license key management.

## Architecture
- **Web App**: React + FastAPI + MongoDB (account portal, payments, license keys)
- **Desktop App**: Electron + electron-store (movie library, local scanning, playback)
- **External APIs**: TMDB, Stripe, Google OAuth (Emergent-managed), OpenAI GPT-4.1-mini (via Emergent LLM key)
- **CI/CD**: GitHub Actions for Windows installer builds

## What's Been Implemented

### Web App (Deployed)
- Google OAuth authentication
- Stripe payment flow for $20 Pro tier
- License key generation and management
- Account Dashboard with Download Guide Modal (NEW)
- Public Landing Page with hero, features, pricing, CTA
- SEO meta tags, marketing materials
- Download endpoint (/api/download/windows) — now prefers .exe over .zip

### Desktop App (Electron — v1.1.5)
- Local/network drive scanning
- TMDB poster/metadata/cast auto-fetch
- One-click playback
- Advanced sorting (13 options), poster size toggle (S/M/L)
- Stats page with charts + Cast Insights (Most Appearing Actors, Top-Rated Actors, Genre Chameleons)
- 18 color themes, Recently Deleted trash
- Manual poster editor, local collections
- Directory filter tabs & pagination, individual file import
- Cast display in movie detail modal (top 5 actors)
- "Fetch Cast" bulk button + per-movie "Load cast" button
- AI Movie Suggestions (activity-weighted, genre-filtered) — detail modal + "Suggest For Me" sidebar
- Poster Fetch Tip popup with "Don't show again"
- License activation, auto-update
- Editable movie titles, year & synopsis; reset/re-fetch metadata
- Centralized directory management (rename/remove paths)
- Backup & Restore wizard (rolling auto-backups + JSON export/import)
- Expandable "Missing Metadata/Posters" lists in Stats & Settings
- Updated "About Obsidian Cinema" features list (v1.1.4)

### CI/CD
- GitHub Actions builds .exe, zips it for releases (avoids SmartScreen)
- Manual triggers with version input
- Auto-creates GitHub releases

### Backend API Endpoints
- `POST /api/auth/google_login`
- `POST /api/stripe/create-checkout-session`
- `GET /api/license/my-license`, `POST /api/license/activate`
- `GET /api/download/windows` — prefers .exe over .zip
- `DELETE /api/posters/cache`
- `POST /api/ai/suggestions`

## Key Files
- `/app/frontend/src/pages/LocalLibraryPage.jsx` — Desktop library main
- `/app/frontend/src/pages/StatsPage.jsx` — Statistics + cast insights
- `/app/frontend/src/components/DownloadGuideModal.jsx` — Install guide modal (NEW)
- `/app/frontend/src/pages/AccountDashboard.jsx` — Account + download
- `/app/frontend/src/pages/LandingPage.jsx` — Public landing
- `/app/backend/server.py` — FastAPI backend
- `/app/.github/workflows/build-windows.yml` — CI/CD

## Backlog (Prioritized)

### P0
- Custom domain setup (user purchasing from GoDaddy — pending)
- Deploy latest changes to production

### P1
- Landing page demo video/screenshots
- Refactor `LocalLibraryPage.jsx` (~2180 lines)

### P2
- Watch party feature
- Mobile companion app
- Auto-fetch movie trailers
- Parental controls and multi-user profiles
- Re-enable referral incentive program
- Marketing campaign
