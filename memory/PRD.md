# Obsidian Cinema — Product Requirements Document

## Original Problem Statement
Build "Obsidian Cinema" — an installable Windows desktop app (Electron) that scans local/network drives for movie files, fetches metadata and posters from TMDB, and allows playback. A companion web app serves as an account portal for Google auth, Stripe payments ($20 one-time Pro tier), and license key management.

## User Personas
- Movie collectors with large local libraries on multiple drives
- NAS users with media on network-attached storage
- Users who find Plex/Jellyfin too complex for simple browsing and playback

## Core Requirements
- Scan local and shared network directories for movie files (Desktop)
- Fetch movie metadata and posters from TMDB
- Display library with posters, sorting (13 options), and size toggles (S/M/L)
- Play movies using system default player
- "Recently Deleted" trash with 30-day auto-purge
- Statistics page with charts (decade, rating, genre, growth, format, directory, random picker)
- Manual poster management (search TMDB, URL, local file)
- Pro tier ($20 one-time) via Stripe, managed through web app
- License key generation and activation
- Auto-update mechanism
- GitHub Actions CI/CD for Windows .exe builds
- AI-powered movie suggestions ("If you liked this, you might also enjoy...")

## Architecture
- **Web App**: React + FastAPI + MongoDB (account portal, payments, license keys)
- **Desktop App**: Electron + electron-store (movie library, local scanning, playback)
- **External APIs**: TMDB, Stripe, Google OAuth (Emergent-managed), OpenAI GPT-4.1-mini (via Emergent LLM key)
- **CI/CD**: GitHub Actions for Windows installer builds

## What's Been Implemented

### Web App (Deployed)
- Google OAuth authentication (Emergent-managed)
- Stripe payment flow for $20 Pro tier
- License key generation and management
- Account Dashboard (post-login)
- Upgrade/pricing page
- Public Landing Page with hero, features, pricing, CTA sections
- SEO meta tags (Open Graph, Twitter Card, keywords)
- Marketing materials (blog post, press kit, 6 subreddit-specific posts)
- Auto-redirect download endpoint (/api/download/windows)
- Settings page (desktop-only sections hidden for web users)

### Desktop App (Electron)
- Local/network drive scanning with progress indicators
- TMDB poster/metadata auto-fetch with abort/continue
- One-click playback via default media player
- Advanced sorting (13 options, saved locally)
- Poster size toggle (S/M/L)
- Library statistics page (decade, rating, genre, growth, format, directory, top/lowest rated, random picker, collection health)
- 18 color themes
- Recently Deleted (30-day trash)
- Manual poster editor (TMDB search, URL, local file)
- Local collections management
- Directory filter tabs & pagination
- Add individual files
- Update Library / rescan directories
- Inline year editing
- Synopsis on poster hover
- Scroll-to-top button
- Remove confirmation with "don't show again"
- License activation for Pro features
- Auto-update via electron-updater
- **AI Movie Suggestions** — GPT-4.1-mini powered "If you liked this..." feature in movie detail modal (NEW)

### Backend API Endpoints
- `POST /api/auth/google_login`
- `POST /api/stripe/create-checkout-session`
- `GET /api/license/my-license`
- `POST /api/license/activate`
- `GET /api/download/windows`
- `DELETE /api/posters/cache`
- `POST /api/ai/suggestions` (NEW — AI movie recommendations)

## Pricing
- **Free**: 50 movies, 3 collections
- **Pro**: $20 one-time — unlimited movies, collections, priority support, early access

## Key Files
- `/app/frontend/src/pages/LocalLibraryPage.jsx` — Desktop library (main feature + AI suggestions)
- `/app/frontend/src/pages/StatsPage.jsx` — Statistics page with charts
- `/app/frontend/src/pages/SettingsPage.jsx` — Settings with library management
- `/app/frontend/src/pages/LandingPage.jsx` — Public landing page
- `/app/frontend/src/pages/AccountDashboard.jsx` — Post-login dashboard
- `/app/frontend/src/pages/CollectionsPage.jsx` — Collections
- `/app/frontend/src/components/LocalDirectoryBrowser.jsx` — Directory browser dialog
- `/app/frontend/src/App.js` — Routing logic
- `/app/backend/server.py` — FastAPI backend (includes AI suggestions endpoint)
- `/app/.github/workflows/build-windows.yml` — CI/CD

## Backlog (Prioritized)

### P0
- Custom domain setup (user purchasing from GoDaddy — pending)
- Update REACT_APP_BACKEND_URL with custom domain and redeploy

### P1
- Landing page demo video/screenshots
- Refactor `LocalLibraryPage.jsx` into smaller components/hooks

### P2
- Watch party feature
- Mobile companion app
- Auto-fetch movie trailers
- Parental controls and multi-user profiles
- Re-enable referral incentive program
- Marketing campaign (subreddit posts)
