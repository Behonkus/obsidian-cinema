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

## Current Version: 1.7.1

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
- Extras at any depth (Show\\Extras\\Sub\\file, Show\\Season 1\\Extras\\file, "Season 1 Extras") = Extras section of the show; extras never form own groups (EXTRAS_DIR anchored per segment; a show named "Extras" detected when file names start with the folder name — known gap: "Extras" show with "01 - Pilot" style names).
- Auto multi-part check: after Update Library/Browse/Add, groups containing new files pop up automatically ("New files belong with existing titles"). Show-folder files are not auto-matched as movies; lone show-folder files with no group are matched as TV; new show groups auto-run series lookup after merge; existing tv/multi-part card stays primary on merge; episode search strips SxxEyy; attachEpisodes keeps old episode info on failed season fetch. Movie+Extras shows "Feature" section, no series button. Tested iteration_31/32 + self-test.

## v1.7.0 (June 2026)
- Version bumped to 1.7.0 everywhere (package.json, AdminPage update email, marketing_materials.md).
- Update pop-up on launch (UpdatePrompt.jsx): checks ~5s after start; lists features of the newer version from GET /api/changelog (CHANGELOG list in backend/server.py), falls back to GitHub release notes. Download / Restart & update in the dialog. "Later" hides it for the session.
- One-time "What's new in vX" dialog after each update (WhatsNewDialog.jsx, localStorage obsidian_cinema_last_seen_version).
- RELEASE CHECKLIST: add a new entry at the top of CHANGELOG in backend/server.py and deploy the backend BEFORE publishing each new GitHub release.
- Limitation: versions <=1.6.9 have no auto-check; those users must be reached via the update email or Settings → Check for Updates.
- Tested: iteration_33 (all passing after fixes).
- (v1.7.0, same build) In TV Shows / Documentaries / Animations directories: year folders (2019, (2019)) act as seasons ("Season 2019"); everything under a first-level show folder merges into one show card even with no season structure. Library dir that directly holds Season/year folders is treated as the show itself. Docs/Anim folders of separate films with different years stay separate; Movies dirs untouched. Logic: multiPart.js setShowRoots/rootShow/partFolder; roots set in LocalLibraryPage + Layout. Tested iteration_34 + re-run after fixes (all pass).
- (v1.7.0, same build) FIX: Extras/new episodes merged into an existing show card were dropped again by a background metadata update holding a stale parts list (they reappeared as separate cards). applyCardUpdate (multiPart.js) now keeps the card's current parts on every metadata update. Changing a folder's type to TV/Docs/Animations immediately opens the merge dialog ("Shows found in this folder"). The grouping works for any folder layout (drive root, nested root, root = show folder, UNC/POSIX paths). Tested iteration_35 + re-runs (all pass).
- (v1.7.0, same build) Import type picker: Browse Local Drives requires choosing Movies/TV Shows/Documentaries/Animations before Scan (ImportTypePicker.jsx); Add Files asks the type first (ImportTypeDialog) and saves it for the files' folder. Files directly in a typed TV/Docs/Anim folder become one show named for the folder (e.g. Modern Marvels, 600 files). Docs/Anim loose files group only when they look like a series (numbered, named after the folder, or sharing a title start); separate films are matched as movies. Category badges count each card once. Tested iteration_36-37 + re-runs (all pass).
- (v1.7.0, same build) Manage Directories: 'Folders from Add Files' section lists folders typed via Add Files (not inside a scanned directory) with type dropdown, title count and Remove (removes only titles directly in that folder; files on disk untouched). Add Files no longer changes the type of scanned directories or folders inside them. Tested iteration_38 + re-run (all pass).
- (v1.7.0, same build) AKA titles: fetchMovieDetails adds alternative_titles -> movie.aka (English US/GB/CA/AU/IE/NZ aliases first, original title kept, max 6); shown as 'aka …' on cards (medium/large) and 'Also known as' in the detail window; searchable. Background auto-fill re-fetches older films without aka. Cast Insights now film-only (no TV/series, documentaries, concert films with mostly Himself credits; no Himself/Self credits or non-Acting department people). New Director Insights (lib/peopleStats.js, components/DirectorInsights.jsx): most films, top-rated (min 5), genre range, actor-director pairs. Tested iteration_39 (41/41) + re-run.
- (v1.7.0, same build) Filmographies: clicking an actor (Cast Insights), director or actor-director pair (Director Insights) opens FilmographyDialog on the Stats page listing their films (film-only rules, newest first, 'as character', rating); clicking a film opens it in the Library via ?open=<id>. Pair count = top-5 billed rule. Tested iteration_40 + re-run (all pass).
- (v1.7.0, same build) Genre de-dup: TMDB TV combo genres mapped to the first movie genre (Action & Adventure->Action, Sci-Fi & Fantasy->Science Fiction, War & Politics->War, Kids->Family) on fetch and on library/stats load (tmdbMatcher normalizeGenres). Filmography pop-up: 'Show all in Library' filters the grid via ?person=&role=[&director=] with a clearable chip; 'Well-known films not in your library' lists up to 8 TMDB films (search/person + movie_credits, most voted first, opens TMDB). Tested iteration_41 (all pass).
- 1.7.1 (June 2026): version bump; CHANGELOG 1.7.1 entry in backend/server.py; marketing + Admin email updated.
- 1.7.1: removed 'Favourite Actor-Director Pairs' list from Director Insights (3 lists remain, 3-column grid); marketing text updated.
- 1.7.1: Library detail window - cast members and 'Directed by' names are clickable and open the same FilmographyDialog as Stats (onLeave closes the detail when navigating). Tested iteration_42 + re-run (all pass).
- 1.7.1: TV Shows quick filter removed. Recently Added = newest first. Fix missing info (lib/fixMissing.js): button on No Rating/No Year/No Genre filters + background batches (auto-fill on, 25s, 100 titles, 30-day recheck via gap_checked_at). Order: TMDB refresh/match (never overwrites present fields; 0 rating = missing) -> Wikidata (SPARQL by P345/P4947/P4983, title search with year, label similarity; review scores IMDb > Metacritic > RT, latest) -> local (file/folder year, folder-type genre). Year mismatches (single files) persisted in localStorage obsidian_cinema_year_mismatches; YearMismatchDialog renames only the year via electron fs:renameFile (never overwrites/deletes). Rating 0 hidden on cards. Tested iteration_43 + re-run; real Wikidata verified (Heat 8.3, Matrix 8.7).
- 1.7.1: 'Add Individual Movies' toolbar button moved into a 'More' dropdown (more-actions-btn > add-files-btn 'Add individual files'). Tests updated.
- 1.7.1: Drag & drop onto the library (library-drop-zone): video files and the videos directly inside dropped folders (scanForVideos non-recursive); already-known paths skipped; type dialog then added like Add Files (pickIndividualFiles(type, paths)). electron will-navigate only allows the app's own page (dropped files can't open in the window). Rating source tag (RatingSourceTag.jsx): IMDb/MC/RT/WD on cards, 'IMDb via Wikidata' in details; rating_source cleared on TMDB fills and manual edits. Tested iteration_44 + re-run (all pass; re-drop of a known file now toasts instead of opening the dialog).
- 1.7.1 release prep: CHANGELOG 1.7.1 now lists 14 highlights incl. fix missing info, year rename, drag & drop, rating source tags; marketing updated.
- 1.7.1 performance pass: partFolder + parseFilename caches (23k cards grouping 95ms -> 27ms), shared parsed library (readLibrary/publishLibrary) for sidebar + Stats, save debounce 1200ms, lazy-loaded secondary pages (Suspense in App + around Layout Outlet), Mongo lookup indexes at startup. Tested iteration_45 (no regressions).
- 1.7.1: Year rename list: per-row 'Never rename' (paths in localStorage obsidian_cinema_year_rename_ignored, filtered from future runs, 'Allow again' reset); stale entries (title removed or path changed) auto-pruned once the library loads. Fix toast counts only non-ignored mismatches, singular wording. Tested iteration_46 (40/40).
- 1.7.1 BUGFIX: stale directors after Reset metadata / re-match. resetMetadata clears director+directors+aka+rating_source+media_type+season/episode counts+gap_checked_at; fetchTvDetails returns directors:[]/aka:[]; fetchMovieDetails returns season_count/episode_count null; filmDirectors() uses the director text as source of truth (repairs already-affected cards); applyManualMatch aborts with an error toast if TMDB details fail (no half-updated card). Tested iteration_47 + iteration_48 (all pass).

## 2026-06 — Move titles between categories
- Card 3-dot "Move to" menu (Movies / TV Shows / Documentaries / Animations, "Back to folder's type") + Select mode with bottom bar (select all shown, bulk Move to…).
- Stored as `category_override` on the card (persists across reload, rescan, merges); category filters, counts, Stats TypeStats and auto-fix use `cardCategory()` (DirectoryDropdowns.jsx).
- Library header now shows per-category breakdown ("4 Movies · 1 TV Show · 2 folders").
- Tested: iteration_49 (60/60), /app/tests/test_iter50_move_category.py.

## 2026-06 — Landing/pricing copy: "bring your own files"
- Reworded LandingPage.jsx, UpgradePage.jsx and index.html meta/JSON-LD so nothing implies Obsidian Cinema supplies movies; limits now "Organize up to 500 of your own files" / "No limit on library size". JSON-LD price fixed to $25 and free limit to 500. No separate notice banner (user choice). In-app text unchanged (user choice).

## 2026-06 — Landing FAQ + Before/After slider
- components/BeforeAfterSlider.jsx (drag/keyboard slider, generated Explorer vs poster-wall mockups, after hero) and components/LandingFaq.jsx (4 Qs: source of movies, requirements, privacy, NAS/external) before CTA; navbar FAQ link. Verified via screenshot.

## 2026-06 — Library toolbar redesign + visual effects
- LibraryHeader.jsx (title shine, animated count chips, Add Folder / Update Library / Tools), LibraryTools.jsx (grouped dropdown: attention items w/ badge, metadata tools, select/add files/PDF), sticky glass toolbar (search, type filters with sliding highlight, genre, sort, activity chips). Empty categories hidden.
- Card effects: staggered entrance, 3D tilt + glow + sheen (full), simple lift (lite). lib/effects.js: Auto (lite above 3000 titles, latched per visit) / Full / Lite; Settings > Library Visual Effects (EffectsSetting.jsx). Respects prefers-reduced-motion.
- Tested iteration_50 (199/199) + /app/tests/test_iter51_library_header.py re-run after polish (all pass).

## 2026-06 — Poster backdrop glow
- lib/posterColor.js (samples w92 poster on a tiny canvas, vivid-weighted average, lifted for dark UI, cached; title-hue fallback if image can't be read) + components/PosterBackdrop.jsx (fixed soft radial wash, colour animated via @property). Hover on any MovieCard tints; fades out 350ms after leaving. Always on (user choice), independent of effects level.

## 2026-06 — Details window tint
- Movie details card (movie-detail-card) gets poster colour via getPosterColor: top fade (::before) + tinted border/edge glow, pop-in animation; colour vars registered with @property inherits:true.
- Play button in details (detail-play-btn) keeps theme red with a pulsing poster-coloured halo (.oc-play-glow).

## 2026-06 — v1.7.2 release prep
- package.json 1.7.2; backend CHANGELOG 1.7.2 entry (toolbar + visual effects only, per user); Admin gift email intro + download line; marketing_materials.md (v1.7.2 bullets, '500 of your own files' wording throughout).

## 2026-06 — Add Folder fixes (customer report)
- electron.js getWindowsDrives: probes A–Z (wmic removed on new Windows 11 caused C:/D: fallback); listDirectory throws readable errors.
- LocalDirectoryBrowser: Step 1 type picker on top (highlighted until chosen, button reads 'Choose a type first'), typed path opens on Enter/Go (was never navigated), UNC paths + Up, 'Choose with Windows…' native picker, error vs empty states. Tested via simulated electronAPI.

## 2026-06 — v1.7.3 hotfix: Add folders + drop folders
- Tools > 'Add folders…' (multi-select native folder picker, recursive scan, saved as library folders with chosen type). Dropped folders now scanned recursively once and saved as library folders. addFolders() replaces handleMoviesFound internals (functional state updates).
- package.json 1.7.3, CHANGELOG 1.7.3 (Add Folder fixes + folders), gift email + marketing updated. Regression suite iter51 54/54 pass.
- Welcome guide (components/WelcomeGuide.jsx) replaces empty-library card: 3 steps, Add your first folder + Add several folders buttons, drag tip, network/admin tip. Added to 1.7.3 changelog.
- Update Library safety: new IPC fs:rescanFolder returns {videos, failed}; titles under unreadable folders (offline drive/NAS, access denied) are kept, warning toast lists them. Added to 1.7.3 changelog.
- Offline drive badge: IPC fs:checkRoots (2.5s probe per drive/UNC share); checked on open, every 60s, after Update Library; cards dim + 'Drive offline' badge, Play/VLC/parts blocked with toast, details Play shows 'Drive offline (E:\)'; 'back online' toast. lib/driveRoots.js rootOf(). In 1.7.3 changelog.
- Offline Drives filter: qf=offline; toolbar chip (offline-drives-chip) + sidebar qf-offline (via 'oc-offline-drives' event); grouped by drive view (offline-groups). In 1.7.3 changelog.
- Drive nicknames: localStorage obsidian_cinema_drive_names {root: name}; DriveNameEditor.jsx inline editor in offline group headings + Manage Directories 'Drives' section (status dot, counts); labels used in chip tooltip, badges, toasts, details Play. In 1.7.3 changelog.

## 2026-06 — User Guide PDF
- /app/scripts/build_user_guide.py (reportlab) -> /app/frontend/public/Obsidian-Cinema-User-Guide.pdf (19 pages, 16 chapters incl. troubleshooting, TOC + bookmarks). Screenshot placeholders 01-installer…08-stats; drop images in /app/docs/guide_screenshots/<id>.png and rerun script.
- Landing: nav 'User Guide' link, footer download link, FAQ 'Is there a user guide?'.
- In-app User Guide: Tools > User Guide + Settings About card button; IPC help:openGuide HEADs online PDF (4s), else copies bundled build/Obsidian-Cinema-User-Guide.pdf out of asar to temp and opens. lib/userGuide.js. In 1.7.3 changelog.
- Merged folder adding: Tools 'Add folders…' removed; Add Folder dialog has queue ('Add another folder', Windows picker multi-select), scans all targets, onMoviesFound(movies, dirs[], type). Help '?' links (HelpLink.jsx) open guide at page via lib/guidePages.json (generated by build_user_guide.py): Add Folder title/type step, Update Library, Tools Metadata, offline view, Manage Directories, Welcome guide, Settings TMDB + Library Management.
- Guide screenshots: scripts/guide_sample_library.py (real TMDB metadata -> docs/guide_sample_library.json, 32 titles) + scripts/guide_screenshots.py (run in screenshot tool: exec + await run(page)) -> docs/guide_screenshots/*.png; build_user_guide.py embeds as JPEG (aspect-safe), PDF 20 pages ~1.3MB; guidePages.json regenerated.
- Copyright-safe screenshots: scripts/guide_fictional_library.py (20 invented titles, 20 AI posters, invented people, no photos) now feeds guide_screenshots.py (daily quote hidden). Guide PDF rebuilt. Landing: components/ScreenshotGallery.jsx (6 real-app shots in /public/screens/*.jpg, scroll-snap, arrows, lightbox) after Features section.
- Scan issues: electron failed entries {path, code}; SYSTEM_DIRS skip list; ScanIssuesDialog.jsx (Show which toast action + 'N folders skipped' chip, reasons per error code, kept counts, Show in Explorer, Dismiss). Guide troubleshooting entry + 1.7.3 changelog.
- Always skip folder: localStorage obsidian_cinema_skipped_folders; passed to fs:rescanFolder(dir, skipList) (electron skips matching subfolders, case-insensitive); skipped paths kept from removal; Manage Directories 'Skipped folders' with Scan again.
- Enrich details stuck fix: tmdbGet meta.status; 404 retries other media type; both 404 -> details_unavailable=tmdb_id + needs_review (excluded from counts/bg auto-fill); toasts for gone/failed.
- Backdrop glow brighter (0.34/0.22 + left 0.30 wash); sidebar bg-background/60 + blur-2xl so glow shows behind it.

## 2026-06 — v1.7.4: Brighter poster glow
- Brighter poster backdrop glow + colour wash behind a translucent, blurred sidebar (PosterBackdrop.jsx, Layout.jsx).
- package.json 1.7.4; backend CHANGELOG 1.7.4 entry; gift email (AdminPage), marketing_materials.md and User Guide PDF (build_user_guide.py VERSION 1.7.4, glow text) updated.
- Desktop users get it only after a new desktop release is built from 1.7.4.
- Poster glow slider (1.7.4): EffectsSetting.jsx GlowSlider (0–100, step 5, default 50 'Soft'; 0 = Off); localStorage obsidian_cinema_glow; lib/effects.js getGlowPref/glowFactor (x1.5 at 100); PosterBackdrop sets --oc-k used in .oc-backdrop alphas. Changelog, guide PDF, marketing, gift email updated.
- Live glow preview (1.7.4): components/GlowPreview.jsx (made-up 'Neon Tide' gradient poster + wash scaled by slider). Settings: TMDB card no longer full width on web; EffectsSetting sits beside it (web), desktop keeps old position.
- Glow colour choice (1.7.4): localStorage obsidian_cinema_glow_color ('poster' default | 'accent'); getPosterColor returns accentRgb() (from --primary) when accent, so backdrop, details tint and Play glow all follow. GlowColorPicker in EffectsSetting; GlowPreview uses chosen colour. Changelog/guide/marketing updated.
