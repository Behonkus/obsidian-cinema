# Obsidian Cinema - PRD

## Original Problem Statement
Build an app that will scan directories of movie files and display associated movie posters that can be clicked on to play the file using MPC-HC.

## User Choices
1. **Poster Source**: TMDB API (The Movie Database)
2. **Video Formats**: All formats supported (.mp4, .mkv, .avi, .mov, .wmv, etc.)
3. **Directory Scanning**: Multiple directories with recursive scanning, including network shares
4. **Play Options**: Both MPC-HC protocol link + clipboard copy
5. **Theme**: Dark theme
6. **Monetization**: Pro tier with one-time payment ($29.99)
7. **Authentication**: Emergent-managed Google OAuth + JWT sessions

## Architecture

### Tech Stack
- **Frontend**: React 19, Tailwind CSS, Shadcn UI, Framer Motion
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **External APIs**: 
  - TMDB for movie posters/metadata
  - Stripe for payments
  - Emergent Auth for Google OAuth

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
| **Auth Endpoints** | | |
| POST | /api/auth/session | Process OAuth session_id |
| GET | /api/auth/me | Get current user info |
| POST | /api/auth/logout | Logout user |
| **Stripe Endpoints** | | |
| POST | /api/stripe/create-checkout-session | Create Stripe checkout |
| GET | /api/stripe/checkout-status/{session_id} | Get payment status |
| POST | /api/webhook/stripe | Stripe webhook handler |
| **User Endpoints** | | |
| GET | /api/user/limits | Get user limits |
| GET | /api/pricing | Get pricing info |

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
- [x] User authentication (Google OAuth)
- [x] Pro tier with Stripe payments

## What's Been Implemented (Feb 2026)

### Core Features
- ✅ Full backend API with 30+ endpoints
- ✅ MongoDB models for directories, movies, collections, users
- ✅ TMDB integration with caching
- ✅ Movie title/year extraction from filenames
- ✅ React frontend with Obsidian Cinema dark theme
- ✅ Sidebar navigation (Library, Collections, Directories, Settings)
- ✅ Movie poster grid with hover effects
- ✅ Movie detail modal with play/copy/collection options
- ✅ Directory management page
- ✅ Import Movies feature (paste file paths)
- ✅ Network directory scanning (UNC paths: \\server\share)
- ✅ Recursive directory scanning
- ✅ Scan All / Scan individual directories
- ✅ Path validation API
- ✅ Settings page with TMDB API key configuration
- ✅ Favorites/Watchlist/Watched feature with filtering
- ✅ Local poster repository - posters cached separately from movie dirs
- ✅ Movie sorting (title, year, rating, date added)
- ✅ Custom Collections/Playlists - group movies together
- ✅ Search, directory filter, metadata filter
- ✅ Grid size toggle (compact/normal views)
- ✅ Framer Motion animations
- ✅ Responsive design

### Pro Tier (Feb 12, 2026)
- ✅ User authentication with Emergent Google OAuth
- ✅ Login page with Google OAuth button
- ✅ Protected routes with auth guards
- ✅ Stripe integration for one-time payments
- ✅ Upgrade page with pricing cards
- ✅ Free tier: 30 movies, 3 collections
- ✅ Pro tier: $29.99 one-time, unlimited access
- ✅ User menu in sidebar with Pro badge
- ✅ Checkout session creation and status polling
- ✅ Session-based authentication with httpOnly cookies

## Database Schema

### Users Collection
```javascript
{
  user_id: "user_xxx",  // Custom UUID
  email: "user@example.com",
  name: "User Name",
  picture: "https://...",
  subscription_tier: "free" | "pro",
  movies_count: 0,
  collections_count: 0,
  stripe_customer_id: null,
  created_at: ISODate()
}
```

### User Sessions Collection
```javascript
{
  user_id: "user_xxx",
  session_token: "xxx",
  expires_at: ISODate(),
  created_at: ISODate()
}
```

### Payment Transactions Collection
```javascript
{
  transaction_id: "txn_xxx",
  user_id: "user_xxx",
  session_id: "cs_xxx",
  amount: 29.99,
  currency: "usd",
  payment_status: "pending" | "paid" | "failed" | "expired",
  metadata: {},
  created_at: ISODate()
}
```

## P0 Features (Critical - Done)
- [x] Directory management
- [x] Movie import/display
- [x] Play/copy functionality
- [x] Network share scanning
- [x] Settings page with TMDB API key configuration
- [x] Favorites/Watchlist/Watched feature
- [x] Local poster repository
- [x] Movie sorting
- [x] Custom Collections/Playlists
- [x] User authentication (Google OAuth)
- [x] Pro tier with Stripe integration

## P1 Features (Important - Pending)
- [ ] Batch metadata fetching improvements
- [ ] Real-time scan progress indicator
- [ ] Enforce usage limits on movie/collection creation for free users

## P2 Features (Nice to Have)
- [ ] Custom poster upload
- [ ] Import/export library data
- [ ] Keyboard shortcuts
- [ ] Smart collections (auto-populated by rules)

## Next Action Items
1. **Sign in** - Use Google OAuth to create your account
2. **Add TMDB API key** - Get free key from https://www.themoviedb.org/settings/api
3. **Add directories** - Point to your movie collection folders
4. **Scan & fetch metadata** - Let the app discover your movies
5. **Upgrade to Pro** - $29.99 for unlimited movies and collections

## Notes
- MPC-HC must be installed on the user's Windows machine for play links to work
- TMDB API key is required for poster/metadata fetching
- Network shares must be accessible from the server where the backend runs
- For network paths: use UNC format like \\\\server\\share\\movies or //server/share/movies
- Stripe test key is pre-configured for development
