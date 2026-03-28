# Obsidian Cinema — Product Requirements Document

## Original Problem Statement
Build "Obsidian Cinema"—an installable Windows desktop app (Electron) that scans local/network drives for movie files, fetches metadata/posters from TMDB, and allows playback. A companion web app serves as an account portal for Google authentication, Stripe monetization for a Pro tier, and license key generation.

## Core Requirements
- Scan local and shared network directories for movie files (Desktop App)
- Fetch movie metadata (including cast) and posters from TMDB
- Provide a statistics page with charts about the movie library
- Allow manual metadata management (search, URL, local file, edit title/synopsis, reset)
- Monetize with a "Pro" tier using Stripe, managed through the web app
- Generate license keys for Pro users
- Implement an auto-update mechanism for the desktop application
- Build the installable Windows installer via GitHub Actions
- Provide AI-based movie recommendations from the user's local library
- Enable Backup & Restore capabilities (JSON export/import)

## Tech Stack
- **Frontend:** React, Tailwind CSS, Shadcn UI, Recharts, Custom CSS Keyframes
- **Backend:** FastAPI, official `stripe` Python SDK
- **Desktop:** Electron, electron-store (localStorage)
- **External APIs:** TMDB, OpenAI (via Emergent Key), Stripe
- **CI/CD:** GitHub Actions → Windows `.exe` installer

## Custom Domain
- Production: `www.obsidiancinema.com`

## What's Been Implemented
- Full web app (landing page, account dashboard, Google Auth, Stripe payments)
- Full desktop app (directory scanning, TMDB metadata/cast, AI recommendations, stats, collections)
- SEO audit (meta/OG tags, JSON-LD, sitemap.xml, robots.txt)
- Activity-based AI suggestion engine
- 10+ fun stats on Stats Page
- Custom color theme picker (Hex to HSL)
- Daily movie quotes (179 curated)
- Persistent bottom StatusBar (version, grid size toggle, theme picker, PRO badge, online status, active filter)
- Fun Effects (confetti favorites, popcorn empty states, clapperboard loaders, milestone fireworks, poster shimmer)
- Backup/Restore including Favorites and Activity data
- File naming convention reminder popup
- Google Auth reliability improvements (retry loops)
- Landing page (clean copy + feature cards, no screenshots)
- Marketing materials document

## v1.4.1 Changes (March 2026)
- Fixed scroll-to-top on route navigation (ScrollToTop component in App.js)
- Fixed confetti drift clipping (moved confetti outside overflow-hidden containers)
- Repositioned "Back to top" button above StatusBar with "Back to top" text label
- Fixed StatusBar poster resize sync with LocalLibraryPage grid (storage event dispatch)
- Restructured library page header: title + counts inline, search bar relocated below actions above movie grid
- Renamed "Add Files" to "Add Individual Movies"
- Search bar clear button changed from X icon to "Clear" text
- Removed sort indicator from StatusBar (persistent sync issue)
- Removed screenshot images from landing page for cleaner look
- Landing page version badge now reads dynamically from package.json
- PRO badge on StatusBar made more resilient (checks license object, not just server validation)
- Bumped through versions 1.3.9 → 1.4.0 → 1.4.1

## Known Issues
- "Made with Emergent" badge on production (platform-level, blocked on Emergent support)
- LocalLibraryPage.jsx is ~2400 lines (refactoring postponed by user decision)

## Backlog (Prioritized)
- **P1:** Admin account/role system (admin flag, protected routes)
- **P1:** Admin dashboard with member/user list
- **P1:** License management from admin panel (revoke, reissue, deactivate)
- **P1:** Landing Page Demo (demo video or screenshots in hero section)
- **P2:** Custom Domain Root Redirect (obsidiancinema.com → www.obsidiancinema.com)
- **P2:** Watch party feature
- **P2:** Mobile companion app
- **P2:** Auto-fetch movie trailers
- **P2:** Parental controls and multi-user profiles

## 3rd Party Integrations
- OpenAI GPT-4o (Emergent LLM Key)
- TMDB (User API Key)
- Stripe Payments (User API Key, official SDK)
- SendGrid Emails (User API Key)

## Credentials
- Test User: `billrules@gmail.com`
- Pro License Key: `OBSIDIAN-D9FE-BC22-4AE3-ACAA`
