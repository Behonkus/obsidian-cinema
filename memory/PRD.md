# Obsidian Cinema - PRD

## Original Problem Statement
Build an app that will scan directories of movie files and display associated movie posters that can be clicked on to play the file using MPC-HC.

## User Choices
1. **Poster Source**: TMDB API (The Movie Database)
2. **Video Formats**: All formats supported (.mp4, .mkv, .avi, .mov, .wmv, etc.)
3. **Directory Scanning**: Multiple directories with recursive scanning, including network shares
4. **Play Options**: Both MPC-HC protocol link + clipboard copy
5. **Theme**: Dark theme

## Architecture

### Tech Stack
- **Frontend**: React 19, Tailwind CSS, Shadcn UI, Framer Motion
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **External API**: TMDB for movie posters/metadata

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/ | Health check |
| GET | /api/config | API configuration status |
| POST | /api/directories | Add a new directory |
| GET | /api/directories | List all directories |
| DELETE | /api/directories/{id} | Remove a directory |
| POST | /api/directories/validate | Validate directory path (local/network) |
| POST | /api/directories/{id}/scan | Scan single directory for movies |
| POST | /api/scan | Scan all directories for movies |
| POST | /api/movies/add | Add a single movie |
| POST | /api/movies/bulk-add | Bulk add movies |
| GET | /api/movies | Get all movies (with filters) |
| GET | /api/movies/{id} | Get single movie details |
| POST | /api/movies/{id}/fetch-metadata | Fetch TMDB metadata |
| POST | /api/movies/fetch-all-metadata | Fetch metadata for all movies |
| DELETE | /api/movies/{id} | Delete a movie |
| POST | /api/movies/{id}/search-tmdb | Search TMDB with custom query |
| POST | /api/movies/{id}/set-tmdb | Set specific TMDB ID for movie |
| GET | /api/stats | Get library statistics |

## User Personas
- **Home Media Enthusiasts**: Users with large movie collections wanting a visual browser
- **Power Users**: Those who prefer keyboard shortcuts and quick access to file paths
- **NAS Users**: People with network-attached storage for their media library

## Core Requirements (Static)
- [x] Directory management (add/remove)
- [x] Movie file detection (all video formats)
- [x] Movie poster grid display
- [x] Movie detail modal with info
- [x] MPC-HC protocol link generation
- [x] Copy file path to clipboard
- [x] TMDB integration for metadata/posters
- [x] Search and filter functionality
- [x] Dark theme UI
- [x] Network share scanning (UNC paths)

## What's Been Implemented (Feb 2026)
- ✅ Full backend API with 19 endpoints
- ✅ MongoDB models for directories and movies
- ✅ TMDB integration with caching
- ✅ Movie title/year extraction from filenames
- ✅ React frontend with Obsidian Cinema dark theme
- ✅ Sidebar navigation
- ✅ Movie poster grid with hover effects
- ✅ Movie detail modal with play/copy options
- ✅ Directory management page
- ✅ Import Movies feature (paste file paths)
- ✅ **Network directory scanning** (UNC paths: \\server\share)
- ✅ **Recursive directory scanning**
- ✅ **Scan All / Scan individual directories**
- ✅ **Path validation API**
- ✅ Search, directory filter, metadata filter
- ✅ Grid size toggle (compact/normal views)
- ✅ Framer Motion animations
- ✅ Responsive design

## P0 Features (Critical - Done)
- [x] Directory management
- [x] Movie import/display
- [x] Play/copy functionality
- [x] Network share scanning

## P1 Features (Important - Pending)
- [ ] TMDB API key configuration UI
- [ ] Batch metadata fetching improvements
- [ ] Real-time scan progress indicator

## P2 Features (Nice to Have)
- [ ] Custom poster upload
- [ ] Collections/favorites
- [ ] Watch history
- [ ] Sorting options (by title, year, rating)
- [ ] Keyboard shortcuts

## Next Action Items
1. **Add TMDB API key** - Get free key from https://www.themoviedb.org/settings/api and add to /app/backend/.env as TMDB_API_KEY="your_key"
2. **Click "Fetch All" button** - Once API key is added, fetch posters for all movies
3. **Configure MPC-HC protocol handler** - On Windows, may need to register mpc-hc:// protocol

## Notes
- MPC-HC must be installed on the user's Windows machine for play links to work
- TMDB API key is required for poster/metadata fetching (currently not configured)
- Network shares must be accessible from the server where the backend runs
- For network paths: use UNC format like \\\\server\\share\\movies or //server/share/movies
