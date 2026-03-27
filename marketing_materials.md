# Obsidian Cinema — Marketing Materials (Updated v1.3.5)

---

## Blog Post

### Title: Introducing Obsidian Cinema — Your Movie Library, Beautifully Organized

If you've ever stared at a folder full of `.mkv` and `.mp4` files wondering which one is which, this is for you.

**Obsidian Cinema** is a free Windows desktop app that scans your local and network drives, automatically fetches movie posters, metadata, and cast data from The Movie Database (TMDB), and turns your scattered video files into a polished, browsable library — complete with AI recommendations, favorites, and detailed stats.

#### The Problem

Most of us have movies spread across internal drives, external USB disks, and network shares. File names are inconsistent, there are no thumbnails, and finding what you want to watch means scrolling through a bland file explorer. Media servers like Plex or Jellyfin are overkill when you just want to *see* your movies and *play* them.

#### The Solution

Obsidian Cinema sits between a file manager and a full media server. Point it at any directory — `C:\Movies`, `D:\Films`, `\\NAS\Media` — and it does the rest:

- **Automatic poster, metadata & cast fetch** from TMDB (title, year, rating, genre, overview, full cast).
- **AI-powered recommendations** — personalized movie suggestions based on your viewing and browsing activity, powered by GPT-4o.
- **One-click playback** in your default media player (VLC, MPC, Windows Media Player — your choice).
- **Favorites** — star movies with an animated heart. Persists across sessions and survives updates.
- **Custom collections** — group movies however you want and browse them from the sidebar.
- **Advanced sorting & filtering** with 13 sort options plus quick filters for missing posters, missing ratings, favorites, and recently added.
- **Library statistics & insights** — visual charts (movies by decade, rating distribution, genre breakdown), collection health, fun stats (binge score, marathon mode, average movie age), and most viewed/played tracking.
- **18+ color themes plus a custom color picker** — solid, pastel, animated rainbow, or pick any color you want.
- **Backup & restore** — export your entire library to a timestamped JSON file and restore it anytime. Includes favorites, activity data, collections, and all settings.
- **Daily movie quotes** — a rotating selection of 179 iconic movie quotes greets you each day.
- **Recently Deleted** — a 30-day trash so nothing is permanently lost by accident.
- **Manual poster editing** — search TMDB, paste a URL, or pick a local image file.
- **Auto-updates** — the app quietly updates itself in the background.
- **Machine-locked licensing** — each Pro license is bound to one device for security, validated server-side on every launch.

#### Pricing

Obsidian Cinema is free to use with up to 50 movies and 3 collections — including TMDB posters, stats, and all core features. For power users, the **Pro** tier removes all limits for a **one-time payment of $25** — no subscriptions, no recurring charges. Your license key is emailed to you instantly after purchase.

#### Getting Started

1. Visit [www.obsidiancinema.com](https://www.obsidiancinema.com) and create a free account with Google.
2. Download the Windows installer.
3. Add your movie directories.
4. Enjoy your new library.

Obsidian Cinema is built for movie collectors who want a beautiful, lightweight way to browse and play their local files — without running a server or transcoding anything. Give it a try.

---

## Press Kit

### One-Liner
Obsidian Cinema is a free Windows desktop app that turns scattered movie files into a beautiful, poster-rich library with AI recommendations, favorites, detailed stats, and one-click playback.

### Elevator Pitch (60 words)
Obsidian Cinema scans your local and network drives, automatically fetches movie posters, metadata, and cast data from TMDB, and presents your collection in a polished grid. Get AI-powered movie suggestions, star your favorites, track viewing stats, and play any movie instantly. Free to start, $25 one-time for unlimited Pro access. No subscriptions. No servers. Everything stays local.

### Key Facts
- **Platform:** Windows (Electron-based desktop app)
- **Version:** 1.3.5
- **Price:** Free (50 movies, 3 collections) / Pro $25 one-time (unlimited)
- **Data Source:** TMDB for posters, metadata, and cast data
- **AI Engine:** GPT-4o for personalized movie recommendations
- **Playback:** Uses system default media player (VLC, MPC, etc.)
- **Storage:** All data stays local — no cloud uploads, no streaming
- **Licensing:** Machine-locked, server-validated, one key per device
- **Updates:** Built-in silent auto-updater
- **Website:** [www.obsidiancinema.com](https://www.obsidiancinema.com)

### Feature Highlights
| Feature | Details |
|---|---|
| Drive Scanning | Local drives, network shares (SMB/CIFS), USB drives |
| Metadata | Title, year, rating, genre, overview, full cast from TMDB |
| AI Recommendations | Personalized suggestions based on viewing/browsing activity |
| Favorites | Star movies with animated hearts, persisted across sessions |
| Collections | Custom movie groups, browsable from sidebar |
| Sorting | 13 options including title, year, rating, file size, directory, date added |
| Quick Filters | Missing posters, missing ratings, no year, favorites, recently added |
| Poster Sizes | Small, medium, large grid views |
| Themes | 18 built-in themes + custom color picker (solid, pastel, rainbow) |
| Statistics | Charts for decades, ratings, genres, collection health, fun stats, most viewed |
| Backup & Restore | Full JSON export/import with timestamps, includes all data |
| Daily Quotes | 179 rotating iconic movie quotes on the library page |
| Trash | 30-day "Recently Deleted" with restore |
| Poster Editor | Search TMDB, paste URL, or select local file |
| Auto-Update | Silent background updates via GitHub Releases |
| License Security | Machine-locked keys, server-validated on each launch |

### Target Audience
- Movie collectors with large local libraries (100–10,000+ files)
- Users with media on network-attached storage (NAS)
- People who find Plex/Jellyfin too complex for simple browsing and playback
- Anyone tired of navigating plain file explorers to find movies
- Home theater PC (HTPC) users who play files locally

### What Makes It Different
Unlike media servers (Plex, Jellyfin, Emby), Obsidian Cinema doesn't transcode, stream, or require a running server. It's a lightweight desktop app that organizes what's already on your drives and plays files directly in your preferred player. Plus, it adds AI-powered recommendations and detailed library analytics that no file browser offers. Think of it as a beautiful, intelligent frontend for your file system.

---

## Subreddit-Specific Posts

### r/datahoarder

**Title:** I built a free app to organize my movie collection across multiple drives — Obsidian Cinema v1.3

**Body:**
Like a lot of you, I've got movies spread across multiple drives and NAS shares. I got tired of navigating Windows Explorer to find something to watch, so I built Obsidian Cinema.

It's a lightweight Windows desktop app that:
- Scans local drives, network shares, and USB drives for video files
- Automatically pulls posters, ratings, year, genre, synopsis, and full cast data from TMDB
- Displays everything in a poster grid (adjustable sizes)
- Plays files in your default player with one click
- Sorts by 13 different options (title, year, rating, file size, directory, date added, etc.)
- Quick filters for missing posters, missing ratings, favorites, and recently added
- AI-powered movie recommendations based on your viewing activity
- Star your favorites and organize into custom collections
- Full backup & restore — export your entire library to a JSON file

Everything stays local. No cloud, no streaming, no server process running in the background. Your files stay exactly where they are — this just makes them look nice. Each Pro license is machine-locked for security.

Free tier handles up to 50 movies. Pro is a one-time $25 for unlimited (no subscription). There's also collections, a stats page with charts and fun insights, 18+ themes with a custom color picker, and a 30-day trash/restore feature.

Would appreciate any feedback from this community. You're the exact people I built it for.

Link: www.obsidiancinema.com

---

### r/selfhosted

**Title:** Obsidian Cinema v1.3 — a local movie organizer that doesn't need a server

**Body:**
I know this community leans toward self-hosted solutions, so I wanted to be upfront: this is a desktop app, not a server. But I think it fills a gap.

I love Plex and Jellyfin for streaming, but sometimes I just want to browse what's on my NAS and play it locally. I don't need transcoding, remote access, or user accounts. I just want to see my movies with posters and click play.

That's what Obsidian Cinema does:
- Point it at any directory (local, network, USB)
- Fetches posters, metadata, and full cast data from TMDB automatically
- Browse a poster grid, sort by anything, play in VLC/MPC/whatever
- AI recommendations learn from your browsing and play activity
- Star favorites, create collections, track detailed stats
- Full backup & restore to protect your library data
- No server, no Docker container, no ports to open
- Everything stored locally on your machine

Think of it as a pretty frontend for your filesystem's movie folders. If you've got Plex or Jellyfin handling your streaming and just want something lightweight for local browsing, this might be useful.

Free for up to 50 movies. One-time $25 removes the limit. Windows only for now.

Link: www.obsidiancinema.com

---

### r/software

**Title:** Obsidian Cinema v1.3 — free Windows app that organizes local movie files with TMDB posters & AI recommendations

**Body:**
I built a desktop app for managing local movie collections. If you have movies on your hard drives, external drives, or network shares and want something better than Windows Explorer to browse them, this is for you.

**What it does:**
- Scans any directory for video files (.mkv, .mp4, .avi, .mov, .wmv, .webm, etc.)
- Fetches movie posters, ratings, year, genre, synopsis, and full cast from TMDB
- AI-powered recommendations based on your viewing activity (GPT-4o)
- Star your favorite movies with animated hearts
- Organize into custom collections
- Displays movies in an adjustable poster grid (S/M/L)
- One-click playback in your default media player
- 13 sort options, quick filters, search, directory filtering
- 18+ color themes with a custom color picker
- Library statistics with visual charts, fun stats, and collection health
- Full backup & restore (JSON export/import)
- 30-day trash with restore
- Daily rotating movie quotes (179 iconic lines)
- Auto-updates built in
- Machine-locked Pro licenses for security

**What it doesn't do:**
- No streaming, no transcoding, no server
- No cloud uploads — everything stays on your machine
- Doesn't modify or move your files
- Doesn't require an internet connection after initial setup (except for TMDB fetches)

Free tier: 50 movies, 3 collections, all core features. Pro: one-time $25, unlimited everything plus AI recommendations.

Happy to answer questions or take feature requests.

Link: www.obsidiancinema.com

---

### r/windows

**Title:** I made a free movie library app for Windows — organizes local files with TMDB posters, AI recommendations, and favorites

**Body:**
If you've got a bunch of movie files scattered across drives and you're tired of browsing them in File Explorer, I made something for that.

Obsidian Cinema is a Windows desktop app that scans your folders for video files, automatically fetches movie posters, metadata, and cast info from TMDB, and shows everything in a clean poster grid. Click any movie to play it in your default player (VLC, MPC, whatever you use).

Features:
- Scan local drives, USB, and network shares
- Automatic poster, metadata & cast data from TMDB
- AI-powered movie recommendations based on what you watch and browse
- Star favorites and organize into custom collections
- 13 sort options, quick filters (no poster, no rating, favorites, recently added)
- Adjustable poster sizes (S/M/L)
- Library stats with charts, fun insights, and collection health
- 18+ themes with custom color picker
- Full backup & restore
- 30-day recycle bin for removed movies
- Silent auto-updates

It's free for up to 50 movies. If you need more, Pro is a one-time $25 — no subscription. License is machine-locked to your PC for security.

No server required, everything runs and stores locally. Would love feedback.

Link: www.obsidiancinema.com

---

### r/htpc

**Title:** Built a lightweight movie organizer for local playback — AI recommendations, favorites, stats, and no server needed

**Body:**
Hey HTPC folks. I built Obsidian Cinema as a simpler alternative for people who just want to browse and play local movie files without running Plex or Jellyfin.

The use case: you've got movies on internal drives, external USB, or NAS shares. You want to see them with posters and play them with one click. You don't need streaming, transcoding, or remote access — just a nice local interface.

What it does:
- Scans any directory for video files
- Fetches posters, ratings, year, genre, overview, and full cast from TMDB
- AI-powered movie recommendations that learn from your activity
- Star favorites and organize into collections
- Poster grid view with adjustable sizes (S/M/L)
- One-click playback in your system default player
- Sort by title, year, rating, file size, directory, date added, and more (13 options)
- Quick filters: missing posters, missing ratings, favorites, recently added
- Library stats with visual charts, fun insights (binge score, marathon mode), and collection health tracking
- 18+ themes with custom color picker
- Full backup & restore (export/import your entire library)
- Rescan directories to pick up new additions without re-importing
- Daily rotating movie quotes on the library page

It's a standalone Windows app — no server process, no Docker, no configuration. Install and point it at your folders. License is machine-locked for security.

Free for 50 movies. One-time $25 for unlimited.

If any of you run an HTPC primarily for local playback, I'd love to hear if this fits your workflow.

Link: www.obsidiancinema.com

---

### r/PleX

**Title:** Not a Plex replacement, but a companion for local browsing — Obsidian Cinema v1.3

**Body:**
I want to be clear upfront: this isn't trying to replace Plex. I use Plex myself. But there are times I just want to browse what's on a drive and play it locally without going through Plex's server.

Obsidian Cinema is a lightweight Windows app that:
- Scans local/network drives for movie files
- Shows them in a poster grid with TMDB metadata and cast data
- Lets you play anything in VLC, MPC, or whatever your default player is
- Gives you AI-powered movie recommendations based on your activity
- Lets you star favorites and organize into collections
- No server, no transcoding, no library scanning delays

I find it useful for:
- Drives I haven't added to Plex yet
- Quick browsing on a laptop with a USB drive
- Network shares that aren't in my Plex library
- When I just want something simpler and faster
- Getting AI suggestions for what to watch next from my own collection

It's not a media server. It's more like a really nice file browser specifically for movies, with AI smarts and detailed stats. Free for up to 50 movies, one-time $25 for unlimited Pro.

Curious if anyone else has this "I just want to browse and play" use case.

Link: www.obsidiancinema.com

---

### r/MovieSuggestions

**Title:** I built an app that gives AI recommendations from your own movie collection

**Body:**
Quick background: I built Obsidian Cinema, a Windows app that organizes local movie files with TMDB posters and metadata.

The latest feature I wanted to share with this community: **AI-powered movie suggestions from your own library.**

It works like this — the app tracks which movies you browse and play. Then when you hit "Suggest for Me" on the stats page, it uses GPT-4o to analyze your activity patterns and recommend movies you already own but haven't watched yet.

It's not suggesting movies to buy or stream. It's looking at your actual files and saying "based on what you've been watching, you might enjoy these three movies already sitting on your D: drive."

Also has:
- Favorites (star movies you love)
- Custom collections
- Library stats and charts
- 179 daily rotating movie quotes

Free for up to 50 movies, $25 one-time for unlimited. Windows only.

Link: www.obsidiancinema.com

---

## Social Media

### Twitter / X
> Your movie files deserve better than Windows Explorer. Obsidian Cinema scans your drives, fetches TMDB posters & cast data, gives you AI recommendations, and lets you play with one click. Star favorites. Track stats. 18+ themes. Free for Windows. www.obsidiancinema.com #MovieLibrary #DesktopApp

### Twitter / X (Short)
> Obsidian Cinema v1.3 — scan your drives, get TMDB posters, star favorites, AI recommendations, and play any movie in one click. Free Windows app. www.obsidiancinema.com

### Product Hunt
**Tagline:** "Your movie library, beautifully organized. AI recommendations included."

**Description:** Obsidian Cinema scans your local and network drives for movie files, automatically fetches posters, metadata, and cast data from TMDB, and displays your collection in a beautiful poster grid. Get AI-powered movie suggestions based on your viewing activity. Star favorites, create custom collections, track detailed library stats with charts, and play any movie with one click. Backup & restore your entire library. 18+ themes with a custom color picker. Free for up to 50 movies, $25 one-time for unlimited Pro. No subscriptions. No servers. Everything stays local. Machine-locked licenses for security.

### Product Hunt (Maker Comment)
Hey everyone! I built Obsidian Cinema because I had thousands of movie files across multiple drives and NAS shares, and I was tired of browsing them through Windows Explorer.

The core idea is simple: point it at your movie folders, and it turns them into a beautiful poster grid with metadata from TMDB. One click to play anything.

Since launch, I've added features the community asked for:
- AI recommendations that learn from what you watch and browse
- Favorites with animated star icons
- Full cast data from TMDB
- Custom color themes (pick any color you want)
- Backup & restore your entire library
- Daily movie quotes (179 iconic lines)
- Library health monitoring and fun stats

Happy to answer any questions!

---

## Posting Tips

1. **Start with r/datahoarder** — highest chance of positive reception
2. **Wait 24-48 hours**, then post to r/selfhosted
3. **r/MovieSuggestions is new territory** — lead with the AI recommendation angle, not the app itself
4. **Space posts out** — don't post to all subreddits on the same day (looks like spam)
5. **Engage with every comment** — answer questions, take feedback seriously, thank people
6. **Don't delete and repost** if a post doesn't get traction — Reddit flags this
7. **Submit to Product Hunt on a Tuesday or Wednesday morning** (highest traffic days)
8. **All links should point to:** www.obsidiancinema.com
9. **Key selling points to emphasize:** AI recommendations, no server needed, one-time payment (no subscription), machine-locked security, everything local
10. **FAQ answers to have ready:**
    - "Can someone share their license key?" — No, keys are machine-locked. One key = one device.
    - "Why not just use Plex?" — Plex requires a server. This is a lightweight desktop app for local playback.
    - "Does it modify my files?" — Never. It only reads file paths and names.
    - "Linux/Mac support?" — Windows only for now, but it's on the roadmap.
    - "Is my data uploaded anywhere?" — No. Everything stays on your machine. TMDB is only used for poster/metadata lookups.
