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
- Full web app (landing page, account dashboard, Google Auth, Stripe payments at $25)
- Full desktop app (scanning, TMDB metadata/cast, AI recommendations, stats, collections)
- SEO (meta/OG tags, JSON-LD, sitemap.xml, robots.txt)
- Custom color theme picker, daily movie quotes, StatusBar, Fun Effects
- Backup/Restore, file naming popup, Google Auth retry improvements
- Marketing materials, landing page copy (no screenshots, clean look)
- Free tier enforcement (100 movies, 3 collections) via activation page localStorage flag
- TMDB key stored per-user locally (not shared server)
- TMDB setup guide on Landing page (collapsible) and Settings page (collapsible) with step-by-step instructions and suggested form answers
- Auto-download & install updates in Settings page (UI done, needs debugging)
- License key tied to machine ID (anti-sharing)
- Landing page version badge reads dynamically from package.json

## Current Version: 1.5.2

## Known Issues to Fix Next Session
- **P0: StatusBar PRO badge** — Still not showing for Pro users. LicenseContext `isPro` has persistent timing issues in Electron. StatusBar reads from electron-store directly but still not working.
- **P1: Settings auto-updater** — "Check for Updates" fails saying no release published even though release exists on GitHub. Likely electron-updater config or release tag format mismatch.
- **P1: LicenseContext `isPro`** — The React context `isPro` value never resolves to `true` in Electron. Root cause still unknown. All downstream features relying on it had to be rewritten to use localStorage or direct electron-store checks.

## Backlog (Prioritized)
- **P0:** Fix StatusBar PRO badge, Settings auto-updater, LicenseContext isPro
- **P1:** Admin account/role system (admin flag, protected routes)
- **P1:** Admin dashboard with member/user list
- **P1:** License management from admin panel (revoke, reissue, deactivate)
- **P1:** Landing Page Demo (demo video or screenshots)
- **P2:** Custom Domain Root Redirect (obsidiancinema.com → www)
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
- SendGrid Emails (User API Key)

## Credentials
- Test User: `billrules@gmail.com`
- Pro License Key: `OBSIDIAN-D9FE-BC22-4AE3-ACAA`
