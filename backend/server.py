from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import re
import json
import time
import httpx
import hashlib
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

# Poster Repository Configuration
POSTER_REPO_DIR = Path(os.environ.get('POSTER_REPO_DIR', ROOT_DIR / 'poster_repository'))
POSTER_REPO_DIR.mkdir(parents=True, exist_ok=True)

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

class Collection(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    color: str = "#e11d48"  # Default to primary red
    icon: str = "folder"  # Default icon
    movie_ids: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CollectionCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = "#e11d48"
    icon: Optional[str] = "folder"

class CollectionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None

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
    is_favorite: bool = False
    is_watchlist: bool = False
    watched: bool = False
    collection_ids: List[str] = Field(default_factory=list)
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

def get_poster_filename(tmdb_path: str) -> str:
    """Generate a unique filename for a poster based on TMDB path."""
    # Use the TMDB path as basis (e.g., /abc123.jpg -> abc123.jpg)
    if tmdb_path:
        return tmdb_path.lstrip('/')
    return None

async def download_and_cache_poster(tmdb_path: str, size: str = "w500") -> Optional[str]:
    """
    Download a poster from TMDB and cache it locally.
    Returns the local path to the cached poster.
    """
    if not tmdb_path:
        return None
    
    filename = get_poster_filename(tmdb_path)
    if not filename:
        return None
    
    # Create subdirectory based on size
    size_dir = POSTER_REPO_DIR / size
    size_dir.mkdir(parents=True, exist_ok=True)
    
    local_path = size_dir / filename
    
    # Check if already cached
    if local_path.exists():
        return str(local_path)
    
    # Download from TMDB
    url = f"{IMAGE_BASE_URL}{size}{tmdb_path}"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=30)
            if response.status_code == 200:
                with open(local_path, 'wb') as f:
                    f.write(response.content)
                logging.info(f"Cached poster: {filename}")
                return str(local_path)
            else:
                logging.error(f"Failed to download poster {tmdb_path}: {response.status_code}")
    except Exception as e:
        logging.error(f"Error downloading poster {tmdb_path}: {e}")
    
    return None

async def download_and_cache_backdrop(tmdb_path: str, size: str = "w1280") -> Optional[str]:
    """
    Download a backdrop from TMDB and cache it locally.
    Returns the local path to the cached backdrop.
    """
    if not tmdb_path:
        return None
    
    filename = get_poster_filename(tmdb_path)
    if not filename:
        return None
    
    # Create subdirectory for backdrops
    backdrop_dir = POSTER_REPO_DIR / "backdrops" / size
    backdrop_dir.mkdir(parents=True, exist_ok=True)
    
    local_path = backdrop_dir / filename
    
    # Check if already cached
    if local_path.exists():
        return str(local_path)
    
    # Download from TMDB
    url = f"{IMAGE_BASE_URL}{size}{tmdb_path}"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=30)
            if response.status_code == 200:
                with open(local_path, 'wb') as f:
                    f.write(response.content)
                logging.info(f"Cached backdrop: {filename}")
                return str(local_path)
            else:
                logging.error(f"Failed to download backdrop {tmdb_path}: {response.status_code}")
    except Exception as e:
        logging.error(f"Error downloading backdrop {tmdb_path}: {e}")
    
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
        "video_extensions": list(VIDEO_EXTENSIONS),
        "poster_repo_dir": str(POSTER_REPO_DIR)
    }

class SettingsUpdate(BaseModel):
    tmdb_api_key: Optional[str] = None

@api_router.get("/settings")
async def get_settings():
    """Get current settings."""
    # Count cached posters
    poster_count = 0
    if POSTER_REPO_DIR.exists():
        for subdir in POSTER_REPO_DIR.iterdir():
            if subdir.is_dir():
                poster_count += len(list(subdir.glob('*.jpg')))
    
    return {
        "tmdb_configured": bool(TMDB_API_KEY),
        "tmdb_key_masked": f"{'*' * 8}...{TMDB_API_KEY[-4:]}" if TMDB_API_KEY and len(TMDB_API_KEY) > 4 else None,
        "poster_repo_dir": str(POSTER_REPO_DIR),
        "cached_posters": poster_count
    }

# Poster serving endpoint
@api_router.get("/posters/{size}/{filename}")
async def get_poster(size: str, filename: str):
    """Serve a cached poster file."""
    poster_path = POSTER_REPO_DIR / size / filename
    if not poster_path.exists():
        raise HTTPException(status_code=404, detail="Poster not found")
    
    return FileResponse(
        poster_path,
        media_type="image/jpeg",
        headers={"Cache-Control": "public, max-age=31536000"}
    )

@api_router.get("/posters/backdrops/{size}/{filename}")
async def get_backdrop(size: str, filename: str):
    """Serve a cached backdrop file."""
    backdrop_path = POSTER_REPO_DIR / "backdrops" / size / filename
    if not backdrop_path.exists():
        raise HTTPException(status_code=404, detail="Backdrop not found")
    
    return FileResponse(
        backdrop_path,
        media_type="image/jpeg",
        headers={"Cache-Control": "public, max-age=31536000"}
    )

@api_router.post("/settings")
async def update_settings(settings: SettingsUpdate):
    """Update settings including TMDB API key."""
    global TMDB_API_KEY
    
    if settings.tmdb_api_key is not None:
        # Validate the API key by making a test request
        test_key = settings.tmdb_api_key.strip()
        
        if test_key:
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(
                        f"{TMDB_BASE_URL}/configuration",
                        params={"api_key": test_key},
                        timeout=10
                    )
                    if response.status_code != 200:
                        raise HTTPException(status_code=400, detail="Invalid TMDB API key")
            except httpx.RequestError:
                raise HTTPException(status_code=400, detail="Could not validate TMDB API key")
        
        # Update the environment variable and in-memory value
        TMDB_API_KEY = test_key
        
        # Save to .env file
        env_path = ROOT_DIR / '.env'
        env_content = ""
        key_found = False
        
        if env_path.exists():
            with open(env_path, 'r') as f:
                lines = f.readlines()
            
            new_lines = []
            for line in lines:
                if line.startswith('TMDB_API_KEY='):
                    new_lines.append(f'TMDB_API_KEY="{test_key}"\n')
                    key_found = True
                else:
                    new_lines.append(line)
            
            if not key_found:
                new_lines.append(f'TMDB_API_KEY="{test_key}"\n')
            
            env_content = ''.join(new_lines)
        else:
            env_content = f'TMDB_API_KEY="{test_key}"\n'
        
        with open(env_path, 'w') as f:
            f.write(env_content)
        
        return {
            "success": True,
            "message": "TMDB API key updated successfully",
            "tmdb_configured": bool(test_key)
        }
    
    return {"success": True, "message": "No changes made"}

@api_router.post("/settings/test-tmdb")
async def test_tmdb_key(api_key: str):
    """Test a TMDB API key without saving it."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{TMDB_BASE_URL}/configuration",
                params={"api_key": api_key.strip()},
                timeout=10
            )
            if response.status_code == 200:
                return {"valid": True, "message": "API key is valid"}
            elif response.status_code == 401:
                return {"valid": False, "message": "Invalid API key"}
            else:
                return {"valid": False, "message": f"Unexpected response: {response.status_code}"}
    except httpx.RequestError as e:
        return {"valid": False, "message": f"Connection error: {str(e)}"}

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

# Collection endpoints
@api_router.post("/collections", response_model=Collection)
async def create_collection(input_data: CollectionCreate):
    """Create a new collection."""
    collection = Collection(
        name=input_data.name,
        description=input_data.description,
        color=input_data.color or "#e11d48",
        icon=input_data.icon or "folder"
    )
    
    doc = collection.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.collections.insert_one(doc)
    return collection

@api_router.get("/collections", response_model=List[Collection])
async def get_collections():
    """Get all collections."""
    collections = await db.collections.find({}, {"_id": 0}).to_list(100)
    for c in collections:
        if isinstance(c.get('created_at'), str):
            c['created_at'] = datetime.fromisoformat(c['created_at'])
    return collections

@api_router.get("/collections/{collection_id}", response_model=Collection)
async def get_collection(collection_id: str):
    """Get a single collection by ID."""
    collection = await db.collections.find_one({"id": collection_id}, {"_id": 0})
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    if isinstance(collection.get('created_at'), str):
        collection['created_at'] = datetime.fromisoformat(collection['created_at'])
    return collection

@api_router.put("/collections/{collection_id}", response_model=Collection)
async def update_collection(collection_id: str, input_data: CollectionUpdate):
    """Update a collection."""
    collection = await db.collections.find_one({"id": collection_id}, {"_id": 0})
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    update_data = {}
    if input_data.name is not None:
        update_data["name"] = input_data.name
    if input_data.description is not None:
        update_data["description"] = input_data.description
    if input_data.color is not None:
        update_data["color"] = input_data.color
    if input_data.icon is not None:
        update_data["icon"] = input_data.icon
    
    if update_data:
        await db.collections.update_one(
            {"id": collection_id},
            {"$set": update_data}
        )
    
    updated = await db.collections.find_one({"id": collection_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated

@api_router.delete("/collections/{collection_id}")
async def delete_collection(collection_id: str):
    """Delete a collection."""
    result = await db.collections.delete_one({"id": collection_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    # Remove collection from all movies
    await db.movies.update_many(
        {"collection_ids": collection_id},
        {"$pull": {"collection_ids": collection_id}}
    )
    
    return {"message": "Collection deleted", "id": collection_id}

@api_router.post("/collections/{collection_id}/movies/{movie_id}")
async def add_movie_to_collection(collection_id: str, movie_id: str):
    """Add a movie to a collection."""
    collection = await db.collections.find_one({"id": collection_id}, {"_id": 0})
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    movie = await db.movies.find_one({"id": movie_id}, {"_id": 0})
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    # Add movie to collection's movie_ids
    await db.collections.update_one(
        {"id": collection_id},
        {"$addToSet": {"movie_ids": movie_id}}
    )
    
    # Add collection to movie's collection_ids
    await db.movies.update_one(
        {"id": movie_id},
        {"$addToSet": {"collection_ids": collection_id}}
    )
    
    return {"message": "Movie added to collection", "collection_id": collection_id, "movie_id": movie_id}

@api_router.delete("/collections/{collection_id}/movies/{movie_id}")
async def remove_movie_from_collection(collection_id: str, movie_id: str):
    """Remove a movie from a collection."""
    # Remove movie from collection's movie_ids
    await db.collections.update_one(
        {"id": collection_id},
        {"$pull": {"movie_ids": movie_id}}
    )
    
    # Remove collection from movie's collection_ids
    await db.movies.update_one(
        {"id": movie_id},
        {"$pull": {"collection_ids": collection_id}}
    )
    
    return {"message": "Movie removed from collection", "collection_id": collection_id, "movie_id": movie_id}

@api_router.get("/collections/{collection_id}/movies")
async def get_collection_movies(collection_id: str):
    """Get all movies in a collection."""
    collection = await db.collections.find_one({"id": collection_id}, {"_id": 0})
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    movies = await db.movies.find(
        {"id": {"$in": collection.get("movie_ids", [])}},
        {"_id": 0}
    ).to_list(1000)
    
    for m in movies:
        if isinstance(m.get('created_at'), str):
            m['created_at'] = datetime.fromisoformat(m['created_at'])
        m.setdefault('is_favorite', False)
        m.setdefault('is_watchlist', False)
        m.setdefault('watched', False)
        m.setdefault('collection_ids', [])
    
    return movies

# Helper function to scan directory for video files
def scan_directory_for_videos(dir_path: str, recursive: bool = True) -> List[dict]:
    """
    Scan a directory for video files.
    Supports local paths, network shares (\\server\share or //server/share), 
    and mounted network drives.
    """
    video_files = []
    
    try:
        # Handle different path formats
        # Windows UNC: \\server\share or //server/share
        # Linux/Mac mounted: /mnt/network/share
        # Local: C:\Movies or /home/user/movies
        
        if dir_path.startswith('//'):
            # Convert forward slashes to backslashes for Windows UNC
            dir_path = dir_path.replace('/', '\\')
        
        path = Path(dir_path)
        
        if not path.exists():
            logging.warning(f"Directory does not exist or is not accessible: {dir_path}")
            return []
        
        if not path.is_dir():
            logging.warning(f"Path is not a directory: {dir_path}")
            return []
        
        # Scan for video files
        if recursive:
            # Use rglob for recursive scanning
            for file_path in path.rglob('*'):
                if file_path.is_file() and file_path.suffix.lower() in VIDEO_EXTENSIONS:
                    video_files.append({
                        "file_path": str(file_path),
                        "file_name": file_path.name,
                        "size": file_path.stat().st_size if file_path.exists() else 0
                    })
        else:
            # Use glob for non-recursive scanning
            for file_path in path.glob('*'):
                if file_path.is_file() and file_path.suffix.lower() in VIDEO_EXTENSIONS:
                    video_files.append({
                        "file_path": str(file_path),
                        "file_name": file_path.name,
                        "size": file_path.stat().st_size if file_path.exists() else 0
                    })
    
    except PermissionError as e:
        logging.error(f"Permission denied accessing directory {dir_path}: {e}")
    except OSError as e:
        logging.error(f"OS error scanning directory {dir_path}: {e}")
    except Exception as e:
        logging.error(f"Error scanning directory {dir_path}: {e}")
    
    return video_files

# Scan endpoints
@api_router.post("/scan", response_model=ScanResult)
async def scan_directories(recursive: bool = True):
    """
    Scan all directories for movie files.
    Supports local paths, network shares (UNC paths like \\\\server\\share), 
    and mounted network drives.
    """
    directories = await db.directories.find({}, {"_id": 0}).to_list(100)
    
    total_files = 0
    new_movies = 0
    
    for directory in directories:
        dir_path = directory["path"]
        directory_id = directory["id"]
        
        # Scan directory for video files
        video_files = scan_directory_for_videos(dir_path, recursive)
        total_files += len(video_files)
        
        # Add new movies to database
        for video in video_files:
            # Check if movie already exists
            existing = await db.movies.find_one({"file_path": video["file_path"]}, {"_id": 0})
            if existing:
                continue
            
            # Extract title and year from filename
            title, year = clean_movie_name(video["file_name"])
            
            movie = Movie(
                file_path=video["file_path"],
                file_name=video["file_name"],
                directory_id=directory_id,
                title=title,
                year=year
            )
            
            doc = movie.model_dump()
            doc['created_at'] = doc['created_at'].isoformat()
            
            await db.movies.insert_one(doc)
            new_movies += 1
        
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

@api_router.post("/directories/{directory_id}/scan")
async def scan_single_directory(directory_id: str, recursive: bool = True):
    """
    Scan a single directory for movie files.
    Supports network shares and local paths.
    """
    directory = await db.directories.find_one({"id": directory_id}, {"_id": 0})
    if not directory:
        raise HTTPException(status_code=404, detail="Directory not found")
    
    dir_path = directory["path"]
    
    # Scan directory for video files
    video_files = scan_directory_for_videos(dir_path, recursive)
    new_movies = 0
    
    # Add new movies to database
    for video in video_files:
        # Check if movie already exists
        existing = await db.movies.find_one({"file_path": video["file_path"]}, {"_id": 0})
        if existing:
            continue
        
        # Extract title and year from filename
        title, year = clean_movie_name(video["file_name"])
        
        movie = Movie(
            file_path=video["file_path"],
            file_name=video["file_name"],
            directory_id=directory_id,
            title=title,
            year=year
        )
        
        doc = movie.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        
        await db.movies.insert_one(doc)
        new_movies += 1
    
    # Update last_scanned
    await db.directories.update_one(
        {"id": directory_id},
        {"$set": {"last_scanned": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {
        "directory_id": directory_id,
        "total_files": len(video_files),
        "new_movies": new_movies,
        "path": dir_path
    }

@api_router.post("/directories/validate")
async def validate_directory(path: str):
    """
    Validate if a directory path exists and is accessible.
    Supports local paths and network shares.
    """
    try:
        # Handle different path formats
        test_path = path
        if test_path.startswith('//'):
            test_path = test_path.replace('/', '\\')
        
        p = Path(test_path)
        
        if not p.exists():
            return {
                "valid": False,
                "accessible": False,
                "is_network": path.startswith('\\\\') or path.startswith('//'),
                "error": "Path does not exist or is not accessible"
            }
        
        if not p.is_dir():
            return {
                "valid": False,
                "accessible": False,
                "is_network": path.startswith('\\\\') or path.startswith('//'),
                "error": "Path is not a directory"
            }
        
        # Try to list contents to verify access
        try:
            list(p.iterdir())
            accessible = True
        except PermissionError:
            accessible = False
        
        # Check if it's a network path
        is_network = (
            path.startswith('\\\\') or 
            path.startswith('//') or
            path.startswith('/mnt/') or
            path.startswith('/media/') or
            (len(path) > 2 and path[1] == ':' and path[0].upper() not in 'CDEFGH')
        )
        
        return {
            "valid": True,
            "accessible": accessible,
            "is_network": is_network,
            "path": str(p),
            "error": None if accessible else "Permission denied"
        }
        
    except Exception as e:
        return {
            "valid": False,
            "accessible": False,
            "is_network": path.startswith('\\\\') or path.startswith('//'),
            "error": str(e)
        }

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
    collection_id: Optional[str] = None,
    has_metadata: Optional[bool] = None,
    is_favorite: Optional[bool] = None,
    is_watchlist: Optional[bool] = None,
    watched: Optional[bool] = None,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = "desc"
):
    """Get all movies with optional filters and sorting.
    
    sort_by: title, year, rating, created_at
    sort_order: asc, desc
    """
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
    
    if is_favorite is not None:
        query["is_favorite"] = is_favorite
    
    if is_watchlist is not None:
        query["is_watchlist"] = is_watchlist
    
    if watched is not None:
        query["watched"] = watched
    
    # Build sort criteria
    sort_direction = -1 if sort_order == "desc" else 1
    sort_criteria = []
    
    if sort_by == "title":
        sort_criteria = [("title", sort_direction)]
    elif sort_by == "year":
        sort_criteria = [("year", sort_direction)]
    elif sort_by == "rating":
        sort_criteria = [("rating", sort_direction)]
    elif sort_by == "created_at":
        sort_criteria = [("created_at", sort_direction)]
    else:
        # Default sort by created_at desc (newest first)
        sort_criteria = [("created_at", -1)]
    
    cursor = db.movies.find(query, {"_id": 0})
    if sort_criteria:
        cursor = cursor.sort(sort_criteria)
    
    movies = await cursor.to_list(1000)
    
    for m in movies:
        if isinstance(m.get('created_at'), str):
            m['created_at'] = datetime.fromisoformat(m['created_at'])
        # Ensure new fields have default values for existing documents
        m.setdefault('is_favorite', False)
        m.setdefault('is_watchlist', False)
        m.setdefault('watched', False)
    
    return movies

@api_router.get("/movies/{movie_id}", response_model=Movie)
async def get_movie(movie_id: str):
    """Get a single movie by ID."""
    movie = await db.movies.find_one({"id": movie_id}, {"_id": 0})
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    if isinstance(movie.get('created_at'), str):
        movie['created_at'] = datetime.fromisoformat(movie['created_at'])
    
    # Ensure new fields have default values
    movie.setdefault('is_favorite', False)
    movie.setdefault('is_watchlist', False)
    movie.setdefault('watched', False)
    
    return movie

@api_router.post("/movies/{movie_id}/favorite")
async def toggle_favorite(movie_id: str):
    """Toggle favorite status for a movie."""
    movie = await db.movies.find_one({"id": movie_id}, {"_id": 0})
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    new_status = not movie.get('is_favorite', False)
    await db.movies.update_one(
        {"id": movie_id},
        {"$set": {"is_favorite": new_status}}
    )
    
    return {"id": movie_id, "is_favorite": new_status}

@api_router.post("/movies/{movie_id}/watchlist")
async def toggle_watchlist(movie_id: str):
    """Toggle watchlist status for a movie."""
    movie = await db.movies.find_one({"id": movie_id}, {"_id": 0})
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    new_status = not movie.get('is_watchlist', False)
    await db.movies.update_one(
        {"id": movie_id},
        {"$set": {"is_watchlist": new_status}}
    )
    
    return {"id": movie_id, "is_watchlist": new_status}

@api_router.post("/movies/{movie_id}/watched")
async def toggle_watched(movie_id: str):
    """Toggle watched status for a movie."""
    movie = await db.movies.find_one({"id": movie_id}, {"_id": 0})
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    new_status = not movie.get('watched', False)
    await db.movies.update_one(
        {"id": movie_id},
        {"$set": {"watched": new_status}}
    )
    
    return {"id": movie_id, "watched": new_status}

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
        # Download and cache poster locally
        poster_local_url = None
        backdrop_local_url = None
        tmdb_poster_path = details.get("poster_path")
        tmdb_backdrop_path = details.get("backdrop_path")
        
        if tmdb_poster_path:
            cached_poster = await download_and_cache_poster(tmdb_poster_path, "w500")
            if cached_poster:
                # Store as API URL for serving
                poster_filename = get_poster_filename(tmdb_poster_path)
                poster_local_url = f"/api/posters/w500/{poster_filename}"
        
        if tmdb_backdrop_path:
            cached_backdrop = await download_and_cache_backdrop(tmdb_backdrop_path, "w1280")
            if cached_backdrop:
                backdrop_filename = get_poster_filename(tmdb_backdrop_path)
                backdrop_local_url = f"/api/posters/backdrops/w1280/{backdrop_filename}"
        
        update_data = {
            "tmdb_id": details["id"],
            "title": details.get("title", movie.get("title")),
            "overview": details.get("overview"),
            "poster_path": poster_local_url or get_poster_url(tmdb_poster_path),
            "backdrop_path": backdrop_local_url or get_backdrop_url(tmdb_backdrop_path),
            "tmdb_poster_path": tmdb_poster_path,  # Store original TMDB path for reference
            "tmdb_backdrop_path": tmdb_backdrop_path,
            "rating": details.get("vote_average"),
            "runtime": details.get("runtime"),
            "release_date": details.get("release_date"),
            "genres": [g["name"] for g in details.get("genres", [])],
            "metadata_fetched": True,
            "poster_cached": bool(poster_local_url)
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
    
    # Download and cache poster locally
    poster_local_url = None
    backdrop_local_url = None
    tmdb_poster_path = details.get("poster_path")
    tmdb_backdrop_path = details.get("backdrop_path")
    
    if tmdb_poster_path:
        cached_poster = await download_and_cache_poster(tmdb_poster_path, "w500")
        if cached_poster:
            poster_filename = get_poster_filename(tmdb_poster_path)
            poster_local_url = f"/api/posters/w500/{poster_filename}"
    
    if tmdb_backdrop_path:
        cached_backdrop = await download_and_cache_backdrop(tmdb_backdrop_path, "w1280")
        if cached_backdrop:
            backdrop_filename = get_poster_filename(tmdb_backdrop_path)
            backdrop_local_url = f"/api/posters/backdrops/w1280/{backdrop_filename}"
    
    update_data = {
        "tmdb_id": details["id"],
        "title": details.get("title", movie.get("title")),
        "overview": details.get("overview"),
        "poster_path": poster_local_url or get_poster_url(tmdb_poster_path),
        "backdrop_path": backdrop_local_url or get_backdrop_url(tmdb_backdrop_path),
        "tmdb_poster_path": tmdb_poster_path,
        "tmdb_backdrop_path": tmdb_backdrop_path,
        "rating": details.get("vote_average"),
        "runtime": details.get("runtime"),
        "release_date": details.get("release_date"),
        "genres": [g["name"] for g in details.get("genres", [])],
        "metadata_fetched": True,
        "poster_cached": bool(poster_local_url)
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
    favorites_count = await db.movies.count_documents({"is_favorite": True})
    watchlist_count = await db.movies.count_documents({"is_watchlist": True})
    watched_count = await db.movies.count_documents({"watched": True})
    
    return {
        "total_movies": total_movies,
        "with_metadata": with_metadata,
        "without_metadata": total_movies - with_metadata,
        "total_directories": total_directories,
        "favorites": favorites_count,
        "watchlist": watchlist_count,
        "watched": watched_count
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
