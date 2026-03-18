# Obsidian Cinema — Marketing Materials

---

## Blog Post

### Title: Introducing Obsidian Cinema — Your Movie Library, Beautifully Organized

If you've ever stared at a folder full of `.mkv` and `.mp4` files wondering which one is which, this is for you.

**Obsidian Cinema** is a free Windows desktop app that scans your local and network drives, automatically fetches movie posters and metadata from The Movie Database (TMDB), and turns your scattered video files into a polished, browsable library.

#### The Problem

Most of us have movies spread across internal drives, external USB disks, and network shares. File names are inconsistent, there are no thumbnails, and finding what you want to watch means scrolling through a bland file explorer. Media servers like Plex or Jellyfin are overkill when you just want to *see* your movies and *play* them.

#### The Solution

Obsidian Cinema sits between a file manager and a full media server. Point it at any directory — `C:\Movies`, `D:\Films`, `\\NAS\Media` — and it does the rest:

- **Automatic poster & metadata fetch** from TMDB (title, year, rating, genre, overview).
- **One-click playback** in your default media player (VLC, MPC, Windows Media Player — your choice).
- **Advanced sorting** with 13 options: title, year, rating, file size, date added, directory, and more.
- **Adjustable poster grid** in small, medium, and large sizes.
- **Library statistics** with visual charts (movies by decade, rating distribution, genre breakdown).
- **18 color themes** including solid, pastel, and an animated rainbow mode.
- **Recently Deleted** — a 30-day trash so nothing is permanently lost by accident.
- **Manual poster editing** — search TMDB, paste a URL, or pick a local image file.
- **Auto-updates** — the app quietly updates itself in the background.

#### Pricing

Obsidian Cinema is free to use with a generous limit of 50 movies and 3 collections. For power users, the **Pro** tier removes all limits for a **one-time payment of $20** — no subscriptions, no recurring charges.

#### Getting Started

1. Visit [obsidiancinema.com] and create a free account.
2. Download the Windows installer.
3. Add your movie directories.
4. Enjoy your new library.

Obsidian Cinema is built for movie collectors who want a beautiful, lightweight way to browse and play their local files — without running a server or transcoding anything. Give it a try.

---

## Press Kit

### One-Liner
Obsidian Cinema is a free Windows desktop app that turns scattered movie files into a beautiful, poster-rich library with one-click playback.

### Elevator Pitch (50 words)
Obsidian Cinema scans your local and network drives, automatically fetches movie posters and metadata from TMDB, and presents your collection in a polished grid. Sort by title, year, or rating. Play any movie instantly. Free to start, $20 one-time for unlimited Pro access. No subscriptions. No servers.

### Key Facts
- **Platform:** Windows (Electron-based)
- **Price:** Free (50 movies, 3 collections) / Pro $20 one-time (unlimited)
- **Data Source:** The Movie Database (TMDB) for posters and metadata
- **Playback:** Uses system default media player (VLC, MPC, etc.)
- **Storage:** All data stays local — no cloud uploads, no streaming
- **Updates:** Built-in auto-updater

### Feature Highlights
| Feature | Details |
|---|---|
| Drive Scanning | Local drives, network shares (SMB/CIFS), USB drives |
| Metadata | Title, year, rating, genre, overview from TMDB |
| Sorting | 13 options including title, year, rating, file size, directory |
| Poster Sizes | Small, medium, large grid views |
| Themes | 18 color themes (solid, pastel, rainbow) |
| Statistics | Charts for decades, ratings, genres, collection sizes |
| Trash | 30-day "Recently Deleted" with restore |
| Poster Editor | Search TMDB, paste URL, or select local file |
| Auto-Update | Silent background updates |

### Target Audience
- Movie collectors with large local libraries
- Users with media on network-attached storage (NAS)
- People who find Plex/Jellyfin too complex for simple browsing and playback
- Anyone tired of navigating plain file explorers to find movies

### What Makes It Different
Unlike media servers (Plex, Jellyfin, Emby), Obsidian Cinema doesn't transcode, stream, or require a running server. It's a lightweight desktop app that simply organizes what's already on your drives and plays files directly in your preferred player. Think of it as a beautiful frontend for your file system.

---

## Subreddit-Specific Posts

### r/datahoarder

**Title:** I built a free app to organize my 8TB movie collection — Obsidian Cinema

**Body:**
Like a lot of you, I've got movies spread across multiple drives and NAS shares. I got tired of navigating Windows Explorer to find something to watch, so I built Obsidian Cinema.

It's a lightweight Windows desktop app that:
- Scans local drives, network shares, and USB drives for video files
- Automatically pulls posters, ratings, year, genre, and synopsis from TMDB
- Displays everything in a poster grid (adjustable sizes)
- Plays files in your default player with one click
- Sorts by 13 different options (title, year, rating, file size, directory, date added, etc.)
- Lets you filter by directory so you're not loading 10,000 movies at once

Everything stays local. No cloud, no streaming, no server process running in the background. Your files stay exactly where they are — this just makes them look nice.

Free tier handles up to 50 movies. Pro is a one-time $20 for unlimited (no subscription). There's also collections, a stats page with charts, 18 themes, and a 30-day trash/restore feature.

Would appreciate any feedback from this community. You're the exact people I built it for.

Link: [your URL]

---

### r/selfhosted

**Title:** Obsidian Cinema — a local movie organizer that doesn't need a server

**Body:**
I know this community leans toward self-hosted solutions, so I wanted to be upfront: this is a desktop app, not a server. But hear me out — I think it fills a gap.

I love Plex and Jellyfin for streaming, but sometimes I just want to browse what's on my NAS and play it locally. I don't need transcoding, remote access, or user accounts. I just want to see my movies with posters and click play.

That's what Obsidian Cinema does:
- Point it at any directory (local, network, USB)
- It fetches posters and metadata from TMDB automatically
- Browse a poster grid, sort by anything, play in VLC/MPC/whatever
- No server, no Docker container, no ports to open
- Everything stored locally on your machine

Think of it as a pretty frontend for your filesystem's movie folders. If you've got Plex or Jellyfin handling your streaming and just want something lightweight for local browsing, this might be useful.

Free for up to 50 movies. One-time $20 removes the limit. Windows only for now.

Link: [your URL]

---

### r/software

**Title:** Obsidian Cinema — free Windows app that organizes local movie files with TMDB posters

**Body:**
I built a desktop app for managing local movie collections. If you have movies on your hard drives, external drives, or network shares and want something better than Windows Explorer to browse them, this is for you.

**What it does:**
- Scans any directory for video files (.mkv, .mp4, .avi, etc.)
- Fetches movie posters, ratings, year, genre, and synopsis from TMDB
- Displays movies in an adjustable poster grid
- One-click playback in your default media player
- 13 sort options, search, directory filtering, collections
- 18 color themes, library statistics with charts
- 30-day trash with restore
- Auto-updates built in

**What it doesn't do:**
- No streaming, no transcoding, no server
- No cloud uploads — everything stays on your machine
- Doesn't modify or move your files

Free tier: 50 movies, 3 collections. Pro: one-time $20, unlimited everything.

Happy to answer questions or take feature requests.

Link: [your URL]

---

### r/windows

**Title:** I made a free movie library app for Windows — organizes local files with TMDB posters

**Body:**
If you've got a bunch of movie files scattered across drives and you're tired of browsing them in File Explorer, I made something for that.

Obsidian Cinema is a Windows desktop app that scans your folders for video files, automatically fetches movie posters and info from TMDB, and shows everything in a clean poster grid. Click any movie to play it in your default player (VLC, MPC, whatever you use).

Features:
- Scan local drives, USB, and network shares
- Automatic poster/metadata from TMDB
- 13 sort options, adjustable poster sizes (S/M/L)
- Filter by directory to browse one folder at a time
- Collections, library stats, 18 themes
- 30-day recycle bin for removed movies
- Silent auto-updates

It's free for up to 50 movies. If you need more, Pro is a one-time $20 — no subscription.

No server required, everything runs and stores locally. Would love feedback.

Link: [your URL]

---

### r/htpc

**Title:** Built a lightweight movie organizer for local playback — no server needed

**Body:**
Hey HTPC folks. I built Obsidian Cinema as a simpler alternative for people who just want to browse and play local movie files without running Plex or Jellyfin.

The use case: you've got movies on internal drives, external USB, or NAS shares. You want to see them with posters and play them with one click. You don't need streaming, transcoding, or remote access — just a nice local interface.

What it does:
- Scans any directory for video files
- Fetches posters, ratings, year, genre, overview from TMDB
- Poster grid view with adjustable sizes
- One-click playback in your system default player
- Sort by title, year, rating, file size, directory, and more
- Filter by directory (great for large collections across multiple drives)
- Collections, stats page, 18 color themes
- Rescan directories to pick up new additions without re-importing everything

It's a standalone Windows app — no server process, no Docker, no configuration. Install and point it at your folders.

Free for 50 movies. One-time $20 for unlimited.

If any of you run an HTPC primarily for local playback, I'd love to hear if this fits your workflow.

Link: [your URL]

---

### r/PleX

**Title:** Not a Plex replacement, but a companion for local browsing — Obsidian Cinema

**Body:**
I want to be clear upfront: this isn't trying to replace Plex. I use Plex myself. But there are times I just want to browse what's on a drive and play it locally without going through Plex's server.

Obsidian Cinema is a lightweight Windows app that:
- Scans local/network drives for movie files
- Shows them in a poster grid with TMDB metadata
- Lets you play anything in VLC, MPC, or whatever your default player is
- No server, no transcoding, no library scanning delays

I find it useful for:
- Drives I haven't added to Plex yet
- Quick browsing on a laptop with a USB drive
- Network shares that aren't in my Plex library
- When I just want something simpler and faster

It's not a media server. It's more like a really nice file browser specifically for movies. Free for up to 50 movies, one-time $20 for unlimited.

Curious if anyone else has this "I just want to browse and play" use case.

Link: [your URL]

---

## Social Media

### Twitter / X
> Tired of scrolling through folders of unnamed .mkv files? Obsidian Cinema scans your drives, fetches TMDB posters, and lets you play any movie with one click. Free for Windows. #MovieLibrary #DesktopApp

### Product Hunt
**Tagline:** "Your movie library, beautifully organized. No server required."

**Description:** Obsidian Cinema scans your local and network drives for movie files, automatically fetches posters and metadata from TMDB, and displays your collection in a beautiful poster grid. Sort, filter, organize into collections, and play any movie with one click in your default media player. Free for up to 50 movies, $20 one-time for unlimited. No subscriptions. No servers. Everything stays local.

---

## Posting Tips

1. **Start with r/datahoarder** — highest chance of positive reception
2. **Wait 24-48 hours**, then post to r/selfhosted
3. **Space posts out** — don't post to all subreddits on the same day (looks like spam)
4. **Engage with every comment** — answer questions, take feedback seriously, thank people
5. **Don't delete and repost** if a post doesn't get traction — Reddit flags this
6. **Submit to Product Hunt on a Tuesday or Wednesday morning** (highest traffic days)
7. **Replace [your URL] with your actual landing page** before posting
