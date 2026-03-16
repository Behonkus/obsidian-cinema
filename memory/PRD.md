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
- Statistics page with charts (decade, rating, genre)
- Manual poster management (search TMDB, URL, local file)
- Pro tier ($20 one-time) via Stripe, managed through web app
- License key generation and activation
- Auto-update mechanism
- GitHub Actions CI/CD for Windows .exe builds

## Architecture
- **Web App**: React + FastAPI + MongoDB (account portal, payments, license keys)
- **Desktop App**: Electron + electron-store (movie library, local scanning, playback)
- **External APIs**: TMDB, Stripe, Google OAuth (Emergent-managed)
- **CI/CD**: GitHub Actions for Windows installer builds

## What's Been Implemented

### Web App (Deployed to Production)
- Google OAuth authentication (Emergent-managed)
- Stripe payment flow for $20 Pro tier
- License key generation and management
- Account Dashboard (post-login)
- Upgrade/pricing page
- **Public Landing Page** (for non-authenticated users) — Mar 2026
- **SEO meta tags** (Open Graph, Twitter Card, keywords) — Mar 2026
- **Marketing materials** (blog post, press kit, social snippets) — Mar 2026

### Desktop App (Electron)
- Local/network drive scanning with progress indicators
- TMDB poster/metadata auto-fetch with abort/continue
- One-click playback via default media player
- Advanced sorting (13 options, saved locally)
- Poster size toggle (S/M/L)
- Library statistics page (Recharts)
- 18 color themes (solid, pastel, rainbow)
- Recently Deleted (30-day trash)
- Manual poster editor (TMDB search, URL, local file)
- License activation for Pro features
- Auto-update via electron-updater
- Settings page (appearance, library management)

## Pricing
- **Free**: 50 movies, 3 collections
- **Pro**: $20 one-time — unlimited movies, collections, priority support, early access

## Key Files
- `/app/frontend/src/pages/LandingPage.jsx` — Public landing page
- `/app/frontend/src/pages/AccountDashboard.jsx` — Post-login dashboard
- `/app/frontend/src/pages/LocalLibraryPage.jsx` — Desktop library (1000+ lines)
- `/app/frontend/src/App.js` — Routing logic
- `/app/frontend/public/index.html` — SEO meta tags
- `/app/backend/server.py` — FastAPI backend
- `/app/.github/workflows/build-windows.yml` — CI/CD
- `/app/marketing_materials.md` — Blog post, press kit, social snippets

## Backlog (Prioritized)

### P0
- User testing of new desktop build (trigger GitHub Actions, test .exe)
- Public announcement (use marketing materials)

### P1
- Refactor `LocalLibraryPage.jsx` into smaller components/hooks
- Watch party feature

### P2
- Mobile companion app
- AI-based movie recommendations
- Auto-fetch movie trailers
- Parental controls and multi-user profiles
- Re-enable referral incentive program
