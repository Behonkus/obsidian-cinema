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

## Current Version: 1.6.9

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

## Metadata Engine & Performance Overhaul (June 2026, released in v1.6.6)
- New `frontend/src/lib/tmdbMatcher.js`: smart filename parser (strips 1080p/BluRay/x264 etc., picks the correct year e.g. "2001 A Space Odyssey (1968)", reads IMDb ids `tt1234567`), multi-strategy TMDB search (year-filtered, unfiltered, subtitle/article variants), fuzzy scoring (title similarity + year + popularity), confidence threshold, IMDb-id direct lookup.
- One TMDB request per movie gets everything (append_to_response=credits,release_dates,external_ids): director, writers, runtime, tagline, US certification, IMDb id, franchise, studios, top 10 cast.
- Low-confidence matches flagged `needs_review` → "CHECK" badge on card, "Check Matches (N)" toolbar filter, modal panel with "Yes, correct" / "Pick the right one". Picking a TMDB search result now re-matches fully (sets tmdb_id + all details).
- "Enrich Details (N)" button: backfills new fields for already-matched movies (tmdb_id but no metadata_updated_at).
- Titles/years only auto-cleaned if user never edited them (equal to old scanner output).
- Performance: concurrent rate-limited fetching (6–8 parallel, ≤35 req/s, 429 retry) replacing 250ms sequential loop; batched state updates every 1.5s; debounced library save (600ms) + `oc-library-updated` event; sidebar/free-badge no longer re-parse entire library every 5s (event-driven + 60s fallback); memoized filtering/genre/dir counts, deferred search, memoized MovieCard, w342 grid thumbnails; search also matches year/director.
- Verified in preview with simulated Electron + mocked TMDB. Needs real desktop build test.

## Admin fixes (June 2026)
- Usage tab: new "User" column (name + email) resolved server-side from license_key or license activated_machine_id; free desktop users show "Anonymous (free)" (they never sign in).
- Revoke/Reactivate/Reset-machine use matched_count (no false 404 on repeat). Active badge is green.
- Revoke/Delete verified working in preview (iteration_18). Live-site "no dialog" report sent to deployer debug; likely stale production build.
- Login no longer wipes other sessions (only expired ones pruned) — fixes production admin 401 on Revoke/Delete when logged in on multiple tabs/domains/desktop. Admin UI shows clear "login expired" toast on 401.
- Gift "Draft Email in Gmail": composes FROM obsidiancinemaplus@gmail.com account (/mail/u/obsidiancinemaplus@gmail.com/), TO obsidiancinemaplus@gmail.com (owner edits then forwards to recipient); body begins with "Recipient: <email>".

## Professional themes (June 2026)
- 10 muted themes in a new "Professional" group (ids muted-*): Graphite, Silver, Slate, Navy, Steel Blue, Sage, Olive, Taupe, Burgundy, Plum. Total 31 themes (About + marketing updated).
- Hardcoded crimson glows in App.css/index.css now follow the selected theme (hsl(var(--primary) / a)).
- Fixed: Disco/Ice Cream no longer duplicated as Solid circles in the status-bar theme picker.

## Library file storage (June 2026, needs desktop build)
- Fix for "Could not save library — storage is full" (23k movies exceeded ~10MB localStorage quota). src/lib/libraryStore.js (first import in index.js) redirects localStorage key obsidian_cinema_local_movies to userData/library.json via preload libraryReadSync/libraryWriteSync/libraryWrite. One-time migration from localStorage then legacy key removed. Atomic writes with per-write temp file + generation counter (stale async writes skipped). Toast if disk write fails.
- LocalLibraryPage flushes pending debounced save on navigation and synchronously on window close. Escape closes the movie modal.
- Tested iteration_20 (simulated Electron, 6/6 pass).

## Multi-part titles (June 2026, needs desktop build)
- src/lib/multiPart.js + components/MultiPartDialogs.jsx. Card gets parts:[{file_path,file_name}]; extra cards folded in, so it counts as ONE movie (stats, 500 limit).
- Auto-suggest (same folder + same base name + Part/Pt/CD/Disc/DVD/Episode/Ep/E01/S01E01/"N of M"; skipped if parts have different years) via toolbar "Multi-Part (N)"; "Not multi-part" dismissals persisted (obsidian_cinema_multipart_dismissed). Manual merge via Layers button in movie modal (search + tick). Split back anytime.
- Play on multi-part card opens part picker; modal lists parts with play buttons. Rescan/add/relink aware of part paths; deleting part 1 promotes next part (card kept).
- Tested iteration_21 (8/8) + self-test of Escape/rescan fixes.

## TV series metadata (June 2026, needs desktop build)
- tmdbMatcher: findBestMatch opts {preferTv (multi-part cards), tvOnly}; TV fallback when movie match weak (<0.8) or none; fetchTvDetails (/tv/{id} + credits,content_ratings,external_ids) mapped to same fields + media_type "tv", season_count, episode_count; creators shown as "Created by"; networks as studios.
- multiPart.attachEpisodes: Part N -> S1EN, SxxEyy direct; parts get episode {name, overview, still, runtime, air_date}.
- Modal: TV SERIES badge, episode names/stills in parts list, "Get/Refresh series & episode info" button. Poster search returns movie + "(Series)" results (TV first for multi-part). Enrich uses /tv for tv cards.
- Tested iteration_22 (7/7) + 3 low fixes.
- Double/multi episodes (S07E12E13, S07E12-E13, S07E12-13, s07e12.e13, S07E12E13E14) detected; label S07E12-E13; attachEpisodes maps range (names joined " / ", runtimes summed). Range capped at 10 eps to avoid "-720" false ranges. Tested iteration_23.
- Whole-show grouping: files in Season N / Series N / S01 / Specials folders + Extras/Featurettes/Bonus/Trailers/Deleted Scenes folders grouped by show folder (incl. already-merged cards) into one card; title/year from folder name. Movie + Extras (folder name must match movie) also suggested. Leading-number episodes ("03 - Title") inside season folders. PartsList collapsible sections Season 1..N, Specials (after seasons), Extras; first open. attachEpisodes uses folder season, skips extras. Tested iteration_24 (100%) + low fixes self-tested.
- TV Shows quick filter (qf=tv-shows, isSeries: media_type tv / Season folders / SxxEyy) in sidebar + collapsed sidebar.
- Directory pills replaced by All + 4 colored dropdowns (components/DirectoryDropdowns.jsx): Movies (sky), TV Shows (emerald), Documentaries (amber), Animations (fuchsia); each lists "All <type>" + its folders. User sets folder type in Manage Directories (select per row), stored in obsidian_cinema_dir_categories; kept on rename, removed on delete. inDir() helper fixes D:\\TV vs D:\\TVShows prefix leak; rename also moves multi-part part paths. Tested iteration_25/26.
- Stats: TypeStats (components/TypeStats.jsx) — 4 colored cards (Movies/TV/Docs/Anim by folder type, longest matching folder; cards outside folders = Movies): titles, hours (real runtimes; estimates 88 min/movie, 45 min/episode, "≈" when estimated), days, files, episodes, % real runtimes. Marathon Mode now uses same real-runtime total. inDir moved to DirectoryDropdowns.jsx. Tested iteration_27 + self-check.
- Background auto-fill (runtime backfill): on Library page, ~10s after idle, batches of 200 matched-but-unenriched cards fetched 2 at a time (fetchDetailsForMovie), flushed every 3s; chip auto-enrich-toggle ("Auto-filling X/Y" / "Auto-fill on" / "Auto-fill paused"), persisted obsidian_cinema_auto_enrich. Failed ids not retried in-session; manual Enrich stops bg run. Tested iteration_28 + pause/resume fix self-tested.
- Auto-match new files: Update Library / Browse / Add Individual Movies queue new card ids (persisted obsidian_cinema_auto_match_queue); effect runs fetchAllPosters(Set ids) for just those (gated by Auto-fill chip, needs key, waits for library load). Chip always visible with key + non-empty library. Tested iteration_29/30 (100%).
