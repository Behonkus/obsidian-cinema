# Obsidian Cinema — Product Requirements Document

## Overview
Obsidian Cinema is an installable Windows desktop app (Electron) that scans local/network drives for movie files, fetches metadata/posters from TMDB, and allows playback. A companion web app at www.obsidiancinema.com serves as an account portal for Google authentication, Stripe monetization for a Pro tier, and license key generation.

## Architecture
- **Frontend:** React, Tailwind CSS, Shadcn UI, Recharts, Framer Motion
- **Backend:** FastAPI, MongoDB, Emergent LLM integration
- **Desktop:** Electron with electron-store (localStorage)
- **CI/CD:** GitHub Actions builds .exe, zips for releases
- **Domain:** www.obsidiancinema.com (linked via Emergent deployment)

## What's Been Implemented

### Web App
- Landing page with features, pricing (Free/Pro), CTAs
- Google Auth (Emergent-managed)
- Stripe payments for Pro tier ($20 one-time)
- License key generation and activation
- Download guide modal for novice users
- SEO: meta tags, OG/Twitter cards, JSON-LD structured data, sitemap.xml, robots.txt

### Desktop App (Electron — v1.2.2)
- Local/network drive scanning
- TMDB poster/metadata/cast auto-fetch
- One-click playback
- Advanced sorting (13 options), poster size toggle (S/M/L)
- 18 color themes, Recently Deleted trash
- Manual poster editor, local collections
- Directory filter tabs & pagination, individual file import
- Cast display in movie detail modal (top 5 actors)
- "Fetch Cast" bulk button + per-movie "Load cast" button
- Per-movie AI suggestions in detail modal
- Poster Fetch Tip popup with "Don't show again"
- License activation, auto-update
- Editable movie titles, year & synopsis; reset/re-fetch metadata
- Centralized directory management (rename/remove paths)
- Backup & Restore wizard (rolling auto-backups + JSON export/import)
- Expandable "Missing Metadata/Posters" lists in Stats & Settings
- Search bar with clear (X) button
- Search TMDB auto-searches on click/tab switch

### Stats Page
- Total movies, directories, poster coverage, avg rating, collections
- Decade chart, genre pie chart, rating distribution, format breakdown
- Top/lowest rated lists, cast insights (most appearing, top-rated, genre chameleons)
- Fun stats: Most Viewed/Played, Binge Score, Average Movie Age, Title Length Records
- Rarest Decade, Marathon Mode (with full breakdown), Rating Personality, Alphabet Coverage
- AI "Suggest For Me" (activity-driven, moved from library sidebar)
- "What Should I Watch?" random picker with posters

### CI/CD
- GitHub Actions builds .exe, zips it for releases (avoids SmartScreen)
- REACT_APP_BACKEND_URL points to https://www.obsidiancinema.com

### SEO
- Enhanced meta tags with 13 keywords
- Open Graph + Twitter Card with generated banner image
- JSON-LD SoftwareApplication schema (Free/$20 Pro pricing)
- Sitemap.xml submitted to Google Search Console
- robots.txt allowing public pages, blocking dashboard/settings
- Canonical URL: https://www.obsidiancinema.com

## Key Technical Notes
- Babel visual-edits plugin disabled (LocalLibraryPage.jsx exceeds AST depth)
- Components extracted to avoid Babel overflow: CastRow, CollectionAssigner, FunStats, SuggestForMe
- Backend MovieSummary uses model_validator to normalize genres (objects/strings/numbers)
- Activity tracking: plays * 3 + views scoring for AI suggestions
- "Made with Emergent" badge: platform-level injection, contact support to remove
- Stripe: PRO_TIER_PRICE=2000 (cents); /api/pricing returns dollars (PRO_TIER_PRICE/100)
- Auth: AuthCallback retries 3x with 1s delay; updates AuthContext directly

## Recent Fixes (2026-03-24)
- Fixed Stripe checkout price display: /api/pricing now returns $20 (dollars) not 2000 (cents)
- Fixed intermittent Google Auth failures: AuthCallback now retries 3x and updates AuthContext
- "WWW only" on auth page: Emergent platform issue — user should contact support@emergent.sh

## Backlog
- P0: Rebuild & redeploy (v1.2.2+) to ship bug fixes
- P1: Landing page demo video/screenshots
- P2: Root domain redirect (obsidiancinema.com → www.obsidiancinema.com)
- P2: "WWW only" auth page display — contact Emergent support
- P3: Watch party feature
- P3: Mobile companion app
- P3: Auto-fetch movie trailers
- P3: Parental controls & multi-user profiles
