# Obsidian Cinema — Product Requirements Document

## Original Problem Statement
Build "Obsidian Cinema" — an installable Windows desktop app (Electron) that scans local/network drives for movie files, fetches metadata and posters from TMDB, and allows playback. A companion web app serves as an account portal for Google auth, Stripe payments ($20 one-time Pro tier), and license key management.

## User Personas
- Movie collectors with large local libraries on multiple drives
- NAS users with media on network-attached storage
- Users who find Plex/Jellyfin too complex for simple browsing and playback

## Core Requirements
- Scan local and shared network directories for movie files (Desktop)
- Fetch movie metadata, posters, and cast from TMDB
- Display library with posters, sorting (13 options), and size toggles (S/M/L)
- Play movies using system default player
- "Recently Deleted" trash with 30-day auto-purge
- Statistics page with charts + cast insights
- Manual poster management (search TMDB, URL, local file)
- Pro tier ($20 one-time) via Stripe, managed through web app
- License key generation and activation
- Auto-update mechanism
- GitHub Actions CI/CD for Windows .exe builds
- AI-powered movie suggestions

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
- Account Dashboard, Upgrade/pricing page
- Public Landing Page with hero, features, pricing, CTA sections
- SEO meta tags
- Marketing materials
- Auto-redirect download endpoint (/api/download/windows)
- Settings page (desktop-only sections hidden)

### Desktop App (Electron — v1.0.8)
- Local/network drive scanning with progress indicators
- TMDB poster/metadata/cast auto-fetch
- One-click playback via default media player
- Advanced sorting (13 options, saved locally)
- Poster size toggle (S/M/L)
- Library statistics page with charts + **Cast Insights** (NEW)
- 18 color themes
- Recently Deleted (30-day trash)
- Manual poster editor (TMDB search, URL, local file)
- Local collections management
- Directory filter tabs & pagination
- Add individual files
- Update Library / rescan directories
- Inline year editing, synopsis on poster hover
- **Cast display in movie detail modal** — top 5 actors with photos, names, characters (NEW)
- **"Fetch Cast" bulk button** — backfill cast data for existing movies (NEW)
- **"Load cast from TMDB" per-movie button** — fetch cast for individual movies (NEW)
- AI Movie Suggestions in detail modal
- "Suggest For Me" sidebar panel
- Poster Fetch Tip popup with "Don't show again"
- License activation, auto-update

### Stats Page Features
- Decade distribution, Rating distribution, Genre distribution
- Library growth timeline, File formats, Directory breakdown
- Top Rated / Lowest Rated lists, Random Movie Picker
- Collection Health & Data Completeness
- **Cast Insights section** (NEW):
  - Most Appearing Actors (top 10)
  - Top-Rated Actors (min 2 films, by avg rating)
  - Genre Chameleons (actors in most different genres)

### Backend API Endpoints
- `POST /api/auth/google_login`
- `POST /api/stripe/create-checkout-session`
- `GET /api/license/my-license`
- `POST /api/license/activate`
- `GET /api/download/windows`
- `DELETE /api/posters/cache`
- `POST /api/ai/suggestions`

## Key Files
- `/app/frontend/src/pages/LocalLibraryPage.jsx` — Desktop library (main feature)
- `/app/frontend/src/pages/StatsPage.jsx` — Statistics + cast insights
- `/app/frontend/src/pages/SettingsPage.jsx` — Settings
- `/app/frontend/src/pages/LandingPage.jsx` — Public landing page
- `/app/backend/server.py` — FastAPI backend

## Backlog (Prioritized)

### P0
- Custom domain setup (user purchasing from GoDaddy — pending)
- Deploy latest changes to production

### P1
- Landing page demo video/screenshots
- Refactor `LocalLibraryPage.jsx` (~2180 lines — critical)

### P2
- Watch party feature
- Mobile companion app
- Auto-fetch movie trailers
- Parental controls and multi-user profiles
- Re-enable referral incentive program
- Marketing campaign
