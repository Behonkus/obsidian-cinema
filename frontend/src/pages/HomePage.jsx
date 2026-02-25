import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useSearchParams, useNavigate } from "react-router-dom";
import { 
  Search, 
  RefreshCw, 
  Film, 
  FolderOpen,
  SlidersHorizontal,
  Grid3X3,
  LayoutGrid,
  Heart,
  Bookmark,
  Eye,
  ArrowUpDown,
  FolderHeart,
  X,
  ImageIcon,
  FolderSearch
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MovieCard from "@/components/MovieCard";
import MovieDetailModal from "@/components/MovieDetailModal";
import EmptyState from "@/components/EmptyState";
import BulkMetadataFetch from "@/components/BulkMetadataFetch";
import ScanProgressModal from "@/components/ScanProgressModal";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Sort options
const SORT_OPTIONS = [
  { value: "created_at-desc", label: "Recently Added", icon: "↓" },
  { value: "created_at-asc", label: "Oldest Added", icon: "↑" },
  { value: "title-asc", label: "Title A-Z", icon: "↑" },
  { value: "title-desc", label: "Title Z-A", icon: "↓" },
  { value: "year-desc", label: "Year (Newest)", icon: "↓" },
  { value: "year-asc", label: "Year (Oldest)", icon: "↑" },
  { value: "rating-desc", label: "Rating (High)", icon: "↓" },
  { value: "rating-asc", label: "Rating (Low)", icon: "↑" },
];

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const collectionIdFromUrl = searchParams.get("collection");
  
  const [movies, setMovies] = useState([]);
  const [directories, setDirectories] = useState([]);
  const [collections, setCollections] = useState([]);
  const [activeCollection, setActiveCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDirectory, setSelectedDirectory] = useState("all");
  const [metadataFilter, setMetadataFilter] = useState("all");
  const [listFilter, setListFilter] = useState("all");
  const [sortOption, setSortOption] = useState("created_at-desc");
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [isFetchingAll, setIsFetchingAll] = useState(false);
  const [gridSize, setGridSize] = useState("normal");
  const [showBulkFetch, setShowBulkFetch] = useState(false);
  const [showScanProgress, setShowScanProgress] = useState(false);

  useEffect(() => {
    loadData();
  }, [sortOption, collectionIdFromUrl]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Parse sort option
      const [sortBy, sortOrder] = sortOption.split("-");
      
      // Build query params
      const params = { sort_by: sortBy, sort_order: sortOrder };
      if (collectionIdFromUrl) {
        params.collection_id = collectionIdFromUrl;
      }
      
      const [moviesRes, dirsRes, statsRes, collectionsRes] = await Promise.all([
        axios.get(`${API}/movies`, { params }),
        axios.get(`${API}/directories`),
        axios.get(`${API}/stats`),
        axios.get(`${API}/collections`),
      ]);
      setMovies(moviesRes.data);
      setDirectories(dirsRes.data);
      setStats(statsRes.data);
      setCollections(collectionsRes.data);
      
      // Set active collection if filtering by one
      if (collectionIdFromUrl) {
        const collection = collectionsRes.data.find(c => c.id === collectionIdFromUrl);
        setActiveCollection(collection || null);
      } else {
        setActiveCollection(null);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
      toast.error("Failed to load library");
    } finally {
      setLoading(false);
    }
  };

  const clearCollectionFilter = () => {
    setSearchParams({});
    setActiveCollection(null);
  };

  const filteredMovies = useMemo(() => {
    return movies.filter((movie) => {
      // Search filter
      const matchesSearch = 
        !searchQuery ||
        (movie.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.file_name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Directory filter
      const matchesDirectory = 
        selectedDirectory === "all" || movie.directory_id === selectedDirectory;
      
      // Metadata filter
      const matchesMetadata = 
        metadataFilter === "all" ||
        (metadataFilter === "with" && movie.metadata_fetched) ||
        (metadataFilter === "without" && !movie.metadata_fetched);
      
      // List filter (favorites, watchlist, watched)
      const matchesList = 
        listFilter === "all" ||
        (listFilter === "favorites" && movie.is_favorite) ||
        (listFilter === "watchlist" && movie.is_watchlist) ||
        (listFilter === "watched" && movie.watched) ||
        (listFilter === "unwatched" && !movie.watched);
      
      return matchesSearch && matchesDirectory && matchesMetadata && matchesList;
    });
  }, [movies, searchQuery, selectedDirectory, metadataFilter, listFilter]);

  const handleMovieClick = (movie) => {
    setSelectedMovie(movie);
    setIsModalOpen(true);
  };

  const handleMovieUpdate = (updatedMovie) => {
    setMovies((prev) =>
      prev.map((m) => (m.id === updatedMovie.id ? updatedMovie : m))
    );
    if (selectedMovie && selectedMovie.id === updatedMovie.id) {
      setSelectedMovie(updatedMovie);
    }
    // Reload stats
    axios.get(`${API}/stats`).then(res => setStats(res.data)).catch(() => {});
  };

  const handleFetchAllMetadata = async () => {
    setIsFetchingAll(true);
    try {
      const response = await axios.post(`${API}/movies/fetch-all-metadata`);
      toast.success(`Updated ${response.data.updated} of ${response.data.total} movies`);
      loadData();
    } catch (err) {
      if (err.response?.status === 400) {
        toast.error("TMDB API key not configured");
      } else {
        toast.error("Failed to fetch metadata");
      }
    } finally {
      setIsFetchingAll(false);
    }
  };

  const gridClasses = {
    compact: "grid-cols-3 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 gap-3",
    normal: "grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4",
    large: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 lg:p-10" data-testid="home-page">
      {/* Hero glow effect */}
      <div className="hero-glow-bg" />
      
      {/* Collection filter banner */}
      {activeCollection && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-lg border flex items-center justify-between"
          style={{ 
            backgroundColor: `${activeCollection.color}15`,
            borderColor: `${activeCollection.color}30`
          }}
        >
          <div className="flex items-center gap-3">
            <FolderHeart className="w-5 h-5" style={{ color: activeCollection.color }} />
            <div>
              <p className="font-medium" style={{ color: activeCollection.color }}>
                Viewing Collection: {activeCollection.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {filteredMovies.length} movies in this collection
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCollectionFilter}
            className="rounded-full"
          >
            <X className="w-4 h-4 mr-1" />
            Clear Filter
          </Button>
        </motion.div>
      )}
      
      {/* Header */}
      <div className="relative z-10 mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-bold font-[Outfit] tracking-tight text-foreground">
              {activeCollection ? activeCollection.name : "Your Library"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {activeCollection 
                ? `${filteredMovies.length} movies in collection`
                : `${stats?.total_movies || 0} movies • ${stats?.with_metadata || 0} with metadata`
              }
            </p>
          </div>
          
          {/* Quick stats */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="px-3 py-1.5">
              <Film className="w-4 h-4 mr-1.5" />
              {stats?.total_movies || 0}
            </Badge>
            <Badge 
              variant="secondary" 
              className={`px-3 py-1.5 cursor-pointer transition-colors ${listFilter === 'favorites' ? 'bg-red-500/20 text-red-400' : ''}`}
              onClick={() => setListFilter(listFilter === 'favorites' ? 'all' : 'favorites')}
              data-testid="favorites-badge"
            >
              <Heart className={`w-4 h-4 mr-1.5 ${stats?.favorites > 0 ? 'fill-current' : ''}`} />
              {stats?.favorites || 0}
            </Badge>
            <Badge 
              variant="secondary" 
              className={`px-3 py-1.5 cursor-pointer transition-colors ${listFilter === 'watchlist' ? 'bg-blue-500/20 text-blue-400' : ''}`}
              onClick={() => setListFilter(listFilter === 'watchlist' ? 'all' : 'watchlist')}
              data-testid="watchlist-badge"
            >
              <Bookmark className={`w-4 h-4 mr-1.5 ${stats?.watchlist > 0 ? 'fill-current' : ''}`} />
              {stats?.watchlist || 0}
            </Badge>
            <Badge 
              variant="secondary" 
              className={`px-3 py-1.5 cursor-pointer transition-colors ${listFilter === 'watched' ? 'bg-green-500/20 text-green-400' : ''}`}
              onClick={() => setListFilter(listFilter === 'watched' ? 'all' : 'watched')}
              data-testid="watched-badge"
            >
              <Eye className="w-4 h-4 mr-1.5" />
              {stats?.watched || 0}
            </Badge>
            {stats?.without_metadata > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkFetch(true)}
                className="rounded-full"
                data-testid="fetch-all-metadata-btn"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Fetch Posters ({stats.without_metadata})
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowScanProgress(true)}
              className="rounded-full"
              data-testid="scan-btn"
            >
              <FolderSearch className="w-4 h-4 mr-2" />
              Scan
            </Button>
          </div>
        </motion.div>
        
        {/* Tabs for quick filtering */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mt-6"
        >
          <Tabs value={listFilter} onValueChange={setListFilter} className="w-full">
            <TabsList className="bg-secondary/50">
              <TabsTrigger value="all" data-testid="tab-all">All Movies</TabsTrigger>
              <TabsTrigger value="favorites" data-testid="tab-favorites">
                <Heart className="w-4 h-4 mr-1.5" />
                Favorites
              </TabsTrigger>
              <TabsTrigger value="watchlist" data-testid="tab-watchlist">
                <Bookmark className="w-4 h-4 mr-1.5" />
                Watchlist
              </TabsTrigger>
              <TabsTrigger value="watched" data-testid="tab-watched">
                <Eye className="w-4 h-4 mr-1.5" />
                Watched
              </TabsTrigger>
              <TabsTrigger value="unwatched" data-testid="tab-unwatched">
                Unwatched
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>
        
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col md:flex-row gap-3 mt-4"
        >
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary/50 border-border"
              data-testid="search-input"
            />
          </div>
          
          {/* Sort dropdown */}
          <Select value={sortOption} onValueChange={setSortOption}>
            <SelectTrigger className="w-44 bg-secondary/50" data-testid="sort-filter">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{option.icon}</span>
                    {option.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Directory filter */}
          <Select value={selectedDirectory} onValueChange={setSelectedDirectory}>
            <SelectTrigger className="w-48 bg-secondary/50" data-testid="directory-filter">
              <FolderOpen className="w-4 h-4 mr-2" />
              <SelectValue placeholder="All Directories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Directories</SelectItem>
              {directories.map((dir) => (
                <SelectItem key={dir.id} value={dir.id}>
                  {dir.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Metadata filter */}
          <Select value={metadataFilter} onValueChange={setMetadataFilter}>
            <SelectTrigger className="w-44 bg-secondary/50" data-testid="metadata-filter">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              <SelectValue placeholder="All Movies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Movies</SelectItem>
              <SelectItem value="with">With Metadata</SelectItem>
              <SelectItem value="without">Without Metadata</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Grid size toggle */}
          <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
            <Button
              variant={gridSize === "compact" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setGridSize("compact")}
              className="h-8 w-8"
              data-testid="grid-compact-btn"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={gridSize === "normal" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setGridSize("normal")}
              className="h-8 w-8"
              data-testid="grid-normal-btn"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </div>
      
      {/* Content */}
      {directories.length === 0 ? (
        <EmptyState type="no-directories" />
      ) : movies.length === 0 ? (
        <EmptyState type="no-movies" />
      ) : filteredMovies.length === 0 ? (
        <EmptyState type="no-results" />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`grid ${gridClasses[gridSize]}`}
          data-testid="movie-grid"
        >
          {filteredMovies.map((movie, index) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onClick={() => handleMovieClick(movie)}
              onUpdate={handleMovieUpdate}
              index={index}
            />
          ))}
        </motion.div>
      )}
      
      {/* Movie Detail Modal */}
      <MovieDetailModal
        movie={selectedMovie}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={handleMovieUpdate}
      />
    </div>
  );
}
