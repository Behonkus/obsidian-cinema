# Obsidian Cinema - Product Requirements Document

## Original Problem Statement
Build "Obsidian Cinema" — an installable Windows desktop app (Electron) that scans local/network drives for movie files, fetches metadata/posters from TMDB, and allows playback. A companion web app serves as an account portal for Google authentication, Stripe monetization for a Pro tier, and license key generation.

## Architecture
- **Frontend:** React, Tailwind CSS, Shadcn UI, Recharts
- **Backend:** FastAPI, MongoDB, official Stripe SDK
- **Desktop:** Electron with electron-store (localStorage)
- **External APIs:** TMDB, OpenAI (via Emergent Key), Stripe, SendGrid
- **Domain:** www.obsidiancinema.com

## Core Features (Implemented)
- Directory scanning for movie files (Desktop)
- TMDB metadata/cast/poster fetching
- Statistics page with charts and fun stats
- AI-based movie recommendations (activity-driven)
- Stripe Pro tier payments ($20 one-time)
- License key generation and activation
- Welcome email with license key (SendGrid)
- Backup & Restore (JSON export/import)
- Collections management
- SEO: meta/OG tags, JSON-LD, sitemap.xml, robots.txt
- GitHub Actions CI/CD for Windows installer

## Key Technical Notes
- Babel visual-edits plugin disabled (LocalLibraryPage.jsx exceeds AST depth)
- Components extracted to avoid Babel overflow: CastRow, CollectionAssigner, FunStats, SuggestForMe
- Backend MovieSummary uses model_validator to normalize genres
- Activity tracking: plays * 3 + views scoring for AI suggestions
- Stripe: PRO_TIER_PRICE=2000 (cents); /api/pricing returns dollars (PRO_TIER_PRICE/100)
- Stripe key read directly from .env file via _read_env_value() to bypass pod env override
- Auth: AuthCallback retries 3x with 1s delay; updates AuthContext directly
- Auth redirect strips "www." from origin for proper display on Emergent auth page
- "Made with Emergent" badge: platform-level injection, contact support to remove

## Recent Fixes (2026-03-25)
- Fixed Stripe price display: $2000 → $20 (return dollars not cents from /api/pricing)
- Fixed Stripe API key: pod injected sk_test_emergent; now reads directly from .env file
- Fixed post-payment blank screen: checkout-status no longer requires auth, success route unprotected
- Fixed crash bug: `status.status` → `session.status` in checkout-status endpoint
- Fixed intermittent Google Auth: AuthCallback retries 3x, updates AuthContext directly
- Fixed auth page "Www" display: strip www. from redirect URL in both LandingPage and LoginPage
- Added welcome email with license key via SendGrid after Pro purchase
- Redesigned payment success screen: shows license key + 3-step activation guide
- Removed referral UI from sidebar dropdown (replaced with "License Key" link)
- Upgraded Shannan (shannan2008@gmail.com) to Pro with license key OBSIDIAN-1CBB-CC18-A8D1-3166
- Version bumped to 1.2.4

## Users
- billrules@gmail.com (Pro) — License: OBSIDIAN-D9FE-BC22-4AE3-ACAA
- shannan2008@gmail.com (Pro) — License: OBSIDIAN-1CBB-CC18-A8D1-3166

## Backlog
- P1: Landing page demo video/screenshots
- P2: Root domain redirect (obsidiancinema.com → www.obsidiancinema.com)
- P3: Watch party feature
- P3: Mobile companion app
- P3: Auto-fetch movie trailers
- P3: Parental controls & multi-user profiles
- POSTPONED: LocalLibraryPage.jsx refactor (user decision — stable, high risk/low reward)
