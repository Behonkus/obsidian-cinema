# Obsidian Cinema — Product Requirements Document

## Original Problem Statement
Build "Obsidian Cinema"—an installable Windows desktop app (Electron) that scans local/network drives for movie files, fetches metadata/posters from TMDB, and allows playback. A companion web app serves as an account portal for Google authentication, Stripe monetization for a Pro tier, and license key generation.

## Tech Stack
- **Frontend:** React, Tailwind CSS, Shadcn UI, Recharts, Custom CSS Keyframes
- **Backend:** FastAPI, official `stripe` Python SDK
- **Desktop:** Electron, electron-store (localStorage)
- **External APIs:** TMDB, OpenAI (via Emergent Key), Stripe
- **CI/CD:** GitHub Actions → Windows `.exe` installer
- **Custom Domain:** `www.obsidiancinema.com`

## What's Been Implemented (Complete)
- Full web app (landing page, account dashboard, Google Auth, Stripe payments)
- Full desktop app (scanning, TMDB metadata/cast, AI recommendations, stats, collections)
- SEO (meta/OG tags, JSON-LD, sitemap.xml, robots.txt)
- Custom color theme picker, daily movie quotes, StatusBar, Fun Effects
- Backup/Restore, file naming popup, Google Auth retry improvements
- Marketing materials, landing page copy
- Free tier enforcement (50 movies, 3 collections)
- TMDB key stored per-user locally (not shared server)
- Auto-download & install updates from Settings page
- License key tied to machine ID (anti-sharing)

## v1.4.8 Changes (March 2026)
- Fixed scroll-to-top on route navigation
- Fixed confetti drift clipping
- "Back to top" button repositioned with text label
- StatusBar poster resize sync, sort indicator removed
- Library page header restructured (title+counts inline, search relocated above grid)
- Renamed "Add Files" → "Add Individual Movies", search placeholder updated
- Landing page screenshots removed, version badge dynamic from package.json
- PRO badge: reads from electron-store directly + localStorage polling
- TMDB API key: fully local per-user storage (no server sharing)
- Free tier limits: 50 movies, 3 collections, enforced at all entry points
- Pro status: stored in `obsidian_cinema_is_pro` localStorage, set during license init, polled by LocalLibraryPage every 300ms
- Auto-download updates in Settings page with progress bar and "Restart & Install" button
- Price corrected to $25 on activation page and account dashboard
- Versions bumped 1.3.9 → 1.4.8

## Known Issues
- "Made with Emergent" badge on production (platform-level, blocked on Emergent support)
- LocalLibraryPage.jsx ~2500 lines (refactoring postponed by user)

## Backlog (Prioritized)
- **P1:** Admin account/role system (admin flag, protected routes)
- **P1:** Admin dashboard with member/user list
- **P1:** License management from admin panel (revoke, reissue, deactivate)
- **P1:** Landing Page Demo (demo video or screenshots)
- **P2:** Custom Domain Root Redirect (obsidiancinema.com → www)
- **P2:** Watch party feature
- **P2:** Mobile companion app
- **P2:** Auto-fetch movie trailers
- **P2:** Parental controls and multi-user profiles

## 3rd Party Integrations
- OpenAI GPT-4o (Emergent LLM Key)
- TMDB (User API Key, stored locally per-user)
- Stripe Payments (User API Key, official SDK)
- SendGrid Emails (User API Key)

## Credentials
- Test User: `billrules@gmail.com`
- Pro License Key: `OBSIDIAN-D9FE-BC22-4AE3-ACAA`
