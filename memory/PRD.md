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
8. **Referral Program**: Pro users get referral codes, referred users get $5 off

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
| POST | /api/stripe/create-checkout-session | Create Stripe checkout (with referral support) |
| GET | /api/stripe/checkout-status/{session_id} | Get payment status |
| POST | /api/webhook/stripe | Stripe webhook handler |
| **User Endpoints** | | |
| GET | /api/user/limits | Get user limits |
| GET | /api/pricing | Get pricing info (with referral discount) |
| **Referral Endpoints** | | |
| GET | /api/referral/validate/{code} | Validate referral code |

## What's Been Implemented

### Core Features (Feb 2026)
- ✅ Full backend API with 35+ endpoints
- ✅ MongoDB models for directories, movies, collections, users, payments
- ✅ TMDB integration with caching
- ✅ Movie title/year extraction from filenames
- ✅ React frontend with Obsidian Cinema dark theme
- ✅ Sidebar navigation (Library, Collections, Directories, Settings)
- ✅ Movie poster grid with hover effects
- ✅ Movie detail modal with play/copy/collection options
- ✅ Directory management page
- ✅ Network directory scanning (UNC paths)
- ✅ Favorites/Watchlist/Watched feature with filtering
- ✅ Local poster repository
- ✅ Movie sorting (title, year, rating, date added)
- ✅ Custom Collections/Playlists

### Pro Tier & Auth (Feb 12, 2026)
- ✅ User authentication with Emergent Google OAuth
- ✅ Login page with Google OAuth button
- ✅ Protected routes with auth guards
- ✅ Stripe integration for one-time payments
- ✅ Upgrade page with pricing cards
- ✅ Free tier: 30 movies, 3 collections
- ✅ Pro tier: $29.99 one-time, unlimited access
- ✅ User menu in sidebar with Pro badge
- ✅ Session-based authentication with httpOnly cookies

### Referral Program (Feb 12, 2026)
- ✅ Auto-generated referral codes for Pro users (CINEMA-XXXXXX format)
- ✅ $5 discount for referred users ($24.99 instead of $29.99)
- ✅ Referral code validation endpoint
- ✅ Referral code input on upgrade page
- ✅ Discount display with strikethrough pricing
- ✅ Referral count tracking for Pro users
- ✅ Referral code display in user dropdown menu
- ✅ Copy referral code functionality
- ✅ "Share & Earn" section on Pro user upgrade page
- ✅ Email notifications when referral converts (SendGrid integration ready, **requires API key**)

## Email Notifications (Ready but NOT ENABLED)
To enable referral success email notifications:
1. Get a SendGrid API key from https://app.sendgrid.com/settings/api_keys
2. Add to `/app/backend/.env`:
   ```
   SENDGRID_API_KEY=SG.your_api_key_here
   SENDER_EMAIL=noreply@yourdomain.com
   ```
3. Restart backend: `sudo supervisorctl restart backend`

## Database Schema

### Users Collection
```javascript
{
  user_id: "user_xxx",
  email: "user@example.com",
  name: "User Name",
  picture: "https://...",
  subscription_tier: "free" | "pro",
  movies_count: 0,
  collections_count: 0,
  stripe_customer_id: null,
  referral_code: "CINEMA-ABC123",  // Generated for Pro users
  referral_count: 0,               // Successful referrals
  referred_by: "user_xxx",         // Who referred this user
  created_at: ISODate()
}
```

## Pricing Structure
| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | 30 movies, 3 collections, basic features |
| Pro | $29.99 | Unlimited movies & collections, priority support, referral code |
| Pro (with referral) | $24.99 | Same as Pro, $5 discount applied |

## P0 Features (Critical - Done)
- [x] Directory management
- [x] Movie import/display
- [x] Play/copy functionality
- [x] Network share scanning
- [x] TMDB API key configuration
- [x] Favorites/Watchlist/Watched
- [x] Custom Collections
- [x] User authentication (Google OAuth)
- [x] Pro tier with Stripe
- [x] Referral program
- [x] **Free tier limits enforcement** (30 movies, 3 collections max)

## P1 Features (Important - Pending)
- [x] **Bulk metadata fetch** - Auto-find posters for all movies without them (SSE progress)
- [x] **Real-time scan progress indicator** - Shows directories, files found, movies added
- [ ] Welcome email for new users

## P2 Features (Nice to Have)
- [ ] Custom poster upload
- [ ] Import/export library data
- [ ] Keyboard shortcuts
- [ ] Smart collections (auto-populated by rules)

## Next Action Items
1. **Sign in** - Use Google OAuth to create your account
2. **Add TMDB API key** - Get free key from themoviedb.org
3. **Add directories** - Point to your movie collection folders
4. **Scan & fetch metadata** - Let the app discover your movies
5. **Upgrade to Pro** - $29.99 (or $24.99 with referral code) for unlimited access
6. **Share your code** - Pro users can share their referral code for friends to save $5
