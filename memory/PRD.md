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

### Web App (Deployed to Production — cinema-hub-402.emergent.host)
- Google OAuth authentication (Emergent-managed)
- Stripe payment flow for $20 Pro tier
- License key generation and management
- Account Dashboard (post-login)
- Upgrade/pricing page
- Public Landing Page with hero, features, pricing, CTA sections
- SEO meta tags (Open Graph, Twitter Card, keywords)
- Marketing materials (blog post, press kit, 6 subreddit-specific posts)
- Auto-redirect download endpoint (/api/download/windows) — serves latest GitHub release
- Settings page cleaned up — desktop-only sections hidden for web users

### Desktop App (Electron — v1.0.6)
- Local/network drive scanning with progress indicators
- TMDB poster/metadata auto-fetch with abort/continue
- One-click playback via default media player
- Advanced sorting (13 options, saved locally)
- Poster size toggle (S/M/L)
- Library statistics page (Recharts)
- 18 color themes (solid, pastel, rainbow)
- Recently Deleted (30-day trash) — moved to Settings > Library Management
- Manual poster editor (TMDB search, URL, local file) with larger poster previews
- Local collections — create, toggle movies, filter by collection
- Directory filter tabs — browse one directory at a time for performance
- Pagination — 100 movies at a time with "Load More"
- Add individual files (not just directories)
- Update Library / rescan directories for changes
- Inline year editing in movie detail modal
- Synopsis on poster hover (slides up from bottom)
- Scroll-to-top button
- Remove confirmation with "don't show again" option
- Poster storage tip for local files
- License activation for Pro features
- Auto-update via electron-updater (latest.yml now included in releases)
- Settings page: Library Stats, Poster Cache management, Collection management
- "Remove" renamed to "Remove from Database"
- Browse Local Drives dialog — fixed overflow, responsive footer buttons

## Pricing
- **Free**: 50 movies, 3 collections
- **Pro**: $20 one-time — unlimited movies, collections, priority support, early access

## Current App Version
- Desktop: 1.0.6
- Production URL: https://cinema-hub-402.emergent.host/
- GitHub: https://github.com/Behonkus/obsidian-cinema

## Key Files
- `/app/frontend/src/pages/LandingPage.jsx` — Public landing page
- `/app/frontend/src/pages/AccountDashboard.jsx` — Post-login dashboard
- `/app/frontend/src/pages/LocalLibraryPage.jsx` — Desktop library (main feature)
- `/app/frontend/src/pages/SettingsPage.jsx` — Settings with library management
- `/app/frontend/src/pages/CollectionsPage.jsx` — Collections (local storage in Electron)
- `/app/frontend/src/components/LocalDirectoryBrowser.jsx` — Directory browser dialog
- `/app/frontend/src/App.js` — Routing logic
- `/app/frontend/public/index.html` — SEO meta tags
- `/app/backend/server.py` — FastAPI backend
- `/app/.github/workflows/build-windows.yml` — CI/CD (builds + creates releases)
- `/app/marketing_materials.md` — Blog, press kit, subreddit posts, posting tips

## Backlog (Prioritized)

### P0
- Custom domain setup (user purchasing domain from GoDaddy)
- Update REACT_APP_BACKEND_URL with custom domain and redeploy

### P1
- Refactor `LocalLibraryPage.jsx` into smaller components/hooks
- Add demo video/screenshots to landing page
- Watch party feature

### P2
- Mobile companion app
- AI-based movie recommendations
- Auto-fetch movie trailers
- Parental controls and multi-user profiles
- Re-enable referral incentive program
