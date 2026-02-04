from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import re
import json
import time
import httpx
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# TMDB Configuration
TMDB_API_KEY = os.environ.get('TMDB_API_KEY', '')
TMDB_BASE_URL = "https://api.themoviedb.org/3"
IMAGE_BASE_URL = "https://image.tmdb.org/t/p/"

# Video file extensions
VIDEO_EXTENSIONS = {
    '.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v',
    '.mpg', '.mpeg', '.m2v', '.ts', '.mts', '.m2ts', '.vob', '.ogv',
    '.3gp', '.3g2', '.divx', '.xvid', '.rm', '.rmvb', '.asf'
}

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# TMDB Cache
tmdb_cache = {}
CACHE_TTL = 3600  # 1 hour

# Models
class Directory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    path: str
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_scanned: Optional[datetime] = None

class DirectoryCreate(BaseModel):
    path: str
    name: Optional[str] = None

class Movie(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    file_path: str
    file_name: str
    directory_id: str
    title: Optional[str] = None
    year: Optional[int] = None
    poster_path: Optional[str] = None
    backdrop_path: Optional[str] = None
    overview: Optional[str] = None
    rating: Optional[float] = None
    tmdb_id: Optional[int] = None
    genres: List[str] = Field(default_factory=list)
    runtime: Optional[int] = None
    release_date: Optional[str] = None
    metadata_fetched: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ScanResult(BaseModel):
    total_files: int
    new_movies: int
    directories_scanned: int

class TMDBSearchResult(BaseModel):
    tmdb_id: int
    title: str
    year: Optional[int]
    poster_path: Optional[str]
    overview: Optional[str]

# TMDB Helper Functions
async def tmdb_request(endpoint: str, params: dict = None) -> Optional[dict]:
    """Make a request to TMDB API with caching."""
    if not TMDB_API_KEY:
        return None
    
    params = params or {}
    cache_key = f"{endpoint}_{json.dumps(params, sort_keys=True)}"
    
    # Check cache
    cached = tmdb_cache.get(cache_key)
    if cached and time.time() - cached["ts"] < CACHE_TTL:
        return cached["data"]
    
    url = f"{TMDB_BASE_URL}{endpoint}"
    params["api_key"] = TMDB_API_KEY
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=10)
            if response.status_code == 429:
                await asyncio.sleep(2)
                response = await client.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            tmdb_cache[cache_key] = {"data": data, "ts": time.time()}
            return data
    except Exception as e:
        logging.error(f"TMDB request error: {e}")
        return None

def get_poster_url(path: str, size: str = "w500") -> Optional[str]:
    """Get full poster URL from TMDB path."""
    return f"{IMAGE_BASE_URL}{size}{path}" if path else None

def get_backdrop_url(path: str, size: str = "w1280") -> Optional[str]:
    """Get full backdrop URL from TMDB path."""
    return f"{IMAGE_BASE_URL}{size}{path}" if path else None

def clean_movie_name(filename: str) -> tuple[str, Optional[int]]:
    """Extract movie title and year from filename."""
    # Remove extension
    name = Path(filename).stem
    
    # Common patterns to remove
    patterns_to_remove = [
        r'\[.*?\]', r'\((?!19|20)\d{4}\)',  # Brackets except year
        r'(?i)(720p|1080p|2160p|4k|uhd|hdr|bluray|blu-ray|brrip|webrip|web-dl|dvdrip|hdtv|x264|x265|hevc|aac|ac3|dts|remux)',
        r'(?i)(extended|unrated|directors\.cut|theatrical|remastered)',
        r'[-_.]', r'\s{2,}'
    ]
    
    # Extract year
    year_match = re.search(r'[\(\[]?(19|20)\d{2}[\)\]]?', name)
    year = int(year_match.group().strip('()[]')) if year_match else None
    
    # Clean name
    for pattern in patterns_to_remove:
        name = re.sub(pattern, ' ', name)
    
    # Remove year from name
    if year:
        name = re.sub(rf'{year}', '', name)
    
    return name.strip(), year

async def search_movie_tmdb(title: str, year: Optional[int] = None) -> Optional[dict]:
    """Search for a movie on TMDB."""
    params = {"query": title}
    if year:
        params["year"] = year
    
    result = await tmdb_request("/search/movie", params)
    if result and result.get("results"):
        return result["results"][0]
    return None

async def get_movie_details(tmdb_id: int) -> Optional[dict]:
    """Get detailed movie info from TMDB."""
    return await tmdb_request(f"/movie/{tmdb_id}", {
        "append_to_response": "credits,videos"
    })

# API Endpoints
@api_router.get("/")
async def root():
    return {"message": "Obsidian Cinema API"}

@api_router.get("/config")
async def get_config():
    """Get API configuration status."""
    return {
        "tmdb_configured": bool(TMDB_API_KEY),
        "video_extensions": list(VIDEO_EXTENSIONS)
    }

# Directory endpoints
@api_router.post("/directories", response_model=Directory)
async def create_directory(input_data: DirectoryCreate):
    """Add a new directory to scan."""
    path = input_data.path.strip()
    
    # Check if directory already exists
    existing = await db.directories.find_one({"path": path}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Directory already exists")
    
    name = input_data.name or Path(path).name
    directory = Directory(path=path, name=name)
    
    doc = directory.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    if doc.get('last_scanned'):
        doc['last_scanned'] = doc['last_scanned'].isoformat()
    
    await db.directories.insert_one(doc)
    return directory

@api_router.get("/directories", response_model=List[Directory])
async def get_directories():
    """Get all directories."""
    directories = await db.directories.find({}, {"_id": 0}).to_list(100)
    for d in directories:
        if isinstance(d.get('created_at'), str):
            d['created_at'] = datetime.fromisoformat(d['created_at'])
        if isinstance(d.get('last_scanned'), str):
            d['last_scanned'] = datetime.fromisoformat(d['last_scanned'])
    return directories

@api_router.delete("/directories/{directory_id}")
async def delete_directory(directory_id: str):
    """Delete a directory and its associated movies."""
    result = await db.directories.delete_one({"id": directory_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Directory not found")
    
    # Also delete movies from this directory
    await db.movies.delete_many({"directory_id": directory_id})
    return {"message": "Directory deleted", "id": directory_id}

# Scan endpoints
@api_router.post("/scan", response_model=ScanResult)
async def scan_directories():
    """Scan all directories for movie files."""
    directories = await db.directories.find({}, {"_id": 0}).to_list(100)
    
    total_files = 0
    new_movies = 0
    
    for directory in directories:
        dir_path = Path(directory["path"])
        
        # Note: In a real scenario, this would scan actual filesystem
        # For demo purposes, we'll simulate finding movie files
        # The actual scanning would happen on the client side
        
        # Update last_scanned
        await db.directories.update_one(
            {"id": directory["id"]},
            {"$set": {"last_scanned": datetime.now(timezone.utc).isoformat()}}
        )
    
    return ScanResult(
        total_files=total_files,
        new_movies=new_movies,
        directories_scanned=len(directories)
    )

@api_router.post("/movies/add")
async def add_movie(file_path: str, file_name: str, directory_id: str):
    """Add a movie file to the database."""
    # Check if movie already exists
    existing = await db.movies.find_one({"file_path": file_path}, {"_id": 0})
    if existing:
        return existing
    
    # Extract title and year from filename
    title, year = clean_movie_name(file_name)
    
    movie = Movie(
        file_path=file_path,
        file_name=file_name,
        directory_id=directory_id,
        title=title,
        year=year
    )
    
    doc = movie.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.movies.insert_one(doc)
    return movie

@api_router.post("/movies/bulk-add")
async def bulk_add_movies(movies: List[dict]):
    """Add multiple movies at once."""
    added = []
    for m in movies:
        file_path = m.get("file_path")
        file_name = m.get("file_name")
        directory_id = m.get("directory_id")
        
        if not all([file_path, file_name, directory_id]):
            continue
        
        # Check if movie already exists
        existing = await db.movies.find_one({"file_path": file_path}, {"_id": 0})
        if existing:
            added.append(existing)
            continue
        
        # Extract title and year from filename
        title, year = clean_movie_name(file_name)
        
        movie = Movie(
            file_path=file_path,
            file_name=file_name,
            directory_id=directory_id,
            title=title,
            year=year
        )
        
        doc = movie.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        
        await db.movies.insert_one(doc)
        added.append(movie.model_dump())
    
    return {"added": len(added), "movies": added}

@api_router.get("/movies", response_model=List[Movie])
async def get_movies(
    search: Optional[str] = None,
    directory_id: Optional[str] = None,
    has_metadata: Optional[bool] = None
):
    """Get all movies with optional filters."""
    query = {}
    
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"file_name": {"$regex": search, "$options": "i"}}
        ]
    
    if directory_id:
        query["directory_id"] = directory_id
    
    if has_metadata is not None:
        query["metadata_fetched"] = has_metadata
    
    movies = await db.movies.find(query, {"_id": 0}).to_list(1000)
    
    for m in movies:
        if isinstance(m.get('created_at'), str):
            m['created_at'] = datetime.fromisoformat(m['created_at'])
    
    return movies

@api_router.get("/movies/{movie_id}", response_model=Movie)
async def get_movie(movie_id: str):
    """Get a single movie by ID."""
    movie = await db.movies.find_one({"id": movie_id}, {"_id": 0})
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    if isinstance(movie.get('created_at'), str):
        movie['created_at'] = datetime.fromisoformat(movie['created_at'])
    
    return movie

@api_router.post("/movies/{movie_id}/fetch-metadata")
async def fetch_movie_metadata(movie_id: str):
    """Fetch metadata from TMDB for a movie."""
    movie = await db.movies.find_one({"id": movie_id}, {"_id": 0})
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    if not TMDB_API_KEY:
        raise HTTPException(status_code=400, detail="TMDB API key not configured")
    
    # Search TMDB
    search_result = await search_movie_tmdb(movie.get("title", ""), movie.get("year"))
    
    if not search_result:
        return {"message": "No results found on TMDB", "movie_id": movie_id}
    
    # Get detailed info
    details = await get_movie_details(search_result["id"])
    
    if details:
        update_data = {
            "tmdb_id": details["id"],
            "title": details.get("title", movie.get("title")),
            "overview": details.get("overview"),
            "poster_path": get_poster_url(details.get("poster_path")),
            "backdrop_path": get_backdrop_url(details.get("backdrop_path")),
            "rating": details.get("vote_average"),
            "runtime": details.get("runtime"),
            "release_date": details.get("release_date"),
            "genres": [g["name"] for g in details.get("genres", [])],
            "metadata_fetched": True
        }
        
        if details.get("release_date"):
            try:
                update_data["year"] = int(details["release_date"][:4])
            except:
                pass
        
        await db.movies.update_one(
            {"id": movie_id},
            {"$set": update_data}
        )
        
        # Return updated movie
        updated = await db.movies.find_one({"id": movie_id}, {"_id": 0})
        if isinstance(updated.get('created_at'), str):
            updated['created_at'] = datetime.fromisoformat(updated['created_at'])
        return updated
    
    return {"message": "Could not fetch details", "movie_id": movie_id}

@api_router.post("/movies/fetch-all-metadata")
async def fetch_all_metadata():
    """Fetch metadata for all movies without metadata."""
    if not TMDB_API_KEY:
        raise HTTPException(status_code=400, detail="TMDB API key not configured")
    
    movies = await db.movies.find({"metadata_fetched": False}, {"_id": 0}).to_list(100)
    
    updated_count = 0
    for movie in movies:
        try:
            result = await fetch_movie_metadata(movie["id"])
            if isinstance(result, dict) and result.get("metadata_fetched"):
                updated_count += 1
            # Add small delay to avoid rate limiting
            await asyncio.sleep(0.3)
        except Exception as e:
            logging.error(f"Error fetching metadata for {movie['id']}: {e}")
    
    return {"updated": updated_count, "total": len(movies)}

@api_router.delete("/movies/{movie_id}")
async def delete_movie(movie_id: str):
    """Delete a movie."""
    result = await db.movies.delete_one({"id": movie_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Movie not found")
    return {"message": "Movie deleted", "id": movie_id}

@api_router.post("/movies/{movie_id}/search-tmdb")
async def search_tmdb_for_movie(movie_id: str, query: str, year: Optional[int] = None):
    """Search TMDB with custom query for a movie."""
    if not TMDB_API_KEY:
        raise HTTPException(status_code=400, detail="TMDB API key not configured")
    
    params = {"query": query}
    if year:
        params["year"] = year
    
    result = await tmdb_request("/search/movie", params)
    
    if not result or not result.get("results"):
        return {"results": []}
    
    return {
        "results": [
            {
                "tmdb_id": r["id"],
                "title": r.get("title"),
                "year": int(r["release_date"][:4]) if r.get("release_date") else None,
                "poster_path": get_poster_url(r.get("poster_path"), "w185"),
                "overview": r.get("overview", "")[:200]
            }
            for r in result["results"][:10]
        ]
    }

@api_router.post("/movies/{movie_id}/set-tmdb")
async def set_movie_tmdb(movie_id: str, tmdb_id: int):
    """Set a specific TMDB ID for a movie and fetch its metadata."""
    movie = await db.movies.find_one({"id": movie_id}, {"_id": 0})
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    if not TMDB_API_KEY:
        raise HTTPException(status_code=400, detail="TMDB API key not configured")
    
    details = await get_movie_details(tmdb_id)
    
    if not details:
        raise HTTPException(status_code=404, detail="TMDB movie not found")
    
    update_data = {
        "tmdb_id": details["id"],
        "title": details.get("title", movie.get("title")),
        "overview": details.get("overview"),
        "poster_path": get_poster_url(details.get("poster_path")),
        "backdrop_path": get_backdrop_url(details.get("backdrop_path")),
        "rating": details.get("vote_average"),
        "runtime": details.get("runtime"),
        "release_date": details.get("release_date"),
        "genres": [g["name"] for g in details.get("genres", [])],
        "metadata_fetched": True
    }
    
    if details.get("release_date"):
        try:
            update_data["year"] = int(details["release_date"][:4])
        except:
            pass
    
    await db.movies.update_one(
        {"id": movie_id},
        {"$set": update_data}
    )
    
    updated = await db.movies.find_one({"id": movie_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated

# Stats endpoint
@api_router.get("/stats")
async def get_stats():
    """Get library statistics."""
    total_movies = await db.movies.count_documents({})
    with_metadata = await db.movies.count_documents({"metadata_fetched": True})
    total_directories = await db.directories.count_documents({})
    
    return {
        "total_movies": total_movies,
        "with_metadata": with_metadata,
        "without_metadata": total_movies - with_metadata,
        "total_directories": total_directories
    }

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

import asyncio

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
