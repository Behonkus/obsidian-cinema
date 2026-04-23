# Obsidian Cinema — Product Requirements Document

## Original Problem Statement
Build "Obsidian Cinema"—an installable Windows desktop app (Electron) that scans local/network drives for movie files, fetches metadata/posters from TMDB, and allows playback. A companion web app serves as an account portal for Google authentication, Stripe monetization for a Pro tier, and license key generation.

## Tech Stack
- **Frontend:** React, Tailwind CSS, Shadcn UI, Recharts, Custom CSS Keyframes
- **Backend:** FastAPI, official `stripe` Python SDK
- **Desktop:** Electron, electron-store (localStorage)
- **External APIs:** TMDB, OpenAI (via Emergent Key), Stripe
- **CI/CD:** GitHub Actions → Windows `.exe` installer (auto-builds on push to main)
- **Custom Domain:** `www.obsidiancinema.com`

## What's Been Implemented (Complete)
- Full web app (landing page, account dashboard, Google Auth, Stripe payments at $25)
- Full desktop app (scanning, TMDB metadata/cast, AI recommendations, stats, collections)
- SEO (meta/OG tags, JSON-LD, sitemap.xml, robots.txt)
- Custom color theme picker, daily movie quotes, StatusBar, Fun Effects
- Backup/Restore, file naming popup, Google Auth retry improvements
- Marketing materials, landing page copy (no screenshots, clean look)
- Free tier enforcement (500 movies, 3 collections) via activation page localStorage flag
- TMDB key stored per-user locally (not shared server)
- TMDB setup guide on Landing page (collapsible) and Settings page (collapsible) with step-by-step instructions and suggested form answers
- Auto-updater in Settings page with categorized error handling, manual download fallback, and GH_TOKEN support
- License key tied to machine ID (anti-sharing)
- Landing page version badge reads dynamically from package.json

## Current Version: 1.6.0

## Known Issues
- ~~P2: StatusBar PRO badge — Intermittent display due to Electron IPC timing.~~ **FIXED** (custom event + multi-signal approach)
- ~~P1: Settings auto-updater — Fails with cryptic GitHub error.~~ **FIXED** (categorized errors + manual download fallback)
- **P2: LicenseContext `isPro`** — React context value timing issues in Electron. Downstream features use localStorage/electron-store direct reads as workaround.

## Backlog (Prioritized)
- **P2:** Watch party feature
- **P2:** Mobile companion app
- **P2:** Auto-fetch movie trailers
- **P2:** Parental controls and multi-user profiles

## Key Architecture Decisions
- **Free tier enforcement:** Uses `localStorage.getItem('obsidian_cinema_is_pro') === 'false'` check. Only restricts users who explicitly clicked "Continue with Free" on the activation page. Pro users and existing users are never blocked.
- **TMDB key:** Stored entirely in localStorage per-user. No server involvement.
- **Pro status for StatusBar:** Attempted via useLicense context, electron-store direct read, localStorage polling — all failed. Needs Electron-environment debugging.

## 3rd Party Integrations
- OpenAI GPT-4o (Emergent LLM Key)
- TMDB (User API Key, stored locally per-user)
- Stripe Payments (User API Key, official SDK)
- SendGrid: REMOVED (manual email templates via Admin Panel)

## Credentials
- Test User: `billrules@gmail.com`
- Pro License Key: `OBSIDIAN-D9FE-BC22-4AE3-ACAA`
